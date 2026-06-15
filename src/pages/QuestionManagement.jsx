import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const TYPES = ['text', 'textarea', 'email', 'multiple_choice', 'checkbox', 'rating', 'file'];
const TYPE_LABELS = { text: 'Short Text', textarea: 'Long Text', email: 'Email', multiple_choice: 'Single Choice', checkbox: 'Multiple Choice', rating: 'Rating', file: 'File Upload' };
const EMPTY_FORM = { type: 'text', title: '', description: '', required: false, sort_order: 0, options: [], choice_config: { min_selections: 1, max_selections: '', allow_other: false }, file_config: { allowed_types: 'image/jpeg,image/png,application/pdf', max_size_mb: 5, max_files: 1 } };

export default function QuestionManagement() {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { api.surveys.list().then(setSurveys); }, []);

  useEffect(() => {
    if (!selectedSurvey) { setQuestions([]); return; }
    setLoading(true);
    api.questions.list(selectedSurvey).then(q => { setQuestions(q); setLoading(false); });
  }, [selectedSurvey]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditing(null); setError(''); setShowForm(true); };

  const openEdit = (q) => {
    setForm({
      type: q.type, title: q.title, description: q.description || '',
      required: q.required === '1', sort_order: q.sort_order || 0,
      options: Array.isArray(q.options?.item) ? q.options.item : (q.options?.item ? [q.options.item] : []),
      choice_config: q.choice_config || EMPTY_FORM.choice_config,
      file_config: q.file_config || EMPTY_FORM.file_config,
    });
    setEditing(q.id); setError(''); setShowForm(true);
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!selectedSurvey) { setError('Select a survey first'); return; }
    setSaving(true);
    try {
      const payload = {
        type: form.type, title: form.title, description: form.description,
        required: form.required ? 1 : 0, sort_order: form.sort_order,
        options: JSON.stringify(form.options),
      };
      if (['multiple_choice', 'checkbox'].includes(form.type)) payload.choice_config = JSON.stringify(form.choice_config);
      if (form.type === 'file') payload.file_config = JSON.stringify(form.file_config);

      if (editing) await api.questions.update(editing, payload);
      else await api.questions.create(selectedSurvey, payload);

      setQuestions(await api.questions.list(selectedSurvey));
      setShowForm(false);
    } catch { setError('Failed to save.'); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm('Delete this question?')) return;
    await api.questions.delete(id);
    setQuestions(await api.questions.list(selectedSurvey));
  };

  const addOption = () => setForm(f => ({ ...f, options: [...f.options, { label: '', value: '' }] }));
  const updateOption = (i, field, val) => setForm(f => { const opts = [...f.options]; opts[i] = { ...opts[i], [field]: val }; return { ...f, options: opts }; });
  const removeOption = (i) => setForm(f => ({ ...f, options: f.options.filter((_, idx) => idx !== i) }));

  const needsOptions = ['multiple_choice', 'checkbox'].includes(form.type);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Question Management</h1>
        {selectedSurvey && <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">+ Add Question</button>}
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Survey</label>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-sm" value={selectedSurvey} onChange={e => setSelectedSurvey(e.target.value)}>
          <option value="">-- Choose a survey --</option>
          {surveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>

      {loading ? <p className="text-gray-500">Loading...</p>
        : !selectedSurvey ? <div className="text-center py-16 text-gray-400">Select a survey to manage its questions.</div>
        : questions.length === 0 ? <div className="text-center py-16 text-gray-400">No questions yet. Add one above.</div>
        : (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-mono">{TYPE_LABELS[q.type] || q.type}</span>
                      <span className="text-xs text-gray-400">#{i + 1}</span>
                      {q.required === '1' && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded">Required</span>}
                    </div>
                    <p className="font-medium text-gray-800">{q.title}</p>
                    {q.description && <p className="text-sm text-gray-500 mt-0.5">{q.description}</p>}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button onClick={() => openEdit(q)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>
                    <button onClick={() => remove(q.id)} className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-lg sm:mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{editing ? 'Edit Question' : 'New Question'}</h2>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Question text" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional helper text" />
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form.required} onChange={e => setForm(f => ({ ...f, required: e.target.checked }))} />
                Required
              </label>

              {needsOptions && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Options</label>
                    <button type="button" onClick={addOption} className="text-xs text-indigo-600 hover:underline">+ Add option</button>
                  </div>
                  <div className="space-y-2">
                    {form.options.map((opt, i) => (
                      <div key={i} className="flex gap-2">
                        <input className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Label" value={opt.label} onChange={e => updateOption(i, 'label', e.target.value)} />
                        <input className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm" placeholder="Value" value={opt.value} onChange={e => updateOption(i, 'value', e.target.value)} />
                        <button type="button" onClick={() => removeOption(i)} className="text-red-500 text-xs px-2">✕</button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Min selections</label>
                      <input type="number" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" value={form.choice_config.min_selections} onChange={e => setForm(f => ({ ...f, choice_config: { ...f.choice_config, min_selections: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max selections</label>
                      <input type="number" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" value={form.choice_config.max_selections} onChange={e => setForm(f => ({ ...f, choice_config: { ...f.choice_config, max_selections: e.target.value } }))} />
                    </div>
                  </div>
                </div>
              )}

              {form.type === 'file' && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Allowed types (comma-separated MIME)</label>
                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.file_config.allowed_types} onChange={e => setForm(f => ({ ...f, file_config: { ...f.file_config, allowed_types: e.target.value } }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max size (MB)</label>
                      <input type="number" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" value={form.file_config.max_size_mb} onChange={e => setForm(f => ({ ...f, file_config: { ...f.file_config, max_size_mb: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Max files</label>
                      <input type="number" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" value={form.file_config.max_files} onChange={e => setForm(f => ({ ...f, file_config: { ...f.file_config, max_files: e.target.value } }))} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const EMPTY = { title: '', description: '', status: 'draft' };
const statusColor = {
  draft: 'bg-yellow-100 text-yellow-800',
  published: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
};

export default function SurveyManagement() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setSurveys(await api.surveys.list());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(EMPTY); setEditing(null); setError(''); setShowForm(true); };
  const openEdit = (s) => { setForm({ title: s.title, description: s.description || '', status: s.status }); setEditing(s.id); setError(''); setShowForm(true); };
  const close = () => setShowForm(false);

  const save = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true);
    try {
      if (editing) await api.surveys.update(editing, form);
      else await api.surveys.create(form);
      await load();
      close();
    } catch { setError('Failed to save. Please try again.'); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!confirm('Delete this survey and all its data?')) return;
    await api.surveys.delete(id);
    await load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Survey Management</h1>
        <button onClick={openCreate} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">+ New</button>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : surveys.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No surveys yet. Create one to get started.</div>
      ) : (
        <div className="grid gap-4">
          {surveys.map(s => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{s.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor[s.status] || 'bg-gray-100 text-gray-700'}`}>{s.status}</span>
                  </div>
                  {s.description && <p className="text-gray-500 text-sm line-clamp-2">{s.description}</p>}
                  <p className="text-xs text-gray-400 mt-1">ID: {s.id}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <button onClick={() => openEdit(s)} className="text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">Edit</button>
                  <button onClick={() => remove(s.id)} className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">{editing ? 'Edit Survey' : 'New Survey'}</h2>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Survey title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Draft</option>
                  <option value="published">Active</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={close} className="flex-1 sm:flex-none px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 sm:flex-none px-4 py-2.5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

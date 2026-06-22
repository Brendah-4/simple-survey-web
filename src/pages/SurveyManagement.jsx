import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const EMPTY = { title: '', description: '', status: 'draft' };

const statusConfig = {
  draft: { color: '#92400E', bg: '#FEF3C7', border: '#F59E0B', label: 'Draft', icon: '✏️' },
  published: { color: '#065F46', bg: '#D1FAE5', border: '#10B981', label: 'Published', icon: '✅' },
  closed: { color: '#374151', bg: '#F3F4F6', border: '#9CA3AF', label: 'Closed', icon: '🔒' },
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

  const publishedCount = surveys.filter(s => s.status === 'published').length;
  const draftCount = surveys.filter(s => s.status === 'draft').length;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Survey management</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage your surveys</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-sm"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
          <span className="text-base">＋</span> New survey
        </button>
      </div>

      {/* Stats Row */}
      {surveys.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 text-center" style={{ border: '0.5px solid #E5E7EB' }}>
            <div className="text-2xl font-bold text-gray-800">{surveys.length}</div>
            <div className="text-xs text-gray-400 mt-1">Total</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center" style={{ border: '0.5px solid #E5E7EB' }}>
            <div className="text-2xl font-bold" style={{ color: '#10B981' }}>{publishedCount}</div>
            <div className="text-xs text-gray-400 mt-1">Published</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center" style={{ border: '0.5px solid #E5E7EB' }}>
            <div className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{draftCount}</div>
            <div className="text-xs text-gray-400 mt-1">Drafts</div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading surveys...</p>
        </div>
      ) : surveys.length === 0 ? (
        <div className="text-center py-24">
          <div className="text-5xl mb-4">📋</div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No surveys yet</h2>
          <p className="text-gray-400 text-sm mb-6">Create your first survey to get started.</p>
          <button
            onClick={openCreate}
            className="text-white px-5 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            ＋ Create first survey
          </button>
        </div>
      ) : (
        <div className="grid gap-3">
          {surveys.map(s => {
            const cfg = statusConfig[s.status] || statusConfig.draft;
            return (
              <div
                key={s.id}
                className="bg-white rounded-2xl p-4 sm:p-5 card-hover"
                style={{
                  border: '0.5px solid #E5E7EB',
                  borderLeft: `4px solid ${cfg.border}`,
                }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {/* Status badge */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-2"
                      style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                      <span>{cfg.icon}</span>
                      {cfg.label}
                    </div>
                    {/* Title */}
                    <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                      {s.title}
                    </h2>
                    {/* Description */}
                    {s.description && (
                      <p className="text-gray-500 text-sm mt-1 line-clamp-2">{s.description}</p>
                    )}
                    {/* ID */}
                    <p className="text-xs text-gray-300 mt-2">ID: {s.id}</p>
                  </div>
                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      onClick={() => openEdit(s)}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
                      style={{ border: '0.5px solid #E5E7EB', color: '#4F46E5', backgroundColor: '#EEF2FF' }}>
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => remove(s.id)}
                      className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
                      style={{ border: '0.5px solid #FCA5A5', color: '#DC2626', backgroundColor: '#FFF1F2' }}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md sm:mx-4 p-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-gray-800">
                {editing ? '✏️ Edit survey' : '➕ New survey'}
              </h2>
              <button
                onClick={close}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 text-lg">
                ✕
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-700 text-sm mb-4 p-3 rounded-xl"
                style={{ backgroundColor: '#FFF1F2', border: '0.5px solid #FCA5A5' }}>
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Enter survey title" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Optional description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50"
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">✏️ Draft</option>
                  <option value="published">✅ Active</option>
                  <option value="closed">🔒 Closed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 text-sm text-white rounded-xl font-medium disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                  {saving ? '⏳ Saving...' : '💾 Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

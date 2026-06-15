import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function SurveyResponses() {
  const [surveys, setSurveys] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [responses, setResponses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [emailFilter, setEmailFilter] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { api.surveys.list().then(setSurveys); }, []);

  useEffect(() => {
    if (!selectedSurvey) { setResponses([]); setMeta(null); return; }
    setLoading(true);
    api.responses.list(selectedSurvey, { page, pageSize: 10, email: emailFilter }).then(data => {
      const raw = data?.responses;
      const items = raw?.item ? (Array.isArray(raw.item) ? raw.item : [raw.item]) : [];
      setResponses(items);
      setMeta(data?.meta || null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedSurvey, page, emailFilter]);

  const search = () => { setPage(1); setEmailFilter(emailInput); };
  const clearSearch = () => { setEmailInput(''); setPage(1); setEmailFilter(''); };
  const toggle = (id) => setExpanded(e => e === id ? null : id);

  const getAnswers = (resp) => {
    if (!resp.answers) return [];
    const raw = resp.answers.item || resp.answers;
    return Array.isArray(raw) ? raw : [raw];
  };

  const getFiles = (ans) => {
    if (!ans.files) return [];
    const raw = ans.files.item || ans.files;
    return Array.isArray(raw) ? raw : [raw];
  };

  const lastPage = meta ? parseInt(meta.last_page) : 1;
  const totalCount = meta ? parseInt(meta.total_count) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Survey Responses</h1>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Select Survey</label>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full max-w-sm"
          value={selectedSurvey} onChange={e => { setSelectedSurvey(e.target.value); setPage(1); setEmailFilter(''); setEmailInput(''); }}>
          <option value="">-- Choose a survey --</option>
          {surveys.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
        </select>
      </div>

      {selectedSurvey && (
        <div className="flex flex-col sm:flex-row gap-2 mb-6">
          <input
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-72"
            placeholder="Filter by email address..."
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()}
          />
          <button onClick={search} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">Search</button>
          {emailFilter && <button onClick={clearSearch} className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50">Clear</button>}
        </div>
      )}

      {loading ? <p className="text-gray-500">Loading...</p>
        : !selectedSurvey ? <div className="text-center py-16 text-gray-400">Select a survey to view its responses.</div>
        : responses.length === 0 ? <div className="text-center py-16 text-gray-400">{emailFilter ? `No responses matching "${emailFilter}"` : 'No responses yet.'}</div>
        : (
          <div>
            <p className="text-sm text-gray-500 mb-3">{totalCount} total response{totalCount !== 1 ? 's' : ''}{emailFilter && ` matching "${emailFilter}"`}</p>
            <div className="space-y-3 mb-6">
              {responses.map(resp => (
                <div key={resp.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggle(resp.id)}>
                    <div>
                      <p className="font-medium text-gray-800">Response #{resp.id}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{resp.submitted_at}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {resp.certificate_path && (
                        <a href={`/api/files/certificate/${resp.id}`} onClick={e => e.stopPropagation()}
                          className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-100">
                          Certificate
                        </a>
                      )}
                      <span className="text-gray-400 text-sm">{expanded === resp.id ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {expanded === resp.id && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
                      {getAnswers(resp).map(ans => (
                        <div key={ans.id} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wide mb-1">{ans.question_title}</p>
                          <p className="text-sm text-gray-800">{ans.answer_text || <span className="text-gray-400 italic">No answer</span>}</p>
                          {getFiles(ans).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {getFiles(ans).map(f => (
                                <a key={f.id} href={`/api/certificates/${f.id}`}
                                  className="text-xs bg-white border border-gray-200 rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50">
                                  📎 {f.original_name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {lastPage > 1 && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40">Previous</button>
                <span className="text-sm text-gray-600">Page {page} of {lastPage}</span>
                <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40">Next</button>
              </div>
            )}
          </div>
        )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const API = 'https://simple-survey-api-production.up.railway.app';

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
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Survey responses</h1>
        <p className="text-gray-500 text-sm mt-1">View and manage submitted responses</p>
      </div>

      <div className="bg-white rounded-2xl p-4 mb-5" style={{ border: '0.5px solid #E5E7EB' }}>
        <label className="block text-sm font-medium text-gray-700 mb-2">Select survey</label>
        <select
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-gray-50 focus:outline-none"
          style={{ color: '#1F2937' }}
          value={selectedSurvey}
          onChange={e => { setSelectedSurvey(e.target.value); setPage(1); setEmailFilter(''); setEmailInput(''); }}>
          <option value="">-- Choose a survey --</option>
          {surveys.map(s => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      {selectedSurvey && totalCount > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div className="bg-white rounded-xl p-4 text-center" style={{ border: '0.5px solid #E5E7EB' }}>
            <div className="text-2xl font-bold text-gray-800">{totalCount}</div>
            <div className="text-xs text-gray-400 mt-1">Total</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center" style={{ border: '0.5px solid #E5E7EB' }}>
            <div className="text-2xl font-bold" style={{ color: '#4F46E5' }}>{lastPage}</div>
            <div className="text-xs text-gray-400 mt-1">Pages</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center" style={{ border: '0.5px solid #E5E7EB' }}>
            <div className="text-2xl font-bold" style={{ color: '#10B981' }}>
              {responses.filter(r => r.certificate_path).length}
            </div>
            <div className="text-xs text-gray-400 mt-1">Certificates</div>
          </div>
        </div>
      )}

      {selectedSurvey && (
        <div className="flex flex-col sm:flex-row gap-2 mb-5">
          <input
            className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none"
            style={{ color: '#1F2937' }}
            placeholder="Filter by email address..."
            value={emailInput}
            onChange={e => setEmailInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && search()} />
          <button onClick={search} className="px-5 py-2.5 text-white text-sm rounded-xl font-medium" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
            Search
          </button>
          {emailFilter && (
            <button onClick={clearSearch} className="px-4 py-2.5 border border-gray-200 text-sm rounded-xl text-gray-600 hover:bg-gray-50">
              Clear
            </button>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Loading responses...</p>
        </div>
      ) : !selectedSurvey ? (
        <div className="text-center py-24">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No survey selected</h2>
          <p className="text-gray-400 text-sm">Select a survey above to view its responses.</p>
        </div>
      ) : responses.length === 0 ? (
        <div className="text-center py-24">
          <h2 className="text-lg font-semibold text-gray-700 mb-2">No responses found</h2>
          <p className="text-gray-400 text-sm">
            {emailFilter ? ('No responses matching ' + emailFilter) : 'No responses submitted yet.'}
          </p>
          {emailFilter && (
            <button onClick={clearSearch} className="mt-4 text-sm text-indigo-600 hover:underline">Clear filter</button>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-500 mb-3">
            Showing {responses.length} of {totalCount} response{totalCount !== 1 ? 's' : ''}
          </p>
          <div className="space-y-3 mb-6">
            {responses.map((resp, index) => {
              const cUrl = API + '/api/files/certificate/' + String(resp.id);
              const rNum = String((page - 1) * 10 + index + 1);
              const rId = String(resp.id);
              const hasCert = resp.certificate_path ? true : false;
              const isExpanded = expanded === resp.id;
              return (
                <div key={resp.id} className="bg-white rounded-2xl overflow-hidden" style={{ border: '0.5px solid #E5E7EB' }}>
                  <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggle(resp.id)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                        {'#' + rNum}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{'Response #' + rId}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(resp.submitted_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CertLink show={hasCert} url={cUrl} />
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>v</div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: '0.5px solid #F3F4F6' }}>
                      {getAnswers(resp).map(ans => (
                        <AnswerCard key={ans.id} ans={ans} files={getFiles(ans)} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {lastPage > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">Previous</button>
              <div className="flex items-center gap-1">
                {Array.from({ length: lastPage }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} className="w-8 h-8 rounded-lg text-sm font-medium" style={{ backgroundColor: page === p ? '#4F46E5' : 'transparent', color: page === p ? 'white' : '#6B7280', border: page === p ? 'none' : '0.5px solid #E5E7EB' }}>{p}</button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={page === lastPage} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CertLink({ show, url }) {
  if (!show) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
      Certificate
    </a>
  );
}

function AnswerCard({ ans, files }) {
  return (
    <div className="rounded-xl p-3" style={{ backgroundColor: '#F9FAFB', border: '0.5px solid #F3F4F6' }}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#4F46E5' }}>{ans.question_title}</p>
      <p className="text-sm text-gray-800">{ans.answer_text || <span className="text-gray-400 italic">No answer provided</span>}</p>
      {files.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {files.map(f => (
            <FileLink key={f.id} fileId={f.id} fileName={f.original_name} />
          ))}
        </div>
      )}
    </div>
  );
}

function FileLink({ fileId, fileName }) {
  const url = API + '/api/certificates/' + String(fileId);
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: 'white', border: '0.5px solid #E5E7EB', color: '#4F46E5' }}>
      {fileName}
    </a>
  );
}
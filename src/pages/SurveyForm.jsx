import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function SurveyForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [survey, setSurvey] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [responseId, setResponseId] = useState(null);
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    Promise.all([api.surveys.get(id), api.questions.list(id)]).then(([s, q]) => {
      setSurvey(s); setQuestions(q); setLoading(false);
    });
  }, [id]);

  if (loading) return <p className="text-gray-500">Loading survey...</p>;
  if (!survey) return <p className="text-red-500">Survey not found.</p>;
  if (questions.length === 0) return <div className="text-center py-20 text-gray-400">This survey has no questions yet.</div>;

  const total = questions.length;
  const q = questions[current];
  const progress = reviewing ? 100 : ((current) / total) * 100;

  const setAnswer = (val) => setAnswers(a => ({ ...a, [q.id]: val }));
  const setFile = (fileList) => setFiles(f => ({ ...f, [q.id]: fileList }));

  const validate = (question = q) => {
    if (question.required === '1') {
      const ans = answers[question.id];
      if (question.type === 'file') {
        if (!files[question.id] || files[question.id].length === 0) {
          setError('Please upload a file.'); return false;
        }
      } else if (!ans || (Array.isArray(ans) && ans.length === 0) || String(ans).trim() === '') {
        setError('This question is required.'); return false;
      }
    }
    setError(''); return true;
  };

  const next = () => {
    if (!validate()) return;
    if (current < total - 1) setCurrent(c => c + 1);
    else setReviewing(true);
  };

  const back = () => {
    setError('');
    if (reviewing) setReviewing(false);
    else if (current > 0) setCurrent(c => c - 1);
  };

  const submit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      const answerList = questions.map(q => ({
        question_id: q.id,
        answer_text: Array.isArray(answers[q.id]) ? answers[q.id].join(',') : (answers[q.id] || ''),
      }));
      formData.append('answers', JSON.stringify(answerList));
      questions.forEach(q => {
        if (files[q.id]) Array.from(files[q.id]).forEach(f => formData.append(`file_${q.id}`, f));
      });

      const result = await api.responses.submit(id, formData);
      setResponseId(result?.response_id || null);
      setDone(true);
    } catch { setError('Failed to submit. Please try again.'); }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank you!</h2>
        <p className="text-gray-500 mb-6">Your response has been submitted successfully.</p>
        {responseId && (
          <a href={`/api/files/certificate/${responseId}`}
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium mb-4">
            Download Certificate
          </a>
        )}
        <br />
        <button onClick={() => navigate('/surveys')} className="text-sm text-indigo-600 hover:underline mt-2">Back to surveys</button>
      </div>
    );
  }

  if (reviewing) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{survey.title}</h1>
          <p className="text-gray-500 text-sm">Review your answers before submitting.</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
          <div className="bg-indigo-600 h-1.5 rounded-full w-full" />
        </div>

        <div className="space-y-4 mb-6">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wide mb-1">Question {i + 1}</p>
              <p className="font-medium text-gray-800 mb-2">{q.title}</p>
              <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                {q.type === 'file'
                  ? (files[q.id] ? `${files[q.id].length} file(s) selected` : <span className="text-gray-400 italic">No file</span>)
                  : (answers[q.id]
                    ? (Array.isArray(answers[q.id]) ? answers[q.id].join(', ') : answers[q.id])
                    : <span className="text-gray-400 italic">No answer</span>)
                }
              </div>
              <button onClick={() => { setReviewing(false); setCurrent(i); }}
                className="text-xs text-indigo-600 hover:underline mt-2">Edit</button>
            </div>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex justify-between">
          <button onClick={back} className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Back</button>
          <button onClick={submit} disabled={submitting}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-1">{survey.title}</h1>
        {survey.description && <p className="text-gray-500 text-sm">{survey.description}</p>}
      </div>

      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-6">
        <div className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-gray-400 mb-6">Question {current + 1} of {total}</p>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm min-h-56">
        <p className="text-lg font-semibold text-gray-800 mb-1">
          {q.title}{q.required === '1' && <span className="text-red-500 ml-1">*</span>}
        </p>
        {q.description && <p className="text-sm text-gray-500 mb-4">{q.description}</p>}
        <div className="mt-4">
          <QuestionInput q={q} value={answers[q.id]} onChange={setAnswer} onFile={setFile} />
        </div>
        {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
      </div>

      <div className="flex justify-between mt-6">
        {current > 0
          ? <button onClick={back} className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Back</button>
          : <div />}
        <button onClick={next} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">
          {current < total - 1 ? 'Next' : 'Review'}
        </button>
      </div>
    </div>
  );
}

function QuestionInput({ q, value, onChange, onFile }) {
  const options = q.options?.item
    ? (Array.isArray(q.options.item) ? q.options.item : [q.options.item])
    : (Array.isArray(q.options) ? q.options : []);

  switch (q.type) {
    case 'text':
      return <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Your answer" />;

    case 'textarea':
      return <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" rows={4} value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Your answer" />;

    case 'email':
      return <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="your@email.com" />;

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {options.map(opt => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input type="radio" name={`q_${q.id}`} value={opt.value} checked={value === opt.value} onChange={() => onChange(opt.value)} className="accent-indigo-600" />
              <span className="text-sm text-gray-700">{opt.label}</span>
            </label>
          ))}
        </div>
      );

    case 'checkbox':
      return (
        <div className="space-y-2">
          {options.map(opt => {
            const selected = Array.isArray(value) ? value : [];
            const checked = selected.includes(opt.value);
            return (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={checked} onChange={() => {
                  onChange(checked ? selected.filter(v => v !== opt.value) : [...selected, opt.value]);
                }} className="accent-indigo-600" />
                <span className="text-sm text-gray-700">{opt.label}</span>
              </label>
            );
          })}
        </div>
      );

    case 'rating':
      return (
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} type="button" onClick={() => onChange(String(n))}
              className={`w-10 h-10 rounded-full border-2 text-sm font-semibold transition-colors ${value === String(n) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 text-gray-600 hover:border-indigo-400'}`}>
              {n}
            </button>
          ))}
        </div>
      );

    case 'file':
      return (
        <div>
          <input type="file" multiple onChange={e => { onFile(e.target.files); onChange('uploaded'); }}
            className="text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 file:text-sm hover:file:bg-indigo-100" />
          {q.file_config && (
            <p className="text-xs text-gray-400 mt-1">Max {q.file_config.max_size_mb}MB · Up to {q.file_config.max_files} file(s)</p>
          )}
        </div>
      );

    default:
      return <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={value || ''} onChange={e => onChange(e.target.value)} />;
  }
}

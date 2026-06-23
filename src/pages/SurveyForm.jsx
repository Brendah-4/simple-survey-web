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
  const [error, setError] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    Promise.all([api.surveys.get(id), api.questions.list(id)]).then(([s, q]) => {
      setSurvey(s); setQuestions(q); setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">Loading survey...</p>
    </div>
  );

  if (!survey) return (
    <div className="text-center py-24">
      <p className="text-red-500 font-medium">Survey not found.</p>
    </div>
  );

  if (questions.length === 0) return (
    <div className="text-center py-24">
      <p className="text-gray-400">This survey has no questions yet.</p>
    </div>
  );

  const total = questions.length;
  const q = questions[current];

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
        if (files[q.id]) Array.from(files[q.id]).forEach(f => formData.append('file_' + q.id, f));
      });
      await api.responses.submit(id, formData);
      setDone(true);
    } catch (e) {
      setError('Failed to submit. Please try again.');
    }
    setSubmitting(false);
  };

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank you!</h2>
        <p className="text-gray-500 mb-8">Your response has been submitted successfully.</p>
        <button
          onClick={() => navigate('/surveys')}
          className="text-sm text-indigo-600 hover:underline mt-4">
          Back to surveys
        </button>
      </div>
    );
  }

  if (reviewing) {
    return (
      <div className="max-w-2xl mx-auto px-1">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">{survey.title}</h1>
          <p className="text-gray-500 text-sm">Review your answers before submitting.</p>
        </div>
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>All questions answered</span>
            <span>100%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#E5E7EB' }}>
            <div className="h-2 rounded-full w-full"
              style={{ background: 'linear-gradient(90deg, #4F46E5, #7C3AED)' }} />
          </div>
        </div>
        <div className="space-y-3 mb-6">
          {questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-2xl p-4 shadow-sm"
              style={{ border: '0.5px solid #E5E7EB' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide mb-1"
                    style={{ color: '#4F46E5' }}>
                    Question {i + 1}
                  </p>
                  <p className="font-medium text-gray-800 text-sm mb-2">{q.title}</p>
                  <div className="text-sm text-gray-600 rounded-xl px-3 py-2"
                    style={{ backgroundColor: '#F9FAFB' }}>
                    {q.type === 'file'
                      ? (files[q.id]
                        ? (files[q.id].length + ' file(s) selected')
                        : <span className="text-gray-400 italic">No file</span>)
                      : (answers[q.id]
                        ? (Array.isArray(answers[q.id]) ? answers[q.id].join(', ') : answers[q.id])
                        : <span className="text-gray-400 italic">No answer</span>)
                    }
                  </div>
                </div>
                <button
                  onClick={() => { setReviewing(false); setCurrent(i); }}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium shrink-0"
                  style={{ color: '#4F46E5', backgroundColor: '#EEF2FF' }}>
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
        {error ? (
          <div className="text-red-700 text-sm mb-4 p-3 rounded-xl"
            style={{ backgroundColor: '#FFF1F2', border: '0.5px solid #FCA5A5' }}>
            {error}
          </div>
        ) : null}
        <div className="flex justify-between gap-3">
          <button
            onClick={back}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Back
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #059669, #10B981)' }}>
            {submitting ? 'Submitting...' : 'Submit response'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-1">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{survey.title}</h1>
        {survey.description ? (
          <p className="text-gray-500 text-sm mt-1">{survey.description}</p>
        ) : null}
      </div>
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Question {current + 1} of {total}</span>
          <span>{Math.round(((current + 1) / total) * 100)}% complete</span>
        </div>
        <div className="w-full rounded-full h-2" style={{ backgroundColor: '#E5E7EB' }}>
          <div
            className="h-2 rounded-full transition-all duration-500"
            style={{
              width: (Math.round(((current + 1) / total) * 100)) + '%',
              background: 'linear-gradient(90deg, #4F46E5, #7C3AED)',
            }} />
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-6">
        {questions.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              height: '6px',
              width: i === current ? '20px' : '6px',
              backgroundColor: i <= current ? '#4F46E5' : '#E5E7EB',
            }} />
        ))}
      </div>
      <div className="bg-white rounded-2xl p-6 sm:p-8 mb-5 shadow-sm"
        style={{ border: '0.5px solid #E5E7EB', borderTop: '4px solid #4F46E5' }}>
        <p className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: '#4F46E5' }}>
          Question {current + 1}
        </p>
        <p className="text-lg font-semibold text-gray-800 mb-1">
          {q.title}
          {q.required === '1' ? <span className="text-red-500 ml-1">*</span> : null}
        </p>
        {q.description ? (
          <p className="text-sm text-gray-500 mb-5">{q.description}</p>
        ) : null}
        <div className="mt-5">
          <QuestionInput q={q} value={answers[q.id]} onChange={setAnswer} onFile={setFile} />
        </div>
        {error ? (
          <div className="text-red-700 text-sm mt-4 p-3 rounded-xl"
            style={{ backgroundColor: '#FFF1F2', border: '0.5px solid #FCA5A5' }}>
            {error}
          </div>
        ) : null}
      </div>
      <div className="flex justify-between items-center gap-3">
        {current > 0 ? (
          <button
            onClick={back}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
            Back
          </button>
        ) : <div />}
        <button
          onClick={next}
          className="px-6 py-2.5 text-white rounded-xl text-sm font-medium shadow-sm"
          style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
          {current < total - 1 ? 'Next' : 'Review answers'}
        </button>
      </div>
    </div>
  );
}

function QuestionInput({ q, value, onChange, onFile }) {
  const options = q.options && q.options.item
    ? (Array.isArray(q.options.item) ? q.options.item : [q.options.item])
    : (Array.isArray(q.options) ? q.options : []);

  const inputClass = "w-full rounded-xl px-4 py-3 text-sm focus:outline-none";
  const inputStyle = { border: '0.5px solid #E5E7EB', backgroundColor: '#F9FAFB', color: '#1F2937' };

  if (q.type === 'text') {
    return (
      <input
        className={inputClass}
        style={inputStyle}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Type your answer here..." />
    );
  }

  if (q.type === 'textarea') {
    return (
      <textarea
        className={inputClass}
        style={inputStyle}
        rows={4}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Type your answer here..." />
    );
  }

  if (q.type === 'email') {
    return (
      <input
        type="email"
        className={inputClass}
        style={inputStyle}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="your@email.com" />
    );
  }

  if (q.type === 'multiple_choice') {
    return (
      <div className="space-y-2">
        {options.map(opt => (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
            style={{
              border: '1.5px solid ' + (value === opt.value ? '#4F46E5' : '#E5E7EB'),
              backgroundColor: value === opt.value ? '#EEF2FF' : '#F9FAFB',
            }}>
            <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{ borderColor: value === opt.value ? '#4F46E5' : '#D1D5DB' }}>
              {value === opt.value ? (
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#4F46E5' }} />
              ) : null}
            </div>
            <span className="text-sm font-medium"
              style={{ color: value === opt.value ? '#4F46E5' : '#374151' }}>
              {opt.label}
            </span>
          </div>
        ))}
      </div>
    );
  }

  if (q.type === 'checkbox') {
    return (
      <div className="space-y-2">
        {options.map(opt => {
          const selected = Array.isArray(value) ? value : [];
          const checked = selected.includes(opt.value);
          return (
            <div
              key={opt.value}
              onClick={() => onChange(checked ? selected.filter(v => v !== opt.value) : [...selected, opt.value])}
              className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all"
              style={{
                border: '1.5px solid ' + (checked ? '#4F46E5' : '#E5E7EB'),
                backgroundColor: checked ? '#EEF2FF' : '#F9FAFB',
              }}>
              <div className="w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0"
                style={{
                  borderColor: checked ? '#4F46E5' : '#D1D5DB',
                  backgroundColor: checked ? '#4F46E5' : 'transparent',
                }}>
                {checked ? <span className="text-white text-xs">v</span> : null}
              </div>
              <span className="text-sm font-medium"
                style={{ color: checked ? '#4F46E5' : '#374151' }}>
                {opt.label}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (q.type === 'rating') {
    return (
      <div className="flex gap-3 flex-wrap">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(String(n))}
            className="w-12 h-12 rounded-xl text-sm font-bold transition-all"
            style={{
              border: '2px solid ' + (value === String(n) ? '#4F46E5' : '#E5E7EB'),
              backgroundColor: value === String(n) ? '#4F46E5' : '#F9FAFB',
              color: value === String(n) ? 'white' : '#6B7280',
            }}>
            {n}
          </button>
        ))}
      </div>
    );
  }

  if (q.type === 'file') {
    return (
      <div className="rounded-xl p-5 text-center"
        style={{ border: '2px dashed #C7D2FE', backgroundColor: '#EEF2FF' }}>
        <p className="text-sm font-medium text-indigo-700 mb-1">Click to upload files</p>
        <p className="text-xs text-indigo-400 mb-3">PDF files accepted</p>
        <input
          type="file"
          multiple
          onChange={e => { onFile(e.target.files); onChange('uploaded'); }}
          className="text-sm text-indigo-600" />
      </div>
    );
  }

  return (
    <input
      className={inputClass}
      style={inputStyle}
      value={value || ''}
      onChange={e => onChange(e.target.value)} />
  );
}
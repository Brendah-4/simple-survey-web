import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function AvailableSurveys() {
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.surveys.list().then(all => {
      setSurveys(all.filter(s => s.status === 'published'));
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500">Loading surveys...</p>;

  return (
    <div>
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Available Surveys</h1>
      <p className="text-gray-500 text-sm mb-6">Choose a survey below to get started.</p>

      {surveys.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No active surveys available right now.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map(s => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <h2 className="text-base font-semibold text-gray-800 mb-2">{s.title}</h2>
                {s.description && <p className="text-sm text-gray-500 line-clamp-3">{s.description}</p>}
              </div>
              <button
                onClick={() => navigate(`/surveys/${s.id}/take`)}
                className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Take Survey
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

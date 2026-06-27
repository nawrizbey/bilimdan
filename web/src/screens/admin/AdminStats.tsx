import { useEffect, useState } from 'react';
import { adminFetch } from './adminApi';

interface Stats {
  userCount: number;
  wordCount: number;
  unitCount: number;
}

export function AdminStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminFetch('/stats')
      .then((data) => {
        if (data) setStats(data as Stats);
      })
      .catch(() => setError('Failed to load stats'));
  }, []);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!stats) return <p className="text-slate-500 text-sm">Loading…</p>;

  const cards = [
    { label: 'Users', value: stats.userCount },
    { label: 'Words', value: stats.wordCount },
    { label: 'Units', value: stats.unitCount },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold text-slate-800 mb-4">Stats</h2>
      <div className="grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-lg border border-slate-200 p-6 text-center shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{c.value}</div>
            <div className="text-sm text-slate-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

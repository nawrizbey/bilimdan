import { useState } from 'react';
import { adminFetch } from './adminApi';

interface Props {
  onLogin: () => void;
}

export function AdminLogin({ onLogin }: Props) {
  const [secret, setSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!secret.trim()) {
      setError('Secret required');
      return;
    }
    setLoading(true);
    localStorage.setItem('admin_token', secret.trim());
    try {
      const data = await adminFetch('/stats');
      if (data === null) {
        // adminFetch already removed token and redirected on 401,
        // but let's also handle the case where we stay here
        setError('Invalid secret — access denied');
        setLoading(false);
        return;
      }
      onLogin();
    } catch {
      localStorage.removeItem('admin_token');
      setError('Failed to connect to server');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-slate-800 mb-6">Bilimdon Admin</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Admin Secret</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter ADMIN_SECRET"
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white rounded px-4 py-2 font-medium text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? 'Checking…' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

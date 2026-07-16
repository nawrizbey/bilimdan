import { useEffect, useState } from 'react';
import { adminFetch } from './adminApi';

interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  role: 'student' | 'teacher';
  xp: number;
  streak: number;
  createdAt: string;
  region: string;
  district: string;
  school: string;
}

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    const data = await adminFetch('/users?limit=100');
    if (data) setUsers(data.users);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleRole(user: AdminUser) {
    const nextRole = user.role === 'teacher' ? 'student' : 'teacher';
    setBusyId(user.id);
    try {
      await adminFetch(`/users/${user.id}/role`, { method: 'PATCH', body: JSON.stringify({ role: nextRole }) });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <div className="text-slate-500 text-sm">Loading…</div>;

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Users</h1>
      <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-xs font-semibold text-slate-500 border-b border-slate-200">
              <th className="py-2 px-3">Full name</th>
              <th className="py-2 px-3">Username</th>
              <th className="py-2 px-3">School</th>
              <th className="py-2 px-3">XP</th>
              <th className="py-2 px-3">Role</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-b-0">
                <td className="py-2 px-3 font-medium text-slate-800">{u.fullName}</td>
                <td className="py-2 px-3 text-slate-500">{u.username}</td>
                <td className="py-2 px-3 text-slate-500">{u.school}</td>
                <td className="py-2 px-3 text-slate-500">{u.xp}</td>
                <td className="py-2 px-3">
                  <span
                    className={`px-2 py-[2px] rounded-full text-xs font-semibold ${
                      u.role === 'teacher' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-2 px-3">
                  <button
                    onClick={() => toggleRole(u)}
                    disabled={busyId === u.id}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    {u.role === 'teacher' ? 'Demote to student' : 'Promote to teacher'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

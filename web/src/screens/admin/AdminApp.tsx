import { useState } from 'react';
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { AdminLogin } from './AdminLogin';
import { AdminStats } from './AdminStats';
import { AdminUnits } from './AdminUnits';
import { AdminQuestions } from './AdminQuestions';
import { AdminUsers } from './AdminUsers';

function useIsLoggedIn() {
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem('admin_token'));
  return { loggedIn, setLoggedIn };
}

const NAV = [
  { to: '/admin/stats', label: 'Stats' },
  { to: '/admin/units', label: 'Units & Words' },
  { to: '/admin/questions', label: 'Questions' },
  { to: '/admin/users', label: 'Users' },
];

function AdminLayout({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className="w-52 bg-slate-800 flex-none flex flex-col">
        <div className="px-5 py-5 border-b border-slate-700">
          <span className="text-white font-bold text-base">Bilimdon Admin</span>
        </div>
        <nav className="flex-1 py-4 flex flex-col gap-1 px-2">
          {NAV.map((item) => {
            const active = location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="px-4 py-4 border-t border-slate-700">
          <button
            onClick={onLogout}
            className="text-slate-400 hover:text-white text-xs"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route index element={<Navigate to="stats" replace />} />
          <Route path="stats" element={<AdminStats />} />
          <Route path="units" element={<AdminUnits />} />
          <Route path="questions" element={<AdminQuestions />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="*" element={<Navigate to="stats" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export function AdminApp() {
  const { loggedIn, setLoggedIn } = useIsLoggedIn();

  function handleLogout() {
    localStorage.removeItem('admin_token');
    setLoggedIn(false);
  }

  if (!loggedIn) {
    return <AdminLogin onLogin={() => setLoggedIn(true)} />;
  }

  return <AdminLayout onLogout={handleLogout} />;
}

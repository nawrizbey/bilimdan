import { Suspense, useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ContentLoader } from './ContentLoader';
import { OfflineBanner } from './OfflineBanner';
import { useAppStore } from '../store/useAppStore';
import { maybeNotifyDailyGoal } from '../lib/dailyReminder';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const notifyEnabled = useAppStore((s) => s.settings.notify);
  const goalDone = useAppStore((s) => s.goalDone);
  const goalMin = useAppStore((s) => s.goalMin);

  useEffect(() => {
    if (notifyEnabled) maybeNotifyDailyGoal(goalDone, goalMin);
  }, [notifyEnabled, goalDone, goalMin]);

  return (
    <div className="flex min-h-screen w-full bg-app-bg">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar onMenuClick={() => setSidebarOpen((v) => !v)} />
        <OfflineBanner />
        <main className="flex-1 py-5 px-4 sm:py-[26px] sm:px-[34px] pb-[60px]">
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

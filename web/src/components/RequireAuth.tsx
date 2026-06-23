import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { RouteLoader } from './RouteLoader';

export function RequireAuth({ children }: { children: ReactNode }) {
  const authStatus = useAppStore((s) => s.authStatus);

  if (authStatus === 'idle' || authStatus === 'loading') {
    return <RouteLoader />;
  }
  if (authStatus === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

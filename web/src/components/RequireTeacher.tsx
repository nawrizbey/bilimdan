import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export function RequireTeacher({ children }: { children: ReactNode }) {
  const role = useAppStore((s) => s.role);
  if (role !== 'teacher') return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
}

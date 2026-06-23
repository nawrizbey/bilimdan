import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { RequireAuth } from './components/RequireAuth';
import { RouteLoader } from './components/RouteLoader';
import { useAppStore } from './store/useAppStore';

const LoginScreen = lazy(() => import('./screens/LoginScreen').then((m) => ({ default: m.LoginScreen })));
const SignupScreen = lazy(() => import('./screens/SignupScreen').then((m) => ({ default: m.SignupScreen })));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen').then((m) => ({ default: m.DashboardScreen })));
const LearnScreen = lazy(() => import('./screens/LearnScreen').then((m) => ({ default: m.LearnScreen })));
const BattleScreen = lazy(() => import('./screens/BattleScreen').then((m) => ({ default: m.BattleScreen })));
const QuizScreen = lazy(() => import('./screens/QuizScreen').then((m) => ({ default: m.QuizScreen })));
const LessonsScreen = lazy(() => import('./screens/LessonsScreen').then((m) => ({ default: m.LessonsScreen })));
const LeadersScreen = lazy(() => import('./screens/LeadersScreen').then((m) => ({ default: m.LeadersScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));

function App() {
  const loadSession = useAppStore((s) => s.loadSession);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/signup" element={<SignupScreen />} />
        <Route
          path="/app"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<DashboardScreen />} />
          <Route path="learn" element={<LearnScreen />} />
          <Route path="lessons" element={<LessonsScreen />} />
          <Route path="battle" element={<BattleScreen />} />
          <Route path="quiz" element={<QuizScreen />} />
          <Route path="leaders" element={<LeadersScreen />} />
          <Route path="profile" element={<ProfileScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

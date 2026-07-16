import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/AppLayout';
import { RequireAuth } from './components/RequireAuth';
import { RequireTeacher } from './components/RequireTeacher';
import { RouteLoader } from './components/RouteLoader';
import { useAppStore } from './store/useAppStore';

const LoginScreen = lazy(() => import('./screens/LoginScreen').then((m) => ({ default: m.LoginScreen })));
const SignupScreen = lazy(() => import('./screens/SignupScreen').then((m) => ({ default: m.SignupScreen })));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen').then((m) => ({ default: m.DashboardScreen })));
const LearnScreen = lazy(() => import('./screens/LearnScreen').then((m) => ({ default: m.LearnScreen })));
const LearnSessionScreen = lazy(() => import('./screens/LearnSessionScreen').then((m) => ({ default: m.LearnSessionScreen })));
const BattleScreen = lazy(() => import('./screens/BattleScreen').then((m) => ({ default: m.BattleScreen })));
const GamesHubScreen = lazy(() => import('./screens/GamesHubScreen').then((m) => ({ default: m.GamesHubScreen })));
const GameSessionScreen = lazy(() => import('./screens/GameSessionScreen').then((m) => ({ default: m.GameSessionScreen })));
const QuizScreen = lazy(() => import('./screens/QuizScreen').then((m) => ({ default: m.QuizScreen })));
const ListenScreen = lazy(() => import('./screens/ListenScreen').then((m) => ({ default: m.ListenScreen })));
const LeadersScreen = lazy(() => import('./screens/LeadersScreen').then((m) => ({ default: m.LeadersScreen })));
const ProfileScreen = lazy(() => import('./screens/ProfileScreen').then((m) => ({ default: m.ProfileScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));
const AdminApp = lazy(() => import('./screens/admin/AdminApp').then((m) => ({ default: m.AdminApp })));
const TeacherScreen = lazy(() => import('./screens/TeacherScreen').then((m) => ({ default: m.TeacherScreen })));

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
          <Route path="learn/session" element={<LearnSessionScreen />} />
          <Route path="lessons" element={<Navigate to="/app/learn" replace />} />
          <Route path="battle" element={<GamesHubScreen />} />
          <Route path="battle/live" element={<BattleScreen />} />
          <Route path="battle/:type" element={<GameSessionScreen />} />
          <Route path="quiz" element={<QuizScreen />} />
          <Route path="listen" element={<ListenScreen />} />
          <Route path="leaders" element={<LeadersScreen />} />
          <Route
            path="teacher"
            element={
              <RequireTeacher>
                <TeacherScreen />
              </RequireTeacher>
            }
          />
          <Route path="profile" element={<ProfileScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;

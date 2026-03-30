import { Routes, Route, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from './api/client';
import { Toaster } from 'sonner';
import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import WorkoutsPage from './pages/WorkoutsPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import WorkoutEditorPage from './pages/WorkoutEditorPage';
import ActiveSessionPage from './pages/ActiveSessionPage';
import HistoryPage from './pages/HistoryPage';
import SessionDetailPage from './pages/SessionDetailPage';
import StatsPage from './pages/StatsPage';
import ExerciseDetailPage from './pages/ExerciseDetailPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['auth'],
    queryFn: api.auth.me,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: '#1C1C1E',
            border: '1px solid #2C2C2E',
            color: '#FFFFFF',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<Navigate to="/workouts" replace />} />
                  <Route path="/workouts" element={<WorkoutsPage />} />
                  <Route path="/workouts/new" element={<WorkoutEditorPage />} />
                  <Route path="/workouts/:id" element={<WorkoutDetailPage />} />
                  <Route path="/workouts/:id/edit" element={<WorkoutEditorPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/history/:sessionId" element={<SessionDetailPage />} />
                  <Route path="/session/:sessionId" element={<ActiveSessionPage />} />
                  <Route path="/stats" element={<StatsPage />} />
                  <Route path="/exercises/:id" element={<ExerciseDetailPage />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

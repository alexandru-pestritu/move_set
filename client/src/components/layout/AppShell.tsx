import { useLocation, useNavigate } from 'react-router-dom';
import { Dumbbell, History, LogOut, BarChart3 } from 'lucide-react';
import { api } from '../../api/client';
import { useQueryClient } from '@tanstack/react-query';

const navItems = [
  { path: '/workouts', label: 'Workouts', icon: Dumbbell },
  { path: '/history', label: 'History', icon: History },
  { path: '/stats', label: 'Stats', icon: BarChart3 },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isSessionActive = location.pathname.startsWith('/session/');

  const handleLogout = async () => {
    await api.auth.logout();
    queryClient.clear();
    navigate('/login');
  };

  if (isSessionActive) {
    return <div className="min-h-screen bg-background" style={{ paddingTop: 'env(safe-area-inset-top)' }}>{children}</div>;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/workouts')}
            >
              <img src="/favicon.svg" alt="MoveSet" className="w-7 h-7" />
              <span className="text-lg font-semibold tracking-tight">MoveSet</span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname.startsWith(path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            title="Logout"
          >
            <LogOut size={18} className="text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex">
          {navItems.map(({ path, label, icon: Icon }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${
                location.pathname.startsWith(path) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

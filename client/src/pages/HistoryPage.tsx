import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { formatDate, formatDuration } from '../lib/utils';
import { History, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import SwipeToDelete from '../components/SwipeToDelete';

export default function HistoryPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: api.sessions.list,
  });

  const deleteSession = useMutation({
    mutationFn: api.sessions.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session deleted');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">History</h2>

      {!sessions || sessions.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary">
            <History size={32} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No workout sessions yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s: any) => (
            <SwipeToDelete
              key={s.id}
              onDelete={() => deleteSession.mutate(s.id)}
              confirmMessage="Delete this session?"
            >
              <div
                className="bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition cursor-pointer"
                onClick={() => navigate(`/history/${s.id}`)}
              >
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm truncate">{s.workoutName}</h3>
                  {s.completedAt && (
                    <CheckCircle2 size={14} className="text-success flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDate(s.startedAt)}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {s.completedCount}/{s.exerciseCount} exercises
                  </span>
                  {s.completedAt && (
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(s.startedAt, s.completedAt)}
                    </span>
                  )}
                  {!s.completedAt && (
                    <span className="text-xs text-primary font-medium">In progress</span>
                  )}
                </div>
              </div>
            </SwipeToDelete>
          ))}
        </div>
      )}
    </div>
  );
}

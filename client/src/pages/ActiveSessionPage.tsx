import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowLeft, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import GifModal from '../components/GifModal';

export default function ActiveSessionPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [completing, setCompleting] = useState(false);
  const [gifModal, setGifModal] = useState<{ src: string; alt: string } | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.sessions.get(Number(sessionId)),
    enabled: !!sessionId,
    refetchInterval: false,
  });

  const toggleExercise = useMutation({
    mutationFn: (seId: number) => api.sessions.toggleExercise(Number(sessionId), seId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['session', sessionId] }),
  });

  const completeSession = useMutation({
    mutationFn: () => api.sessions.complete(Number(sessionId)),
    onSuccess: () => {
      toast.success('Workout complete!');
      navigate('/workouts');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleComplete = () => {
    setCompleting(true);
    completeSession.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <p className="text-muted-foreground">Session not found</p>
      </div>
    );
  }

  const exercises = session.exercises || [];
  const totalSets = exercises.reduce((acc: number, se: any) => acc + (se.workoutExercise?.sets || 1), 0);
  const completedSets = exercises.reduce((acc: number, se: any) => acc + (se.completed || 0), 0);
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
  const exercisesDone = exercises.filter((se: any) => {
    const total = se.workoutExercise?.sets || 1;
    return se.completed >= total;
  }).length;
  const allDone = exercisesDone === exercises.length && exercises.length > 0;

  return (
    <div className="min-h-screen bg-background safe-bottom">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('Leave session? Progress is saved.')) navigate('/workouts');
            }}
            className="p-2 -ml-2 rounded-lg hover:bg-secondary transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-sm truncate">{session.workout?.name || 'Session'}</h1>
            <p className="text-xs text-muted-foreground">{completedSets}/{totalSets} sets</p>
          </div>
        </div>
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-success transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-3 pb-28">
        {exercises.map((se: any, idx: number) => {
          const we = se.workoutExercise;
          const totalExSets = we?.sets || 1;
          const doneSets = se.completed || 0;
          const isFullyDone = doneSets >= totalExSets;
          const exerciseName = se.exercise?.name || 'Unknown Exercise';

          return (
            <button
              key={se.id}
              onClick={() => toggleExercise.mutate(se.id)}
              className={`w-full text-left rounded-2xl p-4 border transition-all duration-200 ${
                isFullyDone
                  ? 'bg-success/5 border-success/30'
                  : doneSets > 0
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-card border-border hover:border-primary/30 active:scale-[0.98]'
              }`}
            >
              <div className="flex items-start gap-3">
                {se.exercise?.gifPath && (
                  <img
                    src={`/api/gifs/${se.exercise.gifPath}`}
                    alt={exerciseName}
                    onClick={(e) => {
                      e.stopPropagation();
                      setGifModal({ src: `/api/gifs/${se.exercise.gifPath}`, alt: exerciseName });
                    }}
                    className={`w-14 h-14 rounded-xl object-cover flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-primary/40 transition ${
                      isFullyDone ? 'opacity-50' : ''
                    }`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground font-mono mt-0.5">{idx + 1}</span>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-sm ${isFullyDone ? 'line-through text-muted-foreground' : ''}`}>
                        {exerciseName}
                      </h3>
                      {we && (
                        <p className={`text-xs mt-0.5 ${isFullyDone ? 'text-muted-foreground' : 'text-primary'}`}>
                          {we.reps} reps{we.notes ? ` · ${we.notes}` : ''}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        {Array.from({ length: totalExSets }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                              i < doneSets
                                ? 'bg-success text-white'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {doneSets}/{totalExSets}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-xl border-t border-border safe-bottom">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleComplete}
            disabled={completing}
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition flex items-center justify-center gap-2 ${
              allDone
                ? 'bg-success text-white hover:bg-success/90'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            <Trophy size={18} />
            {allDone ? 'Complete Workout' : `Finish (${exercisesDone}/${exercises.length} exercises done)`}
          </button>
        </div>
      </div>
      {gifModal && (
        <GifModal src={gifModal.src} alt={gifModal.alt} onClose={() => setGifModal(null)} />
      )}
    </div>
  );
}

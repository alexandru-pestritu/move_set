import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowLeft, Play } from 'lucide-react';
import { formatDate, formatDuration } from '../lib/utils';
import { useState } from 'react';
import GifModal from '../components/GifModal';

export default function SessionDetailPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [gifModal, setGifModal] = useState<{ src: string; alt: string } | null>(null);

  const { data: session, isLoading } = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => api.sessions.get(Number(sessionId)),
    enabled: !!sessionId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <div className="text-center py-20 text-muted-foreground">Session not found</div>;
  }

  const exercises = session.exercises || [];
  const completedCount = exercises.filter((e: any) => {
    const totalSets = e.workoutExercise?.sets || 1;
    return e.completed >= totalSets;
  }).length;
  const isActive = !session.completedAt;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/history')} className="p-2 -ml-2 rounded-lg hover:bg-secondary transition">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-tight truncate">
            {session.workout?.name || 'Session'}
          </h2>
          <p className="text-sm text-muted-foreground">{formatDate(session.startedAt)}</p>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="flex-1 bg-card rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-bold">{completedCount}/{exercises.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Exercises</p>
        </div>
        <div className="flex-1 bg-card rounded-2xl p-4 border border-border text-center">
          <p className="text-2xl font-bold">
            {session.completedAt ? formatDuration(session.startedAt, session.completedAt, session.totalPausedSeconds || 0) : '--'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Duration</p>
        </div>
        <div className="flex-1 bg-card rounded-2xl p-4 border border-border text-center">
          <p className={`text-2xl font-bold ${isActive ? 'text-primary' : 'text-success'}`}>
            {isActive ? 'Active' : 'Done'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Status</p>
        </div>
      </div>

      {isActive && (
        <button
          onClick={() => navigate(`/session/${sessionId}`)}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition flex items-center justify-center gap-2"
        >
          <Play size={16} /> Resume Session
        </button>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Exercises
        </h3>
        {exercises.map((se: any, idx: number) => {
          const we = se.workoutExercise;
          const totalSets = we?.sets || 1;
          const doneSets = se.completed || 0;
          const isFullyDone = doneSets >= totalSets;
          return (
            <div
              key={se.id}
              className={`bg-card rounded-2xl p-4 border ${isFullyDone ? 'border-success/30' : doneSets > 0 ? 'border-primary/30' : 'border-border'}`}
            >
              <div className="flex items-start gap-3">
                {se.exercise?.gifPath && (
                  <img
                    src={`/api/gifs/${se.exercise.gifPath}`}
                    alt={se.exercise?.name}
                    onClick={() => setGifModal({ src: `/api/gifs/${se.exercise.gifPath}`, alt: se.exercise?.name || 'Exercise' })}
                    className={`w-12 h-12 rounded-xl object-cover bg-secondary cursor-pointer ring-2 ring-transparent hover:ring-primary/40 transition ${isFullyDone ? 'opacity-50' : ''}`}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground font-mono mt-0.5">{idx + 1}</span>
                    <div className="flex-1">
                      <h4
                        className={`font-semibold text-sm hover:text-primary transition cursor-pointer ${isFullyDone ? 'line-through text-muted-foreground' : ''}`}
                        onClick={() => se.exercise?.id && navigate(`/exercises/${se.exercise.id}`)}
                      >
                        {se.exercise?.name || 'Unknown'}
                      </h4>
                      {we && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {we.reps} reps
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2">
                        {Array.from({ length: totalSets }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              i < doneSets
                                ? 'bg-success text-white'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {i + 1}
                          </div>
                        ))}
                        <span className="text-[10px] text-muted-foreground ml-1">
                          {doneSets}/{totalSets}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {gifModal && (
        <GifModal src={gifModal.src} alt={gifModal.alt} onClose={() => setGifModal(null)} />
      )}
    </div>
  );
}

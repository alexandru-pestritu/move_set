import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowLeft, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { formatDate } from '../lib/utils';
import { useState } from 'react';
import GifModal from '../components/GifModal';
import { getMuscleGroupColor } from '../lib/muscleGroups';

export default function ExerciseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [gifModal, setGifModal] = useState(false);

  const { data: exercise, isLoading } = useQuery({
    queryKey: ['exercise', id],
    queryFn: () => api.exercises.get(Number(id)),
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['exercise-history', id],
    queryFn: () => api.exercises.history(Number(id)),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!exercise) {
    return <div className="text-center py-20 text-muted-foreground">Exercise not found</div>;
  }

  const musclesWorked = exercise.musclesWorked ? JSON.parse(exercise.musclesWorked) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-lg hover:bg-secondary transition">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold tracking-tight truncate flex-1">{exercise.name}</h2>
      </div>

      {exercise.gifPath && (
        <div className="flex justify-center">
          <img
            src={`/api/gifs/${exercise.gifPath}`}
            alt={exercise.name}
            onClick={() => setGifModal(true)}
            className="w-full max-w-xs rounded-2xl cursor-pointer ring-2 ring-transparent hover:ring-primary/40 transition"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {exercise.primaryMuscle && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Primary Muscle</p>
            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getMuscleGroupColor(exercise.primaryMuscle)}`}>
              {exercise.primaryMuscle}
            </span>
          </div>
        )}
        {exercise.equipment && (
          <div className="bg-card rounded-2xl p-4 border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-1">Equipment</p>
            <p className="text-sm font-semibold">{exercise.equipment}</p>
          </div>
        )}
      </div>

      {musclesWorked.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Muscles Worked</h3>
          <div className="space-y-2">
            {musclesWorked.map((m: any) => (
              <div key={m.name} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.percent}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {exercise.sourceUrl && (
        <a
          href={exercise.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-primary hover:underline"
        >
          <ExternalLink size={12} /> View source
        </a>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          History ({history?.length || 0})
        </h3>
        {!history || history.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No history yet.</p>
        ) : (
          history.map((h: any, i: number) => (
            <div
              key={i}
              onClick={() => navigate(`/history/${h.sessionId}`)}
              className="bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {h.completed ? (
                  <CheckCircle2 size={18} className="text-success flex-shrink-0" />
                ) : (
                  <Circle size={18} className="text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{h.workoutName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(h.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold">{h.setsCompleted}/{h.totalSets}</p>
                  <p className="text-[10px] text-muted-foreground">sets · {h.reps} reps</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {gifModal && exercise.gifPath && (
        <GifModal
          src={`/api/gifs/${exercise.gifPath}`}
          alt={exercise.name}
          onClose={() => setGifModal(false)}
        />
      )}
    </div>
  );
}

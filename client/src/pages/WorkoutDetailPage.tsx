import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowLeft, Edit, Play, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import GifModal from '../components/GifModal';
import { getMuscleGroupColor, parseMuscleGroups } from '../lib/muscleGroups';

export default function WorkoutDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gifModal, setGifModal] = useState<{ src: string; alt: string } | null>(null);

  const { data: workout, isLoading } = useQuery({
    queryKey: ['workout', id],
    queryFn: () => api.workouts.get(Number(id)),
    enabled: !!id,
  });

  const startSession = useMutation({
    mutationFn: api.sessions.create,
    onSuccess: (data) => navigate(`/session/${data.id}`),
    onError: (err: any) => toast.error(err.message),
  });

  const deleteWorkout = useMutation({
    mutationFn: api.workouts.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      navigate('/workouts');
      toast.success('Workout deleted');
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!workout) {
    return <div className="text-center py-20 text-muted-foreground">Workout not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/workouts')} className="p-2 -ml-2 rounded-lg hover:bg-secondary transition">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold tracking-tight truncate">{workout.name}</h2>
          {workout.muscleGroups && (
            <div className="flex flex-wrap gap-1 mt-1">
              {parseMuscleGroups(workout.muscleGroups).map((mg: string) => (
                <span
                  key={mg}
                  className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getMuscleGroupColor(mg)}`}
                >
                  {mg}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => startSession.mutate(Number(id))}
          className="flex-1 py-3 rounded-xl bg-success text-white font-semibold text-sm hover:bg-success/90 transition flex items-center justify-center gap-2"
        >
          <Play size={16} /> Start Session
        </button>
        <button
          onClick={() => navigate(`/workouts/${id}/edit`)}
          className="px-4 py-3 rounded-xl bg-secondary text-foreground font-semibold text-sm hover:bg-secondary/80 transition"
        >
          <Edit size={16} />
        </button>
        <button
          onClick={() => {
            if (confirm('Delete this workout?')) deleteWorkout.mutate(Number(id));
          }}
          className="px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-semibold text-sm hover:bg-destructive/20 transition"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Exercises ({workout.exercises?.length || 0})
        </h3>
        {(!workout.exercises || workout.exercises.length === 0) ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No exercises added yet.</p>
        ) : (
          workout.exercises.map((we: any, idx: number) => (
            <div key={we.id} className="bg-card rounded-2xl p-4 border border-border">
              <div className="flex items-start gap-3">
                {we.exercise?.gifPath && (
                  <img
                    src={`/api/gifs/${we.exercise.gifPath}`}
                    alt={we.exercise.name}
                    onClick={() => setGifModal({ src: `/api/gifs/${we.exercise.gifPath}`, alt: we.exercise.name })}
                    className="w-16 h-16 rounded-xl object-cover bg-secondary cursor-pointer ring-2 ring-transparent hover:ring-primary/40 transition"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-xs text-muted-foreground font-mono mt-0.5">{idx + 1}</span>
                    <div>
                      <h4
                        className="font-semibold text-sm hover:text-primary transition cursor-pointer"
                        onClick={() => we.exercise?.id && navigate(`/exercises/${we.exercise.id}`)}
                      >{we.exercise?.name || 'Unknown'}</h4>
                      <p className="text-xs text-primary mt-0.5">
                        {we.sets} sets × {we.reps} reps
                      </p>
                      {we.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{we.notes}</p>
                      )}
                      {we.exercise?.primaryMuscle && (
                        <span className="inline-block text-[10px] px-2 py-0.5 mt-1 rounded-full bg-secondary text-muted-foreground">
                          {we.exercise.primaryMuscle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {gifModal && (
        <GifModal src={gifModal.src} alt={gifModal.alt} onClose={() => setGifModal(null)} />
      )}
    </div>
  );
}

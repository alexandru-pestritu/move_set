import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Plus, Dumbbell, MoreVertical, Copy, Trash2, Play } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { getMuscleGroupColor, parseMuscleGroups } from '../lib/muscleGroups';
import SwipeToDelete from '../components/SwipeToDelete';

export default function WorkoutsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const { data: workouts, isLoading } = useQuery({
    queryKey: ['workouts'],
    queryFn: api.workouts.list,
  });

  const deleteMutation = useMutation({
    mutationFn: api.workouts.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('Workout deleted');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: api.workouts.duplicate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast.success('Workout duplicated');
    },
  });

  const startSession = useMutation({
    mutationFn: api.sessions.create,
    onSuccess: (data) => {
      navigate(`/session/${data.id}`);
    },
    onError: (err: any) => toast.error(err.message),
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
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Workouts</h2>
        <button
          onClick={() => navigate('/workouts/new')}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition"
        >
          <Plus size={16} />
          New
        </button>
      </div>

      {!workouts || workouts.length === 0 ? (
        <div className="text-center py-20 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-secondary">
            <Dumbbell size={32} className="text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No workouts yet. Create your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workouts.map((w: any) => (
            <SwipeToDelete
              key={w.id}
              onDelete={() => deleteMutation.mutate(w.id)}
              confirmMessage={`Delete "${w.name}"?`}
              showDesktopButton={false}
            >
            <div
              className="relative bg-card rounded-2xl p-4 border border-border hover:border-primary/30 transition group"
            >
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/workouts/${w.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{w.name}</h3>
                    {w.muscleGroups && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {parseMuscleGroups(w.muscleGroups).map((mg: string) => (
                          <span
                            key={mg}
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getMuscleGroupColor(mg)}`}
                          >
                            {mg}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {w.exerciseCount || 0} exercises
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startSession.mutate(w.id);
                  }}
                  className="p-2 rounded-lg bg-success/10 text-success hover:bg-success/20 transition"
                  title="Start session"
                >
                  <Play size={14} />
                </button>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(menuOpen === w.id ? null : w.id);
                    }}
                    className="p-2 rounded-lg hover:bg-secondary transition"
                  >
                    <MoreVertical size={14} className="text-muted-foreground" />
                  </button>
                  {menuOpen === w.id && (
                    <div className="absolute right-0 top-10 z-50 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[140px]">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/workouts/${w.id}/edit`);
                          setMenuOpen(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateMutation.mutate(w.id);
                          setMenuOpen(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-secondary transition flex items-center gap-2"
                      >
                        <Copy size={14} /> Duplicate
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Delete this workout?')) {
                            deleteMutation.mutate(w.id);
                          }
                          setMenuOpen(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-secondary transition flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            </SwipeToDelete>
          ))}
        </div>
      )}
    </div>
  );
}

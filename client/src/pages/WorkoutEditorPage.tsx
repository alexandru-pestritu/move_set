import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowLeft, Plus, GripVertical, Trash2, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import GifModal from '../components/GifModal';
import SchedulePicker from '../components/SchedulePicker';

function SortableExercise({
  item,
  onRemove,
  onUpdate,
  onGifTap,
}: {
  item: any;
  onRemove: () => void;
  onUpdate: (data: { sets?: number; reps?: string; notes?: string }) => void;
  onGifTap?: (src: string, alt: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const [localSets, setLocalSets] = useState(item.sets);
  const [localReps, setLocalReps] = useState(item.reps);
  const [localNotes, setLocalNotes] = useState(item.notes || '');

  useEffect(() => {
    setLocalSets(item.sets);
    setLocalReps(item.reps);
    setLocalNotes(item.notes || '');
  }, [item.sets, item.reps, item.notes]);

  return (
    <div ref={setNodeRef} style={style} className="bg-card rounded-2xl p-4 border border-border">
      <div className="flex items-start gap-3">
        <button {...attributes} {...listeners} className="mt-1 p-1 cursor-grab active:cursor-grabbing touch-none">
          <GripVertical size={16} className="text-muted-foreground" />
        </button>
        {item.exercise?.gifPath && (
          <img
            src={`/api/gifs/${item.exercise.gifPath}`}
            alt={item.exercise.name}
            onClick={() => onGifTap?.(`/api/gifs/${item.exercise.gifPath}`, item.exercise.name)}
            className="w-14 h-14 rounded-xl object-cover bg-secondary flex-shrink-0 cursor-pointer ring-2 ring-transparent hover:ring-primary/40 transition"
          />
        )}
        <div className="flex-1 min-w-0 space-y-2">
          <h4 className="font-semibold text-sm truncate">{item.exercise?.name || 'Unknown'}</h4>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase">Sets</label>
              <input
                type="number"
                min={1}
                value={localSets}
                onChange={(e) => setLocalSets(parseInt(e.target.value) || 1)}
                onBlur={() => onUpdate({ sets: localSets })}
                className="w-full px-2 py-1.5 rounded-lg bg-secondary border border-border text-sm text-center"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase">Reps</label>
              <input
                type="text"
                value={localReps}
                onChange={(e) => setLocalReps(e.target.value)}
                onBlur={() => onUpdate({ reps: localReps })}
                className="w-full px-2 py-1.5 rounded-lg bg-secondary border border-border text-sm text-center"
                placeholder="8-12"
              />
            </div>
          </div>
          <input
            type="text"
            value={localNotes}
            onChange={(e) => setLocalNotes(e.target.value)}
            onBlur={() => onUpdate({ notes: localNotes })}
            className="w-full px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs"
            placeholder="Notes (optional)"
          />
        </div>
        <button onClick={onRemove} className="p-1 mt-1 rounded-lg hover:bg-destructive/10 transition">
          <Trash2 size={14} className="text-destructive" />
        </button>
      </div>
    </div>
  );
}

export default function WorkoutEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = !id;

  const [name, setName] = useState('');
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [gifModal, setGifModal] = useState<{ src: string; alt: string } | null>(null);

  const { data: workout } = useQuery({
    queryKey: ['workout', id],
    queryFn: () => api.workouts.get(Number(id)),
    enabled: !isNew,
  });

  const { data: allExercises } = useQuery({
    queryKey: ['exercises'],
    queryFn: api.exercises.list,
  });

  useEffect(() => {
    if (workout) {
      setName(workout.name);
    }
  }, [workout]);

  const createWorkout = useMutation({
    mutationFn: (data: { name: string }) => api.workouts.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      navigate(`/workouts/${data.id}/edit`, { replace: true });
      toast.success('Workout created');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateWorkout = useMutation({
    mutationFn: (data: { name?: string }) => api.workouts.update(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', id] });
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });

  const addExercise = useMutation({
    mutationFn: (data: { exerciseId: number; sets?: number; reps?: string }) =>
      api.workouts.addExercise(Number(id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', id] });
      toast.success('Exercise added');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateExercise = useMutation({
    mutationFn: ({ weId, data }: { weId: number; data: { sets?: number; reps?: string; notes?: string } }) =>
      api.workouts.updateExercise(Number(id), weId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout', id] }),
  });

  const removeExercise = useMutation({
    mutationFn: (weId: number) => api.workouts.removeExercise(Number(id), weId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout', id] });
      toast.success('Exercise removed');
    },
  });

  const reorderExercises = useMutation({
    mutationFn: (order: { id: number; sortOrder: number }[]) => api.workouts.reorder(Number(id), order),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workout', id] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !workout?.exercises) return;

    const oldIndex = workout.exercises.findIndex((e: any) => e.id === active.id);
    const newIndex = workout.exercises.findIndex((e: any) => e.id === over.id);
    const reordered = arrayMove(workout.exercises, oldIndex, newIndex);
    const order = reordered.map((e: any, i: number) => ({ id: e.id, sortOrder: i }));
    reorderExercises.mutate(order);
  };

  const handleScrape = async () => {
    if (!scrapeUrl) return;
    setScraping(true);
    try {
      const exercise = await api.exercises.scrape(scrapeUrl);
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      if (!isNew && id) {
        addExercise.mutate({ exerciseId: exercise.id });
      }
      setScrapeUrl('');
      toast.success(`Scraped: ${exercise.name}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setScraping(false);
    }
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    createWorkout.mutate({ name: name.trim() });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }
    updateWorkout.mutate({ name: name.trim() });
    toast.success('Workout saved');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => (id ? navigate(`/workouts/${id}`) : navigate('/workouts'))}
          className="p-2 -ml-2 rounded-lg hover:bg-secondary transition"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold tracking-tight">{isNew ? 'New Workout' : 'Edit Workout'}</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            placeholder="e.g. Push Day"
          />
        </div>
        {isNew ? (
          <button
            onClick={handleCreate}
            disabled={!name.trim() || createWorkout.isPending}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 transition"
          >
            {createWorkout.isPending ? 'Creating...' : 'Create Workout'}
          </button>
        ) : (
          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition"
          >
            Save Changes
          </button>
        )}
      </div>

      {!isNew && workout && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Exercises ({workout.exercises?.length || 0})
              </h3>
              <button
                onClick={() => setShowExercisePicker(!showExercisePicker)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition"
              >
                <Plus size={14} /> Add
              </button>
            </div>

            {workout.exercises && workout.exercises.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={workout.exercises.map((e: any) => e.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {workout.exercises.map((we: any) => (
                      <SortableExercise
                        key={we.id}
                        item={we}
                        onRemove={() => removeExercise.mutate(we.id)}
                        onUpdate={(data) => updateExercise.mutate({ weId: we.id, data })}
                        onGifTap={(src, alt) => setGifModal({ src, alt })}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Schedule
            </h3>
            <SchedulePicker workoutId={Number(id)} />
          </div>

          {showExercisePicker && (
            <div className="space-y-3 bg-card rounded-2xl p-4 border border-border">
              <h4 className="font-semibold text-sm">Add Exercise</h4>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm"
                  placeholder="Paste fitnessprogramer.com URL"
                />
                <button
                  onClick={handleScrape}
                  disabled={scraping || !scrapeUrl}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition flex items-center gap-1"
                >
                  {scraping ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                  Scrape
                </button>
              </div>

              {allExercises && allExercises.length > 0 && (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  <p className="text-xs text-muted-foreground">Or pick from library:</p>
                  {allExercises.map((ex: any) => {
                    const alreadyAdded = workout.exercises?.some((we: any) => we.exerciseId === ex.id);
                    return (
                      <button
                        key={ex.id}
                        onClick={() => !alreadyAdded && addExercise.mutate({ exerciseId: ex.id })}
                        disabled={alreadyAdded}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition ${
                          alreadyAdded ? 'opacity-40 cursor-not-allowed' : 'hover:bg-secondary'
                        }`}
                      >
                        {ex.gifPath && (
                          <img
                            src={`/api/gifs/${ex.gifPath}`}
                            alt={ex.name}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              setGifModal({ src: `/api/gifs/${ex.gifPath}`, alt: ex.name });
                            }}
                            className="w-8 h-8 rounded-lg object-cover bg-secondary cursor-pointer ring-2 ring-transparent hover:ring-primary/40 transition"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{ex.name}</p>
                          {ex.primaryMuscle && <p className="text-xs text-muted-foreground">{ex.primaryMuscle}</p>}
                        </div>
                        {alreadyAdded && <span className="text-xs text-muted-foreground">Added</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
      {gifModal && (
        <GifModal src={gifModal.src} alt={gifModal.alt} onClose={() => setGifModal(null)} />
      )}
    </div>
  );
}

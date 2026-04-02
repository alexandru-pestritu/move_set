import { Router, Response } from 'express';
import { db } from '../db';
import { workouts, workoutExercises, exercises } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

const router = Router();

function getWorkoutMuscleGroups(workoutId: number): string {
  const wExs = db.select().from(workoutExercises).where(eq(workoutExercises.workoutId, workoutId)).all();
  const muscles = new Set<string>();
  for (const we of wExs) {
    const ex = db.select().from(exercises).where(eq(exercises.id, we.exerciseId)).get();
    if (ex?.primaryMuscle) {
      ex.primaryMuscle.split(',').map((m: string) => m.trim()).filter(Boolean).forEach((m: string) => muscles.add(m));
    }
  }
  return [...muscles].join(', ');
}

router.get('/', (_req: AuthRequest, res: Response) => {
  const all = db.select().from(workouts).all();
  const result = all.map((w) => {
    const exCount = db.select().from(workoutExercises).where(eq(workoutExercises.workoutId, w.id)).all().length;
    const muscleGroups = getWorkoutMuscleGroups(w.id);
    return { ...w, muscleGroups, exerciseCount: exCount };
  });
  return res.json(result);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const workout = db.select().from(workouts).where(eq(workouts.id, parseInt(req.params.id as string))).get();
  if (!workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  const wExercises = db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workout.id))
    .orderBy(asc(workoutExercises.sortOrder))
    .all();

  const exercisesWithDetails = wExercises.map((we) => {
    const exercise = db.select().from(exercises).where(eq(exercises.id, we.exerciseId)).get();
    return { ...we, exercise };
  });

  const muscleGroups = getWorkoutMuscleGroups(workout.id);
  return res.json({ ...workout, muscleGroups, exercises: exercisesWithDetails });
});

router.post('/', (req: AuthRequest, res: Response) => {
  const { name, muscleGroups } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const now = new Date().toISOString();
  const result = db.insert(workouts).values({
    name,
    muscleGroups: muscleGroups || '',
    createdAt: now,
    updatedAt: now,
  }).returning().get();

  return res.json(result);
});

router.put('/:id', (req: AuthRequest, res: Response) => {
  const { name, muscleGroups } = req.body;
  const id = parseInt(req.params.id as string);

  const existing = db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!existing) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  db.update(workouts).set({
    name: name || existing.name,
    muscleGroups: muscleGroups !== undefined ? muscleGroups : existing.muscleGroups,
    updatedAt: new Date().toISOString(),
  }).where(eq(workouts.id, id)).run();

  const updated = db.select().from(workouts).where(eq(workouts.id, id)).get();
  return res.json(updated);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  db.delete(workouts).where(eq(workouts.id, id)).run();
  return res.json({ ok: true });
});

router.post('/:id/exercises', async (req: AuthRequest, res: Response) => {
  const workoutId = parseInt(req.params.id as string);
  const { exerciseId, sets, reps, notes } = req.body;

  if (!exerciseId) {
    return res.status(400).json({ error: 'exerciseId is required' });
  }

  const maxOrder = db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))
    .all();
  const sortOrder = maxOrder.length;

  const result = db.insert(workoutExercises).values({
    workoutId,
    exerciseId,
    sortOrder,
    sets: sets || 3,
    reps: reps || '12',
    notes: notes || '',
  }).returning().get();

  const exercise = db.select().from(exercises).where(eq(exercises.id, exerciseId)).get();

  db.update(workouts).set({ updatedAt: new Date().toISOString() }).where(eq(workouts.id, workoutId)).run();

  return res.json({ ...result, exercise });
});

router.put('/:id/exercises/:weId', (req: AuthRequest, res: Response) => {
  const weId = parseInt(req.params.weId as string);
  const { sets, reps, notes } = req.body;

  const existing = db.select().from(workoutExercises).where(eq(workoutExercises.id, weId)).get();
  if (!existing) {
    return res.status(404).json({ error: 'Workout exercise not found' });
  }

  db.update(workoutExercises).set({
    sets: sets !== undefined ? sets : existing.sets,
    reps: reps !== undefined ? reps : existing.reps,
    notes: notes !== undefined ? notes : existing.notes,
  }).where(eq(workoutExercises.id, weId)).run();

  const updated = db.select().from(workoutExercises).where(eq(workoutExercises.id, weId)).get();
  return res.json(updated);
});

router.delete('/:id/exercises/:weId', (req: AuthRequest, res: Response) => {
  const weId = parseInt(req.params.weId as string);
  const workoutId = parseInt(req.params.id as string);
  db.delete(workoutExercises).where(eq(workoutExercises.id, weId)).run();

  db.update(workouts).set({ updatedAt: new Date().toISOString() }).where(eq(workouts.id, workoutId)).run();

  return res.json({ ok: true });
});

router.put('/:id/reorder', (req: AuthRequest, res: Response) => {
  const { order } = req.body;
  if (!Array.isArray(order)) {
    return res.status(400).json({ error: 'order must be an array of { id, sortOrder }' });
  }

  for (const item of order) {
    db.update(workoutExercises)
      .set({ sortOrder: item.sortOrder })
      .where(eq(workoutExercises.id, item.id))
      .run();
  }

  return res.json({ ok: true });
});

router.post('/:id/duplicate', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  const original = db.select().from(workouts).where(eq(workouts.id, id)).get();
  if (!original) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  const now = new Date().toISOString();
  const newWorkout = db.insert(workouts).values({
    name: `${original.name} (Copy)`,
    muscleGroups: original.muscleGroups,
    createdAt: now,
    updatedAt: now,
  }).returning().get();

  const originalExercises = db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, id))
    .orderBy(asc(workoutExercises.sortOrder))
    .all();

  for (const ex of originalExercises) {
    db.insert(workoutExercises).values({
      workoutId: newWorkout.id,
      exerciseId: ex.exerciseId,
      sortOrder: ex.sortOrder,
      sets: ex.sets,
      reps: ex.reps,
      notes: ex.notes,
    }).run();
  }

  return res.json(newWorkout);
});

export default router;

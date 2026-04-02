import { Router, Response } from 'express';
import { db } from '../db';
import { workoutSchedules, workouts } from '../db/schema';
import { eq } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

const router = Router();

// Get all schedules (optionally filtered by workoutId)
router.get('/', (req: AuthRequest, res: Response) => {
  const { workoutId } = req.query;
  let all;
  if (workoutId) {
    all = db.select().from(workoutSchedules).where(eq(workoutSchedules.workoutId, Number(workoutId))).all();
  } else {
    all = db.select().from(workoutSchedules).all();
  }

  const result = all.map((s) => {
    const workout = db.select().from(workouts).where(eq(workouts.id, s.workoutId)).get();
    return { ...s, workoutName: workout?.name || 'Deleted Workout' };
  });

  return res.json(result);
});

// Create a schedule
router.post('/', (req: AuthRequest, res: Response) => {
  const { workoutId, type, dayOfWeek, specificDate } = req.body;

  if (!workoutId || !type) {
    return res.status(400).json({ error: 'workoutId and type are required' });
  }
  if (type !== 'once' && type !== 'weekly') {
    return res.status(400).json({ error: 'type must be "once" or "weekly"' });
  }
  if (type === 'weekly' && (dayOfWeek === undefined || dayOfWeek === null)) {
    return res.status(400).json({ error: 'dayOfWeek is required for weekly schedules' });
  }
  if (type === 'once' && !specificDate) {
    return res.status(400).json({ error: 'specificDate is required for one-time schedules' });
  }

  const result = db.insert(workoutSchedules).values({
    workoutId,
    type,
    dayOfWeek: type === 'weekly' ? dayOfWeek : null,
    specificDate: type === 'once' ? specificDate : null,
    createdAt: new Date().toISOString(),
  }).returning().get();

  return res.json(result);
});

// Delete a schedule
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  db.delete(workoutSchedules).where(eq(workoutSchedules.id, id)).run();
  return res.json({ ok: true });
});

// Get upcoming scheduled workouts (next 14 days)
router.get('/upcoming', (_req: AuthRequest, res: Response) => {
  const allSchedules = db.select().from(workoutSchedules).all();
  const upcoming: any[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 14; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();

    for (const sched of allSchedules) {
      let match = false;
      if (sched.type === 'weekly' && sched.dayOfWeek === dayOfWeek) {
        match = true;
      }
      if (sched.type === 'once' && sched.specificDate === dateStr) {
        match = true;
      }
      if (match) {
        const workout = db.select().from(workouts).where(eq(workouts.id, sched.workoutId)).get();
        if (workout) {
          upcoming.push({
            scheduleId: sched.id,
            workoutId: workout.id,
            workoutName: workout.name,
            date: dateStr,
            dayOfWeek,
            type: sched.type,
          });
        }
      }
    }
  }

  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  return res.json(upcoming);
});

export default router;

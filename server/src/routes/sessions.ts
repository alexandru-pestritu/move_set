import { Router, Response } from 'express';
import { db } from '../db';
import { workoutSessions, sessionExercises, workoutExercises, workouts, exercises } from '../db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/', (req: AuthRequest, res: Response) => {
  const { workoutId } = req.body;
  if (!workoutId) {
    return res.status(400).json({ error: 'workoutId is required' });
  }

  const workout = db.select().from(workouts).where(eq(workouts.id, workoutId)).get();
  if (!workout) {
    return res.status(404).json({ error: 'Workout not found' });
  }

  const session = db.insert(workoutSessions).values({
    workoutId,
    startedAt: new Date().toISOString(),
  }).returning().get();

  const wExercises = db
    .select()
    .from(workoutExercises)
    .where(eq(workoutExercises.workoutId, workoutId))
    .orderBy(asc(workoutExercises.sortOrder))
    .all();

  const sessExercises = wExercises.map((we) => {
    return db.insert(sessionExercises).values({
      sessionId: session.id,
      workoutExerciseId: we.id,
      completed: 0,
    }).returning().get();
  });

  const exercisesWithDetails = sessExercises.map((se) => {
    const we = db.select().from(workoutExercises).where(eq(workoutExercises.id, se.workoutExerciseId)).get();
    const ex = we ? db.select().from(exercises).where(eq(exercises.id, we.exerciseId)).get() : null;
    return { ...se, workoutExercise: we, exercise: ex };
  });

  return res.json({ ...session, workout, exercises: exercisesWithDetails });
});

router.get('/', (_req: AuthRequest, res: Response) => {
  const all = db
    .select()
    .from(workoutSessions)
    .orderBy(desc(workoutSessions.startedAt))
    .all();

  const result = all.map((s) => {
    const workout = db.select().from(workouts).where(eq(workouts.id, s.workoutId)).get();
    const sessEx = db.select().from(sessionExercises).where(eq(sessionExercises.sessionId, s.id)).all();
    const completedCount = sessEx.filter((se) => {
      const we = db.select().from(workoutExercises).where(eq(workoutExercises.id, se.workoutExerciseId)).get();
      return se.completed >= (we?.sets || 1);
    }).length;
    return {
      ...s,
      workoutName: workout?.name || 'Deleted Workout',
      exerciseCount: sessEx.length,
      completedCount,
    };
  });

  return res.json(result);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  const session = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  const workout = db.select().from(workouts).where(eq(workouts.id, session.workoutId)).get();

  const sessEx = db
    .select()
    .from(sessionExercises)
    .where(eq(sessionExercises.sessionId, id))
    .all();

  const exercisesWithDetails = sessEx.map((se) => {
    const we = db.select().from(workoutExercises).where(eq(workoutExercises.id, se.workoutExerciseId)).get();
    const ex = we ? db.select().from(exercises).where(eq(exercises.id, we.exerciseId)).get() : null;
    return { ...se, workoutExercise: we, exercise: ex };
  });

  return res.json({ ...session, workout, exercises: exercisesWithDetails });
});

router.put('/:id/exercises/:seId', (req: AuthRequest, res: Response) => {
  const seId = parseInt(req.params.seId as string);
  const existing = db.select().from(sessionExercises).where(eq(sessionExercises.id, seId)).get();
  if (!existing) {
    return res.status(404).json({ error: 'Session exercise not found' });
  }

  const we = db.select().from(workoutExercises).where(eq(workoutExercises.id, existing.workoutExerciseId)).get();
  const totalSets = we?.sets || 1;
  const newCompleted = existing.completed >= totalSets ? 0 : existing.completed + 1;
  const allDone = newCompleted >= totalSets;

  db.update(sessionExercises).set({
    completed: newCompleted,
    completedAt: allDone ? new Date().toISOString() : null,
  }).where(eq(sessionExercises.id, seId)).run();

  const updated = db.select().from(sessionExercises).where(eq(sessionExercises.id, seId)).get();
  return res.json(updated);
});

router.put('/:id/pause', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  const session = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (session.pausedAt) {
    return res.status(400).json({ error: 'Session is already paused' });
  }
  if (session.completedAt) {
    return res.status(400).json({ error: 'Session is already completed' });
  }

  db.update(workoutSessions).set({
    pausedAt: new Date().toISOString(),
  }).where(eq(workoutSessions.id, id)).run();

  const updated = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
  return res.json(updated);
});

router.put('/:id/resume', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  const session = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (!session.pausedAt) {
    return res.status(400).json({ error: 'Session is not paused' });
  }

  const pauseStart = new Date(session.pausedAt).getTime();
  const pauseEnd = Date.now();
  const pausedSeconds = Math.floor((pauseEnd - pauseStart) / 1000);

  db.update(workoutSessions).set({
    pausedAt: null,
    totalPausedSeconds: (session.totalPausedSeconds || 0) + pausedSeconds,
  }).where(eq(workoutSessions.id, id)).run();

  const updated = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
  return res.json(updated);
});

router.put('/:id/complete', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  const session = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  // If paused, accumulate remaining pause time before completing
  let totalPaused = session.totalPausedSeconds || 0;
  if (session.pausedAt) {
    const pauseStart = new Date(session.pausedAt).getTime();
    totalPaused += Math.floor((Date.now() - pauseStart) / 1000);
  }

  db.update(workoutSessions).set({
    completedAt: new Date().toISOString(),
    pausedAt: null,
    totalPausedSeconds: totalPaused,
  }).where(eq(workoutSessions.id, id)).run();

  const updated = db.select().from(workoutSessions).where(eq(workoutSessions.id, id)).get();
  return res.json(updated);
});

router.get('/stats/overview', (_req: AuthRequest, res: Response) => {
  const allSessions = db
    .select()
    .from(workoutSessions)
    .orderBy(desc(workoutSessions.startedAt))
    .all();

  const totalSessions = allSessions.length;
  const completedSessions = allSessions.filter((s) => s.completedAt).length;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const thisWeek = allSessions.filter((s) => new Date(s.startedAt) >= startOfWeek).length;

  let streak = 0;
  const completedDates = allSessions
    .filter((s) => s.completedAt)
    .map((s) => {
      const d = new Date(s.startedAt);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
  const uniqueDates = [...new Set(completedDates)].sort().reverse();

  if (uniqueDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let checkDate = new Date(today);
    const todayStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (!uniqueDates.includes(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    for (let i = 0; i < 365; i++) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (uniqueDates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  const muscleMap: Record<string, number> = {};
  for (const s of allSessions) {
    if (!s.completedAt) continue;
    const sessEx = db.select().from(sessionExercises).where(eq(sessionExercises.sessionId, s.id)).all();
    for (const se of sessEx) {
      const we = db.select().from(workoutExercises).where(eq(workoutExercises.id, se.workoutExerciseId)).get();
      if (we) {
        const ex = db.select().from(exercises).where(eq(exercises.id, we.exerciseId)).get();
        if (ex?.primaryMuscle) {
          const groups = ex.primaryMuscle.split(',').map((g: string) => g.trim()).filter(Boolean);
          for (const g of groups) {
            muscleMap[g] = (muscleMap[g] || 0) + 1;
          }
        }
      }
    }
  }
  const muscleGroups = Object.entries(muscleMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
    const count = allSessions.filter((s) => {
      const sd = new Date(s.startedAt);
      return `${sd.getFullYear()}-${String(sd.getMonth() + 1).padStart(2, '0')}-${String(sd.getDate()).padStart(2, '0')}` === dateStr;
    }).length;
    return { day: dayLabel, count };
  });

  return res.json({ totalSessions, completedSessions, thisWeek, streak, muscleGroups, last7 });
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  db.delete(workoutSessions).where(eq(workoutSessions.id, id)).run();
  return res.json({ ok: true });
});

export default router;

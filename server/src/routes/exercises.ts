import { Router, Response } from 'express';
import { db } from '../db';
import { exercises, workoutExercises, sessionExercises, workoutSessions, workouts } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { scrapeExercise, downloadGif } from '../services/scraper';
import { AuthRequest } from '../middleware/auth';
import { config } from '../config';
import fs from 'fs';
import path from 'path';

const router = Router();

router.post('/scrape', async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const existing = db.select().from(exercises).where(eq(exercises.sourceUrl, url)).get();
    if (existing) {
      return res.json(existing);
    }

    const scraped = await scrapeExercise(url);

    const result = db.insert(exercises).values({
      name: scraped.name,
      gifPath: '',
      primaryMuscle: scraped.primaryMuscle,
      equipment: scraped.equipment,
      musclesWorked: JSON.stringify(scraped.musclesWorked),
      sourceUrl: url,
      createdAt: new Date().toISOString(),
    }).returning().get();

    const gifFilename = await downloadGif(scraped.gifUrl, result.id);
    db.update(exercises).set({ gifPath: gifFilename }).where(eq(exercises.id, result.id)).run();

    const updated = db.select().from(exercises).where(eq(exercises.id, result.id)).get();
    return res.json(updated);
  } catch (error: any) {
    console.error('Scrape error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to scrape exercise' });
  }
});

router.get('/', (_req: AuthRequest, res: Response) => {
  const all = db.select().from(exercises).all();
  return res.json(all);
});

router.get('/:id', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  const exercise = db.select().from(exercises).where(eq(exercises.id, id)).get();
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }
  return res.json(exercise);
});

router.get('/:id/history', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  const exercise = db.select().from(exercises).where(eq(exercises.id, id)).get();
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }

  const weList = db.select().from(workoutExercises).where(eq(workoutExercises.exerciseId, id)).all();
  const history: any[] = [];

  for (const we of weList) {
    const seList = db.select().from(sessionExercises).where(eq(sessionExercises.workoutExerciseId, we.id)).all();
    for (const se of seList) {
      const session = db.select().from(workoutSessions).where(eq(workoutSessions.id, se.sessionId)).get();
      if (session) {
        const workout = db.select().from(workouts).where(eq(workouts.id, session.workoutId)).get();
        history.push({
          sessionId: session.id,
          workoutName: workout?.name || 'Deleted Workout',
          date: session.startedAt,
          completed: se.completed >= we.sets,
          setsCompleted: se.completed,
          totalSets: we.sets,
          reps: we.reps,
        });
      }
    }
  }

  history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return res.json(history);
});

router.delete('/:id', (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id as string);
  const exercise = db.select().from(exercises).where(eq(exercises.id, id)).get();
  if (!exercise) {
    return res.status(404).json({ error: 'Exercise not found' });
  }

  if (exercise.gifPath) {
    const gifFile = path.join(config.gifDir, exercise.gifPath);
    if (fs.existsSync(gifFile)) {
      fs.unlinkSync(gifFile);
    }
  }

  db.delete(exercises).where(eq(exercises.id, id)).run();
  return res.json({ ok: true });
});

export default router;

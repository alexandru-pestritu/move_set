import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { config } from './config';
import { initializeDatabase } from './db';
import { authMiddleware } from './middleware/auth';
import authRoutes from './routes/auth';
import exerciseRoutes from './routes/exercises';
import workoutRoutes from './routes/workouts';
import sessionRoutes from './routes/sessions';
import gifRoutes from './routes/gifs';
import scheduleRoutes from './routes/schedules';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

initializeDatabase();

app.use('/api/auth', authRoutes);

app.use('/api/gifs', gifRoutes);

app.use('/api/exercises', authMiddleware, exerciseRoutes);
app.use('/api/workouts', authMiddleware, workoutRoutes);
app.use('/api/sessions', authMiddleware, sessionRoutes);
app.use('/api/schedules', authMiddleware, scheduleRoutes);

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('*', (_req, res) => {
  const indexPath = path.join(publicDir, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(404).send('Not found');
    }
  });
});

app.listen(config.port, () => {
  console.log(`MoveSet server running on port ${config.port}`);
});

export default app;

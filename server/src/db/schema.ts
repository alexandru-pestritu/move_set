import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const exercises = sqliteTable('exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  gifPath: text('gif_path').notNull(),
  primaryMuscle: text('primary_muscle'),
  equipment: text('equipment'),
  musclesWorked: text('muscles_worked'),
  sourceUrl: text('source_url').notNull().unique(),
  createdAt: text('created_at').notNull(),
});

export const workouts = sqliteTable('workouts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  muscleGroups: text('muscle_groups'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const workoutExercises = sqliteTable('workout_exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: integer('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  exerciseId: integer('exercise_id').notNull().references(() => exercises.id, { onDelete: 'cascade' }),
  sortOrder: integer('sort_order').notNull().default(0),
  sets: integer('sets').notNull().default(3),
  reps: text('reps').notNull().default('12'),
  notes: text('notes').default(''),
});

export const workoutSessions = sqliteTable('workout_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  workoutId: integer('workout_id').notNull().references(() => workouts.id, { onDelete: 'cascade' }),
  startedAt: text('started_at').notNull(),
  completedAt: text('completed_at'),
});

export const sessionExercises = sqliteTable('session_exercises', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  sessionId: integer('session_id').notNull().references(() => workoutSessions.id, { onDelete: 'cascade' }),
  workoutExerciseId: integer('workout_exercise_id').notNull().references(() => workoutExercises.id, { onDelete: 'cascade' }),
  completed: integer('completed').notNull().default(0),
  completedAt: text('completed_at'),
});

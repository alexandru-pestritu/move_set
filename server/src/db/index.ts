import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { config } from '../config';
import * as schema from './schema';
import fs from 'fs';
import path from 'path';

const dir = path.dirname(config.dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const sqlite = new Database(config.dbPath);
sqlite.pragma('journal_mode = WAL');
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

export function initializeDatabase() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      gif_path TEXT NOT NULL,
      primary_muscle TEXT,
      equipment TEXT,
      muscles_worked TEXT,
      source_url TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_groups TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      sets INTEGER NOT NULL DEFAULT 3,
      reps TEXT NOT NULL DEFAULT '12',
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      started_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS session_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      workout_exercise_id INTEGER NOT NULL REFERENCES workout_exercises(id) ON DELETE CASCADE,
      completed INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT
    );
  `);

  // Non-breaking migrations: add new columns/tables if they don't exist
  const cols = sqlite.prepare(`PRAGMA table_info(workout_sessions)`).all() as any[];
  const colNames = cols.map((c: any) => c.name);

  if (!colNames.includes('paused_at')) {
    sqlite.exec(`ALTER TABLE workout_sessions ADD COLUMN paused_at TEXT`);
  }
  if (!colNames.includes('total_paused_seconds')) {
    sqlite.exec(`ALTER TABLE workout_sessions ADD COLUMN total_paused_seconds INTEGER NOT NULL DEFAULT 0`);
  }

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS workout_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      day_of_week INTEGER,
      specific_date TEXT,
      created_at TEXT NOT NULL
    );
  `);

  if (!fs.existsSync(config.gifDir)) {
    fs.mkdirSync(config.gifDir, { recursive: true });
  }

  console.log('Database initialized at', config.dbPath);
}

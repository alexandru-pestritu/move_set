import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(startedAt: string, completedAt: string | null, totalPausedSeconds = 0): string {
  if (!completedAt) return 'In progress';
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const diff = Math.max(0, Math.floor((end - start) / 1000) - totalPausedSeconds);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

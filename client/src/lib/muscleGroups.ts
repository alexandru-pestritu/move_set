export const MUSCLE_GROUPS = [
  { label: 'Chest', color: 'bg-red-500/20 text-red-400' },
  { label: 'Back', color: 'bg-blue-500/20 text-blue-400' },
  { label: 'Shoulders', color: 'bg-amber-500/20 text-amber-400' },
  { label: 'Biceps', color: 'bg-emerald-500/20 text-emerald-400' },
  { label: 'Triceps', color: 'bg-violet-500/20 text-violet-400' },
  { label: 'Forearms', color: 'bg-orange-500/20 text-orange-400' },
  { label: 'Core', color: 'bg-yellow-500/20 text-yellow-400' },
  { label: 'Quads', color: 'bg-cyan-500/20 text-cyan-400' },
  { label: 'Hamstrings', color: 'bg-pink-500/20 text-pink-400' },
  { label: 'Glutes', color: 'bg-rose-500/20 text-rose-400' },
  { label: 'Calves', color: 'bg-teal-500/20 text-teal-400' },
  { label: 'Traps', color: 'bg-indigo-500/20 text-indigo-400' },
  { label: 'Lats', color: 'bg-sky-500/20 text-sky-400' },
  { label: 'Full Body', color: 'bg-purple-500/20 text-purple-400' },
  { label: 'Cardio', color: 'bg-lime-500/20 text-lime-400' },
] as const;

export function getMuscleGroupColor(label: string): string {
  const found = MUSCLE_GROUPS.find(
    (mg) => mg.label.toLowerCase() === label.trim().toLowerCase()
  );
  return found?.color || 'bg-secondary text-muted-foreground';
}

export function parseMuscleGroups(str: string): string[] {
  if (!str) return [];
  return str.split(',').map((s) => s.trim()).filter(Boolean);
}

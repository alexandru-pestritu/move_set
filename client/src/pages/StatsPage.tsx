import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { getMuscleGroupColor } from '../lib/muscleGroups';

export default function StatsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: api.sessions.stats,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-20 text-muted-foreground">No stats available yet</div>;
  }

  const maxBar = Math.max(...stats.last7.map((d: any) => d.count), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Stats</h2>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Trophy size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground font-medium">Total</span>
          </div>
          <p className="text-3xl font-bold">{stats.completedSessions}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">workouts completed</p>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={16} className="text-primary" />
            <span className="text-xs text-muted-foreground font-medium">This Week</span>
          </div>
          <p className="text-3xl font-bold">{stats.thisWeek}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">sessions started</p>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <Flame size={16} className="text-orange-400" />
            <span className="text-xs text-muted-foreground font-medium">Streak</span>
          </div>
          <p className="text-3xl font-bold">{stats.streak}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{stats.streak === 1 ? 'day' : 'days'} in a row</p>
        </div>

        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={16} className="text-success" />
            <span className="text-xs text-muted-foreground font-medium">Rate</span>
          </div>
          <p className="text-3xl font-bold">
            {stats.totalSessions > 0 ? Math.round((stats.completedSessions / stats.totalSessions) * 100) : 0}%
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">completion rate</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Last 7 Days</h3>
        <div className="flex items-end gap-2 h-28">
          {stats.last7.map((d: any, i: number) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-foreground">{d.count || ''}</span>
              <div className="w-full rounded-lg bg-secondary overflow-hidden" style={{ height: '80px' }}>
                <div
                  className="w-full bg-primary rounded-lg transition-all duration-500"
                  style={{
                    height: d.count > 0 ? `${Math.max((d.count / maxBar) * 100, 12)}%` : '0%',
                    marginTop: d.count > 0 ? `${100 - Math.max((d.count / maxBar) * 100, 12)}%` : '100%',
                  }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {stats.muscleGroups && stats.muscleGroups.length > 0 && (
        <div className="bg-card rounded-2xl p-4 border border-border space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Muscle Groups</h3>
          <div className="space-y-2">
            {stats.muscleGroups.map((mg: any) => {
              const maxCount = stats.muscleGroups[0].count;
              const pct = (mg.count / maxCount) * 100;
              return (
                <div key={mg.name} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${getMuscleGroupColor(mg.name)}`}>
                      {mg.name}
                    </span>
                    <span className="text-xs text-muted-foreground">{mg.count} sessions</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

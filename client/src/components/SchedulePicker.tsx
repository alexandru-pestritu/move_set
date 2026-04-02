import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { Plus, Trash2, CalendarDays, Repeat } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SchedulePicker({ workoutId }: { workoutId: number }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'weekly' | 'once'>('weekly');
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  const { data: schedules } = useQuery({
    queryKey: ['schedules', workoutId],
    queryFn: () => api.schedules.list(workoutId),
  });

  const addSchedule = useMutation({
    mutationFn: () => {
      if (mode === 'weekly') {
        return api.schedules.create({ workoutId, type: 'weekly', dayOfWeek: selectedDay });
      }
      return api.schedules.create({ workoutId, type: 'once', specificDate: selectedDate });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', workoutId] });
      queryClient.invalidateQueries({ queryKey: ['schedules-upcoming'] });
      toast.success('Schedule added');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const removeSchedule = useMutation({
    mutationFn: api.schedules.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedules', workoutId] });
      queryClient.invalidateQueries({ queryKey: ['schedules-upcoming'] });
      toast.success('Schedule removed');
    },
  });

  return (
    <div className="space-y-3">
      {schedules && schedules.length > 0 && (
        <div className="space-y-2">
          {schedules.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between bg-secondary/50 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                {s.type === 'weekly' ? (
                  <Repeat size={14} className="text-primary" />
                ) : (
                  <CalendarDays size={14} className="text-primary" />
                )}
                <span className="text-sm font-medium">
                  {s.type === 'weekly'
                    ? `Every ${DAYS[s.dayOfWeek]}`
                    : new Date(s.specificDate + 'T00:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                </span>
              </div>
              <button
                onClick={() => removeSchedule.mutate(s.id)}
                className="p-1 rounded-lg hover:bg-destructive/10 transition"
              >
                <Trash2 size={12} className="text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => setMode('weekly')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
            mode === 'weekly' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
          }`}
        >
          <Repeat size={12} className="inline mr-1" />
          Weekly
        </button>
        <button
          onClick={() => setMode('once')}
          className={`flex-1 py-2 rounded-lg text-xs font-semibold transition ${
            mode === 'once' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
          }`}
        >
          <CalendarDays size={12} className="inline mr-1" />
          Specific Day
        </button>
      </div>

      {mode === 'weekly' ? (
        <div className="flex flex-wrap gap-1.5">
          {DAYS_SHORT.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedDay === i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
        />
      )}

      <button
        onClick={() => addSchedule.mutate()}
        disabled={addSchedule.isPending}
        className="w-full py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition flex items-center justify-center gap-1"
      >
        <Plus size={14} /> Add Schedule
      </button>
    </div>
  );
}

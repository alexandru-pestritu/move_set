import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { MUSCLE_GROUPS, getMuscleGroupColor, parseMuscleGroups } from '../lib/muscleGroups';

interface MuscleGroupPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function MuscleGroupPicker({ value, onChange }: MuscleGroupPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = parseMuscleGroups(value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (label: string) => {
    let next: string[];
    if (selected.some((s) => s.toLowerCase() === label.toLowerCase())) {
      next = selected.filter((s) => s.toLowerCase() !== label.toLowerCase());
    } else {
      next = [...selected, label];
    }
    onChange(next.join(', '));
  };

  const remove = (label: string) => {
    const next = selected.filter((s) => s.toLowerCase() !== label.toLowerCase());
    onChange(next.join(', '));
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-card border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition text-left min-h-[48px]"
      >
        <div className="flex-1 flex flex-wrap gap-1.5">
          {selected.length === 0 ? (
            <span className="text-muted-foreground text-sm">Select muscle groups...</span>
          ) : (
            selected.map((mg) => (
              <span
                key={mg}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getMuscleGroupColor(mg)}`}
              >
                {mg}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(mg);
                  }}
                  className="hover:opacity-70 transition"
                >
                  <X size={12} />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown size={16} className={`text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-xl py-1 max-h-60 overflow-y-auto">
          {MUSCLE_GROUPS.map(({ label, color }) => {
            const isSelected = selected.some((s) => s.toLowerCase() === label.toLowerCase());
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggle(label)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition ${
                  isSelected ? 'bg-primary/10' : 'hover:bg-secondary'
                }`}
              >
                <span className={`inline-block w-2 h-2 rounded-full ${color.split(' ')[0].replace('/20', '')}`} />
                <span className="flex-1">{label}</span>
                {isSelected && (
                  <span className="text-xs text-primary font-medium">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

import { useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  confirmMessage?: string;
  showDesktopButton?: boolean;
}

export default function SwipeToDelete({ children, onDelete, confirmMessage, showDesktopButton = true }: SwipeToDeleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const threshold = 80;

  const handleDelete = () => {
    const msg = confirmMessage || 'Delete this item?';
    if (confirm(msg)) {
      onDelete();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = 0;
    setSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swiping) return;
    const diff = startXRef.current - e.touches[0].clientX;
    currentXRef.current = diff;
    if (diff > 0) {
      setOffset(Math.min(diff, 100));
    } else {
      setOffset(0);
    }
  };

  const handleTouchEnd = () => {
    setSwiping(false);
    if (currentXRef.current >= threshold) {
      setOffset(100);
      handleDelete();
      setOffset(0);
    } else {
      setOffset(0);
    }
  };

  return (
    <div className="relative group overflow-hidden md:overflow-visible rounded-2xl">
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive transition-all duration-200 rounded-r-2xl md:hidden"
        style={{ width: `${Math.max(offset, 0)}px` }}
      >
        {offset > 30 && <Trash2 size={18} className="text-white" />}
      </div>
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative transition-transform duration-200 md:!transform-none"
        style={{
          transform: `translateX(-${offset}px)`,
          transitionDuration: swiping ? '0ms' : '200ms',
        }}
      >
        {children}
      </div>
      {showDesktopButton && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          className="hidden md:flex absolute top-3 right-3 p-2 rounded-lg hover:bg-destructive/10 transition opacity-0 group-hover:opacity-100"
          title="Delete"
        >
          <Trash2 size={14} className="text-destructive" />
        </button>
      )}
    </div>
  );
}

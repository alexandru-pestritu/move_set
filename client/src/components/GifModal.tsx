import { useEffect } from 'react';
import { X } from 'lucide-react';

interface GifModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function GifModal({ src, alt, onClose }: GifModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition z-10"
      >
        <X size={24} className="text-white" />
      </button>
      <div className="px-4 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <img
          src={src}
          alt={alt}
          className="w-full rounded-2xl shadow-2xl"
        />
        <p className="text-center text-white/80 text-sm mt-3 font-medium">{alt}</p>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  durationSeconds?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  message,
  onUndo,
  onDismiss,
  durationSeconds = 10,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(durationSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onDismiss();
      return;
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft, onDismiss]);

  const progressPercent = (secondsLeft / durationSeconds) * 100;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md bg-deepOlive text-cream p-4 rounded-20 shadow-2xl border-2 border-saffron animate-bounce-short"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <p className="font-bold text-base sm:text-lg">{message}</p>
          <p className="text-xs text-saffron font-medium">{secondsLeft}s me gayab ho jayega</p>
        </div>

        <button
          onClick={onUndo}
          className="flex items-center gap-2 bg-saffron text-deepOlive font-bold px-4 py-2 rounded-16 shadow hover:bg-saffron-light active:scale-95 transition-all text-sm sm:text-base"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Wapas karein (Undo)</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-zinc-700 h-1.5 rounded-full mt-3 overflow-hidden">
        <div
          className="bg-saffron h-full transition-all duration-1000 ease-linear rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

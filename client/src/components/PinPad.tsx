import React, { useState, useEffect } from 'react';
import { Delete, X } from 'lucide-react';

interface PinPadProps {
  onComplete: (pin: string) => void;
  error?: string | null;
  lockedUntil?: string | null;
  onClearError?: () => void;
  expectedLength?: number;
}

export const PinPad: React.FC<PinPadProps> = ({
  onComplete,
  error,
  lockedUntil,
  onClearError,
  expectedLength = 4,
}) => {
  const [pin, setPin] = useState<string>('');
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<string | null>(null);

  // Lockout countdown
  useEffect(() => {
    if (!lockedUntil) {
      setRemainingTime(null);
      return;
    }

    const checkLock = () => {
      const lockMs = new Date(lockedUntil).getTime() - Date.now();
      if (lockMs <= 0) {
        setRemainingTime(null);
      } else {
        const mins = Math.floor(lockMs / 60000);
        const secs = Math.floor((lockMs % 60000) / 1000);
        setRemainingTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  // Shake on error
  useEffect(() => {
    if (error) {
      setIsShaking(true);
      setPin('');
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDigit = (digit: string) => {
    if (remainingTime) return;
    if (onClearError) onClearError();
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === expectedLength) {
        onComplete(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (remainingTime) return;
    if (onClearError) onClearError();
    setPin((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (remainingTime) return;
    if (onClearError) onClearError();
    setPin('');
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col items-center">
      {/* Lockout Warning Banner */}
      {remainingTime && (
        <div className="w-full bg-danger text-cream p-4 rounded-20 text-center mb-6 shadow-md">
          <p className="font-bold text-lg">🔒 Profile Suraksha Lock</p>
          <p className="text-sm mt-1">Galat PIN zyada baar dala gaya.</p>
          <p className="text-2xl font-mono font-bold mt-2">{remainingTime} baki</p>
        </div>
      )}

      {/* Error Message */}
      {error && !remainingTime && (
        <div className="w-full bg-danger/10 border-2 border-danger text-danger p-3 rounded-20 text-center mb-4 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* PIN Dot Indicators */}
      <div
        className={`flex justify-center gap-4 my-6 ${
          isShaking ? 'animate-shake' : ''
        }`}
      >
        {Array.from({ length: expectedLength }).map((_, idx) => (
          <div
            key={idx}
            className={`w-6 h-6 rounded-full border-2 transition-all duration-200 ${
              idx < pin.length
                ? 'bg-terracotta border-terracotta scale-110'
                : 'bg-white dark:bg-zinc-700 border-borderMuted dark:border-zinc-600'
            }`}
          />
        ))}
      </div>

      {/* Keypad Grid (3x4) */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            disabled={!!remainingTime}
            className="h-16 text-2xl font-bold font-heading rounded-20 bg-white dark:bg-zinc-800 text-deepOlive dark:text-cream border border-borderMuted shadow-sm hover:bg-sage active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
          >
            {digit}
          </button>
        ))}

        <button
          onClick={handleClear}
          disabled={!!remainingTime || pin.length === 0}
          aria-label="Clear PIN"
          className="h-16 text-lg font-bold rounded-20 bg-cream dark:bg-zinc-700 text-deepOlive dark:text-cream border border-borderMuted hover:bg-red-50 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
        >
          <X className="w-6 h-6" />
        </button>

        <button
          onClick={() => handleDigit('0')}
          disabled={!!remainingTime}
          className="h-16 text-2xl font-bold font-heading rounded-20 bg-white dark:bg-zinc-800 text-deepOlive dark:text-cream border border-borderMuted shadow-sm hover:bg-sage active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
        >
          0
        </button>

        <button
          onClick={handleDelete}
          disabled={!!remainingTime || pin.length === 0}
          aria-label="Backspace"
          className="h-16 text-lg font-bold rounded-20 bg-cream dark:bg-zinc-700 text-deepOlive dark:text-cream border border-borderMuted hover:bg-yellow-50 active:scale-95 transition-all flex items-center justify-center disabled:opacity-40"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>

      {pin.length > 0 && pin.length >= 4 && pin.length < 6 && (
        <button
          onClick={() => onComplete(pin)}
          className="mt-6 w-full py-3 bg-terracotta text-cream font-bold rounded-20 shadow-md hover:bg-terracotta-dark active:scale-95 transition-all"
        >
          Aage Badhein →
        </button>
      )}
    </div>
  );
};

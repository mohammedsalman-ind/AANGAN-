import React from 'react';
import { useLanguage } from '../context/LanguageContext.js';
import type { LanguageMode } from '@aangan/shared';
import { Globe } from 'lucide-react';

interface LanguageSwitcherProps {
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className = '',
  showIcon = true,
  size = 'md',
}) => {
  const { language, setLanguage } = useLanguage();

  const options: Array<{ id: LanguageMode; label: string; native: string }> = [
    { id: 'hinglish', label: 'Hinglish', native: 'Hinglish' },
    { id: 'hindi', label: 'Hindi', native: 'हिंदी' },
    { id: 'english', label: 'English', native: 'English' },
  ];

  const sizeClasses = {
    sm: 'text-xs py-1 px-2.5',
    md: 'text-sm py-1.5 px-3',
    lg: 'text-base py-2 px-4',
  };

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className={`inline-flex items-center bg-white dark:bg-zinc-800 p-1 rounded-24 border border-borderMuted dark:border-zinc-700 shadow-sm ${className}`}
    >
      {showIcon && (
        <span className="pl-2 pr-1 text-terracotta flex items-center justify-center" aria-hidden="true">
          <Globe className="w-4 h-4" />
        </span>
      )}

      <div className="flex items-center gap-1">
        {options.map((opt) => {
          const isActive = language === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setLanguage(opt.id)}
              aria-pressed={isActive}
              className={`rounded-20 font-bold transition-all duration-200 select-none ${sizeClasses[size]} ${
                isActive
                  ? 'bg-terracotta text-cream shadow-sm scale-105'
                  : 'text-deepOlive dark:text-cream hover:bg-cream dark:hover:bg-zinc-700 opacity-75 hover:opacity-100'
              }`}
            >
              <span>{opt.native}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Eye, Sun, Moon, Type, Globe, X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.js';
import { useLanguage } from '../context/LanguageContext.js';

export const AccessibilityWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    fontSize,
    increaseFontSize,
    decreaseFontSize,
    highContrast,
    toggleHighContrast,
    darkMode,
    toggleDarkMode,
  } = useTheme();
  const { language, setLanguage } = useLanguage();

  return (
    <div className="fixed top-4 right-4 z-40">
      {/* Floating Pill Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Accessibility & Display settings"
        className="flex items-center gap-2 bg-white dark:bg-zinc-800 text-deepOlive dark:text-cream px-3 py-2 sm:px-4 sm:py-2.5 rounded-full shadow-lg border border-borderMuted hover:border-terracotta active:scale-95 transition-all text-sm font-bold"
      >
        <Eye className="w-5 h-5 text-terracotta" />
        <span className="hidden sm:inline">Aa / Display</span>
      </button>

      {/* Popover Controls Modal */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-800 p-5 rounded-30 shadow-2xl border-2 border-terracotta text-deepOlive dark:text-cream animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between pb-3 border-b border-borderMuted mb-4">
            <h3 className="font-heading font-bold text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-terracotta" /> Dekhne ki Suvidha
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-cream dark:hover:bg-zinc-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Text Size Controls */}
          <div className="mb-4">
            <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
              <Type className="w-4 h-4 text-terracotta" /> Akshar ka Size ({fontSize}px)
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={decreaseFontSize}
                disabled={fontSize <= 16}
                className="flex-1 py-2 rounded-16 bg-cream dark:bg-zinc-700 font-bold text-lg hover:bg-sage disabled:opacity-40"
              >
                A -
              </button>
              <button
                onClick={increaseFontSize}
                disabled={fontSize >= 28}
                className="flex-1 py-2 rounded-16 bg-cream dark:bg-zinc-700 font-bold text-lg hover:bg-sage disabled:opacity-40"
              >
                A +
              </button>
            </div>
          </div>

          {/* High Contrast Toggle */}
          <div className="mb-4">
            <button
              onClick={toggleHighContrast}
              className={`w-full py-2.5 px-3 rounded-20 font-bold flex items-center justify-between transition-all ${
                highContrast
                  ? 'bg-black text-white border-2 border-white'
                  : 'bg-cream dark:bg-zinc-700 hover:bg-sage text-deepOlive dark:text-cream'
              }`}
            >
              <span>High Contrast (Bada Saf)</span>
              <span>{highContrast ? 'ON ✓' : 'OFF'}</span>
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <div className="mb-4">
            <button
              onClick={toggleDarkMode}
              className="w-full py-2.5 px-3 rounded-20 font-bold flex items-center justify-between bg-cream dark:bg-zinc-700 hover:bg-sage text-deepOlive dark:text-cream transition-all"
            >
              <span className="flex items-center gap-2">
                {darkMode ? <Sun className="w-4 h-4 text-saffron" /> : <Moon className="w-4 h-4" />}
                Dark Theme
              </span>
              <span>{darkMode ? 'ON ✓' : 'OFF'}</span>
            </button>
          </div>

          {/* Language Selector */}
          <div>
            <label className="text-sm font-semibold mb-2 block flex items-center gap-2">
              <Globe className="w-4 h-4 text-terracotta" /> Bhasha (Language)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['hinglish', 'hindi', 'english'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`py-2 text-xs font-bold rounded-16 transition-all ${
                    language === lang
                      ? 'bg-terracotta text-cream shadow-sm'
                      : 'bg-cream dark:bg-zinc-700 hover:bg-sage text-deepOlive dark:text-cream'
                  }`}
                >
                  {lang === 'hinglish' ? 'Hinglish' : lang === 'hindi' ? 'हिंदी' : 'English'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

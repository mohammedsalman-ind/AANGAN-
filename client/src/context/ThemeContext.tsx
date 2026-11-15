import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  fontSize: number;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  highContrast: boolean;
  toggleHighContrast: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<number>(() => {
    return Number(localStorage.getItem('aangan_fontsize')) || 20;
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('aangan_contrast') === 'true';
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('aangan_dark') === 'true';
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--font-size-base', `${fontSize}px`);
    localStorage.setItem('aangan_fontsize', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    if (highContrast) {
      document.documentElement.classList.add('theme-high-contrast');
    } else {
      document.documentElement.classList.remove('theme-high-contrast');
    }
    localStorage.setItem('aangan_contrast', highContrast.toString());
  }, [highContrast]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('theme-dark');
    } else {
      document.documentElement.classList.remove('theme-dark');
    }
    localStorage.setItem('aangan_dark', darkMode.toString());
  }, [darkMode]);

  const setFontSize = (size: number) => {
    const clamped = Math.min(28, Math.max(16, size));
    setFontSizeState(clamped);
  };

  const increaseFontSize = () => setFontSize(fontSize + 2);
  const decreaseFontSize = () => setFontSize(fontSize - 2);
  const toggleHighContrast = () => setHighContrast((prev) => !prev);
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  return (
    <ThemeContext.Provider
      value={{
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        highContrast,
        toggleHighContrast,
        darkMode,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

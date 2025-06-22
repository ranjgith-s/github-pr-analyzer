import React, { createContext, useContext, useEffect, useState } from 'react';
import { HeroUIProvider } from '@heroui/react';

export type ColorMode = 'day' | 'night';

interface ThemeModeContextValue {
  colorMode: ColorMode;
  toggleColorMode: () => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(
  undefined
);

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const STORAGE_KEY = 'colorMode';

  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'day' || stored === 'night') {
      return stored;
    }
    const prefersDark =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'night' : 'day';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, colorMode);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', colorMode === 'night');
    }
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode((m) => (m === 'day' ? 'night' : 'day'));
  };

  return (
    <ThemeModeContext.Provider value={{ colorMode, toggleColorMode }}>
      <HeroUIProvider>{children}</HeroUIProvider>
    </ThemeModeContext.Provider>
  );
};

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx)
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}

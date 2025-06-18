import React, { createContext, useContext, useEffect, useState } from 'react';
import { ThemeProvider } from '@primer/react';

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
  const [colorMode, setColorMode] = useState<ColorMode>(() => {
    const stored = localStorage.getItem('colorMode');
    return stored === 'night' ? 'night' : 'day';
  });

  useEffect(() => {
    localStorage.setItem('colorMode', colorMode);
  }, [colorMode]);

  const toggleColorMode = () => {
    setColorMode((m) => (m === 'day' ? 'night' : 'day'));
  };

  return (
    <ThemeModeContext.Provider value={{ colorMode, toggleColorMode }}>
      <ThemeProvider colorMode={colorMode}>{children}</ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export function useThemeMode() {
  const ctx = useContext(ThemeModeContext);
  if (!ctx)
    throw new Error('useThemeMode must be used within ThemeModeProvider');
  return ctx;
}

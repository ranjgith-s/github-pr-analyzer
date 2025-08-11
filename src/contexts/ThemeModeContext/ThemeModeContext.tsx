import React, { createContext, useContext, useEffect, useState } from 'react';
// Removed HeroUIProvider; shadcn/ui relies only on Tailwind + CSS vars. This provider now only manages color mode.

// Context for color mode (day/night)
const ThemeModeContext = createContext<{
  colorMode: 'day' | 'night';
  toggleColorMode: () => void;
}>({
  colorMode: 'day',
  toggleColorMode: () => {},
});

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [colorMode, setColorMode] = useState<'day' | 'night'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('colorMode') as 'day' | 'night') || 'day';
    }
    return 'day';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', colorMode === 'night');
    localStorage.setItem('colorMode', colorMode);
  }, [colorMode]);

  const toggleColorMode = () =>
    setColorMode((m) => (m === 'day' ? 'night' : 'day'));

  return (
    <ThemeModeContext.Provider value={{ colorMode, toggleColorMode }}>
      {children}
    </ThemeModeContext.Provider>
  );
};

export const useThemeMode = () => useContext(ThemeModeContext);

export default ThemeModeProvider;

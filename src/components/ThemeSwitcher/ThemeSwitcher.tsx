import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '../ui';

// Theme persistence key per shadcn/ui Vite guide
const storageKey = 'vite-ui-theme';

type Theme = 'light' | 'dark';

export function getInitialIsDark(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(storageKey) as Theme | null;
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;
  return stored === 'dark' || (!stored && systemPrefersDark);
}

export function setTheme(next: Theme) {
  localStorage.setItem(storageKey, next);
  document.documentElement.classList.toggle('dark', next === 'dark');
}

export default function ThemeSwitcher() {
  const [isDark, setIsDark] = React.useState<boolean>(() => getInitialIsDark());

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggle = () => {
    const next: Theme = isDark ? 'light' : 'dark';
    setTheme(next);
    setIsDark(next === 'dark');
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      className="relative"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

import React from 'react';
import { HeroUIProvider } from '@heroui/system';

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return <HeroUIProvider>{children}</HeroUIProvider>;
};

export function useThemeMode() {
  throw new Error('Theme mode is not supported.');
}

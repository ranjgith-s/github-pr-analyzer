import React from 'react';
import { Button } from '@primer/react';
import { MoonIcon, SunIcon } from '@primer/octicons-react';
import { useThemeMode } from './ThemeModeContext';

export default function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useThemeMode();
  const isDay = colorMode === 'day';
  return (
    <Button
      size="small"
      onClick={toggleColorMode}
      aria-label={`Switch to ${isDay ? 'dark' : 'light'} mode`}
      leadingIcon={isDay ? MoonIcon : SunIcon}
      sx={{ width: 80 }}
    >
      {isDay ? 'Dark' : 'Light'}
    </Button>
  );
}

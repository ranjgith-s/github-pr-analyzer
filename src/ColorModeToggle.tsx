import React from 'react';
import { MoonIcon, SunIcon } from '@primer/octicons-react';
import { useThemeMode } from './ThemeModeContext';

export default function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useThemeMode();
  const isDay = colorMode === 'day';
  return (
    <button
      role="switch"
      aria-checked={!isDay}
      onClick={toggleColorMode}
      aria-label={`Switch to ${isDay ? 'dark' : 'light'} mode`}
      className={`color-mode-switch${isDay ? '' : ' night'}`}
    >
      <SunIcon />
      <MoonIcon />
      <span className="color-mode-switch-thumb" />
    </button>
  );
}

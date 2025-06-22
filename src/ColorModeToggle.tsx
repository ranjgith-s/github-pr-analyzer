import React from 'react';
import { MoonIcon, SunIcon } from '@primer/octicons-react';
import { ToggleSwitch } from '@primer/react';
import { useThemeMode } from './ThemeModeContext';

export default function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useThemeMode();
  const isNight = colorMode === 'night';

  return (
    <ToggleSwitch
      aria-label={`Switch to ${isNight ? 'light' : 'dark'} mode`}
      checked={isNight}
      onClick={toggleColorMode}
      size="small"
    >
      {isNight ? <MoonIcon /> : <SunIcon />}
    </ToggleSwitch>
  );
}

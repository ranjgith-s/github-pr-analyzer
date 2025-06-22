import React from 'react';
import { MoonIcon, SunIcon } from '@primer/octicons-react';
import { useThemeMode } from './ThemeModeContext';

export default function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useThemeMode();
  const isNight = colorMode === 'night';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isNight}
      onClick={toggleColorMode}
      aria-label={`Switch to ${isNight ? 'light' : 'dark'} mode`}
      className={`color-mode-switch${isNight ? ' night' : ''}`}
    >
      <span className="color-mode-switch-thumb">
        {isNight ? (
          <MoonIcon className="color-mode-icon" />
        ) : (
          <SunIcon className="color-mode-icon" />
        )}
      </span>
    </button>
  );
}

import React from 'react';
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid';
import { useThemeMode } from './ThemeModeContext';

export default function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useThemeMode();
  const isNight = colorMode === 'night';

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleColorMode();
    }
  };

  return (
    <div
      role="switch"
      tabIndex={0}
      aria-checked={isNight}
      onClick={toggleColorMode}
      onKeyDown={handleKeyDown}
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
    </div>
  );
}

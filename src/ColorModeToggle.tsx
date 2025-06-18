import React from 'react';
import { MoonIcon, SunIcon } from '@primer/octicons-react';
import { useThemeMode } from './ThemeModeContext';

export default function ColorModeToggle() {
  const { colorMode, toggleColorMode } = useThemeMode();
  const isDay = colorMode === 'day';

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
      aria-checked={!isDay}
      onClick={toggleColorMode}
      onKeyDown={handleKeyDown}
      aria-label={`Switch to ${isDay ? 'dark' : 'light'} mode`}
      className={`color-mode-switch${isDay ? '' : ' night'}`}
    >
      <span className="color-mode-switch-thumb">
        {isDay ? (
          <SunIcon className="color-mode-icon" />
        ) : (
          <MoonIcon className="color-mode-icon" />
        )}
      </span>
    </div>
  );
}

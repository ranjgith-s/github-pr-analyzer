import React from 'react';
import { useThemeMode } from './ThemeModeContext';

const ColorModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useThemeMode();
  const isNight = colorMode === 'night';
  return (
    <button
      role="switch"
      aria-checked={isNight}
      aria-label={isNight ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggleColorMode}
      style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
    >
      {isNight ? '🌙 Night' : '☀️ Day'}
    </button>
  );
};

export default ColorModeToggle;

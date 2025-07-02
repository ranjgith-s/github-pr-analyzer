import React from 'react';
import { Switch } from '@heroui/react';
import { useThemeMode } from '../../contexts/ThemeModeContext/ThemeModeContext';

const ColorModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useThemeMode();
  const isNight = colorMode === 'night';
  return (
    <Switch
      isSelected={isNight}
      onChange={toggleColorMode}
      aria-label={isNight ? 'Switch to light mode' : 'Switch to dark mode'}
      className="px-3 py-2 rounded border border-divider"
    >
      {isNight ? '🌙 Night' : '☀️ Day'}
    </Switch>
  );
};

export default ColorModeToggle;

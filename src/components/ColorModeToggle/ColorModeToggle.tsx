import React from 'react';
import { Switch } from '../ui';
import { useThemeMode } from '../../contexts/ThemeModeContext/ThemeModeContext';

const ColorModeToggle: React.FC = () => {
  const { colorMode, toggleColorMode } = useThemeMode();
  const isNight = colorMode === 'night';
  return (
    <Switch
      checked={isNight}
      onCheckedChange={() => toggleColorMode()}
      aria-label={isNight ? 'Switch to light mode' : 'Switch to dark mode'}
      className="px-3 py-2 border border-border"
    />
  );
};

export default ColorModeToggle;

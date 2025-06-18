import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ThemeModeProvider, useThemeMode } from '../ThemeModeContext';

test('toggles color mode', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeModeProvider>{children}</ThemeModeProvider>
  );
  const { result } = renderHook(() => useThemeMode(), { wrapper });

  expect(result.current.colorMode).toBe('day');
  act(() => result.current.toggleColorMode());
  expect(result.current.colorMode).toBe('night');
});

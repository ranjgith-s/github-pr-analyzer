import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ThemeModeProvider, useThemeMode } from '../ThemeModeContext';

afterEach(() => {
  localStorage.clear();
});

test('toggles color mode', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeModeProvider>{children}</ThemeModeProvider>
  );
  const { result } = renderHook(() => useThemeMode(), { wrapper });

  expect(result.current.colorMode).toBe('day');
  act(() => result.current.toggleColorMode());
  expect(result.current.colorMode).toBe('night');
});

test('reads initial mode from localStorage', () => {
  localStorage.setItem('colorMode', 'night');
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <ThemeModeProvider>{children}</ThemeModeProvider>
  );
  const { result } = renderHook(() => useThemeMode(), { wrapper });
  expect(result.current.colorMode).toBe('night');
});

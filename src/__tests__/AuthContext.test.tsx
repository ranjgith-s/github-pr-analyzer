import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

test('login and logout updates token', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <AuthProvider>{children}</AuthProvider>
  );
  const { result } = renderHook(() => useAuth(), { wrapper });

  act(() => result.current.login('abc'));
  expect(result.current.token).toBe('abc');

  act(() => result.current.logout());
  expect(result.current.token).toBeNull();
});

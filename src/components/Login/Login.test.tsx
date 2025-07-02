import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { AuthProvider, useAuth } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import { MemoryRouter } from 'react-router-dom';
import * as authService from '../../utils/services/auth';

jest.mock('../../utils/services/auth');

test('login submits provided token', async () => {
  (authService.validateToken as jest.Mock).mockResolvedValue({
    login: 'me',
    avatar_url: 'img',
  });

  let ctx: ReturnType<typeof useAuth> | undefined;
  function Wrapper() {
    ctx = useAuth();
    return <Login />;
  }
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeModeProvider>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  const input = screen.getByLabelText(/personal access token/i);
  const user = userEvent.setup();
  await act(async () => {
    await user.type(input, 'token123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
  });
  await waitFor(() => expect(ctx!.token).toBe('token123'));
});

test('shows error when token is invalid', async () => {
  (authService.validateToken as jest.Mock).mockRejectedValue(new Error('bad'));

  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeModeProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  const user = userEvent.setup();
  await act(async () => {
    await user.type(screen.getByLabelText(/personal access token/i), 'bad');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
  });
  await waitFor(() =>
    expect(screen.getByText(/invalid token/i)).toBeInTheDocument()
  );
});

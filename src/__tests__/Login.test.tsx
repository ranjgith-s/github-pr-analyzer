import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import { AuthProvider, useAuth } from '../AuthContext';
import { ThemeModeProvider } from '../ThemeModeContext';
import { MemoryRouter } from 'react-router-dom';
import * as authService from '../services/auth';

jest.mock('../services/auth');

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
    <ThemeModeProvider>
      <AuthProvider>
        <MemoryRouter>
          <Wrapper />
        </MemoryRouter>
      </AuthProvider>
    </ThemeModeProvider>
  );
  const input = screen.getByPlaceholderText(/github token/i);
  const user = userEvent.setup();
  await user.type(input, 'token123');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  await waitFor(() => expect(ctx!.token).toBe('token123'));
});

test('shows error when token is invalid', async () => {
  (authService.validateToken as jest.Mock).mockRejectedValue(new Error('bad'));

  render(
    <ThemeModeProvider>
      <AuthProvider>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthProvider>
    </ThemeModeProvider>
  );
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText(/github token/i), 'bad');
  await user.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() =>
    expect(screen.getByText(/invalid token/i)).toBeInTheDocument()
  );
});

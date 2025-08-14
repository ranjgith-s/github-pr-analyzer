import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { AuthProvider, useAuth } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import { MemoryRouter } from 'react-router-dom';

jest.mock('@/lib/supabaseClient');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const supabase = require('@/lib/supabaseClient').default;

beforeEach(() => {
  supabase.auth.__setSession(null);
  localStorage.clear();
});

test('clicking Continue with GitHub triggers OAuth and token is picked from session', async () => {
  const TokenProbe = () => {
    const { token } = useAuth();
    return <div data-testid="tok">{token}</div>;
  };
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeModeProvider>
        <AuthProvider>
          <Login />
          <TokenProbe />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );

  const user = userEvent.setup();
  await act(async () => {
    await user.click(
      screen.getByRole('button', { name: /continue with github/i })
    );
  });
  expect(supabase.auth.signInWithOAuth).toHaveBeenCalled();
  await waitFor(() => {
    expect(screen.getByTestId('tok').textContent).toBe('token123');
  });
});

test('shows error when OAuth fails', async () => {
  (supabase.auth.signInWithOAuth as jest.Mock).mockResolvedValueOnce({
    data: {},
    error: { message: 'oops' },
  });

  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeModeProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  const user = userEvent.setup();
  await act(async () => {
    await user.click(
      screen.getByRole('button', { name: /continue with github/i })
    );
  });
  await waitFor(() => expect(screen.getByText('oops')).toBeInTheDocument());
});

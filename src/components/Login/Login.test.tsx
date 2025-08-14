import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from './Login';
import { AuthProvider, useAuth } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

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

test('on redirect with code, exchanges for session and cleans URL; handles exchange error', async () => {
  // Simulate redirect URL with code
  const replaceSpy = jest.spyOn(window.history, 'replaceState');
  window.history.pushState({}, '', '/login?code=abc');

  // First render: successful exchange (mocked in supabase mock)
  render(
    <MemoryRouter>
      <ThemeModeProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  await waitFor(() => expect(replaceSpy).toHaveBeenCalled());

  // Now simulate exchange throwing
  (supabase.auth.exchangeCodeForSession as jest.Mock).mockRejectedValueOnce(
    new Error('nope')
  );
  window.history.pushState({}, '', '/login?code=def');
  render(
    <MemoryRouter>
      <ThemeModeProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  await waitFor(() => expect(screen.getByText(/nope/)).toBeInTheDocument());
});

test('early effect return when no code/no error in URL', async () => {
  // Ensure URL has no code or error
  window.history.pushState({}, '', '/login');
  (supabase.auth.exchangeCodeForSession as jest.Mock).mockClear();
  render(
    <MemoryRouter>
      <ThemeModeProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  // exchangeCodeForSession should not be called
  await waitFor(() => {
    expect(supabase.auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
});

test('if already authenticated, navigates to /', async () => {
  // Place a session in supabase mock so token exists
  supabase.auth.__setSession({ provider_token: 't' });
  render(
    <MemoryRouter initialEntries={['/login']}>
      <ThemeModeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<div>home</div>} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  await waitFor(() => expect(screen.getByText('home')).toBeInTheDocument());
});

test('on redirect, exchange resolves with error sets message', async () => {
  (supabase.auth.exchangeCodeForSession as jest.Mock).mockClear();
  (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValueOnce({
    data: {},
    error: { message: 'bad' },
  });
  window.history.pushState({}, '', '/login?code=123');
  render(
    <MemoryRouter>
      <ThemeModeProvider>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  await waitFor(() => expect(screen.getByText('bad')).toBeInTheDocument());
});

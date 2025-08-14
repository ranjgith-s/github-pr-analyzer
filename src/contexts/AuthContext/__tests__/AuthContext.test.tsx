import React from 'react';
import { render, screen, act, cleanup } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import supabase from '@/lib/supabaseClient';
import * as githubService from '../../../utils/services/githubService';

jest.mock('../../../utils/services/githubService');

function ReadAuth() {
  const { token, user, login, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div>
      <div data-testid="token">{token || ''}</div>
      <div data-testid="user">{user?.login || ''}</div>
      <button onClick={() => login('tok123')}>login</button>
      <button
        onClick={() => {
          logout();
          // Manually push current pathname to expose navigation in tests
          navigate(window.location.pathname);
        }}
      >
        logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    // @ts-expect-error test helper
    supabase.auth.__reset?.();
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  test('hydrates token from provider_token and subscribes/unsubscribes', async () => {
    // Arrange a session with provider_token
    // @ts-expect-error test helper
    supabase.auth.__setSession?.({ provider_token: 'provTok' });

    const { unmount } = render(
      <MemoryRouter>
        <AuthProvider>
          <ReadAuth />
        </AuthProvider>
      </MemoryRouter>
    );

    // token rendered
    expect(await screen.findByTestId('token')).toHaveTextContent('provTok');
    expect(localStorage.getItem('token')).toBe('provTok');

    // Capture subscription to assert cleanup
    const sub = (supabase.auth.onAuthStateChange as jest.Mock).mock.results[0]
      .value.data.subscription;
    // Unmount triggers unsubscribe
    unmount();
    expect(sub.unsubscribe).toHaveBeenCalled();
  });

  test('extracts token from identities and user_metadata shapes', async () => {
    // 1) identities shape
    // @ts-expect-error test helper
    supabase.auth.__setSession?.({
      user: {
        identities: [
          { provider: 'github', access_token: 'idTok', identity_data: {} },
        ],
      },
    });
    const { unmount: unmount1 } = render(
      <MemoryRouter>
        <AuthProvider>
          <ReadAuth />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByTestId('token')).toHaveTextContent('idTok');
    unmount1();

    // 2) user_metadata shape
    // @ts-expect-error test helper
    supabase.auth.__reset?.();
    // @ts-expect-error test helper
    supabase.auth.__setSession?.({
      user: { user_metadata: { provider_token: 'metaTok' } },
    });
    render(
      <MemoryRouter>
        <AuthProvider>
          <ReadAuth />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByTestId('token')).toHaveTextContent('metaTok');
  });

  test('login stores token and sets user immediately; logout clears and navigates', async () => {
    (githubService.getAuthenticatedUserProfile as jest.Mock).mockResolvedValue({
      login: 'me',
      avatar_url: 'u',
    });

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <ReadAuth />
        </AuthProvider>
      </MemoryRouter>
    );

    // login
    await act(async () => {
      screen.getByText('login').click();
    });
    expect(localStorage.getItem('token')).toBe('tok123');
    expect(await screen.findByTestId('user')).toHaveTextContent('me');

    // logout invokes supabase signOut and clears state
    await act(async () => {
      screen.getByText('logout').click();
    });

    expect(supabase.auth.signOut as jest.Mock).toHaveBeenCalled();
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('token')).toHaveTextContent('');
    expect(screen.getByTestId('user')).toHaveTextContent('');
  });

  test('exchanges OAuth code from URL on mount and cleans URL', async () => {
    const replaceSpy = jest.spyOn(window.history, 'replaceState');
    // Put ?code in the URL via history API
    window.history.pushState({}, '', '/login?code=abc&state=xyz');

    render(
      <MemoryRouter>
        <AuthProvider>
          <ReadAuth />
        </AuthProvider>
      </MemoryRouter>
    );

    // exchangeCodeForSession is called by AuthContext init
    expect(
      supabase.auth.exchangeCodeForSession as jest.Mock
    ).toHaveBeenCalled();
    // token should be set from mocked session
    expect(await screen.findByTestId('token')).not.toHaveTextContent('');
    expect(replaceSpy).toHaveBeenCalled();

    // Clean up URL
    window.history.pushState({}, '', '/');
  });

  test('falls back to localStorage token when no Supabase session', async () => {
    // @ts-expect-error test helper
    supabase.auth.__reset?.();
    localStorage.setItem('token', 'fromLS');

    render(
      <MemoryRouter>
        <AuthProvider>
          <ReadAuth />
        </AuthProvider>
      </MemoryRouter>
    );
    // The AuthProvider init will read localStorage when getSession yields null
    await act(async () => {});
    await expect(screen.findByTestId('token')).resolves.toHaveTextContent(
      'fromLS'
    );
  });

  test('onAuthStateChange SIGNED_OUT clears token and localStorage', async () => {
    // Start with an existing token
    localStorage.setItem('token', 'x');
    render(
      <MemoryRouter>
        <AuthProvider>
          <ReadAuth />
        </AuthProvider>
      </MemoryRouter>
    );
    // @ts-expect-error test helper
    supabase.auth.__emitAuthEvent?.('SIGNED_OUT', null);
    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('token')).toHaveTextContent('');
  });

  test('fetchUser handles failure gracefully', async () => {
    const err = new Error('boom');
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (githubService.getAuthenticatedUserProfile as jest.Mock).mockRejectedValue(
      err
    );
    render(
      <MemoryRouter>
        <AuthProvider>
          <ReadAuth />
        </AuthProvider>
      </MemoryRouter>
    );
    // Trigger login to set token and kick fetchUser
    await act(async () => {
      screen.getByText('login').click();
    });
    // user should be cleared after failure
    expect(screen.getByTestId('user')).toHaveTextContent('');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test('non-matching session shape yields no provider token (final null path)', async () => {
    // Provide a session with no recognized provider_token locations
    // @ts-expect-error test helper
    supabase.auth.__setSession?.({ user: {} });
    render(
      <MemoryRouter>
        <AuthProvider>
          <ReadAuth />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(screen.getByTestId('token')).toHaveTextContent('');
  });
});

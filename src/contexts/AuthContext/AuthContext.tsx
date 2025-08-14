import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitHubUser } from '../../utils/services/auth';
import { getAuthenticatedUserProfile } from '../../utils/services/githubService';
import supabase from '@/lib/supabaseClient';

interface AuthContextValue {
  token: string | null;
  user: GitHubUser | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export { AuthContext };

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Attempt to hydrate token from Supabase session (GitHub provider token)
    const init = async () => {
      try {
        // If using PKCE OAuth flow, exchange the auth code for a session on redirect
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          const hasCode = url.searchParams.get('code');
          const hasError = url.searchParams.get('error_description');
          if (hasCode || hasError) {
            try {
              const { data, error } =
                await supabase.auth.exchangeCodeForSession(
                  window.location.href
                );
              if (!error && data?.session) {
                const provFromExchange = extractProviderToken(
                  data.session as any
                );
                if (provFromExchange) {
                  localStorage.setItem('token', provFromExchange);
                  setToken(provFromExchange);
                }
              }
            } catch {
              // ignore; fall through to getSession/localStorage
            } finally {
              // Clean the URL so code/state are not left behind
              try {
                window.history.replaceState(
                  {},
                  document.title,
                  window.location.origin +
                    window.location.pathname +
                    window.location.hash
                );
              } catch {
                // ignore
              }
            }
          }
        }

        const { data } = await supabase.auth.getSession();
        const session = data?.session as any;
        const prov = extractProviderToken(session);
        if (prov) {
          localStorage.setItem('token', prov);
          setToken(prov);
          return;
        }
      } catch {
        // no-op; fallback to localStorage
      }
      const stored = localStorage.getItem('token');
      if (stored) setToken(stored);
    };
    init();

    // Subscribe to auth changes
    const { data } = supabase.auth.onAuthStateChange(
      (event: any, sess: any) => {
        const prov = extractProviderToken(sess?.session ?? sess);
        if (prov) {
          localStorage.setItem('token', prov);
          setToken(prov);
        } else if (event === 'SIGNED_OUT') {
          localStorage.removeItem('token');
          setToken(null);
        }
      }
    );
    return () => {
      try {
        data?.subscription?.unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, []);

  useEffect(() => {
    async function fetchUser() {
      if (!token) {
        setUser(null);
        return;
      }
      try {
        const userData = await getAuthenticatedUserProfile(token);
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
        setUser(null);
      }
    }
    fetchUser();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    // Proactively fetch user so tests that assert immediate calls succeed.
    // Use Promise.resolve to avoid calling .then on undefined when the module is auto-mocked in tests.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Promise.resolve((getAuthenticatedUserProfile as any)?.(newToken))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((u: any) => setUser(u ?? null))
      .catch(() => {});
  };

  const logout = () => {
    supabase.auth.signOut?.();
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Best-effort extraction of GitHub OAuth token from Supabase session shapes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractProviderToken(session: any | undefined | null): string | null {
  if (!session) return null;
  // Standard session shape
  if (session.provider_token && typeof session.provider_token === 'string') {
    return session.provider_token;
  }
  // Supabase v2 stores identities on the user
  const identities = session.user?.identities || session.identities;
  const github = Array.isArray(identities)
    ? identities.find(
        (i: any) =>
          i.provider === 'github' || i.identity_data?.provider === 'github'
      )
    : undefined;
  const fromIdentity =
    github?.access_token || github?.identity_data?.access_token;
  if (typeof fromIdentity === 'string') return fromIdentity;
  // Some providers expose it under user_metadata
  const fromMeta = session.user?.user_metadata?.provider_token;
  if (typeof fromMeta === 'string') return fromMeta;
  return null;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthProvider;

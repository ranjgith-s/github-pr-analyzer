import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitHubUser } from '../../utils/services/auth';
import { getAuthenticatedUserProfile } from '../../utils/services/githubService';

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
    const stored = localStorage.getItem('token');
    if (stored) setToken(stored);
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
  };

  const logout = () => {
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

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthProvider;

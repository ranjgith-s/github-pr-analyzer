import React, { useState } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import GlowingCard from './GlowingCard';
import MagicButton from './MagicButton';
import ColorModeToggle from './ColorModeToggle';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { validateToken } from './services/auth';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useMetaDescription } from './hooks/useMetaDescription';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle('Sign in to PR-ism');
  useMetaDescription(
    'Login with your GitHub token to access pull request metrics.'
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!value) return;

    try {
      await validateToken(value.trim());
      login(value.trim());
      navigate('/');
    } catch {
      setError('Invalid token. Verify the token and try again.');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      <div style={{ position: 'absolute', top: 12, right: 12 }}>
        <ColorModeToggle />
      </div>
      <GlowingCard>
        <form onSubmit={handleSubmit}>
          <h1
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              textAlign: 'center',
              marginBottom: 24,
              color: 'inherit',
            }}
          >
            <ChevronUpIcon width={24} height={24} />
            PR-ism
          </h1>
          <div>
            <label htmlFor="token-input">Personal access token</label>
            <input
              id="token-input"
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="GitHub token"
              style={{ width: '100%' }}
            />
            <span
              style={{
                display: 'block',
                fontSize: 12,
                marginTop: 4,
              }}
            >
              This token is used only in the browser.
            </span>
            <div style={{ marginTop: 8 }}>
              <details>
                <summary style={{ fontSize: 12, cursor: 'pointer' }}>
                  How to generate a personal access token
                </summary>
                <ol style={{ paddingLeft: 16, marginTop: 8 }}>
                  <li style={{ fontSize: 12 }}>
                    Visit{' '}
                    <a
                      href="https://github.com/settings/tokens"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      GitHub settings
                    </a>
                    .
                  </li>
                  <li style={{ fontSize: 12 }}>
                    Generate a new fine‑grained token with read‑only repository
                    access.
                  </li>
                  <li style={{ fontSize: 12 }}>
                    Enable SSO for your organization when prompted.
                  </li>
                  <li style={{ fontSize: 12 }}>
                    Copy the token and paste it here.
                  </li>
                </ol>
              </details>
            </div>
          </div>
          <div style={{ marginTop: 24, width: '100%' }}>
            <MagicButton type="submit" style={{ width: '100%' }}>
              Sign in
            </MagicButton>
          </div>
          {error && (
            <div
              style={{
                color: 'red',
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}
        </form>
      </GlowingCard>
    </div>
  );
}

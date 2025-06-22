import React, { useState } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/react';
import { Button } from '@heroui/react';
import { Input } from '@heroui/react';
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
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2 text-2xl font-bold">
              <ChevronUpIcon width={28} height={28} />
              PR-ism
            </div>
            <div className="text-sm text-muted-foreground text-center w-full">
              Sign in with your GitHub personal access token to continue.
            </div>
          </div>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
            <label htmlFor="token-input" className="block font-medium">
              Personal access token
            </label>
            <Input
              id="token-input"
              type="password"
              value={value}
              onChange={(e: any) => setValue(e.target.value)}
              placeholder="GitHub token"
              className="w-full"
              autoFocus
            />
            <span className="block text-xs text-muted-foreground">
              This token is used only in the browser.
            </span>
            <details className="mt-1">
              <summary className="text-xs cursor-pointer select-none">
                How to generate a personal access token
              </summary>
              <ol className="pl-4 mt-2 list-decimal space-y-1">
                <li className="text-xs">
                  Visit{' '}
                  <a
                    href="https://github.com/settings/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    GitHub settings
                  </a>
                  .
                </li>
                <li className="text-xs">
                  Generate a new fine‑grained token with read‑only repository
                  access.
                </li>
                <li className="text-xs">
                  Enable SSO for your organization when prompted.
                </li>
                <li className="text-xs">Copy the token and paste it here.</li>
              </ol>
            </details>
            {/* CardFooter content moved here for form structure */}
            <CardFooter className="flex flex-col gap-2 mt-2 p-0">
              <Button type="submit" className="w-full">
                Sign in
              </Button>
              {error && (
                <div className="text-red-600 text-center text-sm mt-2">
                  {error}
                </div>
              )}
            </CardFooter>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

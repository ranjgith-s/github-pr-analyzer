import React, { useState, type FC } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import { Button } from '../ui';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';
import supabase from '@/lib/supabaseClient';

export default function Login() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle('Sign in to PR-ism');
  useMetaDescription(
    'Login with your GitHub token to access pull request metrics.'
  );

  // If already authenticated (token present via Supabase session), redirect home
  React.useEffect(() => {
    if (token) navigate('/');
  }, [token, navigate]);

  const ErrorText: FC<{ message: string; id?: string }> = ({ message, id }) => (
    <div id={id} className="text-red-600 text-center text-sm mt-2">
      {message}
    </div>
  );

  const handleGithubSignIn = async () => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        scopes: 'repo read:user user:email',
        // Redirect back to the current page to preserve ?code until it's exchanged
        redirectTo:
          typeof window !== 'undefined' ? window.location.href : undefined,
        queryParams: { allow_signup: 'false' },
      },
    });
    if (error) setError(error.message || 'GitHub sign-in failed. Try again.');
  };

  // On redirect from GitHub, exchange the code for a session before any redirects can drop it
  React.useEffect(() => {
    const run = async () => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const err = url.searchParams.get('error_description');
      if (!code && !err) return;
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(
          window.location.href
        );
        if (error) {
          setError(error.message || 'GitHub sign-in failed. Try again.');
        } else if (data?.session) {
          // Session will be picked up by AuthContext via onAuthStateChange/getSession
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg || 'GitHub sign-in failed. Try again.');
      } finally {
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
    };
    run();
  }, []);

  return (
    <main className="px-4">
      <div>
        <header className="mb-4">
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="flex items-center gap-2 text-8xl font-bold pt-8">
              <ChevronUpIcon className="h-32 w-32" />
              PR-ism
            </div>
          </div>
        </header>
        <section className="container mx-auto max-w-6xl flex flex-col items-center gap-2 py-4 text-center md:py-4 lg:py-8 xl:gap-4">
          <h1 className="inline-block leading-tight text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] xl:text-5xl xl:tracking-tighter max-w-4xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            Actionable PR & DevOps metrics
          </h1>
          <p className="text-foreground/80 max-w-3xl text-base text-balance sm:text-lg">
            Track lead time, review time, deploy frequency, failure rate, and
            more. Start fast; tailor to your workflow.
          </p>
        </section>
      </div>
      <div className="flex items-center justify-center pb-12">
        <Button
          onClick={handleGithubSignIn}
          className="inline-flex items-center justify-center gap-2"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            aria-hidden="true"
            focusable="false"
            fill="currentColor"
          >
            <path d="M12 .296c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.011-1.04-.017-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.236 1.84 1.236 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.763-1.605-2.665-.303-5.466-1.333-5.466-5.93 0-1.31.468-2.38 1.236-3.22-.124-.303-.536-1.523.117-3.176 0 0 1.008-.322 3.3 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.045.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.653.243 2.873.12 3.176.77.84 1.235 1.91 1.235 3.22 0 4.61-2.804 5.624-5.476 5.92.43.37.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.293 0 .32.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
          </svg>
          Continue with GitHub
        </Button>
        <ErrorText message={error || ''} />
      </div>
    </main>
  );
}

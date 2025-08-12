import React, {
  useState,
  type ChangeEvent,
  type FormEvent,
  type FC,
} from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import { Button, Input } from '../ui';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { validateToken } from '../../utils/services/auth';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useMetaDescription } from '../../hooks/useMetaDescription';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  useDocumentTitle('Sign in to PR-ism');
  useMetaDescription(
    'Login with your GitHub token to access pull request metrics.'
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (error) setError(null);
  };

  const TOKEN_HELP_ID = 'token-help';
  const TOKEN_ERROR_ID = 'token-error';

  const ariaDescribedBy = `${TOKEN_HELP_ID}${error ? ` ${TOKEN_ERROR_ID}` : ''}`;

  const TokenHelpDetails: FC = () => (
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
          Generate a new fine‑grained token with read‑only repository access.
        </li>
        <li className="text-xs">
          Enable SSO for your organization when prompted.
        </li>
        <li className="text-xs">Copy the token and paste it here.</li>
      </ol>
    </details>
  );

  const ErrorText: FC<{ message: string; id?: string }> = ({ message, id }) => (
    <div id={id} className="text-red-600 text-center text-sm mt-2">
      {message}
    </div>
  );

  return (
    <main className="px-4">
      <header className="mb-4">
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="flex items-center gap-2 text-4xl font-bold">
            <ChevronUpIcon className="h-8 w-8" />
            PR-ism
          </div>
        </div>
      </header>
      <section className="container mx-auto max-w-6xl flex flex-col items-center gap-2 py-8 text-center md:py-16 lg:py-20 xl:gap-4">
        <h1 className="inline-block leading-tight text-4xl font-semibold tracking-tight text-balance lg:leading-[1.1] xl:text-5xl xl:tracking-tighter max-w-4xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
          Unlock actionable GitHub PR and DevOps metrics for data-driven
          engineering excellence
        </h1>
        <p className="text-foreground/80 max-w-3xl text-base text-balance sm:text-lg">
          Track key engineering metrics—lead time, review cycle time, deployment
          frequency, change failure rate, and more—to drive data-informed
          decisions. Start with the defaults and customize the dashboard to your
          team&apos;s workflow.
        </p>
      </section>
      <div className="flex items-center justify-center pb-12">
        <section aria-label="Sign in" className="w-full max-w-md">
          <form
            onSubmit={handleSubmit}
            className="w-full flex flex-col gap-3"
            noValidate
          >
            <label htmlFor="token-input" className="block font-medium">
              Personal access token
            </label>
            <Input
              id="token-input"
              type="password"
              name="token"
              value={value}
              onChange={handleChange}
              placeholder="GitHub token"
              className="w-full"
              aria-invalid={!!error}
              aria-describedby={ariaDescribedBy}
              autoComplete="off"
              autoFocus
              required
            />
            <TokenHelpDetails />
            <footer className="flex flex-col gap-2 mt-2 p-0">
              <Button type="submit" className="w-full">
                Sign in
              </Button>
              {error && <ErrorText id={TOKEN_ERROR_ID} message={error} />}
            </footer>
          </form>
        </section>
      </div>
    </main>
  );
}

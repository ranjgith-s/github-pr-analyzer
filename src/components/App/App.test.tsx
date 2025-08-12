import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import * as metricsHook from '../../hooks/usePullRequestMetrics';

jest.mock('../../hooks/usePullRequestMetrics');

const mockedHook = metricsHook as jest.Mocked<typeof metricsHook>;

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

beforeEach(() => {
  mockedHook.usePullRequestMetrics.mockReturnValue({
    items: [],
    totalCount: 0,
    incomplete: false,
    loading: false,
    error: null,
    rateLimit: null,
  });
});

import { useAuth } from '../../contexts/AuthContext/AuthContext';

function LoggedIn() {
  const auth = useAuth();
  useEffect(() => {
    auth.login('token');
  }, [auth]);
  return <App />;
}

test('shows home card when authenticated', async () => {
  render(
    <MemoryRouter>
      <ThemeModeProvider>
        <AuthProvider>
          <LoggedIn />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  expect(
    screen.getByRole('heading', { name: /pull request insights/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /developer insights/i })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('heading', { name: /repository insights/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/PR-ism/i)).toBeInTheDocument();
});

test('shows breadcrumb on insights page', async () => {
  function Wrapper() {
    const auth = useAuth();
    useEffect(() => {
      auth.login('token');
    }, [auth]);
    return <App />;
  }
  render(
    <MemoryRouter initialEntries={['/insights']}>
      <ThemeModeProvider>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  expect(screen.getByText('Pull request insights')).toBeInTheDocument();
});

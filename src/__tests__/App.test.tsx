import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../AuthContext';
import { ThemeModeProvider } from '../ThemeModeContext';
import * as metricsHook from '../hooks/usePullRequestMetrics';

jest.mock('../hooks/usePullRequestMetrics');

const mockedHook = metricsHook as jest.Mocked<typeof metricsHook>;

afterEach(() => {
  jest.restoreAllMocks();
  localStorage.clear();
});

beforeEach(() => {
  mockedHook.usePullRequestMetrics.mockReturnValue({
    items: [],
    loading: false,
  });
});

test('shows login when not authenticated', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeModeProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  expect(screen.getByText(/PR-ism/i)).toBeInTheDocument();
});

function LoggedIn() {
  const auth = require('../AuthContext').useAuth();
  useEffect(() => {
    auth.login('token');
  }, [auth]);
  return <App />;
}

test('shows home card when authenticated', async () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeModeProvider>
        <AuthProvider>
          <LoggedIn />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  expect(screen.getByText('Pull request insights')).toBeInTheDocument();
  expect(screen.getByText('Developer insights')).toBeInTheDocument();
  expect(screen.getByText('Repository insights')).toBeInTheDocument();
  expect(screen.getByText('PR-ism')).toBeInTheDocument();
});

test('shows breadcrumb on insights page', async () => {
  function Wrapper() {
    const auth = require('../AuthContext').useAuth();
    useEffect(() => {
      auth.login('token');
    }, [auth]);
    return <App />;
  }
  render(
    <MemoryRouter initialEntries={['/insights']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeModeProvider>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  expect(screen.getByText('Pull request insights')).toBeInTheDocument();
});

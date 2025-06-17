import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider, useAuth } from '../AuthContext';
import * as metricsHook from '../hooks/usePullRequestMetrics';

jest.mock('../hooks/usePullRequestMetrics');

const mockedHook = metricsHook as jest.Mocked<typeof metricsHook>;

beforeEach(() => {
  mockedHook.usePullRequestMetrics.mockReturnValue({
    items: [],
    loading: false,
  });
  localStorage.clear();
});

test('shows login when not authenticated', () => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText(/PR-ism/i)).toBeInTheDocument();
});

function LoggedIn() {
  const auth = useAuth();
  useEffect(() => {
    auth.login('token');
  }, [auth]);
  return (
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
}

test('shows home card when authenticated', async () => {
  render(
    <AuthProvider>
      <LoggedIn />
    </AuthProvider>
  );
  expect(screen.getByText('Pull request insights')).toBeInTheDocument();
  expect(screen.getByText('Developer PR Metrics Radar')).toBeInTheDocument();
  expect(screen.getByText('PR-ism')).toBeInTheDocument();
});

test('shows breadcrumb on insights page', async () => {
  function Wrapper() {
    const auth = useAuth();
    useEffect(() => {
      auth.login('token');
    }, [auth]);
    return (
      <MemoryRouter initialEntries={['/insights']}>
        <App />
      </MemoryRouter>
    );
  }

  render(
    <AuthProvider>
      <Wrapper />
    </AuthProvider>
  );
  expect(screen.getByText('Pull request insights')).toBeInTheDocument();
});

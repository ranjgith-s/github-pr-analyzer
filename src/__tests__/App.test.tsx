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
});

test('shows login when not authenticated', () => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText(/GitHub PR Analyzer/i)).toBeInTheDocument();
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

test('shows metrics table when authenticated', async () => {
  render(
    <AuthProvider>
      <LoggedIn />
    </AuthProvider>
  );
  expect(screen.getByLabelText('Repository')).toBeInTheDocument();
  expect(screen.getByText('GitHub PR Analyzer')).toBeInTheDocument();
});

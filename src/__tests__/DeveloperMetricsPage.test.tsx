import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DeveloperMetricsPage from '../DeveloperMetricsPage';
import { AuthProvider, useAuth } from '../AuthContext';
import * as metricsHook from '../hooks/useDeveloperMetrics';
import * as prHook from '../hooks/useUserPullRequests';

jest.mock('../hooks/useDeveloperMetrics');
jest.mock('../hooks/useUserPullRequests');

function Wrapper() {
  const auth = useAuth();
  useEffect(() => {
    auth.login('tok');
  }, [auth]);
  return (
    <MemoryRouter>
      <DeveloperMetricsPage />
    </MemoryRouter>
  );
}

test('renders page heading', () => {
  (metricsHook.useDeveloperMetrics as jest.Mock).mockReturnValue({
    data: null,
    loading: false,
  });
  (prHook.useUserPullRequests as jest.Mock).mockReturnValue({
    items: [],
    loading: false,
  });
  render(
    <AuthProvider>
      <Wrapper />
    </AuthProvider>
  );
  expect(
    screen.getByRole('heading', { name: /developer insights/i })
  ).toBeInTheDocument();
});

test('shows metrics table and pull requests', () => {
  (metricsHook.useDeveloperMetrics as jest.Mock).mockReturnValue({
    data: {
      login: 'dev',
      name: 'Dev',
      avatar_url: 'a',
      html_url: 'h',
      bio: null,
      company: null,
      location: null,
      followers: 0,
      following: 0,
      public_repos: 0,
      mergeSuccess: 1,
      cycleEfficiency: 2,
      sizeEfficiency: 3,
      leadTimeScore: 4,
      reviewActivity: 5,
      feedbackScore: 6,
      issueResolution: 7,
    },
    loading: false,
  });
  (prHook.useUserPullRequests as jest.Mock).mockReturnValue({
    items: [
      {
        id: 1,
        title: 't',
        url: 'u',
        created_at: '2020',
        state: 'open',
        repo: 'r',
      },
    ],
    loading: false,
  });
  render(
    <AuthProvider>
      <Wrapper />
    </AuthProvider>
  );
  expect(
    screen.getByRole('columnheader', { name: /metric/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/recent pull requests/i)).toBeInTheDocument();
});

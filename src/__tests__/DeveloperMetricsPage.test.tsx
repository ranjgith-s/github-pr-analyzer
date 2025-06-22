import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DeveloperMetricsPage from '../DeveloperMetricsPage';
import { AuthProvider, useAuth } from '../AuthContext';
import { ThemeModeProvider } from '../ThemeModeContext';
import * as metricsHook from '../hooks/useDeveloperMetrics';
import * as github from '../services/github';

jest.mock('../hooks/useDeveloperMetrics');
jest.mock('../services/github');

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
  render(
    <ThemeModeProvider>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </ThemeModeProvider>
  );
  expect(
    screen.getByRole('heading', { name: /developer insights/i })
  ).toBeInTheDocument();
});

test('displays suggestions and handles selection', async () => {
  (metricsHook.useDeveloperMetrics as jest.Mock).mockReturnValue({
    data: null,
    loading: false,
  });
  (github.searchUsers as jest.Mock).mockResolvedValue([
    { login: 'octo', avatar_url: 'x' },
  ]);
  render(
    <ThemeModeProvider>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </ThemeModeProvider>
  );
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText(/search github users/i), 'oct');
  await waitFor(() => expect(github.searchUsers).toHaveBeenCalled());
  await waitFor(() => screen.getByText('octo'));
  await user.click(screen.getByText('octo'));
  expect(screen.queryByText('octo')).not.toBeInTheDocument();
});

test('logs error on search failure', async () => {
  (metricsHook.useDeveloperMetrics as jest.Mock).mockReturnValue({
    data: null,
    loading: false,
  });
  (github.searchUsers as jest.Mock).mockRejectedValue(new Error('fail'));
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <ThemeModeProvider>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </ThemeModeProvider>
  );
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText(/search github users/i), 'oct');
  await waitFor(() => expect(github.searchUsers).toHaveBeenCalled());
  await waitFor(() => expect(spy).toHaveBeenCalled());
  spy.mockRestore();
});

test('renders metrics UI with data', () => {
  (metricsHook.useDeveloperMetrics as jest.Mock).mockReturnValue({
    data: {
      login: 'octo',
      name: 'Octo Cat',
      avatar_url: 'img',
      html_url: 'url',
      bio: 'bio',
      company: 'GitHub',
      location: 'Internet',
      followers: 1,
      following: 2,
      public_repos: 3,
      mergeSuccess: 10,
      mergeRate: 1,
      cycleEfficiency: 9,
      averageChanges: 0.5,
      sizeEfficiency: 8,
      medianSize: 10,
      leadTimeScore: 7,
      medianLeadTime: 2,
      reviewActivity: 6,
      reviewsCount: 4,
      feedbackScore: 5,
      averageComments: 2,
      issueResolution: 3,
      issuesClosed: 1,
    },
    loading: false,
  });
  render(
    <ThemeModeProvider>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </ThemeModeProvider>
  );
  expect(screen.getByText('Octo Cat')).toBeInTheDocument();
  expect(screen.getByText('bio')).toBeInTheDocument();
  // Use getAllByText for ambiguous 'GitHub' text
  expect(
    screen.getAllByText((content) => /GitHub/.test(content)).length
  ).toBeGreaterThan(0);
  // Use function matcher for 'Internet' to allow for emoji/whitespace
  expect(
    screen.getAllByText((content) => /Internet/.test(content)).length
  ).toBeGreaterThan(0);
  expect(screen.getByText('Followers: 1')).toBeInTheDocument();
  expect(screen.getByText('Following: 2')).toBeInTheDocument();
  expect(screen.getByText('Repos: 3')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /view on github/i })).toHaveAttribute(
    'href',
    'url'
  );
  // Use getAllByText for ambiguous 'Merge Success' and 'Cycle Efficiency' text
  expect(
    screen.getAllByText((content) => /Merge Success/.test(content)).length
  ).toBeGreaterThan(0);
  expect(
    screen.getAllByText((content) => /Cycle Efficiency/.test(content)).length
  ).toBeGreaterThan(0);
  // Use getAllByText for ambiguous 'Size Efficiency' text
  expect(
    screen.getAllByText((content) => /Size Efficiency/.test(content)).length
  ).toBeGreaterThan(0);
  // Use getAllByText for ambiguous 'Lead Time' text
  expect(
    screen.getAllByText((content) => /Lead Time/.test(content)).length
  ).toBeGreaterThan(0);
  // Use getAllByText for ambiguous 'Review Activity' text
  expect(
    screen.getAllByText((content) => /Review Activity/.test(content)).length
  ).toBeGreaterThan(0);
  // Use getAllByText for ambiguous 'Feedback Score' text
  expect(
    screen.getAllByText((content) => /Feedback Score/.test(content)).length
  ).toBeGreaterThan(0);
  // Issue Resolution (ambiguous text) - use getAllByText or function matcher
  expect(screen.getAllByText(/Issue Resolution/).length).toBeGreaterThan(0);
});

test('renders loading overlay', () => {
  (metricsHook.useDeveloperMetrics as jest.Mock).mockReturnValue({
    data: null,
    loading: true,
  });
  render(
    <ThemeModeProvider>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </ThemeModeProvider>
  );
  expect(screen.getByText(/fetching user data/i)).toBeInTheDocument();
});

test('handles missing optional fields', () => {
  (metricsHook.useDeveloperMetrics as jest.Mock).mockReturnValue({
    data: {
      login: 'octo',
      name: null,
      avatar_url: 'img',
      html_url: 'url',
      bio: null,
      company: null,
      location: null,
      followers: 1,
      following: 2,
      public_repos: 3,
      mergeSuccess: 10,
      mergeRate: 1,
      cycleEfficiency: 9,
      averageChanges: 0.5,
      sizeEfficiency: 8,
      medianSize: 10,
      leadTimeScore: 7,
      medianLeadTime: 2,
      reviewActivity: 6,
      reviewsCount: 4,
      feedbackScore: 5,
      averageComments: 2,
      issueResolution: 3,
      issuesClosed: 1,
    },
    loading: false,
  });
  render(
    <ThemeModeProvider>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </ThemeModeProvider>
  );
  expect(screen.getAllByText('octo').length).toBeGreaterThan(0);
  expect(screen.queryByText('bio')).not.toBeInTheDocument();
  expect(screen.queryByText('GitHub')).not.toBeInTheDocument();
  expect(screen.queryByText('Internet')).not.toBeInTheDocument();
});

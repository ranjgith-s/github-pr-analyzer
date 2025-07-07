import React, { useEffect } from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import DeveloperMetricsPage from './DeveloperMetricsPage';
import { AuthProvider, useAuth } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import * as metricsHook from '../../hooks/useDeveloperMetrics';
import * as githubService from '../../utils/services/githubService';

jest.mock('../../utils/services/githubService', () => ({
  ...jest.requireActual('../../utils/services/githubService'),
  getDeveloperProfile: jest.fn(() =>
    Promise.resolve({
      login: 'octocat',
      name: 'Octo Cat',
      avatar_url: 'img',
      html_url: '',
      bio: '',
      company: '',
      location: '',
      followers: 0,
      following: 0,
      public_repos: 0,
    })
  ),
  searchUsers: jest.fn(),
}));

jest.mock('../../hooks/useDeveloperMetrics');

function Wrapper() {
  const auth = useAuth();
  useEffect(() => {
    auth.login('tok');
  }, [auth]);
  return <DeveloperMetricsPage />;
}

test('renders page heading', () => {
  (metricsHook.useDeveloperMetrics as jest.Mock).mockReturnValue({
    data: null,
    loading: false,
  });
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeModeProvider>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
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
  (githubService.searchUsers as jest.Mock).mockResolvedValue([
    { login: 'octo', avatar_url: 'x' },
  ]);
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeModeProvider>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  const user = userEvent.setup();
  await act(async () => {
    await user.type(screen.getByPlaceholderText(/search github users/i), 'oct');
  });
  await waitFor(() => expect(githubService.searchUsers).toHaveBeenCalled());
  await waitFor(() => screen.getByText('octo'));
  await act(async () => {
    await user.click(screen.getByText('octo'));
  });
  expect(screen.queryByText('octo')).not.toBeInTheDocument();
});

test('logs error on search failure', async () => {
  (metricsHook.useDeveloperMetrics as jest.Mock).mockReturnValue({
    data: null,
    loading: false,
  });
  (githubService.searchUsers as jest.Mock).mockRejectedValue(new Error('fail'));
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <ThemeModeProvider>
        <AuthProvider>
          <Wrapper />
        </AuthProvider>
      </ThemeModeProvider>
    </MemoryRouter>
  );
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText(/search github users/i), 'oct');
  await waitFor(() => expect(githubService.searchUsers).toHaveBeenCalled());
  await waitFor(() => expect(spy).toHaveBeenCalled());
  spy.mockRestore();
});

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
  await user.type(screen.getByPlaceholderText(/search github user/i), 'oct');
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
  await user.type(screen.getByPlaceholderText(/search github user/i), 'oct');
  await waitFor(() => expect(github.searchUsers).toHaveBeenCalled());
  await waitFor(() => expect(spy).toHaveBeenCalled());
  spy.mockRestore();
});

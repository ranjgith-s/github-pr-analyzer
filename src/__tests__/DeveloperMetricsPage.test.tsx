import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import DeveloperMetricsPage from '../DeveloperMetricsPage';
import { AuthProvider, useAuth } from '../AuthContext';
import * as metricsHook from '../hooks/useDeveloperMetrics';

jest.mock('../hooks/useDeveloperMetrics');

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
    <AuthProvider>
      <Wrapper />
    </AuthProvider>
  );
  expect(
    screen.getByRole('heading', { name: /developer insights/i })
  ).toBeInTheDocument();
});

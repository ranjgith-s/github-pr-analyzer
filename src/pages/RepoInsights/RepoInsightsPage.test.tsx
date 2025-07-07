import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from '@testing-library/react';
import RepoInsightsPage from './RepoInsightsPage';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

jest.mock('../../utils/services/githubService');

describe('RepoInsightsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.setItem('token', 'tok');
  });

  it('does not show dropdown for invalid input', async () => {
    await act(async () => {
      render(
        <MemoryRouter
          initialEntries={['/repo']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <ThemeModeProvider>
            <AuthProvider>
              <RepoInsightsPage />
            </AuthProvider>
          </ThemeModeProvider>
        </MemoryRouter>
      );
    });
    const input = screen.getByPlaceholderText(/owner\/repo/i);
    fireEvent.change(input, { target: { value: 'invalid' } });
    expect(screen.queryByText('invalid')).not.toBeInTheDocument();
  });
});

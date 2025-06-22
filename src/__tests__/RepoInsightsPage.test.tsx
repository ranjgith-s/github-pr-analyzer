import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import RepoInsightsPage from '../RepoInsightsPage';
import { AuthProvider } from '../AuthContext';
import { ThemeModeProvider } from '../ThemeModeContext';
import * as githubService from '../services/github';

jest.mock('../services/github');

describe('RepoInsightsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Provide a default token for AuthContext
    localStorage.setItem('token', 'tok');
  });

  it('renders and submits repo form', async () => {
    (githubService.fetchRepoInsights as jest.Mock).mockResolvedValue({
      leadTime: 12.34,
      changeFailureRate: 0.05,
      deploymentFrequency: 3,
      meanTimeToRestore: 1.23,
      openIssues: 10,
      openPullRequests: 5,
      averageMergeTime: 2.5,
      weeklyCommits: [3, 4, 5, 6, 7],
      contributorCount: 8,
      communityHealthScore: 9.2,
    });
    await act(async () => {
      render(
        <ThemeModeProvider>
          <AuthProvider>
            <RepoInsightsPage />
          </AuthProvider>
        </ThemeModeProvider>
      );
    });
    const input = screen.getByPlaceholderText(/owner\/repo/i);
    fireEvent.change(input, { target: { value: 'foo/bar' } });
    fireEvent.click(screen.getByRole('button', { name: /load/i }));
    await waitFor(() => expect(githubService.fetchRepoInsights).toHaveBeenCalled());
    // You can add more assertions here for the loaded data if the component renders it
  });

  it('shows error on invalid repo input', () => {
    window.alert = jest.fn();
    act(() => {
      render(
        <ThemeModeProvider>
          <AuthProvider>
            <RepoInsightsPage />
          </AuthProvider>
        </ThemeModeProvider>
      );
    });
    const input = screen.getByPlaceholderText(/owner\/repo/i);
    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.click(screen.getByRole('button', { name: /load/i }));
    expect(window.alert).toHaveBeenCalledWith('Enter a repository in the format owner/repo');
  });

  it('shows loading overlay', async () => {
    (githubService.fetchRepoInsights as jest.Mock).mockImplementation(() => new Promise(() => {}));
    await act(async () => {
      render(
        <ThemeModeProvider>
          <AuthProvider>
            <RepoInsightsPage />
          </AuthProvider>
        </ThemeModeProvider>
      );
    });
    const input = screen.getByPlaceholderText(/owner\/repo/i);
    fireEvent.change(input, { target: { value: 'foo/bar' } });
    fireEvent.click(screen.getByRole('button', { name: /load/i }));
    await waitFor(() => expect(screen.getByText(/fetching repository info/i)).toBeInTheDocument());
  });

  it('shows error message on fetch failure', async () => {
    (githubService.fetchRepoInsights as jest.Mock).mockRejectedValue(new Error('fail'));
    await act(async () => {
      render(
        <ThemeModeProvider>
          <AuthProvider>
            <RepoInsightsPage />
          </AuthProvider>
        </ThemeModeProvider>
      );
    });
    const input = screen.getByPlaceholderText(/owner\/repo/i);
    fireEvent.change(input, { target: { value: 'foo/bar' } });
    fireEvent.click(screen.getByRole('button', { name: /load/i }));
    await waitFor(() => expect(screen.getByText(/failed to load data/i)).toBeInTheDocument());
  });
});

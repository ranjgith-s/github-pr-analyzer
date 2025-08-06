import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PullRequestPage from './PullRequest';
import { AuthProvider, useAuth } from '../../contexts/AuthContext/AuthContext';
import * as githubService from '../../utils/services/githubService';

jest.mock('../../utils/services/githubService');

const timeline = [
  { label: 'Created', date: '2020-01-01T00:00:00Z' },
  { label: 'Closed', date: '2020-01-02T00:00:00Z' },
];

function TestWrapper() {
  const auth = useAuth();
  useEffect(() => {
    auth.login('test-token');
  }, [auth]);
  return (
    <Routes>
      <Route path="/pr/:owner/:repo/:number" element={<PullRequestPage />} />
    </Routes>
  );
}

describe('PullRequestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders timeline from router state', () => {
    render(
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={[
          { pathname: '/pr/o/r/1', state: { title: 'PR', timeline } },
        ]}
      >
        <AuthProvider>
          <PullRequestPage />
        </AuthProvider>
      </MemoryRouter>
    );
    // Use heading role for the PR title
    expect(screen.getByRole('heading', { name: 'PR' })).toBeInTheDocument();
    expect(screen.getByText(/Created/)).toBeInTheDocument();
    expect(screen.getByText(/Closed/)).toBeInTheDocument();
  });

  test('fetches and renders PR details when no router state', async () => {
    (githubService.fetchPullRequestDetails as jest.Mock).mockResolvedValue({
      title: 'Fetched PR',
      createdAt: '2020-01-01T00:00:00Z',
      publishedAt: null,
      closedAt: '2020-01-02T00:00:00Z',
      mergedAt: null,
      reviews: { nodes: [] },
    });

    render(
      <MemoryRouter
        initialEntries={['/pr/o/r/1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <TestWrapper />
        </AuthProvider>
      </MemoryRouter>
    );

    // Wait for loading spinner to disappear
    await waitFor(() =>
      expect(
        screen.queryByText(/Loading pull request details/)
      ).not.toBeInTheDocument()
    );
    // Now check for the heading
    expect(
      screen.getByRole('heading', { name: 'Fetched PR' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Created/)).toBeInTheDocument();
    expect(screen.getByText(/Closed/)).toBeInTheDocument();
  });

  test('shows loading state', () => {
    // Simulate loading by rendering and not advancing timers or resolving fetch
    render(
      <MemoryRouter
        initialEntries={[{ pathname: '/pr/o/r/1', state: undefined }]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <PullRequestPage />
        </AuthProvider>
      </MemoryRouter>
    );
    expect(
      screen.getByText(/Loading pull request details/)
    ).toBeInTheDocument();
  });

  test('handles fetch error gracefully', async () => {
    (githubService.fetchPullRequestDetails as jest.Mock).mockRejectedValue(
      new Error('fail')
    );

    render(
      <MemoryRouter
        initialEntries={['/pr/o/r/1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <TestWrapper />
        </AuthProvider>
      </MemoryRouter>
    );
    // Wait for loading spinner to disappear
    await waitFor(() =>
      expect(
        screen.queryByText(/Loading pull request details/)
      ).not.toBeInTheDocument()
    );
    // Should still render a heading (fallback UI)
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  test('handles timeline with missing fields', async () => {
    (githubService.fetchPullRequestDetails as jest.Mock).mockResolvedValue({
      title: 'Partial PR',
      createdAt: '2020-01-01T00:00:00Z',
      publishedAt: null,
      closedAt: null,
      mergedAt: null,
      reviews: { nodes: [] },
    });

    render(
      <MemoryRouter
        initialEntries={['/pr/o/r/1']}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AuthProvider>
          <TestWrapper />
        </AuthProvider>
      </MemoryRouter>
    );
    // Wait for loading spinner to disappear
    await waitFor(() =>
      expect(
        screen.queryByText(/Loading pull request details/)
      ).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('heading', { name: 'Partial PR' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Created/)).toBeInTheDocument();
  });
});

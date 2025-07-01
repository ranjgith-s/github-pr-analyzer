import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import PullRequestPage from '../PullRequest';
import { AuthProvider } from '../AuthContext';
import { Octokit } from '@octokit/rest';

const timeline = [
  { label: 'Created', date: '2020-01-01T00:00:00Z' },
  { label: 'Closed', date: '2020-01-02T00:00:00Z' },
];

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

jest.mock('@octokit/rest');

test('fetches data when no router state', async () => {
  const mockOctokit = { graphql: jest.fn() } as any;
  (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokit);
  mockOctokit.graphql.mockResolvedValue({
    repository: {
      pullRequest: {
        title: 'Fetched PR',
        createdAt: '2020-01-01T00:00:00Z',
        publishedAt: null,
        closedAt: '2020-01-02T00:00:00Z',
        mergedAt: null,
        reviews: { nodes: [] },
      },
    },
  });

  function Wrapper() {
    return (
      <Routes>
        <Route
          path="/pr/:owner/:repo/:number"
          element={<PullRequestPage />}
        />
      </Routes>
    );
  }

  render(
    <MemoryRouter initialEntries={['/pr/o/r/1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </MemoryRouter>
  );

  // Use heading role for the fetched PR title
  await waitFor(() => screen.getByRole('heading', { name: 'Fetched PR' }));
  expect(document.title).toBe('Fetched PR');
  expect(Octokit).toHaveBeenCalled();
});

test('shows loading state', () => {
  // Simulate loading by rendering and not advancing timers or resolving fetch
  render(
    <MemoryRouter initialEntries={[{ pathname: '/pr/o/r/1', state: undefined }]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <PullRequestPage />
      </AuthProvider>
    </MemoryRouter>
  );
  expect(screen.getByText(/Loading pull request details/)).toBeInTheDocument();
});

test('handles fetch error gracefully', async () => {
  const mockOctokit = { graphql: jest.fn().mockRejectedValue(new Error('fail')) } as any;
  (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokit);
  function Wrapper() {
    return (
      <Routes>
        <Route path="/pr/:owner/:repo/:number" element={<PullRequestPage />} />
      </Routes>
    );
  }
  render(
    <MemoryRouter initialEntries={['/pr/o/r/1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </MemoryRouter>
  );
  // Wait for loading to disappear
  await waitFor(() => expect(screen.queryByText(/Loading pull request details/)).not.toBeInTheDocument());
  // Should not throw, and should render the card (even if empty)
  expect(screen.getByRole('heading')).toBeInTheDocument();
});

test('handles timeline with missing fields', async () => {
  const mockOctokit = { graphql: jest.fn().mockResolvedValue({
    repository: {
      pullRequest: {
        title: 'Partial PR',
        createdAt: '2020-01-01T00:00:00Z',
        publishedAt: null,
        closedAt: null,
        mergedAt: null,
        reviews: { nodes: [] },
      },
    },
  }) } as any;
  (Octokit as unknown as jest.Mock).mockImplementation(() => mockOctokit);
  function Wrapper() {
    return (
      <Routes>
        <Route path="/pr/:owner/:repo/:number" element={<PullRequestPage />} />
      </Routes>
    );
  }
  render(
    <MemoryRouter initialEntries={['/pr/o/r/1']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </MemoryRouter>
  );
  await waitFor(() => screen.getByRole('heading', { name: 'Partial PR' }));
  expect(screen.getByText(/Created/)).toBeInTheDocument();
  // Should not throw for missing fields
});

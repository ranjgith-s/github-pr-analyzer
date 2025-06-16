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
    <AuthProvider>
      <MemoryRouter
        initialEntries={[
          { pathname: '/pr/o/r/1', state: { title: 'PR', timeline } },
        ]}
      >
        <PullRequestPage />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('PR')).toBeInTheDocument();
  expect(screen.getByText(/Created/)).toBeInTheDocument();
  expect(screen.getByText(/Closed/)).toBeInTheDocument();
});

jest.mock('@octokit/rest');

test('fetches data when no router state', async () => {
  const mockOctokit = { graphql: jest.fn() } as any;
  (Octokit as jest.Mock).mockImplementation(() => mockOctokit);
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
      <MemoryRouter initialEntries={['/pr/o/r/1']}>
        <Routes>
          <Route
            path="/pr/:owner/:repo/:number"
            element={<PullRequestPage />}
          />
        </Routes>
      </MemoryRouter>
    );
  }

  render(
    <AuthProvider>
      <Wrapper />
    </AuthProvider>
  );

  await waitFor(() => screen.getByText('Fetched PR'));
  expect(document.title).toBe('Fetched PR');
  expect(Octokit).toHaveBeenCalled();
});

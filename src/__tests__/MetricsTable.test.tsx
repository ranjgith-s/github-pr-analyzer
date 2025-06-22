import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MetricsTable from '../MetricsTable';
import { AuthProvider } from '../AuthContext';
import * as metricsHook from '../hooks/usePullRequestMetrics';
import { PRItem } from '../types';

const sample: PRItem[] = [
  {
    id: '1',
    owner: 'octo',
    repo_name: 'repo',
    repo: 'octo/repo',
    number: 1,
    title: 'Test PR',
    url: 'http://example.com',
    author: 'octo',
    state: 'open',
    created_at: '2020-01-01',
    published_at: '2020-01-02',
    closed_at: '2020-01-03',
    first_review_at: '2020-01-02',
    first_commit_at: '2020-01-01',
    reviewers: ['reviewer1'],
    changes_requested: 0,
    additions: 1,
    deletions: 1,
    comment_count: 0,
    timeline: [],
  },
];

jest
  .spyOn(metricsHook, 'usePullRequestMetrics')
  .mockReturnValue({ items: sample, loading: false });

test('renders filters and data', () => {
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByLabelText('Repository')).toBeInTheDocument();
  expect(screen.getByLabelText('Author')).toBeInTheDocument();
  expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
});

test('shows spinner when loading', () => {
  (metricsHook.usePullRequestMetrics as jest.Mock).mockReturnValue({
    items: [],
    loading: true,
  });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText(/loading pull requests/i)).toBeInTheDocument();
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import MetricsTable from '../MetricsTable';
import { AuthProvider } from '../AuthContext';
import * as metricsHook from '../hooks/usePullRequestMetrics';
import { PRItem } from '../types';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(() => jest.fn()),
  };
});

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

test('renders empty state', () => {
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items: [], loading: false });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('Page 1 of 0')).toBeInTheDocument();
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

test('renders loading overlay', () => {
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items: [], loading: true });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText(/loading pull requests/i)).toBeInTheDocument();
});

test('filters by repo and author', () => {
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items: sample, loading: false });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  fireEvent.change(screen.getByLabelText('Repository'), {
    target: { value: 'octo/repo' },
  });
  fireEvent.change(screen.getByLabelText('Author'), {
    target: { value: 'octo' },
  });
  expect(screen.getByText('Test PR')).toBeInTheDocument();
});

test('selects and navigates to PR', () => {
  const navigate = jest.fn();
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items: sample, loading: false });
  (useNavigate as jest.Mock).mockReturnValue(navigate);
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  screen.getAllByRole('checkbox')[0].click();
  screen.getByRole('button', { name: /view pull request/i }).click();
  expect(navigate).toHaveBeenCalled();
});

test('renders timeline and lead time', () => {
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items: sample, loading: false });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByLabelText(/Draft:/)).toBeInTheDocument();
  expect(screen.getByText(/0h/i)).toBeInTheDocument();
});

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import MetricsTable from './MetricsTable';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';
import * as metricsHook from '../../hooks/usePullRequestMetrics';
import { PRItem } from '../../types';

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
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
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
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
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
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByTestId('spinner')).toBeInTheDocument();
});

test('renders loading overlay', () => {
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items: [], loading: true });
  render(
    <AuthProvider>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
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
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  act(() => {
    fireEvent.change(screen.getByLabelText('Repository'), {
      target: { value: 'octo/repo' },
    });
    fireEvent.change(screen.getByLabelText('Author'), {
      target: { value: 'octo' },
    });
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
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
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
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByLabelText(/Draft:/)).toBeInTheDocument();
  expect(screen.getByText(/0h/i)).toBeInTheDocument();
});

test('pagination works and changes page', () => {
  const manyItems = Array.from({ length: 60 }, (_, i) => ({
    ...sample[0],
    id: String(i + 1),
    number: i + 1,
    title: `PR ${i + 1}`,
  }));
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items: manyItems, loading: false });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  // Should show page 1 by default
  expect(screen.getByText('PR 1')).toBeInTheDocument();
  expect(screen.queryByText('PR 26')).not.toBeInTheDocument();
  // Click page 2 in pagination
  const page2Btn = screen
    .getByTestId('pagination')
    .querySelectorAll('button')[1];
  act(() => {
    page2Btn.click();
  });
  expect(screen.getByText('PR 26')).toBeInTheDocument();
  expect(screen.queryByText('PR 1')).not.toBeInTheDocument();
});

test('search filter works', () => {
  const items = [
    { ...sample[0], title: 'Alpha', repo: 'octo/alpha', author: 'alice' },
    { ...sample[0], title: 'Beta', repo: 'octo/beta', author: 'bob', id: '2' },
  ];
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items, loading: false });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  fireEvent.change(screen.getByPlaceholderText(/search/i), {
    target: { value: 'beta' },
  });
  expect(screen.getByText('Beta')).toBeInTheDocument();
  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
});

test('formatDuration handles edge cases', () => {
  const { formatDuration } = require('./MetricsTable');
  expect(formatDuration()).toBe('N/A');
  expect(formatDuration('2020-01-02', '2020-01-01')).toBe('N/A');
  expect(formatDuration('2020-01-01', '2020-01-01')).toBe('0h');
  expect(formatDuration('2020-01-01', '2020-01-02')).toBe('1d 0h'); // Updated expectation
  expect(formatDuration('2020-01-01', '2020-01-03')).toBe('2d 0h');
});

test('handles PRs with no reviewers', () => {
  const items = [{ ...sample[0], reviewers: [] }];
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items, loading: false });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('Test PR')).toBeInTheDocument();
});

test('handles PRs with missing title', () => {
  const items = [{ ...sample[0], title: '' }];
  jest
    .spyOn(metricsHook, 'usePullRequestMetrics')
    .mockReturnValue({ items, loading: false });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable />
      </MemoryRouter>
    </AuthProvider>
  );
  // Find all links in the table and check that at least one has empty textContent
  const links = screen.getAllByRole('link');
  expect(links.some((link) => link.textContent === '')).toBe(true);
});

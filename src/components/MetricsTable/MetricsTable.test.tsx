import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
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

const mockHook = (
  override: Partial<ReturnType<typeof metricsHook.usePullRequestMetrics>> = {}
) => {
  return jest.spyOn(metricsHook, 'usePullRequestMetrics').mockReturnValue({
    items: sample,
    loading: false,
    error: null,
    totalCount: sample.length,
    ...override,
  } as any);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockHook();
});

test('renders filters and data', () => {
  render(
    <AuthProvider>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  // Updated: buttons have aria-labels "Repository filter" and "Author filter"
  expect(screen.getByLabelText('Repository filter')).toBeInTheDocument();
  expect(screen.getByLabelText('Author filter')).toBeInTheDocument();
  expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
});

test('renders empty state', () => {
  mockHook({ items: [], totalCount: 0 });
  render(
    <AuthProvider>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  // hero Pagination renders "Page 1 of 1" when total=1 (min guard)
  expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
  expect(screen.getByText(/no pull requests/i)).toBeInTheDocument();
});

test('shows spinner when loading', () => {
  mockHook({ items: [], loading: true });
  render(
    <AuthProvider>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByTestId('spinner')).toBeInTheDocument();
});

test('renders loading overlay', () => {
  mockHook({ items: [], loading: true });
  render(
    <AuthProvider>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText(/loading pull requests/i)).toBeInTheDocument();
});

test('filters by repo and author and resets page', () => {
  mockHook({
    items: sample.concat({
      ...sample[0],
      id: '2',
      repo: 'octo/other',
      author: 'someone',
      number: 2,
    }),
  });
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/metrics?page=2']}>
        <MetricsTable query={''} queryParams={{ page: 2, order: 'desc' }} />
      </MemoryRouter>
    </AuthProvider>
  );
  act(() => {
    fireEvent.click(screen.getByLabelText('Repository filter'));
  });
  const repoOptionBtn = screen.getByRole('menuitem', { name: 'octo/repo' });
  act(() => {
    fireEvent.click(repoOptionBtn);
  });
  // Only one matching row after filter
  expect(screen.getAllByText('Test PR')).toHaveLength(1);
  // page should have reset to 1
  expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
});

test('selects and navigates to PR', async () => {
  const navigate = jest.fn();
  mockHook();
  (useNavigate as jest.Mock).mockReturnValue(navigate);
  render(
    <AuthProvider>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  await act(async () => {
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1] || checkboxes[0]);
  });
  const viewBtn = await screen.findByRole('button', {
    name: /view pull request/i,
  });
  await waitFor(() => expect(viewBtn).toBeEnabled());
  await act(async () => {
    fireEvent.click(viewBtn);
  });
  expect(navigate).toHaveBeenCalled();
});

test('renders timeline and lead time', () => {
  mockHook();
  render(
    <AuthProvider>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByLabelText(/Draft:/)).toBeInTheDocument();
  expect(
    screen.getByLabelText(/Draft:/).querySelector('.bg-success')
  ).toBeInTheDocument();
  expect(
    screen.getByLabelText(/Draft:/).querySelector('.bg-warning')
  ).toBeInTheDocument();
  expect(
    screen.getByLabelText(/Draft:/).querySelector('.bg-primary')
  ).toBeInTheDocument();
  expect(screen.getByText(/0h/i)).toBeInTheDocument();
});

test('pagination works, changes page and invokes callback', () => {
  const manyItems = Array.from({ length: 25 }, (_, i) => ({
    ...sample[0],
    id: String(i + 1),
    number: i + 1,
    title: `PR ${i + 1}`,
  }));
  const onPageChange = jest.fn();
  mockHook({ items: manyItems, totalCount: 40 });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable
          query={''}
          onPageChange={onPageChange}
          queryParams={{ per_page: 20, order: 'desc' }}
        />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('PR 1')).toBeInTheDocument();
  // Prefer using button labelled with page number if available
  const page2Btn = screen.getByRole('button', { name: '2' });
  act(() => {
    fireEvent.click(page2Btn);
  });
  expect(onPageChange).toHaveBeenCalledWith(2);
});

test('search filter works', () => {
  const items = [
    { ...sample[0], title: 'Alpha', repo: 'octo/alpha', author: 'alice' },
    { ...sample[0], title: 'Beta', repo: 'octo/beta', author: 'bob', id: '2' },
  ];
  mockHook({ items });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  fireEvent.change(screen.getByPlaceholderText(/search/i), {
    target: { value: 'beta' },
  });
  expect(screen.getByText('Beta')).toBeInTheDocument();
  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
});

test('handles PRs with no reviewers', () => {
  const items = [{ ...sample[0], reviewers: [] }];
  mockHook({ items });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('Test PR')).toBeInTheDocument();
});

test('handles PRs with missing title', () => {
  const items = [{ ...sample[0], title: '' }];
  mockHook({ items });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  const links = screen.getAllByRole('link');
  expect(links.some((link) => link.textContent === '')).toBe(true);
});

test('sort dropdown updates value and invokes callback', () => {
  const onSortChange = jest.fn();
  mockHook();
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable query={''} onSortChange={onSortChange} />
      </MemoryRouter>
    </AuthProvider>
  );
  act(() => {
    fireEvent.click(screen.getByLabelText('Sort field'));
  });
  const createdOption = screen.getByRole('menuitem', { name: 'created' });
  act(() => {
    fireEvent.click(createdOption);
  });
  expect(onSortChange).toHaveBeenCalledWith('created');
  expect(screen.getByText(/Sort: created/)).toBeInTheDocument();
});

test('order dropdown updates value and invokes callback', () => {
  const onOrderChange = jest.fn();
  mockHook();
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable query={''} onOrderChange={onOrderChange} />
      </MemoryRouter>
    </AuthProvider>
  );
  act(() => {
    fireEvent.click(screen.getByLabelText('Sort order'));
  });
  const ascOption = screen.getByRole('menuitem', { name: 'asc' });
  act(() => {
    fireEvent.click(ascOption);
  });
  expect(onOrderChange).toHaveBeenCalledWith('asc');
  expect(screen.getByText(/Order: asc/)).toBeInTheDocument();
});

test('per page dropdown updates value, resets page and invokes callback', () => {
  const onPerPageChange = jest.fn();
  mockHook({ totalCount: 120 });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable
          query={''}
          onPerPageChange={onPerPageChange}
          queryParams={{ page: 2, per_page: 20, order: 'desc' }}
        />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText(/Per page: 20/)).toBeInTheDocument();
  act(() => {
    fireEvent.click(screen.getByLabelText('Items per page'));
  });
  const option30 = screen.getByRole('menuitem', { name: '30' });
  act(() => {
    fireEvent.click(option30);
  });
  expect(onPerPageChange).toHaveBeenCalledWith(30);
  expect(screen.getByText(/Per page: 30/)).toBeInTheDocument();
  // page reset to 1
  expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
});

test('totalCount prop overrides fetchedTotal', () => {
  mockHook({ totalCount: 200 });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable query={''} totalCount={555} />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('Total: 555')).toBeInTheDocument();
});

test('uses fetched totalCount when prop not provided', () => {
  mockHook({ totalCount: 42 });
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('Total: 42')).toBeInTheDocument();
});

test('column visibility toggle hides column', async () => {
  mockHook();
  render(
    <AuthProvider>
      <MemoryRouter>
        <MetricsTable query={''} />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('COMMENTS')).toBeInTheDocument();
  act(() => {
    fireEvent.click(screen.getByLabelText('Choose columns'));
  });
  const commentsToggle = screen.getByRole('menuitem', { name: 'Comments' });
  await act(async () => {
    fireEvent.click(commentsToggle);
  });
  expect(screen.queryByText('COMMENTS')).not.toBeInTheDocument();
});

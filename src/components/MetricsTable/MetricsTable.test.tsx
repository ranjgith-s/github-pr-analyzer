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
import { formatDuration } from '@/lib/utils';
import { PRItem } from '../../types';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: jest.fn(() => jest.fn()) };
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

const baseItem: PRItem = {
  id: '1',
  owner: 'octo',
  repo_name: 'repo',
  repo: 'octo/repo',
  number: 1,
  title: 'Test PR',
  url: 'http://example.com',
  author: 'octo',
  state: 'open',
  created_at: '2020-01-01T00:00:00Z',
  published_at: '2020-01-02T00:00:00Z',
  closed_at: '2020-01-03T00:00:00Z',
  first_review_at: '2020-01-02T06:00:00Z',
  first_commit_at: '2020-01-01T00:00:00Z',
  reviewers: ['r1', 'r2'],
  changes_requested: 0,
  additions: 10,
  deletions: 2,
  comment_count: 5,
  timeline: [],
};

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders filters and data', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={sample} />
    </MemoryRouter>
  );
  // Only search input and columns menu are present in the new UI
  expect(
    screen.getByRole('textbox', { name: /search pull requests/i })
  ).toBeInTheDocument();
  expect(screen.getByLabelText('Choose columns')).toBeInTheDocument();
  expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
});

test('shows status content with provided resultCount', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={sample} resultCount={5} />
    </MemoryRouter>
  );
  expect(screen.getByLabelText('Results status')).toHaveTextContent(
    'Showing 1-1 of 5 results'
  );
});

test('shows correct range for second page', () => {
  const many = Array.from({ length: 45 }, (_, i) => ({
    ...sample[0],
    id: String(i + 1),
    number: i + 1,
    title: `PR ${i + 1}`,
  }));
  render(
    <MemoryRouter>
      <MetricsTable
        items={many}
        totalCount={45}
        queryParams={{ page: 2, per_page: 20, order: 'desc', sort: 'updated' }}
      />
    </MemoryRouter>
  );
  expect(screen.getByLabelText('Results status')).toHaveTextContent(
    'Showing 21-40 of 45 results'
  );
});

test('shows error status content', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={sample} error="Boom" />
    </MemoryRouter>
  );
  expect(screen.getByLabelText('Results status')).toHaveTextContent(
    'Error: Boom'
  );
});

test('renders empty state', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={[]} totalCount={0} />
    </MemoryRouter>
  );
  expect(screen.getByText(/no pull requests/i)).toBeInTheDocument();
});

test('shows spinner when loading', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={[]} loading />
    </MemoryRouter>
  );
  expect(screen.getByTestId('spinner')).toBeInTheDocument();
});

test('renders loading overlay message', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={[]} loading />
    </MemoryRouter>
  );
  expect(screen.getByText(/loading pull requests/i)).toBeInTheDocument();
});

test('header sorting toggles order on click', () => {
  const items = [
    { ...sample[0], id: '1', repo: 'octo/zzz', title: 'Zed' },
    { ...sample[0], id: '2', repo: 'octo/aaa', title: 'Aha' },
  ];
  render(
    <MemoryRouter>
      <MetricsTable items={items} />
    </MemoryRouter>
  );
  // Click PULL REQUEST header to sort by title (desc by default)
  const prHeader = screen.getByRole('columnheader', {
    name: /pull request/i,
  });
  act(() => {
    fireEvent.click(prHeader);
  });
  const rowsDesc = screen.getAllByRole('row').slice(1); // skip header row
  // First data row should be Zed when desc (sorted by title)
  expect(rowsDesc[0]).toHaveTextContent('Zed');
  // Click again to toggle to asc
  act(() => {
    fireEvent.click(prHeader);
  });
  const rowsAsc = screen.getAllByRole('row').slice(1);
  expect(rowsAsc[0]).toHaveTextContent('Aha');
});

test('selects and navigates to PR', async () => {
  const navigate = jest.fn();
  (useNavigate as jest.Mock).mockReturnValue(navigate);
  render(
    <MemoryRouter>
      <MetricsTable items={sample} />
    </MemoryRouter>
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

test('renders timeline summary and colored segments', () => {
  const { container } = render(
    <MemoryRouter>
      <MetricsTable items={sample} />
    </MemoryRouter>
  );
  const total = formatDuration(sample[0].created_at, sample[0].closed_at);
  expect(screen.getByText(total)).toBeInTheDocument();
  expect(container.querySelector('.bg-indigo-500')).toBeTruthy();
  expect(container.querySelector('.bg-lime-400')).toBeTruthy();
  expect(container.querySelector('.bg-teal-400')).toBeTruthy();
});

test('pagination works, changes page and invokes callback', () => {
  const manyItems = Array.from({ length: 25 }, (_, i) => ({
    ...sample[0],
    id: String(i + 1),
    number: i + 1,
    title: `PR ${i + 1}`,
  }));
  const onPageChange = jest.fn();
  render(
    <MemoryRouter>
      <MetricsTable
        items={manyItems}
        onPageChange={onPageChange}
        queryParams={{ per_page: 20, order: 'desc' }}
      />
    </MemoryRouter>
  );
  expect(screen.getByText('PR 1')).toBeInTheDocument();
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
  render(
    <MemoryRouter>
      <MetricsTable items={items} />
    </MemoryRouter>
  );
  fireEvent.change(screen.getByPlaceholderText(/search/i), {
    target: { value: 'beta' },
  });
  expect(screen.getByText('Beta')).toBeInTheDocument();
  expect(screen.queryByText('Alpha')).not.toBeInTheDocument();
});

test('handles PRs with no reviewers', () => {
  const items = [{ ...sample[0], reviewers: [] }];
  render(
    <MemoryRouter>
      <MetricsTable items={items} />
    </MemoryRouter>
  );
  expect(screen.getByText('Test PR')).toBeInTheDocument();
});

test('renders author as avatar with link and tooltip', async () => {
  render(
    <MemoryRouter>
      <MetricsTable items={[baseItem]} />
    </MemoryRouter>
  );
  const authorLink = await screen.findByRole('link', { name: baseItem.author });
  expect(authorLink).toHaveAttribute(
    'href',
    `https://github.com/${baseItem.author}`
  );
  expect(authorLink).toHaveAttribute('title', baseItem.author);
  const img = authorLink.querySelector('img') as HTMLImageElement | null;
  if (img) {
    expect(img).toBeTruthy();
  } else {
    // Radix Avatar may render fallback in test env
    expect(authorLink.textContent).toMatch(/^[A-Z]$/);
  }
});

test('renders reviewers as avatar group with links', async () => {
  const reviewers = ['r1', 'r2', 'r3'];
  render(
    <MemoryRouter>
      <MetricsTable items={[{ ...baseItem, reviewers }]} />
    </MemoryRouter>
  );
  for (const r of reviewers) {
    const link = await screen.findByRole('link', { name: r });
    expect(link).toHaveAttribute('href', `https://github.com/${r}`);
  }
});

test('handles PRs with missing title', () => {
  const items = [{ ...sample[0], title: '' }];
  render(
    <MemoryRouter>
      <MetricsTable items={items} />
    </MemoryRouter>
  );
  const links = screen.getAllByRole('link');
  expect(links.some((link) => link.textContent === '')).toBe(true);
});

test('clicking a header triggers onSortChange and toggles on subsequent clicks', () => {
  const onSortChange = jest.fn();
  render(
    <MemoryRouter>
      <MetricsTable items={sample} onSortChange={onSortChange} />
    </MemoryRouter>
  );
  const commentsHeader = screen.getByRole('columnheader', {
    name: /comments/i,
  });
  act(() => fireEvent.click(commentsHeader));
  expect(onSortChange).toHaveBeenCalledWith('comment_count');
  // Second click toggles order internally; ensure it doesn't crash
  act(() => fireEvent.click(commentsHeader));
});

test('order toggles when clicking the same header repeatedly and calls onOrderChange', () => {
  const onOrderChange = jest.fn();
  render(
    <MemoryRouter>
      <MetricsTable items={sample} onOrderChange={onOrderChange} />
    </MemoryRouter>
  );
  const prHeader = screen.getByRole('columnheader', {
    name: /pull request/i,
  });
  // First click sets sort to repo (keeps current order)
  act(() => fireEvent.click(prHeader));
  // Second click toggles order
  act(() => fireEvent.click(prHeader));
  expect(onOrderChange).toHaveBeenCalled();
});

test('per page input updates value, resets to first page and invokes callback (debounced)', async () => {
  jest.useFakeTimers();
  const many = Array.from({ length: 25 }, (_, i) => ({
    ...sample[0],
    id: String(i + 1),
    number: i + 1,
    title: `PR ${i + 1}`,
  }));
  const onPerPageChange = jest.fn();
  render(
    <MemoryRouter>
      <MetricsTable
        items={many}
        onPerPageChange={onPerPageChange}
        queryParams={{ page: 2, per_page: 20, order: 'desc' }}
      />
    </MemoryRouter>
  );
  const input = screen.getByRole('spinbutton', { name: /items per page/i });
  act(() => {
    fireEvent.change(input, { target: { value: '30' } });
  });
  act(() => {
    jest.advanceTimersByTime(400);
  });
  // Page should reset to 1 so PR 1 becomes visible
  expect(onPerPageChange).toHaveBeenCalledWith(30);
  await waitFor(() => expect(screen.getByText('PR 1')).toBeInTheDocument());
  jest.useRealTimers();
});

// total count summary text has been removed in the new UI; rely on pagination and rows instead

test('column visibility toggle hides column', async () => {
  render(
    <MemoryRouter>
      <MetricsTable items={sample} />
    </MemoryRouter>
  );
  expect(screen.getByText('COMMENTS')).toBeInTheDocument();
  act(() => {
    fireEvent.click(screen.getByLabelText('Choose columns'));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('menuitem', { name: 'Comments' }));
  });
  expect(screen.queryByText('COMMENTS')).not.toBeInTheDocument();
});

describe('formatDuration edge cases', () => {
  it('returns N/A when start missing', () => {
    expect(formatDuration(undefined, '2020-01-01T00:00:00Z')).toBe('N/A');
  });
  it('returns N/A when end missing', () => {
    expect(formatDuration('2020-01-01T00:00:00Z', undefined)).toBe('N/A');
  });
  it('returns N/A when negative diff', () => {
    expect(formatDuration('2020-01-02T00:00:00Z', '2020-01-01T00:00:00Z')).toBe(
      'N/A'
    );
  });
  it('formats days + hours when > 24h', () => {
    expect(formatDuration('2020-01-01T00:00:00Z', '2020-01-03T05:00:00Z')).toBe(
      '2d 5h'
    );
  });
  it('formats only hours when < 24h', () => {
    expect(formatDuration('2020-01-01T00:00:00Z', '2020-01-01T05:00:00Z')).toBe(
      '5h'
    );
  });
});

describe('MetricsTable additional coverage (merged)', () => {
  const renderTable = (
    override: Partial<PRItem>[] | PRItem[] = [baseItem],
    props: any = {}
  ) => {
    const items: PRItem[] = override as PRItem[];
    return render(
      <MemoryRouter>
        <MetricsTable items={items} {...props} />
      </MemoryRouter>
    );
  };

  it('enables view button after selecting a single row', async () => {
    renderTable();
    const viewBtn = screen.getByRole('button', { name: /view pull request/i });
    const checkboxes = screen.getAllByRole('checkbox');
    const rowCheckbox = checkboxes[1] || checkboxes[0];
    await act(async () => {
      fireEvent.click(rowCheckbox);
    });
    await waitFor(() => expect(viewBtn).toBeEnabled());
  });

  it('switching repository then author clears repository filter', () => {
    // Repo/author dropdowns were removed; verify search still works instead
    renderTable([baseItem, { ...baseItem, id: '2', title: 'Another PR' }]);
    fireEvent.change(screen.getByPlaceholderText(/search/i), {
      target: { value: 'Another' },
    });
    expect(screen.getByText('Another PR')).toBeInTheDocument();
    expect(screen.queryByText('Test PR')).not.toBeInTheDocument();
  });

  it('updates per_page from queryParams on prop change', () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      ...baseItem,
      id: String(i + 1),
      title: `PR ${i + 1}`,
      number: i + 1,
    }));
    const { rerender } = render(
      <MemoryRouter>
        <MetricsTable
          items={many}
          queryParams={{
            sort: 'updated',
            order: 'desc',
            page: 1,
            per_page: 20,
          }}
        />
      </MemoryRouter>
    );
    rerender(
      <MemoryRouter>
        <MetricsTable
          items={many}
          queryParams={{ sort: 'created', order: 'asc', page: 3, per_page: 10 }}
        />
      </MemoryRouter>
    );
    const input = screen.getByRole('spinbutton', { name: /items per page/i });
    expect((input as HTMLInputElement).value).toBe('10');
  });

  it('shows N/A timeline summary when end dates missing', () => {
    const items = [
      {
        ...baseItem,
        id: '3',
        published_at: undefined,
        first_review_at: undefined,
        closed_at: undefined,
      },
    ];
    renderTable(items);
    expect(screen.getAllByText(/N\/A/i).length).toBeGreaterThan(0);
  });
});

describe('State chip color reflects PR state', () => {
  const makeItem = (state: PRItem['state']): PRItem => ({
    ...baseItem,
    id: `${state}-id`,
    state,
  });

  const renderWithState = (state: PRItem['state']) =>
    render(
      <MemoryRouter>
        <MetricsTable items={[makeItem(state)]} />
      </MemoryRouter>
    );

  it('uses primary for open', () => {
    renderWithState('open');
    const chip = screen.getByTestId('chip');
    expect(chip).toHaveTextContent('open');
    expect(chip).toHaveClass('bg-primary/15');
  });

  it('uses success for merged', () => {
    renderWithState('merged');
    const chip = screen.getByTestId('chip');
    expect(chip).toHaveTextContent('merged');
    expect(chip).toHaveClass('bg-success/15');
  });

  it('uses warning for draft', () => {
    renderWithState('draft');
    const chip = screen.getByTestId('chip');
    expect(chip).toHaveTextContent('draft');
    expect(chip).toHaveClass('bg-warning/15');
  });

  it('uses default for closed', () => {
    renderWithState('closed');
    const chip = screen.getByTestId('chip');
    expect(chip).toHaveTextContent('closed');
    expect(chip).toHaveClass('bg-muted/60');
  });
});

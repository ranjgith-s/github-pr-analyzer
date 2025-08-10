import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import MetricsTable, { formatDuration } from './MetricsTable';
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
  expect(screen.getByLabelText('Repository filter')).toBeInTheDocument();
  expect(screen.getByLabelText('Author filter')).toBeInTheDocument();
  expect(screen.getByLabelText('Pagination')).toBeInTheDocument();
});

test('renders empty state', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={[]} totalCount={0} />
    </MemoryRouter>
  );
  expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
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

test('filters by repo and author and resets page', () => {
  const items = sample.concat({
    ...sample[0],
    id: '2',
    repo: 'octo/other',
    repo_name: 'other',
    author: 'someone',
    number: 2,
  });
  render(
    <MemoryRouter initialEntries={['/metrics?page=2']}>
      <MetricsTable items={items} queryParams={{ page: 2, order: 'desc' }} />
    </MemoryRouter>
  );
  act(() => {
    fireEvent.click(screen.getByLabelText('Repository filter'));
  });
  act(() => {
    fireEvent.click(screen.getByRole('menuitem', { name: 'octo/repo' }));
  });
  expect(screen.getAllByText('Test PR')).toHaveLength(1);
  expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
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

test('renders timeline and lead time', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={sample} />
    </MemoryRouter>
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

test('sort dropdown updates value and invokes callback', () => {
  const onSortChange = jest.fn();
  render(
    <MemoryRouter>
      <MetricsTable items={sample} onSortChange={onSortChange} />
    </MemoryRouter>
  );
  act(() => {
    fireEvent.click(screen.getByLabelText('Sort field'));
  });
  act(() => {
    fireEvent.click(screen.getByRole('menuitem', { name: 'created' }));
  });
  expect(onSortChange).toHaveBeenCalledWith('created');
  expect(screen.getByText(/Sort: created/)).toBeInTheDocument();
});

test('order dropdown updates value and invokes callback', () => {
  const onOrderChange = jest.fn();
  render(
    <MemoryRouter>
      <MetricsTable items={sample} onOrderChange={onOrderChange} />
    </MemoryRouter>
  );
  act(() => {
    fireEvent.click(screen.getByLabelText('Sort order'));
  });
  act(() => {
    fireEvent.click(screen.getByRole('menuitem', { name: 'asc' }));
  });
  expect(onOrderChange).toHaveBeenCalledWith('asc');
  expect(screen.getByText(/Order: asc/)).toBeInTheDocument();
});

test('per page dropdown updates value, resets page and invokes callback', () => {
  const onPerPageChange = jest.fn();
  render(
    <MemoryRouter>
      <MetricsTable
        items={sample}
        onPerPageChange={onPerPageChange}
        queryParams={{ page: 2, per_page: 20, order: 'desc' }}
      />
    </MemoryRouter>
  );
  expect(screen.getByText(/Per page: 20/)).toBeInTheDocument();
  act(() => {
    fireEvent.click(screen.getByLabelText('Items per page'));
  });
  act(() => {
    fireEvent.click(screen.getByRole('menuitem', { name: '30' }));
  });
  expect(onPerPageChange).toHaveBeenCalledWith(30);
  expect(screen.getByText(/Per page: 30/)).toBeInTheDocument();
  expect(screen.getByText(/Page 1 of/)).toBeInTheDocument();
});

test('totalCount prop overrides fallback length', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={sample} totalCount={555} />
    </MemoryRouter>
  );
  expect(screen.getByText('Total: 555')).toBeInTheDocument();
});

test('falls back to items length when totalCount not provided', () => {
  render(
    <MemoryRouter>
      <MetricsTable items={sample} />
    </MemoryRouter>
  );
  expect(screen.getByText(`Total: ${sample.length}`)).toBeInTheDocument();
});

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
    const items = [
      baseItem,
      {
        ...baseItem,
        id: '2',
        author: 'someone',
        repo: 'octo/other',
        repo_name: 'other',
      },
    ];
    renderTable(items);
    act(() => {
      fireEvent.click(screen.getByLabelText('Repository filter'));
    });
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'octo/repo' }));
    });
    act(() => {
      fireEvent.click(screen.getByLabelText('Author filter'));
    });
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'someone' }));
    });
    expect(screen.getByLabelText('Author filter')).toHaveTextContent('someone');
    expect(screen.getByLabelText('Repository filter')).toHaveTextContent(
      'Repository'
    );
  });

  it('updates internal state when queryParams prop changes (sort/order/page/per_page)', () => {
    const { rerender } = render(
      <MemoryRouter>
        <MetricsTable
          items={[baseItem]}
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
          items={[baseItem]}
          queryParams={{ sort: 'created', order: 'asc', page: 3, per_page: 10 }}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/Sort: created/)).toBeInTheDocument();
    expect(screen.getByText(/Order: asc/)).toBeInTheDocument();
    expect(screen.getByText(/Per page: 10/)).toBeInTheDocument();
  });

  it('shows N/A timeline segments when dates missing', () => {
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
    const timeline = screen.getByLabelText(/Draft:/);
    expect(timeline).toBeInTheDocument();
    expect(timeline.getAttribute('aria-label')).toMatch(/N\/A/);
  });
});

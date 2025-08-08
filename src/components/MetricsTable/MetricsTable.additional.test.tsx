import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MetricsTable, { formatDuration } from './MetricsTable';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';
import * as metricsHook from '../../hooks/usePullRequestMetrics';
import { PRItem } from '../../types';

// Reuse the same mocking pattern as primary test file
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: jest.fn(() => jest.fn()),
  };
});

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

const mockHook = (
  override: Partial<ReturnType<typeof metricsHook.usePullRequestMetrics>> = {}
) => {
  return jest.spyOn(metricsHook, 'usePullRequestMetrics').mockReturnValue({
    items: [baseItem],
    loading: false,
    error: null,
    totalCount: 1,
    ...override,
  } as any);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockHook();
});

/**
 * formatDuration edge cases
 */

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
    // 2 days 5 hours
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

/**
 * MetricsTable additional interaction edge cases
 */

describe('MetricsTable additional coverage', () => {
  const renderTable = (props: any = {}) =>
    render(
      <AuthProvider>
        <MemoryRouter>
          <MetricsTable query="" {...props} />
        </MemoryRouter>
      </AuthProvider>
    );

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
    mockHook({
      items: [
        baseItem,
        {
          ...baseItem,
          id: '2',
          author: 'someone',
          repo: 'octo/other',
          repo_name: 'other',
        },
      ],
      totalCount: 2,
    });
    renderTable();
    act(() => {
      fireEvent.click(screen.getByLabelText('Repository filter'));
    });
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'octo/repo' }));
    });
    // now pick author filter -> should clear repo filter
    act(() => {
      fireEvent.click(screen.getByLabelText('Author filter'));
    });
    act(() => {
      fireEvent.click(screen.getByRole('menuitem', { name: 'someone' }));
    });
    // Author button should show someone and repo button should revert to placeholder text
    expect(screen.getByLabelText('Author filter')).toHaveTextContent('someone');
    expect(screen.getByLabelText('Repository filter')).toHaveTextContent(
      'Repository'
    );
  });

  it('updates internal state when queryParams prop changes (sort/order/page/per_page)', () => {
    const { rerender } = render(
      <AuthProvider>
        <MemoryRouter>
          <MetricsTable
            query=""
            queryParams={{
              sort: 'updated',
              order: 'desc',
              page: 1,
              per_page: 20,
            }}
          />
        </MemoryRouter>
      </AuthProvider>
    );
    // change queryParams
    rerender(
      <AuthProvider>
        <MemoryRouter>
          <MetricsTable
            query=""
            queryParams={{
              sort: 'created',
              order: 'asc',
              page: 3,
              per_page: 10,
            }}
          />
        </MemoryRouter>
      </AuthProvider>
    );
    // open sort and order dropdowns to read current label text
    expect(screen.getByText(/Sort: created/)).toBeInTheDocument();
    expect(screen.getByText(/Order: asc/)).toBeInTheDocument();
    expect(screen.getByText(/Per page: 10/)).toBeInTheDocument();
  });

  it('shows N/A timeline segments when dates missing', () => {
    mockHook({
      items: [
        {
          ...baseItem,
          id: '3',
          published_at: undefined,
          first_review_at: undefined,
          closed_at: undefined,
        },
      ],
    });
    renderTable();
    const timeline = screen.getByLabelText(/Draft:/);
    expect(timeline).toBeInTheDocument();
    // ensure formatDuration fallback produced N/A inside aria-label
    expect(timeline.getAttribute('aria-label')).toMatch(/N\/A/);
  });
});

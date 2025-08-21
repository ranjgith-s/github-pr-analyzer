import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext/AuthContext';

let navigateMock: jest.Mock;
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const usePullRequestMetricsMock = jest.fn();
jest.mock('../../hooks/usePullRequestMetrics', () => ({
  usePullRequestMetrics: (...args: any[]) => usePullRequestMetricsMock(...args), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

const MetricsTableMock: any = jest.fn(() => (
  // eslint-disable-line @typescript-eslint/no-explicit-any
  <div data-testid="metrics-table" />
));
jest.mock('../../components/MetricsTable/MetricsTable', () => ({
  __esModule: true,
  default: (props: any) => MetricsTableMock(props), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

import MetricsPage from './MetricsPage';

const baseAuth = {
  token: 'tok',
  user: { login: 'tester', avatar_url: '' },
  login: jest.fn(),
  logout: jest.fn(),
};

function renderPage(
  initialEntries: string[] = ['/insights?q=is:pr'],
  auth: any = baseAuth // eslint-disable-line @typescript-eslint/no-explicit-any
) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthContext.Provider value={auth}>
        <MetricsPage />
      </AuthContext.Provider>
    </MemoryRouter>
  );
}

describe('MetricsPage (minimal UI)', () => {
  beforeEach(() => {
    navigateMock = jest.fn();
    jest.clearAllMocks();
  });

  test('shows loading skeleton when loading & no items', () => {
    usePullRequestMetricsMock.mockReturnValue({
      items: [],
      loading: true,
      error: null,
      totalCount: 0,
      rateLimit: null,
    });
    renderPage();
    expect(screen.getByLabelText('Loading results')).toBeInTheDocument();
  });

  test('shows error state and retry triggers navigation', () => {
    usePullRequestMetricsMock.mockReturnValue({
      items: [],
      loading: false,
      error: 'Boom',
      totalCount: 0,
      rateLimit: null,
    });
    renderPage(['/insights?q=is:pr']);
    expect(
      screen.getByText(/Failed to load pull request data/i)
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Retry/i));
    expect(navigateMock).toHaveBeenCalled();
    expect(navigateMock.mock.calls[0][0]).toMatch(/\/insights\?q=is%3Apr/);
  });

  test('shows empty state', () => {
    usePullRequestMetricsMock.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      totalCount: 0,
      rateLimit: null,
    });
    renderPage(['/insights?q=is:pr']);
    expect(
      screen.getByText(/No pull requests found for this query/i)
    ).toBeInTheDocument();
  });

  test('renders summary metrics and table', () => {
    const now = new Date();
    const earlier = new Date(now.getTime() - 2 * 3600 * 1000);
    usePullRequestMetricsMock.mockReturnValue({
      items: [
        {
          id: '1',
          owner: 'o',
          repo_name: 'r',
          repo: 'o/r',
          number: 1,
          title: 'PR1',
          url: '',
          author: 'tester',
          state: 'merged',
          created_at: earlier.toISOString(),
          published_at: earlier.toISOString(),
          first_commit_at: earlier.toISOString(),
          first_review_at: now.toISOString(),
          closed_at: now.toISOString(),
          reviewers: [],
          changes_requested: 0,
          additions: 0,
          deletions: 0,
          comment_count: 0,
          timeline: [],
        },
      ],
      loading: false,
      error: null,
      totalCount: 1,
      rateLimit: {
        remaining: 80,
        limit: 100,
        reset: Math.floor(Date.now() / 1000) + 60,
      },
    });
    renderPage();
    expect(screen.getByText('PRs')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-table')).toBeInTheDocument();
  });

  test('table callback handlers update URL params', () => {
    MetricsTableMock.mockImplementationOnce(
      (
        props: any // eslint-disable-line @typescript-eslint/no-explicit-any
      ) => (
        <div>
          <button onClick={() => props.onPageChange(2)}>Page</button>
          <button onClick={() => props.onPerPageChange(50)}>Per</button>
          <button onClick={() => props.onSortChange('created')}>Sort</button>
          <button onClick={() => props.onOrderChange('asc')}>Order</button>
        </div>
      )
    );

    usePullRequestMetricsMock.mockReturnValue({
      items: [
        {
          id: '1',
          owner: 'o',
          repo_name: 'r',
          repo: 'o/r',
          number: 1,
          title: 'PR',
          url: '',
          author: 'tester',
          state: 'open',
          created_at: new Date().toISOString(),
          reviewers: [],
          changes_requested: 0,
          additions: 0,
          deletions: 0,
          comment_count: 0,
          timeline: [],
        },
      ],
      loading: false,
      error: null,
      totalCount: 1,
      rateLimit: null,
    });

    renderPage(['/insights?q=is:pr']);
    fireEvent.click(screen.getByText('Page'));
    fireEvent.click(screen.getByText('Per'));
    fireEvent.click(screen.getByText('Sort'));
    fireEvent.click(screen.getByText('Order'));

    const joined = navigateMock.mock.calls.map((c) => c[0]).join('\n');
    expect(joined).toMatch(/page=2/);
    expect(joined).toMatch(/per_page=50/);
    expect(joined).toMatch(/sort=created/);
    expect(joined).toMatch(/order=asc/);
  });

  test('sorting by a non-legacy column id updates URL and resets page to 1', () => {
    MetricsTableMock.mockImplementationOnce((props: any) => (
      <button onClick={() => props.onSortChange('author')}>SortHeader</button>
    ));

    usePullRequestMetricsMock.mockReturnValue({
      items: [
        {
          id: '1',
          owner: 'o',
          repo_name: 'r',
          repo: 'o/r',
          number: 1,
          title: 'PR',
          url: '',
          author: 'tester',
          state: 'open',
          created_at: new Date().toISOString(),
          reviewers: [],
          changes_requested: 0,
          additions: 0,
          deletions: 0,
          comment_count: 0,
          timeline: [],
        },
      ],
      loading: false,
      error: null,
      totalCount: 1,
      rateLimit: null,
    });

    renderPage(['/insights?q=is:pr&page=3&sort=updated&order=desc']);
    fireEvent.click(screen.getByText('SortHeader'));

    const last = navigateMock.mock.calls.pop()?.[0] as string;
    expect(last).toMatch(/sort=author/);
    // page=1 is omitted by buildQueryString; ensure previous page param was cleared
    expect(last).not.toMatch(/page=/);
  });

  test('changing order resets page to 1 and updates URL', () => {
    MetricsTableMock.mockImplementationOnce((props: any) => (
      <button onClick={() => props.onOrderChange('desc')}>OrderToggle</button>
    ));

    usePullRequestMetricsMock.mockReturnValue({
      items: [
        {
          id: '1',
          owner: 'o',
          repo_name: 'r',
          repo: 'o/r',
          number: 1,
          title: 'PR',
          url: '',
          author: 'tester',
          state: 'open',
          created_at: new Date().toISOString(),
          reviewers: [],
          changes_requested: 0,
          additions: 0,
          deletions: 0,
          comment_count: 0,
          timeline: [],
        },
      ],
      loading: false,
      error: null,
      totalCount: 1,
      rateLimit: null,
    });

    renderPage(['/insights?q=is:pr&page=2&order=asc']);
    fireEvent.click(screen.getByText('OrderToggle'));

    const last = navigateMock.mock.calls.pop()?.[0] as string;
    // order=desc is omitted by buildQueryString; ensure order param removed
    expect(last).not.toMatch(/order=/);
    // page=1 is omitted as default; ensure page param removed
    expect(last).not.toMatch(/page=/);
  });

  test('renders em dash when median metrics unavailable', () => {
    usePullRequestMetricsMock.mockReturnValue({
      items: [
        {
          id: '2',
          owner: 'o',
          repo_name: 'r',
          repo: 'o/r',
          number: 2,
          title: 'Open PR',
          url: '',
          author: 'tester',
          state: 'open',
          created_at: new Date().toISOString(),
          reviewers: [],
          changes_requested: 0,
          additions: 10,
          deletions: 2,
          comment_count: 1,
          timeline: [],
        },
      ],
      loading: false,
      error: null,
      totalCount: 1,
      rateLimit: null,
    });
    renderPage(['/insights?q=is:pr']);
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1); // At least one dash for missing metrics
  });
});

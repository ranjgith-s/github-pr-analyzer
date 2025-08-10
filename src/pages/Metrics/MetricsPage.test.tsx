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
  usePullRequestMetrics: (...args: any[]) => usePullRequestMetricsMock(...args),
}));

const MetricsTableMock: any = jest.fn(() => (
  <div data-testid="metrics-table" />
)); // eslint-disable-line @typescript-eslint/no-explicit-any
jest.mock('../../components/MetricsTable/MetricsTable', () => ({
  __esModule: true,
  default: (props: any) => MetricsTableMock(props), // eslint-disable-line @typescript-eslint/no-explicit-any
}));

// Import after mocks so they apply correctly
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

describe('MetricsPage', () => {
  beforeEach(() => {
    navigateMock = jest.fn();
    jest.clearAllMocks();
  });

  test('shows loading overlay when loading & no items', () => {
    usePullRequestMetricsMock.mockReturnValue({
      items: [],
      loading: true,
      error: null,
      totalCount: 0,
      incomplete: false,
      rateLimit: null,
    });
    renderPage();
    expect(screen.getByText(/Loading pull request data/i)).toBeInTheDocument();
  });

  test('shows error state and retry triggers navigation', () => {
    usePullRequestMetricsMock.mockReturnValue({
      items: [],
      loading: false,
      error: 'Boom',
      totalCount: 0,
      incomplete: false,
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

  test('shows empty state and sample query updates URL', () => {
    usePullRequestMetricsMock.mockReturnValue({
      items: [],
      loading: false,
      error: null,
      totalCount: 0,
      incomplete: false,
      rateLimit: null,
    });
    renderPage(['/insights?q=is:pr']);
    const sampleBtn = screen.getByRole('button', {
      name: /is:pr is:open author:@me/i,
    });
    fireEvent.click(sampleBtn);
    expect(navigateMock).toHaveBeenCalled();
    expect(
      navigateMock.mock.calls[navigateMock.mock.calls.length - 1][0]
    ).toMatch(/author%3A%40me/);
  });

  test('renders summary metrics, table and normal rate limit badge', () => {
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
      incomplete: false,
      rateLimit: {
        remaining: 80,
        limit: 100,
        reset: Math.floor(Date.now() / 1000) + 60,
      },
    });
    renderPage();
    expect(screen.getByText('PRs')).toBeInTheDocument();
    expect(screen.getByTestId('metrics-table')).toBeInTheDocument();
    expect(screen.getByText(/API 80\/100/).className).toMatch(
      /text-default-500/
    );
  });

  test('rate limit warning (<30%) and danger (<10%) colors', () => {
    const baseItem = {
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
    };

    usePullRequestMetricsMock.mockReturnValue({
      items: [baseItem],
      loading: false,
      error: null,
      totalCount: 1,
      incomplete: false,
      rateLimit: {
        remaining: 20,
        limit: 100,
        reset: Math.floor(Date.now() / 1000) + 60,
      },
    });
    const { rerender } = renderPage();
    expect(screen.getByText(/API 20\/100/).className).toMatch(/text-warning/);

    usePullRequestMetricsMock.mockReturnValue({
      items: [baseItem],
      loading: false,
      error: null,
      totalCount: 1,
      incomplete: false,
      rateLimit: {
        remaining: 5,
        limit: 100,
        reset: Math.floor(Date.now() / 1000) + 60,
      },
    });
    rerender(
      <MemoryRouter initialEntries={['/insights?q=is:pr']}>
        <AuthContext.Provider value={baseAuth}>
          <MetricsPage />
        </AuthContext.Provider>
      </MemoryRouter>
    );
    expect(screen.getByText(/API 5\/100/).className).toMatch(/text-danger/);
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
      incomplete: false,
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

  test('renders summary cards with em dash when median metrics unavailable', () => {
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
      incomplete: false,
      rateLimit: null,
    });
    renderPage(['/insights?q=is:pr']);
    // Expect em dash for median lead/review values
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(2);
  });
});

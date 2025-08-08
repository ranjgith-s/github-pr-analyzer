import { renderHook, waitFor } from '@testing-library/react';
import { usePullRequestMetrics } from '../../hooks/usePullRequestMetrics';
import * as githubService from '../../utils/services/githubService';
import { PRItem } from 'src/types';

const mockPRItem: PRItem = {
  id: '1',
  owner: 'octo',
  repo_name: 'repo',
  repo: 'octo/repo',
  number: 1,
  title: 'Test PR',
  url: 'https://github.com/octo/repo/pull/1',
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
};

const mockPRSearchResult: githubService.PRSearchResult = {
  total_count: 1,
  incomplete_results: false,
  items: [mockPRItem],
};

// Mocks
const mockFetchPullRequestMetrics = jest.spyOn(
  githubService,
  'fetchPullRequestMetrics'
);
const mockGetRateLimit = jest.spyOn(githubService, 'getRateLimit');

describe('usePullRequestMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetRateLimit.mockResolvedValue({
      remaining: 4999,
      limit: 5000,
      reset: 1234567890,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('loads items, totalCount, and rate limit successfully', async () => {
    mockFetchPullRequestMetrics.mockResolvedValue(mockPRSearchResult);

    const { result } = renderHook(() =>
      usePullRequestMetrics('token', { query: 'test' })
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBeNull();
    expect(result.current.incomplete).toBe(false);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([mockPRItem]);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.incomplete).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith('token', 'test', {
      page: undefined,
      sort: undefined,
      per_page: undefined,
      order: undefined,
    });
    expect(mockGetRateLimit).toHaveBeenCalledWith('token');
  });

  test('handles error state correctly', async () => {
    const errorMessage = 'API Error';
    mockFetchPullRequestMetrics.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() =>
      usePullRequestMetrics('token', { query: 'test' })
    );

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBeNull();
    expect(result.current.error).toBe(errorMessage);
  });

  test('does not call API when token missing', () => {
    const { result } = renderHook(() =>
      usePullRequestMetrics(null, { query: 'test' })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBeNull();
    expect(mockFetchPullRequestMetrics).not.toHaveBeenCalled();
  });

  test('does not call API when query empty', () => {
    const { result } = renderHook(() =>
      usePullRequestMetrics('token', { query: '' })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.totalCount).toBeNull();
    expect(mockFetchPullRequestMetrics).not.toHaveBeenCalled();
  });

  test('refetches when dependencies change', async () => {
    mockFetchPullRequestMetrics.mockResolvedValue(mockPRSearchResult);

    const { result, rerender } = renderHook(
      ({ token, options }) => usePullRequestMetrics(token, options),
      {
        initialProps: {
          token: 'token1',
          options: { query: 'test1' },
        },
      }
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith(
      'token1',
      'test1',
      {
        page: undefined,
        sort: undefined,
        per_page: undefined,
        order: undefined,
      }
    );

    rerender({ token: 'token2', options: { query: 'test2' } });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith(
      'token2',
      'test2',
      {
        page: undefined,
        sort: undefined,
        per_page: undefined,
        order: undefined,
      }
    );
    expect(mockFetchPullRequestMetrics).toHaveBeenCalledTimes(2);
  });

  test('passes all query options to API', async () => {
    mockFetchPullRequestMetrics.mockResolvedValue(mockPRSearchResult);

    const options = {
      query: 'test',
      page: 2,
      sort: 'created' as const,
      perPage: 50,
      order: 'asc' as const,
    };

    const { result } = renderHook(() =>
      usePullRequestMetrics('token', options)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith('token', 'test', {
      page: 2,
      sort: 'created',
      per_page: 50,
      order: 'asc',
    });
  });

  test('supports legacy array return format', async () => {
    mockFetchPullRequestMetrics.mockResolvedValue([
      mockPRItem,
    ] as unknown as githubService.PRSearchResult);

    const { result } = renderHook(() =>
      usePullRequestMetrics('token', { query: 'legacy' })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.items).toEqual([mockPRItem]);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.incomplete).toBe(false);
  });

  test('fetches rate limit after data load', async () => {
    mockFetchPullRequestMetrics.mockResolvedValue(mockPRSearchResult);
    mockGetRateLimit.mockResolvedValueOnce({
      remaining: 4000,
      limit: 5000,
      reset: 9999999999,
    });

    const { result } = renderHook(() =>
      usePullRequestMetrics('token', { query: 'rate' })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.rateLimit).toEqual({
      remaining: 4000,
      limit: 5000,
      reset: 9999999999,
    });
  });

  test('does not fetch rate limit if token missing', async () => {
    mockFetchPullRequestMetrics.mockResolvedValue(mockPRSearchResult);

    const { result } = renderHook(() =>
      usePullRequestMetrics(null, { query: 'something' })
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockGetRateLimit).not.toHaveBeenCalled();
    expect(result.current.rateLimit).toBeNull();
  });

  test('passes order param through', async () => {
    mockFetchPullRequestMetrics.mockResolvedValue(mockPRSearchResult);

    renderHook(() =>
      usePullRequestMetrics('token', {
        query: 'ordered',
        order: 'asc',
        page: 3,
        sort: 'updated',
        perPage: 10,
      })
    );

    await waitFor(() => expect(mockFetchPullRequestMetrics).toHaveBeenCalled());
    expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith(
      'token',
      'ordered',
      {
        page: 3,
        sort: 'updated',
        per_page: 10,
        order: 'asc',
      }
    );
  });
});

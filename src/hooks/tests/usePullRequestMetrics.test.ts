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

// Mock the GitHub service
const mockFetchPullRequestMetrics = jest.spyOn(
  githubService,
  'fetchPullRequestMetrics'
);

describe('usePullRequestMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('should load items and update loading state successfully', async () => {
    mockFetchPullRequestMetrics.mockResolvedValue(mockPRSearchResult);

    const { result } = renderHook(() =>
      usePullRequestMetrics('token', { query: 'test' })
    );

    // Initially should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();

    // Wait for loading to complete
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should have loaded the items
    expect(result.current.items).toEqual([mockPRItem]);
    expect(result.current.error).toBeNull();
    expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith('token', 'test', {
      page: undefined,
      sort: undefined,
      per_page: undefined,
    });
  });

  test('should handle error state correctly', async () => {
    const errorMessage = 'API Error';
    mockFetchPullRequestMetrics.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() =>
      usePullRequestMetrics('token', { query: 'test' })
    );

    // Initially should be loading
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeNull();

    // Wait for error to be set
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Should have error set and no items
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBe(errorMessage);
  });

  test('should not make API call when token is missing', () => {
    const { result } = renderHook(() =>
      usePullRequestMetrics(null, { query: 'test' })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockFetchPullRequestMetrics).not.toHaveBeenCalled();
  });

  test('should not make API call when query is empty', () => {
    const { result } = renderHook(() =>
      usePullRequestMetrics('token', { query: '' })
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.items).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockFetchPullRequestMetrics).not.toHaveBeenCalled();
  });

  test('should refetch data when dependencies change', async () => {
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
      }
    );

    // Change the props
    rerender({
      token: 'token2',
      options: { query: 'test2' },
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith(
      'token2',
      'test2',
      {
        page: undefined,
        sort: undefined,
        per_page: undefined,
      }
    );
    expect(mockFetchPullRequestMetrics).toHaveBeenCalledTimes(2);
  });

  test('should pass all query options to the API', async () => {
    mockFetchPullRequestMetrics.mockResolvedValue(mockPRSearchResult);

    const options = {
      query: 'test',
      page: 2,
      sort: 'created' as const,
      perPage: 50,
    };

    const { result } = renderHook(() =>
      usePullRequestMetrics('token', options)
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith('token', 'test', {
      page: 2,
      sort: 'created',
      per_page: 50,
    });
  });
});

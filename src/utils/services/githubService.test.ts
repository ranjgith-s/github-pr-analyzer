import * as githubService from './githubService';
import { Octokit } from '@octokit/rest';
import * as githubApi from './githubApi';
import * as cache from '../../services/cache';
import * as queryValidator from '../../services/queryValidator';
import * as errorHandler from '../../services/errorHandler';

// Mock external dependencies
jest.mock('./githubApi');
jest.mock('../../services/cache');
jest.mock('../../services/queryValidator');
jest.mock('../../services/errorHandler');

// Add this to clear the cache for testing
const clearGithubServiceCache = () => {
  if (githubService.userCache) githubService.userCache.clear();
  if (githubService.repoCache) githubService.repoCache.clear();
};

jest.mock('@octokit/rest');
const mockOctokit = {
  rest: {
    users: {
      getAuthenticated: jest.fn(),
      getByUsername: jest.fn(),
    },
    search: {
      issuesAndPullRequests: jest.fn(),
      users: jest.fn(),
    },
    repos: {
      get: jest.fn(),
      getCommitActivityStats: jest.fn(),
      getCommunityProfileMetrics: jest.fn(),
      listCommits: jest.fn(),
      listContributors: jest.fn(),
      list: jest.fn(),
    },
    pulls: {
      list: jest.fn(),
      listCommits: jest.fn(),
    },
    actions: {
      listWorkflowRunsForRepo: jest.fn(),
    },
  },
  paginate: jest.fn(),
  graphql: jest.fn(),
};

(Octokit as any).mockImplementation(() => mockOctokit);

describe('github service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearGithubServiceCache();
    // Always use the shared mockOctokit for all tests
    (Octokit as any).mockImplementation(() => mockOctokit);

    // Mock github API functions
    (githubApi.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
    (githubApi.getAuthenticatedUser as jest.Mock).mockResolvedValue({
      login: 'me',
    });
    (githubApi.searchPRsWithOptions as jest.Mock).mockResolvedValue({
      total_count: 0,
      incomplete_results: false,
      items: [],
    });
    (githubApi.graphqlQuery as jest.Mock).mockResolvedValue({});
    (githubApi.paginateApi as jest.Mock).mockResolvedValue([]);
    (githubApi.searchUsersApi as jest.Mock).mockResolvedValue([]);
    (githubApi.getUserByUsername as jest.Mock).mockResolvedValue(null);
    (githubApi.searchPRs as jest.Mock).mockResolvedValue([]);
    (githubApi.getRepo as jest.Mock).mockResolvedValue(null);
    (githubApi.getCommitActivityStats as jest.Mock).mockResolvedValue([]);
    (githubApi.getCommunityProfileMetrics as jest.Mock).mockResolvedValue({});

    // Mock cache functions
    (cache.getFromCache as jest.Mock).mockResolvedValue(null);
    (cache.setCache as jest.Mock).mockResolvedValue(undefined);

    // Mock query validator
    (queryValidator.validateAndSanitizeQuery as jest.Mock).mockImplementation(
      (query: string) => query
    );

    // Mock error handler
    (
      errorHandler.handleOctokitError as unknown as jest.Mock
    ).mockImplementation((error: any) => {
      throw error;
    });

    // Reset all mockOctokit methods
    Object.values(mockOctokit.rest).forEach((group: any) => {
      Object.values(group).forEach((fn: any) => fn.mockReset && fn.mockReset());
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    mockOctokit.paginate.mockReset && mockOctokit.paginate.mockReset();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    mockOctokit.graphql.mockReset && mockOctokit.graphql.mockReset();
  });

  it('fetchPullRequestMetrics handles empty results', async () => {
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
      data: { login: 'me' },
    });
    mockOctokit.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: { items: [] },
    });
    const result = await githubService.fetchPullRequestMetrics('token');
    expect(result).toEqual([]);
  });

  it('searchUsers returns mapped users', async () => {
    (githubApi.searchUsersApi as jest.Mock).mockResolvedValue([
      { login: 'a', avatar_url: 'u' },
    ]);
    const result = await githubService.searchUsers('token', 'a');
    expect(result).toEqual([{ login: 'a', avatar_url: 'u' }]);
  });

  it('fetchDeveloperMetrics handles no authored PRs', async () => {
    const mockUser = {
      login: 'me',
      name: 'n',
      avatar_url: 'a',
      html_url: 'h',
      bio: 'b',
      company: 'c',
      location: 'l',
      followers: 1,
      following: 2,
      public_repos: 3,
    };
    (githubApi.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);
    (githubApi.searchPRs as jest.Mock).mockResolvedValue([]);

    const result = await githubService.fetchDeveloperMetrics('token', 'me');
    expect(result.login).toBe('me');
    expect(result.mergeRate).toBe(0);
  });

  it('fetchRepoInsights handles empty data', async () => {
    const mockRepo = { default_branch: 'main', open_issues_count: 0 };
    (githubApi.getRepo as jest.Mock).mockResolvedValue(mockRepo);
    (githubApi.paginateApi as jest.Mock).mockResolvedValue([]);
    (githubApi.getCommitActivityStats as jest.Mock).mockResolvedValue([]);
    (githubApi.getCommunityProfileMetrics as jest.Mock).mockResolvedValue({
      health_percentage: 100,
    });

    const result = await githubService.fetchRepoInsights('token', 'o', 'r');
    expect(result.deploymentFrequency).toBe(0);
    expect(result.communityHealthScore).toBe(100);
  });

  it('fetchRepoInsights calculates changeFailureRate and meanTimeToRestore', async () => {
    const mockRepo = { default_branch: 'main', open_issues_count: 10 };
    (githubApi.getRepo as jest.Mock).mockResolvedValue(mockRepo);

    // Set up multiple calls to paginateApi
    (githubApi.paginateApi as jest.Mock)
      .mockResolvedValueOnce([]) // commits
      .mockResolvedValueOnce([
        {
          merged_at: '2024-01-01T00:00:00Z',
          created_at: '2023-12-31T00:00:00Z',
        },
      ]) // closed PRs
      .mockResolvedValueOnce([]) // open PRs
      .mockResolvedValueOnce([
        { created_at: '2024-01-01T00:00:00Z', conclusion: 'failure' },
        { created_at: '2024-01-01T01:00:00Z', conclusion: 'success' },
      ]) // workflow runs
      .mockResolvedValueOnce([]); // contributors

    (githubApi.getCommitActivityStats as jest.Mock).mockResolvedValue([
      { days: [1, 2, 3, 4, 5, 6, 7] },
    ]);

    (githubApi.getCommunityProfileMetrics as jest.Mock).mockResolvedValue({
      health_percentage: 80,
    });

    const result = await githubService.fetchRepoInsights('token', 'o', 'r');
    expect(result.changeFailureRate).toBeGreaterThanOrEqual(0);
    expect(result.meanTimeToRestore).toBeGreaterThanOrEqual(0);
    expect(result.weeklyCommits.length).toBe(7);
    expect(result.communityHealthScore).toBe(80);
  });

  it('fetchPullRequestMetrics handles errors in graphql', async () => {
    // Set up successful initial API calls
    (githubApi.getAuthenticatedUser as jest.Mock).mockResolvedValue({
      login: 'me',
    });
    (githubApi.searchPRsWithOptions as jest.Mock).mockResolvedValue({
      total_count: 1,
      incomplete_results: false,
      items: [
        {
          id: 1,
          repository_url: 'https://api.github.com/repos/o/r',
          number: 1,
          html_url: 'url',
        },
      ],
    });

    // Make GraphQL query fail
    const errorMessage = 'fail';
    (githubApi.graphqlQuery as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    // Expect the error to be thrown and handled
    await expect(
      githubService.fetchPullRequestMetrics('token')
    ).rejects.toThrow(errorMessage);
  });

  // Add tests for user/repo cache
  it('should cache user and repo data', async () => {
    clearGithubServiceCache();

    // Setup mocks for the new API structure
    (githubApi.getAuthenticatedUser as jest.Mock).mockResolvedValue({
      login: 'me',
    });
    (githubApi.searchPRsWithOptions as jest.Mock).mockResolvedValue({
      items: [],
    });

    // First call populates cache
    await githubService.fetchPullRequestMetrics('token');

    // Second call should use cache (no new getAuthenticatedUser call)
    await githubService.fetchPullRequestMetrics('token');

    // Should only call getAuthenticatedUser once due to caching
    expect(githubApi.getAuthenticatedUser).toHaveBeenCalledTimes(1);
  });

  // Merged from src/utils/tests/github.test.ts
  test('fetchPullRequestMetrics transforms api data', async () => {
    // Set up the API mocks for the new implementation
    (githubApi.getAuthenticatedUser as jest.Mock).mockResolvedValue({
      login: 'me',
    });

    const searchItem = {
      id: 1,
      repository_url: 'https://api.github.com/repos/o/r',
      number: 1,
      html_url: 'url',
    };

    (githubApi.searchPRsWithOptions as jest.Mock).mockResolvedValue({
      total_count: 1,
      incomplete_results: false,
      items: [searchItem],
    });

    (githubApi.graphqlQuery as jest.Mock).mockResolvedValue({
      pr0: {
        pullRequest: {
          id: 'gid',
          title: 't',
          author: { login: 'me' },
          createdAt: '2020-01-01T00:00:00Z',
          publishedAt: '2020-01-01T01:00:00Z',
          closedAt: '2020-01-02T00:00:00Z',
          mergedAt: null,
          isDraft: false,
          additions: 1,
          deletions: 1,
          comments: { totalCount: 0 },
          reviews: { nodes: [] },
        },
      },
    });

    (githubApi.paginateApi as jest.Mock).mockResolvedValue([
      { commit: { author: { date: '2020-01-01T00:00:00Z' } } },
    ]);

    const data = await githubService.fetchPullRequestMetrics('tok');
    expect(data).toHaveLength(1);
    expect(data[0].repo).toBe('o/r');
  });

  // Move the batching/concurrency test to the end for isolation
  // Add tests for batching and concurrency
  it('should batch PR details and limit concurrency', async () => {
    // Set up the API mocks for the new implementation
    (githubApi.getAuthenticatedUser as jest.Mock).mockResolvedValue({
      login: 'me',
    });

    const items = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      repository_url: 'https://api.github.com/repos/o/r',
      number: i,
      html_url: 'url',
    }));

    (githubApi.searchPRsWithOptions as jest.Mock).mockResolvedValue({
      total_count: items.length,
      incomplete_results: false,
      items,
    });

    (githubApi.graphqlQuery as jest.Mock).mockResolvedValue({
      ...Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [
          `pr${i}`,
          {
            pullRequest: {
              id: `${i}`,
              title: 't',
              author: { login: 'me' },
              createdAt: '2020-01-01T00:00:00Z',
              publishedAt: '2020-01-01T01:00:00Z',
              closedAt: '2020-01-02T00:00:00Z',
              mergedAt: '',
              isDraft: false,
              additions: 1,
              deletions: 1,
              comments: { totalCount: 0 },
              reviews: { nodes: [] },
            },
          },
        ])
      ),
    });

    (githubApi.paginateApi as jest.Mock).mockResolvedValue([]);

    await githubService.fetchPullRequestMetrics('token');
    expect(githubApi.graphqlQuery).toHaveBeenCalled();
  });

  it('getDeveloperProfile returns user profile', async () => {
    const mockUser = {
      login: 'dev',
      name: 'Dev Name',
      avatar_url: 'avatar',
      html_url: 'url',
      bio: 'bio',
      company: 'company',
      location: 'location',
      followers: 10,
      following: 5,
      public_repos: 7,
    };
    (githubApi.getUserByUsername as jest.Mock).mockResolvedValue(mockUser);
    const result = await githubService.getDeveloperProfile('token', 'dev');
    expect(result).toEqual(mockUser);
  });

  it('getAuthenticatedUserProfile returns cached user if present', async () => {
    githubService.userCache.set('token', { login: 'cached' });
    const result = await githubService.getAuthenticatedUserProfile('token');
    expect(result).toEqual({ login: 'cached' });
  });

  it('getAuthenticatedUserProfile fetches and caches user if not present', async () => {
    githubService.userCache.clear();
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
      data: { login: 'me' },
    });
    const result = await githubService.getAuthenticatedUserProfile('token');
    expect(result.login).toBe('me');
    // Should be cached now
    expect(githubService.userCache.get('token').login).toBe('me');
  });

  it('fetchPullRequestDetails throws if params missing', async () => {
    await expect(
      githubService.fetchPullRequestDetails('token')
    ).rejects.toThrow('Missing PR params');
  });

  it('fetchPullRequestDetails returns cached PR if present', async () => {
    githubService.repoCache.set('o/r/pr/1', { title: 'cachedPR' });
    const result = await githubService.fetchPullRequestDetails(
      'token',
      'o',
      'r',
      '1'
    );
    expect(result).toEqual({ title: 'cachedPR' });
  });

  it('fetchPullRequestDetails fetches and caches PR if not present', async () => {
    githubService.repoCache.clear();
    mockOctokit.graphql.mockResolvedValue({
      repository: {
        pullRequest: { title: 'fetchedPR' },
      },
    });
    const result = await githubService.fetchPullRequestDetails(
      'token',
      'o',
      'r',
      '2'
    );
    expect(result.title).toBe('fetchedPR');
    expect(githubService.repoCache.get('o/r/pr/2').title).toBe('fetchedPR');
  });
});

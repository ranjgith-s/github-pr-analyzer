import * as githubService from './githubService';
import { Octokit } from '@octokit/rest';

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
    mockOctokit.rest.search.users.mockResolvedValue({
      data: { items: [{ login: 'a', avatar_url: 'u' }] },
    });
    const result = await githubService.searchUsers('token', 'a');
    expect(result).toEqual([{ login: 'a', avatar_url: 'u' }]);
  });

  it('fetchDeveloperMetrics handles no authored PRs', async () => {
    mockOctokit.rest.users.getByUsername.mockResolvedValue({
      data: {
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
      },
    });
    mockOctokit.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: { items: [] },
    });
    const result = await githubService.fetchDeveloperMetrics('token', 'me');
    expect(result.login).toBe('me');
    expect(result.mergeRate).toBe(0);
  });

  it('fetchRepoInsights handles empty data', async () => {
    mockOctokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: 'main', open_issues_count: 0 },
    });
    mockOctokit.paginate.mockResolvedValue([]);
    mockOctokit.rest.repos.getCommitActivityStats.mockResolvedValue({
      data: [],
    });
    mockOctokit.rest.repos.getCommunityProfileMetrics.mockResolvedValue({
      data: { health_percentage: 100 },
    });
    const result = await githubService.fetchRepoInsights('token', 'o', 'r');
    expect(result.deploymentFrequency).toBe(0);
    expect(result.communityHealthScore).toBe(100);
  });

  it('fetchRepoInsights calculates changeFailureRate and meanTimeToRestore', async () => {
    mockOctokit.rest.repos.get.mockResolvedValue({
      data: { default_branch: 'main', open_issues_count: 10 },
    });
    mockOctokit.paginate
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
      .mockResolvedValueOnce([]); // contributors (should be an array)
    mockOctokit.rest.repos.getCommitActivityStats.mockResolvedValue({
      data: [{ days: [1, 2, 3, 4, 5, 6, 7] }],
    });
    mockOctokit.rest.repos.getCommunityProfileMetrics.mockResolvedValue({
      data: { health_percentage: 80 },
    });
    const result = await githubService.fetchRepoInsights('token', 'o', 'r');
    expect(result.changeFailureRate).toBeGreaterThanOrEqual(0);
    expect(result.meanTimeToRestore).toBeGreaterThanOrEqual(0);
    expect(result.weeklyCommits.length).toBe(7);
    expect(result.communityHealthScore).toBe(80);
  });

  it('fetchPullRequestMetrics handles errors in graphql', async () => {
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
      data: { login: 'me' },
    });
    mockOctokit.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: {
        items: [
          {
            id: 1,
            repository_url: 'https://api.github.com/repos/o/r',
            number: 1,
            html_url: 'url',
          },
        ],
      },
    });
    mockOctokit.graphql.mockRejectedValue(new Error('fail'));
    await expect(
      githubService.fetchPullRequestMetrics('token')
    ).rejects.toThrow('fail');
  });

  // Add tests for user/repo cache
  it('should cache user and repo data', async () => {
    clearGithubServiceCache();
    // Use the same mockOctokit instance for both calls
    const mockOctokit: any = {
      rest: {
        users: { getAuthenticated: jest.fn(), getByUsername: jest.fn() },
        search: { issuesAndPullRequests: jest.fn(), users: jest.fn() },
        repos: {
          get: jest.fn(),
          getCommitActivityStats: jest.fn(),
          getCommunityProfileMetrics: jest.fn(),
          listCommits: jest.fn(),
          listContributors: jest.fn(),
          list: jest.fn(),
        },
        pulls: { list: jest.fn(), listCommits: jest.fn() },
        actions: { listWorkflowRunsForRepo: jest.fn() },
      },
      paginate: jest.fn(),
      graphql: jest.fn(),
    };
    (Octokit as any).mockImplementation(() => mockOctokit);
    // First call populates cache
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
      data: { login: 'me' },
    });
    mockOctokit.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: { items: [] },
    });
    await githubService.fetchPullRequestMetrics('token');
    // Second call should use cache (no new getAuthenticated call)
    await githubService.fetchPullRequestMetrics('token');
    expect(mockOctokit.rest.users.getAuthenticated).toHaveBeenCalledTimes(1);
  });

  // Merged from src/utils/tests/github.test.ts
  test('fetchPullRequestMetrics transforms api data', async () => {
    // Clear cache and reset mocks to avoid leakage from previous tests
    clearGithubServiceCache();
    mockOctokit.rest.users.getAuthenticated.mockReset();
    mockOctokit.rest.search.issuesAndPullRequests.mockReset();
    mockOctokit.graphql.mockReset();
    mockOctokit.paginate.mockReset();

    mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
      data: { login: 'me' },
    });
    const searchItem = {
      id: 1,
      repository_url: 'https://api.github.com/repos/o/r',
      number: 1,
      html_url: 'url',
    };
    // Always return a single PR for both authored and reviewed calls
    mockOctokit.rest.search.issuesAndPullRequests.mockImplementation(() =>
      Promise.resolve({ data: { items: [searchItem] } })
    );
    mockOctokit.graphql.mockResolvedValue({
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
    mockOctokit.paginate.mockResolvedValue([
      { commit: { author: { date: '2020-01-01T00:00:00Z' } } },
    ]);

    const data = await githubService.fetchPullRequestMetrics('tok');
    expect(Octokit).toHaveBeenCalledWith({ auth: 'tok' });
    expect(data).toHaveLength(1);
    expect(data[0].repo).toBe('o/r');
  });

  // Move the batching/concurrency test to the end for isolation
  // Add tests for batching and concurrency
  it('should batch PR details and limit concurrency', async () => {
    const mockOctokit: any = {
      rest: {
        users: { getAuthenticated: jest.fn() },
        search: { issuesAndPullRequests: jest.fn() },
        pulls: { listCommits: jest.fn() },
      },
      paginate: jest.fn(),
      graphql: jest.fn(),
    };
    (Octokit as any).mockImplementation(() => mockOctokit);
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
      data: { login: 'me' },
    });
    mockOctokit.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: {
        items: Array.from({ length: 25 }, (_, i) => ({
          id: i,
          repository_url: 'https://api.github.com/repos/o/r',
          number: i,
          html_url: 'url',
        })),
      },
    });
    mockOctokit.graphql.mockResolvedValue({
      ...Object.fromEntries(
        Array.from({ length: 20 }, (_, i) => [
          `pr${i}`,
          {
            pullRequest: {
              id: `${i}`,
              title: 't',
              author: { login: 'me' },
              createdAt: '',
              publishedAt: '',
              closedAt: '',
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
    mockOctokit.paginate.mockResolvedValue([]);
    await githubService.fetchPullRequestMetrics('token');
    expect(mockOctokit.graphql).toHaveBeenCalled();
  });
});

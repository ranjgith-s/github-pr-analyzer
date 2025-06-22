import * as github from './github';
import { Octokit } from '@octokit/rest';

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
  });

  it('fetchPullRequestMetrics handles empty results', async () => {
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
      data: { login: 'me' },
    });
    mockOctokit.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: { items: [] },
    });
    const result = await github.fetchPullRequestMetrics('token');
    expect(result).toEqual([]);
  });

  it('searchUsers returns mapped users', async () => {
    mockOctokit.rest.search.users.mockResolvedValue({
      data: { items: [{ login: 'a', avatar_url: 'u' }] },
    });
    const result = await github.searchUsers('token', 'a');
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
    const result = await github.fetchDeveloperMetrics('token', 'me');
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
    const result = await github.fetchRepoInsights('token', 'o', 'r');
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
      ]); // workflow runs
    mockOctokit.rest.repos.getCommitActivityStats.mockResolvedValue({
      data: [{ days: [1, 2, 3, 4, 5, 6, 7] }],
    });
    mockOctokit.rest.repos.getCommunityProfileMetrics.mockResolvedValue({
      data: { health_percentage: 80 },
    });
    const result = await github.fetchRepoInsights('token', 'o', 'r');
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
    await expect(github.fetchPullRequestMetrics('token')).rejects.toThrow(
      'fail'
    );
  });
});

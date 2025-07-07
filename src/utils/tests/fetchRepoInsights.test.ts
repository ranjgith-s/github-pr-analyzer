import { fetchRepoInsights } from '../services/githubService';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('fetchRepoInsights', () => {
  const mockInstance: any = {
    rest: {
      repos: {
        get: jest.fn(),
        getCommitActivityStats: jest.fn(),
        getCommunityProfileMetrics: jest.fn(),
        listCommits: jest.fn(),
        listContributors: jest.fn(),
      },
      pulls: { list: jest.fn() },
      actions: { listWorkflowRunsForRepo: jest.fn() },
    },
    paginate: jest.fn(),
  };

  beforeAll(() => {
    // Ensure Date.now is a function
    jest.spyOn(Date, 'now').mockImplementation(() => 1719000000000); // fixed timestamp
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (Octokit as any).mockImplementation(() => mockInstance);
  });

  it('returns repo insights', async () => {
    mockInstance.rest.repos.get.mockResolvedValue({
      data: { default_branch: 'main', open_issues_count: 10 },
    });
    mockInstance.paginate
      .mockResolvedValueOnce([{}, {}]) // commits
      .mockResolvedValueOnce([
        {
          merged_at: '2023-12-15T00:00:00Z',
          created_at: '2023-12-10T00:00:00Z',
        },
      ]) // closed PRs
      .mockResolvedValueOnce([]) // open PRs
      .mockResolvedValueOnce([
        { created_at: '2023-12-20T00:00:00Z', conclusion: 'success' },
      ]) // workflow runs
      .mockResolvedValueOnce([{}, {}]); // contributors
    mockInstance.rest.repos.getCommitActivityStats.mockResolvedValue({
      data: [{ days: [1, 2, 3, 4, 5, 6, 7] }],
    });
    mockInstance.rest.repos.getCommunityProfileMetrics.mockResolvedValue({
      data: { health_percentage: 80 },
    });

    const result = await fetchRepoInsights('tok', 'o', 'r');
    expect(result).toHaveProperty('deploymentFrequency', 2);
    expect(result).toHaveProperty('leadTime');
    expect(result).toHaveProperty('changeFailureRate');
    expect(result).toHaveProperty('meanTimeToRestore');
    expect(result).toHaveProperty('openIssues');
    expect(result).toHaveProperty('openPullRequests');
    expect(result).toHaveProperty('averageMergeTime');
    expect(result).toHaveProperty('weeklyCommits');
    expect(result).toHaveProperty('contributorCount', 2);
    expect(result).toHaveProperty('communityHealthScore', 80);
  });
});

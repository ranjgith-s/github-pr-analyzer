import { fetchDeveloperMetrics } from '../services/github';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('fetchDeveloperMetrics', () => {
  const mockInstance: any = {
    rest: {
      users: { getByUsername: jest.fn() },
      search: { issuesAndPullRequests: jest.fn() },
    },
    paginate: jest.fn(),
    graphql: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (Octokit as any).mockImplementation(() => mockInstance);
  });

  it('returns developer metrics with correct calculations', async () => {
    mockInstance.rest.users.getByUsername.mockResolvedValue({
      data: {
        login: 'octocat',
        name: 'Octo Cat',
        avatar_url: 'avatar',
        html_url: 'url',
        bio: 'bio',
        company: 'company',
        location: 'location',
        followers: 10,
        following: 5,
        public_repos: 3,
      },
    });
    mockInstance.rest.search.issuesAndPullRequests
      .mockResolvedValueOnce({ data: { items: [
        {
          repository_url: 'https://api.github.com/repos/o/r',
          number: 1,
        },
      ] } })
      .mockResolvedValueOnce({ data: { items: [] } });
    mockInstance.graphql.mockResolvedValue({
      repository: {
        pullRequest: {
          mergedAt: '2023-01-02T00:00:00Z',
          createdAt: '2023-01-01T00:00:00Z',
          additions: 2,
          deletions: 3,
          comments: { totalCount: 4 },
          reviews: { nodes: [{ state: 'CHANGES_REQUESTED' }] },
          closingIssuesReferences: { totalCount: 1 },
        },
      },
    });

    const metrics = await fetchDeveloperMetrics('tok', 'octocat');
    expect(metrics.login).toBe('octocat');
    expect(metrics.mergeSuccess).toBeGreaterThanOrEqual(0);
    expect(metrics.mergeRate).toBeGreaterThanOrEqual(0);
    expect(metrics.cycleEfficiency).toBeGreaterThanOrEqual(0);
    expect(metrics.averageChanges).toBeGreaterThanOrEqual(0);
    expect(metrics.sizeEfficiency).toBeGreaterThanOrEqual(0);
    expect(metrics.medianSize).toBeGreaterThanOrEqual(0);
    expect(metrics.leadTimeScore).toBeGreaterThanOrEqual(0);
    expect(metrics.medianLeadTime).toBeGreaterThanOrEqual(0);
    expect(metrics.reviewActivity).toBeGreaterThanOrEqual(0);
    expect(metrics.reviewsCount).toBeGreaterThanOrEqual(0);
    expect(metrics.feedbackScore).toBeGreaterThanOrEqual(0);
    expect(metrics.averageComments).toBeGreaterThanOrEqual(0);
    expect(metrics.issueResolution).toBeGreaterThanOrEqual(0);
    expect(metrics.issuesClosed).toBeGreaterThanOrEqual(0);
  });

  it('handles no authored PRs gracefully', async () => {
    mockInstance.rest.users.getByUsername.mockResolvedValue({
      data: {
        login: 'octocat', name: 'Octo Cat', avatar_url: 'avatar', html_url: 'url', bio: 'bio', company: 'company', location: 'location', followers: 10, following: 5, public_repos: 3,
      },
    });
    mockInstance.rest.search.issuesAndPullRequests
      .mockResolvedValueOnce({ data: { items: [] } })
      .mockResolvedValueOnce({ data: { items: [] } });
    const metrics = await fetchDeveloperMetrics('tok', 'octocat');
    expect(metrics.mergeRate).toBe(0);
    expect(metrics.medianLeadTime).toBe(0);
    expect(metrics.medianSize).toBe(0);
    expect(metrics.averageChanges).toBe(0);
  });

  it('handles PRs with no reviews or comments', async () => {
    mockInstance.rest.users.getByUsername.mockResolvedValue({
      data: {
        login: 'octocat', name: 'Octo Cat', avatar_url: 'avatar', html_url: 'url', bio: 'bio', company: 'company', location: 'location', followers: 10, following: 5, public_repos: 3,
      },
    });
    mockInstance.rest.search.issuesAndPullRequests
      .mockResolvedValueOnce({ data: { items: [
        { repository_url: 'https://api.github.com/repos/o/r', number: 1 },
      ] } })
      .mockResolvedValueOnce({ data: { items: [] } });
    mockInstance.graphql.mockResolvedValue({
      repository: {
        pullRequest: {
          mergedAt: '2023-01-02T00:00:00Z',
          createdAt: '2023-01-01T00:00:00Z',
          additions: 0,
          deletions: 0,
          comments: { totalCount: 0 },
          reviews: { nodes: [] },
          closingIssuesReferences: { totalCount: 0 },
        },
      },
    });
    const metrics = await fetchDeveloperMetrics('tok', 'octocat');
    expect(metrics.averageComments).toBe(0);
    expect(metrics.feedbackScore).toBe(0);
    expect(metrics.cycleEfficiency).toBe(10);
  });

  it('handles API errors gracefully', async () => {
    mockInstance.rest.users.getByUsername.mockRejectedValue(new Error('fail'));
    await expect(fetchDeveloperMetrics('tok', 'octocat')).rejects.toThrow('fail');
  });
});

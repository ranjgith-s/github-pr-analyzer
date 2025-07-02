import { fetchPullRequestMetrics } from '../services/github';
import { Octokit } from '@octokit/rest';

const mockInstance: any = {
  rest: {
    users: { getAuthenticated: jest.fn() },
    search: { issuesAndPullRequests: jest.fn() },
    pulls: { listCommits: jest.fn() },
  },
  paginate: jest.fn(),
  graphql: jest.fn(),
};

jest.mock('@octokit/rest', () => ({ Octokit: jest.fn(() => mockInstance) }));

test('fetchPullRequestMetrics transforms api data', async () => {
  (mockInstance.rest.users.getAuthenticated as jest.Mock).mockResolvedValue({
    data: { login: 'me' },
  });
  const searchItem = {
    id: 1,
    repository_url: 'https://api.github.com/repos/o/r',
    number: 1,
    html_url: 'url',
  };
  (mockInstance.rest.search.issuesAndPullRequests as jest.Mock)
    .mockResolvedValueOnce({ data: { items: [searchItem] } })
    .mockResolvedValueOnce({ data: { items: [searchItem] } });
  (mockInstance.graphql as jest.Mock).mockResolvedValue({
    repository: {
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
  (mockInstance.paginate as jest.Mock).mockResolvedValue([
    { commit: { author: { date: '2020-01-01T00:00:00Z' } } },
  ]);

  const data = await fetchPullRequestMetrics('tok');
  expect(Octokit).toHaveBeenCalledWith({ auth: 'tok' });
  expect(data).toHaveLength(1);
  expect(data[0].repo).toBe('o/r');
});

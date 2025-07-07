import * as githubApi from './githubApi';
import { Octokit } from '@octokit/rest';

describe('githubApi', () => {
  const mockOctokit: any = {
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
      },
    },
    paginate: jest.fn(),
    graphql: jest.fn(),
  };
  (Octokit as any).mockImplementation(() => mockOctokit);

  it('getOctokit returns Octokit instance', () => {
    expect(githubApi.getOctokit('token')).toBeInstanceOf(Octokit);
  });

  it('getAuthenticatedUser calls API', async () => {
    mockOctokit.rest.users.getAuthenticated.mockResolvedValue({ data: { login: 'me' } });
    const octokit = githubApi.getOctokit('token');
    const user = await githubApi.getAuthenticatedUser(octokit);
    expect(user.login).toBe('me');
  });

  it('getUserByUsername calls API', async () => {
    mockOctokit.rest.users.getByUsername.mockResolvedValue({ data: { login: 'me' } });
    const octokit = githubApi.getOctokit('token');
    const user = await githubApi.getUserByUsername(octokit, 'me');
    expect(user.login).toBe('me');
  });

  it('searchPRs calls API', async () => {
    mockOctokit.rest.search.issuesAndPullRequests.mockResolvedValue({ data: { items: [1, 2] } });
    const octokit = githubApi.getOctokit('token');
    const items = await githubApi.searchPRs(octokit, 'q', 2);
    expect(items).toEqual([1, 2]);
  });

  it('searchUsersApi calls API', async () => {
    mockOctokit.rest.search.users.mockResolvedValue({ data: { items: [{ login: 'a' }] } });
    const octokit = githubApi.getOctokit('token');
    const items = await githubApi.searchUsersApi(octokit, 'a', 1);
    expect(items[0].login).toBe('a');
  });

  it('graphqlQuery calls graphql', async () => {
    mockOctokit.graphql.mockResolvedValue({ foo: 'bar' });
    const octokit = githubApi.getOctokit('token');
    const result = await githubApi.graphqlQuery(octokit, 'query');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('paginateApi calls paginate', async () => {
    mockOctokit.paginate.mockResolvedValue([1, 2, 3]);
    const octokit = githubApi.getOctokit('token');
    const result = await githubApi.paginateApi(octokit, jest.fn(), {});
    expect(result).toEqual([1, 2, 3]);
  });

  it('getRepo calls API', async () => {
    mockOctokit.rest.repos.get.mockResolvedValue({ data: { name: 'repo' } });
    const octokit = githubApi.getOctokit('token');
    const repo = await githubApi.getRepo(octokit, 'o', 'r');
    expect(repo.name).toBe('repo');
  });

  it('getCommitActivityStats calls API', async () => {
    mockOctokit.rest.repos.getCommitActivityStats.mockResolvedValue({ data: [1, 2] });
    const octokit = githubApi.getOctokit('token');
    const stats = await githubApi.getCommitActivityStats(octokit, 'o', 'r');
    expect(stats).toEqual([1, 2]);
  });

  it('getCommunityProfileMetrics calls API', async () => {
    mockOctokit.rest.repos.getCommunityProfileMetrics.mockResolvedValue({ data: { health_percentage: 99 } });
    const octokit = githubApi.getOctokit('token');
    const metrics = await githubApi.getCommunityProfileMetrics(octokit, 'o', 'r');
    expect(metrics.health_percentage).toBe(99);
  });
});

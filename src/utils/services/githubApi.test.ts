import * as githubApi from './githubApi';
import { Octokit } from '@octokit/rest';

describe('githubApi', () => {
  let mockOctokit: any;
  beforeEach(() => {
    mockOctokit = {
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
  });

  it('getOctokit returns Octokit instance', () => {
    expect(githubApi.getOctokit('token')).toBeInstanceOf(Octokit);
  });

  it('getAuthenticatedUser calls API', async () => {
    const octokit = mockOctokit;
    octokit.rest.users.getAuthenticated.mockResolvedValue({
      data: { login: 'me' },
    });
    const user = await githubApi.getAuthenticatedUser(octokit as any);
    expect(user.login).toBe('me');
  });

  it('getUserByUsername calls API', async () => {
    const octokit = mockOctokit;
    octokit.rest.users.getByUsername.mockResolvedValue({
      data: { login: 'me' },
    });
    const user = await githubApi.getUserByUsername(octokit as any, 'me');
    expect(user.login).toBe('me');
  });

  it('searchPRs calls API', async () => {
    const octokit = mockOctokit;
    octokit.rest.search.issuesAndPullRequests.mockResolvedValue({
      data: { items: [1, 2] },
    });
    const items = await githubApi.searchPRs(octokit as any, 'q', 2);
    expect(items).toEqual([1, 2]);
  });

  it('searchUsersApi calls API', async () => {
    const octokit = mockOctokit;
    octokit.rest.search.users.mockResolvedValue({
      data: { items: [{ login: 'a' }] },
    });
    const items = await githubApi.searchUsersApi(octokit as any, 'a', 1);
    expect(items[0].login).toBe('a');
  });

  it('graphqlQuery calls graphql', async () => {
    const octokit = mockOctokit;
    octokit.graphql.mockResolvedValue({ foo: 'bar' });
    const result = await githubApi.graphqlQuery(octokit as any, 'query');
    expect(result).toEqual({ foo: 'bar' });
  });

  it('paginateApi calls paginate', async () => {
    const octokit = mockOctokit;
    octokit.paginate.mockResolvedValue([1, 2, 3]);
    const result = await githubApi.paginateApi(octokit as any, jest.fn(), {});
    expect(result).toEqual([1, 2, 3]);
  });

  it('getRepo calls API', async () => {
    const octokit = mockOctokit;
    octokit.rest.repos.get.mockResolvedValue({ data: { name: 'repo' } });
    const repo = await githubApi.getRepo(octokit as any, 'o', 'r');
    expect(repo.name).toBe('repo');
  });

  it('getCommitActivityStats calls API', async () => {
    const octokit = mockOctokit;
    octokit.rest.repos.getCommitActivityStats.mockResolvedValue({
      data: [1, 2],
    });
    const stats = await githubApi.getCommitActivityStats(
      octokit as any,
      'o',
      'r'
    );
    expect(stats).toEqual([1, 2]);
  });

  it('getCommunityProfileMetrics calls API', async () => {
    const octokit = mockOctokit;
    octokit.rest.repos.getCommunityProfileMetrics.mockResolvedValue({
      data: { health_percentage: 99 },
    });
    const metrics = await githubApi.getCommunityProfileMetrics(
      octokit as any,
      'o',
      'r'
    );
    expect(metrics.health_percentage).toBe(99);
  });
});

// githubApi.ts
import { Octokit } from '@octokit/rest';

// Initialize Octokit instance with enhanced configuration
function createOctokitInstance(token: string): Octokit {
  return new Octokit({
    auth: token,
  });
}

export function getOctokit(token: string): Octokit {
  return createOctokitInstance(token);
}

export async function getAuthenticatedUser(octokit: Octokit): Promise<any> {
  return (await octokit.rest.users.getAuthenticated()).data;
}

export async function getUserByUsername(
  octokit: Octokit,
  username: string
): Promise<any> {
  return (await octokit.rest.users.getByUsername({ username })).data;
}

export async function searchPRs(
  octokit: Octokit,
  query: string,
  perPage = 100
): Promise<any[]> {
  return (
    await octokit.rest.search.issuesAndPullRequests({
      q: query,
      per_page: perPage,
    })
  ).data.items;
}

// Enhanced search with pagination and sorting options
export async function searchPRsWithOptions(
  octokit: Octokit,
  query: string,
  options: {
    page?: number;
    per_page?: number;
    sort?: 'updated' | 'created' | 'comments';
    order?: 'asc' | 'desc';
  } = {}
): Promise<{ total_count: number; incomplete_results: boolean; items: any[] }> {
  const response = await octokit.rest.search.issuesAndPullRequests({
    q: query,
    sort: options.sort,
    order: options.order,
    per_page: options.per_page || 20,
    page: options.page || 1,
  });

  return response.data;
}

export async function searchUsersApi(
  octokit: Octokit,
  query: string,
  perPage = 5
): Promise<any[]> {
  return (await octokit.rest.search.users({ q: query, per_page: perPage })).data
    .items;
}

export async function graphqlQuery<T = unknown>(
  octokit: Octokit,
  query: string
): Promise<T> {
  return await octokit.graphql<T>(query);
}

export async function paginateApi<T = unknown>(
  octokit: Octokit,
  fn: any,
  params: any
): Promise<T> {
  return await octokit.paginate(fn, params);
}

export async function getRepo(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<any> {
  return (await octokit.rest.repos.get({ owner, repo })).data;
}

export async function getCommitActivityStats(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<any> {
  return (await octokit.rest.repos.getCommitActivityStats({ owner, repo }))
    .data;
}

export async function getCommunityProfileMetrics(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<any> {
  return (await octokit.rest.repos.getCommunityProfileMetrics({ owner, repo }))
    .data;
}

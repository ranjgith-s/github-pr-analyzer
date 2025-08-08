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
      // NOTE: advanced_search intentionally omitted here to preserve legacy behavior for this helper
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
    advanced_search?: boolean; // opt-in ability (defaults to true)
  } = {}
): Promise<{ total_count: number; incomplete_results: boolean; items: any[] }> {
  // GitHub Changelog (2025-03-06): issues advanced search will become default on 2025-09-04
  // https://github.blog/changelog/2025-03-06-github-issues-projects-api-support-for-issues-advanced-search-and-more/
  // The legacy (non-advanced) search is deprecated and triggers a console warning in Octokit.
  // Suppress deprecation warning and future-proof by explicitly setting advanced_search=true until it becomes default.
  const response = await octokit.rest.search.issuesAndPullRequests({
    q: query,
    sort: options.sort,
    order: options.order,
    per_page: options.per_page || 20,
    page: options.page || 1,
    // Setting advanced_search (currently in public preview / early adoption) avoids deprecation warning.
    // Safe to always send true; allow override mainly for testing.
    advanced_search: options.advanced_search !== false, // default true
  } as any); // cast due to Octokit types not yet including advanced_search

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

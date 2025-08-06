// githubService.ts
import { InMemoryCache } from './cache';
import * as githubApi from './githubApi';
import * as transformers from './transformers';
import { PRItem } from 'src/types';
import type { Commit } from './transformers';
import { validateAndSanitizeQuery } from '../../services/queryValidator';
import { handleOctokitError } from '../../services/errorHandler';
import { getFromCache, setCache } from '../../services/cache';
import { User } from '../queryUtils';

// Caches
const userCache = new InMemoryCache<any>();
const repoCache = new InMemoryCache<any>();

interface PRDetail {
  pr: any;
  item: any;
  owner: string;
  repo: string;
}

interface FetchPullRequestMetricsOptions {
  page?: number;
  sort?: 'updated' | 'created' | 'comments';
  per_page?: number;
}

// New interface definitions for enhanced API
export interface SearchOptions {
  page?: number;
  per_page?: number;
  sort?: 'updated' | 'created' | 'comments';
  order?: 'asc' | 'desc';
}

export interface PRSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: PRItem[];
}

export interface SearchError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    message: string;
    field?: string;
    code?: string;
  }>;
}

// Overloaded function signatures for backward compatibility and new functionality
export async function fetchPullRequestMetrics(token: string): Promise<PRItem[]>;
export async function fetchPullRequestMetrics(
  token: string,
  user: User
): Promise<PRItem[]>;
export async function fetchPullRequestMetrics(
  token: string,
  query: string,
  options?: SearchOptions
): Promise<PRSearchResult>;

// Implementation with overload resolution
export async function fetchPullRequestMetrics(
  token: string,
  userOrQuery?: User | string,
  options?: SearchOptions | FetchPullRequestMetricsOptions
): Promise<PRItem[] | PRSearchResult> {
  // Handle backward compatibility - no arguments (default user behavior)
  if (!userOrQuery) {
    const octokit = githubApi.getOctokit(token);
    let user = userCache.get(token);
    if (!user) {
      user = (await githubApi.getAuthenticatedUser(octokit)) as {
        login: string;
      };
      userCache.set(token, user);
    }
    if (!user) throw new Error('Authenticated user not found');

    const defaultQuery = `is:pr author:${user.login} OR is:pr reviewed-by:${user.login}`;
    const result = await fetchPullRequestsByQuery(token, defaultQuery, {});
    return result.items; // Return legacy format
  }

  // Handle backward compatibility - User object passed
  if (typeof userOrQuery === 'object' && userOrQuery?.login) {
    const user = userOrQuery as User;
    const defaultQuery = `is:pr author:${user.login} OR is:pr reviewed-by:${user.login}`;
    const result = await fetchPullRequestsByQuery(
      token,
      defaultQuery,
      (options as SearchOptions) || {}
    );
    return result.items; // Return legacy format
  }

  // Handle new dynamic query format
  const query = userOrQuery as string;
  return await fetchPullRequestsByQuery(
    token,
    query,
    (options as SearchOptions) || {}
  );
}

// Core query execution function
async function fetchPullRequestsByQuery(
  token: string,
  query: string,
  options: SearchOptions = {}
): Promise<PRSearchResult> {
  const validatedQuery = validateAndSanitizeQuery(query);
  const searchParams = { q: validatedQuery, ...options };

  // Check cache first
  const cacheKey = `pr-search:${JSON.stringify(searchParams)}`;
  const cached = await getFromCache<PRSearchResult>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const octokit = githubApi.getOctokit(token);

    // Use enhanced search method with options
    const response = await githubApi.searchPRsWithOptions(
      octokit,
      validatedQuery,
      {
        sort: options.sort,
        order: options.order,
        per_page: options.per_page || 20,
        page: options.page || 1,
      }
    );

    const result = await transformSearchResponse(response, token);

    // Cache successful results for 5 minutes
    await setCache(cacheKey, result, 300);

    return result;
  } catch (error) {
    throw handleOctokitError(error);
  }
}

// Transform search response to our format
async function transformSearchResponse(
  response: { total_count: number; incomplete_results: boolean; items: any[] },
  token: string
): Promise<PRSearchResult> {
  const octokit = githubApi.getOctokit(token);
  const items = response.items;
  const batchSize = 20;
  const prDetails: PRDetail[] = [];

  // Process items in batches using GraphQL for efficiency
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const queries = batch
      .map((item, idx) => {
        const [owner, repo] = item.repository_url.split('/').slice(-2);
        return `pr${idx}: repository(owner: "${owner}", name: "${repo}") { pullRequest(number: ${item.number}) { id title author { login } createdAt publishedAt closedAt mergedAt isDraft additions deletions comments { totalCount } reviews(first:100) { nodes { author { login } state submittedAt } } } }`;
      })
      .join(' ');
    const query = `query { ${queries} }`;
    const prData = await githubApi.graphqlQuery<
      Record<string, { pullRequest: unknown }>
    >(octokit, query);

    for (let idx = 0; idx < batch.length; idx++) {
      const pr = prData[`pr${idx}`]?.pullRequest;
      if (pr) {
        prDetails.push({
          pr,
          item: batch[idx],
          owner: batch[idx].repository_url.split('/').slice(-2)[0],
          repo: batch[idx].repository_url.split('/').slice(-2)[1],
        });
      }
    }
  }

  // Transform to PRItems with limited concurrency
  const limit = 5;
  const results: PRItem[] = [];
  for (let i = 0; i < prDetails.length; i += limit) {
    const chunk = prDetails.slice(i, i + limit);
    const chunkResults = await Promise.all(
      chunk.map(async ({ pr, item, owner, repo }) => {
        const cacheKey = `${owner}/${repo}/pr/${item.number}`;
        let commits = repoCache.get(cacheKey);
        if (!commits) {
          commits = await githubApi.paginateApi<Commit[]>(
            octokit,
            octokit.rest.pulls.listCommits,
            {
              owner,
              repo,
              pull_number: item.number,
              per_page: 100,
            }
          );
          repoCache.set(cacheKey, commits);
        }
        return transformers.toPRItem(pr, item, owner, repo, commits);
      })
    );
    results.push(...chunkResults);
  }

  return {
    total_count: response.total_count,
    incomplete_results: response.incomplete_results,
    items: results,
  };
}

export async function searchUsers(token: string, query: string) {
  const octokit = githubApi.getOctokit(token);
  const items = await githubApi.searchUsersApi(octokit, query);
  return items.map((u: any) => ({ login: u.login, avatar_url: u.avatar_url }));
}

export async function fetchDeveloperMetrics(token: string, login: string) {
  const octokit = githubApi.getOctokit(token);
  let user = userCache.get(login);
  if (!user) {
    user = await githubApi.getUserByUsername(octokit, login);
    if (user) userCache.set(login, user);
  }
  if (!user) throw new Error('User not found');
  const [authored, reviewed] = await Promise.all([
    githubApi.searchPRs(octokit, `is:pr author:${login}`, 30),
    githubApi.searchPRs(octokit, `is:pr reviewed-by:${login}`, 30),
  ]);
  let merged = 0;
  const changes: number[] = [];
  const sizes: number[] = [];
  const leadTimes: number[] = [];
  const comments: number[] = [];
  let issuesClosed = 0;
  const items = authored;
  const batchSize = 20;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const queries = batch
      .map((item, idx) => {
        const [owner, repo] = item.repository_url.split('/').slice(-2);
        return `pr${idx}: repository(owner: "${owner}", name: "${repo}") { pullRequest(number: ${item.number}) { mergedAt createdAt additions deletions comments { totalCount } reviews(first:100) { nodes { state } } closingIssuesReferences(first:1) { totalCount } } }`;
      })
      .join(' ');
    const query = `query { ${queries} }`;
    const prData = await githubApi.graphqlQuery<
      Record<string, { pullRequest: any }>
    >(octokit, query);
    for (let idx = 0; idx < batch.length; idx++) {
      const pr = prData[`pr${idx}`]?.pullRequest;
      if (pr) {
        if (pr.mergedAt) {
          merged += 1;
          const diff =
            new Date(pr.mergedAt).getTime() - new Date(pr.createdAt).getTime();
          leadTimes.push(diff / 36e5);
        }
        const changeReq = pr.reviews.nodes.filter(
          (n: any) => n.state === 'CHANGES_REQUESTED'
        ).length;
        changes.push(changeReq);
        sizes.push(pr.additions + pr.deletions);
        comments.push(pr.comments.totalCount);
        issuesClosed += pr.closingIssuesReferences.totalCount;
      }
    }
  }
  const median = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };
  const average = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  const round = (n: number) => Math.round(n * 100) / 100;
  const mergeRate = authored.length ? merged / authored.length : 0;
  const averageChanges = average(changes);
  const medianSize = median(sizes);
  const medianLeadTime = median(leadTimes);
  const reviewsCount = reviewed.length;
  const averageComments = average(comments);
  const mergeSuccess = mergeRate * 10;
  const cycleEfficiency = Math.max(0, 10 - averageChanges * 2);
  const sizeEfficiency = Math.max(0, 10 - medianSize / 100);
  const leadTimeScore = Math.max(0, 10 - medianLeadTime / 12);
  const reviewActivity = Math.min(10, reviewsCount);
  const feedbackScore = Math.min(10, averageComments);
  const issueResolution = Math.min(10, issuesClosed);
  return {
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    html_url: user.html_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    followers: user.followers,
    following: user.following,
    public_repos: user.public_repos,
    mergeSuccess: round(mergeSuccess),
    mergeRate: round(mergeRate),
    cycleEfficiency: round(cycleEfficiency),
    averageChanges: round(averageChanges),
    sizeEfficiency: round(sizeEfficiency),
    medianSize: round(medianSize),
    leadTimeScore: round(leadTimeScore),
    medianLeadTime: round(medianLeadTime),
    reviewActivity: round(reviewActivity),
    reviewsCount: reviewsCount,
    feedbackScore: round(feedbackScore),
    averageComments: round(averageComments),
    issueResolution: round(issueResolution),
    issuesClosed: issuesClosed,
  };
}

export async function fetchRepoInsights(
  token: string,
  owner: string,
  repo: string
) {
  const octokit = githubApi.getOctokit(token);
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const repoKey = `${owner}/${repo}`;
  let repoData = repoCache.get(repoKey);
  if (!repoData) {
    repoData = await githubApi.getRepo(octokit, owner, repo);
    if (repoData) repoCache.set(repoKey, repoData);
  }
  if (!repoData) throw new Error('Repo not found');
  const [
    commits,
    prs,
    openPulls,
    workflowRuns,
    commitActivity,
    contributors,
    communityProfile,
  ] = await Promise.all([
    githubApi.paginateApi<any[]>(octokit, octokit.rest.repos.listCommits, {
      owner,
      repo,
      sha: repoData.default_branch,
      since,
      per_page: 100,
    }),
    githubApi.paginateApi<any[]>(octokit, octokit.rest.pulls.list, {
      owner,
      repo,
      state: 'closed',
      per_page: 100,
    }),
    githubApi.paginateApi<any[]>(octokit, octokit.rest.pulls.list, {
      owner,
      repo,
      state: 'open',
      per_page: 100,
    }),
    githubApi.paginateApi<any[]>(
      octokit,
      octokit.rest.actions.listWorkflowRunsForRepo,
      {
        owner,
        repo,
        branch: repoData.default_branch,
        status: 'completed',
        per_page: 100,
      }
    ),
    githubApi.getCommitActivityStats(octokit, owner, repo),
    githubApi.paginateApi<any[]>(octokit, octokit.rest.repos.listContributors, {
      owner,
      repo,
      per_page: 100,
    }) || [],
    githubApi.getCommunityProfileMetrics(octokit, owner, repo),
  ]);
  const recentMerged = prs.filter(
    (p: any) => p.merged_at && p.merged_at >= since
  );
  const leadTimes = recentMerged.map(
    (p: any) =>
      (new Date(p.merged_at).getTime() - new Date(p.created_at).getTime()) /
      36e5
  );
  const averageMergeTime =
    leadTimes.length > 0
      ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length
      : 0;
  const recentRuns = workflowRuns.filter((r: any) => r.created_at >= since);
  const failures = recentRuns.filter((r: any) => r.conclusion === 'failure');
  const successes = recentRuns.filter((r: any) => r.conclusion === 'success');
  const changeFailureRate =
    recentRuns.length > 0 ? failures.length / recentRuns.length : 0;
  let meanTimeToRestore = 0;
  if (failures.length > 0) {
    const diffs: number[] = [];
    for (const fail of failures) {
      const nextSuccess = successes.find(
        (s: any) => new Date(s.created_at) > new Date(fail.created_at)
      );
      if (nextSuccess) {
        diffs.push(
          (new Date(nextSuccess.created_at).getTime() -
            new Date(fail.created_at).getTime()) /
            36e5
        );
      }
    }
    if (diffs.length > 0) {
      meanTimeToRestore = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    }
  }
  let weeklyCommits: number[] = [];
  if (Array.isArray(commitActivity) && commitActivity.length > 0) {
    const last = commitActivity[commitActivity.length - 1];
    if (last && Array.isArray(last.days)) {
      weeklyCommits = last.days;
    }
  }
  return {
    deploymentFrequency: commits.length,
    leadTime: averageMergeTime,
    changeFailureRate,
    meanTimeToRestore,
    openIssues: repoData.open_issues_count - openPulls.length,
    openPullRequests: openPulls.length,
    averageMergeTime,
    weeklyCommits,
    contributorCount: contributors.length,
    communityHealthScore: communityProfile.health_percentage,
  };
}

export async function getDeveloperProfile(token: string, login: string) {
  const octokit = githubApi.getOctokit(token);
  const user = await githubApi.getUserByUsername(octokit, login);
  return {
    login: user.login,
    name: user.name,
    avatar_url: user.avatar_url,
    html_url: user.html_url,
    bio: user.bio,
    company: user.company,
    location: user.location,
    followers: user.followers,
    following: user.following,
    public_repos: user.public_repos,
  };
}

export async function getAuthenticatedUserProfile(token: string) {
  let user = userCache.get(token);
  if (!user) {
    const octokit = githubApi.getOctokit(token);
    user = await githubApi.getAuthenticatedUser(octokit);
    if (user) userCache.set(token, user);
  }
  return user;
}

export async function fetchPullRequestDetails(
  token: string,
  owner?: string,
  repo?: string,
  number?: string
) {
  if (!owner || !repo || !number) throw new Error('Missing PR params');
  const cacheKey = `${owner}/${repo}/pr/${number}`;
  let pr = repoCache.get(cacheKey);
  if (!pr) {
    const octokit = githubApi.getOctokit(token);
    const { repository } = await octokit.graphql<any>(
      `query($owner:String!,$repo:String!,$number:Int!){
        repository(owner:$owner,name:$repo){
          pullRequest(number:$number){
            title
            createdAt
            publishedAt
            closedAt
            mergedAt
            reviews(first:100){ nodes{ submittedAt } }
          }
        }
      }`,
      { owner, repo, number: Number(number) }
    );
    pr = repository.pullRequest;
    if (pr) repoCache.set(cacheKey, pr);
  }
  return pr;
}

export { userCache, repoCache }; // For testing

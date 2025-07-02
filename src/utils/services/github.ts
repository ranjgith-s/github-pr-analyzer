import { Octokit } from '@octokit/rest';
import { PRItem } from '../types';

export async function fetchPullRequestMetrics(
  token: string
): Promise<PRItem[]> {
  const octokit = new Octokit({ auth: token });
  const user = await octokit.rest.users.getAuthenticated();

  const authored = await octokit.rest.search.issuesAndPullRequests({
    q: `is:pr author:${user.data.login}`,
    per_page: 100,
  });

  const reviewed = await octokit.rest.search.issuesAndPullRequests({
    q: `is:pr reviewed-by:${user.data.login}`,
    per_page: 100,
  });

  const allItems = new Map<any, any>();
  [...authored.data.items, ...reviewed.data.items].forEach((item) => {
    allItems.set(item.id, item);
  });

  const data: PRItem[] = await Promise.all(
    Array.from(allItems.values()).map(async (item): Promise<PRItem> => {
      const [owner, repo] = item.repository_url.split('/').slice(-2);
      const prNumber = item.number;

      const prData = await octokit.graphql<any>(
        `query($owner:String!,$repo:String!,$number:Int!){
           repository(owner:$owner,name:$repo){
             pullRequest(number:$number){
               id
               title
               author { login }
               createdAt
               publishedAt
               closedAt
               mergedAt
               isDraft
               additions
               deletions
               comments { totalCount }
               reviews(first:100){
                 nodes{ author{login} state submittedAt }
               }
             }
           }
         }`,
        { owner, repo, number: prNumber }
      );

      const pr = prData.repository.pullRequest;
      const commits = await octokit.paginate(octokit.rest.pulls.listCommits, {
        owner,
        repo,
        pull_number: prNumber,
        per_page: 100,
      });
      const firstCommitAt = commits.reduce<string | null>((earliest, c) => {
        const date = c.commit.author?.date || c.commit.committer?.date || null;
        if (!date) return earliest;
        if (!earliest) return date;
        return new Date(date) < new Date(earliest) ? date : earliest;
      }, null);

      const reviewerSet = new Set<string>();
      let firstReview: string | null = null;
      let changesRequested = 0;
      pr.reviews.nodes.forEach((rv: any) => {
        if (rv.author) reviewerSet.add(rv.author.login);
        if (rv.state === 'CHANGES_REQUESTED') changesRequested += 1;
        if (!firstReview || new Date(rv.submittedAt) < new Date(firstReview)) {
          firstReview = rv.submittedAt;
        }
      });

      return {
        id: pr.id,
        owner,
        repo_name: repo,
        repo: `${owner}/${repo}`,
        number: prNumber,
        title: pr.title,
        url: item.html_url,
        author: pr.author ? pr.author.login : 'unknown',
        state: pr.isDraft
          ? 'draft'
          : pr.mergedAt
            ? 'merged'
            : pr.closedAt
              ? 'closed'
              : 'open',
        created_at: pr.createdAt,
        published_at: pr.publishedAt,
        closed_at: pr.mergedAt || pr.closedAt,
        first_review_at: firstReview,
        first_commit_at: firstCommitAt,
        reviewers: Array.from(reviewerSet),
        changes_requested: changesRequested,
        additions: pr.additions,
        deletions: pr.deletions,
        comment_count: pr.comments.totalCount,
        timeline: [
          { label: 'Created', date: pr.createdAt },
          { label: 'Published', date: pr.publishedAt },
          { label: 'First review', date: firstReview },
          { label: 'Closed', date: pr.mergedAt || pr.closedAt },
        ].filter((e) => e.date),
      } as PRItem;
    })
  );

  return data;
}

export interface DeveloperMetrics {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  followers: number;
  following: number;
  public_repos: number;
  mergeSuccess: number;
  mergeRate: number;
  cycleEfficiency: number;
  averageChanges: number;
  sizeEfficiency: number;
  medianSize: number;
  leadTimeScore: number;
  medianLeadTime: number;
  reviewActivity: number;
  reviewsCount: number;
  feedbackScore: number;
  averageComments: number;
  issueResolution: number;
  issuesClosed: number;
}

export async function searchUsers(token: string, query: string) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.search.users({ q: query, per_page: 5 });
  return data.items.map((u: any) => ({
    login: u.login,
    avatar_url: u.avatar_url,
  }));
}

export async function fetchDeveloperMetrics(
  token: string,
  login: string
): Promise<DeveloperMetrics> {
  const octokit = new Octokit({ auth: token });
  const { data: user } = await octokit.rest.users.getByUsername({
    username: login,
  });

  const authored = await octokit.rest.search.issuesAndPullRequests({
    q: `is:pr author:${login}`,
    per_page: 30,
  });

  const reviewed = await octokit.rest.search.issuesAndPullRequests({
    q: `is:pr reviewed-by:${login}`,
    per_page: 30,
  });

  let merged = 0;
  const changes: number[] = [];
  const sizes: number[] = [];
  const leadTimes: number[] = [];
  const comments: number[] = [];
  let issuesClosed = 0;

  for (const item of authored.data.items) {
    const [owner, repo] = item.repository_url.split('/').slice(-2);
    const prNumber = item.number;
    const { repository } = await octokit.graphql<any>(
      `query($owner:String!,$repo:String!,$number:Int!){
         repository(owner:$owner,name:$repo){
           pullRequest(number:$number){
             mergedAt
             createdAt
             additions
             deletions
             comments { totalCount }
             reviews(first:100){ nodes{ state } }
             closingIssuesReferences(first:1){ totalCount }
           }
         }
       }`,
      { owner, repo, number: prNumber }
    );
    const pr = repository.pullRequest;
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

  const median = (arr: number[]) => {
    if (arr.length === 0) return 0;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  };

  const average = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const round = (n: number) => Math.round(n * 100) / 100;

  const mergeRate = authored.data.items.length
    ? merged / authored.data.items.length
    : 0;
  const averageChanges = average(changes);
  const medianSize = median(sizes);
  const medianLeadTime = median(leadTimes);
  const reviewsCount = reviewed.data.items.length;
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

// Utility to fetch developer profile (login, name, etc) only
export async function getDeveloperProfile(token: string, login: string) {
  const octokit = new Octokit({ auth: token });
  const { data: user } = await octokit.rest.users.getByUsername({ username: login });
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

export interface RepoInsights {
  deploymentFrequency: number;
  leadTime: number;
  changeFailureRate: number;
  meanTimeToRestore: number;
  openIssues: number;
  openPullRequests: number;
  averageMergeTime: number;
  weeklyCommits: number[];
  contributorCount: number;
  communityHealthScore: number;
}

export async function fetchRepoInsights(
  token: string,
  owner: string,
  repo: string
): Promise<RepoInsights> {
  const octokit = new Octokit({ auth: token });
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const repoData = await octokit.rest.repos.get({ owner, repo });

  const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
    owner,
    repo,
    sha: repoData.data.default_branch,
    since,
    per_page: 100,
  });

  const prs = await octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo,
    state: 'closed',
    per_page: 100,
  });
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

  const openPulls = await octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo,
    state: 'open',
    per_page: 100,
  });

  const workflowRuns = await octokit.paginate(
    octokit.rest.actions.listWorkflowRunsForRepo,
    {
      owner,
      repo,
      branch: repoData.data.default_branch,
      status: 'completed',
      per_page: 100,
    }
  );
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

  const commitActivity = await octokit.rest.repos.getCommitActivityStats({
    owner,
    repo,
  });
  let weeklyCommits: number[] = [];
  if (Array.isArray(commitActivity.data) && commitActivity.data.length > 0) {
    const last = commitActivity.data[commitActivity.data.length - 1];
    if (last && Array.isArray(last.days)) {
      weeklyCommits = last.days;
    }
  }

  const contributors = await octokit.paginate(
    octokit.rest.repos.listContributors,
    { owner, repo, per_page: 100 }
  );

  const communityProfile = await octokit.rest.repos.getCommunityProfileMetrics({
    owner,
    repo,
  });

  return {
    deploymentFrequency: commits.length,
    leadTime: averageMergeTime,
    changeFailureRate,
    meanTimeToRestore,
    openIssues: repoData.data.open_issues_count - openPulls.length,
    openPullRequests: openPulls.length,
    averageMergeTime,
    weeklyCommits,
    contributorCount: contributors.length,
    communityHealthScore: communityProfile.data.health_percentage,
  };
}

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
        const date = c.commit.author?.date || c.commit.committer?.date;
        return !earliest || new Date(date) < new Date(earliest)
          ? date
          : earliest;
      }, null);

      const reviewers = new Set<string>();
      let firstReview: string | null = null;
      let changesRequested = 0;
      pr.reviews.nodes.forEach((rv: any) => {
        if (rv.author) reviewers.add(rv.author.login);
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
        reviewers: reviewers.size,
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

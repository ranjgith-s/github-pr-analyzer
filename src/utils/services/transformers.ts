// transformers.ts
import { PRItem } from 'src/types';

export interface Commit {
  commit: {
    author?: { date?: string } | null;
    committer?: { date?: string } | null;
  };
}

export interface Review {
  author?: { login: string } | null;
  state: string;
  submittedAt: string;
}

export function getEarliestCommitDate(commits: Commit[]): string | null {
  return commits.reduce((earliest: string | null, c: Commit) => {
    const date = c.commit.author?.date || c.commit.committer?.date || null;
    if (!date) return earliest;
    if (!earliest) return date;
    return new Date(date) < new Date(earliest) ? date : earliest;
  }, null);
}

export function getReviewStats(reviews: Review[]): {
  reviewerSet: Set<string>;
  firstReview: string | null;
  changesRequested: number;
} {
  const reviewerSet = new Set<string>();
  let firstReview: string | null = null;
  let changesRequested = 0;
  reviews.forEach((rv: Review) => {
    if (rv.author) reviewerSet.add(rv.author.login);
    if (rv.state === 'CHANGES_REQUESTED') changesRequested += 1;
    if (!firstReview || new Date(rv.submittedAt) < new Date(firstReview)) {
      firstReview = rv.submittedAt;
    }
  });
  return { reviewerSet, firstReview, changesRequested };
}

export function toPRItem(
  pr: any,
  item: any,
  owner: string,
  repo: string,
  commits: Commit[] = []
): PRItem {
  const { reviewerSet, firstReview, changesRequested } = getReviewStats(
    pr.reviews.nodes as Review[]
  );

  let firstCommitDate = getEarliestCommitDate(commits);
  // Fallback to GraphQL commit data if REST commits are empty
  if (!firstCommitDate && pr.commits?.nodes?.length > 0) {
    const commit = pr.commits.nodes[0].commit;
    firstCommitDate = commit.authoredDate || commit.committedDate || null;
  }

  return {
    id: pr.id,
    owner,
    repo_name: repo,
    repo: `${owner}/${repo}`,
    number: item.number,
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
    first_commit_at: firstCommitDate,
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
  };
}

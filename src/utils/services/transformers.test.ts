import * as transformers from './transformers';
import { PRItem } from 'src/types';

describe('transformers', () => {
  it('getEarliestCommitDate returns earliest', () => {
    const commits = [
      { commit: { author: { date: '2020-01-02' } } },
      { commit: { author: { date: '2020-01-01' } } },
    ];
    expect(transformers.getEarliestCommitDate(commits)).toBe('2020-01-01');
  });

  it('getEarliestCommitDate returns null for empty', () => {
    expect(transformers.getEarliestCommitDate([])).toBeNull();
  });

  it('getReviewStats returns correct stats', () => {
    const reviews = [
      { author: { login: 'a' }, state: 'CHANGES_REQUESTED', submittedAt: '2020-01-01' },
      { author: { login: 'b' }, state: 'APPROVED', submittedAt: '2020-01-02' },
    ];
    const stats = transformers.getReviewStats(reviews);
    expect(stats.reviewerSet.has('a')).toBe(true);
    expect(stats.reviewerSet.has('b')).toBe(true);
    expect(stats.changesRequested).toBe(1);
    expect(stats.firstReview).toBe('2020-01-01');
  });

  it('getReviewStats handles empty reviews', () => {
    const stats = transformers.getReviewStats([]);
    expect(stats.reviewerSet.size).toBe(0);
    expect(stats.changesRequested).toBe(0);
    expect(stats.firstReview).toBeNull();
  });

  it('toPRItem transforms data correctly', () => {
    const pr = {
      id: '1',
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
    };
    const item = { number: 1, html_url: 'url' };
    const result: PRItem = transformers.toPRItem(pr, item, 'o', 'r', [
      { commit: { author: { date: '2020-01-01T00:00:00Z' } } },
    ]);
    expect(result.repo).toBe('o/r');
    expect(result.first_commit_at).toBe('2020-01-01T00:00:00Z');
    expect(result.timeline.length).toBeGreaterThan(0);
  });
});

import { computeSummaryMetrics } from '../summary';
import { PRItem } from '../../../types';

describe('computeSummaryMetrics', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    // Set a fixed date for Date.now()
    jest.setSystemTime(new Date('2024-05-15T12:00:00Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  const basePR: Partial<PRItem> = {
    id: '1',
    owner: 'test-owner',
    repo_name: 'test-repo',
    repo: 'test-owner/test-repo',
    number: 1,
    title: 'Test PR',
    url: 'https://github.com/test-owner/test-repo/pull/1',
    author: 'test-author',
    reviewers: [],
    changes_requested: 0,
    additions: 10,
    deletions: 5,
    comment_count: 2,
    timeline: [],
  };

  const createPR = (overrides: Partial<PRItem>): PRItem =>
    ({ ...basePR, ...overrides }) as PRItem;

  it('should return null for empty or null input', () => {
    expect(computeSummaryMetrics([])).toBeNull();
    // @ts-expect-error Testing invalid input
    expect(computeSummaryMetrics(null)).toBeNull();
    // @ts-expect-error Testing invalid input
    expect(computeSummaryMetrics(undefined)).toBeNull();
  });

  it('should calculate basic counts correctly', () => {
    const items = [
      createPR({ id: '1', state: 'open', created_at: '2024-05-14T12:00:00Z' }),
      createPR({
        id: '2',
        state: 'merged',
        closed_at: '2024-05-13T12:00:00Z',
        created_at: '2024-05-10T12:00:00Z',
      }),
      createPR({
        id: '3',
        state: 'closed',
        closed_at: '2024-05-12T12:00:00Z',
        created_at: '2024-05-09T12:00:00Z',
      }),
      createPR({ id: '4', state: 'open', created_at: '2024-05-01T12:00:00Z' }), // Stale open
    ];

    const result = computeSummaryMetrics(items);

    expect(result).not.toBeNull();
    expect(result?.count).toBe(4);
    expect(result?.merged).toBe(2); // closed and merged count as merged if they have closed_at and aren't open
    expect(result?.open).toBe(2);
  });

  it('should identify stale open PRs correctly', () => {
    // Current fixed date is 2024-05-15T12:00:00Z
    // 7 days ago is 2024-05-08T12:00:00Z
    const items = [
      createPR({ id: '1', state: 'open', created_at: '2024-05-10T12:00:00Z' }), // 5 days old (not stale)
      createPR({ id: '2', state: 'open', created_at: '2024-05-08T11:59:59Z' }), // Just over 7 days old (stale)
      createPR({ id: '3', state: 'open', created_at: '2024-05-01T12:00:00Z' }), // 14 days old (stale)
      createPR({
        id: '4',
        state: 'merged',
        created_at: '2024-05-01T12:00:00Z',
        closed_at: '2024-05-02T12:00:00Z',
      }), // Stale age but merged
    ];

    const result = computeSummaryMetrics(items);

    expect(result?.open).toBe(3);
    expect(result?.staleOpen).toBe(2);
  });

  it('should calculate lead times correctly (even number of items)', () => {
    const items = [
      createPR({
        id: '1',
        state: 'merged',
        first_commit_at: '2024-05-10T12:00:00Z',
        closed_at: '2024-05-11T12:00:00Z', // 24 hours lead time
      }),
      createPR({
        id: '2',
        state: 'closed',
        first_commit_at: '2024-05-10T12:00:00Z',
        closed_at: '2024-05-12T00:00:00Z', // 36 hours lead time
      }),
    ];

    const result = computeSummaryMetrics(items);

    // Lead times: 24h, 36h
    // Avg: (24 + 36) / 2 = 30
    // Median (even): (24 + 36) / 2 = 30
    expect(result?.avgLeadTimeH).toBe(30);
    expect(result?.medianLeadTimeH).toBe(30);
  });

  it('should calculate lead times correctly (odd number of items)', () => {
    const items = [
      createPR({
        id: '1',
        state: 'merged',
        first_commit_at: '2024-05-10T12:00:00Z',
        closed_at: '2024-05-11T12:00:00Z', // 24 hours lead time
      }),
      createPR({
        id: '2',
        state: 'merged',
        first_commit_at: '2024-05-10T12:00:00Z',
        closed_at: '2024-05-12T00:00:00Z', // 36 hours lead time
      }),
      createPR({
        id: '3',
        state: 'merged',
        first_commit_at: '2024-05-10T12:00:00Z',
        closed_at: '2024-05-12T12:00:00Z', // 48 hours lead time
      }),
    ];

    const result = computeSummaryMetrics(items);

    // Lead times: 24h, 36h, 48h
    // Avg: (24 + 36 + 48) / 3 = 36
    // Median (odd): 36
    expect(result?.avgLeadTimeH).toBe(36);
    expect(result?.medianLeadTimeH).toBe(36);
  });

  it('should calculate review durations correctly (mixed states)', () => {
    const items = [
      createPR({
        id: '1',
        state: 'open',
        published_at: '2024-05-10T12:00:00Z',
        first_review_at: '2024-05-10T14:30:00Z', // 2.5 hours review time
        created_at: '2024-05-10T12:00:00Z',
      }),
      createPR({
        id: '2',
        state: 'merged',
        published_at: '2024-05-11T12:00:00Z',
        first_review_at: '2024-05-11T16:00:00Z', // 4 hours review time
        created_at: '2024-05-11T12:00:00Z',
        closed_at: '2024-05-12T12:00:00Z',
      }),
      createPR({
        id: '3',
        state: 'open',
        published_at: '2024-05-12T12:00:00Z',
        // No review yet
        created_at: '2024-05-12T12:00:00Z',
      }),
    ];

    const result = computeSummaryMetrics(items);

    // Review times: 2.5h, 4.0h
    // Avg: (2.5 + 4.0) / 2 = 3.25 -> rounds to 3.3
    // Median: (2.5 + 4.0) / 2 = 3.25 -> rounds to 3.3
    expect(result?.avgReviewH).toBe(3.3);
    expect(result?.medianReviewH).toBe(3.3);
  });

  it('should return nulls for times when no valid data is available', () => {
    const items = [
      createPR({
        id: '1',
        state: 'open', // Lead time only counts merged/closed PRs
        first_commit_at: '2024-05-10T12:00:00Z',
        created_at: '2024-05-10T12:00:00Z',
      }),
      createPR({
        id: '2',
        state: 'merged', // Missing first_commit_at
        closed_at: '2024-05-12T12:00:00Z',
        created_at: '2024-05-10T12:00:00Z',
      }),
      createPR({
        id: '3',
        state: 'merged', // Missing published_at and first_review_at
        first_commit_at: '2024-05-10T12:00:00Z',
        closed_at: '2024-05-12T12:00:00Z',
        created_at: '2024-05-10T12:00:00Z',
      }),
    ];

    const result = computeSummaryMetrics(items);

    // Lead times: PR 3 has valid lead time (48h)
    expect(result?.avgLeadTimeH).toBe(48);
    expect(result?.medianLeadTimeH).toBe(48);

    // Review times: No PR has valid review time
    expect(result?.avgReviewH).toBeNull();
    expect(result?.medianReviewH).toBeNull();
  });

  it('should handle zero durations correctly', () => {
    const items = [
      createPR({
        id: '1',
        state: 'merged',
        first_commit_at: '2024-05-10T12:00:00Z',
        closed_at: '2024-05-10T12:00:00Z', // 0 hours lead time
        published_at: '2024-05-10T12:00:00Z',
        first_review_at: '2024-05-10T12:00:00Z', // 0 hours review time
        created_at: '2024-05-10T12:00:00Z',
      }),
    ];

    const result = computeSummaryMetrics(items);

    expect(result?.avgLeadTimeH).toBe(0);
    expect(result?.medianLeadTimeH).toBe(0);
    expect(result?.avgReviewH).toBe(0);
    expect(result?.medianReviewH).toBe(0);
  });
});

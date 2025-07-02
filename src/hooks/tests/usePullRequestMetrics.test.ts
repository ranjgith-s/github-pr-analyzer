import { renderHook, waitFor } from '@testing-library/react';
import { usePullRequestMetrics } from '../../hooks/usePullRequestMetrics';
import * as github from '../../utils/services/github';
import { PRItem } from 'src/types';

const sample: PRItem[] = [
  {
    id: '1',
    owner: 'octo',
    repo_name: 'repo',
    repo: 'octo/repo',
    number: 1,
    title: 'Test PR',
    url: 'x',
    author: 'octo',
    state: 'open',
    created_at: '2020-01-01',
    published_at: '2020-01-02',
    closed_at: '2020-01-03',
    first_review_at: '2020-01-02',
    first_commit_at: '2020-01-01',
    reviewers: ['reviewer1'],
    changes_requested: 0,
    additions: 1,
    deletions: 1,
    comment_count: 0,
    timeline: [],
  },
];

jest.spyOn(github, 'fetchPullRequestMetrics').mockResolvedValue(sample);

test('loads items and updates loading state', async () => {
  const { result } = renderHook(() => usePullRequestMetrics('token'));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.items).toEqual(sample);
});

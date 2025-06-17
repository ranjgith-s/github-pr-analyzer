import { renderHook, waitFor } from '@testing-library/react';
import { useUserPullRequests } from '../hooks/useUserPullRequests';
import * as github from '../services/github';

const sample = [
  {
    id: 1,
    title: 'PR',
    url: 'u',
    created_at: '2020-01-01',
    state: 'open',
    repo: 'o/r',
  },
];

jest.spyOn(github, 'fetchUserPullRequests').mockResolvedValue(sample as any);

test('loads user pull requests', async () => {
  const { result } = renderHook(() => useUserPullRequests('tok', 'dev'));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.items).toEqual(sample);
});

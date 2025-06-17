import { renderHook, waitFor } from '@testing-library/react';
import { useDeveloperMetrics } from '../hooks/useDeveloperMetrics';
import * as github from '../services/github';

const sample = {
  login: 'dev',
  name: 'Dev',
  avatar_url: 'x',
  html_url: 'https://github.com/dev',
  bio: 'dev bio',
  company: 'Acme',
  location: 'Earth',
  followers: 10,
  following: 5,
  public_repos: 3,
  acceptanceRate: 50,
  reviewCycles: 1,
  prSize: 10,
  leadTime: 5,
  reviewParticipation: 3,
  feedbackThoroughness: 2,
  issuesClosed: 1,
};

jest.spyOn(github, 'fetchDeveloperMetrics').mockResolvedValue(sample as any);

test('loads developer metrics', async () => {
  const { result } = renderHook(() => useDeveloperMetrics('tok', 'dev'));
  expect(result.current.loading).toBe(true);
  await waitFor(() => expect(result.current.loading).toBe(false));
  expect(result.current.data).toEqual(sample);
});

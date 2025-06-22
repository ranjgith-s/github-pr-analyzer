import { renderHook, act, waitFor } from '@testing-library/react';
import { useRepoInsights } from '../hooks/useRepoInsights';
import * as githubService from '../services/github';

jest.mock('../services/github');

describe('useRepoInsights', () => {
  const token = 'tok';
  const owner = 'o';
  const repo = 'r';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads data on mount', async () => {
    (githubService.fetchRepoInsights as jest.Mock).mockResolvedValue({ foo: 'bar' });
    const { result } = renderHook(() => useRepoInsights(token, owner, repo));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ foo: 'bar' });
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    (githubService.fetchRepoInsights as jest.Mock).mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useRepoInsights(token, owner, repo));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Failed to load data');
  });

  it('does not load if owner or repo is missing', () => {
    const { result } = renderHook(() => useRepoInsights(token, null, repo));
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

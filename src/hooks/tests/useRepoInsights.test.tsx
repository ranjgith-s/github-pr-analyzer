import { renderHook, waitFor } from '@testing-library/react';
import { useRepoInsights } from '../../hooks/useRepoInsights';
import * as githubService from '../../utils/services/githubService';

jest.mock('../../utils/services/githubService');

describe('useRepoInsights', () => {
  const token = 'tok';
  const owner = 'o';
  const repo = 'r';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads data on mount', async () => {
    (githubService.fetchRepoInsights as jest.Mock).mockResolvedValue({
      foo: 'bar',
    });
    const { result } = renderHook(() => useRepoInsights(token, owner, repo));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ foo: 'bar' });
    expect(result.current.error).toBeNull();
  });

  it('sets error on failure', async () => {
    (githubService.fetchRepoInsights as jest.Mock).mockRejectedValue(
      new Error('fail')
    );
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

  it('ignores data if unmounted before fetch completes', async () => {
    let resolvePromise!: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    (githubService.fetchRepoInsights as jest.Mock).mockReturnValue(promise);

    const { result, unmount } = renderHook(() =>
      useRepoInsights(token, owner, repo)
    );

    expect(result.current.loading).toBe(true);

    unmount();

    resolvePromise({ foo: 'baz' });

    // Wait for the microtasks to settle
    await Promise.resolve();

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(true); // Since it unmounted before finally block, state wasn't updated
  });

  it('ignores error if unmounted before fetch completes', async () => {
    let rejectPromise!: (reason?: any) => void;
    const promise = new Promise((_, reject) => {
      rejectPromise = reject;
    });
    (githubService.fetchRepoInsights as jest.Mock).mockReturnValue(promise);

    const { result, unmount } = renderHook(() =>
      useRepoInsights(token, owner, repo)
    );

    expect(result.current.loading).toBe(true);

    unmount();

    rejectPromise(new Error('fail'));

    // Try to catch the unhandled rejection from the mock to prevent test suite errors
    await promise.catch(() => {});

    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true); // Since it unmounted before finally block
  });
});

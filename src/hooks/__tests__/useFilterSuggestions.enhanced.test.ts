import { renderHook, waitFor } from '@testing-library/react';
import { useFilterSuggestions } from '../useFilterSuggestions';
import * as AuthContext from '../../contexts/AuthContext/AuthContext';
import { Octokit } from '@octokit/rest';

jest.mock('../../contexts/AuthContext/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@octokit/rest');

describe('useFilterSuggestions enhanced', () => {
  const mockUseAuth = AuthContext.useAuth as jest.Mock;
  const listFollowersForUser = jest.fn();
  const getAuthenticated = jest.fn();
  const listForAuthenticatedUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      rest: {
        users: { getAuthenticated, listFollowersForUser },
        repos: { listForAuthenticatedUser },
      },
    }));
  });

  it('loads suggestions successfully', async () => {
    mockUseAuth.mockReturnValue({ token: 'token' });
    getAuthenticated.mockResolvedValue({ data: { login: 'me' } });
    listFollowersForUser.mockResolvedValue({ data: [{ login: 'alice' }] });
    listForAuthenticatedUser.mockResolvedValue({
      data: [{ full_name: 'org/repo' }],
    });

    const { result } = renderHook(() => useFilterSuggestions());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual(['@me', 'alice']);
    expect(result.current.repositories).toEqual(['org/repo']);
    expect(result.current.labels.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it('handles user fetch failure gracefully (fallback @me only)', async () => {
    mockUseAuth.mockReturnValue({ token: 'token' });
    getAuthenticated.mockRejectedValue(new Error('boom'));
    listForAuthenticatedUser.mockResolvedValue({ data: [] });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useFilterSuggestions());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.users).toEqual(['@me']);
    warnSpy.mockRestore();
  });

  it('handles repository fetch failure gracefully', async () => {
    mockUseAuth.mockReturnValue({ token: 'token' });
    getAuthenticated.mockResolvedValue({ data: { login: 'me' } });
    listFollowersForUser.mockResolvedValue({ data: [] });
    listForAuthenticatedUser.mockRejectedValue(new Error('fail')); // triggers catch returning []
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { result } = renderHook(() => useFilterSuggestions());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.repositories).toEqual([]);
    warnSpy.mockRestore();
  });
});

import { renderHook } from '@testing-library/react';
import { useFilterSuggestions } from '../useFilterSuggestions';
import * as AuthContext from '../../contexts/AuthContext/AuthContext';

// Mock the AuthContext
jest.mock('../../contexts/AuthContext/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock Octokit
jest.mock('@octokit/rest');

describe('useFilterSuggestions', () => {
  const mockUseAuth = AuthContext.useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return loading state initially', () => {
    mockUseAuth.mockReturnValue({ token: 'test-token' });

    const { result } = renderHook(() => useFilterSuggestions());

    expect(result.current.loading).toBe(true);
    expect(result.current.users).toEqual([]);
    expect(result.current.repositories).toEqual([]);
    expect(result.current.labels).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should not fetch suggestions when no token is available', () => {
    mockUseAuth.mockReturnValue({ token: null });

    const { result } = renderHook(() => useFilterSuggestions());

    expect(result.current.loading).toBe(true);
    expect(result.current.users).toEqual([]);
    expect(result.current.repositories).toEqual([]);
    expect(result.current.labels).toEqual([]);
  });

  it('should return correct interface structure', () => {
    mockUseAuth.mockReturnValue({ token: null });

    const { result } = renderHook(() => useFilterSuggestions());

    expect(result.current).toHaveProperty('users');
    expect(result.current).toHaveProperty('repositories');
    expect(result.current).toHaveProperty('labels');
    expect(result.current).toHaveProperty('loading');
    expect(result.current).toHaveProperty('error');
  });
});

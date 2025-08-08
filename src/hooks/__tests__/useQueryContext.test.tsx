import React from 'react';
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useQueryContext } from '../useQueryContext';
import { AuthContext } from '../../contexts/AuthContext/AuthContext';

const createWrapper =
  (initialEntries: string[], authValue: any = null) =>
  // eslint-disable-next-line react/display-name
  ({ children }: { children: React.ReactNode }) => {
    const defaultAuthValue = {
      user: { login: 'testuser' },
      token: 'token',
      login: jest.fn(),
      logout: jest.fn(),
    };

    return (
      <MemoryRouter initialEntries={initialEntries}>
        <AuthContext.Provider value={authValue || defaultAuthValue}>
          {children}
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

describe('useQueryContext', () => {
  it('should return default query when no URL params', () => {
    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper(['/insights']),
    });

    expect(result.current).toEqual({
      query: 'is:pr involves:testuser',
      isDefaultQuery: true,
      params: { page: 1, sort: 'updated', per_page: 20, order: 'desc' },
      source: 'default',
    });
  });

  it('should parse URL query parameters', () => {
    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper(['/insights?q=is:pr+author:john&page=2']),
    });

    expect(result.current).toEqual({
      query: 'is:pr author:john',
      isDefaultQuery: false,
      params: { page: 2, sort: 'updated', per_page: 20, order: 'desc' },
      source: 'url',
    });
  });

  it('should handle custom sort parameter', () => {
    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper(['/insights?sort=created']),
    });

    expect(result.current.params.sort).toBe('created');
    expect(result.current.params.order).toBe('desc');
    expect(result.current.source).toBe('default'); // No query param, so still default
  });

  it('should handle custom per_page parameter', () => {
    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper(['/insights?per_page=50']),
    });

    expect(result.current.params.per_page).toBe(50);
    expect(result.current.params.order).toBe('desc');
  });

  it('should handle all parameters together', () => {
    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper([
        '/insights?q=is:pr+state:open&page=3&sort=created&per_page=10&order=asc',
      ]),
    });

    expect(result.current).toEqual({
      query: 'is:pr state:open',
      isDefaultQuery: false,
      params: { page: 3, sort: 'created', per_page: 10, order: 'asc' },
      source: 'url',
    });
  });

  it('should handle missing user gracefully', () => {
    const mockAuthValueNoUser = {
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
    };

    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper(['/insights'], mockAuthValueNoUser),
    });

    expect(result.current.query).toBe('');
    expect(result.current.isDefaultQuery).toBe(true);
    expect(result.current.params.order).toBe('desc');
    expect(result.current.source).toBe('default');
  });

  it('should handle URL encoded query parameters', () => {
    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper([
        '/insights?q=is%3Apr%20author%3Ajohn%20state%3Aopen',
      ]),
    });

    expect(result.current.query).toBe('is:pr author:john state:open');
    expect(result.current.isDefaultQuery).toBe(false);
    expect(result.current.params.order).toBe('desc');
  });

  it('should parse provided order value', () => {
    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper(['/insights?order=asc']),
    });
    expect(result.current.params.order).toBe('asc');
  });
});

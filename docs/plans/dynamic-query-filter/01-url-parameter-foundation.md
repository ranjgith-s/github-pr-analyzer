# Chunk 1: URL Parameter Foundation

## Overview

Implement URL parameter support for the insights page while maintaining backward compatibility. This foundational change enables query persistence and sharing without modifying the existing UI.

## Goals

- Add URL parameter parsing and state management
- Maintain current default behavior when no parameters are present
- Enable manual URL manipulation for advanced users
- Establish foundation for future UI enhancements

## Technical Changes

### 1. URL Parameter Structure

```typescript
interface QueryParams {
  q?: string;        // GitHub search query
  page?: number;     // Pagination
  sort?: string;     // Sort order
  per_page?: number; // Results per page
}
```

### 2. Default Query Generation

```typescript
// src/utils/queryUtils.ts
export function getDefaultQuery(user: User): string {
  return `is:pr author:${user.login} OR is:pr reviewed-by:${user.login}`;
}

export function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  return {
    q: searchParams.get('q') || undefined,
    page: Number(searchParams.get('page')) || 1,
    sort: searchParams.get('sort') || 'updated',
    per_page: Number(searchParams.get('per_page')) || 20
  };
}
```

### 3. MetricsPage Component Updates

**File**: `src/pages/Metrics/MetricsPage.tsx`

#### Add URL Parameter Hooks

```typescript
import { useSearchParams } from 'react-router-dom';
import { parseQueryParams, getDefaultQuery } from '../../utils/queryUtils';

export function MetricsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Parse current URL parameters
  const queryParams = parseQueryParams(searchParams);
  
  // Generate effective query (URL param or default)
  const effectiveQuery = queryParams.q || getDefaultQuery(user);
  
  // Use effectiveQuery instead of hardcoded queries
  const { data, loading, error } = usePullRequestMetrics(token, {
    query: effectiveQuery,
    page: queryParams.page,
    sort: queryParams.sort,
    perPage: queryParams.per_page
  });
  
  // Existing component logic remains unchanged
}
```

### 4. Enhanced usePullRequestMetrics Hook

**File**: `src/hooks/usePullRequestMetrics.ts`

#### Update Hook Interface

```typescript
interface UsePullRequestMetricsOptions {
  query: string;
  page?: number;
  sort?: 'updated' | 'created' | 'popularity';
  perPage?: number;
}

export function usePullRequestMetrics(
  token: string,
  options: UsePullRequestMetricsOptions
) {
  const [data, setData] = useState<PullRequestMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const result = await fetchPullRequestMetrics(token, options.query, {
          page: options.page,
          sort: options.sort,
          per_page: options.perPage
        });
        
        setData(result.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (token && options.query) {
      fetchData();
    }
  }, [token, options.query, options.page, options.sort, options.perPage]);

  return { data, loading, error };
}
```

### 5. Utility Functions

**File**: `src/utils/queryUtils.ts`

```typescript
export interface QueryParams {
  q?: string;
  page?: number;
  sort?: string;
  per_page?: number;
}

export function getDefaultQuery(user: User): string {
  return `is:pr author:${user.login} OR is:pr reviewed-by:${user.login}`;
}

export function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  const q = searchParams.get('q');
  const page = searchParams.get('page');
  const sort = searchParams.get('sort');
  const perPage = searchParams.get('per_page');

  return {
    q: q || undefined,
    page: page ? Number(page) : 1,
    sort: sort || 'updated',
    per_page: perPage ? Number(perPage) : 20
  };
}

export function buildQueryString(params: QueryParams): string {
  const searchParams = new URLSearchParams();
  
  if (params.q) searchParams.set('q', params.q);
  if (params.page && params.page > 1) searchParams.set('page', params.page.toString());
  if (params.sort && params.sort !== 'updated') searchParams.set('sort', params.sort);
  if (params.per_page && params.per_page !== 20) searchParams.set('per_page', params.per_page.toString());
  
  return searchParams.toString();
}
```

## Testing Requirements

### 1. Unit Tests

**File**: `src/utils/__tests__/queryUtils.test.ts`

```typescript
describe('queryUtils', () => {
  describe('getDefaultQuery', () => {
    it('should generate correct default query for user', () => {
      const user = { login: 'testuser' };
      const query = getDefaultQuery(user);
      expect(query).toBe('is:pr author:testuser OR is:pr reviewed-by:testuser');
    });
  });

  describe('parseQueryParams', () => {
    it('should parse URL parameters correctly', () => {
      const searchParams = new URLSearchParams('q=is:pr+author:john&page=2');
      const params = parseQueryParams(searchParams);
      expect(params).toEqual({
        q: 'is:pr author:john',
        page: 2,
        sort: 'updated',
        per_page: 20
      });
    });

    it('should return defaults for missing parameters', () => {
      const searchParams = new URLSearchParams('');
      const params = parseQueryParams(searchParams);
      expect(params).toEqual({
        q: undefined,
        page: 1,
        sort: 'updated',
        per_page: 20
      });
    });
  });
});
```

### 2. Integration Tests

**File**: `src/pages/Metrics/__tests__/MetricsPage.integration.test.tsx`

```typescript
describe('MetricsPage URL Parameter Integration', () => {
  it('should use default query when no URL parameters', async () => {
    render(<MetricsPage />, { 
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/insights']}>
          <AuthProvider value={{ user: { login: 'testuser' }, token: 'token' }}>
            {children}
          </AuthProvider>
        </MemoryRouter>
      )
    });

    await waitFor(() => {
      expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith(
        'token',
        'is:pr author:testuser OR is:pr reviewed-by:testuser',
        expect.any(Object)
      );
    });
  });

  it('should use query from URL parameters', async () => {
    render(<MetricsPage />, { 
      wrapper: ({ children }) => (
        <MemoryRouter initialEntries={['/insights?q=is:pr+author:john']}>
          <AuthProvider value={{ user: { login: 'testuser' }, token: 'token' }}>
            {children}
          </AuthProvider>
        </MemoryRouter>
      )
    });

    await waitFor(() => {
      expect(mockFetchPullRequestMetrics).toHaveBeenCalledWith(
        'token',
        'is:pr author:john',
        expect.any(Object)
      );
    });
  });
});
```

## Implementation Steps

1. **Day 1**: Create utility functions and types
2. **Day 2**: Update usePullRequestMetrics hook
3. **Day 3**: Modify MetricsPage component
4. **Day 4**: Write comprehensive tests and documentation

## Acceptance Criteria

- [ ] Default behavior remains unchanged when no URL parameters
- [ ] URL parameters override default query when present
- [ ] All existing tests continue to pass
- [ ] New functionality has >95% test coverage
- [ ] Manual URL editing works correctly
- [ ] Invalid parameters gracefully fall back to defaults

## Risk Mitigation

- **Breaking Changes**: Maintain backward compatibility by defaulting to current behavior
- **Invalid Parameters**: Validate and sanitize all URL parameters
- **Performance**: No additional API calls for default behavior
- **Type Safety**: Full TypeScript coverage for all new interfaces

## Future Preparation

This chunk establishes the foundation for:

- Query editor UI components
- URL sharing functionality
- Query validation and suggestions
- Advanced filter interfaces

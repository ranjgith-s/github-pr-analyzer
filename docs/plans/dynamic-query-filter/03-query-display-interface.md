# Chunk 3: Query Display Interface

## Overview

Implement a read-only query display component that shows users the current active search query. This provides transparency about what data is being displayed and prepares the foundation for the query editor.

## Goals

- Show current active query in a prominent, readable format
- Display query context and result count
- Provide visual feedback for query state (loading, error, success)
- Maintain clean, accessible UI design
- Prepare component structure for future editing capabilities

## Technical Changes

### 1. QueryDisplay Component with HeroUI

**File**: `src/components/QueryDisplay/QueryDisplay.tsx`

```typescript
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader,
  Link,
  Spinner 
} from '@heroui/react';
import { 
  MagnifyingGlassIcon, 
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';

export interface QueryDisplayProps {
  query: string;
  resultCount?: number;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function QueryDisplay({
  query,
  resultCount,
  isLoading = false,
  error = null,
  className = ''
}: QueryDisplayProps) {
  const getStatusContent = () => {
    if (error) {
      return {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-danger" />,
        text: `Error: ${error}`,
        textColor: 'text-danger'
      };
    }
    
    if (isLoading) {
      return {
        icon: <Spinner size="sm" color="primary" />,
        text: 'Loading results...',
        textColor: 'text-default-500'
      };
    }
    
    if (typeof resultCount === 'number') {
      return {
        icon: <MagnifyingGlassIcon className="h-5 w-5 text-success" />,
        text: `${resultCount} result${resultCount !== 1 ? 's' : ''}`,
        textColor: 'text-success'
      };
    }
    
    return {
      icon: <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />,
      text: 'Ready to search',
      textColor: 'text-default-400'
    };
  };

  const statusContent = getStatusContent();

  return (
    <Card className={`mb-6 ${className}`} shadow="sm">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {statusContent.icon}
          <span className={`text-sm font-medium ${statusContent.textColor}`}>
            {statusContent.text}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="bg-default-100 rounded-lg p-3">
          <div className="text-xs text-default-500 mb-1">Current Query:</div>
          <code className="text-sm text-default-900 bg-transparent">
            {query}
          </code>
        </div>
        <div className="mt-2 text-xs text-default-500">
          Using GitHub search syntax. 
          <Link 
            href="https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests"
            isExternal
            size="sm"
            className="ml-1"
          >
            Learn more
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. Query Context Hook

**File**: `src/hooks/useQueryContext.ts`

```typescript
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { parseQueryParams, getDefaultQuery } from '../utils/queryUtils';

export interface QueryContext {
  query: string;
  isDefaultQuery: boolean;
  params: {
    page: number;
    sort: string;
    per_page: number;
  };
  source: 'url' | 'default';
}

export function useQueryContext(): QueryContext {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  return useMemo(() => {
    const urlParams = parseQueryParams(searchParams);
    const defaultQuery = getDefaultQuery(user);
    
    const query = urlParams.q || defaultQuery;
    const isDefaultQuery = !urlParams.q;
    
    return {
      query,
      isDefaultQuery,
      params: {
        page: urlParams.page || 1,
        sort: urlParams.sort || 'updated',
        per_page: urlParams.per_page || 20
      },
      source: isDefaultQuery ? 'default' : 'url'
    };
  }, [searchParams, user]);
}
```

### 3. Enhanced MetricsPage Integration

**File**: `src/pages/Metrics/MetricsPage.tsx`

```typescript
import React from 'react';
import { QueryDisplay } from '../../components/QueryDisplay/QueryDisplay';
import { useQueryContext } from '../../hooks/useQueryContext';
import { usePullRequestMetrics } from '../../hooks/usePullRequestMetrics';
import { useAuth } from '../../contexts/AuthContext';
import { MetricsTable } from '../../components/MetricsTable/MetricsTable';
import { LoadingOverlay } from '../../components/LoadingOverlay/LoadingOverlay';

export function MetricsPage() {
  const { token } = useAuth();
  const queryContext = useQueryContext();
  
  const { data, loading, error } = usePullRequestMetrics(token, {
    query: queryContext.query,
    page: queryContext.params.page,
    sort: queryContext.params.sort,
    perPage: queryContext.params.per_page
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pull Request Insights</h1>
        <p className="text-default-600">
          Analyze pull request metrics and performance data.
        </p>
      </div>

      <QueryDisplay
        query={queryContext.query}
        resultCount={loading ? undefined : data?.length}
        isLoading={loading}
        error={error}
      />

      {loading && <LoadingOverlay message="Loading pull request data..." />}
      
      {error && (
        <div className="text-center py-8">
          <p className="text-danger mb-4">Failed to load pull request data</p>
          <p className="text-sm text-default-500">{error}</p>
        </div>
      )}

      {data && data.length > 0 && (
        <MetricsTable data={data} />
      )}

      {data && data.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-default-500 mb-4">No pull requests found</p>
          <p className="text-sm text-default-400">
            Try adjusting your search query to find relevant results.
          </p>
        </div>
      )}
    </div>
  );
}
```

### 4. Component Styling

**File**: `src/components/QueryDisplay/QueryDisplay.module.css`

```css
.queryDisplay {
  transition: all 0.2s ease-in-out;
}

.queryDisplay:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.queryCode {
  font-family: 'SF Mono', Monaco, 'Inconsolata', 'Roboto Mono', 'Source Code Pro', monospace;
  word-break: break-all;
  white-space: pre-wrap;
}

.statusIcon {
  flex-shrink: 0;
}

.loadingSpinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.helpLink {
  transition: color 0.2s ease-in-out;
}

.helpLink:hover {
  text-decoration: underline;
}
```

### 5. Accessibility Enhancements

**File**: `src/components/QueryDisplay/QueryDisplay.a11y.tsx`

```typescript
// Accessibility utilities for QueryDisplay
export const queryDisplayA11y = {
  // ARIA labels for different states
  getAriaLabel: (resultCount?: number, isLoading?: boolean, error?: string) => {
    if (error) return `Query error: ${error}`;
    if (isLoading) return 'Loading search results';
    if (typeof resultCount === 'number') {
      return `Search complete. Found ${resultCount} result${resultCount !== 1 ? 's' : ''}`;
    }
    return 'Search query ready';
  },

  // Screen reader announcements
  getLiveRegionText: (resultCount?: number, isLoading?: boolean, error?: string) => {
    if (error) return `Search failed: ${error}`;
    if (isLoading) return 'Searching for pull requests...';
    if (typeof resultCount === 'number') {
      return `Search completed. ${resultCount} pull request${resultCount !== 1 ? 's' : ''} found.`;
    }
    return '';
  },

  // Keyboard navigation helpers
  queryCodeProps: {
    role: 'code',
    'aria-label': 'Current search query',
    tabIndex: 0
  }
};
```

## Testing Requirements

### 1. Component Tests

**File**: `src/components/QueryDisplay/__tests__/QueryDisplay.test.tsx`

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryDisplay } from '../QueryDisplay';

describe('QueryDisplay', () => {
  it('should display query text correctly', () => {
    render(
      <QueryDisplay query="is:pr author:john" />
    );
    
    expect(screen.getByText('is:pr author:john')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <QueryDisplay 
        query="is:pr author:john" 
        isLoading={true}
      />
    );
    
    expect(screen.getByText('Loading results...')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
  });

  it('should display result count when provided', () => {
    render(
      <QueryDisplay 
        query="is:pr author:john" 
        resultCount={42}
      />
    );
    
    expect(screen.getByText('42 results')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <QueryDisplay 
        query="is:pr author:john" 
        error="Invalid query syntax"
      />
    );
    
    expect(screen.getByText('Error: Invalid query syntax')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(
      <QueryDisplay 
        query="is:pr author:john" 
        resultCount={5}
      />
    );
    
    const codeElement = screen.getByRole('code');
    expect(codeElement).toHaveAttribute('aria-label', 'Current search query');
    expect(codeElement).toHaveAttribute('tabIndex', '0');
  });
});
```

### 2. Hook Tests

**File**: `src/hooks/__tests__/useQueryContext.test.ts`

```typescript
import { renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useQueryContext } from '../useQueryContext';
import { AuthProvider } from '../../contexts/AuthContext';

const createWrapper = (initialEntries: string[]) => 
  ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider value={{ user: { login: 'testuser' }, token: 'token' }}>
        {children}
      </AuthProvider>
    </MemoryRouter>
  );

describe('useQueryContext', () => {
  it('should return default query when no URL params', () => {
    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper(['/insights'])
    });

    expect(result.current).toEqual({
      query: 'is:pr author:testuser OR is:pr reviewed-by:testuser',
      isDefaultQuery: true,
      params: { page: 1, sort: 'updated', per_page: 20 },
      source: 'default'
    });
  });

  it('should parse URL query parameters', () => {
    const { result } = renderHook(() => useQueryContext(), {
      wrapper: createWrapper(['/insights?q=is:pr+author:john&page=2'])
    });

    expect(result.current).toEqual({
      query: 'is:pr author:john',
      isDefaultQuery: false,
      params: { page: 2, sort: 'updated', per_page: 20 },
      source: 'url'
    });
  });
});
```

## Implementation Steps

1. **Day 1**: Create QueryDisplay component with basic functionality
2. **Day 2**: Implement useQueryContext hook and integration
3. **Day 3**: Add accessibility features and styling
4. **Day 4**: Write comprehensive tests and documentation

## Acceptance Criteria

- [ ] Query display shows current search query clearly
- [ ] Loading, error, and success states are visually distinct
- [ ] Result count displays accurately when available
- [ ] Component is fully accessible with ARIA labels
- [ ] Integration with MetricsPage works seamlessly
- [ ] All visual states are tested
- [ ] Component follows design system guidelines

## Design Considerations

- **Visual Hierarchy**: Query display is prominent but not overwhelming
- **Status Clarity**: Clear icons and colors for different states
- **Responsive Design**: Works well on mobile and desktop
- **Accessibility**: Screen reader friendly with proper ARIA labels
- **Future Ready**: Component structure supports editing capabilities

## Risk Mitigation

- **Performance**: Memoized context hook prevents unnecessary re-renders
- **Accessibility**: Comprehensive ARIA support and keyboard navigation
- **Visual Consistency**: Uses existing design system components
- **Error Handling**: Graceful degradation for all error states

## Future Preparation

This component establishes the foundation for:

- Query editing interface (toggle to edit mode)
- Query validation feedback (real-time syntax checking)
- Query suggestions (autocomplete dropdown)
- Query history and saved queries

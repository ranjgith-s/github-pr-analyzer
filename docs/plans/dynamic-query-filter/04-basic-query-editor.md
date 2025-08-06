# Chunk 4: Basic Query Editor

## Overview

Transform the read-only QueryDisplay component into an interactive query editor that allows users to modify search queries using a text input. This chunk adds editing capabilities while maintaining the existing display functionality.

## Goals

- Add query editing capabilities to the QueryDisplay component
- Implement query validation with real-time feedback
- Support query execution and URL updates
- Provide smooth transitions between display and edit modes
- Maintain accessibility and usability standards

## Technical Changes

### 1. Enhanced QueryDisplay Component with HeroUI

**File**: `src/components/QueryDisplay/QueryDisplay.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Textarea,
  Spinner,
  Link
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { validateQuery } from '../../services/queryValidator';
import { buildQueryString } from '../../utils/queryUtils';

export interface QueryDisplayProps {
  query: string;
  resultCount?: number;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  onQueryChange?: (query: string) => void;
  editable?: boolean;
}

export function QueryDisplay({
  query,
  resultCount,
  isLoading = false,
  error = null,
  className = '',
  onQueryChange,
  editable = true
}: QueryDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(query);
  const [validationResult, setValidationResult] = useState(validateQuery(query));
  const [, setSearchParams] = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update edit value when query prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(query);
    }
  }, [query, isEditing]);

  // Validate query in real-time during editing
  useEffect(() => {
    if (isEditing) {
      setValidationResult(validateQuery(editValue));
    }
  }, [editValue, isEditing]);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(query);
    // Focus the textarea after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.select();
      }
    }, 0);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(query);
    setValidationResult(validateQuery(query));
  };

  const handleEditSave = () => {
    if (validationResult.isValid) {
      const sanitizedQuery = validationResult.sanitized;
      
      // Update URL parameters
      const newParams = new URLSearchParams();
      if (sanitizedQuery !== getDefaultQuery()) {
        newParams.set('q', sanitizedQuery);
      }
      setSearchParams(newParams);
      
      // Notify parent component
      onQueryChange?.(sanitizedQuery);
      
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    }
  };

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
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {statusContent.icon}
            <span className={`text-sm font-medium ${statusContent.textColor}`}>
              {statusContent.text}
            </span>
          </div>
          
          {editable && !isLoading && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    color="success"
                    variant="flat"
                    startContent={<CheckIcon className="h-4 w-4" />}
                    onPress={handleEditSave}
                    isDisabled={!validationResult.isValid}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    color="default"
                    variant="flat"
                    startContent={<XMarkIcon className="h-4 w-4" />}
                    onPress={handleEditCancel}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  startContent={<PencilIcon className="h-4 w-4" />}
                  onPress={handleEditStart}
                >
                  Edit Query
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter GitHub search query..."
              minRows={2}
              maxRows={6}
              classNames={{
                input: 'font-mono text-sm',
                inputWrapper: validationResult.isValid 
                  ? 'border-success' 
                  : 'border-danger'
              }}
              aria-label="Edit search query"
            />
            
            {/* Validation feedback */}
            {validationResult.errors.length > 0 && (
              <div className="space-y-1">
                {validationResult.errors.map((errorMsg, index) => (
                  <p key={index} className="text-xs text-danger">
                    {errorMsg}
                  </p>
                ))}
              </div>
            )}
            
            {validationResult.warnings.length > 0 && (
              <div className="space-y-1">
                {validationResult.warnings.map((warning, index) => (
                  <p key={index} className="text-xs text-warning">
                    {warning}
                  </p>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-default-500">
              <span>Press Cmd+Enter to apply, Escape to cancel</span>
              <span>{editValue.length}/256</span>
            </div>
          </div>
        ) : (
          <div className="bg-default-100 rounded-lg p-3">
            <div className="text-xs text-default-500 mb-1">Current Query:</div>
            <code 
              className="text-sm text-default-900 bg-transparent block break-all"
              role="code"
              aria-label="Current search query"
              tabIndex={0}
            >
              {query}
            </code>
          </div>
        )}
        
        {!isEditing && (
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
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to get default query
function getDefaultQuery(): string {
  // This would be imported from utils in real implementation
  return 'is:pr author:@me OR is:pr reviewed-by:@me';
}
```

### 2. Query Editor Hook

**File**: `src/hooks/useQueryEditor.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { validateQuery, QueryValidationResult } from '../services/queryValidator';
import { useDebounce } from './useDebounce';

export interface UseQueryEditorOptions {
  initialQuery: string;
  onQueryChange?: (query: string) => void;
  debounceMs?: number;
}

export interface UseQueryEditorReturn {
  query: string;
  editValue: string;
  isEditing: boolean;
  validationResult: QueryValidationResult;
  isValid: boolean;
  isDirty: boolean;
  
  // Actions
  startEditing: () => void;
  cancelEditing: () => void;
  saveQuery: () => void;
  updateEditValue: (value: string) => void;
  
  // State
  hasChanges: boolean;
  canSave: boolean;
}

export function useQueryEditor({
  initialQuery,
  onQueryChange,
  debounceMs = 300
}: UseQueryEditorOptions): UseQueryEditorReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [editValue, setEditValue] = useState(initialQuery);
  const [isEditing, setIsEditing] = useState(false);
  const [validationResult, setValidationResult] = useState(validateQuery(initialQuery));
  
  // Debounce validation during editing
  const debouncedEditValue = useDebounce(editValue, debounceMs);
  
  // Update validation when debounced value changes
  useEffect(() => {
    if (isEditing) {
      setValidationResult(validateQuery(debouncedEditValue));
    }
  }, [debouncedEditValue, isEditing]);
  
  // Update query when initial query changes
  useEffect(() => {
    if (!isEditing) {
      setQuery(initialQuery);
      setEditValue(initialQuery);
      setValidationResult(validateQuery(initialQuery));
    }
  }, [initialQuery, isEditing]);
  
  const startEditing = useCallback(() => {
    setIsEditing(true);
    setEditValue(query);
  }, [query]);
  
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue(query);
    setValidationResult(validateQuery(query));
  }, [query]);
  
  const saveQuery = useCallback(() => {
    if (validationResult.isValid) {
      const sanitizedQuery = validationResult.sanitized;
      
      // Update URL
      const newParams = new URLSearchParams(searchParams);
      if (sanitizedQuery !== initialQuery) {
        newParams.set('q', sanitizedQuery);
      } else {
        newParams.delete('q');
      }
      setSearchParams(newParams);
      
      // Update local state
      setQuery(sanitizedQuery);
      setIsEditing(false);
      
      // Notify parent
      onQueryChange?.(sanitizedQuery);
    }
  }, [validationResult, searchParams, setSearchParams, initialQuery, onQueryChange]);
  
  const updateEditValue = useCallback((value: string) => {
    setEditValue(value);
  }, []);
  
  const isDirty = editValue !== query;
  const hasChanges = isEditing && isDirty;
  const canSave = validationResult.isValid && isDirty;
  
  return {
    query,
    editValue,
    isEditing,
    validationResult,
    isValid: validationResult.isValid,
    isDirty,
    
    startEditing,
    cancelEditing,
    saveQuery,
    updateEditValue,
    
    hasChanges,
    canSave
  };
}
```

### 3. Enhanced MetricsPage Integration

**File**: `src/pages/Metrics/MetricsPage.tsx`

```typescript
import React, { useCallback } from 'react';
import { QueryDisplay } from '../../components/QueryDisplay/QueryDisplay';
import { useQueryContext } from '../../hooks/useQueryContext';
import { usePullRequestMetrics } from '../../hooks/usePullRequestMetrics';
import { useAuth } from '../../contexts/AuthContext';
import { MetricsTable } from '../../components/MetricsTable/MetricsTable';
import { LoadingOverlay } from '../../components/LoadingOverlay/LoadingOverlay';

export function MetricsPage() {
  const { token } = useAuth();
  const queryContext = useQueryContext();
  
  const { data, loading, error, refetch } = usePullRequestMetrics(token, {
    query: queryContext.query,
    page: queryContext.params.page,
    sort: queryContext.params.sort,
    perPage: queryContext.params.per_page
  });

  const handleQueryChange = useCallback((newQuery: string) => {
    // The QueryDisplay component handles URL updates
    // This callback can be used for analytics or side effects
    console.log('Query changed:', newQuery);
    
    // Optionally trigger immediate refetch
    refetch?.();
  }, [refetch]);

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
        onQueryChange={handleQueryChange}
        editable={true}
      />

      {loading && <LoadingOverlay message="Loading pull request data..." />}
      
      {error && !loading && (
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

### 4. Query Validation Enhancements

**File**: `src/services/queryValidator.ts` (additional exports)

```typescript
// Real-time validation for UI feedback
export function validateQueryRealtime(query: string): QueryValidationResult {
  const result = validateQuery(query);
  
  // More lenient validation for real-time feedback
  if (query.trim().length === 0) {
    return {
      isValid: false,
      sanitized: query,
      errors: [],
      warnings: ['Query is empty']
    };
  }
  
  return result;
}

// Query suggestions for common fixes
export function getQuerySuggestions(query: string): string[] {
  const suggestions: string[] = [];
  
  if (!query.includes('is:pr')) {
    suggestions.push(`is:pr ${query}`.trim());
  }
  
  if (query.includes('author:') && !query.includes('author:@me')) {
    suggestions.push(query.replace(/author:\w+/, 'author:@me'));
  }
  
  return suggestions;
}
```

## Testing Requirements

### 1. Component Tests

**File**: `src/components/QueryDisplay/__tests__/QueryDisplay.editor.test.tsx`

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryDisplay } from '../QueryDisplay';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('QueryDisplay Editor', () => {
  it('should enter edit mode when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(
      <QueryDisplay query="is:pr author:john" editable={true} />
    );
    
    const editButton = screen.getByRole('button', { name: /edit query/i });
    await user.click(editButton);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByDisplayValue('is:pr author:john')).toBeInTheDocument();
  });

  it('should save query when apply button is clicked', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();
    
    renderWithRouter(
      <QueryDisplay 
        query="is:pr author:john" 
        editable={true}
        onQueryChange={onQueryChange}
      />
    );
    
    // Start editing
    await user.click(screen.getByRole('button', { name: /edit query/i }));
    
    // Modify query
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'is:pr author:jane');
    
    // Save
    await user.click(screen.getByRole('button', { name: /apply/i }));
    
    expect(onQueryChange).toHaveBeenCalledWith('is:pr author:jane');
  });

  it('should cancel editing when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(
      <QueryDisplay query="is:pr author:john" editable={true} />
    );
    
    // Start editing
    await user.click(screen.getByRole('button', { name: /edit query/i }));
    
    // Modify query
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, ' extra text');
    
    // Cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    
    // Should show original query
    expect(screen.getByText('is:pr author:john')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('should validate query in real-time', async () => {
    const user = userEvent.setup();
    
    renderWithRouter(
      <QueryDisplay query="is:pr author:john" editable={true} />
    );
    
    // Start editing
    await user.click(screen.getByRole('button', { name: /edit query/i }));
    
    // Enter invalid query
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'invalid"query');
    
    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/unmatched quote/i)).toBeInTheDocument();
    });
    
    // Apply button should be disabled
    expect(screen.getByRole('button', { name: /apply/i })).toBeDisabled();
  });

  it('should support keyboard shortcuts', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();
    
    renderWithRouter(
      <QueryDisplay 
        query="is:pr author:john" 
        editable={true}
        onQueryChange={onQueryChange}
      />
    );
    
    // Start editing
    await user.click(screen.getByRole('button', { name: /edit query/i }));
    
    const textarea = screen.getByRole('textbox');
    await user.clear(textarea);
    await user.type(textarea, 'is:pr author:jane');
    
    // Test Cmd+Enter to save
    await user.keyboard('{Meta>}{Enter}{/Meta}');
    
    expect(onQueryChange).toHaveBeenCalledWith('is:pr author:jane');
  });
});
```

### 2. Hook Tests

**File**: `src/hooks/__tests__/useQueryEditor.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useQueryEditor } from '../useQueryEditor';

const createWrapper = () => 
  ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
      {children}
    </MemoryRouter>
  );

describe('useQueryEditor', () => {
  it('should initialize with provided query', () => {
    const { result } = renderHook(
      () => useQueryEditor({ initialQuery: 'is:pr author:john' }),
      { wrapper: createWrapper() }
    );

    expect(result.current.query).toBe('is:pr author:john');
    expect(result.current.editValue).toBe('is:pr author:john');
    expect(result.current.isEditing).toBe(false);
  });

  it('should handle editing state transitions', () => {
    const { result } = renderHook(
      () => useQueryEditor({ initialQuery: 'is:pr author:john' }),
      { wrapper: createWrapper() }
    );

    // Start editing
    act(() => {
      result.current.startEditing();
    });

    expect(result.current.isEditing).toBe(true);

    // Cancel editing
    act(() => {
      result.current.cancelEditing();
    });

    expect(result.current.isEditing).toBe(false);
  });

  it('should validate queries during editing', async () => {
    const { result } = renderHook(
      () => useQueryEditor({ initialQuery: 'is:pr author:john' }),
      { wrapper: createWrapper() }
    );

    act(() => {
      result.current.startEditing();
      result.current.updateEditValue('invalid"query');
    });

    // Wait for debounced validation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 350));
    });

    expect(result.current.isValid).toBe(false);
    expect(result.current.canSave).toBe(false);
  });
});
```

## Implementation Steps

1. **Day 1**: Enhance QueryDisplay component with editing capabilities
2. **Day 2**: Implement useQueryEditor hook and validation
3. **Day 3**: Add keyboard shortcuts and accessibility features
4. **Day 4**: Write comprehensive tests and polish UX
5. **Day 5**: Integration testing and documentation

## Acceptance Criteria

- [ ] Users can toggle between display and edit modes
- [ ] Real-time query validation with helpful error messages
- [ ] Keyboard shortcuts work (Cmd+Enter to save, Escape to cancel)
- [ ] URL updates automatically when query is saved
- [ ] Invalid queries prevent saving with clear feedback
- [ ] All interactions are accessible via keyboard and screen reader
- [ ] Component maintains existing display functionality
- [ ] Smooth animations between states

## Risk Mitigation

- **State Management**: Clear separation between display and edit states
- **Validation Performance**: Debounced validation prevents excessive API calls
- **Accessibility**: Full keyboard navigation and ARIA support
- **Error Handling**: Graceful handling of validation errors
- **User Experience**: Clear visual feedback for all states

## Future Preparation

This editing interface prepares for:

- Query autocomplete and suggestions
- Visual filter builder integration
- Query templates and presets
- Advanced query syntax highlighting

# Chunk 5: Visual Filter Builder

## Overview

Implement a user-friendly visual filter builder that allows users to construct GitHub search queries using form controls instead of writing raw query syntax. This provides an alternative interface for users who prefer guided input over manual query writing.

## Goals

- Create intuitive form-based interface for common GitHub search filters
- Support switching between visual and advanced text modes
- Generate valid GitHub search syntax from form inputs
- Maintain synchronization between visual filters and text query
- Provide guided experience for users unfamiliar with GitHub search syntax

## Technical Changes

### 1. Visual Filter Builder Component with HeroUI

**File**: `src/components/QueryDisplay/VisualFilterBuilder.tsx`

```typescript
import React, { useEffect } from 'react';
import {
  Card,
  CardContent,
  Input,
  Select,
  SelectItem,
  Button,
  DatePicker,
  Chip,
  Autocomplete,
  AutocompleteItem,
  Divider
} from '@heroui/react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { parseGitHubQuery, buildGitHubQuery } from '../../utils/queryBuilder';

export interface FilterState {
  authors: string[];
  reviewers: string[];
  repositories: string[];
  labels: string[];
  state: 'open' | 'closed' | 'merged' | 'all';
  isDraft: boolean | null;
  dateRange: {
    created?: { start?: Date; end?: Date };
    updated?: { start?: Date; end?: Date };
  };
  assignees: string[];
  involves: string[];
}

export interface VisualFilterBuilderProps {
  query: string;
  onQueryChange: (query: string) => void;
  isLoading?: boolean;
  suggestions?: {
    users: string[];
    repositories: string[];
    labels: string[];
  };
}

export function VisualFilterBuilder({
  query,
  onQueryChange,
  isLoading = false,
  suggestions = { users: [], repositories: [], labels: [] }
}: VisualFilterBuilderProps) {
  const [filters, setFilters] = React.useState<FilterState>(() => 
    parseGitHubQuery(query)
  );

  // Update filters when query changes externally
  useEffect(() => {
    setFilters(parseGitHubQuery(query));
  }, [query]);

  // Generate query when filters change
  useEffect(() => {
    const newQuery = buildGitHubQuery(filters);
    if (newQuery !== query) {
      onQueryChange(newQuery);
    }
  }, [filters, onQueryChange, query]);

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addStringArrayItem = (key: keyof FilterState, value: string) => {
    if (!value.trim()) return;
    
    setFilters(prev => ({
      ...prev,
      [key]: [...(prev[key] as string[]), value.trim()]
    }));
  };

  const removeStringArrayItem = (key: keyof FilterState, index: number) => {
    setFilters(prev => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Authors Section */}
      <Card shadow="sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 text-default-700">Authors</h3>
          <div className="space-y-3">
            <Autocomplete
              placeholder="Add author..."
              variant="bordered"
              onSelectionChange={(value) => {
                if (value) addStringArrayItem('authors', value.toString());
              }}
              isDisabled={isLoading}
              className="w-full"
            >
              {suggestions.users.map(user => (
                <AutocompleteItem key={user} value={user}>
                  {user}
                </AutocompleteItem>
              ))}
            </Autocomplete>
            
            <div className="flex flex-wrap gap-2">
              {filters.authors.map((author, index) => (
                <Chip
                  key={`${author}-${index}`}
                  onClose={() => removeStringArrayItem('authors', index)}
                  variant="flat"
                  color="primary"
                  size="sm"
                >
                  {author}
                </Chip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviewers Section */}
      <Card shadow="sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 text-default-700">Reviewers</h3>
          <div className="space-y-3">
            <Autocomplete
              placeholder="Add reviewer..."
              variant="bordered"
              onSelectionChange={(value) => {
                if (value) addStringArrayItem('reviewers', value.toString());
              }}
              isDisabled={isLoading}
              className="w-full"
            >
              {suggestions.users.map(user => (
                <AutocompleteItem key={user} value={user}>
                  {user}
                </AutocompleteItem>
              ))}
            </Autocomplete>
            
            <div className="flex flex-wrap gap-2">
              {filters.reviewers.map((reviewer, index) => (
                <Chip
                  key={`${reviewer}-${index}`}
                  onClose={() => removeStringArrayItem('reviewers', index)}
                  variant="flat"
                  color="secondary"
                  size="sm"
                >
                  {reviewer}
                </Chip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repositories Section */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Repositories</h3>
          <div className="space-y-3">
            <Autocomplete
              placeholder="Add repository (owner/repo)..."
              onSelectionChange={(value) => {
                if (value) addStringArrayItem('repositories', value.toString());
              }}
              isDisabled={isLoading}
            >
              {suggestions.repositories.map(repo => (
                <AutocompleteItem key={repo} value={repo}>
                  {repo}
                </AutocompleteItem>
              ))}
            </Autocomplete>
            
            <div className="flex flex-wrap gap-2">
              {filters.repositories.map((repo, index) => (
                <Chip
                  key={`${repo}-${index}`}
                  onClose={() => removeStringArrayItem('repositories', index)}
                  variant="flat"
                  color="success"
                >
                  {repo}
                </Chip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* State and Status Section */}
      <Card shadow="sm">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 text-default-700">State & Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Pull Request State"
              placeholder="Select state"
              variant="bordered"
              selectedKeys={[filters.state]}
              onSelectionChange={(keys) => {
                const state = Array.from(keys)[0] as FilterState['state'];
                updateFilter('state', state);
              }}
              isDisabled={isLoading}
            >
              <SelectItem key="all">All States</SelectItem>
              <SelectItem key="open">Open</SelectItem>
              <SelectItem key="closed">Closed</SelectItem>
              <SelectItem key="merged">Merged</SelectItem>
            </Select>

            <Select
              label="Draft Status"
              placeholder="Select draft status"
              variant="bordered"
              selectedKeys={[filters.isDraft?.toString() || 'all']}
              onSelectionChange={(keys) => {
                const value = Array.from(keys)[0] as string;
                updateFilter('isDraft', 
                  value === 'true' ? true : 
                  value === 'false' ? false : null
                );
              }}
              isDisabled={isLoading}
            >
              <SelectItem key="all">All</SelectItem>
              <SelectItem key="false">Ready for Review</SelectItem>
              <SelectItem key="true">Draft</SelectItem>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Labels Section */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Labels</h3>
          <div className="space-y-3">
            <Autocomplete
              placeholder="Add label..."
              onSelectionChange={(value) => {
                if (value) addStringArrayItem('labels', value.toString());
              }}
              isDisabled={isLoading}
            >
              {suggestions.labels.map(label => (
                <AutocompleteItem key={label} value={label}>
                  {label}
                </AutocompleteItem>
              ))}
            </Autocomplete>
            
            <div className="flex flex-wrap gap-2">
              {filters.labels.map((label, index) => (
                <Chip
                  key={`${label}-${index}`}
                  onClose={() => removeStringArrayItem('labels', index)}
                  variant="flat"
                  color="warning"
                >
                  {label}
                </Chip>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Section */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Date Ranges</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-default-600 mb-2">Created Date</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DatePicker
                  label="From"
                  value={filters.dateRange.created?.start}
                  onChange={(date) => {
                    updateFilter('dateRange', {
                      ...filters.dateRange,
                      created: {
                        ...filters.dateRange.created,
                        start: date || undefined
                      }
                    });
                  }}
                  isDisabled={isLoading}
                />
                <DatePicker
                  label="To"
                  value={filters.dateRange.created?.end}
                  onChange={(date) => {
                    updateFilter('dateRange', {
                      ...filters.dateRange,
                      created: {
                        ...filters.dateRange.created,
                        end: date || undefined
                      }
                    });
                  }}
                  isDisabled={isLoading}
                />
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-default-600 mb-2">Updated Date</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <DatePicker
                  label="From"
                  value={filters.dateRange.updated?.start}
                  onChange={(date) => {
                    updateFilter('dateRange', {
                      ...filters.dateRange,
                      updated: {
                        ...filters.dateRange.updated,
                        start: date || undefined
                      }
                    });
                  }}
                  isDisabled={isLoading}
                />
                <DatePicker
                  label="To"
                  value={filters.dateRange.updated?.end}
                  onChange={(date) => {
                    updateFilter('dateRange', {
                      ...filters.dateRange,
                      updated: {
                        ...filters.dateRange.updated,
                        end: date || undefined
                      }
                    });
                  }}
                  isDisabled={isLoading}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2. Query Builder Utilities

**File**: `src/utils/queryBuilder.ts`

```typescript
import { FilterState } from '../components/QueryDisplay/VisualFilterBuilder';

export function parseGitHubQuery(query: string): FilterState {
  const filters: FilterState = {
    authors: [],
    reviewers: [],
    repositories: [],
    labels: [],
    state: 'all',
    isDraft: null,
    dateRange: {},
    assignees: [],
    involves: []
  };

  // Parse authors
  const authorMatches = query.match(/author:(\S+)/g);
  if (authorMatches) {
    filters.authors = authorMatches.map(match => 
      match.replace('author:', '').replace(/"/g, '')
    );
  }

  // Parse reviewers
  const reviewerMatches = query.match(/reviewed-by:(\S+)/g);
  if (reviewerMatches) {
    filters.reviewers = reviewerMatches.map(match => 
      match.replace('reviewed-by:', '').replace(/"/g, '')
    );
  }

  // Parse repositories
  const repoMatches = query.match(/repo:(\S+)/g);
  if (repoMatches) {
    filters.repositories = repoMatches.map(match => 
      match.replace('repo:', '').replace(/"/g, '')
    );
  }

  // Parse labels
  const labelMatches = query.match(/label:"([^"]+)"/g);
  if (labelMatches) {
    filters.labels = labelMatches.map(match => 
      match.replace(/label:"|"/g, '')
    );
  }

  // Parse state
  if (query.includes('is:open')) filters.state = 'open';
  else if (query.includes('is:closed')) filters.state = 'closed';
  else if (query.includes('is:merged')) filters.state = 'merged';

  // Parse draft status
  if (query.includes('is:draft')) filters.isDraft = true;
  else if (query.includes('-is:draft')) filters.isDraft = false;

  // Parse date ranges
  const createdAfter = query.match(/created:>(\S+)/);
  const createdBefore = query.match(/created:<(\S+)/);
  const updatedAfter = query.match(/updated:>(\S+)/);
  const updatedBefore = query.match(/updated:<(\S+)/);

  if (createdAfter || createdBefore) {
    filters.dateRange.created = {
      start: createdAfter ? new Date(createdAfter[1]) : undefined,
      end: createdBefore ? new Date(createdBefore[1]) : undefined
    };
  }

  if (updatedAfter || updatedBefore) {
    filters.dateRange.updated = {
      start: updatedAfter ? new Date(updatedAfter[1]) : undefined,
      end: updatedBefore ? new Date(updatedBefore[1]) : undefined
    };
  }

  return filters;
}

export function buildGitHubQuery(filters: FilterState): string {
  const parts: string[] = ['is:pr'];

  // Add authors
  filters.authors.forEach(author => {
    parts.push(`author:${author}`);
  });

  // Add reviewers
  filters.reviewers.forEach(reviewer => {
    parts.push(`reviewed-by:${reviewer}`);
  });

  // Add repositories
  filters.repositories.forEach(repo => {
    parts.push(`repo:${repo}`);
  });

  // Add labels
  filters.labels.forEach(label => {
    parts.push(`label:"${label}"`);
  });

  // Add state
  if (filters.state !== 'all') {
    parts.push(`is:${filters.state}`);
  }

  // Add draft status
  if (filters.isDraft === true) {
    parts.push('is:draft');
  } else if (filters.isDraft === false) {
    parts.push('-is:draft');
  }

  // Add date ranges
  if (filters.dateRange.created?.start) {
    parts.push(`created:>${formatDate(filters.dateRange.created.start)}`);
  }
  if (filters.dateRange.created?.end) {
    parts.push(`created:<${formatDate(filters.dateRange.created.end)}`);
  }
  if (filters.dateRange.updated?.start) {
    parts.push(`updated:>${formatDate(filters.dateRange.updated.start)}`);
  }
  if (filters.dateRange.updated?.end) {
    parts.push(`updated:<${formatDate(filters.dateRange.updated.end)}`);
  }

  return parts.join(' ');
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getQueryComplexity(query: string): 'simple' | 'moderate' | 'complex' {
  const parts = query.split(' ').length;
  const hasDateRanges = /created:|updated:/.test(query);
  const hasComplexOperators = /OR|AND|\(|\)/.test(query);

  if (hasComplexOperators || parts > 8) return 'complex';
  if (hasDateRanges || parts > 4) return 'moderate';
  return 'simple';
}
```

### 3. Enhanced QueryDisplay with Mode Toggle and HeroUI

**File**: `src/components/QueryDisplay/QueryDisplay.tsx` (updated)

```typescript
// Add to existing QueryDisplay component
import { VisualFilterBuilder } from './VisualFilterBuilder';
import { Switch, Divider } from '@heroui/react';

// Add to component state
const [editMode, setEditMode] = useState<'visual' | 'advanced'>('visual');

// Add mode toggle to the component header
<div className="flex items-center justify-between w-full">
  <div className="flex items-center gap-2">
    {statusContent.icon}
    <span className={`text-sm font-medium ${statusContent.textColor}`}>
      {statusContent.text}
    </span>
  </div>
  
  {editable && !isLoading && (
    <div className="flex items-center gap-4">
      {isEditing && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs text-default-500">Visual</span>
            <Switch
              size="sm"
              color="primary"
              isSelected={editMode === 'advanced'}
              onValueChange={(checked) => setEditMode(checked ? 'advanced' : 'visual')}
            />
            <span className="text-xs text-default-500">Advanced</span>
          </div>
          <Divider orientation="vertical" className="h-6" />
        </>
      )}
      
      {/* Existing edit buttons */}
    </div>
  )}
</div>

// Replace the editing content section
{isEditing ? (
  <div className="space-y-4">
    {editMode === 'visual' ? (
      <VisualFilterBuilder
        query={editValue}
        onQueryChange={setEditValue}
        isLoading={isLoading}
        suggestions={suggestions}
      />
    ) : (
      // Existing textarea implementation
      <div className="space-y-3">
        {/* Existing textarea code */}
      </div>
    )}
  </div>
) : (
  // Existing display code
)}
```

### 4. Suggestions Hook with Octokit

**File**: `src/hooks/useFilterSuggestions.ts`

```typescript
import { useState, useEffect } from 'react';
import { Octokit } from '@octokit/rest';
import { useAuth } from '../contexts/AuthContext';

export interface FilterSuggestions {
  users: string[];
  repositories: string[];
  labels: string[];
  loading: boolean;
  error: string | null;
}

export function useFilterSuggestions(): FilterSuggestions {
  const { token } = useAuth();
  const [suggestions, setSuggestions] = useState<FilterSuggestions>({
    users: [],
    repositories: [],
    labels: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    async function loadSuggestions() {
      if (!token) return;

      try {
        setSuggestions(prev => ({ ...prev, loading: true, error: null }));
        
        const octokit = new Octokit({ auth: token });

        // Load suggestions in parallel using Octokit
        const [users, repositories, labels] = await Promise.all([
          fetchUserSuggestions(octokit),
          fetchRepositorySuggestions(octokit),
          fetchLabelSuggestions(octokit)
        ]);

        setSuggestions({
          users,
          repositories,
          labels,
          loading: false,
          error: null
        });
      } catch (error) {
        setSuggestions(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load suggestions'
        }));
      }
    }

    loadSuggestions();
  }, [token]);

  return suggestions;
}

async function fetchUserSuggestions(octokit: Octokit): Promise<string[]> {
  try {
    // Fetch organization members and collaborators using Octokit
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const collaborators = await octokit.rest.users.listFollowersForAuthenticatedUser({
      per_page: 20
    });
    
    return ['@me', ...collaborators.data.map(user => user.login)];
  } catch (error) {
    console.warn('Failed to fetch user suggestions:', error);
    return ['@me'];
  }
}

async function fetchRepositorySuggestions(octokit: Octokit): Promise<string[]> {
  try {
    // Fetch user's repositories using Octokit
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
      per_page: 50,
      sort: 'updated',
      direction: 'desc'
    });
    
    return repos.map(repo => repo.full_name);
  } catch (error) {
    console.warn('Failed to fetch repository suggestions:', error);
    return [];
  }
}

async function fetchLabelSuggestions(octokit: Octokit): Promise<string[]> {
  // For now, return common labels
  // In future, could aggregate from user's repositories
  return [
    'bug',
    'enhancement',
    'documentation',
    'good first issue',
    'help wanted',
    'question',
    'wontfix',
    'duplicate',
    'invalid'
  ];
}
```

## Testing Requirements

### 1. Component Tests

**File**: `src/components/QueryDisplay/__tests__/VisualFilterBuilder.test.tsx`

```typescript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualFilterBuilder } from '../VisualFilterBuilder';

describe('VisualFilterBuilder', () => {
  const defaultProps = {
    query: 'is:pr author:john',
    onQueryChange: jest.fn(),
    suggestions: {
      users: ['john', 'jane', 'bob'],
      repositories: ['org/repo1', 'org/repo2'],
      labels: ['bug', 'enhancement']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should parse initial query into filter state', () => {
    render(<VisualFilterBuilder {...defaultProps} />);
    
    // Should show parsed author
    expect(screen.getByText('john')).toBeInTheDocument();
  });

  it('should add author when selected from autocomplete', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();
    
    render(
      <VisualFilterBuilder 
        {...defaultProps} 
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );
    
    // Click on author autocomplete and select user
    const authorInput = screen.getByPlaceholderText('Add author...');
    await user.click(authorInput);
    await user.click(screen.getByText('jane'));
    
    expect(onQueryChange).toHaveBeenCalledWith('is:pr author:jane');
  });

  it('should remove filter when chip is closed', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();
    
    render(
      <VisualFilterBuilder 
        {...defaultProps}
        onQueryChange={onQueryChange}
      />
    );
    
    // Find and click the close button on the john chip
    const closeButton = screen.getByRole('button', { name: /remove john/i });
    await user.click(closeButton);
    
    expect(onQueryChange).toHaveBeenCalledWith('is:pr');
  });

  it('should update state filter', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();
    
    render(
      <VisualFilterBuilder 
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );
    
    // Change state to open
    const stateSelect = screen.getByLabelText('Pull Request State');
    await user.click(stateSelect);
    await user.click(screen.getByText('Open'));
    
    expect(onQueryChange).toHaveBeenCalledWith('is:pr is:open');
  });
});
```

### 2. Utility Tests

**File**: `src/utils/__tests__/queryBuilder.test.ts`

```typescript
import { parseGitHubQuery, buildGitHubQuery } from '../queryBuilder';

describe('queryBuilder', () => {
  describe('parseGitHubQuery', () => {
    it('should parse complex query correctly', () => {
      const query = 'is:pr author:john reviewed-by:jane repo:org/repo label:"bug" is:open';
      const result = parseGitHubQuery(query);
      
      expect(result).toEqual({
        authors: ['john'],
        reviewers: ['jane'],
        repositories: ['org/repo'],
        labels: ['bug'],
        state: 'open',
        isDraft: null,
        dateRange: {},
        assignees: [],
        involves: []
      });
    });

    it('should handle date ranges', () => {
      const query = 'is:pr created:>2024-01-01 updated:<2024-12-31';
      const result = parseGitHubQuery(query);
      
      expect(result.dateRange.created?.start).toEqual(new Date('2024-01-01'));
      expect(result.dateRange.updated?.end).toEqual(new Date('2024-12-31'));
    });
  });

  describe('buildGitHubQuery', () => {
    it('should build query from filter state', () => {
      const filters = {
        authors: ['john'],
        reviewers: ['jane'],
        repositories: ['org/repo'],
        labels: ['bug'],
        state: 'open' as const,
        isDraft: false,
        dateRange: {},
        assignees: [],
        involves: []
      };
      
      const result = buildGitHubQuery(filters);
      
      expect(result).toBe('is:pr author:john reviewed-by:jane repo:org/repo label:"bug" is:open -is:draft');
    });
  });
});
```

## Implementation Steps

1. **Day 1-2**: Create VisualFilterBuilder component with basic filters
2. **Day 3**: Implement query builder utilities and parsing logic
3. **Day 4**: Add mode toggle to QueryDisplay component
4. **Day 5**: Implement suggestions hook and autocomplete functionality
5. **Day 6**: Write comprehensive tests and polish UX

## Acceptance Criteria

- [ ] Users can switch between visual and advanced query modes
- [ ] Visual filters generate correct GitHub search syntax
- [ ] Changes in visual mode update the text query and vice versa
- [ ] Autocomplete suggestions work for users, repositories, and labels
- [ ] Date pickers generate proper date range queries
- [ ] Filter chips can be added and removed easily
- [ ] Complex queries gracefully fall back to advanced mode
- [ ] All interactions are accessible and responsive

## Risk Mitigation

- **Query Synchronization**: Bidirectional parsing ensures consistency
- **Performance**: Debounced updates prevent excessive re-rendering
- **Complexity**: Complex queries automatically switch to advanced mode
- **User Experience**: Clear visual feedback for mode switches
- **API Limits**: Cached suggestions reduce API calls

## Future Preparation

This visual interface enables:

- Saved filter presets and templates
- Team-specific filter recommendations
- Query performance optimization suggestions
- Advanced filter combinations and operators

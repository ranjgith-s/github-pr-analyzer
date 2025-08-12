import React, { useEffect } from 'react';
import { Chip, Card, CardContent } from '../ui';
import { Select, SelectItem, Autocomplete, AutocompleteItem } from '../ui';
import {
  parseGitHubQuery,
  buildGitHubQuery,
  FilterState,
} from '../../utils/queryBuilder';

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
  suggestions = { users: [], repositories: [], labels: [] },
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
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const addStringArrayItem = (key: keyof FilterState, value: string) => {
    if (!value.trim()) return;

    setFilters((prev) => ({
      ...prev,
      [key]: [...(prev[key] as string[]), value.trim()],
    }));
  };

  const removeStringArrayItem = (key: keyof FilterState, index: number) => {
    setFilters((prev) => ({
      ...prev,
      [key]: (prev[key] as string[]).filter((_, i) => i !== index),
    }));
  };

  // Helper function to render filter chips
  const renderFilterChips = (
    items: string[],
    removeHandler: (index: number) => void,
    color:
      | 'primary'
      | 'secondary'
      | 'success'
      | 'warning'
      | 'default' = 'default'
  ) => (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, index) => (
        <Chip
          key={`${item}-${index}`}
          onClose={() => removeHandler(index)}
          variant="flat"
          color={color}
          size="sm"
          className="text-xs"
        >
          {item}
        </Chip>
      ))}
    </div>
  );

  // Helper function to render autocomplete with chips
  const renderAutocompleteSection = (
    label: string,
    placeholder: string,
    filterKey: keyof FilterState,
    suggestions: string[],
    chipColor:
      | 'primary'
      | 'secondary'
      | 'success'
      | 'warning'
      | 'default' = 'default',
    testId?: string
  ) => (
    <div className="space-y-2">
      <label className="text-xs font-medium text-default-600">{label}</label>
      <Autocomplete
        placeholder={placeholder}
        variant="bordered"
        size="sm"
        onSelect={(value) => {
          if (value) addStringArrayItem(filterKey, value.toString());
        }}
        disabled={isLoading}
        className="w-full"
        classNames={{
          base: 'min-h-[36px]',
          listbox: 'text-sm',
        }}
        data-testid={testId}
      >
        {suggestions.map((item) => (
          <AutocompleteItem key={item} value={item}>
            {item}
          </AutocompleteItem>
        ))}
      </Autocomplete>
      {(filters[filterKey] as string[]).length > 0 && (
        <div className="mt-2">
          {renderFilterChips(
            filters[filterKey] as string[],
            (index) => removeStringArrayItem(filterKey, index),
            chipColor
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Applied Filters Summary */}
      {(filters.authors.length > 0 ||
        filters.reviewers.length > 0 ||
        filters.assignees.length > 0 ||
        filters.involves.length > 0 ||
        filters.repositories.length > 0 ||
        filters.labels.length > 0 ||
        filters.state !== 'all' ||
        filters.isDraft !== null ||
        filters.dateRange.created?.start ||
        filters.dateRange.created?.end ||
        filters.dateRange.updated?.start ||
        filters.dateRange.updated?.end) && (
        <div className="bg-default-50 border border-default-200 rounded-xl p-3">
          <h3 className="text-xs font-semibold text-default-700 mb-2">
            Active Filters
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {filters.authors.map((author, index) => (
              <Chip
                key={`active-author-${index}`}
                onClose={() => removeStringArrayItem('authors', index)}
                variant="flat"
                color="primary"
                size="sm"
                className="text-xs"
              >
                Author: {author}
              </Chip>
            ))}
            {filters.reviewers.map((reviewer, index) => (
              <Chip
                key={`active-reviewer-${index}`}
                onClose={() => removeStringArrayItem('reviewers', index)}
                variant="flat"
                color="secondary"
                size="sm"
                className="text-xs"
              >
                Reviewer: {reviewer}
              </Chip>
            ))}
            {filters.repositories.map((repo, index) => (
              <Chip
                key={`active-repo-${index}`}
                onClose={() => removeStringArrayItem('repositories', index)}
                variant="flat"
                color="success"
                size="sm"
                className="text-xs"
              >
                Repo: {repo}
              </Chip>
            ))}
            {filters.state !== 'all' && (
              <Chip
                onClose={() => updateFilter('state', 'all')}
                variant="flat"
                color="default"
                size="sm"
                className="text-xs"
              >
                State: {filters.state}
              </Chip>
            )}
            {filters.isDraft !== null && (
              <Chip
                onClose={() => updateFilter('isDraft', null)}
                variant="flat"
                color="default"
                size="sm"
                className="text-xs"
              >
                Draft: {filters.isDraft ? 'Yes' : 'No'}
              </Chip>
            )}
          </div>
        </div>
      )}

      {/* Main Filter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* People Filters Group */}
        <Card className="border border-default-200">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-default-700 border-b border-default-200 pb-2">
              👥 People Filters
            </h3>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                {renderAutocompleteSection(
                  'Authors',
                  'Add author...',
                  'authors',
                  suggestions.users,
                  'primary'
                )}
              </div>

              <div>
                {renderAutocompleteSection(
                  'Reviewers',
                  'Add reviewer...',
                  'reviewers',
                  suggestions.users,
                  'secondary'
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div>
                {renderAutocompleteSection(
                  'Assignees',
                  'Add assignee...',
                  'assignees',
                  suggestions.users,
                  'default'
                )}
              </div>

              <div>
                {renderAutocompleteSection(
                  'Involves',
                  'Add user...',
                  'involves',
                  suggestions.users,
                  'primary',
                  'involves-autocomplete'
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Repository & Content Group */}
        <Card className="border border-default-200">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-default-700 border-b border-default-200 pb-2">
              📂 Repository & Content
            </h3>

            <div>
              {renderAutocompleteSection(
                'Repositories',
                'Add repository (owner/repo)...',
                'repositories',
                suggestions.repositories,
                'success'
              )}
            </div>

            <div>
              {renderAutocompleteSection(
                'Labels',
                'Add label...',
                'labels',
                suggestions.labels,
                'warning'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status & Dates Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Status Group */}
        <Card className="border border-default-200">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-default-700 border-b border-default-200 pb-2">
              🏷️ Status & State
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select
                label="Pull Request State"
                placeholder="Select state"
                variant="bordered"
                size="sm"
                selectedKey={filters.state}
                onChange={(value) => {
                  updateFilter('state', value as FilterState['state']);
                }}
                disabled={isLoading}
                classNames={{
                  trigger: 'min-h-[36px] h-9',
                  label: 'text-xs',
                  value: 'text-sm',
                }}
              >
                <SelectItem value="all">All States</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="merged">Merged</SelectItem>
              </Select>

              <Select
                label="Draft Status"
                placeholder="Select draft status"
                variant="bordered"
                size="sm"
                selectedKey={
                  filters.isDraft === null
                    ? 'all'
                    : filters.isDraft
                      ? 'true'
                      : 'false'
                }
                onChange={(value) => {
                  updateFilter(
                    'isDraft',
                    value === 'true' ? true : value === 'false' ? false : null
                  );
                }}
                disabled={isLoading}
                classNames={{
                  trigger: 'min-h-[36px] h-9',
                  label: 'text-xs',
                  value: 'text-sm',
                }}
              >
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="false">Ready for Review</SelectItem>
                <SelectItem value="true">Draft</SelectItem>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Date Ranges Group */}
        <Card className="border border-default-200">
          <CardContent className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-default-700 border-b border-default-200 pb-2">
              📅 Date Ranges
            </h3>

            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-medium text-default-600 mb-2">
                  Created Date
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-default-500">From</label>
                    <input
                      type="date"
                      value={
                        filters.dateRange.created?.start
                          ? formatDateForInput(filters.dateRange.created.start)
                          : ''
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        updateFilter('dateRange', {
                          ...filters.dateRange,
                          created: {
                            ...filters.dateRange.created,
                            start: date,
                          },
                        });
                      }}
                      disabled={isLoading}
                      className="w-full px-2 py-1.5 border border-default-300 rounded-lg text-xs bg-default-50 focus:bg-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-default-500">To</label>
                    <input
                      type="date"
                      value={
                        filters.dateRange.created?.end
                          ? formatDateForInput(filters.dateRange.created.end)
                          : ''
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        updateFilter('dateRange', {
                          ...filters.dateRange,
                          created: {
                            ...filters.dateRange.created,
                            end: date,
                          },
                        });
                      }}
                      disabled={isLoading}
                      className="w-full px-2 py-1.5 border border-default-300 rounded-lg text-xs bg-default-50 focus:bg-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-default-600 mb-2">
                  Updated Date
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-xs text-default-500">From</label>
                    <input
                      type="date"
                      value={
                        filters.dateRange.updated?.start
                          ? formatDateForInput(filters.dateRange.updated.start)
                          : ''
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        updateFilter('dateRange', {
                          ...filters.dateRange,
                          updated: {
                            ...filters.dateRange.updated,
                            start: date,
                          },
                        });
                      }}
                      disabled={isLoading}
                      className="w-full px-2 py-1.5 border border-default-300 rounded-lg text-xs bg-default-50 focus:bg-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-default-500">To</label>
                    <input
                      type="date"
                      value={
                        filters.dateRange.updated?.end
                          ? formatDateForInput(filters.dateRange.updated.end)
                          : ''
                      }
                      onChange={(e) => {
                        const date = e.target.value
                          ? new Date(e.target.value)
                          : undefined;
                        updateFilter('dateRange', {
                          ...filters.dateRange,
                          updated: {
                            ...filters.dateRange.updated,
                            end: date,
                          },
                        });
                      }}
                      disabled={isLoading}
                      className="w-full px-2 py-1.5 border border-default-300 rounded-lg text-xs bg-default-50 focus:bg-white focus:border-primary-500 focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to format date for input
function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

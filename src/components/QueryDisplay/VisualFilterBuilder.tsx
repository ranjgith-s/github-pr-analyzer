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
  const [showAllFilters, setShowAllFilters] = React.useState(false);
  const [initialVisibleCount, setInitialVisibleCount] = React.useState(3);
  // Local state to keep track of preset selections for date ranges
  const [createdPreset, setCreatedPreset] = React.useState<
    | 'none'
    | 'last_30_days'
    | 'last_2_months'
    | 'last_quarter'
    | 'last_6_months'
    | 'last_year'
  >('none');
  const [updatedPreset, setUpdatedPreset] = React.useState<
    | 'none'
    | 'last_30_days'
    | 'last_2_months'
    | 'last_quarter'
    | 'last_6_months'
    | 'last_year'
  >('none');

  // Update filters when query changes externally
  useEffect(() => {
    const parsed = parseGitHubQuery(query);
    setFilters(parsed);
    // When query changes externally, we cannot reliably infer presets from arbitrary dates.
    // Keep presets as 'none' unless no dates are set.
    if (!parsed.dateRange.created?.start) {
      setCreatedPreset('none');
    }
    if (!parsed.dateRange.updated?.start) {
      setUpdatedPreset('none');
    }
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

  // Determine initial visible filters based on viewport (1/2/3 per row)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const isLg = window.matchMedia('(min-width: 1024px)').matches;
    const isSm = window.matchMedia('(min-width: 640px)').matches;
    setInitialVisibleCount(isLg ? 3 : isSm ? 2 : 1);
  }, []);

  // Date preset utilities
  type DatePreset =
    | 'none'
    | 'last_30_days'
    | 'last_2_months'
    | 'last_quarter'
    | 'last_6_months'
    | 'last_year';

  const computePresetStart = (preset: DatePreset): Date | undefined => {
    const now = new Date();
    const d = new Date(now);
    switch (preset) {
      case 'last_30_days':
        d.setDate(d.getDate() - 30);
        return d;
      case 'last_2_months':
        d.setMonth(d.getMonth() - 2);
        return d;
      case 'last_quarter':
        d.setMonth(d.getMonth() - 3);
        return d;
      case 'last_6_months':
        d.setMonth(d.getMonth() - 6);
        return d;
      case 'last_year':
        d.setFullYear(d.getFullYear() - 1);
        return d;
      case 'none':
      default:
        return undefined;
    }
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
        <div className="bg-default-50 border border-default-200 rounded-lg p-3">
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
      {/* Filters grid header with Show more toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-default-700">Filters</h3>
        <button
          type="button"
          className="text-xs text-primary-600 hover:text-primary-700 disabled:opacity-50"
          onClick={() => setShowAllFilters((v) => !v)}
          aria-label="toggle-more-filters"
        >
          {showAllFilters ? 'Show less' : 'Show more filters'}
        </button>
      </div>

      {/* Individual Filters Grid: responsive with max 3 per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          <Card key="authors" className="border border-default-200">
            <CardContent className="p-4">
              {renderAutocompleteSection(
                'Authors',
                'Add author...',
                'authors',
                suggestions.users,
                'primary'
              )}
            </CardContent>
          </Card>,
          <Card key="reviewers" className="border border-default-200">
            <CardContent className="p-4">
              {renderAutocompleteSection(
                'Reviewers',
                'Add reviewer...',
                'reviewers',
                suggestions.users,
                'secondary'
              )}
            </CardContent>
          </Card>,
          <Card key="assignees" className="border border-default-200">
            <CardContent className="p-4">
              {renderAutocompleteSection(
                'Assignees',
                'Add assignee...',
                'assignees',
                suggestions.users,
                'default'
              )}
            </CardContent>
          </Card>,
          <Card key="involves" className="border border-default-200">
            <CardContent className="p-4">
              {renderAutocompleteSection(
                'Involves',
                'Add user...',
                'involves',
                suggestions.users,
                'primary',
                'involves-autocomplete'
              )}
            </CardContent>
          </Card>,
          <Card key="repositories" className="border border-default-200">
            <CardContent className="p-4">
              {renderAutocompleteSection(
                'Repositories',
                'Add repository (owner/repo)...',
                'repositories',
                suggestions.repositories,
                'success'
              )}
            </CardContent>
          </Card>,
          <Card key="labels" className="border border-default-200">
            <CardContent className="p-4">
              {renderAutocompleteSection(
                'Labels',
                'Add label...',
                'labels',
                suggestions.labels,
                'warning'
              )}
            </CardContent>
          </Card>,
          <Card key="state" className="border border-default-200">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-medium text-default-600">
                Pull Request State
              </label>
              <Select
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
            </CardContent>
          </Card>,
          <Card key="draft" className="border border-default-200">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-medium text-default-600">
                Draft Status
              </label>
              <Select
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
            </CardContent>
          </Card>,
          <Card key="created" className="border border-default-200">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-medium text-default-600">
                Created: Preset
              </label>
              <Select
                placeholder="Select range"
                variant="bordered"
                size="sm"
                selectedKey={createdPreset}
                onChange={(value) => {
                  const preset = (value as DatePreset) || 'none';
                  const start = computePresetStart(preset);
                  setCreatedPreset(preset);
                  updateFilter('dateRange', {
                    ...filters.dateRange,
                    created: start
                      ? { start }
                      : { start: undefined, end: undefined },
                  });
                }}
                disabled={isLoading}
                classNames={{
                  trigger: 'min-h-[36px] h-9',
                  label: 'text-xs',
                  value: 'text-sm',
                }}
              >
                <SelectItem value="none">All time</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="last_2_months">Last 2 months</SelectItem>
                <SelectItem value="last_quarter">Last quarter</SelectItem>
                <SelectItem value="last_6_months">Last 6 months</SelectItem>
                <SelectItem value="last_year">Last year</SelectItem>
              </Select>
            </CardContent>
          </Card>,
          <Card key="updated" className="border border-default-200">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-medium text-default-600">
                Updated: Preset
              </label>
              <Select
                placeholder="Select range"
                variant="bordered"
                size="sm"
                selectedKey={updatedPreset}
                onChange={(value) => {
                  const preset = (value as DatePreset) || 'none';
                  const start = computePresetStart(preset);
                  setUpdatedPreset(preset);
                  updateFilter('dateRange', {
                    ...filters.dateRange,
                    updated: start
                      ? { start }
                      : { start: undefined, end: undefined },
                  });
                }}
                disabled={isLoading}
                classNames={{
                  trigger: 'min-h-[36px] h-9',
                  label: 'text-xs',
                  value: 'text-sm',
                }}
              >
                <SelectItem value="none">All time</SelectItem>
                <SelectItem value="last_30_days">Last 30 days</SelectItem>
                <SelectItem value="last_2_months">Last 2 months</SelectItem>
                <SelectItem value="last_quarter">Last quarter</SelectItem>
                <SelectItem value="last_6_months">Last 6 months</SelectItem>
                <SelectItem value="last_year">Last year</SelectItem>
              </Select>
            </CardContent>
          </Card>,
        ]
          .filter((_, idx) => showAllFilters || idx < initialVisibleCount)
          .map((node) => node)}
      </div>
    </div>
  );
}

// (date input formatting helper removed: presets are used instead)

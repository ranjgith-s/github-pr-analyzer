import React, { useEffect } from 'react';
import { Chip, Card, CardContent } from '../ui';
import { ActiveFiltersSummary } from './ActiveFiltersSummary';
import { Select, SelectItem, Autocomplete, AutocompleteItem } from '../ui';
import {
  parseGitHubQuery,
  buildGitHubQuery,
  FilterState,
} from '../../utils/queryBuilder';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { searchUsers } from '../../utils/services/githubService';
import { useDebounce } from '../../hooks/useDebounce';

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
  const { token } = useAuth();
  const [filters, setFilters] = React.useState<FilterState>(() =>
    parseGitHubQuery(query)
  );
  // Sidebar layout: always render all filters in a single column
  // Dynamic user suggestion inputs and results
  const [authorInput, setAuthorInput] = React.useState('');
  const [reviewerInput, setReviewerInput] = React.useState('');
  const [assigneeInput, setAssigneeInput] = React.useState('');
  const [involvesInput, setInvolvesInput] = React.useState('');
  const [authorOptions, setAuthorOptions] = React.useState<string[]>([]);
  const [reviewerOptions, setReviewerOptions] = React.useState<string[]>([]);
  const [assigneeOptions, setAssigneeOptions] = React.useState<string[]>([]);
  const [involvesOptions, setInvolvesOptions] = React.useState<string[]>([]);
  const debouncedAuthor = useDebounce(authorInput, 200);
  const debouncedReviewer = useDebounce(reviewerInput, 200);
  const debouncedAssignee = useDebounce(assigneeInput, 200);
  const debouncedInvolves = useDebounce(involvesInput, 200);
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

  // Removed responsive initial visible count; sidebar shows all filters

  // Utility to ensure '@me' is available at top and no duplicates
  const addMe = (list: string[]) => {
    const dedup = Array.from(new Set(list));
    return dedup.includes('@me') ? dedup : ['@me', ...dedup];
  };

  // Fetch dynamic user suggestions per field
  useEffect(() => {
    if (!token) return;
    let cancel = false;
    async function load() {
      if (!debouncedAuthor) {
        setAuthorOptions([]);
        return;
      }
      try {
        const res = await searchUsers(token!, debouncedAuthor);
        if (!cancel) setAuthorOptions(addMe(res.map((u: any) => u.login)));
      } catch {
        if (!cancel) setAuthorOptions([]);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [debouncedAuthor, token]);

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    async function load() {
      if (!debouncedReviewer) {
        setReviewerOptions([]);
        return;
      }
      try {
        const res = await searchUsers(token!, debouncedReviewer);
        if (!cancel) setReviewerOptions(addMe(res.map((u: any) => u.login)));
      } catch {
        if (!cancel) setReviewerOptions([]);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [debouncedReviewer, token]);

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    async function load() {
      if (!debouncedAssignee) {
        setAssigneeOptions([]);
        return;
      }
      try {
        const res = await searchUsers(token!, debouncedAssignee);
        if (!cancel) setAssigneeOptions(addMe(res.map((u: any) => u.login)));
      } catch {
        if (!cancel) setAssigneeOptions([]);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [debouncedAssignee, token]);

  useEffect(() => {
    if (!token) return;
    let cancel = false;
    async function load() {
      if (!debouncedInvolves) {
        setInvolvesOptions([]);
        return;
      }
      try {
        const res = await searchUsers(token!, debouncedInvolves);
        if (!cancel) setInvolvesOptions(addMe(res.map((u: any) => u.login)));
      } catch {
        if (!cancel) setInvolvesOptions([]);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [debouncedInvolves, token]);

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

  // Helpers to clear date bounds from filters.dateRange
  const clearCreatedStart = () => {
    const created = filters.dateRange.created || {};
    const next = { ...created, start: undefined };
    updateFilter('dateRange', {
      ...filters.dateRange,
      created: next.start || next.end ? next : undefined,
    });
  };

  const clearCreatedEnd = () => {
    const created = filters.dateRange.created || {};
    const next = { ...created, end: undefined };
    updateFilter('dateRange', {
      ...filters.dateRange,
      created: next.start || next.end ? next : undefined,
    });
  };

  const clearUpdatedStart = () => {
    const updated = filters.dateRange.updated || {};
    const next = { ...updated, start: undefined };
    updateFilter('dateRange', {
      ...filters.dateRange,
      updated: next.start || next.end ? next : undefined,
    });
  };

  const clearUpdatedEnd = () => {
    const updated = filters.dateRange.updated || {};
    const next = { ...updated, end: undefined };
    updateFilter('dateRange', {
      ...filters.dateRange,
      updated: next.start || next.end ? next : undefined,
    });
  };

  // date formatting is handled inside the ActiveFiltersSummary

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
    testId?: string,
    onInputChange?: (value: string) => void
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
        onInputChange={onInputChange}
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
      <ActiveFiltersSummary
        filters={filters}
        onRemoveAuthor={(i) => removeStringArrayItem('authors', i)}
        onRemoveReviewer={(i) => removeStringArrayItem('reviewers', i)}
        onRemoveAssignee={(i) => removeStringArrayItem('assignees', i)}
        onRemoveInvolves={(i) => removeStringArrayItem('involves', i)}
        onRemoveRepository={(i) => removeStringArrayItem('repositories', i)}
        onRemoveLabel={(i) => removeStringArrayItem('labels', i)}
        onResetState={() => updateFilter('state', 'all')}
        onResetDraft={() => updateFilter('isDraft', null)}
        onClearCreatedStart={clearCreatedStart}
        onClearCreatedEnd={clearCreatedEnd}
        onClearUpdatedStart={clearUpdatedStart}
        onClearUpdatedEnd={clearUpdatedEnd}
        onClearAll={() => {
          setFilters({
            authors: [],
            reviewers: [],
            repositories: [],
            labels: [],
            state: 'all',
            isDraft: null,
            dateRange: {},
            assignees: [],
            involves: [],
          });
        }}
      />
      {/* Filters header (no show more/less in sidebar) */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-default-700">Filters</h3>
      </div>

      {/* Quick presets for world-class UX */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-xs hover:bg-accent"
          onClick={() =>
            updateFilter(
              'authors',
              Array.from(new Set(['@me', ...filters.authors]))
            )
          }
        >
          Authored by me
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-xs hover:bg-accent"
          onClick={() =>
            updateFilter(
              'reviewers',
              Array.from(new Set(['@me', ...(filters.reviewers || [])]))
            )
          }
        >
          Reviewed by me
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-xs hover:bg-accent"
          onClick={() => updateFilter('state', 'open')}
        >
          Open PRs
        </button>
        <button
          type="button"
          className="rounded-md border px-3 py-2 text-xs hover:bg-accent"
          onClick={() => updateFilter('isDraft', true)}
        >
          Drafts
        </button>
      </div>

      {/* Individual Filters: single-column list for sidebar */}
      <div className="grid grid-cols-1 gap-4">
        {[
          <Card key="authors" className="border border-default-200">
            <CardContent>
              {renderAutocompleteSection(
                'Authors',
                'Add author...',
                'authors',
                authorInput && authorOptions.length > 0
                  ? authorOptions
                  : suggestions.users,
                'primary',
                undefined,
                setAuthorInput
              )}
            </CardContent>
          </Card>,
          <Card key="reviewers" className="border border-default-200">
            <CardContent>
              {renderAutocompleteSection(
                'Reviewers',
                'Add reviewer...',
                'reviewers',
                reviewerInput && reviewerOptions.length > 0
                  ? reviewerOptions
                  : suggestions.users,
                'secondary',
                undefined,
                setReviewerInput
              )}
            </CardContent>
          </Card>,
          <Card key="assignees" className="border border-default-200">
            <CardContent>
              {renderAutocompleteSection(
                'Assignees',
                'Add assignee...',
                'assignees',
                assigneeInput && assigneeOptions.length > 0
                  ? assigneeOptions
                  : suggestions.users,
                'default',
                undefined,
                setAssigneeInput
              )}
            </CardContent>
          </Card>,
          <Card key="involves" className="border border-default-200">
            <CardContent>
              {renderAutocompleteSection(
                'Involves',
                'Add user...',
                'involves',
                involvesInput && involvesOptions.length > 0
                  ? involvesOptions
                  : suggestions.users,
                'primary',
                'involves-autocomplete',
                setInvolvesInput
              )}
            </CardContent>
          </Card>,
          <Card key="repositories" className="border border-default-200">
            <CardContent>
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
            <CardContent>
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
        ].map((node) => node)}
      </div>
    </div>
  );
}

// (date input formatting helper removed: presets are used instead)

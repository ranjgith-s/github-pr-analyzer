import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Spinner } from '../ui';
import { Switch } from '../ui';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
} from '../ui';
import {
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  PencilIcon,
  ShareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { validateQuery } from '../../services/queryValidator';
import { getDefaultQuery } from '../../utils/queryUtils';
import { VisualFilterBuilder } from './VisualFilterBuilder';
import { ActiveFiltersSummary } from './ActiveFiltersSummary';
import {
  parseGitHubQuery,
  buildGitHubQuery,
  FilterState,
} from '../../utils/queryBuilder';
import { useFilterSuggestions } from '../../hooks/useFilterSuggestions';
import { ShareQueryModal } from './ShareQueryModal';
import { useQueryHistory } from '../../hooks/useQueryHistory';
import { featureFlags } from '@/feature-flags';
import { Textarea } from '../ui';
import { useAuth } from '@/contexts/AuthContext/AuthContext';
import {
  SuggestionService,
  type AutocompleteSuggestion,
} from '@/services/suggestionService';
import { QueryAutocomplete } from './QueryAutocomplete';

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
  editable = true,
}: QueryDisplayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(query);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [validationResult, setValidationResult] = useState(
    validateQuery(query)
  );
  const [, setSearchParams] = useSearchParams();
  const suggestions = useFilterSuggestions();
  const { token } = useAuth();

  const [showShareModal, setShowShareModal] = useState(false);
  const { addToHistory, addBookmark } = useQueryHistory();
  const [useVisual, setUseVisual] = useState(true);
  const [autoSuggestions, setAutoSuggestions] = useState<
    AutocompleteSuggestion[]
  >([]);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [caretPos, setCaretPos] = useState(0);
  const [hasTyped, setHasTyped] = useState(false);

  // Sync edit value when external query changes and not editing
  useEffect(() => {
    if (!isEditing) {
      setEditValue(query);
    }
  }, [query, isEditing]);

  // Validate in real-time while editing
  useEffect(() => {
    if (isEditing) {
      setValidationResult(validateQuery(editValue));
    }
  }, [editValue, isEditing]);

  // Fetch autocomplete suggestions when typing in advanced mode
  useEffect(() => {
    let active = true;
    async function run() {
      if (!isEditing || useVisual || !token || !hasTyped) {
        if (active) {
          setAutoSuggestions([]);
          setShowAutocomplete(false);
        }
        return;
      }
      try {
        const list = await SuggestionService.getSuggestions({
          query: editValue,
          cursorPosition: caretPos,
          token,
        });
        if (!active) return;
        setAutoSuggestions(list);
        setShowAutocomplete(list.length > 0);
      } catch (err) {
        console.error(err);
        if (active) {
          setAutoSuggestions([]);
          setShowAutocomplete(false);
        }
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [editValue, caretPos, isEditing, useVisual, token, hasTyped]);

  // Close edit mode when the sidebar closes (overlay click or external trigger)
  useEffect(() => {
    if (!isFilterSidebarOpen && isEditing) {
      setIsEditing(false);
      setEditValue(query);
      setValidationResult(validateQuery(query));
    }
  }, [isFilterSidebarOpen, isEditing, query]);

  const handleEditStart = () => {
    setIsEditing(true);
    setEditValue(query);
    setIsFilterSidebarOpen(true);
    setHasTyped(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditValue(query);
    setValidationResult(validateQuery(query));
    setIsFilterSidebarOpen(false);
    setHasTyped(false);
  };

  const handleEditSave = () => {
    if (validationResult.isValid) {
      const sanitizedQuery = validationResult.sanitized;

      // Update URL parameters
      const newParams = new URLSearchParams();
      if (sanitizedQuery !== getDefaultQuery({ login: '@me' })) {
        newParams.set('q', sanitizedQuery);
      }
      setSearchParams(newParams);

      // Add to query history
      addToHistory(sanitizedQuery);

      // Notify parent component
      onQueryChange?.(sanitizedQuery);

      setIsEditing(false);
      setIsFilterSidebarOpen(false);
    }
  };

  const handleBookmarkQuery = () => {
    if (validationResult.isValid) {
      addBookmark(validationResult.sanitized);
    }
  };

  const getStatusContent = () => {
    if (error) {
      return {
        icon: <ExclamationCircleIcon className="h-4 w-4 text-danger" />,
        text: `Error: ${error}`,
        textColor: 'text-danger',
      };
    }

    if (isLoading) {
      return {
        icon: <Spinner size="sm" color="primary" />,
        text: 'Loading results...',
        textColor: 'text-default-500',
      };
    }

    if (typeof resultCount === 'number') {
      return {
        icon: <MagnifyingGlassIcon className="h-4 w-4 text-success" />,
        text: `${resultCount} result${resultCount !== 1 ? 's' : ''}`,
        textColor: 'text-success',
      };
    }

    return {
      icon: <MagnifyingGlassIcon className="h-4 w-4 text-default-400" />,
      text: 'Ready to search',
      textColor: 'text-default-400',
    };
  };

  const statusContent = getStatusContent();

  // Derive current filters from the query string
  const filters = React.useMemo<FilterState>(
    () => parseGitHubQuery(query),
    [query]
  );

  // Helper to emit an updated query built from a new filter state
  const emitFilters = (next: FilterState) => {
    const nextQuery = buildGitHubQuery(next);
    onQueryChange?.(nextQuery);
  };

  // Chip handlers to remove or reset specific filters
  const removeFrom = (key: keyof FilterState, index: number) => {
    const arr = (filters[key] as string[]) || [];
    const nextArr = arr.filter((_, i) => i !== index);
    emitFilters({ ...filters, [key]: nextArr } as FilterState);
  };

  const resetState = () => emitFilters({ ...filters, state: 'all' });
  const resetDraft = () => emitFilters({ ...filters, isDraft: null });

  const clearCreatedStart = () => {
    const created = filters.dateRange.created || {};
    const next = { ...created, start: undefined };
    emitFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        created: next.start || next.end ? next : undefined,
      },
    });
  };
  const clearCreatedEnd = () => {
    const created = filters.dateRange.created || {};
    const next = { ...created, end: undefined };
    emitFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        created: next.start || next.end ? next : undefined,
      },
    });
  };
  const clearUpdatedStart = () => {
    const updated = filters.dateRange.updated || {};
    const next = { ...updated, start: undefined };
    emitFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        updated: next.start || next.end ? next : undefined,
      },
    });
  };
  const clearUpdatedEnd = () => {
    const updated = filters.dateRange.updated || {};
    const next = { ...updated, end: undefined };
    emitFilters({
      ...filters,
      dateRange: {
        ...filters.dateRange,
        updated: next.start || next.end ? next : undefined,
      },
    });
  };

  const clearAllActiveFilters = () => {
    emitFilters({
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
  };

  // Keyboard shortcuts while editing: Cmd/Ctrl+Enter to apply, Esc to cancel
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleEditSave();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleEditCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, editValue, validationResult]);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between gap-3 p-2">
        <ActiveFiltersSummary
          filters={filters}
          hideClearAll
          onRemoveAuthor={(i) => removeFrom('authors', i)}
          onRemoveReviewer={(i) => removeFrom('reviewers', i)}
          onRemoveAssignee={(i) => removeFrom('assignees', i)}
          onRemoveInvolves={(i) => removeFrom('involves', i)}
          onRemoveRepository={(i) => removeFrom('repositories', i)}
          onRemoveLabel={(i) => removeFrom('labels', i)}
          onResetState={resetState}
          onResetDraft={resetDraft}
          onClearCreatedStart={clearCreatedStart}
          onClearCreatedEnd={clearCreatedEnd}
          onClearUpdatedStart={clearUpdatedStart}
          onClearUpdatedEnd={clearUpdatedEnd}
          onClearAll={clearAllActiveFilters}
        />
        {editable && !isLoading && !isEditing && (
          <Button
            size="sm"
            color="primary"
            variant="ghost"
            startContent={<PencilIcon className="h-4 w-4" />}
            onClick={handleEditStart}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between pb-2 px-2">
        <div className="flex min-w-0 items-center gap-2">
          {statusContent.icon}
          <span className={`font-normal text-sm ${statusContent.textColor}`}>
            {statusContent.text}
          </span>
          <a
            href="https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests"
            target="_blank"
            rel="noreferrer"
            className="ml-2 text-xs underline text-default-400 hover:text-default-600"
          >
            Learn more
          </a>
        </div>
        {editable && !isLoading && !isEditing && (
          <div className="flex items-center gap-2">
            {featureFlags.share && (
              <Button
                size="sm"
                color="default"
                variant="ghost"
                startContent={<ShareIcon className="h-4 w-4" />}
                onClick={() => setShowShareModal(true)}
              >
                Share
              </Button>
            )}
            {featureFlags.bookmark && (
              <Button
                size="sm"
                color="default"
                variant="ghost"
                startContent={<BookmarkIcon className="h-4 w-4" />}
                onClick={handleBookmarkQuery}
              >
                Bookmark
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Accessible query preview for integration tests and screen readers */}
      <code
        aria-label="Current search query"
        role="code"
        tabIndex={0}
        className="sr-only"
      >
        {query}
      </code>

      {/* Right-side slide-in for Visual Filter Builder */}
      {isEditing && (
        <SidebarProvider
          open={isFilterSidebarOpen}
          onOpenChange={(open) => {
            // Guard against accidental close if there are unsaved changes
            if (!open && isEditing && editValue !== query) {
              const ok = window.confirm('Discard changes to filters?');
              if (!ok) {
                setIsFilterSidebarOpen(true);
                return;
              }
            }
            setIsFilterSidebarOpen(open);
          }}
          style={{ ['--sidebar-width' as any]: '33vw' }}
        >
          <Sidebar side="right" collapsible="offcanvas">
            <SidebarHeader>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Edit Query</div>
                  <div className="text-xs text-default-500">
                    Press Cmd+Enter to apply, Escape to cancel
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="visual-mode"
                    className="text-xs flex items-center gap-2"
                  >
                    <span>Visual mode</span>
                    <Switch
                      id="visual-mode"
                      checked={useVisual}
                      onCheckedChange={setUseVisual}
                    />
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="default"
                    onClick={() => setIsFilterSidebarOpen(false)}
                    aria-label="Close editor"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </SidebarHeader>
            <SidebarContent className="space-y-4">
              {useVisual ? (
                <VisualFilterBuilder
                  query={editValue}
                  onQueryChange={setEditValue}
                  isLoading={isLoading}
                  suggestions={suggestions}
                />
              ) : (
                <div className="space-y-2">
                  <label
                    className="text-xs font-medium text-default-600"
                    htmlFor="adv-editor"
                  >
                    Edit search query
                  </label>
                  <Textarea
                    id="adv-editor"
                    aria-label="Edit search query"
                    value={editValue}
                    onChange={(e) => {
                      setEditValue(e.target.value);
                      setHasTyped(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        if (showAutocomplete) setShowAutocomplete(false);
                        else handleEditCancel();
                      }
                    }}
                    onClick={(e) =>
                      setCaretPos(
                        (e.target as HTMLTextAreaElement).selectionStart || 0
                      )
                    }
                    onKeyUp={(e) =>
                      setCaretPos(
                        (e.target as HTMLTextAreaElement).selectionStart || 0
                      )
                    }
                    className="min-h-[90px]"
                  />
                  <div className="text-[10px] text-default-500">
                    {editValue.length}/256
                  </div>
                  {/* Validation feedback */}
                  {validationResult.errors.length > 0 && (
                    <div className="text-xs text-danger space-y-1">
                      {validationResult.errors.map((err, i) => (
                        <div key={`err-${i}`}>{err}</div>
                      ))}
                    </div>
                  )}
                  {validationResult.warnings.length > 0 && (
                    <div className="text-xs text-warning-foreground space-y-1">
                      {validationResult.warnings.map((w, i) => (
                        <div key={`warn-${i}`}>{w}</div>
                      ))}
                    </div>
                  )}
                  <QueryAutocomplete
                    query={editValue}
                    isVisible={showAutocomplete}
                    position={caretPos}
                    suggestions={autoSuggestions}
                    onClose={() => setShowAutocomplete(false)}
                    onSuggestionSelect={(sugg) => {
                      const insert = sugg.insertText || sugg.value;
                      const before = editValue.slice(0, caretPos);
                      const after = editValue.slice(caretPos);
                      const next = `${before}${insert}${after}`.trim();
                      setEditValue(next);
                      setShowAutocomplete(false);
                    }}
                  />
                </div>
              )}
            </SidebarContent>
            <SidebarFooter>
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  color="warning"
                  onClick={() => setEditValue('is:pr')}
                  aria-label="Reset all filters"
                >
                  Reset all
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  color="default"
                  onClick={handleEditCancel}
                  aria-label="Cancel editing"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleEditSave}
                  isDisabled={!validationResult.isValid}
                  aria-label="Apply filters"
                  title={
                    validationResult.isValid
                      ? 'Apply filters (Cmd/Ctrl+Enter)'
                      : 'Fix validation errors to apply'
                  }
                >
                  Apply
                </Button>
              </div>
            </SidebarFooter>
          </Sidebar>
        </SidebarProvider>
      )}

      {/* Share Modal */}
      <ShareQueryModal
        query={query}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </div>
  );
}

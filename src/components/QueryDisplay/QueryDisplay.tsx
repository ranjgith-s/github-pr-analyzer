import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  CardHeader,
  Button,
  Switch,
  Spinner,
  Textarea,
  ShadSeparator,
  Link,
  CardContent,
} from '../ui';
import {
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ShareIcon,
  BookmarkIcon,
} from '@heroicons/react/24/outline';
import { validateQuery } from '../../services/queryValidator';
import { getDefaultQuery } from '../../utils/queryUtils';
import { VisualFilterBuilder } from './VisualFilterBuilder';
import { useFilterSuggestions } from '../../hooks/useFilterSuggestions';
import { QueryAutocomplete, AutocompleteSuggestion } from './QueryAutocomplete';
import { ShareQueryModal } from './ShareQueryModal';
import { SuggestionService } from '../../services/suggestionService';
import { useQueryHistory } from '../../hooks/useQueryHistory';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import { featureFlags } from '@/feature-flags';

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
  const [editMode, setEditMode] = useState<'visual' | 'advanced'>('advanced');
  const [validationResult, setValidationResult] = useState(
    validateQuery(query)
  );
  const [, setSearchParams] = useSearchParams();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestions = useFilterSuggestions();

  // New autocomplete state
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState(0);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<
    AutocompleteSuggestion[]
  >([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const { token } = useAuth();
  const { addToHistory, addBookmark } = useQueryHistory();

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
    setShowAutocomplete(false);
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
      setShowAutocomplete(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (showAutocomplete) {
        setShowAutocomplete(false);
      } else {
        handleEditCancel();
      }
    }
  };

  // Autocomplete handlers
  const handleTextareaChange = async (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    if (!textareaRef.current) return;

    const newValue = e.target.value;
    const cursorPosition = textareaRef.current.selectionStart;

    setEditValue(newValue);
    setAutocompletePosition(cursorPosition);

    // Get autocomplete suggestions
    if (token && newValue.length > 0) {
      try {
        const suggestions = await SuggestionService.getSuggestions({
          query: newValue,
          cursorPosition,
          token,
        });

        if (suggestions.length > 0) {
          setAutocompleteSuggestions(suggestions);
          setShowAutocomplete(true);
        } else {
          setShowAutocomplete(false);
        }
      } catch (error) {
        console.error('Failed to get autocomplete suggestions:', error);
        setShowAutocomplete(false);
      }
    } else {
      setShowAutocomplete(false);
    }
  };

  const handleSuggestionSelect = (
    suggestion: AutocompleteSuggestion,
    position: number
  ) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const beforeCursor = editValue.substring(0, position);
    const afterCursor = editValue.substring(position);

    // Find the start of the current word/token being typed
    const wordStart = Math.max(
      beforeCursor.lastIndexOf(' ') + 1,
      beforeCursor.lastIndexOf(':') + 1,
      0
    );

    const insertText = suggestion.insertText || suggestion.value;
    const newValue =
      editValue.substring(0, wordStart) + insertText + ' ' + afterCursor;

    setEditValue(newValue);
    setShowAutocomplete(false);

    // Set cursor position after the inserted suggestion
    const newCursorPos = wordStart + insertText.length + 1;
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBookmarkQuery = () => {
    if (validationResult.isValid) {
      addBookmark(validationResult.sanitized);
    }
  };

  const getStatusContent = () => {
    if (error) {
      return {
        icon: <ExclamationCircleIcon className="h-5 w-5 text-danger" />,
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
        icon: <MagnifyingGlassIcon className="h-5 w-5 text-success" />,
        text: `${resultCount} result${resultCount !== 1 ? 's' : ''}`,
        textColor: 'text-success',
      };
    }

    return {
      icon: <MagnifyingGlassIcon className="h-5 w-5 text-default-400" />,
      text: 'Ready to search',
      textColor: 'text-default-400',
    };
  };

  const statusContent = getStatusContent();

  return (
    <Card className={`mb-6 ${className}`}>
      <CardHeader className="pb-2">
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
                      checked={editMode === 'advanced'}
                      onCheckedChange={() =>
                        setEditMode((prev) =>
                          prev === 'advanced' ? 'visual' : 'advanced'
                        )
                      }
                      aria-label="Toggle advanced mode"
                    />
                    <span className="text-xs text-default-500">Advanced</span>
                  </div>
                  <ShadSeparator orientation="vertical" className="h-6" />
                </>
              )}

              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    color="success"
                    variant="ghost"
                    startContent={<CheckIcon className="h-4 w-4" />}
                    onClick={handleEditSave}
                    isDisabled={!validationResult.isValid}
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    color="default"
                    variant="ghost"
                    startContent={<XMarkIcon className="h-4 w-4" />}
                    onClick={handleEditCancel}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="sm"
                    color="primary"
                    variant="ghost"
                    startContent={<PencilIcon className="h-4 w-4" />}
                    onClick={handleEditStart}
                  >
                    Edit Query
                  </Button>
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
                </>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
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
              <div className="space-y-3 relative">
                <Textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter GitHub search query..."
                  rows={Math.min(Math.max(editValue.split('\n').length, 2), 6)}
                  className={
                    validationResult.isValid
                      ? 'font-mono text-sm border-success'
                      : 'font-mono text-sm border-destructive'
                  }
                  aria-label="Edit search query"
                />

                {/* Autocomplete dropdown */}
                <QueryAutocomplete
                  query={editValue}
                  position={autocompletePosition}
                  onSuggestionSelect={handleSuggestionSelect}
                  onClose={() => setShowAutocomplete(false)}
                  isVisible={showAutocomplete}
                  suggestions={autocompleteSuggestions}
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
            )}
          </div>
        ) : (
          <div className="bg-default-100 rounded-lg p-3">
            <div className="text-xs text-default-500 mb-1">Current Query:</div>
            <code
              className="text-sm text-default-900 bg-transparent block break-all font-mono whitespace-pre-wrap"
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

      {/* Share Modal */}
      <ShareQueryModal
        query={query}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
      />
    </Card>
  );
}

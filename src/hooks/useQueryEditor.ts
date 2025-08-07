import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  validateQuery,
  QueryValidationResult,
} from '../services/queryValidator';
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
  debounceMs = 300,
}: UseQueryEditorOptions): UseQueryEditorReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(initialQuery);
  const [editValue, setEditValue] = useState(initialQuery);
  const [isEditing, setIsEditing] = useState(false);
  const [validationResult, setValidationResult] = useState(
    validateQuery(initialQuery)
  );
  const previousInitialQueryRef = useRef(initialQuery);

  // Debounce validation during editing
  const debouncedEditValue = useDebounce(editValue, debounceMs);

  // Update validation when debounced value changes
  useEffect(() => {
    if (isEditing) {
      setValidationResult(validateQuery(debouncedEditValue));
    }
  }, [debouncedEditValue, isEditing]);

  // Only reset when initialQuery actually changes (not when isEditing changes)
  if (initialQuery !== previousInitialQueryRef.current && !isEditing) {
    setQuery(initialQuery);
    setEditValue(initialQuery);
    setValidationResult(validateQuery(initialQuery));
    previousInitialQueryRef.current = initialQuery;
  }

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
    // Validate the current edit value directly
    const currentValidation = validateQuery(editValue);

    if (currentValidation.isValid) {
      const sanitizedQuery = currentValidation.sanitized;

      // Update URL
      const newParams = new URLSearchParams(searchParams);
      if (sanitizedQuery !== initialQuery) {
        newParams.set('q', sanitizedQuery);
      } else {
        newParams.delete('q');
      }
      setSearchParams(newParams);

      // Update local state in batch
      setQuery(sanitizedQuery);
      setValidationResult(currentValidation);
      setEditValue(sanitizedQuery);
      setIsEditing(false);

      // Notify parent
      onQueryChange?.(sanitizedQuery);
    }
  }, [editValue, searchParams, setSearchParams, initialQuery, onQueryChange]);

  const updateEditValue = useCallback((value: string) => {
    setEditValue(value);
  }, []);

  const isDirty = editValue !== query;
  const hasChanges = isEditing && isDirty;

  // Calculate canSave based on current edit value validation
  const currentValidation = isEditing
    ? validateQuery(editValue)
    : validationResult;
  const canSave = currentValidation.isValid && isDirty;

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
    canSave,
  };
}

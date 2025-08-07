import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Textarea,
  Spinner,
  Link,
} from '@heroui/react';
import {
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { validateQuery } from '../../services/queryValidator';
import { getDefaultQuery } from '../../utils/queryUtils';

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
  const [validationResult, setValidationResult] = useState(
    validateQuery(query)
  );
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
      if (sanitizedQuery !== getDefaultQuery({ login: '@me' })) {
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

      <CardBody className="pt-0">
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
                  : 'border-danger',
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
      </CardBody>
    </Card>
  );
}

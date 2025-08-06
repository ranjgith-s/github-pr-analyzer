import React from 'react';
import { Card, CardBody, CardHeader, Link, Spinner } from '@heroui/react';
import {
  MagnifyingGlassIcon,
  ExclamationCircleIcon,
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
  className = '',
}: QueryDisplayProps) {
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
        <div className="flex items-center gap-2">
          {statusContent.icon}
          <span className={`text-sm font-medium ${statusContent.textColor}`}>
            {statusContent.text}
          </span>
        </div>
      </CardHeader>
      <CardBody className="pt-0">
        <div className="bg-default-100 rounded-lg p-3">
          <div className="text-xs text-default-500 mb-1">Current Query:</div>
          <code
            className="text-sm text-default-900 bg-transparent font-mono break-all whitespace-pre-wrap"
            role="code"
            aria-label="Current search query"
            tabIndex={0}
          >
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
      </CardBody>
    </Card>
  );
}

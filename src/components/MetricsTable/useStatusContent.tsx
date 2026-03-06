import React, { useMemo } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { Spinner } from '../ui';

interface UseStatusContentProps {
  error?: string | null;
  loading?: boolean;
  resultCount?: number;
  totalCount?: number;
  filteredLength: number;
  pageSize: number;
  pageIndex: number;
  currentItemsLength: number;
}

export function useStatusContent({
  error,
  loading,
  resultCount,
  totalCount,
  filteredLength,
  pageSize,
  pageIndex,
  currentItemsLength,
}: UseStatusContentProps) {
  return useMemo(() => {
    if (error) {
      return {
        icon: <ExclamationCircleIcon className="h-4 w-4 text-danger" />,
        text: `Error: ${error}`,
        className: 'text-danger',
      };
    }
    if (loading) {
      return {
        icon: <Spinner size="sm" color="primary" />,
        text: 'Loading results...',
        className: 'text-default-500',
      };
    }

    const total =
      typeof resultCount === 'number'
        ? resultCount
        : typeof totalCount === 'number'
          ? totalCount
          : filteredLength;

    let start = 0;
    let end = 0;
    if (total > 0) {
      const effectivePageSize = pageSize;
      const theoreticalStart = (pageIndex - 1) * effectivePageSize + 1;
      const lastPageStart =
        Math.floor((total - 1) / effectivePageSize) * effectivePageSize + 1;
      start = theoreticalStart > total ? lastPageStart : theoreticalStart;
      const visibleLength = currentItemsLength;
      if (visibleLength > 0) {
        end = Math.min(start + visibleLength - 1, total);
      } else {
        end = Math.min(start + effectivePageSize - 1, total);
        if (start > end) start = end;
      }
    }
    return {
      icon: null,
      text:
        total === 0
          ? 'Showing 0 of 0 results'
          : `Showing ${start}-${end} of ${total} result${total === 1 ? '' : 's'}`,
      className: 'text-default-400',
    };
  }, [
    error,
    loading,
    resultCount,
    totalCount,
    filteredLength,
    pageSize,
    pageIndex,
    currentItemsLength,
  ]);
}

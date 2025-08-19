import React, { useEffect, useState } from 'react';
import { Pagination, Input } from '../ui';
import { useDebounce } from '../../hooks/useDebounce';

export interface TableFooterProps {
  pageSize: number;
  totalPages: number;
  pageIndex: number;
  onPerPageChange: (n: number) => void;
  onPageChange: (p: number) => void;
}

export default function TableFooter(props: TableFooterProps) {
  // local controlled state for debounced per-page updates
  const [localPageSize, setLocalPageSize] = useState<number>(props.pageSize);
  useEffect(() => {
    setLocalPageSize(props.pageSize);
  }, [props.pageSize]);
  const debouncedPageSize = useDebounce(localPageSize, 300);
  useEffect(() => {
    if (
      typeof debouncedPageSize === 'number' &&
      debouncedPageSize > 0 &&
      debouncedPageSize !== props.pageSize
    ) {
      props.onPerPageChange(debouncedPageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedPageSize]);
  return (
    <div className="flex flex-col gap-2 mt-4 w-full" aria-label="Pagination">
      <div className="flex items-center justify-between gap-3 w-full">
        {/* Per page: number input */}
        <label className="flex items-center gap-2 min-w-[180px]">
          <span className="text-sm text-default-600">Per page:</span>
          <Input
            aria-label="Items per page"
            type="number"
            min={1}
            step={1}
            className="w-[100px] rounded border px-2 py-1 text-sm"
            value={localPageSize}
            onChange={(e) => {
              const next = parseInt(e.target.value, 10);
              if (!Number.isNaN(next)) setLocalPageSize(next);
            }}
          />
        </label>

        <Pagination
          data-testid="pagination"
          aria-label="Pagination"
          total={props.totalPages}
          page={props.pageIndex}
          onChange={(p) => props.onPageChange(p)}
          size="sm"
          className="mt-0"
        />
      </div>
    </div>
  );
}

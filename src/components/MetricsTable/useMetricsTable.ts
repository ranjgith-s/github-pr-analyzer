import { useState, useEffect, useMemo, useCallback } from 'react';
import { PRItem } from '../../types';
import { QueryParams } from '../../utils/queryUtils';
import {
  SortingState,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { rtColumns } from './columns';

type SortKey =
  | 'repo'
  | 'title'
  | 'author'
  | 'reviewers'
  | 'changes_requested'
  | 'diff'
  | 'comment_count'
  | 'timeline'
  | 'lead_time'
  | 'state'
  | 'created'
  | 'updated';

interface UseMetricsTableProps {
  queryParams?: QueryParams;
  items: PRItem[];
  totalCount?: number;
  onPageChange?: (p: number) => void;
  onPerPageChange?: (n: number) => void;
  onSortChange?: (s: string) => void;
  onOrderChange?: (o: 'asc' | 'desc') => void;
}

export function useMetricsTable({
  queryParams,
  items,
  totalCount,
  onPageChange,
  onPerPageChange,
  onSortChange,
  onOrderChange,
}: UseMetricsTableProps) {
  const effectiveTotal = totalCount ?? items.length;
  const serverPaginated =
    typeof totalCount === 'number' && totalCount > items.length;

  const [search, setSearch] = useState('');
  const [pageIndex, setPageIndex] = useState(queryParams?.page || 1);
  const [pageSize, setPageSize] = useState(queryParams?.per_page || 20);
  const [sort, setSort] = useState(queryParams?.sort || 'updated');
  const [order, setOrder] = useState<'asc' | 'desc'>(
    (queryParams?.order as 'asc' | 'desc') || 'desc'
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);

  useEffect(() => {
    if (queryParams) {
      setPageIndex(queryParams.page || 1);
      setPageSize(queryParams.per_page || 20);
      setSort(queryParams.sort || 'updated');
      setOrder((queryParams.order as 'asc' | 'desc') || 'desc');
    }
  }, [queryParams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => {
      const matchTitle = it.title.toLowerCase().includes(q);
      const matchRepo = it.repo.toLowerCase().includes(q);
      const matchAuthor = it.author.toLowerCase().includes(q);
      const matchReviewer = it.reviewers.some((r) =>
        r.toLowerCase().includes(q)
      );
      const searchOK =
        !q || matchTitle || matchRepo || matchAuthor || matchReviewer;
      return searchOK;
    });
  }, [items, search]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handlePerPageChange = useCallback(
    (v: number) => {
      if (!v) return;
      setPageSize(v);
      setPageIndex(1);
      onPerPageChange?.(v);
    },
    [onPerPageChange]
  );

  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  const sortKeyToColumnId = useCallback((s: string): SortKey | null => {
    if (s === 'comments') return 'comment_count';
    if (s === 'pr') return 'title';
    if (
      [
        'repo',
        'title',
        'author',
        'reviewers',
        'changes_requested',
        'diff',
        'comment_count',
        'timeline',
        'lead_time',
        'state',
        'created',
        'updated',
      ].includes(s)
    )
      return s as SortKey;
    return null;
  }, []);

  const [sorting, setSorting] = useState<SortingState>(() => {
    const id = sortKeyToColumnId(sort);
    return id ? [{ id, desc: order === 'desc' }] : [];
  });
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    const id = sortKeyToColumnId(sort);
    setSorting(id ? [{ id, desc: order === 'desc' }] : []);
  }, [sort, order, sortKeyToColumnId]);

  const table = useReactTable({
    data: filtered,
    columns: rtColumns,
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: serverPaginated ? 0 : Math.max(0, pageIndex - 1),
        pageSize: serverPaginated ? filtered.length : pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const currentRows = table.getRowModel().rows;
  const currentItems = currentRows.map((r: any) => r.original as PRItem);

  const handleSortChange = useCallback(
    (colId: string) => {
      if (sort === colId) {
        setOrder((o) => {
          const next: 'asc' | 'desc' = o === 'asc' ? 'desc' : 'asc';
          onOrderChange?.(next);
          const mappedId = sortKeyToColumnId(colId);
          if (mappedId) setSorting([{ id: mappedId, desc: next === 'desc' }]);
          return next;
        });
      } else {
        setSort(colId);
        onSortChange?.(colId);
        const mappedId = sortKeyToColumnId(colId);
        if (mappedId) setSorting([{ id: mappedId, desc: order === 'desc' }]);
      }
    },
    [sort, order, sortKeyToColumnId, onOrderChange, onSortChange]
  );

  const handlePageChange = useCallback(
    (p: number) => {
      setPageIndex(p);
      onPageChange?.(p);
    },
    [onPageChange]
  );

  return {
    search,
    setSearch,
    pageIndex,
    pageSize,
    sort,
    order,
    selectedIds,
    visibleColumns,
    setVisibleColumns,
    columnsMenuOpen,
    setColumnsMenuOpen,
    filtered,
    toggleSelect,
    handlePerPageChange,
    handlePageChange,
    handleSortChange,
    totalPages,
    table,
    currentItems,
  };
}

// Clean minimal, syntactically valid MetricsTable rebuilt after corruption.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRItem } from '../../types';
import { QueryParams } from '../../utils/queryUtils';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';
import { Spinner } from '../ui';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  Button,
  Chip,
} from '../ui';
import { Settings2Icon } from 'lucide-react';
import TimelineBar from './TimelineBar';
import DiffCell from './DiffCell';
import FiltersBar from './FiltersBar';
import ActionBar from './ActionBar';
import TableFooter from './TableFooter';
import {
  ColumnDef as RTColumnDef,
  SortingState,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import UserAvatar from '../UserAvatar/UserAvatar';

// Local types and pure helpers to keep UI logic simple and testable
const stateToChipColor = (
  state: PRItem['state']
): 'primary' | 'secondary' | 'success' | 'warning' | 'default' => {
  switch (state) {
    case 'open':
      return 'primary';
    case 'merged':
      return 'success';
    case 'draft':
      return 'warning';
    case 'closed':
    default:
      return 'default';
  }
};

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

// UI column definition (distinct from TanStack's ColumnDef)
interface UIColumnDef<Row> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof Row & string;
  cell?: (row: Row) => React.ReactNode;
}

const toTime = (d?: string | null) => (d ? new Date(d).getTime() : 0);
// Local compare helpers no longer used (sorting handled by TanStack)

const getTimelineTotal = (row: PRItem) => {
  const created = row.created_at ? new Date(row.created_at) : null;
  const published = row.published_at ? new Date(row.published_at) : null;
  const firstReview = row.first_review_at
    ? new Date(row.first_review_at)
    : null;
  const closed = row.closed_at ? new Date(row.closed_at) : null;
  const draftMs =
    created && published ? published.getTime() - created.getTime() : 0;
  const reviewMs =
    published && firstReview ? firstReview.getTime() - published.getTime() : 0;
  const activeMs =
    firstReview && closed ? closed.getTime() - firstReview.getTime() : 0;
  return draftMs + reviewMs + activeMs;
};

const getLeadTime = (row: PRItem) => {
  const s = row.first_commit_at ? new Date(row.first_commit_at) : null;
  const e = row.closed_at ? new Date(row.closed_at) : null;
  return s && e ? e.getTime() - s.getTime() : 0;
};

interface MetricsTableProps {
  queryParams?: QueryParams;
  totalCount?: number;
  items: PRItem[];
  loading?: boolean;
  error?: string | null;
  onPageChange?: (p: number) => void;
  onPerPageChange?: (n: number) => void;
  onSortChange?: (s: string) => void;
  onOrderChange?: (o: 'asc' | 'desc') => void;
  resultCount?: number; // optional external result count
}

export default function MetricsTable(props: MetricsTableProps) {
  const { queryParams, totalCount, items, loading, error, resultCount } = props;
  const navigate = useNavigate();
  const effectiveTotal = totalCount ?? items.length;

  // State (mirrors prior design to keep tests stable)
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

  // Defer early returns until after all hooks to satisfy rules-of-hooks
  const loadingOverlay = (
    <LoadingOverlay
      show={true}
      messages={[
        'Loading pull requests...',
        'Crunching numbers...',
        'Preparing table...',
      ]}
    />
  );
  if (error) console.error('Failed to load pull request metrics:', error);
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

  // Selection toggle is stable and side-effect free
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // Column definitions (memoized)
  const columns = useMemo<UIColumnDef<PRItem>[]>(
    () => [
      {
        id: 'select',
        header: '',
        cell: (row: PRItem) => (
          <input
            type="checkbox"
            aria-label={`Select PR ${row.id}`}
            checked={selectedIds.includes(row.id)}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              toggleSelect(row.id);
            }}
          />
        ),
      },
      {
        id: 'pr',
        header: 'Pull Request',
        cell: (row: PRItem) => (
          <div className="flex flex-col">
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block max-w-[60ch] truncate text-foreground"
              style={{ textDecoration: 'none' }}
            >
              {row.title}
            </a>
            <span className="text-xs text-muted-foreground font-mono">
              {row.repo}
            </span>
          </div>
        ),
      },
      {
        id: 'author',
        header: 'Author',
        cell: (row: PRItem) => (
          <div className="flex items-center">
            <UserAvatar username={row.author} size="sm" />
          </div>
        ),
      },
      {
        id: 'reviewers',
        header: 'Reviewers',
        cell: (row: PRItem) => (
          <div className="flex -space-x-2 items-center">
            {row.reviewers.map((n) => (
              <UserAvatar key={n} username={n} size="sm" />
            ))}
          </div>
        ),
      },
      {
        id: 'diff',
        header: 'Diff',
        cell: (row: PRItem) => (
          <DiffCell additions={row.additions} deletions={row.deletions} />
        ),
      },
      {
        id: 'changes_requested',
        header: 'Revisions',
        accessorKey: 'changes_requested',
      },
      { id: 'comment_count', header: 'Comments', accessorKey: 'comment_count' },
      {
        id: 'lead_time',
        header: 'Lead Time',
        cell: (row: PRItem) => (
          <TimelineBar
            createdAt={row.created_at}
            publishedAt={row.published_at}
            firstReviewAt={row.first_review_at}
            closedAt={row.closed_at}
          />
        ),
      },
      {
        id: 'state',
        header: 'State',
        cell: (row: PRItem) => (
          <Chip color={stateToChipColor(row.state)} size="sm">
            {row.state}
          </Chip>
        ),
      },
    ],
    [selectedIds, toggleSelect]
  );

  // Initialize visible columns once (and on first columns change if empty)
  useEffect(() => {
    if (!visibleColumns.length) setVisibleColumns(columns.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, visibleColumns.length]);

  // helper moved into FiltersBar

  const handlePerPageChange = useCallback(
    (v: number) => {
      if (!v) return;
      setPageSize(v);
      setPageIndex(1);
      props.onPerPageChange?.(v);
    },
    [props]
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

  const rtColumns = useMemo<RTColumnDef<PRItem>[]>(
    () => [
      // Support both visible and virtual columns (created/updated)
      {
        id: 'repo',
        accessorFn: (r: PRItem) => r.repo,
        // exact match filter for dropdown selections
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const v = row.getValue<string>(columnId);
          return String(v) === String(filterValue);
        },
      },
      { id: 'title', accessorFn: (r: PRItem) => r.title },
      {
        id: 'author',
        accessorFn: (r: PRItem) => r.author,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const v = row.getValue<string>(columnId);
          return String(v) === String(filterValue);
        },
      },
      {
        id: 'state',
        accessorFn: (r: PRItem) => r.state,
        filterFn: (row, columnId, filterValue) => {
          if (!filterValue) return true;
          const v = row.getValue<string>(columnId);
          return String(v) === String(filterValue);
        },
      },
      {
        id: 'changes_requested',
        accessorFn: (r: PRItem) => r.changes_requested,
      },
      { id: 'comment_count', accessorFn: (r: PRItem) => r.comment_count },
      { id: 'diff', accessorFn: (r: PRItem) => r.additions + r.deletions },
      { id: 'timeline', accessorFn: (r: PRItem) => getTimelineTotal(r) },
      { id: 'lead_time', accessorFn: (r: PRItem) => getLeadTime(r) },
      { id: 'created', accessorFn: (r: PRItem) => toTime(r.created_at) },
      {
        id: 'updated',
        accessorFn: (r: PRItem) =>
          toTime(r.closed_at || r.published_at || r.created_at),
      },
    ],
    []
  );

  const table = useReactTable({
    data: filtered,
    columns: rtColumns,
    state: {
      sorting,
      columnFilters,
      pagination: { pageIndex: Math.max(0, pageIndex - 1), pageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  // Extract paginated, sorted, and filtered rows for rendering
  const currentRows = table.getRowModel().rows;
  const currentItems = currentRows.map((r: any) => r.original as PRItem);

  const statusContent = useMemo(() => {
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
    const count =
      typeof resultCount === 'number' ? resultCount : filtered.length;
    return {
      icon: null,
      text: `${count} result${count === 1 ? '' : 's'}`,
      className: count > 0 ? 'text-success' : 'text-default-400',
    };
  }, [error, loading, resultCount, filtered.length]);

  if (loading) return loadingOverlay;

  return (
    <div className="flex flex-col w-full">
      <div className="flex w-full justify-between items-start gap-4">
        <ActionBar
          disabled={selectedIds.length !== 1}
          onView={() => {
            const selectedItem = items.find((i) => selectedIds.includes(i.id));
            if (!selectedItem) return;
            navigate(
              `/pr/${selectedItem.owner}/${selectedItem.repo_name}/${selectedItem.number}`,
              {
                state: selectedItem,
              }
            );
          }}
        />
        <FiltersBar
          search={search}
          onSearch={(v: string) => setSearch(v)}
          leftContent={
            <div
              className="flex items-center gap-2 text-sm"
              aria-label="Results status"
            >
              {statusContent.icon}
              <span className={`font-normal ${statusContent.className}`}>
                {statusContent.text}
              </span>
            </div>
          }
          rightContent={
            <DropdownMenu
              open={columnsMenuOpen}
              onOpenChange={setColumnsMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  aria-label="Choose columns"
                  onClick={() => setColumnsMenuOpen((v) => !v)}
                >
                  <Settings2Icon size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent aria-label="Select columns">
                {columns.map((col) => (
                  <DropdownMenuItem
                    key={col.id}
                    onClick={() => {
                      setVisibleColumns((prev) =>
                        prev.includes(col.id)
                          ? prev.filter((c) => c !== col.id)
                          : [...prev, col.id]
                      );
                    }}
                    data-selected={visibleColumns.includes(col.id) || undefined}
                    className={
                      visibleColumns.includes(col.id)
                        ? 'data-[selected]:bg-accent/60'
                        : undefined
                    }
                  >
                    {col.header || '(select)'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          }
        />
      </div>
      <Table
        aria-label="PR Metrics Table"
        data-testid="metrics-table"
        isStriped
      >
        <TableHeader>
          {columns
            .filter((c) => visibleColumns.includes(c.id))
            .map((c) => (
              <TableColumn
                key={c.id}
                sortable={c.id !== 'select'}
                sortDirection={sort === c.id ? order : null}
                onSort={() => {
                  if (sort === c.id) {
                    setOrder((o) => {
                      const next: 'asc' | 'desc' = o === 'asc' ? 'desc' : 'asc';
                      props.onOrderChange?.(next);
                      const colId = sortKeyToColumnId(c.id);
                      if (colId)
                        setSorting([{ id: colId, desc: next === 'desc' }]);
                      return next;
                    });
                  } else {
                    setSort(c.id);
                    props.onSortChange?.(c.id);
                    const colId = sortKeyToColumnId(c.id);
                    if (colId)
                      setSorting([{ id: colId, desc: order === 'desc' }]);
                  }
                }}
              >
                <div className="flex flex-col gap-1">
                  <span>{c.header ? String(c.header).toUpperCase() : ''}</span>
                </div>
              </TableColumn>
            ))}
        </TableHeader>
        <TableBody
          items={currentItems}
          emptyContent={<span>No pull requests found.</span>}
        >
          {(row: PRItem) => (
            <TableRow
              key={row.id}
              onClick={() => toggleSelect(row.id)}
              className={selectedIds.includes(row.id) ? 'bg-accent/40' : ''}
            >
              {columns
                .filter((c) => visibleColumns.includes(c.id))
                .map((c) => (
                  <TableCell key={c.id} data-testid={`cell-${c.id}`}>
                    {c.cell
                      ? c.cell(row)
                      : c.accessorKey
                        ? (row as any)[c.accessorKey]
                        : null}
                  </TableCell>
                ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
      {/* Pagination */}
      <TableFooter
        pageSize={pageSize}
        totalPages={totalPages}
        pageIndex={pageIndex}
        onPerPageChange={handlePerPageChange}
        onPageChange={(p) => {
          setPageIndex(p);
          props.onPageChange?.(p);
        }}
      />
    </div>
  );
}

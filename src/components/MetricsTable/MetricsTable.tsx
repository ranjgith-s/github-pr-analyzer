// Clean minimal, syntactically valid MetricsTable rebuilt after corruption.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PRItem } from '../../types';
import { QueryParams } from '../../utils/queryUtils';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from '../ui';
import { Settings2Icon } from 'lucide-react';
import TimelineBar from './TimelineBar';
import DiffCell from './DiffCell';
import FiltersBar from './FiltersBar';
import ActionBar from './ActionBar';

export function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return 'N/A';
  const diff = new Date(end).getTime() - new Date(start).getTime();
  if (diff < 0) return 'N/A';
  const hours = Math.floor(diff / 36e5);
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  if (days) {
    return rem ? `${days}d ${rem}h` : `${days}d`;
  }
  return `${rem}h`;
}

// Local types and pure helpers to keep UI logic simple and testable
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

interface ColumnDef<Row> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof Row & string;
  cell?: (row: Row) => React.ReactNode;
}

const toTime = (d?: string | null) => (d ? new Date(d).getTime() : 0);
const cmpNum = (a: number, b: number) => a - b;
const cmpStr = (a: string, b: string) => a.localeCompare(b);

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
}

export default function MetricsTable(props: MetricsTableProps) {
  const { queryParams, totalCount, items, loading, error } = props;
  const navigate = useNavigate();
  const effectiveTotal = totalCount ?? items.length;

  // State (mirrors prior design to keep tests stable)
  const [search, setSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [pageIndex, setPageIndex] = useState(queryParams?.page || 1);
  const [pageSize, setPageSize] = useState(queryParams?.per_page || 20);
  const [sort, setSort] = useState(queryParams?.sort || 'updated');
  const [order, setOrder] = useState<'asc' | 'desc'>(
    (queryParams?.order as 'asc' | 'desc') || 'desc'
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>([]);

  useEffect(() => {
    if (queryParams) {
      setPageIndex(queryParams.page || 1);
      setPageSize(queryParams.per_page || 20);
      setSort(queryParams.sort || 'updated');
      setOrder((queryParams.order as 'asc' | 'desc') || 'desc');
    }
  }, [queryParams]);

  // Reset page when filters change (must be before any early return to keep hook order stable)
  useEffect(() => {
    setPageIndex(1);
  }, [repoFilter, authorFilter]);

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
  if (error) console.error('Failed to load pull request metrics:', error); // eslint-disable-line

  // Derived data
  const repos = useMemo(
    () => [...new Set(items.map((i) => i.repo))].sort(),
    [items]
  );
  const authors = useMemo(
    () => [...new Set(items.map((i) => i.author))].sort(),
    [items]
  );
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
      const repoOK = !repoFilter || it.repo === repoFilter;
      const authorOK = !authorFilter || it.author === authorFilter;
      return searchOK && repoOK && authorOK;
    });
  }, [items, search, repoFilter, authorFilter]);

  // Sorting helpers (client-side for displayed data)
  const sorted = React.useMemo(() => {
    // Accept existing values for `sort` including dropdown legacy values ('updated'|'created'|'comments').
    let key: SortKey | null = null;
    if (['updated', 'created'].includes(sort)) key = sort as SortKey;
    else if (sort === 'comments') key = 'comment_count';
    else if (
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
      ].includes(sort)
    ) {
      key = sort as SortKey;
    }
    if (!key) return filtered;
    const copy = filtered.slice();
    const getSortValue = (row: PRItem): number | string => {
      switch (key as SortKey) {
        case 'repo':
          return row.repo;
        case 'title':
          return row.title;
        case 'author':
          return row.author;
        case 'reviewers':
          return row.reviewers.length;
        case 'changes_requested':
          return row.changes_requested;
        case 'diff':
          return row.additions + row.deletions;
        case 'comment_count':
          return row.comment_count;
        case 'timeline':
          return getTimelineTotal(row);
        case 'lead_time':
          return getLeadTime(row);
        case 'state':
          return row.state;
        case 'created':
          return toTime(row.created_at);
        case 'updated':
          return toTime(row.closed_at || row.published_at || row.created_at);
        default:
          return '';
      }
    };
    copy.sort((a, b) => {
      const av = getSortValue(a);
      const bv = getSortValue(b);
      if (typeof av === 'number' && typeof bv === 'number')
        return order === 'asc' ? cmpNum(av, bv) : cmpNum(bv, av);
      return order === 'asc'
        ? cmpStr(String(av), String(bv))
        : cmpStr(String(bv), String(av));
    });
    return copy;
  }, [filtered, sort, order]);

  // Selection toggle is stable and side-effect free
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  // Column definitions (memoized)
  const columns = useMemo<ColumnDef<PRItem>[]>(
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
      { id: 'repo', header: 'Repository', accessorKey: 'repo' },
      {
        id: 'title',
        header: 'Title',
        cell: (row: PRItem) => (
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            {row.title}
          </a>
        ),
      },
      {
        id: 'author',
        header: 'Author',
        cell: (row: PRItem) => (
          <a
            href={`https://github.com/${row.author}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {row.author}
          </a>
        ),
      },
      {
        id: 'reviewers',
        header: 'Reviewers',
        cell: (row: PRItem) => (
          <span>
            {row.reviewers.map((n, i) => (
              <React.Fragment key={n}>
                <a
                  href={`https://github.com/${n}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {n}
                </a>
                {i < row.reviewers.length - 1 && ', '}
              </React.Fragment>
            ))}
          </span>
        ),
      },
      {
        id: 'changes_requested',
        header: 'Changes Requested',
        accessorKey: 'changes_requested',
      },
      {
        id: 'diff',
        header: 'Diff',
        cell: (row: PRItem) => (
          <DiffCell additions={row.additions} deletions={row.deletions} />
        ),
      },
      { id: 'comment_count', header: 'Comments', accessorKey: 'comment_count' },
      {
        id: 'timeline',
        header: 'Timeline',
        cell: (row: PRItem) => {
          const created = row.created_at ? new Date(row.created_at) : null;
          const published = row.published_at
            ? new Date(row.published_at)
            : null;
          const firstReview = row.first_review_at
            ? new Date(row.first_review_at)
            : null;
          const closed = row.closed_at ? new Date(row.closed_at) : null;
          const draftMs =
            created && published
              ? published.getTime() - created.getTime()
              : null;
          const reviewMs =
            published && firstReview
              ? firstReview.getTime() - published.getTime()
              : null;
          const activeMs =
            firstReview && closed
              ? closed.getTime() - firstReview.getTime()
              : null;
          return (
            <TimelineBar
              draftMs={draftMs}
              reviewMs={reviewMs}
              activeMs={activeMs}
            />
          );
        },
      },
      {
        id: 'lead_time',
        header: 'Lead Time',
        cell: (row: PRItem) =>
          formatDuration(row.first_commit_at, row.closed_at),
      },
      {
        id: 'state',
        header: 'State',
        cell: (row: PRItem) => <span>{row.state}</span>,
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

  // Centralized control handlers (reduce duplication)
  const handleRepoChange = useCallback((r: string) => {
    setRepoFilter(r);
    if (r) setAuthorFilter('');
  }, []);

  const handleAuthorChange = useCallback((a: string) => {
    setAuthorFilter(a);
    if (a) setRepoFilter('');
  }, []);

  const handleSortChange = useCallback(
    (s: string) => {
      setSort(s);
      props.onSortChange?.(s);
    },
    [props]
  );

  const handleOrderChange = useCallback(
    (o: 'asc' | 'desc') => {
      setOrder(o);
      props.onOrderChange?.(o);
    },
    [props]
  );

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

  if (loading) return loadingOverlay;

  return (
    <div style={{ width: '100%' }}>
      {/* Filters */}
      <FiltersBar
        search={search}
        onSearch={(v) => setSearch(v)}
        repoFilter={repoFilter}
        onRepoChange={handleRepoChange}
        authorFilter={authorFilter}
        onAuthorChange={handleAuthorChange}
        repos={repos}
        authors={authors}
        sort={sort}
        onSortChange={handleSortChange}
        order={order}
        onOrderChange={handleOrderChange}
        pageSize={pageSize}
        onPerPageChange={handlePerPageChange}
      />

      {/* Controls: Column chooser + total */}
      <div className="flex mb-6 gap-3 items-center flex-wrap">
        {/* Column chooser */}
        <Dropdown>
          <DropdownTrigger>
            <Button variant="ghost" aria-label="Choose columns">
              <Settings2Icon size={18} />
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Select columns"
            closeOnSelect={false}
            selectionMode="multiple"
            selectedKeys={new Set(visibleColumns)}
            onSelectionChange={(keys: any) =>
              setVisibleColumns(Array.from(keys as Set<string>))
            }
          >
            <>
              {columns.map((col) => (
                <DropdownItem
                  key={col.id}
                  itemKey={col.id}
                  role="menuitem"
                  onClick={() => {
                    setVisibleColumns((prev) =>
                      prev.includes(col.id)
                        ? prev.filter((c) => c !== col.id)
                        : [...prev, col.id]
                    );
                  }}
                >
                  {col.header || '(select)'}
                </DropdownItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
        <div
          className="text-sm text-default-500 ml-auto"
          data-testid="total-count"
        >
          Total: {effectiveTotal}
        </div>
      </div>
      {/* Action bar */}
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
      {/* Table */}
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
                      return next;
                    });
                  } else {
                    setSort(c.id);
                    props.onSortChange?.(c.id);
                  }
                }}
              >
                {c.header ? String(c.header).toUpperCase() : ''}
              </TableColumn>
            ))}
        </TableHeader>
        <TableBody
          items={sorted}
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
      <div
        className="flex flex-col items-center gap-2 mt-4"
        aria-label="Pagination"
      >
        <div
          className="text-xs text-muted-foreground"
          aria-label="pagination-summary"
        >
          Page {pageIndex} of {totalPages}
        </div>
        {totalPages > 1 && (
          <Pagination
            data-testid="pagination"
            aria-label="Pagination"
            total={totalPages}
            page={pageIndex}
            onChange={(p) => {
              setPageIndex(p);
              props.onPageChange?.(p);
            }}
            size="sm"
            className="mt-0"
          />
        )}
      </div>
    </div>
  );
}

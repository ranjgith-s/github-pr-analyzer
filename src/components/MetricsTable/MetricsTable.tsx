// Clean minimal, syntactically valid MetricsTable rebuilt after corruption.
import React, { useEffect, useState } from 'react';
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
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Pagination,
  Button,
  Input,
} from '../ui';
import { Settings2Icon } from 'lucide-react';

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

  // Initialize visible columns immediately after columns can be derived, before any early returns
  useEffect(() => {
    setVisibleColumns((prev) => (prev.length ? prev : []));
  }, []);

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
  const repos = [...new Set(items.map((i) => i.repo))].sort();
  const authors = [...new Set(items.map((i) => i.author))].sort();
  const filtered = items.filter((it) => {
    const q = search.toLowerCase();
    const matchTitle = it.title.toLowerCase().includes(q);
    const matchRepo = it.repo.toLowerCase().includes(q);
    const matchAuthor = it.author.toLowerCase().includes(q);
    const matchReviewer = it.reviewers.some((r) => r.toLowerCase().includes(q));
    const searchOK =
      !q || matchTitle || matchRepo || matchAuthor || matchReviewer;
    return (
      searchOK &&
      (!repoFilter || it.repo === repoFilter) &&
      (!authorFilter || it.author === authorFilter)
    );
  });

  // Sorting helpers (client-side for displayed data)
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
      published && firstReview
        ? firstReview.getTime() - published.getTime()
        : 0;
    const activeMs =
      firstReview && closed ? closed.getTime() - firstReview.getTime() : 0;
    return draftMs + reviewMs + activeMs;
  };
  const getLeadTime = (row: PRItem) => {
    const s = row.first_commit_at ? new Date(row.first_commit_at) : null;
    const e = row.closed_at ? new Date(row.closed_at) : null;
    return s && e ? e.getTime() - s.getTime() : 0;
  };
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

  // Column definitions
  const columns = [
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
        <span>
          <span style={{ color: 'green' }}>+{row.additions}</span>{' '}
          <span style={{ color: 'red' }}>-{row.deletions}</span>
        </span>
      ),
    },
    { id: 'comment_count', header: 'Comments', accessorKey: 'comment_count' },
    {
      id: 'timeline',
      header: 'Timeline',
      cell: (row: PRItem) => {
        const created = row.created_at ? new Date(row.created_at) : null;
        const published = row.published_at ? new Date(row.published_at) : null;
        const firstReview = row.first_review_at
          ? new Date(row.first_review_at)
          : null;
        const closed = row.closed_at ? new Date(row.closed_at) : null;
        const draftMs =
          created && published ? published.getTime() - created.getTime() : null;
        const reviewMs =
          published && firstReview
            ? firstReview.getTime() - published.getTime()
            : null;
        const activeMs =
          firstReview && closed
            ? closed.getTime() - firstReview.getTime()
            : null;
        const a = draftMs ?? 0;
        const b = reviewMs ?? 0;
        const d = activeMs ?? 0;
        const total = a + b + d || 1;
        const pct = (x: number) => (x / total) * 100;
        const fmt = (ms: number | null) =>
          ms == null ? 'N/A' : `${Math.floor(ms / 36e5)}h`;
        const draftLabel = fmt(draftMs);
        const reviewLabel = fmt(reviewMs);
        const activeLabel = fmt(activeMs);
        return (
          <div
            className="flex flex-col items-start w-32"
            aria-label={`Draft: ${draftLabel} Review: ${reviewLabel} Active: ${activeLabel}`}
          >
            <div className="flex w-full gap-0.5 items-center">
              <div
                className="h-2 rounded-l bg-success"
                style={{ width: `${pct(a)}%` }}
              />
              <div className="h-2 bg-warning" style={{ width: `${pct(b)}%` }} />
              <div
                className="h-2 rounded-r bg-primary"
                style={{ width: `${pct(d)}%` }}
              />
            </div>
            <div
              className="text-[10px] mt-1 whitespace-nowrap"
              aria-hidden="true"
            >
              {draftLabel} | {reviewLabel} | {activeLabel}
            </div>
          </div>
        );
      },
    },
    {
      id: 'lead_time',
      header: 'Lead Time',
      cell: (row: PRItem) => formatDuration(row.first_commit_at, row.closed_at),
    },
    {
      id: 'state',
      header: 'State',
      cell: (row: PRItem) => <span>{row.state}</span>,
    },
  ];

  // Initialize visibleColumns once columns are defined
  useEffect(() => {
    setVisibleColumns(columns.map((c) => c.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstKey = (keys: any): string => {
    if (!keys) return '';
    if (typeof keys === 'string') return keys;
    if (Array.isArray(keys)) return keys[0];
    if (keys instanceof Set) return Array.from(keys)[0] as string;
    if (typeof keys === 'object' && 'currentKey' in keys)
      return (keys as any).currentKey;
    return '';
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));

  if (loading) return loadingOverlay;

  return (
    <div style={{ width: '100%' }}>
      {/* Controls */}
      <div className="flex mb-6 gap-3 items-center flex-wrap">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px]"
          aria-label="Search pull requests"
        />
        {/* Repository filter */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="ghost"
              className="min-w-[160px]"
              aria-label="Repository filter"
            >
              {repoFilter || 'Repository'}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Select repository"
            selectionMode="single"
            selectedKeys={repoFilter ? new Set([repoFilter]) : new Set()}
            onSelectionChange={(keys: any) => {
              const r = firstKey(keys);
              setRepoFilter(r);
              if (r) setAuthorFilter('');
            }}
          >
            <>
              <DropdownItem
                itemKey=""
                role="menuitem"
                onClick={() => setRepoFilter('')}
              >
                All
              </DropdownItem>
              {repos.map((r) => (
                <DropdownItem
                  key={r || 'all-repos'}
                  itemKey={r || 'all-repos'}
                  data-testid={`repo-option-${r}`}
                  role="menuitem"
                  onClick={() => {
                    setRepoFilter(r);
                    setAuthorFilter('');
                  }}
                >
                  {r}
                </DropdownItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
        {/* Author filter */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="ghost"
              className="min-w-[160px]"
              aria-label="Author filter"
            >
              {authorFilter || 'Author'}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Select author"
            selectionMode="single"
            selectedKeys={authorFilter ? new Set([authorFilter]) : new Set()}
            onSelectionChange={(keys: any) => {
              const a = firstKey(keys);
              setAuthorFilter(a);
              if (a) setRepoFilter('');
            }}
          >
            <>
              <DropdownItem
                itemKey=""
                role="menuitem"
                onClick={() => setAuthorFilter('')}
              >
                All
              </DropdownItem>
              {authors.map((a) => (
                <DropdownItem
                  key={a || 'all-authors'}
                  itemKey={a || 'all-authors'}
                  data-testid={`author-option-${a}`}
                  role="menuitem"
                  onClick={() => {
                    setAuthorFilter(a);
                    setRepoFilter('');
                  }}
                >
                  {a}
                </DropdownItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
        {/* Sort field */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="ghost"
              className="min-w-[120px]"
              aria-label="Sort field"
            >
              Sort: {sort}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Select sort field"
            selectionMode="single"
            selectedKeys={new Set([sort])}
            onSelectionChange={(keys: any) => {
              const s = firstKey(keys);
              setSort(s);
              props.onSortChange?.(s);
            }}
          >
            <>
              <DropdownItem
                itemKey="updated"
                role="menuitem"
                onClick={() => {
                  setSort('updated');
                  props.onSortChange?.('updated');
                }}
              >
                updated
              </DropdownItem>
              <DropdownItem
                itemKey="created"
                role="menuitem"
                onClick={() => {
                  setSort('created');
                  props.onSortChange?.('created');
                }}
              >
                created
              </DropdownItem>
              <DropdownItem
                itemKey="comments"
                role="menuitem"
                onClick={() => {
                  setSort('comments');
                  props.onSortChange?.('comments');
                }}
              >
                comments
              </DropdownItem>
            </>
          </DropdownMenu>
        </Dropdown>
        {/* Order */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="ghost"
              className="min-w-[100px]"
              aria-label="Sort order"
            >
              Order: {order}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Select order"
            selectionMode="single"
            selectedKeys={new Set([order])}
            onSelectionChange={(keys: any) => {
              const o = firstKey(keys) as 'asc' | 'desc';
              setOrder(o);
              props.onOrderChange?.(o);
            }}
          >
            <>
              <DropdownItem
                itemKey="desc"
                role="menuitem"
                onClick={() => {
                  setOrder('desc');
                  props.onOrderChange?.('desc');
                }}
              >
                desc
              </DropdownItem>
              <DropdownItem
                itemKey="asc"
                role="menuitem"
                onClick={() => {
                  setOrder('asc');
                  props.onOrderChange?.('asc');
                }}
              >
                asc
              </DropdownItem>
            </>
          </DropdownMenu>
        </Dropdown>
        {/* Page size */}
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="ghost"
              className="min-w-[120px]"
              aria-label="Items per page"
            >
              Per page: {pageSize}
            </Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Select per page"
            selectionMode="single"
            selectedKeys={new Set([String(pageSize)])}
            onSelectionChange={(keys: any) => {
              const v = Number(firstKey(keys));
              if (v) {
                setPageSize(v);
                setPageIndex(1);
                props.onPerPageChange?.(v);
              }
            }}
          >
            <>
              {[10, 20, 30, 40, 50].map((n) => (
                <DropdownItem
                  key={n}
                  itemKey={String(n)}
                  role="menuitem"
                  onClick={() => {
                    setPageSize(n);
                    setPageIndex(1);
                    props.onPerPageChange?.(n);
                  }}
                >
                  {n}
                </DropdownItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
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
      <div style={{ marginBottom: 16 }}>
        <Button
          variant="solid"
          isDisabled={selectedIds.length !== 1}
          aria-label="View pull request"
          onClick={() => {
            const selectedItem = items.find((i) => selectedIds.includes(i.id));
            if (!selectedItem) return;
            navigate(
              `/pr/${selectedItem.owner}/${selectedItem.repo_name}/${selectedItem.number}`,
              {
                state: selectedItem,
              }
            );
          }}
        >
          View pull request
        </Button>
      </div>
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

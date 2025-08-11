import React, { useEffect, useState, useRef } from 'react';
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
  Button,
  Pagination,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Input,
} from '../ui-bridge';
import { Settings2Icon } from 'lucide-react';

export function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return 'N/A';
  const diffMs = new Date(end).getTime() - new Date(start).getTime();
  if (diffMs < 0) return 'N/A';
  const diffHours = Math.floor(diffMs / 36e5);
  const days = Math.floor(diffHours / 24);
  const hours = diffHours % 24;
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

interface MetricsTableProps {
  // Removed query param – component no longer fetches data itself
  queryParams?: QueryParams;
  totalCount?: number; // total results from GitHub (for server-side pagination)
  items: PRItem[]; // externally provided list
  loading?: boolean;
  error?: string | null;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  onSortChange?: (sort: string) => void;
  onOrderChange?: (order: 'asc' | 'desc') => void;
}

export default function MetricsTable({
  queryParams,
  totalCount,
  items,
  loading,
  error,
  onPageChange,
  onPerPageChange,
  onSortChange,
  onOrderChange,
}: MetricsTableProps) {
  const fetchedTotal = null; // no internal fetch anymore
  const effectiveTotal = totalCount ?? fetchedTotal ?? items.length;

  // Log error for now, in the future we can show it in the UI
  if (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load pull request metrics:', error);
  }
  const [search, setSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState<string>('');
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [pageIndex, setPageIndex] = useState<number>(queryParams?.page || 1); // 1-based
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(queryParams?.per_page || 20); // server per_page
  const [sort, setSort] = useState<string>(queryParams?.sort || 'updated');
  const [order, setOrder] = useState<'asc' | 'desc'>(
    (queryParams?.order as 'asc' | 'desc') || 'desc'
  );
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Sync external changes
  useEffect(() => {
    if (queryParams) {
      setPageIndex(queryParams.page || 1);
      setPageSize(queryParams.per_page || 20);
      setSort(queryParams.sort || 'updated');
      setOrder((queryParams.order as 'asc' | 'desc') || 'desc');
    }
  }, [queryParams]);

  const navigate = useNavigate();
  const loadingMessages = [
    'Loading pull requests...',
    'Crunching numbers...',
    'Preparing table...',
  ];

  const repos = Array.from(new Set(items.map((i) => i.repo))).sort();
  const authors = Array.from(new Set(items.map((i) => i.author))).sort();

  // Search & filter
  const filteredItems = items.filter((item) => {
    const queryLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(queryLower) ||
      item.repo.toLowerCase().includes(queryLower) ||
      item.author.toLowerCase().includes(queryLower) ||
      item.reviewers.some((r) => r.toLowerCase().includes(queryLower));
    return (
      matchesSearch &&
      (!repoFilter || item.repo === repoFilter) &&
      (!authorFilter || item.author === authorFilter)
    );
  });

  useEffect(() => {
    setPageIndex(1);
  }, [repoFilter, authorFilter]);

  const paginatedItems = filteredItems; // server-sized already

  const columns = [
    {
      id: 'repo',
      header: 'Repository',
      accessorKey: 'repo',
      rowHeader: true,
    },
    {
      id: 'title',
      header: 'Title',
      cell: (row: PRItem) => (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'none' }}
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
          {row.reviewers.map((name: string, idx: number) => (
            <React.Fragment key={name}>
              <a
                href={`https://github.com/${name}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {name}
              </a>
              {idx < row.reviewers.length - 1 && ', '}
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
          <span style={{ color: 'green' }}>{`+${row.additions}`}</span>{' '}
          <span style={{ color: 'red' }}>{`-${row.deletions}`}</span>
        </span>
      ),
    },
    {
      id: 'comment_count',
      header: 'Comments',
      accessorKey: 'comment_count',
    },
    {
      id: 'timeline',
      header: 'Timeline',
      cell: (row: PRItem) => {
        const created = new Date(row.created_at);
        const published = row.published_at
          ? new Date(row.published_at)
          : created;
        const reviewed = row.first_review_at
          ? new Date(row.first_review_at)
          : published;
        const closed = row.closed_at ? new Date(row.closed_at) : reviewed;
        const draftMs = Math.max(published.getTime() - created.getTime(), 0);
        const reviewMs = Math.max(reviewed.getTime() - published.getTime(), 0);
        const closeMs = Math.max(closed.getTime() - reviewed.getTime(), 0);
        const total = draftMs + reviewMs + closeMs || 1;
        const draftPct = (draftMs / total) * 100;
        const reviewPct = (reviewMs / total) * 100;
        const closePct = (closeMs / total) * 100;
        const tooltipText = [
          `Draft: ${formatDuration(row.created_at, row.published_at)}`,
          `Review: ${formatDuration(row.published_at || row.created_at, row.first_review_at)}`,
          `Close: ${formatDuration(row.first_review_at || row.published_at || row.created_at, row.closed_at)}`,
        ].join('\n');
        return (
          <div aria-label={tooltipText} className="flex items-center w-24">
            <div className="flex w-full gap-0.5">
              <div
                className="h-2 rounded-l bg-success"
                style={{ width: `${draftPct}%` }}
                title={`Draft: ${formatDuration(row.created_at, row.published_at)}`}
              />
              <div
                className="h-2 bg-warning"
                style={{ width: `${reviewPct}%` }}
                title={`Review: ${formatDuration(row.published_at || row.created_at, row.first_review_at)}`}
              />
              <div
                className="h-2 rounded-r bg-primary"
                style={{ width: `${closePct}%` }}
                title={`Close: ${formatDuration(row.first_review_at || row.published_at || row.created_at, row.closed_at)}`}
              />
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

  const allColumns = columns;
  const defaultVisibleColumns = allColumns.map((col) => col.id);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultVisibleColumns
  );

  const handleRepoFilterChange = (repo: string) => {
    setRepoFilter(repo);
    setAuthorFilter('');
  };
  const handleAuthorFilterChange = (author: string) => {
    setAuthorFilter(author);
    setRepoFilter('');
  };
  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    onSortChange?.(newSort);
  };
  const handleOrderChange = (newOrder: 'asc' | 'desc') => {
    setOrder(newOrder);
    onOrderChange?.(newOrder);
  };
  const handlePerPageChange = (newSize: number) => {
    setPageSize(newSize);
    setPageIndex(1);
    onPerPageChange?.(newSize);
  };

  const extractFirstKey = (keys: any): string => {
    if (!keys) return '';
    if (typeof keys === 'string') return keys;
    if (Array.isArray(keys)) return keys[0];
    if (keys instanceof Set) return Array.from(keys)[0] as string;
    if (typeof keys === 'object' && 'currentKey' in keys)
      return (keys as any).currentKey as string;
    return '';
  };

  const totalPages = Math.max(1, Math.ceil(effectiveTotal / pageSize));
  const handlePageChange = (newPage: number) => {
    setPageIndex(newPage);
    onPageChange?.(newPage);
  };
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  if (loading) {
    return <LoadingOverlay show={loading} messages={loadingMessages} />;
  }

  return (
    <div ref={tableContainerRef} style={{ width: '100%' }}>
      <div className="flex mb-6 gap-3 items-center flex-wrap">
        <Input
          clearable
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px]"
          aria-label="Search pull requests"
        />
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
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
            onSelectionChange={(keys: any) =>
              handleRepoFilterChange(extractFirstKey(keys))
            }
          >
            <>
              {/* All option: empty key resets filter */}
              <DropdownItem
                itemKey=""
                role="menuitem"
                onClick={() => handleRepoFilterChange('')}
              >
                All
              </DropdownItem>
              {repos.map((r) => (
                <DropdownItem
                  key={r || 'all-repos'}
                  itemKey={r || 'all-repos'}
                  data-testid={`repo-option-${r}`}
                  role="menuitem"
                  onClick={() => handleRepoFilterChange(r)}
                >
                  {r}
                </DropdownItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
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
            onSelectionChange={(keys: any) =>
              handleAuthorFilterChange(extractFirstKey(keys))
            }
          >
            <>
              <DropdownItem
                itemKey=""
                role="menuitem"
                onClick={() => handleAuthorFilterChange('')}
              >
                All
              </DropdownItem>
              {authors.map((a) => (
                <DropdownItem
                  key={a || 'all-authors'}
                  itemKey={a || 'all-authors'}
                  data-testid={`author-option-${a}`}
                  role="menuitem"
                  onClick={() => handleAuthorFilterChange(a)}
                >
                  {a}
                </DropdownItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
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
            onSelectionChange={(keys: any) =>
              handleSortChange(extractFirstKey(keys))
            }
          >
            <>
              <DropdownItem
                itemKey="updated"
                role="menuitem"
                onClick={() => handleSortChange('updated')}
              >
                updated
              </DropdownItem>
              <DropdownItem
                itemKey="created"
                role="menuitem"
                onClick={() => handleSortChange('created')}
              >
                created
              </DropdownItem>
              <DropdownItem
                itemKey="comments"
                role="menuitem"
                onClick={() => handleSortChange('comments')}
              >
                comments
              </DropdownItem>
            </>
          </DropdownMenu>
        </Dropdown>
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
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
            onSelectionChange={(keys: any) =>
              handleOrderChange(extractFirstKey(keys) as 'asc' | 'desc')
            }
          >
            <>
              <DropdownItem
                itemKey="desc"
                role="menuitem"
                onClick={() => handleOrderChange('desc')}
              >
                desc
              </DropdownItem>
              <DropdownItem
                itemKey="asc"
                role="menuitem"
                onClick={() => handleOrderChange('asc')}
              >
                asc
              </DropdownItem>
            </>
          </DropdownMenu>
        </Dropdown>
        <Dropdown>
          <DropdownTrigger>
            <Button
              variant="flat"
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
            onSelectionChange={(keys: any) =>
              handlePerPageChange(Number(extractFirstKey(keys)))
            }
          >
            <>
              {[10, 20, 30, 40, 50].map((n) => (
                <DropdownItem
                  key={n}
                  itemKey={String(n)}
                  role="menuitem"
                  onClick={() => handlePerPageChange(n)}
                >
                  {n}
                </DropdownItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="light" aria-label="Choose columns">
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
                  {col.header}
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
              { state: selectedItem }
            );
          }}
        >
          View pull request
        </Button>
      </div>
      <Table
        aria-label="PR Metrics Table"
        data-testid="metrics-table"
        isStriped
      >
        <TableHeader>
          {columns
            .filter((col) => visibleColumns.includes(col.id))
            .map((col) => (
              <TableColumn key={col.id}>{col.header.toUpperCase()}</TableColumn>
            ))}
        </TableHeader>
        <TableBody
          items={paginatedItems}
          emptyContent={<span>No pull requests found.</span>}
        >
          {(row: PRItem) => (
            <TableRow
              key={row.id} // ensure stable unique key
              onClick={() => toggleSelect(row.id)}
              className={selectedIds.includes(row.id) ? 'bg-accent/40' : ''}
            >
              {columns
                .filter((col) => visibleColumns.includes(col.id))
                .map((col) => (
                  <TableCell key={col.id} data-testid={`cell-${col.id}`}>
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                        ? (row as any)[col.accessorKey]
                        : null}
                  </TableCell>
                ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex justify-center">
        <Pagination
          data-testid="pagination"
          aria-label="Pagination"
          total={totalPages}
          page={pageIndex}
          onChange={handlePageChange}
          size="sm"
          className="mt-4"
        />
      </div>
    </div>
  );
}

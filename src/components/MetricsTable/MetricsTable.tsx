import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePullRequestMetrics } from '../../hooks/usePullRequestMetrics';
import { PRItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext/AuthContext';
import LoadingOverlay from '../LoadingOverlay/LoadingOverlay';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Select, SelectItem, Pagination, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Input } from '@heroui/react';
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

export default function MetricsTable() {
  const { token } = useAuth();
  const { items, loading } = usePullRequestMetrics(token!);
  const [search, setSearch] = useState('');
  const [repoFilter, setRepoFilter] = useState<string>('');
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [pageIndex, setPageIndex] = useState<number>(1); // 1-based for Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState<number>(20); // Dynamic page size
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const ROW_HEIGHT = 48;
  const PAGINATION_HEIGHT = 64;

  const navigate = useNavigate();
  const loadingMessages = [
    'Loading pull requests...',
    'Crunching numbers...',
    'Preparing table...',
  ];

  const repos = Array.from(new Set(items.map((i) => i.repo))).sort();
  const authors = Array.from(new Set(items.map((i) => i.author))).sort();

  // Search and filter logic
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.repo.toLowerCase().includes(search.toLowerCase()) ||
      item.author.toLowerCase().includes(search.toLowerCase()) ||
      item.reviewers.some((r) => r.toLowerCase().includes(search.toLowerCase()));
    return (
      matchesSearch &&
      (!repoFilter || item.repo === repoFilter) &&
      (!authorFilter || item.author === authorFilter)
    );
  });

  useEffect(() => {
    setPageIndex(1);
  }, [repoFilter, authorFilter]);

  useEffect(() => {
    function updatePageSize() {
      if (tableContainerRef.current) {
        const containerRect = tableContainerRef.current.getBoundingClientRect();
        // Calculate available height from the bottom of filters to the bottom of the viewport
        const availableHeight = window.innerHeight - containerRect.top - PAGINATION_HEIGHT - 24; // 24px margin
        const rows = Math.max(1, Math.floor(availableHeight / ROW_HEIGHT));
        setPageSize(rows);
      }
    }
    updatePageSize();
    window.addEventListener('resize', updatePageSize);
    return () => window.removeEventListener('resize', updatePageSize);
  }, []);

  const paginatedItems = filteredItems.slice(
    (pageIndex - 1) * pageSize,
    pageIndex * pageSize
  );

  const selectedItem = items.find((i) => selectedIds.includes(i.id));

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

        const tooltipText = [
          `Draft: ${formatDuration(row.created_at, row.published_at)}`,
          `Review: ${formatDuration(
            row.published_at || row.created_at,
            row.first_review_at
          )}`,
          `Close: ${formatDuration(
            row.first_review_at || row.published_at || row.created_at,
            row.closed_at
          )}`,
        ].join('\n');

        return (
          <div
            aria-label={tooltipText}
            style={{
              display: 'flex',
              height: '6px',
              width: 80,
              overflow: 'hidden',
              borderRadius: 4,
            }}
          >
            <div
              style={{
                backgroundColor: '#d1e7dd',
                width: `${(draftMs / total) * 100}%`,
              }}
            />
            <div
              style={{
                backgroundColor: '#fff3cd',
                width: `${(reviewMs / total) * 100}%`,
              }}
            />
            <div
              style={{
                backgroundColor: '#cce5ff',
                width: `${(closeMs / total) * 100}%`,
              }}
            />
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

  // --- Visible Columns State ---
  const allColumns = columns;
  const defaultVisibleColumns = allColumns.map((col) => col.id);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(defaultVisibleColumns);

  const handleRepoFilterChange = (repo: string) => {
    setRepoFilter(repo);
    setAuthorFilter(''); // Reset author filter when repo changes
  };
  const handleAuthorFilterChange = (author: string) => {
    setAuthorFilter(author);
    setRepoFilter(''); // Reset repo filter when author changes
  };

  if (loading) {
    return <LoadingOverlay show={loading} messages={loadingMessages} />;
  }

  return (
    <div ref={tableContainerRef} style={{ width: '100%' }}>
      <div className="flex mb-6 gap-3 items-center">
        <Input
          isClearable
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px]"
        />
        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" className="min-w-[160px]" aria-label="Repository">{repoFilter || 'Repository'}</Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Select repository"
            selectionMode="single"
            selectedKeys={repoFilter ? [repoFilter] : []}
            onSelectionChange={(keys) => handleRepoFilterChange(Array.from(keys)[0] as string)}
          >
            <>
              <DropdownItem key="">All</DropdownItem>
              {repos.map((r) => (
                <DropdownItem key={r || 'all-repos'}>{r}</DropdownItem>
              ))}
            </>
          </DropdownMenu>
        </Dropdown>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat" className="min-w-[160px]" aria-label="Author">{authorFilter || 'Author'}</Button>
          </DropdownTrigger>
          <DropdownMenu
            aria-label="Select author"
            selectionMode="single"
            selectedKeys={authorFilter ? [authorFilter] : []}
            onSelectionChange={(keys) => handleAuthorFilterChange(Array.from(keys)[0] as string)}
          >
            <>
              <DropdownItem key="">All</DropdownItem>
              {authors.map((a) => (
                <DropdownItem key={a || 'all-authors'}>{a}</DropdownItem>
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
            onSelectionChange={(keys) => setVisibleColumns(Array.from(keys as Set<string>))}
          >
            {allColumns.map((col) => (
              <DropdownItem key={col.id}>{col.header}</DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </div>
      {selectedIds.length === 1 && (
        <div style={{ marginBottom: 16 }}>
          <Button
            color="primary"
            onClick={() =>
              navigate(
                `/pr/${selectedItem!.owner}/${selectedItem!.repo_name}/${selectedItem!.number}`,
                { state: selectedItem }
              )
            }
          >
            View pull request
          </Button>
        </div>
      )}
      <Table
        aria-label="PR Metrics Table"
        selectionMode="multiple"
        selectedKeys={new Set(selectedIds)}
        onSelectionChange={(keys) => setSelectedIds(Array.from(keys as Set<string>))}
        isStriped
        fullWidth
        bottomContent={
          <Pagination
            total={Math.ceil(filteredItems.length / pageSize)}
            page={pageIndex}
            onChange={setPageIndex}
            size="sm"
            className="mt-4"
          />
        }
        bottomContentPlacement="inside"
      >
        <TableHeader>
          {allColumns.filter(col => visibleColumns.includes(col.id)).map(col => (
            <TableColumn key={col.id}>{col.header.toUpperCase()}</TableColumn>
          ))}
        </TableHeader>
        <TableBody items={paginatedItems} emptyContent={<span>No pull requests found.</span>}>
          {(row: PRItem) => (
            <TableRow key={row.id || row.title || row.repo}>
              {allColumns.filter(col => visibleColumns.includes(col.id)).map(col => (
                <TableCell key={col.id}>
                  {col.cell
                    ? col.cell(row)
                    : (col.accessorKey ? (row as any)[col.accessorKey] : null)}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

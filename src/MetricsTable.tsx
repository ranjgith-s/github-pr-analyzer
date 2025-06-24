import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePullRequestMetrics } from './hooks/usePullRequestMetrics';
import { PRItem } from './types';
import { useAuth } from './AuthContext';
import LoadingOverlay from './LoadingOverlay';
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Select, SelectItem, Pagination } from '@heroui/react';

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
  const [repoFilter, setRepoFilter] = useState<string>('');
  const [authorFilter, setAuthorFilter] = useState<string>('');
  const [pageIndex, setPageIndex] = useState<number>(1); // 1-based for Pagination
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const PAGE_SIZE = 25;
  const navigate = useNavigate();
  const loadingMessages = [
    'Loading pull requests...',
    'Crunching numbers...',
    'Preparing table...',
  ];

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const repos = Array.from(new Set(items.map((i) => i.repo))).sort();
  const authors = Array.from(new Set(items.map((i) => i.author))).sort();

  const filteredItems = items.filter((item) => {
    return (
      (!repoFilter || item.repo === repoFilter) &&
      (!authorFilter || item.author === authorFilter)
    );
  });

  useEffect(() => {
    setPageIndex(1);
  }, [repoFilter, authorFilter]);

  const paginatedItems = filteredItems.slice(
    (pageIndex - 1) * PAGE_SIZE,
    pageIndex * PAGE_SIZE
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

  if (loading) {
    return <LoadingOverlay show={loading} messages={loadingMessages} />;
  }

  return (
    <>
      <div style={{ display: 'flex', marginBottom: 24, gap: 12 }}>
        <div>
          <label htmlFor="repo-filter">Repository</label>
          <Select
            id="repo-filter"
            selectedKeys={repoFilter ? [repoFilter] : []}
            onSelectionChange={(keys) => setRepoFilter(Array.from(keys)[0] as string)}
            aria-label="Repository"
            style={{ minWidth: 160 }}
          >
            <>
              <SelectItem key="">All</SelectItem>
              {repos.map((r) => (
                <SelectItem key={r}>{r}</SelectItem>
              ))}
            </>
          </Select>
        </div>
        <div>
          <label htmlFor="author-filter">Author</label>
          <Select
            id="author-filter"
            selectedKeys={authorFilter ? [authorFilter] : []}
            onSelectionChange={(keys) => setAuthorFilter(Array.from(keys)[0] as string)}
            aria-label="Author"
            style={{ minWidth: 160 }}
          >
            <>
              <SelectItem key="">All</SelectItem>
              {authors.map((a) => (
                <SelectItem key={a}>{a}</SelectItem>
              ))}
            </>
          </Select>
        </div>
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
            total={Math.ceil(filteredItems.length / PAGE_SIZE)}
            page={pageIndex}
            onChange={setPageIndex}
            showControls
            size="sm"
            className="mt-4"
          />
        }
        bottomContentPlacement="inside"
      >
        <TableHeader>
          <TableColumn key="repo">REPOSITORY</TableColumn>
          <TableColumn key="title">TITLE</TableColumn>
          <TableColumn key="author">AUTHOR</TableColumn>
          <TableColumn key="reviewers">REVIEWERS</TableColumn>
          <TableColumn key="changes_requested">CHANGES REQUESTED</TableColumn>
          <TableColumn key="diff">DIFF</TableColumn>
          <TableColumn key="comment_count">COMMENTS</TableColumn>
          <TableColumn key="timeline">TIMELINE</TableColumn>
          <TableColumn key="lead_time">LEAD TIME</TableColumn>
          <TableColumn key="state">STATE</TableColumn>
        </TableHeader>
        <TableBody items={paginatedItems} emptyContent={<span>No pull requests found.</span>}>
          {(row: PRItem) => (
            <TableRow key={row.id}>
              <TableCell>{row.repo}</TableCell>
              <TableCell>
                <a
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  {row.title}
                </a>
              </TableCell>
              <TableCell>
                <a
                  href={`https://github.com/${row.author}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {row.author}
                </a>
              </TableCell>
              <TableCell>
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
              </TableCell>
              <TableCell>{row.changes_requested}</TableCell>
              <TableCell>
                <span>
                  <span style={{ color: 'green' }}>{`+${row.additions}`}</span>{' '}
                  <span style={{ color: 'red' }}>{`-${row.deletions}`}</span>
                </span>
              </TableCell>
              <TableCell>{row.comment_count}</TableCell>
              <TableCell>
                {(() => {
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
                })()}
              </TableCell>
              <TableCell>{formatDuration(row.first_commit_at, row.closed_at)}</TableCell>
              <TableCell>{row.state}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </>
  );
}

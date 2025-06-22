import React, { useEffect, useState } from 'react';
// Table components provided by HeroUI
import { DataTable, Table } from './simple-table';
import { Select, Link, Button, Tooltip } from '@heroui/react';
import { Box, Text, StateLabel } from './primer-shim';
import { useNavigate } from 'react-router-dom';
import { usePullRequestMetrics } from './hooks/usePullRequestMetrics';
import { PRItem } from './types';
import { useAuth } from './AuthContext';
import LoadingOverlay from './LoadingOverlay';

export function formatDuration(start?: string | null, end?: string | null) {
  if (!start || !end) return 'N/A';
  const diffMs = new Date(end) - new Date(start);
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
  const [pageIndex, setPageIndex] = useState<number>(0);
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
    setPageIndex(0);
  }, [repoFilter, authorFilter]);

  const paginatedItems = filteredItems.slice(
    pageIndex * PAGE_SIZE,
    pageIndex * PAGE_SIZE + PAGE_SIZE
  );

  const selectedItem = items.find((i) => selectedIds.includes(i.id));

  const columns = [
    {
      id: 'select',
      header: '',
      cell: (row: PRItem) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
        />
      ),
    },
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
        <Link
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: 'fg.default',
            textDecoration: 'none',
            '&:hover': { color: 'accent.fg', textDecoration: 'underline' },
          }}
        >
          {row.title}
        </Link>
      ),
    },
    {
      id: 'author',
      header: 'Author',
      cell: (row: PRItem) => (
        <Link
          href={`https://github.com/${row.author}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          {row.author}
        </Link>
      ),
    },
    {
      id: 'reviewers',
      header: 'Reviewers',
      cell: (row: PRItem) => (
        <>
          {row.reviewers.map((name: string, idx: number) => (
            <React.Fragment key={name}>
              <Link
                href={`https://github.com/${name}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {name}
              </Link>
              {idx < row.reviewers.length - 1 && ', '}
            </React.Fragment>
          ))}
        </>
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
        <Text as="span">
          <Text as="span" color="success.fg">{`+${row.additions}`}</Text>{' '}
          <Text as="span" color="danger.fg">{`-${row.deletions}`}</Text>
        </Text>
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
          <Tooltip aria-label={tooltipText} direction="s">
            <Box
              display="flex"
              height="6px"
              width={80}
              sx={{ overflow: 'hidden', borderRadius: 1 }}
            >
              <Box
                bg="accent.emphasis"
                style={{ width: `${(draftMs / total) * 100}%` }}
              />
              <Box
                bg="attention.emphasis"
                style={{ width: `${(reviewMs / total) * 100}%` }}
              />
              <Box
                bg="success.emphasis"
                style={{ width: `${(closeMs / total) * 100}%` }}
              />
            </Box>
          </Tooltip>
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
      cell: (row: PRItem) => {
        const statusMap = {
          open: 'pullOpened',
          closed: 'pullClosed',
          merged: 'pullMerged',
          draft: 'draft',
        };
        return (
          <StateLabel status={statusMap[row.state]}>{row.state}</StateLabel>
        );
      },
    },
  ];

  if (loading) {
    return <LoadingOverlay show={loading} messages={loadingMessages} />;
  }

  return (
    <>
      <Box display="flex" marginBottom={3} sx={{ gap: 3 }}>
        <Select
          id="repo-filter"
          label="Repository"
          value={repoFilter}
          onChange={(e) => setRepoFilter(e.target.value)}
        >
          <Select.Option value="">All</Select.Option>
          {repos.map((r) => (
            <Select.Option key={r} value={r}>
              {r}
            </Select.Option>
          ))}
        </Select>
        <Select
          id="author-filter"
          label="Author"
          value={authorFilter}
          onChange={(e) => setAuthorFilter(e.target.value)}
        >
          <Select.Option value="">All</Select.Option>
          {authors.map((a) => (
            <Select.Option key={a} value={a}>
              {a}
            </Select.Option>
          ))}
        </Select>
      </Box>
      {selectedIds.length === 1 && (
        <Box marginBottom={2}>
          <Button
            onClick={() =>
              navigate(
                `/pr/${selectedItem!.owner}/${selectedItem!.repo_name}/${selectedItem!.number}`,
                { state: selectedItem }
              )
            }
          >
            View pull request
          </Button>
        </Box>
      )}
      <DataTable
        aria-labelledby="pr-table"
        columns={columns}
        data={paginatedItems}
        cellPadding="condensed"
      />
      <Table.Pagination
        aria-label="Pagination"
        page={pageIndex + 1}
        pages={Math.ceil(filteredItems.length / PAGE_SIZE)}
        onPageChange={(page: number) => setPageIndex(page - 1)}
      />
    </>
  );
}

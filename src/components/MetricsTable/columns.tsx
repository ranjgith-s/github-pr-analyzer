import React from 'react';
import { PRItem } from '../../types';
import { ColumnDef as RTColumnDef } from '@tanstack/react-table';
import TimelineBar from './TimelineBar';
import DiffCell from './DiffCell';
import UserAvatar from '../UserAvatar/UserAvatar';
import { Chip } from '../ui';

export const stateToChipColor = (
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

const toTime = (d?: string | null) => (d ? new Date(d).getTime() : 0);

export const getTimelineTotal = (row: PRItem) => {
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

export const getLeadTime = (row: PRItem) => {
  const s = row.first_commit_at ? new Date(row.first_commit_at) : null;
  const e = row.closed_at ? new Date(row.closed_at) : null;
  return s && e ? e.getTime() - s.getTime() : 0;
};

export interface UIColumnDef<Row> {
  id: string;
  header: string | React.ReactNode;
  accessorKey?: keyof Row & string;
  cell?: (row: Row) => React.ReactNode;
}

export const getUIColumns = (
  selectedIds: string[],
  toggleSelect: (id: string) => void
): UIColumnDef<PRItem>[] => [
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
];

export const rtColumns: RTColumnDef<PRItem>[] = [
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
];

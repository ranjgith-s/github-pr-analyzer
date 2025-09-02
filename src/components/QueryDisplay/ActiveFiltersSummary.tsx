import React from 'react';
import { Chip } from '../ui';
import { FilterState } from '../../utils/queryBuilder';

export interface ActiveFiltersSummaryProps {
  filters: FilterState;
  hideClearAll?: boolean;
  onRemoveAuthor: (index: number) => void;
  onRemoveReviewer: (index: number) => void;
  onRemoveAssignee: (index: number) => void;
  onRemoveInvolves: (index: number) => void;
  onRemoveRepository: (index: number) => void;
  onRemoveLabel: (index: number) => void;
  onResetState: () => void;
  onResetDraft: () => void;
  onClearCreatedStart: () => void;
  onClearCreatedEnd: () => void;
  onClearUpdatedStart: () => void;
  onClearUpdatedEnd: () => void;
  onClearAll?: () => void;
}

const fmt = (d?: Date) => (d ? d.toISOString().split('T')[0] : '');

export const ActiveFiltersSummary: React.FC<ActiveFiltersSummaryProps> = ({
  filters,
  hideClearAll,
  onRemoveAuthor,
  onRemoveReviewer,
  onRemoveAssignee,
  onRemoveInvolves,
  onRemoveRepository,
  onRemoveLabel,
  onResetState,
  onResetDraft,
  onClearCreatedStart,
  onClearCreatedEnd,
  onClearUpdatedStart,
  onClearUpdatedEnd,
  onClearAll,
}) => {
  const [collapsed, setCollapsed] = React.useState(true);
  const MAX_VISIBLE = 8;

  // Build a flat list of chip renderers so we can collapse/expand cleanly
  const items: Array<React.ReactNode> = [];
  const shouldShow =
    filters.authors.length > 0 ||
    filters.reviewers.length > 0 ||
    filters.assignees.length > 0 ||
    filters.involves.length > 0 ||
    filters.repositories.length > 0 ||
    filters.labels.length > 0 ||
    filters.state !== 'all' ||
    filters.isDraft !== null ||
    !!filters.dateRange.created?.start ||
    !!filters.dateRange.created?.end ||
    !!filters.dateRange.updated?.start ||
    !!filters.dateRange.updated?.end;

  if (!shouldShow) return null;

  const pushMany = (
    arr: string[],
    render: (value: string, index: number) => React.ReactNode
  ) => {
    arr.forEach((v, i) => items.push(render(v, i)));
  };

  pushMany(filters.authors, (author, index) => (
    <Chip
      key={`active-author-${index}`}
      onClose={() => onRemoveAuthor(index)}
      variant="flat"
      color="primary"
      size="sm"
      className="text-xs"
      data-testid="chip"
    >
      Author: {author}
    </Chip>
  ));

  pushMany(filters.reviewers, (reviewer, index) => (
    <Chip
      key={`active-reviewer-${index}`}
      onClose={() => onRemoveReviewer(index)}
      variant="flat"
      color="secondary"
      size="sm"
      className="text-xs"
      data-testid="chip"
    >
      Reviewer: {reviewer}
    </Chip>
  ));

  pushMany(filters.assignees, (assignee, index) => (
    <Chip
      key={`active-assignee-${index}`}
      onClose={() => onRemoveAssignee(index)}
      variant="flat"
      color="default"
      size="sm"
      className="text-xs"
      data-testid="chip"
    >
      Assignee: {assignee}
    </Chip>
  ));

  pushMany(filters.involves, (user, index) => (
    <Chip
      key={`active-involves-${index}`}
      onClose={() => onRemoveInvolves(index)}
      variant="flat"
      color="primary"
      size="sm"
      className="text-xs"
      data-testid="chip"
    >
      Involves: {user}
    </Chip>
  ));

  pushMany(filters.repositories, (repo, index) => (
    <Chip
      key={`active-repo-${index}`}
      onClose={() => onRemoveRepository(index)}
      variant="flat"
      color="success"
      size="sm"
      className="text-xs"
      data-testid="chip"
    >
      Repo: {repo}
    </Chip>
  ));

  pushMany(filters.labels, (label, index) => (
    <Chip
      key={`active-label-${index}`}
      onClose={() => onRemoveLabel(index)}
      variant="flat"
      color="warning"
      size="sm"
      className="text-xs"
      data-testid="chip"
    >
      Label: {label}
    </Chip>
  ));

  if (filters.state !== 'all') {
    items.push(
      <Chip
        key={`active-state`}
        onClose={onResetState}
        variant="flat"
        color="default"
        size="sm"
        className="text-xs"
        data-testid="chip"
      >
        State: {filters.state}
      </Chip>
    );
  }

  if (filters.isDraft !== null) {
    items.push(
      <Chip
        key={`active-draft`}
        onClose={onResetDraft}
        variant="flat"
        color="default"
        size="sm"
        className="text-xs"
        data-testid="chip"
      >
        Draft: {filters.isDraft ? 'Yes' : 'No'}
      </Chip>
    );
  }

  if (filters.dateRange.created?.start) {
    items.push(
      <Chip
        key={`active-created-start`}
        onClose={onClearCreatedStart}
        variant="flat"
        color="default"
        size="sm"
        className="text-xs"
        data-testid="chip"
      >
        Created after: {fmt(filters.dateRange.created.start)}
      </Chip>
    );
  }
  if (filters.dateRange.created?.end) {
    items.push(
      <Chip
        key={`active-created-end`}
        onClose={onClearCreatedEnd}
        variant="flat"
        color="default"
        size="sm"
        className="text-xs"
        data-testid="chip"
      >
        Created before: {fmt(filters.dateRange.created.end)}
      </Chip>
    );
  }
  if (filters.dateRange.updated?.start) {
    items.push(
      <Chip
        key={`active-updated-start`}
        onClose={onClearUpdatedStart}
        variant="flat"
        color="default"
        size="sm"
        className="text-xs"
        data-testid="chip"
      >
        Updated after: {fmt(filters.dateRange.updated.start)}
      </Chip>
    );
  }
  if (filters.dateRange.updated?.end) {
    items.push(
      <Chip
        key={`active-updated-end`}
        onClose={onClearUpdatedEnd}
        variant="flat"
        color="default"
        size="sm"
        className="text-xs"
        data-testid="chip"
      >
        Updated before: {fmt(filters.dateRange.updated.end)}
      </Chip>
    );
  }

  const total = items.length;
  const visibleItems = collapsed ? items.slice(0, MAX_VISIBLE) : items;
  const remaining = total - visibleItems.length;

  return (
    <div className="bg-default-50 rounded-lg p-3 w-full flex gap-2 justify-between">
      <div className="flex flex-wrap gap-1.5">{visibleItems}</div>
      <div className="flex items-center gap-2">
        {total > MAX_VISIBLE && (
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setCollapsed((v) => !v)}
          >
            {collapsed ? `Show ${remaining} more` : 'Show less'}
          </button>
        )}
        {!hideClearAll && onClearAll && total > 0 && (
          <button
            type="button"
            className="text-xs text-danger hover:underline"
            onClick={onClearAll}
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
};

ActiveFiltersSummary.displayName = 'ActiveFiltersSummary';

export default ActiveFiltersSummary;

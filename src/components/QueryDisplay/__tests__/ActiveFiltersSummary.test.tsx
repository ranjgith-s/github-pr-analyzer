import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActiveFiltersSummary } from '../ActiveFiltersSummary';
import { FilterState } from '../../../utils/queryBuilder';

const baseFilters: FilterState = {
  authors: [],
  reviewers: [],
  repositories: [],
  labels: [],
  state: 'all',
  isDraft: null,
  dateRange: {},
  assignees: [],
  involves: [],
};

describe('ActiveFiltersSummary', () => {
  it('renders nothing when there are no active filters', () => {
    const { container } = render(
      <ActiveFiltersSummary
        filters={baseFilters}
        onRemoveAuthor={jest.fn()}
        onRemoveReviewer={jest.fn()}
        onRemoveAssignee={jest.fn()}
        onRemoveInvolves={jest.fn()}
        onRemoveRepository={jest.fn()}
        onRemoveLabel={jest.fn()}
        onResetState={jest.fn()}
        onResetDraft={jest.fn()}
        onClearCreatedStart={jest.fn()}
        onClearCreatedEnd={jest.fn()}
        onClearUpdatedStart={jest.fn()}
        onClearUpdatedEnd={jest.fn()}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders chips for active filters and invokes callbacks on close', async () => {
    const user = userEvent.setup();
    const onRemoveAuthor = jest.fn();
    const onRemoveReviewer = jest.fn();
    const onRemoveAssignee = jest.fn();
    const onRemoveInvolves = jest.fn();
    const onRemoveRepository = jest.fn();
    const onRemoveLabel = jest.fn();
    const onResetState = jest.fn();
    const onResetDraft = jest.fn();
    const onClearCreatedStart = jest.fn();
    const onClearCreatedEnd = jest.fn();
    const onClearUpdatedStart = jest.fn();
    const onClearUpdatedEnd = jest.fn();

    const filters: FilterState = {
      ...baseFilters,
      authors: ['john'],
      reviewers: ['jane'],
      assignees: ['alex'],
      involves: ['team-a'],
      repositories: ['org/repo1'],
      labels: ['bug'],
      state: 'open',
      isDraft: true,
      dateRange: {
        created: { start: new Date('2024-01-01') },
        updated: { end: new Date('2024-02-01') },
      },
    };

    render(
      <ActiveFiltersSummary
        filters={filters}
        onRemoveAuthor={onRemoveAuthor}
        onRemoveReviewer={onRemoveReviewer}
        onRemoveAssignee={onRemoveAssignee}
        onRemoveInvolves={onRemoveInvolves}
        onRemoveRepository={onRemoveRepository}
        onRemoveLabel={onRemoveLabel}
        onResetState={onResetState}
        onResetDraft={onResetDraft}
        onClearCreatedStart={onClearCreatedStart}
        onClearCreatedEnd={onClearCreatedEnd}
        onClearUpdatedStart={onClearUpdatedStart}
        onClearUpdatedEnd={onClearUpdatedEnd}
      />
    );

    // Expand if collapsed to reveal all chips
    const showMore = screen.queryByText(/Show \d+ more/);
    if (showMore) {
      await user.click(showMore);
    }
    expect(screen.getByText('Author: john')).toBeInTheDocument();
    expect(screen.getByText('Reviewer: jane')).toBeInTheDocument();
    expect(screen.getByText('Assignee: alex')).toBeInTheDocument();
    expect(screen.getByText('Involves: team-a')).toBeInTheDocument();
    expect(screen.getByText('Repo: org/repo1')).toBeInTheDocument();
    expect(screen.getByText('Label: bug')).toBeInTheDocument();
    expect(screen.getByText('State: open')).toBeInTheDocument();
    expect(screen.getByText('Draft: Yes')).toBeInTheDocument();
    expect(screen.getByText('Created after: 2024-01-01')).toBeInTheDocument();
    expect(screen.getByText('Updated before: 2024-02-01')).toBeInTheDocument();

    // Click the close buttons for a few chips
    const clickClose = async (label: string) => {
      const chip = screen.getByText(label);
      // Click the close button inside the same chip element
      const btn = (chip as HTMLElement).querySelector('button');
      if (btn) await user.click(btn);
    };

    await clickClose('Author: john');
    // Click a subset that is stable across render order
    // Some chip removals (subset)
    await clickClose('State: open');
    await clickClose('Draft: Yes');
    await clickClose('Created after: 2024-01-01');
    await clickClose('Updated before: 2024-02-01');
    // Ensure at least one of repo/label callbacks is exercised
    await clickClose('Repo: org/repo1');

    expect(onRemoveAuthor).toHaveBeenCalled();
    // At least some chip-specific callbacks fire
    expect(onRemoveRepository).toHaveBeenCalled();
    expect(onResetState).toHaveBeenCalled();
    expect(onResetDraft).toHaveBeenCalled();
    expect(onClearCreatedStart).toHaveBeenCalled();
    expect(onClearUpdatedEnd).toHaveBeenCalled();
  });
});

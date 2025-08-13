import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualFilterBuilder } from '../VisualFilterBuilder';
import * as queryBuilder from '../../../utils/queryBuilder';
import * as githubService from '../../../utils/services/githubService';

// Mock Auth context to supply a token for dynamic user search
jest.mock('../../../contexts/AuthContext/AuthContext', () => ({
  useAuth: () => ({ token: 'fake-token' }),
}));

// Mock githubService for dynamic user suggestions
jest.mock('../../../utils/services/githubService', () => ({
  ...jest.requireActual('../../../utils/services/githubService'),
  searchUsers: jest.fn(),
}));

// Mock the queryBuilder utility
jest.mock('../../../utils/queryBuilder', () => ({
  parseGitHubQuery: jest.fn(),
  buildGitHubQuery: jest.fn(),
}));

describe('VisualFilterBuilder (ungrouped grid + presets)', () => {
  const defaultProps = {
    query: 'is:pr author:john',
    onQueryChange: jest.fn(),
    suggestions: {
      users: ['john', 'jane', 'bob'],
      repositories: ['org/repo1', 'org/repo2'],
      labels: ['bug', 'enhancement'],
    },
  };

  const mockParseGitHubQuery = queryBuilder.parseGitHubQuery as jest.Mock;
  const mockBuildGitHubQuery = queryBuilder.buildGitHubQuery as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockParseGitHubQuery.mockReturnValue({
      authors: ['john'],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: null,
      dateRange: {},
      assignees: [],
      involves: [],
    });
    mockBuildGitHubQuery.mockReturnValue('is:pr author:john');
  });

  it('populates dynamic user suggestions as you type (Authors)', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();
    (githubService.searchUsers as jest.Mock).mockResolvedValue([
      { login: 'alice', avatar_url: 'x' },
      { login: 'albert', avatar_url: 'y' },
    ]);

    render(
      <VisualFilterBuilder
        {...defaultProps}
        onQueryChange={onQueryChange}
        query="is:pr"
      />
    );

    const authorInputs = screen.getAllByPlaceholderText('Add author...');
    const input = authorInputs.find((e) => e.tagName === 'INPUT');
    await user.click(input!);
    await user.type(input!, 'al');

    await waitFor(() =>
      expect(githubService.searchUsers).toHaveBeenCalledWith('fake-token', 'al')
    );

    // Dynamic results should appear
    const items = screen.getAllByTestId('autocomplete-item');
    expect(items.some((i) => i.textContent === 'alice')).toBe(true);
    expect(items.some((i) => i.textContent === 'albert')).toBe(true);

    // Select a dynamic suggestion triggers query change
    await user.click(items.find((i) => i.textContent === 'alice')!);
    await waitFor(() => expect(onQueryChange).toHaveBeenCalled());
  });

  it('falls back to static user suggestions when input is cleared', async () => {
    const user = userEvent.setup();
    (githubService.searchUsers as jest.Mock).mockResolvedValue([
      { login: 'alice', avatar_url: 'x' },
    ]);

    render(<VisualFilterBuilder {...defaultProps} query="is:pr" />);

    const authorInputs = screen.getAllByPlaceholderText('Add author...');
    const input = authorInputs.find((e) => e.tagName === 'INPUT');
    await user.click(input!);
    await user.type(input!, 'ali');

    await waitFor(() => expect(githubService.searchUsers).toHaveBeenCalled());

    // Clear input -> should show static default suggestions
    await user.clear(input!);
    const items = screen.getAllByTestId('autocomplete-item');
    expect(items.some((i) => i.textContent === 'john')).toBe(true);
    expect(items.some((i) => i.textContent === 'jane')).toBe(true);
    expect(items.some((i) => i.textContent === 'bob')).toBe(true);
  });

  it('renders first row only by default and toggles more filters', async () => {
    const user = userEvent.setup();
    render(<VisualFilterBuilder {...defaultProps} />);

    // Only first filter card visible initially (Authors)
    expect(screen.getByText('Authors')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'toggle-more-filters' })
    ).toBeInTheDocument();

    // Hidden sections should not be present before toggle
    expect(screen.queryByText('Reviewers')).not.toBeInTheDocument();
    expect(screen.queryByText('Pull Request State')).not.toBeInTheDocument();
    expect(screen.queryByText('Created: Preset')).not.toBeInTheDocument();

    // Toggle to show all
    await user.click(
      screen.getByRole('button', { name: 'toggle-more-filters' })
    );
    expect(screen.getByText('Reviewers')).toBeInTheDocument();
    expect(screen.getByText('Assignees')).toBeInTheDocument();
    expect(screen.getByText('Involves')).toBeInTheDocument();
    expect(screen.getByText('Repositories')).toBeInTheDocument();
    expect(screen.getByText('Labels')).toBeInTheDocument();
    expect(screen.getByText('Pull Request State')).toBeInTheDocument();
    expect(screen.getByText('Draft Status')).toBeInTheDocument();
    expect(screen.getByText('Created: Preset')).toBeInTheDocument();
    expect(screen.getByText('Updated: Preset')).toBeInTheDocument();
  });

  it('parses initial query into filter state', () => {
    render(<VisualFilterBuilder {...defaultProps} />);
    expect(mockParseGitHubQuery).toHaveBeenCalledWith('is:pr author:john');
  });

  it('displays parsed authors as chips and allows removal', async () => {
    const user = userEvent.setup();
    render(<VisualFilterBuilder {...defaultProps} />);
    const chips = screen.getAllByTestId('chip');
    const johnChip = chips.find((chip) => chip.textContent?.includes('john'));
    expect(johnChip).toBeInTheDocument();

    // Remove a chip
    const closeBtn = johnChip!.querySelector('button');
    if (closeBtn) {
      await user.click(closeBtn);
    }
    await waitFor(() => expect(mockBuildGitHubQuery).toHaveBeenCalled());
  });

  it('calls onQueryChange when filters change via add author', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();
    mockBuildGitHubQuery.mockReturnValue('is:pr author:john author:jane');

    render(
      <VisualFilterBuilder
        {...defaultProps}
        onQueryChange={onQueryChange}
        query="is:pr"
      />
    );

    const authorInputs = screen.getAllByPlaceholderText('Add author...');
    const input = authorInputs.find((e) => e.tagName === 'INPUT');
    await user.click(input!);
    await user.type(input!, 'jane');
    const item = screen
      .getAllByTestId('autocomplete-item')
      .find((i) => i.textContent === 'jane');
    await user.click(item!);

    await waitFor(() => expect(onQueryChange).toHaveBeenCalled());
  });

  it('disables inputs when loading', () => {
    render(<VisualFilterBuilder {...defaultProps} isLoading />);
    const inputs = screen.getAllByRole('textbox');
    expect(inputs[0]).toHaveProperty('disabled', true);
  });

  it('renders autocomplete suggestions', async () => {
    const user = userEvent.setup();
    render(<VisualFilterBuilder {...defaultProps} />);
    const authorInputs = screen.getAllByPlaceholderText('Add author...');
    const input = authorInputs.find((e) => e.tagName === 'INPUT');
    await user.click(input!);
    const items = screen.getAllByTestId('autocomplete-item');
    expect(items.some((i) => i.textContent === 'john')).toBe(true);
    expect(items.some((i) => i.textContent === 'jane')).toBe(true);
    expect(items.some((i) => i.textContent === 'bob')).toBe(true);
  });

  it('updates state and draft selects', async () => {
    const user = userEvent.setup();
    render(<VisualFilterBuilder {...defaultProps} />);
    // show all to reveal selects
    await user.click(
      screen.getByRole('button', { name: 'toggle-more-filters' })
    );

    const stateSelect = screen.getByDisplayValue('All States');
    await user.click(stateSelect);
    await user.click(screen.getByText('Open'));
    await waitFor(() => expect(mockBuildGitHubQuery).toHaveBeenCalled());

    const draftSelect = screen.getByDisplayValue('All');
    await user.click(draftSelect);
    await user.click(screen.getByText('Draft'));
    await waitFor(() => expect(mockBuildGitHubQuery).toHaveBeenCalled());
  });

  it('handles date presets for created and updated', async () => {
    const user = userEvent.setup();
    render(<VisualFilterBuilder {...defaultProps} />);
    await user.click(
      screen.getByRole('button', { name: 'toggle-more-filters' })
    );

    // Created preset
    const createdSelect = screen
      .getByText('Created: Preset')
      .parentElement!.querySelector('select');
    await user.selectOptions(createdSelect!, 'last_30_days');
    await waitFor(() => expect(mockBuildGitHubQuery).toHaveBeenCalled());

    // Updated preset
    const updatedSelect = screen
      .getByText('Updated: Preset')
      .parentElement!.querySelector('select');
    await user.selectOptions(updatedSelect!, 'last_year');
    await waitFor(() => expect(mockBuildGitHubQuery).toHaveBeenCalled());
  });

  it('exercises all preset branches', async () => {
    const user = userEvent.setup();
    render(<VisualFilterBuilder {...defaultProps} />);
    await user.click(
      screen.getByRole('button', { name: 'toggle-more-filters' })
    );
    const createdSelect = screen
      .getByText('Created: Preset')
      .parentElement!.querySelector('select');
    const values = [
      'none',
      'last_30_days',
      'last_2_months',
      'last_quarter',
      'last_6_months',
      'last_year',
    ];
    for (const v of values) {
      await user.selectOptions(createdSelect!, v);
    }
    await waitFor(() => expect(mockBuildGitHubQuery).toHaveBeenCalled());
  });

  it('handles involves field with test id', async () => {
    const user = userEvent.setup();
    mockParseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: null,
      dateRange: {},
      assignees: [],
      involves: ['testuser'],
    });
    render(<VisualFilterBuilder {...defaultProps} />);
    // Reveal all filters because only first row is visible by default in tests (matchMedia false)
    const toggleBtn = screen.getByRole('button', {
      name: 'toggle-more-filters',
    });
    await user.click(toggleBtn);
    expect(screen.getByTestId('involves-autocomplete')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('handles empty suggestions gracefully', () => {
    const props = {
      ...defaultProps,
      suggestions: { users: [], repositories: [], labels: [] },
    };
    render(<VisualFilterBuilder {...props} />);
    expect(screen.getByText('Authors')).toBeInTheDocument();
  });

  it('updates when query prop changes externally', () => {
    const { rerender } = render(<VisualFilterBuilder {...defaultProps} />);
    rerender(
      <VisualFilterBuilder {...defaultProps} query="is:pr author:jane" />
    );
    expect(mockParseGitHubQuery).toHaveBeenCalledWith('is:pr author:jane');
  });

  it('prevents query change when new query equals current query', async () => {
    const onQueryChange = jest.fn();
    mockBuildGitHubQuery.mockReturnValue('is:pr author:john');
    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr author:john"
        onQueryChange={onQueryChange}
      />
    );
    await waitFor(() => expect(onQueryChange).not.toHaveBeenCalled());
  });

  it('renders Active Filters and supports chip removals', async () => {
    const user = userEvent.setup();
    mockParseGitHubQuery.mockReturnValue({
      authors: ['john'],
      reviewers: ['jane'],
      repositories: ['org/repo1'],
      labels: ['bug'],
      state: 'open',
      isDraft: true,
      dateRange: {},
      assignees: [],
      involves: [],
    });
    render(<VisualFilterBuilder {...defaultProps} />);
    expect(screen.getByText('Active Filters')).toBeInTheDocument();

    for (const text of [
      'Author: john',
      'Reviewer: jane',
      'Repo: org/repo1',
      'State: open',
      'Draft: Yes',
    ]) {
      const chip = screen.getByText(text);
      const btn = chip.parentElement?.querySelector('button');
      if (btn) await user.click(btn);
    }
    await waitFor(() => expect(mockBuildGitHubQuery).toHaveBeenCalled());
  });

  it('does not render Active Filters when empty', () => {
    mockParseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: null,
      dateRange: {},
      assignees: [],
      involves: [],
    });
    render(<VisualFilterBuilder {...defaultProps} />);
    expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
  });
});

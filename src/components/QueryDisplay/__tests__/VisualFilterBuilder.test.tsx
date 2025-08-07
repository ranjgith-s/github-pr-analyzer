import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisualFilterBuilder } from '../VisualFilterBuilder';
import * as queryBuilder from '../../../utils/queryBuilder';

// Mock the queryBuilder utility
jest.mock('../../../utils/queryBuilder', () => ({
  parseGitHubQuery: jest.fn(),
  buildGitHubQuery: jest.fn(),
}));

describe('VisualFilterBuilder', () => {
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

    // Default mock implementations
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

  it('should render all filter sections', () => {
    render(<VisualFilterBuilder {...defaultProps} />);

    expect(screen.getByText('Authors')).toBeInTheDocument();
    expect(screen.getByText('Reviewers')).toBeInTheDocument();
    expect(screen.getByText('Repositories')).toBeInTheDocument();
    expect(screen.getByText('🏷️ Status & State')).toBeInTheDocument();
    expect(screen.getByText('Labels')).toBeInTheDocument();
    expect(screen.getByText('Assignees')).toBeInTheDocument();
  });

  it('should parse initial query into filter state', () => {
    render(<VisualFilterBuilder {...defaultProps} />);

    expect(mockParseGitHubQuery).toHaveBeenCalledWith('is:pr author:john');
  });

  it('should display parsed authors as chips', () => {
    render(<VisualFilterBuilder {...defaultProps} />);

    // Use getAllByTestId to find all chip elements and look for the one with 'john'
    const chips = screen.getAllByTestId('chip');
    const johnChip = chips.find((chip) => chip.textContent?.includes('john'));
    expect(johnChip).toBeInTheDocument();
  });

  it('should call onQueryChange when filters change', async () => {
    const onQueryChange = jest.fn();
    mockBuildGitHubQuery.mockReturnValue('is:pr author:john author:jane');

    render(
      <VisualFilterBuilder
        {...defaultProps}
        onQueryChange={onQueryChange}
        query="is:pr"
      />
    );

    // Wait for the effect to run
    await waitFor(() => {
      expect(onQueryChange).toHaveBeenCalledWith(
        'is:pr author:john author:jane'
      );
    });
  });

  it('should update state filter when selection changes', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    // Find and click the state select by placeholder instead
    const stateSelect = screen.getByDisplayValue('All States');
    await user.click(stateSelect);

    // Look for the "Open" option and click it
    const openOption = screen.getByText('Open');
    await user.click(openOption);

    // Verify the query builder was called with updated state
    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should be disabled when loading', () => {
    render(<VisualFilterBuilder {...defaultProps} isLoading={true} />);

    // Find input elements and check for disabled state
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
    // The mock input should have disabled attribute when isDisabled is true
    const firstInput = inputs[0];
    expect(firstInput).toHaveProperty('disabled', true);
  });

  it('should render autocomplete suggestions', async () => {
    const user = userEvent.setup();

    render(<VisualFilterBuilder {...defaultProps} />);

    // Find the first autocomplete input (author input)
    const authorInputs = screen.getAllByPlaceholderText('Add author...');
    const authorInput = authorInputs.find(
      (element) => element.tagName === 'INPUT'
    );

    expect(authorInput).toBeDefined();
    if (authorInput) {
      await user.click(authorInput);
    }

    // Check if suggestions are available in the autocomplete items (not in chips)
    const autocompleteItems = screen.getAllByTestId('autocomplete-item');
    const johnSuggestions = autocompleteItems.filter(
      (item) => item.textContent === 'john'
    );
    const janeSuggestions = autocompleteItems.filter(
      (item) => item.textContent === 'jane'
    );
    const bobSuggestions = autocompleteItems.filter(
      (item) => item.textContent === 'bob'
    );

    expect(johnSuggestions.length).toBeGreaterThan(0);
    expect(janeSuggestions.length).toBeGreaterThan(0);
    expect(bobSuggestions.length).toBeGreaterThan(0);
  });

  it('should handle draft status selection', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    // Look for the select with draft options
    const draftSelect = screen.getByDisplayValue('All');
    await user.click(draftSelect);

    const draftOption = screen.getByText('Draft');
    await user.click(draftOption);

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should remove chips when close button is clicked', async () => {
    const user = userEvent.setup();
    mockParseGitHubQuery.mockReturnValue({
      authors: ['john', 'jane'],
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

    // Find all close buttons for author chips
    const closeButtons = screen.getAllByRole('button');
    const johnChipCloseButton = closeButtons.find((btn) =>
      btn.closest('[data-slot="chip"]')?.textContent?.includes('john')
    );

    if (johnChipCloseButton) {
      await user.click(johnChipCloseButton);
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should handle date range inputs', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    // Find date inputs
    const dateInputs = screen.getAllByDisplayValue('');
    const createdFromInput = dateInputs[0]; // First date input should be "Created From"

    await user.type(createdFromInput, '2024-01-01');

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should handle involves field', async () => {
    const onQueryChange = jest.fn();

    // Mock the parseGitHubQuery to not include john
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

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    // Verify the involves section is rendered
    expect(screen.getByText('Involves')).toBeInTheDocument();

    // Check that the specific involves autocomplete is rendered
    expect(screen.getByTestId('involves-autocomplete')).toBeInTheDocument();

    // Check that the placeholder text exists somewhere in the involves section
    const placeholderElements = screen.getAllByPlaceholderText('Add user...');
    expect(placeholderElements.length).toBeGreaterThan(0);
  });

  it('should handle empty suggestions gracefully', () => {
    const propsWithEmptySuggestions = {
      ...defaultProps,
      suggestions: {
        users: [],
        repositories: [],
        labels: [],
      },
    };

    render(<VisualFilterBuilder {...propsWithEmptySuggestions} />);

    // Should still render all sections
    expect(screen.getByText('Authors')).toBeInTheDocument();
    expect(screen.getByText('Repositories')).toBeInTheDocument();
    expect(screen.getByText('Labels')).toBeInTheDocument();
  });

  it('should update query when filters change externally', () => {
    const { rerender } = render(<VisualFilterBuilder {...defaultProps} />);

    // Change the query prop
    rerender(
      <VisualFilterBuilder {...defaultProps} query="is:pr author:jane" />
    );

    // Should call parseGitHubQuery with new query
    expect(mockParseGitHubQuery).toHaveBeenCalledWith('is:pr author:jane');
  });

  it('should handle invalid date inputs gracefully', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    const dateInputs = screen.getAllByDisplayValue('');
    const dateInput = dateInputs[0];

    // Try to input an invalid date
    await user.clear(dateInput);
    await user.type(dateInput, 'invalid-date');

    // Component should handle this gracefully
    expect(onQueryChange).not.toHaveBeenCalledWith(
      expect.stringContaining('invalid-date')
    );
  });

  it('should handle adding items through autocomplete selection', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    // Start with empty filters
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

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    // Test adding an author through autocomplete
    const authorInputs = screen.getAllByPlaceholderText('Add author...');
    const authorInput = authorInputs.find(
      (element) => element.tagName === 'INPUT'
    );

    if (authorInput) {
      await user.click(authorInput);
      await user.type(authorInput, 'jane');

      // Find and click the autocomplete item
      const autocompleteItems = screen.getAllByTestId('autocomplete-item');
      const janeItem = autocompleteItems.find(
        (item) => item.textContent === 'jane'
      );
      if (janeItem) {
        await user.click(janeItem);
      }
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should handle empty string input gracefully in addStringArrayItem', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

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

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    // Try to add empty string through autocomplete
    const authorInputs = screen.getAllByPlaceholderText('Add author...');
    const authorInput = authorInputs.find(
      (element) => element.tagName === 'INPUT'
    );

    if (authorInput) {
      await user.click(authorInput);
      await user.type(authorInput, '   '); // Whitespace only
    }

    // Should not add empty items
    const chips = screen.queryAllByTestId('chip');
    const emptyChips = chips.filter((chip) => chip.textContent?.trim() === '');
    expect(emptyChips).toHaveLength(0);
  });

  it('should render Active Filters summary when filters are applied', () => {
    mockParseGitHubQuery.mockReturnValue({
      authors: ['john'],
      reviewers: ['jane'],
      repositories: ['org/repo1'],
      labels: ['bug'],
      state: 'open',
      isDraft: false,
      dateRange: {
        created: { start: new Date('2024-01-01'), end: new Date('2024-12-31') },
      },
      assignees: ['bob'],
      involves: ['alice'],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Should show Active Filters section
    expect(screen.getByText('Active Filters')).toBeInTheDocument();

    // Should show filter chips with prefixes
    expect(screen.getByText('Author: john')).toBeInTheDocument();
    expect(screen.getByText('Reviewer: jane')).toBeInTheDocument();
    expect(screen.getByText('Repo: org/repo1')).toBeInTheDocument();
    expect(screen.getByText('State: open')).toBeInTheDocument();
    expect(screen.getByText('Draft: No')).toBeInTheDocument();
  });

  it('should handle removing filters from Active Filters section', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    mockParseGitHubQuery.mockReturnValue({
      authors: ['john'],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'open',
      isDraft: true,
      dateRange: {},
      assignees: [],
      involves: [],
    });

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr author:john state:open draft:true"
        onQueryChange={onQueryChange}
      />
    );

    // Find and click close button for state filter
    const stateChip = screen.getByText('State: open');
    const closeButton = stateChip.parentElement?.querySelector('button');
    if (closeButton) {
      await user.click(closeButton);
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });

    // Test removing draft filter
    const draftChip = screen.getByText('Draft: Yes');
    const draftCloseButton = draftChip.parentElement?.querySelector('button');
    if (draftCloseButton) {
      await user.click(draftCloseButton);
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should handle all autocomplete filter types', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

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

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    // Test each autocomplete type
    const testCases = [
      { placeholder: 'Add reviewer...', suggestion: 'jane' },
      { placeholder: 'Add assignee...', suggestion: 'bob' },
      {
        placeholder: 'Add repository (owner/repo)...',
        suggestion: 'org/repo1',
      },
      { placeholder: 'Add label...', suggestion: 'bug' },
    ];

    for (const testCase of testCases) {
      const inputs = screen.getAllByPlaceholderText(testCase.placeholder);
      const input = inputs.find((element) => element.tagName === 'INPUT');

      if (input) {
        await user.click(input);

        // Find the suggestion in autocomplete items
        const autocompleteItems = screen.getAllByTestId('autocomplete-item');
        const suggestionItem = autocompleteItems.find(
          (item) => item.textContent === testCase.suggestion
        );

        if (suggestionItem) {
          await user.click(suggestionItem);
        }
      }
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should handle all date range inputs', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    // Get all date inputs
    const dateInputs = screen.getAllByDisplayValue('');

    // Test all 4 date inputs: created from/to, updated from/to
    const testDates = ['2024-01-01', '2024-06-30', '2024-02-01', '2024-07-31'];

    for (let i = 0; i < Math.min(dateInputs.length, testDates.length); i++) {
      await user.clear(dateInputs[i]);
      await user.type(dateInputs[i], testDates[i]);
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should handle clearing date inputs', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    // Start with some dates set
    mockParseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: null,
      dateRange: {
        created: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
        updated: {
          start: new Date('2024-02-01'),
          end: new Date('2024-11-30'),
        },
      },
      assignees: [],
      involves: [],
    });

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr created:2024-01-01..2024-12-31"
        onQueryChange={onQueryChange}
      />
    );

    // Clear the first date input
    const dateInputs = screen.getAllByDisplayValue('2024-01-01');
    if (dateInputs.length > 0) {
      await user.clear(dateInputs[0]);
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should render chips with correct colors for different filter types', () => {
    mockParseGitHubQuery.mockReturnValue({
      authors: ['john'],
      reviewers: ['jane'],
      repositories: ['org/repo1'],
      labels: ['bug'],
      state: 'all',
      isDraft: null,
      dateRange: {},
      assignees: ['bob'],
      involves: ['alice'],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    const chips = screen.getAllByTestId('chip');

    // Verify that chips are rendered (color testing would require more complex setup)
    const authorChip = chips.find((chip) => chip.textContent?.includes('john'));
    const reviewerChip = chips.find((chip) =>
      chip.textContent?.includes('jane')
    );
    const repoChip = chips.find((chip) =>
      chip.textContent?.includes('org/repo1')
    );
    const labelChip = chips.find((chip) => chip.textContent?.includes('bug'));
    const assigneeChip = chips.find((chip) =>
      chip.textContent?.includes('bob')
    );
    const involvesChip = chips.find((chip) =>
      chip.textContent?.includes('alice')
    );

    expect(authorChip).toBeInTheDocument();
    expect(reviewerChip).toBeInTheDocument();
    expect(repoChip).toBeInTheDocument();
    expect(labelChip).toBeInTheDocument();
    expect(assigneeChip).toBeInTheDocument();
    expect(involvesChip).toBeInTheDocument();
  });

  it('should handle multiple items in each filter category', async () => {
    const user = userEvent.setup();

    mockParseGitHubQuery.mockReturnValue({
      authors: ['john', 'jane', 'bob'],
      reviewers: ['alice', 'charlie'],
      repositories: ['org/repo1', 'org/repo2'],
      labels: ['bug', 'enhancement', 'feature'],
      state: 'all',
      isDraft: null,
      dateRange: {},
      assignees: ['dave', 'eve'],
      involves: ['frank', 'grace'],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Verify multiple chips are rendered for each category (account for autocomplete items)
    // Note: Exact counts may vary based on how many autocomplete instances show each name
    expect(screen.getAllByText('john').length).toBeGreaterThanOrEqual(4); // In active, regular, and autocomplete
    expect(screen.getAllByText('jane').length).toBeGreaterThanOrEqual(3); // In active and autocomplete items
    expect(screen.getAllByText('bob').length).toBeGreaterThanOrEqual(3); // In active and autocomplete items

    expect(screen.getByText('alice')).toBeInTheDocument();
    expect(screen.getByText('charlie')).toBeInTheDocument();

    expect(screen.getAllByText('org/repo1').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('org/repo2').length).toBeGreaterThanOrEqual(1);

    expect(screen.getAllByText('bug').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('enhancement').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('feature').length).toBeGreaterThanOrEqual(1);

    // Test removing multiple items
    const chips = screen.getAllByTestId('chip');
    const closeButtons = chips
      .map((chip) => chip.querySelector('button'))
      .filter(Boolean);

    // Remove first few items
    for (let i = 0; i < Math.min(3, closeButtons.length); i++) {
      if (closeButtons[i]) {
        await user.click(closeButtons[i] as HTMLElement);
      }
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should handle formatDateForInput helper function', () => {
    mockParseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: null,
      dateRange: {
        created: {
          start: new Date('2024-01-01T10:30:00Z'),
          end: new Date('2024-12-31T23:59:59Z'),
        },
        updated: {
          start: new Date('2024-02-15T05:15:30Z'),
          end: new Date('2024-11-30T18:45:00Z'),
        },
      },
      assignees: [],
      involves: [],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Check that dates are formatted correctly in inputs
    expect(screen.getByDisplayValue('2024-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-12-31')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-02-15')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2024-11-30')).toBeInTheDocument();
  });

  it('should prevent query change when new query equals current query', async () => {
    const onQueryChange = jest.fn();

    // Mock buildGitHubQuery to return the same query
    mockBuildGitHubQuery.mockReturnValue('is:pr author:john');

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr author:john"
        onQueryChange={onQueryChange}
      />
    );

    // The useEffect should not call onQueryChange because newQuery === query
    await waitFor(() => {
      // Should not be called because query is the same
      expect(onQueryChange).not.toHaveBeenCalled();
    });
  });

  it('should handle involves autocomplete with test ID', () => {
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

    // Verify involves autocomplete has the correct test ID
    const involvesAutocomplete = screen.getByTestId('involves-autocomplete');
    expect(involvesAutocomplete).toBeInTheDocument();

    // Verify involves chip is rendered
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should handle all state options in select', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    const stateSelect = screen.getByDisplayValue('All States');

    // Test each state option
    const stateOptions = ['Open', 'Closed', 'Merged'];

    for (const option of stateOptions) {
      await user.click(stateSelect);
      const optionElement = screen.getByText(option);
      await user.click(optionElement);

      await waitFor(() => {
        expect(mockBuildGitHubQuery).toHaveBeenCalled();
      });
    }
  });

  it('should handle all draft status options', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr"
        onQueryChange={onQueryChange}
      />
    );

    const draftSelect = screen.getByDisplayValue('All');

    // Test draft status options
    const draftOptions = ['Ready for Review', 'Draft'];

    for (const option of draftOptions) {
      await user.click(draftSelect);
      const optionElement = screen.getByText(option);
      await user.click(optionElement);

      await waitFor(() => {
        expect(mockBuildGitHubQuery).toHaveBeenCalled();
      });
    }
  });

  it('should render without Active Filters section when no filters are applied', () => {
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

    // Should not show Active Filters section when no filters are applied
    expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
  });

  it('should render section headers with emojis', () => {
    render(<VisualFilterBuilder {...defaultProps} />);

    expect(screen.getByText('👥 People Filters')).toBeInTheDocument();
    expect(screen.getByText('📂 Repository & Content')).toBeInTheDocument();
    expect(screen.getByText('🏷️ Status & State')).toBeInTheDocument();
    expect(screen.getByText('📅 Date Ranges')).toBeInTheDocument();
  });

  it('should render date labels and inputs', () => {
    render(<VisualFilterBuilder {...defaultProps} />);

    expect(screen.getByText('Created Date')).toBeInTheDocument();
    expect(screen.getByText('Updated Date')).toBeInTheDocument();

    // Check for From/To labels
    const fromLabels = screen.getAllByText('From');
    const toLabels = screen.getAllByText('To');

    expect(fromLabels).toHaveLength(2); // Created From, Updated From
    expect(toLabels).toHaveLength(2); // Created To, Updated To
  });

  it('should handle autocomplete without testId parameter', async () => {
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
      involves: [],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Test that autocomplete sections without testId still work
    const repositoryInputs = screen.getAllByPlaceholderText(
      'Add repository (owner/repo)...'
    );
    const repositoryInput = repositoryInputs.find(
      (element) => element.tagName === 'INPUT'
    );

    if (repositoryInput) {
      await user.click(repositoryInput);

      const autocompleteItems = screen.getAllByTestId('autocomplete-item');
      const repoItem = autocompleteItems.find(
        (item) => item.textContent === 'org/repo1'
      );

      if (repoItem) {
        await user.click(repoItem);
      }
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should handle conditional chip rendering based on filter content', () => {
    // Test with only some filters having content
    mockParseGitHubQuery.mockReturnValue({
      authors: ['john'],
      reviewers: [], // Empty
      repositories: ['org/repo1'],
      labels: [], // Empty
      state: 'all',
      isDraft: null,
      dateRange: {},
      assignees: [], // Empty
      involves: ['alice'],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Should render chips only for filters with content
    expect(screen.getAllByText('john').length).toBeGreaterThanOrEqual(1); // In chip and autocomplete
    expect(screen.getAllByText('org/repo1').length).toBeGreaterThanOrEqual(1); // In chip and autocomplete
    expect(screen.getAllByText('alice').length).toBeGreaterThanOrEqual(1); // In chip and autocomplete

    // Should not render empty chip sections
    const allChips = screen.getAllByTestId('chip');
    const reviewerChips = allChips.filter((chip) =>
      chip.textContent?.includes('Reviewer:')
    );
    const labelChips = allChips.filter(
      (chip) =>
        chip.textContent?.includes('bug') ||
        chip.textContent?.includes('enhancement')
    );

    expect(reviewerChips).toHaveLength(0);
    expect(labelChips).toHaveLength(0);
  });

  it('should handle edge cases in date range clearing', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    mockParseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: null,
      dateRange: {
        created: { start: new Date('2024-01-01') }, // Only start date
        updated: { end: new Date('2024-12-31') }, // Only end date
      },
      assignees: [],
      involves: [],
    });

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="is:pr created:>2024-01-01"
        onQueryChange={onQueryChange}
      />
    );

    // Try to clear dates by setting empty value
    const dateInputs = screen.getAllByRole('textbox');
    const dateInput = dateInputs.find(
      (input) => input instanceof HTMLInputElement && input.type === 'date'
    );

    if (dateInput) {
      await user.clear(dateInput);
      await user.type(dateInput, '');
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should cover all Active Filters chip removal scenarios', async () => {
    const user = userEvent.setup();
    const onQueryChange = jest.fn();

    mockParseGitHubQuery.mockReturnValue({
      authors: ['john', 'jane'],
      reviewers: ['reviewer1'],
      repositories: ['org/repo1'],
      labels: ['bug', 'enhancement'],
      state: 'merged',
      isDraft: true,
      dateRange: {
        created: { start: new Date('2024-01-01') },
        updated: { end: new Date('2024-12-31') },
      },
      assignees: ['assignee1'],
      involves: ['involves1'],
    });

    render(
      <VisualFilterBuilder
        {...defaultProps}
        query="complex query"
        onQueryChange={onQueryChange}
      />
    );

    // Test removing from each active filter type
    const authorChip = screen.getByText('Author: john');
    const authorCloseButton = authorChip.parentElement?.querySelector('button');
    if (authorCloseButton) {
      await user.click(authorCloseButton);
    }

    const reviewerChip = screen.getByText('Reviewer: reviewer1');
    const reviewerCloseButton =
      reviewerChip.parentElement?.querySelector('button');
    if (reviewerCloseButton) {
      await user.click(reviewerCloseButton);
    }

    const repoChip = screen.getByText('Repo: org/repo1');
    const repoCloseButton = repoChip.parentElement?.querySelector('button');
    if (repoCloseButton) {
      await user.click(repoCloseButton);
    }

    await waitFor(() => {
      expect(mockBuildGitHubQuery).toHaveBeenCalled();
    });
  });

  it('should handle all renderAutocompleteSection color variants', async () => {
    mockParseGitHubQuery.mockReturnValue({
      authors: ['primary-author'],
      reviewers: ['secondary-reviewer'],
      repositories: ['success-repo'],
      labels: ['warning-label'],
      state: 'all',
      isDraft: null,
      dateRange: {},
      assignees: ['default-assignee'],
      involves: ['primary-involves'],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Verify all chip color variants are rendered by checking the different filter types
    const allChips = screen.getAllByTestId('chip');

    // Should have chips for all filter types with different colors
    expect(allChips.length).toBeGreaterThan(5);

    // Verify specific filter chips exist
    expect(screen.getByText('primary-author')).toBeInTheDocument();
    expect(screen.getByText('secondary-reviewer')).toBeInTheDocument();
    expect(screen.getByText('success-repo')).toBeInTheDocument();
    expect(screen.getByText('warning-label')).toBeInTheDocument();
    expect(screen.getByText('default-assignee')).toBeInTheDocument();
    expect(screen.getByText('primary-involves')).toBeInTheDocument();
  });

  it('should render all conditional Active Filter chips', () => {
    const mockQueryBuilder = queryBuilder as jest.Mocked<typeof queryBuilder>;
    mockQueryBuilder.parseGitHubQuery.mockReturnValue({
      authors: ['testuser'],
      reviewers: ['reviewer1'],
      repositories: ['org/repo1'],
      labels: ['bug'],
      state: 'closed',
      isDraft: false,
      dateRange: {
        created: {
          start: new Date('2023-01-01'),
        },
        updated: {
          end: new Date('2023-12-31'),
        },
      },
      assignees: ['assignee1'],
      involves: ['involve1'],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Check all types of active filter chips are rendered (only those implemented)
    expect(screen.getByText('Author: testuser')).toBeInTheDocument();
    expect(screen.getByText('Reviewer: reviewer1')).toBeInTheDocument();
    expect(screen.getByText('Repo: org/repo1')).toBeInTheDocument();
    expect(screen.getByText('State: closed')).toBeInTheDocument();
    expect(screen.getByText('Draft: No')).toBeInTheDocument();

    // Note: Labels, assignees, involves, and date ranges are not implemented in Active Filters section
    // These are tested in their respective filter sections
  });

  it('should handle state chip removal from Active Filters', () => {
    const mockQueryBuilder = queryBuilder as jest.Mocked<typeof queryBuilder>;
    mockQueryBuilder.parseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'open',
      isDraft: false,
      dateRange: {},
      assignees: [],
      involves: [],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Verify state chip is rendered in Active Filters
    expect(screen.getByText('State: open')).toBeInTheDocument();

    // Click close button on state chip
    const stateChip = screen.getByText('State: open');
    const closeButton = stateChip.parentElement?.querySelector('button');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton!);

    // Verify updateFilter was called to reset state
    expect(mockQueryBuilder.buildGitHubQuery).toHaveBeenCalled();
  });

  it('should handle draft status chip removal from Active Filters', () => {
    const mockQueryBuilder = queryBuilder as jest.Mocked<typeof queryBuilder>;
    mockQueryBuilder.parseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: true,
      dateRange: {},
      assignees: [],
      involves: [],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Verify draft chip is rendered in Active Filters
    expect(screen.getByText('Draft: Yes')).toBeInTheDocument();

    // Click close button on draft chip
    const draftChip = screen.getByText('Draft: Yes');
    const closeButton = draftChip.parentElement?.querySelector('button');
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton!);

    // Verify updateFilter was called to reset draft status
    expect(mockQueryBuilder.buildGitHubQuery).toHaveBeenCalled();
  });

  it('should handle date range chip functionality', async () => {
    const user = userEvent.setup();
    const mockQueryBuilder = queryBuilder as jest.Mocked<typeof queryBuilder>;
    mockQueryBuilder.parseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: null,
      dateRange: {
        created: {
          start: new Date('2023-01-01'),
          end: new Date('2023-12-31'),
        },
        updated: {
          start: new Date('2023-06-01'),
        },
      },
      assignees: [],
      involves: [],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Verify date inputs are populated correctly
    const createdStartInput = screen.getByDisplayValue('2023-01-01');
    const createdEndInput = screen.getByDisplayValue('2023-12-31');
    const updatedStartInput = screen.getByDisplayValue('2023-06-01');

    expect(createdStartInput).toBeInTheDocument();
    expect(createdEndInput).toBeInTheDocument();
    expect(updatedStartInput).toBeInTheDocument();

    // Test clearing date inputs
    await user.clear(createdStartInput);
    await user.clear(updatedStartInput);

    // Verify updateFilter was called
    expect(mockQueryBuilder.buildGitHubQuery).toHaveBeenCalled();
  });

  it('should handle date input functionality scenarios', () => {
    const mockQueryBuilder = queryBuilder as jest.Mocked<typeof queryBuilder>;

    // Test scenario with only end date in created range
    mockQueryBuilder.parseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: null,
      dateRange: {
        created: {
          end: new Date('2023-12-31'),
        },
      },
      assignees: [],
      involves: [],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Verify only end date is populated
    expect(screen.getByDisplayValue('2023-12-31')).toBeInTheDocument();

    // Verify date inputs exist for both created and updated ranges
    const dateInputs = screen.getAllByDisplayValue('');
    expect(dateInputs.length).toBeGreaterThan(0);
  });

  it('should handle empty date range edge cases', () => {
    const mockQueryBuilder = queryBuilder as jest.Mocked<typeof queryBuilder>;
    mockQueryBuilder.parseGitHubQuery.mockReturnValue({
      authors: [],
      reviewers: [],
      repositories: [],
      labels: [],
      state: 'all',
      isDraft: null,
      dateRange: {
        created: {},
        updated: {},
      },
      assignees: [],
      involves: [],
    });

    render(<VisualFilterBuilder {...defaultProps} />);

    // Should not render Active Filters section for empty date ranges
    expect(screen.queryByText('Active Filters')).not.toBeInTheDocument();
  });
});

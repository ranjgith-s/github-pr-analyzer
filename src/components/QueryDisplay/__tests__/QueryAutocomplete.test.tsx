import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  QueryAutocomplete,
  AutocompleteSuggestion,
} from '../QueryAutocomplete';

// Basic suggestions fixture covering grouping + description + icon fallback
const suggestions: AutocompleteSuggestion[] = [
  { type: 'user', value: 'alice', display: 'alice', description: 'User Alice' },
  {
    type: 'repository',
    value: 'org/repo',
    display: 'org/repo',
  },
  { type: 'label', value: 'bug', display: 'bug' },
  {
    type: 'template',
    value: 'is:pr author:@me',
    display: 'My PRs',
    description: 'Template',
  },
  { type: 'syntax', value: 'state:open', display: 'state:open' },
];

function setup(
  extra: Partial<React.ComponentProps<typeof QueryAutocomplete>> = {}
) {
  const onSuggestionSelect = jest.fn();
  const onClose = jest.fn();
  render(
    <QueryAutocomplete
      // query prop currently unused in component but required by interface
      query={extra.query || ''}
      position={0}
      isVisible={true}
      onSuggestionSelect={onSuggestionSelect}
      onClose={onClose}
      suggestions={suggestions}
      {...extra}
    />
  );
  return { onSuggestionSelect, onClose };
}

describe('QueryAutocomplete', () => {
  it('renders nothing when not visible or no suggestions', () => {
    const { container, rerender } = render(
      <QueryAutocomplete
        query=""
        position={0}
        isVisible={false}
        onSuggestionSelect={jest.fn()}
        onClose={jest.fn()}
        suggestions={suggestions}
      />
    );
    expect(container.firstChild).toBeNull();

    rerender(
      <QueryAutocomplete
        query=""
        position={0}
        isVisible={true}
        onSuggestionSelect={jest.fn()}
        onClose={jest.fn()}
        suggestions={[]}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('groups and displays suggestions', () => {
    setup();
    // Category headers fall back to type names (user, repository,...)
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('repository')).toBeInTheDocument();
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('template')).toBeInTheDocument();
    expect(screen.getByText('syntax')).toBeInTheDocument();
    // Description rendered
    expect(screen.getByText('User Alice')).toBeInTheDocument();
  });

  it('mouse selects a suggestion', async () => {
    const { onSuggestionSelect } = setup();
    const item = screen.getByText('bug');
    fireEvent.click(item.closest('div[role="option"]')!);
    expect(onSuggestionSelect).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'bug' }),
      0
    );
  });

  it('keyboard navigation cycles with ArrowDown / ArrowUp and selects with Enter', async () => {
    const user = userEvent.setup();
    const { onSuggestionSelect } = setup();

    // Initial selected is first suggestion (alice)
    await user.keyboard('{ArrowDown}'); // move to second
    await user.keyboard('{ArrowDown}'); // third
    await user.keyboard('{ArrowUp}'); // back to second
    await user.keyboard('{Enter}');

    expect(onSuggestionSelect).toHaveBeenCalledTimes(1);
    expect(onSuggestionSelect.mock.calls[0][0]).toMatchObject({
      value: 'org/repo',
    });
  });

  it('wraps navigation when reaching list ends', async () => {
    const user = userEvent.setup();
    const { onSuggestionSelect } = setup();

    // Move up from first should wrap to last
    await user.keyboard('{ArrowUp}{Enter}');
    expect(onSuggestionSelect.mock.calls[0][0]).toMatchObject({
      value: 'state:open',
    });
  });

  it('Escape closes the list', async () => {
    const user = userEvent.setup();
    const { onClose } = setup();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('renders custom icon when provided and groups by custom category', () => {
    const customIcon = <span data-testid="custom-icon">*</span>;
    const extraSuggestions: AutocompleteSuggestion[] = [
      ...suggestions,
      {
        type: 'user',
        category: 'people',
        value: 'bob',
        display: 'bob',
        icon: customIcon,
      },
      {
        type: 'user',
        category: 'people',
        value: 'carol',
        display: 'carol',
      },
    ];
    setup({ suggestions: extraSuggestions });
    // Custom category header should appear
    expect(screen.getByText('people')).toBeInTheDocument();
    // Custom icon should be rendered exactly once (attached to first custom suggestion)
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });

  it('scrolls selected item into view on navigation', async () => {
    const scrollSpy = jest.fn();
    // Override prototype for this test instance only
    const original = HTMLElement.prototype.scrollIntoView;
    // Cast to any to override for spying without TypeScript error
    (HTMLElement.prototype as any).scrollIntoView = scrollSpy;

    const user = userEvent.setup();
    setup();
    await user.keyboard('{ArrowDown}{ArrowDown}{ArrowDown}');
    // Should have attempted to scroll multiple times (initial + 3 moves)
    expect(scrollSpy).toHaveBeenCalled();

    // restore
    (HTMLElement.prototype as any).scrollIntoView = original;
  });
});

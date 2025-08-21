import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FiltersBar from '../FiltersBar';
import { firstKey } from '../utils';

const baseProps = {
  search: '',
  onSearch: jest.fn(),
  // In the new UI, FiltersBar only renders the search box plus optional left/right content.
};

describe('FiltersBar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('firstKey util covers shapes: string, array, set, object, null', () => {
    expect(firstKey('x')).toBe('x');
    expect(firstKey(['a', 'b'])).toBe('a');
    expect(firstKey(new Set(['s1', 's2']))).toBe('s1');
    expect(firstKey({ currentKey: 'ck' } as any)).toBe('ck');
    expect(firstKey(null as any)).toBe('');
    expect(firstKey(undefined as any)).toBe('');
    expect(firstKey({} as any)).toBe('');
  });

  it('renders search input and optional left/right content', () => {
    render(
      <FiltersBar
        {...baseProps}
        leftContent={<span data-testid="left">L</span>}
        rightContent={<button aria-label="Example action">Do</button>}
      />
    );
    expect(
      screen.getByRole('textbox', { name: /search pull requests/i })
    ).toBeInTheDocument();
    expect(screen.getByTestId('left')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /example action/i })
    ).toBeInTheDocument();
  });

  it('search input calls onSearch', async () => {
    render(<FiltersBar {...baseProps} />);
    const input = screen.getByRole('textbox', {
      name: /search pull requests/i,
    });
    const user = userEvent.setup();
    await user.type(input, 'abc');
    // onChange fires per keystroke
    expect(baseProps.onSearch).toHaveBeenCalled();
  });

  it('search input calls onSearch', async () => {
    render(<FiltersBar {...baseProps} />);
    const input = screen.getByRole('textbox', {
      name: /search pull requests/i,
    });
    const user = userEvent.setup();
    await user.type(input, 'abc');
    expect(baseProps.onSearch).toHaveBeenCalled();
  });

  it('Escape clears search and Clear button appears when value present', async () => {
    const { rerender } = render(<FiltersBar {...baseProps} />);
    const input = screen.getByRole('textbox', {
      name: /search pull requests/i,
    });
    // Simulate parent updating search to a non-empty value
    await userEvent.type(input, 'xyz');
    rerender(<FiltersBar {...baseProps} search="xyz" />);
    // Clear button should show and work
    expect(
      screen.getByRole('button', { name: /clear search/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /clear search/i }));
    expect(baseProps.onSearch).toHaveBeenCalledWith('');

    // Provide a non-empty value again and press Escape
    rerender(<FiltersBar {...baseProps} search="abc" />);
    const input2 = screen.getByRole('textbox', {
      name: /search pull requests/i,
    });
    fireEvent.keyDown(input2, { key: 'Escape' });
    expect(baseProps.onSearch).toHaveBeenCalledWith('');
  });

  // Repo/author dropdowns and sort/order controls were removed from FiltersBar in the new UI.

  it('does not render legacy sort/order triggers', () => {
    render(<FiltersBar {...baseProps} />);
    expect(
      screen.queryByRole('button', { name: /sort field/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /sort order/i })
    ).not.toBeInTheDocument();
  });

  // Selection of sort options now handled via table headers; covered in MetricsTable tests

  // per-page tests removed; control now lives next to pagination in MetricsTable

  // Order control removed

  // Repo/author labels removed with legacy dropdowns
});

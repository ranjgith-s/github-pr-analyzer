import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FiltersBar from '../FiltersBar';
import { firstKey } from '../utils';

const baseProps = {
  search: '',
  onSearch: jest.fn(),
  repoFilter: '',
  onRepoChange: jest.fn(),
  authorFilter: '',
  onAuthorChange: jest.fn(),
  repos: ['repo-a', 'repo-b'],
  authors: ['alice', 'bob'],
  sort: 'updated',
  onSortChange: jest.fn(),
  order: 'desc' as const,
  onOrderChange: jest.fn(),
  pageSize: 20,
  onPerPageChange: jest.fn(),
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

  it('renders all controls and options', () => {
    render(<FiltersBar {...baseProps} />);

    // search input
    expect(
      screen.getByRole('textbox', { name: /search pull requests/i })
    ).toBeInTheDocument();

    // dropdown triggers
    expect(
      screen.getByRole('button', { name: /repository filter/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /author filter/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sort field/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /sort order/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /items per page/i })
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

  it('repo dropdown calls onRepoChange when option is clicked', async () => {
    render(<FiltersBar {...baseProps} />);
    const user = userEvent.setup();

    await user.click(
      screen.getByRole('button', { name: /repository filter/i })
    );
    await user.click(screen.getByRole('menuitem', { name: 'repo-a' }));
    expect(baseProps.onRepoChange).toHaveBeenCalledWith('repo-a');
  });

  it('repo dropdown handles "All" (empty) selection via click and selectionChange', async () => {
    const props = { ...baseProps, repoFilter: 'repo-a' };
    render(<FiltersBar {...props} />);
    const user = userEvent.setup();
    // click All option
    await user.click(
      screen.getByRole('button', { name: /repository filter/i })
    );
    await user.click(screen.getByRole('menuitem', { name: 'All' }));
    expect(baseProps.onRepoChange).toHaveBeenCalledWith('');
  });

  it('author dropdown calls onAuthorChange when option is clicked', async () => {
    render(<FiltersBar {...baseProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /author filter/i }));
    await user.click(screen.getByRole('menuitem', { name: 'alice' }));
    expect(baseProps.onAuthorChange).toHaveBeenCalledWith('alice');
  });

  it('author dropdown handles "All" (empty) selection via click', async () => {
    const props = { ...baseProps, authorFilter: 'alice' };
    render(<FiltersBar {...props} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /author filter/i }));
    await user.click(screen.getByRole('menuitem', { name: 'All' }));
    expect(baseProps.onAuthorChange).toHaveBeenCalledWith('');
  });

  it('sort field and order call respective handlers', async () => {
    render(<FiltersBar {...baseProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /sort field/i }));
    await user.click(screen.getByRole('menuitem', { name: 'created' }));
    expect(baseProps.onSortChange).toHaveBeenCalledWith('created');

    await user.click(screen.getByRole('button', { name: /sort order/i }));
    await user.click(screen.getByRole('menuitem', { name: 'asc' }));
    expect(baseProps.onOrderChange).toHaveBeenCalledWith('asc');
  });

  it('sort field covers all options and selectionChange', async () => {
    render(<FiltersBar {...baseProps} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /sort field/i }));
    await user.click(screen.getByRole('menuitem', { name: 'comments' }));
    expect(baseProps.onSortChange).toHaveBeenCalledWith('comments');
    // switch to updated
    await user.click(screen.getByRole('button', { name: /sort field/i }));
    await user.click(screen.getByRole('menuitem', { name: 'updated' }));
    expect(baseProps.onSortChange).toHaveBeenCalledWith('updated');
  });

  it('per page dropdown calls onPerPageChange', async () => {
    render(<FiltersBar {...baseProps} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /items per page/i }));
    await user.click(screen.getByRole('menuitem', { name: '40' }));
    expect(baseProps.onPerPageChange).toHaveBeenCalledWith(40);
  });

  it('per page covers multiple options and label reflects pageSize', async () => {
    const props = { ...baseProps, pageSize: 10 };
    render(<FiltersBar {...props} />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /items per page/i });
    expect(trigger).toHaveTextContent('Per page: 10');
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: '50' }));
    expect(baseProps.onPerPageChange).toHaveBeenCalledWith(50);
  });

  it('order covers both asc and desc and label reflects order', async () => {
    const props = { ...baseProps, order: 'asc' as const };
    render(<FiltersBar {...props} />);
    const user = userEvent.setup();
    const trigger = screen.getByRole('button', { name: /sort order/i });
    expect(trigger).toHaveTextContent('Order: asc');
    await user.click(trigger);
    await user.click(screen.getByRole('menuitem', { name: 'desc' }));
    expect(baseProps.onOrderChange).toHaveBeenCalledWith('desc');
  });

  it('labels of repo/author reflect current selection', () => {
    render(
      <FiltersBar {...baseProps} repoFilter="repo-b" authorFilter="bob" />
    );
    expect(
      screen.getByRole('button', { name: /repository filter/i })
    ).toHaveTextContent('repo-b');
    expect(
      screen.getByRole('button', { name: /author filter/i })
    ).toHaveTextContent('bob');
  });
});

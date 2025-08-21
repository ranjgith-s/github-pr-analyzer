// Jest module-level mocks for hooks and services used by QueryDisplay
import React from 'react';

let mockToken: string | null = null;
const mockAddBookmark = jest.fn();
const mockAddToHistory = jest.fn();

jest.mock('../../../contexts/AuthContext/AuthContext', () => ({
  useAuth: () => ({
    token: mockToken,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('../../../hooks/useQueryHistory', () => ({
  useQueryHistory: () => ({
    addBookmark: mockAddBookmark,
    addToHistory: mockAddToHistory,
    history: [],
    bookmarks: [],
    removeBookmark: jest.fn(),
    clearHistory: jest.fn(),
  }),
}));

import {
  render,
  screen,
  act,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import * as RouterDom from 'react-router-dom';
import { QueryDisplay } from '../QueryDisplay';
import { featureFlags } from '@/feature-flags';
import * as queryValidator from '../../../services/queryValidator';
import { SuggestionService } from '../../../services/suggestionService';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

beforeEach(() => {
  mockToken = null;
  mockAddBookmark.mockReset();
  mockAddToHistory.mockReset();
  jest.restoreAllMocks();
  // Ensure buttons are rendered for tests that rely on them
  featureFlags.share = true;
  featureFlags.bookmark = true;
});

describe('QueryDisplay', () => {
  it('should display query text correctly', () => {
    renderWithRouter(<QueryDisplay query="is:pr author:john" />);

    expect(screen.getByText('is:pr author:john')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithRouter(
      <QueryDisplay query="is:pr author:john" isLoading={true} />
    );

    expect(screen.getByText('Loading results...')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { hidden: true })
    ).toBeInTheDocument();
  });

  it('should display result count when provided', () => {
    renderWithRouter(
      <QueryDisplay query="is:pr author:john" resultCount={42} />
    );

    expect(screen.getByText('42 results')).toBeInTheDocument();
  });

  it('should handle singular result count', () => {
    renderWithRouter(
      <QueryDisplay query="is:pr author:john" resultCount={1} />
    );

    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('should show error state', () => {
    renderWithRouter(
      <QueryDisplay query="is:pr author:john" error="Invalid query syntax" />
    );

    expect(screen.getByText('Error: Invalid query syntax')).toBeInTheDocument();
  });

  it('should show ready state when no count or loading', () => {
    renderWithRouter(<QueryDisplay query="is:pr author:john" />);

    expect(screen.getByText('Ready to search')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    renderWithRouter(
      <QueryDisplay query="is:pr author:john" resultCount={5} />
    );

    const codeElement = screen.getByRole('code');
    expect(codeElement).toHaveAttribute('aria-label', 'Current search query');
    expect(codeElement).toHaveAttribute('tabIndex', '0');
  });

  it('should display external link for documentation', () => {
    renderWithRouter(<QueryDisplay query="is:pr author:john" />);

    const link = screen.getByRole('link', { name: 'Learn more' });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests'
    );
  });

  it('should apply custom className', () => {
    const { container } = renderWithRouter(
      <QueryDisplay query="is:pr author:john" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show proper icon for each state', () => {
    const { rerender } = renderWithRouter(
      <QueryDisplay query="test" isLoading={true} />
    );
    expect(
      screen.getByRole('progressbar', { hidden: true })
    ).toBeInTheDocument();

    rerender(
      <BrowserRouter>
        <QueryDisplay query="test" error="Error message" />
      </BrowserRouter>
    );
    expect(screen.getByText(/Error:/)).toBeInTheDocument();

    rerender(
      <BrowserRouter>
        <QueryDisplay query="test" resultCount={5} />
      </BrowserRouter>
    );
    expect(screen.getByText('5 results')).toBeInTheDocument();

    rerender(
      <BrowserRouter>
        <QueryDisplay query="test" />
      </BrowserRouter>
    );
    expect(screen.getByText('Ready to search')).toBeInTheDocument();
  });

  it('should enter edit mode and display textarea', async () => {
    renderWithRouter(<QueryDisplay query="is:pr author:john" />);
    const editButton = screen.getByRole('button', { name: /edit query/i });

    await act(async () => {
      editButton.click();
    });

    expect(screen.getByLabelText('Edit search query')).toBeInTheDocument();
    expect(
      screen.getByText('Press Cmd+Enter to apply, Escape to cancel')
    ).toBeInTheDocument();
  });

  it('should update character count as user types', async () => {
    const user = userEvent.setup();
    renderWithRouter(<QueryDisplay query="abc" />);

    await act(async () => {
      screen.getByRole('button', { name: /edit query/i }).click();
    });

    const textarea = screen.getByLabelText(
      'Edit search query'
    ) as HTMLTextAreaElement;
    expect(screen.getByText('3/256')).toBeInTheDocument();

    await act(async () => {
      await user.clear(textarea);
      await user.type(textarea, 'abcdef');
      fireEvent.change(textarea, { target: { value: 'abcdef' } });
    });

    expect(screen.getByText('6/256')).toBeInTheDocument();
  });

  it('should call onQueryChange with valid query on save', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    renderWithRouter(<QueryDisplay query="foo" onQueryChange={handleChange} />);

    await act(async () => {
      screen.getByRole('button', { name: /edit query/i }).click();
    });

    const textarea = screen.getByLabelText(
      'Edit search query'
    ) as HTMLTextAreaElement;

    await act(async () => {
      await user.clear(textarea);
      await user.type(textarea, 'bar');
      fireEvent.change(textarea, { target: { value: 'bar' } });
    });

    await act(async () => {
      screen.getByRole('button', { name: /apply/i }).click();
    });

    expect(handleChange).toHaveBeenCalled();
    expect(handleChange.mock.calls[0][0]).toContain('bar');
  });

  it('should not call onQueryChange if query is invalid', async () => {
    const handleChange = jest.fn();
    const spy = jest.spyOn(queryValidator, 'validateQuery').mockReturnValue({
      isValid: false,
      sanitized: '',
      errors: ['Invalid'],
      warnings: [],
    });
    renderWithRouter(<QueryDisplay query="foo" onQueryChange={handleChange} />);

    await act(async () => {
      screen.getByRole('button', { name: /edit query/i }).click();
    });

    await act(async () => {
      screen.getByRole('button', { name: /apply/i }).click();
    });

    expect(handleChange).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should show validation errors and warnings', async () => {
    const spy = jest.spyOn(queryValidator, 'validateQuery').mockReturnValue({
      isValid: false,
      sanitized: '',
      errors: ['Error1'],
      warnings: ['Warn1'],
    });
    renderWithRouter(<QueryDisplay query="foo" />);

    await act(async () => {
      screen.getByRole('button', { name: /edit query/i }).click();
    });

    expect(screen.getByText('Error1')).toBeInTheDocument();
    expect(screen.getByText('Warn1')).toBeInTheDocument();
    spy.mockRestore();
  });

  it('should cancel editing and revert changes', async () => {
    renderWithRouter(<QueryDisplay query="foo" />);

    await act(async () => {
      screen.getByRole('button', { name: /edit query/i }).click();
    });

    const textarea = screen.getByLabelText(
      'Edit search query'
    ) as HTMLTextAreaElement;

    await act(async () => {
      textarea.value = 'bar';
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await act(async () => {
      screen.getByRole('button', { name: /cancel/i }).click();
    });

    expect(
      screen.queryByLabelText('Edit search query')
    ).not.toBeInTheDocument();
    expect(screen.getByText('foo')).toBeInTheDocument();
  });

  it('should support keyboard shortcuts for save and cancel', async () => {
    const handleChange = jest.fn();
    renderWithRouter(<QueryDisplay query="foo" onQueryChange={handleChange} />);

    await act(async () => {
      screen.getByRole('button', { name: /edit query/i }).click();
    });

    const textarea = screen.getByLabelText(
      'Edit search query'
    ) as HTMLTextAreaElement;

    await act(async () => {
      textarea.focus();
      textarea.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          key: 'Enter',
          metaKey: true,
          bubbles: true,
        })
      );
    });

    expect(handleChange).toHaveBeenCalled();

    await act(async () => {
      screen.getByRole('button', { name: /edit query/i }).click();
    });

    const textarea2 = screen.getByLabelText(
      'Edit search query'
    ) as HTMLTextAreaElement;

    await act(async () => {
      textarea2.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          key: 'Escape',
          bubbles: true,
        })
      );
    });

    expect(
      screen.queryByLabelText('Edit search query')
    ).not.toBeInTheDocument();
  });

  it('should not render edit button if editable is false', () => {
    renderWithRouter(<QueryDisplay query="foo" editable={false} />);
    expect(
      screen.queryByRole('button', { name: /edit query/i })
    ).not.toBeInTheDocument();
  });
});

describe('QueryDisplay additional coverage', () => {
  const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
    global.navigator,
    'clipboard'
  );

  beforeAll(() => {
    Object.defineProperty(global.navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });
  });
  afterAll(() => {
    if (originalClipboardDescriptor) {
      Object.defineProperty(
        global.navigator,
        'clipboard',
        originalClipboardDescriptor
      );
    } else {
      // @ts-expect-error cleanup
      delete global.navigator.clipboard;
    }
  });

  it('opens and closes share modal', async () => {
    renderWithRouter(<QueryDisplay query="is:pr" />);
    const shareBtn = screen.getByRole('button', { name: /share/i });
    await act(async () => shareBtn.click());
    expect(screen.getByText('Share Query')).toBeInTheDocument();
    const closeBtn = screen.getByRole('button', { name: /^close$/i });
    await act(async () => closeBtn.click());
    await waitFor(() => {
      expect(screen.queryByText('Share Query')).not.toBeInTheDocument();
    });
  });

  it('bookmarks a valid query', async () => {
    renderWithRouter(<QueryDisplay query="is:pr" />);
    const bookmarkBtn = screen.getByRole('button', { name: /bookmark/i });
    await act(async () => bookmarkBtn.click());
    expect(mockAddBookmark).toHaveBeenCalled();
  });

  it('switches between advanced and visual modes', async () => {
    renderWithRouter(<QueryDisplay query="is:pr author:me" />);
    const editBtn = screen.getByRole('button', { name: /edit query/i });
    await act(async () => editBtn.click());
    const toggle = screen.getByRole('switch');
    await act(async () => toggle.click());
    expect(await screen.findByText('Filters')).toBeInTheDocument();
  });

  it('handles autocomplete suggestions and selection', async () => {
    mockToken = 'tok';
    const spy = jest
      .spyOn(SuggestionService, 'getSuggestions')
      .mockResolvedValue([
        {
          type: 'user',
          value: 'author:john',
          display: 'author:john',
          insertText: 'author:john',
          description: 'author filter',
        },
      ] as any);
    renderWithRouter(<QueryDisplay query="is:pr" />);
    await act(async () =>
      screen.getByRole('button', { name: /edit query/i }).click()
    );
    const textarea = screen.getByLabelText('Edit search query');
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'is:pr a' } });
    });
    expect(await screen.findByRole('option')).toBeInTheDocument();
    await act(async () => screen.getByRole('option').click());
    expect((textarea as HTMLTextAreaElement).value).toContain('author:john');
    spy.mockRestore();
  });

  it('updates URL params and history on apply', async () => {
    // mock useSearchParams setter
    const setParams = jest.fn();
    jest
      .spyOn(RouterDom, 'useSearchParams')
      .mockReturnValue([new URLSearchParams(), setParams] as any);
    renderWithRouter(<QueryDisplay query="is:pr" />);
    await act(async () =>
      screen.getByRole('button', { name: /edit query/i }).click()
    );
    const textarea = screen.getByLabelText('Edit search query');
    await act(async () =>
      fireEvent.change(textarea, { target: { value: 'is:pr author:alice' } })
    );
    await act(async () =>
      screen.getByRole('button', { name: /apply/i }).click()
    );
    expect(mockAddToHistory).toHaveBeenCalledWith(
      expect.stringContaining('author:alice')
    );
    expect(setParams).toHaveBeenCalled();
  });

  it('Escape closes autocomplete before cancelling edit', async () => {
    mockToken = 'tok';
    jest
      .spyOn(SuggestionService, 'getSuggestions')
      .mockResolvedValueOnce([
        { type: 'user', value: 'author:john', display: 'author:john' },
      ] as any);
    renderWithRouter(<QueryDisplay query="is:pr" />);
    await act(async () =>
      screen.getByRole('button', { name: /edit query/i }).click()
    );
    const textarea = screen.getByLabelText('Edit search query');
    await act(async () =>
      fireEvent.change(textarea, { target: { value: 'is:pr a' } })
    );
    expect(await screen.findByRole('option')).toBeInTheDocument();
    await act(async () => fireEvent.keyDown(textarea, { key: 'Escape' }));
    await waitFor(() =>
      expect(screen.queryByRole('option')).not.toBeInTheDocument()
    );
    await act(async () => fireEvent.keyDown(textarea, { key: 'Escape' }));
    expect(
      screen.queryByLabelText('Edit search query')
    ).not.toBeInTheDocument();
  });
});

// Edge branch coverage
describe('QueryDisplay edge branch coverage', () => {
  it('handles autocomplete service failure gracefully (hides dropdown)', async () => {
    mockToken = 'tok';
    jest
      .spyOn(SuggestionService, 'getSuggestions')
      .mockRejectedValue(new Error('net fail'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    renderWithRouter(<QueryDisplay query="is:pr" />);
    await act(async () =>
      screen.getByRole('button', { name: /edit query/i }).click()
    );
    const textarea = screen.getByLabelText('Edit search query');
    await act(async () =>
      fireEvent.change(textarea, { target: { value: 'is:pr a' } })
    );
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('does not show autocomplete for empty input even with token', async () => {
    mockToken = 'tok';
    const getSuggestions = jest
      .spyOn(SuggestionService, 'getSuggestions')
      .mockResolvedValueOnce([
        { type: 'user', value: 'author:john', display: 'author:john' },
      ] as any)
      .mockResolvedValueOnce([] as any);
    renderWithRouter(<QueryDisplay query="is:pr" />);
    await act(async () =>
      screen.getByRole('button', { name: /edit query/i }).click()
    );
    const textarea = screen.getByLabelText('Edit search query');
    await act(async () =>
      fireEvent.change(textarea, { target: { value: 'is:pr a' } })
    );
    expect(await screen.findByRole('option')).toBeInTheDocument();
    await act(async () =>
      fireEvent.change(textarea, { target: { value: '' } })
    );
    await waitFor(() =>
      expect(screen.queryByRole('option')).not.toBeInTheDocument()
    );
    getSuggestions.mockRestore();
  });

  it('does not bookmark when query invalid', async () => {
    jest.spyOn(queryValidator, 'validateQuery').mockReturnValue({
      isValid: false,
      sanitized: 'bad',
      errors: ['err'],
      warnings: [],
    });
    renderWithRouter(<QueryDisplay query="is:pr" />);
    const bookmarkBtn = screen.getByRole('button', { name: /bookmark/i });
    await act(async () => bookmarkBtn.click());
    expect(mockAddBookmark).not.toHaveBeenCalled();
  });

  it('inserts suggestion after colon boundary (wordStart branch)', async () => {
    mockToken = 'tok';
    jest.spyOn(SuggestionService, 'getSuggestions').mockResolvedValue([
      {
        type: 'user',
        value: 'author:alice',
        display: 'author:alice',
        insertText: 'author:alice',
      },
    ] as any);
    // Start without the trailing colon so that the subsequent change event updates the value
    renderWithRouter(<QueryDisplay query="author" />);
    await act(async () =>
      screen.getByRole('button', { name: /edit query/i }).click()
    );
    const textarea = screen.getByLabelText('Edit search query');
    // Change value to add the colon which should trigger suggestions at the word boundary
    await act(async () =>
      fireEvent.change(textarea, { target: { value: 'author:' } })
    );
    expect(await screen.findByRole('option')).toBeInTheDocument();
    await act(async () => screen.getByRole('option').click());
    expect((textarea as HTMLTextAreaElement).value).toMatch(/author:alice/);
  });

  it('Enter without modifier does not save', async () => {
    const onChange = jest.fn();
    renderWithRouter(<QueryDisplay query="is:pr" onQueryChange={onChange} />);
    await act(async () =>
      screen.getByRole('button', { name: /edit query/i }).click()
    );
    const textarea = screen.getByLabelText('Edit search query');
    await act(async () => {
      fireEvent.keyDown(textarea, { key: 'Enter', bubbles: true });
    });
    expect(screen.getByLabelText('Edit search query')).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('toggle visual then back to advanced preserves content', async () => {
    renderWithRouter(<QueryDisplay query="is:pr author:me" />);
    await act(async () =>
      screen.getByRole('button', { name: /edit query/i }).click()
    );
    const toggle = screen.getByRole('switch');
    await act(async () => toggle.click());
    expect(await screen.findByText('Filters')).toBeInTheDocument();
    await act(async () => toggle.click());
    const textarea = screen.getByLabelText(
      'Edit search query'
    ) as HTMLTextAreaElement;
    expect(textarea.value.length).toBeGreaterThan(0);
  });

  it('hides autocomplete when no suggestions returned', async () => {
    mockToken = 'tok';
    jest
      .spyOn(SuggestionService, 'getSuggestions')
      .mockResolvedValue([] as any);
    renderWithRouter(<QueryDisplay query="is:pr" />);
    await act(async () =>
      screen.getByRole('button', { name: /edit query/i }).click()
    );
    const textarea = screen.getByLabelText('Edit search query');
    await act(async () =>
      fireEvent.change(textarea, { target: { value: 'is:pr x' } })
    );
    await waitFor(() =>
      expect(SuggestionService.getSuggestions).toHaveBeenCalled()
    );
    // No options should appear because suggestions array is empty (length > 0 branch false)
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});

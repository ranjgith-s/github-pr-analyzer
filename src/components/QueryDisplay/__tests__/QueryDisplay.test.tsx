import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryDisplay } from '../QueryDisplay';
import { AuthProvider } from '../../../contexts/AuthContext/AuthContext';
import * as queryValidator from '../../../services/queryValidator';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
};

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
    renderWithRouter(<QueryDisplay query="abc" />);

    await act(async () => {
      screen.getByRole('button', { name: /edit query/i }).click();
    });

    const textarea = screen.getByLabelText(
      'Edit search query'
    ) as HTMLTextAreaElement;
    expect(screen.getByText('3/256')).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'abcdef' } });
    });

    expect(screen.getByText('6/256')).toBeInTheDocument();
  });

  it('should call onQueryChange with valid query on save', async () => {
    const handleChange = jest.fn();
    renderWithRouter(<QueryDisplay query="foo" onQueryChange={handleChange} />);

    await act(async () => {
      screen.getByRole('button', { name: /edit query/i }).click();
    });

    const textarea = screen.getByLabelText(
      'Edit search query'
    ) as HTMLTextAreaElement;

    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'bar' } });
    });

    await act(async () => {
      screen.getByRole('button', { name: /apply/i }).click();
    });

    // The query validator may add qualifiers, so check that it was called
    expect(handleChange).toHaveBeenCalled();
    // And that the call contains the text we typed
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
      // Cmd+Enter
      textarea.dispatchEvent(
        new window.KeyboardEvent('keydown', {
          key: 'Enter',
          metaKey: true,
          bubbles: true,
        })
      );
    });

    expect(handleChange).toHaveBeenCalled();

    // Re-enter edit mode for Escape
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

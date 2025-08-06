import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryDisplay } from '../QueryDisplay';

describe('QueryDisplay', () => {
  it('should display query text correctly', () => {
    render(<QueryDisplay query="is:pr author:john" />);

    expect(screen.getByText('is:pr author:john')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<QueryDisplay query="is:pr author:john" isLoading={true} />);

    expect(screen.getByText('Loading results...')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { hidden: true })
    ).toBeInTheDocument();
  });

  it('should display result count when provided', () => {
    render(<QueryDisplay query="is:pr author:john" resultCount={42} />);

    expect(screen.getByText('42 results')).toBeInTheDocument();
  });

  it('should handle singular result count', () => {
    render(<QueryDisplay query="is:pr author:john" resultCount={1} />);

    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('should show error state', () => {
    render(
      <QueryDisplay query="is:pr author:john" error="Invalid query syntax" />
    );

    expect(screen.getByText('Error: Invalid query syntax')).toBeInTheDocument();
  });

  it('should show ready state when no count or loading', () => {
    render(<QueryDisplay query="is:pr author:john" />);

    expect(screen.getByText('Ready to search')).toBeInTheDocument();
  });

  it('should be accessible', () => {
    render(<QueryDisplay query="is:pr author:john" resultCount={5} />);

    const codeElement = screen.getByRole('code');
    expect(codeElement).toHaveAttribute('aria-label', 'Current search query');
    expect(codeElement).toHaveAttribute('tabIndex', '0');
  });

  it('should display external link for documentation', () => {
    render(<QueryDisplay query="is:pr author:john" />);

    const link = screen.getByRole('link', { name: 'Learn more' });
    expect(link).toHaveAttribute(
      'href',
      'https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests'
    );
  });

  it('should apply custom className', () => {
    const { container } = render(
      <QueryDisplay query="is:pr author:john" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should show proper icon for each state', () => {
    const { rerender } = render(<QueryDisplay query="test" isLoading={true} />);
    expect(
      screen.getByRole('progressbar', { hidden: true })
    ).toBeInTheDocument();

    rerender(<QueryDisplay query="test" error="Error message" />);
    expect(screen.getByText(/Error:/)).toBeInTheDocument();

    rerender(<QueryDisplay query="test" resultCount={5} />);
    expect(screen.getByText('5 results')).toBeInTheDocument();

    rerender(<QueryDisplay query="test" />);
    expect(screen.getByText('Ready to search')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import DiffCell from '../DiffCell';

describe('DiffCell', () => {
  it('renders additions and deletions with signs and colors', () => {
    render(<DiffCell additions={123} deletions={45} />);

    const text = screen.getByText('+123');
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass('text-green-400');

    const del = screen.getByText('-45');
    expect(del).toBeInTheDocument();
    expect(del).toHaveClass('text-red-400');
  });
});

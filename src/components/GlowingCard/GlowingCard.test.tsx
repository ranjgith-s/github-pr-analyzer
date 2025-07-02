import React from 'react';
import { render, screen } from '@testing-library/react';
import GlowingCard from '../GlowingCard';

describe('GlowingCard', () => {
  it('renders children correctly', () => {
    render(
      <GlowingCard>Test Content</GlowingCard>
    );
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <GlowingCard className="custom-class" data-testid="glow-card">Content</GlowingCard>
    );
    const card = screen.getByTestId('glow-card');
    expect(card).toHaveClass('custom-class');
  });

  it('matches snapshot', () => {
    const { container } = render(<GlowingCard>Snapshot</GlowingCard>);
    expect(container.firstChild).toMatchSnapshot();
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from './Home';

describe('Home', () => {
  it('renders Pull Request Insights card', () => {
    render(<Home />);
    const card = screen.getByText('Pull Request Insights').closest('[href]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('href', '/insights');
    expect(screen.getByText(/See metrics for your pull requests/i)).toBeInTheDocument();
  });

  it('renders Developer Insights card', () => {
    render(<Home />);
    const card = screen.getByText('Developer Insights').closest('[href]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('href', '/developer');
    expect(screen.getByText(/View a developer/i)).toBeInTheDocument();
  });

  it('renders Repository Insights card', () => {
    render(<Home />);
    const card = screen.getByText('Repository Insights').closest('[href]');
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute('href', '/repo');
    expect(screen.getByText(/Explore repository health/i)).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(<Home />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

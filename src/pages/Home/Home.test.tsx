import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';

describe('Home', () => {
  it('renders Pull Request Insights tile with correct link', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', {
      name: /Go to Pull Request Insights/i,
    });
    expect(link).toHaveAttribute('href', '/insights');
    expect(
      within(link).getByText(/Pull Request Insights/i)
    ).toBeInTheDocument();
  });

  it('renders Developer Insights tile with correct link', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', {
      name: /Go to Developer Insights/i,
    });
    expect(link).toHaveAttribute('href', '/developer');
    expect(within(link).getByText(/Developer Insights/i)).toBeInTheDocument();
  });

  it('renders Repository Insights tile with correct link', () => {
    render(
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    );
    const link = screen.getByRole('link', {
      name: /Go to Repository Insights/i,
    });
    expect(link).toHaveAttribute('href', '/repo');
    expect(within(link).getByText(/Repository Insights/i)).toBeInTheDocument();
  });
});

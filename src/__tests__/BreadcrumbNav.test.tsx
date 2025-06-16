import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import BreadcrumbNav from '../BreadcrumbNav';

function renderWithRouter(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="*" element={<BreadcrumbNav />} />
      </Routes>
    </MemoryRouter>
  );
}

test('renders root breadcrumb', () => {
  renderWithRouter('/');
  expect(screen.getByText('Pull Requests')).toBeInTheDocument();
});

test('renders PR breadcrumb', () => {
  render(
    <MemoryRouter initialEntries={['/pr/octo/repo/1']}>
      <Routes>
        <Route path="/pr/:owner/:repo/:number" element={<BreadcrumbNav />} />
      </Routes>
    </MemoryRouter>
  );
  expect(screen.getByText('octo/repo #1')).toBeInTheDocument();
});

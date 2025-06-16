import React from 'react';
import {render, screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import PullRequestPage from '../PullRequest';
import {AuthProvider} from '../AuthContext';

const timeline = [
  {label: 'Created', date: '2020-01-01T00:00:00Z'},
  {label: 'Closed', date: '2020-01-02T00:00:00Z'}
];

test('renders timeline from router state', () => {
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[{pathname: '/pr/o/r/1', state: {title: 'PR', timeline}}]}>
        <PullRequestPage />
      </MemoryRouter>
    </AuthProvider>
  );
  expect(screen.getByText('PR')).toBeInTheDocument();
  expect(screen.getByText(/Created/)).toBeInTheDocument();
  expect(screen.getByText(/Closed/)).toBeInTheDocument();
});

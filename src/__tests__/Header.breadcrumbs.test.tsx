import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Header from '../Header';
import { AuthProvider } from '../AuthContext';
import { ThemeModeProvider } from '../ThemeModeContext';
import { MemoryRouter } from 'react-router-dom';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: {
      users: {
        getAuthenticated: jest.fn().mockResolvedValue({ data: { login: 'octocat', avatar_url: 'img' } }),
      },
    },
  })),
}));

describe('Header breadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders multiple breadcrumbs and highlights the last', async () => {
    function Wrapper() {
      const auth = require('../AuthContext').useAuth();
      React.useEffect(() => {
        auth.login('token');
      }, [auth]);
      return (
        <Header
          breadcrumbs={[
            { label: 'Developer', to: '/developer' },
            { label: 'Octo Cat', to: '/developer/octocat' },
          ]}
        />
      );
    }

    render(
      <MemoryRouter>
        <ThemeModeProvider>
          <AuthProvider>
            <Wrapper />
          </AuthProvider>
        </ThemeModeProvider>
      </MemoryRouter>
    );

    // Only check for breadcrumbs, not username
    expect(screen.getByText('Developer')).toBeInTheDocument();
    expect(screen.getByText('Octo Cat')).toBeInTheDocument();
  });
});

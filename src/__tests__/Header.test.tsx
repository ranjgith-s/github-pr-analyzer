import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Header from '../Header';
import { AuthProvider, useAuth } from '../AuthContext';
import { ThemeModeProvider } from '../ThemeModeContext';
import { MemoryRouter } from 'react-router-dom';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

test('fetches and displays user info', async () => {
  const mockOctokit = {
    rest: { users: { getAuthenticated: jest.fn() } },
  } as any;
  (Octokit as jest.Mock).mockImplementation(() => mockOctokit);
  mockOctokit.rest.users.getAuthenticated.mockResolvedValue({
    data: { login: 'octo', avatar_url: 'img' },
  });

  function Wrapper() {
    const auth = useAuth();
    useEffect(() => {
      auth.login('token');
    }, [auth]);
    return (
      <MemoryRouter>
        <Header
          breadcrumb={{ label: 'Pull request insights', to: '/insights' }}
        />
      </MemoryRouter>
    );
  }

  render(
    <ThemeModeProvider>
      <AuthProvider>
        <Wrapper />
      </AuthProvider>
    </ThemeModeProvider>
  );

  await waitFor(() => expect(screen.getByText('octo')).toBeInTheDocument());
  expect(Octokit).toHaveBeenCalledWith({ auth: 'token' });
  const link = screen.getByRole('link', { name: 'Pull request insights' });
  expect(link).toHaveAttribute('href', '/insights');
});

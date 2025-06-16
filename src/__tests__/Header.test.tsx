import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../Header';
import { AuthProvider, useAuth } from '../AuthContext';
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
        <Header />
      </MemoryRouter>
    );
  }

  render(
    <AuthProvider>
      <Wrapper />
    </AuthProvider>
  );

  await waitFor(() => expect(screen.getByText('octo')).toBeInTheDocument());
  expect(Octokit).toHaveBeenCalledWith({ auth: 'token' });
  expect(screen.getByText('Pull Requests')).toBeInTheDocument();
});

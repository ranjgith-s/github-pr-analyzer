import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Header from '../Header';
import { AuthProvider } from '../AuthContext';
import { ThemeModeProvider } from '../ThemeModeContext';
import { MemoryRouter } from 'react-router-dom';
import { Octokit } from '@octokit/rest';
import * as AuthContextModule from '../AuthContext';

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn().mockImplementation(() => ({
    rest: { users: { getAuthenticated: jest.fn().mockResolvedValue({ data: { login: 'octo', avatar_url: 'img' } }) } },
  })),
}));

afterEach(() => {
  jest.restoreAllMocks();
});

test('fetches and displays user info', async () => {
  function Wrapper() {
    const auth = AuthContextModule.useAuth();
    useEffect(() => {
      auth.login('token');
    }, [auth]);
    return (
      <Header
        breadcrumbs={[{ label: 'Pull request insights', to: '/insights' }]}
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

  await waitFor(() => expect(screen.getByText('octo')).toBeInTheDocument());
  expect(Octokit).toHaveBeenCalledWith({ auth: 'token' });
  expect(screen.getByText('Pull request insights')).toBeInTheDocument();
});

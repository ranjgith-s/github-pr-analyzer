import React, { useEffect } from 'react';
import { render, screen } from '@testing-library/react';
import Header from './Header';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContextModule from '../../contexts/AuthContext/AuthContext';
import * as githubService from '../../utils/services/githubService';

jest.mock('../../utils/services/githubService');

const mockUser = { login: 'octo', avatar_url: 'img' };

afterEach(() => {
  jest.restoreAllMocks();
});

test('fetches and displays user info', async () => {
  (githubService.getAuthenticatedUserProfile as jest.Mock).mockResolvedValue(
    mockUser
  );
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

  expect(githubService.getAuthenticatedUserProfile).toHaveBeenCalledWith(
    'token'
  );
  expect(screen.getByText('Pull request insights')).toBeInTheDocument();
});

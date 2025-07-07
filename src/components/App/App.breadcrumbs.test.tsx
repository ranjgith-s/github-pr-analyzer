import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';

jest.mock('../../utils/services/githubService', () => ({
  ...jest.requireActual('../../utils/services/githubService'),
  getDeveloperProfile: jest.fn(() =>
    Promise.resolve({
      login: 'octocat',
      name: 'The Octocat',
      avatar_url: 'https://github.com/images/error/octocat_happy.gif',
      html_url: 'https://github.com/octocat',
      bio: 'Test bio',
      company: 'GitHub',
      location: 'San Francisco',
      followers: 100,
      following: 0,
      public_repos: 10,
    })
  ),
}));

describe('App breadcrumbs integration', () => {
  function LoggedIn() {
    const auth = require('../../contexts/AuthContext/AuthContext').useAuth();
    React.useEffect(() => {
      auth.login('token');
    }, [auth]);
    return <App />;
  }

  test('shows Developer and user name in breadcrumbs on profile page', async () => {
    render(
      <MemoryRouter initialEntries={['/developer/octocat']}>
        <ThemeModeProvider>
          <AuthProvider>
            <LoggedIn />
          </AuthProvider>
        </ThemeModeProvider>
      </MemoryRouter>
    );
    await waitFor(() =>
      expect(screen.getByText('Developer Insights')).toBeInTheDocument()
    );
    expect(screen.getByText('The Octocat')).toBeInTheDocument();
  });
});

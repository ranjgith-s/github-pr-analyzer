import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { AuthProvider } from '../AuthContext';
import { ThemeModeProvider } from '../ThemeModeContext';

jest.mock('../services/github', () => ({
  ...jest.requireActual('../services/github'),
  getDeveloperProfile: jest.fn(() => Promise.resolve({
    login: 'octocat',
    name: 'Octo Cat',
    avatar_url: 'img',
    html_url: '',
    bio: '',
    company: '',
    location: '',
    followers: 0,
    following: 0,
    public_repos: 0,
  })),
}));

describe('App breadcrumbs integration', () => {
  function LoggedIn() {
    const auth = require('../AuthContext').useAuth();
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
    await waitFor(() => expect(screen.getByText('Developer Insights')).toBeInTheDocument());
    expect(screen.getByText('Octo Cat')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';

jest.mock('../../utils/services/github', () => ({
  ...jest.requireActual('../../utils/services/github'),
  getDeveloperProfile: jest.fn(() => Promise.resolve({
    login: 'octocat',
    name: 'Octo Cat',
    avatar_url: 'avatar',
    bio: 'bio',
    company: 'company',
    location: 'location',
    public_repos: 3,
    followers: 10,
    following: 5,
    html_url: 'url',
  })),
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
    await waitFor(() => expect(screen.getByText('Developer Insights')).toBeInTheDocument());
    expect(screen.getByText('Octo Cat')).toBeInTheDocument();
  });
});

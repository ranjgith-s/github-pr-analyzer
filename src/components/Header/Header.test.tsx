import React, { useEffect } from 'react';
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from '@testing-library/react';
import Header from './Header';
import { AuthProvider } from '../../contexts/AuthContext/AuthContext';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext/ThemeModeContext';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContextModule from '../../contexts/AuthContext/AuthContext';
import * as githubService from '../../utils/services/githubService';

jest.mock('../../utils/services/githubService');
jest.mock('../ThemeSwitcher/ThemeSwitcher', () => {
  const ThemeSwitcher = () => <div data-testid="theme-switcher" />;
  ThemeSwitcher.displayName = 'MockThemeSwitcher';
  return ThemeSwitcher;
});

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

test('renders logout button and calls logout when clicked', async () => {
  const logout = jest.fn();
  jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    token: 't',
    user: null,
    login: jest.fn(),
    logout,
  } as any);
  (githubService.getAuthenticatedUserProfile as jest.Mock).mockResolvedValue({
    login: 'octo',
    avatar_url: 'img',
  });

  render(
    <MemoryRouter>
      <ThemeModeProvider>
        <Header />
      </ThemeModeProvider>
    </MemoryRouter>
  );

  // Wait for avatar to appear then click the only button in the right side group
  const banner = await screen.findByRole('banner');
  const buttons = within(banner).getAllByRole('button');
  // Only one button in this test because ThemeSwitcher is stubbed
  fireEvent.click(buttons[0]);
  expect(logout).toHaveBeenCalled();
});

test('does not fetch user when no token and hides avatar/logout', () => {
  (githubService.getAuthenticatedUserProfile as jest.Mock).mockClear();
  jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    token: null,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  } as any);

  render(
    <MemoryRouter>
      <ThemeModeProvider>
        <Header />
      </ThemeModeProvider>
    </MemoryRouter>
  );

  expect(githubService.getAuthenticatedUserProfile).not.toHaveBeenCalled();
  expect(screen.queryByAltText('avatar')).not.toBeInTheDocument();
  // Only ThemeSwitcher stub is present
  expect(screen.getByTestId('theme-switcher')).toBeInTheDocument();
});

test('logs error when fetching user fails and keeps UI without avatar', async () => {
  const err = new Error('boom');
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
    token: 't',
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  } as any);
  (githubService.getAuthenticatedUserProfile as jest.Mock).mockRejectedValue(
    err
  );

  render(
    <MemoryRouter>
      <ThemeModeProvider>
        <Header />
      </ThemeModeProvider>
    </MemoryRouter>
  );

  // No avatar rendered
  expect(screen.queryByAltText('avatar')).not.toBeInTheDocument();
  await waitFor(() => expect(errorSpy).toHaveBeenCalled());
  errorSpy.mockRestore();
});

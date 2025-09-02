import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import UserAvatar from './UserAvatar';
import * as cache from '../../services/cache';

describe('UserAvatar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders link to GitHub profile with title tooltip and image alt', async () => {
    render(<UserAvatar username="octo" />);
    const link = await screen.findByRole('link', { name: 'octo' });
    expect(link).toHaveAttribute('href', 'https://github.com/octo');
    expect(link).toHaveAttribute('title', 'octo');
    const maybeImg = screen.queryByRole('img', { name: 'octo' });
    if (maybeImg) {
      expect(maybeImg).toBeInTheDocument();
    } else {
      // Fallback initial should be present while image is not loaded in JSDOM
      expect(within(link).getByText('O')).toBeInTheDocument();
    }
  });

  it('uses cache when available and avoids re-setting cache', async () => {
    const key = 'avatar:octo';
    // Seed the cache with user meta so component should read from cache and not call setCache
    await cache.setCache(
      key,
      {
        avatar_url: 'https://avatars.githubusercontent.com/octo?s=80',
        html_url: 'https://github.com/octo',
      },
      60
    );
    const spySet = jest.spyOn(cache, 'setCache');

    render(
      <>
        <UserAvatar username="octo" />
        <UserAvatar username="octo" />
      </>
    );

    await waitFor(() => {
      expect(
        screen.getAllByRole('link', { name: 'octo' }).length
      ).toBeGreaterThan(0);
    });
    // Since cache is pre-populated, component should not call setCache
    expect(spySet).not.toHaveBeenCalled();
  });
});

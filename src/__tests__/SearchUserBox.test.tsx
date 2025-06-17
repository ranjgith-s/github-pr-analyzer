import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchUserBox from '../SearchUserBox';
import { GitHubUser } from '../services/auth';

const sample: GitHubUser[] = [{ login: 'octo', avatar_url: 'x' }];

test('calls handlers when selecting user', async () => {
  const handleQuery = jest.fn();
  const handleSelect = jest.fn();
  render(
    <SearchUserBox
      query="oc"
      options={sample}
      onQueryChange={handleQuery}
      onSelect={handleSelect}
    />
  );
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText(/search github users/i), 't');
  expect(handleQuery).toHaveBeenCalledWith('oct');
  await user.click(screen.getByText('octo'));
  expect(handleSelect).toHaveBeenCalledWith(sample[0]);
});

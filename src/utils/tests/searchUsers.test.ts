import { searchUsers } from '../services/githubService';
import { Octokit } from '@octokit/rest';

const mockInstance: any = { rest: { search: { users: jest.fn() } } };

jest.mock('@octokit/rest', () => ({ Octokit: jest.fn(() => mockInstance) }));

test('searchUsers returns simplified results', async () => {
  (mockInstance.rest.search.users as jest.Mock).mockResolvedValue({
    data: { items: [{ login: 'me', avatar_url: 'x' }] },
  });
  const res = await searchUsers('tok', 'me');
  expect(Octokit).toHaveBeenCalledWith({ auth: 'tok' });
  expect(res[0].login).toBe('me');
});

import { validateToken } from '../services/auth';
import { Octokit } from '@octokit/rest';

const mockInstance: any = { rest: { users: { getAuthenticated: jest.fn() } } };

jest.mock('@octokit/rest', () => ({ Octokit: jest.fn(() => mockInstance) }));

test('validateToken returns user info', async () => {
  mockInstance.rest.users.getAuthenticated.mockResolvedValue({
    data: { login: 'me', avatar_url: 'x' },
  });
  const data = await validateToken('tok');
  expect(Octokit).toHaveBeenCalledWith({ auth: 'tok' });
  expect(data.login).toBe('me');
});

import { validateToken } from './auth';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('validateToken', () => {
  const mockToken = 'mock-token';
  const mockUser = {
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user data for a valid token', async () => {
    const mockGetAuthenticated = jest.fn().mockResolvedValue({ data: mockUser });
    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      rest: {
        users: {
          getAuthenticated: mockGetAuthenticated
        }
      }
    }));

    const result = await validateToken(mockToken);

    expect(Octokit).toHaveBeenCalledWith({ auth: mockToken });
    expect(mockGetAuthenticated).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it('throws an error for an invalid token or network error', async () => {
    const mockError = new Error('Bad credentials');
    const mockGetAuthenticated = jest.fn().mockRejectedValue(mockError);
    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      rest: {
        users: {
          getAuthenticated: mockGetAuthenticated
        }
      }
    }));

    await expect(validateToken(mockToken)).rejects.toThrow('Bad credentials');

    expect(Octokit).toHaveBeenCalledWith({ auth: mockToken });
    expect(mockGetAuthenticated).toHaveBeenCalled();
  });
});

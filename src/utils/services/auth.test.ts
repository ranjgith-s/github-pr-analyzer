import { validateToken } from './auth';
import { Octokit } from '@octokit/rest';

jest.mock('@octokit/rest');

describe('validateToken', () => {
  const mockToken = 'mock-token';
  const mockUser = {
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns user data for a valid token', async () => {
    const mockGetAuthenticated = jest
      .fn()
      .mockResolvedValue({ data: mockUser });
    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      rest: {
        users: {
          getAuthenticated: mockGetAuthenticated,
        },
      },
    }));

    const result = await validateToken(mockToken);

    expect(Octokit).toHaveBeenCalledWith({ auth: mockToken });
    expect(mockGetAuthenticated).toHaveBeenCalled();
    expect(result).toEqual(mockUser);
  });

  it('throws an error for a 401 Unauthorized response (invalid token)', async () => {
    const mockError = new Error('Bad credentials');
    (mockError as any).status = 401;
    const mockGetAuthenticated = jest.fn().mockRejectedValue(mockError);

    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      rest: {
        users: {
          getAuthenticated: mockGetAuthenticated,
        },
      },
    }));

    await expect(validateToken(mockToken)).rejects.toThrow('Bad credentials');

    expect(Octokit).toHaveBeenCalledWith({ auth: mockToken });
    expect(mockGetAuthenticated).toHaveBeenCalled();
  });

  it('throws an error for a 500 network error response', async () => {
    const mockError = new Error('Internal Server Error');
    (mockError as any).status = 500;
    const mockGetAuthenticated = jest.fn().mockRejectedValue(mockError);

    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      rest: {
        users: {
          getAuthenticated: mockGetAuthenticated,
        },
      },
    }));

    await expect(validateToken(mockToken)).rejects.toThrow(
      'Internal Server Error'
    );

    expect(Octokit).toHaveBeenCalledWith({ auth: mockToken });
    expect(mockGetAuthenticated).toHaveBeenCalled();
  });
});

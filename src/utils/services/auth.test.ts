import { validateToken } from './auth';
import { Octokit } from '@octokit/rest';

// Mock the Octokit module
jest.mock('@octokit/rest');

describe('validateToken', () => {
  const mockToken = 'mock-token-123';
  const mockUser = {
    login: 'testuser',
    avatar_url: 'https://example.com/avatar.jpg',
  };

  let getAuthenticatedMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    getAuthenticatedMock = jest.fn();

    // Setup the mock implementation for the Octokit constructor
    (Octokit as unknown as jest.Mock).mockImplementation(() => ({
      rest: {
        users: {
          getAuthenticated: getAuthenticatedMock,
        },
      },
    }));
  });

  it('should create an Octokit instance with the provided token and return user data', async () => {
    // Arrange
    getAuthenticatedMock.mockResolvedValue({ data: mockUser });

    // Act
    const result = await validateToken(mockToken);

    // Assert
    expect(Octokit).toHaveBeenCalledTimes(1);
    expect(Octokit).toHaveBeenCalledWith({ auth: mockToken });
    expect(getAuthenticatedMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual(mockUser);
  });

  it('should throw an error if authentication fails', async () => {
    // Arrange
    const mockError = new Error('Bad credentials');
    getAuthenticatedMock.mockRejectedValue(mockError);

    // Act & Assert
    await expect(validateToken(mockToken)).rejects.toThrow('Bad credentials');

    expect(Octokit).toHaveBeenCalledTimes(1);
    expect(Octokit).toHaveBeenCalledWith({ auth: mockToken });
    expect(getAuthenticatedMock).toHaveBeenCalledTimes(1);
  });
});

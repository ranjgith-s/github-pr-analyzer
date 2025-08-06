import * as githubService from '../githubService';
import { RequestError } from '@octokit/request-error';
import { Octokit } from '@octokit/rest';
import * as queryValidator from '../../../services/queryValidator';
import * as errorHandler from '../../../services/errorHandler';
import * as cache from '../../../services/cache';
import * as githubApi from '../githubApi';

// Mock the dependencies
jest.mock('@octokit/rest');
jest.mock('../githubApi');
jest.mock('../../../services/queryValidator');
jest.mock('../../../services/errorHandler');
jest.mock('../../../services/cache');

const mockOctokit = {
  rest: {
    users: {
      getAuthenticated: jest.fn(),
    },
    search: {
      issuesAndPullRequests: jest.fn(),
    },
    pulls: {
      listCommits: jest.fn(),
    },
  },
  graphql: jest.fn(),
};

describe('Enhanced GitHub Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Octokit as any).mockImplementation(() => mockOctokit);
    (githubApi.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
    (githubApi.getAuthenticatedUser as jest.Mock).mockResolvedValue({
      login: 'testuser',
    });
    (githubApi.searchPRsWithOptions as jest.Mock).mockResolvedValue({
      total_count: 0,
      incomplete_results: false,
      items: [],
    });
    (githubApi.graphqlQuery as jest.Mock).mockResolvedValue({});
    (githubApi.paginateApi as jest.Mock).mockResolvedValue([]);
    (cache.getFromCache as jest.Mock).mockResolvedValue(null);
    (cache.setCache as jest.Mock).mockResolvedValue(undefined);
    (queryValidator.validateAndSanitizeQuery as jest.Mock).mockImplementation(
      (query: string) => query
    );
    (
      errorHandler.handleOctokitError as unknown as jest.Mock
    ).mockImplementation((error: any) => {
      throw error;
    });
  });

  describe('fetchPullRequestMetrics backward compatibility', () => {
    it('should work with no parameters (legacy behavior)', async () => {
      // Mock the query validator and cache
      (queryValidator.validateAndSanitizeQuery as jest.Mock).mockReturnValue(
        'is:pr author:testuser OR is:pr reviewed-by:testuser'
      );

      (cache.getFromCache as jest.Mock).mockResolvedValue(null);

      (githubApi.searchPRsWithOptions as jest.Mock).mockResolvedValue({
        total_count: 1,
        incomplete_results: false,
        items: [
          {
            id: 1,
            number: 1,
            title: 'Test PR',
            repository_url: 'https://api.github.com/repos/owner/repo',
          },
        ],
      });

      (githubApi.graphqlQuery as jest.Mock).mockResolvedValue({
        pr0: {
          pullRequest: {
            id: '1',
            title: 'Test PR',
            author: { login: 'testuser' },
            createdAt: '2023-01-01T00:00:00Z',
            publishedAt: '2023-01-01T01:00:00Z',
            closedAt: null,
            mergedAt: null,
            isDraft: false,
            additions: 10,
            deletions: 5,
            comments: { totalCount: 2 },
            reviews: { nodes: [] },
          },
        },
      });

      (githubApi.paginateApi as jest.Mock).mockResolvedValue([
        { commit: { author: { date: '2023-01-01T00:00:00Z' } } },
      ]);

      const result = await githubService.fetchPullRequestMetrics('token');

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
          }),
        ])
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should work with User parameter (legacy behavior)', async () => {
      const user = { login: 'testuser' };

      // Mock the required functions
      (queryValidator.validateAndSanitizeQuery as jest.Mock).mockReturnValue(
        'is:pr author:testuser OR is:pr reviewed-by:testuser'
      );

      (cache.getFromCache as jest.Mock).mockResolvedValue(null);

      (githubApi.searchPRsWithOptions as jest.Mock).mockResolvedValue({
        total_count: 1,
        incomplete_results: false,
        items: [
          {
            id: 1,
            number: 1,
            title: 'Test PR',
            repository_url: 'https://api.github.com/repos/owner/repo',
          },
        ],
      });

      (githubApi.graphqlQuery as jest.Mock).mockResolvedValue({
        pr0: {
          pullRequest: {
            id: '1',
            title: 'Test PR',
            author: { login: 'testuser' },
            createdAt: '2023-01-01T00:00:00Z',
            publishedAt: '2023-01-01T01:00:00Z',
            closedAt: null,
            mergedAt: null,
            isDraft: false,
            additions: 10,
            deletions: 5,
            comments: { totalCount: 2 },
            reviews: { nodes: [] },
          },
        },
      });

      (githubApi.paginateApi as jest.Mock).mockResolvedValue([
        { commit: { author: { date: '2023-01-01T00:00:00Z' } } },
      ]);

      const result = await githubService.fetchPullRequestMetrics('token', user);

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: expect.any(String),
          }),
        ])
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('fetchPullRequestMetrics new query interface', () => {
    it('should handle dynamic queries with enhanced search options', async () => {
      // Mock the required functions
      (queryValidator.validateAndSanitizeQuery as jest.Mock).mockReturnValue(
        'is:pr author:john'
      );

      (cache.getFromCache as jest.Mock).mockResolvedValue(null);

      (githubApi.searchPRsWithOptions as jest.Mock).mockResolvedValue({
        total_count: 5,
        incomplete_results: false,
        items: [
          {
            id: 1,
            number: 1,
            title: 'Test PR',
            repository_url: 'https://api.github.com/repos/owner/repo',
          },
        ],
      });

      (githubApi.graphqlQuery as jest.Mock).mockResolvedValue({
        pr0: {
          pullRequest: {
            id: '1',
            title: 'Test PR',
            author: { login: 'john' },
            createdAt: '2023-01-01T00:00:00Z',
            publishedAt: '2023-01-01T01:00:00Z',
            closedAt: null,
            mergedAt: null,
            isDraft: false,
            additions: 10,
            deletions: 5,
            comments: { totalCount: 2 },
            reviews: { nodes: [] },
          },
        },
      });

      (githubApi.paginateApi as jest.Mock).mockResolvedValue([
        { commit: { author: { date: '2023-01-01T00:00:00Z' } } },
      ]);

      const result = await githubService.fetchPullRequestMetrics(
        'token',
        'is:pr author:john',
        { page: 1, per_page: 10, sort: 'updated' }
      );

      expect(result).toEqual(
        expect.objectContaining({
          total_count: expect.any(Number),
          incomplete_results: expect.any(Boolean),
          items: expect.any(Array),
        })
      );

      expect(githubApi.searchPRsWithOptions).toHaveBeenCalledWith(
        expect.any(Object),
        'is:pr author:john',
        {
          sort: 'updated',
          order: undefined,
          per_page: 10,
          page: 1,
        }
      );
    });

    it('should handle errors gracefully with enhanced error handling', async () => {
      const mockError = new RequestError('Invalid query', 422, {
        request: {
          method: 'GET',
          url: 'https://api.github.com/search/issues',
          headers: {},
        },
        response: {
          headers: {},
          status: 422,
          url: 'https://api.github.com/search/issues',
          data: { errors: [{ message: 'Invalid search syntax' }] },
        },
      });

      (
        errorHandler.handleOctokitError as unknown as jest.Mock
      ).mockImplementation(() => {
        throw new Error('Invalid search query: Invalid search syntax');
      });

      (queryValidator.validateAndSanitizeQuery as jest.Mock).mockReturnValue(
        'invalid query'
      );

      (cache.getFromCache as jest.Mock).mockResolvedValue(null);

      (githubApi.searchPRsWithOptions as jest.Mock).mockRejectedValue(
        mockError
      );

      await expect(
        githubService.fetchPullRequestMetrics('token', 'invalid query')
      ).rejects.toThrow('Invalid search query');
    });

    it('should use cache when available', async () => {
      const cachedResult = {
        total_count: 3,
        incomplete_results: false,
        items: [
          { id: '1', title: 'Cached PR', owner: 'test', repo: 'test/repo' },
        ],
      };

      (queryValidator.validateAndSanitizeQuery as jest.Mock).mockReturnValue(
        'is:pr author:john'
      );

      (cache.getFromCache as jest.Mock).mockResolvedValue(cachedResult);

      const result = await githubService.fetchPullRequestMetrics(
        'token',
        'is:pr author:john'
      );

      expect(result).toEqual(cachedResult);

      // Should not call API when cache hit
      expect(githubApi.searchPRsWithOptions).not.toHaveBeenCalled();
    });
  });
});


import * as githubService from './githubService';
import * as githubApi from './githubApi';
import { Octokit } from '@octokit/rest';

jest.mock('./githubApi');
jest.mock('../../services/cache');
jest.mock('../../services/queryValidator');
jest.mock('../../services/errorHandler');

const mockOctokit = {} as any;

describe('fetchDeveloperMetrics Benchmark', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (githubApi.getOctokit as jest.Mock).mockReturnValue(mockOctokit);
    (githubApi.getUserByUsername as jest.Mock).mockResolvedValue({
      login: 'testuser',
      name: 'Test User',
      avatar_url: 'http://example.com/avatar.png',
      html_url: 'http://example.com/testuser',
    });
  });

  it('measures time for fetchDeveloperMetrics with mocked delay', async () => {
    const numPRs = 60; // 3 batches of 20
    const authoredPRs = Array.from({ length: numPRs }, (_, i) => ({
      repository_url: 'https://api.github.com/repos/owner/repo',
      number: i + 1,
    }));

    (githubApi.searchPRs as jest.Mock).mockImplementation((octokit, query) => {
      if (query.includes('author:')) return Promise.resolve(authoredPRs);
      return Promise.resolve([]);
    });

    const DELAY = 100;
    (githubApi.graphqlQuery as jest.Mock).mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, DELAY));
      return {};
    });

    const start = Date.now();
    await githubService.fetchDeveloperMetrics('token', 'testuser');
    const end = Date.now();
    const duration = end - start;
    console.log(`Duration with ${numPRs} PRs (3 batches): ${duration}ms`);

    // With sequential execution, it should be at least 3 * DELAY = 300ms
    // With concurrent execution, it should be around 1 * DELAY = 100ms
  });
});

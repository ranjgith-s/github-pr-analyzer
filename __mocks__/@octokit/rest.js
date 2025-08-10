/* global jest */
// Jest manual mock for @octokit/rest to eliminate network calls & console errors in tests.
// Provides the minimal surface used by the app code.
// Updated: wrap Octokit in jest.fn() so tests can override with mockImplementation.
// Further update: ensure `new Octokit()` returns an object whose prototype is Octokit.prototype
// so that `instanceof Octokit` checks pass. We do this by assigning properties onto `this`
// instead of returning a plain object (returning a plain object breaks instanceof semantics).

// Helper to build a default mock instance (kept close to real shape used by code)
function createDefaultOctokitInstance(options = {}) {
  const instance = {
    auth: options.auth,
    rest: {
      users: {
        getAuthenticated: jest.fn(async () => ({
          data: {
            login: 'test-user',
            name: 'Test User',
            avatar_url: 'https://example.com/avatar.png',
            html_url: 'https://github.com/test-user',
            bio: 'Test Bio',
            company: 'Test Co',
            location: 'Earth',
            followers: 0,
            following: 0,
            public_repos: 1,
          },
        })),
        getByUsername: jest.fn(async ({ username }) => ({
          data: {
            login: username,
            name: username,
            avatar_url: 'https://example.com/avatar.png',
            html_url: `https://github.com/${username}`,
            bio: '',
            company: '',
            location: '',
            followers: 0,
            following: 0,
            public_repos: 0,
          },
        })),
      },
      search: {
        users: jest.fn(async ({ q }) => ({
          data: {
            items: [
              {
                login: (q || 'user1').split(' ')[0],
                name: 'User One',
              },
            ],
          },
        })),
        issuesAndPullRequests: jest.fn(async () => ({
          data: {
            total_count: 1,
            incomplete_results: false,
            items: [
              {
                number: 1,
                repository_url: 'https://api.github.com/repos/owner/repo',
                title: 'Mock PR',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
          },
        })),
      },
      repos: {
        listForAuthenticatedUser: jest.fn(async () => ({
          data: [
            {
              full_name: 'owner/repo',
              description: 'Mock repository',
              default_branch: 'main',
              open_issues_count: 5,
            },
          ],
        })),
        get: jest.fn(async ({ owner, repo }) => ({
          data: {
            full_name: `${owner}/${repo}`,
            description: 'Mock repository',
            default_branch: 'main',
            open_issues_count: 10,
          },
        })),
        listCommits: jest.fn(async () => ({ data: [] })),
        listContributors: jest.fn(async () => ({ data: [] })),
        getCommitActivityStats: jest.fn(async () => ({ data: [] })),
        getCommunityProfileMetrics: jest.fn(async () => ({
          data: { health_percentage: 80 },
        })),
      },
      pulls: {
        listCommits: jest.fn(async () => ({ data: [] })),
        list: jest.fn(async () => ({ data: [] })),
      },
      actions: {
        listWorkflowRunsForRepo: jest.fn(async () => ({ data: [] })),
      },
      rateLimit: {
        get: jest.fn(async () => ({
          data: {
            resources: {
              core: {
                remaining: 5000,
                limit: 5000,
                reset: Math.floor(Date.now() / 1000) + 3600,
              },
            },
          },
        })),
      },
    },
    // Simplistic GraphQL mock extracts requested pr aliases and returns canned data
    graphql: jest.fn(async (query) => {
      const pullRequest = {
        id: 'PR_id',
        title: 'Mock PR',
        author: { login: 'author' },
        createdAt: new Date().toISOString(),
        publishedAt: null,
        closedAt: null,
        mergedAt: null,
        isDraft: false,
        additions: 10,
        deletions: 2,
        comments: { totalCount: 0 },
        reviews: { nodes: [] },
        closingIssuesReferences: { totalCount: 0 },
      };
      const result = {};
      const prAliases = [...query.matchAll(/(pr\d+)\s*:/g)].map((m) => m[1]);
      prAliases.forEach((alias) => {
        result[alias] = { pullRequest };
      });
      if (/repository\(owner:/.test(query)) {
        result.repository = { pullRequest };
      }
      return result;
    }),
    paginate: jest.fn(async (fn, params) => {
      const resp = await fn(params);
      return resp && resp.data ? resp.data : [];
    }),
  };
  return instance;
}

// jest.fn constructor so tests can override with their own implementation
// Use function form & assign to `this` (do not return object) so instanceof works.
// eslint-disable-next-line func-names
const Octokit = jest.fn(function (options) {
  const data = createDefaultOctokitInstance(options);
  Object.assign(this, data);
  // Provide a lightweight rest.search.issuesAndPullRequests warning suppression hook if needed later.
});

// Provide a way for tests that relied on previous shape to access the factory
Octokit.__createDefault = createDefaultOctokitInstance;

module.exports = { Octokit, default: Octokit };

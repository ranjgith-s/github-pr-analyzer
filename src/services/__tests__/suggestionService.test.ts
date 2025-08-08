import { SuggestionService, SuggestionContext } from '../suggestionService';

// Mock Octokit completely
const mockSearchUsers = jest.fn();
const mockListRepos = jest.fn();
const mockOctokit = {
  rest: {
    search: {
      users: mockSearchUsers,
    },
    repos: {
      listForAuthenticatedUser: mockListRepos,
    },
  },
};

jest.mock('@octokit/rest', () => ({
  Octokit: jest.fn(() => mockOctokit),
}));

describe('SuggestionService', () => {
  const mockToken = 'test-token';

  beforeEach(() => {
    // Clear any cached instances
    (SuggestionService as any).octokitInstances.clear();
    jest.clearAllMocks();
  });

  describe('getSuggestions', () => {
    it('should return syntax suggestions for empty query', async () => {
      const context: SuggestionContext = {
        query: '',
        cursorPosition: 0,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'syntax',
          value: 'author:',
          display: 'author:username',
        })
      );
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'template',
          value: 'my-prs',
          display: 'My Pull Requests',
        })
      );
    });

    it('should return syntax suggestions when cursor is after space', async () => {
      const context: SuggestionContext = {
        query: 'is:pr ',
        cursorPosition: 7,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions.some((s) => s.type === 'syntax')).toBe(true);
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'syntax',
          value: 'author:',
        })
      );
    });

    it('should return syntax suggestions after logical operators', async () => {
      const context: SuggestionContext = {
        query: 'is:pr AND ',
        cursorPosition: 11,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions.some((s) => s.type === 'syntax')).toBe(true);
    });

    it('should return user suggestions when typing author:', async () => {
      mockOctokit.rest.search.users.mockResolvedValue({
        data: {
          items: [
            {
              login: 'testuser',
              name: 'Test User',
              id: 1,
              node_id: 'test',
              avatar_url: 'test.jpg',
              gravatar_id: '',
              url: 'https://api.github.com/users/testuser',
              html_url: 'https://github.com/testuser',
              followers_url: 'test',
              following_url: 'test',
              gists_url: 'test',
              starred_url: 'test',
              subscriptions_url: 'test',
              organizations_url: 'test',
              repos_url: 'test',
              events_url: 'test',
              received_events_url: 'test',
              type: 'User',
              site_admin: false,
              score: 1,
            },
          ],
        },
      } as any);

      const context: SuggestionContext = {
        query: 'author:test',
        cursorPosition: 11,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(mockOctokit.rest.search.users).toHaveBeenCalledWith({
        q: 'test in:login',
        per_page: 10,
      });

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'user',
          value: 'testuser',
          display: 'testuser',
          description: 'Test User',
        })
      );
    });

    it('should return @me suggestion for author without API call when no partial', async () => {
      const context: SuggestionContext = {
        query: 'author:',
        cursorPosition: 7,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(mockOctokit.rest.search.users).not.toHaveBeenCalled();
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'user',
          value: '@me',
          display: '@me',
          description: 'Current authenticated user',
        })
      );
    });

    it('should return user suggestions when typing reviewed-by:', async () => {
      mockOctokit.rest.search.users.mockResolvedValue({
        data: {
          items: [
            {
              login: 'reviewer',
              name: 'Reviewer User',
              id: 2,
              node_id: 'test2',
              avatar_url: 'test2.jpg',
              gravatar_id: '',
              url: 'https://api.github.com/users/reviewer',
              html_url: 'https://github.com/reviewer',
              followers_url: 'test',
              following_url: 'test',
              gists_url: 'test',
              starred_url: 'test',
              subscriptions_url: 'test',
              organizations_url: 'test',
              repos_url: 'test',
              events_url: 'test',
              received_events_url: 'test',
              type: 'User',
              site_admin: false,
              score: 1,
            },
          ],
        },
      } as any);

      const context: SuggestionContext = {
        query: 'reviewed-by:rev',
        cursorPosition: 15,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(mockOctokit.rest.search.users).toHaveBeenCalledWith({
        q: 'rev in:login',
        per_page: 10,
      });

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'user',
          value: 'reviewer',
          display: 'reviewer',
        })
      );
    });

    it('should return repository suggestions when typing repo:', async () => {
      mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
        data: [
          {
            id: 1,
            node_id: 'test',
            name: 'test-repo',
            full_name: 'owner/test-repo',
            description: 'A test repository',
            private: false,
            fork: false,
            url: 'https://api.github.com/repos/owner/test-repo',
            html_url: 'https://github.com/owner/test-repo',
            archive_url: 'test',
            assignees_url: 'test',
            blobs_url: 'test',
            branches_url: 'test',
            clone_url: 'test',
            collaborators_url: 'test',
            comments_url: 'test',
            commits_url: 'test',
            compare_url: 'test',
            contents_url: 'test',
            contributors_url: 'test',
            deployments_url: 'test',
            downloads_url: 'test',
            events_url: 'test',
            forks_url: 'test',
            git_commits_url: 'test',
            git_refs_url: 'test',
            git_tags_url: 'test',
            git_url: 'test',
            hooks_url: 'test',
            issue_comment_url: 'test',
            issue_events_url: 'test',
            issues_url: 'test',
            keys_url: 'test',
            labels_url: 'test',
            languages_url: 'test',
            merges_url: 'test',
            milestones_url: 'test',
            notifications_url: 'test',
            pulls_url: 'test',
            releases_url: 'test',
            ssh_url: 'test',
            stargazers_url: 'test',
            statuses_url: 'test',
            subscribers_url: 'test',
            subscription_url: 'test',
            tags_url: 'test',
            teams_url: 'test',
            trees_url: 'test',
            owner: {
              login: 'owner',
              id: 1,
              node_id: 'test',
              avatar_url: 'test',
              gravatar_id: '',
              url: 'test',
              html_url: 'test',
              followers_url: 'test',
              following_url: 'test',
              gists_url: 'test',
              starred_url: 'test',
              subscriptions_url: 'test',
              organizations_url: 'test',
              repos_url: 'test',
              events_url: 'test',
              received_events_url: 'test',
              type: 'User',
              site_admin: false,
            },
          },
        ],
      } as any);

      const context: SuggestionContext = {
        query: 'repo:owner/test',
        cursorPosition: 16,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(
        mockOctokit.rest.repos.listForAuthenticatedUser
      ).toHaveBeenCalledWith({
        per_page: 20,
        sort: 'updated',
        direction: 'desc',
      });

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'repository',
          value: 'owner/test-repo',
          display: 'owner/test-repo',
          description: 'A test repository',
        })
      );
    });

    it('should return label suggestions when typing label:"', async () => {
      const context: SuggestionContext = {
        query: 'label:"bug',
        cursorPosition: 11,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'label',
          value: 'bug',
          display: 'bug',
          insertText: 'bug"',
        })
      );
    });

    it('should filter suggestions based on current word', async () => {
      const context: SuggestionContext = {
        query: 'auth',
        cursorPosition: 4,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'syntax',
          value: 'author:',
        })
      );

      expect(
        suggestions.every(
          (s) =>
            s.value.toLowerCase().includes('auth') ||
            s.display.toLowerCase().includes('auth')
        )
      ).toBe(true);
    });

    it('should limit suggestions to 10 items', async () => {
      const context: SuggestionContext = {
        query: '',
        cursorPosition: 0,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions.length).toBeLessThanOrEqual(10);
    });

    it('should handle API errors gracefully for user suggestions', async () => {
      mockOctokit.rest.search.users.mockRejectedValue(new Error('API Error'));

      const context: SuggestionContext = {
        query: 'author:test',
        cursorPosition: 11,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      // Should still return @me suggestion despite API error
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'user',
          value: '@me',
          display: '@me',
        })
      );
    });

    it('should handle API errors gracefully for repository suggestions', async () => {
      mockOctokit.rest.repos.listForAuthenticatedUser.mockRejectedValue(
        new Error('API Error')
      );

      const context: SuggestionContext = {
        query: 'repo:test',
        cursorPosition: 9,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      // Should return empty array for repo suggestions but not crash
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should return templates for minimal query "is:pr"', async () => {
      const context: SuggestionContext = {
        query: 'is:pr',
        cursorPosition: 5,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'template',
          value: 'my-prs',
          display: 'My Pull Requests',
        })
      );
    });
  });

  describe('Edge cases and private methods behavior', () => {
    it('should handle cursor at beginning of word', async () => {
      const context: SuggestionContext = {
        query: 'is:pr author',
        cursorPosition: 6, // Between 'pr' and 'author'
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions.some((s) => s.type === 'syntax')).toBe(true);
    });

    it('should handle cursor in middle of word', async () => {
      const context: SuggestionContext = {
        query: 'is:pr auth',
        cursorPosition: 9, // At end of 'auth'
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      // Should filter syntax suggestions based on 'auth'
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'syntax',
          value: 'author:',
        })
      );
    });

    it('should handle OR operator context', async () => {
      const context: SuggestionContext = {
        query: 'is:pr OR ',
        cursorPosition: 10,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions.some((s) => s.type === 'syntax')).toBe(true);
    });

    it('should handle NOT operator context', async () => {
      const context: SuggestionContext = {
        query: 'is:pr NOT ',
        cursorPosition: 11,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions.some((s) => s.type === 'syntax')).toBe(true);
    });

    it('should handle repository filtering with case insensitive matching', async () => {
      mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
        data: [
          {
            id: 1,
            node_id: 'test',
            name: 'Test-Repo',
            full_name: 'owner/Test-Repo',
            description: 'A test repository',
            private: false,
            fork: false,
            url: 'test',
            html_url: 'test',
            archive_url: 'test',
            assignees_url: 'test',
            blobs_url: 'test',
            branches_url: 'test',
            clone_url: 'test',
            collaborators_url: 'test',
            comments_url: 'test',
            commits_url: 'test',
            compare_url: 'test',
            contents_url: 'test',
            contributors_url: 'test',
            deployments_url: 'test',
            downloads_url: 'test',
            events_url: 'test',
            forks_url: 'test',
            git_commits_url: 'test',
            git_refs_url: 'test',
            git_tags_url: 'test',
            git_url: 'test',
            hooks_url: 'test',
            issue_comment_url: 'test',
            issue_events_url: 'test',
            issues_url: 'test',
            keys_url: 'test',
            labels_url: 'test',
            languages_url: 'test',
            merges_url: 'test',
            milestones_url: 'test',
            notifications_url: 'test',
            pulls_url: 'test',
            releases_url: 'test',
            ssh_url: 'test',
            stargazers_url: 'test',
            statuses_url: 'test',
            subscribers_url: 'test',
            subscription_url: 'test',
            tags_url: 'test',
            teams_url: 'test',
            trees_url: 'test',
            owner: {
              login: 'owner',
              id: 1,
              node_id: 'test',
              avatar_url: 'test',
              gravatar_id: '',
              url: 'test',
              html_url: 'test',
              followers_url: 'test',
              following_url: 'test',
              gists_url: 'test',
              starred_url: 'test',
              subscriptions_url: 'test',
              organizations_url: 'test',
              repos_url: 'test',
              events_url: 'test',
              received_events_url: 'test',
              type: 'User',
              site_admin: false,
            },
          },
        ],
      } as any);

      const context: SuggestionContext = {
        query: 'repo:test',
        cursorPosition: 9,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'repository',
          value: 'owner/Test-Repo',
        })
      );
    });

    it('should handle label suggestions with partial matching', async () => {
      const context: SuggestionContext = {
        query: 'label:"en',
        cursorPosition: 10,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'label',
          value: 'enhancement',
          display: 'enhancement',
          insertText: 'enhancement"',
        })
      );
    });

    it('should handle unknown value context types', async () => {
      // This tests the default case in getValueSuggestions
      const context: SuggestionContext = {
        query: 'unknown:test',
        cursorPosition: 12,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      // Should not crash and return other appropriate suggestions
      expect(Array.isArray(suggestions)).toBe(true);
    });

    it('should handle repositories without description', async () => {
      mockOctokit.rest.repos.listForAuthenticatedUser.mockResolvedValue({
        data: [
          {
            id: 1,
            node_id: 'test',
            name: 'no-desc-repo',
            full_name: 'owner/no-desc-repo',
            description: null,
            private: false,
            fork: false,
            url: 'test',
            html_url: 'test',
            archive_url: 'test',
            assignees_url: 'test',
            blobs_url: 'test',
            branches_url: 'test',
            clone_url: 'test',
            collaborators_url: 'test',
            comments_url: 'test',
            commits_url: 'test',
            compare_url: 'test',
            contents_url: 'test',
            contributors_url: 'test',
            deployments_url: 'test',
            downloads_url: 'test',
            events_url: 'test',
            forks_url: 'test',
            git_commits_url: 'test',
            git_refs_url: 'test',
            git_tags_url: 'test',
            git_url: 'test',
            hooks_url: 'test',
            issue_comment_url: 'test',
            issue_events_url: 'test',
            issues_url: 'test',
            keys_url: 'test',
            labels_url: 'test',
            languages_url: 'test',
            merges_url: 'test',
            milestones_url: 'test',
            notifications_url: 'test',
            pulls_url: 'test',
            releases_url: 'test',
            ssh_url: 'test',
            stargazers_url: 'test',
            statuses_url: 'test',
            subscribers_url: 'test',
            subscription_url: 'test',
            tags_url: 'test',
            teams_url: 'test',
            trees_url: 'test',
            owner: {
              login: 'owner',
              id: 1,
              node_id: 'test',
              avatar_url: 'test',
              gravatar_id: '',
              url: 'test',
              html_url: 'test',
              followers_url: 'test',
              following_url: 'test',
              gists_url: 'test',
              starred_url: 'test',
              subscriptions_url: 'test',
              organizations_url: 'test',
              repos_url: 'test',
              events_url: 'test',
              received_events_url: 'test',
              type: 'User',
              site_admin: false,
            },
          },
        ],
      } as any);

      const context: SuggestionContext = {
        query: 'repo:no-desc',
        cursorPosition: 12,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'repository',
          value: 'owner/no-desc-repo',
          description: undefined,
        })
      );
    });

    it('should handle users without name', async () => {
      mockOctokit.rest.search.users.mockResolvedValue({
        data: {
          items: [
            {
              login: 'noname',
              name: null,
              id: 1,
              node_id: 'test',
              avatar_url: 'test.jpg',
              gravatar_id: '',
              url: 'https://api.github.com/users/noname',
              html_url: 'https://github.com/noname',
              followers_url: 'test',
              following_url: 'test',
              gists_url: 'test',
              starred_url: 'test',
              subscriptions_url: 'test',
              organizations_url: 'test',
              repos_url: 'test',
              events_url: 'test',
              received_events_url: 'test',
              type: 'User',
              site_admin: false,
              score: 1,
            },
          ],
        },
      } as any);

      const context: SuggestionContext = {
        query: 'author:noname',
        cursorPosition: 13,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'user',
          value: 'noname',
          display: 'noname',
          description: undefined,
        })
      );
    });

    it('should handle empty current word', async () => {
      const context: SuggestionContext = {
        query: 'is:pr ',
        cursorPosition: 7,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions.some((s) => s.type === 'syntax')).toBe(true);
    });

    it('should handle case insensitive operator matching', async () => {
      const context: SuggestionContext = {
        query: 'is:pr and ',
        cursorPosition: 10,
        token: mockToken,
      };

      const suggestions = await SuggestionService.getSuggestions(context);

      expect(suggestions.some((s) => s.type === 'syntax')).toBe(true);
    });
  });

  describe('Static data validation', () => {
    it('should have all required syntax suggestions', () => {
      const syntaxSuggestions = (SuggestionService as any).syntaxSuggestions;

      expect(syntaxSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'syntax',
          value: 'author:',
          category: 'Filters',
        })
      );

      expect(syntaxSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'syntax',
          value: 'is:open',
          category: 'Status',
        })
      );

      expect(syntaxSuggestions).toContainEqual(
        expect.objectContaining({
          type: 'syntax',
          value: 'created:',
          category: 'Dates',
        })
      );
    });

    it('should have all required template suggestions', () => {
      const templates = (SuggestionService as any).templates;

      expect(templates).toContainEqual(
        expect.objectContaining({
          type: 'template',
          value: 'my-prs',
          insertText: 'is:pr author:@me OR reviewed-by:@me',
        })
      );

      expect(templates).toContainEqual(
        expect.objectContaining({
          type: 'template',
          value: 'bugs',
          insertText: 'is:pr label:"bug" is:open',
        })
      );
    });
  });
});

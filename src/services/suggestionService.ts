import { Octokit } from '@octokit/rest';

export interface AutocompleteSuggestion {
  type: 'syntax' | 'user' | 'repository' | 'label' | 'template';
  value: string;
  display: string;
  description?: string;
  icon?: React.ReactNode;
  category?: string;
  insertText?: string;
}

export interface SuggestionContext {
  query: string;
  cursorPosition: number;
  token: string;
}

export class SuggestionService {
  private static octokitInstances = new Map<string, Octokit>();

  private static getOctokit(token: string): Octokit {
    if (!this.octokitInstances.has(token)) {
      this.octokitInstances.set(
        token,
        new Octokit({
          auth: token,
          userAgent: 'github-pr-analyzer/1.0.0',
        })
      );
    }
    return this.octokitInstances.get(token)!;
  }

  private static syntaxSuggestions: AutocompleteSuggestion[] = [
    {
      type: 'syntax',
      value: 'author:',
      display: 'author:username',
      description: 'Filter by pull request author',
      insertText: 'author:',
      category: 'Filters',
    },
    {
      type: 'syntax',
      value: 'reviewed-by:',
      display: 'reviewed-by:username',
      description: 'Filter by reviewer',
      insertText: 'reviewed-by:',
      category: 'Filters',
    },
    {
      type: 'syntax',
      value: 'repo:',
      display: 'repo:owner/name',
      description: 'Filter by repository',
      insertText: 'repo:',
      category: 'Filters',
    },
    {
      type: 'syntax',
      value: 'label:',
      display: 'label:"name"',
      description: 'Filter by label',
      insertText: 'label:"',
      category: 'Filters',
    },
    {
      type: 'syntax',
      value: 'is:open',
      display: 'is:open',
      description: 'Show only open pull requests',
      insertText: 'is:open',
      category: 'Status',
    },
    {
      type: 'syntax',
      value: 'is:closed',
      display: 'is:closed',
      description: 'Show only closed pull requests',
      insertText: 'is:closed',
      category: 'Status',
    },
    {
      type: 'syntax',
      value: 'is:merged',
      display: 'is:merged',
      description: 'Show only merged pull requests',
      insertText: 'is:merged',
      category: 'Status',
    },
    {
      type: 'syntax',
      value: 'is:draft',
      display: 'is:draft',
      description: 'Show only draft pull requests',
      insertText: 'is:draft',
      category: 'Status',
    },
    {
      type: 'syntax',
      value: 'created:',
      display: 'created:>YYYY-MM-DD',
      description: 'Filter by creation date',
      insertText: 'created:>',
      category: 'Dates',
    },
    {
      type: 'syntax',
      value: 'updated:',
      display: 'updated:<YYYY-MM-DD',
      description: 'Filter by last update date',
      insertText: 'updated:<',
      category: 'Dates',
    },
  ];

  private static templates: AutocompleteSuggestion[] = [
    {
      type: 'template',
      value: 'my-prs',
      display: 'My Pull Requests',
      description: 'Pull requests I authored or reviewed',
      insertText: 'is:pr author:@me OR reviewed-by:@me',
      category: 'Templates',
    },
    {
      type: 'template',
      value: 'team-review',
      display: 'Pending Team Reviews',
      description: 'Open PRs waiting for review',
      insertText: 'is:pr is:open review:required',
      category: 'Templates',
    },
    {
      type: 'template',
      value: 'recent-activity',
      display: 'Recent Activity',
      description: 'PRs updated in last 7 days',
      insertText: 'is:pr updated:>2024-01-01 involves:@me',
      category: 'Templates',
    },
    {
      type: 'template',
      value: 'bugs',
      display: 'Bug Fixes',
      description: 'PRs labeled as bug fixes',
      insertText: 'is:pr label:"bug" is:open',
      category: 'Templates',
    },
  ];

  static async getSuggestions(
    context: SuggestionContext
  ): Promise<AutocompleteSuggestion[]> {
    const { query, cursorPosition } = context;
    const suggestions: AutocompleteSuggestion[] = [];

    // Get the current word being typed
    const beforeCursor = query.substring(0, cursorPosition);
    const currentWord = this.getCurrentWord(beforeCursor);

    // Add template suggestions first if query is empty or minimal
    if (query.trim().length === 0 || query.trim() === 'is:pr') {
      suggestions.push(...this.templates);
    }

    // Add value suggestions based on current filter
    const valueContext = this.getValueContext(beforeCursor);
    if (valueContext) {
      const valueSuggestions = await this.getValueSuggestions(
        valueContext,
        context.token
      );
      // Value suggestions are already narrowed by the partial typed after the colon.
      // Do NOT filter them again by currentWord (which still contains the key e.g. "author:test"),
      // otherwise they will all be filtered out. This fixes tests expecting user/repo/label suggestions.
      suggestions.push(...valueSuggestions);
    }

    // Add syntax suggestions if typing a new term or partially matching one
    if (this.shouldShowSyntaxSuggestions(beforeCursor, currentWord)) {
      suggestions.push(
        ...this.filterSuggestions(this.syntaxSuggestions, currentWord)
      );
    }

    return suggestions.slice(0, 10); // Limit to 10 suggestions
  }

  private static getCurrentWord(text: string): string {
    const match = text.match(/(\S+)$/);
    return match ? match[1] : '';
  }

  private static shouldShowSyntaxSuggestions(
    beforeCursor: string,
    currentWord: string
  ): boolean {
    // Base conditions:
    // 1. Starting a new word after space
    // 2. Beginning of query
    // 3. After logical operators
    const endsWithSpace = beforeCursor.endsWith(' ');
    const isEmpty = beforeCursor.trim().length === 0;
    const afterOperator = /(^|\s)(AND|OR|NOT)\s*$/i.test(beforeCursor);

    if (endsWithSpace || isEmpty || afterOperator || currentWord.length === 0) {
      return true;
    }

    // Show syntax suggestions while user is typing a partial syntax token (e.g. 'auth' -> 'author:').
    // We only treat it as a partial if the current word does NOT look like a value context (i.e. contains ':' with trailing non-space characters that don't match a known syntax prefix requiring a value).
    const lower = currentWord.toLowerCase();

    // If currently typing a value (author:<value>, reviewed-by:<value>, repo:<value>, label:"<value>) we should NOT show global syntax suggestions.
    const typingValueContext =
      /^(author:|reviewed-by:|repo:|label:")/i.test(lower) &&
      !SuggestionService.syntaxSuggestions.some(
        (s) => lower === s.value.toLowerCase()
      );
    if (typingValueContext) return false;

    // Otherwise show if any syntax suggestion value starts with the current word (case-insensitive) OR the current word is a prefix of a syntax suggestion before the colon.
    return SuggestionService.syntaxSuggestions.some((s) =>
      s.value.toLowerCase().startsWith(lower)
    );
  }

  private static getValueContext(
    beforeCursor: string
  ): { type: string; partial: string } | null {
    // Check if we're typing a value for a filter
    const authorMatch = beforeCursor.match(/author:(\S*)$/);
    if (authorMatch) return { type: 'user', partial: authorMatch[1] };

    const reviewerMatch = beforeCursor.match(/reviewed-by:(\S*)$/);
    if (reviewerMatch) return { type: 'user', partial: reviewerMatch[1] };

    const repoMatch = beforeCursor.match(/repo:(\S*)$/);
    if (repoMatch) return { type: 'repository', partial: repoMatch[1] };

    const labelMatch = beforeCursor.match(/label:"([^"]*)$/);
    if (labelMatch) return { type: 'label', partial: labelMatch[1] };

    return null;
  }

  private static async getValueSuggestions(
    context: { type: string; partial: string },
    token: string
  ): Promise<AutocompleteSuggestion[]> {
    try {
      switch (context.type) {
        case 'user':
          return await this.getUserSuggestions(context.partial, token);
        case 'repository':
          return await this.getRepositorySuggestions(context.partial, token);
        case 'label':
          return await this.getLabelSuggestions(context.partial);
        default:
          return [];
      }
    } catch (error) {
      console.warn('Failed to fetch suggestions:', error);
      return [];
    }
  }

  private static async getUserSuggestions(
    partial: string,
    token: string
  ): Promise<AutocompleteSuggestion[]> {
    try {
      const octokit = this.getOctokit(token);

      const suggestions: AutocompleteSuggestion[] = [
        {
          type: 'user' as const,
          value: '@me',
          display: '@me',
          description: 'Current authenticated user',
          category: 'Users',
          insertText: '@me',
        },
      ];

      if (partial.length > 0) {
        // Search for users using Octokit
        const { data } = await octokit.rest.search.users({
          q: `${partial} in:login`,
          per_page: 10,
        });

        // Add search results
        suggestions.push(
          ...data.items.map((user) => ({
            type: 'user' as const,
            value: user.login,
            display: user.login,
            description: user.name || undefined,
            category: 'Users',
            insertText: user.login,
          }))
        );
      }

      return suggestions;
    } catch (error) {
      console.warn('Failed to fetch user suggestions:', error);
      return [
        {
          type: 'user' as const,
          value: '@me',
          display: '@me',
          description: 'Current authenticated user',
          category: 'Users',
          insertText: '@me',
        },
      ];
    }
  }

  private static async getRepositorySuggestions(
    partial: string,
    token: string
  ): Promise<AutocompleteSuggestion[]> {
    try {
      const octokit = this.getOctokit(token);

      // Get user's repositories
      const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 20,
        sort: 'updated',
        direction: 'desc',
      });

      return data
        .filter((repo) =>
          repo.full_name.toLowerCase().includes(partial.toLowerCase())
        )
        .map((repo) => ({
          type: 'repository' as const,
          value: repo.full_name,
          display: repo.full_name,
          description: repo.description || undefined,
          category: 'Repositories',
          insertText: repo.full_name,
        }));
    } catch (error) {
      console.warn('Failed to fetch repository suggestions:', error);
      return [];
    }
  }

  private static async getLabelSuggestions(
    partial: string
  ): Promise<AutocompleteSuggestion[]> {
    const commonLabels = [
      'bug',
      'enhancement',
      'documentation',
      'good first issue',
      'help wanted',
      'question',
      'wontfix',
      'duplicate',
    ];

    return commonLabels
      .filter((label) => label.includes(partial.toLowerCase()))
      .map((label) => ({
        type: 'label' as const,
        value: label,
        display: label,
        category: 'Labels',
        insertText: `${label}"`,
      }));
  }

  private static filterSuggestions(
    suggestions: AutocompleteSuggestion[],
    filter: string
  ): AutocompleteSuggestion[] {
    if (!filter) return suggestions;

    const lowerFilter = filter.toLowerCase();
    return suggestions.filter(
      (suggestion) =>
        suggestion.value.toLowerCase().includes(lowerFilter) ||
        suggestion.display.toLowerCase().includes(lowerFilter)
    );
  }
}

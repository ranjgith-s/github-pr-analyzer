import {
  parseGitHubQuery,
  buildGitHubQuery,
  getQueryComplexity,
  FilterState,
} from '../queryBuilder';

describe('queryBuilder', () => {
  describe('parseGitHubQuery', () => {
    it('should parse a basic query correctly', () => {
      const query = 'is:pr author:john';
      const result = parseGitHubQuery(query);

      expect(result).toEqual({
        authors: ['john'],
        reviewers: [],
        repositories: [],
        labels: [],
        state: 'all',
        isDraft: null,
        dateRange: {},
        assignees: [],
        involves: [],
      });
    });

    it('should parse complex query correctly', () => {
      const query =
        'is:pr author:john reviewed-by:jane repo:org/repo label:"bug" is:open';
      const result = parseGitHubQuery(query);

      expect(result).toEqual({
        authors: ['john'],
        reviewers: ['jane'],
        repositories: ['org/repo'],
        labels: ['bug'],
        state: 'open',
        isDraft: null,
        dateRange: {},
        assignees: [],
        involves: [],
      });
    });

    it('should handle multiple authors', () => {
      const query = 'is:pr author:john author:jane';
      const result = parseGitHubQuery(query);

      expect(result.authors).toEqual(['john', 'jane']);
    });

    it('should parse state filters', () => {
      const openQuery = 'is:pr is:open';
      const closedQuery = 'is:pr is:closed';
      const mergedQuery = 'is:pr is:merged';

      expect(parseGitHubQuery(openQuery).state).toBe('open');
      expect(parseGitHubQuery(closedQuery).state).toBe('closed');
      expect(parseGitHubQuery(mergedQuery).state).toBe('merged');
    });

    it('should parse draft status', () => {
      const draftQuery = 'is:pr is:draft';
      const nonDraftQuery = 'is:pr -is:draft';

      expect(parseGitHubQuery(draftQuery).isDraft).toBe(true);
      expect(parseGitHubQuery(nonDraftQuery).isDraft).toBe(false);
    });

    it('should parse assignees and involves', () => {
      const query = 'is:pr assignee:john involves:jane';
      const result = parseGitHubQuery(query);

      expect(result.assignees).toEqual(['john']);
      expect(result.involves).toEqual(['jane']);
    });

    it('should parse date ranges', () => {
      const query = 'is:pr created:>2024-01-01 updated:<2024-12-31';
      const result = parseGitHubQuery(query);

      expect(result.dateRange.created?.start).toEqual(new Date('2024-01-01'));
      expect(result.dateRange.updated?.end).toEqual(new Date('2024-12-31'));
    });

    it('should handle empty query', () => {
      const result = parseGitHubQuery('');

      expect(result).toEqual({
        authors: [],
        reviewers: [],
        repositories: [],
        labels: [],
        state: 'all',
        isDraft: null,
        dateRange: {},
        assignees: [],
        involves: [],
      });
    });
  });

  describe('buildGitHubQuery', () => {
    it('should build basic query from filter state', () => {
      const filters: FilterState = {
        authors: ['john'],
        reviewers: [],
        repositories: [],
        labels: [],
        state: 'all',
        isDraft: null,
        dateRange: {},
        assignees: [],
        involves: [],
      };

      const result = buildGitHubQuery(filters);

      expect(result).toBe('is:pr author:john');
    });

    it('should build complex query from filter state', () => {
      const filters: FilterState = {
        authors: ['john'],
        reviewers: ['jane'],
        repositories: ['org/repo'],
        labels: ['bug'],
        state: 'open',
        isDraft: false,
        dateRange: {},
        assignees: [],
        involves: [],
      };

      const result = buildGitHubQuery(filters);

      expect(result).toBe(
        'is:pr author:john reviewed-by:jane repo:org/repo label:"bug" is:open -is:draft'
      );
    });

    it('should handle multiple values in arrays', () => {
      const filters: FilterState = {
        authors: ['john', 'jane'],
        reviewers: [],
        repositories: ['org/repo1', 'org/repo2'],
        labels: ['bug', 'enhancement'],
        state: 'all',
        isDraft: null,
        dateRange: {},
        assignees: [],
        involves: [],
      };

      const result = buildGitHubQuery(filters);

      expect(result).toContain('author:john');
      expect(result).toContain('author:jane');
      expect(result).toContain('repo:org/repo1');
      expect(result).toContain('repo:org/repo2');
      expect(result).toContain('label:"bug"');
      expect(result).toContain('label:"enhancement"');
    });

    it('should include assignees and involves', () => {
      const filters: FilterState = {
        authors: [],
        reviewers: [],
        repositories: [],
        labels: [],
        state: 'all',
        isDraft: null,
        dateRange: {},
        assignees: ['john'],
        involves: ['jane'],
      };

      const result = buildGitHubQuery(filters);

      expect(result).toBe('is:pr assignee:john involves:jane');
    });

    it('should handle date ranges', () => {
      const filters: FilterState = {
        authors: [],
        reviewers: [],
        repositories: [],
        labels: [],
        state: 'all',
        isDraft: null,
        dateRange: {
          created: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31'),
          },
          updated: {
            start: new Date('2024-02-01'),
          },
        },
        assignees: [],
        involves: [],
      };

      const result = buildGitHubQuery(filters);

      expect(result).toContain('created:>2024-01-01');
      expect(result).toContain('created:<2024-01-31');
      expect(result).toContain('updated:>2024-02-01');
    });

    it('should always include is:pr', () => {
      const emptyFilters: FilterState = {
        authors: [],
        reviewers: [],
        repositories: [],
        labels: [],
        state: 'all',
        isDraft: null,
        dateRange: {},
        assignees: [],
        involves: [],
      };

      const result = buildGitHubQuery(emptyFilters);

      expect(result).toBe('is:pr');
    });
  });

  describe('getQueryComplexity', () => {
    it('should return simple for basic queries', () => {
      expect(getQueryComplexity('is:pr author:john')).toBe('simple');
      expect(getQueryComplexity('is:pr is:open')).toBe('simple');
    });

    it('should return moderate for queries with dates or many parts', () => {
      expect(getQueryComplexity('is:pr created:>2024-01-01')).toBe('moderate');
      expect(
        getQueryComplexity(
          'is:pr author:john repo:org/repo label:"bug" is:open'
        )
      ).toBe('moderate');
    });

    it('should return complex for queries with operators or many parts', () => {
      expect(getQueryComplexity('is:pr (author:john OR author:jane)')).toBe(
        'complex'
      );
      expect(
        getQueryComplexity(
          'is:pr author:john author:jane repo:org/repo1 repo:org/repo2 label:"bug" label:"enhancement" is:open assignee:bob involves:alice'
        )
      ).toBe('complex');
    });
  });
});

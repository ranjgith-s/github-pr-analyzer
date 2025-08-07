import {
  validateQuery,
  validateQueryRealtime,
  getQuerySuggestions,
  validateAndSanitizeQuery,
} from '../queryValidator';

describe('queryValidator', () => {
  describe('validateQuery', () => {
    it('should validate basic queries', () => {
      const result = validateQuery('is:pr author:john');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('is:pr author:john');
      expect(result.errors).toEqual([]);
    });

    it('should add is:pr qualifier if missing', () => {
      const result = validateQuery('author:john');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('is:pr author:john');
      expect(result.warnings).toContain('Added "is:pr" qualifier');
    });

    it('should reject empty queries', () => {
      const result = validateQuery('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query cannot be empty');
    });

    it('should reject overly long queries', () => {
      const longQuery = 'is:pr ' + 'a'.repeat(260);
      const result = validateQuery(longQuery);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query too long (max 256 characters)');
    });

    it('should detect unmatched quotes', () => {
      const result = validateQuery('is:pr author:"john');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unmatched quote in query');
    });

    it('should detect unmatched parentheses', () => {
      const result = validateQuery('is:pr (author:john');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unmatched parentheses in query');
    });

    it('should validate OR operator usage', () => {
      const result = validateQuery('is:pr author:john or author:jane');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('OR operator should be uppercase');
    });

    it('should accept valid OR operator usage', () => {
      const result = validateQuery('is:pr author:john OR author:jane');
      expect(result.isValid).toBe(true);
    });

    it('should validate supported GitHub qualifiers', () => {
      const supportedQualifiers = [
        'is:pr author:john',
        'is:pr assignee:jane',
        'is:pr reviewed-by:bob',
        'is:pr state:open',
        'is:pr label:bug',
        'is:pr created:>2023-01-01',
        'is:pr updated:<2023-12-31',
        'is:pr merged:2023-01-01..2023-12-31',
        'is:pr review:approved',
        'is:pr draft:true',
        'is:pr size:>100',
      ];

      supportedQualifiers.forEach((query) => {
        const result = validateQuery(query);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject unsupported qualifiers', () => {
      const result = validateQuery('is:pr unsupported:value');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Unsupported search qualifier: unsupported'
      );
    });

    it('should sanitize dangerous characters', () => {
      const result = validateQuery('is:pr author:<script>alert()</script>');
      expect(result.sanitized).toBe('is:pr author:scriptalert()/script');
    });
  });

  describe('validateQueryRealtime', () => {
    it('should be more lenient for empty queries', () => {
      const result = validateQueryRealtime('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toContain('Query is empty');
    });

    it('should validate normal queries same as validateQuery', () => {
      const query = 'is:pr author:john';
      const realtime = validateQueryRealtime(query);
      const normal = validateQuery(query);

      expect(realtime.isValid).toBe(normal.isValid);
      expect(realtime.sanitized).toBe(normal.sanitized);
    });
  });

  describe('getQuerySuggestions', () => {
    it('should suggest adding is:pr qualifier', () => {
      const suggestions = getQuerySuggestions('author:john');
      expect(suggestions).toContain('is:pr author:john');
    });

    it('should suggest using @me for author', () => {
      const suggestions = getQuerySuggestions('is:pr author:john');
      expect(suggestions).toContain('is:pr author:@me');
    });

    it('should not suggest is:pr if already present', () => {
      const suggestions = getQuerySuggestions('is:pr author:john');
      expect(suggestions.some((s) => s.includes('is:pr is:pr'))).toBe(false);
    });

    it('should not suggest @me if not using author qualifier', () => {
      const suggestions = getQuerySuggestions('is:pr reviewed-by:john');
      expect(suggestions.length).toBe(0);
    });
  });

  describe('validateAndSanitizeQuery', () => {
    it('should return sanitized query for valid input', () => {
      const sanitized = validateAndSanitizeQuery('author:john');
      expect(sanitized).toBe('is:pr author:john');
    });

    it('should throw error for invalid input', () => {
      expect(() => {
        validateAndSanitizeQuery('is:pr author:"john');
      }).toThrow('Invalid query: Unmatched quote in query');
    });
  });

  describe('Complex GitHub search queries', () => {
    it('should validate complex boolean queries', () => {
      const query = 'is:pr (author:john OR reviewed-by:john) AND state:open';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should validate date range queries', () => {
      const query = 'is:pr created:2023-01-01..2023-12-31';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should validate review status queries', () => {
      const queries = [
        'is:pr review:none',
        'is:pr review:required',
        'is:pr review:approved',
        'is:pr review:changes_requested',
      ];

      queries.forEach((query) => {
        const result = validateQuery(query);
        expect(result.isValid).toBe(true);
      });
    });

    it('should validate team review queries', () => {
      const query = 'is:pr team-review-requested:org/team';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should validate repository queries', () => {
      const query = 'is:pr repo:owner/repository';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should validate multiple labels with OR', () => {
      const query = 'is:pr label:"bug","enhancement"';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should validate multiple labels with AND', () => {
      const query = 'is:pr label:bug label:frontend';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should validate negation queries', () => {
      const query = 'is:pr -author:john';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should validate involves qualifier', () => {
      const query = 'is:pr involves:john';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should validate user and org qualifiers', () => {
      const queries = [
        'is:pr user:octocat',
        'is:pr org:github',
        'is:pr user:octocat OR org:github',
      ];

      queries.forEach((query) => {
        const result = validateQuery(query);
        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle whitespace-only queries', () => {
      const result = validateQuery('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query cannot be empty');
    });

    it('should handle queries with multiple spaces', () => {
      const result = validateQuery('is:pr    author:john');
      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('is:pr    author:john');
    });

    it('should handle nested parentheses', () => {
      const query = 'is:pr ((author:john OR author:jane) AND state:open)';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should handle mixed case qualifiers', () => {
      const query = 'IS:pr AUTHOR:john';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });

    it('should handle special characters in values', () => {
      const query = 'is:pr label:"bug-fix/feature"';
      const result = validateQuery(query);
      expect(result.isValid).toBe(true);
    });
  });
});

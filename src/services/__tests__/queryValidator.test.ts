import {
  validateQuery,
  validateAndSanitizeQuery,
  validateQueryRealtime,
  getQuerySuggestions,
  validateGitHubSearchSyntax,
} from '../queryValidator';

describe('Query Validator', () => {
  describe('validateQuery', () => {
    it('should validate a simple query', () => {
      const result = validateQuery('is:pr author:john');

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('is:pr author:john');
      expect(result.errors).toHaveLength(0);
    });

    it('should add is:pr qualifier if missing', () => {
      const result = validateQuery('author:john');

      expect(result.isValid).toBe(true);
      expect(result.sanitized).toBe('is:pr author:john');
      expect(result.warnings).toContain('Added "is:pr" qualifier');
    });

    it('should detect unmatched quotes', () => {
      const result = validateQuery('is:pr title:"unclosed quote');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unmatched quote in query');
    });

    it('should reject empty queries', () => {
      const result = validateQuery('');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query cannot be empty');
    });

    it('should reject overly long queries', () => {
      const longQuery = 'is:pr ' + 'a'.repeat(300);
      const result = validateQuery(longQuery);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Query too long (max 256 characters)');
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
        expect(validateQuery(query).isValid).toBe(true);
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

  describe('validateAndSanitizeQuery', () => {
    it('should return sanitized query for valid input', () => {
      const result = validateAndSanitizeQuery('author:john');

      expect(result).toBe('is:pr author:john');
    });

    it('should handle OR queries correctly', () => {
      const result = validateAndSanitizeQuery(
        '(author:john OR reviewed-by:john)'
      );
      expect(result).toBe('is:pr (author:john OR reviewed-by:john)');
    });

    it('should handle involves qualifier', () => {
      const result = validateAndSanitizeQuery('involves:john');
      expect(result).toBe('is:pr involves:john');
    });

    it('should throw error for invalid input', () => {
      expect(() => {
        validateAndSanitizeQuery('');
      }).toThrow('Invalid query: Query cannot be empty');
    });
  });

  // --- Merged from queryValidator.enhanced.test.ts ---

  describe('queryValidator (enhanced set)', () => {
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
          expect(validateQuery(query).isValid).toBe(true);
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

        expect(validateQuery(query).isValid).toBe(true);
      });

      it('should validate date range queries', () => {
        const query = 'is:pr created:2023-01-01..2023-12-31';

        expect(validateQuery(query).isValid).toBe(true);
      });

      it('should validate review status queries', () => {
        [
          'is:pr review:none',
          'is:pr review:required',
          'is:pr review:approved',
          'is:pr review:changes_requested',
        ].forEach((q) => {
          expect(validateQuery(q).isValid).toBe(true);
        });
      });

      it('should validate team review queries', () => {
        expect(
          validateQuery('is:pr team-review-requested:org/team').isValid
        ).toBe(true);
      });

      it('should validate repository queries', () => {
        expect(validateQuery('is:pr repo:owner/repository').isValid).toBe(true);
      });

      it('should validate multiple labels with OR', () => {
        expect(validateQuery('is:pr label:"bug","enhancement"').isValid).toBe(
          true
        );
      });

      it('should validate multiple labels with AND', () => {
        expect(validateQuery('is:pr label:bug label:frontend').isValid).toBe(
          true
        );
      });

      it('should validate negation queries', () => {
        expect(validateQuery('is:pr -author:john').isValid).toBe(true);
      });

      it('should validate involves qualifier', () => {
        expect(validateQuery('is:pr involves:john').isValid).toBe(true);
      });

      it('should validate user and org qualifiers', () => {
        [
          'is:pr user:octocat',
          'is:pr org:github',
          'is:pr user:octocat OR org:github',
        ].forEach((q) => {
          expect(validateQuery(q).isValid).toBe(true);
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
        expect(
          validateQuery('is:pr ((author:john OR author:jane) AND state:open)')
            .isValid
        ).toBe(true);
      });

      it('should handle mixed case qualifiers', () => {
        expect(validateQuery('IS:pr AUTHOR:john').isValid).toBe(true);
      });

      it('should handle special characters in values', () => {
        expect(validateQuery('is:pr label:"bug-fix/feature"').isValid).toBe(
          true
        );
      });
    });
  });

  // --- Merged from queryValidator.coverage.test.ts ---

  describe('queryValidator additional coverage', () => {
    describe('qualifier value validation - invalid cases', () => {
      it('invalid type value', () => {
        const r = validateQuery('is:pr type:xxx');

        expect(r.isValid).toBe(false);
        expect(r.errors.some((e) => e.includes('Invalid value'))).toBe(true);
      });

      it('invalid state value', () => {
        const r = validateQuery('is:pr state:pending');

        expect(r.errors).toContain(
          'Invalid state "pending". Valid states: open, closed, merged, all'
        );
      });

      it('invalid review state', () => {
        const r = validateQuery('is:pr review:foo');

        expect(r.errors.some((e) => e.includes('Invalid review state'))).toBe(
          true
        );
      });

      it('invalid draft value', () => {
        const r = validateQuery('is:pr draft:maybe');

        expect(r.errors).toContain(
          'Invalid draft value "maybe". Use "true" or "false"'
        );
      });

      it('invalid archived value', () => {
        const r = validateQuery('is:pr archived:maybe');

        expect(r.errors).toContain(
          'Invalid archived value "maybe". Use "true" or "false"'
        );
      });

      it('invalid locked value', () => {
        const r = validateQuery('is:pr locked:maybe');

        expect(r.errors).toContain(
          'Invalid locked value "maybe". Use "true" or "false"'
        );
      });

      it('invalid date format', () => {
        const r = validateQuery('is:pr created:20230101');

        expect(
          r.errors.some((e) => e.includes('Invalid date format for created'))
        ).toBe(true);
      });

      it('invalid numeric format', () => {
        const r = validateQuery('is:pr comments:10-20');

        expect(r.errors).toContain(
          'Invalid numeric format for comments. Use number, >number, <number, or number..number'
        );
      });

      it('invalid user format', () => {
        const r = validateQuery('is:pr author:bad*user');

        expect(
          r.errors.some((e) => e.includes('Invalid user format for author'))
        ).toBe(true);
      });

      it('invalid team format', () => {
        const r = validateQuery('is:pr team:orgOnly');

        expect(r.errors).toContain(
          'Invalid team format for team. Use org/team format'
        );
      });

      it('invalid repo format', () => {
        const r = validateQuery('is:pr repo:owner');

        expect(r.errors).toContain(
          'Invalid repository format. Use owner/repository format'
        );
      });

      it('invalid branch format head', () => {
        const r = validateQuery('is:pr head:bad/branch/name');

        expect(r.errors).toContain(
          'Invalid branch format for head. Use branch or user:branch format'
        );
      });

      it('invalid branch format base', () => {
        const r = validateQuery('is:pr base:bad/branch/name');

        expect(r.errors).toContain(
          'Invalid branch format for base. Use branch or user:branch format'
        );
      });

      it('invalid sha format', () => {
        const r = validateQuery('is:pr sha:12345');

        expect(r.errors).toContain(
          'Invalid SHA format. Use at least 7 hexadecimal characters'
        );
      });

      it('invalid status value', () => {
        const r = validateQuery('is:pr status:queued');

        expect(r.errors).toContain(
          'Invalid status "queued". Valid statuses: pending, success, failure, error'
        );
      });

      it('invalid reason value', () => {
        const r = validateQuery('is:pr reason:foo');

        expect(r.errors).toContain(
          'Invalid reason "foo". Valid reasons: completed, not planned'
        );
      });

      it('invalid no value', () => {
        const r = validateQuery('is:pr no:labels');

        expect(r.errors).toContain(
          'Invalid "no" qualifier value "labels". Valid values: label, milestone, assignee, project'
        );
      });
    });

    describe('qualifier value validation - valid edge values', () => {
      it('valid date operators & range', () => {
        const r = validateQuery(
          'is:pr created:>2023-01-01 updated:<2023-12-31 merged:2023-01-01..2023-02-01'
        );

        expect(r.isValid).toBe(true);
      });

      it('valid numeric operators & range', () => {
        const r = validateQuery(
          'is:pr comments:>10 interactions:<50 reactions:10..20 size:100'
        );

        expect(r.isValid).toBe(true);
      });

      it('valid user formats incl app/ and @me and * wildcard', () => {
        const r = validateQuery(
          'is:pr author:@me assignee:app/bot mentions:* commenter:user-name involves:another_user reviewed-by:app/reviewer review-requested:someone user-review-requested:app/requester'
        );

        expect(r.isValid).toBe(true);
      });

      it('valid team & team-review-requested', () => {
        const r = validateQuery(
          'is:pr team:org/team-name team-review-requested:org/team2'
        );

        expect(r.isValid).toBe(true);
      });

      it('valid head/base & sha & status & reason underscore', () => {
        const r = validateQuery(
          'is:pr head:feat-branch base:user:main sha:abcdef1 status:success reason:not_planned'
        );

        expect(r.isValid).toBe(true);
      });

      it('valid no values', () => {
        const r = validateQuery(
          'is:pr no:label no:milestone no:assignee no:project'
        );

        expect(r.isValid).toBe(true);
      });
    });

    describe('sanitization', () => {
      it('sanitizes script tags while still flagging invalid user format', () => {
        const result = validateQuery('author:<script>alert()</script>');

        expect(result.sanitized).toBe('is:pr author:scriptalert()/script');
        expect(
          result.errors.some((e) => e.includes('Invalid user format'))
        ).toBe(true);
      });
    });

    describe('suggestions', () => {
      it('does not duplicate existing suggestions same as query', () => {
        const suggestions = getQuerySuggestions('is:pr author:@me');

        expect(suggestions).toEqual([]);
      });
    });

    describe('legacy alias', () => {
      it('validateGitHubSearchSyntax delegates to validateQuery', () => {
        const result = validateGitHubSearchSyntax('author:john');

        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe('is:pr author:john');
      });
    });

    describe('branch coverage additions', () => {
      it('unsupported qualifier triggers error (line 124)', () => {
        const r = validateQuery('is:pr unsupported:value');

        expect(r.errors).toContain('Unsupported search qualifier: unsupported');
      });

      it('validateQueryRealtime empty branch (lines 364-370)', () => {
        const r = validateQueryRealtime('   ');

        expect(r.isValid).toBe(false);
        expect(r.warnings).toContain('Query is empty');
      });

      it('validateQueryRealtime non-empty delegates (lines 372-373)', () => {
        const r = validateQueryRealtime('author:john');

        expect(r.isValid).toBe(true);
        expect(r.sanitized.startsWith('is:pr')).toBe(true);
      });

      it('covers empty trimmed query early return (lines 91-92)', () => {
        const r = validateQuery('   ');

        expect(r.isValid).toBe(false);
        expect(r.sanitized).toBe('');
        expect(r.errors).toContain('Query cannot be empty');
      });

      it('covers length check (line 97)', () => {
        const long = 'a'.repeat(300);
        const r = validateQuery(long);

        expect(r.errors).toContain('Query too long (max 256 characters)');
      });

      it('getQuerySuggestions adds is:pr (line 384) and @me (line 389)', () => {
        const suggestions = getQuerySuggestions('author:john');

        expect(suggestions).toContain('is:pr author:john');
        expect(suggestions).toContain('author:@me');
      });

      it('validateAndSanitizeQuery success path (lines 399-403)', () => {
        const sanitized = validateAndSanitizeQuery('author:john');

        expect(sanitized).toBe('is:pr author:john');
      });

      it('validateAndSanitizeQuery throws on error (lines 399-403)', () => {
        expect(() => validateAndSanitizeQuery('author:"unmatched')).toThrow(
          'Invalid query: Unmatched quote in query'
        );
      });

      it('unmatched parentheses error branch', () => {
        const r = validateQuery('author:(john');

        expect(r.errors).toContain('Unmatched parentheses in query');
      });

      it('lowercase or operator error branch (line 115)', () => {
        const r = validateQuery('author:john or author:jane');

        expect(r.errors).toContain('OR operator should be uppercase');
      });
    });
  });
});

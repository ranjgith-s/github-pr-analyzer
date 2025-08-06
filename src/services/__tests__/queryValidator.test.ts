import { validateQuery, validateAndSanitizeQuery } from '../queryValidator';

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
  });

  describe('validateAndSanitizeQuery', () => {
    it('should return sanitized query for valid input', () => {
      const result = validateAndSanitizeQuery('author:john');
      
      expect(result).toBe('is:pr author:john');
    });

    it('should throw error for invalid input', () => {
      expect(() => {
        validateAndSanitizeQuery('');
      }).toThrow('Invalid query: Query cannot be empty');
    });
  });
});

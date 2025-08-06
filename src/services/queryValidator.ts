export interface QueryValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
  warnings: string[];
}

export function validateAndSanitizeQuery(query: string): string {
  const result = validateQuery(query);

  if (!result.isValid) {
    throw new Error(`Invalid query: ${result.errors.join(', ')}`);
  }

  return result.sanitized;
}

export function validateQuery(query: string): QueryValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = query.trim();

  // Basic validation rules
  if (!sanitized) {
    errors.push('Query cannot be empty');
    return { isValid: false, sanitized, errors, warnings };
  }

  // Length validation
  if (sanitized.length > 256) {
    errors.push('Query too long (max 256 characters)');
  }

  // Required 'is:pr' qualifier
  if (!sanitized.includes('is:pr')) {
    sanitized = `is:pr ${sanitized}`;
    warnings.push('Added "is:pr" qualifier');
  }

  // Sanitize potentially dangerous characters
  sanitized = sanitized.replace(/[<>]/g, '');

  // Validate GitHub search syntax
  const syntaxErrors = validateGitHubSearchSyntax(sanitized);
  errors.push(...syntaxErrors);

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
    warnings,
  };
}

function validateGitHubSearchSyntax(query: string): string[] {
  const errors: string[] = [];

  // Check for unmatched quotes
  const quotes = query.match(/"/g);
  if (quotes && quotes.length % 2 !== 0) {
    errors.push('Unmatched quote in query');
  }

  // Check for invalid operators
  const invalidOperators = query.match(/[&|!]{2,}/g);
  if (invalidOperators) {
    errors.push('Invalid operator syntax');
  }

  return errors;
}

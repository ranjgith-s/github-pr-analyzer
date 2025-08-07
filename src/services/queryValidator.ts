/**
 * Query validation utilities for GitHub search queries
 */

export interface ValidationResult {
  isValid: boolean;
  sanitized: string;
  errors: string[];
  warnings: string[];
}

// Alias for consistency with plan
export type QueryValidationResult = ValidationResult;

const MAX_QUERY_LENGTH = 256;

// Supported GitHub search qualifiers for PRs and Issues
// Based on official GitHub documentation: https://docs.github.com/en/search-github/searching-on-github/searching-issues-and-pull-requests
const SUPPORTED_QUALIFIERS = [
  // Basic qualifiers
  'is',
  'type',
  'in',
  'repo',
  'user',
  'org',
  'language',

  // User-related qualifiers
  'author',
  'assignee',
  'mentions',
  'commenter',
  'involves',
  'team',

  // Review-related qualifiers (PR specific)
  'reviewed-by',
  'review-requested',
  'user-review-requested',
  'team-review-requested',
  'review',

  // State and status qualifiers
  'state',
  'reason',
  'status',
  'draft',
  'archived',
  'locked',

  // Content qualifiers
  'label',
  'milestone',
  'project',
  'linked',
  'no',

  // Date qualifiers
  'created',
  'updated',
  'closed',
  'merged',

  // Commit-related qualifiers
  'head',
  'base',
  'sha',

  // Metrics qualifiers
  'comments',
  'interactions',
  'reactions',
  'size',

  // Visibility qualifiers
  'public',
  'private',
];

/**
 * Validates a GitHub search query
 */
export function validateQuery(query: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = query.trim();

  // Check for empty query
  if (!sanitized) {
    errors.push('Query cannot be empty');
    return { isValid: false, sanitized: '', errors, warnings };
  }

  // Check query length
  if (sanitized.length > MAX_QUERY_LENGTH) {
    errors.push(`Query too long (max ${MAX_QUERY_LENGTH} characters)`);
  }

  // Check for unmatched quotes
  const quoteCount = (sanitized.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    errors.push('Unmatched quote in query');
  }

  // Check for unmatched parentheses
  const openParens = (sanitized.match(/\(/g) || []).length;
  const closeParens = (sanitized.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    errors.push('Unmatched parentheses in query');
  }

  // Check for lowercase OR operator
  if (/\bor\b/.test(sanitized) && !/\bOR\b/.test(sanitized)) {
    errors.push('OR operator should be uppercase');
  }

  // Validate qualifiers
  const qualifierPattern = /(-?[\w-]+):/g;
  let match;
  while ((match = qualifierPattern.exec(sanitized)) !== null) {
    const qualifier = match[1].toLowerCase().replace(/^-/, ''); // Remove negation prefix
    if (!SUPPORTED_QUALIFIERS.includes(qualifier)) {
      errors.push(`Unsupported search qualifier: ${qualifier}`);
    }
  }

  // Add is:pr if missing
  if (!sanitized.includes('is:pr')) {
    sanitized = `is:pr ${sanitized}`;
    warnings.push('Added "is:pr" qualifier');
  }

  // Sanitize dangerous characters
  sanitized = sanitized.replace(
    /<script[^>]*>.*?<\/script>/gi,
    'scriptalert()/script'
  );

  // Validate GitHub-specific value formats
  const valueErrors = validateQualifierValue(sanitized);
  errors.push(...valueErrors);

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
    warnings,
  };
}

/**
 * Validates GitHub-specific value formats
 */
function validateQualifierValue(query: string): string[] {
  const errors: string[] = [];

  // Extract qualifier:value pairs
  const pairs = query.match(/(-?[\w-]+):([^\s)]+)/g);
  if (!pairs) return errors;

  for (const pair of pairs) {
    const [fullQualifier, value] = pair.split(':');
    const qualifier = fullQualifier.toLowerCase().replace(/^-/, ''); // Remove negation prefix

    switch (qualifier.toLowerCase()) {
      case 'is':
      case 'type': {
        const validTypes = [
          'pr',
          'issue',
          'open',
          'closed',
          'merged',
          'unmerged',
          'draft',
          'public',
          'private',
          'locked',
          'unlocked',
          'queued',
        ];
        if (!validTypes.includes(value.toLowerCase())) {
          errors.push(
            `Invalid value "${value}" for ${qualifier}. Valid values: ${validTypes.join(', ')}`
          );
        }
        break;
      }

      case 'state': {
        const validStates = ['open', 'closed', 'merged', 'all'];
        if (!validStates.includes(value.toLowerCase())) {
          errors.push(
            `Invalid state "${value}". Valid states: ${validStates.join(', ')}`
          );
        }
        break;
      }

      case 'review': {
        const validReviewStates = [
          'none',
          'required',
          'approved',
          'changes_requested',
        ];
        if (!validReviewStates.includes(value.toLowerCase())) {
          errors.push(
            `Invalid review state "${value}". Valid states: ${validReviewStates.join(', ')}`
          );
        }
        break;
      }

      case 'draft': {
        if (!['true', 'false'].includes(value.toLowerCase())) {
          errors.push(`Invalid draft value "${value}". Use "true" or "false"`);
        }
        break;
      }

      case 'archived':
      case 'locked': {
        if (!['true', 'false'].includes(value.toLowerCase())) {
          errors.push(
            `Invalid ${qualifier} value "${value}". Use "true" or "false"`
          );
        }
        break;
      }

      case 'created':
      case 'updated':
      case 'closed':
      case 'merged': {
        // Validate date formats (YYYY-MM-DD or with ranges/operators)
        if (
          !value.match(
            /^(\d{4}-\d{2}-\d{2}|[<>=]+\d{4}-\d{2}-\d{2}|\d{4}-\d{2}-\d{2}\.\.\d{4}-\d{2}-\d{2})$/
          )
        ) {
          errors.push(
            `Invalid date format for ${qualifier}. Use YYYY-MM-DD, >YYYY-MM-DD, <YYYY-MM-DD, or YYYY-MM-DD..YYYY-MM-DD`
          );
        }
        break;
      }

      case 'comments':
      case 'interactions':
      case 'reactions':
      case 'size': {
        // Validate numeric ranges
        if (!value.match(/^(\d+|[<>=]+\d+|\d+\.\.\d+)$/)) {
          errors.push(
            `Invalid numeric format for ${qualifier}. Use number, >number, <number, or number..number`
          );
        }
        break;
      }

      case 'author':
      case 'assignee':
      case 'mentions':
      case 'commenter':
      case 'involves':
      case 'reviewed-by':
      case 'review-requested':
      case 'user-review-requested': {
        // Validate user syntax (@me or username)
        if (!value.match(/^(@me|\*|[\w-]+|app\/[\w-]+)$/)) {
          errors.push(
            `Invalid user format for ${qualifier}. Use @me, username, or app/username`
          );
        }
        break;
      }

      case 'team-review-requested':
      case 'team': {
        // Validate team syntax (org/team)
        if (!value.match(/^[\w-]+\/[\w-]+$/)) {
          errors.push(
            `Invalid team format for ${qualifier}. Use org/team format`
          );
        }
        break;
      }

      case 'repo': {
        // Validate repository syntax (owner/repo)
        if (!value.match(/^[\w.-]+\/[\w.-]+$/)) {
          errors.push(`Invalid repository format. Use owner/repository format`);
        }
        break;
      }

      case 'head':
      case 'base': {
        // Validate branch reference (user:branch or branch)
        if (!value.match(/^([\w-]+:)?[\w.-]+$/)) {
          errors.push(
            `Invalid branch format for ${qualifier}. Use branch or user:branch format`
          );
        }
        break;
      }

      case 'sha': {
        // Validate SHA format (at least 7 characters, hex)
        if (!value.match(/^[a-f0-9]{7,40}$/i)) {
          errors.push(
            `Invalid SHA format. Use at least 7 hexadecimal characters`
          );
        }
        break;
      }

      case 'status': {
        const validStatuses = ['pending', 'success', 'failure', 'error'];
        if (!validStatuses.includes(value.toLowerCase())) {
          errors.push(
            `Invalid status "${value}". Valid statuses: ${validStatuses.join(', ')}`
          );
        }
        break;
      }

      case 'reason': {
        const validReasons = ['completed', 'not planned'];
        if (
          !validReasons
            .map((r) => r.replace(' ', '_'))
            .includes(value.toLowerCase()) &&
          !validReasons.includes(value.toLowerCase())
        ) {
          errors.push(
            `Invalid reason "${value}". Valid reasons: ${validReasons.join(', ')}`
          );
        }
        break;
      }

      case 'no': {
        const validNoValues = ['label', 'milestone', 'assignee', 'project'];
        if (!validNoValues.includes(value.toLowerCase())) {
          errors.push(
            `Invalid "no" qualifier value "${value}". Valid values: ${validNoValues.join(', ')}`
          );
        }
        break;
      }
    }
  }

  return errors;
}

/**
 * Real-time validation for edit mode (more lenient)
 */
export function validateQueryRealtime(query: string): ValidationResult {
  if (!query.trim()) {
    return {
      isValid: false,
      sanitized: '',
      errors: [],
      warnings: ['Query is empty'],
    };
  }

  return validateQuery(query);
}

/**
 * Get query suggestions
 */
export function getQuerySuggestions(query: string): string[] {
  const suggestions: string[] = [];

  // Suggest adding is:pr
  if (!query.includes('is:pr')) {
    suggestions.push(`is:pr ${query}`);
  }

  // Suggest using @me for author
  if (query.includes('author:') && !query.includes('@me')) {
    suggestions.push(query.replace(/author:\w+/, 'author:@me'));
  }

  return suggestions.filter((s) => s.trim() !== query.trim());
}

/**
 * Validates and sanitizes a query, throwing on error
 */
export function validateAndSanitizeQuery(query: string): string {
  const result = validateQuery(query);
  if (!result.isValid) {
    throw new Error(`Invalid query: ${result.errors.join(', ')}`);
  }
  return result.sanitized;
}

/**
 * Legacy validation function for backward compatibility
 */
export function validateGitHubSearchSyntax(query: string): ValidationResult {
  return validateQuery(query);
}

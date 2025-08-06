# Chunk 2: Enhanced API Service Layer

## Overview

Refactor the API service layer to support dynamic GitHub search queries while maintaining backward compatibility. This chunk enhances the data fetching infrastructure to handle flexible query parameters and improves error handling.

## Goals

- Support dynamic GitHub search queries
- Add query validation and sanitization
- Implement caching to prevent API rate limiting
- Maintain existing API function signatures
- Add comprehensive error handling

## Technical Changes

### 1. Enhanced API Service with Octokit

**File**: `src/services/githubService.ts`

#### Dependencies and Setup

```typescript
import { Octokit } from '@octokit/rest';
import { RequestError } from '@octokit/request-error';

// Initialize Octokit instance
function createOctokitInstance(token: string): Octokit {
  return new Octokit({
    auth: token,
    userAgent: 'github-pr-analyzer/1.0.0',
    timeZone: 'UTC',
    request: {
      timeout: 10000, // 10 seconds
    }
  });
}
```

#### New Interface Definitions

```typescript
export interface SearchOptions {
  page?: number;
  per_page?: number;
  sort?: 'updated' | 'created' | 'popularity';
  order?: 'asc' | 'desc';
}

export interface PRSearchResult {
  total_count: number;
  incomplete_results: boolean;
  items: PullRequestMetric[];
}

export interface SearchError {
  message: string;
  documentation_url?: string;
  errors?: Array<{
    message: string;
    field?: string;
    code?: string;
  }>;
}
```

#### Enhanced Service Functions

```typescript
// Backward compatible - existing signature maintained
export async function fetchPullRequestMetrics(
  token: string,
  user?: User
): Promise<PullRequestMetric[]>;

// New overload for dynamic queries
export async function fetchPullRequestMetrics(
  token: string,
  query: string,
  options?: SearchOptions
): Promise<PRSearchResult>;

// Implementation with overload resolution
export async function fetchPullRequestMetrics(
  token: string,
  userOrQuery?: User | string,
  options?: SearchOptions
): Promise<PullRequestMetric[] | PRSearchResult> {
  // Handle backward compatibility
  if (typeof userOrQuery === 'object' && userOrQuery?.login) {
    const user = userOrQuery as User;
    const defaultQuery = `is:pr author:${user.login} OR is:pr reviewed-by:${user.login}`;
    const result = await fetchPullRequestsByQuery(token, defaultQuery, options);
    return result.items; // Return legacy format
  }
  
  // Handle new dynamic query format
  const query = userOrQuery as string;
  return await fetchPullRequestsByQuery(token, query, options);
}

async function fetchPullRequestsByQuery(
  token: string,
  query: string,
  options: SearchOptions = {}
): Promise<PRSearchResult> {
  const validatedQuery = validateAndSanitizeQuery(query);
  const searchParams = { q: validatedQuery, ...options };
  
  // Check cache first
  const cacheKey = `pr-search:${JSON.stringify(searchParams)}`;
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const octokit = createOctokitInstance(token);
    
    // Use Octokit's search.issuesAndPullRequests method
    const response = await octokit.rest.search.issuesAndPullRequests({
      q: validatedQuery,
      sort: options.sort as 'updated' | 'created' | 'popularity' | undefined,
      order: options.order,
      per_page: options.per_page || 20,
      page: options.page || 1
    });

    const result = transformSearchResponse(response.data);
    
    // Cache successful results
    await setCache(cacheKey, result, 300); // 5 minutes
    
    return result;
  } catch (error) {
    throw handleOctokitError(error);
  }
}
```

### 2. Query Validation and Sanitization

**File**: `src/services/queryValidator.ts`

```typescript
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
    warnings
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
```

### 3. Caching Layer

**File**: `src/services/cache.ts`

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 100;

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async set<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

const cache = new MemoryCache();

export async function getFromCache<T>(key: string): Promise<T | null> {
  return cache.get<T>(key);
}

export async function setCache<T>(key: string, data: T, ttlSeconds: number): Promise<void> {
  return cache.set(key, data, ttlSeconds);
}

export function clearCache(): void {
  cache.clear();
}
```

### 4. Error Handling with Octokit

**File**: `src/services/errorHandler.ts`

```typescript
import { RequestError } from '@octokit/request-error';

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

export class QueryValidationError extends Error {
  constructor(message: string, public errors: string[]) {
    super(message);
    this.name = 'QueryValidationError';
  }
}

export function handleOctokitError(error: unknown): never {
  if (error instanceof RequestError) {
    switch (error.status) {
      case 401:
        throw new GitHubAPIError('Authentication failed', 401, error.response);
      case 403:
        if (error.message?.includes('rate limit')) {
          throw new GitHubAPIError(
            `Rate limit exceeded. Reset at ${new Date(error.response?.headers['x-ratelimit-reset'] * 1000)}`,
            403,
            error.response
          );
        }
        throw new GitHubAPIError('Access forbidden', 403, error.response);
      case 422:
        throw new GitHubAPIError(
          `Invalid search query: ${error.response?.data?.errors?.[0]?.message || error.message}`,
          422,
          error.response
        );
      default:
        throw new GitHubAPIError(
          error.response?.data?.message || error.message || 'GitHub API error',
          error.status,
          error.response
        );
    }
  }
  
  if (error instanceof QueryValidationError) {
    throw error;
  }
  
  if (error instanceof Error) {
    throw new GitHubAPIError(error.message, 500);
  }
  
  throw new GitHubAPIError('Unknown error occurred', 500);
}

export function handleSearchError(error: unknown): never {
  return handleOctokitError(error);
}
```

## Testing Requirements

### 1. Unit Tests

**File**: `src/services/__tests__/githubService.test.ts`

```typescript
describe('githubService', () => {
  describe('fetchPullRequestMetrics backward compatibility', () => {
    it('should work with legacy User parameter', async () => {
      const user = { login: 'testuser' };
      const result = await fetchPullRequestMetrics('token', user);
      
      expect(result).toEqual(expect.arrayContaining([
        expect.objectContaining({
          number: expect.any(Number),
          title: expect.any(String)
        })
      ]));
    });
  });

  describe('fetchPullRequestMetrics new query interface', () => {
    it('should handle dynamic queries with Octokit', async () => {
      // Mock Octokit response
      const mockOctokit = {
        rest: {
          search: {
            issuesAndPullRequests: jest.fn().mockResolvedValue({
              data: {
                total_count: 5,
                incomplete_results: false,
                items: [
                  { number: 1, title: 'Test PR', pull_request: {} }
                ]
              }
            })
          }
        }
      };
      
      jest.mock('@octokit/rest', () => ({
        Octokit: jest.fn(() => mockOctokit)
      }));

      const result = await fetchPullRequestMetrics(
        'token',
        'is:pr author:john',
        { page: 1, per_page: 10 }
      );
      
      expect(result).toEqual(expect.objectContaining({
        total_count: expect.any(Number),
        items: expect.any(Array)
      }));
      
      expect(mockOctokit.rest.search.issuesAndPullRequests).toHaveBeenCalledWith({
        q: 'is:pr author:john',
        page: 1,
        per_page: 10,
        sort: undefined,
        order: undefined
      });
    });

    it('should handle Octokit errors gracefully', async () => {
      const mockError = new RequestError('Invalid query', 422, {
        request: {},
        response: {
          data: { errors: [{ message: 'Invalid search syntax' }] }
        }
      });

      jest.mock('@octokit/rest', () => ({
        Octokit: jest.fn(() => ({
          rest: {
            search: {
              issuesAndPullRequests: jest.fn().mockRejectedValue(mockError)
            }
          }
        }))
      }));

      await expect(
        fetchPullRequestMetrics('token', 'invalid query')
      ).rejects.toThrow('Invalid search query');
    });
    });
  });
});
```

### 2. Cache Tests

**File**: `src/services/__tests__/cache.test.ts`

```typescript
describe('cache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('should store and retrieve data', async () => {
    const data = { test: 'value' };
    await setCache('test-key', data, 60);
    
    const retrieved = await getFromCache('test-key');
    expect(retrieved).toEqual(data);
  });

  it('should expire data after TTL', async () => {
    await setCache('test-key', { test: 'value' }, 0.1); // 100ms
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const retrieved = await getFromCache('test-key');
    expect(retrieved).toBeNull();
  });
});
```

## Implementation Steps

1. **Day 1**: Install and configure Octokit SDK, implement query validation and sanitization
2. **Day 2**: Create caching layer and enhanced error handling with Octokit error types
3. **Day 3**: Enhance githubService with Octokit integration and overloads
4. **Day 4**: Comprehensive testing including Octokit mocks and integration

## Dependencies

### New Package Installations

```bash
npm install @octokit/rest @octokit/request-error
npm install --save-dev @types/octokit
```

### Octokit Configuration

- Configure authentication with personal access tokens
- Set appropriate user agent and request timeouts
- Handle rate limiting with exponential backoff
- Use TypeScript types for all Octokit responses

## Acceptance Criteria

- [ ] Existing API calls continue to work unchanged
- [ ] New query-based API supports GitHub search syntax
- [ ] Query validation prevents invalid requests
- [ ] Caching reduces API calls and improves performance
- [ ] Error handling provides clear, actionable messages
- [ ] All functions maintain type safety
- [ ] Test coverage exceeds 95%

## Risk Mitigation

- **Rate Limiting**: Caching and request deduplication
- **Invalid Queries**: Comprehensive validation before API calls
- **Breaking Changes**: Overloaded functions maintain compatibility
- **Error Handling**: Graceful degradation with helpful messages

## Future Preparation

This enhanced service layer enables:

- Real-time query validation in UI
- Query suggestion and autocomplete
- Performance monitoring and optimization
- Advanced error recovery strategies

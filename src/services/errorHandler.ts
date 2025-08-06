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
  constructor(
    message: string,
    public errors: string[]
  ) {
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
          const resetTime = error.response?.headers?.['x-ratelimit-reset'];
          const resetDate =
            resetTime && typeof resetTime === 'string'
              ? new Date(parseInt(resetTime) * 1000)
              : new Date();
          throw new GitHubAPIError(
            `Rate limit exceeded. Reset at ${resetDate}`,
            403,
            error.response
          );
        }
        throw new GitHubAPIError('Access forbidden', 403, error.response);
      case 422: {
        const errorData = error.response?.data as any;
        throw new GitHubAPIError(
          `Invalid search query: ${errorData?.errors?.[0]?.message || error.message}`,
          422,
          error.response
        );
      }
      default: {
        const responseData = error.response?.data as any;
        throw new GitHubAPIError(
          responseData?.message || error.message || 'GitHub API error',
          error.status,
          error.response
        );
      }
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

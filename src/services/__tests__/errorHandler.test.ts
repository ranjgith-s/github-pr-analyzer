import { RequestError } from '@octokit/request-error';
import {
  GitHubAPIError,
  QueryValidationError,
  handleOctokitError,
} from '../errorHandler';

const request = {
  method: 'GET' as const,
  url: 'https://api.github.com/search/issues',
  headers: {},
};

const mockResponse = {
  headers: {},
  status: 422,
  url: 'https://api.github.com/search/issues',
};

describe('Error Handler', () => {
  describe('GitHubAPIError', () => {
    it('should create error with status and response', () => {
      const error = new GitHubAPIError('Test error', 422, { test: 'data' });

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(422);
      expect(error.response).toEqual({ test: 'data' });
      expect(error.name).toBe('GitHubAPIError');
    });
  });

  describe('QueryValidationError', () => {
    it('should create error with validation errors', () => {
      const error = new QueryValidationError('Invalid query', [
        'Error 1',
        'Error 2',
      ]);

      expect(error.message).toBe('Invalid query');
      expect(error.errors).toEqual(['Error 1', 'Error 2']);
      expect(error.name).toBe('QueryValidationError');
    });
  });

  describe('handleOctokitError', () => {
    it('should handle 401 authentication errors', () => {
      const requestError = new RequestError('Unauthorized', 401, {
        request,
        response: { ...mockResponse, data: { message: 'Bad credentials' } },
      });

      expect(() => handleOctokitError(requestError)).toThrow(
        'Authentication failed'
      );
    });

    it('should handle 403 rate limit errors', () => {
      const requestError = new RequestError('Rate limit exceeded', 403, {
        request,
        response: {
          ...mockResponse,
          headers: { 'x-ratelimit-reset': '1640995200' },
          data: { message: 'API rate limit exceeded' },
        },
      });
      requestError.message = 'rate limit exceeded';

      expect(() => handleOctokitError(requestError)).toThrow(
        /Rate limit exceeded/
      );
    });

    it('should handle 422 validation errors', () => {
      const requestError = new RequestError('Validation failed', 422, {
        request,
        response: {
          ...mockResponse,
          data: {
            errors: [{ message: 'Invalid search syntax' }],
          },
        },
      });

      expect(() => handleOctokitError(requestError)).toThrow(
        /Invalid search query/
      );
    });

    it('should handle generic request errors', () => {
      const requestError = new RequestError('Server error', 500, {
        request,
        response: {
          ...mockResponse,
          data: { message: 'Internal server error' },
        },
      });

      expect(() => handleOctokitError(requestError)).toThrow(
        'Internal server error'
      );
    });

    it('should handle non-RequestError instances', () => {
      const genericError = new Error('Generic error');

      expect(() => handleOctokitError(genericError)).toThrow('Generic error');
    });

    it('should handle QueryValidationError instances', () => {
      const validationError = new QueryValidationError('Invalid query', [
        'Error',
      ]);

      expect(() => handleOctokitError(validationError)).toThrow(
        'Invalid query'
      );
    });

    it('should handle unknown errors', () => {
      expect(() => handleOctokitError('unknown')).toThrow(
        'Unknown error occurred'
      );
    });
  });
});

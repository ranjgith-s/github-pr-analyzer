import {
  getDefaultQuery,
  parseQueryParams,
  buildQueryString,
  QueryParams,
  User,
} from '../queryUtils';

describe('queryUtils', () => {
  describe('getDefaultQuery', () => {
    it('should generate correct default query for user', () => {
      const user: User = { login: 'testuser' };
      const query = getDefaultQuery(user);
      expect(query).toBe('is:pr author:testuser OR is:pr reviewed-by:testuser');
    });

    it('should handle user login with special characters', () => {
      const user: User = { login: 'test-user.name' };
      const query = getDefaultQuery(user);
      expect(query).toBe(
        'is:pr author:test-user.name OR is:pr reviewed-by:test-user.name'
      );
    });
  });

  describe('parseQueryParams', () => {
    it('should parse URL parameters correctly', () => {
      const searchParams = new URLSearchParams(
        'q=is:pr+author:john&page=2&sort=created&per_page=10'
      );
      const params = parseQueryParams(searchParams);
      expect(params).toEqual({
        q: 'is:pr author:john',
        page: 2,
        sort: 'created',
        per_page: 10,
      });
    });

    it('should return defaults for missing parameters', () => {
      const searchParams = new URLSearchParams('');
      const params = parseQueryParams(searchParams);
      expect(params).toEqual({
        q: undefined,
        page: 1,
        sort: 'updated',
        per_page: 20,
      });
    });

    it('should handle partial parameters', () => {
      const searchParams = new URLSearchParams('q=is:pr+label:bug&page=3');
      const params = parseQueryParams(searchParams);
      expect(params).toEqual({
        q: 'is:pr label:bug',
        page: 3,
        sort: 'updated',
        per_page: 20,
      });
    });

    it('should handle invalid numeric parameters', () => {
      const searchParams = new URLSearchParams('page=abc&per_page=xyz');
      const params = parseQueryParams(searchParams);
      expect(params).toEqual({
        q: undefined,
        page: NaN, // Number('abc') returns NaN
        sort: 'updated',
        per_page: NaN, // Number('xyz') returns NaN
      });
    });

    it('should decode URL-encoded query parameters', () => {
      const searchParams = new URLSearchParams('q=is%3Apr+author%3Ajohn');
      const params = parseQueryParams(searchParams);
      expect(params.q).toBe('is:pr author:john');
    });
  });

  describe('buildQueryString', () => {
    it('should build query string with all parameters', () => {
      const params: QueryParams = {
        q: 'is:pr author:john',
        page: 2,
        sort: 'created',
        per_page: 10,
      };
      const queryString = buildQueryString(params);
      expect(queryString).toBe(
        'q=is%3Apr+author%3Ajohn&page=2&sort=created&per_page=10'
      );
    });

    it('should omit default values', () => {
      const params: QueryParams = {
        q: 'is:pr author:john',
        page: 1, // default value
        sort: 'updated', // default value
        per_page: 20, // default value
      };
      const queryString = buildQueryString(params);
      expect(queryString).toBe('q=is%3Apr+author%3Ajohn');
    });

    it('should handle empty params object', () => {
      const params: QueryParams = {};
      const queryString = buildQueryString(params);
      expect(queryString).toBe('');
    });

    it('should include non-default values only', () => {
      const params: QueryParams = {
        page: 3,
        sort: 'popularity',
      };
      const queryString = buildQueryString(params);
      expect(queryString).toBe('page=3&sort=popularity');
    });

    it('should properly encode special characters in query', () => {
      const params: QueryParams = {
        q: 'is:pr author:test-user.name label:"bug fix"',
      };
      const queryString = buildQueryString(params);
      expect(queryString).toContain(
        'q=is%3Apr+author%3Atest-user.name+label%3A%22bug+fix%22'
      );
    });
  });
});

import '@testing-library/jest-dom';
import '@octokit/rest'; // import to ensure Jest applies manual mock

// Polyfill scrollIntoView for tests (JSDOM does not implement it)
if (!HTMLElement.prototype.scrollIntoView) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  HTMLElement.prototype.scrollIntoView = function () {};
}

// Always mock fetch to return a resolved minimal Response-like object to avoid TypeError: reading 'then'
// Individual tests can override as needed.
const defaultFetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: async () => ({}),
  text: async () => '{}',
  headers: new Headers(),
});
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
global.fetch = defaultFetch;

// Suppress React act warnings for mock components and filter noisy, known & intentional deprecation / network warnings
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = (...args: any[]) => {
    const first = args[0];
    if (
      typeof first === 'string' &&
      first.includes('inside a test was not wrapped in act(')
    ) {
      return; // suppress React act warnings
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    const first = args[0];
    if (typeof first === 'string') {
      // React Router v7 transition warnings
      if (first.includes('React Router') && first.includes('v7')) return;
      // Suggestion service benign fetch failures / rate limit noise
      if (first.includes('Failed to fetch user suggestions')) return;
      if (first.includes('Failed to fetch repository suggestions')) return;
      if (first.includes('Failed to fetch suggestions')) return;
      // Octokit deprecation about advanced_search handled explicitly in code
      if (first.includes('issues advanced search will become default')) return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
  defaultFetch.mockClear();
});

// To silence React Router v7 deprecation warnings in tests, future flags are enabled on all router instances within tests.

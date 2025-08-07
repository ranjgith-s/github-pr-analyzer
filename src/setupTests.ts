import '@testing-library/jest-dom';

// Mock fetch for Octokit in tests
if (!global.fetch) {
  global.fetch = jest.fn();
}

// Suppress React act warnings for mock components
const originalError = console.error;
beforeEach(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('An update to') &&
      args[0].includes('inside a test was not wrapped in act(...)')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
});

// To silence React Router v7 deprecation warnings in tests, set future flags in your router config where possible.
// Example: <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>

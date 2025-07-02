import '@testing-library/jest-dom';

// Mock fetch for Octokit in tests
if (!global.fetch) {
  global.fetch = jest.fn();
}

// To silence React Router v7 deprecation warnings in tests, set future flags in your router config where possible.
// Example: <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>

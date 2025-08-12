module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/setupTests.ts',
    '!src/**/__tests__/**',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^framer-motion$': '<rootDir>/__mocks__/framer-motion.js',
    '^@headlessui/react$': '<rootDir>/__mocks__/@headlessui/react.js',
    '^@octokit/request-error$': '<rootDir>/__mocks__/@octokit/request-error.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@octokit|universal-user-agent|before-after-hook|deprecation|once)/)',
  ],
  coverageThreshold: {
    global: {
      lines: 50,
    },
  },
};

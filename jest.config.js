module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/setupTests.ts',
    '!src/**/__tests__/**'
  ],
  moduleNameMapper: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
    '^@primer/react$': '<rootDir>/src/primer-shim.tsx',
    '^@primer/react/drafts$': '<rootDir>/src/primer-drafts-shim.tsx',
    '^@primer/octicons-react$': '<rootDir>/src/octicons-shim.tsx',
    '^@heroui/react$': '<rootDir>/src/heroui-shim.tsx'
  },
  coverageThreshold: {
    global: {
      lines: 50
    }
  }
};

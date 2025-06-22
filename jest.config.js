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
    '^@heroui/react$': '<rootDir>/src/heroui-test-shim.tsx'
  },
  coverageThreshold: {
    global: {
      lines: 50
    }
  }
};

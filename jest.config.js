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
    '^framer-motion$': '<rootDir>/__mocks__/framer-motion.js',
    '^@headlessui/react$': '<rootDir>/__mocks__/@headlessui/react.js',
    '^@heroui/react$': '<rootDir>/__mocks__/@heroui/react.js',
    '^@heroui/system$': '<rootDir>/__mocks__/@heroui/system.js',
  },
  coverageThreshold: {
    global: {
      lines: 50,
    },
  },
};

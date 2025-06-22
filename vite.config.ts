import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: '@heroui/react',
        replacement: path.resolve(__dirname, 'src/heroui-shim.tsx'),
      },
      {
        find: '@primer/react/drafts',
        replacement: path.resolve(__dirname, 'src/primer-drafts-shim.tsx'),
      },
      {
        find: '@primer/react',
        replacement: path.resolve(__dirname, 'src/primer-shim.tsx'),
      },
      {
        find: '@primer/octicons-react',
        replacement: path.resolve(__dirname, 'src/octicons-shim.tsx'),
      },
    ],
  },
  build: {
    outDir: 'build',
  },
});

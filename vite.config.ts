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
    ],
  },
  build: {
    outDir: 'build',
  },
});

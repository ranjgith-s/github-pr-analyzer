import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(async () => {
  const analyze = process.env.ANALYZE === 'true' || process.env.ANALYZE === '1';
  const plugins = [react()];
  if (analyze) {
    const { visualizer } = await import('rollup-plugin-visualizer');
    plugins.push(
      // @ts-expect-error types may not be available
      visualizer({
        filename: 'build/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      })
    );
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'build',
    },
  };
});

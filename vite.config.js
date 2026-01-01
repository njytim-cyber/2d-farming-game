import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  test: {
    include: ['tests/unit/**/*.test.js'],
    exclude: ['tests/e2e/**', 'tests/regression/**', '**/node_modules/**'],
    globals: false, // Don't inject globals that conflict with Playwright
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'esnext'
  },
  server: {
    port: 3000,
    open: true,
    host: true
  },
  preview: {
    port: 4173
  }
});

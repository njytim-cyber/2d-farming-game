import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
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

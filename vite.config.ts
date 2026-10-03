import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// One config for the dev server, the production build and Vitest, so tests
// resolve modules exactly the way the bundle does.
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Root-relative alias: Vite resolves '/src' against the project root, which
    // avoids pulling in Node typings just to compute an absolute path.
    alias: { '@': '/src' },
  },
  server: {
    // Same-origin API calls in production go through the load balancer; locally
    // they are proxied to island-venues-api on port 8080 started with
    // DEV_MODE=true, which takes the caller from X-Dev-User. The header is
    // added by this dev server only; it is never part of the built app, and
    // the deployed API ignores it.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        headers: { 'X-Dev-User': 'visitor@example.com' },
      },
    },
  },
  build: {
    outDir: 'dist',
    // Source maps would publish the original sources next to the bundle.
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
    unstubGlobals: true,
  },
});

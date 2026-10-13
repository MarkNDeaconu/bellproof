// QA-only Vite config for the logo-mark agent: builds the harness and this folder's demo page into .qa/art-logo-mark.
//   npx vite build --config src/art/logo-mark/qa.vite.config.ts
// The shipped site config is vite.config.ts (engine-owned); this file never touches it.

import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../..', import.meta.url));

export default defineConfig({
  root,
  base: './',
  publicDir: 'public',
  build: {
    target: 'es2022',
    outDir: '.qa/art-logo-mark',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        preview: `${root}preview.html`,
        demo: `${root}src/art/logo-mark/demo.html`,
      },
    },
  },
  server: { strictPort: true, port: 5226 },
});

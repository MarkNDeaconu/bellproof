// Builds the QA-only flow demo:  npx vite build --config src/art/chain-flow/tools/vite.demo.config.ts
// Output: .qa/art-chain-flow/demo/flow-demo.html (build the main harness first; this only empties demo/).
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const project = fileURLToPath(new URL('../../../../', import.meta.url));

export default defineConfig({
  root: here,
  base: './',
  build: {
    target: 'es2022',
    outDir: `${project}.qa/art-chain-flow/demo`,
    emptyOutDir: true,
    rollupOptions: { input: { demo: `${here}flow-demo.html` } },
  },
});

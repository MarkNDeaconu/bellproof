// Build for the icon specimen page (art-icons QA only; never part of the site build).
//   BP_ONLY=icons npx vite build --config src/art/icons/specimen/vite.config.ts --outDir .qa/art-icons
// Reuses the project config (BP_ONLY registry filter, base './') and swaps the inputs for the
// piece harness + this specimen page.

import { fileURLToPath } from 'node:url';
import base from '../../../../vite.config';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const cfg = base as Record<string, any>;

export default {
  ...cfg,
  root,
  build: {
    ...cfg.build,
    rollupOptions: {
      input: {
        preview: `${root}preview.html`,
        specimen: fileURLToPath(new URL('./specimen.html', import.meta.url)),
      },
    },
  },
};

import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';

const here = fileURLToPath(new URL('.', import.meta.url));

// BP_ONLY=fridge-hero,icons npx vite build --outDir .qa/<agent>
// Builds with only the listed art folders (plus placeholder) in the registry, so another agent's
// half-edited piece can't break your build. Unset = every folder (the normal build).
// BP_SECTIONS=top,trust does the same for page sections (nav and footer are always included).
function onlyPieces(): Plugin {
  const only = process.env.BP_ONLY?.split(',').map((s) => s.trim()).filter(Boolean);
  const sections = process.env.BP_SECTIONS?.split(',').map((s) => s.trim()).filter(Boolean);
  return {
    name: 'bp-only-pieces',
    enforce: 'pre',
    transform(code, id) {
      const file = id.replace(/\\/g, '/');
      if (file.endsWith('/src/main.ts') && sections?.length) {
        // BP_SECTIONS=top,trust → only these section modules (+ nav, footer) and their CSS, so another
        // agent's half-written section can't break your page build.
        const names = Array.from(new Set(['nav', 'footer', ...sections]));
        const ts = names.filter((n) => existsSync(`${here}src/sections/${n}.ts`));
        const css = names.filter((n) => existsSync(`${here}src/styles/sections/${n}.css`));
        const cssImports = css.map((n) => `import './styles/sections/${n}.css';`).join('\n');
        const tsImports = ts.map((n, i) => `import * as s${i} from './sections/${n}.ts';`).join('\n');
        const map = `{ ${ts.map((n, i) => `'./sections/${n}.ts': s${i}`).join(', ')} }`;
        return code
          .replace(/import\.meta\.glob\('\.\/styles\/sections\/\*\.css'[^;]*;/, cssImports)
          .replace(/import\.meta\.glob<SectionModule>\('\.\/sections\/\*\.ts'[^)]*\)/, map)
          .replace(/^/, `${tsImports}\n`);
      }
      if (!only?.length || !file.endsWith('/src/art/registry.ts')) return;
      const folders = Array.from(new Set(['placeholder', ...only]));
      const imports = folders.map((f, i) => `import * as m${i} from './${f}/index.ts';`).join('\n');
      const map = `const modules = { ${folders.map((f, i) => `'./${f}/index.ts': m${i}`).join(', ')} };`;
      return code.replace(/const modules = import\.meta\.glob[^;]*;/, `${imports}\n${map}`);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [onlyPieces()],
  build: {
    target: 'es2022',
    rollupOptions: {
      input: {
        main: `${here}index.html`,
        preview: `${here}preview.html`,
      },
    },
  },
  // qa/ (screenshots), .qa/ (agent builds) and dist/ hold thousands of files nobody edits by hand: keep the watcher off them
  server: { strictPort: true, watch: { ignored: ['**/qa/**', '**/.qa/**', '**/dist/**'] } },
});

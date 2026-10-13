// Writes public/favicon.svg from the bell bitmap (card 16: 32-box, the mark at 2 px/art px, 4 px side padding).
// Coordinates are all even, so the icon is pixel-exact at 16 (×0.5), 32 (×1) and 48 (×1.5). The fill follows the
// browser colour scheme: ink on light tab strips, paper on dark ones.
//   npx tsx src/art/logo-mark/tools/favicon.ts [--out path]

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { PALETTE } from '../../../engine/palette';
import { bellPath } from '../bell';

const root = resolve(new URL('../../../..', import.meta.url).pathname);
const args = process.argv.slice(2);
const flag = (k: string): string | undefined => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const out = flag('out') ?? join(root, 'public', 'favicon.svg');
const top = Number(flag('top') ?? 6);   // 6 above, 4 below: the bell stands low in the box

export function faviconSVG(topPad = 6): string {
  const d = bellPath(2, 4, topPad);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges">` +
    `<style>path{fill:${PALETTE.k}}@media(prefers-color-scheme:dark){path{fill:${PALETTE.p}}}</style>` +
    `<path d="${d}"/></svg>\n`;
}

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, faviconSVG(top));
console.log('wrote', out);

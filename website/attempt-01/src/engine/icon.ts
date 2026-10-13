// Pixel icons as inline SVG rect grids, from any registered piece's poster frame. engine-spec §6.2.
// 1-colour bitmaps fill with currentColor; multi-colour bitmaps keep their palette hexes.

import { Grid } from './grid';
import { KEYS, PALETTE } from './palette';
import { defaultIO, sizeOf } from './piece';
import { getPiece } from './registry';
import { UNIT } from './scale';

const ALLOWED = new Set([2, 4, 8, 20]);
const SVG_NS = 'http://www.w3.org/2000/svg';

export interface IconOpts { size?: number; tick?: number; variant?: string; className?: string; label?: string }

/** Merge same-colour horizontal runs into rects. Returns [x, y, w, index] tuples. */
export function runs(g: Grid): Array<[number, number, number, number]> {
  const out: Array<[number, number, number, number]> = [];
  for (let y = 0; y < g.h; y++) {
    let x = 0;
    while (x < g.w) {
      const v = g.data[y * g.w + x];
      if (!v) { x++; continue; }
      let x2 = x + 1;
      while (x2 < g.w && g.data[y * g.w + x2] === v) x2++;
      out.push([x, y, x2 - x, v]);
      x = x2;
    }
  }
  return out;
}

export function iconSVG(pieceId: string, opts: IconOpts = {}): string {
  const piece = getPiece(pieceId);
  const size = opts.size ?? UNIT;
  if (!ALLOWED.has(size)) throw new Error(`icon(): size must be one of ${[...ALLOWED].join(', ')}`);
  const [w, h] = sizeOf(piece, opts.variant);
  const g = new Grid(w, h);
  piece.frame(opts.tick ?? piece.poster, g, defaultIO(piece), opts.variant);
  const colours = g.colours();
  const mono = colours.size <= 1;
  const rects = runs(g).map(([x, y, rw, v]) => `<rect x="${x}" y="${y}" width="${rw}" height="1"${mono ? '' : ` fill="${PALETTE[KEYS[v - 1]]}"`}/>`).join('');
  const label = opts.label ?? '';
  const aria = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<svg xmlns="${SVG_NS}" class="icon${opts.className ? ' ' + opts.className : ''}" width="${w * size}" height="${h * size}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" ${mono ? 'fill="currentColor"' : ''} ${aria}>${rects}</svg>`;
}

export function icon(pieceId: string, opts: IconOpts = {}): SVGElement {
  const tpl = document.createElement('template');
  tpl.innerHTML = iconSVG(pieceId, opts);
  return tpl.content.firstElementChild as SVGElement;
}

/** Replace every `<i data-icon="id" data-size="4">` under root with an inline SVG. */
export function hydrateIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    const svg = icon(el.dataset.icon!, { size: el.dataset.size ? Number(el.dataset.size) : UNIT, label: el.dataset.label, variant: el.dataset.variant || undefined });
    el.replaceWith(svg);
  });
}

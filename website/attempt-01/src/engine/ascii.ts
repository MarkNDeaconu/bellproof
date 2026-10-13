// ASCII index maps → Parts. engine-spec §3.2.
// Rows are palette keys, '.' is transparent. Template literals are dedented and blank edge lines are stripped.

import { KEY_INDEX, TRANSPARENT } from './palette';

export interface Part {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8Array; // 0 = transparent, else KEY_INDEX
  readonly name: string;
}

function toRows(src: string | readonly string[]): string[] {
  const lines = Array.isArray(src) ? [...src] : String(src).split('\n');
  while (lines.length && lines[0].trim() === '') lines.shift();
  while (lines.length && lines[lines.length - 1].trim() === '') lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim() !== '').map((l) => l.match(/^\s*/)![0].length));
  return lines.map((l) => l.slice(indent).replace(/\s+$/, ''));
}

export function part(src: string | readonly string[], name = 'part'): Part {
  const rows = toRows(src);
  if (!rows.length) throw new Error(`${name}: empty map`);
  const w = rows[0].length;
  const h = rows.length;
  const data = new Uint8Array(w * h);
  rows.forEach((row, y) => {
    if (row.length !== w) throw new Error(`${name}: row ${y} has width ${row.length}, expected ${w}`);
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === TRANSPARENT) continue;
      const idx = KEY_INDEX[ch];
      if (!idx) throw new Error(`${name}: unknown key "${ch}" at ${x},${y}`);
      data[y * w + x] = idx;
    }
  });
  return { w, h, data, name };
}

/** Several parts in one string, separated by one or more blank lines, named by `ids` in order. */
export function parts(sheet: string, ids: readonly string[]): Record<string, Part> {
  const blocks = sheet.split(/\n\s*\n/).map((b) => b.split('\n')).filter((b) => b.some((l) => l.trim() !== ''));
  if (blocks.length !== ids.length) throw new Error(`parts: found ${blocks.length} maps for ${ids.length} ids`);
  const out: Record<string, Part> = {};
  blocks.forEach((rows, i) => { out[ids[i]] = part(rows, ids[i]); });
  return out;
}

/** A Part from a 1-colour '#' / '.' mask, coloured with one key (icons, glyphs). */
export function mask(src: string | readonly string[], key: string, name = 'mask'): Part {
  const rows = toRows(src).map((r) => r.replace(/#/g, key));
  return part(rows, name);
}

export function flipX(p: Part): Part {
  const data = new Uint8Array(p.w * p.h);
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) data[y * p.w + (p.w - 1 - x)] = p.data[y * p.w + x];
  return { w: p.w, h: p.h, data, name: p.name + ':flipX' };
}

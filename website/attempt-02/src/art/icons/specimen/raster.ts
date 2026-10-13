// Node-side PNG canvas for the icon specimen sheets (no browser, exact pixels).
// Used by specimen/sheets.ts. Never imported by the page.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { PNG } from 'pngjs';
import { Grid } from '../../../engine/grid';
import { font3x5 } from '../../../engine/glyphs';
import { RGBA, type Key } from '../../../engine/palette';

export type RGB = readonly [number, number, number];
export const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export const SURFACE = {
  card: hex('#FBFAF7'), paper: hex('#F4F2ED'), paper2: hex('#ECE9E1'), ink: hex('#0E1424'), ink2: hex('#16203A'),
  hair: hex('#DEDBD3'), hairDark: hex('#2A3655'), soft: hex('#475069'), muted: hex('#7F89A2'), blue: hex('#2F5BEA'),
  azure: hex('#8FAEFF'), mist: hex('#C9D5FA'), alert: hex('#C0105E'),
};

export class Sheet {
  readonly data: Uint8Array;
  constructor(readonly w: number, readonly h: number, bg: RGB) {
    this.data = new Uint8Array(w * h * 4);
    this.rect(0, 0, w, h, bg);
  }

  rect(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let yy = Math.max(0, y); yy < Math.min(this.h, y + h); yy++)
      for (let xx = Math.max(0, x); xx < Math.min(this.w, x + w); xx++) {
        const i = (yy * this.w + xx) * 4;
        this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2]; this.data[i + 3] = 255;
      }
  }

  /** Blit a Grid at integer scale. `mono` recolours every opaque pixel (simulates SVG currentColor). */
  grid(g: Grid, x: number, y: number, s: number, mono?: RGB): void {
    for (let gy = 0; gy < g.h; gy++) for (let gx = 0; gx < g.w; gx++) {
      const k = g.get(gx, gy);
      if (!k) continue;
      const c: RGB = mono ?? (RGBA[k as Key].slice(0, 3) as unknown as RGB);
      this.rect(x + gx * s, y + gy * s, s, s, c);
    }
  }

  /** Text with the engine's 3×5 font (caps); returns advance in px. */
  text(str: string, x: number, y: number, s: number, c: RGB): number {
    let cx = x;
    for (const ch of str.toUpperCase()) {
      if (ch === ' ') { cx += 4 * s; continue; }
      const p = font3x5.glyphs[ch];
      if (p) for (let py = 0; py < p.h; py++) for (let px = 0; px < p.w; px++) if (p.data[py * p.w + px]) this.rect(cx + px * s, y + py * s, s, s, c);
      cx += 4 * s;
    }
    return cx - x;
  }

  /** Dotted 1-px frame showing the icon's box. */
  box(x: number, y: number, w: number, h: number, c: RGB): void {
    for (let i = 0; i < w; i += 2) { this.rect(x + i, y - 1, 1, 1, c); this.rect(x + i, y + h, 1, 1, c); }
    for (let i = 0; i < h; i += 2) { this.rect(x - 1, y + i, 1, 1, c); this.rect(x + w, y + i, 1, 1, c); }
  }

  save(path: string): void {
    mkdirSync(dirname(path), { recursive: true });
    const png = new PNG({ width: this.w, height: this.h });
    png.data.set(this.data);
    writeFileSync(path, PNG.sync.write(png));
  }
}

export const textWidth = (str: string, s: number): number => str.length * 4 * s;

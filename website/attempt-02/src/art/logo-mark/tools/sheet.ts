// A tiny RGBA sheet for the logo-mark QA renders (Node only, pngjs). Paints Grids / Parts at integer scales
// and labels them with the engine's 3×5 glyph font. Not part of the shipped bundle.

import { writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import { Grid } from '../../../engine/grid';
import { font3x5 } from '../../../engine/glyphs';
import { PALETTE, RGBA, type Key } from '../../../engine/palette';
import type { Part } from '../../../engine/ascii';

export class Sheet {
  readonly png: PNG;
  constructor(readonly w: number, readonly h: number, bg: Key | string = 'p') {
    this.png = new PNG({ width: w, height: h });
    this.fill(0, 0, w, h, bg);
  }
  private rgb(c: Key | string): [number, number, number] {
    const hex = c.length === 1 ? PALETTE[c as Key] : c;
    return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
  }
  fill(x: number, y: number, w: number, h: number, c: Key | string): void {
    const [r, g, b] = this.rgb(c);
    for (let yy = Math.max(0, y); yy < Math.min(this.h, y + h); yy++) for (let xx = Math.max(0, x); xx < Math.min(this.w, x + w); xx++) {
      const i = (yy * this.w + xx) * 4;
      this.png.data[i] = r; this.png.data[i + 1] = g; this.png.data[i + 2] = b; this.png.data[i + 3] = 255;
    }
  }
  /** Paint a grid at an integer scale; transparent pixels are skipped. */
  paint(src: Grid, ox: number, oy: number, scale: number): void {
    const rgba = src.toRGBA();
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const si = (y * src.w + x) * 4;
      if (!rgba[si + 3]) continue;
      const hex = `#${[rgba[si], rgba[si + 1], rgba[si + 2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
      this.fill(ox + x * scale, oy + y * scale, scale, scale, hex);
    }
  }
  /** Paint a 1-colour Part (mask) in colour `k` at scale. */
  paintPart(p: Part, ox: number, oy: number, scale: number, k: Key): void {
    const g = new Grid(p.w, p.h);
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) if (p.data[y * p.w + x]) g.set(x, y, k);
    this.paint(g, ox, oy, scale);
  }
  /** 3×5 label at `scale` px per glyph px. */
  label(text: string, x: number, y: number, k: Key, scale = 2): void {
    const g = new Grid(text.length * 4 + 1, 5);
    g.text(font3x5, text.toUpperCase(), 0, 0, k);
    this.paint(g, x, y, scale);
  }
  save(path: string): void { writeFileSync(path, PNG.sync.write(this.png)); }
}

export const rgbaOf = (k: Key) => RGBA[k];

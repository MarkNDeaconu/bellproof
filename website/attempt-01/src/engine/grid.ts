// The integer drawing surface every piece renders into. engine-spec §3.1.
// Stores palette indices (0 = transparent). No floats are ever stored; geometry is rasterised here.

import { KEYS, KEY_INDEX, RGBA_BY_INDEX, type Key } from './palette';
import { ditherAt, type DitherLevel } from './dither';
import type { Part } from './ascii';
import type { Font } from './glyphs';

export interface BlitOpts { flipX?: boolean; flipY?: boolean; mask?: readonly Key[]; recolor?: Partial<Record<Key, Key>> }

export class Grid {
  readonly w: number;
  readonly h: number;
  readonly data: Uint8Array;

  constructor(w: number, h: number) {
    if (!(w > 0 && h > 0)) throw new Error(`Grid: bad size ${w}×${h}`);
    this.w = w; this.h = h; this.data = new Uint8Array(w * h);
  }

  clear(): void { this.data.fill(0); }

  inside(x: number, y: number): boolean { return x >= 0 && y >= 0 && x < this.w && y < this.h; }

  get(x: number, y: number): Key | null {
    if (!this.inside(x, y)) return null;
    const v = this.data[y * this.w + x];
    return v ? KEYS[v - 1] : null;
  }

  set(x: number, y: number, k: Key | null): void {
    if (!this.inside(x, y)) return;
    this.data[y * this.w + x] = k ? KEY_INDEX[k] : 0;
  }

  rect(x: number, y: number, w: number, h: number, k: Key | null, fill = true): void {
    if (fill) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) this.set(xx, yy, k);
    } else {
      for (let xx = x; xx < x + w; xx++) { this.set(xx, y, k); this.set(xx, y + h - 1, k); }
      for (let yy = y; yy < y + h; yy++) { this.set(x, yy, k); this.set(x + w - 1, yy, k); }
    }
  }

  /** Bresenham line with "no doubles" cleanup (L-shaped corner pixels removed) so 1-px lines read clean. */
  line(x0: number, y0: number, x1: number, y1: number, k: Key | null): void {
    for (const [x, y] of linePoints(x0, y0, x1, y1)) this.set(x, y, k);
  }

  /** Midpoint circle. */
  circle(cx: number, cy: number, r: number, k: Key | null, fill = false): void {
    if (r < 0) return;
    if (r === 0) { this.set(cx, cy, k); return; }
    let x = r, y = 0, err = 1 - r;
    const plot = (px: number, py: number) => this.set(px, py, k);
    const span = (xa: number, xb: number, yy: number) => { for (let i = Math.min(xa, xb); i <= Math.max(xa, xb); i++) this.set(i, yy, k); };
    while (x >= y) {
      if (fill) {
        span(cx - x, cx + x, cy + y); span(cx - x, cx + x, cy - y);
        span(cx - y, cx + y, cy + x); span(cx - y, cx + y, cy - x);
      } else {
        plot(cx + x, cy + y); plot(cx - x, cy + y); plot(cx + x, cy - y); plot(cx - x, cy - y);
        plot(cx + y, cy + x); plot(cx - y, cy + x); plot(cx + y, cy - x); plot(cx - y, cy - x);
      }
      y++;
      if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
    }
  }

  ring(cx: number, cy: number, r: number, k: Key | null): void { this.circle(cx, cy, r, k, false); }

  blit(src: Part | Grid, x: number, y: number, opts: BlitOpts = {}): void {
    const sw = src.w, sh = src.h, sd = src.data;
    let maskSet: Set<number> | null = null;
    if (opts.mask) maskSet = new Set(opts.mask.map((k) => KEY_INDEX[k]));
    let recolor: Uint8Array | null = null;
    if (opts.recolor) {
      recolor = new Uint8Array(KEYS.length + 1);
      for (let i = 0; i <= KEYS.length; i++) recolor[i] = i;
      for (const [from, to] of Object.entries(opts.recolor)) if (to) recolor[KEY_INDEX[from]] = KEY_INDEX[to];
    }
    for (let sy = 0; sy < sh; sy++) {
      const ty = y + (opts.flipY ? sh - 1 - sy : sy);
      if (ty < 0 || ty >= this.h) continue;
      for (let sx = 0; sx < sw; sx++) {
        let v = sd[sy * sw + sx];
        if (!v) continue;
        if (maskSet && !maskSet.has(v)) continue;
        if (recolor) v = recolor[v];
        const tx = x + (opts.flipX ? sw - 1 - sx : sx);
        if (tx < 0 || tx >= this.w) continue;
        this.data[ty * this.w + tx] = v;
      }
    }
  }

  /** Draw text with a glyph font; returns the advance width. Unknown chars draw a 1-px dot. */
  text(font: Font, str: string, x: number, y: number, k: Key, spacing = 1): number {
    let cx = x;
    for (const ch of str) {
      if (ch === ' ') { cx += font.w + spacing; continue; }
      const g = font.glyphs[ch];
      if (g) this.blit(g, cx, y, { recolor: { k } });
      else this.set(cx + (font.w >> 1), y + font.h - 1, k);
      cx += font.w + spacing;
    }
    return cx - x - spacing;
  }

  /** Ordered dither fill of a rectangle at density `level`, pattern locked to grid coordinates (+phase). */
  dither(x: number, y: number, w: number, h: number, k: Key | null, level: DitherLevel, phase = 0): void {
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (ditherAt(xx, yy, level, phase)) this.set(xx, yy, k);
  }

  /** 4-step ordered dissolve between two same-size grids into this grid (step 0 = from, 4 = to). */
  dissolve(from: Grid, to: Grid, step: DitherLevel, phase = 0): void {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = y * this.w + x;
      this.data[i] = ditherAt(x, y, step, phase) ? to.data[i] : from.data[i];
    }
  }

  /** Dither-fade this grid's content in (level 4 = fully present). Pixels not selected become transparent. */
  fade(level: DitherLevel, phase = 0): void {
    if (level >= 4) return;
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (!ditherAt(x, y, level, phase)) this.data[y * this.w + x] = 0;
  }

  /** RGBA bytes (alpha 0 or 255 only). Works in Node and the browser. */
  toRGBA(): Uint8ClampedArray<ArrayBuffer> {
    const out = new Uint8ClampedArray(new ArrayBuffer(this.w * this.h * 4));
    const d = this.data;
    for (let i = 0; i < d.length; i++) {
      const v = d[i];
      if (!v) continue;
      out.set(RGBA_BY_INDEX.subarray(v * 4, v * 4 + 4), i * 4);
    }
    return out;
  }

  toImageData(): ImageData { return new ImageData(this.toRGBA(), this.w, this.h); }

  clone(): Grid { const g = new Grid(this.w, this.h); g.data.set(this.data); return g; }

  equals(other: Grid): boolean {
    if (other.w !== this.w || other.h !== this.h) return false;
    const a = this.data, b = other.data;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  }

  colours(): Set<Key> {
    const s = new Set<Key>();
    for (const v of this.data) if (v) s.add(KEYS[v - 1]);
    return s;
  }

  /** Part view of this grid (shares no data). */
  toPart(name = 'grid'): Part { return { w: this.w, h: this.h, data: this.data.slice(), name }; }
}

/** Bresenham points with L-corner ("doubles") removal. Exported for raster helpers and tests. */
export function linePoints(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) {
    pts.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
  if (dx === 0 || dy === 0 || pts.length < 3) return pts;
  // remove pixel i when its neighbours i-1 and i+1 are diagonal to each other (an L corner)
  const keep: boolean[] = pts.map(() => true);
  for (let i = 1; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i - 1], [bx, by] = pts[i + 1];
    if (Math.abs(ax - bx) === 1 && Math.abs(ay - by) === 1 && keep[i - 1]) keep[i] = false;
  }
  return pts.filter((_, i) => keep[i]);
}

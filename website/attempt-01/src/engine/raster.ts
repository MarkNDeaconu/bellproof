// Geometry helpers that end in integers. engine-spec §3.6.

import type { Key } from './palette';
import { Grid } from './grid';
import type { Part } from './ascii';

/** Unit-sphere point (theta from +z, phi around z, degrees) → screen [x, y, depth] in [-1, 1].
 *  tilt: camera pitch (degrees, positive looks down on the north pole); az: camera yaw. */
export function project(thetaDeg: number, phiDeg: number, tiltDeg = 24, azDeg = 0): [number, number, number] {
  const th = (thetaDeg * Math.PI) / 180, ph = ((phiDeg + azDeg) * Math.PI) / 180, ti = (tiltDeg * Math.PI) / 180;
  const x = Math.sin(th) * Math.cos(ph), y = Math.sin(th) * Math.sin(ph), z = Math.cos(th);
  // rotate about the screen x axis by tilt: screen up is +z, depth toward the viewer is +y
  const sy = z * Math.cos(ti) - y * Math.sin(ti);
  const depth = z * Math.sin(ti) + y * Math.cos(ti);
  return [x, -sy, depth];
}

/** Point on a circle at integer coordinates. */
export function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = (deg * Math.PI) / 180;
  return [Math.round(cx + r * Math.cos(a)), Math.round(cy + r * Math.sin(a))];
}

/** Eased integer spacing: n steps summing to `total` px, shaped in/out/inOut. e.g. spacing(6, 'inOut', 12) → [1,2,3,3,2,1]. */
export function spacing(n: number, kind: 'in' | 'out' | 'inOut' = 'inOut', total?: number): number[] {
  const weights: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    weights.push(kind === 'inOut' ? Math.sin(Math.PI * t) : kind === 'out' ? 1 - t : t);
  }
  const sum = weights.reduce((a, b) => a + b, 0);
  const target = total ?? Math.round(sum * 2);
  const raw = weights.map((w) => (w / sum) * target);
  const out = raw.map(Math.floor);
  let rem = target - out.reduce((a, b) => a + b, 0);
  const order = raw.map((v, i) => [v - Math.floor(v), i] as const).sort((a, b) => b[0] - a[0]);
  for (let i = 0; rem > 0; i = (i + 1) % n, rem--) out[order[i][1]]++;
  return out;
}

/** A glass orb template of diameter d: fill g, rim c (lit upper-left) / b / i (shaded lower-right), specular w. */
export function sphereTemplate(d: number, rim: [Key, Key, Key] = ['c', 'b', 'i'], fill: Key = 'g'): Part {
  const g = new Grid(d, d);
  const r = (d - 1) / 2, c = r;
  for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
    const dx = x - c, dy = y - c, dist = Math.hypot(dx, dy);
    if (dist > r + 0.5) continue;
    if (dist > r - 0.5) {
      const ang = Math.atan2(dy, dx); // -π..π, 0 = right, -π/2 = up
      const lit = ang > -Math.PI && ang < -Math.PI / 6 && ang > (-5 * Math.PI) / 6 ? 0 : ang > Math.PI / 6 && ang < (5 * Math.PI) / 6 ? 2 : 1;
      g.set(x, y, rim[lit]);
    } else g.set(x, y, fill);
  }
  const sx = Math.round(c - r * 0.45), sy = Math.round(c - r * 0.45);
  g.set(sx, sy, 'w'); if (d >= 11) g.set(sx + 1, sy, 'w');
  return g.toPart(`sphere${d}`);
}

/** A 3-face isometric block: top g, left c, right b, edges i. Width `size` (even), height ≈ size. */
export function isoBlock(size: number, top: Key = 'g', left: Key = 'c', right: Key = 'b', edge: Key = 'i'): Part {
  const w = size, h = size, half = size >> 1, q = size >> 2;
  const g = new Grid(w, h);
  // top rhombus rows 0..q*2, side faces below
  for (let y = 0; y <= 2 * q; y++) {
    const span = y <= q ? (y * half) / q : ((2 * q - y) * half) / q;
    const s = Math.round(span);
    for (let x = half - s; x < half + s; x++) g.set(x, y, top);
  }
  for (let y = q; y < h; y++) for (let x = 0; x < w; x++) {
    const onTop = g.get(x, y);
    if (onTop) continue;
    const topY = x < half ? q - Math.round((x * q) / half) + q : Math.round(((x - half) * q) / half) + q;
    if (y >= topY && y < topY + (h - 2 * q)) g.set(x, y, x < half ? left : right);
  }
  for (let y = 0; y < h; y++) { // edges: centre seam and outline
    if (g.get(half, y) && y >= 2 * q) g.set(half, y, edge);
    if (g.get(half - 1, y) && y >= 2 * q) g.set(half - 1, y, edge);
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!g.get(x, y)) continue;
    const bare = !g.get(x - 1, y) || !g.get(x + 1, y) || !g.get(x, y + 1);
    if (bare && y > 0) g.set(x, y, edge);
  }
  return g.toPart(`iso${size}`);
}

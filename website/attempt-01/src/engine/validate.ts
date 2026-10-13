// Piece validator. engine-spec §10. Runs in Node (scripts/validate.ts) and in the harness.

import { Grid } from './grid';
import { KEYS, type Key } from './palette';
import { defaultIO, frameCount, frameTick, periodOf, sizeOf, type Piece } from './piece';

export interface Report { id: string; errors: string[]; warnings: string[]; frameMs?: number; colours: number }

const ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const SPARKLE = new Set<Key>(['w', 'g', 'a']);

export function validatePiece(piece: Piece, opts: { timing?: boolean } = {}): Report {
  const errors: string[] = [], warnings: string[] = [];
  const err = (m: string) => errors.push(m), warn = (m: string) => warnings.push(m);
  const period = periodOf(piece);

  if (!ID_RE.test(piece.id)) err(`id "${piece.id}" is not kebab-case`);
  if (!(piece.size[0] > 0 && piece.size[1] > 0)) err('size must be positive');
  if (piece.loopTicks <= 0 || piece.loopTicks % piece.ticksPerFrame !== 0) err(`loopTicks ${piece.loopTicks} is not a positive multiple of ticksPerFrame ${piece.ticksPerFrame}`);
  if (period % piece.loopTicks !== 0) err(`period ${period} is not a multiple of loopTicks ${piece.loopTicks}`);
  if (!(piece.poster >= 0 && piece.poster < period)) err(`poster ${piece.poster} outside [0, ${period})`);
  if (typeof piece.alt !== 'string') err('alt missing (use "" for decorative)');
  const allowed = new Set<Key>(piece.palette);
  for (const k of piece.palette) if (!KEYS.includes(k)) err(`palette key "${k}" is not in the palette`);
  if (piece.maxColours < 1) err('maxColours must be ≥ 1');

  const variants: Array<string | undefined> = [undefined, ...Object.keys(piece.variants ?? {})];
  const used = new Set<Key>();
  let frameMs = 0, timed = 0;
  for (const variant of variants) {
    let w: number, h: number;
    try { [w, h] = sizeOf(piece, variant); } catch (e) { err(String(e)); continue; }
    const g = new Grid(w, h);
    const io = defaultIO(piece);
    const n = frameCount(piece);
    let first: Grid | null = null;
    for (let f = 0; f < n; f++) {
      const tick = frameTick(piece, f);
      g.clear();
      const t0 = performance.now();
      try { piece.frame(tick, g, io, variant); } catch (e) { err(`frame(${tick}${variant ? ', ' + variant : ''}) threw: ${(e as Error).message}`); break; }
      if (opts.timing !== false) { frameMs += performance.now() - t0; timed++; }
      for (const k of g.colours()) { used.add(k); if (!allowed.has(k)) err(`frame ${tick}${variant ? ' [' + variant + ']' : ''} uses key "${k}" not in piece.palette`); }
      if (f === 0) first = g.clone();
    }
    // exact loop: frame(period) == frame(0)
    if (first) {
      g.clear();
      try {
        piece.frame(period, g, io, variant);
        if (!g.equals(first)) {
          const msg = `frame(${period}) ≠ frame(0)${variant ? ' [' + variant + ']' : ''}: the loop is not exact`;
          if (piece.cache === 'none' && piece.inputs) warn(msg); else err(msg);
        }
      } catch (e) { err(`frame(${period}) threw: ${(e as Error).message}`); }
      // poster checks
      g.clear(); piece.frame(piece.poster, g, io, variant);
      if (g.colours().size === 0) err(`poster frame ${piece.poster} is empty`);
      orphanScan(g, piece, variant, warn);
      doublesScan(g, variant, warn);
    }
    if (piece.state) {
      const s = piece.state(piece.poster, io);
      if (piece.states && !piece.states.includes(s)) warn(`state(poster) returned "${s}" which is not in piece.states`);
    }
  }
  if (used.size > piece.maxColours) err(`uses ${used.size} colours, maxColours is ${piece.maxColours}`);
  const avg = timed ? frameMs / timed : 0;
  if (piece.cache === 'none' && timed) { if (avg > 1) err(`frame() averages ${avg.toFixed(2)} ms (> 1 ms) with cache 'none'`); else if (avg > 0.3) warn(`frame() averages ${avg.toFixed(2)} ms (> 0.3 ms) with cache 'none'`); }
  return { id: piece.id, errors, warnings, frameMs: avg, colours: used.size };
}

function orphanScan(g: Grid, piece: Piece, variant: string | undefined, warn: (m: string) => void): void {
  let orphans = 0;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const k = g.get(x, y);
    if (!k || SPARKLE.has(k)) continue;
    const n = [g.get(x - 1, y), g.get(x + 1, y), g.get(x, y - 1), g.get(x, y + 1)];
    if (n.every((v) => v !== k)) orphans++;
  }
  if (orphans > Math.max(2, (g.w * g.h) / 200)) warn(`poster has ${orphans} orphan pixels${variant ? ' [' + variant + ']' : ''} (deliberate sparkles excluded)`);
  void piece;
}

/** Warn on L-shaped doubles in 1-px lines: a pixel whose colour continues both horizontally and vertically from it with no fill around. */
function doublesScan(g: Grid, variant: string | undefined, warn: (m: string) => void): void {
  let doubles = 0;
  for (let y = 0; y < g.h; y++) for (let x = 0; x < g.w; x++) {
    const k = g.get(x, y);
    if (!k) continue;
    const r = g.get(x + 1, y) === k, d = g.get(x, y + 1) === k, l = g.get(x - 1, y) === k, u = g.get(x, y - 1) === k;
    const diag = g.get(x + 1, y + 1) === k || g.get(x - 1, y + 1) === k || g.get(x + 1, y - 1) === k || g.get(x - 1, y - 1) === k;
    const count = [r, d, l, u].filter(Boolean).length;
    // exactly two orthogonal same-colour neighbours forming a corner, with no same-colour diagonal (thin line corner)…
    if (!(count === 2 && ((r && d) || (d && l) || (l && u) || (u && r)) && !diag)) continue;
    // …and both arms only 1 px long (a stair-step jaggy). Box and glyph corners have longer arms and are legitimate
    // (integrator, queue #6: the font "0" used to trip this).
    const armR = r && g.get(x + 2, y) === k, armL = l && g.get(x - 2, y) === k, armD = d && g.get(x, y + 2) === k, armU = u && g.get(x, y - 2) === k;
    if (!(armR || armL || armD || armU)) doubles++;
  }
  if (doubles > 4) warn(`poster has ${doubles} L-corner "doubles" in thin lines${variant ? ' [' + variant + ']' : ''}; use g.line() or straighten them`);
}

/** Compare CSS tokens against the palette. Returns error strings. */
export function checkTokens(css: string, expected: Record<string, string>): string[] {
  const errors: string[] = [];
  for (const [name, hex] of Object.entries(expected)) {
    const m = css.match(new RegExp(`${name.replace(/[-]/g, '\\-')}\\s*:\\s*(#[0-9a-fA-F]{6})`));
    if (!m) errors.push(`${name} missing from tokens.css`);
    else if (m[1].toUpperCase() !== hex.toUpperCase()) errors.push(`${name} is ${m[1]} in tokens.css but ${hex} in the palette`);
  }
  return errors;
}

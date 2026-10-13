// The piece contract every art agent implements. engine-spec §4.

import type { Key } from './palette';
import type { Grid } from './grid';

export interface PieceIO {
  hover: boolean;
  focus: boolean;
  click: number;
  progress: number;
  mode: string;
  [named: string]: unknown;
}

export interface InputDecl { type: 'boolean' | 'number' | 'string'; default: unknown }

export interface Piece {
  id: string;
  size: [w: number, h: number];
  variants?: Record<string, [w: number, h: number]>;
  ticksPerFrame: 1 | 2 | 3;
  loopTicks: number;
  period?: number;
  poster: number;
  maxColours: number;
  palette: readonly Key[];
  alt: string;
  cache: 'loop' | 'none';
  inputs?: Record<string, InputDecl>;
  modes?: readonly string[];
  states?: readonly string[];
  frame(tick: number, g: Grid, io: PieceIO, variant?: string): void;
  state?(tick: number, io: PieceIO): string;
  events?(tick: number, io: PieceIO): string[];
  exports?: Record<string, unknown>;
}

const ID_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

export function isPiece(x: unknown): x is Piece {
  return !!x && typeof x === 'object' && typeof (x as Piece).id === 'string' && Array.isArray((x as Piece).size) && typeof (x as Piece).frame === 'function';
}

/** Shape-checks a piece at definition time (cheap; the validator does the deep checks). */
export function definePiece(p: Piece): Piece {
  if (!ID_RE.test(p.id)) throw new Error(`piece id "${p.id}" must be kebab-case`);
  if (!(p.size[0] > 0 && p.size[1] > 0)) throw new Error(`${p.id}: size must be positive`);
  if (![1, 2, 3].includes(p.ticksPerFrame)) throw new Error(`${p.id}: ticksPerFrame must be 1, 2 or 3`);
  if (p.loopTicks <= 0 || p.loopTicks % p.ticksPerFrame !== 0) throw new Error(`${p.id}: loopTicks must be a positive multiple of ticksPerFrame`);
  const period = p.period ?? p.loopTicks;
  if (period % p.loopTicks !== 0) throw new Error(`${p.id}: period must be a multiple of loopTicks`);
  if (p.poster < 0 || p.poster >= period) throw new Error(`${p.id}: poster must be inside [0, period)`);
  if (!['loop', 'none'].includes(p.cache)) throw new Error(`${p.id}: cache must be 'loop' or 'none'`);
  if (typeof p.alt !== 'string') throw new Error(`${p.id}: alt must be a string ('' for decorative)`);
  return p;
}

export function periodOf(p: Piece): number { return p.period ?? p.loopTicks; }

export function sizeOf(p: Piece, variant?: string): [number, number] {
  if (variant && p.variants?.[variant]) return p.variants[variant];
  if (variant) throw new Error(`${p.id}: unknown variant "${variant}"`);
  return p.size;
}

export function defaultIO(p: Piece, overrides: Partial<PieceIO> = {}): PieceIO {
  const io: PieceIO = { hover: false, focus: false, click: 0, progress: 0, mode: p.modes?.[0] ?? '' };
  if (p.inputs) for (const [k, d] of Object.entries(p.inputs)) io[k] = d.default;
  Object.assign(io, overrides);
  return io;
}

/** Frame index for a tick (frames repeat every period). */
export function frameIndex(p: Piece, tick: number): number {
  const period = periodOf(p);
  const t = ((tick % period) + period) % period;
  return Math.floor(t / p.ticksPerFrame);
}

/** The canonical tick for a frame index (the first tick of that frame). */
export function frameTick(p: Piece, frame: number): number { return frame * p.ticksPerFrame; }

export function frameCount(p: Piece): number { return periodOf(p) / p.ticksPerFrame; }

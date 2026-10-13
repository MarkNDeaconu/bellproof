// chain-block · 16×16 · card 9. One on-chain step as a block that clicks into the chain.
// Modes post | stake | commit | reveal | settle pick the glyph on the top face.
// Inputs: lit (boolean), click (count), age (ticks since the last click; stepped by clickChainBlock()).
// Idle is deliberately static: frame() ignores the tick, so nothing moves unless an input changes.
//
// Each glyph has a "before" (unlit: waiting) and an "after" (lit: done) picture; a click plays the
// transition once. post: the job card, then the escrow coin lands on it. stake: two coins and an open
// padlock, then the third coin lands and the shackle snaps shut. commit: an unsealed envelope, then the
// violet seal stamps. reveal: the sealed envelope opens and the key pops out. settle: the vault door
// slides open to the right over three frames and shows the coins inside.

import { definePiece, KEYS, part, type Grid, type Key, type Part, type PieceIO } from '../../engine';
import { blockBody, LIT, UNLIT } from './parts';

export const BLOCK_MODES = ['post', 'stake', 'commit', 'reveal', 'settle'] as const;
export type BlockMode = (typeof BLOCK_MODES)[number];

/** Ticks the click animation lasts (smear, squash + spark, glyph transition, settle). age ≥ CLICK_TICKS = at rest. */
export const CLICK_TICKS = 8;

// ---- glyph parts (k ink line, p paper, b corner, t text, a azure, w glint, s navy, v violet seal) ----

const CARD = part(`
  kkkkkk
  kbbppk
  kbpppk
  kpttpk
  kppppk
  kpttpk
  kkkkkk
`, 'card');

const COIN5 = part(`
  .kkk.
  kwaak
  kaaak
  kaack
  .kkk.
`, 'coin5');

const STACK_CAP = part('.kkkk.', 'cap');
const STACK_COIN = part(`
  kwaaak
  kbbbbk
`, 'stack-coin');

const LOCK_BODY = part(`
  ssss
  s.ss
  ssss
`, 'lock');

const ENVELOPE = part(`
  kkkkkkkkk
  kkpppppkk
  kpkpppkpk
  kppkpkppk
  kpppkpppk
  kpppppppk
  kkkkkkkkk
`, 'envelope');

const SEAL = part(`
  .v.
  vvv
  .v.
`, 'seal');

const KEY = part(`
  .kkk.....
  kaaak....
  ka.akkkkk
  kaaak.k.k
  .kkk..k..
`, 'key');

// ---- drawing helpers: every glyph pixel is clipped to the top face ----

interface Face { x0: number; y0: number; x1: number; y1: number }   // inclusive face rect

function clipBlit(g: Grid, p: Part, x: number, y: number, face: Face, recolor?: Partial<Record<Key, Key>>): void {
  for (let yy = 0; yy < p.h; yy++) for (let xx = 0; xx < p.w; xx++) {
    const v = p.data[yy * p.w + xx];
    if (!v) continue;
    const k = KEYS[v - 1];
    px(g, x + xx, y + yy, recolor?.[k] ?? k, face);
  }
}

function px(g: Grid, x: number, y: number, k: Key, face: Face): void {
  if (x < face.x0 || x > face.x1 || y < face.y0 || y > face.y1) return;
  g.set(x, y, k);
}

/** Round 5×5 vault door / hole mask, rows relative to the top. */
const ROUND: Array<[number, number]> = [[1, 3], [0, 4], [0, 4], [0, 4], [1, 3]];

function glyph(g: Grid, mode: BlockMode, f: number, gx: number, gy: number, face: Face): void {
  // f: 0 = before, 1..4 = transition, 5 = after
  switch (mode) {
    case 'post': {
      clipBlit(g, CARD, gx, gy, face);
      if (f >= 1) { const dy = f === 1 ? -4 : f === 2 ? -1 : 0; clipBlit(g, COIN5, gx + 4, gy + 2 + dy, face); }
      if (f === 3) px(g, gx + 9, gy + 4, 'a', face);                     // landing glint beside the coin
      break;
    }
    case 'stake': {
      // coins: bottom (x0,row5), middle (x1,row3), top (x0,row1); cap above the highest coin present
      const top = f >= 2 ? 1 : f === 1 ? -1 : null;                       // third coin: drops in at f1, lands f2
      clipBlit(g, STACK_COIN, gx, gy + 5, face);
      clipBlit(g, STACK_COIN, gx + 1, gy + 3, face);
      if (top === null) clipBlit(g, STACK_CAP, gx + 1, gy + 2, face);
      else { clipBlit(g, STACK_COIN, gx, gy + top, face); clipBlit(g, STACK_CAP, gx, gy + top - 1, face); }
      // padlock, x 5..8: shackle closes at f3
      const shut = f >= 3;
      const sy = shut ? 0 : -1;
      px(g, gx + 6, gy + 1 + sy, 'k', face); px(g, gx + 7, gy + 1 + sy, 'k', face);
      px(g, gx + 5, gy + 2 + sy, 'k', face); px(g, gx + 8, gy + 2 + sy, 'k', face);
      if (!shut) px(g, gx + 5, gy + 2, 'k', face);                         // left leg still in the body
      clipBlit(g, LOCK_BODY, gx + 5, gy + 3, face);
      if (f === 3) px(g, gx + 8, gy + 2, 'w', face);                       // snap glint
      break;
    }
    case 'commit': {
      clipBlit(g, ENVELOPE, gx, gy, face);
      if (f === 3) clipBlit(g, SEAL, gx + 3, gy + 3, face, { v: 'w' });  // stamp impact: one white tick
      else if (f >= 4) clipBlit(g, SEAL, gx + 3, gy + 3, face);
      break;
    }
    case 'reveal': {
      if (f <= 1) {
        clipBlit(g, ENVELOPE, gx, gy, face);
        clipBlit(g, SEAL, gx + 3, gy + 3, face, f === 1 ? { v: 'w' } : undefined);   // the seal breaks
      } else if (f === 2) {
        // the key pops up out of the opened envelope
        const env = ENVELOPE;
        for (let yy = 3; yy < env.h; yy++) for (let xx = 0; xx < env.w; xx++) {
          const v = env.data[yy * env.w + xx]; if (v) px(g, gx + xx, gy + yy, KEYS[v - 1], face);
        }
        clipBlit(g, KEY, gx, gy - 1, face);
      } else {
        clipBlit(g, KEY, gx, gy + 1, face);
        if (f >= 4) { px(g, gx + 1, gy, 'a', face); px(g, gx + 7, gy + 1, 'a', face); px(g, gx + 8, gy + 6, 'a', face); }
        else { px(g, gx + 2, gy, 'w', face); px(g, gx + 8, gy + 1, 'w', face); }
      }
      break;
    }
    case 'settle': {
      // frame, hole with coins, round door sliding right 0 → 3 px
      const slide = f <= 1 ? 0 : f === 2 ? 1 : f === 3 ? 2 : 3;
      for (let i = 0; i < 8; i++) { px(g, gx + i, gy, 'k', face); px(g, gx + i, gy + 6, 'k', face); }
      for (let r = 1; r < 6; r++) { px(g, gx, gy + r, 'k', face); px(g, gx + 7, gy + r, 'k', face); }
      ROUND.forEach(([a, b], r) => { for (let c = a; c <= b; c++) px(g, gx + 2 + c, gy + 1 + r, 'k', face); });
      if (slide > 0) {
        px(g, gx + 3, gy + 3, 'w', face);
        px(g, gx + 2, gy + 4, 'a', face); px(g, gx + 3, gy + 4, 'a', face); px(g, gx + 4, gy + 4, 'a', face);
        px(g, gx + 4, gy + 3, 'a', face);
      }
      const dx = gx + 2 + slide;
      ROUND.forEach(([a, b], r) => { for (let c = a; c <= b; c++) px(g, dx + c, gy + 1 + r, 't', face); });
      px(g, dx + 2, gy + 2, 's', face); px(g, dx + 1, gy + 3, 's', face); px(g, dx + 3, gy + 3, 's', face); px(g, dx + 2, gy + 4, 's', face);
      px(g, dx + 2, gy + 3, 'k', face);
      break;
    }
  }
}

const BITS: Record<BlockMode, number> = { post: 0b10110, stake: 0b01101, commit: 0b11010, reveal: 0b10011, settle: 0b01011 };

function drawLink(g: Grid, y: number, spark: number): void {
  // a 2-px half link hooked into the block's left edge (silver, steel underside)
  g.set(0, y, 'l'); g.set(1, y, 'l');
  g.set(0, y + 1, 'l');
  g.set(0, y + 2, 't'); g.set(1, y + 2, 't');
  if (spark === 1) { g.set(1, y + 1, 'w'); g.set(0, y - 1, 'a'); g.set(0, y + 3, 'a'); }
  else if (spark === 2) { g.set(1, y - 2, 'a'); g.set(1, y + 4, 'a'); g.set(1, y + 1, 'a'); }
  else if (spark === 3) { g.set(0, y - 3, 'a'); g.set(0, y + 5, 'a'); }
}

export const chainBlock = definePiece({
  id: 'chain-block',
  size: [16, 16],
  ticksPerFrame: 1,
  loopTicks: 1,
  poster: 0,
  maxColours: 14,
  palette: ['k', 's', 't', 'l', 'p', 'w', 'v', 'i', 'b', 'c', 'a', 'u', 'g'],
  alt: 'A chain block for one on-chain step of the job.',
  cache: 'none',
  modes: BLOCK_MODES,
  inputs: { lit: { type: 'boolean', default: true }, age: { type: 'number', default: CLICK_TICKS } },
  states: ['unlit', 'clicking', 'lit'],
  frame(_tick: number, g: Grid, io: PieceIO) {
    const mode = (BLOCK_MODES as readonly string[]).includes(io.mode) ? (io.mode as BlockMode) : 'post';
    const lit = io.lit !== false;
    const age = Math.max(0, Math.floor(Number(io.age ?? CLICK_TICKS)));
    const clicking = lit && age < CLICK_TICKS;
    const ink = lit ? LIT : UNLIT;
    // unlit blocks hover 2 px above the chain; a click drops them in
    let y = lit ? 2 : 0, h = 14, detail = true;
    if (clicking && age === 0) { y = 0; h = 16; detail = false; }      // smear: old top to new bottom, no detail
    else if (clicking && age === 1) { y = 3; h = 13; }                // impact squash
    const spark = clicking && age >= 1 && age <= 3 ? age : 0;
    drawLink(g, 9, spark);
    const faceTop = blockBody(g, 2, y, ink, h, 14, h - 5, detail ? BITS[mode] : undefined);
    if (!detail) return;
    const face: Face = { x0: 3, y0: faceTop, x1: 13, y1: faceTop + h - 6 };
    // glyph step: before while unlit; during a click f = age-1 (0..5); after at rest
    const f = !lit ? 0 : clicking ? Math.min(5, Math.max(0, age - 1)) : 5;
    glyph(g, mode, f, 4, faceTop + 1, face);
  },
  state(_tick: number, io: PieceIO) {
    if (io.lit === false) return 'unlit';
    return Number(io.age ?? CLICK_TICKS) < CLICK_TICKS ? 'clicking' : 'lit';
  },
});

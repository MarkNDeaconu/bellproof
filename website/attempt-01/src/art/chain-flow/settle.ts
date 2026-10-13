// settle · 48×24 · card 9. The settle moment under the last on-chain block.
// Client (blue collar) left, escrow tray centre, provider (violet collar) right.
// mode honest: the escrow pays the provider, a certificate block is minted and drops into the tray.
// mode cheat: the coins crack in raspberry and go back to the client; the provider is slashed and sinks.
// mode auto (default): honest on even loops, cheat on odd loops (period 144).

import { definePiece, ditherAt, Grid, part, type DitherLevel, type Key, type Part, type PieceIO } from '../../engine';
import { blockBody, COIN, COIN_CRACK, COIN_HALF_L as HALF_L, COIN_HALF_R as HALF_R, type BlockInk } from './parts';

const LOOP = 72;

// facing right; lit from the upper left (slate), shadow side in ink; collar `c` is recoloured per figure
const FIGURE = part(`
  ..mmss..
  .mssssk.
  .mssspk.
  .sssssk.
  ..sssk..
  ..cccc..
  .mssssk.
  .mssssk.
  .mssssk.
  ..ssss..
  ..sk.sk.
  ..kk.kk.
`, 'figure');

const CERT_INK: BlockInk = { top: 'p', front: 'c', right: 'b', edge: 'i', hi: 'w', bit: 'b' };

// tray: x 17..30, rows 18..21
const TRAY_X = 17, TRAY_Y = 18;
const SLOTS = [18, 22, 26];
const COIN_Y = 15;
const CLIENT_X = -1, PROVIDER_X = 41, FIG_Y = 10;

type Mode = 'honest' | 'cheat';

function modeAt(tick: number, io: PieceIO): Mode {
  if (io.mode === 'honest' || io.mode === 'cheat') return io.mode;
  const loop = Math.floor((((tick % 144) + 144) % 144) / LOOP);
  return loop === 0 ? 'honest' : 'cheat';
}

/** Integer point on a hop from (x0,y0) to (x1,y1) at step i of n, arc height hgt. */
function hop(x0: number, y0: number, x1: number, y1: number, i: number, n: number, hgt: number): [number, number] {
  const u = Math.min(1, Math.max(0, i / n));
  return [Math.round(x0 + (x1 - x0) * u), Math.round(y0 + (y1 - y0) * u - hgt * 4 * u * (1 - u))];
}

function figure(g: Grid, x: number, y: number, collar: Key, flip: boolean, blink: boolean): void {
  const recolor: Partial<Record<Key, Key>> = { c: collar };
  if (blink) recolor.p = 'k';
  g.blit(FIGURE, x, y, { flipX: flip, recolor });
}

/** The escrow box (x 17..30): navy walls with lit caps, a low front lip, and a padlock hanging on the front
 *  that is shut while the box holds the escrow. In-tray coins are drawn before it, so the lip hides their base. */
function tray(g: Grid, locked: boolean): void {
  const x = TRAY_X, y = TRAY_Y;
  for (const wx of [x, x + 13]) { g.set(wx, y - 2, 't'); for (let r = -1; r <= 3; r++) g.set(wx, y + r, 's'); }
  for (let i = 1; i < 13; i++) { g.set(x + i, y + 1, 't'); g.set(x + i, y + 2, 's'); g.set(x + i, y + 3, 's'); }
  g.set(x + 13, y + 3, 'k'); for (let i = 1; i < 14; i++) g.set(x + i, y + 4 - 1, i === 13 ? 'k' : 's');
  // padlock: body 3×2 in silver on the front, shackle above the lip
  const lx = x + 6;
  g.set(lx, y + 2, 'l'); g.set(lx + 1, y + 2, 'l'); g.set(lx + 2, y + 2, 'l');
  g.set(lx, y + 3, 'l'); g.set(lx + 1, y + 3, 'm'); g.set(lx + 2, y + 3, 'l');
  if (locked) { g.set(lx, y + 1, 'm'); g.set(lx + 1, y, 'm'); g.set(lx + 2, y + 1, 'm'); }
  else { g.set(lx, y + 1, 'm'); g.set(lx, y, 'm'); g.set(lx + 1, y - 1, 'm'); }
}

function certBlock(g: Grid, y: number, h: number, detail: boolean): void {
  const top = blockBody(g, 18, y, CERT_INK, h, 12, h - 5);
  if (!detail) return;
  for (let i = 0; i < 5; i++) { g.set(20 + i, top + 1, 't'); g.set(20 + i, top + 3, 't'); }
  g.set(20, top + 5, 't'); g.set(21, top + 5, 't');
  g.set(25, top + 4, 'v'); g.set(26, top + 4, 'v'); g.set(25, top + 5, 'v'); g.set(26, top + 5, 'i');
}

interface Look { providerDy: number; collar: Key; locked: boolean }

/** Deposit hops, 0..7: two coins from the client, the provider's stake from the right. */
const DEPOSITS = [
  { from: [5, 12], to: SLOTS[0], t0: 0 },
  { from: [5, 12], to: SLOTS[1], t0: 2 },
  { from: [38, 12], to: SLOTS[2], t0: 4 },
];
const DEP_TICKS = 4;

/** The outcome layer for loop tick t (everything that fades out at the reset). */
function drawScene(t: number, mode: Mode, g: Grid): Look {
  const look: Look = { providerDy: 0, collar: 'v', locked: t >= 8 && t < 12 };
  const inTray: Array<[Part, number, number]> = [];
  const flying: Array<[Part, number, number]> = [];
  const coins = DEPOSITS.map((d) => {
    if (t < d.t0) return null;
    if (t < d.t0 + DEP_TICKS) return { fly: true, xy: hop(d.from[0], d.from[1], d.to, COIN_Y, t - d.t0 + 1, DEP_TICKS, 5) };
    return { fly: false, xy: [d.to, COIN_Y] as [number, number] };
  });

  if (mode === 'honest') {
    // 12..29: the coins hop to the provider's pile, stake first, then the escrow
    const pay = [
      { i: 2, to: [35, 17], t0: 12 },
      { i: 1, to: [31, 17], t0: 18 },
      { i: 0, to: [33, 13], t0: 24 },
    ];
    for (const p of pay) {
      if (t < p.t0) continue;
      const k = Math.min(6, t - p.t0 + 1);
      coins[p.i] = { fly: true, xy: hop(SLOTS[p.i], COIN_Y, p.to[0], p.to[1], k, 6, 6) };
    }
    if (t === 31 || t === 32) look.providerDy = -1;                 // a little hop when the last coin lands
    for (const c of coins) if (c) (c.fly ? flying : inTray).push([COIN, c.xy[0], c.xy[1]]);
    // 36..44: the certificate block is minted and drops into the tray
    if (t >= 36) {
      if (t === 40 || t === 41) {
        const ring = new Grid(48, 24);
        ring.circle(24, 13, t === 40 ? 9 : 11, 'a');
        for (let yy = 0; yy <= 17; yy++) for (let xx = 0; xx < 48; xx++) if (ring.get(xx, yy)) g.set(xx, yy, 'a');
      }
      if (t === 36) certBlock(g, -9, 12, true);
      else if (t === 37) certBlock(g, -3, 12, true);
      else if (t === 38) certBlock(g, 2, 18, false);              // smear
      else if (t === 39) certBlock(g, 9, 11, true);               // squash on impact
      else certBlock(g, 8, 12, true);
    }
  } else {
    // 12 crack · 13 split · 14..31 the halves hop back to the client, landing as cracked coins · 31.. slashed
    const back = [
      { i: 0, to: [7, 17], t0: 14 },
      { i: 1, to: [12, 17], t0: 20 },
      { i: 2, to: [10, 13], t0: 26 },
    ];
    for (const c of coins) if (c && c.fly) flying.push([COIN, c.xy[0], c.xy[1]]);
    for (const b of back) {
      const sx = SLOTS[b.i];
      if (t < 12) { const c = coins[b.i]; if (c && !c.fly) inTray.push([COIN, sx, COIN_Y]); continue; }
      if (t === 12) { inTray.push([COIN_CRACK, sx, COIN_Y]); continue; }
      if (t < b.t0) { inTray.push([HALF_L, sx - 1, COIN_Y], [HALF_R, sx + 3, COIN_Y]); continue; }
      const k = t - b.t0 + 1;
      if (k >= 6) { flying.push([COIN_CRACK, b.to[0], b.to[1]]); continue; }
      flying.push([HALF_L, ...hop(sx - 1, COIN_Y, b.to[0], b.to[1], k, 6, 6)], [HALF_R, ...hop(sx + 3, COIN_Y, b.to[0] + 2, b.to[1], k, 6, 7)]);
    }
    if (t >= 31) { look.collar = 'R'; look.providerDy = t >= 33 ? 2 : 1; }
  }

  for (const [p, x, y] of inTray) g.blit(p, x, y);
  tray(g, look.locked);
  for (const [p, x, y] of flying) g.blit(p, x, y);
  return look;
}

function blinkAt(t: number, ticks: number[]): boolean { return ticks.includes(t); }

export const settle = definePiece({
  id: 'settle',
  size: [48, 24],
  ticksPerFrame: 1,
  loopTicks: LOOP,
  period: LOOP * 2,
  poster: 50,
  maxColours: 15,
  palette: ['k', 's', 'm', 't', 'l', 'p', 'w', 'v', 'i', 'b', 'c', 'a', 'g', 'R'],
  alt: 'Settle: an honest provider is paid and a certificate is minted; a cheating provider is slashed and the client refunded.',
  cache: 'none',
  modes: ['auto', 'honest', 'cheat'],
  states: ['escrow', 'paying', 'paid', 'slashing', 'slashed', 'reset'],
  frame(tick: number, g: Grid, io: PieceIO) {
    const t = ((tick % LOOP) + LOOP) % LOOP;
    const mode = modeAt(tick, io);
    // the scene layer is drawn into its own grid so it can fade out at the reset (64..67)
    const layer = new Grid(48, 24);
    let look: Look = { providerDy: 0, collar: 'v', locked: false };
    if (t < 64) look = drawScene(t, mode, layer);
    else if (t < 68) {
      look = drawScene(63, mode, layer);
      const level = (67 - t) as DitherLevel;
      for (let y = 0; y < 24; y++) for (let x = 0; x < 48; x++) if (layer.get(x, y) && !ditherAt(x, y, level)) layer.set(x, y, null);
      if (mode === 'cheat') { look.providerDy = t >= 66 ? 0 : 1; look.collar = t >= 66 ? 'v' : 'R'; }
      look.locked = false;
    }
    figure(g, CLIENT_X, FIG_Y, 'b', false, blinkAt(t, [26, 58]));
    figure(g, PROVIDER_X, FIG_Y + look.providerDy, look.collar, true, blinkAt(t, [9, 47]));
    for (let x = PROVIDER_X; x < 48; x++) { g.set(x, 22, null); g.set(x, 23, null); }   // sinking: clipped at the floor
    g.blit(layer, 0, 0);
    if (t >= 64) tray(g, false);                  // the box stays solid through the fade and the empty beat
  },
  state(tick: number, io: PieceIO) {
    const t = ((tick % LOOP) + LOOP) % LOOP;
    const mode = modeAt(tick, io);
    if (t >= 64) return 'reset';
    if (t < 12) return 'escrow';
    if (mode === 'honest') return t < 39 ? 'paying' : 'paid';
    return t < 31 ? 'slashing' : 'slashed';
  },
  events(tick: number, io: PieceIO) {
    const t = ((tick % LOOP) + LOOP) % LOOP;
    const mode = modeAt(tick, io);
    if (mode === 'honest' && t === 39) return ['mint'];
    if (mode === 'cheat' && t === 12) return ['crack'];
    if (mode === 'cheat' && t === 31) return ['slash'];
    return [];
  },
  exports: { loopTicks: LOOP },
});

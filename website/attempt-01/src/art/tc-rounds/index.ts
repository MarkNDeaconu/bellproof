// tc-rounds (art-spec card 6): hidden test rounds among compute rounds.
//
// Top row: the verifier's secret schedule, the deck's `T C C T C C T C T C C T` (violet = test, blue = compute).
// Bottom row: what the provider sees, twelve identical `?` tiles. A scan beam walks the rounds; as it passes,
// each provider tile flips over to show what it really was. Test rounds pass with a check; compute rounds drip
// one blue term down a channel into the ΔE meter. Three clean sweeps, then a cheater: the hidden test at
// round 6 cracks, the meter is voided, the beam freezes in alert, and the panel dithers back to rest.
//
// Timeline: see README.md. Every frame is a pure function of the tick (period 384 = 3 clean + 1 cheater).

import { definePiece, font3x5, font5x7, Grid, linePoints, mask, type Key, type PieceIO } from '../../engine';

// ---------------------------------------------------------------------------------------------------------------
// Geometry (art px). Card 6: two rows of 12 blocks 8×8 at x = 2 + 9i; top rows 4–11, bottom rows 24–31;
// ΔE meter at x 116–122, rows 4–31.

export const SEQUENCE = 'TCCTCCTCTCCT' as const; // deck slide "protocol", verbatim
export const W = 128;
export const H = 40;
export const LOOP = 96;
export const PERIOD = 384; // loops 0–2 clean, loop 3 cheater

const TOP = 4;
const BOT = 24;
const N = SEQUENCE.length;
const bx = (i: number): number => 2 + 9 * i;

const M = { x: 116, y: 4, w: 7, h: 28 } as const; // meter outline box
const M_IN_X = M.x + 1; // interior x 117–121
const M_IN_W = M.w - 2;
const M_FLOOR = M.y + M.h - 2; // row 30, lowest interior row
const M_DIV = 9; // divider between the verdict lamp (rows 5–8) and the fill well (rows 10–30)
const STEP = 3; // px per compute round
const C_COUNT = [...SEQUENCE].filter((k) => k === 'C').length; // 7
const FULL = STEP * C_COUNT; // 21 = rows 10–30 exactly

const CH_Y = 36; // packet channel row
const INLET_X = M.x + 3; // 119, packets climb into the meter here
const BEAM_TOP = 1;
const BEAM_BOT = 34;

// ---------------------------------------------------------------------------------------------------------------
// Timeline constants (ticks within a 96-tick loop)

/** Tick the beam enters block i and its provider tile starts to flip (beam x = 2t + 1). */
export const flipAt = (i: number): number => (3 + 9 * i) >> 1;
const beamX = (t: number): number => 2 * t + 1;
const SWEEP_END = 63; // beam leaves at x 127
const HOLD = 64; // 64–87 accepted hold
const DRAIN = 88; // 88–94 drain, 95 rest
const REVEAL_LEN = 6;

const CHEAT_ROUND = 6; // the test that catches the cheater (a T)
const CRACK = flipAt(CHEAT_ROUND) + 3; // 31: first crack frame (the T has been visible for one tick)
const REJECT_HOLD = 36; // ticks the cracked state is held after the shatter
const RESET = CRACK + 2 + REJECT_HOLD; // 69: 4-tick dither back to rest
const RESET_END = RESET + 4; // 73

type Kind = 'T' | 'C' | 'Q' | 'X';

/** A 5×4 check: the font's 3×5 ✓ reads as a "J" at 1×, so the pass mark gets its own bitmap. */
const CHECK = mask(`
  ....#
  ...#.
  #.#..
  .#...
`, 'k', 'check');
/** Rounded 3×5 C and ? (open corners, like the deck's mono glyphs); T comes from the engine font. */
const GLYPHS: Record<string, ReturnType<typeof mask>> = {
  C: mask(`
    .##
    #..
    #..
    #..
    .##
  `, 'k', 'glyph-C'),
  '?': mask(`
    ##.
    ..#
    .#.
    ...
    .#.
  `, 'k', 'glyph-?'),
};
const CHECK3 = mask(`
  ..#
  #.#
  .#.
`, 'k', 'check3');
const CROSS = mask(`
  #.#
  .#.
  #.#
`, 'k', 'cross');

const STYLE: Record<Kind, { face: Key; shade: Key; ink: Key; glyph: string }> = {
  T: { face: 'v', shade: 'n', ink: 'w', glyph: 'T' }, // test: violet
  C: { face: 'u', shade: 'c', ink: 'b', glyph: 'C' }, // compute: blue
  Q: { face: 'h', shade: 't', ink: 't', glyph: '?' }, // provider view: neutral, identical
  X: { face: 'F', shade: 'R', ink: 'R', glyph: '×' }, // failed test
};

// ---------------------------------------------------------------------------------------------------------------
// Tiles: 7×7 face lit from the upper left, 1-px drop shade on the right and bottom (corners open).

function tile(g: Grid, x: number, y: number, kind: Kind, glyph?: string, ink?: Key, lit?: Key): void {
  const s = STYLE[kind];
  // rounded silhouette: all four outer corners stay open (never cleared, so the beam shows through), like the deck's blocks
  g.rect(x + 1, y, 6, 1, s.face);
  g.rect(x, y + 1, 7, 6, s.face);
  g.rect(x + 7, y + 1, 1, 6, s.shade);
  g.rect(x + 1, y + 7, 6, 1, s.shade);
  if (lit) { g.rect(x + 1, y, 5, 1, lit); g.rect(x, y + 1, 1, 5, lit); }
  const ch = glyph ?? s.glyph;
  if (ch === '×') g.text(font5x7, '×', x + 1, y, ink ?? s.ink); // 5×5 cross fills the face
  else if (ch === '✓') g.blit(CHECK, x + 1, y + 2, { recolor: { k: ink ?? s.ink } });
  else if (GLYPHS[ch]) g.blit(GLYPHS[ch], x + 2, y + 1, { recolor: { k: ink ?? s.ink } });
  else g.text(font3x5, ch, x + 2, y + 1, ink ?? s.ink);
}

/** Card-turn intermediate frames: width 4 (face 3 + shade) or width 2 (face 1 + shade). */
function edge(g: Grid, x: number, y: number, kind: Kind, width: 4 | 2): void {
  const s = STYLE[kind];
  if (width === 4) {
    g.rect(x + 2, y, 3, 7, s.face);
    g.rect(x + 5, y + 1, 1, 6, s.shade);
    g.rect(x + 3, y + 7, 2, 1, s.shade);
    const glyph = GLYPHS[s.glyph] ?? font3x5.glyphs[s.glyph];
    if (glyph) for (let r = 0; r < 5; r++) if (glyph.data[r * 3 + 1]) g.set(x + 3, y + 1 + r, s.ink);
  } else {
    g.rect(x + 3, y, 1, 7, s.face);
    g.rect(x + 4, y + 1, 1, 6, s.shade);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Packets: a compute term drips from a revealed provider tile, rides the channel and climbs into the meter.

const VMAX = 8;
/** distance travelled k ticks after the drip lets go (speeds 1, 2, 3 … capped at VMAX) */
function dist(k: number): number {
  let s = 0;
  for (let j = 1; j <= k; j++) s += Math.min(j, VMAX);
  return s;
}
function pathLen(i: number): number { return (CH_Y - 32) + (INLET_X - (bx(i) + 3)) + (CH_Y - 32); }
function pathPoint(i: number, s: number): [number, number] {
  const x0 = bx(i) + 3, down = CH_Y - 32, run = INLET_X - x0;
  if (s <= down) return [x0, 32 + s];
  if (s <= down + run) return [x0 + (s - down), CH_Y];
  return [INLET_X, CH_Y - (s - down - run)];
}
/** Tick (within the loop) at which round i's term lands in the meter; Infinity for test rounds. */
export function arrivalTick(i: number): number {
  if (SEQUENCE[i] !== 'C') return Infinity;
  const release = flipAt(i) + 2; // the bead hangs on the tile for this tick
  const L = pathLen(i);
  let k = 1;
  while (dist(k) < L) k++;
  return release + k;
}
const ARRIVALS = Array.from({ length: N }, (_, i) => arrivalTick(i));

const TAIL: Key[] = ['b', 'c', 'a', 'a', 'u', 'u'];

function packet(g: Grid, i: number, t: number): void {
  const release = flipAt(i) + 2;
  if (SEQUENCE[i] !== 'C' || t < release || t > ARRIVALS[i]) return;
  const L = pathLen(i);
  if (t === release) { const [x, y] = pathPoint(i, 0); g.set(x, y, 'b'); return; }
  const k = t - release;
  const s = Math.min(dist(k), L);
  const span = Math.min(k, VMAX, TAIL.length);
  for (let d = span - 1; d >= 0; d--) {
    const sd = s - d;
    if (sd < 0) continue;
    if (t === ARRIVALS[i] && sd >= L) continue; // the head is already inside the meter
    const [x, y] = pathPoint(i, sd);
    g.set(x, y, TAIL[d]);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Meter

interface MeterState { fill: number; splash: boolean; shimmer: number; lamp: 'off' | 'pass' | 'fail' | 'fail-dim'; alert: boolean }

/** The channel hairline the compute terms ride: row 37 under the provider row, rising at x 120 to the meter. */
function rail(g: Grid): void {
  g.rect(bx(0) + 3, CH_Y + 1, INLET_X - bx(0) - 2, 1, 'h');
  g.rect(INLET_X + 1, M.y + M.h + 1, 1, CH_Y - (M.y + M.h), 'h');
}

function meter(g: Grid, m: MeterState): void {
  const line: Key = m.alert ? 'R' : 'l';
  // tube with open corners
  g.rect(M.x + 1, M.y, M.w - 2, 1, line);
  g.rect(M.x + 1, M.y + M.h - 1, M.w - 2, 1, line);
  g.rect(M.x, M.y + 1, 1, M.h - 2, line);
  g.rect(M.x + M.w - 1, M.y + 1, 1, M.h - 2, line);
  g.rect(M_IN_X, M.y + 1, M_IN_W, M.h - 2, 'p');
  g.rect(M_IN_X, M_DIV, M_IN_W, 1, line);
  // fill well (rows 10–30)
  const f = Math.max(0, Math.min(FULL, m.fill));
  if (f > 0) {
    const top = M_FLOOR - f + 1;
    g.rect(M_IN_X, top, M_IN_W, f, 'b');
    g.rect(M_IN_X, top, 1, f, 'c'); // glass highlight on the lit side
    if (m.splash) g.rect(M_IN_X, top, M_IN_W, 1, 'a');
    else if (m.shimmer >= 0) { g.set(M_IN_X + m.shimmer, top, 'u'); if (m.shimmer + 1 < M_IN_W) g.set(M_IN_X + m.shimmer + 1, top, 'u'); }
  }
  // verdict lamp (rows 5–8): lights violet with a check, or alert with a cross
  if (m.lamp === 'pass') { g.rect(M_IN_X, M.y + 1, M_IN_W, 4, 'v'); g.blit(CHECK3, M_IN_X + 1, M.y + 2, { recolor: { k: 'w' } }); }
  if (m.lamp === 'fail') { g.rect(M_IN_X, M.y + 1, M_IN_W, 4, 'R'); g.blit(CROSS, M_IN_X + 1, M.y + 2, { recolor: { k: 'F' } }); }
  if (m.lamp === 'fail-dim') { g.rect(M_IN_X, M.y + 1, M_IN_W, 4, 'F'); g.blit(CROSS, M_IN_X + 1, M.y + 2, { recolor: { k: 'R' } }); }
}

// ---------------------------------------------------------------------------------------------------------------
// Beam

function beam(g: Grid, x: number, k: Key = 'a', ghost: Key | null = 'u'): void {
  if (ghost && x - 1 >= 0) g.rect(x - 1, BEAM_TOP + 1, 1, BEAM_BOT - BEAM_TOP - 1, ghost);
  g.rect(x, BEAM_TOP + 1, 1, BEAM_BOT - BEAM_TOP - 1, k);
  g.rect(x - 1, BEAM_TOP - 1, 3, 1, k); // caret head
  g.set(x, BEAM_TOP, k);
}

// ---------------------------------------------------------------------------------------------------------------
// Provider tile state machine (clean behaviour)

function providerTile(g: Grid, i: number, t: number): void {
  const x = bx(i), c = flipAt(i), k = SEQUENCE[i] as Kind;
  if (t < c || t >= c + 4 + REVEAL_LEN) { tile(g, x, BOT, 'Q'); return; }
  if (t === c) { edge(g, x, BOT, 'Q', 4); return; }
  if (t === c + 1) { edge(g, x, BOT, k, 2); return; }
  if (t < c + 2 + REVEAL_LEN) {
    const check = k === 'T' && t >= c + 3 && t <= c + 5;
    tile(g, x, BOT, k, check ? '✓' : undefined, check ? 'w' : undefined);
    return;
  }
  if (t === c + 2 + REVEAL_LEN) { edge(g, x, BOT, k, 4); return; }
  edge(g, x, BOT, 'Q', 2);
}

const WAVE_STAGGER = 1;
const WAVE_LEN = 4;
const LAMP_ON = HOLD + 6; // 70: after the last schedule check lights; holds 18 ticks

/** The verifier's row. `sweeping`: the beam is live (tiles it passes get a 2-tick rim light). */
function scheduleRow(g: Grid, t: number, sweeping: boolean, wave: boolean): void {
  let rank = 0;
  for (let i = 0; i < N; i++) {
    const k = SEQUENCE[i] as Kind, c = flipAt(i);
    const pinged = sweeping && t >= c && t <= c + 1;
    let glyph: string | undefined, ink: Key | undefined;
    if (wave && k === 'T') {
      const start = HOLD + WAVE_STAGGER * rank;
      if (t >= start && t < start + WAVE_LEN) { glyph = '✓'; ink = 'w'; }
    }
    if (k === 'T') rank++;
    tile(g, bx(i), TOP, k, glyph, ink, pinged ? (k === 'T' ? 'r' : 'w') : undefined);
  }
}

const SHIMMER_PERIOD = 12;

function cleanMeter(t: number): MeterState {
  let fill = 0, splash = false, shimmer = -1;
  if (t < HOLD) {
    let n = 0;
    for (let i = 0; i < N; i++) if (ARRIVALS[i] <= t) n++;
    fill = n * STEP;
    splash = ARRIVALS.includes(t);
  } else if (t < DRAIN) {
    fill = FULL;
    shimmer = Math.floor(((t - HOLD) % SHIMMER_PERIOD) / 2) - 1; // -1 = none, then 0..4
    if (shimmer > M_IN_W - 1) shimmer = -1;
  } else fill = Math.max(0, FULL - STEP * (t - DRAIN + 1));
  const lamp = t >= LAMP_ON && t < DRAIN ? 'pass' : 'off';
  return { fill, splash, shimmer, lamp, alert: false };
}

/** Standby: the beam blinks at the left edge before a sweep (88–95), handing over seamlessly to tick 0. */
function standby(g: Grid, t: number): void {
  if (t >= DRAIN && (t < 90 || t >= 92)) beam(g, beamX(0), 'a', null);
}

function drawClean(g: Grid, t: number): void {
  if (t <= SWEEP_END) beam(g, beamX(t));
  standby(g, t);
  scheduleRow(g, t, t <= SWEEP_END, true);
  for (let i = 0; i < N; i++) providerTile(g, i, t);
  rail(g);
  for (let i = 0; i < N; i++) packet(g, i, t);
  meter(g, cleanMeter(t));
}

// ---------------------------------------------------------------------------------------------------------------
// Cheater loop

const SHARDS: Array<{ x: number; y: number; vx: number; vy: number }> = [
  { x: 0, y: 0, vx: -1, vy: -3 },
  { x: 5, y: 1, vx: 1, vy: -2 },
  { x: 5, y: 5, vx: 2, vy: -1 },
];

function shards(g: Grid, t: number): void {
  const k = t - (CRACK + 1);
  if (k < 0) return;
  const ox = bx(CHEAT_ROUND), oy = BOT;
  for (const s of SHARDS) {
    // integer ballistic path: x += vx per tick, vy grows by 1 per tick
    const x = ox + s.x + s.vx * k;
    const y = oy + s.y + s.vy * k + (k * (k - 1)) / 2;
    g.rect(x, y, 2, 2, 'v');
    g.set(x + 1, y + 1, 'n');
  }
}

const CRACK_LINE = linePoints(5, 0, 1, 6); // top right to bottom left across the 7×7 face
const crackCol = (row: number): number => CRACK_LINE.find(([, y]) => y === row)?.[0] ?? 3;

function crackedTile(g: Grid, t: number): void {
  const x = bx(CHEAT_ROUND);
  if (t === CRACK) {
    // frame 1: a 1-px hairline crack
    tile(g, x, BOT, 'T');
    for (const [cx, cy] of CRACK_LINE) g.set(x + cx, BOT + cy, 'F');
    return;
  }
  if (t === CRACK + 1) {
    // frame 2: the tile splits along the crack, the halves jump 1 px apart over an alert core
    const src = new Grid(8, 8);
    tile(src, 0, 0, 'T');
    g.rect(x + 1, BOT + 1, 6, 6, 'F');
    for (let py = 0; py < 8; py++) for (let px = 0; px < 8; px++) {
      const k = src.get(px, py);
      if (!k) continue;
      const c = crackCol(Math.min(py, 6));
      if (px === c) continue;
      const d = px < c ? -1 : 1;
      g.set(x + px + d, BOT + py + d, k);
    }
    for (const [cx, cy] of CRACK_LINE) g.set(x + cx, BOT + cy, 'R');
    return;
  }
  tile(g, x, BOT, 'X');
}

function drawRejected(g: Grid, t: number): void {
  // frozen beam in alert at the round that failed
  beam(g, beamX(CRACK - 1), 'R', null);
  scheduleRow(g, t, false, false);
  for (let i = 0; i < N; i++) {
    if (i === CHEAT_ROUND) crackedTile(g, t);
    else if (flipAt(i) < CRACK) providerTile(g, i, t);
    else tile(g, bx(i), BOT, 'Q');
  }
  rail(g);
  shards(g, t);
  const before = ARRIVALS.filter((a) => a < CRACK).length * STEP;
  const fill = t === CRACK ? before : Math.max(0, before - 6 * (t - CRACK));
  // alarm lamp: lit 8 ticks, dim 4 (1 Hz, a 5×4 lamp, never white)
  const lamp = t <= CRACK ? 'off' : (t - CRACK - 1) % 12 < 8 ? 'fail' : 'fail-dim';
  meter(g, { fill, splash: false, shimmer: -1, lamp, alert: true });
}

function drawRest(g: Grid, t: number): void {
  standby(g, t);
  scheduleRow(g, t, false, false);
  for (let i = 0; i < N; i++) tile(g, bx(i), BOT, 'Q');
  rail(g);
  meter(g, { fill: 0, splash: false, shimmer: -1, lamp: 'off', alert: false });
}

function drawCheat(g: Grid, t: number): void {
  if (t < CRACK) { drawClean(g, t); return; } // identical to a clean sweep until the hidden test at round 6
  if (t < RESET) { drawRejected(g, t); return; }
  if (t < RESET_END) {
    const a = new Grid(g.w, g.h);
    const b = new Grid(g.w, g.h);
    drawRejected(a, RESET - 1);
    drawRest(b, t);
    g.dissolve(a, b, (t - RESET + 1) as 1 | 2 | 3 | 4);
    return;
  }
  drawRest(g, t);
}

// ---------------------------------------------------------------------------------------------------------------

function local(tick: number): { loop: number; t: number } {
  const T = ((tick % PERIOD) + PERIOD) % PERIOD;
  return { loop: Math.floor(T / LOOP), t: T % LOOP };
}

export const tcRounds = definePiece({
  id: 'tc-rounds',
  size: [W, H],
  ticksPerFrame: 1,
  loopTicks: LOOP,
  period: PERIOD,
  poster: 40,
  maxColours: 14,
  palette: ['v', 'n', 'r', 'w', 'u', 'c', 'b', 'a', 'h', 't', 'l', 'p', 'R', 'F'],
  alt: 'Hidden test rounds mixed among compute rounds; the provider sees only question marks.',
  cache: 'loop',
  states: ['running', 'accepted', 'rejected', 'idle'],
  frame(tick: number, g: Grid, _io: PieceIO) {
    const { loop, t } = local(tick);
    if (loop === 3) drawCheat(g, t);
    else drawClean(g, t);
  },
  state(tick: number): string {
    const { loop, t } = local(tick);
    if (loop === 3) return t < CRACK ? 'running' : t < RESET_END ? 'rejected' : 'idle';
    return t < HOLD ? 'running' : t < DRAIN ? 'accepted' : 'idle';
  },
  events(tick: number): string[] {
    const { loop, t } = local(tick);
    if (loop === 3) return t === CRACK ? ['reject'] : [];
    return t === HOLD ? ['accept'] : [];
  },
  exports: {
    sequence: SEQUENCE,
    rows: { schedule: { y: TOP, h: 8 }, provider: { y: BOT, h: 8 } },
    meter: { ...M },
    cheaterLoop: 3,
  },
});

export default tcRounds;

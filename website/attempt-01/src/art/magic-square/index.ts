// magic-square · the Mermin–Peres game, played (art-spec card 5). 96×64, 72-tick loop, cache 'loop'.
//
// A referee deals a row card to Alice (blue) and a column card to Bob (violet). Alice fills her row with
// bits of EVEN parity (an even number of 1s), Bob fills his column with bits of ODD parity, and they win
// when they write the same bit in the shared cell (indigo). Quantum players always win, so this piece never
// shows a loss. Loop 0 is the deck's cover round: row 2 (index 1), column 3 (index 2), Alice 1 0 1, Bob 0 1 0.
//
// Parity convention (research 03 §6.5): observable outcome +1 ↔ bit 0, −1 ↔ bit 1. Row products are +I
// (even number of 1s, tag "+"), column products are −I (odd number of 1s, tag "−").

import { definePiece, Grid, font3x5, font5x7, part, rng, int, spacing, type Key, type Part, type PieceIO } from '../../engine';

const W = 96, H = 64, LOOP = 72, ROUNDS = 4, PERIOD = LOOP * ROUNDS;   // 4 rounds per cached period

// ── geometry ────────────────────────────────────────────────────────────────
const BX = 28, BY = 12, CELL = 13, PITCH = 14;            // board 41×41 at x 28–68, rows 12–52
const ALICE = { x: 2, y: 38 }, BOB = { x: 82, y: 38 };     // creatures 12×14
const REF = { x: 42, y: 0 };                               // referee 12×11, drawn in front of the board
const CARD_L0 = { x: 34, y: 1 }, CARD_R0 = { x: 55, y: 1 };  // cards in the referee's hands
const CARD_L1 = { x: 4, y: 29 }, CARD_R1 = { x: 85, y: 29 };  // cards above the players' heads
const LINE_Y = 59;                                         // entanglement link base row (wobbles ±1)
const TAG_X = 72;                                          // Alice's parity tag column (right of the board)
const TAG_Y = 56;                                          // Bob's parity tag row (under the board)

// ── timeline (ticks) ────────────────────────────────────────────────────────
const T_DEAL = 0, T_ROW = 6, T_COL = 12, T_ABITS = 18, T_BBITS = 24, T_LEAN = 30, T_FLASH = 32, T_WIN = 33,
  T_HOP = 34, T_FADE = 51, T_IDLE = 55;

// ── the round ───────────────────────────────────────────────────────────────
interface Round { r: number; c: number; alice: number[]; bob: number[] }

export function roundFor(loop: number): Round {
  const i = ((loop % ROUNDS) + ROUNDS) % ROUNDS;
  if (i === 0) return { r: 1, c: 2, alice: [1, 0, 1], bob: [0, 1, 0] };
  const prev = roundFor(i - 1);
  const rand = rng(Math.imul(i, 0x9e3779b1) >>> 0);   // hashed seed: consecutive small seeds correlate
  rand(); rand();
  let r = int(rand, 0, 2), c = int(rand, 0, 2);
  while (r === prev.r || c === prev.c) { r = int(rand, 0, 2); c = int(rand, 0, 2); }   // consecutive rounds change both the row and the column
  const a0 = int(rand, 0, 1), a1 = int(rand, 0, 1);
  const alice = [a0, a1, a0 ^ a1];                          // even parity
  const bob = [0, 0, 0];
  bob[r] = alice[c];                                        // agree on the shared cell
  const [j1, j2] = [0, 1, 2].filter((j) => j !== r);
  bob[j1] = int(rand, 0, 1);
  bob[j2] = 1 ^ bob[r] ^ bob[j1];                           // odd parity
  return { r, c, alice, bob };
}

// ── parts ───────────────────────────────────────────────────────────────────
const ORB_ALICE: Part = part(`
  ...cccc...
  .ccggggbb.
  .cwwggggb.
  cggggggggb
  cggggggggb
  cggggggggi
  bggggggggi
  .bggggggi.
  .biggggii.
  ...iiii...
`, 'orb-alice');

const REFEREE: Part = part(`
  ....mmmm....
  ...msssss...
  ...mswsws...
  ...msssss...
  ....ssss....
  mm..ssss..ss
  .msssssssss.
  ...ssttss...
  ...ssttss...
  ...ssssss...
  ...ss..ss...
`, 'referee');

const BOB_RECOLOR: Partial<Record<Key, Key>> = { c: 'r', b: 'v', i: 'n' };

// ── helpers ─────────────────────────────────────────────────────────────────
/** A 13×13 cell (or a smaller centred square) with its corner pixels removed. */
function cellFill(g: Grid, x: number, y: number, k: Key, size = CELL): void {
  const o = (CELL - size) >> 1;
  g.rect(x + o, y + o, size, size, k);
  g.set(x + o, y + o, null); g.set(x + o + size - 1, y + o, null);
  g.set(x + o, y + o + size - 1, null); g.set(x + o + size - 1, y + o + size - 1, null);
}

/** Rounded outline of a cell (corner pixels removed so the corners read as rounded). */
function cellOutline(g: Grid, x: number, y: number, k: Key): void {
  g.rect(x, y, CELL, CELL, k, false);
  g.set(x, y, null); g.set(x + CELL - 1, y, null); g.set(x, y + CELL - 1, null); g.set(x + CELL - 1, y + CELL - 1, null);
}

/** A 7×7 question card: steel rounded outline, paper face. Face: '?' or a mini 3×3 grid with a row/column bar. */
function card(g: Grid, x: number, y: number, face: { kind: 'q' } | { kind: 'row'; i: number } | { kind: 'col'; i: number }): void {
  g.rect(x + 1, y + 1, 5, 5, 'p');
  g.rect(x, y, 7, 7, 't', false);
  g.set(x, y, null); g.set(x + 6, y, null); g.set(x, y + 6, null); g.set(x + 6, y + 6, null);
  if (face.kind === 'q') { g.text(font3x5, '?', x + 2, y + 1, 't'); return; }
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) g.set(x + 1 + 2 * i, y + 1 + 2 * j, 'l');
  if (face.kind === 'row') g.rect(x + 1, y + 1 + 2 * face.i, 5, 1, 'b');
  else g.rect(x + 1 + 2 * face.i, y + 1, 1, 5, 'v');
}

interface Pose { antenna: -1 | 0 | 1; blink: boolean; lean: number; lift: number; squash: boolean }

/** The qubit creature (12×14): glass orb, two eyes, Bloch antenna, two feet. */
function creature(g: Grid, x: number, y: number, who: 'alice' | 'bob', pose: Pose): void {
  const dx = pose.lean, top = y - pose.lift + (pose.squash ? 1 : 0);
  // feet (never lift off during the squash; they lift with the hop)
  const fy = y + 12 - pose.lift;
  g.rect(x + 3 + dx, fy, 2, 2, 's'); g.rect(x + 7 + dx, fy, 2, 2, 's');
  // orb at box rows 2–11
  g.blit(ORB_ALICE, x + 1 + dx, top + 2, who === 'bob' ? { recolor: BOB_RECOLOR } : {});
  // eyes at box row 5, shifted one pixel toward the board
  const ex = who === 'alice' ? 5 : 3;
  const eye: Key = pose.blink ? 'g' : 'k';
  g.set(x + ex + dx, top + 5, eye); g.set(x + ex + 3 + dx, top + 5, eye);
  // antenna: v stem on the orb's top, w tip that tilts one pixel
  const ax = x + 5 + dx;
  g.set(ax, top + 2, 'v'); g.set(ax + pose.antenna, top + 1, 'v'); g.set(ax + pose.antenna, top, 'w');
}

/** Antenna sweep: left, up, right, up (3 ticks each, period 12). Bob mirrors Alice. */
function sweep(t: number): -1 | 0 | 1 {
  return ([-1, 0, 1, 0] as const)[Math.floor((t % 12) / 3)];
}

function pos(from: { x: number; y: number }, to: { x: number; y: number }, step: number): { x: number; y: number } {
  // a toss: fast sideways first so the card clears the board, then an eased drop onto the player
  const sx = spacing(6, 'out', Math.abs(to.x - from.x)), sy = spacing(6, 'inOut', Math.abs(to.y - from.y));
  let x = from.x, y = from.y;
  for (let i = 0; i <= step; i++) { x += Math.sign(to.x - from.x) * sx[i]; y += Math.sign(to.y - from.y) * sy[i]; }
  return { x, y };
}

const WAVE = [0, 1, 1, 0, -1, -1];

// ── the piece ───────────────────────────────────────────────────────────────
export const magicSquare = definePiece({
  id: 'magic-square',
  size: [W, H],
  ticksPerFrame: 1,
  loopTicks: LOOP,
  period: PERIOD,
  poster: 40,
  maxColours: 15,
  palette: ['k', 's', 'm', 't', 'l', 'p', 'w', 'b', 'c', 'i', 'a', 'r', 'v', 'g', 'n'],
  alt: 'The Magic Square game: a referee deals a row to Alice and a column to Bob. Alice fills her row in blue with an even number of ones, Bob fills his column in violet with an odd number, and they always agree on the cell they share.',
  cache: 'loop',
  states: ['deal', 'fill', 'answer', 'win', 'reset'],
  state(tick: number): string {
    const t = ((tick % LOOP) + LOOP) % LOOP;
    return t < T_ROW ? 'deal' : t < T_ABITS ? 'fill' : t < T_WIN ? 'answer' : t < T_FADE ? 'win' : 'reset';
  },
  events(tick: number): string[] {
    const t = ((tick % LOOP) + LOOP) % LOOP;
    const out: string[] = [];
    if (t === T_DEAL) out.push('deal');
    if (t === T_ROW || t === T_COL) out.push('fill');
    if (t >= T_ABITS && t < T_LEAN && (t - T_ABITS) % 2 === 0) out.push('bit');
    if (t === T_FLASH) out.push('flash');
    if (t === T_WIN) out.push('win');
    if (t === T_FADE) out.push('reset');
    return out;
  },
  frame(tick: number, g: Grid, _io: PieceIO) {
    const t = ((tick % LOOP) + LOOP) % LOOP;
    const loop = Math.floor(((tick % PERIOD) + PERIOD) % PERIOD / LOOP);
    const { r, c, alice, bob } = roundFor(loop);
    const cx = (col: number) => BX + col * PITCH, cy = (row: number) => BY + row * PITCH;

    // ── base layer: empty board, players, link (the referee is drawn last, in front) ──
    for (let row = 0; row < 3; row++) for (let col = 0; col < 3; col++) cellOutline(g, cx(col), cy(row), 'l');

    const blink = t === 9 || t === 45 || t === 63;
    const measured = t >= T_FLASH && t < T_FADE;        // antennas stand up together after the measurement
    const ant = measured ? 0 : sweep(t);
    const lean = t === T_LEAN || t === T_LEAN + 1 ? 1 : 0;
    const hop = t - T_HOP;                                // 0: rise 1, 1: rise 2, 2: hold, 3: fall 1, 4: land squash
    const lift = hop === 0 || hop === 3 ? 1 : hop === 1 || hop === 2 ? 2 : 0;
    const squash = t === T_HOP - 1 || hop === 4;
    creature(g, ALICE.x, ALICE.y, 'alice', { antenna: ant, blink, lean, lift, squash });
    creature(g, BOB.x, BOB.y, 'bob', { antenna: (-ant) as -1 | 0 | 1, blink, lean: -lean, lift, squash });

    // entanglement link: 2-on-1-off dashes alternating a/r, a wave running inward from both ends (symmetric)
    for (let x = 14; x <= 81; x++) {
      const d = Math.min(x - 14, 81 - x);
      if (d % 3 === 2) continue;
      const j = Math.floor(d / 3);
      const y = LINE_Y + WAVE[(((j - (t >> 1)) % 6) + 6) % 6];
      g.set(x, y, t === T_FLASH ? 'w' : j & 1 ? 'r' : 'a');
    }

    // ── referee's cards: in hand (idle, shuffling) or in flight (deal) ──
    if (t >= T_IDLE) {
      const phase = (t - T_IDLE) >> 2;                    // 0..4; left card up on odd phases, right card up on 2
      const lu = phase === 1 || phase === 3 ? 1 : 0, ru = phase === 2 ? 1 : 0;
      card(g, CARD_L0.x, CARD_L0.y - lu, { kind: 'q' });
      card(g, CARD_R0.x, CARD_R0.y - ru, { kind: 'q' });
    } else if (t < T_ROW) {
      const pl = pos(CARD_L0, CARD_L1, t), pr = pos(CARD_R0, CARD_R1, t);
      card(g, pl.x, pl.y, t === T_ROW - 1 ? { kind: 'row', i: r } : { kind: 'q' });
      card(g, pr.x, pr.y, t === T_ROW - 1 ? { kind: 'col', i: c } : { kind: 'q' });
    }

    // ── game layer (dither-fades out on 51–54) ──
    if (t >= T_ROW && t < T_IDLE) {
      const L = new Grid(W, H);
      card(L, CARD_L1.x, CARD_L1.y, { kind: 'row', i: r });
      card(L, CARD_R1.x, CARD_R1.y, { kind: 'col', i: c });

      // Alice's row fills blue, cell by cell (2 ticks each: a 9×9 pop, then full)
      for (let col = 0; col < 3; col++) {
        const t0 = T_ROW + 2 * col;
        if (t < t0) continue;
        cellFill(L, cx(col), cy(r), 'b', t === t0 ? 9 : CELL);
      }
      // Bob's column fills violet top to bottom; the shared cell turns indigo when he reaches it
      for (let row = 0; row < 3; row++) {
        const t0 = T_COL + 2 * row;
        if (t < t0) continue;
        cellFill(L, cx(c), cy(row), row === r ? 'i' : 'v', t === t0 ? 9 : CELL);
      }

      // digits: Alice's pop left→right (1-px seed, then 5×7), then Bob's top→bottom
      const sharedBobT = T_BBITS + 2 * r;
      for (let col = 0; col < 3; col++) {
        const t0 = T_ABITS + 2 * col, x = cx(col), y = cy(r);
        if (t < t0) continue;
        if (t === t0) { L.set(x + 6, y + 6, 'w'); continue; }
        if (col === c && t >= sharedBobT) continue;       // the shared cell switches to the pair layout below
        L.text(font5x7, String(alice[col]), x + 4, y + 3, 'w');
      }
      for (let row = 0; row < 3; row++) {
        const t0 = T_BBITS + 2 * row, x = cx(c), y = cy(row);
        if (t < t0) continue;
        if (row === r) {
          L.text(font3x5, String(alice[c]), x + 3, y + 4, 'w');
          if (t === t0) L.set(x + 8, y + 6, 'w');
          else L.text(font3x5, String(bob[row]), x + 7, y + 4, 'w');
        } else if (t === t0) L.set(x + 6, y + 6, 'w');
        else L.text(font5x7, String(bob[row]), x + 4, y + 3, 'w');
      }

      // parity tags: "+" beside Alice's completed row, "−" under Bob's completed column
      if (t >= T_BBITS) { L.rect(TAG_X, cy(r) + 6, 5, 1, 'b'); L.rect(TAG_X + 2, cy(r) + 4, 1, 5, 'b'); }
      if (t >= T_LEAN) L.rect(cx(c) + 4, TAG_Y, 5, 1, 'v');

      // verdict: white ring flash, then an azure ring with twinkling white corner sparkles
      if (t >= T_FLASH && t < T_FADE) {
        const mx = cx(c) + 6, my = cy(r) + 6;
        L.ring(mx, my, 8, t === T_FLASH ? 'w' : 'a');
        if (t > T_FLASH) {
          const ph = Math.floor((t - T_WIN) / 3) & 1;
          for (const [sx, sy] of [[-8, -8], [8, -8], [-8, 8], [8, 8]] as const) {
            const big = ((sx > 0) !== (sy > 0)) === (ph === 0);
            L.set(mx + sx, my + sy, 'w');
            if (big) { L.set(mx + sx - 1, my + sy, 'a'); L.set(mx + sx + 1, my + sy, 'a'); L.set(mx + sx, my + sy - 1, 'a'); L.set(mx + sx, my + sy + 1, 'a'); }
          }
        }
      }

      if (t >= T_FADE) L.fade((T_FADE + 3 - t) as 0 | 1 | 2 | 3);
      g.blit(L, 0, 0);
    }

    // the referee stands in front of the board (a row-1 verdict ring passes behind his feet)
    g.blit(REFEREE, REF.x, REF.y);
    if (t === 15 || t === 66) { g.set(REF.x + 5, REF.y + 2, 's'); g.set(REF.x + 7, REF.y + 2, 's'); }
  },
});

export default magicSquare;

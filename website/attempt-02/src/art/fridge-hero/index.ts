// fridge-hero · the dilution-refrigerator chandelier (art-spec card 1, design §5.1, revision 1 F1–F3).
// 56×128 art px. Cool metals only: platinum/silver plates with azure rim light and frosted cold faces, steel coax
// carrying blue drive pulses down and a readout up the output line, a violet Xmon chip glowing inside a mu-metal can.
// cache 'none': the piece reads inputs (the scripted intro, manual lift/cool/ignite) and receives the ABSOLUTE local
// tick (engine E9). frame() is pure: the static base for each cooling state is built once (memoised constant data),
// then copied and overlaid with the moving parts.

import { definePiece, Grid, int, KEYS, rng, type Key, type Part, type PieceIO } from '../../engine';
import {
  PLATE_ROWS, THICK_SEGS, LOOM, BEADS, CAN, CHIP, CIRC, CIRC_AT, CX, FINGER, H, HAIRPINS, HALO_STEPS, HEMT, HEMT_AT, HEMT_LED, HX_AT, HX_ROWS, INTRO,
  LAUNCH_GAP, LAUNCH_ORDER, LINE_QUBIT, LINE_X, LOOP, PADS, PATHS, PLATES, PT_HEAD, PT_HEAD_AT, PT_STAGE2,
  PT_STAGE2_AT, PULSE_PERIOD, QUBITS, READOUT, READOUT_TRAVEL, RODS, SEG_ROWS, TRAVEL, TWPA, TWPA_AT, W, WINDOW,
  labelRows, plateLeft, type Path,
} from './geometry';

export { INTRO, labelRows, plateLeft } from './geometry';

type Put = (x: number, y: number, k: Key) => void;

const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

// ---------------------------------------------------------------------------------------------------------------
// Static layers (drawn once per cooling state into the base)

/** x at fraction f of plate i's width. */
const at = (i: number, f: number): number => PLATES[i].x + Math.round((PLATES[i].w - 1) * f);

/** A plate seen slightly from above, 6 rows, light from the upper left:
 *  r0 back edge (inset 2) · r1 top face (inset 1) · r2 front of the face, full width, with a broken white gleam ·
 *  r3 rim band (inset 1) · r4 underside (inset 2) · r5 deep underside (inset 4, `s`, turning `n` under the cold stages).
 *  The stepped ends make each plate read as an ellipse. `cold` = cooled: rim detailed, azure rim light on the right
 *  end, mist frost on the faces of the three coldest plates. The flange (0) always has its rim light. */
function plate(put: Put, i: number, cold: boolean): void {
  const { x, y, w } = PLATES[i];
  const x1 = x + w - 1;
  const lit = cold || i === 0;
  const frost = cold && i >= 3;
  for (let xx = x + 2; xx <= x1 - 2; xx++) put(xx, y, xx < at(i, 0.3) ? 'l' : 't');
  for (let xx = x + 1; xx <= x1 - 1; xx++) put(xx, y + 1, xx < at(i, 0.45) ? 'e' : frost && xx < at(i, 0.86) ? 'u' : 'l');
  frontRow(put, i, cold, 0);
  for (let xx = x + 1; xx <= x1 - 1; xx++) put(xx, y + 3, !lit ? 't' : xx < at(i, 0.12) ? 'l' : xx < at(i, 0.68) ? 't' : 'm');
  for (let xx = x + 2; xx <= x1 - 2; xx++) put(xx, y + 4, xx < at(i, 0.72) ? 'm' : 's');
  for (let xx = x + 5; xx <= x1 - 5; xx++) put(xx, y + 5, i === 5 ? 'n' : i === 4 && xx >= at(i, 0.55) ? 'n' : 's');
  if (lit) {                                                       // cool rim light along the right end
    for (let xx = at(i, 0.84); xx <= x1 - 2; xx++) put(xx, y + 3, 'c');
    put(x1 - 1, y + 3, 'a'); put(x1 - 2, y + 4, 'c'); put(x1 - 3, y + 4, 'c');
  }
}

/** r2, the full-width front of the face: platinum, mist on the cold plates, silver; the white gleam; the rim-light tip. */
function frontRow(put: Put, i: number, cold: boolean, glint: number): void {
  const { x, y, w } = PLATES[i];
  const x1 = x + w - 1;
  const frost = cold && i >= 3;
  for (let xx = x; xx <= x1; xx++) put(xx, y + 2, xx === x ? 'l' : xx < at(i, frost ? 0.4 : 0.62) ? 'e' : frost && xx < at(i, 0.8) ? 'u' : 'l');
  gleam(put, i, glint);
  if (cold || i === 0) put(x1, y + 2, 'a');
}

/** The front gleam on r2: two short white runs on the lit left (broken where the eye expects the rods);
 *  `glint` 1..2 slides one white run right across the plate for a tick each (sub-pixel shimmer). */
function gleam(put: Put, i: number, glint: number): void {
  const { y } = PLATES[i];
  const run = (f0: number, f1: number, k: Key) => { for (let xx = at(i, f0); xx < at(i, f1); xx++) put(xx, y + 2, k); };
  if (glint === 0) { run(0.04, 0.1, 'w'); run(0.14, 0.24, 'w'); }
  else if (glint === 1) { run(0.04, 0.1, 'w'); run(0.3, 0.42, 'w'); }
  else { run(0.04, 0.1, 'w'); run(0.5, 0.62, 'w'); }
}

function rods(put: Put): void {
  for (const [x, y0, y1, wide] of RODS) for (let y = y0; y <= y1; y++) {
    if (wide) { put(x, y, 't'); put(x + 1, y, 'm'); } else put(x, y, 'm');
  }
}

function coax(put: Put): void {
  SEG_ROWS.forEach(([y0, y1], s) => {
    for (let j = 0; j < 6; j++) {
      const x = LINE_X[s][j];
      if (s < THICK_SEGS) {                                          // semi-rigid: lit left column, shaded right
        for (let y = y0; y <= y1; y++) { put(x, y, 'l'); put(x + 1, y, 't'); }
        continue;
      }
      const hp = HAIRPINS.find((h) => h.line === j && h.seg === s);
      for (let y = y0; y <= y1; y++) {
        if (hp && y > hp.y && y < hp.y + 4) { put(x - 1, y, 't'); put(x + 1, y, y > hp.y + 1 ? 'm' : 't'); continue; }
        put(x, y, 't');
      }
    }
  });
}

/** Beads: lit top row `e`, body `t`, navy right edge; a 2-wide bead is a lit column and a navy column.
 *  Before their stage cools they are dull (`t` / `m`). */
function beads(put: Put, cooled: number): void {
  for (const b of BEADS) {
    const lit = cooled >= b.stage;
    for (let c = 0; c < b.w; c++) {
      const last = c === b.w - 1;
      put(b.x + c, b.y, last ? 's' : lit ? 'e' : 't');
      put(b.x + c, b.y + 1, last ? 's' : b.w === 2 ? (lit ? 'e' : 't') : lit ? 't' : 'm');
    }
  }
}

function loom(put: Put): void {
  for (const [x, y0, y1] of LOOM) for (let y = y0; y <= y1; y++) {
    const ph = (y & 1) === 0;
    put(x, y, ph ? 't' : 'm'); put(x + 1, y, ph ? 'm' : 't');          // twisted pairs: a 2-px checker
  }
}

function blit(put: Put, p: Part, x0: number, y0: number): void {
  for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
    const v = p.data[y * p.w + x];
    if (v) put(x0 + x, y0 + y, KEYS[v - 1]);
  }
}

/** Heat-exchanger coil: a 2-px zigzag, front strands (down-right) lit `l t`, back strands `t m`. */
function hxCoil(put: Put): void {
  const OFF = [0, 1, 2, 1];
  for (let r = 0; r < HX_ROWS; r++) {
    const k = OFF[r % 4], front = r % 4 < 2;
    put(HX_AT[0] + k, HX_AT[1] + r, front ? 'l' : 't');
    put(HX_AT[0] + k + 1, HX_AT[1] + r, front ? 't' : 'm');
  }
}

/** The mu-metal shield: a 1-px U ring hanging from the MXC around the chip (lit `t` left wall, `s` right wall,
 *  `m`/`s` bottom with a port at x 27..28 for the bit), azure rim light at its lower right. */
function can(put: Put): void {
  for (let y = CAN.y0; y <= CAN.y1; y++) { put(CAN.x0, y, y < CAN.y0 + 4 ? 'l' : 't'); put(CAN.x1, y, 's'); }
  put(CAN.x0 + 1, CAN.y1 + 1, 'm'); put(CAN.x1 - 1, CAN.y1 + 1, 'c');
  for (let x = CAN.x0 + 2; x <= CAN.x1 - 2; x++) if (x !== CX - 1 && x !== CX) put(x, CAN.y1 + 2, x < CX ? 'm' : 's');
  for (let y = CAN.y1 - 4; y <= CAN.y1; y++) put(CAN.x1, y, 'c');
  put(CAN.x1 - 2, CAN.y1 + 2, 'a'); put(CAN.x1 - 3, CAN.y1 + 2, 'c');
}

function finger(put: Put): void {
  for (let y = FINGER.y0; y <= FINGER.y1; y++) { put(FINGER.x, y, 'l'); put(FINGER.x + 1, y, 't'); put(FINGER.x + 2, y, 't'); put(FINGER.x + 3, y, 's'); }
}

/** The chip package: navy outline (rounded corners), a 1-px face ring lit top-left / shaded bottom-right with a white
 *  specular at the top-left corner and an azure rim light at the lower right; the die window with bond pads and four
 *  unlit Xmon crosses. The glow is an overlay (`chipGlow`). */
function chip(put: Put): void {
  const { x, y, w, h } = CHIP;
  const x1 = x + w - 1, y1 = y + h - 1;
  for (let i = x + 1; i < x1; i++) { put(i, y, 's'); put(i, y1, 's'); }
  for (let j = y + 1; j < y1; j++) { put(x, j, 's'); put(x1, j, 's'); }
  for (let j = y + 1; j < y1; j++) for (let i = x + 1; i < x1; i++) put(i, j, 't');
  for (let i = x + 1; i < x1; i++) { put(i, y + 1, 'l'); put(i, y1 - 1, 'm'); }
  for (let j = y + 1; j < y1; j++) { put(x + 1, j, 'l'); put(x1 - 1, j, 'm'); }
  put(x + 1, y + 1, 'w');                                         // specular, top-left
  put(x1 - 1, y + 1, 't'); put(x + 1, y1 - 1, 't');               // the ring's two half-lit corners
  for (let j = y1 - 4; j < y1; j++) put(x1, j, 'c');              // rim light, lower right
  put(x1 - 1, y1, 'a'); put(x1 - 2, y1, 'c');
  window_(put, false);
}

function window_(put: Put, flash: boolean): void {
  for (let j = 0; j < WINDOW.h; j++) for (let i = 0; i < WINDOW.w; i++) put(WINDOW.x + i, WINDOW.y + j, flash ? 'w' : 'k');
  if (flash) return;
  for (const [px, py] of PADS) put(px, py, 'l');
  QUBITS.forEach(([qx, qy]) => cross(put, qx, qy, 'n', 's'));
}

function cross(put: Put, cx: number, cy: number, arm: Key, centre: Key): void {
  put(cx - 1, cy, arm); put(cx + 1, cy, arm); put(cx, cy - 1, arm); put(cx, cy + 1, arm); put(cx, cy, centre);
}

function drawBase(put: Put, cooled: number): void {
  for (let y = 0; y < PLATES[0].y; y++) put(CX, y, 'm');          // the hairline cable from the cell's top line
  rods(put);
  coax(put);
  beads(put, cooled);
  loom(put);
  blit(put, PT_HEAD, PT_HEAD_AT[0], PT_HEAD_AT[1]);
  blit(put, PT_STAGE2, PT_STAGE2_AT[0], PT_STAGE2_AT[1]);
  blit(put, HEMT, HEMT_AT[0], HEMT_AT[1]);
  blit(put, CIRC, CIRC_AT[0], CIRC_AT[1]);
  blit(put, TWPA, TWPA_AT[0], TWPA_AT[1]);
  hxCoil(put);
  can(put);
  PLATES.forEach((_, i) => plate(put, i, i === 0 || cooled >= i));
  finger(put);
  chip(put);
}

/** F3: one static base per cooling state (0..5), built on first use. Pure memoisation of constant data. */
const BASES: Array<Grid | undefined> = [];
function baseFor(cooled: number): Grid {
  let g = BASES[cooled];
  if (!g) {
    const gg = new Grid(W, H);
    drawBase((x, y, k) => gg.set(x, y, k), cooled);
    BASES[cooled] = g = gg;
  }
  return g;
}

/** Pixels covered by components (a pulse inside them is hidden: it travels through the part). */
const COVER: Set<number> = (() => {
  const s = new Set<number>();
  const put: Put = (x, y) => s.add(y * W + x);
  beads(put, 5);
  blit(put, HEMT, HEMT_AT[0], HEMT_AT[1]);
  blit(put, CIRC, CIRC_AT[0], CIRC_AT[1]);
  return s;
})();
const hidden = (p: [number, number]): boolean => COVER.has(p[1] * W + p[0]);

/** Frost sparkle sites: metal on the cold plate / MXC rims and undersides (never the lit faces) and on the can. */
const FROST_COLD: Array<[number, number]> = [];
const FROST_CAN: Array<[number, number]> = [];
(() => {
  const g = baseFor(5);
  for (let y = 75; y <= 91; y++) for (let x = 14; x <= 41; x++) {
    const k = g.get(x, y);
    if (!k || !'tms'.includes(k)) continue;
    if ((y >= 78 && y <= 85)) continue;                          // not the bay between the plates (lines, TWPA)
    FROST_COLD.push([x, y]);
  }
  for (let y = CAN.y0 + 3; y <= CAN.y1 - 5; y++) { FROST_CAN.push([CAN.x0, y]); FROST_CAN.push([CAN.x1, y]); }
  for (let x = CAN.x0 + 2; x <= CAN.x1 - 4; x++) if (x < CX - 2 || x > CX + 1) FROST_CAN.push([x, CAN.y1 + 2]);
})();

// ---------------------------------------------------------------------------------------------------------------
// Dynamic layers

const FROST_LIFE: readonly Key[] = ['w', 'g', 'g', 'a', 'a', 'a'];

/** 5 sparkles per loop (3 on the cold plates, 2 on the can), seeded by the loop index, never alive across the seam. */
function frost(put: Put, tick: number): void {
  const loop = Math.floor(tick / LOOP), t = tick - loop * LOOP;
  const rand = rng(loop + 1);
  for (let i = 0; i < 5; i++) {
    const start = int(rand, 1, LOOP - FROST_LIFE.length - 1);
    const sites = i < 3 ? FROST_COLD : FROST_CAN;
    const [x, y] = sites[int(rand, 0, sites.length - 1)];
    const age = t - start;
    if (age >= 0 && age < FROST_LIFE.length) put(x, y, FROST_LIFE[age]);
  }
}

const TRAIL: readonly Key[] = ['a', 'c', 'b', 'b'];   // head first: reads on paper (b, c) and on ink (a, c)

function mark(put: Put, p: [number, number], k: Key): void {
  if (hidden(p)) return;
  const [x, y] = p;
  put(x, y, k);
  if ((y >= FINGER.y0 && x === FINGER.x + 1) || y <= SEG_ROWS[THICK_SEGS - 1][1]) put(x + 1, y, k);   // 2-px runs carry it 2 wide
}

function trail(put: Put, path: Path, dt: number): void {
  const head = path.sched[dt];
  for (let i = 0; i < TRAIL.length; i++) { const idx = head - i; if (idx >= 0) mark(put, path.pts[idx], TRAIL[i]); }
}

/** Plate below a drive line's segment end / above a readout's segment top. */
function plateBelow(y: number): number { return PLATES.findIndex((p) => p.y > y); }

function inRow(i: number, row: number, x: number): boolean {
  const p = PLATES[i], inset = [2, 1, 0, 1, 2, 5][row];
  return x >= p.x + inset && x <= p.x + p.w - 1 - inset;
}

interface Fx { blink: boolean[]; led: boolean; circ: number }

/** Drive pulses at pulse-time `pt` (lines 0..4, launches 0, 9, 18, 27, 36 within every 48). */
function drives(put: Put, pt: number, fromIgnition: boolean, fx: Fx): void {
  for (let k = 0; k < LAUNCH_ORDER.length; k++) {
    const j = LAUNCH_ORDER[k], path = PATHS[j], travel = TRAVEL[j], qb = LINE_QUBIT[j];
    const q = pt - k * LAUNCH_GAP;
    const n0 = Math.floor(q / PULSE_PERIOD);
    for (const n of [n0, n0 - 1]) {
      if (fromIgnition && n < 0) continue;
      const dt = q - n * PULSE_PERIOD;
      if (dt < 0 || dt > travel) continue;
      if (dt === travel) {                                          // arrival: into the chip, the qubit blinks
        if (qb >= 0) fx.blink[qb] = true;
        mark(put, path.pts[path.pts.length - 1], 'a');
        continue;
      }
      trail(put, path, dt);
      const head = path.sched[dt];
      if (dt > 0 && path.sched[dt - 1] === head) {                // thermal anchoring: light sinks into the plate
        const [hx, hy] = path.pts[head];
        const pi = plateBelow(hy);
        if (pi > 0 && inRow(pi, 3, hx)) put(hx, PLATES[pi].y + 3, 'a');
        if (pi > 0 && inRow(pi, 4, hx)) put(hx, PLATES[pi].y + 4, 'c');
      }
    }
  }
}

/** The readout climbs the output line from above the MXC on every bit tick (d = 0), through the circulators and
 *  the HEMT (whose LED flickers as it passes), holding a tick under each plate. */
function readout(put: Put, pt: number, fromIgnition: boolean, fx: Fx): void {
  if (pt < 0) return;
  const n = Math.floor(pt / PULSE_PERIOD), dt = pt - n * PULSE_PERIOD;
  if (fromIgnition && n < 1) return;                                 // the first readout leaves with the first bit
  if (dt >= READOUT_TRAVEL) return;
  const path = READOUT, head = path.sched[dt];
  trail(put, path, dt);
  const [hx, hy] = path.pts[head];
  if (hidden(path.pts[head])) {
    if (hy >= HEMT_AT[1] && hy < HEMT_AT[1] + HEMT.h) fx.led = true;
    if (hy >= CIRC_AT[1] && hy < CIRC_AT[1] + CIRC.h) fx.circ = hy;
  }
  if (dt > 0 && path.sched[dt - 1] === head) {                      // anchoring under the plate above
    const pi = PLATES.findIndex((p) => p.y + PLATE_ROWS === hy);
    if (pi >= 0 && inRow(pi, 5, hx)) put(hx, PLATES[pi].y + 5, 'a');
    if (pi >= 0 && inRow(pi, 4, hx)) put(hx, PLATES[pi].y + 4, 'c');
  }
}

/** Chip glow: the face ring breathes n → i → r → i, the die's crosses alternate lit (i/r) and resting (v/i) every
 *  6 ticks, a pulse's qubit flashes (r arms, w centre) for its arrival tick; violet light spills into the can
 *  (a dithered lilac on the interior) and reflects indigo on the finger's shadow side. */
function chipGlow(put: Put, tick: number, blink: boolean[]): void {
  const { x, y, w, h } = CHIP;
  const x1 = x + w - 1, y1 = y + h - 1;
  const k = HALO_STEPS[Math.floor(tick / 2) % HALO_STEPS.length];
  const wx0 = WINDOW.x, wx1 = WINDOW.x + WINDOW.w - 1, wy0 = WINDOW.y, wy1 = WINDOW.y + WINDOW.h - 1;
  for (let i = wx0; i <= wx1; i++) { put(i, wy0 - 1, k); put(i, wy1 + 1, k); }   // halo: the inner face ring
  for (let j = wy0; j <= wy1; j++) { put(wx0 - 1, j, k); put(wx1 + 1, j, k); }
  // the glow spills onto the outer face ring as a 50 % lilac dither (fixed in place; the halo carries the breathing)
  // top/left: a lilac/mist checker (dithered glow on the lit face); bottom/right: indigo (glow on the shaded face)
  for (let i = x + 2; i < x1 - 1; i++) { put(i, y + 1, (i + y + 1) % 2 === 0 ? 'r' : 'u'); put(i, y1 - 1, 'i'); }
  for (let j = y + 2; j < y1 - 1; j++) { put(x + 1, j, (x + 1 + j) % 2 === 0 ? 'r' : 'u'); put(x1 - 1, j, 'i'); }
  const swap = Math.floor(tick / 6) % 2 === 1;
  QUBITS.forEach(([qx, qy], i) => {
    if (blink[i]) cross(put, qx, qy, 'r', 'w');
    else if (((i === 0 || i === 3) !== swap)) cross(put, qx, qy, 'i', 'r');
    else cross(put, qx, qy, 'v', 'i');
  });
  put(FINGER.x + 3, FINGER.y1, 'i'); put(FINGER.x + 3, FINGER.y1 - 1, 'i');   // violet reflection on the finger
  for (let j = WINDOW.y + 1; j < WINDOW.y + WINDOW.h - 1; j++) { put(CAN.x0, j, 'r'); put(CAN.x1, j, 'i'); }  // on the shield
  const mx = PLATES[5];                                                          // and on the MXC's underside
  for (let i = mx.x + 5; i <= mx.x + mx.w - 6; i++) put(i, mx.y + 5, 'i');
  for (let i = mx.x + 6; i <= mx.x + mx.w - 7; i++) put(i, mx.y + 4, 'n');
}

function bit(put: Put, pt: number, fromIgnition: boolean): void {
  if (pt < 0) return;
  const d = pt % PULSE_PERIOD;
  if (fromIgnition && pt < PULSE_PERIOD) return;     // the first bit waits for the first pulses to arrive
  if (d > 9) return;
  const y = CHIP.y + CHIP.h + d * 2;                 // leaves at row 109 through the can's port, 2 px per tick
  put(CX, y, 'a');
  if (d > 0) put(CX, y - 1, 'c');
}

// ---------------------------------------------------------------------------------------------------------------
// Resolved inputs

type Phase = 'armed' | 'lowering' | 'cooling' | 'idle';
interface Resolved { lift: number; cooled: number; flashStage: number; ignited: boolean; igniteFlash: boolean; pt: number; intro: boolean; t: number; phase: Phase }

/** F1: `intro` is compared with the ABSOLUTE local tick, so the intro plays exactly once.
 *  -2 = armed (hidden) · -1 = static idle (manual inputs) · ≥ 0 = the local tick the scripted intro starts at. */
function resolve(tick: number, io: PieceIO): Resolved {
  const intro = num(io.intro, -1);
  if (intro === -2) return { lift: H, cooled: 0, flashStage: 0, ignited: false, igniteFlash: false, pt: -1, intro: true, t: -1, phase: 'armed' };
  if (intro >= 0) {
    const t = tick - intro;
    if (t < 0) return { lift: H, cooled: 0, flashStage: 0, ignited: false, igniteFlash: false, pt: -1, intro: true, t, phase: 'armed' };
    const lift = INTRO.lowerTicks[Math.min(t, INTRO.lowerTicks.length - 1)];
    const cooled = clamp(t - (INTRO.coolTicks[0] - 1), 0, 5);
    const ci = (INTRO.coolTicks as readonly number[]).indexOf(t);
    const phase: Phase = t < INTRO.restTick ? 'lowering' : t < INTRO.igniteTick ? 'cooling' : 'idle';
    return { lift, cooled, flashStage: ci >= 0 ? ci + 1 : 0, ignited: t >= INTRO.igniteTick, igniteFlash: t === INTRO.igniteTick, pt: t - INTRO.igniteTick, intro: true, t, phase };
  }
  return { lift: clamp(Math.round(num(io.lift, 0)), 0, H), cooled: clamp(Math.round(num(io.cool, 5)), 0, 5), flashStage: 0, ignited: io.ignite !== false, igniteFlash: false, pt: tick, intro: false, t: -1, phase: 'idle' };
}

// ---------------------------------------------------------------------------------------------------------------

export const fridgeHero = definePiece({
  id: 'fridge-hero',
  size: [W, H],
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: 26,
  maxColours: 17,
  palette: ['k', 'n', 's', 'm', 't', 'l', 'e', 'h', 'w', 'v', 'i', 'b', 'c', 'a', 'u', 'g', 'r'],
  alt: 'A dilution refrigerator: six frosted silver plates narrowing downward, coaxial lines carrying blue pulses down to a violet-glowing quantum chip inside a shield can.',
  cache: 'none',
  inputs: {
    intro: { type: 'number', default: -1 },   // -1 idle · -2 armed (hidden) · ≥ 0 the absolute local tick the scripted intro starts
    lift: { type: 'number', default: 0 },     // manual: art px the fridge is raised (clipped at the top); ignored unless intro = -1
    cool: { type: 'number', default: 5 },     // manual: stages cooled 0..5; ignored unless intro = -1
    ignite: { type: 'boolean', default: true }, // manual: chip lit and pulses running; ignored unless intro = -1
  },
  states: ['armed', 'lowering', 'cooling', 'idle'],
  exports: { labelRows, plateLeft, intro: INTRO, bitPeriod: PULSE_PERIOD, bitExitTick: 10, bitX: CX, travel: TRAVEL, readoutTravel: READOUT_TRAVEL },

  frame(tick: number, g: Grid, io: PieceIO): void {
    const r = resolve(tick, io);
    if (r.lift >= H) return;
    const L = r.lift;
    const base = baseFor(r.cooled);
    if (L === 0) g.data.set(base.data);
    else { g.data.set(base.data.subarray(L * W)); g.data.fill(0, (H - L) * W); }
    const put: Put = (x, y, k) => g.set(x, y - L, k);

    // cooldown flash: the stage's rim goes azure for exactly one tick
    if (r.flashStage > 0) {
      const p = PLATES[r.flashStage];
      for (let x = p.x + 1; x <= p.x + p.w - 2; x++) put(x, p.y + 3, 'a');
      for (let x = p.x + 2; x <= p.x + p.w - 3; x++) put(x, p.y + 4, 'c');
    }
    // glint: every 72 ticks a white run slides across each plate in turn, top to bottom
    const gt = tick % 72;
    if (gt < 12) { const i = gt >> 1; if (i !== r.flashStage) frontRow(put, i, i === 0 || r.cooled >= i, (gt & 1) + 1); }

    const fx: Fx = { blink: [false, false, false, false], led: false, circ: -1 };
    if (r.ignited && !r.igniteFlash) { drives(put, r.pt, r.intro, fx); readout(put, r.pt, r.intro, fx); }
    put(HEMT_LED[0], HEMT_LED[1], fx.led ? 'g' : r.ignited ? 'a' : 'c');
    if (fx.circ >= 0) for (let x = CIRC_AT[0]; x < CIRC_AT[0] + CIRC.w; x++) put(x, fx.circ - ((fx.circ - CIRC_AT[1]) % 3), 'a');

    if (r.igniteFlash) window_(put, true);
    else if (r.ignited) chipGlow(put, tick, fx.blink);
    if (r.cooled >= 5) frost(put, tick);
    if (r.ignited) bit(put, r.pt, r.intro);
  },

  state(tick: number, io: PieceIO): string { return resolve(tick, io).phase; },

  events(tick: number, io: PieceIO): string[] {
    const r = resolve(tick, io);
    const out: string[] = [];
    if (r.intro && r.phase !== 'armed') {
      if (r.t === INTRO.restTick) out.push('lowered');
      if (r.flashStage) out.push('cool', `cool-${r.flashStage}`);
      if (r.igniteFlash) out.push('ignite');
    }
    if (r.ignited && r.pt >= 0 && !(r.intro && r.pt < PULSE_PERIOD)) {
      const d = r.pt % PULSE_PERIOD;
      if (d === 0) out.push('bit');
      if (d === 10) out.push('bit-exit');
    }
    return out;
  },
});

export default fridgeHero;

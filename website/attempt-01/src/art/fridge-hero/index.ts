// fridge-hero · the dilution-refrigerator chandelier (art-spec card 1, design §5.1).
// 56×128 art px. Cool metals only: platinum/silver plates, steel coax, azure pulses, a violet chip glow.
// cache 'none': the piece reads inputs (the scripted intro, manual lift/cool/ignite) and redraws per tick.
// frame() is pure: everything derives from (tick, io) and the constant tables in geometry.ts.

import { definePiece, Grid, int, rng, type Key, type PieceIO } from '../../engine';
import {
  BEADS, CHIP, CIRC, CX, FINGER, H, HAIRPINS, HALO_STEPS, HEMT, INTRO, LAUNCH_ORDER, LINE_QUBIT, LINE_X, LOOP, NUBS,
  PATHS, PLATES, PULSE_PERIOD, QUBITS, RODS, SEG_ROWS, TRAVEL, W, WINDOW, labelRows, plateLeft, type Plate,
} from './geometry';

export { INTRO, labelRows, plateLeft } from './geometry';

type Put = (x: number, y: number, k: Key) => void;

const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d);
const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const pct = (w: number, p: number): number => Math.round(w * p);

// ---------------------------------------------------------------------------------------------------------------
// Static layers

/** The plate recipe (5 rows, light from the upper left). `cold` = rim detailed; `flash` = azure rim for 1 tick;
 *  `glint` 0 = none, 1..2 = the gleam row's highlight sweeping right (sub-pixel shimmer). */
function plate(put: Put, p: Plate, cold: boolean, flash: boolean, glint: number): void {
  const { x, y, w } = p;
  const hl = (x0: number, x1: number, yy: number, k: Key) => { for (let i = x0; i < x1; i++) put(i, yy, k); };
  // r0 back edge
  hl(x + 2, x + w - 2, y, 'l');
  // r1 face: platinum on the lit left, silver to the right
  hl(x, x + pct(w, 0.45), y + 1, 'e');
  hl(x + pct(w, 0.45), x + w, y + 1, 'l');
  // r2 gleam
  if (glint === 1) { hl(x, x + pct(w, 0.18), y + 2, 'e'); hl(x + pct(w, 0.18), x + pct(w, 0.45), y + 2, 'w'); hl(x + pct(w, 0.45), x + pct(w, 0.6), y + 2, 'e'); }
  else if (glint === 2) { hl(x, x + pct(w, 0.45), y + 2, 'e'); hl(x + pct(w, 0.45), x + pct(w, 0.72), y + 2, 'w'); }
  else { hl(x, x + pct(w, 0.18), y + 2, 'w'); hl(x + pct(w, 0.18), x + pct(w, 0.6), y + 2, 'e'); }
  hl(x + (glint === 2 ? pct(w, 0.72) : pct(w, 0.6)), x + w, y + 2, 'l');
  // r3 rim
  if (flash) hl(x, x + w, y + 3, 'a');
  else if (cold) { hl(x, x + pct(w, 0.12), y + 3, 'l'); hl(x + pct(w, 0.12), x + pct(w, 0.68), y + 3, 't'); hl(x + pct(w, 0.68), x + w, y + 3, 'm'); }
  else hl(x, x + w, y + 3, 't');
  // r4 underside (inset 2)
  if (flash) hl(x + 2, x + w - 2, y + 4, 'c');
  else { hl(x + 2, x + pct(w, 0.72), y + 4, 'm'); hl(x + pct(w, 0.72), x + w - 2, y + 4, 's'); }
}

function rods(put: Put): void {
  for (const [x, y0, y1, wide] of RODS) for (let y = y0; y <= y1; y++) {
    if (wide) { put(x, y, 't'); put(x + 1, y, 'm'); }   // upper truss: 2-px tubes, lit left, shaded right
    else put(x, y, 'm');                               // lower struts: 1-px
  }
}

function coax(put: Put): void {
  SEG_ROWS.forEach(([y0, y1], s) => {
    for (let j = 0; j < 6; j++) {
      const x = LINE_X[s][j];
      const hp = HAIRPINS.find((h) => h.line === j && h.seg === s);
      for (let y = y0; y <= y1; y++) {
        if (hp && (y === hp.y + 1 || y === hp.y + 2)) {
          put(x - 1, y, 't'); put(x + 1, y, y === hp.y + 2 ? 'm' : 't');     // loop sides, lower-right in shadow
          continue;
        }
        put(x, y, y === y0 ? 'm' : 't');                                       // first px under a plate sits in its shadow
      }
    }
  });
}

function beads(put: Put, cooled: number): void {
  for (const b of BEADS) {
    const lit = cooled >= b.stage;
    put(b.x, b.y, lit ? 'e' : 't'); put(b.x + 1, b.y, lit ? 'e' : 't'); put(b.x + 2, b.y, 's');
    put(b.x, b.y + 1, lit ? 't' : 'm'); put(b.x + 1, b.y + 1, lit ? 't' : 'm'); put(b.x + 2, b.y + 1, 's');
  }
}

function fixtures(put: Put): void {
  // HEMT amplifier box under 4 K: platinum top, steel body, slate right edge
  for (let i = 0; i < HEMT.w; i++) put(HEMT.x + i, HEMT.y, 'l');
  for (let y = HEMT.y + 1; y < HEMT.y + HEMT.h; y++) { for (let i = 0; i < HEMT.w - 1; i++) put(HEMT.x + i, y, 't'); put(HEMT.x + HEMT.w - 1, y, 'm'); }
  // circulator disc 5×5 under the still: lit rim upper-left, shaded lower-right, steel face, navy centre
  const { x, y } = CIRC;
  for (let i = 1; i <= 3; i++) { put(x + i, y, 'l'); put(x + i, y + 4, 'm'); }
  for (let i = 1; i <= 3; i++) { put(x, y + i, 'l'); put(x + 4, y + i, 'm'); }
  for (let yy = 1; yy <= 3; yy++) for (let xx = 1; xx <= 3; xx++) put(x + xx, y + yy, 't');
  put(x + 2, y + 2, 's');
}

function finger(put: Put): void {
  for (let y = FINGER.y0; y <= FINGER.y1; y++) { put(FINGER.x, y, 'l'); put(FINGER.x + 1, y, 't'); put(FINGER.x + 2, y, 't'); put(FINGER.x + 3, y, 's'); }
}

/** The chip package: a navy-outlined steel box with rounded corners, lit top-left, shaded bottom-right.
 *  `glow` = window lit (halo + qubits); `flash` = window white for the ignition tick. */
function chip(put: Put, tick: number, glow: boolean, flash: boolean, blink: boolean[]): void {
  const { x, y, w, h } = CHIP;
  const x1 = x + w - 1, y1 = y + h - 1;
  for (let i = 1; i < w - 1; i++) { put(x + i, y, 's'); put(x + i, y1, 's'); }
  for (let yy = y + 1; yy < y1; yy++) {
    put(x, yy, 's'); put(x1, yy, 's');
    for (let xx = x + 1; xx < x1; xx++) put(xx, yy, 't');
  }
  for (let xx = x + 1; xx < x1 - 1; xx++) put(xx, y + 1, 'l');               // lit top edge
  put(x + 1, y + 2, 'l'); put(x + 1, y + 3, 'l');                              // lit left corner
  for (let xx = x + 2; xx < x1; xx++) put(xx, y1 - 1, 'm');                    // shaded bottom edge
  put(x1 - 1, y1 - 2, 'm'); put(x1 - 1, y1 - 3, 'm');                          // shaded right corner
  NUBS.forEach(([nx, ny], i) => put(nx, ny, blink[i < 2 ? 4 : 5] ? 'a' : 'l'));
  // halo ring (corners left open so it reads as light, not a frame)
  if (glow && !flash) {
    const k = HALO_STEPS[Math.floor(tick / 2) % HALO_STEPS.length];
    for (let xx = WINDOW.x; xx < WINDOW.x + WINDOW.w; xx++) { put(xx, WINDOW.y - 1, k); put(xx, WINDOW.y + WINDOW.h, k); }
    for (let yy = WINDOW.y; yy < WINDOW.y + WINDOW.h; yy++) { put(WINDOW.x - 1, yy, k); put(WINDOW.x + WINDOW.w, yy, k); }
  }
  // window
  for (let yy = 0; yy < WINDOW.h; yy++) for (let xx = 0; xx < WINDOW.w; xx++) put(WINDOW.x + xx, WINDOW.y + yy, flash ? 'w' : 'k');
  if (glow && !flash) {
    const swap = Math.floor(tick / 6) % 2 === 1;
    QUBITS.forEach(([qx, qy], i) => {
      const base: Key = (i % 2 === 0) !== swap ? 'v' : 'i';
      put(qx, qy, blink[i] ? 'w' : base);
    });
  }
}

/** Static base (idle, cooled, no glow) rendered once: used only to pick frost positions on metal. */
const FROST_SPOTS: Array<[number, number]> = (() => {
  const g = new Grid(W, H);
  const put: Put = (x, y, k) => g.set(x, y, k);
  rods(put); coax(put); beads(put, 5); fixtures(put);
  for (const p of PLATES) plate(put, p, true, false, 0);
  finger(put); chip(put, 0, false, false, [false, false, false, false, false, false]);
  const spots: Array<[number, number]> = [];
  const near = (x: number, y: number, rx0: number, ry0: number, rx1: number, ry1: number, d: number) =>
    x >= rx0 - d && x <= rx1 + d && y >= ry0 - d && y <= ry1 + d;
  for (let y = 84; y < 112; y++) for (let x = 12; x < 44; x++) {
    const k = g.get(x, y);
    if (!k || !'tmsl'.includes(k)) continue;
    if (!near(x, y, 18, 86, 37, 90, 4) && !near(x, y, CHIP.x, CHIP.y, CHIP.x + CHIP.w - 1, CHIP.y + CHIP.h - 1, 4)) continue;
    if (x >= WINDOW.x - 1 && x <= WINDOW.x + WINDOW.w && y >= WINDOW.y - 1 && y <= WINDOW.y + WINDOW.h) continue;  // never the window or halo
    if (y >= FINGER.y0 && y <= FINGER.y1 && (x === FINGER.x + 1 || x === FINGER.x + 2)) continue;              // not on the finger's signal path
    if (y >= 86 && y <= 87) continue;                                                                           // not on the MXC's lit face
    spots.push([x, y]);
  }
  return spots;
})();

// ---------------------------------------------------------------------------------------------------------------
// Dynamic layers

const FROST_LIFE: readonly Key[] = ['w', 'g', 'g', 'a', 'a', 'a'];

function frost(put: Put, tick: number): void {
  const loop = Math.floor(tick / LOOP), t = tick - loop * LOOP;
  const rand = rng(loop + 1);
  const n = int(rand, 6, 9);
  for (let i = 0; i < n; i++) {
    const start = int(rand, 1, LOOP - FROST_LIFE.length - 1);       // never alive across the loop seam
    const spot = FROST_SPOTS[int(rand, 0, FROST_SPOTS.length - 1)];
    const age = t - start;
    if (age >= 0 && age < FROST_LIFE.length) put(spot[0], spot[1], FROST_LIFE[age]);
  }
}

const TRAIL: readonly Key[] = ['w', 'g', 'a', 'c'];   // head first

/** Draws every pulse in flight at pulse-time `pt`; returns which qubits blink this tick. */
function pulses(put: Put, pt: number, fromIgnition: boolean): boolean[] {
  const blink = [false, false, false, false, false, false];   // 4 qubits + left nub + right nub
  for (let k = 0; k < 6; k++) {
    const j = LAUNCH_ORDER[k];
    const path = PATHS[j], travel = TRAVEL[j];
    const q = pt - (k * 7) % PULSE_PERIOD;
    const n0 = Math.floor(q / PULSE_PERIOD);
    for (const n of [n0, n0 - 1]) {
      if (fromIgnition && n < 0) continue;                 // in the intro, pulses start only after ignition
      const dt = q - n * PULSE_PERIOD;
      if (dt < 0 || dt > travel) continue;
      if (dt === travel) {                                  // arrival: into the chip, qubit blinks, tail drains
        blink[LINE_QUBIT[j]] = true;
        blink[j < 3 ? 4 : 5] = true;                        // the connector nub on that side lights for the tick
        const last = path.pts.length - 1;
        mark(put, path.pts[last], 'g'); mark(put, path.pts[last - 1], 'a');
        continue;
      }
      const head = path.sched[dt];
      const held = dt > 0 && path.sched[dt - 1] === head;
      for (let i = 0; i < TRAIL.length; i++) {
        const idx = head - i;
        if (idx < 0) break;
        mark(put, path.pts[idx], TRAIL[i]);
      }
      if (held) {                                           // thermal anchoring: light sinks into the plate below the head
        const [hx, hy] = path.pts[head];
        put(hx, hy + 4, 'a'); put(hx, hy + 5, 'c');
      }
    }
  }
  return blink;
}

function mark(put: Put, p: [number, number], k: Key): void {
  const [x, y] = p;
  put(x, y, k);
  if (y >= FINGER.y0 && x === FINGER.x + 1) put(x + 1, y, k);   // the finger carries the signal 2 px wide
}

function bit(put: Put, pt: number, fromIgnition: boolean): void {
  if (pt < 0) return;
  const d = pt % PULSE_PERIOD;
  if (fromIgnition && pt < PULSE_PERIOD) return;     // the first bit waits for the first pulses to arrive
  if (d > 9) return;
  const y = CHIP.y + CHIP.h + d * 2;                 // leaves at row 109, 2 px per tick, exits after row 127
  put(CX, y, 'a');
  if (d > 0) put(CX, y - 1, 'g');                    // the tail starts once the bit has left the package
}

// ---------------------------------------------------------------------------------------------------------------
// Resolved inputs

interface Resolved { lift: number; cooled: number; flashStage: number; ignited: boolean; igniteFlash: boolean; pt: number; intro: boolean; phase: 'armed' | 'lowering' | 'cooling' | 'idle' }

function resolve(tick: number, io: PieceIO): Resolved {
  const intro = num(io.intro, -1);
  if (intro === -2) return { lift: H, cooled: 0, flashStage: 0, ignited: false, igniteFlash: false, pt: -1, intro: true, phase: 'armed' };
  if (intro >= 0) {
    const t = tick - intro;
    const lift = t < 0 ? H : INTRO.lowerTicks[Math.min(t, INTRO.lowerTicks.length - 1)];
    const cooled = clamp(t - (INTRO.coolTicks[0] - 1), 0, 5);
    const ci = (INTRO.coolTicks as readonly number[]).indexOf(t);
    const phase = t < 0 ? 'armed' : t < INTRO.restTick ? 'lowering' : t < INTRO.igniteTick ? 'cooling' : 'idle';
    return { lift, cooled, flashStage: ci >= 0 ? ci + 1 : 0, ignited: t >= INTRO.igniteTick, igniteFlash: t === INTRO.igniteTick, pt: t - INTRO.igniteTick, intro: true, phase };
  }
  return { lift: Math.max(0, Math.round(num(io.lift, 0))), cooled: clamp(Math.round(num(io.cool, 5)), 0, 5), flashStage: 0, ignited: io.ignite !== false, igniteFlash: false, pt: tick, intro: false, phase: 'idle' };
}

// ---------------------------------------------------------------------------------------------------------------

export const fridgeHero = definePiece({
  id: 'fridge-hero',
  size: [W, H],
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: 30,
  maxColours: 17,
  palette: ['k', 'n', 's', 'm', 't', 'l', 'e', 'h', 'w', 'v', 'i', 'b', 'c', 'a', 'u', 'g', 'r'],
  alt: 'A dilution refrigerator: five silver plates narrowing downward, coaxial lines carrying blue pulses to a chip whose window glows violet.',
  cache: 'none',
  inputs: {
    intro: { type: 'number', default: -1 },   // -1 idle · -2 armed (hidden) · ≥ 0 the local tick the scripted intro starts
    lift: { type: 'number', default: 0 },     // manual: art px the fridge is raised (clipped at the top), ignored while intro ≥ 0 or -2
    cool: { type: 'number', default: 5 },     // manual: stages cooled 0..5, ignored while intro is set
    ignite: { type: 'boolean', default: true }, // manual: chip lit and pulses running, ignored while intro is set
  },
  states: ['armed', 'lowering', 'cooling', 'idle'],
  exports: { labelRows, plateLeft, intro: INTRO, bitPeriod: PULSE_PERIOD, bitExitTick: 10, bitX: CX, travel: TRAVEL },

  frame(tick: number, g: Grid, io: PieceIO): void {
    const r = resolve(tick, io);
    if (r.lift >= H) return;
    const put: Put = (x, y, k) => g.set(x, y - r.lift, k);

    // hairline cable: from the cell's top line down to the flange (it lengthens as the fridge is lowered)
    for (let y = 0; y < PLATES[0].y - r.lift; y++) g.set(CX, y, 'm');

    rods(put);
    coax(put);
    beads(put, r.cooled);
    fixtures(put);
    const glintT = tick % 72;
    PLATES.forEach((p, i) => {
      const gl = glintT === 2 * i ? 1 : glintT === 2 * i + 1 ? 2 : 0;
      plate(put, p, i === 0 || r.cooled >= i, r.flashStage > 0 && r.flashStage === i, gl);
    });
    finger(put);

    const blink = r.ignited && !r.igniteFlash ? pulses(put, r.pt, r.intro) : [false, false, false, false, false, false];
    chip(put, tick, r.ignited, r.igniteFlash, blink);
    if (r.cooled >= 5) frost(put, tick);
    if (r.ignited) bit(put, r.pt, r.intro);
  },

  state(tick: number, io: PieceIO): string { return resolve(tick, io).phase; },

  events(tick: number, io: PieceIO): string[] {
    const r = resolve(tick, io);
    const out: string[] = [];
    if (r.intro && r.phase !== 'armed') {
      const t = tick - num(io.intro, -1);
      if (t === INTRO.restTick) out.push('lowered');
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

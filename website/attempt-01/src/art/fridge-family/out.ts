// fridge-out (card 10c), 48×48: the fridge hands back ONE number. A toast card `-12.4` pops up out of the chip
// box's slot while a cloud of 40 hidden amplitudes twinkles around the instrument. Loop 48 at 12 fps, poster 20.
//
// Timeline (ticks):
//   0–5    card rises out of the slot, spacing 1 2 3 3 2 1 (it widens from the slot width to 22 as it clears it)
//   6      lands 1 px: squash (24×8)
//   7–35   hold, card at rest (rows 21–29); the cloud twinkles throughout
//   27–42  four pulses run down the coax (the next job); outer lines arrive at the box lid (41, 42), inner lines
//          anchor in the MXC (39, 40)
//   36–41  card sinks back into the slot, spacing 1 2 3 3 2 1
//   42–47  the chip answers: window white for 1 tick (42), qubits w → g → a with the halo r → i → i (43–45)
//   always a dark `n` halo rings the window (bright r → i only at 43–45); qubits swap v ⇄ i every 6 ticks (as the hero)
// Physics: the fridge hangs from its top flange (card 10 says "standing on row 44"; legs were tried in round 1 and
// turned the silhouette into a cabinet, so it hangs like the hero and rows 41–47 stay empty).

import { definePiece, font3x5, Grid, rng, type Key, type Part } from '../../engine';
import { coax, plate, type Pt } from './recipe';

const W = 48, H = 48;

/** Geometry (absolute in the 48×48 piece). Fridge body x 14–33, rows 5–40; legs stand on row 44. */
export const OUT = {
  cable: { x: 24, y0: 2, y1: 4 },
  plates: [
    { x: 14, y: 5, w: 20 },
    { x: 16, y: 11, w: 16 },
    { x: 18, y: 17, w: 12 },
    { x: 20, y: 23, w: 8 },
  ],
  finger: { x: 23, y0: 26, y1: 31 },
  box: { x: 18, y: 32, w: 12, h: 9 },
  slot: { x0: 21, x1: 26, y: 32 },
  window: { x: 21, y: 35, w: 6, h: 3 },
  qubits: [[22, 36], [23, 36], [24, 36], [25, 36]] as ReadonlyArray<Pt>,
  card: { x: 13, w: 22, h: 9, restTop: 21 },
  cloud: { cx: 24, cy: 14, rx: 20, ry: 13, n: 40 },
} as const;

// coax columns per gap (between plates); jogs happen hidden inside the plates
const GAPS: ReadonlyArray<{ y0: number; y1: number; xs: readonly (number | null)[] }> = [
  { y0: 8, y1: 10, xs: [17, 20, 27, 30] },
  { y0: 14, y1: 16, xs: [18, 21, 26, 29] },
  { y0: 20, y1: 22, xs: [19, 21, 26, 28] },
  { y0: 26, y1: 31, xs: [20, null, null, 27] },
];

/** Full per-row paths (rows 8 → 32) for each coax line; rows inside plates are hidden by the plates. */
const PATHS: Pt[][] = [0, 1, 2, 3].map((k) => {
  const pts: Pt[] = [];
  let last = GAPS[0].xs[k] as number;
  for (let y = 8; y <= 32; y++) {
    const gap = GAPS.find((gg) => y >= gg.y0 && y <= gg.y1);
    if (gap) {
      const x = gap.xs[k];
      if (x === null) break;
      last = x;
    }
    pts.push([last, y]);
  }
  return pts;
});

/** The static instrument (no pulses, no qubit light, no card), built once. */
const BODY: Part = (() => {
  const g = new Grid(W, H);
  // cable
  for (let y = OUT.cable.y0; y <= OUT.cable.y1; y++) g.set(OUT.cable.x, y, 'm');
  // coax runs (drawn per gap), then plates on top
  for (const gap of GAPS) gap.xs.forEach((x) => { if (x !== null) coax(g, x, gap.y0, gap.y1, { shadow: null }); });
  for (const p of OUT.plates) plate(g, p.x, p.y, p.w);
  // plates cast a 1-px shadow on the coax right under them
  for (const p of OUT.plates) for (const gap of GAPS) if (gap.y0 === p.y + 3) gap.xs.forEach((x) => { if (x !== null && x >= p.x && x < p.x + p.w) g.set(x, gap.y0, 'm'); });
  // cold finger: `t` lit side, `s` shadow side
  for (let y = OUT.finger.y0; y <= OUT.finger.y1; y++) { g.set(OUT.finger.x, y, 't'); g.set(OUT.finger.x + 1, y, 's'); }
  g.set(OUT.finger.x, OUT.finger.y0, 'm'); g.set(OUT.finger.x + 1, OUT.finger.y0, 'm');
  // chip box: `s` shell; face lit upper-left; `k` slot in the lid; `k` window; `l` connector nubs on both sides
  const b = OUT.box;
  g.rect(b.x, b.y, b.w, b.h, 's');
  g.rect(b.x + 1, b.y + 1, b.w - 2, b.h - 2, 't');
  for (let x = b.x + 1; x < b.x + b.w - 2; x++) g.set(x, b.y + 1, 'l');
  for (let y = b.y + 2; y < b.y + b.h - 1; y++) g.set(b.x + 1, y, 'l');
  for (let y = b.y + 1; y < b.y + b.h - 1; y++) g.set(b.x + b.w - 2, y, 'm');
  for (let x = b.x + 2; x < b.x + b.w - 1; x++) g.set(x, b.y + b.h - 2, 'm');
  for (let x = OUT.slot.x0; x <= OUT.slot.x1; x++) g.set(x, OUT.slot.y, 'k');
  g.set(20, b.y, 't'); g.set(27, b.y, 't');
  g.rect(OUT.window.x, OUT.window.y, OUT.window.w, OUT.window.h, 'k');
  for (const ny of [36, 37]) { g.set(b.x - 1, ny, 'l'); g.set(b.x + b.w, ny, 'l'); }   // 2-row nubs, as the hero's
  return g.toPart('fridge-out-body');
})();

const BODY_GRID: Grid = (() => { const g = new Grid(W, H); g.blit(BODY, 0, 0); return g; })();

// ── the amplitude cloud: 40 isolated pixels, seeded once ─────────────────────────────────────────
const CLOUD_KEYS: readonly Key[] = ['v', 'i', 'b', 'c', 'a', 'r'];
const PERIODS = [4, 6, 8, 3, 4, 6, 8] as const; // every period divides 48 → exact loop
interface Amp { x: number; y: number; k: Key; p: number; ph: number }

const CLOUD: readonly Amp[] = (() => {
  const rand = rng(0xbe11);
  const out: Amp[] = [];
  const taken = (x: number, y: number) => out.some((a) => Math.abs(a.x - x) <= 1 && Math.abs(a.y - y) <= 1);
  // the instrument's envelope: per row, the widest body extent within ±2 rows, plus a 2-px margin (no cloud
  // pixel ever sits inside the fridge or touches it, so it never reads as dirt on the metal)
  const span = (y: number): [number, number] | null => {
    let lo = W, hi = -1;
    for (let yy = y - 2; yy <= y + 2; yy++) for (let xx = 0; xx < W; xx++) if (BODY_GRID.get(xx, yy)) { lo = Math.min(lo, xx); hi = Math.max(hi, xx); }
    return hi < 0 ? null : [lo - 2, hi + 2];
  };
  const nearBody = (x: number, y: number) => { const sp = span(y); return !!sp && x >= sp[0] && x <= sp[1]; };
  const c = OUT.card;
  const inCard = (x: number, y: number) => x >= c.x - 2 && x <= c.x + c.w + 1 && y >= c.restTop - 2 && y <= c.restTop + c.h + 1;
  const { cx, cy, rx, ry, n } = OUT.cloud;
  let guard = 0;
  while (out.length < n && guard++ < 20000) {
    const x = Math.round(cx - rx + rand() * 2 * rx), y = Math.round(cy - ry + rand() * 2 * ry);
    const d2 = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    if (d2 > 1 || rand() > 1 - 0.55 * d2) continue; // denser near the instrument, thinning outward
    if (x < 0 || y < 0 || x >= W || y >= H) continue;
    if (taken(x, y) || nearBody(x, y) || inCard(x, y)) continue;
    out.push({ x, y, k: CLOUD_KEYS[Math.floor(rand() * CLOUD_KEYS.length)], p: PERIODS[Math.floor(rand() * PERIODS.length)], ph: Math.floor(rand() * 48) });
  }
  return out;
})();

function drawCloud(g: Grid, t: number): void {
  for (const a of CLOUD) {
    const s = (t + a.ph) % a.p;
    if (s === 0) g.set(a.x, a.y, 'w');
    else if (s <= 2) g.set(a.x, a.y, a.k);
  }
}

// ── the toast card ──────────────────────────────────────────────────────────────────────────────
/** Rise above the slot per tick (0 = top edge at the slot row, hidden). */
const RISE: readonly number[] = (() => {
  const r = new Array<number>(48).fill(11);
  [1, 3, 6, 9, 11, 12].forEach((v, i) => { r[i] = v; });            // 0–5 rise (1 2 3 3 2 1)
  r[6] = 11;                                                          // 6 land (squash)
  [10, 8, 5, 2, 0, -1].forEach((v, i) => { r[36 + i] = v; });        // 36–41 sink (1 2 3 3 2 1)
  for (let t = 42; t < 48; t++) r[t] = -1;                            // 42–47 inside the box
  return r;
})();

const CARD_TEXT = '-12.4';

/** Draws the card (outline/face/digits) with its top-left at (x, y), size w×h, clipped above row `clipY` (exclusive). */
function drawCard(g: Grid, x: number, y: number, w: number, h: number, clipY: number, digits = true): void {
  const card = new Grid(w, h);
  card.rect(1, 1, w - 2, h - 2, 'p');
  for (let i = 1; i < w - 1; i++) { card.set(i, 0, 'l'); card.set(i, h - 1, 't'); }
  for (let j = 1; j < h - 1; j++) { card.set(0, j, 'l'); card.set(w - 1, j, 't'); }
  // digits, centred; '.' takes one column
  const glyphs = [...CARD_TEXT];
  const widths = glyphs.map((ch) => (ch === '.' ? 1 : 3));
  const tw = widths.reduce((a, b) => a + b, 0) + glyphs.length - 1;
  let tx = Math.floor((w - tw) / 2);
  const ty = Math.floor((h - 5) / 2);
  if (digits) glyphs.forEach((ch, i) => {
    const gl = font3x5.glyphs[ch];
    if (ch === '.') card.set(tx, ty + 4, 'k');
    else card.blit(gl, tx, ty, { recolor: { k: 'k' } });
    tx += widths[i] + 1;
  });
  for (let j = 0; j < h; j++) {
    if (y + j >= clipY) break;
    for (let i = 0; i < w; i++) { const k = card.get(i, j); if (k) g.set(x + i, y + j, k); }
  }
}

function drawToast(g: Grid, t: number): void {
  const r = RISE[t];
  const c = OUT.card, slotY = OUT.slot.y;
  if (r <= 0) return;
  if (t === 6) { drawCard(g, c.x - 1, slotY - r + 1, c.w + 2, c.h - 1, slotY); return; } // squash: wider, 1 shorter, same bottom
  const top = slotY - r;
  const out = top + c.h <= slotY; // fully clear of the slot
  if (out) { drawCard(g, c.x, top, c.w, c.h, slotY); return; }
  // still in the slot: the card squeezes through, as wide as the slot plus 2 px per visible row-pair
  const slotW = OUT.slot.x1 - OUT.slot.x0 + 1;
  const w = Math.min(c.w, slotW + 2 * Math.ceil(r / 1.5));
  const x = c.x + Math.floor((c.w - w) / 2);
  drawCard(g, x, top, w, c.h, slotY, false); // smear frame: moving fast through the slot, no detail
}

// ── pulses and chip light ───────────────────────────────────────────────────────────────────────
// Each line's pulse (2 px/tick, `a` head + `g` tail, as the mini) is timed by its ARRIVAL: outer lines reach the box
// lid, inner lines end in the MXC plate (its underside glows for the arrival tick). They run behind the resting
// card, so the eye sees them leave the top stages and the chip answer below.
const ARRIVE = [41, 39, 40, 42] as const;
const START = PATHS.map((p, k) => ARRIVE[k] - Math.ceil((p.length - 1) / 2));

function drawPulses(g: Grid, t: number): void {
  PATHS.forEach((path, k) => {
    const d = t - START[k];
    if (d < 0 || t > ARRIVE[k]) return;
    const head = Math.min(path.length - 1, d * 2 + 1);
    if (t === ARRIVE[k]) {
      const [ex, ey] = path[path.length - 1];
      if (ey === OUT.slot.y) g.set(ex, ey, 'a');                         // into the box lid
      else g.set(ex, OUT.plates[3].y + 2, 'a');                          // anchored in the MXC underside
      return;
    }
    for (const [i, key] of [[head, 'a'], [head - 1, 'g']] as const) {
      const p = path[i];
      if (!p) continue;
      const under = BODY_GRID.get(p[0], p[1]);
      if (under !== 't' && under !== 'm') continue;                      // hidden inside a plate
      g.set(p[0], p[1], key);
    }
  });
}

/** Halo ring around the window. The hero breathes n → i → r → i constantly; at this size that ring fills most of the
 *  box face and competes with the card, so here it rests at `n` and plays its bright steps only as the answer. */
const HALO_AT: Partial<Record<number, Key>> = { 43: 'r', 44: 'i', 45: 'i' };

function drawChip(g: Grid, t: number): void {
  const w = OUT.window;
  if (t === 42) { g.rect(w.x, w.y, w.w, w.h, 'w'); return; }            // the answer: one white tick
  const halo = HALO_AT[t] ?? 'n';
  for (let x = w.x - 1; x <= w.x + w.w; x++) { g.set(x, w.y - 1, halo); g.set(x, w.y + w.h, halo); }
  for (let y = w.y; y < w.y + w.h; y++) { g.set(w.x - 1, y, halo); g.set(w.x + w.w, y, halo); }
  const swap = Math.floor(t / 6) % 2 === 1;
  const lit: Key | null = t === 43 ? 'w' : t === 44 ? 'g' : t === 45 ? 'a' : null;
  OUT.qubits.forEach(([x, y], i) => g.set(x, y, lit ?? (((i % 2 === 0) !== swap) ? 'v' : 'i')));
}

export const fridgeOut = definePiece({
  id: 'fridge-out',
  size: [W, H],
  ticksPerFrame: 1,
  loopTicks: 48,
  poster: 20,
  maxColours: 16,
  palette: ['k', 'n', 's', 'm', 't', 'l', 'e', 'w', 'p', 'a', 'g', 'v', 'i', 'b', 'c', 'r'],
  alt: 'A quantum computer outputs one number while a cloud of hidden quantum amplitudes flickers behind it.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    const t = ((tick % 48) + 48) % 48;
    drawCloud(g, t);
    g.blit(BODY, 0, 0);
    drawPulses(g, t);
    drawChip(g, t);
    drawToast(g, t);
  },
});

// bloch-inline · the headline sphere (art-spec card 2). Inline in the hero H1 after "Verified".
// 16×16 (→ 64 px) and the `sm` variant 11×11 (→ 44 px) for the mobile headline.
//
// The orb, equator, axis and specular are hand-placed ASCII (parts.ts). The state vector is re-rasterised
// every frame from float geometry, never a rotated bitmap: (θ, φ) is projected with an orthographic camera
// tilted 19° down onto the north pole, drawn one pixel per major-axis step (no doubles; see shaftPoints),
// capped with a white tip that never leaves the glass, and (16×16 only) given a lilac sub-pixel lead pixel on
// the side the tip is moving toward, plus a lilac smear pixel where the tip jumps 2 px in the fast south drive.
// Depth: the back equator and the axis sit behind the shaft; the front equator and the specular sit on the
// front glass and pass in front of it; they also cover the tip when the tip is on the far hemisphere (depth < 0).

import { KEYS, definePiece, project, type Grid, type Key, type Part } from '../../engine';
import { BASE11, BASE16, FRONT11, FRONT16, GLASS11, GLASS16 } from './parts';
import { LOOP, OUTCOMES, PERIOD, POSTER, motionAt, pose, wrap, type Pose } from './timeline';

interface Spec {
  base: Part; front: Part; glass: Part;
  cx: number; cy: number;            // sphere centre = vector origin
  L: number;                         // vector length in px: the tip lands on the pixel just inside the rim
  tilt: number;                      // camera tilt (degrees) for the vector projection
  north: readonly [number, number];  // pole dots, one px outside the rim
  south: readonly [number, number];
  rings: readonly [number, number];  // burst radii on ticks 73 and 74
  lead: boolean;                     // sub-pixel lead pixel
}

const MAIN: Spec = {
  base: BASE16, front: FRONT16, glass: GLASS16,
  cx: 8, cy: 8, L: 5, tilt: 19, north: [8, 1], south: [8, 15], rings: [2, 3], lead: true,
};

const SM: Spec = {
  base: BASE11, front: FRONT11, glass: GLASS11,
  cx: 5, cy: 5, L: 3, tilt: 19, north: [5, 0], south: [5, 10], rings: [1, 2], lead: false,
};

const RIM = new Set<Key>(['c', 'b', 'i']);
/** The measured pole's dot turns violet (the state colour) while the result holds: a readout. */
const READOUT: Key = 'v';
/** Sub-pixel lead threshold (px of progress past the tip pixel's centre along the motion). */
const LEAD_AT = 0.1;

interface Geo { rim: Array<[number, number]>; interior: Set<number>; front: Array<[number, number, Key]>; frontSet: Set<number> }

function keyAt(p: Part, x: number, y: number): Key | null {
  const v = p.data[y * p.w + x];
  return v ? KEYS[v - 1] : null;
}

function geometry(s: Spec): Geo {
  const rim: Array<[number, number]> = [], front: Array<[number, number, Key]> = [];
  const interior = new Set<number>();
  for (let y = 0; y < s.glass.h; y++) for (let x = 0; x < s.glass.w; x++) {
    const k = keyAt(s.glass, x, y);
    if (k) { if (RIM.has(k)) rim.push([x, y]); else interior.add(y * s.glass.w + x); }
    const f = keyAt(s.front, x, y);
    if (f) front.push([x, y, f]);
  }
  return { rim, interior, front, frontSet: new Set(front.map(([x, y]) => y * s.glass.w + x)) };
}

const GEO_MAIN = geometry(MAIN), GEO_SM = geometry(SM);

/** Float screen position of the tip. */
function tipAt(s: Spec, theta: number, phi: number): [number, number] {
  const [x, y] = project(theta, phi, s.tilt, 0);
  return [s.cx + s.L * x, s.cy + s.L * y];
}

/** The shaft: one pixel per step along the major axis (so no doubles by construction), minor-axis ties rounded
 *  toward the origin. Bresenham's tie-breaking gave 1-2-1 kinks on the short 4-5 px vectors; this keeps the
 *  violet runs regular (e.g. 2-2 then the tip on the 2:1 poster slope). */
function shaftPoints(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
  const dx = x1 - x0, dy = y1 - y0, n = Math.max(Math.abs(dx), Math.abs(dy));
  const toward0 = (v: number) => Math.sign(v) * Math.ceil(Math.abs(v) - 0.5 - 1e-9);
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) pts.push(n ? [x0 + toward0((dx * i) / n), y0 + toward0((dy * i) / n)] : [x0, y0]);
  return pts;
}

const DIRS: ReadonlyArray<readonly [number, number]> = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

/** Midpoint-circle ring pixels. */
function ringPixels(cx: number, cy: number, r: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  let x = r, y = 0, err = 1 - r;
  while (x >= y) {
    out.push([cx + x, cy + y], [cx - x, cy + y], [cx + x, cy - y], [cx - x, cy - y], [cx + y, cy + x], [cx - y, cy + x], [cx + y, cy - x], [cx - y, cy - x]);
    y++;
    if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
  }
  return out;
}

interface Vector { pose: Pose; tip: [number, number]; front: boolean; shaft: Array<[number, number]>; lead: [number, number] | null; smear: [number, number] | null }

/** The shaft for a pose. The tip rides the inside of the glass: if rounding puts it on the rim (narrow rows near
 *  the poles, the 9-px orb's shoulders), it steps back along the shaft, so the vector never leaves the sphere. */
function shaftFor(s: Spec, geo: Geo, p: Pose): Array<[number, number]> {
  const [fx, fy] = tipAt(s, p.theta, p.phi);
  const shaft = shaftPoints(s.cx, s.cy, Math.round(fx), Math.round(fy));
  while (shaft.length > 1 && !geo.interior.has(shaft[shaft.length - 1][1] * s.glass.w + shaft[shaft.length - 1][0])) shaft.pop();
  return shaft;
}

/** Where the vector's pixels go on this tick (pure). */
function vectorAt(tick: number, s: Spec, geo: Geo): Vector {
  const p: Pose = pose(tick);
  const lt = wrap(tick) % LOOP, w = s.glass.w;
  const [fx, fy] = tipAt(s, p.theta, p.phi);
  const shaft = shaftFor(s, geo, p);
  const [tipX, tipY] = shaft[shaft.length - 1];
  const onShaft = new Set(shaft.map(([x, y]) => y * w + x));
  let lead: [number, number] | null = null;
  // the sub-pixel lead: a lilac pixel on the side the tip moves toward, shown only once the true (float) tip has
  // travelled past its pixel's centre, so two frames that round to the same pixel still differ
  if (s.lead && p.moving) {
    const a = motionAt(lt - 0.5, p.outcome), b = motionAt(lt + 0.5, p.outcome);
    const [ax, ay] = tipAt(s, a.theta, a.phi), [bx, by] = tipAt(s, b.theta, b.phi);
    const mx = bx - ax, my = by - ay, speed = Math.hypot(mx, my);
    const progress = speed ? ((fx - tipX) * mx + (fy - tipY) * my) / speed : 0;
    if (speed > 0.35 && progress > LEAD_AT) {
      // the octant nearest the motion, else the nearer of its two neighbours; never on the shaft, the rim or the
      // front glass (the glint and the front equator stay on top), and never tucked into the shaft's stair corner
      // (that reads as a thick, blobby head, not a lead)
      const ang = Math.atan2(my, mx) / (Math.PI / 4), o = Math.round(ang);
      for (const oct of [o, ang > o ? o + 1 : o - 1, ang > o ? o - 1 : o + 1]) {
        const [dx, dy] = DIRS[((oct % 8) + 8) % 8];
        const lx = tipX + dx, ly = tipY + dy, li = ly * w + lx;
        const hugs = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ex, ey]) =>
          onShaft.has((ly + ey) * w + lx + ex) && !(lx + ex === tipX && ly + ey === tipY));
        if (geo.interior.has(li) && !onShaft.has(li) && !geo.frontSet.has(li) && !hugs) { lead = [lx, ly]; break; }
      }
    }
  }
  // smear: where the tip jumps two pixels in one tick (the fast core of the south drive, 120° in 9 frames), a lilac
  // pixel fills the gap on its path, the pixel-art motion blur, so the jump reads as speed rather than a skip
  let smear: [number, number] | null = null;
  const prev = pose(tick - 1);
  if (s.lead && p.moving && prev.moving) {
    const ps = shaftFor(s, geo, prev), [px, py] = ps[ps.length - 1];
    if (Math.max(Math.abs(px - tipX), Math.abs(py - tipY)) >= 2) {
      const mx = Math.round((px + tipX) / 2), my = Math.round((py + tipY) / 2), mi = my * w + mx;
      if (geo.interior.has(mi) && !onShaft.has(mi) && !geo.frontSet.has(mi)) smear = [mx, my];
    }
  }
  const front = project(p.theta, p.phi, s.tilt, 0)[2] >= 0;   // tip on the near hemisphere
  return { pose: p, tip: [tipX, tipY], front, shaft, lead, smear };
}

function draw(tick: number, g: Grid, s: Spec, geo: Geo): void {
  const { pose: p, tip: [tipX, tipY], front, shaft, lead, smear } = vectorAt(tick, s, geo);
  const onShaft = new Set(shaft.map(([x, y]) => y * g.w + x));

  // 1. the still picture: orb, back equator, axis, front equator, specular
  g.blit(s.base, 0, 0);
  // 2. the shaft
  for (const [x, y] of shaft) g.set(x, y, 'v');
  // 3. the tip; then the front glass (front equator + specular) back over the shaft, and over the tip too when the
  //    tip is on the far hemisphere (a near-side tip is on the surface itself, in front of nothing)
  g.set(tipX, tipY, 'w');
  for (const [x, y, k] of geo.front) if (!(front && x === tipX && y === tipY)) g.set(x, y, k);
  // 4. the sub-pixel lead and the smear
  if (lead) g.set(lead[0], lead[1], 'r');
  if (smear) g.set(smear[0], smear[1], 'r');
  // 5. measurement: one white rim tick, then an azure ring burst around the tip
  if (p.phase === 'flash') for (const [x, y] of geo.rim) g.set(x, y, 'w');
  if (p.phase === 'burst' && p.ring !== undefined) {
    // centred on the tip, nudged inward only if the ring would leave the canvas (the south ring at r = 3)
    const r = s.rings[p.ring], ry = Math.max(r, Math.min(g.h - 1 - r, tipY));
    for (const [x, y] of ringPixels(tipX, ry, r)) if (!onShaft.has(y * g.w + x)) g.set(x, y, 'a');
  }
  // 6. pole dots, drawn last; the measured one reads out (violet) from the burst until the drive starts
  const lit = p.phase === 'burst' || p.phase === 'hold' ? p.outcome : null;
  g.set(s.north[0], s.north[1], lit === 'N' ? READOUT : 'k');
  g.set(s.south[0], s.south[1], lit === 'S' ? READOUT : 'k');
}

/** QA helper: the vector's pixels on a tick (tip, shaft, lead) and the glass interior they must stay inside. */
export function vectorPixels(tick: number, variant?: string): Vector & { interior: ReadonlySet<number>; width: number; centre: [number, number]; poles: [readonly [number, number], readonly [number, number]] } {
  const s = variant === 'sm' ? SM : MAIN, geo = variant === 'sm' ? GEO_SM : GEO_MAIN;
  return { ...vectorAt(tick, s, geo), interior: geo.interior, width: s.glass.w, centre: [s.cx, s.cy], poles: [s.north, s.south] };
}

export const blochInline = definePiece({
  id: 'bloch-inline',
  size: [16, 16],
  variants: { sm: [11, 11] },
  ticksPerFrame: 1,
  loopTicks: LOOP,
  period: PERIOD,
  poster: POSTER,
  maxColours: 12,
  palette: ['k', 'm', 't', 'l', 'w', 'b', 'c', 'i', 'a', 'g', 'r', 'v'],
  alt: '',
  cache: 'loop',
  states: ['precess', 'measure', 'hold-0', 'hold-1', 'rabi'],
  /** For QA and any label that wants it: what the qubit is doing on this tick. */
  state(tick: number) {
    const p = pose(tick);
    if (p.phase === 'precess') return 'precess';
    if (p.phase === 'flash' || p.phase === 'burst') return 'measure';
    if (p.phase === 'hold') return p.outcome === 'N' ? 'hold-0' : 'hold-1';
    return 'rabi';
  },
  exports: { outcomes: OUTCOMES },
  frame(tick: number, g: Grid, _io, variant?: string) {
    if (variant === 'sm') draw(tick, g, SM, GEO_SM);
    else draw(tick, g, MAIN, GEO_MAIN);
  },
});

export default blochInline;

// The qubit creature: one character sheet shared by qubit-pair, walkers and qubit-walker (art-spec card 3).
//
// Anatomy (md, 12×14 box; sm, 10×11 box). The box's bottom row is the ground contact row of the feet.
//   - a glass orb (10×10 md / 8×8 sm): `g` fill, `w` 2×1 specular at 10 o'clock, a form-shadow crescent
//     in `u` on the lower right, and a selective rim that walks lit → mid → shadow around the silhouette
//     (Alice c/b/i, Bob r/v/n, neutral c/t/m). Light is always upper left, so mirroring a creature
//     never mirrors its shading: only the face, antenna and feet are mirrored.
//   - two `k` eye pixels, low on the face (baby-schema proportions); a blink hides them for one tick.
//   - a 1×3 Bloch antenna in `v` with a `w` tip that tilts left / up / right by moving the tip 1 px.
//   - two 2×2 `s` feet tucked under the orb (drawn behind it, so they read as nubs).
//
// Everything is hand-authored ASCII (symbolic keys) recoloured per creature at module load, so frame()
// only blits precomputed Parts and sets a handful of pixels.

import { part, type Grid, type Key, type Part } from '../../engine';

/** Rim ramp: lit (upper left), mid, shadow (lower right). */
export type Rim = readonly [lit: Key, mid: Key, shadow: Key];
export const RIM_ALICE: Rim = ['c', 'b', 'i'];
export const RIM_BOB: Rim = ['r', 'v', 'n'];
export const RIM_NEUTRAL: Rim = ['c', 't', 'm'];

export type Size = 'md' | 'sm';
export type Body = 'normal' | 'squash' | 'stretch';

// Symbolic orb maps. L/M/D = rim lit/mid/shadow, F = glass fill, S = form shadow, W = specular.
// Every map is authored with its bottom row as the orb's lowest row; orbs are placed bottom-aligned.
const ORBS: Record<Size, Record<Body, string>> = {
  md: {
    normal: `
      ...LLMM...
      .FLFFFFMM.
      .LWWFFFFM.
      LFFFFFFFFM
      LFFFFFFFFM
      MFFFFFFFSD
      MFFFFFFSSD
      .MFFFFSSD.
      .MMFSSSDD.
      ...DDDD...`,
    squash: `
      ...LLLLMM...
      .LLFFFFFFMM.
      LFWWFFFFFFFM
      LFFFFFFFFFFD
      MFFFFFFFFFSD
      MFFFFFFFFSSD
      MFFFFFFSSSSD
      .MMFFSSSSDD.
      ...MDDDDD...`,
    stretch: `
      ..LLLM..
      .LFFFFM.
      .LWWFFM.
      LFFFFFFM
      LFFFFFFD
      MFFFFFFD
      MFFFFFSD
      MFFFFSSD
      .MFFSSD.
      .MMSSDD.
      ..MDDD..`,
  },
  sm: {
    normal: `
      ..LLLM..
      .LWWFFM.
      LFFFFFFM
      LFFFFFFD
      MFFFFFSD
      MFFFFSSD
      .MFSSSD.
      ..MDDD..`,
    squash: `
      ..LLLLM...
      .LWWFFFFM.
      LFFFFFFFFD
      MFFFFFFFSD
      MFFFFFFSSD
      .MFFSSSSD.
      ..MDDDDD..`,
    stretch: `
      ..LLM..
      .LWFFM.
      LFFFFFM
      LFFFFFD
      MFFFFFD
      MFFFFSD
      MFFFSSD
      .MFSSD.
      ..MDD..`,
  },
};

/** Box geometry per size. All coordinates are relative to the creature box's top-left. */
export const BOX = {
  md: { w: 12, h: 14, orbX: { normal: 1, squash: 0, stretch: 2 }, orbBottom: 12, eyeRow: 9, eyeL: 4, eyeR: 7, footY: 12, feet: [3, 7], antL: 5, stalk: 2 },
  sm: { w: 10, h: 11, orbX: { normal: 1, squash: 0, stretch: 1 }, orbBottom: 9, eyeRow: 6, eyeL: 3, eyeR: 6, footY: 9, feet: [2, 6], antL: 4, stalk: 1 },
} as const;

function compile(src: string, rim: Rim, flash: boolean, flashShadow: Key, name: string): Part {
  // flash: the lit and mid rim go white; the shadow rim lifts to the creature's light key so the
  // silhouette survives one tick on paper (a full white rim would vanish into the card).
  const map: Record<string, string> = {
    L: flash ? 'w' : rim[0], M: flash ? 'w' : rim[1], D: flash ? flashShadow : rim[2],
    F: 'g', S: 'u', W: 'w', '.': '.',
  };
  const rows = src.split('\n').map((r) => r.trim()).filter(Boolean).map((r) => [...r].map((ch) => map[ch]).join(''));
  return part(rows, name);
}

/** Antenna tip bead per creature: a light key that reads on paper and on ink (white only when flashing). */
export const TIP: Record<string, Key> = { alice: 'a', bob: 'r', neutral: 'a' };
const RIMS: Record<string, Rim> = { alice: RIM_ALICE, bob: RIM_BOB, neutral: RIM_NEUTRAL };
export type Who = 'alice' | 'bob' | 'neutral';

const PARTS = new Map<string, Part>();
for (const size of ['md', 'sm'] as const) for (const body of ['normal', 'squash', 'stretch'] as const) {
  for (const who of Object.keys(RIMS)) for (const flash of [false, true]) {
    const key = `${size}/${body}/${who}/${flash ? 1 : 0}`;
    PARTS.set(key, compile(ORBS[size][body], RIMS[who], flash, TIP[who], key));
  }
}
function orbPart(size: Size, body: Body, who: Who, flash: boolean): Part {
  return PARTS.get(`${size}/${body}/${who}/${flash ? 1 : 0}`)!;
}

export interface Foot { dx: number; lift: number }

export interface Pose {
  who: Who;
  size?: Size;
  /** Which way the creature faces: 1 right, -1 left, 0 the viewer. Moves the eyes 1 px and mirrors the antenna base. */
  face?: -1 | 0 | 1;
  /** Antenna base on the box's right of centre (Bob, or anyone facing left). Default: face < 0. */
  mirror?: boolean;
  /** Extra eye offset (looking somewhere), applied after `face`. */
  look?: [number, number];
  eyes?: 'open' | 'closed';
  /** Eye height in px (1 dot, 2 tall oval). */
  eyeH?: number;
  /** Antenna tip offset: -1 left, 0 up, 1 right. */
  tip?: -1 | 0 | 1;
  /** Tip colour override (e.g. a dimmer key for the far side of a precession). */
  tipKey?: Key;
  /** Stalk pixels under the tip (default 2 md / 1 sm). Fewer = the antenna is dragged down by a fast rise. */
  stalk?: number;
  /** Tip drawn beside the stalk top instead of above it (antenna swept flat). */
  tipFlat?: boolean;
  body?: Body;
  /** Whole creature lifted off the ground (hop), in art px; positive = up. */
  air?: number;
  /** Orb raised relative to the feet (walk bob), in art px; positive = up. */
  bob?: number;
  /** Orb shifted horizontally relative to the feet (lean), in art px. */
  lean?: number;
  /** Per-foot offsets [left foot, right foot]; `lift` raises a foot off the ground. */
  feet?: [Foot, Foot];
  flash?: boolean;
  /**
   * Foot colours for feet[0] and feet[1], drawn in that order (so feet[1] is in front when they overlap).
   * Default [`m`, `s`]: the box-left foot catches the upper-left light. Pieces on ink raise both a step.
   */
  footKeys?: readonly [Key, Key];
  /** Optional blush key under the eyes (charm accent). */
  blush?: Key | null;
  /** Mouth: none, a small smile, or an open "o". */
  mouth?: 'none' | 'smile' | 'o';
}

/**
 * Draw a creature with its box's top-left at (x, y). The box's bottom row is the feet's contact row.
 * Pure: depends only on its arguments.
 */
export function drawCreature(g: Grid, x: number, y: number, p: Pose): void {
  const size = p.size ?? 'md';
  const B = BOX[size];
  const body = p.body ?? 'normal';
  const face = p.face ?? 0;
  const air = p.air ?? 0;
  const bob = p.bob ?? 0;
  const lean = p.lean ?? 0;
  const orb = orbPart(size, body, p.who, !!p.flash);
  const oy = y + B.orbBottom - (orb.h - 1) - air - bob;   // orb top row
  const ox = x + B.orbX[body] + lean;

  // feet first (behind the orb)
  const feet = p.feet ?? [{ dx: 0, lift: 0 }, { dx: 0, lift: 0 }];
  for (let i = 0; i < 2; i++) {
    const fx = x + B.feet[i] + feet[i].dx;
    const fy = y + B.footY - air - feet[i].lift;
    g.rect(fx, fy, 2, 2, (p.footKeys ?? FOOT_PAPER)[i]);
  }

  g.blit(orb, ox, oy);

  // face: eyes sit a fixed height above the orb's bottom so squash/stretch keep the face low and round
  const cx = x + lean;                            // box-relative columns are offset by lean only
  const eyeY = y + B.eyeRow - air - bob + (body === 'stretch' ? -1 : 0) + (p.look?.[1] ?? 0);
  const spread = body === 'squash' ? 1 : 0;
  const ex = face + (p.look?.[0] ?? 0);
  if ((p.eyes ?? 'open') === 'open') {
    for (let i = 0; i < (p.eyeH ?? (size === 'md' ? 2 : 1)); i++) {
      g.set(cx + B.eyeL - spread + ex, eyeY - i, 'k');
      g.set(cx + B.eyeR + spread + ex, eyeY - i, 'k');
    }
  }
  if (p.blush) {
    g.set(cx + B.eyeL - 1 - spread + ex, eyeY + 1, p.blush);
    g.set(cx + B.eyeR + 1 + spread + ex, eyeY + 1, p.blush);
  }
  if (p.mouth === 'smile') {
    const mx = cx + Math.floor((B.eyeL + B.eyeR) / 2) + ex;
    g.set(mx, eyeY + 1, 'k'); g.set(mx + 1, eyeY + 1, 'k');
  } else if (p.mouth === 'o') {
    const mx = cx + Math.floor((B.eyeL + B.eyeR) / 2) + ex;
    g.set(mx, eyeY + 1, 'k'); g.set(mx + 1, eyeY + 1, 'k');
    g.set(mx, eyeY + 2, 'k'); g.set(mx + 1, eyeY + 2, 'k');
  }

  // antenna: base column mirrors with facing (left of centre when facing right/viewer-left, right when facing left)
  const base = cx + ((p.mirror ?? face < 0) ? B.w - 1 - B.antL : B.antL);
  const top = oy;                                 // orb top row
  const stalk = p.stalk ?? B.stalk;
  for (let i = 1; i <= stalk; i++) g.set(base, top - i, 'v');
  const tipKey = p.tipKey ?? (p.flash ? 'w' : TIP[p.who]);
  if (p.tipFlat) g.set(base + (p.tip || -1), top - stalk, tipKey);
  else g.set(base + (p.tip ?? 0), top - stalk - 1, tipKey);
}

/** Foot ramps: [lit foot, shaded foot]. */
export const FOOT_PAPER: readonly [Key, Key] = ['m', 's'];
export const FOOT_INK: readonly [Key, Key] = ['t', 'm'];

/** Default standing feet. */
export const FEET_STAND: [Foot, Foot] = [{ dx: 0, lift: 0 }, { dx: 0, lift: 0 }];

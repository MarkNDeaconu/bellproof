// The single source of truth for every colour drawn in pixel art.
// design-spec.md §1.7. CSS tokens (styles/tokens.css) are checked against this table by scripts/validate.ts.

export const PALETTE = {
  k: '#0E1424', // ink
  n: '#321B63', // night
  s: '#2A3655', // navy
  m: '#475069', // slate
  t: '#7F89A2', // steel
  l: '#B9C2D6', // silver
  e: '#E3E8F2', // platinum
  h: '#DEDBD3', // hairline
  p: '#F4F2ED', // paper
  w: '#FFFFFF', // white
  v: '#7202BC', // violet   ramp 5
  i: '#6331DF', // indigo   ramp 4
  b: '#2F5BEA', // blue     ramp 3
  c: '#5E87F1', // cornflower ramp 2
  a: '#8FAEFF', // azure    ramp 1
  u: '#C9D5FA', // mist     ramp 0
  g: '#D7E3FF', // glow
  r: '#C5B0F6', // lilac
  R: '#C0105E', // raspberry (alert)
  F: '#F9E1EC', // raspberry tint
} as const;

export type Key = keyof typeof PALETTE;
export const TRANSPARENT = '.';
export const KEYS = Object.keys(PALETTE) as Key[];
export const KEY_INDEX: Record<string, number> = Object.fromEntries(KEYS.map((k, i) => [k, i + 1]));

export const NAMES: Record<Key, string> = {
  k: 'ink', n: 'night', s: 'navy', m: 'slate', t: 'steel', l: 'silver', e: 'platinum', h: 'hairline', p: 'paper', w: 'white',
  v: 'violet', i: 'indigo', b: 'blue', c: 'cornflower', a: 'azure', u: 'mist', g: 'glow', r: 'lilac', R: 'raspberry', F: 'raspberry-tint',
};

export const RAMPS = {
  metal: 'ksmtlew',
  glow: 'knvibcagw',
  violetGlow: 'nvirg',
  alert: 'RF',
} as const;

export function hexToRgba(hex: string): [number, number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 255];
}

export const RGBA: Record<Key, [number, number, number, number]> = Object.fromEntries(
  KEYS.map((k) => [k, hexToRgba(PALETTE[k])]),
) as Record<Key, [number, number, number, number]>;

/** Index (1-based, as stored in Grid) → RGBA, index 0 = transparent. */
export const RGBA_BY_INDEX: Uint8Array = (() => {
  const out = new Uint8Array((KEYS.length + 1) * 4);
  KEYS.forEach((k, i) => out.set(RGBA[k], (i + 1) * 4));
  return out;
})();

export function isKey(ch: string): ch is Key {
  return ch in PALETTE;
}

/** CSS custom properties that must agree with the palette (design-spec §1). */
export const CSS_TOKENS: Record<string, string> = {
  '--ink': PALETTE.k,
  '--paper': PALETTE.p,
  '--hairline': PALETTE.h,
  '--hairline-dark': PALETTE.s,
  '--text-soft': PALETTE.m,
  '--on-dark-body': PALETTE.l,
  '--on-dark-muted': PALETTE.t,
  '--on-dark-accent': PALETTE.a,
  '--ramp-0': PALETTE.u,
  '--ramp-1': PALETTE.a,
  '--ramp-2': PALETTE.c,
  '--ramp-3': PALETTE.b,
  '--ramp-4': PALETTE.i,
  '--ramp-5': PALETTE.v,
  '--ramp-6': PALETTE.n,
  '--alert': PALETTE.R,
  '--alert-tint': PALETTE.F,
};

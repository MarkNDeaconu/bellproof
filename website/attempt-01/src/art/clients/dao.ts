// client-dao · a DAO treasury vault (round door with a violet bell seal, a slot in its lid) beside a milestone
// flagpole. Loop: the certificate falls into the slot (46–1), lands half in with a squash (2) and the door rim
// glints (3–9) while the milestone flag runs up the pole 2 px per tick (2–11) and flutters; the slot swallows the
// certificate (18–19); the flag slides back down 1 px per tick (26–45); the next certificate materialises above the
// slot inside a twinkle (36–39) and hovers.

import { definePiece, part, type Grid } from '../../engine';
import { GROUND, LOOP, POSTER, SIZE, glint, mod, shadow } from './shared';

const VX = 5;                    // vault left edge
const VW = 24, VH = 25;
const VY = GROUND - VH;          // vault top row
const X1 = VX + VW - 1, Y1 = VY + VH - 1;
const SLOT_X = VX + 7, SLOT_W = 10;
const SLOT_Y = VY + 2;           // the slot row in the lid

/** Round door 16×16: lit outer rim and bevel on the upper left, shadowed on the lower right. */
const DOOR = part(`
  .....eeeeee.....
  ...eewwwwwwet...
  ..ewwlllllllts..
  .ewllllllllllms.
  .ewllllllllllms.
  ewllllllllllllms
  ewllllllllllllms
  ewllllllllllllms
  ewllllllllllllms
  ewllllllllllllms
  ewllllllllllllms
  .ewllllllllllms.
  .tlllllllllllms.
  ..tllllllllmms..
  ...ssmmmmmmss...
  .....ssssss.....
`, 'door');
const DX = VX + 4, DY = VY + 6;  // door top-left

/** The bell seal: a violet bell (crown, shoulders, flared skirt, rim, clapper) lit from the upper left. */
const BELL = part(`
  ...v...
  ..rvv..
  .rvvvn.
  .rvvvn.
  .vvvvn.
  vvvvvnn
  ...n...
`, 'bell');

function drawVault(g: Grid): void {
  // lid (seen slightly from above): outline, lit face, the slot with its shadowed far lip
  for (let x = VX + 1; x < X1; x++) g.set(x, VY, 's');
  for (let y = VY + 1; y <= VY + 3; y++) {
    g.set(VX, y, 's'); g.set(X1, y, 's');
    for (let x = VX + 1; x < X1; x++) g.set(x, y, y === VY + 3 ? 'l' : x < VX + 15 ? 'e' : 'l');
  }
  for (let x = SLOT_X; x < SLOT_X + SLOT_W; x++) { g.set(x, SLOT_Y, 'k'); g.set(x, SLOT_Y + 1, 'm'); }
  // front: lit left edge, steel body, slate right edge, a slate kick plate and two feet
  for (let y = VY + 4; y < Y1; y++) {
    g.set(VX, y, 's'); g.set(X1, y, 's');
    for (let x = VX + 1; x < X1; x++) g.set(x, y, x === VX + 1 ? 'l' : x >= X1 - 2 || y === Y1 - 1 ? 'm' : 't');
  }
  for (let x = VX + 1; x < X1; x++) g.set(x, Y1, 's');
  // corner rivets
  for (const [x, y] of [[VX + 2, VY + 5], [X1 - 3, VY + 5], [VX + 2, Y1 - 3], [X1 - 3, Y1 - 3]]) { g.set(x, y, 'e'); g.set(x, y + 1, 'm'); }
  // hinges between the box edge and the door
  for (const y of [DY + 3, DY + 10]) { g.rect(VX + 2, y, 2, 3, 's'); g.set(VX + 2, y, 'l'); }
  g.blit(DOOR, DX, DY);
  g.blit(BELL, DX + 4, DY + 4);
}

/** Mini certificate 8×8: paper card with text lines and a violet seal. */
const CERT = part(`
  ssssssss
  sppppppl
  smmmmpps
  spppppps
  smmmpvvs
  sppppvvs
  sppppppl
  ssssssss
`, 'cert');

const REST = SLOT_Y - 4;         // half in: the lower 4 rows are inside the vault
const HOVER = REST - 12;
/** Certificate top row by tick; null while it is inside the vault. */
function certY(t: number): number | null {
  if (t >= 38 && t < 46) return HOVER - (t >= 41 && t <= 43 ? 1 : 0);   // materialises at 38, bobs once
  if (t >= 46) return HOVER + (t === 46 ? 1 : 3);                         // falls with spacing 1, 2,
  if (t < 2) return HOVER + (t === 0 ? 6 : 10);                           // 3, 4,
  if (t < 18) return REST;                                                // lands at 2, sticks half in
  if (t < 20) return REST + (t - 17) * 4;                                 // swallowed 4 px per tick
  return null;
}

function drawCert(g: Grid, t: number): void {
  const y = certY(t);
  if (y === null) return;
  const squash = t === 2;        // impact: one text row dropped (8×7)
  for (let r = 0; r < CERT.h; r++) {
    const sr = squash && r >= 3 ? r + 1 : r;
    const yy = y + r + (squash ? 1 : 0);
    if (sr >= CERT.h || yy >= SLOT_Y) continue;   // rows at or below the slot are inside the vault
    for (let c = 0; c < CERT.w; c++) {
      const v = CERT.data[sr * CERT.w + c];
      if (v) g.data[yy * g.w + SLOT_X + 1 + c] = v;
    }
  }
}

// flagpole: 2 px (lit + shadow), white finial, a small foot
const PX = X1 + 6;
const POLE_TOP = VY - 8;
const FLAG_TOP = POLE_TOP + 1, FLAG_LOW = FLAG_TOP + 20;

function flagY(t: number): number {
  if (t < 2) return FLAG_LOW;
  if (t < 12) return FLAG_LOW - (t - 1) * 2;    // up 2 px per tick, at the top on tick 11
  if (t < 26) return FLAG_TOP;
  if (t < 46) return FLAG_TOP + (t - 25);       // back down 1 px per tick
  return FLAG_LOW;
}

/** Milestone flag 8×6: paper with a violet check, shade ripple and a fly end that flutters. */
const FLAG_A = part(`
  wpppppl.
  pppppvlt
  ppppvplt
  pvpvpplt
  ppvppplt
  tttttt..
`, 'flag-a');
const FLAG_B = part(`
  wppppppl
  pppppvpt
  ppppvplt
  pvpvpplt
  ppvpplt.
  ttttt...
`, 'flag-b');

function drawFlag(g: Grid, t: number): void {
  for (let y = POLE_TOP; y < GROUND; y++) { g.set(PX, y, 'l'); g.set(PX + 1, y, 's'); }
  g.set(PX, POLE_TOP - 1, 'w'); g.set(PX + 1, POLE_TOP - 1, 'e');
  g.rect(PX - 1, GROUND - 2, 4, 2, 's'); g.set(PX - 1, GROUND - 2, 'l');
  const flutter = t >= 12 && t < 26 && mod(t, 6) >= 3;
  g.blit(flutter ? FLAG_B : FLAG_A, PX + 2, flagY(t));
}

/** Door rim glint after the certificate lands: a white pixel runs along the lit upper-left rim. */
const RIM: ReadonlyArray<readonly [number, number]> = [[0, 9], [0, 7], [1, 4], [2, 2], [4, 1], [6, 0], [9, 0]];
function drawRimGlint(g: Grid, t: number): void {
  const i = t - 3;
  if (i < 0 || i >= RIM.length) return;
  const [c, r] = RIM[i];
  g.set(DX + c, DY + r, 'w');
}

export const clientDao = definePiece({
  id: 'client-dao',
  size: SIZE,
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 12,
  palette: ['k', 's', 'm', 't', 'l', 'e', 'w', 'p', 'v', 'r', 'n', 'a'],
  alt: 'A DAO treasury vault with a milestone flag that rises when a mini certificate drops in.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    const t = mod(tick, LOOP);
    shadow(g, VX + 1, X1 - 1);
    shadow(g, PX - 2, PX + 3);
    drawFlag(g, t);
    drawVault(g);
    drawRimGlint(g, t);
    drawCert(g, t);
    glint(g, t, 36, SLOT_X + 4, HOVER + 3);      // the next certificate materialises inside a twinkle (36–39)
  },
});

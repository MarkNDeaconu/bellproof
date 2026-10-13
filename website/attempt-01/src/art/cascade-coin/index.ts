// cascade-coin · tokens on a conveyor. art-spec card 14, design-spec §5.4 B.
// A wrong ΔE enters the drug pipeline as one small token. At every stage the section's conveyor passes under, one
// more token drops onto the stack: the cost grows, the tower wobbles at clinical trials, then it dissolves.
//
// 32×24, cache 'none'. Inputs (card): stack 1..5, wobble, belt. Inputs (added for the section): age, fade, travel.
// `mode: 'story'` plays the whole cascade in place from the shared timeline (harness, sheets, small layouts).

import { definePiece, type Grid, type PieceIO } from '../../engine';
import { BOLT, ROLLER, TOKEN, TOKEN_PRESSED, TOKEN_SMEAR, TOKEN_SQUASH, TOKEN_TOP } from './parts';
import { cascadeAt, cascadeTicks, landAge, MAX_STACK, restY, STOPS, STORY, type CascadeInputs } from './timeline';

export { cascadeAt, cascadeTicks, landAge, restY, STORY, STOPS, MAX_STACK } from './timeline';
export type { CascadeOpts, CascadeFrame, CascadeInputs } from './timeline';

const W = 32, H = 24;
const STACK_X = 12;              // tokens occupy x 12–19
const BELT_Y = 20;               // belt rows 20–23
const STORY_TICKS = cascadeTicks(STORY);   // 240
/** Story ticks are offset so tick 0 (the poster) is the stack-3 hold with the belt still, the card's poster, in
 *  both modes. Token 3 lands at story tick 90; its glint ends at 94; the belt starts again at 110. */
const STORY_OFFSET = 100;
const storyAt = (tick: number) => cascadeAt((tick + STORY_OFFSET) % STORY_TICKS, STORY);

const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v !== '' && !isNaN(Number(v)) ? Number(v) : d);
const bool = (v: unknown): boolean => v === true || v === 1 || v === 'true' || v === '1';

function readInputs(tick: number, io: PieceIO): CascadeInputs {
  if (io.mode === 'story') return storyAt(tick).inputs;
  return {
    stack: Math.max(0, Math.min(MAX_STACK, Math.round(num(io.stack, 3)))),
    age: Math.max(0, Math.floor(num(io.age, 99))),
    wobble: bool(io.wobble),
    belt: bool(io.belt),
    travel: Math.floor(num(io.travel, -1)),
    fade: Math.max(0, Math.min(4, Math.round(num(io.fade, 4)))),
  };
}

/** The conveyor: lit top run (`l`), slate body (`m`), navy underside (`s`). Tread seams (`t`) every 4 px run down
 *  the top run and body as one 3-px cluster and scroll right; two navy rollers turn with the belt. */
function drawBelt(g: Grid, phase: number): void {
  for (let x = 4; x < W - 4; x++) {
    const seam = ((x - phase) & 3) === 0;
    g.set(x, BELT_Y, seam ? 't' : 'l');
    g.set(x, BELT_Y + 1, seam ? 't' : 'm');
    g.set(x, BELT_Y + 2, seam ? 't' : 'm');
    g.set(x, BELT_Y + 3, 's');
  }
  const [bx, by] = BOLT[Math.floor(phase / 4) & 3];        // a quarter turn per tread pitch
  for (const rx of [0, W - 4]) { g.blit(ROLLER, rx, BELT_Y); g.set(rx + bx, BELT_Y + by, 's'); }
}

/** Wobble at 6 fps, as [top, second] offsets over a 16-tick cycle. The top token leans first and the one below
 *  joins it at the extreme, so the pair always leans (|top| ≥ |second|, same side) and never wiggles into an S. */
const LEAN: ReadonlyArray<readonly [number, number]> = [[0, 0], [1, 0], [1, 1], [1, 0], [0, 0], [-1, 0], [-1, -1], [-1, 0]];
const lean = (tick: number): readonly [number, number] => LEAN[Math.floor(tick / 2) & 7];

function drawTokens(g: Grid, tick: number, s: CascadeInputs): void {
  const n = s.stack;
  if (n <= 0) return;
  const L = landAge(n);
  const airborne = s.age < L;
  const landing = s.age === L;
  const below = airborne || landing ? n - 1 : n;           // tokens resting under the newest one
  const press = landing && n > 1 ? 1 : 0;                   // the stack below gives 1 px for 1 tick
  const wobbling = s.wobble && !airborne && !landing;
  const [dTop, dSecond] = wobbling ? lean(tick) : [0, 0];
  const dxOf = (k: number): number => (k === n ? dTop : k === n - 1 ? dSecond : 0);
  for (let k = 1; k <= below; k++) {
    if (press && k === 1) { g.blit(TOKEN_PRESSED, STACK_X, restY(1) + 1); continue; }
    const top = k === below && !landing;           // the glint stays on whichever token is on top
    g.blit(top ? TOKEN_TOP : TOKEN, STACK_X + dxOf(k), restY(k) + press);
  }
  if (airborne) {
    // falls from the top edge at 3 px/tick; the frame before landing is the smear
    if (s.age === L - 1) g.blit(TOKEN_SMEAR, STACK_X, restY(n) - 4);
    else g.blit(TOKEN, STACK_X, 3 * s.age - 1);
  } else if (landing) {
    g.blit(TOKEN_SQUASH, STACK_X - 1, restY(n) + 1 + press);
  }
  const k = s.age - L;                                     // ticks since landing
  // landing sparks: one pixel each side of the seam, flying out and up, c → a → u
  if (k >= 0 && k < 3) {
    const seam = restY(n) + 2 + (k === 0 ? press : 0);
    const col = k === 0 ? 'c' : k === 1 ? 'a' : 'u';
    g.set(STACK_X - 3 - k, seam - k, col);
    g.set(STACK_X + 10 + k, seam - k, col);
  }
  // a glint slides along the new top token's lit rim after it settles
  if (k >= 2 && k <= 4) g.set(STACK_X + 1 + k + dxOf(n), restY(n) + 1, 'w');
}

export const cascadeCoin = definePiece({
  id: 'cascade-coin',
  size: [W, H],
  ticksPerFrame: 1,
  loopTicks: 24,
  period: STORY_TICKS,
  poster: 0,
  maxColours: 9,
  palette: ['w', 'a', 'c', 'b', 'u', 'l', 't', 'm', 's'],
  alt: 'A stack of cost tokens riding a small conveyor, growing by one token at each stage of the drug pipeline.',
  cache: 'none',
  modes: ['drive', 'story'],
  inputs: {
    stack: { type: 'number', default: 3 },
    wobble: { type: 'boolean', default: false },
    belt: { type: 'boolean', default: false },
    age: { type: 'number', default: 99 },
    fade: { type: 'number', default: 4 },
    travel: { type: 'number', default: -1 },
  },
  frame(tick: number, g: Grid, io: PieceIO) {
    const s = readInputs(tick, io);
    const phase = s.travel >= 0 ? s.travel : s.belt ? tick : 0;
    if (io.mode === 'story') {
      // in place: only the tower dissolves; the conveyor stays (tokens never overlap the belt rows)
      drawTokens(g, tick, s);
      if (s.fade < 4) g.fade(s.fade as 0 | 1 | 2 | 3);
      drawBelt(g, phase);
      return;
    }
    if (s.fade <= 0) return;
    drawBelt(g, phase);
    drawTokens(g, tick, s);
    if (s.fade < 4) g.fade(s.fade as 1 | 2 | 3);
  },
  events(tick: number, io: PieceIO) {
    const s = readInputs(tick, io);
    return s.stack > 0 && s.age === landAge(s.stack) ? ['land'] : [];
  },
  state(tick: number, io: PieceIO) {
    if (io.mode === 'story') return storyAt(tick).phase;
    return `stack-${readInputs(tick, io).stack}`;
  },
  exports: { cascadeAt, cascadeTicks, STORY, STOPS, MAX_STACK, landAge, restY },
});

export default cascadeCoin;

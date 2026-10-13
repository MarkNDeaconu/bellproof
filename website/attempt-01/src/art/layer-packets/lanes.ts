// lane-left and lane-right: two-track packet lanes, 48×24, with a vertical variant `v` (24×48).
// The vertical variant is drawn, not rotated: positions are transposed (forward = down, return = up)
// and every sprite stays upright. Forward packets ride the first track (top / left column),
// returning packets the second (bottom / right column); the tracks never overlap.

import { definePiece, type Grid, type Key, type Part } from '../../engine';
import { CHALLENGE, COIN_EDGE, COIN_FACE, COIN_TURN, ENVELOPE, SCROLL } from './parts';
import {
  ANSWER_EVERY, ANSWER_PHASE, CARD_LEAVE, CERT_LEAVE, COIN_ENTER, LANE, LOOP, POSTER, SPEED, TRAIN_GAP, since,
} from './timeline';

type Track = 'fwd' | 'ret';

interface Lane { g: Grid; vertical: boolean }

// cross-axis placement: centre lines of the two tracks (rows in `h`, columns in `v`)
const FWD_CENTRE = 5.5;
const RET_CENTRE = 17.5;
const MEDIAN = 11;

function crossStart(size: number, track: Track): number {
  return Math.round((track === 'fwd' ? FWD_CENTRE : RET_CENTRE) - size / 2 + 0.5);
}

/** Leading-edge position (px travelled from the start edge) → sprite's top-left; returns null when off the lane. */
function place(lane: Lane, p: { w: number; h: number }, track: Track, lead: number, bob = 0): [number, number] | null {
  const len = lane.vertical ? p.h : p.w;
  if (lead <= 0 || lead - len >= LANE) return null;
  const along = track === 'fwd' ? lead - len : LANE - lead;
  const cross = crossStart(lane.vertical ? p.w : p.h, track) + bob;
  return lane.vertical ? [cross, along] : [along, cross];
}

/** Speed lines trailing a packet: two short dashes behind it, lengths alternating per tick. */
function trail(lane: Lane, x: number, y: number, p: { w: number; h: number }, track: Track, tick: number, key: Key): void {
  const { g, vertical } = lane;
  const flick = tick & 1;
  const lens = [2 + flick, 3 - flick];
  const across = vertical ? p.w : p.h;
  const offs = [Math.max(1, (across >> 1) - 2), Math.min(across - 2, (across >> 1) + 1)];
  for (let i = 0; i < 2; i++) {
    const len = lens[i];
    for (let k = 0; k < len; k++) {
      const d = 2 + k; // gap of 1 px, then the dash
      if (!vertical) {
        const xx = track === 'fwd' ? x - d : x + p.w - 1 + d;
        g.set(xx, y + offs[i], key);
      } else {
        const yy = track === 'fwd' ? y - d : y + p.h - 1 + d;
        g.set(x + offs[i], yy, key);
      }
    }
  }
}

function median(lane: Lane): void {
  // a dashed centre line, 2 on / 2 off, like the middle of a two-way road
  for (let i = 0; i < LANE; i++) {
    if ((i & 3) > 1) continue;
    if (lane.vertical) lane.g.set(MEDIAN, i, 'h'); else lane.g.set(i, MEDIAN, 'h');
  }
}

function blitAt(lane: Lane, part: Part, at: [number, number] | null): void {
  if (at) lane.g.blit(part, at[0], at[1]);
}

// ── lane-left: job + escrow → · ← certified result ───────────────────────────────────────────

// the token flips once a second at 6 fps: face, face, turn, edge, turn, face (12 ticks) —
// face on at the poster (12) and at its arrival at Bellproof (24)
const SPIN = [COIN_FACE, COIN_FACE, COIN_TURN, COIN_EDGE, COIN_TURN, COIN_FACE];
function coinFrame(tick: number): Part {
  return SPIN[Math.floor(since(tick, POSTER) / 2) % SPIN.length];
}

function drawLeft(g: Grid, tick: number, vertical: boolean): void {
  const lane: Lane = { g, vertical };
  median(lane);
  // return track first (certificate scroll heading back to the lab)
  const certLead = SPEED * since(tick, CERT_LEAVE);
  const sAt = place(lane, SCROLL, 'ret', certLead);
  if (sAt) { trail(lane, sAt[0], sAt[1], SCROLL, 'ret', tick, 'l'); blitAt(lane, SCROLL, sAt); }
  // forward track: the token leads, the job envelope follows TRAIN_GAP px behind
  const coinLead = SPEED * since(tick, COIN_ENTER);
  const coin = coinFrame(tick);
  const envLead = coinLead - COIN_FACE.w - TRAIN_GAP;
  const eAt = place(lane, ENVELOPE, 'fwd', envLead);
  if (eAt) { trail(lane, eAt[0], eAt[1], ENVELOPE, 'fwd', tick, 'l'); blitAt(lane, ENVELOPE, eAt); }
  const cAt = place(lane, COIN_FACE, 'fwd', coinLead);
  if (cAt) blitAt(lane, coin, cAt);
}

export const laneLeft = definePiece({
  id: 'lane-left',
  size: [48, 24],
  variants: { v: [24, 48] },
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 11,
  palette: ['k', 's', 'm', 'l', 'e', 'h', 'p', 'w', 'v', 'i', 'b', 'c', 'a'],
  alt: '',   // decorative: the vault carries the diagram's alt (content.md §8)
  cache: 'loop',
  frame(tick: number, g: Grid, _io, variant?: string) { drawLeft(g, tick, variant === 'v'); },
});

// ── lane-right: encrypted challenges → · ← quantum answers ───────────────────────────────────

function answer(lane: Lane, lead: number): void {
  // a 2×2 blue bit (white glint upper left, shaded lower right) with a tapering glow tail behind it
  const { g, vertical } = lane;
  const len = 4;
  if (lead <= 0 || lead - len >= LANE) return;
  const along = LANE - lead; // head start (towards the near end)
  const c = crossStart(2, 'ret');
  const px = (a: number, b: number, k: Key) => (vertical ? g.set(c + b, along + a, k) : g.set(along + a, c + b, k));
  px(0, 0, 'w'); px(1, 0, 'c'); px(0, 1, 'c'); px(1, 1, 'b');
  px(2, 0, 'a'); px(3, 0, 'g'); px(2, 1, 'g');
}

function drawRight(g: Grid, tick: number, vertical: boolean): void {
  const lane: Lane = { g, vertical };
  median(lane);
  for (let k = 0; k < LOOP / ANSWER_EVERY; k++) answer(lane, SPEED * since(tick, ANSWER_PHASE + k * ANSWER_EVERY));
  CARD_LEAVE.forEach((at, i) => {
    const lead = SPEED * since(tick, at);
    const bob = ((tick >> 1) + i) & 1 ? -1 : 0;
    const cAt = place(lane, CHALLENGE, 'fwd', lead, vertical ? 0 : bob);
    if (cAt) { trail(lane, cAt[0], cAt[1] - (vertical ? 0 : bob), CHALLENGE, 'fwd', tick, 'l'); blitAt(lane, CHALLENGE, cAt); }
  });
}

export const laneRight = definePiece({
  id: 'lane-right',
  size: [48, 24],
  variants: { v: [24, 48] },
  ticksPerFrame: 1,
  loopTicks: LOOP,
  poster: POSTER,
  maxColours: 12,
  palette: ['k', 's', 'm', 'l', 'e', 'h', 'p', 'w', 'b', 'c', 'a', 'g'],
  alt: '',   // decorative: the vault carries the diagram's alt (content.md §8)
  cache: 'loop',
  frame(tick: number, g: Grid, _io, variant?: string) { drawRight(g, tick, variant === 'v'); },
});

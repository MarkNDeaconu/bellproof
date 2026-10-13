// job-token · 12×12 · card 9. The job card that travels down the flow spine.
// Inputs: walk (1-px bob at 6 fps while the section moves it), progress (0..1 over the seven steps:
// the escrow coin rides along locked to the job until Settle, when the money finally moves).

import { definePiece, part, type Grid, type PieceIO } from '../../engine';

// 10×11 job card: paper face, blue corner tab, a 5×5 spec-hash #, a title line, paper thickness at the base
const CARD = part(`
  kkkkkkkkkk
  kbbbpppppk
  kbbpptttpk
  kbpppppppk
  kppkpkpppk
  kpkkkkkppk
  kppkpkpppk
  kpkkkkkppk
  kppkpkpppk
  khhhhhhhhk
  kkkkkkkkkk
`, 'job-card');

const COIN = part(`
  .kkk.
  kwaak
  kaaak
  kaacb
  .kbb.
`, 'escrow-coin');

/** Seven steps → index 0..6. */
export function stepOf(progress: number): number {
  const p = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  return Math.round(p * 6);
}

export const jobToken = definePiece({
  id: 'job-token',
  size: [12, 12],
  ticksPerFrame: 1,
  loopTicks: 24,
  poster: 0,
  maxColours: 9,
  palette: ['k', 'p', 'b', 't', 'h', 'w', 'a', 'c'],
  alt: 'The job card, carrying its escrow down the contract steps.',
  cache: 'none',
  inputs: { walk: { type: 'boolean', default: false } },
  states: ['escrow', 'staked', 'settled'],
  frame(tick: number, g: Grid, io: PieceIO) {
    const t = ((tick % 24) + 24) % 24;
    const y = io.walk ? ((t >> 1) & 1) : 1;
    const step = stepOf(io.progress);
    g.blit(CARD, 0, y);
    // glint along the top edge, ticks 12..20
    if (t >= 12 && t <= 20) g.set(t - 11, y, 'w');
    if (step < 6) {
      if (step >= 1) g.blit(COIN, 7, y + 3);      // the provider's stake, behind
      g.blit(COIN, 7, y + 6);                     // the client's escrow
    }
  },
  state(_tick: number, io: PieceIO) {
    const s = stepOf(io.progress);
    return s >= 6 ? 'settled' : s >= 1 ? 'staked' : 'escrow';
  },
});

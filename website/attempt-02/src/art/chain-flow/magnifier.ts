// magnifier-scroll · 16×16 · card 9. Beside "Verify": a lens inspecting the transcript scroll.
// The lens slides 1 px every 6 ticks (loop 24) and shows the lines under it magnified 2×.

import { definePiece, part, type Grid } from '../../engine';

// transcript scroll: rolled ends (slate caps, silver/platinum rod), paper sheet with a silver lit edge on the
// left and a steel shadow edge on the right so it reads on paper; hairline text rows
const SCROLL = part(`
  .mllllllm.
  .meeeeeem.
  .lpppppt..
  .lphhhpt..
  .lpppppt..
  .lphhppt..
  .lpppppt..
  .lphhhpt..
  .lpppppt..
  .mllllllm.
  .mttttttm.
`, 'scroll');

const PATH: Array<[number, number]> = [[0, 0], [1, 0], [2, 0], [1, 0]];

export const magnifierScroll = definePiece({
  id: 'magnifier-scroll',
  size: [16, 16],
  ticksPerFrame: 1,
  loopTicks: 24,
  poster: 0,
  maxColours: 10,
  palette: ['k', 's', 'm', 't', 'l', 'e', 'h', 'p', 'g', 'w'],
  alt: 'A magnifier inspecting the transcript.',
  cache: 'loop',
  frame(tick: number, g: Grid) {
    const t = ((tick % 24) + 24) % 24;
    const [dx, dy] = PATH[Math.floor(t / 6)];
    g.blit(SCROLL, 0, 1);
    const cx = 7 + dx, cy = 7 + dy, r = 3;
    // lens interior: the scroll magnified 2× around the lens centre
    for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
      const d2 = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (d2 > (r - 0.5) * (r - 0.5) + 1) continue;
      const sx = cx + Math.floor((x - cx) / 2), sy = cy + Math.floor((y - cy) / 2);
      const under = g.get(sx, sy);
      g.set(x, y, under === 'h' ? 't' : 'g');
    }
    g.circle(cx, cy, r, 's');
    g.set(cx - 1, cy - 2, 'w'); g.set(cx - 2, cy - 1, 'w');
    // handle, lower right, 2 px thick
    for (let i = 0; i < 4; i++) { g.set(cx + 3 + i, cy + 3 + i, 'm'); g.set(cx + 3 + i, cy + 2 + i, 'm'); }
    g.set(cx + 2, cy + 2, 's');
  },
});

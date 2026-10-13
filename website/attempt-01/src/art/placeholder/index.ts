// The stand-in piece sections mount until the real piece lands. 16×16: a silver frame, a steel "?",
// and an azure pixel that walks the perimeter (loop = 60 ticks, one pixel per tick).

import { definePiece, font5x7, type Grid } from '../../engine';

const PERIM = 60; // 4 × 15 edge pixels

function perimeter(i: number): [number, number] {
  const n = ((i % PERIM) + PERIM) % PERIM;
  if (n < 15) return [n, 0];
  if (n < 30) return [15, n - 15];
  if (n < 45) return [15 - (n - 30), 15];
  return [0, 15 - (n - 45)];
}

export const placeholder = definePiece({
  id: 'placeholder',
  size: [16, 16],
  variants: { sm: [8, 8], wide: [32, 16] },
  ticksPerFrame: 1,
  loopTicks: 60,
  poster: 0,
  maxColours: 4,
  palette: ['l', 'h', 't', 'a'],
  alt: '',
  cache: 'loop',
  frame(tick: number, g: Grid, _io, variant?: string) {
    g.rect(0, 0, g.w, g.h, 'h');
    g.rect(0, 0, g.w, g.h, 'l', false);
    if (variant !== 'sm') g.text(font5x7, '?', (g.w >> 1) - 2, (g.h >> 1) - 3, 't');
    // perimeter walker: the 60-tick loop is mapped onto the variant's perimeter so every variant loops exactly
    const per = 2 * (g.w - 1) + 2 * (g.h - 1);
    const i = Math.floor(((tick % 60) / 60) * per);
    let x: number, y: number;
    if (i < g.w - 1) { x = i; y = 0; }
    else if (i < g.w - 1 + g.h - 1) { x = g.w - 1; y = i - (g.w - 1); }
    else if (i < 2 * (g.w - 1) + g.h - 1) { x = g.w - 1 - (i - (g.w - 1) - (g.h - 1)); y = g.h - 1; }
    else { x = 0; y = g.h - 1 - (i - 2 * (g.w - 1) - (g.h - 1)); }
    g.set(x, y, 'a');
    void perimeter;
  },
});

export default placeholder;

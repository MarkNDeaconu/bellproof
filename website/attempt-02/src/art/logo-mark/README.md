# logo-mark · the pixel bell (art-spec card 16)

Owner: `art-logo-mark` (fable). Files: `src/art/logo-mark/**`, `public/favicon.svg`, `public/og.png`.

A 12×11 single-colour bell with a negative-space check cut from the skirt. One bitmap (`bell.ts`) feeds four things:
the registered piece `logo-mark` (harness, validator, sheets, `icon()`), the SVG rect grid for the nav and footer,
the favicon and the og image. It is the only art rendered at scales other than 4, always at **integer** scales.

```
col  0123456789ab
r0   .....##.....   crown knob
r1   ....####....
r2   ...######...
r3   ...######...   dome / waist
r4   ...######...
r5   ..######.#..   ← long arm tip (8,5)
r6   ..#####.##..   ← (7,6)
r7   ..##.#.###..   ← short arm (4,7) · long arm (6,7)
r8   ..###.####..   ← vertex (5,8)
r9   ############   rim: full width, 2-px overhang each side (the lip)
r10  .....##.....   clapper (the only row that moves)
```

## API

```ts
import { navMark, footerMark, footerReveal, ring, markSVG, markElement, icon } from '../art/logo-mark';
```

| Export | Use |
|---|---|
| `navMark()` → `SVGSVGElement` | the nav lockup mark: 24×22 (2 px/art px), `fill="currentColor"`, `aria-hidden` (the wordmark text names the brand). Put it in the logo cell before the "Bellproof" text, gap 10px. The 2-px grid is kept as long as the cell's content box starts on an even CSS px (it does at 48px bar height: 22 tall → 13px top offset is fine, the mark's *own* pixels are 2px each regardless of offset). |
| `footerMark()` → `SVGSVGElement` | the giant mark: 240×220 (20 px/art px), `currentColor`. Position it centred and bottom-aligned on the strata's top edge inside the sub-footer row; give the row `overflow: clip` (or let the strata paint above it) so the mark can hide behind the bands. |
| `footerReveal({ mark, trigger, distance = 280, step = 20, height = 220, ringOnce = true, onRing })` → handle | the scrubbed rise: `translateY` from 220px → 0 as `trigger` (the sub-footer) scrolls from viewport bottom to viewport bottom − 280, quantised to 20px steps (one art px), computed on the frame clock only while the trigger is near the viewport (IO). When the offset is 0 and the document is scrolled to its end it calls `ring()` once per visit. Handle: `.rung`, `.offset`, `.ring()`, `.dispose()`. Reduced motion (live): transform cleared, never rings. |
| `ring(svg)` → `Promise<void>` | the gag, on the shared 12-fps tick clock. Idempotent while running; no-op under reduced motion. Works on any `markSVG` element (nav mark too, if a section ever wants it). |
| `markSVG({ scale, label?, fill?, halo?, className? })` / `markElement(opts)` | the SVG string/element at any integer scale. Layers: `[data-halo]` (empty until ringing), `[data-body]`, `[data-clapper]`. `overflow: visible` so the halo can sit outside the 12×11 box without affecting layout. |
| `ringState(t)`, `applyRingFrame(svg, frame)`, `RING_TICKS` | the timeline as data; the piece's `frame()` and the DOM ring both use it. |
| `BELL`, `BELL_ROWS`, `bodyRuns()`, `clapperRuns(dx)`, `haloRuns(d, dx)`, `bellPath(scale, ox, oy)` | geometry for other agents (e.g. the 7×7/9×9 wax-seal reductions in cards 4 and 8 are hand-drawn, but the full mark is here if a piece wants to blit it). |
| piece `logo-mark` | 12×11, palette `k` (+`a` halo, `p` dark variants), `ticksPerFrame 1`, `loopTicks 48`, poster 24 (rest). Ticks 0–11 play the ring, 12–47 rest. Variants: `halo` 18×17 (3-px margin for the halo), `dark`, `halo-dark` (paper-coloured for ink backgrounds). `icon('logo-mark', { size: 2 | 4 | 8 | 20 })` gives the static mark from the engine's icon system. `state()` → `rest | ring`; `events` → `['ring']` on tick 0. |

### Ring timeline (12 ticks = 1 s; the clapper moves at 6 fps)

| ticks | clapper | halo |
|---|---|---|
| 0–1 | left (−1) | 1-px azure outline hugging the silhouette (card: "halo for 2 ticks on the first swing") |
| 2–3 | centre | the outline expands to 2 px, then 3 px away (design §5.11: "an azure ring pixel-expands … for 3 ticks") and is gone |
| 4–5 | right (+1) | — |
| 6–7 | centre | — |
| 8–9 | left (−1) | — |
| 10–11 | centre → rest | — |

The halo is computed as *exterior* cells at Chebyshev distance exactly `d` from the silhouette, so the enclosed check
never fills in and the ring is a closed 1-px line even around the clapper. Three swings (L, R, L) per design §5.11;
the card's 8-tick L-C-R-C is the first two thirds of it.

### Footer wiring (for layout-core, `src/sections/footer.ts`)

```ts
const mark = footerMark();
subfooterRow.querySelector('.giant')!.append(mark);   // .giant { position:absolute; left:50%; bottom:0; margin-left:-120px; width:240px; height:220px; color:var(--ink); line-height:0 }
footerReveal({ mark, trigger: subfooterRow });         // the row: min-height 280, overflow: clip
```

## Alternatives considered and the pick

Sheets: `qa/art-logo-mark/compare-sheet.png` (1×/2×/4×/8×/20× on paper and ink), `compare-small-x4.png` (the 1× and 2×
renders, zoomed ×4), `refine-sheet.png` (check placement on the chosen silhouette). Maps in `candidates.ts`.

| | silhouette | verdict |
|---|---|---|
| A card | knob, 3-row waist of 6, flare 8-8-10-10, rim 12 | at 1×/2× a triangle with a dot: the rim overhangs the skirt by only 1 px, so there is no lip |
| B tulip | longer waist, later flare | same problem; slightly better waist |
| C dome | no knob, 8-wide body | reads as a thimble |
| D conical, E thick rim, H lipped | variations of A's flare and rim | all still pine-tree silhouettes at 16–24 px |
| G long check | A with a 5-px long arm shifted left | the check is longer but asymmetric to the clapper; silhouette unchanged |
| J / L bold check | 2-px long arm | at 2× the hole eats the skirt; at 1× it is a blotch |
| **K lip** | straight 8-wide skirt, rim with a 2-px overhang each side | **the only one that reads as a bell at 1× and 2×**: dome, lip, clapper |
| K2 | K with a 2-wide vertex notch in the rim | the lip reads broken |
| **K4 (shipped)** | K with the check moved up one row so it sits entirely in the skirt and the rim is whole | the check reads as a clean V at 8× and 20× and the lip stays an unbroken line, so the clapper hangs cleanly below it |
| K5 | shorter waist | loses the dome |

**Deviation from the card, flagged:** the card draws the check vertex *in* the rim (5,9). In K and K2 that notch sits
directly above the clapper and at 8× the gap + clapper merge into one confusing cluster (`refine-sheet.png`, rows 1–2).
Moving the check one row up keeps the fixed elements (bell silhouette, negative-space check, long arm to the
lower-right, vertex above the clapper) and is the better mark; the silhouette itself (K) differs from the card's by
trading the gradual flare for a straight skirt and a 2-px lip, which is what makes it legible at 16 px.

## Critique rounds

1. **Seven silhouettes at every scale** (`compare-sheet.png`). Finding: all of A–H read as a mountain/pine tree at 1× and
   2×; the single-pixel diagonal check reads as a chain of corner-touching squares at 20×. Action: add a lip family
   (K, L, M) and a bold-check family (J, L).
2. **Small sizes, ×4 zoom** (`compare-small-x4.png`). K/L are the only bells at 1×/2×; bold checks hurt the solid read.
   Pick K; accept the 1-px check (it is legible at 8× and above, which is what the card asks for).
3. **Check placement on K** (`refine-sheet.png`). Vertex in the rim (K, K2) fights the clapper; K4 wins. K5 too squat.
4. **The built thing** (`demo-*.png`, `nav-mark-zoom.png`, `favicon-*.png`, `ring-states/sheet.png`, `footer-reveal/`).
   Nav lockup crisp at DPR 1 and 2 on the 2-px grid; favicon 2-colour at 16/32/48 in ImageMagick and crisp in Chromium,
   paper fill under `prefers-color-scheme: dark`; the ring reads on paper and ink; the footer rise steps in 20-px
   increments and rings once at the bottom. Fix made in this round: the og wrapper reused the class name `mark` that
   `markSVG` puts on the SVG, which doubled the offset and hid the mark behind the bands; renamed, re-rendered.

## Evidence (`qa/art-logo-mark/`, all looked at)

- `compare-sheet.png`, `compare-small.png`, `compare-small-x4.png`, `refine-sheet.png`: the alternatives.
- `../sheets/logo-mark.png`, `logo-mark-halo.png`, `logo-mark-dark-ink.png`, `logo-mark-halo-dark-ink.png`: Node contact
  sheets of the piece and its variants (frames at 4× with tick labels, poster boxed, 1× strip).
- `harness-halo/`: 48 live frames of `preview.html?piece=logo-mark&variant=halo&zoom=4` via `frames.mjs`.
- `ring-states/tick-00..12.png` + `sheet.png`: every tick state of the DOM ring at 20× on paper and ink (deterministic);
  `ring-live/`: 20 live frames of the demo ring via `frames.mjs`; `ring-tick-00.png`, `ring-rest.png`.
  The live DOM log (ring-check.mjs): `0ms dx=-1 halo=24 rects · 205ms dx=0 halo=28 · 328ms dx=0 halo=32 · 444ms dx=+1 halo=0 · 733ms dx=-1 · 945ms rest`.
- `footer-reveal/`: 48 viewport frames while the demo auto-scrolls to the bottom: the bell rises behind the strata in
  steps (frames 5–8) and rings at the bottom (frames 14–16). `footer-reduced-motion.png` + log
  `{"reduced":true,"before":{"transform":"","halo":0,"rung":false},"during":{"halo":0,"clapper":null}}`.
- `demo-nav-demo-dpr1/dpr2.png`, `nav-mark-zoom.png` (×6 / ×3 crops): the lockup. `demo-scales-demo-*.png`: 2/4/8/20 on
  paper and ink. `demo-favicon-demo-dpr1.png` (light) and `-dark.png`: the shipped file at 16/32/48 and ×4.
  `favicon-magick.png` / `-x6.png`: ImageMagick rasterisation, 2 colours at each size. `demo-footer-dpr1/dpr2.png`.
- `public/og.png`: viewed directly.

Tools (all in `tools/`, none shipped): `compare.ts`, `refine.ts` (sheets), `check.ts` (validator + sheets for this piece
only), `favicon.ts` (writes `public/favicon.svg`), `og.ts` (writes `public/og.png` with Chromium), `shots.mjs`,
`ring-check.mjs`, `ring-sheet.mjs` (Playwright evidence). QA build: `npx vite build --config src/art/logo-mark/qa.vite.config.ts`
(harness + `demo.html`) or the lead's `BP_ONLY=logo-mark npx vite build --outDir .qa/art-logo-mark` (harness only).

## Acceptance checklist

Card 16:
- [x] Reads as a bell at 24 px: `nav-mark-zoom.png`, `demo-nav-demo-dpr1.png`.
- [x] The check reads at 240 px: `demo-footer-dpr1.png`, `ring-states/sheet.png`.
- [x] Favicon crisp at 16 and 32: `favicon-magick-x6.png` (2 colours per size), `demo-favicon-demo-dpr1.png`. At 16 px the
  check is single pixels and essentially invisible; the bell silhouette carries it (by design, see card).
- [x] Nav mark aligns to the 2-px grid: SVG viewBox 12×11 at `width=24 height=22`, every rect edge on an even CSS px.
- [x] Footer reveal: translateY 100% → 0 scrubbed over 280 px in 20-px steps: `footer-reveal/contact-sheet.png`.
- [x] Ring once per visit when fully risen and at the page bottom; clapper −1/0/+1 at 6 fps; azure halo on the first
  swing (2 ticks at 1 px, then the 2-px and 3-px ripple): `ring-states/`, `ring-live/`, DOM log above.
- [x] Reduced motion: in place, no ring: `footer-reduced-motion.png` + log.
- [x] Single colour, ink on light / paper on dark: `currentColor` fills; favicon switches with the colour scheme.
- [x] SVG rect grid, `shape-rendering: crispEdges`, integer scales only (`markSVG` throws on non-integers).
- [~] "✓ cut … into the rim": the check is cut into the skirt one row above the rim (deviation, justified above).

Common acceptance (art-spec §0):
1. [x] Validator passes: `check.ts` → 0 errors, 0 warnings (`npm run validate` itself is currently blocked by a sibling folder, see below).
2. [x] Reads at 1× and 4×, on paper and ink (`compare-small-x4.png`, sheets `-ink`).
3. [x] Single colour: no shading, so no light/pillow/banding concerns; no orphan pixels (the 5 check holes are deliberate).
4. [x] Loop seam: tick 47 (rest) → tick 0 (ring start) is an intentional event, the rest frames are identical.
5. [x] `frames.mjs --interval 83` matches the timeline within ±1 tick (`ring-live/`, DOM log).
6. [x] Poster (tick 24) is the resting mark; it is what `icon()` emits.
7. [x] No white flashes.

## Known issues / notes

- `npm run validate` imports every `src/art/*/index.ts`; at the time of writing `glitch-cells/index.ts` throws at import
  (`tv: row 13 has width 17, expected 16`), which blocks the shared validator and `npm run sheet` for everyone. This piece
  was validated with the same `validatePiece()` through `tools/check.ts`. Re-run `npm run validate -- logo-mark` once the sibling is fixed.
- `public/og.png` is composed from the mark, the wordmark and the ramp bands only. The brief (meta.ts `ogImageBrief`)
  wants the fridge sprite on the left; re-run `tools/og.ts` with the fridge once `fridge-hero` lands (the left column
  is laid out for a 360-px-wide subject). Fonts for the og render and the demo come from Google Fonts at render time
  because `public/fonts/` was empty; swap the `@import` for the local woff2 files when layout-core ships them.
- Safari ignores SVG favicons; a PNG/ICO fallback and `apple-touch-icon` are not in this card. Request below.

## Requests

- **layout-core:** `<link rel="icon" href="/favicon.svg" type="image/svg+xml">` and the og tags (`og:image` → `/og.png`,
  1200×630) in `index.html`; mount `navMark()` in the logo cell and `footerMark()` + `footerReveal()` in the footer as
  shown above; the sub-footer row needs `overflow: clip` (or the strata stacked above the mark). Consider a 32-px PNG
  fallback favicon for Safari if the lead wants one (I can generate it from `bellPath`).
- **engine (fable):** optionally make `scripts/validate.ts` tolerate a sibling that throws at import (log and continue)
  so one broken folder does not block everyone's `npm run validate`.

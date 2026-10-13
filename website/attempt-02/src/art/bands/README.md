# `bands` · card 15 · revision 1 · blocks, the T/C shuffle, paradox rails, dusk staircase, footer strata (art-bands)

The only art drawn at **B = 8**. Blocks are the engine's DOM `.block` divs (`src/engine/blocks.ts`, `Stage`, owned by the
integrator); the staircase and the strata are bitmaps at B. This folder owns the **layout data**, the **choreography
data** and the **DOM helpers** the sections call.

Import: `import { heroStage, paradoxStage, strata, dusk, … } from '../art/bands'`.

Revision 1 (`research/briefs/revision-1.md` §1.1, §1.8, §1.9, tasks B1–B7) replaced:
- the hero's yoyo, floor blocks, riders-on-stacks and diamond with **rails only + the T/C shuffle**;
- the footer's 4×64 strata, 48/80 grid and arc with **a stepped, falling strata on the module grid**;
- the paradox stage's measured floor with **rails anchored to the band's bottom**.

## Rails (the idea under every stage here)
A rail is a `Stage` exactly M wide, `position:absolute; bottom:0`, against the left or right edge of its root, with a
**fixed height**. All blocks sit in column 0. The floor is therefore the root's bottom edge whatever the root's height, whenever
it is measured. The right stack is flush with the right edge at any width. Nothing is computed from the root's size, so resizes
never rebuild anything; only a change of module does (1200 / 1440). `railStage(root, side, M, heightPx, blocks, clip?)` is
exported for anyone who needs another one.

## API

### `heroStage(root, opts?) → HeroStage` (sections-1, `#top`)
Give it the hero frame (full-bleed, `position:absolute; inset:0`; the rails sit at its left and right edges) at lg / lg-narrow,
and the stacked fridge cell below 1200. It positions itself `relative` only if `root` is `static`.

| opt | default | meaning |
|---|---|---|
| `layout` | `heroLayoutFor(innerWidth)` | `'lg'` (≥ 1440, M 128) · `'lg-narrow'` (1200–1439, M 96) · `'stacked'` (< 1200, M 64). Unforced, the stage rebuilds itself when the viewport crosses 1200 / 1440 |
| `bp` | — | legacy alias: `'lg'`, `'md'` (lg-narrow from 1200, else stacked), `'sm'` (stacked) |
| `riders` | `{ pair: 'qubit-pair', cert: 'cert-mini', tile: 'round-tile' }` | piece ids; missing pieces fall back to `placeholder` |
| `autoplay` | `true` | run the shuffle whenever the root is in view (±200 px) |
| `intro` | `false` | blocks wait off-stage until `intro()` |

Returned `HeroStage`:
- **Read-only state:** `layoutName` (alias `bp`), `layout`, `module`, `choreo`, `stage` (the left rail `Stage`), `stages {left, right}`, `blocks` (id → element: `L1…`, `R1…`, `Rr`), `tiles` (`Mounted[]`, top → bottom then the reservoir's), `riders` (`[pair, cert]`), `dots`, `time` (cycle ms), `cycleMs` (14 400), `playing`.
- `intro(): Promise<void>`: lg: the rails slide in from the sides, bottom block first. Stacked: each stack rises from below the floor as a unit, left first (B6). 700 ms power4Out, stagger 100 ms, quantised to 4 px. Pair and cert rise through the floor at +200 ms. The dots fade in last (300 ms). Resolves when the dots are in; the shuffle starts if `autoplay`.
- `finish()`: lands everything at rest now (blocks, sprites, dots) and starts the shuffle. This is the intro fail-safe (§1.1 point 5). It always acts on the **current** build (B2).
- `play()` / `pause()` / `seek(ms)` (tiles jump to their face, no flip) / `setStatic()` (the poster, nothing plays) / `rebuild()` (keeps the cycle time) / `destroy()`.
- **Handled inside:**
  - Reduced motion and the pause switch show the poster (✓ on every visible tile, blocks at rest, dots in) and resume on change.
  - Visibility pausing.
  - A rebuild during the intro lands at rest and plays (B2).
  - Height changes are ignored (nothing depends on height; B2's "< 8 px" is moot).

**For sections-1:**
- The labels must sit above the stage (`z-index: 2`) at stacked. The stacked left stack is 2 × 64 = 128 px tall and never rises: it sinks, then comes back.
- The bit-drop helper can use `stage.blocks`, which holds both stacks (`stage.stage` is only the left rail).
- Keep `.is-pre-intro .hero__stage { visibility: hidden }` until you call `intro()`. The blocks are already off-stage, but the tiles' first frames are not.

### The hero layouts (revision 1 §1.1 point 3)
Rows count from the floor. Every block is M × M. Tiles are `round-tile`, centred in their block.

| layout | M | left rail (bottom → top) | right rail (bottom → top) · reservoir | tile | floor | dots |
|---|---|---|---|---|---|---|
| lg | 128 | violet · indigo · blue | indigo · blue · cornflower · **violet** under the floor | 24×24 (96 px), inset 16 | `qubit-pair` at x = M · `cert-mini` at x = W − M − 96 | both stack tops, on the rail lines |
| lg-narrow | 96 | violet · indigo · blue | indigo · blue · cornflower · violet | `md` 16×16 (64 px), inset 16 | pair `sm` at x = M · cert at W − M − 96 | both |
| stacked | 64 | indigo · blue | blue · cornflower · indigo | `md` (64 px), inset 0 | pair `sm` at x = M · cert at W − M − 96 | none (no rail lines) |

The reservoir colour is a choice. When the left stack sinks, its bottom block goes under the floor, and a block of the same
colour emerges under the right stack. The shuffle conserves blocks, and both stacks keep the ramp's adjacency rule.

### The T/C shuffle (revision 1 §1.1 point 4) · `heroChoreo(layout)`, one table
The cycle is 14.4 s (≈ 173 ticks). It loops forward and never reverses. Each move takes 800 ms with `power4InOut`, quantised to 4 px. One
quantised value drives both stacks (`rightOffsetAt`), so they move on the same frames in opposite directions by construction.

| t | what happens |
|---|---|
| 0.0 s | three `?` tiles shimmer (round-tile's idle glints, phases staggered) |
| 1.0 / 1.8 / 2.6 s | top, middle, bottom tiles flip to **T, C, C** (stacked: top T, bottom C). As the T lands (+3 ticks), its block pulses one ramp step darker for 2 ticks |
| 4.2 s | **move 1**: the right stack rises 1 M (the reservoir's `?` block emerges) while the left stack sinks 1 M. The tiles flip back to `?` top → bottom, 1 tick apart, starting +1 tick |
| 5.8 s | **move 2**: the right stack sinks, the left rises (the layout is restored) |
| 7.6 s | hold: three `?` ("what the provider sees") |
| 9.1 s | **verdict**: ✓ (azure face) top → bottom, 2 ticks apart. Each lands with round-tile's 1-tick white flash. As the last lands (+3 ticks), every visible block of both stacks goes one step lighter for 2 ticks |
| 11.6 s | tiles dither-fade (4 ticks) back to `?`; hold to 14.4 s; loop |

**The driver.** One tick subscriber advances the cycle time at 12 fps. A frame subscriber is added only while a block is in flight
(from 1 tick before a move to its end). Measured: about 22 rAF/s during holds and display rate during moves. The driver is a pure
function of `t`:
- `rightOffsetAt(c, t, M)` gives the stack offsets;
- `toneAt(c, id, t)` gives the block tones;
- `facesAt(c, t)` gives the tile faces;
- `moving(c, t)` says whether a block is in flight.

Tile cues crossed while playing animate: `flip` or `fade` on `localTick + 1`, the round-tile contract (absolute ticks, E9). A
cue found more than 2 ticks late (after a stall) lands its face without the flip.

### `paradoxStage(root, opts?) → Paradox` (sections-1, `#paradox`)
Two rails anchored to the band's bottom (B1). The module follows the hero's rails: 128 from 1440, 96 from 1200, 64 below.
- **Left rail:** indigo on the floor, violet above.
- **Right rail:** indigo, a mist half, and `question-block` standing on it.

The helper rebuilds itself when the module changes on resize, then calls `opts.onRebuild(p)` so the section can re-wire its
flicker to the new `riders`.
- **Returns:** `stage` (left), `stages`, `riders`, `bp`, `rail` (M), `destroy()`.
- **Options:** `module` forces M. `width` is ignored.
- **B7, the section's half:** at ≥ 1200 the band's copy must start right of the rail (`x ≥ M`, e.g. `padding-inline-start: calc(var(--rail) + 40px)`, which also aligns it with the hero's text column). Below 1200 the band must keep ≥ 2M of padding under the copy. The stacks never move, so the poster is the same frame.

### `strata(root, opts?) → Strata` (layout-core, `#footer`) · B5
- **Drawing:** one canvas at B = 8, full width, 256 px.
  - The **top edge descends** one 8-px step every ⅛ of the width (y 0 → 56). The step boundaries are snapped to the 8-px grid, continuing the dusk staircase's fall.
  - Nothing is drawn above the edge: the root is made transparent, so the footer's surface shows. Drop `.footer__strata`'s blue background.
- **Bands:** horizontal seams at 72 / 128 / 176. Blue (72 thick at the left, 16 at the right), cornflower 56, azure 48, mist 80. **No arc.**
- **Grid** (ink 10 %, 1-px DOM lines, re-measured on resize):
  - verticals only at the content-box edges (gutter 40 / 16, box capped at 1728 and centred) and at the rail lines content-left + M / content-right − M (M = 128 / 96 / 64 by the hero rule);
  - each vertical starts at the edge, never on the paper above;
  - horizontals only at the 3 seams.

| opt | default | |
|---|---|---|
| `gutter`, `contentMax`, `module` | 40 / 16 · 1728 · hero rule | grid geometry |
| `above` | none | palette key to paint above the edge |
| `walker`, `walkerX` | none | legacy slot: a piece standing with its feet on the edge at `walkerX` |

- **Returns:** `el`, `canvas`, `height` (256), `seams`, `surfaceY(x)`, `boundaries()`, `contentBox`, `module`, `gridlines`, `walker`, `walkerMount`, `redraw()`, `destroy()`.
- **`surfaceY(x)`:** x in css px from the strip's left edge; the result is a multiple of 8. Put the walkers' feet there.
- **Walkers placement:** the root clips horizontally only (`overflow-x: clip`). Even so, put the walkers and the hanging bell in the wrapper, not inside the strata.

### `dusk(root) → { el, canvas, surfaceY(x), redraw(), height: 64 }` (sections-3, `#cta`)
Unchanged design: three tiers left → right in night, violet and indigo. Each tier steps down 8 px per ⅛ of its width (0 → 56) and
resets at the tier boundary. Ink fills above.

Fix: the engine names the canvas `.band`, which collided with the site's `.band` section rule (border-top plus surface fill). That put a
1-px hairline over the staircase's first row. `dusk()` now renames the canvas to `.bands-dusk__canvas`.

### `gridlines(root, opts?) → { el, grid, redraw(), destroy() }`
The module grid on any colour band:
- verticals at the content edges and rail lines, optionally starting at `top(x)`;
- horizontals at `opts.y` (none by default).

Use it on the CTA and paradox bands instead of the 48/80 grid (LC8).

### Data (pure, Node-safe: `layouts.ts`)
- **Hero:** `heroLayoutFor`, `heroLayoutFromBp`, `HERO_MODULE`, `heroLayout(name)`, `heroChoreo(name)`, `rightOffsetAt`, `moving`, `facesAt`, `toneAt`, `shiftStep`, `RAMP`, `q4`, `MOVE_MS`, `TICK`, `SHUFFLE_CYCLE_MS`, `HERO_LG`, `HERO_LG_NARROW`, `HERO_STACKED`, `HERO_CHOREO_LG`.
- **Paradox:** `paradoxLayout(M)`, `railModuleFor`.
- **Strata:** `STRATA_*`, `strataBoundaries`, `strataSurfaceY`, `strataGrid`.
- **Shared:** `MODULE`, `breakpointFor`, `RIDERS`, `DUSK_*`.

### `diamond` piece
15×15 (`sm` 7×7), `loopTicks 36`, decorative. No longer used by the hero (§1.1 point 3); kept registered.

## Evidence · `attempt-02/qa/art-bands/`
**Build:**
`BP_ONLY=bands,qubit-folk,certificates,icons npx vite build --config qa/art-bands/vite.qa.config.ts --outDir .qa/art-bands`

The config adds `bands-demo.html`, a harness with these views: `?view=hero[&layout=…][&intro=1]`, `paradox` (the real band markup and site CSS), `strata`, `seam`, `dusk`.

The paradox is checked both in the harness (`paradox/`) and on the real page (`paradox-real/`, `REAL=1 node qa/art-bands/paradox.mjs`).

| File | What it shows |
|---|---|
| `frames-1440/1280/1024/768/390/` (`frame-*.png`, `anim.gif`, `sheet-every4.png`) | 200 frames each via `tools/frames.mjs` (83 ms + capture latency ≈ 60 s ≈ 4 cycles). The sheets crop the two rails plus the info line |
| `sample-lg.json` (60 s), `sample-lg-narrow.json`, `sample-stacked.json` (30 s) | every animation frame sampled in the page: off-grid transforms, anti-correlation, rigidity, face sequences, tone events, rAF/s |
| `intro/` (`*-strip.png`, `intro.json`) | the intro per layout: entry directions, bottom-first landing, the 300 ms dot fade, the shuffle playing after the intro and after a rebuild during it |
| `crisp/` | reduced-motion posters (0 px differ over 4 s, ✓ ✓ ✓), DPR 1 / 1.5 / 2 crops of the tile corner and both dots |
| `strata/` (`strata-*.png`, `crops-1440.png`, `strata.json`) | 1920 / 1440 / 1280 / 1024 / 768 / 390 and DPR 2: edge steps, band colours per column, grid positions, no arc, no horizontal scroll |
| `paradox/`, `paradox-real/` (`paradox-*.png`, `paradox.json`) | harness at 10 widths and the real page at 6, motion and reduced motion: blocks on the band's floor, overlap with the copy |
| `page/` (`hero-*.png`, `page-hero.json`) | the hero on the real page through today's `top.ts` (legacy `bp` + intro): layout per width, the shuffle playing at 3.5 s and 9.5 s at 1920 … 390. The hero's layout around the stage is sections-1's rebuild in progress |
| `strata/seam-1440.png`, `seam-390.png` | the CTA dusk staircase over the falling strata (the ramp's fall from ink to mist) |

**Scripts:** `sample.mjs`, `intro.mjs`, `crisp.mjs`, `strata.mjs`, `paradox.mjs`, `page-hero.mjs`, `seam.mjs`, `sheet.mjs`. `npx tsx qa/art-bands/validate-bands.ts` checks the piece and the pure data: offsets on the 4-px grid, the layout restored each cycle, the face sequence, and the strata steps.

## Acceptance (revision 1)
| Task | Check | Result |
|---|---|---|
| B1 P0 | paradox blocks visible on the band's floor at every width | pass: 4/4 blocks visible and on the floor at 1920 … 390, with motion and reduced motion (`paradox.json`) |
| B2 P0 | the shuffle runs at ≥ 1440 after the intro and after rebuilds; `finish()` on the current build; height jitter ignored | pass (`intro.json`: playing at ≈ 1.0 s; playing after a rebuild mid-intro) |
| B3 P1 | lg 128 / lg-narrow 96 / stacked 64; no diamond, no floor blocks; pair and cert on the floor; stacked stacks 2 high | pass (`frames-*`, `crisp/rm-*`) |
| B4 P1 | tiles read T C C → ? ? ? → ✓ ✓ ✓ in 60 s; 0 off-grid transforms; stacks on the same frames | pass (`sample-lg.json`: 4 cycles, 0 off-4, 0 anti-correlation breaks, 0 rigidity breaks) |
| B5 P1 | edge descends in 8-px steps; bands 72 / 56 / 48 / rest; no arc; grid only at content edges, rail lines and seams | pass (`strata.json`, 0 band-colour mismatches at 7 widths) |
| B6 P2 | dots fade 300 ms; stacked blocks enter from below the floor | pass (`intro.json`: 36 fade frames over 300 ms; stacked "from below") |
| B7 P2 | violet stack in the rail, not under text | pass: the stack sits in the rail (x 0…M) on the band's floor. On the real page (sections-1 now indents the copy to M + 40) no block overlaps the copy at 1920 … 390 (`paradox-real/paradox.json`). In the harness's older markup the copy starts at x = 40 and does overlap, so the section's indent is required |

## Engine fix made (integrator, please review)
- `src/engine/mount.ts`: `Mounted.destroy()` is now idempotent (a `destroyed` flag). The E5 self-destroy recursed:
  - an IO `stop` on a disconnected element called `destroy()`;
  - `destroy()` called `unobserve()`, whose disposer called `v.stop()`, which called `destroy()` again, until the stack overflowed;
  - the exception aborted the rest of that IntersectionObserver batch.

  On the page the trigger was the skeleton's pill `tc-glyph`, replaced by top.ts. The effect: the hero stage (and any other mount in that batch) never got `play()`. Before the fix, `page-hero.json` showed `playing: false` at every width; after it, `true`.

## Requests
- **sections-1:**
  - Hero: call `heroStage(root, { layout, intro: true })` and `intro()` at 700 ms. Call `finish()` in the fail-safe, and `setStatic()` only for a poster.
  - Paradox (B7): keep the copy indented past the rail at ≥ 1200 (`paradox.rail` px; already done on the page), and use `onRebuild` to re-wire the `?` flicker after the helper rebuilds itself across 1200 / 1440.
- **layout-core:** use `strata()` as above. Drop the blue `.footer__strata` background and the `::after` grid. Walkers' feet go at `surfaceY(x)`.
- **integrator (engine):** `staircase()` and `Stage`'s diamond name their canvases `.band`, which collides with the site's `.band` section class. Rename the class in the engine (bands works around it in `dusk()`).

## Critique rounds (revision 1)
1. **First hero stills (1440/1280/390).** Layouts right. The middle C (blue face) on the blue block reads through round-tile's silver outline, as specified. Kept.
2. **Strata pixel check.** Every column's edge read 1 px low: the canvas carried the site's `.band` border-top (the class collision above). Renamed, also in `dusk()`. The edge now reads 0/8/…/56 exactly, at DPR 1 and 2.
3. **Intro check.** The blocks were placed at rest once before sliding in: the rail ResizeObserver's initial report re-applied the shuffle state. It is now skipped during the intro and on the first report.
4. **Reduced-motion check.** `intro()` under reduced motion showed `? ? ?`, because `finish()` applied t = 0 instead of the poster. Fixed. The poster now reads ✓ ✓ ✓, with 0 px changing over 4 s.

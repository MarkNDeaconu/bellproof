# `bands` · card 15 · blocks, diamonds, strata, staircase (art-bands, fable)

The only art drawn at **B = 8**. Flat colour, so blocks are the engine's DOM `.block` divs; the diamond is a pulsing
piece mounted at `unit: BAND`; the staircase edge is a bitmap. This folder owns the **layout data**, the **choreography
data** and the **DOM helpers** sections call. The block engine itself (`src/engine/blocks.ts`: `Stage`, `stripe`,
`staircase`) belongs to the integrator.

Import: `import { heroStage, dusk, strata, paradoxStage, … } from '../art/bands'` (sections) · the `diamond` piece is
auto-registered like any other.

## API

### `heroStage(root, opts?) → HeroStage` (sections-1, `#top`)
Builds the hero blocks inside `root` (give it the hero's full content-box width and its height: `position:absolute; inset:0`
behind the text; the floor is the root's bottom edge; the root gets `.stage` with `overflow:hidden` so blocks sink out of view).

| opt | default | meaning |
|---|---|---|
| `bp` | from `innerWidth` (`lg ≥ 1024`, `md ≥ 768`, else `sm`) | force a breakpoint |
| `riders` | `{ pair: 'qubit-pair', cert: 'cert-mini' }` | piece ids; **missing pieces fall back to `placeholder`** (centred) |
| `autoplay` | `true` | idle choreography runs whenever the stage is in view (IntersectionObserver, ±200 px) |
| `intro` | `false` | `true`: blocks start outside the stage; call `intro()` (design: at 700 ms) to slide them in. Idle starts when it finishes |
| `width` | `root.clientWidth` | lay out for this width |

Returned `HeroStage`: `bp`, `stage` (engine `Stage`), `layout` (`HeroLayout`), `choreo` (`ChoreoStep[]`), `seq` (the yoyo
`Sequence`: `time`, `direction`, `playing`, `seek`, `reverse`…), `dots`, `riders` (`Mounted[]`), `diamond` (`Mounted`),
`intro(): Promise<void>` (enter: rails from the sides, floor blocks from below, 700 ms power4Out, stagger 100 ms, dots fade
in last 300 ms, floor sprites rise), `play()`, `pause()`, `setStatic()` (reduced motion: initial layout), `rebuild()`
(automatic on resize, keeps the choreography time), `destroy()`.

Reduced motion is handled inside: the stage lays out the initial state, nothing plays, the diamond shows its poster;
switching at runtime applies immediately. Sections need to do nothing.

Rider containers (`.rider`, `.bands-floor`) are `.px` spans mounted via `mountAll(root)`; they are children of their
block (or of the stage for floor sprites) so they stay glued through every move.

### `dusk(root) → { surfaceY(x), redraw(), canvas, height: 64 }` (sections-3, `#cta`)
The dusk staircase: a 64 px strip at the CTA band's bottom edge. Three tiers left → right in **night, violet, indigo**;
within each tier the surface descends 8 px per ⅛ of the tier width (y 0 → 56) and resets at the tier boundary; ink above
the surface. `surfaceY(x)` returns the surface's y from the strip top in **multiples of 8** (css px): walkers stand with
their feet at that y. Redraws itself on resize.

### `strata(root, opts?) → Strata` (layout-core, `#footer`)
Four 64 px bands **blue → cornflower → azure → mist** (256 px), grid-on-colour lines (horizontal every 80 px, verticals
48 px in from each edge and at the content-box edges), the 512 px quarter-arc at the right, and a walker slot:
`walker` (`.px.bands-walker`, `top = band 2 top − 56`, `left` = `opts.walkerX` (160) snapped to 4), `walkerMount`.
Move it with `moveUnits(walker, ux, 0)` only (multiples of 4 px). `opts.walker: false` for no slot; a missing
`qubit-walker` falls back to `placeholder` (`data-stand-in` set).

### `paradoxStage(root, opts?)` (sections-1, `#paradox`)
Static blocks for the paradox band: left edge indigo on the floor + violet above; right edge indigo + mist half with
`question-block` standing on it (placeholder until it lands).

### `gridlines(root, { inset = 48, contentInset })`
The grid-on-colour overlay on its own (used by `strata`; usable on the paradox band).

### Data
`MODULE` `{ lg: 128, md: 64, sm: 64 }` · `breakpointFor(vw)` · `heroLayout(bp, width, { riders })` · `heroChoreo(bp)` ·
`HERO_LG` (1360) / `HERO_MD` (736) / `HERO_SM` (390) · `HERO_CHOREO_LG` · `cycleMs(bp)` (`lg` 20 800, `md`/`sm` 12 000) ·
`MOVE_MS` 800 · `HOLD_MS` 1000 · `paradoxLayout(bp, width)` · `STRATA_BANDS` `['b','c','a','u']` · `STRATA_BAND_PX` 64 ·
`STRATA_WALKER_TOP` 8 · `DUSK_TIERS` `['n','v','i']` · `DUSK_HEIGHT` 64 · `rightCol(width, M)` · `snapWidth(width)`.

Right-anchored blocks use fractional columns computed from the stage width snapped **up** to the 4-px grid
(`ceil(W/4)·4`, ≤ 3 px overhang hidden by the overflow), so every rest position is a multiple of 4 whatever the width.
At 1440 (W = 1360), 768 (W = 736) and 390 the snap is 0 / 0 / 2 px.

### `diamond` piece
15×15 (`sm` 7×7), `loopTicks 36`, poster 6, palette `v i`, decorative. Ticks 0–1 of each loop are indigo (the pulse),
the rest violet. Mount with `mount(el, 'diamond', { unit: BAND })` (120 / 56 css px); `heroStage` does this inside the
diamond block with a 4 px inset so it is centred in its module.

## Layouts (col from the left edge in modules, row from the floor; cR = right-edge column)

| bp | blocks |
|---|---|
| lg (M 128) | L1 v (0,0) · L2 i (0,1) · L3 b (0,2) + `qubit-pair` · F1 c (1,0) · F2 u half (1,1) · R1 a (cR−1,0) + `cert-mini` · RR1 i (cR,0) · RR2 b (cR,1) · D diamond (cR,3) · reservoir RRa c (cR,−1), RRb a (cR,−2) · dots on L3 (top-right) and RR2 (top-left) |
| md (M 64) | L1 i (0,0) · L2 b (0,1) · F1 c (1,0) · F2 u half (1,1) · pair `sm` standing on the floor at x = 2M · R1 a (cR−2,0) + cert · RR1 i (cR,0) · D `sm` (cR,1) · reservoir c, a · dot on L2 |
| sm (M 64) | L1 i (0,0) · L2 b (0,1) · pair `sm` on the floor at x = M · RR1 i (cR,0) · D `sm` (cR,1) · reservoir c, a · dot on L2 |

Deviations from the design text, with reasons: at md the cert block sits one module in from the corner (cR−2) so the
96-px-wide cert never overlaps the corner stack or the diamond; the diamond rides a corner block (indigo) rather than the
cert block, because a 56 px diamond and a 96 px certificate cannot share a 64 px block.

## Choreography (start times; every move 800 ms `power4InOut`, quantised to 4 px)

| # | lg at | md at | sm at | move |
|---|---|---|---|---|
| 1 | 0.0 s | 0.0 s | 0.0 s | left stack sinks 1 M (bottom block goes under the floor) **and** right stack rises 1 M (cornflower emerges; diamond rises with it) |
| 2 | 1.8 s | — | — | left floor cornflower + mist half slide right 1 M |
| 3 | 3.4 s | 2.1 s | — | right floor azure (+ cert) slides left 1 M |
| 4 | 5.2 s | — | — | right floor azure sinks M/2 (cert sinks with it) |
| 5 | 6.8 s | 4.2 s | 4.2 s | left sinks again **and** right rises again (azure emerges) |
| 6 | 8.6 s | — | — | left floor block slides right 1 more M |
| | fwd 9.4 s · hold 1 s · reverse · hold 1 s = **20.8 s** | **12.0 s** | **12.0 s** | |

The card's start times are used verbatim (design §5.1 quotes "16.6 s" for the cycle; the card's six start times give
20.8 s. One constant table, `heroChoreo()`, if the director wants it tighter).

## Evidence · `qa/art-bands/`
Build: `BP_ONLY=bands,qubit-folk npx vite build --config qa/art-bands/vite.qa.config.ts --outDir .qa/art-bands` (the QA config adds
`qa/art-bands/bands-demo.html`, a harness for `?view=hero|dusk|strata|paradox|page`). Scripts: `sample.mjs` (transform sampler),
`crisp.mjs` (DPR crops, reduced motion, cycle equality), `validate-bands.ts` (validator for this folder only).

| File | What it shows |
|---|---|
| `hero-lg-cycle/sheet-every3.png`, `anim.gif`, `frame-*` | 260 frames at 83 ms of the lg idle cycle (1360×800), every 3rd frame on the sheet: the six moves, the hold, the reverse |
| `hero-lg-intro/intro-sheet.png`, `contact-sheet.png` | the slide-in: rails from the sides bottom-first, floor blocks from below, riders arriving on their blocks, then move 1 |
| `hero-md-cycle/sheet-every3.png`, `hero-sm-cycle/sheet-every3.png` | md (736×800) and sm (390×480) cycles |
| `still-hero-md/`, `still-hero-sm/` | md and sm layouts with the real `qubit-pair` and `cert-mini` riders |
| `sample-lg.json`, `sample-md.json`, `sample-sm.json` | ~1100 / ~700 / ~700 transform samples per cycle: **0 components not a multiple of 4 px**, **0 anti-correlation violations** (left Δy = −right Δy on every sample, stacks rigid), max 16 px between 16 ms samples, console clean |
| `crisp/crops-sheet.png` (+ `*-dpr1/1.5/2.png`) | 8× nearest-neighbour crops at DPR 1, 1.5, 2: the dot on the rail line, the diamond tip, a block corner, the pair's feet on its block: hard edges, no intermediate colours |
| `crisp/rm-0s.png`, `rm-6s.png`, `crisp.log` | reduced motion (`reducedMotion: 'reduce'` + `intro=1`): initial layout, dots shown, clock idle, **0 pixels differ over 6 s**; cycle equality: after forward + reverse the 11 block transforms equal the initial ones (0 differ) |
| `still-dusk-1440/768/390` | the dusk staircase under an ink band at three widths, azure markers standing on `surfaceY(x)` |
| `still-strata-1440/768/390`, `strata-walk/contact-sheet.png` | the footer strata with grid lines, the arc and the walker slot patrolling band 2 in 4 px steps |
| `still-paradox-lg/sm` | the paradox band blocks |
| `diamond-sheet/`, `diamond-sm-sheet-ink/`, `diamond-live-ink/contact-sheet.png` | the piece's 36 frames (pulse at ticks 0–1, poster 6 boxed), the `sm` variant on ink, 40 live frames on ink |

## Critique rounds
1. **Stills + first lg cycle.** Layouts right at all three widths; riders glued; diamond crisp. Found: (a) the engine's `Stage.choreo` wrote the
   *later* move's start value over the earlier one on the first seek, so the cornflower floor block began a column too far right and
   jumped back at 1.8 s (`sample-lg` initial x 256 ≠ 128; max step 124 px). Fixed in `blocks.ts` (per-move deltas summed; max step now 16 px).
   (b) the staircase canvas was `floor(width/8)` band px wide, leaving a 6 px gap at 390. Fixed (`ceil`, overhang clipped).
2. **md/sm cycles, DPR crops, reduced motion.** Anti-correlation exact at every sample; edges hard at DPR 1/1.5/2; reduced motion static.
   The "nothing lost" check first polled the wrong state (`dir −1, t 0` never occurs: the engine flips direction at the hold); corrected,
   0 blocks differ. Found: the intro gave the two hidden reservoir blocks the first two stagger slots (200 ms of nothing). Fixed in
   `Stage.enter()` (blocks under the floor keep their rest position and take no slot).
3. **Intro re-capture, strata patrol, diamond pulse on ink.** Bottom blocks now arrive first; the pair rides L3 in from the left and the
   cert rises with its block; the pulse reads on ink (2 ticks of indigo every 3 s, subtle but visible). Left as is: the night tier sits
   low-contrast against ink by design (it is the first step of the dusk ramp).

## Acceptance checklist (art-spec card 15 + common)
| # | Criterion | Result |
|---|---|---|
| 1 | Block `M×M` / half `M/2×M`, no border, no radius, ramp steps; neighbours differ by 1–2 steps | pass (one spec'd exception: azure floor block beside the indigo rail bottom at rest, 3 steps, as drawn in the card) |
| 2 | Diamond 15×15 at B (120 px) centred in M; `sm` 7×7 (56 px); pulses every 36 ticks v→i→v, colour swap only | pass (`diamond-sheet`, `crisp/diamond-tip-*`) |
| 3 | Hero stage lg layout per card (stacks, floor blocks, riders, diamond one module above, hidden reservoir, dots) | pass (`hero-lg-cycle/frame-000`, `sample-lg.json` initial) |
| 4 | Choreography: six moves, 0.8 s, `power4InOut`, start times 0/1.8/3.4/5.2/6.8/8.6 s, hold 1 s, yoyo, hold 1 s | pass (sampler departures 175/1975/3583 ms = start + the ~180 ms before the first 4 px step of a heavy ease; cycle 20.8 s) |
| 5 | All block edges on the 8-px grid at rest | pass at 1440/768 (W multiple of 8); at other widths right-anchored blocks are on the 4-px grid (see `snapWidth`) |
| 6 | All transforms multiples of 4 px during motion | pass (0 of ~2500 sampled components across lg/md/sm) |
| 7 | Rails move on the same frames in opposite directions in moves 1 and 5 | pass (0 violations; stacks rigid) |
| 8 | Nothing lost: after a full cycle the layout equals the initial layout | pass (`crisp.log` cycle line) |
| 9 | Reduced motion: initial layout, static | pass (0 pixels differ over 6 s; clock idle) |
| 10 | sm/md run moves 1, 3, 5 only, cycle 12 s | pass md (3 moves); sm runs 1 and 5 (there is no floor block to slide); both 12.0 s |
| 11 | Dusk staircase: 64 px, three tiers night/violet/indigo, 8 px per ⅛ tier, reset per tier, ink above; `surfaceY` in multiples of 8 | pass (`still-dusk-*`) |
| 12 | Footer strata: four 64 px bands blue/cornflower/azure/mist, grid-on-colour, quarter-arc right, walker on band 2 at top − 56 | pass (`still-strata-*`, `strata-walk`) |
| 13 | Paradox band blocks static | pass (`still-paradox-*`) |
| 14 | Common: validator clean, reads on paper and ink, loop seam invisible, poster meaningful, no white flashes | pass (`validate-bands.ts`; the diamond has no white) |
| 15 | Riders glued to their blocks through every move; integer-pixel edges at DPR 1/1.5/2 | pass (`crisp/pair-feet-*`, cycle sheets) |

## Engine fixes made in `src/engine/blocks.ts` (integrator, please review)
1. `Stage.choreo`: live position = start + Σ per-move deltas (was last-writer-wins; wrong start position for a block with two moves on one axis).
2. `staircase`: canvas width `ceil(width/8)` (was `floor`, leaving up to 7 px uncovered at the right).
3. `Stage.enter`: blocks hidden under the floor are skipped (they kept the first stagger slots).

## Requests
- `BlockDef` could accept `rider`-like `piece` for diamonds so `heroStage` need not swap the static canvas for the `diamond` mount.
- `Stage.choreo` bakes pixel positions at build time; `heroStage` rebuilds on resize (debounced 120 ms) to compensate. Computing positions
  lazily in the engine would remove that rebuild.
- Design §5.1 says the idle cycle is 16.6 s; the card's start times give 20.8 s. Say which; it is one table (`heroChoreo`).
- Design §5.1 places the fridge cell at x 1016–1400, overlapping the right rail; the layout here assumes the fridge cell is the last
  384 px of the *middle* column (as the ASCII diagram shows), so the right rail stack (up to 4 blocks + diamond at the top of its rise) stays clear of the fridge.

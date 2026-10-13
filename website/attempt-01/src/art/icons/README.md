# art-icons · card 11: UI glyphs, tags, cell icons and small loops

Owner: `art-icons` (opus). Folder: `src/art/icons/`. This folder is auto-discovered by `src/art/registry.ts`.
It holds 28 piece ids: 13 static 1-colour glyphs (rendered as inline SVG by `icon()`) and 15 canvases (idle loops and input-driven gestures). It also ships three browser helpers and one opt-in CSS file for pixel-step hovers.

| File | What |
|---|---|
| `ui.ts` | static glyphs `ui-*` and `social-*` (ASCII masks, variants for morph frames) |
| `tags.ts` | six 8×8 trust tags |
| `trust.ts` | the 16×16 `trust-loop`, `trust-target` and `trust-chain-check` |
| `blocks.ts` | `tc-glyph` and `question-block` (shared `?` drawing) |
| `check-scale.ts` | the balance |
| `cta.ts` | `cta-play`, `cta-code` and `cta-book` (hover gestures) |
| `shade.ts` | selective-outline shader (light from the upper left), so a mask can be rotated and re-shaded |
| `motion.ts` | `hoverable()`, `bumpOnce()`, `morph()` and `MORPHS` (browser only; nothing runs at import) |
| `icons.css` | `data-hop` pixel-step hover recipes for inline icon SVGs |
| `specimen/` | the specimen sheets: Node PNG generator, browser specimen page, capture scripts |

## Icon names

**Static glyphs.** All are 1 colour (`k`, recoloured by `currentColor`). Each is a 1-frame piece (`loopTicks 1`, `poster 0`).

| id | art px | CSS px at U | use (design-spec) | variants |
|---|---|---|---|---|
| `ui-chevron` | 5×5 | 20 | button trailing ›, menu rows, pill, accordion | `turn` (⌟, 45° in-between), `down` (⌄ in a 5×5 box), `left` (‹) |
| `ui-arrow` | 7×5 | 28×20 | sticky tab active row, text links "→" | |
| `ui-external` | 7×7 | 28 | ↗ with corner bracket: research cells, footer links, "arXiv ↗" | |
| `ui-external-sm` | 5×5 | 20 | ↗ alone, **for buttons and inline links** (added, see deviations) | |
| `ui-check` | 7×7 | 28 | Guaranteed rows, honest-provider cell | |
| `ui-warn` | 7×7 | 28 | Not-covered rows, cheating-provider cell | |
| `ui-close` | 7×7 | 28 | open mobile menu | |
| `ui-menu` | 7×7 | 28 | nav menu (3×3 dots) | `mid` (dots on the diagonals: menu → close in-between) |
| `ui-play` | 8×8 | 32 | nav "Watch the demo" ink cell | |
| `ui-caret` | 5×3 | 20×12 | ⌄ caret | |
| `social-g` `social-x` `social-d` | 7×7 | 28 | footer socials: a rounded tile with a 3×5 letter knocked out (letters only, no brand marks) | |

**Canvases.** Mount them with `data-piece`.

| id | art px | colours | cache | loop / inputs | use |
|---|---|---|---|---|---|
| `cta-play` `cta-code` `cta-book` | 6×6 | 1 (`a`) | none | 24 ticks; `hover`, `hoverAt` | CTA band cells (azure on ink) |
| `tag-disk` `tag-gpu` `tag-helix` `tag-candles` `tag-globe` `tag-chain` | 8×8 | ≤4 (`k t a b`) | loop | 30/27/33/36/39/24 ticks at 4 fps | trust chips: Storage, AI models, Genomics, Risk, Simulation, Rollups |
| `trust-loop` | 16×16 | 5 (`s m t l a`) | loop | 48 ticks at 4 fps | "Re-run it" cell |
| `trust-target` | 16×16 | 5 (`s t l b a`) | loop (static) | 1 | "Test it" cell |
| `trust-chain-check` | 16×16 | 5 (`s t l b a`) | loop (static) | 1 | "Prove it" cell |
| `tc-glyph` | 12×12 | 4 (`h t p a`) | loop | 36 ticks at 6 fps | announcement-pill tile (48 px) |
| `question-block` | 16×16 | 5 (`h t k a w`) | none | 36 ticks; `bump` (number) | paradox band, on the right stack |
| `check-scale` | 32×20 | 8 (`k s m t l a b w`) | loop | 60 ticks, poster 36 | "Check it" cell |

## Usage

**Static glyphs: SVG.**
```html
<i data-icon="ui-chevron"></i>                 <!-- hydrateIcons(): size 4 (20 px), aria-hidden -->
<i data-icon="ui-check" data-size="8"></i>     <!-- sizes 2 | 4 | 8 | 20 only -->
<i data-icon="ui-warn" data-label="Not covered"></i>   <!-- role="img" + aria-label -->
```
```ts
import { icon, iconSVG } from '../engine';
btn.append(icon('ui-chevron'));                                  // SVGElement
el.innerHTML = `Watch the demo ${iconSVG('ui-external-sm')}`;    // string, for templates
icon('ui-chevron', { variant: 'down' });                         // variants need icon()/iconSVG(); [data-icon] can't select them
```
The colour follows `currentColor`. Put the colour on the host, for example `.blue { color: var(--blue) }` for checks and `color: var(--alert)` for warns.

**Placement rule.** Icons must land on whole CSS pixels. My first specimen used `vertical-align: middle` in table cells, and that put boxes on half pixels. Centre icons with flex in boxes whose height minus the icon height is even, and keep `.icon { display: block }` inside the flex item. Examples: 48 − 20 = 28, 48 − 28 = 20, 48 − 32 = 16. Checked in `qa/art-icons/browser/report.json` → `fractionalBoxes: 0`.

**Canvases.**
```html
<span class="px" data-piece="tag-disk" data-decorative data-phase="7"></span>
<span class="px" data-piece="check-scale"></span>
```
**Input-driven pieces.** Use the helpers from `src/art/icons/index.ts`:
```ts
import { hoverable, bumpOnce, morph, MORPHS } from '../art/icons';
import { mountedOf } from '../engine';
hoverable(ctaCell, mountedOf(ctaCell.querySelector('[data-piece="cta-book"]'))!);   // pointer + keyboard focus
bumpOnce(mountedOf(questionBlockEl)!);          // call when the paradox band enters; plays 8 ticks once
morph(menuButton, open ? MORPHS.menuToClose : MORPHS.closeToMenu);       // 83 ms per step
morph(accordionHeader, open ? MORPHS.chevronToDown : MORPHS.downToChevron);
```
- **Why the helpers exist.** `frame()` only ever sees `tick mod period`, so one-shot gestures need a start tick inside the loop. The helpers set it:
  - `hoverable()` sets `hover` and `hoverAt`.
  - `bumpOnce()` sets `bump` and clears it again on the piece's `bumped` event.
- **Without the helpers.**
  - `hover=true` alone still plays the gesture, aligned to the 24-tick loop. That covers the harness and `frames.mjs --hover`.
  - `bump: true` bumps at every loop start until it is cleared.
- **Reduced motion.** All helpers are no-ops, or jump to the last step for `morph()`.
- **Events.** `question-block` fires `land` (tick 4 of the bump) and `bumped` (tick 7).

**Pixel-step hovers (CSS).** Import `src/art/icons/icons.css` once, for example from `components.css`: `@import '../art/icons/icons.css';`. Then put `data-hop` on the hover target:

| `data-hop` | for | motion (measured, `qa/art-icons/browser/hops.json`) |
|---|---|---|
| `step` | chevron, arrow | in: +1 px at 0 ms, +2 px at 83 ms; out: +1 px at 0 ms, 0 at 83 ms (design-spec §4.2) |
| `hop` | chevron (playful) | in: (+1,−1) → (+2,−1) at 83 ms → lands (+2,0) at 166 ms; out: steps back |
| `out` | external ↗ | (+1,−1) for 2 ticks, then back to rest |
| `press` | play ▶ | down 1 px for 2 ticks |
| `drop` | caret ⌄ | down 1 px for 2 ticks |

All moves are whole art pixels, in SVG user units, so the same CSS works at every icon size. `:focus-visible` behaves like hover. Under reduced motion, nothing moves.

## Deviations from the card (and why)

1. **`ui-menu` is a 7×7 bitmap at U, not "3×3 at 2U".** A 3×3 bitmap at 2U would be a solid square, and 2U would break the one-pixel-size rule. The design-spec's own number is 28 px. The result is 1-px dots with 2-px gaps, exactly the box of the `ui-close` it morphs into.
2. **`social-*` are 7×7, not 6×6.** A 3×5 letter cannot sit inside a 6×6 rounded tile with even margins. At 7×7 the margins are 2/2 horizontally and 1/1 vertically. The glyph is 28 px instead of 24.
3. **`ui-warn`'s diamond has 3-px flat tips.** A 1-px-stepped 7×7 diamond read as a spiky bug at 28 px (round 3). The ! is knocked out: 3-px bar, gap, dot.
4. **`check-scale` uses 8 colours.** The card lists 7 but also asks for a `w` blink.
5. **Added `ui-external-sm` (5×5 ↗).** The 7×7 bracket version outweighed both the button label and the 20-px chevron beside it (round 3).
6. **Added variants for morphs:** `ui-chevron:turn|down|left` and `ui-menu:mid`.
7. **Tag idle rhythm.** The azure pixel rests at A and hops to B for 2 frames (6 ticks) once per loop. Loop lengths differ (24 to 39 ticks), so the six chips never blip together. A constant 4 fps A/B flip on six chips read as flicker.
8. **`trust-target` and `trust-chain-check` are static,** as the card says. Each has its one azure accent pixel.

## Critique rounds

**Round 0: exploration** (`qa/art-icons/r0-candidates.png`, `r0-tags.png`, `r0-cta.png`)
- **Chevron.** A 2-px-run chevron is bolder, but it breaks the family. The 1-px chevron is the arrowhead of `ui-arrow` and, rotated, it is the caret. Chosen: 1 px.
- **External.** The plain ↗ is clean, but ↗ + corner bracket (`ext-B`) says "leaves the site". Chosen: B.
- **Warn.** An outline diamond with a "!" cannot fit 7×7: the dot always merges with the bottom vertex. Only a knock-out works.
- **Tags.** Silhouettes in `k` vanish on ink. Rule adopted: silhouettes in `t`/`b`, and `k` only for inner detail.
- **Code and book.** For code, `{ }` braces read; 3-px angle brackets do not fit. No book candidate reads yet.

**Round 1** (`qa/art-icons/*-r1.png`)
- **Fail: `cta-book`.** The hollow pages read as two boxes or a cat face.
- **Fail: `tag-chain`.** The diagonal 1-px-hole chain reads as a zipper.
- **Fail: `trust-chain-check`.** Collinear capsules merge into one ladder, and the interlock is invisible.
- **Fail: `trust-loop`.** The head (4-2) is too small and crosses into the ring like a ⏻. Inner edges are shaded navy because the gap makes the hole "outside".
- **Weak: `question-block`.** Its 3×2 feet make it a TV on a stand.
- **Specimen bugs.** The title overlapped the size labels, and canvases were drawn in `currentColor`.

**Round 2** (`*-r2.png`)
- **Fixes:**
  - book: solid fanned pages with a 1-px gutter (the only candidate that reads as 📖);
  - chains: two interlocked rounded-square rings, 1-px at 8×8 and 2-px at 16×16, where B's corner passes through A's hole so each is over the other once;
  - loop: centred 12-px ring with a 5-3-1 head, and inner edges shaded `m` by radius;
  - question-block: ankle + outward sole feet.
- **Remaining:**
  - `social-x` (3×5 X knocked out) reads close to "8" at 14 px.
  - The play triangle is heavy.
  - The warn is much heavier than the check.

**Round 3: browser, in context** (`qa/art-icons/browser/dpr2-ctx.png`)
- **Fixes:**
  - the warn read as a spiky magenta bug, so its tips are flattened and the ! is longer;
  - the 7×7 ↗ dominated "Watch the demo" next to the 20-px chevron, so `ui-external-sm` was added for buttons;
  - `ui-play` had a blunt 2-row tip and read as a sideways tree, so it is now 1-3-5-7 with single-pixel corners, shifted one column right for optical centring.
- **Found:** fractional icon boxes in table cells. The specimen moved to integer grids, and the placement rule was added.

**Round 4: hover and live frames** (`qa/art-icons/browser/cta-hover/`, `hops.json`, `live/`)
- **Fixes:**
  - `cta-play`'s 2:1 stair ended in a 2-px spike that read as a pin, so it is now a 1:1 stair (2-3-4-3-2);
  - the `hop` recipe snapped home on leave (fill `both` masked the transition), so the fill is now `backwards` and it steps back;
  - in the squash frame of `question-block`, the `?` dot touched the shadow row, so the shadow row hides while squashed.

## Timelines (as built; 1 tick = 83.3 ms)

- **Tags** (4 fps). The azure pixel moves from A to B for ticks [hop, hop+6):
  - disk: (5,3) → (5,5) at 18; loop 30;
  - gpu: (3,3) → (4,4) at 9; loop 27;
  - helix: (3,3) → (4,4) at 21; loop 33;
  - candles: (6,0) → (6,1) at 27; loop 36;
  - globe: (1,3) → (6,3) at 12; loop 39;
  - chain: (5,0) → (2,7) at 15; loop 24.
  - Poster 0 is pixel A.
- **`trust-loop`** (4 fps, loop 48):
  - 0–35: head at the top;
  - 36–38: right (pointing down);
  - 39–41: bottom;
  - 42–44: left;
  - 45–47: top.
  - It is shaded per frame, so the light stays at the upper left.
- **`tc-glyph`** (6 fps, loop 36). Two azure pixels run along the paper bevel:
  - 0–1: (2,1) and (1,2);
  - 2–3: (4,1) and (1,4);
  - 4–5: (6,1) and (1,6);
  - 6–35: rest. Poster 0.
- **`question-block`** (12 fps, loop 36).
  - Idle: the `?` turns azure at ticks 30–31.
  - Bump (8 ticks from `bump`):
    - 0: squash (16×11);
    - 1–2: up 2 px, feet airborne, `w` glint on tick 2;
    - 3: up 1 px;
    - 4: landing squash (`land`);
    - 5–7: rest (`bumped` on 7).
  - Poster 0 is rest.
- **`check-scale`** (12 fps, loop 60):
  - 0–11: level;
  - 12–14: left-down;
  - 15–17: level;
  - 18–20: right-down;
  - 21–23: level;
  - 24–47: right-down, the light side wins; `a` → `w` on 30 and 42;
  - 48–59: level.
  - Poster 36. A tilt moves each beam end 2 px with runs 3-6-6-6-3; the pivot run never moves.
- **`cta-*`** (12 fps, gesture loop 24 while hovered):
  - play: pressed on ticks 0–1;
  - code: `{ }` → `| |` on ticks 0–1;
  - book: lift on ticks 0–1, edge-on sliver on 2–3, land on 4–5.

## Acceptance checklist

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | `npm run validate` passes for every id: palette-only, ≤ maxColours, exact loop, poster in loop | **PASS**: 28 ids, 0 errors. Warnings, all expected: orphan pixels on 1-px glyphs (stair-step diagonals and dots have no orthogonal neighbours by design); L-corners on `tag-gpu`'s closed chip outline | `qa/art-icons/validate.txt` |
| 2 | Reads at 1× and 4×, on paper and on ink | **PASS** (one weak spot: `social-x` at 14 px; labelled in context) | `qa/art-icons/specimen-*-final.png`, `browser/dpr1-*.png` |
| 3 | Light from the upper left, no pillow shading, no banding, no stray orphans | **PASS**. The trust ring is torus-shaded by position | `specimen-cells-final.png` |
| 4 | Loop seams invisible | **PASS** | `qa/sheets/<id>.png`, `frames-*-final.png` |
| 5 | Live frames match the timelines (±1 tick) | **PASS** | `qa/art-icons/live/*/contact-sheet.png`, `browser/cta-hover/`, `browser/qb-bump/` |
| 6 | Posters meaningful (`check-scale` 36 settled on the light side; others rest) | **PASS** | sheets (poster boxed azure) |
| 7 | White flashes ≤ 1 tick, ≤ 3/s | **PASS**: `check-scale` 2 single ticks per 5 s; `question-block` glint 1 tick per bump | |
| 8 | Every static icon pixel-identical in canvas and SVG | **PASS**. In-page SVG raster vs bitmap: 68/68 at DPR 1 and DPR 2. Live screenshot of inline SVG vs canvas twin: 17 rows × 4 sizes, 0 diffs at DPR 1 and DPR 2 | `browser/report.json` |
| 9 | All 1-colour icons read at 20–28 px | **PASS** | `browser/dpr2-ctx.png` |
| 10 | No brand logos | **PASS**: the socials are plain 3×5 letters | |
| 11 | Consistent stroke and optical size | **PASS**: 1-px strokes and 1:1 stairs throughout; one chevron shape reused in the arrowhead, caret and morph; the 7×7 set fills its box; the check spans 7×5 and is centred. The warn is deliberately a heavier badge | rounds above |
| 12 | Small loops brief and delightful | **PASS**: every gesture is 2–6 ticks; step/hop/out/press/drop measured in art px | `browser/hops.json`, `browser/morph-*/` |
| 13 | Reduced motion: posters, no hover motion | **PASS**: the sprite grid is identical across 1.5 s; the hovered rect's transform is `none` | `browser/report.json`, `browser/rm-*.png` |
| 14 | Console clean | **PASS** at DPR 1 and DPR 2 | `browser/report.json` |

## Evidence index

- **Node specimen** (every icon at 2/4/8/20 px on paper and ink, plus all frames):
  - `qa/art-icons/specimen-{glyphs,small,cells,scale}-{r1..r4,final}.png`
  - `qa/art-icons/frames-{small,cells,scale}-*.png`
  - Regenerate: `npx tsx src/art/icons/specimen/sheets.ts qa/art-icons --tag final`
- **Browser specimen:**
  - Build: `BP_ONLY=icons npx vite build --config src/art/icons/specimen/vite.config.ts --outDir .qa/art-icons`
  - Capture: `node src/art/icons/specimen/capture.mjs`, then `node src/art/icons/specimen/hops.mjs` → `qa/art-icons/browser/`
- **Engine sheets:** `qa/sheets/{tag-*,trust-loop,tc-glyph,question-block,check-scale,cta-*}{,-ink}.png`
- **Live harness frames:** `qa/art-icons/live/{check-scale,trust-loop,tc-glyph,tag-disk,question-block-bump,cta-book-hover,cta-play-cell-hover}/`

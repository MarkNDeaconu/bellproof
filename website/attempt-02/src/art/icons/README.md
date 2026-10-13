# art-icons · card 11: UI glyphs, tags, cell icons and small loops

## Revision 1 (attempt-02): API for the new and changed pieces

These are the tasks I1–I5 from `research/briefs/revision-1.md` §1.9 and §2. Evidence is in `qa/art-icons/rev1/`. The validator only renders default inputs, so `npx tsx src/art/icons/specimen/sweep.ts` sweeps every face, flip, fade and hover over the period and checks palette and colour count. Current result: 3 516 frames, 0 problems.

### `round-tile` (I1): for art-bands' T/C shuffle
| | |
|---|---|
| size | 24×24 (96 px at U); variant `md` 16×16 (64 px) |
| faces | `'?'` hairline face + steel glyph · `'T'` violet + white · `'C'` blue + white · `'ok'` azure + ink ✓; 1-px silver outline with rounded corners; 1-px white specular at the top-left |
| cache | `'none'`, loop 36, poster 0 (the `?` face). Pure under tick + 36 with default inputs |
| inputs | `face` (`'?'`, default) · `flip` (tick, −1) · `fade` (tick, −1) · `from` (face, `'?'`) · `shimmer` (bool, true) |
| state() | returns the face (`states: ? T C ok`), for labels |

```ts
import { flipTile, fadeTile } from '../art/icons';
const m = mount(rider, 'round-tile', { variant: M === 128 ? undefined : 'md', decorative: true });
flipTile(m, 'T');          // edge-on (tick +1), half width (+2), then T. Into 'ok': + 1 white tick
fadeTile(m, '?');          // 4-tick ordered-dither fade from the current face (used after the verdict)
flipTile(m, 'ok', true);   // instant face change (reduced motion does this automatically)
```
- **Flip timing.** The 2-frame flip occupies ticks `flip` and `flip + 1`; the new face shows from `flip + 2`. Into `'ok'`, `flip + 2` is a white tile for one tick and the ✓ shows from `flip + 3`.
  - The helpers start on `mounted.localTick + 1`, the next tick drawn. Setting `localTick` itself would skip the edge-on frame.
  - To stagger the three tiles by 2 ticks (the verdict), call the helper 2 ticks apart.
- **Shimmer** runs on the `?` face only. Two azure glints run along the lit edges at ticks 0–5 of every 36. Use `data-phase` or `{ phase }` to desynchronise the three tiles.
- **Glyphs.** The tile uses bold glyphs instead of the spec's 5×7 / 3×5 font: 2-px stems with 1-px stair curves, 8×12 (24 px tile) and 6×10 (md), the ✓ 12×10 / 10×8.
  - They centre exactly in the even faces. The font glyphs sat half a pixel off and read small on a 96-px tile.
  - Comparison: `rev1/i1-r0-glyphs.png` shows spec vs bold on paper, ink, indigo, blue and cornflower.

### `tc-glyph` (I3): the pill tile
- **Sizes.** 12×12; variant **`sm` 8×8** (32 px) for the revision-1 pill's 32×32 square tile.
- **Inputs.** `cache: 'none'`; inputs `hover` and `hoverAt`. Wire it with `hoverable(pillEl, mounted)`.
- **Hover sequence.** On hover: ? → T → C → ?. Each face is held 2 ticks and joined by 2-frame narrow flips:
  - phase 0: edge · 1: half T · 2–3: T · 4: edge · 5: half C · 6–7: C · 8: edge · 9: half ? · 10+: ?
  - It repeats every 2 s while hovered.
- **Faces.** T faces are violet (`v`) with an indigo bevel; C faces are blue (`b`) with a cornflower bevel. Glyphs are white.
- **Idle.** Every 3 s, two azure pixels run along the paper bevel.
- **Poster:** tick 6 (a clean `?`).

### `question-block` (I2): the flicker replaces the bump
- **Input.** `flicker` (tick, −1) replaces `bump`. `flickerOnce(mounted)` starts it on the next tick. Call it when the mount is playing, e.g. from the paradox band's reveal (qa-pixel #16).
- **Sequence.** 14 ticks: ? T C ? T C ? at 2 ticks each. T is violet and C is blue. The face pulses `h → u → h`. No vertical motion. Event `'flickered'` fires on the last tick.
- **Removed.** `bump`, `bumpOnce` and the squash and jump frames.

### `ui-pause`, `ui-play-sm` (I4): pause-motion toggle
- **`ui-pause`:** 5×5, two 2-px bars.
- **`ui-play-sm`:** 5×5 ▶ in the same box (the 1:1 stair 2-3-4-3-2, optically centred). Swapping them never resizes the nav cell.
- **Do not pair `ui-pause` with `ui-play`.** `ui-play` is 8×8 / 32 px.
- **Usage:** `btn.replaceChildren(icon(paused ? 'ui-play-sm' : 'ui-pause'))`, or `<i data-icon="ui-pause"></i>`.

### `cta-play`, `cta-code`, `cta-book` variant `lg` (I4): 12×12, 48 px
```html
<span class="px" data-piece="cta-book" data-variant="lg" data-decorative></span>
```
`hoverable(cellLink, mounted)` plays the gesture on cell hover or focus (the gestures are the same as at 6×6):

| piece | lg drawing | gesture |
|---|---|---|
| `cta-play` | a screen (rounded frame, neck, foot) with a ▶ inside | ▶ presses 1 px |
| `cta-code` | `</>`: chevron-family brackets and a 2:1 slash | the slash blinks out for 2 ticks |
| `cta-book` | an open book: solid fanned pages, gutter, two text lines per page | a page flips right → left (lift, edge-on, land) |


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
| `motion.ts` | `hoverable()`, `flipTile()`, `fadeTile()`, `flickerOnce()`, `morph()` and `MORPHS` (browser only; nothing runs at import) |
| `round-tile.ts` | `round-tile` (revision 1) |
| `icons.css` | `data-hop` pixel-step hover recipes for inline icon SVGs |
| `specimen/` | the specimen sheets: Node PNG generator, browser specimen page, capture scripts |

### Revision 1 critique rounds
**Round 0: exploration.**
- **round-tile glyphs** (`rev1/i1-r0-glyphs.png`). The spec's 5×7 / 3×5 font glyphs sit half a pixel off centre in even faces, and the 3×5 ✓ reads as √. The bold custom glyphs (2-px stems) centre exactly and read at 1× on paper, ink, indigo, blue and cornflower. Chosen: bold.
- **I5** (`rev1/i5-r0-candidates.png`):
  - Helix A (1-px strands crossing twice, azure rungs) reads as DNA; the old map read as a "Z".
  - Candles: steel bodies merge with a steel baseline, and 3-px bodies collide in 8 px. So: 2-px bars, wicks on each bar's right column, and the down-bar one row clear of the baseline.

**Round 1** (`rev1/*-r1.png`)
- **Pass.** The flips (edge-on, half width, face; ✓ with a white tick) and the dither fade read. The tc-glyph hover reads at 12 px and at `sm` 8 px.
- **Fail: question-block.** Steel T/C on the mist pulse is low contrast. Fixed: T in violet, C in blue, the tile colours.
- **Fail: cta-book lg.** The single spine pixel read as a tail. Fixed: the bottom edge is closed by the spine.
- **Fail: cta-play lg.** The solid 9×10 ▶ outweighed `</>` and the book. Fixed: a screen with a ▶ ("watch").

**Round 2** (`rev1/*-r2.png`, `browser/rev1/`)
- All fixes read. In context, the tiles read on the indigo, blue and cornflower blocks at M 128, 96 and 64: `browser/rev1/strip-tiles-128.png`.
- Pill hover frames: `browser/rev1/strip-pill.png`.
- CTA cells: `browser/rev1/cta-lg*-t*.png`.
- Flicker on the band: `browser/qb-flicker/`.
- Known compromise: a `C` tile on the blue block relies on its silver outline to separate.

### Revision 1 acceptance
| task | check | result |
|---|---|---|
| I1 | four faces legible at 1× on paper and ink; flip 2 frames; pure under +period | **PASS**: `rev1-round-tile-r2.png` (1× column); flip = edge-on + half width; validator purity with defaults; sweep 0 problems |
| I2 | flicker replaces bump (qa-originality #10); no vertical motion | **PASS**: `rev1-blocks-frames-r2.png`, `browser/qb-flicker/` |
| I3 | `tc-glyph` `sm` 8×8 + hover ?→T→C→? (qa-originality #2) | **PASS**: `rev1-blocks-frames-r2.png`, `browser/rev1/strip-pill.png` |
| I4 | `ui-pause` 5×5 (+ `ui-play-sm`); `cta-*` `lg` 12×12 | **PASS**: `rev1-small-r2.png`, `rev1-cta-lg*-r2.png`; SVG parity 76/76 at DPR 1 and 2 |
| I5 | helix two strands + rungs; candles 3 bars + wicks (qa-pixel #12) | **PASS**: `qa/sheets/tag-helix*.png`, `tag-candles*.png` |
| all | `npm run validate` on every id | **PASS**: 31 ids, 0 errors; 3 expected orphan-pixel warnings (the 1-px dots of `ui-menu`, the 1-px pins of `tag-gpu`, single shading pixels on `trust-chain-check`'s links) (`rev1/validate.txt`); console clean; 0 fractional boxes |

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
| `question-block` | 16×16 | 7 (`h t k a u v b`) | none | 36 ticks; `flicker` (tick) | paradox band, on the right stack |
| `round-tile` | 24×24, `md` 16×16 | 8 (`l h t v b a k w`) | none | 36 ticks; `face`, `flip`, `fade`, `from`, `shimmer` | hero right-rail tiles (revision 1) |
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
import { hoverable, flickerOnce, flipTile, fadeTile, morph, MORPHS } from '../art/icons';
import { mountedOf } from '../engine';
hoverable(ctaCell, mountedOf(ctaCell.querySelector('[data-piece="cta-book"]'))!);   // pointer + keyboard focus
flickerOnce(mountedOf(questionBlockEl)!);       // call when the paradox band enters (mount playing); 14 ticks once
morph(menuButton, open ? MORPHS.menuToClose : MORPHS.closeToMenu);       // 83 ms per step
morph(accordionHeader, open ? MORPHS.chevronToDown : MORPHS.downToChevron);
```
- **Why the helpers exist.** `frame()` only ever sees `tick mod period`, so one-shot gestures need a start tick inside the loop. The helpers set it:
  - `hoverable()` sets `hover` and `hoverAt`.
  - `flickerOnce()` sets `flicker` to the next tick. Since E9 the tick is absolute, so nothing has to be cleared.
- **Without the helpers.**
  - `hover=true` alone still plays the gesture, aligned to the 24-tick loop. That covers the harness and `frames.mjs --hover`.
- **Reduced motion.** All helpers are no-ops, or jump to the last step for `morph()`.
- **Events.** `question-block` fires `flickered` on the flicker's last tick.

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
  - Flicker (14 ticks from `flicker`, revision 1): ? T C ? T C ? at 2 ticks each; T is violet and C blue; the face pulses `h → u → h`; `flickered` on tick 13.
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
| 5 | Live frames match the timelines (±1 tick) | **PASS** | `qa/art-icons/live/*/contact-sheet.png`, `browser/cta-hover/`, `browser/qb-flicker/` |
| 6 | Posters meaningful (`check-scale` 36 settled on the light side; others rest) | **PASS** | sheets (poster boxed azure) |
| 7 | White flashes ≤ 1 tick, ≤ 3/s | **PASS**: `check-scale` 2 single ticks per 5 s; `round-tile` 1 white tick per verdict flip | |
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

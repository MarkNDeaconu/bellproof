# cascade-coin · tokens on a conveyor

Art-spec card 14, placed in design-spec §5.4 B (the drug-pipeline staircase). A wrong ΔE enters at the quantum job as one small token on a little conveyor cart. At each stage the cart passes under, one more token drops onto the stack, so the cost grows. At clinical trials the tower wobbles, then it dissolves and the run restarts.

| | |
|---|---|
| id | `cascade-coin` |
| size | 32×24 art px → 128×96 CSS px |
| cache | `'none'` (driven by inputs) |
| loopTicks / period | 24 (the belt loop) / 240 (the in-place story run) |
| poster | tick 0: stack 3, belt still. This is the same frame in both modes (verified equal). |
| palette | 9 keys: `w a c b u` (tokens: glint, face, rim, rim shadow, smear/spark tail) and `l t m s` (conveyor). No alert keys: the card gives this piece none, and the alert line is the section's connector. |
| files | `index.ts` (piece + re-exports), `parts.ts` (bitmaps), `timeline.ts` (pure choreography) |

## Inputs (what the cost section drives)

| input | type | default | meaning |
|---|---|---|---|
| `stack` | number 0–5 | 3 | Tokens on the belt. From the card. 0 is an empty belt, used at the start of a run. |
| `wobble` | boolean | false | The top two tokens lean 1 px left and right at 6 fps. From the card. |
| `belt` | boolean | false | Treads scroll right 1 px/tick, using the mount's tick. From the card. |
| `age` | number | 99 | Ticks since `stack` last grew. Drives the drop, smear, squash, sparks and glint. **Without it a new token pops in without dropping.** |
| `fade` | number 0–4 | 4 | Ordered-dither dissolve level (4 = solid, 0 = gone). |
| `travel` | number | −1 | Belt distance in px. When ≥ 0 it sets the tread and roller phase, so the treads stop exactly where they were instead of snapping (`belt` is then ignored). |
| `mode` | `'drive'` \| `'story'` | `'drive'` | `story` plays the whole cascade in place on the piece's own clock and ignores the other inputs. Use it for the harness or a layout where the cart cannot travel. |

Events: `'land'` fires on the squash tick. `state()` returns `stack-N` in drive mode and the phase name in story mode.

### The easy, correct way: `cascadeAt()`

`timeline.ts` exports a pure function that returns, for any tick of a run, both where the canvas goes and the inputs to set, so the section never times anything by hand:

```ts
import { clock, motion, moveUnits, mountedOf, observe, TICK_MS } from '../engine';
import { cascadeAt } from '../art/cascade-coin';          // or mountedOf(el)!.piece.exports.cascadeAt

// el: <span class="px" data-piece="cascade-coin" data-decorative>, absolutely positioned so that at x = 0 it is
// centred under bar 1 (left = column centre − 64 px) and its bottom row (the belt underside) sits on the connector.
// lane: the full-width wrapper the span rides in (anything but `el` itself, see below).
const m = mountedOf(el)!;
const gap = colWidthPx / 4;                               // art units between bar centres (rounded inside)
if (motion.reduced) {
  moveUnits(el, 4 * Math.round(gap), 0); m.set('stack', 5); // end state: the tall tower under "Clinical trials"
} else {
  let t = 0;                                              // run ticks; advances only while visible
  const sub = { kind: 'frame' as const, onFrame(_now: number, dt: number) {
    t += dt / TICK_MS;
    const f = cascadeAt(t, { gap });
    moveUnits(el, f.x, 0);                                // whole units only: 4-px steps
    for (const [k, v] of Object.entries(f.inputs)) m.set(k, v);
  } };
  // observe the LANE, not `el`: visibility keys by element, so observing the piece's own span would replace the
  // mount's registration and its tick clock (belt, wobble) would never start
  observe(lane, { play: () => clock.add(sub), stop: () => clock.remove(sub) });
}
```

The default options (`speed: 2` units/tick, `dwell: 22`, `wobble: 36`, fades of 8) give **≈ 60 ticks per bar** on the lg layout (gap 62–64 → a 300–304-tick run, about 25 s), which matches design-spec §5.4. During `rest` (fade 0) the canvas is invisible while `x` returns to 0. `cascadeTicks(opts)` gives the run length. For small layouts (the horizontal bar chart), put the piece in place with `data-io-mode="story"` instead of driving it.

## Timeline as built (frame by frame)

**Drop of token n** (`age` a; it lands at L = 6, 5, 4, 3, 2 for n = 1…5; rest rows 17, 14, 11, 8, 5):
- a = 0: the token enters at the top edge (top row −1, so it slides in rather than popping into mid-air).
- 1 … L−2: it falls 3 px/tick.
- L−1: the **smear**, a straight-sided 8×6 stretch (a `u` tail, `a` body, the rim at the bottom), 1 px above rest.
- L: the **squash**. The token flattens to 10×2 and the stack below gives 1 px (the bottom chip is pressed to 8×2). A `c` spark appears 1 px clear of each side of the seam.
- L+1: settled. The sparks move 1 px out and up, in `a`.
- L+2: the sparks fade to `u`, and a `w` glint starts sliding along the new top token's lit rim (x+3).
- L+3 and L+4: the glint reaches x+4, then x+5. After that the token holds, with its fixed glint at rim x+1.

**Wobble:** a 16-tick cycle at 6 fps, as [top, second] offsets: [0,0] [+1,0] [+1,+1] [+1,0] [0,0] [−1,0] [−1,−1] [−1,0]. The top token leans first and the one below follows. The pair never forms an S.

**Belt:** tread seams `t` sit every 4 px as one 3-px vertical cluster over the top run `l` and body `m`, above a navy `s` underside. They scroll right 1 px/tick. Each roller (a navy wheel with a lit rim and a steel hub) turns its bolt a quarter turn per 4 px, clockwise. At phase 0 the bolt parks on the shaded hub pixel.

**Dissolve:** ordered Bayer 4×4 at levels 3 3 2 2 1 1 0 0. Drive mode dissolves the whole canvas; story mode dissolves only the tower and keeps the conveyor.

**Story mode, piece ticks** (offset so that tick 0 is the poster):
- 0: stack-3 hold.
- 10: travel.
- 26: drop 4 (lands at 29).
- 50: travel.
- 66: drop 5 (lands at 68).
- 90: wobble.
- 120: dissolve.
- 128: rest.
- 140: enter.
- 146: drop 1 (lands at 152).
- 170: travel.
- 186: drop 2 (lands at 191).
- 210: travel.
- 226: drop 3 (lands at 230).
- 239 → 0: seamless.

**Section run, gap 62:**
- 0: enter.
- 8: drop 1.
- 30: travel.
- 61: drop 2.
- 83: travel.
- 114: drop 3.
- 136: travel.
- 167: drop 4.
- 189: travel.
- 220: drop 5.
- 242: wobble.
- 278: dissolve.
- 286: rest.
- 300: wraps.

## Sheets and evidence (all opened and reviewed)

- Engine sheets (default inputs: stack 3, still): `qa/sheets/cascade-coin.png` and `qa/sheets/cascade-coin-ink.png`
- Final input-scenario sheets, `qa/art-cascade-coin/`:
  - `final-stacks.png`: poster and stacks 0–5, on paper and on ink
  - `final-drops.png` and `final-drops-ink.png`: every drop, n = 1…5, frame by frame
  - `final-misc.png`: wobble, belt and dissolve
  - `final-story.png`: all 240 story ticks
  - `final-1x.png` and `final-2x.png`: silhouettes
- Rounds: `qa/art-cascade-coin/rounds/` (r0 exploration, r1–r3 stacks, drops and misc)
- Live frames from the built harness (`BP_ONLY=cascade-coin`):
  - `live-story-a/` and `live-story-b/`: 96 frames each, covering every stage, the wobble, the dissolve and the restart
  - `live-belt/`
  - `live-wobble-ink/`
  - `poster-paper/` and `poster-ink/`
  - `reduced-motion-story/` and `reduced-motion-ink/`
  - `posters-and-reduced.png`
- Section simulation: `qa/art-cascade-coin/sim-section/` (a mock staircase and alert connector at 1280 px, driven by `cascadeAt` through `__bp`; 64 frames plus `log.txt`). Stops landed at x = 0/64/128/192/256 units, every transform was a 4-px multiple, and the console was clean. `sim-zoom.png` shows it in context.

## Critique rounds

- **r0, exploration** (`rounds/r0-explore-belts-tokens.png`). The first chips, with a full-width middle row, made the stack read as a screw or spring. Vertical treads read as a conveyor best. A thin dark loop read as a rail. Indigo edge pixels fringed like chromatic aberration. Decisions: straight-sided chips, and a segmented belt between two wheels.
- **r1** (`rounds/r1-*.png`) had five problems:
  - The rim's shadow wedge stepped from 1 px to 4 px and looked like bricks.
  - The `w` glint sat on the silhouette's top edge, which reads as a hole on paper.
  - The smear was a pointed bullet.
  - The sparks touched the squash.
  - Rigid wobble, plus 17 orphan pixels (single tread pixels and roller highlights).

  Fixes: a 2→3-px shadow diagonal, the glint moved inside onto the lit rim, a straight-sided smear, sparks moved 1 px clear, tread seams as a 3-px cluster, and entry from the top edge.
- **r2** (`rounds/r2-*.png`). The stacks now read as glossy chips. Two problems remained: the wobble with a lag wiggled into an S (jelly, not teetering), and the rollers vanished on ink. Fixes: a lean sequence (|top| ≥ |second|, same side), and rollers with a lit `m` rim and a steel hub. Orphans dropped to 0.
- **r3** (`rounds/r3-*.png`). The lean wobble works and the rollers read on ink. In story mode the conveyor vanished with the tower, which looked odd in place. Fix: the story-mode dissolve affects tokens only. Story timing was rebalanced to keep 240 ticks.
- **r4** (final). The live reduced-motion capture of story mode showed an **empty belt** as the poster. Fix: the story clock is offset by 100 so the poster is the stack-3 hold, identical to drive mode. The bolt at phase 0 had sat on the lit hub pixel, which read as a hook; it is now parked on the shaded pixel, with a quarter turn per tread pitch so stops park consistently.

## Acceptance

| criterion | result |
|---|---|
| `npm run validate -- cascade-coin`: palette-only, ≤ maxColours, exact loop, poster in the loop | **pass**, 0 errors and 0 warnings (frame(240) = frame(0) in both modes, checked) |
| Reads at 1×/2× and at 4×, on paper and on ink | **pass** (`final-1x/2x`, `final-stacks`, the ink posters) |
| Light from the upper left; no pillow shading, no banding, no stray orphans | **pass** (0 orphans; the shadow sits lower right; the glint upper left) |
| The loop seam is invisible | **pass**: story 239 → 0 are identical empty, still belts; the belt loop is 4/16-tick periodic inside 240 |
| Live frames match the timeline within ±1 tick | **pass**: the drop, squash, glint, wobble and dissolve order matches in `live-story-*`. The capture spacing is about 1.5 ticks, and no beat is out of order. |
| The poster is meaningful and matches the card (stack 3, belt still) | **pass**, in both modes |
| White ≤ 1 tick and ≤ 3/s | **pass**: `w` is only a 1-px glint, never a flash frame |
| A stack of 5 fits (15 rows) | **pass**: rows 5–19, with a 2-px wobble margin |
| The landing squash is visible at 4× | **pass**: a 10×2 flattened chip, the stack pressed 1 px, and sparks |
| No sub-pixel movement | **pass**: `x` is always an integer (fractional gaps are rounded; tested over 0.37-tick steps); the simulated transforms are all multiples of 4 px |
| `cache: 'none'` cost | **pass**: 0.007 ms/frame (budget 0.3) |

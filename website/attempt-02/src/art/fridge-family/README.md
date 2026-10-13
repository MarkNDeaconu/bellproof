# fridge-family (art-spec card 10)

Owner: `art-fridge-family` (opus). Pieces: `fridge-mini` 16×24, `fridge-badge` 24×24, `fridge-out` 48×48.
Cool metals only (`k s m t l e w`), azure glow (`a g`), violet qubit light (`v i r`). No gold, orange or yellow.

---

## 1. Recipe helpers (PUBLIC API, frozen signatures)

Import from the folder barrel (the only cross-piece import the engine spec allows):

```ts
import { plate, coax, pulse, drawFridgeMini, miniPulseFrame, miniBlinks, MINI } from '../fridge-family';
import type { Pt, PlateOpts, CoaxOpts, PulseOpts, MiniOpts } from '../fridge-family';
```

All helpers are pure, draw straight into the `Grid` you pass, clip for free at the grid edges, and use only
`k s m t l e w a g v`. Signatures will not change; pixel output inside them may still be polished (the critique
rounds below), so always draw through the helpers instead of copying their pixels.

### `plate(g, x, y, w, opts?) → void`
One cryostat plate, lit from the upper left. `x` = left edge, `y` = top row, `w` = full width (≥ 4).

| opts | type | default | effect |
|---|---|---|---|
| `rows` | `3 \| 5` | `3` | 3 = mini recipe (card 10), 5 = hero recipe (card 1) |
| `rim` | `Key` | none | recolours the lit run of the cold rim (e.g. `'a'` for a 1-tick cool-down flash) |
| `gleam` | `boolean` | `w >= 10` | `w` gleam on the left of the face row (3-row only) |

3-row recipe: `r0` back edge `l` inset 1 · `r1` face: `l` end cap, `w` gleam (≈ 15 %, plates ≥ 10 wide only), `e` to
45 %, `l`, `t` from 86 % (≥ 2 px) · `r2` underside `m` inset 1, `s` from 72 % (≥ 2 px). Height 3 rows (`y … y+2`).
5-row: exactly card 1's recipe (`y … y+4`). Tip: after plates, set the coax pixel right under each plate to `m`
(the plate's cast shadow); the hero, the mini and fridge-out all do this.

### `coax(g, x, y0, y1, opts?) → Pt[]`
A 1-px coax line at column `x` from row `y0` down to `y1` inclusive. Returns the path (top → bottom, one point per
row, a jog adds its sideways pixel) so a pulse can follow it. **Draw coax first, plates after**: plates hide the
line where it passes through them.

| opts | type | default | effect |
|---|---|---|---|
| `key` | `Key` | `'t'` | line colour |
| `jogs` | `{ y, dx: ±1 }[]` | `[]` | at row `y` the line steps 1 px sideways (a bend) |
| `shadow` | `Key \| null` | `'m'` | 1-px shadow right of each bend |
| `dry` | `boolean` | `false` | compute the path only, draw nothing |

### `pulse(g, path, head, opts?) → void`
A glow pulse with its head at `path[head]` and the tail trailing up the path. `opts.keys` = colours head-first
(default `['a', 'g']`; the hero style is `['w', 'g', 'a']`). `opts.hidden(x, y)` skips points (e.g. inside a plate).

### `drawFridgeMini(g, ox, oy, tick, opts?) → void`
The whole `fridge-mini` (card 10a) with its top-left at `(ox, oy)` as it looks at 12-fps `tick` (it animates at
6 fps, loop 16, so call it with your own tick and it stays in sync). `opts.pulses = false` hides the pulses;
`opts.qubit = 'w' | 'k' | …` forces the qubit pixel (answer blink, dark chip). Use this in `wall-to-lock`.

### `MINI` (constants, relative to the mini's top-left)
`w 16`, `h 24`, `ticksPerFrame 2`, `loopTicks 16`, `plates [{x,y,w}…]`, `coax [6, 9]`, `coaxY [5, 20]`,
`chipBox {x 5, y 20, w 6, h 4}`, `window {x 7, y 22, w 2, h 1}`, `qubit [8, 22]`, `exit [11, 22]` (where an answer
pixel leaves the box, right side), `palette`.

### `miniPulseFrame(tick, line) → 0..7`, `miniBlinks(tick) → boolean`
The mini's internal pulse phase per coax line, and whether its qubit is blinking `w` at `tick`, for scenes that
want to sync an answer pixel to the blink.

Example (wall-to-lock, two fridges with alternating chip blinks):
```ts
drawFridgeMini(g, 8, 20, tick, { qubit: leftBlink ? 'w' : undefined });
drawFridgeMini(g, 72, 20, tick + 8);           // a phase offset desynchronises the pair
```

---

Also exported for reuse: `drawBadge(g, ox, oy, face: '?' | '✓', narrow?)`, `badgeFace(tick)`, `BADGE` (badge tile
geometry), `OUT` (fridge-out geometry), and the three pieces `fridgeMini`, `fridgeBadge`, `fridgeOut`.

---

## 2. Pieces, timelines (as built)

### `fridge-mini` 16×24 · 6 fps (`ticksPerFrame 2`), loop 16, poster 4, `cache 'loop'`, 10 colours `k s m t l e w v a g`
Static: `m` cable x 8 rows 0–1 · plates 14/10/6 at rows 2–4, 9–11, 16–18 · `t` coax x 6 and 9, rows 5–19, with an `m`
cast-shadow pixel under each plate · chip box rows 20–23 (`s` shell, `l` lit top-left cluster, `t` shadow column, `k`
window (7, 22), `v` qubit (8, 22)).
Each line's pulse lives 8 frames: f0–1 open coax rows 5–8 (`a` head, `g` tail) · f2 anchored in plate 2 (its underside
pixel glows `a`) · f3–4 rows 12–15 · f5 anchored in plate 3 · f6 enters the lid (row 19–20) · f7 the qubit blinks `w`.
Line x 6 leads, line x 9 trails it by 4 ticks.

| tick | 0 | 2 | 4 (poster) | 6 | 8 | 10 | 12 | 14 |
|---|---|---|---|---|---|---|---|---|
| line x6 | rows 7–8 | glow plate 2 | rows 12–13 | rows 14–15 | glow plate 3 | lid | qubit `w` | rows 5–6 |
| line x9 | qubit `w` | rows 5–6 | rows 7–8 | glow plate 2 | rows 12–13 | rows 14–15 | glow plate 3 | lid |

So the chip answers on a double beat (ticks 0 and 12, 2 frames apart). The poster shows a pulse on each level and an
unlit `v` qubit.

### `fridge-badge` 24×24 · 6 fps, loop 48, poster 30, 12 colours (mini + `p b`)
The mini at (0, 0), run 8 ticks ahead so its qubit answers at tick 20 just before the badge flips. Badge 8×8 at
x 16–23, rows 16–23: rounded `p` tile, selective outline (`l` top/left lit, `t` bottom/right shadow), glyph `?` in `t`
(rows 18–22) or `✓` in `b` (lifted to rows 17–21 to centre it).

| ticks | 0 | 2–20 | 22 | 24 | 26–44 | 46 |
|---|---|---|---|---|---|---|
| tile | narrow `?` | `?` | narrow `?` | narrow `✓` | `✓` (poster 30) | narrow `✓` |

Narrow = 4-px tile showing glyph columns 1–2 (the edge-on half). `F`/`R` never appear.

### `fridge-out` 48×48 · 12 fps, loop 48, poster 20, 16 colours `k n s m t l e w p a g v i b c r`
Static: `m` cable x 24 rows 2–4 · plates 20/16/12/8 at rows 5, 11, 17, 23 (x 14–33 → 20–27) · four `t` coax, jogging
inward inside the plates ([17 20 27 30] → [18 21 26 29] → [19 21 26 28] → outer two at 20/27 to the box), inner pair
anchored in the MXC · cold finger 2 px (`t`/`s`) rows 26–31 · chip box 12×9 rows 32–40: `s` shell, `l` lit top + left,
`m` shaded right + bottom, `k` slot x 21–26 in the lid (row 32), `n` halo ring, `k` window 6×3, qubits `v i v i` at row 36,
2-row `l` nubs. Card 22×9: `p` face, `l` top/left, `t` bottom/right, rounded, `-12.4` in `font3x5` `k` (the `.` takes 1 col).
Cloud: 40 isolated pixels (no two touch, even diagonally), seeded once, inside the 40×26 ellipse at (24, 14), centre-
weighted, never inside the fridge envelope (±2 px) or the card's rest box; colours `v i b c a r`; each pixel's period is
one of 3/4/6/8 ticks (all divide 48): `w` for 1 tick, its colour for 2, then off.

| ticks | what happens |
|---|---|
| 0–2 | card squeezes out of the slot (rise 1, 3, 6 px), drawn blank and slot-width growing (smear frames) |
| 3–5 | card clear of the slot, full 22 wide with digits, rise 9, 11, 12 (spacing 1 2 3 3 2 1 over 0–5) |
| 6 | lands 1 px: squash 24×8, same bottom row |
| 7–35 | hold at rows 21–29 (poster 20); the cloud twinkles throughout |
| 27–42 | pulses run down the coax behind the card; inner lines anchor in the MXC at 39/40, outer lines hit the lid at 41/42 |
| 36–41 | card sinks: rise 10, 8 (blank from here), 5, 2, 0, hidden |
| 42 | the answer: window `w` for 1 tick |
| 43–45 | qubits `w → g → a`, halo `r → i → i` |
| 46–47 | idle (`n` halo, qubits `v ⇄ i` every 6 ticks) → seam into tick 0 |

---

## 3. Critique rounds

**Round 1 (mini, `qa/art-fridge-family/zoom-fridge-mini.png`).** On paper the plate's lit end (`w`/`e`) dissolved, so
the left side read 3 px shorter than the right; a lone `t` nub at the right end read as a jaggy. The chip box read as an
"H" at 1×/2× (coax entries + `t` face + crossbar aligned). Plates floated: nothing tied them to the lines.
*Fixes:* `l` end cap on the face row, a ≥ 2 px `t` shadow end; solid `s` lid, lit-top/shadow-column face; `m` cast-shadow
pixel on the coax under each plate.

**Round 1 (fridge-out, `r1-fridge-out.png`).** Two support legs to a floor at row 44 turned the silhouette into a
cabinet with shelves (at 1× a tall rectangle). Squeeze frames showed cropped digit fragments (glitchy). Cloud uniform.
*Fixes:* legs removed (the fridge hangs, like the hero); in-slot frames drawn blank as smear frames; cloud centre-weighted.

**Round 2 (`r2-fridge-mini.png`, `r2-fridge-out.png`).** Mini now reads as discs + a lit box. fridge-out reads as a
chandelier at 1×. Defects: cloud pixels landed inside the instrument (between plates) and read as dirt; one sat 1 px off
a plate end. Validator orphans traced to 1-px `t`/`s` runs on small plates and a 4×2 box face of single pixels.
*Fixes:* cloud excluded from the fridge envelope (±2 rows, 2-px margin); recipe guarantees ≥ 2 px shadow runs; mini box
face rebuilt as two clusters.

**Round 3 (hero comparison + `r3-*`).** Read `src/art/fridge-hero/` (read-only) and aligned: same plate split
percentages, `m` first coax pixel under each plate, chip box built the hero's way (`s` shell, `l` lit top/left, `m`
shaded right/bottom, `l` nubs), cable 1 px right of centre, `v`/`i` qubits swapping every 6 ticks, a halo ring around the
window. The hero's constantly breathing `n i r i` halo filled most of the 12×9 box and fought the card (contrast budget:
the number is the subject). Badge: the `✓` sat low, touching the shadow outline.
*Fixes:* halo rests at `n`, bright steps only at the answer (43–45); `✓` lifted 1 row.

**Round 4 (`r4-*`).** Narrow badge frames OR-squashed the glyph into a solid blue blob. Box: `e` corner and a lone `t`
at the top-right were orphans; nubs 1 px.
*Fixes:* narrow frames sample glyph columns 1–2 (edge-on); box corner `l`, shaded right edge from the top row, lit left
edge to the bottom row, 2-row nubs (as the hero). Final: `r5-fridge-out-final.png`.

**Differences from the hero (deliberate, per the art-spec):** 3-row plates (card 10) instead of 5; `a g` pulses (card 10)
instead of `w g a` (a `w` head vanishes on paper at this size); no truss/strut rods (at 20 px wide extra verticals made a
ladder/cage, round 1); fridge-out halo resting at `n` (above). Remaining validator warnings are deliberate: plate end caps,
qubits/window, cloud twinkles (`v i b c r` are not in the validator's sparkle set), the `✓` diagonal, the digit `.`, and
box outline corners counted as "doubles".

---

## 4. Acceptance checklist

| # | Criterion | Result |
|---|---|---|
| C1 | `npm run validate` passes (palette-only, ≤ maxColours, exact loop, poster in loop) | **pass** (0 errors; warnings explained above) |
| C2 | reads at 1× and 4×, on paper and ink | **pass** (zoom sheets have 1×/2× strips on both; `shot-*-paper/ink`) |
| C3 | upper-left light, no pillow shading, no banding, no stray orphans | **pass** (orphans audited pixel by pixel, all deliberate) |
| C4 | invisible loop seam | **pass** (mini 14→0, badge 46→0 narrow pair, out 47→0 card peeks; sheets) |
| C5 | live frames match timeline ±1 tick | **pass**: canvas+clock sampled atomically, 70/70 exact matches, constant phase (±0) for out; mini/badge consistent (identical frames explain badge phase aliases) |
| C6 | poster meaningful | **pass** (mini: pulses on two levels; badge: `✓`; out: card at rest, cloud, chip idle) |
| C7 | white flashes ≤ 1 tick, ≤ 3/s | **pass** (out: window `w` 1 tick per 4 s; mini qubit `w` 1 px) |
| 10a | mini reads at 1× as a 3-plate chandelier | **pass** |
| 10b | badge flips `?`/`✓` every 24 ticks with a 2-frame narrow flip, `F`-free, poster `✓` | **pass** |
| 10c | toast digits read at 4× | **pass** (read at 1× art-zoom on the live capture) |
| 10c | cloud never drawn over the card | **pass** (drawn first, card on top, rest box excluded) |
| 10c | cloud never clusters > 2 px | **pass** (stricter: no two cloud pixels touch) |
| — | rising card spacing 1 2 3 3 2 1, squash 6, hold, sink 36–41, chip blink 42–47 | **pass** |
| — | "standing on row 44" | **deviation**: hangs (legs rejected in round 1; chip box rows 32–40 kept) |
| — | reduced motion shows the poster | **pass** (`rm=1`: frozen at tick 20) |
| — | console clean in the harness | **pass** (`shot-*-console.txt`) |

## 5. Evidence (all under `qa/`)
- Node sheets: `qa/sheets/fridge-{mini,badge,out}{,-ink}.png`
- Zoom/critique rounds: `qa/art-fridge-family/{zoom-fridge-mini,r2-fridge-mini,r1-fridge-badge,r3-fridge-badge,r4-fridge-badge-flip,r1-fridge-out,r2-fridge-out,r3-fridge-out-poster,r3-fridge-out-sink,r4-fridge-out-chip,r5-fridge-out-final}.png`
- Live frames (built with `BP_ONLY=fridge-family`): `qa/art-fridge-family/live-fridge-{out,mini,badge-ink}/` (frames, contact sheet, GIF)
- Harness shots: `qa/art-fridge-family/shot-fridge-{mini,badge,out}-{paper,ink}-1440-step-00.png`, `shot-fridge-out-rm-*`, `combo-ink.png`

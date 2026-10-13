# Bellproof website · art spec (attempt-01)

Owner: Fable. One card per pixel-art piece (or family). Every piece implements the contract in `engine-spec.md` §4 and draws only with the palette keys in `design-spec.md` §1.7. Read research 03 §0–2 (craft rules) before drawing anything. The sketches in `research/mistral/03-motif-sketches.png` and the ASCII maps in research 03 §6.11 are *starting points* only; rebuild at the sizes below.

## 0. Conventions used in every card

- **Sizes** are logical art px `w×h`. On the page a piece is `w·4 × h·4` CSS px (`U = 4`). Bands and blocks use `B = 8` (card 15 only).
- **Clock:** 1 tick = 1/12 s (83.3 ms). `ticksPerFrame: 1` = 12 fps, `2` = 6 fps, `3` = 4 fps. All timings below are in ticks unless they say seconds.
- **Palette:** `k n s m t l e h p w v i b c a u g r R F` and `.` for transparent. Light from the upper left. Selective outlines in the material's own darkest shade; ink `k` outlines only where a silhouette sits on paper. No external anti-aliasing (every sprite must read on paper and on ink). No dither on sprites under 24 px or on anything that moves.
- **Determinism:** `frame(tick, g, io)` is pure. Per-loop variety uses `rng(seed = loopIndex)`. Loops are exact: frame(loopTicks) == frame(0) unless the card says the loop alternates (then the period is stated).
- **Inputs** (`io`): `hover: boolean`, `focus: boolean`, `mode: string`, `click: number` (count), `progress: 0..1`, plus piece-specific named inputs. A piece that reads inputs declares `cache: 'none'`; others declare `cache: 'loop'` (every frame pre-rendered).
- **Outputs:** a piece may expose `state(tick, io) → string` for HTML labels (section scripts read it each tick) and `events` (named ticks, e.g. `bit`).
- **Poster:** the tick shown under `prefers-reduced-motion` and as the first paint. Must be the most informative still.
- **Variants:** named alternate sizes/orientations (`sm`, `v`) drawn by the same piece.
- **Acceptance (common to every card; QA checks these from the contact sheet and the validator):**
  1. `npm run validate` passes: palette-only, rectangular rows, ≤ `maxColours`, exact loop, poster inside the loop.
  2. Reads at 1× (silhouette test) and at 4× zoom; reads on `paper` and on `ink` backgrounds in `preview.html?bg=ink`.
  3. Light from the upper left; no pillow shading; no banding; no stray orphan pixels except deliberate sparkles.
  4. The loop seam is invisible on the contact sheet (last frame → first frame).
  5. Frames captured with `tools/frames.mjs --interval 83 --zoom 4` match the timeline below within ±1 tick.
  6. The poster is meaningful and matches the card.
  7. White flashes ≤ 1 tick and ≤ 3 per second.
- **Model column:** `fable` builds the hardest pieces; `opus` the rest. Each piece lives in `src/art/<id>/`.

Glyph fonts available from the engine (`glyphs.ts`): `font3x5` (digits, `T C ? + - = . # ✓ × E Δ` and caps A–Z), `font5x7` (caps, digits, `✓ ×`). Primitives: `g.line`, `g.circle`, `g.rect`, `g.blit`, `g.text`, `g.dither`, `g.dissolve`, `g.ring`.

---

## 1. `fridge-hero` · the dilution-refrigerator chandelier · **fable**

**Purpose / placement.** Hero centrepiece. Hangs from the nav line in the hero's fridge cell (design §5.1). 56×128 → 224×512 CSS px. Rows 0–3 are the hairline cable; rows 109–127 are empty fall space for the dropped bit. Also used in the hero's `sm` fridge cell at the same size.
**Palette.** `k n s m t l e h w v i b c a u g r` (max 17). **No gold.** Plates are platinum/silver; coax is steel; light is azure; the chip glows violet.
**Composition** (x centre = 28). Plate recipe (5 rows, light from upper left): r0 back edge `l` inset 2 · r1 face `e` for the left 45 %, then `l` · r2 front gleam: `w` for the left 18 %, `e` to 60 %, then `l` · r3 rim `l | t | m` split at 12 % / 68 % · r4 underside `m` → `s` from 72 %, inset 2.

| Element | Rows | Width | Notes |
|---|---|---|---|
| cable | 0–3 | 1 (`m`) at x 28 | joins the top flange |
| top flange (300 K) | 4–8 | 48 | two `m` support rods go down at x 7 and 48 from here to the MXC, with `l` highlights |
| 50 K plate | 20–24 | 44 | label row **22** |
| 4 K plate | 38–42 | 38 | label row **40**; HEMT box 6×4 `t` with `l` top under it at x 10–15, rows 43–46 |
| still (800 mK) | 56–60 | 32 | label row **58**; circulator disc 5×5 (`l` rim, `t` face, `s` centre) under it at x 36–40 |
| cold plate (100 mK) | 72–76 | 26 | label row **74** |
| MXC (10 mK) | 86–90 | 20 | label row **88** |
| cold finger | 91–97 | 4 (`t` with `s` right edge) | |
| chip box | 98–108 | 14 | `s` outline, `t` face lit left, `k` window 8×3 at rows 102–104, 4 qubit pixels `v i v i` inside the window, 2 `l` connector nubs on the sides |
| coax lines | 9–97 | 1 px each | six lines: x 13, 19, 25, 31, 37, 43 at the top, stepping inward by 1 px below each plate so they converge to x 22–33 at the MXC; `t` with `m` shadow pixel to the right at each bend; hairpin U-bends (2 px wide) between 4 K and still on lines 2 and 5 |
| attenuators | under 4 K, still, cold plate | 3×2 beads (`e` top, `t` bottom, `s` right edge) | one per line, staggered |
| frost | around MXC | — | sparkles only (animation) |

Temperature labels are HTML (design §5.1); the piece exports `labelRows = [22, 40, 58, 74, 88]`.

**Animation.** `ticksPerFrame 1`, `loopTicks 144`, `cache 'loop'`, poster **tick 30**.
- **Pulses:** a 3-px trail `w g a` (head first) travels down each coax at 2 px/tick; line k starts at tick `(k·7) mod 48` and repeats every 48; at a plate the pulse pauses 1 tick (thermal anchoring) and continues. Pulses enter the chip box: on arrival a qubit pixel blinks `w` for 1 tick.
- **Chip glow:** a 1-px halo around the window steps `n → i → r → i → n` at 6 fps (ticksPerFrame 2 within the loop, period 10 ticks). Qubit pixels alternate `v`/`i` every 6 ticks.
- **Glint:** every 72 ticks a 2-tick glint runs plate by plate from top to bottom (12 ticks total): on the glint tick the plate's r2 row shifts `e→w` one segment to the right (sub-pixel shimmer).
- **Frost:** 3–5 `w g a` sparkles (seeded per loop) within 4 px of the MXC and chip, life 6 ticks (`w` 1, `g` 2, `a` 3), never overlapping the window.
- **Bit drop (event `bit`):** at ticks 0 and 48 and 96 a single `a` pixel leaves the chip bottom at (28, 109) and falls 2 px/tick with a `g` tail of 1 px until it exits row 127 (≈ 10 ticks). Section 1 listens for `bit` for nothing else; it is self-contained.
- **Intro inputs** (read only by the hero): `io.cool: 0..5` = number of stages cooled (0 → every plate rim r3 shows `t` only and the chip window is `k` dark; each step adds an azure `a` rim flash for 1 tick to the next plate and lights its row of attenuator beads); `io.ignite: boolean` (window `w` for 1 tick then glow on). With `cool = 5, ignite = true` the piece is identical to the idle loop. Reduced motion forces that state.
- Variants: none (same size at every breakpoint).

**Acceptance.** Silhouette = "stacked discs narrowing downward with a box at the bottom". No plate wider than the one above it. Six coax lines visible at 1×. Pulses never overlap each other on one line. Poster shows pulses mid-cable and the chip lit. Label rows match `labelRows`. Frames 0 and 144 identical.

---

## 2. `bloch-inline` · the headline sphere · **opus**

**Purpose / placement.** Inline in the hero H1 after "Verified" (design §5.1). 16×16 → 64 px; variant `sm` 11×11 → 44 px for the mobile headline. Also mounted as the Research strip's label-cell icon? No: only in the H1.
**Palette.** `k m t l w b c i a g r v` (max 12).
**Composition.** Glass sphere: `g` fill, `w` specular 2×1 at 10 o'clock, dithered-free `a` crescent (a solid 1-px `a` arc, no dither at this size) lower right, selout rim `c` (lit upper-left) / `b` / `i` (lower-right). z axis: `m` 1 px with `k` pole dots (one above, one below the sphere by 1 px). Equator: front half `c` solid, back half `a` every 2nd px. State vector from the centre: `v` line to the surface with a `w` tip pixel; no arrow barbs at 16 px.
**Animation.** `ticksPerFrame 1`, `loopTicks 96`, `cache 'loop'`, poster **tick 5**.
- 0–71: precession, 3 turns of 24 frames (θ = 60°, φ advancing 15°/frame). Pre-compute the 24 tip positions in floats; rasterise the line per frame with `g.line` (no doubles). The tip gets a `w` pixel and, on the side it moves toward, an `r` pixel (sub-pixel lead).
- 72: flash: rim `w`. 73–74: `g.ring` burst radius 2 then 3 in `a`. 75–86: hold at the north pole (seeded per loop: north with p = cos²(30°) ≈ 0.75, else south). 87–95: Rabi rotation back to θ = 60° in 9 frames with eased spacing (2, 4, 8, 12, 14, 12, 8, 4, 2 degrees… sum 66 → scale to 60).
- `sm` variant: same timeline; 24 precession angles rasterised in the 11×11 sphere; no `r` lead pixel.
**Acceptance.** Reads as "circle + equator + arrow" at 1×. The vector never leaves the sphere. Measurement lands exactly on a pole. Frame 96 == frame 0.

---

## 3. `qubit-folk` · Alice, Bob and the walkers · **opus**

One character sheet, three pieces. The **qubit creature** (12×14): a 10×10 glass orb (`g` fill, `w` 2×1 specular, selout rim), two `k` eye pixels at row 5, cols 4 and 7 (blink: both `g` for 1 tick), a 1×3 **Bloch antenna** `v` with a `w` tip rising from the orb's top (3 frames: tilt left / up / right, by moving the tip 1 px), and two 2×2 `s` feet at the bottom. **Alice** has rim `c/b/i` (blue); **Bob** has rim `r/v/n` (violet). Mirrored frames for facing left/right. Max 11 colours each.

### 3a. `qubit-pair` (hero riders) 32×16; variant `sm` 24×12 (orb 8×8)
Alice at x 0–11, Bob at x 20–31, both standing on row 15. The entanglement link: a dotted 1-px line between the orbs at row 8, alternating `r`/`a` pixels, with a 1-px sine wobble (period 8 px) scrolling 1 px/tick.
**Animation.** `loopTicks 48`, poster **tick 20** (both measured ↑↑: antennas up, rims flashed once).
- 0–11: idle; antennas sweep left→up→right (3 ticks each) **in mirror**: when Alice's tip is left, Bob's is right. Eyes blink on tick 7 (same tick).
- 12: anticipation (both squash 1 px: row 14 duplicated, row 4 removed). 13–16: **Alice hops** up 2 px (1, 1, hold, −1, −1 over 13–17) while **Bob squats** 1 px (mirror sync: one up, one down). 18: landing squash 1 tick. 19–23 settle.
- 24–35: idle again. 36–41: Bob hops, Alice squats. 42–47: settle.
- The link wobble runs continuously (period 8 → coprime with 48? 8 divides 48; use period 12 px scrolled 1 px/tick → fine, exact loop).

### 3b. `walkers` (CTA staircase) 40×16, `cache 'none'`
Alice at x 0–11 and Bob at x 28–39 facing right, link between them as above. Inputs: `io.mode: 'walk' | 'hifive' | 'stand'` set by the section (which moves the canvas along the staircase in 4-px steps, 1 step per tick at 12 fps = 48 px/s; width crossing 1360 px ≈ 28 s — slower than the content brief's 12 s on purpose, deliberate pace).
- `walk`: 4-frame walk cycle at 6 fps (feet alternate: 2×2 feet step 1 px forward/back; orb bobs 1 px on frames 2 and 4), antenna sways.
- `hifive` (24 ticks): both lean in 1 px (0–3), both rims flash `w` on tick 4 (same tick), an `i` 3-px ring (`g.ring`) blooms between them at tick 5–6, two `a` sparkles for 4 ticks, lean back 1 px, antennas spin one full left-up-right-up cycle (12 ticks).
- `stand`: idle with blinking, antenna sweep.
- `hover` pauses the walk (section stops moving; piece switches to `stand`).
- Poster: `stand`, tick 2.

### 3c. `qubit-walker` (footer patrol) 12×14, `cache 'none'`
A single creature with a **neutral rim** (`c/t/m`) and a `v` antenna. Inputs: `io.dir: 1 | -1`, `io.mode: 'walk' | 'precess' | 'hop'`. Walk cycle as 3b; `precess` 12 ticks (antenna sweeps 3 positions ×4, eyes follow the tip: the eye pixels shift 1 px toward it); `hop` 6 ticks (2 px up and down with squash). The footer script moves it 4 px per 2 ticks along band 2, every ~48 ticks (seeded 36–60) stops for `precess` then `hop`, reverses at the content-box edges (mirrored frames). Poster: `walk` frame 0, facing right.

**Acceptance (all three).** Alice is blue-rimmed, Bob violet-rimmed, never confused. Mirror sync in 3a is exact (Alice's rise tick == Bob's squat tick). In 3b the flash is on the same tick for both. No sub-pixel positions: the section moves canvases in multiples of 4 px only.

---

## 4. `certificates` · `cert-mini` and `cert-mint` · **opus**

### 4a. `cert-mini` (hero rider) 24×20
A certificate card 16×14 (`p` face, `h` text lines 2 px long at rows 3, 5, 7, 9 with a longer `l` line at row 11, `l` outline with a `t` lower-right shadow edge) tilted by stepping its left edge 1 px every 6 rows. Above it, a **seal stamp**: a 6×6 rosette (`i` disc, `a` 4 notches, `w` centre pixel) on a 2×4 `m` handle.
**Animation.** `loopTicks 72`, poster **tick 60** (stamped).
0–41 hold, seal hovering 4 px above the card with a 1-px bob every 12 ticks · 42–43 anticipation (seal lifts 2 px) · 44 smear (seal drawn 2× tall, no detail) · 45 impact: `w` flash on the card outline + 4 `h` dust pixels fly 1 px diagonally · 46–47 dust fades · 48–71 stamped: the rosette stays printed on the card in `i`/`a`, the handle lifts away over 4 ticks and holds.
At the next loop the printed seal fades out via a 2-tick dither as the seal returns above (ticks 0–1).

### 4b. `cert-mint` (guarantees scene) 72×48, `cache 'none'`
Left half: a scroll card 28×36 at x 2–29 (`p`, rolled top edge `l/e`, `h` text rows that **type in**: each row grows 2 px per tick from the left), a bell wax seal 9×9 (the logo bell in `v` on an `i` disc with a `w` highlight) that stamps as in 4a at the card's bottom-right. Right half: a **chain** at rows 30–41: three 12×12 isometric blocks (top `g`, left `c`, right `b`, edges `i`; faces carry a 4×4 hash bit pattern that shuffles every 12 ticks) joined by 2-px `l` links, scrolling left 1 px/tick; a new block with a certificate glyph (`p` face with a `v` seal pixel) drops from above with squash and clicks into the chain.
**Inputs.** `io.stamp: boolean` (set by section 9 after the HTML certificate rows finish typing; when false the piece idles with the rows typed and the seal hovering).
**Timeline (loop 84 once `stamp` is true).** 0–23 rows type · 24–29 seal anticipation + smear + impact (as 4a; `w` flash 1 tick, 6 `h` dust) · 30–47 stamped hold; a glint sweeps the seal (`a→g→w` 1 px, 6 ticks) · 48–59 a new block minted: appears above the chain (row 16), drops 2 px/tick, smear tick, squash on landing, `a` spark ring 2 ticks · 60–83 chain scrolls left 1 px/tick, hold. Then loop. Poster **tick 40**.
**Acceptance.** The seal is the logo bell (card 16), recognisable at 1×. `VERIFIED`/`ACCEPTED` wording is HTML, not in the canvas. Dust never leaves the canvas. Chain blocks have exactly three visible faces with the light on the top and left.

---

## 5. `magic-square` · the game, played · **fable**

**Purpose / placement.** Section 8 row 1 panel. 96×64 → 384×256 CSS px on a `--card` plate on the ramp-5/ramp-4 mosaic.
**Palette.** `k s m t l p w b c i a r v g R` (max 15; `R` only in the classical-loss variant, which is **not** used in this piece: the quantum players always win).
**Composition.**
```
x:   0         12        24   28                 68  72        84       95
y0   ..............[referee 12×12 at x 42–53, rows 0–11: k silhouette, w eyes, two p cards]
y12  [Alice 12×14  ]       +----- board 41×41 at x 28–68, rows 12–52 -----+      [Bob 12×14 ]
     [x 2–13, rows  ]       | 3×3 cells of 13×13 (corner px removed) with 1-px gaps |      [x 82–93, rows]
     [38–51          ]       | empty cell outline l; Alice row b; Bob column v;    |      [38–51        ]
                            | shared cell i; digits 5×7 w                         |
y54  ....... dotted entanglement line r/a from Alice (x 14) to Bob (x 81) at row 56, wobbling 1 px ......
y60  ..... (HTML readout sits under the canvas, not inside) .....
```
Alice (blue rim) stands left, Bob (violet rim) right; each holds a `p` answer card (3×4) once answered. The referee is a 12×12 figure: `k` body, `w` 2 eye pixels, a `t` badge; two 4×5 `p` question cards above its hands. Registration dots at the four corners of the panel are HTML.
**Animation.** `ticksPerFrame 1`, `loopTicks 72`, `cache 'loop'` (seeded per loop: `rng(loopIndex)` picks row r ∈ 0..2 and column c ∈ 0..2 and valid parity answers), poster **tick 40 of loop 0**, and loop 0 is forced to r = 1, c = 2 (middle row, right column: the deck's cover highlight) with Alice `1 0 1` and Bob `0 1 0` → shared cell `1 1`.
- 0–5: the referee's two cards slide out to Alice and Bob with spacing 1, 2, 3, 3, 2, 1 px; arriving cards show the row/column index as a 3×5 digit.
- 6–11: Alice's row fills `b` cell by cell (2 ticks each, left to right). 12–17: Bob's column fills `v` top to bottom; the shared cell turns `i` when both have reached it.
- 18–23: Alice's digits pop (1-px `w` seed for 1 tick, then the 5×7 digit), one per 2 ticks. 24–29: Bob's digits pop.
- 30–31: the shared cell shows both digits side by side (two 3×5 digits, `w`).
- 32: **flash**: a `w` ring (`g.ring`) around the shared cell. 33–50: hold with an `a` ring and `w` corner sparkles; Alice and Bob hop once together on tick 34 (same tick, 2 px). The win readout (HTML) ticks on tick 33 (`state → 'win'`).
- 51–54: 4-step dither fade of fills and digits (screen-locked pattern). 55–71: empty board, players idle (antenna sweep, blink), referee shuffles cards (2 frames).
**State output.** `'deal' | 'fill' | 'answer' | 'win' | 'reset'` for the section's readout `classical ≤ 8/9 · quantum = 1` (the readout is static text; the `win` state only pulses its `1` in `--blue` for 2 ticks).
**Acceptance.** Row parity even, column parity odd, shared cell equal in every loop (QA reads digits from frames 30–50 for 3 loops). Alice's fill is always blue, Bob's violet, shared indigo. Loop 0 poster = middle row + right column. No rust anywhere. Digits are legible at 1×.

---

## 6. `tc-rounds` · hidden test rounds · **opus**

**Placement.** Section 8 row 3 panel. 128×40 → 512×160.
**Palette.** `k t l h p w b a c u g R F` (max 13).
**Composition.** Two rows of 12 blocks 8×8, x = 2 + 9·i (i = 0..11), gaps 1. Top row rows 4–11: the deck sequence `T C C T C C T C T C C T`; T blocks `b` fill with a `w` 3×5 `T`; C blocks `p` fill, `l` outline, `k` 3×5 `C`. Bottom row rows 24–31: `h` face, `t` outline, `t` 3×5 `?`. A **ΔE meter** at x 116–122, rows 4–31: `l` outline, `p` inside, fills `b` from the bottom; a `k` 3×5 `Δ`… the engine font has `Δ`; draw `ΔE` as HTML under the meter instead (keep the canvas clean): the meter is just the bar.
**Animation.** `loopTicks 96` per sweep; the piece alternates **3 clean loops then 1 cheater loop** (period 384 ticks, `cache 'loop'` with a 384-tick table is fine: 384 frames × 128×40 is small). Poster **tick 40** (clean).
- 0–63: a 1-px `a` **scan line** sweeps x 0→127 at 2 px/tick over both rows (with a `g` ghost column behind it). When it crosses block i's centre: the `?` block **flips** to reveal its T/C (a 2-tick narrow-then-wide flip using 2-px-wide intermediate frames, colours swapping) and flips back 6 ticks later; a T block flashes an `a` ✓ (3×5) over its glyph for 3 ticks; a C block **drips** one `b` pixel from its bottom that falls to the meter row and the meter gains 3 px (8 C blocks → 24 px, full at the end).
- 64–87: hold, full meter, `u` shimmer on the meter top.
- 88–95: meter drains (3 px/tick) and the `?` row settles.
- **Cheater loop:** identical until the scan reaches block 6 (a T): the block **cracks** — 2 crack frames in `R` across the `b` fill (a diagonal 1-px crack then a 3-px shatter), its glyph turns `R` ×; the meter empties 6 px/tick; `state → 'rejected'` for 12 ticks (the section shows a `micro` `REJECTED` stamp in `--alert` under the panel). The remaining blocks stay unrevealed. Hold 24, then reset by dither.
**Acceptance.** The sequence matches the deck exactly. Bottom row shows only `?` except during a flip. The meter fills in 8 steps on clean loops, empties on the cheater loop. `R` appears only in the cheater loop.

---

## 7. `wall-to-lock` · physical vs cryptographic separation · **opus**

**Placement.** Section 8 row 2 panel. 96×48 → 384×192. `state` drives the HTML label.
**Palette.** `k s m t l e h p w b c a i v g` (max 15).
**Composition.** State A: two mini fridges (use the `fridge-mini` recipe from card 10, 16×24) at x 8–23 and x 72–87, floor row 44; a **wall** 12×30 at x 42–53 of 4×2 bricks (`t` bricks, `l` mortar, `m` shadow side); a small `?` card (6×8 `p`, `k` glyph) beside each fridge. State B: one fridge at x 40–55; to its left a **padlock** 10×12 (body `s`/`m` with an `e` highlight, shackle `l`, keyhole `k`) at x 20–29 rows 26–37; question cards travel through.
**Animation.** `loopTicks 120`, poster **tick 84** (State B with the locked card inside the fridge).
- 0–23: State A hold (`state 'physical'`); fridge chips blink alternately; a `?` card hops to each fridge in turn.
- 24–47: **transition**: bricks fall one per tick in seeded order, each dropping 1 row/tick and dissolving by 2-step dither at the floor (`state 'morph'`); the two fridges slide toward the centre with spacing 1, 2, 3, 3, 2, 1 px (ticks 30–41) and merge (the right one dissolves 4-tick dither as they overlap); the fallen brick pixels **reassemble** into the padlock at x 20–29 (bricks' `t/l` recolour to `s/m/l` over 2 ticks).
- 48–95: State B (`state 'crypto'`): a `?` card enters from the left **inside the padlock** (the lock's body opens 1 px, card slides in, shackle snaps down 1 tick), travels to the fridge (2 px/tick), the fridge's chip blinks `w` (answer), an `a` answer pixel exits right and leaves; **only then** (tick 76) the second card, open (no lock), enters, the fridge blinks again, a second `a` pixel exits.
- 96–119: reverse morph back to State A (padlock dissolves to bricks that rise and restack; fridge splits).
**Acceptance.** Exactly two labelled states; the HTML label changes on the state ticks. The second card never arrives before the first answer leaves. Bricks: no two adjacent bricks share a row break (brick bond offset).

---

## 8. `layer-packets` · lab, vault, lanes · **opus**

Four pieces for the section 5 diagram. Common 48-tick phase so the lanes and vault look causal.
- **`lab-bench`** 24×24: bench top `t` with `m` front (rows 16–18), a flask (`g` glass, `c` rim, `b` liquid rows 10–14 with one `a` bubble rising 1 px/tick and popping at the surface every 8), a 6×4 screen (`s` frame, `a` scanline moving 1 px per 2 ticks). Loop 48. Poster 10.
- **`vault`** 24×24: round door 16×16 (`e` rim lit upper-left, `l` face, `t` lower-right, `s` hinge side), a bell seal 7×7 (`v` bell on `i`) centred, a 2-px `m` dial. `io.phase` is internal: ticks 24–35 the door **shuts** (slides 4 px into the frame, 1 px/tick, with a 1-tick `w` glint on the rim), 36–47 it opens again. Loop 48. Poster 30 (shut).
- **`lane-left`** 48×24 (variant `v` 24×48, same content rotated by drawing, not by rotating bitmaps): top track rows 2–10: a token (6×6 `a` disc, `c` rim, `w` 1-px glint) followed 10 px behind by an envelope (8×6 `p`, `k` flap `v` seal pixel), moving right 2 px/tick, wrapping at 48 (period 24): the token reaches the right edge at tick 24 (so the vault shuts "when the coin arrives"). Bottom track rows 13–22: a certificate scroll (8×8 `p` with `i` seal) moving left 2 px/tick from x 48 at tick 36 (when the vault opens). Loop 48. Poster 12.
- **`lane-right`** 48×24 (variant `v`): top: two padlocked question cards (6×8 `p`, `s` 3×3 lock on the top edge, `k` `?`) moving right 2 px/tick 16 px apart; bottom: answer pixels (2×2 `a` with a 2-px `g` tail) moving left 2 px/tick, one every 8 ticks. Loop 48. Poster 12.
**Acceptance.** Tracks never overlap. Vertical variants read the same with gravity down (cards descend in the right lane's top track, answers rise). The vault shuts on the token's arrival tick in `lane-left`.

---

## 9. `chain-flow` · blocks, token, settle scene · **opus**

- **`chain-block`** 16×16, modes `post | stake | commit | reveal | settle`, inputs `io.lit: boolean`, `io.click: number`, `cache 'none'`. An isometric block (top `g`, left `c`, right `b`, edges `i`) 14 wide with a 2-px `l` chain link stub on the left edge. Face glyphs (drawn on the top face, 7×7, `k`): post = token entering a slot (`a` disc, `s` slot); stake = token stack 3 with a `s` padlock; commit = envelope with `#`; reveal = open envelope with a `a` key popping out (2 frames); settle = vault door opening to the right (3 frames). Unlit: faces one ramp step darker (`c b i`→`b i v`). On `click` increment: the block drops 2 px (1 tick), smear, lands with a 1-px squash and an `a` spark at the link (3 ticks); glyph animation plays once (6 ticks). Idle: nothing (static, deliberate). Poster: lit, frame 0.
- **`job-token`** 12×12: a job card (`p`, `b` top-left corner triangle 3 px, `k` 3×5 `#`), idle: a `w` glint pixel runs along the top edge every 24 ticks. `io.walk: boolean` adds a 1-px bob at 6 fps. Poster 0.
- **`magnifier-scroll`** 16×16: a scroll 8×10 `p` with `h` lines under a magnifier (ring `s`, lens `g` with `w` glint, handle `m`); the lens slides 1 px across the scroll every 6 ticks, loop 24. Poster 0.
- **`settle`** 48×24, `io.mode: 'honest' | 'cheat' | 'auto'` (auto alternates per loop). Left: client figure 8×12 (`k` body, `b` collar pixel); centre: three tokens in an escrow tray (`s` tray 14×4); right: provider figure 8×12 (`k` body, `v` collar). Honest (72 ticks): tokens slide right 2 px/tick to the provider (12–30), a certificate block (12×12 as card 4b) drops at x 18 with squash (36–44), `a` ring 2 ticks, hold. Cheat (72 ticks): tokens **crack** (`R` 1-px crack then a 2-px split, 2 frames at ticks 12–13), broken halves slide left to the client (14–30), the provider figure's collar turns `R` and it sinks 2 px (the slash), hold; no certificate. Poster: honest tick 50.
**Acceptance.** Five distinct, legible glyphs at 1×. `R` appears only in cheat. Blocks click only on `click` changes (QA: no motion in idle frames).

---

## 10. `fridge-family` · mini fridges · **opus**

Shares the plate recipe of card 1 at small scale: plate = 3 rows: `l` back edge inset 1, `e`/`l` face, `m` underside.
- **`fridge-mini`** 16×24: three plates (widths 14, 10, 6 at rows 2–4, 9–11, 16–18), two `t` coax lines at x 6 and 9 from row 5 to 20, a 6×4 chip box rows 20–23 (`s` outline, `k` window 2×1, `v` qubit pixel), a `m` cable 2 px above the top plate. Loop 16 at 6 fps (8 frames): an `a` pulse (2 px with `g` tail) runs down each line, offset by 4 ticks; the qubit pixel blinks `w` when a pulse arrives. Poster 4. Used in sections 5, 7 and in cards 7 and 10b.
- **`fridge-badge`** 24×24: `fridge-mini` blitted at (0,0); a badge 8×8 at x 16–23, rows 16–23: a rounded `p` tile with `l` outline and a 3×5 glyph that **flips** between `?` (`t`) and `✓` (`b`) every 24 ticks with a 2-frame narrow flip; the tile is `F`-free (no alert). Loop 48. Poster 30 (✓).
- **`fridge-out`** 48×48: the fridge (a 20×36 version with 4 plates, 4 coax, chip box rows 32–40) at x 14–33 standing on row 44; a **toast card** 22×9 (`p`, `l` outline, `k` 3×5 digits `-12.4` using `font3x5`) that pops **up out of the chip box top** (the box has a 1-px `k` slot at row 32); around the fridge's upper half, a **cloud of 40 amplitude pixels** (positions seeded once, within an ellipse 40×26 centred at (24, 14), colours from `v i b c a r` seeded) each flickering with its own period 3–9 ticks (`on` 1 tick as `w`, then its colour for 2, then off). Loop 48: 0–9 card rises with spacing 1, 2, 3, 3, 2, 1 (ticks 0–5) then lands 1 px with a squash (6–7), settle · 8–35 hold (cloud twinkles) · 36–41 card sinks back · 42–47 chip blink. Poster 20.
**Acceptance.** `fridge-mini` silhouette reads at 1× as a 3-plate chandelier. The toast card digits read at 4× zoom. The cloud is never drawn over the card. Cloud pixels never cluster into blobs > 2 px (seed check).

---

## 11. `icons` · UI glyphs and small loops · **opus**

All static icons are also rendered as inline SVG by the engine's `icon()` from the same bitmaps (design §4.9). Loops are canvases. Colour: static UI icons are single-colour bitmaps (`k`) recoloured by `currentColor`; multi-colour icons stay canvases.

| Id | Size | Colours | Content / loop |
|---|---|---|---|
| `ui-chevron` | 5×5 | 1 | stair-stepped › |
| `ui-arrow` | 7×5 | 1 | → with a 1-px head |
| `ui-external` | 7×7 | 1 | ↗ with a corner bracket |
| `ui-check` | 7×7 | 1 | ✓ stroke 1 px, long arm 4 |
| `ui-warn` | 7×7 | 1 | ! inside a stepped diamond |
| `ui-close` | 7×7 | 1 | × |
| `ui-menu` | 3×3 at 2U | 1 | dot grid |
| `ui-play` | 8×8 | 1 | ▶ stair-stepped; nav cell and CTA |
| `ui-caret` | 5×3 | 1 | ⌄ |
| `tag-disk` `tag-gpu` `tag-helix` `tag-candles` `tag-globe` `tag-chain` | 8×8 | ≤ 4 (`k t a b`) | trust tags; each has a 2-frame idle (a `a` pixel moves) at 4 fps, phases differ |
| `trust-loop` `trust-target` `trust-chain-check` | 16×16 | ≤ 5 | static with one `a` accent pixel; `trust-loop` rotates its arrowhead over 4 frames at 4 fps |
| `cta-play` `cta-code` `cta-book` | 6×6 | 1 (`a` on ink) | `hover`: play presses 1 px down for 2 ticks; code brackets blink (gap frame) 2 ticks; book flips 3 frames (page sliver) |
| `social-g` `social-x` `social-d` | 6×6 | 1 | rounded tiles with a 3×5 letter G / X / D (no brand marks) |
| `tc-glyph` | 12×12 | 4 (`h t p a`) | the announcement-pill icon: a `?` block whose face shimmers 3 frames at 6 fps (two `a` pixels wander) |
| `question-block` | 16×16 | 5 (`h t k a w`) | paradox band: a `?` block on 2 `t` feet; `io.bump` triggers once: anticipation 1 (squash), rise 2 px for 2 ticks, `w` glint, fall, landing squash 1, settle (8 ticks). Idle: `?` glyph blinks `a` every 36 ticks. Poster: rest. |
| `check-scale` | 32×20 | 7 (`k s m t l a b`) | a balance: `m` post, `t` beam 24 px pivoting via 3 pre-drawn tilt frames (level, left-down, right-down), two `l` pans on 1-px `t` strings; **left pan**: a heavy 8×6 `s` block labelled with a `b` 3×5 `C`; **right pan**: a single `a` pixel ("the check"). Loop 60: 0–11 level, 12–23 wobble (left-down 3, level 3, right-down 3, level 3), 24–47 **settles with the light side down** (right-down) and the `a` check pixel blinks `w` at ticks 30, 42, 48–59 level. Poster 36. |

**Acceptance.** Every static icon is pixel-identical in canvas and SVG renders. All 1-colour icons read at 20–28 px. No brand logos.

---

## 12. `glitch-cells` · six failure icons · **opus**

16×16 each, ≤ 6 colours, `cache 'none'`, `io.hover` triggers a 3-tick glitch (g1, g2, base) once per hover-enter; idle is static.

| Id | Drawing | Glitch frames |
|---|---|---|
| `glitch-noise` | a 12×12 screen `s` with seeded static `t/l/e` | g1: static reseeded; g2: a horizontal 2-px tear shifted 2 px |
| `glitch-drift` | a dial 12×12 `l` ring, `k` needle at 12 o'clock, `a` tick marks | g1: needle at 1 o'clock; g2: needle at 2 o'clock (re-rasterised lines, no rotation) |
| `glitch-bug` | a 10×8 `k` beetle with `a` eyes and 6 legs | g1: legs stepped; g2: the beetle shifted 1 px right with a `t` after-image |
| `glitch-cut` | scissors 12×12 `t` blades, `b` handles | g1: blades open 2 px; g2: a `R`… no alert here: a `h` snipped thread pixel |
| `glitch-mask` | a mask 12×10 `p` with `k` eye holes, `t` strap | g1: eye holes `a`; g2: the mask slips 1 px down |
| `glitch-crack` | a token 12×12 `a` disc `c` rim | g1: a 1-px `R` crack; g2: the crack widens 2 px, the right half shifts 1 px |

**Acceptance.** Idle frames are identical across ticks. Glitch lasts exactly 3 ticks. `R` only in `glitch-crack`.

---

## 13. `clients` · the five audience sprites · **opus**

48×48 each, ≤ 12 colours, `loopTicks 48`, poster **tick 12**. The section swaps them with the engine's `dissolve` (4-step ordered dither over 4 ticks). The Providers tab mounts `fridge-badge` from card 10 (no new drawing).

| Id | Drawing | Loop |
|---|---|---|
| `client-pharma` | a capsule 18×8 (left half `b`, right half `p`, `w` glint, `k` seam) at the lower left; a molecule at the upper right: 6 `l` atom pixels (2×2) in a hexagon joined by 1-px `m` bonds, a 3×3 `v` iron atom at the centre with a `r` halo pixel | bonds wiggle: each bond's midpoint shifts 1 px on its own phase (periods 6/8/10); the Fe halo pulses `r → i → r` at 4 fps |
| `client-battery` | a cell 16×30 (`s` body, `l` cap, `e` left highlight) with 6 charge bars 10×3 | bars fill `a` bottom-up one per 4 ticks (0–23), hold 4, empty top-down (28–47); the cap pixel blinks `w` when full |
| `client-chem` | a conical flask 24×30 (`g` glass, `c` rim, `b` liquid rows 20–28) over a 2-px `m` stand | 6 `a` bubbles rise 1 px/tick from seeded x positions, pop at the surface into a 3-px `w` plus for 1 tick; one bubble every 8 ticks |
| `client-dao` | a vault 24×26 (as card 8's vault, scaled: `l` door, `v` bell seal) with a 1-px `m` flagpole 20 tall at its right and a 6×4 flag (`b` with a `p` milestone pixel) | every 24 ticks a mini certificate 8×8 (`p`, `i` seal) drops into the vault's slot (4 ticks, squash), the door glints, and the flag rises 2 px per tick to the top (10 ticks), holds, then slides back down over the next cycle |
| `client-providers` | = `fridge-badge` (card 10b) | |

**Acceptance.** Each reads at 1× as its object. The Fe atom is violet. No gold, no brand marks. Dissolve between any two is clean (no mixed-palette halos: both sprites use the shared palette).

---

## 14. `cascade-coin` · tokens on a conveyor · **opus**

32×24, `cache 'none'`, inputs `io.stack: 1..5`, `io.wobble: boolean`, `io.belt: boolean`. The section moves the canvas along the cascade connector in 4-px steps and sets `stack` as it passes each bar.
**Drawing.** Belt rows 20–23: `m` body with `t` tread marks every 4 px that scroll right 1 px/tick while `belt` is true; two `s` rollers 4×4 at the ends. Token stack centred at x 12–19: tokens 8×3 (`a` top, `c` rim, `w` glint) stacked from row 19 upward; when `stack` increases, the new token drops from row 0 at 3 px/tick with a 1-tick smear and a 1-px squash on landing (the stack below squashes 1 px for 1 tick). `wobble`: the top 2 tokens shift 1 px left/right at 6 fps. Loop 24 for the belt. Poster: stack 3, belt still.
**Acceptance.** Stack of 5 fits (15 rows). Landing squash visible at 4×. No sub-pixel movement (the section moves in 4-px steps only).

---

## 15. `bands` · blocks, diamonds, strata, staircase · **fable** (engine-adjacent)

The only art drawn at `B = 8`. Flat colour, so blocks are DOM `<div>`s; the diamond and the staircase edge are bitmaps.
- **Block** `M×M` (128 lg / 64 sm) or half `M/2×M` (half-blocks are M/2 tall and M wide) in a ramp step; **no border**, no radius. Neighbouring blocks differ by 1–2 steps.
- **Diamond**: a 15×15 pixel diamond bitmap (rows of widths 1, 3, 5, …, 15, …, 3, 1) at B (120 px), violet by default, centred in an M cell; `sm`: 7×7 (56 px). It **pulses** every 36 ticks: `v → i → v` over 2 ticks (colour swap only).
- **Hero stage** (design §5.1): initial layout (lg) · left rail: stack violet (bottom), indigo, blue (top) with `qubit-pair` riding the top · left floor: cornflower M at x M→2M with a mist half-block on top · right floor: azure M at x W−2M→W−M with `cert-mini` riding it · right rail: indigo (bottom), blue (top), diamond one module above the stack top. Hidden reservoir below the floor under the right rail: cornflower, then azure (they emerge on rises). Dots where each rail line meets its stack top (they move with the stack top).
- **Choreography (idle, lg):** moves tween `transform` only, 0.8 s, `power4InOut`, positions **quantised to 4 px**. Sequence (start times in s):
  1. 0.0 · left stack sinks 1 M (violet goes under the floor) **and** right stack rises 1 M (cornflower emerges; the diamond rises with it).
  2. 1.8 · left floor cornflower block (+ mist half riding) slides right 1 M.
  3. 3.4 · right floor azure block (+ cert) slides left 1 M.
  4. 5.2 · right floor block sinks M/2 (the cert sinks with it; its top half stays visible).
  5. 6.8 · left stack sinks 1 M again (indigo under; blue + pair remain) **and** right stack rises 1 M (azure emerges).
  6. 8.6 · left floor block slides right 1 more M.
  Forward ends at 9.4 s; hold 1.0 s; play the six moves in reverse order (yoyo); hold 1.0 s. Cycle = 20.8 s. On `sm/md` run moves 1, 3, 5 only (cycle 12 s).
- **Paradox band blocks** (design §5.3 D): static.
- **Dusk staircase** (design §5.10): a 64-px strip under the ink band. Three tiers left→right: the surface colour is **night** for the left third, **violet** for the middle third, **indigo** for the right third. Within each tier the surface's top edge descends 8 px per 1/8 of the tier width (from y 0 to y 56), resetting to y 0 at each tier boundary, so the strip reads as three sawtooth staircases. Ink fills above the surface, the footer's paper shows below it. `walkers` stand on the surface and the section moves them along the top edge (its y per x is exported by the staircase as `surfaceY(x)`, in multiples of 8).
- **Footer strata** (design §5.11): four 64-px bands blue, cornflower, azure, mist; grid-on-colour lines; a quarter-arc (ink 10%) at the right; `qubit-walker` on band 2 (its y = band 2 top − 56).
**Acceptance.** All block edges on the 8-px grid at rest; all transforms multiples of 4 px during motion (QA samples transforms per frame). The two rails move on the same frames in opposite directions in moves 1 and 5. Nothing is ever lost: after a full cycle the layout equals the initial layout. Reduced motion: initial layout, static.

---

## 16. `logo-mark` · the pixel bell · **fable**

**Purpose.** Brand mark: nav (2 px/art px = 24×22), footer giant (20 px/art px = 240×220), favicon (SVG, 32 with 4 px padding), og image, the wax seal in cards 4 and 8 (7×7/9×9 reductions drawn by hand). The only art allowed at scales other than 4: it is an SVG rect grid (`shape-rendering: crispEdges`) at **integer** scales only.
**Drawing** 12×11, single colour (ink on light, paper on dark; the check notch is negative space):
```
col  0123456789ab
r0   .....##.....
r1   ....####....
r2   ...######...
r3   ...######...
r4   ...######...
r5   ..########..
r6   ..######.#..    ← long arm of the ✓ (8,6)
r7   .######.###.    ← (7,7)
r8   .###.#.####.    ← (4,8) short arm, (6,8)
r9   #####.######    ← vertex (5,9) in the rim
r10  .....##.....    ← clapper
```
A bell silhouette (crown, shoulders, flared skirt, full rim row, clapper) with a ✓ cut from the lower-right of the skirt into the rim. Fable may refine pixels; the silhouette and the negative-space check are fixed.
**Footer reveal + ring.** The giant mark rises from behind the strata as the sub-footer scrolls in (`translateY` 100% → 0, scrubbed, in 20-px steps). Once fully risen and the page is at its bottom, **ring** once per visit: the clapper (r10) shifts 1 px left, centre, right, centre at 6 fps (8 ticks) and on the first swing the whole mark's outline shows a 1-art-px azure halo (`#8FAEFF`, SVG second layer) for 2 ticks. Reduced motion: in place, no ring.
**Acceptance.** Reads as a bell at 24 px; the check reads at 240 px. Favicon crisp at 16 and 32. Nav mark aligns to the 2-px grid.

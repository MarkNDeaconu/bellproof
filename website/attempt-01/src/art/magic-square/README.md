# `magic-square` · the Mermin–Peres game, played (art-spec card 5)

96×64 art px → 384×256 CSS px. `ticksPerFrame 1`, `loopTicks 72` (one round, 6 s), `period 288` (four rounds, cached as 288 small canvases ≈ 7 MB, ~30 ms idle-sliced generation), poster **tick 40**, `cache 'loop'`, 15 colours.

Palette as built: `k s m t l p w b c i a r v g n`. The card lists `R` (alert) but says it is never used here because quantum players always win, so that slot is spent on `n` (night) for Bob's shaded rim (qubit-folk card: Bob's rim is `r/v/n`). No alert colour appears anywhere.

## The game, correctly

| | Alice (blue `b`) | Bob (violet `v`) |
|---|---|---|
| Gets | a **row** | a **column** |
| Fills | 3 bits with an **even** number of 1s (observable product **+I**) | 3 bits with an **odd** number of 1s (observable product **−I**) |
| Tag shown | `+` beside the completed row | `−` under the completed column |
| Win | they write the **same bit** in the shared cell (indigo `i`) | |

Parity convention (research 03 §6.5): outcome **+1 ↔ bit 0**, **−1 ↔ bit 1**. In the Mermin–Peres square every row of observables multiplies to +I (even number of 1s) and every column to −I (odd number of 1s). Quantum players sharing two Bell pairs win every round; no classical table can, so the best classical rate is 8/9 (the HTML readout under the panel carries `classical ≤ 8/9 · quantum = 1`). The piece shows only wins.

Rounds (`roundFor(loop)` in `index.ts`, checked by `npx tsx … rounds`):

| loop | row | col | Alice | parity | Bob | parity | shared |
|---|---|---|---|---|---|---|---|
| 0 (poster, deck cover) | 2 | 3 | 1 0 1 | even | 0 1 0 | odd | 1 / 1 |
| 1 | 1 | 2 | 1 1 0 | even | 1 0 0 | odd | 1 / 1 |
| 2 | 3 | 1 | 1 0 1 | even | 1 1 1 | odd | 1 / 1 |
| 3 | 2 | 2 | 0 0 0 | even | 1 0 0 | odd | 0 / 0 |

Loops 1–3 come from `rng(hash(loop))`: pick (r, c) (re-drawn until both differ from the previous round), two free Alice bits (third = XOR), `bob[r] = alice[c]`, one free Bob bit, the last bit fixes odd parity. Every round is valid by construction.

## Composition (art px)

- Board 41×41 at x 28–68, rows 12–52: 3×3 cells of 13×13 with corner pixels removed, 1-px gaps. Empty: `l` outline. Alice's row `b`, Bob's column `v`, shared cell `i`. Single bits are 5×7 `w` digits; the shared cell shows Alice's and Bob's bits as two 3×5 `w` digits.
- Referee 12×11 at x 42–53, rows 0–10, drawn **in front** of the board: navy `s` figure from the metal ramp with `m` lit edges (upper left), `w` eyes, `t` badge. Two 7×7 question cards (`t` rounded outline, `p` face, `t` `?`) float beside its raised hands at x 34–40 / 55–61.
- Alice 12×14 at x 2–13, Bob at x 82–93, rows 38–51 (qubit-folk creature: 10×10 glass orb `g`, 2×1 `w` specular, rim `c/b/i` for Alice, `r/v/n` for Bob, `k` eyes shifted one px toward the board, `v` antenna with `w` tip, 2×2 `s` feet).
- Dealt cards land above the players' heads (x 4–10 / 85–91, rows 29–35) and flip to a mini 3×3 grid (`l` dots) with the dealt row as a `b` bar or the dealt column as a `v` bar: the card *is* the question.
- Parity tags: `+` (5×5 cross, `b`) at x 72–76 on the row's centre line; `−` (5×1, `v`) at row 56 under the column.
- Entanglement link at rows 58–60: 2-on-1-off dashes alternating `a`/`r`, a 3-level wave travelling **inward from both ends** (nothing travels from Alice to Bob).
- Verdict ring: `g.ring(r = 8)` around the shared cell centre, hugging the rounded corners; `w` corner sparkles at the diagonal neighbours' removed corner pixels, alternating dot / small cross every 3 ticks.

Deviations from the card, on purpose: question cards are 7×7 (a 4×5 card cannot hold a readable glyph) and show the row/column as a mini-grid bar instead of a digit (teaches faster); the `p` 3×4 answer cards are omitted (paper on the card plate is invisible) and replaced by the parity tags; the link sits at rows 58–60 rather than 56 so ring, `−` tag and link never touch; the referee is navy rather than ink so it reads on ink too.

## Timeline as built (ticks within a 72-tick round)

| ticks | what | state |
|---|---|---|
| 0–5 | the referee's two `?` cards toss out to Alice and Bob (x eased `out`, y `inOut`, so they clear the board); on tick 5 they flip to the row / column mini-grid | `deal` |
| 6, 8, 10 | Alice's row fills `b` left→right: 9×9 pop for one tick, then the full cell | `fill` |
| 12, 14, 16 | Bob's column fills `v` top→bottom; the shared cell turns `i` when he reaches it | `fill` |
| 18, 20, 22 | Alice's bits: 1-px `w` seed, then the 5×7 digit (event `bit`) | `answer` |
| 24 | `+` tag appears beside Alice's row; 24, 26, 28 Bob's bits pop top→bottom; in the shared cell both bits sit side by side as 3×5 digits | `answer` |
| 30–31 | `−` tag under Bob's column; both players lean in 1 px | `answer` |
| 32 | **flash**: `w` ring around the shared cell, the link flashes `w` for this one tick, both antennas snap upright (event `flash`) | `answer` |
| 33–50 | `a` ring + twinkling `w` corner sparkles; 33 squash, 34–37 both hop 2 px together, 38 landing squash; blink on 45; antennas stay up (event `win` on 33) | `win` |
| 51–54 | 4-step screen-locked dither fade of fills, digits, tags and the dealt cards (event `reset` on 51) | `reset` |
| 55–71 | empty board; players idle (antenna sweep left / up / right / up, 3 ticks each; blink on 63); the referee shuffles his `?` cards (left card up on 59–66, right card up on 63–66) | `reset` |

Blinks: players 9, 45, 63; referee 15, 66. `state(tick)` ∈ `deal | fill | answer | win | reset`; `events(tick)` ∈ `deal, fill, bit, flash, win, reset`. No inputs (pure cached loop); loop seam 71 → 72 shows only the idle cards starting their toss.

## Critique rounds

1. **Round 1** (`qa/art-magic-square/crops/r1-*.png`): referee's feet touched the board top → referee shortened to 11 rows (1-px gap). Dealt-card dots in `t` were as loud as the bar → dots `l`. Antenna sweep invisible on paper because the `w` tip vanishes → the top two antenna pixels tilt. Fills, digits, ring, tags, link and fade already read.
2. **Round 2** (`crops/r2*.png`): on ink the `k` referee disappeared (eyes and badge floating) → navy `s` body with `m` lit edges (the verifier machine, metal ramp; reads on both). Seeded variety was poor (loops 2–4 identical) → hashed seeds. Hop (squash–rise–hold–fall–land) and lean-in verified frame by frame.
3. **Round 3** (`crops/r3*.png`, `r4-rounds.png`, `r5-rounds.png`, `r6-row1.png`): discovered that `cache 'loop'` only ever renders ticks `0..period−1`, so per-loop variety needs `period > loopTicks` → `period 288` (4 rounds). Consecutive rounds now change both row and column. On a row-1 round the ring cut through the referee's feet → the referee is drawn after the game layer and stands in front of the halo. Verified ring / tag / sparkle geometry for rows 1 and 3 and columns 1 and 2.
4. **Round 4** (`crops/r7-*.png`, `r8-deal-*.png`): the dealt card crossed the top corner cell at tick 1 → the toss eases sideways first. Fade steps 3/4 → 2/4 → 1/4 → empty checked; pop frames (6, 12) and the loop seam (71 → 72) checked; the deal arc now never overlaps the board.

## Acceptance (card 5 + common list)

| # | criterion | result |
|---|---|---|
| C1 | `npm run validate -- magic-square` passes | **pass** (0 errors). One warning: "9 L-corner doubles in thin lines" at the poster: all of them are the engine's own `0` glyphs (two per 5×7 zero, four per 3×5 zero); not fixable in the piece |
| C2 | reads at 1× and 4×, on paper and ink | **pass**: `qa/sheets/magic-square.png`, `magic-square-ink.png`, `qa/art-magic-square/poster-4x/`, `ink-live/` |
| C3 | light upper-left, no pillow shading, no banding, no stray orphans | **pass**: orb rims lit `c`/`r` upper-left, shaded `i`/`n` lower-right; referee lit `m` upper-left; flat Mistral-style cells; only sparkles are single pixels |
| C4 | loop seam invisible | **pass**: frame(288) == frame(0) (validator); 71 → 72 and 287 → 0 inspected (`crops/r7-pop-seam.png`) |
| C5 | frames captured match the timeline ±1 tick | **pass** on the Node sheet (exact ticks); the Playwright capture skips ticks irregularly (screenshot time > 83 ms) so timing was verified on the sheet and the order of beats on `live/live-sheet.png` |
| C6 | poster meaningful and matches the card | **pass**: tick 40, row 2 + column 3, `1 0 1` / `0 1 0`, shared `11`, azure ring; `reduced/` frames identical |
| C7 | white flashes ≤ 1 tick and ≤ 3/s | **pass**: one 1-tick flash (ring + link) per 6-s round |
| 5a | row parity even, column parity odd, shared cell equal in every loop | **pass** for all 4 rounds (table above; `rounds` check); two rounds read from live frames: loop 1 `1 1 0` / `1 0 0` → `11`, loop 2 `1 0 1` / `1 1 1` → `11` |
| 5b | Alice always blue, Bob violet, shared indigo | **pass** |
| 5c | loop 0 poster = middle row + right column | **pass** |
| 5d | no rust / alert anywhere | **pass** (palette has no `R`/`F`) |
| 5e | digits legible at 1× | **pass** (1× strip under the sheets; 5×7 single bits, 3×5 pairs) |
| 5f | `state()` outputs `deal | fill | answer | win | reset`, `win` from tick 33 | **pass** |

## Evidence

- `qa/sheets/magic-square.png`, `qa/sheets/magic-square-ink.png`: Node contact sheets (every 2nd tick of the 288-tick period, poster boxed).
- `qa/art-magic-square/live/`: 96 harness frames at zoom 2 (`frame-*.png`, `contact-sheet.png`, `anim.gif`) and `live-sheet.png` (canvas crops, 6 per row, in order).
- `qa/art-magic-square/reduced/`: `?rm=1` frames 2 s apart (identical posters).
- `qa/art-magic-square/ink-live/`, `poster-4x/`: harness on ink; poster at zoom 4.
- `qa/art-magic-square/crops/`: the 8× / 6× critique crops per round (`r1` … `r8`), `crop.sh` cuts frames out of a Node sheet.

Build for capture: `BP_ONLY=magic-square npx vite build --outDir .qa/art-magic-square`, then `tools/frames.mjs … --path "/preview.html?piece=magic-square&zoom=2"`.

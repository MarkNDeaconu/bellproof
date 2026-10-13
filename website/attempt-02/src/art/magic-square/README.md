# `magic-square` · the Mermin–Peres game, played (art-spec card 5 · revision 1)

96×64 art px → 384×256 CSS px on the verify figure frame (design-spec §5.8, revision-1 §1.4). `ticksPerFrame 1`, `loopTicks 72` (one round, 6 s), `period 288` (four rounds, cached as 288 small canvases ≈ 7 MB, ~30 ms idle-sliced generation), poster **tick 40**, `cache 'loop'`, 15 colours.

Palette as built: `k s t l h p w b c i a r v g n`. Card 5 lists `R` (never used: quantum players always win) and `m`; those two slots are spent on `h` (ground shadows, revision M1) and `n` (Bob's shaded rim, qubit-folk card: Bob is `r/v/n`). No alert colour appears anywhere.

## Revision 1 (M1–M3)

- **M1 · craft** (qa-pixel #8): 1-px `w` catchlights upper-left of each eye (eyes moved to box row 6 so the catchlight has room); a 1-row ground shadow under every figure (`h` 8 px with `t` under the feet; it stays on the floor and shrinks to 4 px of `h` while the creature is airborne; the referee gets an `h` shadow on row 11); question cards enlarged to 9×9 with a `t` rounded outline, `p` face and an ink **dog-ear** at the top right so they read as cards (the face-down `?` is now a clear 3×5 glyph and the dealt face is a 7×7 mini-grid with a 7-px bar); the `+` / `−` parity tags are replaced by **ring sparkles** (`g.ring(r = 2)`, `b` beside Alice's completed row at x 72–76, `v` under Bob's completed column centred on row 58). The link moved to rows 62–63 (2-level wave) so verdict ring, marker and link never touch.
- **M2 · README** (qa-originality #11): this file cites design-spec sections only.
- **M3 · perf** (qa-motion-perf #14): the static layer (empty board outlines + the referee's shadow) is rasterised once at module load into `STATIC: Part` and blitted per frame; the per-frame work is now the players, the link, the cards and the game layer only (0.046 ms/frame in Node).

## The game, correctly

| | Alice (blue `b`) | Bob (violet `v`) |
|---|---|---|
| Gets | a **row** | a **column** |
| Fills | 3 bits with an **even** number of 1s (observable product **+I**) | 3 bits with an **odd** number of 1s (observable product **−I**) |
| Marker | blue ring sparkle beside the completed row | violet ring sparkle under the completed column |
| Win | they write the **same bit** in the shared cell (indigo `i`) | |

Parity convention: outcome **+1 ↔ bit 0**, **−1 ↔ bit 1**. In the Mermin–Peres square every row of observables multiplies to +I (even number of 1s) and every column to −I (odd number of 1s). Quantum players sharing two Bell pairs win every round; no classical table can, so the best classical rate is 8/9 (the HTML readout under the figure carries `classical ≤ 8/9 · quantum = 1`). The piece shows only wins.

Rounds (`roundFor(loop)` in `index.ts`):

| loop | row | col | Alice | parity | Bob | parity | shared |
|---|---|---|---|---|---|---|---|
| 0 (poster, deck cover) | 2 | 3 | 1 0 1 | even | 0 1 0 | odd | 1 / 1 |
| 1 | 1 | 2 | 1 1 0 | even | 1 0 0 | odd | 1 / 1 |
| 2 | 3 | 1 | 1 0 1 | even | 1 1 1 | odd | 1 / 1 |
| 3 | 2 | 2 | 0 0 0 | even | 1 0 0 | odd | 0 / 0 |

Loops 1–3 come from `rng(hash(loop))`: pick (r, c) (re-drawn until both differ from the previous round), two free Alice bits (third = XOR), `bob[r] = alice[c]`, one free Bob bit, the last bit fixes odd parity. Every round is valid by construction; loops 1 and 2 were also read off the live capture (`qa/art-magic-square/live/live-sheet.png`).

## Composition (art px)

- Board 41×41 at x 28–68, rows 12–52: 3×3 cells of 13×13 with corner pixels removed, 1-px gaps. Empty: `l` outline. Alice's row `b`, Bob's column `v`, shared cell `i`: flat fills, as the ramp is used only as flat blocks (design-spec §1.5). Single bits are 5×7 `w` digits; the shared cell shows Alice's and Bob's bits as two 3×5 `w` digits.
- Referee 12×11 at x 42–53, rows 0–10, drawn **in front** of the board: navy `s` figure from the metal ramp with `t` lit edges (upper left, design-spec §1.7 roles), `w` eyes, `t` badge, `h` shadow. Two 9×9 question cards float beside its raised hands at x 32–40 / 55–63.
- Alice 12×14 at x 2–13, Bob at x 82–93, rows 38–51 (qubit-folk creature: 10×10 glass orb `g`, 2×1 `w` specular, rim `c/b/i` for Alice, `r/v/n` for Bob, `k` eyes with `w` catchlights, `v` antenna with `w` tip, 2×2 `s` feet, shadow on row 52).
- Dealt cards land above the players' heads (x 3–11 / 84–92, rows 27–35) and flip to the mini-grid with the dealt row as a `b` bar or column as a `v` bar: the card *is* the question.
- Entanglement link at rows 62–63: 2-on-1-off dashes alternating `a`/`r`, a wave travelling **inward from both ends** (nothing travels from Alice to Bob).
- Verdict ring: `g.ring(r = 8)` around the shared cell centre; `w` corner sparkles at the diagonal neighbours' removed corner pixels, alternating dot / small cross every 3 ticks.

Deviations from the card, on purpose: question cards are 9×9 with a mini-grid instead of 4×5 digit cards (readability); the `p` 3×4 answer cards are omitted (paper on the card plate is invisible) in favour of the ring markers; the link sits at rows 62–63 rather than 56; the referee is navy rather than ink so it reads on ink.

## Timeline as built (ticks within a 72-tick round)

| ticks | what | state |
|---|---|---|
| 0–5 | the referee's two `?` cards toss out to Alice and Bob (x eased `out`, y `inOut`, clearing the board); on tick 5 they flip to the row / column mini-grid | `deal` |
| 6, 8, 10 | Alice's row fills `b` left→right: 9×9 pop for one tick, then the full cell | `fill` |
| 12, 14, 16 | Bob's column fills `v` top→bottom; the shared cell turns `i` when he reaches it | `fill` |
| 18, 20, 22 | Alice's bits: 1-px `w` seed, then the 5×7 digit (event `bit`) | `answer` |
| 24 | blue ring marker beside Alice's row; 24, 26, 28 Bob's bits pop top→bottom; in the shared cell both bits sit side by side as 3×5 digits | `answer` |
| 30–31 | violet ring marker under Bob's column; both players lean in 1 px | `answer` |
| 32 | **flash**: `w` ring around the shared cell, the link flashes `w` for one tick, both antennas snap upright (event `flash`) | `answer` |
| 33–50 | `a` ring + twinkling `w` corner sparkles; 33 squash, 34–37 both hop 2 px together (shadows shrink), 38 landing squash; blink on 45 (event `win` on 33) | `win` |
| 51–54 | 4-step screen-locked dither fade of fills, digits, markers and the dealt cards (event `reset` on 51) | `reset` |
| 55–71 | empty board; players idle (antenna sweep, blink on 63); the referee shuffles his `?` cards | `reset` |

`state(tick)` ∈ `deal | fill | answer | win | reset`; `events(tick)` ∈ `deal, fill, bit, flash, win, reset`. No inputs (pure cached loop).

## Critique rounds (revision 1)

1. `qa/art-magic-square/crops/v1-*.png`: cards now read as cards on paper and ink (the dog-ear vanishes on ink but the notch remains); catchlights visible; shadows ground the figures; ring markers no longer read as glyphs. Nothing to fix.
2. `crops/v2-*.png`, `live/live-sheet.png`, `poster-4x/`: shadow shrink during the hop correct; fade and seam clean; marker geometry checked for rows 1/3 and columns 1/2 (no contact with the verdict ring or the link); live rounds 1 and 2 logically correct; reduced-motion frames identical.

Attempt-01 critique rounds 1–4 (referee size/colour, antenna, seeding, `period`, draw order, toss arc) are in `../../../../attempt-01/src/art/magic-square/README.md`.

## Acceptance

| # | criterion | result |
|---|---|---|
| C1 | `npm run validate -- magic-square` | **pass** (0 errors; 1 warning "8 L-corner doubles" from the engine's `0` glyph shapes) |
| C2 | reads at 1× / 4×, paper and ink | **pass**: `qa/sheets/magic-square.png`, `magic-square-ink.png`, `qa/art-magic-square/poster-4x/` |
| C3 | light upper-left, no pillow shading / banding / orphans | **pass** |
| C4 | loop seam invisible | **pass** (frame(288) == frame(0); 71 → 72 inspected) |
| C5 | timeline within ±1 tick | **pass** on the Node sheet (exact ticks) |
| C6 | poster meaningful | **pass** (tick 40; `reduced/` frames identical) |
| C7 | white flashes ≤ 1 tick, ≤ 3/s | **pass** |
| 5a | row even, column odd, shared equal in every loop | **pass** (4 rounds; 2 read from live frames) |
| 5b–5e | colours, loop-0 poster, no alert, digits legible | **pass** |
| M1–M3 | catchlights, shadows, card corners, ring sparkles; README; static layer | **pass** |

## Evidence

`qa/sheets/magic-square[-ink].png`; `qa/art-magic-square/live/` (96 harness frames at zoom 2 + `live-sheet.png`), `reduced/`, `poster-4x/`, `crops/v1*`, `crops/v2*`.

Build for capture: `BP_ONLY=magic-square npx vite build --outDir .qa/art-magic-square`, then `tools/frames.mjs … --path "/preview.html?piece=magic-square&zoom=2"`.

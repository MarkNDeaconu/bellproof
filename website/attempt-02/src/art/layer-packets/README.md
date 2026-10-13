# layer-packets · art-spec card 8 (section 5, `#layer`)

Four pieces for the "Bellproof checks the answer before anyone gets paid" diagram (design-spec §5.5):

| id | size | variants | sits on | colours | alt |
|---|---|---|---|---|---|
| `lab-bench` | 24×24 | none | `--card` (Clients cell) | 10 / 11 | `''` (decorative) |
| `lane-left` | 48×24 | `v` 24×48 | `--paper` (lane column) | 11 / 11 | `''` (decorative) |
| `vault` | 24×24 | none | `--ramp-3` blue (Bellproof cell) | 13 / 14 | content.md §8 alt, verbatim |
| `lane-right` | 48×24 | `v` 24×48 | `--paper` (lane column) | 9 / 9 | `''` (decorative) |

All four have `loopTicks 48`, `ticksPerFrame 1`, `cache 'loop'`, **`poster 12`**, and no inputs. The vault carries the one description of the whole diagram (content.md §8), so screen readers hear it once. Files: `timeline.ts` (the shared story constants), `parts.ts` (packet bitmaps), `lab.ts`, `vault.ts`, `lanes.ts`, `index.ts` (exports `labBench`, `vault`, `laneLeft`, `laneRight`).

## The story (one 48-tick loop, shared by all four pieces)

| tick | lab-bench | lane-left (job + escrow → / ← certified result) | vault (Bellproof) | lane-right (challenges → / ← answers) |
|---|---|---|---|---|
| 0 | scanning | the token's leading edge enters the forward track (2 px/tick) | open, waiting | answers stream left, one every 8 ticks (they leave the provider at 6, 14, 22 …) |
| 2 | | | | 2nd challenge card leaves Bellproof |
| 4–17 | | token rolls in with the job envelope 4 px behind, both trailing speed lines | a white glint runs across the door's top rim | |
| 11 | ✓ appears (one white tick) | last job's certificate scroll reaches the lab | | |
| **12** | **POSTER**: steady azure ✓ | **POSTER**: token mid-lane face-on, envelope behind it, certificate arriving at the lab | **POSTER**: open, bell seal and wheel visible | **POSTER**: two padlocked `?` cards mid-lane, three answer bits |
| 24 | | **the token's leading edge reaches Bellproof (x 48), face-on** | **door slides in 1 px/tick (24–27)** | |
| 27 | | | door flush: 1-tick white glint on the rim (escrow locked) | |
| 28–31 | | envelope finishes arriving (gone by 33) | the 4-spoke wheel (the dial) turns a quarter to lock | |
| 32–35 | | | **the bell rings: verification passed.** Bell swings L, C, R, C; azure halo on 32–33 (the logo-mark ring); sound marks on the frame | |
| 36–39 | ✓ off, scanning again | certificate scroll leaves Bellproof (x 48 at 36) and travels back to the lab | door slides out 1 px/tick | |
| 39–43 | | | **the escrowed token rises out of the gap (eased 3, 2, 1 px) and glints: payment released only after the pass** | |
| 42 | | | | 1st challenge card leaves Bellproof (cards 16 px apart) |
| 44–46 | | | the token bursts (+, ring, fade) | |
| 47 → 0 | | | identical to 0 (seamless) | |

Secondary life on coprime-ish cycles: the flask's bubble rises 1 px/tick and pops every 8 ticks (with a vapour wisp), the monitor's scanline moves 1 px per 2 ticks, the token flips once a second at 6 fps (face, face, turn, edge, turn, face), and the cards march with a 1-px bob at 6 fps, out of phase with each other.

Causality you can see: the vault shuts on the token's arrival tick (24 in both pieces); the bell rings before anything leaves; the certificate leaves as the door opens (36); the payout follows the pass; the lab's ✓ lights as the certificate lands.

**Vertical variants (`v`, 24×48).** These are drawn, not rotated. Positions are transposed (forward = down in the left column, return = up in the right column) and every sprite stays upright. Cards and the token descend, answers and the certificate rise, and the tails and speed lines trail behind on the correct side. A dashed `h` median runs between the two tracks (the middle of a two-way road): row 11 in `h` and column 11 in `v`. Forward packets occupy rows 0–10 and return packets rows 14–22, so the tracks never overlap.

## Integration notes (sections-2 / integration)
- Mount the four with `--w/--h` = 24/24 (lab, vault) and 48/24 (lanes), or the `v` variant at 24/48 when stacked (<1024).
- **Sync.** The engine starts every mount from its poster tick. All four share poster 12, so pieces that start playing on the same clock tick stay in phase with no `data-phase`. On desktop the four sit in one row, so the IntersectionObserver starts them together. In the stacked layout they enter view at different scroll positions and would drift apart. There, mount them with `autoplay: false` and drive them as one group from a single observer on the diagram: on enter, `m.seek(12)` then `m.play()` for all four in the same call; on leave, `m.stop()` for all four.
- The vault is drawn for the blue `--ramp-3` cell; it also reads on paper and ink.

## Evidence (all opened and inspected)
- Contact sheets: `qa/sheets/{lab-bench,vault,lane-left,lane-right}.png`, `…-ink.png`, `lane-left-v.png`, `lane-right-v.png` (+ `-ink`).
- Diagram, the four pieces side by side on their real backgrounds at the same story tick: `qa/art-layer-packets/diagram-story-a.png` (0–32), `diagram-story-b.png` (34–46), `diagram-vertical.png`, `diagram-poster-8x.png`.
- Live harness frames (BP_ONLY build, `frames.mjs --interval 83`): `qa/art-layer-packets/{vault,lab-bench,lane-left,lane-right,lane-left-v,lane-right-v}-live/` (frames, `anim.gif`, `crops.png` = canvas crops), `vault-zoom4/` (preview zoom 4, `--zoom 4`). The capture tool's throughput is about 1.5 ticks per frame; the payout recurs every 32 frames = 48 ticks, which confirms the period live.
- Reduced motion (`rm=1`, 6 frames 1 s apart): `lane-left-reduced/`, `vault-reduced/`. 1 unique frame each (the poster).
- Critique rounds: `round0-sprite-candidates.png`, `round1-diagram.png`, `round2-coin-answer-seal-candidates.png`, `round2-bell-candidates.png`, `round2-diagram-8x.png`, `round3-diagram-8x.png`.

## Critique rounds
**Round 0 (packet candidates).** The coins read as gems. The first envelope read as a smiling face, because its `k` corner flap pixels looked like eyes. A 3-wide lock can't centre on a 6-wide card. The scroll with rolled ends read best. → I took the centred 7-wide card and the rolled scroll, and drew the flap in the outline colour so the V runs out of the corners.

**Round 1 (full diagram).** The vault read as a camera lens or washing machine (concentric groove plus dark crescent). The violet-on-indigo bell was illegible. The flask was a solid blue cone. The token was still a gem. The answer bits vanished on paper. The payout was a 4-px dot. → Dropped the groove and added a rotating 4-spoke wheel as the dial. The token became a dark-rim, inner-ring coin. The answers got a `w c / c b` head (replaced in revision 1, see below). The flask got taller with liquid only in the lower cone.

**Round 2.** A light bell in an indigo disc read as an egg or keyhole. → Five bell drafts on the door colour; I picked the logo-mark reduction with an indigo lit half, violet shaded half, and night lip and clapper, drawn straight onto the door. The bench contact shadows read as notches, so I removed them. The dither dissolve on the payout looked muddy, so it became a sparkle burst. The payout now reuses the lane token, so the coin you saw arrive is the coin that leaves.

**Round 3.** The open door's crescent was a flat black hole. → The recess's lower-right inner wall now catches light (`s`). The token popped in at full size, so on tick 39 it only peeks out of the gap. The scroll's rolled ends were pillow-shaded along their length, so each roll is now one tone. The vault was frozen for 0–23, so a rim glint now sweeps the top arc. It first crawled down the canvas edge like a defect, so I restricted it to the top arc and gave it a 1-px spill. The lab poster landed on the ✓'s white flash frame, so the flash moved to tick 11. The token was edge-on at its arrival tick 24, so the spin was re-timed to a 12-tick flip that is face-on at 12 and 24.

Validator warnings that remain are all deliberate: the flap and padlock-shackle diagonals, the `?` dot, the padlock keyhole highlight, the diagonal wheel spokes, the answer bits' shading, and the corners of 1-px outlines (the doubles heuristic counts rectangle corners).

## Revision 1 (attempt-02, L1 · P2)
QA (`attempt-01/qa/qa-pixel/strips/lane-right-strip.png`, finding 14): the answer bits (`w c / c b` head, `a`/`g` tail) broke up into a faint checker at 1× on paper. I tested six variants at 1×, 2× and 4× on paper and ink. The pick is a **solid 2×2 `c` head with a tapering `a` tail** (`cc aa / cc a.`): one cluster per colour, no `w`/`g` holes against paper. Positions, timing, the 48-tick loop and poster 12 are unchanged, so the four pieces stay in phase. lane-right now uses 9 colours. Evidence: `attempt-02/qa/sheets/lane-right*.png`, `attempt-02/qa/art-layer-packets/lane-right-live/crops.png`, `lane-right-1x/crop-1x.png` (U = 4), `lane-right-v-live/`.

## Acceptance (art-spec §0 common + card 8)
| # | check | result |
|---|---|---|
| 1 | `npm run validate`: palette-only, ≤ maxColours, exact loop, poster in loop | **pass** (0 errors) |
| 2 | reads at 1× and 4×; on paper and ink (vault also on blue) | **pass** (1× strips, ink sheets, diagram renders) |
| 3 | light upper left; no pillow shading, banding or stray orphans | **pass** (the remaining flags are deliberate, see above) |
| 4 | loop seam invisible | **pass** (47 → 0 identical state in every piece) |
| 5 | live frames match the timeline (±1 tick) | **pass** (live crops match the Node sheets frame for frame) |
| 6 | poster meaningful | **pass**, with a deviation: the vault poster is 12 (open, awaiting the job), not 30 (shut). See below. |
| 7 | white flashes ≤ 1 tick and ≤ 3/s | **pass** (lab ✓ 11, rim 27, token glint 43, burst 44; the bubble pop is a 1-px sparkle) |
| 8 | tracks never overlap | **pass** (forward rows 0–10, return rows 14–22) |
| 9 | vertical variants read with gravity down | **pass** (cards descend, answers rise) |
| 10 | the vault shuts on the token's arrival tick in lane-left | **pass** (tick 24 in both) |
| 11 | story beats asked by the lead: job + escrow in; challenges out and answers back; certified result back; payment only on a pass | **pass** (token arrives → lock → bell rings → open → payout + certificate) |

## Deviations from the card (deliberate)
1. **Posters all 12** (card: lab 10, vault 30, lanes 12). The engine starts a mount from its poster, so different posters would desync the vault from lane-left by 18 ticks. Twelve is the one tick at which every lane packet is on screen.
2. **One job train per loop** (card: "period 24"). This way every token that arrives shuts the vault. A second train arriving at an open vault broke the causality.
3. **Challenge card 7×10** (card: 6×8 plus a 3×3 lock). An odd width lets the 3-wide padlock and the 3×5 `?` sit centred.
4. **Bell 8×8 drawn on the door, without a separate disc** (card: 7×7 `v` bell on `i`). It is still `v` on `i`, as the bell's two lit halves. An even width centres it on the 16-px door.
5. **Liquid rows 11–14** (card: 10–14), so the glass reads. The monitor is 8×6 with a 6×4 display.
6. **Envelope flap in slate `m`** (card: `k`). Ink corner pixels read as a face.
7. **Added beats:** the wheel lock, the bell ring, the token payout, the lab ✓, the rim glint and the vapour wisp. The lead asked for the "payment released only on a pass" beat, and the card has no beat for it.

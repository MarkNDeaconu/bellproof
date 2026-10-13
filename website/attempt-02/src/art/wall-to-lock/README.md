# wall-to-lock (art-spec card 7) · revision 1 "at scale"

Owner: `art-wall-to-lock` (opus). One piece: `wall-to-lock`, 96×48 (page 384×192), 12 fps, loop 120 (10 s), **poster 72**,
`cache 'loop'`, 14 colours (`k s m t l e h p w b c a v g`). Files: `index.ts` (timeline, choreography, static layers),
`fridge.ts` (the 26×38 fridge and the merged pair, built with fridge-family's public `plate()` / `coax()`), `parts.ts`
(card, shackle, body). Sections read `state()` and `exports.labelAt(localTick)` → `'physical' | 'cryptographic'`, and both are
unchanged.

## What changed in revision 1 (W1, W2; qa-pixel #5)
| | attempt-01 | revision 1 |
|---|---|---|
| fridges | `fridge-mini` 16×24 | own 26×38 in the fridge-out manner: plates 26/20/14/10, 2 coax, a 12×10 chip box with the owner's qubit (Alice `b`, Bob `v`) |
| merged provider | one mini | one 40-wide fridge: plates re-rasterised at the combined width, and **one chip box holding both qubits** |
| wall | 12×30 | 16×44 brick face plus a 2-px side face (`m`/`s`), lit `e` cap, 8×4 bricks in running bond |
| padlock | 10×12 | 14×16, a 12-wide shackle (8-px hole shows the card's tab), `e` highlight, `k` keyhole |
| cards | 6×8, 3×5 `?` | 9×11, `font5x7` `?` |
| ground | 1-row `l` | 2 rows: `h` top, `t` below |
| State B setting | empty sky | **the cloud**: "inside one cloud" the provider plays both roles. A cumulus behind the merged fridge (`g` body, `a` shadow outline and bump crescents, 1-px knock-out around the fridge); it condenses with a 4-step ordered dither (43–46) and evaporates at 96–98 |
| W2 | per-frame drawing | every static layer is built once at module load (ground, decks, cards, 11 wall heights, padlock variants, flying masses, fridge-pair bases per offset, cloud); a frame is a few blits plus the moving pixels (0.07 ms in Node) |

**Empty canvas** (each column counts as filled from its topmost prop pixel down; specks and sparkles are ignored; on this
metric attempt-01 measured 68 % in State A, matching QA's "about 70 %"):
State A **34.1 %** · State B **23.7 %** · poster **23.8 %** · loop average **32.3 %** (morph frames peak at 58 % mid-leap).
Side by side with the Magic Square at 1×: `qa/art-wall-to-lock/beside-magic-square-1x.png` (and `-4x`).

## Timeline (ticks; verified ±0 in the browser)
| ticks | what happens |
|---|---|
| 0–23 | State A: fridges at x 10 and 60, wall x 39–56 rows 2–45, decks at x 0 and 87. Alice's card hops into the left chip box (1–7), and her qubit blinks `w`→`a` at 9. Bob's card goes into the right box (10–16), blink 18 |
| 24 | crack zig-zags through the top courses |
| 25–33 | the wall crunches down a course per tick (11 → 2); it crouches at 34 |
| 35–46 | the 18×8 brick mass leaps up and left, high over the fridges (never overlapping them, by per-tick check). It rounds off, then unfolds into a brick padlock silhouette and drops |
| 35–46 | the fridges slide 18 px each (1 1 1 2 2 2 2 2 2 1 1 1), pulses resting. Plates fuse once they overlap (42); the two chip boxes become one at 46 |
| 43–46 | the cloud condenses around the merged fridge |
| 47 | the padlock lands at x 13 (open shackle, short leg out), with dust. The label flips to `cryptographic` |
| 48 / 49 | brick → steel (50 % dither, then steel); sparkle glint at 50–51 |
| 50–58 | Alice's next card hops to the padlock (lands at 54), slides into the body through a `k` slot (55–57), and its blue tab shows in the shackle hole |
| 59 | the shackle snaps (1-px overshoot) with azure click ticks; hold 60–61 |
| 62–65 | the padlock shuffles under the fridge to x 20 (docked, 1 px from the box) |
| 67 | blind answer: Alice's qubit blinks; the pulse runs up her readout line (68–70); a sparkle leaves through the top (71–75) |
| 76–86 | **only now** Bob's card is dealt: two hops, lands at 84, slides into the box at 85–86 |
| 88 | Bob's qubit blinks; pulse 89–91; sparkle 92–96 |
| 96–98 | the cloud evaporates; the padlock turns back to brick and crouches |
| 99–108 | it leaps up-left, clear of the plates, high over the splitting fridge (split 100–111), and drops on the wall's footprint |
| 109 | lands as a 2-course block; the label flips to `physical`. It grows a course per tick to 11 (118), seamless into 0 |

## Critique rounds (revision; evidence in `qa/art-wall-to-lock/`)
**v1** (`v1-key.png`): the scale was right, but four coax lines per fridge (eight merged) made a cage, and State B was 60 % empty
(one fridge plus padlock under an empty sky). *Fixes:* two coax lines; 26×38 fridges; a 16×44 wall plus side face; the cloud.
**v2 / r1** (`v2-key.png`, `r1-strip-a/b.png`, `r1-zoom-fuse.png`): the flying block sat on the left fridge's cable tip at tick 40,
and the cloud's middle bump was cropped by the top edge with a boxy right side. *Fixes:* the high leap frames fly 2 rows higher,
partly off the top; five smaller bumps kept inside the canvas.
**r2** (`r2-zoom.png`, `r2-cloud.png`, `r2-morph.png`, `r2-back.png`, `r2-cards.png`, sheet crops): the cloud was a flat mass,
so `a` crescents now mark where each bump overlaps the next. Alice's landed card overlapped her refilled deck (the deck-to-box space
is narrower than a card), so each deck now refills only when its dealt card is clear.

## Acceptance
| Criterion | Result |
|---|---|
| W1: ≤ 35 % empty canvas | **pass**: State A 34.1 %, State B 23.7 %, poster 23.8 %, loop 32.3 % |
| W1: reads at 1× beside the Magic Square | **pass**: `beside-magic-square-1x.png` |
| W1: sizes (fridges ~24×36, wall ~16×40, padlock 14×16, 2-row ground, 5×7 glyphs), morph kept | **pass**: 26×38, 16(+2)×44, 14×16, 2 rows, `font5x7`; same story beats and `labelAt` |
| W2: static layers | **pass**: all static layers prebuilt; 0.07 ms/frame |
| validate | **pass**: 0 errors, 0 warnings, 14 colours, exact loop |
| sheets on paper and ink | `qa/sheets/wall-to-lock.png`, `-ink.png` (crops: `r2-sheet-*.png`) |
| live timing | **pass, ±0**: 1501 in-page samples, 120/120 ticks, all pixel-exact; 64 captured frames all pixel-exact |
| reduced motion / console | **pass**: `shot-rm-1440-step-00.png` (frozen at 72, clock idle); console clean |
| card 7: second card only after the first answer leaves | **pass**: sparkle gone at 76, Bob's card dealt at 76 |
| card 7: running bond | **pass**: even courses joint at x+7, odd at x+3 and x+11 |

## Evidence
`qa/art-wall-to-lock/`: `v1-*`, `v2-*`, `r1-*`, `r2-*` (critique), `beside-magic-square-{1x,4x}.png`, `live-zoom2/` and
`live-ink-zoom4/` (frames, GIFs, contact sheets, plus small copies), `shot-rm-*`, `shot-physical-ink-*`.

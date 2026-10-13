# wall-to-lock (art-spec card 7)

Owner: `art-wall-to-lock` (opus). One piece: `wall-to-lock`, 96×48 (page 384×192), 12 fps (`ticksPerFrame 1`),
loop 120 (10 s), **poster 73**, `cache 'loop'`, 14 colours used of the card's 15 (`k s m t l e h p w b c a v g`, `i` unused).
Files: `index.ts` (piece, timeline, choreography), `parts.ts` (card, `?`, shackle, body bitmaps).
Fridges come from the frozen `fridge-family` helpers (`drawFridgeMini`, `MINI`), imported, never copied.

## The idea, as built
Two mini fridges stand on a floor, with a brick wall between them. Each fridge is dealt its own `?` card from its own deck:
Alice's cards have a blue tab (`b`) and come from the left; Bob's have a violet tab (`v`) and come from the right.
The wall then crunches down into a brick block and **leaps over** the two fridges as they slide together. Mid-air it
reshapes into a padlock, lands on the left, and its bricks turn to steel. Now there is one fridge. Alice's card walks into the
open padlock and the shackle snaps shut, so only the blue tab still shows between the legs. The locked question is carried
to the fridge, which answers it blind: a pulse runs up the readout line and an azure sparkle leaves through the top. Only
then is Bob's card dealt. It arrives open, the fridge swallows it, and it is answered the same way. At the end the padlock
turns back to brick, leaps back over the splitting fridge and grows into the wall again.

## Outputs for sections-3 (`#verify-compiler`)
- `state(tick)` → `'physical'` (0–23) · `'morph'` (24–47, 96–119) · `'crypto'` (48–95). `states` is declared.
- **Label:** `piece.exports.labelAt(localTick)` → `'physical' | 'cryptographic'` (the keys of `strings…labels`). It flips
  the moment the separator visibly changes: `cryptographic` from 39 (the padlock lands) and `physical` again from 108 (the
  bricks land on the wall's footprint). That gives exactly two labelled states. If you use `state()` instead, keep the
  previous label during `'morph'`.
- `events(tick)`: `'label'` at 39 and 108, `'lock'` at 55 (shackle snaps), `'answer'` at 67 and 91 (chip blinks).
- Reduced motion: the poster (73) is crypto: padlock docked with Alice's tab inside, the answer sparkle leaving, and Bob's
  card still waiting in its deck. The label is CRYPTOGRAPHIC SEPARATION.

## Timeline (ticks; verified ±0 in the browser, see QA)
| ticks | what happens |
|---|---|
| 0 | State A: wall x 42–53 rows 14–43 (10 courses, running bond), fridges at x 8 and 72 on floor row 44, decks at x 1 and 89 |
| 1–5 | Alice's card leaves the left deck, hops to x 7 (lands 5); the deck refills at 5 |
| 6–7 | it slides into the left chip box (clipped at x 13) |
| 8 | left qubit blinks `w`, then `a` at 9 |
| 9–13 / 14–15 / 16 | Bob's card: same on the right (lands x 83 at 13), slides in, the right qubit blinks |
| 17–23 | hold; coax pulses run (the mini's own loop) |
| 24 | morph starts; a crack zig-zags through the top courses |
| 25–30 | the wall crunches down one course per tick (30 → 12 rows); at 30 it crouches 1 row |
| 30–41 | the fridges slide 32 px toward each other (1 1 2 3 4 5 5 4 3 2 1 1), with their pulses resting |
| 31–38 | the brick mass leaps: block (31–32) → rounded (33–35) → padlock silhouette in brick (36–38), apex row 2, clear of both fridges |
| 37–41 | the fridges "zip": left of column 47 comes from the left fridge, right of it from the right one; wide → single at 41 |
| 39 | the padlock lands at x 20–29 (shackle open, right leg out); dust puffs 39–40 |
| 40 / 41 | brick → steel: 50 % ordered dither, then steel |
| 42–43 | the new steel shines: a plus sparkle off the shackle |
| 43–51 | Alice's next card hops from the deck to the padlock (x 8, then x 14) |
| 48 | State B (`crypto`) |
| 51–54 | the body's left side opens a `k` slot, and the card slides in 2 px/tick, hidden inside |
| 55 | the shackle snaps down (1-px overshoot) with two azure click ticks; the blue tab is centred between the legs |
| 56–58 | hold, locked |
| 59–65 | the padlock carries the card to the fridge at 2 px/tick, with a 1-px shuffle (the tab rides along), and docks at x 34–43 |
| 67 | the fridge answers blind: qubit `w` and window `a` (then the qubit goes `a` at 68) |
| 68–70 | the answer pulse runs up the right coax line, 7 px/tick, lighting each plate's underside as it passes |
| 71–75 | a plus sparkle (`a` arms, `w` core) rises from the cable and leaves the top |
| 76–88 | **only now** Bob's card is dealt; it hops in three hops (x 77, 64, 51) and lands against the chip box |
| 89–90 | it slides into the chip box (clipped at x 50) |
| 91 | the fridge blinks again; the pulse runs up 92–94, and the sparkle leaves 95–99 |
| 96 / 97 | reverse morph: the padlock's steel → 50 % brick → brick (the card inside is consumed) |
| 98 | the brick padlock crouches 1 px |
| 99–107 | it leaps up left of plate 1, over the fridges, reshaping padlock → rounded → block |
| 100–111 | the fridge splits (zips apart, then slides to x 8 / 72) |
| 108 | the block lands on the wall's footprint (dust); the label goes back to physical |
| 109–114 | the wall grows back one course per tick (12 → 30 rows) |
| 115–119 | hold → seamless into tick 0 |

The mini fridges run at normal speed in both states and at half speed while morphing, so 120 ticks = 6 mini loops and the
pulse seam is invisible. The fridges' own qubit blink is overridden (`qubit: 'v'`), so only the story blinks show.

## Deliberate deviations from the card (and why)
- **The bricks leap instead of falling and dissolving.** Round 1 built the spec version, and bricks falling in front of
  identical bricks read as "the wall sinks into the floor"; the reuse of material was invisible. A single brick mass
  leaping over the converging fridges and landing as the padlock reads instantly as "the wall became the lock". It also
  avoids the left fridge's path, which crosses the padlock site during ticks 31–36. Recolour t/l → steel over 2 ticks is kept.
- **The merge zips instead of a 4-tick dither.** The dithered right fridge ghosted badly over the left one (round 2). The
  zipper composite has no ghosting and keeps upper-left light, because each plate keeps its lit left end and shaded right end.
- **The padlock stands on the floor** (rows 32–43, not 26–37), like everything else in the scene.
- **The padlock carries the card to the fridge and docks there**, so the lock is literally *on the incoming question*.
  Bob's card comes from the right, his side in State A.
- **Answers leave upward** (up the readout line, then a sparkle) instead of exiting right. Bob's deck sits on the right, and
  an answer along the floor would cross it. The up-the-line readout is also the physically right direction.
- **Decks** (3-card piles) at both edges were added: they explain where questions come from and anchor the composition.
- **Poster 73 instead of 84.** 73 shows the locked question docked at the one fridge, its blind answer leaving, and Bob's open
  card still waiting. At 84, Bob's card is in transit and nothing uses the sky.
- Card glyph: the rounded 3×5 `?` from tc-rounds, so the site's question marks match.

## Critique rounds (evidence in `qa/art-wall-to-lock/`)
**Round 1** (`r1-strip-0/1.png`, `r1-zoom.png`). Spec choreography: the collapse read as the wall sinking, and the dissolve
at the floor was noise between the fridges. The open shackle (raised, both legs attached) looked like a taller closed lock.
In the poster the left third was empty. An answer pixel running right along the floor would collide with any waiting card.
*Fixes:* crunch-and-leap; decks; answers up the readout line; an open shackle with the short leg out (2-row gap).

**Round 2** (`r2-strip-0/1.png`, `r2-zoom.png`). The leap reads at 2×. Remaining problems: the dithered merge ghosted
(37–39, 101–103). The decks read as dice (owner-coloured back cards made a "top face"). The snap spark was `w` on
near-white paper, so invisible. The answer was a 1-px dot, too faint. The reverse leap's padlock clipped plate 1 at 99.
*Fixes:* zipper merge/split, with pulses resting while sliding; neutral back cards; azure click ticks; answer = coax pulse
plus a rising plus sparkle; reverse path moved 2 px left, with a shut silhouette.

**Round 3** (`r3-morph.png`, `r3-crypto.png`, `r3-back.png`, `r3-zoom.png`, `r3-audit-84.png`). Crumbs knocked off the
crunching wall read as horns, so they were removed. A pixel audit found single `p` specks where back-card faces showed
through rounded corners, and lone `l` pixels in the padlock body. *Fixes:* back cards drawn all-edge; the body
highlight became a 3-px cluster; a top-edge 2-px run; a sparkle glint on landing.

**Round 4** (`r4-deck.png`, `r4-answer.png`, `r4-travel-crop.png`, `r4-zipper.png`, sheet crops). The decks still read as
"card leaning on a grey box" and became a vertical pile (two card tops peeking). The blue tab flickered off every other tick
during the padlock's shuffle (the card didn't ride the bob) and now does. The zipper was checked close up: continuous plates,
no seam artefact. The poster moved to 73.

**Round 5** (`r5-deal-crop.png`, `r5-audit-poster.png`). The deck refilled while the dealt card was still over it (a one-tick
overlap); it now refills on landing.

**Remaining validator warning (deliberate):** 15 L-"doubles" on the poster. They are the `p` face around the `?` glyphs (6),
fridge-family recipe pixels (6) and two corners of padlock highlight clusters. There are 14 orphans, under the threshold:
recipe end caps, qubit and window (9), the glyph's hook and dot (4), and the shackle's diagonal outer corners (2, lit `e` /
shadow `t`).

## Acceptance
| # | Criterion | Result |
|---|---|---|
| C1 | `npm run validate -- wall-to-lock`: palette-only, ≤ 15 colours, exact loop, poster in loop | **pass**: 0 errors, 14 colours, 0.04 ms/frame |
| C2 | reads at 1× and 4×, on paper and ink | **pass**: 1× strip in the sheets; `shot-poster-{paper,ink,blue}`, `live-ink-zoom4` |
| C3 | upper-left light, no pillow shading, no banding, no stray orphans | **pass**: lit top/left and shadow right/bottom on bricks, cards, padlock and decks; orphans audited (above) |
| C4 | invisible loop seam | **pass**: 115–119 hold equals 0; mini clock = 6 loops per 120 |
| C5 | live frames match the timeline ±1 tick | **pass, ±0**: 1501 rAF samples of canvas + `localTick` read in-page, all 120 ticks covered, 1501/1501 pixel-exact; `state()` 1501/1501 |
| C6 | poster meaningful | **pass**: 73, see above (moved from 84, justified) |
| C7 | white flashes ≤ 1 tick, ≤ 3/s | **pass**: only 1-px `w` qubit, sparkle core and glint pixels, each ≤ 1 tick per occurrence |
| 7a | exactly two labelled states; the label changes on the state ticks | **pass**: `labelAt` is two-valued (flips 39/108, `events 'label'`); `state()` gives physical/morph/crypto per the card |
| 7b | the second card never arrives before the first answer leaves | **pass**: answer 1 leaves the frame at 75; Bob's card is dealt at 76 and arrives at 88 |
| 7c | bricks: no two adjacent courses share a joint (running bond) | **pass**: even courses joint at x+5, odd at x+2 and x+8 (wall, block, brick padlock) |
| — | cool palette only, no gold/orange/yellow | **pass** |
| — | reduced motion shows the poster | **pass**: `shot-rm-1440-step-00.png` (frozen at 73, clock idle) |
| — | console clean in the harness | **pass**: `shot-*-console.txt` |

## Evidence (all under `qa/`)
- Node sheets: `qa/sheets/wall-to-lock.png`, `qa/sheets/wall-to-lock-ink.png` (crops: `art-wall-to-lock/r4-sheet-*.png`)
- Critique rounds: `art-wall-to-lock/r1-*` … `r5-*` (strips at 2×, zooms at 6–8×, pixel audits with orphans and doubles boxed)
- Live (built with `BP_ONLY=wall-to-lock,fridge-family`): `art-wall-to-lock/live-zoom2/` (64 frames at harness zoom 2,
  GIF, contact sheet; small copy `live-zoom2-sheet-small.png`), `art-wall-to-lock/live-ink-zoom4/` (48 frames on ink,
  contact sheet at 4×; small copy)
- Harness shots: `art-wall-to-lock/shot-poster-{paper,ink,blue}-1440-step-00.png`, `shot-rm-1440-step-00.png`

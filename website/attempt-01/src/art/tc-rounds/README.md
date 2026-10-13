# `tc-rounds` · hidden test rounds (art-spec card 6)

`src/art/tc-rounds/index.ts` exports `tcRounds` (default export too), plus `SEQUENCE`, `flipAt(i)`, `arrivalTick(i)`, `W`, `H`, `LOOP`, `PERIOD`.

| | |
|---|---|
| size | 128×40 → 512×160 CSS px |
| clock | `ticksPerFrame 1` (12 fps), `loopTicks 96`, `period 384` (3 clean sweeps + 1 cheater), `cache 'loop'` |
| poster | **tick 40** (clean, mid-sweep) |
| palette | `v n r w u c b a h t l p R F` (14 colours, `maxColours 14`) |
| states | `running` · `accepted` (64–87 of a clean loop) · `rejected` (319–360) · `idle` |
| events | `accept` at 64, 160, 256 · `reject` at 319 |
| exports | `sequence`, `rows.schedule {y:4,h:8}`, `rows.provider {y:24,h:8}`, `meter {x:116,y:4,w:7,h:28}`, `cheaterLoop: 3` |
| alt | "Hidden test rounds mixed among compute rounds; the provider sees only question marks." (= `strings.verify.rounds.alt`) |

## What it shows
- **Top row (rows 4–11): the verifier's secret schedule**, the deck's `T C C T C C T C T C C T` verbatim. Tests are deep violet tiles with a white `T`. Computes are mist-blue tiles with a blue `C`.
- **Bottom row (rows 24–31): what the provider sees**, twelve identical neutral `?` tiles in `h`/`t`, with no colour and so no information.
- **A scan beam** (`a` line + `u` ghost + caret) walks the rounds at 2 px/tick, behind the tiles. As it passes, each provider tile **flips over** to show what it really was, then flips back.
- **Test rounds pass:** the revealed T turns into a white check.
- **Compute rounds feed ΔE:** one blue term drips from the revealed C, accelerates along a hairline channel (row 36/37), climbs into the **ΔE meter** and raises it 3 px with an azure splash.
- **Verdict:** a ripple of checks runs across the schedule's five T tiles, then the meter's lamp lights violet with a check. The meter then drains and the beam blinks at the left edge, ready for the next sweep.
- **Cheater (every 4th loop):** the hidden test at round 6 **cracks**. A hairline crack appears, the tile splits apart over an alert core, and it becomes an alert `F`/`R` tile with a bold ×, throwing three violet shards. The beam freezes in raspberry on that column, the meter is voided (alert outline, empties at 6 px/tick) and its lamp blinks ×. The remaining rounds stay unrevealed. Everything then dithers back to rest.

Palette discipline: **violet = test, blue = compute, neutral = provider view, raspberry = fail only.** `R`/`F` appear in no clean frame (verified: 0 of 288 clean frames contain an alert key).

## Geometry
- Tiles are 8×8 at x = 2 + 9i, i = 0..11. Each is a 7×7 face lit from the upper left, with a 1-px drop shade on the right and bottom. All four outer corners are open, which gives the rounded silhouette of the deck's blocks.
- Glyphs are 3×5, centred at (+2, +1). `T` comes from `font3x5`. `C` and `?` are rounded 3×5 bitmaps with open corners. The check is a 5×4 bitmap (the font's 3×5 ✓ reads as a "J" at 1×).
- Meter: an open-cornered `l` tube at x 116–122, rows 4–31. The lamp window is rows 5–8, the divider is row 9, and the fill well is rows 10–30. That is exactly 21 px = 7 compute rounds × 3 px, so "full" is unambiguous. A `c` glass highlight runs on the lit (left) side.
- The channel is an `h` hairline: row 37 from x 5 to 119, rising at x 120 to the meter's foot. Packets ride row 36.

## Timeline as built (ticks within a loop; global tick = loop·96 + t)

Per round i the flip starts at `flipAt(i) = ⌊(3+9i)/2⌋`, when the beam enters the tile. Within a round:
- the `?` narrows to 4 px (1 tick), shows a 2-px sliver of the true colours (1 tick), and is then revealed for 6 ticks;
- it then narrows to 4 px (1 tick), shows a 2-px `?` sliver (1 tick), and is back to `?`.

| round | kind | flip | revealed | back | check / lands in meter |
|---|---|---|---|---|---|
| 0 | T | 1 | 3–8 | 9–10 | check 4–6 |
| 1 | C | 6 | 8–13 | 14–15 | lands 26 |
| 2 | C | 10 | 12–17 | 18–19 | lands 29 |
| 3 | T | 15 | 17–22 | 23–24 | check 18–20 |
| 4 | C | 19 | 21–26 | 27–28 | lands 36 |
| 5 | C | 24 | 26–31 | 32–33 | lands 40 |
| 6 | T | 28 | 30–35 | 36–37 | check 31–33 (cheater: cracks instead) |
| 7 | C | 33 | 35–40 | 41–42 | lands 46 |
| 8 | T | 37 | 39–44 | 45–46 | check 40–42 |
| 9 | C | 42 | 44–49 | 50–51 | lands 53 |
| 10 | C | 46 | 48–53 | 54–55 | lands 56 |
| 11 | T | 51 | 53–58 | 59–60 | check 54–56 |

**Clean loop (loops 0–2)**
- 0–63: the sweep. The beam is at x = 2t+1. Tiles the beam passes in the schedule row get a 2-tick rim light (`r` on T, `w` on C). A compute term hangs on its tile for one tick at reveal, then moves at speeds 1, 2, 3 … 8 px/tick with a `b c a a u u` tail. The meter steps 3 → 21 px at ticks 26, 29, 36, 40, 46, 53, 56.
- 64–87: `accepted` hold. 64–71: a check ripple over the schedule's T tiles (1-tick stagger, 4 ticks each). 70–87: the lamp lit violet with a white check (18 ticks). A 2-px `u` shimmer crosses the meter's surface every 12 ticks.
- 88–95: `idle`. The meter drains 3 px/tick (88–94). The beam blinks at x 1 (on 88–89, off 90–91, on 92–95), so tick 95 hands over seamlessly to tick 0.

**Cheater loop (loop 3, global 288–383)**
- 0–30: identical to a clean sweep (round 6's T is revealed at 30).
- 31: crack frame 1, a 1-px `F` hairline from the face's top right to bottom left. The beam freezes at x 61 in `R`. In-flight terms vanish. The meter outline turns `R`.
- 32: crack frame 2, the shatter. The two halves jump 1 px apart diagonally over an `F` core, with an `R` seam. The meter empties at 6 px/tick (6 px → 0).
- 33–68: `rejected` hold. The tile is `F` face, `R` shade, 5×5 `R` ×. Three 2×2 shards arc out under gravity and leave by about 40. The lamp blinks `R`/×, lit 8 ticks and dim 4 (1 Hz, 20×16 CSS px, never white).
- 69–72: 4-step ordered-dither reset to rest.
- 73–87: rest. 88–95: the same standby blink as a clean loop, so 383 → 0 is seamless.

## Deviations from the card (deliberate, and why)
1. **T tiles are violet `v`, not blue `b`, and C tiles are blue-on-mist instead of paper.** The lead's brief requires "blue = compute, violet = test" (research 03 §6.9 also uses T = `v`, C = `b`). This makes the ΔE meter, the drips and the C tiles one blue family, and every test element violet. As a result the palette is `v n r w u c b a h t l p R F` (14) instead of the card's 13, with no `k`/`g`. The deck's T/C *sequence* is unchanged.
2. **The meter fills in 7 steps, not 8.** The deck sequence has 7 C rounds and 5 T rounds; the card's "8 C blocks → 24 px" is a miscount. The well is sized to 21 px so 7 × 3 px reads as exactly full.
3. **The check is a 5×4 white bitmap**, not the font's 3×5 ✓ in `a`. In round 2 the 3×5 ✓ read as "J", and `a` on violet was too faint (see `rounds/r2-check-colours-a-g-w.png`).
4. **The rejected state lasts 42 ticks (crack → end of reset), with a 36-tick hold**, not 12 and 24. Research 03 §2.1 requires verdicts to hold ≥ 18 ticks, and the section's `REJECTED` stamp needs time to be read. With a 24-tick hold the loop would sit dead for about 3 s after the reset.
5. **A verdict lamp at the top of the meter** (rows 5–8) and an `h` channel hairline were added. The canvas still has no text, so ΔE stays HTML under the meter as the card says.

## Validator
`npm run validate -- tc-rounds` gives 0 errors, 14 colours, an exact loop (`frame(384) == frame(0)`) and 0.04 ms/frame. **One warning:** "poster has 34 orphan pixels". These are the `?` glyph's dot and its 1-px diagonal stroke on the twelve provider tiles, which are deliberate glyph strokes. Using the engine font's square `?`/`C` instead swaps this for an L-corner "doubles" warning (36), so one heuristic fires either way.

## Critique rounds (sheets in `qa/art-tc-rounds/rounds/`)
- **R1** (`r1-poster-36-43.png`, `r1-cheater-312-335.png`, `r1-hold-56-95.png`):
  - The 3×5 ✓ reads as "J".
  - 1-px shards look like dirt.
  - There is no shatter frame (crack jumps straight to ×).
  - The stem under the meter plus the divider make it read as a *syringe*.
  - The `g` rim on C tiles is invisible.
  - Fixed: a 5×4 check, 2×2 shards, a split-apart shatter frame, the stem removed, a channel hairline added so terms visibly flow into ΔE, and a `w` rim.
- **R2** (`r2-keyframes.png`, `r2-check-colours-a-g-w.png`, `r2-ink.png`):
  - The check in `a` is faint on violet. Compared `a`/`g`/`w` at true size and chose `w`.
  - The lamp check is cramped edge to edge; changed to a 3×3 check.
  - Bug: the schedule row kept rim-lighting tiles after the beam froze in the cheater loop.
  - 15 colours; the `g` ghost merged into `u`.
- **R3** (`r3-hold-60-95.png`, `r3-cheater-tail-336-383.png`, `r3-true-size.png`):
  - The check ripple with a 2-tick stagger delayed the lamp to only 12 ticks; changed to a 1-tick stagger with the lamp at 70 (18 ticks).
  - The rejected hold was 3 s of static red; added the 1 Hz alarm-lamp blink.
- **R4** (`r4-square-vs-rounded.png`, `r4-font-vs-rounded-glyphs.png`):
  - Square tiles feel harsh next to the deck's rounded blocks; opened all four outer corners and matched the flip frames.
  - The font's square `C`/`?` replaced with rounded bitmaps (consistent stroke language; the check, C and ? all have open corners).
  - Palette trimmed to 14.

## Evidence (all inspected)
- Contact sheets: `qa/sheets/tc-rounds.png`, `qa/sheets/tc-rounds-ink.png` (`npm run sheet`).
- Live captures from `BP_ONLY=tc-rounds npx vite build --outDir .qa/art-tc-rounds`, `frames.mjs --interval 83 --zoom 4`:
  - `qa/art-tc-rounds/live-clean/` (72 frames: sweep, poster, hold)
  - `live-cheater/` (72 frames: crack → shatter → hold → dither reset → standby → next sweep)
  - `live-ink/` (24 frames, `bg=ink`)
  - `live-reduced-motion/` (`rm=1`: 6 frames over 6 s, md5-identical, poster tick 40)
- `timeline-match.txt` in each live folder: every captured frame was matched pixel-for-pixel against `frame(tick)` for all 384 ticks. **168/168 frames match an authored tick exactly**, and successive frames advance 1–2 ticks (the capture tool's screenshot overhead makes it sample about every 1.4 ticks).
- `qa/art-tc-rounds/final-keyframes.png`: poster (40), hairline crack (319), × tile + shards (321), dimmed alarm lamp (331), dither reset (357), accepted hold on ink (live screenshots).
- `qa/art-tc-rounds/harness-paper-1440-step-00.png`: harness at 1440, console-clean.

## Acceptance
| Check | Result |
|---|---|
| 1. validate: palette-only, ≤ maxColours, exact loop, poster in loop | **pass** (0 errors; orphan heuristic warning explained above) |
| 2. reads at 1× and 4×, on paper and ink | **pass** (128×40 1-px strip in the sheet; `live-ink`) |
| 3. light upper left, no pillow shading or banding, no stray orphans | **pass** (orphans are glyph strokes only) |
| 4. loop seam invisible | **pass** (95 → 0 and 383 → 0 both go through the standby beam; verified live) |
| 5. live frames match the timeline ±1 tick | **pass** against the timeline above (168/168 exact). Differs from the card text where listed under Deviations |
| 6. poster meaningful | **pass**: tick 40 shows the beam mid-sweep, a revealed T with its check, a revealed C, a term landing and the meter at 12/21 |
| 7. white flashes ≤ 1 tick, ≤ 3/s | **pass** (no white flash frames; white is only glyphs and a 2-tick tile rim) |
| card: sequence matches the deck exactly | **pass** (`SEQUENCE = 'TCCTCCTCTCCT'`) |
| card: bottom row only `?` except during a flip | **pass** (scripted check: provider tiles equal the `?` tile outside flip windows; only the beam or shards show through the tiles' corner gaps) |
| card: meter fills in 8 steps on clean loops | **deviation**: 7 steps (the deck has 7 C rounds) |
| card: meter empties on the cheater loop | **pass** (6 px/tick, then the tube stays voided in alert) |
| card: `R` only in the cheater loop | **pass** (0/288 clean frames contain `R` or `F`) |

## For the section (sections-3, `#verify-rounds`)
- HTML labels: `VERIFIER'S SECRET SCHEDULE` beside rows 4–11 (CSS y 16–48), `WHAT THE PROVIDER SEES` beside rows 24–31 (CSS y 96–128). Read them from `tcRounds.exports.rows`.
- `ΔE` label centred under the meter (canvas CSS x 464–492).
- The `REJECTED` stamp follows `state() === 'rejected'` (42 ticks). `accepted` (24 ticks) can drive an optional `ACCEPTED` stamp in violet/indigo on light. The `accept` and `reject` events fire once each.
- So the page matches the art, colour the "Test round" mini-card title violet (`--ramp-5`) and "Compute round" blue (`--blue`).

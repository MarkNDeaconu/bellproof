# `fridge-hero` · the dilution-refrigerator chandelier (art-spec card 1, revision 1 F1–F3)

Owner: `art-fridge-hero` (Opus, revision 1; the attempt-01 piece was built by Fable). Files: `index.ts` (the piece), `geometry.ts` (constant tables, ASCII parts, paths, intro timeline).
56×128 art px → 224×512 CSS px (unchanged). `ticksPerFrame 1`, `loopTicks 144`, poster **tick 26** (was 30), `cache 'none'`.
**16 colours** of the card's 17 keys (`k n s m t l e w v i b c a u g r`; `h` unused). No gold, orange or yellow. `npm run validate -- fridge-hero`: 0 errors, 0 warnings, 0.014 ms/frame in Node.

## What changed in revision 1

| Task | Change |
|---|---|
| **F1** (P0) vanish | `intro` is compared with the **absolute** local tick (engine E9): `t = tick − intro` never wraps, so the intro plays once. `-2` = armed (hidden), `-1` = static idle (manual inputs), `≥ 0` = the local tick the intro starts at. 60 s live capture: opaque pixels never reach 0; idle frames 0, 144 and 1296 are pixel-identical. |
| **F2** (P1) richness | Redrawn per qa-pixel #4: elliptical stepped plates with 2-row undersides (`m → s`, `n` under the cold plate and MXC); a pulse-tube cold head (tube, flange, woven braids) on 50 K and 4 K; HEMT with an LED; three stacked circulators; heat-exchanger coil; TWPA box; mu-metal shield ring around the chip; 2-px semi-rigid coax above 4 K, 1-px lines below; a DC wiring loom; azure rim light on every plate's right end and the chip's lower right; `u` frost on the three coldest faces; a dithered `r` glow on the chip face; `i` reflections on the cold finger, the shield and the MXC underside; pulses `a c b b`; a readout that climbs the output line; 2×2 Xmon crosses with `l` pads and a `w` specular; 5 frost sparkles per loop (2 on the shield). |
| **F3** (P2) cost | The static base is drawn once per cooling state (`cooled` 0..5, memoised constant data) and copied each tick (shifted by `lift`), then the moving parts are overlaid. Per tick in Chromium: `frame()` **0.002 ms**, full mount draw (frame + putImageData + blit) **0.096 ms** (budget 0.3). |

**API for sections-1: no breaking change.** The canvas size, `labelRows = [22, 40, 58, 74, 88]`, `plateLeft = [6, 9, 12, 15, 18]`, `bitX = 28`, `bitPeriod 48`, `bitExitTick 10`, the inputs and every event name are unchanged. One addition: `exports.readoutTravel` (27). `exports.travel` is now 6 entries of 28 (index 0 is the output line, which carries the readout instead). Arm with `data-io-intro="-2"` and `set('intro', m.localTick)` **without `+ 1`** (revision-1 §1.1 item 6). `+ 1` still works: it only adds one hidden tick.

## Evidence (all in `attempt-02/qa/art-fridge-hero/`)

| What | Path |
|---|---|
| Node contact sheets, paper / ink (copies of `qa/sheets/fridge-hero{,-ink}.png`) | `sheet-paper.png`, `sheet-ink.png` |
| True 1× strip from the sheet, paper / ink, plus a 3× nearest view of the paper strip | `strip-1x-paper.png`, `strip-1x-ink.png`, `strip-1x-paper-view3x.png` |
| Hero-weight check: the attempt-01 QA capture `montage/hero-1440-t5s.png` with the old fridge erased and the new one composited at its exact canvas position (x 1008, y 48, U = 4) | `hero-1440-montage.png` (before: `../attempt-01/qa/qa-pixel/montage/hero-1440-t5s.png`) |
| 60 s vanish check (harness, armed `-2` then `intro = localTick`, no scrolling) | `vanish/timeline.txt`, `vanish/after-60s.png`, summary in `live.json` → `vanish` |
| Exact-tick intro in Chromium (`intro=0&tick=N`, zoom 2) and the strip | `intro-exact/tick-NN.png`, `intro-exact-strip.png`, `intro-exact-strip-small.png` |
| Live idle at zoom 2, 48 frames at 83 ms, paper / ink (contact sheet + gif) | `live-idle-paper/`, `live-idle-ink/` |
| Live scripted intro (`intro=36`: armed 3 s, then the intro), 48 frames: hidden → lowering → five rim flashes → white die → glow, once | `live-intro/` |
| Reduced motion (`rm=1`): 6 shots over 3 s, identical; poster, idle | `reduced/`, `live.json` → `reduced` |
| Per-tick cost and seam check in Chromium | `live.json` → `cost`, `seam` |
| Manual inputs (`cool=0`, `cool=3`, `lift=40`) | `manual-states.png` |
| Critique-round renders (zoomed crops, both backgrounds); before / after posters at 4× + 1× | `wip-r1*.png` … `wip-r7-chip.png`, `glint.png`, `before-poster.png` (attempt-01 art), `after-poster.png`, side by side `before-after.png` |
| Validator output | `validate.txt` |
| Tools (own): Node renderer, montage, PNG export, live Playwright checks | `render.ts`, `montage.ts`, `fridge-png.ts`, `live.mjs` |

Build used for capture: `BP_ONLY=fridge-hero npx vite build --outDir .qa/art-fridge-hero`. `node qa/art-fridge-hero/live.mjs --secs 60` re-runs the vanish, cost, seam, exact-intro and reduced-motion checks (`--only ABCE` picks a subset).
The real page hero could not be captured: sections-1 is mid-rework (`.qa/art-fridge-hero-page` showed a broken hero on 2026-10-12: `page-hero-1440-mid-rework.png`), so the weight check uses the composited montage.

## Input / state API (for `sections/top.ts`)

```ts
inputs: {
  intro:  number  = -1    // -1 static idle · -2 armed (fully hidden) · ≥ 0 = the ABSOLUTE local tick at which the intro starts
  lift:   number  = 0     // manual: fridge raised by N art px (clipped at the top, the cable shortens); only when intro = -1
  cool:   number  = 5     // manual: stages cooled 0..5 (dull rims, no rim light or frost, unlit beads); only when intro = -1
  ignite: boolean = true  // manual: chip lit, pulses and readout running; only when intro = -1
}
state(): 'armed' | 'lowering' | 'cooling' | 'idle'
events: 'lowered' · 'cool', 'cool-1' … 'cool-5' · 'ignite' · 'bit' · 'bit-exit'
exports: { labelRows, plateLeft, intro: INTRO, bitPeriod: 48, bitExitTick: 10, bitX: 28, travel: [28 ×6], readoutTravel: 27 }
```

```ts
const m = mountedOf(el)!;                       // markup: data-io-intro="-2" (first paint hidden)
if (motion.reduced) m.set('intro', -1);         // poster: idle, chip lit, pulses in flight
else m.set('intro', m.localTick);               // the intro starts on this tick and plays once
m.on('cool-1' … 'cool-5', …); m.on('ignite', …); m.on('bit-exit', …);
```

**Timeline as built**, in ticks after `intro` (t). Verified live: events `lowered` 10, `cool-1..5` 12–16, `ignite` 18, each exactly once in 60 s.
- **0** nothing in view (lift 112). **1–10** lowering, lifts `84 61 42 28 18 10 5 2 1 0` (power3Out spacing): the chip and shield appear first, the plates follow, and the cable grows from the cell's top line. **10** `lowered`.
- **12 13 14 15 16** stage k cools (`cool-k`): its rim goes azure `a` with a `c` underside for exactly 1 tick, then it gains its detailed rim, the azure rim light on its right end, mist frost (stages 3–5) and lit attenuator beads.
- **18** `ignite`: the die window is white for 1 tick, then the glow starts. Drive pulses launch (pulse time pt = t − 18).
- **66** (pt 48) the first bit drops and the first readout climbs, then every 48 ticks (`bit` / `bit-exit` 10 ticks later).
- Reduced motion at runtime: set `intro = -1` (the mount seeks the poster).

## Anatomy as built (art px; light from the upper left; x centre 27.5)

| Element | Where | Notes |
|---|---|---|
| Cable | x 28, rows 0–3 (`m`) | lengthens from the top line during the lowering |
| Plates (6 rows each) | 300 K y 4 w 48 · 50 K y 20 w 44 · 4 K y 38 w 38 · still y 56 w 32 · cold plate y 72 w 26 · MXC y 86 w 20 | r0 back edge `l→t` (inset 2) · r1 face `e`, `u` frost on still/CP/MXC (inset 1) · r2 full width: broken `w` gleam, `e`, `u`, `l`, `a` tip (**label row**) · r3 rim `l t m` with a `c` band and `a` tip at the right · r4 underside `m→s` with a `c` pair (inset 2) · r5 deep underside `s`, `n` under the CP, `n`/`i` under the MXC (inset 5) |
| Truss rods | 1-px `m`, inset 1 from the lower plate (0 at the MXC) | |
| Coax | j 0..5; 2-px `l t` semi-rigid in seg 0–1 (x 17 20 23 \| 31 34 37), 1-px `t` below, converging to 20 22 24 \| 31 33 35 above the MXC | j 0 = **output line** (readout up), j 1–5 drive lines (pulses down); 6-px central bay x 25–30 |
| Pulse-tube cold head | right of the curtain: 5-wide tube x 41–45 rows 10–15, 7-wide flange rows 16–17, woven braid band rows 18–19; stage 2: 3-wide tube x 42–44 rows 26–32, flange 33–34, braids 35–37 | ASCII parts `PT_HEAD`, `PT_STAGE2` |
| DC loom | 2-px `t m` checker (twisted pairs): x 12–13 (seg 0–1), x 15–16 (seg 2) | balances the pulse tube on the lit side |
| HEMT | x 11–16 rows 33–37 on the 4 K plate, strapped to the output line; LED at (12, 35) | LED `a`, flickers `g` while the readout passes, `c` before ignition |
| Attenuators | 4 K: 3×2 zigzag on lines 1–4 (rows 45/47) + 4×2 on line 5; still: 2×2 on lines 4–5 | lit `e` top / `t` body / `s` edge after their stage cools |
| Expansion loops | oval rings (3×5) on line 1 (rows 50–54) and line 5 (rows 49–53) | never mirrored (paired rings read as eyes) |
| Circulators | 3 stacked `lel / tms` discs on the output line, x 18–20 rows 63–70 | the disc at the readout's head lights `a` |
| Heat-exchanger coil | central bay x 26–29, rows 62–71, 2-px zigzag (`l t` front, `t m` back) | |
| TWPA | central bay x 26–29, rows 79–84 | silver box with a `c b` junction window |
| Cold finger | x 26–29 rows 92–93, `l t t s` | `i` reflection on its shadow side when lit |
| Mu-metal shield | 1-px U ring: walls x 18 / 37 rows 89–108, bottom row 110 with a port at x 27–28 | `l t` lit wall, `s` wall with `c` rim light, `r` / `i` glow reflections beside the die |
| Chip package | x 20–35, rows 94–108: `s` outline (rounded), 2-px face (`w` specular top-left, `c a` rim light lower-right), die window x 23–32 rows 97–105 (`k`) | four `l` corner pads; Xmon crosses at (25, 99) (30, 99) (25, 103) (30, 103) |
| Fall space | rows 111–127 | the bit falls from (28, 109) through the port |

## Idle loop as built (144 ticks)

- **Drive pulses** (`a c b b`, head first, 2 px/tick, 2 px wide on the semi-rigid runs and the finger): lines 1, 5, 2, 4, 3 launch at 0, 9, 18, 27, 36 within every 48 (alternating sides). Travel 28 ticks: down 5 segments with a 1-tick hold above every plate (the plate's rim lights `a`/`c` under the head: thermal anchoring), through the MXC and down the finger. On arrival the line's qubit flashes (`r` arms, `w` centre) for 1 tick: line 1 → TL, 2 → BL, 3 → TR, 4 → BR, 5 → TR. 28 < 48, so pulses never overlap on a line.
- **Readout**: on every bit tick (d = 0) a pulse climbs the output line from above the MXC to the flange in 27 ticks, holding under each plate (the underside lights), lighting the circulator disc it passes and flickering the HEMT LED.
- **Chip glow**: the inner face ring breathes `v → i → r → i` at 6 fps (8-tick cycle); the outer face ring is a fixed `r/u` checker (top/left) and `i` (bottom/right); crosses TL+BR and TR+BL swap lit (`i` arms, `r` centre) and resting (`v` arms, `i` centre) every 6 ticks.
- **Glint**: ticks 0–11 of every 72, plate p at 2p and 2p + 1: the second white run on r2 slides right (24 % → 42 % → 62 %).
- **Frost**: 5 sparkles per loop (`rng(loop + 1)`), life 6 ticks `w g g a a a`: 3 on the cold plate / MXC metal (never the lit faces or the bay between them), 2 on the shield ring; none alive at t = 0, so frame 144 == frame 0.
- **Bit**: ticks 0, 48, 96: an `a` pixel with a `c` tail (was `g`, invisible on paper) from (28, 109), 2 px/tick, out of the canvas after row 127 (`bit-exit` at d = 10).

## Deviations from the card and from qa-pixel #4 (and why)

- **Pulse-tube head**: a straight 5-wide tube + 7-wide flange + woven braid band instead of a 6×4 cylinder with two free braids. Two braids under a round body read as legs (a little robot, round 1; a goblet, round 4); the flange-and-braid band is also how a real PT cold stage is clamped to its plate.
- **Output line on the left (j 0)** so the HEMT and circulators sit on the lit side and the pulse tube balances them on the right. The readout climbing it is new (a qualifying amplifier chain should carry signal *up*; research 03 rule 11).
- **TWPA in the central bay** above the MXC rather than inline on the output line: there is no room for an inline box at 2-px line pitch; physically a TWPA sits on the MXC plate.
- **Dithered glow**: on the chip face's outer ring as an `r/u` checker (top/left) with solid `i` (bottom/right). A dither spilled onto the can interior read as marquee bulbs (rounds 1–2).
- **Mu-metal can**: a 1-px U ring with a port for the bit (rows 89–110), not a solid cutaway: 2-px walls with a dark interior read as a cabinet (round 1).
- **Bit tail `c`** instead of `g` (paper visibility). **Poster 26** instead of 30: 13 pulse pixels in flight, the readout near the flange, the halo at `i` (the `r` phase washes the chip out on paper).
- **Hairpins** are oval rings (3×5) like attempt-01's, on lines 1 and 5 at different heights; sideways U-bends read as scribbles (round 1).

## Critique rounds (revision 1)

Every round: `npm run validate -- fridge-hero`, Node renders of the poster at 6× on paper and ink, zoomed crops at 9–12×, and (from round 4) `npm run sheet -- fridge-hero` on paper and `--bg ink`, opened and read.

**Round 1** (`wip-r1*.png`). First full redraw (6-row elliptical plates, all F2 parts, can as a 2-px cutaway). Harsh read: the pulse-tube head is a round body on two thin braids, a little robot; the sideways U-bend hairpins are scribbles; staggered beads look random; the can's 2-px walls, dark interior and a dotted lilac spill column make a cheap dashed frame; on paper the plates' back edges (`e`) vanish into the paper, so each plate reads as a white slab; 2-px rods inset 1 frame every stage like a cabinet; the TWPA is a dark slab like a phone. Fixes: output line moved to the left (HEMT, circulators on the lit side), pulse tube to the right; rings instead of U-bends; beads in a regular zigzag; the can became a 1-px U ring with a port; package 16 wide with a 2-px face; r0 back edge `l → t` for a silhouette on paper.

**Round 2** (`wip-r2*.png`). The ring can and the 2×2 crosses read at once. Problems: the two inner rings under the flange sit at the same height and read as a pair of eyes; the plate rim light is 4 px of blue stacked down the right end, a drip; the top half is still evenly spaced bars; the face dither reads as vanity-mirror bulbs. Fixes: 2-px semi-rigid coax above 4 K and 1-px superconducting lines below (a curtain that thins with temperature); all rods 1 px; rings moved under 4 K at different x and heights; rim light reduced; softer dither pairing.

**Round 3** (`wip-r3*.png`, first sheet, true-1× strip). Thick cables read as two bundles of three. The braids, now checker straps, still read as legs; the 4 K rings still face-like when mirrored; `validate` warned 145 orphans (shadow pixels at the top of every line, the loom's shaded checker, the dithered face). Fixes: rings on lines 1 and 5 only; braids as a woven band; line-top shadow pixels removed; loom as a `t/m` checker; the face's outer ring as an `r/u` checker plus solid `i`; beads `e…e s / t…t s`: validator clean (0 warnings). Added the DC loom on the lit left to balance the pulse tube.

**Round 4** (`wip-r4*.png`, `wip-r4-motion.png`, hero montage). Pulses at 1× on paper are visible but thin; the `n → r` halo swing makes the chip flash dark/pale; in the hero montage the fridge is richer than anything else but still mostly grey beside the saturated rails. Fixes: trail lengthened to `a c b b`; halo range `v i r i`; a `c` rim-light band along the right end of every lit rim plus an `a` tip; `u` frost extended to r2 of the three coldest plates; violet spill on the MXC underside.

**Round 5** (`wip-r5*.png`, intro strip). The pulse-tube read as a goblet (canister on a neck over a checker foot). Fix: a straight tube, a 7-wide flange and a braid band (`wip-r6-pt.png`), now unmistakably a cryocooler stage. Intro checked tick by tick: chip and shield lead the descent, five rim flashes top to bottom, a 1-tick white die, glow.

**Round 6** (`wip-r6*.png`, sheets on paper and ink, live captures, `strip-1x-paper-view3x.png`). Poster chosen by counting pulse pixels per tick (26: 13 px, readout near the flange, halo at `i`). The glint redraw overwrote the mist frost on cold plates for a tick: fixed with a shared `frontRow()`. Live Chromium frames at DPR 1 contain only palette colours plus the background (16 distinct values in `live-idle-paper/frame-020.png`: integer scaling, no smoothing).

**Round 7** (`wip-r7-chip.png`, `hero-1440-montage.png`). The shield looked detached from the glow: `r` / `i` reflections added on its walls beside the die. Accepted. Remaining nits I would still take further with more time: the 4 K attenuator zigzag is busy at 1×; on ink the `b b` tail is quieter than the `a c` head (inverse on paper), which is inherent to a palette that must read on both.

### Attempt-01 history (Fable)
Four rounds on the original 5-row slab design: flange flash guard, `t m` upper rods, face-like inner beads removed, chip widened to 9 px with four single qubits, 4 K stage re-spaced, 1×/2× silhouette and reduced motion verified. QA then found the wrapped-tick vanish (qa-pixel #1) and the lack of richness (#4) that revision 1 addresses.

## Acceptance

| # | Criterion | Result |
|---|---|---|
| F1 | 60 s capture, opaque pixels never 0; idle frames 0 and 144 identical | **pass**: 236 samples over ticks 42–761 (5 loops), min 6 752 device px from the first lowering tick (only the chip in view), 36 256–36 288 once settled, state `idle` throughout; intro events once; `seek(0)` vs `seek(144)` and `seek(1296)`: 0 differing bytes (`live.json`) |
| F2 | ≥ 14 colours | **pass**: 16 (validator; live frame 16 incl. paper) |
| F2 | pulses visible in the 1× strip on paper | **pass**: blue `a c b b` dashes in every frame of `strip-1x-paper.png` (2 px wide above 4 K) |
| F2 | the fridge outweighs the rail blocks in a hero capture | **pass on detail and contrast, honest caveat on mass**: in `hero-1440-montage.png` the fridge is the densest, highest-contrast figure (violet die in a dark ring, blue rim light, pulses); the rail blocks remain larger flat colour fields. Re-judge in the real revision-1 hero (rails without the diamond) once sections-1 lands. |
| F3 | static base cached per intro state; ≤ 0.3 ms per tick | **pass**: base per `cooled` 0..5; 0.002 ms frame / 0.096 ms full draw in Chromium |
| C1 | validate: palette-only, ≤ 17 colours, exact loop, poster in loop, decay check at `t + 7·period` | **pass** (0 errors, 0 warnings) |
| C2 | reads at 1× and 4×, paper and ink | **pass** (sheets, strips) |
| C3 | light upper left, no pillow shading or banding, no stray orphans | **pass** (validator orphan scan under threshold; plate splits step diagonally 30 / 45 / 62 / 68 / 72 %) |
| C4 | seam invisible | **pass** (frame 144 == frame 0) |
| C5 | live frames match the timeline | **pass** via exact-tick captures (`intro-exact/`) and the event log |
| C6 | poster meaningful | **pass** (tick 26: 4 drive pulses + readout in flight, chip lit) |
| C7 | white flashes ≤ 1 tick, ≤ 3/s | **pass** (ignite 1 tick; qubit flashes are 1-px centres; frost sparkles 1 tick) |
| card | silhouette = stacked discs narrowing downward, box at the bottom; no plate wider than the one above; six lines at 1×; label rows | **pass** |

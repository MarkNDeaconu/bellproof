# `fridge-hero` · the dilution-refrigerator chandelier (art-spec card 1)

Agent: `art-fridge-hero` (fable). Files: `index.ts` (the piece), `geometry.ts` (constant tables, paths, intro timeline).
56×128 art px → 224×512 CSS px. `ticksPerFrame 1`, `loopTicks 144`, poster **tick 30**, `cache 'none'` (the piece reads inputs; a frame costs ≈ 0.06 ms in Node). 14 colours used of the card's 17 allowed keys; no gold, orange or yellow anywhere.

## Sheets and evidence

| What | Path |
|---|---|
| Node contact sheet, paper | `qa/sheets/fridge-hero.png` |
| Node contact sheet, ink | `qa/sheets/fridge-hero-ink.png` |
| Harness sheet (`?sheet=1`), paper / ink | `qa/art-fridge-hero/harness-sheet/frame-000.png`, `qa/art-fridge-hero/harness-sheet-ink/frame-000.png` |
| Live idle, 96 frames at zoom 2 on ink (contact sheet + gif) | `qa/art-fridge-hero/live-idle-ink/` |
| Live idle, 48 frames at zoom 2 on paper | `qa/art-fridge-hero/live-idle-paper/` |
| Live scripted intro (`intro=60`), 72 frames on paper | `qa/art-fridge-hero/live-intro/` |
| Exact-tick intro captures (`intro=0&tick=N`, N = 0..20, 24) | `qa/art-fridge-hero/intro-exact/tick-NN.png`, strip `qa/art-fridge-hero/intro-exact-strip.png` |
| Poster at zoom 4, paper / ink | `qa/art-fridge-hero/poster-paper-4x/frame-000.png`, `qa/art-fridge-hero/poster-ink-4x/frame-000.png` |
| Reduced motion (`rm=1`), 6 frames over 5 s (pixel-identical) | `qa/art-fridge-hero/live-reduced/` |
| DPR-1 edge crops of a live frame | `qa/art-fridge-hero/live-idle-crop-chip.png`, `live-idle-crop-top.png` |

Build used for capture: `BP_ONLY=fridge-hero npx vite build --outDir .qa/art-fridge-hero`.
Note on `frames.mjs`: a screenshot costs ≈ 40–50 ms, so `--interval 83` samples about 1.5 ticks per frame; use the exact-tick captures (or the Node sheets) when checking timings to the tick.

## Input / state API (for `sections/top.ts`)

```ts
inputs: {
  intro:  number  = -1    // -1 idle · -2 armed (fully hidden) · ≥ 0 = the LOCAL tick at which the scripted intro starts
  lift:   number  = 0     // manual: fridge raised by N art px (clipped at the canvas top, cable shortens); ignored when intro ≠ -1
  cool:   number  = 5     // manual: stages cooled 0..5 (rims dull, beads unlit, window dark below 5); ignored when intro ≠ -1
  ignite: boolean = true  // manual: chip lit and pulses running; ignored when intro ≠ -1
}
state(): 'armed' | 'lowering' | 'cooling' | 'idle'
events: 'lowered' · 'cool', 'cool-1' … 'cool-5' · 'ignite' · 'bit' · 'bit-exit'
exports: { labelRows: [22, 40, 58, 74, 88], plateLeft: [6, 9, 12, 15, 18], intro: INTRO, bitPeriod: 48, bitExitTick: 10, bitX: 28, travel: [36 ×6] }
```

**Scripted intro (recommended).** The piece runs the whole §5.1 fridge intro itself from one tick, so the pixels and the HTML stay in lockstep via events:

```html
<span class="px" data-piece="fridge-hero" data-io-intro="-2" style="--w:56;--h:128"></span>
```
```ts
const m = mountedOf(el)!;                       // mountAll() has drawn the poster; -2 keeps the first paint hidden
if (motion.reduced) m.set('intro', -1);         // reduced motion: poster (idle, pulses mid-cable, chip lit), never plays
else m.set('intro', m.localTick + 1);           // call ≈ 100 ms after load; t below is ticks after that
m.on('cool-1' … 'cool-5', …)                    // reveal label k and tick the 300 K → 10 mK readout on these ticks
m.on('ignite', …)                               // 1 tick white window, then glow; the first pulse starts down the coax
m.on('bit', …); m.on('bit-exit', …)             // a bit leaves the chip (28, 109) / leaves the canvas 10 ticks later → floor spark
```
Timeline in ticks after `intro` (t): **0** hidden (lift 112) · **1–10** lowering with lifts `84 61 42 28 18 10 5 2 1 0` (power3Out spacing, ≈ 0.9 s; the cable lengthens from the cell's top line as the flange descends) · **12 13 14 15 16** stage 1…5 cools: azure `a` rim + `c` underside for exactly 1 tick, then the rim gains its `l|t|m` detail and that stage's attenuator beads light (`cool-k` events) · **18** ignite: window `w` for 1 tick (`ignite` event), then violet glow, pulses launch from the top (line k at t = 18 + 7k), frost begins · **18 + 48n** bits: the first bit drops at t = 66 (after the first pulses arrive), then every 48 ticks. Reduced motion at runtime: the section should `set('intro', -1)` when `motion.reduced` flips on (the mount seeks the poster; with an old `intro` tick the poster would be hidden).

**Manual route (alternative).** Leave `intro = -1` and drive `lift` (quantised px/4 from a 60 fps tween: `m.set('lift', n); m.seek(m.localTick)` to repaint between ticks), `cool` 0→5 and `ignite`. Manual mode has no 1-tick flashes (a pure `frame(tick, io)` cannot know when an input changed); `cool = 5, ignite = true` is pixel-identical to the idle loop.

## Idle loop as built (144 ticks)

- **Pulses** (`w g a c`, head first, 2 px/tick): line k launches at `(7k) mod 48`, repeating every 48 (launch order L0 R0 L2 R2 L1 R1 alternates sides). Travel is 36 ticks: 5 segments, a 1-tick hold above every plate (the plate rim at that x lights `a`/`c` for the hold tick: thermal anchoring), through the MXC and down the cold finger 2 px wide, then into the chip: the mapped qubit blinks `w` and the connector nub on that side flashes `a` for 1 tick. 36 < 48, so pulses never overlap on a line.
- **Chip glow**: halo ring `n → i → r → i` at 6 fps (8-tick cycle; the card's 10-tick `n i r i n` does not divide 144). Qubits `v i v i` ↔ `i v i v` every 6 ticks.
- **Glint**: every 72 ticks, plate p (0 = flange … 5 = MXC) at ticks 2p, 2p+1: the gleam row's white run sweeps right (18–45 %, then 45–72 %).
- **Frost**: 6–9 sparkles per loop (`rng(loopIndex + 1)`), life 6 ticks `w g g a a a`, only on metal within 4 px of the MXC/chip (never the window, halo or finger signal path); none alive across the seam so frame 144 == frame 0.
- **Bit**: ticks 0, 48, 96: `a` pixel from (28, 109) falling 2 px/tick with a 1-px `g` tail, exits after row 127 at d = 10 (`bit-exit`).

## Composition notes and deviations from the card

- Symmetric about x = 27.5 (even width): coax tops at **13 19 25 | 30 36 42** (card: 31/37/43 on the right; mirrored for symmetry). Lines step inward under each plate (the jog is hidden by the plate) and converge to **20 23 26 | 29 32 35** above the MXC (card: "22–33"); the first pixel under each plate is `m` (shadow) instead of a side shadow pixel, which would merge adjacent lines.
- Support rods are per stage (a truss), inset 1 from the plate below (0 at the MXC): 2-px `t m` tubes for the two upper stages, 1-px `m` struts below, so the structure reads as a taper and is distinct from the 1-px coax on both backgrounds.
- Hairpins are 3×4 expansion loops (ring around a 1×2 hole) on the mid lines, rows 51–54 under 4 K; the pulse runs down the outer side.
- 6 attenuator beads (card: one per line, staggered): outer lines under 4 K (staggered rows 45 and 49), mid lines under the still (64) and under the cold plate (80). Beads on the inner lines were removed (with the loops they read as faces); spacing under the cold plate does not allow 3-px beads on more lines.
- HEMT 6×4 at x 10–15 (in front of the rod at 13); circulator 5×5 at x 38–42 rows 61–65 (in front of the rod at 39; the card's x 36–40 collided with a coax line).
- Chip: 14×11 `s` outline with rounded corners, `l` top/left highlight, `m` bottom/right shade; window **9×3** (card 8×3) so four single qubit pixels at x 25 27 29 31 sit symmetric with 1-px gaps and never touch the halo; halo corners are open.
- Cold finger `l t t s` (4 wide); the pulse crosses it as a 2-px dash.
- `cache: 'none'` instead of `'loop'`: the mount's frame cache ignores inputs, and the card's `cool`/`ignite` inputs (and the intro) require per-tick rendering. Frame cost ≈ 0.06 ms, far under the 0.3 ms budget.

## Critique rounds

**Round 1** (first render, 6× paper + ink). Bugs: the top flange rim flashed azure permanently (`flashStage === i` with i = 0). Craft: rods and coax indistinguishable (same 1-px grey, "prison bars"); the two inner beads next to the hairpin rings read as two little faces; the `g` bit tail punched a hole in the chip's bottom outline; the circulator overlapped a coax line at the card's x. Fixes: flash guard; 2-px `t m` tubes for the upper rods; inner beads removed; tail clipped to rows ≥ 109; circulator moved to x 38–42.

**Round 2** (pulse crop at 8×, intro 2×, glint 8×, seam 4×). Pulses read as comets with the 4-px tail and visibly pass through the hairpin loop; the glint sweep reads as a travelling highlight; the seam 143 → 0 is continuous; the intro sequence (lower, five rim flashes, white ignite, glow) matches the design. Craft issues: the chip read as a robot face (two `v i` eye pairs); the lit left column touched the halo; the validator counted 27 box-corner "doubles". Fixes: window widened to 9 px with four single qubits; chip corners and halo corners rounded; highlight reduced to a top-left L and a bottom-right L; arrival now also flashes the nub on that side.

**Round 3** (full poster 6× ink; 4 K crop 8×). The 4 K stage was crowded in rows 43–50 (HEMT, both beads, both rings) leaving 51–55 empty. Fix: right bead raised to row 45, left bead at 49 below the HEMT, rings lowered to 51–54: three heights, nothing aligned. Frost verified on the chip's left outline (ticks 25–27 of loop 0); the hold-tick anchor light on the MXC rim verified.

**Round 4** (1×/2× silhouette on paper, live harness frames at zoom 2 and 4, exact-tick intro strip, reduced motion). Silhouette at 1×: stacked discs narrowing downward with a box at the bottom; six lines visible at 1×. Live frames: integer pixels, no soft edges at DPR 1 (crops). Reduced motion: six frames over 5 s pixel-identical, poster shown. Accepted as final; remaining nit: on paper the `w g` pulse head reads as a bright gap in the grey line while the `a c` tail carries the motion (inverse on ink); this is inherent to a white-on-paper palette and both read as motion.

## Acceptance checklist (card 1 + common)

| # | Criterion | Result |
|---|---|---|
| C1 | `npm run validate -- fridge-hero`: palette-only, ≤ 17 colours (14 used), exact loop, poster in loop | **pass** (0 errors; 1 warning: 18 L-corner "doubles" = the heuristic counting the rectangular chip/bead/ring corners, not jaggies) |
| C2 | Reads at 1× and 4×, on paper and ink | **pass** (`poster-*-4x`, 2× strip, sheets on both backgrounds) |
| C3 | Light upper-left, no pillow shading, no banding, no stray orphans except sparkles | **pass** (plate recipe lit left, rods/beads/chip shaded lower-right; orphan scan clean) |
| C4 | Loop seam invisible | **pass** (frame 144 == frame 0 verified programmatically; sheet 143 → 0 continuous) |
| C5 | `frames.mjs --interval 83` matches the timeline ±1 tick | **pass** via exact-tick captures (lowering 1–10, flashes 12–16, ignite 18); free-running captures sample ≈ 1.5 ticks/frame because of screenshot cost (tool limitation, noted above) |
| C6 | Poster meaningful: pulses mid-cable, chip lit | **pass** (tick 30: six pulses in flight, window glowing) |
| C7 | White flashes ≤ 1 tick and ≤ 3/s | **pass** (ignite 1 tick; qubit blinks are single pixels) |
| 1 | Silhouette = stacked discs narrowing downward with a box at the bottom | **pass** |
| 2 | No plate wider than the one above (48 44 38 32 26 20) | **pass** |
| 3 | Six coax lines visible at 1× | **pass** |
| 4 | Pulses never overlap on one line (travel 36 < period 48) | **pass** |
| 5 | Label rows match `labelRows` = [22, 40, 58, 74, 88] (gleam row of plates 1–5) | **pass** |
| 6 | Frames 0 and 144 identical | **pass** |
| 7 | Intro inputs: `cool` 0..5 dulls rims / darkens window, each step flashes the next plate azure for 1 tick and lights its beads; `ignite` white 1 tick then glow; `cool = 5, ignite = true` == idle | **pass** (scripted mode gives the flashes; manual mode gives the states) |
| 8 | Bit event at ticks 0/48/96; a bit falls 2 px/tick from (28, 109) with a `g` tail and exits row 127 in 10 ticks | **pass** (`events` verified: 0:bit 10:bit-exit 48:bit …) |
| 9 | Reduced motion forces the idle poster | **pass** when `intro` is −1 (the section sets it under reduced motion; `-2` is a deliberate hidden state) |

# chain-flow · card 9 (art-chain-flow, opus)

Four pieces for section `#flow` ("Seven steps. The money moves last."), plus two drivers for the section.

| id | size | loop / period | cache | inputs | poster | colours |
|---|---|---|---|---|---|---|
| `chain-block` | 16×16 | 1 / 1 (static by design) | none | `mode` post·stake·commit·reveal·settle, `lit` (default true), `click`, `age` | lit, at rest | 10 of 13 |
| `job-token` | 12×12 | 24 | none | `walk`, `progress` 0..1 | 0 | 8 |
| `magnifier-scroll` | 16×16 | 24 | loop | — | 0 | 9 |
| `settle` | 48×24 | 72 / 144 | none | `mode` auto·honest·cheat | 50 (honest, paid) | 14 |

Files: `index.ts` (exports), `block.ts`, `token.ts`, `magnifier.ts`, `settle.ts`, `parts.ts` (block body, coins), `drive.ts` (section drivers), `tools/` (QA only: `states.ts` state sheets, `validate.ts` folder-only validator, `flow-demo.*` + `vite.demo.config.ts` scroll demo).

## How the flow section drives it

```ts
import { clickChainBlock, resetChainBlock, stepOf } from '../art/chain-flow';
// markup: <span class="px" data-piece="chain-block" data-io-lit="false" data-io-mode="stake"></span>
//         <span class="px" data-piece="job-token"></span>  <span class="px" data-piece="settle"></span>
onScrollProgress(flowEl, (p) => {
  const step = stepOf(p);                 // 0..6 for steps 1..7 (remap p first if you want the steps mid-viewport)
  // move the token with moveUnits(tokenEl, 0, rowY(step) / 4) in 4-px steps; set token 'walk' true while moving
  token.set('progress', step / 6);        // escrow coin rides on the card for steps 1–6, gone at Settle
  clickChainBlock(blockFor(step));        // on arrival: lights it, drops it 2 px into the chain, plays the glyph once
  // scrolled back up: resetChainBlock(m) for blocks past the step (unlit, hovering again)
});
```
- `clickChainBlock(m)` steps the `age` input 0→8 on the sprite clock (one tick each) and removes itself; under reduced motion it jumps to the lit rest state. `frame()` stays pure: the block draws from `lit` + `age` only, so an idle block never redraws.
- `settle.state()` → `escrow | paying | paid | slashing | slashed | reset` (for highlighting the outcome cells); events `mint` (honest t39), `crack` (cheat t12), `slash` (cheat t31).
- Reduced motion: posters are the informative stills (lit blocks with their "after" glyph, the paid + certificate scene).
- A working reference implementation is `tools/flow-demo.ts` (build: `npx vite build --config src/art/chain-flow/tools/vite.demo.config.ts`).

## Timelines as built (ticks, 12 fps)

**chain-block** (on `clickChainBlock`; `a` = age): unlit = darker ramp (`b i v` faces, `a` top), hovering 2 px up, glyph shows its *before* picture.
a0 smear (block stretched from the hover to the seat, no detail) · a1 impact squash (13 tall) + `w`/`a` spark at the link · a2–a3 spark spreads and fades · glyph transition a1–a6 (6 frames) · a7+ at rest, lit, *after* picture.
Glyphs, before → after: **post** job card → the escrow coin drops onto it (−4, −1, land, glint) · **stake** 2 coins + open padlock → the 3rd coin drops, the shackle snaps (`w` glint) · **commit** unsealed envelope → violet seal stamps (1 `w` tick) · **reveal** sealed envelope → the seal breaks (1 `w` tick), the key pops out (2 frames), key + sparkles · **settle** closed vault → the round door slides right 1/2/3 px (3 frames), coins inside.

**job-token**: walk bob 1 px every 2 ticks (6 fps); `w` glint runs along the top edge t12–20; escrow coin from step 1, the provider's stake coin joins from step 2, both gone at step 7.

**magnifier-scroll**: lens x offset 0/1/2/1 per 6 ticks; lines under the lens are drawn 2× magnified in steel.

**settle** (each 72-tick loop; auto = honest then cheat):
0–7 deposits: two coins hop in from the client, the stake from the provider · 8–11 the escrow padlock is shut.
Honest: 12 padlock opens · 12–29 the coins hop to the provider's pile (stake first) · 31–32 the provider hops · 36–37 the certificate block falls · 38 smear · 39 squash on impact (`mint`) · 40–41 `a` ring · 42–63 hold (poster 50).
Cheat: 12 raspberry crack · 13 split · 14–31 the halves hop back and land as cracked coins at the client · 31 collar turns `R` · 31–33 the provider sinks 2 px (clipped at the floor) · hold to 63.
64–67 the outcome dissolves (4-step ordered dither; the provider rises back) · 68–71 empty box. Blinks: client 26/58, provider 9/47.

## Critique rounds (sheets in `qa/art-chain-flow/`)

**Round 1** (`r1-*`). The block body worked as a chunky 3/4 "keycap" block, but the glyphs failed. Post's coin over a slot read as a person icon (unlit) and a dome (lit). The stake stack read as an arch. Commit read as a cassette, reveal's upright key as a person, the open vault as a camera. Settle: the `k` figures vanished on ink, the tray read as a bench, and the cheat halves stacked into a barber-pole tower. The job token's 3×5 `#` read as "H". The scroll had no left edge on paper.
→ Six glyph-candidate batches in a lab (each candidate on a lit and an unlit block at 8×, 4× and 1×). Kept: the V-flap envelope with a violet seal; the wide zigzag coin stack with a padlock; a classic horizontal key; a round vault door that *slides* right, so it stays recognisably round and reveals coins. Post became the job card plus a coin, echoing the token. Coin-in-slot always read as a dome.

**Round 2** (`r2-*`). Five distinct glyphs at page scale. Unlit vs lit now also tells the story: each block waits on its before picture.
Still wrong:
- Settle figures were invisible on ink.
- Settle coins had single-pixel diagonal shading (orphans).
- The figures' arm pixel was clipped at the canvas edge.
- The token's two coins merged into one blob.
→ Figures redrawn in navy with slate light (upper left) and ink shadow, round 6×5 heads, the eye on the facing side and 4-px collars, so the `b`/`v`/`R` change reads. The tray became a walled escrow box whose padlock is shut while it holds the coins (t8–11). Coin shading is clustered. Cracked coins re-form into a low 2-1 heap. The stake coin sits 3 px up. The 5×5 hash fixes the "H". The scroll gets a silver/steel selective edge.

**Round 3** (`r3-*`, final art). Settle orphans dropped from 26 to 12, all deliberate (eyes, chin shadow step, wall caps, keyhole, seal pixel). The remaining validator warnings are deliberate too: coin rims, front-face data bits, the r=3 lens circle, bevel corners and keyholes. Loop seams checked on the full 144-frame sheet: 71→72 and 143→0 both join on the empty box.

**Round 4** (live). Harness frames and the scroll demo:
- The demo's absolute gutters were overridden by engine `.px { position: relative }`, which was a demo bug, fixed with wrappers.
- The token moves only in multiples of 4 px (47/47 transforms).
- An idle block canvas is byte-identical between ticks.
- Console is clean.
- Reduced motion lights every block, puts settle on its paid poster and the token at progress 1.

## Evidence

- Shared sheets: `qa/sheets/{chain-block,job-token,magnifier-scroll,settle}[-ink].png` (default inputs).
- State sheets: `qa/art-chain-flow/r3-*-{paper,ink}.png` and `*-1x.png` (true 1×). Regenerate with `npx tsx src/art/chain-flow/tools/states.ts r3`.
- Live harness frames: `qa/art-chain-flow/live-*/` (`trimmed-sheet.png`, `anim.gif`).
- Demo: `demo-scroll-sheet.png`, `demo-click-sheet.png`, `demo-click-zoom.png`, `demo-rm.png`, `demo-dpr2.png`, `capture.json`. Regenerate with `node qa/art-chain-flow/capture.mjs`.

## Acceptance (card 9 + common)

| # | Check | Result |
|---|---|---|
| 1 | Validate: palette-only, ≤ maxColours, exact loop, poster in loop | PASS (0 errors; warnings are the deliberate pixels listed in round 3) |
| 2 | Reads at 1× and 4×, on paper and on ink | PASS (`r3-*-1x.png`, ink sheets, live cheat on ink) |
| 3 | Light from the upper left; no pillow shading or banding; orphans only where deliberate | PASS |
| 4 | Loop seam invisible | PASS (144-frame sheet; token and magnifier are 24-tick loops) |
| 5 | Live frames match the timeline ±1 tick | PASS (live sheets; per-tick detail is pinned by the Node state sheets) |
| 6 | Poster meaningful | PASS (block lit after-glyph; settle t50 paid + certificate) |
| 7 | White flashes ≤ 1 tick, ≤ 3/s | PASS (seal stamp and seal break are 1 tick each) |
| 9a | Five distinct, legible glyphs at 1× | PASS |
| 9b | `R` only in cheat | PASS (honest frames 0, cheat 55; other pieces have no `R` in their palette) |
| 9c | Blocks move only on click changes | PASS (loop 1, `frame()` ignores the tick, identical idle canvases) |
| perf | `cache: 'none'` frame cost | PASS (warm 1–5 µs; the validator's 0.2 ms for chain-block is single-frame warm-up, since its loop is one tick) |

## Deviations from the card (deliberate)

- **Block:** a 3/4 keycap block (big top face `g`, front `c`, right `b`, edge `i`) instead of strict isometric. A 7×7 glyph cannot fit legibly on a 14-wide iso top face. Glyphs are up to 9×7 (10 for the open vault).
- **post:** the job card plus its escrow coin, not a coin in a slot. Every slot version read as a dome or bell.
- **commit:** the sealed envelope's wax seal stands for the hash. A `#` small enough to fit read as "H".
- **job-token:** the hash is 5×5, not 3×5, for the same "H" reason.
- **settle:**
  - The tray is a walled 14×6 escrow box with a padlock.
  - Figures are navy (`s`) with ink shadow, not flat `k`, so they read on ink.
  - Added: deposits 0–7, the reset dissolve 64–67, blinks.
- **New inputs:** `age` on chain-block (driven by `clickChainBlock`, keeps `frame()` pure) and `progress` on job-token (escrow coins).

## Known issues / requests

- The flow section must use `clickChainBlock(m)` (not just `m.set('click', n)`) to get the drop animation; setting `lit` alone changes state instantly. The harness's click only bumps `click`, so preview the click with `&lit=false` / `&age=N&tick=0` or with the demo.
- In the demo the token overlaps the block gutter at 48 px. Spacing is for sections-2 to tune.

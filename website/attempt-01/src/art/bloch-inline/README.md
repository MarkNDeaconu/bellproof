# bloch-inline · the headline sphere (art-spec card 2)

Inline in the hero H1 after "Verified". **16×16** (→ 64 px) and variant **`sm` 11×11** (→ 44 px) for the mobile headline.
Agent: `art-bloch-inline` (opus). Folder owned: `src/art/bloch-inline/**`.

```html
<span class="px" data-piece="bloch-inline" data-decorative></span>                  <!-- lg / md -->
<span class="px" data-piece="bloch-inline" data-variant="sm" data-decorative></span> <!-- sm -->
```

## Files and exports
| File | What |
|---|---|
| `index.ts` | `blochInline` (also the default export): the piece. `vectorPixels(tick, variant?)` is a QA helper that returns the tip, shaft, lead and smear pixels for a tick. |
| `timeline.ts` | The timeline as pure functions: `pose(tick)`, `motionAt()`, `OUTCOMES`, constants. |
| `parts.ts` | Hand-placed ASCII maps: `BASE16/FRONT16/GLASS16` and `BASE11/FRONT11/GLASS11`. |

## Contract
| Field | Value |
|---|---|
| size / variants | `[16, 16]` / `{ sm: [11, 11] }` |
| ticksPerFrame / loopTicks / **period** | 1 (12 fps) / 96 (8 s) / **384** (4 loops, 32 s; see "Outcomes") |
| poster | **5** (vector front-right, φ = 30°, on a clean 2:1 slope) |
| palette / maxColours | `k m t l w b c i a g r v` / 12. Ten are used; `m` and `t` are allowed but unused (see "Deviations"). |
| cache / inputs / modes | `'loop'` / none / none. The piece needs no driving from the section. |
| alt | `''` (decorative). Per design §5.1 the H1 carries a visually hidden full-text copy. |
| states | `precess`, `measure`, `hold-0`, `hold-1`, `rabi` (via `state(tick)`; optional for labels or QA) |
| exports | `{ outcomes: ['N','S','N','N'] }` |

## Composition as built (16×16)
- **Orb:** 13 px circle, runs 3-2-1-2-3, cols 2–14 and rows 2–14, centre (8, 8). It has a `g` glass fill and a selective rim: `c` from 9 o'clock over the top to 1 o'clock, `b` on the upper-right and lower-left transitions, `i` on the lower right. A solid 1-px `a` crescent sits inside the shaded rim, below the equator, tapering 2-2-1.
- **Equator** (camera tilt 19°): the front half is a solid `c` line (7-run on row 10, 2-runs on row 9) that joins the rim at 3 and 9 o'clock. The back half is `a` on every second pixel.
- **z axis:** `l` (silver) inside the glass, with `k` pole dots one px outside the rim at (8, 1) and (8, 15). Depth: the axis passes in front of the back equator and behind the front equator.
- **Specular:** `w` 2×1 at 10–11 o'clock (5–6, 5). It hides the back-equator dot it touches (glare).
- **State vector:** a `v` shaft from the centre to a `w` tip, length 5 px, so the tip sits on the pixel just inside the rim. It is re-rasterised every frame from (θ, φ) through the engine's `project()`. It is never a rotated bitmap.
- **Sub-pixel lead (16×16 only):** an `r` pixel on the side the tip moves toward. It shows only once the float tip has passed its pixel's centre, so two ticks that round to the same pixel still differ. It never lands on the shaft, the rim or the front glass, and never tucks into the shaft's stair corner.
- **Depth rules:** the back equator and the axis sit behind the shaft. The front equator and the specular sit on the front glass, in front of the shaft. They also cover the tip when the tip is on the far hemisphere.

**`sm`:** a 9 px orb (runs 3-2-2-3, centre (5, 5), pole dots (5, 0) and (5, 10)), vector length 3, a 1-px specular and a 2-px crescent. It has no lead or smear pixel, per the card. The timeline and the 24 precession angles are the same as the 16×16.

## Timeline as built (per 96-tick loop; φ is the screen azimuth, 0° = right, +90° = toward the viewer)
| Ticks | What you see |
|---|---|
| 0–71 | **Precession:** θ = 60°, φ = −45° + 15°·t (3 turns of 24 frames, counter-clockwise from above). The tip traces the θ = 60° latitude ellipse. On the front pass (φ = 90°, ticks 9/33/57) the vector points at the viewer and foreshortens to a 1-px stub, which is correct projection. It peaks straight up behind the axis on the back pass (ticks 21/45/69). The tip moves ≤ 1 px per tick. It dwells 2–3 ticks at the ellipse's left and right ends, where projected circular motion is slowest, and the lead pixel carries the sub-pixel progress there. |
| 72 | **Measurement:** the whole rim turns `w` for one tick (the only white flash: 1 tick every 8 s), and the vector snaps to the measured pole (θ = 0° or 180°, tip on the axis). |
| 73, 74 | An `a` ring burst around the tip, radius 2 then 3. The south r = 3 ring moves up 1 px so it stays on the canvas. The measured pole's dot turns `v` (the readout). |
| 75–86 | **Hold** on the pole for 12 ticks. The readout dot stays violet. On a south hold the shaft passes behind the front equator. |
| 87–95 | **Rabi drive** back to θ = 60° with the card's eased spacing 2 4 8 12 14 12 8 4 2 (sum 66). It is scaled to 60° from the north and 120° from the south. While the pulse is strong, the vector tips down the meridian φ = −60°. Over the last 2 frames the free precession eases back in (0 → 15°/frame), so 95 → 0 is one ordinary precession step: no stall and no speed jump at the seam. The south drive covers 120° in 9 frames: its three fastest ticks (186–188 in loop 1) move the tip 2 px, and each jump gets an `r` smear pixel on its path. |

**Outcomes:** these come from a seeded shuffle (seed 1946, the year of Bloch's paper) of three norths and one south, which gives **N, S, N, N** over the 384-tick period. That is exactly P(0) = cos²(θ/2) = cos²30° = 0.75. Loop 0 (the poster's loop) lands north, and the rarer south shows up at ~14 s.

## Evidence (all opened and reviewed)
- Shared Node sheets: `qa/sheets/bloch-inline.png`, `-ink.png`, `bloch-inline-sm.png`, `-sm-ink.png`. These show every 3rd frame, because the tool strides periods over 144 frames, so tick 5 (the poster) is not boxed there. That is why the full sheets below exist.
- Full sheets, every frame, paper | ink: `qa/art-bloch-inline/full-main.png`, `full-sm.png` (all 384 ticks at 4×), `loop0-main-8x.png`, `loop0-sm-8x.png`, `loop1-south-main-8x.png`, `seam-main-8x.png` and `seam-sm-8x.png` (ticks 376–391 across the period seam), `poster-main-12x.png` and `poster-sm-12x.png`.
- Live harness, `frames.mjs --interval 83` at zoom 4: `qa/art-bloch-inline/live-main-z4-turn/`, `live-main-z4-measure/`, `live-main-z4-ink-south/`, `live-sm-z4-measure/` (each has `contact-sheet.png` and `anim.gif`). Reduced motion: `reduced-motion-main/` and `reduced-motion-sm/` (static poster, 0 px change across frames). DPR 2: `poster-dpr2-main.png` and `poster-dpr2-sm.png` (8 device px per art px, crisp).
- In context, a mock H1 at 88/88 and 40/44 in Space Grotesk: `qa/art-bloch-inline/context-h1-1440-step-00.png` and `context-h1-zoom2x.png`.
- Checks: `qa/art-bloch-inline/acceptance-checks.txt`. It holds the per-frame checks plus a pixel comparison of 66 live harness captures against the Node render of the engine-reported tick: **66/66 match within ±1 tick**.

## Critique rounds
**Round 1** (first procedural pass, paper and ink at 6–8×)
- The `t` axis was the longest dark line, so the orb read as a crosshair and the violet vector lost the contrast budget. *Fix:* the axis is now `l`.
- The specular sat on the back-equator row and read as part of the dotted line. *Fix:* it moved up a row and hides the dots it touches.
- The crescent merged with the right back-equator dot into a vertical bar. *Fix:* the crescent now lives below the equator only.
- The `sm` orb (3-1-1-3) read as a diamond. *Fix:* it now uses rounder 3-2-2-3 runs.
- The Rabi ease-out plus the card's pure-meridian drive gave a 5-frame stall, then precession started at full speed. *Tried a spiral* (precession running through the whole drive). It flowed through the seam but hid the drive.

**Round 2** (hand-placed ASCII bases)
- Bresenham's tie-breaking drew 1-2-1 kinks on the 4–5 px shaft, the poster included. *Fix:* a DDA shaft with ties toward the origin gives regular 2-2 runs.
- Consecutive ticks rounded to the same tip pixel and stuttered. *Fix:* the lead shows on fractional progress, with neighbouring-octant fallback.
- The lead could overwrite the specular. *Fix:* the front glass is now excluded.
- The lead tucked into the shaft's stair corner made a blobby head. *Fix:* those placements are forbidden, which keeps the poster clean.
- The burst ring was clipped at the bottom on south (it looked like legs). *Fix:* the ring is nudged inward.
- The readout dot was overwritten by the ring. *Fix:* the dots are drawn last.

**Round 3** (in context next to an 88 px headline, plus the live harness)
- The orb holds its own as a glass ornament. The `k` pole dots tie it to the headline ink, and the vector is the strongest mark. Judged acceptable.
- Programmatic checks found two real defects:
  - (a) The tip landed on the rim: `sm` side passes, and main small-θ drive frames. *Fix:* the tip steps back along the shaft until it is inside the glass.
  - (b) The tip skipped the axis column (2-px jumps) on the front and back passes, because frames straddled φ = 90°/270°. *Fix:* φ₀ = −45° puts frames on 90°/270°, and the poster stays front-right at φ = 30°.
- The spiral spent its fastest drive frames foreshortened behind the pole, so the tip barely moved during the pulse. Spiral, pure meridian and blend were compared side by side. **Blend chosen:** the drive is legible like the meridian and continuous like the spiral.

**Round 4** (final)
- A south-drive tip on the far hemisphere was drawn over the front equator. *Fix:* the front glass covers far-side tips.
- 2-px jumps in the fast core of the south drive. *Fix:* added a smear pixel.
- Remaining by design: the `w` tip is quiet on `g` glass (the card's spec), and the front pass foreshortens to a stub (projection).

## Acceptance (card 2 + common list)
| # | Criterion | Result |
|---|---|---|
| card | Reads as "circle + equator + arrow" at 1× | PASS (context mock, 64 px and 44 px) |
| card | The vector never leaves the sphere | PASS (0 shaft, tip or lead pixels outside the glass interior in 384 ticks, both variants) |
| card | Measurement lands exactly on a pole | PASS (θ = 0°/180° exactly; the tip is on the axis on every flash, burst and hold tick) |
| card | Frame 96 == frame 0 | PASS (also frame 384 == frame 0, the full period) |
| card | 3 turns × 24 frames, θ 60°, 15°/frame; flash 72; rings 73–74 (r 2, 3); hold 75–86; Rabi 87–95 eased; seeded outcome p ≈ 0.75 | PASS (see the timeline; P(N) = 3/4 exactly per period) |
| card | `sm`: same timeline, 24 angles, no `r` lead | PASS |
| 1 | `npm run validate -- bloch-inline` | PASS: 0 errors, 10 colours, 0.008 ms/frame. Two warnings: poster orphans, 7 (16×16) and 5 (`sm`). They are the two `k` pole dots, the single-pixel diagonal corners of the 1-px rim, and the short axis segments isolated between the vector origin, the front equator and the rim. All are inherent to 1-px line art; none is noise. |
| 2 | Reads at 1× and at 4×, on paper and on ink | PASS. On ink the `k` pole dots vanish by nature, and the lit readout dot still shows. |
| 3 | Light from the upper left; no pillow shading, banding or stray orphans | PASS |
| 4 | Loop seam invisible | PASS (`seam-*-8x.png`: 383 → 0 is an ordinary precession step) |
| 5 | Live frames match the timeline within ±1 tick | PASS (66/66 pixel-exact matches) |
| 6 | Poster meaningful and as specified (tick 5, front-right) | PASS |
| 7 | White flashes ≤ 1 tick and ≤ 3/s | PASS (one 1-tick flash per 8 s) |

## Deviations from the card (deliberate)
- **Axis colour `l` instead of `m`.** The `m` and `v` keys have near-equal luminance (~0.07–0.08). An `m` axis competes with the vector, and a `t` axis already read as a crosshair in round 1. Research 03 §1.5 gives the vector the strongest contrast. The pole dots stay `k`.
- **Shaft by DDA instead of `g.line`.** It is still one pixel per step with no doubles. Only the tie-breaking differs, to avoid kinks.
- **Period 384 (4 loops).** "Seeded per loop" outcomes need distinct loops inside the pre-rendered cache. The loop is still 96 ticks and frame 96 == frame 0.
- **Rabi blend.** The card's θ spacing is unchanged. φ is held on a meridian, then eases into the precession over the last 2 frames.
- **Additions:** the readout dot (the measured pole turns violet while the result holds), the smear pixel on 2-px jumps, and the tip clamp.

## Known issues and requests
- The shared sheet tool strides periods over 144 frames, so the poster may not be boxed. *Request (engine):* a `--all` or `--from/--to` option.
- The main entry currently fails to build because another agent's `src/sections/flow.ts` imports a missing `flow.css`. I built preview-only through a scratch Vite config that imports the project config (no shared file changed).
- Nothing else to request. Sections only mount the span. Layout should keep `vertical-align: -6px` per design §5.1.

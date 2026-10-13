# certificates · art-spec card 4 (`cert-mini`, `cert-mint`)

Owner: `art-certificates`. Files: `index.ts` (both pieces, the section API), `parts.ts` (hand-drawn ASCII parts).
Light from the upper left everywhere. No text is drawn in either canvas: per card 4b acceptance the `VERIFIED` / `ACCEPTED` wording is HTML, so the glyph fonts are not needed here.

| id | size | loop | poster | cache | colours | alt |
|---|---|---|---|---|---|---|
| `cert-mini` | 24×20 (→ 96×80) | 72 | 60, stamped | `loop` | 9: `p h l t m i a v w` | `''` (decorative hero rider) |
| `cert-mint` | 72×48 (→ 288×192) | 84 | 40, stamped | `none` | 15: `p h l e t m s i v r w g c b a` | "A certificate is stamped ACCEPTED and minted as a block on a chain." |

## Inputs, events, states

**`cert-mini`**: no inputs. `state()` → `hover | stamp | stamped`. `events()` → `impact` at loop tick 45.

**`cert-mint`**
- `io.stamp: boolean`, **default `true`**. When `false` the piece idles: rows typed, stamp hovering with a 1-px bob every 12 ticks, chain bits shuffling. The default is `true` so `npm run validate` and `npm run sheet` cover the whole timeline, and the reduced-motion poster is stamped even when no script runs.
- `state()` → `idle | typing | stamping | stamped | minting | chained`.
- `events()` → `impact` at loop tick 27 (the stamp lands) and `minted` at loop tick 56 (the new block clicks into the chain).
- **Section API** `getPiece('cert-mint').exports.stamp(mounted)`: sets `stamp = true` and restarts the loop at tick 22 (rows already typed, stamp hovering), so the impact lands **5 ticks (≈ 0.42 s)** after the call. Under reduced motion it only sets the input, and the mount shows the stamped poster (tick 40). `exports.timeline = { loop: 84, entry: 22, impact: 27, minted: 56, poster: 40 }`.

How `#guarantees` (sections-3) should drive it:
```html
<span class="px" data-piece="cert-mint" data-io-stamp="false" style="--w:72;--h:48"></span>
```
```ts
const m = mountedOf(el)!;                                   // after mountAll
typewriter(rowsEl, text, { msPerChar: 20, onDone: () => (getPiece('cert-mint').exports!.stamp as (m: Mounted) => void)(m) });
m.on('impact', () => verdictEl.classList.add('in'));       // optional: reveal ACCEPTED on the thunk
```
The typewriter calls `onDone` immediately under reduced motion, so the same path covers both.

## Timelines as built (ticks at 12 fps)

### `cert-mini` (72 ticks)
| ticks | what happens |
|---|---|
| 0–1 | the printed seal from the last loop fades out in a 2-step dither; the stamp drops back in from above (top y −2, 3, 6, 7) |
| 4–41 | hover 4 px above the print spot, 1-px bob every 12 ticks; contact shadow (`h`, 4 px) on the card |
| 42–43 | anticipation: lifts 1, then 2 px; shadow shrinks to 2 px |
| 44 | smear: the stamp is drawn 2× tall in flat steel, die kept; shadow widens to 6 px |
| 45 | **impact**: squashed 1 px, card outline flashes `w` (1 tick), 4 dust pixels (`l`) at the base corners |
| 46–47 | pressed; dust flies 1 px diagonally per tick and fades (`h`, then 2 of 4) |
| 48–51 | the stamp lifts away and accelerates out of frame (1, 4, 9, 16 px), revealing the printed seal: an indigo disc with an azure ✓ |
| 52–71 | stamped hold (poster 60) |

### `cert-mint` (84 ticks once `stamp` is true)
| ticks | what happens |
|---|---|
| 0–1 | reset: the values, signature, verdict and seal dither out in 2 steps (the form's keys, title, rule and signature line are pre-printed and stay) |
| 2–16 | 7 values type in, 2 px per tick from the value column, staggered 1–2 ticks, with a `c` cursor pixel on each growing row |
| 10–15 | the stamp tool enters from above, decelerating (−2, 9, 16, 20, 23, 24) |
| 14–19 | the signature is written, 2 columns per tick |
| 16–23 | hover 4 px above the seal spot (one 1-px bob at 18–21); contact shadow `h` 7 px |
| 24–25 | anticipation: lifts 1, then 2 px; shadow shrinks to 5, then 3 px |
| 26 | smear: tool 1.6× tall, flat steel, die kept; shadow 9 px |
| 27 | **impact** (event): tool squashed 1 px; the scroll and tool dip 1 px (jolt); the sheet outline flashes `w`; 2 wax pixels squeeze out at the die; 6 dust pixels (`t`); the verdict value appears in `a` |
| 28–29 | pressed; dust flies out and fades `l` → `h`; the verdict settles to indigo `i` |
| 30–34 | the tool lifts away and accelerates out of frame (1, 4, 9, 17 px; 33 is an exit smear), revealing the **bell wax seal** |
| 35–47 | stamped hold (poster 40); 42–47: a 1-px glint sweeps the seal diagonally, `a → g → w → w → g → a` |
| 48–49 | mint sparkle (`w`/`g` centre with an `a` plus) above the chain head |
| 50–54 | a new block appears at row 16 and drops 2 px per tick; its lit face carries a certificate glyph (paper card with violet seal pixels) |
| 55 | smear (the block stretched along its path, rows 25–41) |
| 56 | **lands** (event `minted`): squashed 1 px; `w` spark corners at the link |
| 57 | `a` spark ring, 1 px further out; the block's own outgoing link appears |
| 60–73 | the chain scrolls left 1 px per tick for exactly one pitch (14 px); the oldest visible block slides behind the scroll |
| 74–83 | hold; hash bits re-key as the blocks settle; 76–77: the certificate glyph dissolves into hash bits (committed) |

The chain is 12×12 isometric blocks (top `g`, left `c`, right `b`, edges `i`) at pitch 14 with 2×2 `l`/`t` links. Each side face carries a 4×4 hash-bit pattern (`a` on the lit face, `c` on the shaded face), seeded per block, which shuffles every 12 ticks with per-block offsets of 4 ticks. The chain is clipped to x ≥ 29 so blocks pass behind the scroll.

## Deviations from the card (and why)
1. **Stamp tool.** The card's seal-on-a-handle read as a potion flask (4b) and a pushpin (4a) in round 1. Both pieces now use a classic rubber stamp (knob, neck, flared base, violet inked die). The seal is pressed in under the base and revealed as the tool lifts.
2. **The handle lifts out of frame instead of holding**, then returns at the loop start. This keeps the stamped posters clean.
3. **Bell colours.** The card asks for a `v` bell on an `i` disc. That pairing has ΔL ≈ 0.08 and read as a purple dot at 1×. The bell is now `g` on `i`, following card 16's "paper on dark" rule for the mark, with an `r` rim light at the upper left, a `v` shadow crescent at the lower right and a `w` specular.
4. **Mini seal.** The 6×6 notched rosette read as a gear or bug, so it is now an indigo disc with the logo's ✓ in azure. It is still printed in `i`/`a`, plus a `v` shadow rim.
5. **Mini text lines** are `l` instead of `h`, and the signature line is `t` instead of `l`. `h` on `p` has ΔL ≈ 0.07, below the research §1.1 minimum of 0.10 for 1×.
6. **4b form.** Keys are pre-printed and values type in. The verdict value is stamped in at impact.
7. **Timing.** The glint moved to 42–47 so the poster (40) is clean. The chain scrolls exactly one pitch (14 px, 60–73) and then holds (74–83), which keeps the loop exact. The block appears at 50, after the sparkle.
8. **Additions:** contact shadows, the impact jolt, wax squeeze, mint sparkle and the glyph-to-hash dissolve.
9. **`stamp` defaults to `true`** (see Inputs). The section must mount with `data-io-stamp="false"`.

## Critique rounds
**Round 1** (`qa/art-certificates/r1-*.png`):
- the seal on a stick reads as a flask (4b) and a pushpin (4a)
- the `v`-on-`i` bell is murky and unreadable at 1×
- the 12×12 blocks have flat 4-px tops and bottoms, so they look like barrels or jars
- the poster frame caught the glint, a 3-px white band across the seal
- the lifted handle floats over the rows as a grey blob
- the `h` dust and the mini's `h` text lines vanish on paper
- the roll end reads as a dark square

**Round 2** (`r2-*.png`), after candidate boards for seals, rosettes and tools (the T2 tool, the W1 seal and the N1 check seal won):
- the stamp now reads instantly
- the pointed 2:1 blocks read as cubes
- *bug:* after the scroll the oldest block leaked at x = 2 (left of the sheet)
- the seal peeked around the stamp's neck while it was pressed
- the impact was weak on paper: the white outline flash is nearly invisible on `p`, and `l` dust is faint
- the hash bits were noisy (density 0.40)
- the mini's text lines were still faint

**Round 3** (`r3-*.png`, final):
- the chain is clipped to x ≥ 29
- the seal is revealed only from lift-off (mint 30, mini 48)
- the impact jolt and darker `t → l → h` dust make the thunk read on paper
- hash bit density is 0.35
- mini lines `l`, signature line `t`, no 1-px words, and the validator shows zero warnings
- contact shadows were added
- *bug:* the minted block lacked its outgoing link, so a link popped in at the 83 → 0 seam; fixed (the remaining chain diff at the seam is only the regular bit shuffle)

**Round 4** (live, harness):
- `frames.mjs` loops and the `--zoom 4` stamp windows match the timeline order
- `verify-live.ts` proves pixel-exactness tick by tick (below)
- no further changes were needed

## Evidence (`qa/art-certificates/`)
- Sheets (custom inputs, paper / azure / ink, 4× plus 1× strips): `r{1,2,3}-cert-mini.png`, `r{1,2,3}-cert-mint-stamp.png`, `r{1,2,3}-cert-mint-ink.png`, `r{1,2,3}-cert-mint-idle.png`, `r{1,2,3}-posters.png`. Regenerate with `npx tsx qa/art-certificates/sheets.ts <label>`.
- Shared sheets: `qa/sheets/cert-mini.png`, `cert-mini-ink.png`, `cert-mint.png`, `cert-mint-ink.png`.
- Live `frames.mjs` captures: `live-mint-loop/` and `live-mini-loop/` (full loops, `zoom=2`); `live-mint-stamp-z4/` and `live-mini-stamp-z4/` (stamp windows, `--zoom 4`).
- Exact live check: `verify-live.ts` → `verify-live.json`, `live-trigger-mint.png` (idle → `exports.stamp()` → ticks 22–61, labelled), `live-mini-exact.png`. Build first with `BP_ONLY=certificates npx vite build --outDir .qa/art-certificates`.

## Acceptance checklist
| # | criterion | result |
|---|---|---|
| C1 | `npm run validate -- cert-mini cert-mint`: palette-only, ≤ maxColours, exact loop, poster in loop | **pass**, 0 errors and 0 warnings (mint 15 colours, 0.07 ms per frame; mini 9) |
| C2 | reads at 1× and 4×, on paper, azure and ink | **pass** (`r3-posters.png`, 1× strips, ink sheets) |
| C3 | upper-left light, no pillow shading or banding, no stray orphans | **pass** (validator orphan and doubles scans clean) |
| C4 | invisible loop seam | **pass**: frame(period) = frame(0) for both pieces and for idle; 83 → 0 is the designed 2-tick reset, and the chain differs only by its regular shuffle |
| C5 | live frames match the timeline within ±1 tick | **pass, exact**: 100 consecutive ticks after the trigger and 80 mini ticks, 0 mismatched pixels, 0 skipped ticks; `impact` at 27, `minted` at 56 |
| C6 | meaningful poster | **pass**: stamped certificate with seal (mint 40 also shows the chain); reduced motion holds it unchanged for 2 s |
| C7 | white flashes ≤ 1 tick and ≤ 3 per second | **pass**: one outline flash per loop (mint 27, mini 45); the only other `w` pixels are single-tick sparkles at mint 48 and 56, so at most 2 per second |
| 4a | spec timing: hover, anticipation 42–43, smear 44, impact 45, dust 46–47, stamped 48+, 2-tick dither return | **pass** (stamp tool instead of rosette-on-handle, see Deviations) |
| 4b | the seal is the logo bell, recognisable at 1× | **pass** (light bell, see Deviations 3) |
| 4b | `VERIFIED` / `ACCEPTED` wording is HTML, not canvas | **pass**: no text in the canvas |
| 4b | dust never leaves the canvas | **pass** (mint x 11–31; mini x 9–20, y ≥ 13) |
| 4b | chain blocks show exactly 3 faces, light on top and left | **pass** |
| 4b | `stamp=false` idles with rows typed and the stamp hovering | **pass** (`r3-cert-mint-idle.png`, 0-mismatch idle frames live) |
| — | section trigger works live; reduced motion plus trigger shows the poster; console clean | **pass** (`verify-live.json`) |
| — | the lead's "text in pixel art uses the glyph fonts" | **n/a**: no in-canvas text, per card 4b |

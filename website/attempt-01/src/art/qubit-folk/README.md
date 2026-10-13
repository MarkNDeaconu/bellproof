# qubit-folk · Alice, Bob and the walkers (art-spec card 3)

Owner: `art-qubit-folk`. Three pieces built from one character sheet.

| id | size (variants) | cache | where it lives |
|---|---|---|---|
| `qubit-pair` | 32×16 (`sm` 24×12) | loop | hero: rides the left rail stack (lg/md); stands on the floor beside the stack (sm) |
| `walkers` | 40×16 (`stairs` 40×32) | none | CTA: walks the dusk staircase, high-fives mid-way |
| `qubit-walker` | 12×14 | none | footer: patrols strata band 2; hero: the pill riser (`mode=stand`) |

Files: `creature.ts` (the character: orb maps, rims, face, antenna, feet), `link.ts` (entanglement link),
`walk.ts` (shared walk cycle), `pair.ts`, `walkers.ts`, `walker.ts`, `index.ts` (exports), `sheets.ts`
(dev-only contact sheets for every mode; not bundled).

## The character

- **Orb** 10×10 (sm 8×8): `g` glass fill, `w` 2×1 specular at 10 o'clock, `u` form-shadow crescent lower
  right, and a selective rim that walks lit → mid → shadow: **Alice `c/b/i` (blue)**, **Bob `r/v/n`
  (violet)**, neutral walker `c/t/m`. Light is always upper left: facing left or right moves only the
  face, antenna and feet; the shading is never mirrored.
- **Eyes** `k`, 1×2 (sm 1×1), low on the face. Blink = hidden for 1 tick. `face` shifts them 1 px.
  Optional smile and blush (`a` Alice, `r` Bob) for happy beats.
- **Bloch antenna**: 2 `v` stalk pixels + a tip bead. The bead is azure for Alice and lilac for Bob
  (white disappears on the hero card), white when flashing, and white on the footer walker modes that
  run over the blue band. Tilt = tip moved 1 px; a fast rise drags it down/flat (follow-through).
- **Feet** two 2×2 nubs drawn behind the orb, two-tone so the near foot reads on top when they pass:
  `m/s` on paper and blue, raised to `t/m` for the walkers on ink.
- **Bodies**: normal, squash (12×9) and stretch (8×11) maps, all bottom-aligned.

## API

```ts
import { qubitPair, walkers, qubitWalker, HIFIVE_TICKS, PRECESS_TICKS, HOP_TICKS } from '../art/qubit-folk';
```

### `qubit-pair` (no inputs)
`<span class="px" data-piece="qubit-pair" data-decorative></span>` (sm: `data-variant="sm"`).
Feet stand on the bottom row (`exports.feetRow` 15, `smFeetRow` 11), so place the canvas bottom on the
block's top edge. Poster tick 20.

### `walkers`
| input | type | default | meaning |
|---|---|---|---|
| `mode` | `'stand' \| 'walk' \| 'hifive'` | `stand` | |
| `since` | number | 0 | local tick at which `hifive` started (set it to `mounted.localTick` when you switch) |
| `liftA`, `liftB` | number (art px) | 0 | raise Alice / Bob independently (needs the `stairs` variant; clamped to its 16 rows of headroom) |

`state()` → `stand | walk | hifive | hifive-done`. `events()` → `'flash'` on hifive tick 4, `'done'` on
tick 23. `exports`: `walkArtPxPerTick: 1`, `hifiveTicks: 24`, `flashTick: 4`, `feetRow: 15`.

Driver (sections-3):
```ts
const m = mountedOf(el)!;                    // data-piece="walkers" data-decorative data-io-mode="walk"
// 'walk': move the canvas 1 art px (4 CSS px) per tick on the sprite clock → planted feet stay put
// mid-way:  m.set('since', m.localTick); m.set('mode', 'hifive');
m.on('done', () => m.set('mode', 'walk'));
// hover: stop moving and m.set('mode', 'stand'); leave: m.set('mode', 'walk')
// stairs: use data-variant="stairs" (40×32), put the canvas bottom on the lower creature's surface and
// m.set('liftA', (surfaceY(bobX) - surfaceY(aliceX)) / 4) (or liftB when Bob is the higher one)
```

### `qubit-walker`
| input | type | default | meaning |
|---|---|---|---|
| `mode` | `'walk' \| 'precess' \| 'hop' \| 'stand'` | `walk` | |
| `dir` | `1 \| -1` | 1 | facing / walking direction |
| `since` | number | 0 | local tick at which `precess` / `hop` started |

`state()` → `walk | precess | hop | stand | idle` (`idle` = action finished). `events()` → `'done'` on the
last tick of `precess` (12) and `hop` (6). `exports`: `walkArtPxPerTick: 0.5`, `moveEveryTicks: 2`.

Footer patrol (layout-core): move 4 CSS px when `m.localTick % 2 === 0` (pose changes on even ticks, so
the planted foot never slides); every ~48 ticks set `since`+`precess`, on `done` set `since`+`hop`, on
`done` back to `walk`; flip `dir` at the content-box edges. Canvas top = band 2 top − 56.
Hero pill riser (sections-1): `data-piece="qubit-walker" data-io-mode="stand" data-decorative`.

## Timelines (as built, ticks at 12 fps)

**qubit-pair** (loop 48, poster 20). Each 24-tick half; the second half swaps hopper and squatter.
| tick | Alice (first half) | Bob (first half) | shared |
|---|---|---|---|
| 0–11 | idle, faces Bob, tip L·L·L U·U·U R·R·R U·U·U | mirror (R … L …), faces Alice | link: standing wave (bow up / flat / bow down / flat over 24), r/a phase swaps in place every 6 |
| 7 | blink | blink | |
| 12 | squash (anticipation) | squash | |
| 13 | stretch, air 1, antenna dragged | squash (squat) | link tilts with Alice |
| 14 | air 2, antenna dragged | squash | |
| 15 | air 2 (apex) | squash | **measurement**: both rims + whole link flash on this tick, both antennas snap up |
| 16 | stretch, air 1 | squash | ring r1 around both tips; link straight indigo (agreed) |
| 17 | touchdown | squash | ring r2 (dotted) around both tips (md only) |
| 18 | landing squash | rises | |
| 16–21 | faces viewer, blush from 17 | same | **poster 20** |
| 22–23 | faces Bob again | faces Alice | link relaxes to the wave; antennas stay up until 24 |
| 24–47 | as above with roles swapped: Bob hops 37–41, flash 39, bursts 40–41, blink 31 | | |

sm: 1-px hop held 13–16 (one row of headroom), take-off antenna swept flat, burst r1 only.

**walkers** (loop 48; poster `stand` 2)
- `walk`: pose = tick mod 8. Feet travel ±2 px around one centre column: contact (feet spread) · down ·
  passing · up, twice. Orb dips 1 px only on contact. Antenna trails and springs up one pose after each
  dip. Alice and Bob in lockstep.
- `hifive` (from `since`): 0 Bob turns to Alice · 1 both lean in 1 px · 2 crouch · 3 take-off (antennas
  dragged) · **4 apex: both rims + the whole link flash white on the same tick** · 5 indigo ring r1 on the
  link's middle, twinkles (plus with a white heart) over both heads · 6 ring r2 in night (sinks into the
  ink), fall · 7 touchdown · 8 landing squash · 5–15 smile + blush · 9–20 antennas spin L-U-R-U in mirror
  · 21 Bob turns back · 23 `done`. After 23 (if the mode is left on): idle facing right.
- `stand`: faces the viewer, mirrored sweep, blink 10 and 34.

**qubit-walker** (loop 48; poster `walk` 0 facing right)
- `walk`: pose = floor(tick / 2) mod 8 (6 fps), same cycle as above, mirrored for `dir = -1`.
- `precess` (12): tip L → front → R → back (back bead in cornflower: the far side) at 2 ticks per
  position, then once more at 1 tick per position; eyes follow (left / up / right / up).
- `hop` (6): squash · stretch air 1 (antenna swept flat) · air 2 · air 1 · landing squash (tip overshoots
  right) · settle.
- `stand`: faces the viewer, sweep, blink 22 and 46.

## Physics

No signal ever travels between Alice and Bob. The link never scrolls: it is a standing wave pinned at
both orbs. At every measurement both creatures and the whole link change on one tick; the follow-up
bursts are symmetric around each creature or centred on the link, never moving from one to the other.

## Deviations from the card (deliberate)

1. Link: standing wave instead of a scrolling wobble (a scroll reads as a message from A to B).
2. Tip bead azure/lilac instead of white (white vanishes on the hero card); white on flash and on the
   footer walker's blue-band modes.
3. Walk: 8 poses with ±2 px strides (12 fps walkers, 6 fps walker) instead of 4 frames, so the planted
   foot is stationary at the card's ground speeds (1 and 0.5 art px/tick). Feet are two-tone.
4. `walkers.hifive` adds a shared hop with the flash at its apex; `qubit-walker` adds `stand` (design
   §5.1 pill riser). The walker's 14-row canvas has no headroom, so the hop drags the antenna flat.
5. `walkers` adds the `stairs` variant and `liftA/liftB` (the 28-px Alice→Bob spacing spans two to three
   staircase steps at lg; a single 16-row canvas cannot stand both on the surface).
6. Eyes are 1×2 in md (rows 8–9 of the box); flash keeps the shadow rim in the light key so the
   silhouette survives on paper.

## Critique rounds

**Round 1 (first sheets).** 1-px dot eyes read vacant → tried 1×2, blush, smile side by side
(`sheets/faces.png`): 1×2 eyes one row lower are far cuter. White antenna tip invisible on card →
per-creature light beads. Full-white flash made the creatures vanish on card → shadow rim stays light.
Stretch body read as a pill capsule → rounder egg map. Sparkles near the tips looked like stray pixels →
symmetric ring bursts. Link scroll would imply travel → standing wave.

**Round 2 (close-ups `close-*.png`).** Walk: the swinging foot hid behind the orb for whole poses and the
creature looked like it was on a pogo stalk → orb rides high except at contact, two-tone feet with the
near foot drawn on top, fixed a foot-offset bug. Antenna lag tuned. Walkers' high-five didn't read (16 px
apart, 1-px lean) → shared crouch-hop-flash-land arc, Bob turns to Alice, smiles, mirrored spin.
Measurement-to-idle snapped four things on one tick → staggered (link and faces at 22, antennas at 24).
Bob's antenna base jumped when facing front → `mirror` separated from `face`.

**Round 3 (full loops, ink, sm, live frames).** r2 burst on ink was a bright halo ("angel") → r2 drawn
dotted so it dissipates on both grounds. sm r2 clipped at the top edge → r1 only; sm take-off antenna
clipped → swept flat, 1-px hop held. Walker precess tips were hard-coded white → back bead cornflower.
Azure bead nearly invisible on the blue band → white for footer modes. Rim transitions cleaned (top
`LLMM`, right side mid run lengthened, upper-left corner pixel lets the fill through on the lit side).
Hero stairs geometry problem found → `stairs` variant.

## Acceptance checklist

| # | criterion | result |
|---|---|---|
| C1 | `npm run validate -- qubit-pair walkers qubit-walker`: palette-only, ≤ maxColours, exact loop, poster in loop | **pass** (0 errors; 13/13/9 colours; ≤ 0.02 ms per frame for the uncached pieces) |
| C2 | reads at 1× and 4×, on paper and ink | **pass** (1× strips in `qa/sheets/*.png`; ink sheets; real grounds in `sheets/*.png`) |
| C3 | light upper left, no pillow shading, no banding, no stray orphans | **pass with note**: validator warns on orphans / L-corners. They are the rim's diagonal steps of a 10 px / 8 px circle (standard midpoint circle; removing the L-corners creates orphans and vice versa), the 1-px sm eyes, blush, tip beads, and the deliberately alternating r/a link dots. None are stray. |
| C4 | loop seam invisible | **pass** (47→0 and 23→24 checked on `close-pair.png`; validator frame(48)=frame(0)) |
| C5 | live frames match the timeline ±1 tick | **pass** (`live/*`; the capture tool samples every ~90 ms so it skips a tick now and then; order and durations match) |
| C6 | poster meaningful | **pass** (`sheets/posters.png`: pair measured ↑↑ facing you, linked in indigo; walkers standing; walker mid-stride) |
| C7 | white flashes ≤ 1 tick, ≤ 3/s | **pass** (pair: 1-tick flashes at 15 and 39; walkers: one per high-five) |
| 3-1 | Alice blue-rimmed, Bob violet-rimmed, never confused | **pass** (rims + bead colours differ in every frame) |
| 3-2 | mirror sync exact in 3a (rise tick = squat tick) | **pass** (13–17 / 37–41: hopper airborne on exactly the squatter's squash ticks) |
| 3-3 | 3b flash same tick for both | **pass** (tick 4, one frame, both rims + link) |
| 3-4 | no sub-pixel positions | **pass** in the piece (integers only); canvas moves are the sections' job (1 art px steps) |
| — | physics: no travelling signal | **pass** |
| — | reduced motion shows the poster, no change | **pass** (`live/rm-*`: frame 0 vs 11 differ by 0 pixels) |

## Evidence

- Mode sheets on real grounds: `qa/art-qubit-folk/sheets/{qubit-pair,qubit-pair-sm,walkers,qubit-walker,posters,faces}.png`
- Close-ups used in the rounds: `qa/art-qubit-folk/sheets/close-{pair,pair-sm,walkers,walker}.png`
- Engine sheets: `qa/sheets/{qubit-pair,qubit-pair-sm,walkers,walkers-stairs,qubit-walker}[-ink].png`
- Live harness captures (`frames.mjs --zoom 4`): `qa/art-qubit-folk/live/<name>/{contact-sheet.png,anim.gif}` for
  `pair, pair-sm, pair-ink, walkers-walk, walkers-hifive, walkers-stand, walkers-stairs, walker-walk,
  walker-precess, walker-hop, walker-stand, rm-pair, rm-walkers, rm-walker`

Regenerate: `npx tsx src/art/qubit-folk/sheets.ts [all|pair|walkers|walker|posters|faces|close pair|close sm|close walk|close walker]`.

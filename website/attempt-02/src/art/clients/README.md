# clients (art-spec card 13)

Owner: `art-clients` (opus). These are the five audience vignettes for the clients question cell (design §5.6). In
the section they sit on `--ramp-3` blue, so I treated **blue as the main background** and checked paper and ink too.

| Id | Size | Colours | Loop | Poster | Cache |
|---|---|---|---|---|---|
| `client-pharma` | 48×48 | 12 | 48 @ 12 fps | 12 | loop |
| `client-battery` | 48×48 | 12 | 48 @ 12 fps | 12 | loop |
| `client-chem` | 48×48 | 11 | 48 @ 12 fps | 12 | loop |
| `client-dao` | 48×48 | 12 | 48 @ 12 fps | 12 | loop |
| `client-providers` | 48×48 | 12 | 48 @ 12 fps | 12 | loop |

**For sections-2:** mount `client-providers` on the Providers tab, not `fridge-badge`. `fridge-badge` is only
24×24 (96 px), so on its own it would break the 192-px slot and the dissolve. `client-providers` draws the real
`fridge-badge` through its public `frame()`, imported from `../fridge-family`. No pixels are copied and there is
no fallback left, so any polish art-fridge-family makes shows up here.

## Family rules (`shared.ts`)
- Same canvas, loop and poster for all five. Every object stands on ground row 43. A 1-row contact shadow sits on
  row 44: `n` by default, and `s` in providers, whose 12 colours are all taken by `fridge-badge`.
- Light comes from the upper left. Silhouettes get a dark selective outline (`s`) so they read on blue and on paper.
  On ink, the light bodies carry the shape. Mid-tones (`t m c i`) are never used for an edge that touches the
  background, because they sit too close to blue.
- Each vignette has one violet focal element: the Fe atom, the battery wrap, the indigo reagent with its lilac
  catalyst, the bell seal, and the fridge's qubit.
- The **family glint** marks "verified" in every scene. It is a 4-tick twinkle (`a` dot → `w`-core plus → `w` dot →
  `a` dot), and its timing differs per piece so the scenes never pulse in unison.
- No warm colours, no `h`, no `R/F`. No dither on moving parts.

## Timelines as built (ticks, 1 tick = 83 ms)
- **pharma**: A capsule (blue/paper halves, `s` seam) lies on the ground. A hexagonal ring molecule floats above it,
  with a violet Fe atom coordinated to the four side atoms (Fe–N4 pocket). The ring's slanted edges are exact 2:1
  steps. Each bond's middle third shifts 1 px on its own period: 6/8/12 for ring bonds, 16/24 for spokes. The card
  asked for 6/8/10, but 10 does not divide 48. The Fe halo breathes lilac 6 / indigo 3 / lilac 3 (period 12,
  4 fps). The glint lands on the capsule's blue half at 30–33.
- **battery**: An upright cell (metal cap and nub, violet wrap, dark window, 6 bars 8×3). A bar lands at 47, 3, 7,
  11, 15 and 19, each flashing `g` for one tick. That is one tick before the card's 0/4/8 beat, so poster 12 is a
  settled 4-bar frame and not a pop frame. Full hold runs 19–27, with the terminal blinking `w` at 24 and 26 and the
  glint at 23–26. Bars drain top-down at 28, 31, 34, 37, 40 and 43, each dimming through `c` for one tick. The cell
  is empty 43–46.
- **chem**: An Erlenmeyer flask (2:1 cone, `u` glass, white highlight streak, meniscus creeping up the walls) on a
  small stand, holding indigo reagent with a lilac catalyst grain on the floor. A bubble leaves the grain every
  8 ticks (0, 8, … 40), rises 1 px per tick with a 1-px wobble, and pops into a white plus at the surface 5 ticks
  later. After the pops at 5, 21 and 37, a 2-pixel vapour wisp leaves the neck 2 ticks later (4 ticks long). The
  glint lands on the catalyst at 26–29.
- **dao**: A vault (lid slot, rivets, hinges, bevelled round door, violet bell seal) beside a 2-px flagpole with a
  paper milestone flag carrying a violet check.
  - The certificate (8×8) falls from 46 to 1 with spacing 1, 2, 3, 4, lands half in at 2 with a 1-row squash, and
    stays there to 17. The door rim glint runs 3–9.
  - The flag rises 2 px per tick (2–11) and flutters every 3 ticks (12–25).
  - The slot swallows the certificate (18–19). The flag slides down 1 px per tick (26–45).
  - The next certificate appears inside the glint (36–39) and hovers with a 1-px bob (41–43).
  - Poster 12 shows the certificate half in and the flag at the top.
- **providers**: `fridge-badge` runs 18 ticks ahead, so poster 12 shows its own poster (30, ✓). The fridge hangs on
  a cable from a three-puff cloud: a quantum *cloud* provider.
  - The badge flips to ✓ at 4–6 and the glint lands on it at 5–8. It flips back to ? at 28–31.
  - The whole rig sinks 1 px for ticks 24–47, and the shadow widens by 1 px on each side when it is lower.

## Critique rounds
**Round 1 (first drafts, `zoom-*`, `lineup.png`).**
- Pharma: with six spokes, the ring read as an isometric cube wireframe. I compared three versions (none, four,
  six spokes) and chose four side spokes (the Fe–N4 look). The capsule's indigo bottom row was a heavy band and its
  paper half was stacked like geology; I gave it a curved shadow crescent.
- Battery: reads instantly, but poster 12 caught the bar's 1-tick pop. Fixed in round 2.
- Chem: the `b` liquid looked like a hole in the blue cell. I tested `c i a v` side by side, picked indigo with a
  lilac meniscus, and replaced the 5-px plus "catalyst" with a faceted grain.
- DAO: it looked like a grey microwave. It had 15 colours, the bell read as a triangle, and the flag was tiny.
- Providers: the procedural cloud was lumpy and flat-shaded.

**Round 2.**
- DAO: rebuilt with a 24×25 body and hand-drawn ASCII for the door (bevelled rim, lit upper left). Added rivets,
  hinges, a kick plate and feet. The flag became 8×6 paper with a violet check, and the palette came down to 12. The
  first check had two rows swapped and read as scattered dots; I redrew it.
- Providers: hand-drew the cloud ASCII (puff steps 2-1, scalloped notches, `l` underside, `t` base).
- Pharma: spoke stubs inside the Fe halo made orphan noise, so spokes now start at the halo radius.
- Battery: bars land one tick early (inside the ±1-tick tolerance) to keep the poster clean, and draining bars dim
  through `c`. Dropping `m` kept it at 12 colours.

**Round 3 (blue frame sheets, dissolve, silhouette, lineup).**
- The capsule glint was invisible on the white cap, so I moved it to the blue half.
- The chem glint floated in the air beside the neck. I moved it onto the catalyst, then retimed it from 36 to 26 so
  it no longer lands on the same tick as a pop.
- I added the vapour wisp so the flask has a second, slower beat.
- The providers shadow narrowed as the rig came nearer the ground; I inverted it.
- Pharma's molecule moved (-2, +2) so the vignette reads as one group, not two corners.
- Silhouettes are distinct at 1×. Greyscale keeps light, mid and dark groups apart. The dissolve between every
  tab-order pair is clean, with no halos.

## Evidence (`qa/art-clients/`, every file opened)
- `lineup.png`: posters at 4× on blue, paper and ink, plus 2× and 1× strips. `silhouette.png`: greyscale value check
  and 1×/2× silhouettes. `dissolve.png`: `g.dissolve` steps 0–4 for each tab-order pair, on blue.
- `<id>-blue-sheet.png`: all 48 frames on blue. `zoom-<id>-t12.png`: posters at 8×.
- Node sheets: `qa/sheets/<id>.png` and `<id>-ink.png`.
- `live-<id>/`: 48 harness frames at zoom 2 on blue (`contact-sheet.png`, `anim.gif`), plus
  `live-client-providers-ink/` and `live-client-chem-paper/`.
- `rm-<id>/`: `rm=1`, 6 frames 500 ms apart. Each set is a single distinct image, the poster.
- Tools: `render.ts` (`node_modules/.bin/tsx qa/art-clients/render.ts all | zoom <id> [tick]`) and `orphans.ts`.

## Validator notes
All five pass `npm run validate` with 0 errors and frame times between 0.02 and 0.08 ms. The warnings are deliberate:
- **Orphans** are highlight pixels: the atoms' `e`, the capsule's rim `c`, the rivets, and the bell `r`. They also
  include the diagonal steps of 1-px curve outlines, which the 4-neighbour rule counts.
- **L-corners** are the corners of solid 1-px outlines: the cap ellipse, the door, the cloud base and the flag. They
  are not lines drawn with `g.line`.

# glitch-cells · six failure icons (art-spec card 12)

Owner: `art-glitch-cells`. Files: `index.ts` (pieces, timing, `bindGlitch`), `parts.ts` (ASCII maps).
Used in Cost (`#cost`, design-spec §5.4 A): one 16×16 icon (64 px) top-left in each of the six cells.

| Id | Cell | Drawing | g1 | g2 | Loop | Idle offset | Colours |
|---|---|---|---|---|---|---|---|
| `glitch-noise` | Noise | TV with rabbit ears, frozen snow (`t l e` on `s`), knobs, azure LED; selout outline `m` lit / `s` shadow | snow reseeds, right ear knocked flat | 2-px band (y 9–10) tears 2 px right | 96 | 40 | `s m t l e a` |
| `glitch-drift` | Drift | pressure gauge, needle parked in the blue calibrated zone at 12 | needle at 1 o'clock | needle at 2 o'clock (re-rasterised) | 144 | 70 | `s l t e b k` |
| `glitch-bug` | Software bugs | glossy beetle: `m`/`s` shell, two `l` speculars, `m` legs, `k` only on the shadow edge and split | tripod of legs steps forward | jumps 1 px right, steel after-image | 72 | 30 | `k s m l a t` |
| `glitch-cut` | Corner-cutting | scissors straddling a thread | blades open 2 px wider | blades snap shut, thread parts and sags, snipped piece drops | 120 | 60 | `t s l b c` |
| `glitch-mask` | Classical stand-ins | blank porcelain mask on a strap; selout outline `t` lit / `m` shadow | eye slits light azure ("something quantum in there") | mask slips 1 px off its strap, slits go empty: nobody behind it | 168 | 90 | `e l m k t a` |
| `glitch-crack` | Fraud | modelled token: `g` lit rim, `b` rim lower right, `c` shadow crescent, `w` 2×1 specular at 10 o'clock, raised slot | 1-px raspberry crack | crack widens to 2 px, right half shifts 1 px | 192 | 50 | `g a c b w R` |

The idea is "a wrong answer looks exactly like a right one": each icon looks completely normal, twitches for two frames, then is back as if nothing happened. `R` (alert) appears only in `glitch-crack`, and only in its two glitch frames. No `w` is used anywhere, so there are no white flashes. The largest change in any frame is the 8×6 snow reseed.

## Timeline (12 fps, `ticksPerFrame: 1`, `cache: 'none'`, poster 0)

- **Idle (default):** static. Every tick draws the same frame. The poster (tick 0) is that frame.
- **One glitch** (d = ticks since trigger): `d=0` g1 · `d=1` g2 · `d=2` base. The glitch takes exactly 3 ticks: two visible glitch frames, then back to base on the third.
- **Triggers** (`frame()` is pure, so the hover-enter tick arrives as an input):
  - `hover || focus` with `hoverAt ≥ 0` → one glitch starting at local tick `hoverAt`. It repeats only if the pointer stays for a whole loop (6–16 s).
  - `hover || focus` without `hoverAt` → fallback: a glitch at ticks ≡ 12, 13 (mod 24), i.e. every 2 s while hovered. This drives the harness `?hover=1` and plain bindings. Every loop is a multiple of 24, so the cadence is seamless.
  - `idle: true` (opt-in, default false) → one unprompted glitch per loop at the offset above. Loops differ per icon, so the six cells never twitch in unison.
- `events()` fires `'glitch'` on each g1 tick.

## Section API (for `sections-1`)

```ts
import { bindGlitch } from '../art/glitch-cells';      // also on getPiece(id).exports.bindGlitch
const m = mountedOf(cell.querySelector('[data-piece]'))!;
bindGlitch(m, cell);           // pointerenter / focusin on the whole cell → exactly one glitch, on the next tick
m.set('idle', matchMedia('(hover: none)').matches);   // optional: touch screens never hover
```
`bindGlitch` stamps `hoverAt = localTick + 1`, so g1 is the first tick drawn after entering. It tracks its own enter state, so another `hover` listener cannot swallow the stamp. It does nothing under reduced motion.

## Process: contact sheets and critique rounds

The standard `npm run sheet` renders default inputs only (the static idle). So `qa/art-glitch-cells/sheet.ts` renders each icon as base · g1 · g2 · t2 on paper, then on ink at 4×, plus 1× and 2× on card and ink, plus a family strip at 1×, 2× and 4×.

- **Round 1** (`rounds/round1.png`):
  - Static read as a brick wall.
  - Gauge rim was a noisy `l/t` checker, and the azure zone was invisible on platinum.
  - Bug vanished on ink; g1 was not implemented.
  - Scissors had malformed "cloud" handles and no thread.
  - Mask read as a robot or skull, and the strap looked like a rod.
  - Coin read as a gem (octagon plus diamond emblem).
- **Round 2** (`round2.png`):
  - TV got a knob strip and an LED, which reads as a TV. The full-row tear in g2 now reads strongly.
  - Gauge zone moved to `b`, which reads.
  - Scissors got clean ring handles and a thread. But the shut blades hid the snip.
  - Mask looked angry (slanted 2×2 eyes plus mouth), and the dark "reveal" sliver looked like hair.
  - Coin with concentric rings and `¤` read as a target.
- **Round 3** (`round3.png`):
  - Hand-tuned round discs (13/11/9, segments 5-2-1-1-2-5) replaced the octagonal midpoint circles in the gauge and coin.
  - Coin now has a slot emblem and reads as a coin.
  - Mask became an egg shape with slit eyes, no mouth and empty eyes on the slip. It now reads as a mask.
  - Bug legs moved to `s`, which shows on ink. Snow redrawn with no vertical same-tone runs.
  - Problems found: mask far too light on paper (its `p` face equals the page); detached leg pixel in the bug's g1; `h` snip invisible.
- **Round 4** (`round4.png`):
  - Mask face changed to `e`, so it separates from the page.
  - Bug step rebuilt as a proper tripod.
  - Snip piece drawn in thread colour `t`.
  - TV g1 antenna twitch added. Problem found: the bent ear had a 1-px gap.
- **Round 5 / final** (`round5-final.png`):
  - Ear redrawn as a clean 2:1 line.
  - Strays removed: an isolated `s` in the snow, a lone right-elytron highlight (now a 2-px streak), and the two coin edge-crescent tips.
  - Remaining validator "orphan" warnings are deliberate 1-px diagonal lines (antennae, legs, blades, outline steps), snow specks, gauge ticks, TV knobs and the beetle's specular point. Zero strays.

Standard sheets (idle; they prove the stillness): `qa/sheets/glitch-{noise,drift,bug,cut,mask,crack}{,-ink}.png`.

## Live evidence (`qa/art-glitch-cells/`)

Build (inside attempt-02): `BP_ONLY=glitch-cells npx vite build --outDir .qa/art-glitch-cells`.

- `capture.mjs` → `live-report.json`, `live/*.png` and `live-hover-montage.png`. It reads the live canvas every rAF for each icon. Results:
  - **idle:** 37 ticks, 1 distinct frame.
  - **hover** (via `bindGlitch` on the stage): `0:g1 1:g2 2:base 3:base …`, exact.
  - **reduced motion:** poster only, 1 draw, even when hovered.
  - **`?hover=1`:** glitches at ticks 12 and 13 (mod 24).
  - **`?idle=true`:** glitches at the icon's offset and offset+1.
  - Console clean.
- `frames-glitch-{noise,crack}-hover1/`: 36 frames from `tools/frames.mjs`, with glitch frames captured live.
- `harness-all/frame-000.png`: all six at real page size (64 px) on card.

## Deviations from the card (deliberate, for legibility)

- **Drift:** the ring is an `s` bezel with an `l`/`t` inner rim, not a bare `l` ring, which vanished on paper. The calibrated zone is `b`, because `a` on platinum was illegible. Ticks are `t`.
- **Corner-cutting:** blades are `l`/`s`, because `t` is the thread. The snipped piece is `t`, not `h`, which is invisible on paper.
- **Classical stand-ins:** the mask face is `e`, not `p`, which equals the page colour. It is 12×11.
- **Software bugs:** legs and antennae are `s`, not `k`, so they show on ink. Overall 13×13 including legs; the body is 9×8.
- **Noise:** the tear shifts the whole 2-px band, case included, not only the snow. Inside the snow it was invisible.
- **Additions:** the antenna twitch in noise g1, and the empty eye slits in mask g2. The opt-in `idle` input and the fallback cadence are additions too; idle stays static by default.
- The fallback (plain `hover` without `hoverAt`) repeats every 2 s rather than once per enter. `bindGlitch` gives the exact once-per-enter behaviour.

## Revision 1 (attempt-02, after QA: revision-1.md G1/G2)

- **G1 · `glitch-crack`:** replaced the flat disc with a hand-drawn modelled token (`COIN` in `parts.ts`):
  - `g` lit rim on the upper left and `b` rim on the lower right;
  - a `c` shadow crescent inside the lower right;
  - a `w` 2×1 specular at 10 o'clock;
  - a raised slot (`g` lit left, `c` right), shortened to rows 5–9.
- **G2 · selective outlines.** `k` is kept only where a silhouette or detail needs it: the gauge needle and hub, the beetle's shadow-side edge and elytra split, the mask's eye holes.
  - TV: outline `m` on the lit side, `s` on the shadow side; knobs, base and feet `s`; no `k`.
  - Mask: outline steps up to `t` on the lit upper left.
  - Gauge and scissors were already outlined in `s`.
  - Beetle rebuilt from coordinates (generator kept in the agent scratchpad; maps in `parts.ts`):
    - `m`/`s` modelled shell with `l` speculars on both elytra;
    - `m` legs and antennae, so it reads on ink;
    - `k` on the right and bottom edges only.
- **Critique rounds** (`qa/art-glitch-cells/rounds/`):
  - `rev1-round1.png`: TV and beetle improved. But the coin's `w` specular touched the top of the slot and read as a "7", and the beetle was still faint on ink at 2x.
  - `rev1-round2.png`: specular moved left and slot shortened, so the "7" is gone. A second specular and more lit `m` on the shell make the beetle read on ink at 1x, 2x and 4x.
- **Checks:**
  - `npm run validate`: 0 errors; only the TV snow warns (deliberate).
  - At most 6 colours in every state; `R` only in the crack's glitch frames.
  - Every piece is pure under `t + period`, so engine task E9 (absolute ticks) needs no change here.
  - Standard sheets regenerated on paper and ink: `qa/sheets/glitch-*`.
- **Live:** `qa/art-glitch-cells/live-report.json` and `live-hover-montage.png` (base · g1 · g2 · base).
  - Hover via `bindGlitch`: `0:g1 1:g2 2:base`.
  - Idle: static. Reduced motion: poster only. `?hover=1`: glitches at ticks 12 and 13 (mod 24). `?idle=true`: glitch at each icon's offset.
  - Console clean.

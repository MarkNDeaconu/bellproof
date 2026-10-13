# Integration notes (collected by the lead from art agents' reports)

Section agents and the integrator: read this, plus each piece's `src/art/<folder>/README.md`, before mounting a piece. Where a README and the art-spec disagree, the README describes what was actually built.

## Decisions by the lead
- Hero choreography cycle: **20.8 s** (the bands card, as built) replaces design §5.1's "16.6 s".
- `fridge-out` hangs from its top plate instead of standing on row 44. Approved: real dilution fridges hang.
- `tc-rounds`: T is violet (test) and C is blue (compute). The meter fills in 7 steps because the deck sequence has 7 C rounds. Approved.

## Per piece
- **bands** (`src/art/bands/README.md`): `heroStage(root, opts)`, `dusk(root)`, `strata(root)`, `paradoxStage`, `gridlines`. **sections-1:** put the fridge cell *inside* the middle column. Design §5.1's x 1016–1400 overlaps the right rail.
  - md: the cert block sits one module in from the corner, and the diamond rides a corner indigo block.
  - sm: only moves 1 and 5 run.
- **logo-mark** (`src/art/logo-mark/README.md`): `navMark()`, `footerMark()`, `footerReveal({ mark, trigger })` with `overflow: clip` on the trigger row, and `ring()`. Favicon is `public/favicon.svg`, og image is `public/og.png` (layout-core adds the links).
- **fridge-family** (`src/art/fridge-family/README.md`): `fridge-mini` 16×24, `fridge-badge` 24×24 (half the size of the 48×48 client sprites; it can't be scaled up, so lay it out deliberately), `fridge-out` 48×48.
- **tc-rounds** (`src/art/tc-rounds/README.md`):
  - **sections-3:** place labels and `ΔE` from `exports.rows` / `exports.meter`. Show REJECTED when `state() === 'rejected'` (42 ticks).
  - Colour the "Test round" title violet and the "Compute round" title blue.
- **fridge-hero** (`src/art/fridge-hero/README.md`). **sections-1:**
  - Mount with `data-io-intro="-2"` (armed and hidden), then call `set('intro', m.localTick + 1)` to start the scripted intro. Under reduced motion, or when `motion` changes at runtime, call `set('intro', -1)` instead.
  - Drive the temperature labels and the readout from the `cool-1..5` and `ignite` events. Label rows come from `exports.labelRows` [22, 40, 58, 74, 88]; also use `exports.plateLeft`.
  - Spark the floor on `bit-exit`.
- **magic-square** (`src/art/magic-square/README.md`): **sections-3:** mount with `--w:96; --h:64`; pulse the readout's `1` when `state() === 'win'`. **Integrator / perf:** `cache 'loop'` with `period 288` keeps about 7 MB of cached canvases. Check it against the memory budget; consider `cache 'none'` (frame cost is tiny) or fewer rounds.
- **qubit-folk** (`src/art/qubit-folk/README.md`): `qubit-pair` (+`sm`), `walkers` (modes walk / hifive / stand, plus a `stairs` 40×32 variant with `liftA` / `liftB`), `qubit-walker` (walk / precess / hop / stand, `dir`).
  - **sections-3 (CTA staircase):** move the walkers 4 CSS px per tick at 12 fps, not the design spec's 8 fps. For the high-five, set `since` and `mode`, listen for `done`, then switch back to walking.
  - **layout-core (footer walker):** move it 4 CSS px on even `localTick`s only.
  - **sections-1:** use `qubit-walker` `stand` for the hero pill riser.
- **clients** (`src/art/clients/README.md`): `client-pharma`, `client-battery`, `client-chem`, `client-dao`, `client-providers`, each 48×48 and designed for the blue question cell. **sections-2:** mount `client-providers` (not the bare `fridge-badge`) on the Providers tab. **Engine/integrator:** `dissolveTo` is a top-down wipe, not the 4-step dither the spec calls for. Fix it if time allows.
- **glitch-cells** (`src/art/glitch-cells/README.md`): six 16×16 failure icons, static at idle, with a 2-frame glitch on hover. **sections-1 (cost):** call `bindGlitch(mounted, cellEl)` for each Cost cell. It is exported from `art/glitch-cells` and on `getPiece(id).exports`, and gives one glitch per hover or focus. Optionally call `m.set('idle', matchMedia('(hover: none)').matches)` so touch screens get a rare unprompted glitch.
- **cascade-coin** (`src/art/cascade-coin/README.md`, follow its recipe). **sections-1 (cost cascade):**
  - Drive it with `cascadeAt(t, { gap })`, a pure function that returns the position plus inputs `stack`, `wobble`, `belt`, `age`, `fade` and `travel`. `mode: 'story'` plays the cascade in place for small layouts.
  - **Observe the lane element, not the piece's span.** `observe()` keys by element, so observing the span freezes the piece.
  - Set `age` together with `stack`, or new tokens pop in without dropping.
  - Reduced motion: place the piece under bar 5 with `stack = 5`.
- **certificates** (`src/art/certificates/README.md`): `cert-mini` (hero rider) and `cert-mint` (guarantees). The canvases hold no text; VERIFIED / ACCEPTED goes in HTML.
  - **sections-3:** mount `<span data-piece="cert-mint" data-io-stamp="false">`. In the typewriter's `onDone`, call `getPiece('cert-mint').exports.stamp(m)`; the impact follows about 0.42 s later. Reveal `ACCEPTED` on `m.on('impact')`.
- **layer-packets** (`src/art/layer-packets/README.md`): `labBench`, `vault`, `laneLeft`, `laneRight` on one shared 48-tick loop, all with poster tick 12. The `v` variants are upright for stacked layouts.
  - **sections-2:** below 1024 px the pieces scroll into view at different times and drift out of sync. Mount them with `autoplay:false` and drive all four from one observer on the diagram: `seek(12)`, then `play()` together.
- **chain-flow** (`src/art/chain-flow/README.md`; reference driver in `src/art/chain-flow/tools/flow-demo.ts`): `chain-block` (five glyphs), `job-token` (`progress` input; escrow coins ride it through steps 1–6), `magnifier-scroll`, `settle` (honest / cheat, `auto` alternates).
  - **sections-2:** call `clickChainBlock(m)` to get the block drop; setting `click` alone does nothing visible. Also use `resetChainBlock` and `stepOf`.
  - The token overlaps the block gutter at 48 px.
- **icons** (`src/art/icons/README.md`): 28 ids. 13 static (`ui-*`, `social-*`, rendered by `icon()`) and 15 canvases (`cta-*`, `tag-*`, `trust-*`, `tc-glyph`, `question-block`, `check-scale`). Helpers: `hoverable()`, `bumpOnce()`, `morph()`, `MORPHS`. `icons.css` gives opt-in `data-hop` pixel-step hovers. Use `ui-external-sm` (5×5) inside buttons.
  - **sections:** CTA cells use `hoverable(cell, mounted)`; the paradox band calls `bumpOnce(mounted)` on enter; the clients accordion uses `MORPHS.chevronToDown`.
  - Put icons on whole CSS px; no `vertical-align: middle`.

- **wall-to-lock** (`src/art/wall-to-lock/README.md`): two mini fridges behind a brick wall become one fridge with a padlocked question. Loop 120, poster 73. **sections-3:** drive the caption with `piece.exports.labelAt(localTick)`, which returns `'physical' | 'cryptographic'`. It flips at ticks 39 and 108, and the `'label'` event fires on those ticks.

## Integrator queue (cross-cutting fixes collected from reports)
1. **Engine `fx.ts` `dissolveTo`:**
   - It is a top-down wipe, not the spec's 4-step dither.
   - The incoming sprite shows unclipped on its first tick.
   - The swapped mount never stops when off screen.
   - sections-2 wrote an ordered-Bayer mask dissolve in `clients.ts`; consider moving it into the engine.
2. **Engine `[data-reveal].in`** ends on `clip-path: inset(0)`, which clips focus rings. sections-2 works around it on `transitionend`. Fix it globally.
3. **Layout-core `.acc__head + .acc__panel`** breaks when the button sits inside an `<h3>`. Support `.acc__item.is-open`.
4. **Engine `blocks.ts` fixes by art-bands** (choreo deltas, staircase ceil, enter stagger) need review.
5. **magic-square cache memory** (~7 MB): review.
6. **Validator:** the doubles warning fires on the font `0` glyph. Exempt glyph parts.
7. **`npm run sheet`:** add `--all` or `--from/--to`. `hydrateIcons`: read `data-variant`.
8. **Fonts:** consider self-hosting the 5 latin woff2 files (layout-core README §5).
9. **Section CSS:** remove `vertical-align` on icons (e.g. `flow.css` `.flow__cite`); use `.link--icon`.

## Section notes as built
- **sections-2:**
  - The layer diagram is horizontal only from 1280 px and stacks below that, at most 640 px wide; its centre column is 1.1fr.
  - Clients auto-advance every 6 s; below 1024 they become an accordion.
  - Flow: the token moves in 4 px steps.
10. **Engine/bands `Stage`:** the first ResizeObserver `layoutAll()` overwrites the `enter()` start positions. sections-1 hides the stage until `intro()`; fix it at the source.
11. **Content `top.alt.fridge`** says "gold". The fridge is silver/azure; fix the string.
12. **No-JS:** the skeleton hero copy is hidden before mount, so no-JS users see an empty hero. Consider a `<noscript>` style or inlining the final hero markup (helps LCP too).
13. **Hero:** the peek walker's antenna tip crosses the ticker's "job". Line 1 of the H1 clears the fridge labels by only 7 px at 1440.
- **sections-1 as built:** lg hero geometry only at ≥1440; below that it uses md geometry. `window.__bp.sections.top.replay()` re-runs the intro.
14. **Content:** add strings for `ΔE` (meter label) and `REJECTED`. They are temporary `PENDING` constants in `verify.ts`.
15. **Rollup constant-folding gotcha:** a property set through a `forEach` helper was folded (`ctl.m` read became `"physical"`). sections-3 now reads the mount from the DOM. Watch for this pattern elsewhere.
- **sections-3 as built:**
  - Verify extras sit in a strip across each row. Sprites drop to U=3 or U=2 where U=4 doesn't fit; at 1024 the tc-rounds row is U=3 while the others are U=4.
  - The CTA headline wraps to 3 lines at 1024.
  - The cert-mint canvas sits 56 px over the card top.

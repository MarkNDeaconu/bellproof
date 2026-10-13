# Bellproof website · attempt-02 (revision 1)

A pixel-art marketing site for Bellproof, in the pitch deck's blue-and-violet visual language. It is a self-contained Vite 6 + TypeScript project with no runtime dependencies. attempt-02 is attempt-01's source with revision 1 applied (`../research/briefs/revision-1.md`). attempt-01 is frozen. Team rules are in `../TEAM.md`, and the layout and section contract in `README-layout.md`.

## Run

```
npm run build && npx vite preview --port 4302     # serves dist/ on http://localhost:4302  ← the final serve
```

**GitHub Pages (project site at `https://<user>.github.io/<repo>/`).** Publish `dist/` as is. With `base: './'`, every built URL is relative: `./assets/…`, `./fonts/…`, `./favicon.svg`, CSS `../fonts/…`, and in-page anchors are bare `#id`. The source's `/fonts/…` references are Vite's public-dir idiom and are rewritten at build time. This was verified by serving a copy of `dist/` from a sub-directory (`qa/integration/subpath.json`).

Other commands:
```
npm run dev -- --port 52NN    # dev server; renders pixel-identically to the build (qa/integration/parity.json)
npm run typecheck             # tsc --noEmit (clean)
npm run validate              # 67 pieces: palette, exact loops, posters, purity, timing, tokens.css (0 errors, 21 warnings)
npm run sheet -- <piece-id> [variant] [--bg ink] [--from t --to t] | --all   # contact sheets → qa/sheets/
BP_ONLY=bands,icons npx vite build --outDir .qa/<agent>      # only these art folders (nav's helpers included since R2)
BP_SECTIONS=top,trust npx vite build --outDir .qa/<agent>    # only these sections (+ nav, footer)
```
Do not run `npm install`. `node_modules` is complete for build, typecheck, validate and preview. The capture tools are in `../tools` (`shoot.mjs`, `frames.mjs`, `serve.mjs`, with Playwright 1.62). The integration probes are in `qa/integration/`.

The preview harness is `preview.html?piece=all` (index), `?piece=<id>` (one piece) or `?piece=bands-stage`.

## What changed since attempt-01

**Revision 1, from the owners (see `../research/briefs/revision-1.md` §1–§2):**
- **Originality.** Six devices that read as borrowed were replaced by Bellproof-native ones:
  - The strings toy became the **domain ledger** (cells checked one by one).
  - The pill moved above the H1, and its tile flips ?→T→C on hover (no peek).
  - The hero yoyo became the **T/C shuffle that settles to a verdict** (no arc, no diamond, no riders).
  - The Bloch sphere became the headline's **full stop**.
  - Verify now uses **numbered figure frames** instead of a tab card and mosaics.
  - Clients now uses a **segmented control** (no bar, no auto-advance).
  - The footer now has **our module grid, a stepped strata profile, and a bell lowered on its cable** (the hero fridge's bookend), with Alice and Bob arriving on either side.
- **Length.** The trust closing and chip are cut, as are flip's table, cost's error cells and history strip, and the guarantees footnote and transcript CTA. The flow section was compacted.
- **New features:**
  - Pause-motion toggle (persisted in `localStorage['bp-motion']`).
  - Self-hosted OFL fonts with metric-matched fallbacks.
  - A hero that is visible without JS and has an `html.intro`-gated intro.
  - An enriched fridge.
  - Lazy section mounting (E5).
  - Absolute ticks for uncached pieces (E9: the fridge can't vanish).
  - The new art: `round-tile`, the `tc-glyph` sm/hover variant, the `question-block` flicker, `ui-pause` and the `cta-*` lg variants.

**Integration (R2, this pass).** Every change is logged with an `integrator R2` comment in the source.

| # | File | Change |
|---|---|---|
| q15 | `engine/mount.ts` | `buildCache()` idle job returns early if the mount was destroyed (no `null[0]` throw) |
| q5 | `engine/grid.ts`, `engine/mount.ts` | grid→RGBA through a packed 32-bit lookup, plus a reusable `ImageData` for synchronous draws: **~16× faster**, byte-identical (`qa/integration/toimagedata-bench.txt`) |
| q16, q1 | `engine/engine.css` | the reveal's hidden state applies only under `html.js`; bottom inset `calc(100% + 12px)` (no 12 px strip) |
| q17 | `engine/fx.ts` | `reveal()` / `countUp()`: the disposer is declared before `observe()` can call `play()` synchronously (TDZ) |
| q13 | `engine/blocks.ts`, `engine.css` | the engine's diamond/staircase canvases are `.bp-band`, not the site's `.band` |
| E6 | `engine/clock.ts` | with only tick subscribers, wake one frame *after* the tick boundary: sprites-only pages run at **12 rAF/s** (was ~25) |
| q2, q9 | `art/registry.ts`, `sections/nav.ts` | `artExport()` reads the registry's module map (`artModule()`), so `BP_ONLY` covers nav's bands/logo-mark/icons helpers; there is no separate glob |
| q10 | `art/logo-mark/ring.ts` | `footerReveal` resumes its frame subscriber only while its trigger is visible |
| — | `sections/footer.ts` | the bell scrub follows passive scroll events instead of a display-rate frame subscriber (the page end was at 120 rAF/s, now 12) |
| — | `sections/flow.ts` | the 12 fps idle tick parks once the token has arrived and `settle` is stopped; the next scroll wakes it |
| — | `sections/verify.ts` | the caption poll observes the figure's art box, not the whole panel (it ticked while the piece was stopped) |
| q18 | `styles/grid.css` | the grid-on-colour rail lines follow the hero rule 128/96/64, so the CTA band's verticals continue into the footer strata at every width |
| q8 | `styles/sections/layer.css` | 1280–1439: 24 px side padding and 35 % side cells: "Quantum clouds" fits on one line, and the clients body fits on two |
| q6 | `content/strings.ts` | `nav.playMotion` documented as unused (the toggle keeps the name "Pause motion"; only `aria-pressed` flips) |
| CD | `styles/tokens.css` | `--sec-pad-top` 160 → 120 at lg: every section opens on the rhythm trust/flip/cost already used (−200 px) |
| CD | `sections/flip.ts`, `flip.css` | paradox band verticals sit on the hero's rail lines (the stacks' inner edges) instead of crossing the stacks; hidden below 1024, where they crossed the headline |
| CD | `index.html` | JS-off shell: no attempt-01 violet mosaic in `#verify`, no right-hand button in the clients head, the bell placed at its JS position |
| CD | `styles/components.css` | removed the dead tab-card, progress-bar vertical-tab, accordion and mosaic rules (153 lines; the removed devices no longer ship in the CSS) |

**User requests (R2, relayed by the lead):**

| Request | Change |
|---|---|
| No event references | The pill now reads "One job, two providers: see who gets paid" (short label "See who gets paid") and links to `#flow`. The footer's "Built at …" item and the sub-footer's "Built at … by …" line are gone. The event and `[Team]` placeholders are out of `PLACEHOLDERS`. The two dev pages (logo-mark demo, icons specimen) are updated too. `content.md` is updated. `og.png` was checked and has no such text, so it is kept. `dist/` grep: none. |
| Founder credit | `index.html`, `strings.footer.credit` and `footer.css` add one credit row between the footer columns and the sub-footer (it also removes the doubled 2 px hairline that sat there). The text is "Built by **Mark Deaconu**, a computer science PhD student at EPFL working on the foundations of quantum computation and complexity theory.", with mono links (each with ↗) to markdeaconu.com, Google Scholar, GitHub and arXiv. The footer's Project column now reads "Founder: Mark Deaconu", and the meta author is set. There is no advisor name and no email address (`[Contact email]` stays), and no papers were added to the research list. |
| Hero height | `top.css`: the frame (and the first-paint shell) is `round(down, clamp(720px, 100svh − 72px, 920px), 8px)` from 1440, and `clamp(672px, …)` at 1200–1439, so a 1280×720 screen still shows the whole floor. The text keeps 64 / M/2 + 16 padding, with one step tighter inner spacing on screens under 880 px tall. Results: 1440×800 → 728 (strip peeks 24 px), 1440×900 → 824 (28), 1280×720 → 672 (0), 1920×1080 → 920, 1366×768 → 696, 1536×864 → 792. The stacked layouts (< 1200) are unchanged: text card, then the 480/512 px fridge stage (`herofit.json`). |

The owners' own changes are listed in `qa/integration/HANDOFF.md` (engine E1–E12) and in each `qa/<owner>/INDEX.txt`.

## Definition of done (revision 1 §3), measured on this `dist/`

| Line | Result | Numbers |
|---|---|---|
| Page height ≤ 14 000 px at 1440 | **FAIL** | 17 693 px (attempt-01 21 823, so −18.9 %; it includes the taller hero and the credit row the user asked for). 390: 26 178 (target ≤ 20 000) |
| Hero text < 600 ms cold | pass | first pixels 254–287 ms, half the line 321–345 ms at 6 widths; 4× CPU 366–378 / 429–438 ms; CLS 0 everywhere |
| 0 rAF when nothing animates | pass | 5 of 39 sweep spots have no piece playing: all 5 at 0 rAF and 0 clock subscribers. With sprites only: median 12 rAF/s (E6 asks ≤ 14) |
| Fridge never vanishes (60 s) | pass | 31 samples over 60 s: opaque pixels 23 808–36 256, never 0 |
| Pause toggle works and persists | pass | live: 0 rAF at 39 spots; persisted boot: 0 rAF at 39 spots; `aria-pressed` true after reload; resume restarts |
| Dev and build render identically | pass | 0 differing pixels in all 39 frames at 1440 / 1024 / 390 (reduced motion), equal heights (17 693 / 22 032 / 26 178) |
| Console clean at every width | pass | 1920 1440 1280 1200 1024 768 390, plus reduced motion, paused and every probe |
| axe 0 violations | pass | axe-core 4.10.3 (the qa-a11y copy): 0 at 1440, 768 and 390, and at 1440 and 390 under reduced motion |
| Originality | pass | live DOM: 0 strings toy, 0 pill peek/pill bar, 0 arc/arc dot, 0 diamond (hero and paradox), 0 mosaic/tab card/progress bar; clients does not auto-advance (10 s); footer bell at x = 232 at 1440, not centred; no yoyo (stacks loop forward, per the owner's 60 s sheets) |
| `vite preview` serves `dist/` | pass | `npm run build && npx vite preview --port 4302` |
| Works under a sub-path (GitHub Pages) | pass | `dist/` copied to `…/bellproof/` and served from the parent: `/bellproof/` at 1440 and 390, plus `/bellproof/preview.html`. 0 non-200 requests, 0 requests outside `/bellproof/`, all 5 font faces loaded, console clean, the nav anchor keeps `/bellproof/#flow` |

## Evidence index (`qa/integration/`)
- `final-{1920,1440,1280,1200,1024,768,390}-{full,step-NN}.png`, `final-console.txt`: `shoot.mjs --full` of `dist/`
- `final-rm-{1440,1024,768,390}-*`: reduced motion. `r2-paused-{1440,768,390}-full.png`: persisted pause. `r2-nojs-{1440,768,390}-full.png`: JavaScript off
- `frames-{top,verify,cta,footer}/`: `frames.mjs` contact sheets and GIFs (hero intro from load, Magic Square, CTA walkers, footer arrival)
- `intro/`, `intro-cpu4/`: hero text timing from navigation (video, 12 fps sheets, `intro.json`), measured with `../sections-1-hero/intro.mjs`
- `r2-probe.json`: idle rAF sweep (39 spots), paused live and boot, toggle, mounts, overflow, no-JS, axe, walkers, fridge 60 s, live originality and persisted-pause shots. The script is `probe.mjs`. Images: `r2-pause-on-1440.png`, `r2-fridge-60s-1440.png`, `r2-walkers-end-1440.png`
- `review/`: the creative-director pass, with before/after crops (layer 1280–1439, paradox lines, section seams, CTA→footer lines, the hero's right stack)
- `parity.json`, `parity/`: dev vs build frames and diffs (`parity.mjs`)
- `toimagedata-bench.{ts,txt}`: grid→RGBA conversion before/after
- `herofit.json`, `herofit-<w>x<h>.png`: the hero at 10 viewports (1440×800/900/760, 1280×720, 1920×1080, 1366×768, 1536×864, 1200×800, 1024×768, 390×844) at the verdict, with frame height, strip peek, floor/pair/cert/tiles in view, text-to-floor gap, 8 px grid and fridge/labels in the frame (`herofit.mjs`)
- `credit-{1440,1280,1024,768,390}.png`: the page end with the founder credit row
- `subpath.json`, `subpath-{index-1440,index-390,preview}.png`: the GitHub Pages sub-path check (`subpath.mjs <parent> bellproof`)
- helper scripts: `heights.mjs`, `anatomy.mjs` (section heights and paddings), `seams.mjs`, `el.mjs` (element shots), `end.mjs` (page end), `subs.mjs` (live clock subscribers)
- the earlier engine evidence: `HANDOFF.md`, `engine-r1.*`
- owner evidence: `qa/<owner>/INDEX.txt` (layout-core, sections-1-body, sections-1-hero) and the per-owner folders

## Known issues
- **Page height misses the target.** It is 17 693 px at 1440 (target 14 000) and 26 178 at 390 (target 20 000). Revision 1's cuts hit their per-section targets (trust 940, cost 1 885), but the sections with no height target are still long. At 1440: verify 3 607 (rows 1 990, papers 1 074), flow 2 078, layer 2 047, guarantees 1 754. Reaching 14 000 needs another ~3 700 px of content cuts, which is the lead's call. Candidates, with px at 1440:
  - the layer with/without table (~810)
  - the verify rows' sub-notes (~450)
  - the papers list shown as compact rows (~400)
  - the flow "Why commit, then reveal?" note (~225)
  - the guarantees closing line (~145)
  - the layer closing lines (~245)
- At M = 64 (768–1199 stacked hero), the round tiles fill their 64 px blocks edge to edge, as specified (inset (M − 64)/2 = 0), so the right stack reads as two pale tiles. A 12×12 tile variant would fix it (art-icons).
- With JavaScript off, the sections below the hero are layout-core's skeleton shells (headings and leads, with empty stage cells). The hero, nav and footer text render.
- `sections/cta.ts` (`art/bands`, `art/icons/motion`) and `sections/flow.ts` (`art/chain-flow`) still import art folders directly, so `BP_ONLY` cannot exclude those folders when the CTA or flow section is built.
- The engine `stripe()` keeps its opt-in `arc` option (`.strata__arc`). It is unused on the page.
- Screenshots that owners captured before the user requests (in `qa/<owner>/`) still show the old pill text in their pixels. Regenerate them or leave `qa/` out of the public repo.
- Placeholder links (`[Demo link]`, `[GitHub]`, `mailto:[Contact email]`, …) are inert until `content.md` is filled. Social icons ship only once links exist.
- The hero's lower bound at ≥ 1440 is 720 (lead's value), so a 1440×760 screen cuts the floor by 8 px. At 1280×720 the floor sits exactly on the viewport bottom, so the strip doesn't peek there.

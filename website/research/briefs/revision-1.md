# Bellproof website · revision 1 (post-QA)

> **Read first (lead, 2026-10-12):** revision 1 is applied in **`website/attempt-02/`**, a copy of attempt-01's source taken on 2026-10-12.
> - **`attempt-01/` is FROZEN.** It is read-only for every agent: no edits, no builds into it, no `.qa` output inside it.
> - QA evidence paths in this file such as `qa/qa-layout/...` refer to `../attempt-01/qa/...`.
> - Build and capture everything in `attempt-02` (`npx vite build --outDir .qa/<agent>` inside attempt-02). Evidence goes in `attempt-02/qa/<agent>/`.
> - The engine agent's partial E-task edits from before the pause were copied into attempt-02. Continue them there.


Owner: Fable (creative director + integrator). Status: **final; owners start now.** Inputs: the seven QA reports in `attempt-01/qa/qa-*/findings.md` (11 blockers/highs, 43 majors, 90 minors, deduplicated here) and the lead's decisions (originality: comply; length: cut 30–40 % keeping the story order; lg hero from 1200; a pause-motion toggle; self-hosted fonts; drop the confirm footnote; enrich the fridge; final serve `vite preview`).

Evidence paths are relative to `attempt-01/qa/`. Priorities: **P0** blocker (ship-stopper), **P1** major (a judge notices), **P2** minor (a craftsperson notices). Every task has an acceptance check QA can re-run. Where this document and a QA report disagree, this document wins.

---

## 0. The revision in one paragraph

Same site, edited and made ours. The page loses a third of its height without losing a beat of the story (cloud today → quantum → the cost of being wrong → the layer → who it's for → contracts → how we verify → the certificate → CTA). Six Mistral-shaped devices are replaced by Bellproof-native ones: the strings toy becomes the **domain ledger**; the pill moves above the headline and its tile **flips ?→T→C** on hover; the hero's rails become a **T/C shuffle that settles to a verdict** (no diamond, no riders, no arc, no yoyo); the Bloch sphere becomes the headline's **full stop**; verify gets **numbered figure frames** instead of a tab card and mosaics; clients gets a **segmented control** (no bar, no auto-advance); the footer gets our **module grid, an unequal stepped strata profile, a bell that is lowered on its cable (the hero's bookend) and the CTA walkers arriving under it**. The fridge is enriched. Fonts are self-hosted. Motion can be paused.

Target numbers: page height ≤ 14 000 px at 1440 (was 21 823), ≤ 20 000 at 390; hero text visible < 600 ms on a cold production load; 0 originality Highs; Lighthouse A11y 100.

---

## 1. New designs (specified so owners don't guess)

### 1.1 Hero (sections-1 + art-bands + art-icons)

**Geometry rule (resolves the spec conflict):**
| Range | Rails M | Fridge cell | H1 | Structure |
|---|---|---|---|---|
| ≥ 1440 | 128 | 384 | 88/88 | lg: rails both sides, text left, fridge cell right, floor row |
| 1200–1439 | **96** | **320** | **72/72** | lg-narrow: same structure (blocks 96 = 12 B, half 48) |
| 768–1199 | 64 | full width | 64/64 (3 lines) | **stacked** (the sm structure): text block, then a 480 px fridge cell with the floor row |
| < 768 | 64 | full width | 40/44 (4 lines) | stacked |
The 1440 jump (qa-layout #7) disappears; the md breakage (#6) disappears because md is the stacked structure.

**Composition changes (originality #4, all four):**
1. **No orbit arc, no arc dot.** Delete `.arc` and `.hero__arcdot` from the hero. Registration dots stay only at the rail-stack tops.
2. **The sphere is the full stop.** The H1 reads `Verified quantum / computation, / settled on-chain◉` — `bloch-inline` sits where the final period was, on the baseline (`vertical-align: baseline; margin-left: .06em`), 16×16 (64 px) at lg, `sm` 11×11 at < 1200. The `.vh` copy keeps "settled on-chain." Nothing inline after "Verified".
3. **Rails only; no floor blocks, no riders, no diamond.** Left rail: a 3-stack (violet, indigo, blue). Right rail: a 3-stack (indigo, blue, cornflower) whose blocks each carry a centred **round tile** (`round-tile` piece, §1.9). `qubit-pair` stands on the floor beside the left stack at x = M (`sm` variant below 1440); `cert-mini` stands on the floor at the right, x = W − M − 96, no block under it. F1/F2/R1 and the diamond are removed from the hero (the diamond stays on the paradox band).
4. **The T/C shuffle replaces the yoyo** (choreography data in `art/bands`, cycle 14.4 s = 173 ticks, loops forward, never reverses; moves 0.8 s power4InOut quantised to 4 px; both stacks move on the same frames in opposite directions):
   - 0.0 s · three `?` tiles shimmer (idle).
   - 1.0 / 1.8 / 2.6 s · top, middle, bottom tiles flip to `T`, `C`, `C` (the verifier's schedule); the block behind a `T` pulses one step darker for 2 ticks.
   - 4.2 s · **shuffle move 1**: right stack rises 1 M (a new `?` block emerges from the reservoir) while the left stack sinks 1 M; during the move every tile flips back to `?`.
   - 5.8 s · **shuffle move 2**: right stack sinks 1 M while the left stack rises 1 M (restores the layout).
   - 7.6 s · hold, three `?` ("what the provider sees").
   - 9.1 s · **verdict**: tiles flip to `✓` (azure face) top→bottom 2 ticks apart with a 1-tick `w` flash each; both stacks' blocks go one ramp step lighter for 2 ticks.
   - 11.6 s · tiles dither-fade (4 ticks) back to `?`; hold to 14.4 s. Loop.
   - sm/md: same cycle on 2-block stacks. Reduced motion: the verdict frame (tiles `T C C`… no: `✓ ✓ ✓` is the poster).
5. **Intro (visible by default; motion-perf #2, exp #14, motion #10/#11):** the final hero markup ships in `index.html` and is visible with no JS. An inline `<script>` in `<head>` adds `html.js` and, only when `!document.hidden && !matchMedia('(prefers-reduced-motion: reduce)').matches && !localStorage bp-motion==='paused'`, `html.intro`. CSS hides intro elements **only under `html.intro`**. `top.ts` starts the timeline on `DOMContentLoaded` (not rAF), waits ≤ 300 ms for fonts, and has a fail-safe: if `is-text` is not set by 1 500 ms, call `finishStatic()` (everything visible, idle starts). New timing: H1 line 1 at **200 ms** (stagger 120 per line, lines rise as whole lines: one `--i` per line), lead 560, buttons 700, pill 300 (it is above the H1), fridge lowers 100→1000, cool 1000→1500, ignite 1500, blocks enter 700→1700, ticker types at 1900. Remove the double `--d` offset; apply `is-landed` on `transitionend`.
6. **Fridge arming (pixel #1, layout #1):** the engine now passes the **absolute** local tick to `cache:'none'` pieces (§3 E9). Mount with `data-io-intro="-2"`, then `set('intro', m.localTick)`; never `+1`; on reduced motion `set('intro', -1)`.
7. **Ticker:** one `inline-block` with `white-space: nowrap` for the last word + cursor; reserve the ticker's final box height/width (`min-inline-size` from the string's measured width via `ch`); `illustrative` visible from the first typed character; cursor blinks 3 cycles then stays (engine typewriter, §3 E2).
8. **Pill (originality #2):** moves **above the H1** as a compact announcement: height 40, radius 20, 1 px hairline, padding 4 12 4 4, bg `--card`; left a **32×32 square tile** (no radius, no clip) holding `tc-glyph` variant `sm` (8×8 → 32 px); label `h6`; trailing chevron. Hover/focus: the tile **flips ?→T→C→?** (icons I3, `io.hover`). No peek, no walker. Below 1200 the same pill, label `top.pill.labelShort` ("Built at [Hackathon] 2026"). **No full-width pill bar at any width.** The pill is the first element of the text column (margin-bottom 24).
9. **Labels at sm (a11y #3):** `.hero__labels` above the stage (`z-index: 2`), label text on a `--card` background, and the sm left stack is 2 blocks (never reaches row 88).
10. Research strip: 6 cells at ≥ 1200; 3 + 3 at 768–1199; 2 columns below (label spans). Venue text `text-transform: none`. `.hero-strip { border-bottom: 0 }` (the trust seam draws the line).

### 1.2 Trust → "the domain ledger" (sections-1; replaces the strings toy, originality #1)
- Eyebrow, h2, lead centred as today (`min-height` removed; padding-top 160 → 120).
- **Ledger strip** (new Part A, 24 px below the lead): a `.cells` row of 6 cells, 96 px tall (sm: 2 columns × 3 rows), each `[8×8 tag icon 32 px] [h6 domain name] … [mono tag at the right]`. On entering the viewport the cells are **checked one by one**, left to right, one every 4 ticks: a 7×7 `ui-check` in `--blue` stamps into the right slot (1-tick `w` flash on the cell border), the cell's bg goes `--card`. Hover/focus re-stamps that cell. No strings, no knots, no drag, no scatter. Icons keep their 2-frame idle. Reduced motion: all checked.
- Part B: the 4 cells (Check it / Re-run it / Test it / Prove it) unchanged, with `<h3 class="h4">` (a11y #9).
- **Cut** Part C (closing line) and Part D (running-example chip). Section height target ≤ 950 px at 1440.
- Mono tags on the ledger cells (strings `trust.ledger[i].tag`): `CHECKED BY HASH`, `CHECKED BY EVAL`, `CHECKED BY RE-RUN`, `CHECKED BY BACKTEST`, `CHECKED BY RE-RUN`, `CHECKED BY PROOF` — content agent may tighten.

### 1.3 Flip and cost cuts (sections-1 + content)
- **Flip:** keep eyebrow/h2/lead + `fridge-out` cell, the question cell + 2 stacked cards, the paradox band. **Cut Part C** (the "Every classical check breaks." table). Exponents: `2<sup>100</sup> ≈ 10<sup>30</sup>` with `sup { font-size: .5em; vertical-align: .6em; letter-spacing: -.05em }` (exp #8, content #2); formulas `white-space: nowrap`, cards stack at < 1200 (layout #9). `fridge-out` gets a `tag-illustrative` under it (content #5). Paradox band padding 96; display 72 at lg; the violet stack sits in the left rail area, never under text (a11y #19); the `?` block **flickers** on enter (icons I2) instead of bumping.
- **Cost:** keep eyebrow/h2/lead, the 6-cell grid, the cascade (h3, body, 5 bars max height 240 at lg, horizontal bars at sm per exp #20, linear heights 48/96/144/192/240), the 3 stats + sources + the closing line "Candidate A's ΔE… worth verifying." **Cut** the FP/FN cells and the entire history strip (h3, 3 cells, sources, closing). Stats: `10–15 years` count-up from 10 (content #1) or static; captions bottom-aligned (`grid-template-rows: 1fr auto`); 3 columns at md (layout #31). Section height target ≤ 1 900 px at 1440.

### 1.4 Verify (sections-3; originality #5, three changes)
1. **Numbered figure bar instead of the tab card:** above the rows, a `.cells` row of 3 (`01 Nonlocal games` / `02 Compiled with encryption` / `03 Hidden test rounds`), 64 px tall, `num-l`-sized mono number + `h6` label; the active cell has a 4 px `--ink` top bar and ink text, others `--text-muted`; sticky at `top: 49px` at lg only; `role=tablist` with arrow keys; clicking scrolls. Same at every width (no md strip, no accordion).
2. **No alternating sides:** every row is copy left (5/12) / panel right (7/12); below 1200 copy then panel. Row min-height 400.
3. **Figure frames instead of mosaics:** panel = `--paper` cell holding a **frame**: 1 px `--hairline-strong` border, four 4 px registration dots on the corners, the sprite centred on a `--card` plate (16 px padding), and a mono caption bottom-left inside the frame: `FIG. 01 · THE MAGIC SQUARE GAME`, `FIG. 02 · PHYSICAL VS CRYPTOGRAPHIC SEPARATION`, `FIG. 03 · HIDDEN TEST ROUNDS` (strings `verify.rows.*.fig`). The tc-rounds row keeps U = 4 at ≥ 1200 (the 7/12 panel is ≥ 560 px); at 768–1199 the panel is full width.
- Research list: first column 128 px (layout #8, exp #9). Tablist `aria-labelledby` the h2 (content #13, a11y #20). Alts from strings via `<figure role="img" aria-label>` (content #3).

### 1.5 Clients (sections-2; originality #6, a11y #6)
- Header: eyebrow + h2 + lead left; **no right-hand button** (the "Talk to us" link moves below the panel as a `.link--icon`).
- **Segmented control** (`role=tablist`): one `.cells` row of 5 cells, 56 px tall; each `[5×5 icon 20 px] [h6 label]` inline; active: `--card` bg, ink, a 2 px `--blue` bar along the **top** edge; inactive: `--paper`, `--text-muted`. Below 1024: the row scrolls horizontally (`overflow-x: auto; scroll-snap-type: x mandatory`, cells `min-width: 200px`), no accordion.
- **No fill bar, no auto-advance, no hover pause.** Arrow keys and clicks only.
- Panel: at lg two cells side by side, `align-items: stretch` (blue question cell 7/12, light cell 5/12, equal heights; exp #6); below 1024 stacked. On tab change: the sprite swaps with `dissolveTo`; the copy swaps **in place** (replace text nodes inside the same cells with a 150 ms opacity fade on the text wrapper only), so no background flash (exp #5). Eyebrows share a baseline (layout #25). Providers tab mounts `client-providers` (content #17). `.clients__panel:focus-visible { outline-offset: 2px }`; accordion rules removed.

### 1.6 Flow (sections-2; exp #7)
- Step rows 96 px (sm 80); step cards 4 px bar + 12 20 padding; chain blocks **hug** the card edge (16 px gap) inside a 80 px gutter; the spine 1 px `--hairline-strong`.
- **Token:** `job-token` gets an azure face variant? No art change: the section draws a 2-px `--ramp-1` wake (a 4 × 24 px vertical trail div behind the token, fading over 6 ticks) and the card's bar flashes `--ramp-1` for **3 ticks with a 2 px outer glow** on click. Keep 4 px steps.
- Step numbers visible at sm (content #10); gutter 64 at sm (layout #26); `illustrative` inline after step 1's aside (content #6); the note's citation from `flow.note.cite` (content #8); drop `target=_blank` (a11y #15); a space text node before tags (content #12).

### 1.7 Nav and mobile menu (layout-core + content; originality #7/#8, exp #18)
- Desktop: `| logo | Why verify | How it works | Contracts | Who it's for | Research | … | ⏸ Pause motion | Contact | ▶ Watch the demo |`. "Get in touch" → **"Contact"** (`strings.nav.contact`). The **pause cell** (§1.10) sits before Contact.
- md (768–1023): `| logo + wordmark 160 | … | ⏸ | Contact | ▶ Watch the demo | ⣿ 48 |`.
- sm: `| bell 48 | Bellproof wordmark cell (flex 1, left-aligned) | ⣿ 48 |`. No dark CTA cell in the bar.
- **Open menu:** the header row becomes `| bell | Bellproof | × 48 |` (no "MENU" label). Then a **CTA row** of two half-width buttons: `▶ Watch the demo` (primary), `Contact` (outline). Then rows **`01 Why verify` … `05 Research`**: mono 14 number in `--blue`, `h5` label, 56 px, **no chevrons**; the active section's row shows a 4 px `--ink` left bar (scroll-spy). Last row: the pause-motion toggle (`aria-pressed`). Focus trap, Esc, inert, scroll lock stay.
- Scroll-spy re-queries targets after sections mount (layout #14); `.nav--compact` via ResizeObserver at 200 % text zoom (a11y #13); forced-colours rule (a11y #14).

### 1.8 CTA cells and footer (sections-3 + layout-core + art-bands; originality #3/#9)
- **CTA cells:** a `.cells` row of 3 where **each cell is the link** (`.cell--link`, ink scope): `[cta-* sprite 12×12 → 48 px]` left, `h4` title + body right, `ui-external`/`ui-chevron` bottom-right; height auto (~160), no ghost buttons, no pinned bottoms; hover bg paper 8 %; the `cta-*` hover gag plays on cell hover. Then one centred primary-on-dark **"Contact"** button. Headline: `text-wrap: balance`, display 80/80 at 1024–1199 (layout #10). Grid-on-colour on the CTA band uses §1.8 footer grid (no 48/80).
- **Footer:**
  - Columns: padding 40 (layout #22), `<h2 class="small">` labels (a11y #21), links `display: inline-block` with a focus ring (a11y #1), capped at 1728.
  - Sub-footer: **one row**, 120 px: socials (if any) left, tagline centre, copyright + "Built at…" right. No void.
  - **The bell hangs.** `footerMark` (240×220, ink) hangs from the sub-footer's bottom hairline on a 1 px cable 24 px long at **x = content-left + M** (not centred), its skirt overlapping the strata's top by 40 px. **Reveal:** scrub-lowered on its cable from above the line (clip by a wrapper spanning the sub-row and the strata, `overflow: clip`), 20 px steps; it is the hero's fridge in bookend form. **Ring** once when the walkers arrive under it (below). Reduced motion: hanging, still.
  - **Strata** (`art-bands` `strata()` redrawn as one canvas at B = 8, full width, 256 px): the **top edge descends** left→right in 8 px steps every 1/8 of the width (y 0 → 56), continuing the dusk staircase's fall; paper above the edge. Bands below the edge: blue **72**, cornflower **56**, azure **48**, mist the rest (so blue is 72 at the left and 16 at the right). **No arc. Grid:** verticals at the content-box edges and at the two rail lines (content-left + M, content-right − M) only; horizontals at the three band seams only; ink 10 %. Export `surfaceY(x)` (multiples of 8).
  - **Walkers arrive:** `walkers` (`walk` mode) enter from the left on the strata's top edge (feet at `surfaceY(x)`), 4 px/tick at 12 fps, stop centred under the bell (`stand`, antennas sweep), the bell rings once per visit when they stop, they stand 6 s, walk off right, re-enter 10 s later. No `qubit-walker` patrol (keep the piece; it is unused on the page).

### 1.9 New / changed art (art-icons, art-bands)
- **`round-tile`** (art-icons): 24×24 (variant `md` 16×16) with `io.face: '?' | 'T' | 'C' | 'ok'` and `io.flip: tick` (a 2-frame narrow flip at the given tick), `io.shimmer`: `?` face `h` with `t` glyph (5×7 / 3×5), `T` face `v` + `w` glyph, `C` face `b` + `w` glyph, `ok` face `a` + `k` ✓, 1 px `l` outline, `w` 1-px specular top-left. `cache: 'none'`, pure under + period.
- **`tc-glyph`**: add variant `sm` 8×8 and `io.hover` → frames `?→T→C→?` (2 ticks each, narrow-flip transitions).
- **`question-block`**: `io.flicker: tick` replaces `bump`: glyph cycles `? T C ? T C ?` at 2 ticks each, face pulses `h→u→h`; no vertical motion.
- **`cta-play/code/book`**: add variant `lg` 12×12 (48 px).
- **`ui-pause`** 5×5 (two 2-px bars) for the toggle (play state uses `ui-play`).
- **bands:** `heroStage` new layouts (§1.1 3–4), `heroChoreo` = the T/C shuffle, tile mounts inside right-stack blocks (`.rider` centred: inset (M − 96)/2 at M 128, (M − 64)/2 at 96/64), `strata()` per §1.8, `paradoxStage` floor anchored to the band's bottom (`bottom: 0; height: 2M`), dots fade 300 ms, sm blocks enter from below the floor, hero.ts `finish()` on the current build and height changes < 8 px ignored (motion #3).

### 1.10 Pause-motion toggle (engine + layout-core + content; a11y #5)
- Engine: `motion.paused` (user), `motion.setPaused(bool)` → `motion.force(true | null)` + `localStorage['bp-motion'] = 'paused' | ''` in try/catch, `motion.onChange` fires; read at boot before any mount. `data-motion="reduced"` applies in both cases.
- UI: nav cell `<button class="nav__cell nav__pause" aria-pressed>` with `ui-pause`/`ui-play` + label `strings.nav.pauseMotion` / `playMotion`; a mobile-menu row (§1.7); optional hero corner link omitted. `aria-pressed="true"` while paused.

### 1.11 Fonts (layout-core; motion #1, content #2/#11)
Self-host under `public/fonts/`, all OFL: Space Grotesk 500, IBM Plex Sans 400 + 500, JetBrains Mono 400 + 500, as **full woff2** files from the projects' GitHub releases (not Google's latin subsets: we need `⁰¹³≈≤←→λΔ…`); budget 400 KB total, `font-display: swap`, `<link rel=preload>` for Grotesk 500 and Mono 400, fallbacks `local('Helvetica Neue'), Arial` with `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override` tuned so the H1 and body don't shift (measure with the capture at 1440: ΔCLS ≤ 0.02). Remove the Google links. Exponents still use `<sup>` (§1.3). If a woff2 lacks a glyph, fall back to `<sup>`/HTML entities, never to Menlo.

---

## 2. Per-owner task lists

Format: `id · Pn · task · acceptance · evidence`.

### engine / integrator (fable) — wave R0, blocks everyone
- **E1 · P0 · Stage: measure before placing blocks; re-layout on real size changes only (≥ 8 px height or any width), never during the first callback; pending re-layout applied when no sequence is playing.** Acceptance: paradox blocks visible at 1920/1440/1280/1024/900/800/768; md floor blocks present and stable through a cycle. Evidence: `qa-layout/crops/sheet-paradox.png`, `qa-motion-perf` #3/#4, `qa-experience/paradox-1440.png`.
- **E2 · P1 · Typewriter: unsubscribe when typed; cursor blink by CSS `steps(2)` for 3 cycles; `.vh` full text + `aria-hidden` typed span (no `aria-label` on a span).** Acceptance: 0 rAF/s with nothing animated in view; axe clean. Evidence: `qa-motion-perf` #5, `qa-a11y` #8.
- **E3 · P1 · Clock: fire `onTick` for every folded tick (cap 6).** Acceptance: a 250 ms stall never loses a `cool-k` label. Evidence: `qa-motion-perf` #6.
- **E4 · P1 · `observe()` keeps a Set of visibles per element with per-registration disposers.** Acceptance: trust ledger stamps and the cascade both run when two observers share an element. Evidence: `qa-motion-perf` #7.
- **E5 · P1 · Boot chunking: nav + top mount synchronously; other sections mount on an IO (`rootMargin: 800px`) or idle chunks; skeleton placeholders are never mounted; mounts whose element leaves the document are destroyed.** Acceptance: mobile emulation TBT < 600 ms; 0 orphan mounts (`allMounts().every(m => m.el.isConnected)`). Evidence: `qa-motion-perf` #9, #17.
- **E6 · P2 · Clock schedules the next frame at the next tick boundary when only tick subscribers exist.** Acceptance: ≤ 14 rAF/s with only sprites live. Evidence: `qa-motion-perf` #19.
- **E7 · P2 · Symmetric quantisation (round half away from zero).** Acceptance: 0 anti-correlation breaks in 3 000 frames at md/sm. Evidence: `qa-motion-perf` #13.
- **E8 · P2 · `server.watch.ignored` for `qa/`, `.qa/`, `dist/`.** Acceptance: idle dev CPU < 3 %. Evidence: `qa-motion-perf` #16.
- **E9 · P0 · Absolute local tick for `cache:'none'` pieces; validator purity check `frame(t) == frame(t + period)` for sampled t; engine-spec §4 text.** Acceptance: fridge never vanishes over 60 s without scrolling (opaque pixels never 0). Evidence: `qa-pixel/hero-vanish/timeline.txt`, `qa-layout/crops/sheet-fridge-vanish-1440.png`.
- **E10 · P1 · Pause-motion API + persistence (§1.10).** Acceptance: toggling stops every canvas, choreography and the cursor within one tick; survives reload. Evidence: `qa-a11y/motion.json`.
- **E11 · P2 · Validator orphan heuristic ignores glyph pixels and single sparkles.** Acceptance: ≤ 10 orphan warnings across 64 pieces. Evidence: `qa-pixel/validate.txt`.
- **E12 · P2 · Frame caches as `ImageBitmap` where available (fallback canvases); engine barrel ≤ 12 KB gzip.** Evidence: `qa-motion-perf` #20, #22.
- **E13 · P1 · Integration: build, five-width captures, console, keyboard walk, originality re-check, README.**

### content — wave R0 (strings before sections start)
- **CO1 · P1 · Apply the cuts** (§1.2, §1.3; also guarantees: drop the footnote and "See a sample transcript"): remove `trust.closing`, `trust.example`; `flip.table`; `cost.errors`, `cost.history`; `guarantees.footnote`, `guarantees.cta`. Keep them in `content.md` under a "Cut in revision 1" heading and the confirm footnote as a `<!-- TODO -->` comment. Evidence: `qa-experience` #2, #4; `qa-content` #19.
- **CO2 · P1 · New strings:** `nav.contact` "Contact"; `nav.pauseMotion` "Pause motion" / `nav.playMotion` "Play motion"; `top.pill.labelShort`; `trust.ledger[6]` (name, tag); `verify.rows.{games,compiler,rounds}.fig`; `verify.tabs` numbers; `clients.talk` link label "Talk to us"; `cta.contact` "Contact"; `flow.note.cite`; `footer.tagline` unchanged; menu row numbers are derived.
- **CO3 · P2 · Copy fixes:** layer rows capitalised without stops (#9); compiler pronoun (#15); curly quotes/apostrophes site-wide (#16, layout-core mirrors `index.html`); `clients.tabs[4].piece = 'client-providers'` (#17); `og:image` → `[Site URL]/og.png` + `og:image:alt` (#18); `count.from = 10` hint on stat 3 (#1); "gold" in `content.md` (#14).
- Acceptance: `qa/layout-core/check-static-strings.ts` passes; `qa-content` extraction shows no cut string on the page.

### art-icons — wave R0
- **I1 · P1 · `round-tile`** (§1.9). Acceptance: four faces legible at 1× on paper and ink; flip 2 frames; pure under + period.
- **I2 · P1 · `question-block` flicker replaces bump.** Evidence: `qa-originality` #10.
- **I3 · P1 · `tc-glyph` `sm` variant + hover flip.** Evidence: `qa-originality` #2.
- **I4 · P1 · `ui-pause` 5×5; `cta-*` `lg` 12×12.**
- **I5 · P2 · `tag-helix` two strands + rungs; `tag-candles` 3 bars + wicks.** Evidence: `qa-pixel` #12 (`montage/tag-icons-wide.png`).

### art-bands — wave R1 (after E1/E9; before sections-1 hero and layout-core footer)
- **B1 · P0 · `paradoxStage` floor anchored to the band bottom.** Evidence: `qa-experience` #1, `qa-layout` #3.
- **B2 · P0 · hero.ts: `finish()` on the current build; ignore height changes < 8 px; `stage.play()` after intro and rebuilds.** Evidence: `qa-motion-perf` #3, `qa-layout` #5.
- **B3 · P1 · New hero layouts** (§1.1 3; lg 128 / lg-narrow 96 / stacked 64; no diamond, no floor blocks, pair and cert on the floor; sm stack 2 high). Evidence: `qa-originality` #4, `qa-a11y` #3.
- **B4 · P1 · The T/C shuffle choreography** (§1.1 4) with `round-tile` mounts. Acceptance: tiles read `T C C` → `? ? ?` → `✓ ✓ ✓` in a 60 s capture; 0 off-grid transforms; the two stacks move on the same frames.
- **B5 · P1 · `strata()` redrawn** (§1.8). Acceptance: top edge descends in 8 px steps; band heights 72/56/48/rest; no arc; grid only at content edges, rail lines and band seams.
- **B6 · P2 · Dots fade 300 ms; sm blocks enter from below the floor.** Evidence: `qa-motion-perf` #12, `qa-experience` #21.
- **B7 · P2 · Paradox poster: violet stack in the rail area, not under text.** Evidence: `qa-a11y` #19.

### art-fridge-hero — wave R1 (after E9)
- **F1 · P0 · Intro keyed on the absolute tick: play once; `intro = -2` hidden, `-1` static.** Acceptance: 60 s capture, opaque pixels never 0; frames 0 and 144 of the idle identical. Evidence: `qa-pixel` #1.
- **F2 · P1 · Enrich** exactly per `qa-pixel` #4: plate volume (stepped rims, deeper undersides `m→s→n`), per-stage detail (pulse-tube head + braids, HEMT LED, stacked circulators, heat-exchanger coils, TWPA box, mu-metal can), light (`a/c` rim light on every plate's right end and the chip's lower-right, `u` frost on the three coldest faces, dithered `r` glow on the chip, `i` reflection on the cold finger), pulses `a/c/b` (not `w/g`), chip as 2×2 Xmon crosses with `l` pads and a `w` specular, 5 frost sparkles. Acceptance: ≥ 14 colours used; pulses visible in the 1× strip on paper; the fridge outweighs the rail blocks in `montage/hero-1440-t5s.png`-style capture. Evidence: `qa-pixel/strips/fridge-hero-*.png`, `montage/hero-1440-t5s.png`.
- **F3 · P2 · Static base layer cached once per intro state; per-tick cost ≤ 0.3 ms.** Evidence: `qa-motion-perf` #14.

### art-wall-to-lock — wave R1
- **W1 · P1 · Recompose at scale** per `qa-pixel` #5 (fridges 24×36, wall 16×40, padlock 14×16, 2-row ground, 5×7 card glyphs; keep the morph). Acceptance: ≤ 35 % empty canvas; reads at 1× beside the Magic Square. Evidence: `qa-pixel/strips/wall-to-lock-full.png`, `insitu2/1440/wall-to-lock-1.png`. **W2 · P2** static layers for per-tick cost.

### art-chain-flow — wave R1
- **C1 · P1 · `settle` cheat: 1-px `R` crack, 1-px split, halves slide (no stripes).** Evidence: `qa-pixel/strips/settle-cheat.png`.
- **C2 · P2 · `post` and `settle` glyphs legible; README states the exact `clickChainBlock` inputs.** Evidence: `qa-pixel/montage/chain-block-modes.png`.

### art-magic-square — wave R1
- **M1 · P2 · Catchlights, ground shadows, card corners, ring sparkle instead of `+`.** Evidence: `qa-pixel/strips/magic-square-loop0.png`. **M2 · P2 · README: cite design-spec, not Mistral.** Evidence: `qa-originality` #11. **M3 · P2 · Static board layer cache.** Evidence: `qa-motion-perf` #14.

### art-glitch-cells — wave R1
- **G1 · P2 · `glitch-crack`: `c` rim, `w` specular, `b` crescent.** **G2 · P2 · Outlines in `s` (selout), `k` only where the silhouette needs it; beetle readable on ink.** Evidence: `qa-pixel/montage/glitch-a.png`, `glitch-b.png`.

### art-tc-rounds — wave R1
- **T1 · P2 · C faces `c` + `w` glyph (or `p` + `l` outline + `b`).** Evidence: `qa-pixel/strips/tc-rounds-clean.png`. **T2 · P2 · static layers.**

### art-layer-packets — wave R1
- **L1 · P2 · Answer pixels `c` head + `a` tail.** Evidence: `qa-pixel/strips/lane-right-strip.png`.

### art-certificates — wave R1
- **Ce1 · P2 · `cert-mint` chain faces as 2-px checker + one `k` pixel; chain on rows 24–36 on a `l` track.** Evidence: `qa-pixel/strips/cert-mint-strip.png`. **Ce2 · P2 · static scroll layer.**

### layout-core — wave R0 for LC1/LC6; R1 for the rest (footer after B5, nav after I4/E10)
- **LC1 · P0 · Self-hosted fonts** (§1.11). Acceptance: no request to googleapis; hero text < 600 ms cold; CLS < 0.05 at 1024 and 390. Evidence: `qa-motion-perf` #1, #8; `qa-content` #2, #11.
- **LC2 · P0 · Hero visible without JS; inline head script sets `html.js`/`html.intro`; 1 KB critical CSS inline (`body` bg, hide `.arc`/`.bell-mark` until styled); SVG `width/height/fill` attributes on the bell and nav glyphs inlined in `index.html`.** Evidence: `qa-motion-perf` #2, #16, #21; `qa-experience` #15.
- **LC3 · P1 · Nav + mobile menu redesign** (§1.7) incl. the pause cell, "Contact", scroll-spy re-query, `.nav--compact`, forced-colours. Evidence: `qa-originality` #7, #8; `qa-experience` #18; `qa-layout` #14; `qa-a11y` #5, #13, #14.
- **LC4 · P1 · Footer redesign** (§1.8): columns, one-row sub-footer, hanging bell + reveal + ring on arrival, walkers driver, bands' strata; link focus rings; `<h2>` labels; 1728 cap. Evidence: `qa-originality` #3; `qa-a11y` #1, #21; `qa-experience` #17, #19; `qa-layout` #22.
- **LC5 · P1 · Pill component** per §1.1 8 (`.pill` 40 px, square 32 px tile, no `.pill--auto`). Evidence: `qa-pixel` #2, `qa-layout` #28.
- **LC6 · P1 · Tokens:** on-blue `--text-soft/--text-muted/--accent-text` → `--on-dark` (a11y #2); `--line-strong` → `#2A3655`; `--text-muted` → `#4F5872` (≥ 6:1) and `.micro` 12 px (exp #16); `text-wrap: balance` on `.display/.h2/.h3`, `pretty` on `.lead/.body` (layout #27).
- **LC7 · P2 · Tables: `content: attr(data-label) / ""`, `aria-labelledby`; `og:image` absolute placeholder + alt; curly quotes in `index.html`.** Evidence: `qa-a11y` #16; `qa-content` #16, #18.
- **LC8 · P2 · Grid-on-colour on the CTA/paradox bands moves to the §1.8 module grid; no doubled lines at 40/48.** Evidence: `qa-layout` #21.

### sections-1 — wave R1 (hero after B3/B4/I1/I3; the rest immediately)
- **S1-1 · P0 · Hero per §1.1** (composition, geometry rule, intro, fridge arming, ticker, pill, labels, strip, seams: `.hero-strip{border-bottom:0}`, sm 2 px line, pill no longer meets the floor, text column ends ≥ M/2 + 16 above the floor, no `.arc`). Remove the Mistral mention in `top.ts:2`. Acceptance: at 1920/1440/1280/1200/1024/768/390: H1 never > 4 lines, nothing overlaps, blocks on the 8 px grid, the shuffle visible, hero text < 600 ms. Evidence: `qa-experience` #3, #10, #12, #14; `qa-layout` #1, #5, #6, #7, #12, #13, #16, #17, #18, #29; `qa-motion-perf` #2, #8, #10, #11; `qa-pixel` #1, #3, #15, #16; `qa-a11y` #3, #4; `qa-content` #4, #7.
- **S1-2 · P1 · Trust → domain ledger** (§1.2). Evidence: `qa-originality` #1; `qa-layout` #2, #11; `qa-experience` #13; `qa-a11y` #9–#11; `qa-motion-perf` #7.
- **S1-3 · P1 · Flip cuts + sup + nowrap + illustrative tag + paradox flicker/stack** (§1.3). Evidence: `qa-experience` #2, #8; `qa-layout` #9; `qa-content` #5; `qa-a11y` #19.
- **S1-4 · P1 · Cost cuts + stats + mobile bars + linear heights + md columns + padding ≥ 40.** Evidence: `qa-experience` #2, #11, #20; `qa-layout` #19, #20, #31; `qa-content` #1.
- **S1-5 · P2 · Headings: `<h3 class="h4">` in cells, `<p class="h3">` for statements; integer sprite positions (inline-block wrappers, integer margins); space text nodes before tags.** Evidence: `qa-a11y` #9, #10; `qa-pixel` #15; `qa-content` #12.

### sections-2 — wave R1
- **S2-1 · P1 · Clients segmented control** (§1.5). Evidence: `qa-originality` #6; `qa-a11y` #6, #7, #18; `qa-experience` #5, #6; `qa-layout` #25; `qa-content` #17.
- **S2-2 · P1 · Flow compaction + token wake + visible click** (§1.6). Evidence: `qa-experience` #7; `qa-layout` #26; `qa-content` #6, #8, #10, #12; `qa-a11y` #15.
- **S2-3 · P2 · Layer: vertical lanes with vertical arrows below 1280; lane labels 8 px off the cells; pieces play only within 200 px of the viewport at 390; `dt.mono` on the type scale; alts from strings; forced-colours; `settle` inside `<figure role="img" aria-label=flow.alt>`.** Evidence: `qa-layout` #23, #24, #32; `qa-motion-perf` #18; `qa-content` #3; `qa-a11y` #14.

### sections-3 — wave R1
- **S3-1 · P1 · Verify redesign** (§1.4) + year column 128 + alts + aria + link padding. Evidence: `qa-originality` #5; `qa-layout` #8, #15; `qa-experience` #9; `qa-content` #3, #13; `qa-a11y` #17, #20.
- **S3-2 · P1 · CTA rework** (§1.8) + headline wrap + grid lines. Evidence: `qa-originality` #9; `qa-layout` #10, #21.
- **S3-3 · P2 · Guarantees: remove the footnote and transcript CTA (strings), integer `cert-mint` position, `.frow__meter` on the scale.** Evidence: `qa-experience` #4; `qa-content` #19; `qa-pixel` #15; `qa-layout` #32.

---

## 3. Dependencies and ordering

```
R0 (parallel, start now):  engine E1–E12 · content CO1–CO3 · art-icons I1–I5 · layout-core LC1, LC6
R1 (after R0 lands):       art-bands B1–B7 (needs E1, E9, I1) · art-fridge-hero F1–F3 (needs E9)
                           other art owners (independent) · layout-core LC2, LC3 (needs I4, E10), LC5, LC7, LC8
                           sections-2, sections-3 (need CO2; S3 CTA needs I4 cta lg) · sections-1 S1-2…S1-5 (need CO1/CO2)
R1b:                       layout-core LC4 footer (needs B5) · sections-1 S1-1 hero (needs B3, B4, I1, I3, LC5)
R2:                        integrator E13: build, captures, originality + a11y + motion re-checks, README; QA swarm re-run
```
Hard rules carried over: no `npm install`; own files only; evidence in `qa/<agent>/`; kill dev servers; `npm run validate` clean before reporting. Art owners re-run `npm run sheet -- <id>` and look. Section owners re-shoot their sections at 1920/1440/1280/1024/768/390.

**Definition of done for revision 1:** every P0 and P1 above closed with its acceptance check; page height ≤ 14 000 px at 1440; `qa-originality` re-run reports 0 High and ≤ 2 Medium; axe 0 violations; motion-perf: hero text < 600 ms cold, 0 rAF when nothing animates, fridge never vanishes; the pause toggle works and persists; dev and build render identically; `vite preview` serves `dist/`.

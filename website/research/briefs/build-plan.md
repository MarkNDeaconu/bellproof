# Bellproof website · build plan (attempt-01)

Owner: Fable. Phases 3 (build) and 4 (QA), the integration steps and the definition of done. Every agent reads `TEAM.md` first, then `design-spec.md`, then its own card(s) in `art-spec.md` or its section(s) in `design-spec.md` §5, then `engine-spec.md`. Every agent ends with the TEAM.md report (what, paths, screenshots looked at, known issues, requests).

---

## 1. Phase 3 roster

| # | Agent | Model | Owns | Builds | Depends on |
|---|---|---|---|---|---|
| E | `engine` | **fable** | `src/engine/**`, `src/main.ts` (layout-core fills `SECTIONS`), `preview.html`, `src/preview/**`, `scripts/**`, `package.json` + lockfile, `vite.config.ts`, `tsconfig.json`, `.gitignore`, `src/art/registry.ts` (auto-discovery, nobody edits), `src/art/placeholder/**`, `README.md` | **DONE (wave 0):** the engine (engine-spec §2–§13), the harness, validator, Node sheet renderer, the `placeholder` piece, the blocks stage API + `bands-stage` demo. Fable returns for integration in wave 4; the four fable art pieces below are separate agents. | nothing (wave 0) |
| C | `content` | opus | `src/content/**` | `strings.ts` (every string in `content.md` §1–§13, typed by section; research list; placeholders verbatim), `meta.ts` | nothing (wave 0) |
| L0 | `layout-core` | opus | `index.html`, `public/fonts/**`, `src/styles/{tokens,base,type,grid,components}.css`, `src/sections/{nav,footer}.ts`, `src/styles/sections/{nav,footer}.css` | the skeleton with all 11 section shells, the token/type/grid/component CSS, the nav (desktop, tablet, mobile menu, scroll-spy), the footer shell (columns, sub-footer, strata via `blocks.stripe`, reveal hook) | E (tokens check), C |
| S1 | `sections-1` | opus | `src/sections/{top,trust,flip,cost}.ts`, `src/styles/sections/{top,trust,flip,cost}.css` | hero DOM + intro timeline + ticker + labels (consuming the `bands` stage API), trust strings/drag, flip, cost (cascade conveyor driving `cascade-coin`, count-ups) | E, C, L0 |
| S2 | `sections-2` | opus | `src/sections/{layer,clients,flow}.ts`, `src/styles/sections/{layer,clients,flow}.css` | layer diagram + lanes, clients tabs/accordion + dissolve swaps, flow swimlanes + scroll-driven token + settle | E, C, L0 |
| S3 | `sections-3` | opus | `src/sections/{verify,guarantees,cta}.ts`, `src/styles/sections/{verify,guarantees,cta}.css` | verify sticky tabs + feature rows + mosaic panels + research list, guarantees (typewriter → `cert-mint.stamp`), CTA band + staircase + walkers driver | E, C, L0 |
| A1 | `art-fridge-hero` | **fable** | `src/art/fridge-hero/**` | card 1 | E |
| A2 | `art-magic-square` | **fable** | `src/art/magic-square/**` | card 5 | E |
| A3 | `art-bands` | **fable** | `src/art/bands/**` (diamond bitmaps, stage layouts, staircase, strata) | card 15 + the hero choreography sequence | E |
| A4 | `art-logo-mark` | **fable** | `src/art/logo-mark/**`, `public/favicon.svg`, `public/og.png` | card 16 | E |
| A5 | `art-bloch-inline` | opus | `src/art/bloch-inline/**` | card 2 | E |
| A6 | `art-qubit-folk` | opus | `src/art/qubit-folk/**` | card 3 (3 pieces) | E |
| A7 | `art-certificates` | opus | `src/art/certificates/**` | card 4 (2 pieces) | E |
| A8 | `art-tc-rounds` | opus | `src/art/tc-rounds/**` | card 6 | E |
| A9 | `art-wall-to-lock` | opus | `src/art/wall-to-lock/**` | card 7 | E, A12 recipe (exported helpers) |
| A10 | `art-layer-packets` | opus | `src/art/layer-packets/**` | card 8 (4 pieces) | E |
| A11 | `art-chain-flow` | opus | `src/art/chain-flow/**` | card 9 (4 pieces) | E |
| A12 | `art-fridge-family` | opus | `src/art/fridge-family/**` | card 10 (3 pieces) + exported `plate()`/`coax()` recipe helpers | E |
| A13 | `art-icons` | opus | `src/art/icons/**` | card 11 (all UI glyphs, tags, CTA/social icons, `tc-glyph`, `question-block`, `check-scale`) | E |
| A14 | `art-glitch-cells` | opus | `src/art/glitch-cells/**` | card 12 (6 pieces) | E |
| A15 | `art-clients` | opus | `src/art/clients/**` | card 13 (4 pieces; providers reuses `fridge-badge`) | E |
| A16 | `art-cascade-coin` | opus | `src/art/cascade-coin/**` | card 14 | E |

Fable agents: E is done. A1, A2, A3 and A4 are **separate Fable agents spawned in parallel** by the lead (each with its own folder and port); the engine agent returns only for integration (§4). A3 builds on `src/engine/blocks.ts` and the `bands-stage` demo (`src/preview/demo-stage.ts` holds the lg layout and the six-move choreography as data).

**Nobody except E edits `package.json`, `package-lock.json` or `src/art/registry.ts`, and nobody runs `npm install`.** Request dependencies in your report.

### 1.1 Waves (what runs in parallel)

```
wave 0  ──  E engine + harness + placeholder ──────────┐      C content strings ──┐
wave 1  ──  (after E) A5 A6 A7 A8 A10 A11 A12 A13 A14 A15 A16  in parallel; L0 layout-core (after E + C); fable: A3 bands
wave 2  ──  (after L0) S1 S2 S3 in parallel, using `placeholder` for any piece not yet landed; fable: A1, A4
wave 3  ──  A9 (needs A12's recipe), fable: A2; sections swap placeholders for real ids as pieces land
wave 4  ──  integration (fable), then Phase 4 QA agents in parallel, then the fix loop
```
Art agents never wait for sections; sections never wait for art (placeholders). The only art dependency is A9 → A12 (recipe helpers), so A12 starts in wave 1 and A9 in wave 3.

### 1.2 Per-agent task statement (paste into each brief)

**Engine (fable).** Implement `engine-spec.md` completely. Ship `preview.html?piece=all` showing the `placeholder` piece, `npm run validate` passing, `npm run sheet -- placeholder` producing a PNG, a hero stage demo in the harness (`?piece=bands-stage`) running the six-move yoyo with quantised transforms. Evidence: harness screenshots at DPR 1 and 2 (Playwright `deviceScaleFactor: 2`) showing crisp edges; a frames capture proving zero rAF callbacks when the stage is offscreen (log `clock.running`).

**Content (opus).** Transcribe `content.md` into `strings.ts` with a `Strings` type mirroring sections and parts (`top.h1`, `top.ticker`, `trust.cells[i].{title,body,tag}` …). Keep placeholders verbatim (`[Team]`, `[Demo link]` …). Include `research[]` with the five URLs. Add a `claims.ts` export listing the ledger rows (content §14) for QA. No layout. Evidence: a `tsx` script that prints every string and a diff of it against `content.md` text (eyeballed).

**Layout-core (opus).** Build the shell to design §3–§4 and §5.11 (structure). All eleven `<section>`s present with ids and tints, filled with eyebrow/h2/lead from strings so the page already reads top to bottom; sections S1–S3 replace the insides later. Nav with scroll-spy and the mobile menu; footer with columns, sub-footer, strata, reveal hook calling `logo-mark`'s `ring()` when available. Evidence: `shoot.mjs` at 1440/768/390 of the skeleton, nav states (`--click` the menu button), focus ring screenshots.

**Sections 1/2/3 (opus).** Implement your sections exactly per design §5 and the strings. Mount pieces by id (use `placeholder` if missing; list the swap in your report). Drive piece inputs per the art cards. Reduced motion per engine §7. Evidence: `shoot.mjs` steps covering your sections at three widths, `frames.mjs` of each animated moment (hero intro: `--frames 48 --interval 83` from load; cascade; flow token while scrolling: use `--steps`), and `--reduced-motion` shots.

**Art agents (opus/fable).** Implement your card(s) in `src/art/<folder>/index.ts` (auto-discovered; do not edit the registry). Work in the harness (`npm run dev -- --port 52NN` from the engine-spec §12 table, or build to `.qa/<agent>` and use `frames.mjs`). Run `npm run validate -- <id>` and `npm run sheet -- <id>` and `-- <id> --bg ink`; **open** the sheets; iterate until the card's acceptance list passes; then capture 24–96 live frames via `frames.mjs` on `preview.html?piece=<id>&zoom=2` and look at them. Write `src/art/<folder>/README.md` with the sheet paths and a frame-by-frame note of the timeline as built. Never touch sections, styles, `package.json` or the registry; never `npm install`. Kill your dev server before you finish.

---

## 2. Phase 4 QA roster

Each QA agent builds to `.qa/<agent>`, captures evidence into `qa/<agent>/`, and files findings as a numbered list with severity (`blocker`, `major`, `minor`), the frame/screenshot path, the spec clause violated, and the owning agent. QA agents fix nothing; the fix loop assigns findings back to owners (or to fable for engine/cross-cutting issues).

| Agent | Model | Reviews | Against |
|---|---|---|---|
| `qa-pixel` | opus | every registered piece in the harness: palette, integer scale at DPR 1/1.5/2 (zoomed crops of edges), loop seam, poster, timeline ticks, light direction, readability at 1×, paper and ink backgrounds | art-spec cards + common acceptance; research 03 §4.7 checklist |
| `qa-layout` | opus | the page at 1440/768/390 (+1024 and 1920): type scale, gutters, module alignment (blocks on the 8-px grid), hairline sharing (no doubled lines), tints sequence, cell padding, nav states, footer | design-spec §2–§5; pixel-measure with zoomed crops |
| `qa-motion-perf` | opus | hero intro timeline, idle choreography (transform sampling per frame: multiples of 4 px), 12 fps tick regularity, reduced-motion behaviour (`--reduced-motion`: no motion over 6 s, posters shown), rAF idle when offscreen/hidden, long tasks, bundle sizes, Lighthouse mobile | engine-spec §5–§7, §13; design §5 motion notes |
| `qa-content` | opus | every visible string vs `content.md`; claims vs the ledger (§14); "Never say" list; placeholders intact; `illustrative` tags present wherever −12.4 / #0412 appear; research links resolve to the five arXiv ids; alt texts | content.md |
| `qa-a11y` | opus | keyboard path end to end (skip link, nav, menu trap, tabs with arrows, accordions, buttons), focus visibility, contrast spot-checks (computed), `role=img`/`aria-label` on canvases, headings order, Lighthouse A11y 100 | design §1 tables, §6 |
| `qa-originality` | opus | side-by-side against `research/mistral/screens/*`: no copied composition, icon, sprite, copy or CSS pattern beyond the ingredient list; palette contains no warm colour; no brand logos | TEAM.md rule 1; design §0 |

---

## 3. Fix loop
1. Fable triages findings: blockers first, then majors; minors batched.
2. Owners fix in their files; cross-cutting fixes by fable.
3. The QA agent that found an issue re-verifies with a fresh `.qa` build and closes it.
4. Two rounds maximum before the lead reviews; anything still open is listed under "known issues".

---

## 4. Integration steps (fable)
1. Confirm `npm run validate` passes with every real piece; `preview.html?piece=all` shows no `placeholder`.
2. Replace any remaining `placeholder` ids in sections with the real ids (grep `data-piece="placeholder"` → 0).
3. `npx vite build` → `dist/`; `shoot.mjs --dir dist --full --widths 1440,1024,768,390` and `--reduced-motion`; `frames.mjs` on `#top` (48 frames from load), `#verify`, `#cta`, `#footer`.
4. Check the console is clean at every width; check bundle sizes against engine §13; run Lighthouse (mobile) via Playwright or `npx lighthouse` if available.
5. Walk the page by keyboard once, by screen-reader order once (headings outline).
6. Write `attempt-01/README.md`: how to run, the agent roster, evidence folder index, known issues.

---

## 5. Definition of done for attempt-01
- All 11 sections built to `design-spec.md` §5 with every string from `content.md`; no `TBD`, no lorem, placeholders only where content.md says so.
- All 16 art cards implemented, registered, validator-clean, each with inspected contact sheets on paper and ink, and live frame captures in `qa/`.
- Hero intro, idle choreography, footer reveal + ring, Magic Square, T/C rounds, flow token and clients dissolve all captured on the real page and inspected.
- Integer pixels everywhere: QA zoom crops at DPR 1, 1.5 and 2 show no soft edges on any sprite or block edge; no fractional transforms on `.px` containers.
- `prefers-reduced-motion`: a 6 s frame capture shows no change; posters visible; no auto-advance.
- Console-clean at 1440/1024/768/390; zero rAF callbacks when the tab is hidden or nothing animated is in view.
- Budgets in engine §13 met; Lighthouse mobile ≥ 90 / 100 / 100.
- Keyboard-complete; contrast per design §1; every canvas labelled or hidden.
- Originality review passed: no Mistral asset, icon, sprite, copy or distinctive composition reused; no orange, yellow, gold or rust anywhere.
- `attempt-01/` builds standalone with `npm ci && npx vite build`; `README.md` present; every agent's report filed.

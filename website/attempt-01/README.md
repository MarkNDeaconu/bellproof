# Bellproof website · attempt-01

A pixel-art marketing site for Bellproof with the layout rhythm of mistral.ai in the deck's blue-and-violet language. Self-contained Vite 6 + TypeScript project, no runtime dependencies. Specs: `../research/briefs/` (`design-spec.md`, `art-spec.md`, `engine-spec.md`, `build-plan.md`, `content.md`, `integration-notes.md`). Team rules: `../TEAM.md`.

## Run

```
npm ci                      # installs vite, typescript, tsx, pngjs (dev only)
npx vite build              # → dist/  (the build QA captured)
npx vite preview            # serve dist/ on http://localhost:4173   ← recommended for the final serve
npm run dev -- --port 52NN  # dev server; renders identically to the build (engine CSS is layered)
```

Checks:
```
npm run typecheck
npm run validate [-- <piece-id>]                 # 64 pieces: palette, exact loops, posters, timing, tokens.css
npm run sheet -- <piece-id> [variant] [--bg ink] [--from t --to t] | --all   # contact sheets → qa/sheets/
```
Capture tools live in `../tools` (`shoot.mjs`, `frames.mjs`, `serve.mjs`); integration scripts in `qa/integration/`.

Harness: `preview.html?piece=all` (index), `?piece=<id>` (one piece, params in engine-spec §9), `?piece=bands-stage` (the hero block choreography).

## Layout
| Path | Owner | What |
|---|---|---|
| `src/engine/` | engine (fable) | palette, Grid, ASCII compiler, glyph fonts, RNG, piece contract, auto-registry, 12-fps clock, tweens, DPR-exact scaling, mount, icons, fx, blocks, validator, `engine.css` (layer `bp.engine`) |
| `src/art/<folder>/` | one art agent each | 16 cards → 64 pieces, auto-discovered (`src/art/registry.ts`, never edited) |
| `index.html`, `src/styles/`, `src/sections/nav.ts`, `footer.ts` | layout-core | shell, tokens/type/grid/components CSS, nav, footer (see `README-layout.md`) |
| `src/sections/<id>.ts` + `src/styles/sections/<id>.css` | sections-1 (top, trust, flip, cost), sections-2 (layer, clients, flow), sections-3 (verify, guarantees, cta) | the 10 content sections |
| `src/content/` | content | every string (`strings.ts`), meta, claims ledger |
| `qa/<agent>/` | each agent | the evidence they looked at |

## Roster
Wave 0: engine (fable), content (opus). Wave 1–3: layout-core, sections-1/2/3 (opus); art: bands, fridge-hero, logo-mark, magic-square (fable); bloch-inline, qubit-folk, certificates, tc-rounds, wall-to-lock, layer-packets, chain-flow, fridge-family, icons, glitch-cells, clients, cascade-coin (opus). Wave 4: integration (fable). Wave 5: QA swarm.

## Evidence index
- `qa/integration/final-{1920,1440,1024,768,390}-*.png` full-page and viewport steps of `dist/`; `final-rm-*` under reduced motion; `*-console.txt` (all clean)
- `qa/integration/frames-{top,verify,cta,footer}/` contact sheets + GIFs of the hero intro (48 frames from load), the Magic Square, the CTA walkers, the footer reveal
- `qa/integration/final.json` placeholder count, keyboard walk, rAF idle, reduced-motion stillness, bundle sizes; `final-focus-*.png`
- `qa/integration/probe-dev-vs-build.json` + `probe-{dev,build}-1024.png` dev and build render identically at 1024/DPR 2
- `qa/integration/base-*` the pre-integration baseline
- `qa/engine/` wave-0 engine evidence (DPR crops, stage transforms, clock verdicts); `qa/sheets/` Node contact sheets for every piece
- per-agent evidence under `qa/<agent>/`

## Integration changes (wave 4)
1. `engine/blocks.ts`: the Stage's ResizeObserver re-lays out only when the size changed (it used to overwrite `enter()` start positions).
2. `engine/fx.ts` `dissolveTo`: real 4×4 ordered-dither dissolve (incoming masked before attach; outgoing gets the complement; the new mount is observed).
3. `engine/engine.css`: reveal clip insets are −12px (no clipped focus rings); all engine rules now sit in `@layer bp.engine` so section CSS wins in dev and build alike (fixes the dev-only hero grid breakage).
4. `engine/mount.ts`: loop caches over 2 MB fall back to per-tick rendering (magic-square).
5. `engine/validate.ts`: the doubles heuristic ignores corners with arms ≥ 2 px (glyphs, boxes).
6. `scripts/sheet.ts` `--all`, `--from/--to`; `icon.ts` `hydrateIcons` honours `data-variant`.
7. `styles/components.css`: `.acc__item.is-open` support.
8. `content/strings.ts`: fridge alt (silver, not gold); `verify.rows.rounds.labels.meter/rejected`; `verify.ts` reads them.
9. `index.html`: `<noscript>` style so the first-paint hero copy shows without JavaScript.
10. `sections/top.ts`: pill peek rises 32 px instead of 40 (antenna no longer crosses the ticker).
11. `styles/tokens.css`: `bp.engine` first in the layer order.

## Known issues
- Fonts load from Google Fonts (OFL); self-hosting the five latin woff2 files is optional (`README-layout.md` §5).
- Placeholder links (`[Demo link]`, `[GitHub]`, `mailto:[Contact email]`, …) are inert until the team fills `content.md`.
- Social icons ship only when links are supplied (footer socials row is empty by design).
- The lg hero geometry applies from 1440; 1024–1439 uses the md geometry (sections-1 decision).
- First dev-server load can take a few seconds while Vite pre-bundles; `vite preview` of `dist/` has no such delay.

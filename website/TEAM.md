# Bellproof website: team brief (every agent reads this first)

> **Status (2026-10-12):** attempt-01 is frozen (read-only). Revision 1 is applied in `attempt-02/`; read `research/briefs/revision-1.md`.

## Mission
Build the marketing website for **Bellproof**. It should be a pixel-art site with the **vibe and layout rhythm of mistral.ai**, in the **visual language of our pitch deck**. The user will judge it and may ask us to start over, so each attempt lives in its own folder (`attempt-01/`, `attempt-02/`, …) and must stand alone. The bar is "fully perfect". Polish, craft and verified quality matter more than speed.

## The product (what the site sells)
Bellproof is a **verification layer, settled by smart contracts**, between people who need quantum answers and the quantum clouds that compute them.
- **Clients:** pharma and biotech, battery and energy materials, chemicals and catalysis, research funders and DeSci DAOs. They send a quantum computation (e.g. a drug-candidate binding energy) and get back one classical number. They cannot check that number themselves without owning a quantum computer.
- **Bellproof** runs **compiled nonlocal games** (the KLVY compiler, Natarajan–Zhang 2023, Holler–Natarajan arXiv:2609.38060, secure under LWE). Hidden *test rounds* are interleaved with *compute rounds*, and the provider cannot tell them apart. A cheater, a noisy run or a fake number fails the tests.
- **Smart contracts:** the client posts a job with escrow; the provider stakes collateral; the challenge keys are committed and then revealed so anyone can audit; the result is either paid with a certificate minted, or slashed and refunded.
- **Tagline candidates** (from the deck): "Verified quantum computation, settled on-chain", "Delegate quantum work. Verify every answer."
- **Running example:** a biotech team computes ΔE for drug candidate A on a ~100-qubit model of an iron-containing enzyme active site.
- **Sources of truth:**
  - The deck slides (HTML, one file per slide): `research/deck/slides/*.html`
  - Market research: `../research/market-research.md`
- **Never invent statistics, customers, partners, quotes or logos.** Use bracketed placeholders like `[Team]` or `[Contact]` when something is unknown.

## Design direction
- **Layout and vibe:** mistral.ai. That means a bordered nav bar with cell dividers, huge confident headlines, generous off-white canvas, thin grid lines, blocky stepped colour bands and pixel diamonds at the edges, small animated pixel-art sprites, logo-strip grids and a strong footer. The research notes in `research/mistral/` give the precise anatomy.
- **Colour:** keep Mistral's scheme structure (off-white canvas, near-black ink, a ramp of saturated accent steps used as blocky bands). **Swap its orange, yellow and red ramp for blues and purples** based on the deck:
  - Deck ink `#0E1424`, ink-soft `#475069`, paper `#F4F2ED`, card `#FBFAF7`, hairline `#DEDBD3`
  - Deck blue `#2F5BEA`, light blue `#8FAEFF`, body-on-dark `#B9C2D6`
  - Extend this with a purple / violet ramp that harmonises with it. The creative director fixes the exact ramp in the design spec.
- **Type (deck):** Space Grotesk for display, IBM Plex Sans for body, JetBrains Mono for data and labels. A pixel font for small accents is allowed if the design spec chooses one.
- **Pixel art subjects:**
  - a superconducting quantum computer (dilution-refrigerator "chandelier": silver/platinum stages in cool metals, coax lines, chip at the bottom; no gold)
  - Bloch spheres
  - entangled qubit pairs
  - the Magic Square game grid
  - test/compute rounds (T/C blocks)
  - blocks, escrow vaults and certificates for the on-chain part
  - **Everything is animated and alive**, like Mistral's sprites.

## Hard rules
1. **Originality.** mistral.ai is a reference for vibe, layout rhythm and technique ONLY. Never copy its logo, illustrations, sprites, images, icons, code, CSS or text. Every pixel and line of code is our own.
2. **Cookie banners on reference sites:** dismiss with the decline/close option (e.g. `--click 'button:has-text("Close")'`). Never "Accept all".
3. **Crisp pixels:** integer scaling only, `image-rendering: pixelated`, no blurry upscaling, no anti-aliased edges inside pixel art. Respect `prefers-reduced-motion` (show a still frame). Keep animations smooth (target 60 fps; sprite animation at a deliberate low frame rate is fine). Never block the main thread.
4. **Verify your own visual work.** Capture screenshots or frames with the tools below, open the PNGs (Read them) and iterate until they look excellent. Never report something as done that you have not looked at.
5. **Stay in your lane.** Edit only the files you own (see "Ownership"). If you need a change in someone else's area, write it under "Requests" in your report.
6. **No long-running servers.** The tools below start a static server, capture, and exit. Build for QA into your own folder: `npx vite build --outDir .qa/<your-agent-name>`, then point the tools at that folder. If you must run a dev server, use a unique port and kill it before you finish.

## Folder layout
```
website/
  TEAM.md                 this file
  tools/                  shared capture tools (Playwright 1.62, cached Chromium)
  research/
    deck/                 pitch deck slide sources (reference)
    mistral/              mistral.ai study: screens/, frames/, notes *.md
    briefs/               design spec, art spec, engine spec, content (from the creative director)
  attempt-01/             attempt 1 (self-contained Vite project)
```

## Tools (run from `website/tools/`)
- **Screens while scrolling, plus console errors:**
  `node shoot.mjs --url <url> | --dir <built dir> [--path /] --out <prefix> --widths 1440,768,390 [--full] [--steps N] [--wait ms] [--reduced-motion] [--click sel]`
- **Animation frames, contact sheet and GIF:**
  `node frames.mjs --url <url> | --dir <dir> [--path /x.html] --selector <css> --frames 24 --interval 83 [--zoom 4] [--hover] [--click sel] --out <dir>`
- **Static server:** `node serve.mjs <dir> [port]`
- **Also available:** Python 3.14 + Pillow, ImageMagick 7 (`magick`), ffmpeg, Node 20, pnpm. You may write your own Playwright scripts (`import { chromium } from 'playwright'` from inside `tools/`, or copy the pattern).

## Ownership (attempt folders)
The creative director's engine spec defines the exact paths per attempt. Default pattern:
- `src/engine/**`: pixel engine (creative director / engine agent)
- `src/art/<piece>/**`: one art agent per piece
- `index.html`, `src/styles/**`, `src/sections/**`: layout agent
- `src/content/**`: content agent
- `qa/**`: QA agents

## Reporting
End every task with a short report covering:
- what you made, with file paths
- the screenshots or frames you checked (paths)
- known issues
- requests for other agents

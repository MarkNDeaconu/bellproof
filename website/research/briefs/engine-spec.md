# Bellproof website · engine spec (attempt-01)

Owner: Fable (engine author). This is the contract every art agent, section agent and QA agent codes against. Nothing here is optional; "should" means "must".

Stack: **Vite 6 + TypeScript 5, strict**. Runtime dependencies: **none**. Dev dependencies: `vite`, `typescript`, `tsx` (Node runner for the validator and sheet renderer). No GSAP: block tweens and reveals are ~120 lines of our own rAF code. Fonts self-hosted.

---

## 1. Project structure and ownership

```
website/attempt-01/
  package.json              fable        scripts: dev, build, preview, validate, sheet, qa:build
  vite.config.ts            fable        two inputs: index.html, preview.html; base './'
  tsconfig.json             fable
  index.html                layout-core  the page skeleton: <header>, 11 <section> shells with ids, <footer>
  preview.html              fable        the piece harness (§9)
  public/
    fonts/*.woff2           layout-core  SpaceGrotesk-500, IBMPlexSans-400, IBMPlexSans-500, JetBrainsMono-400, JetBrainsMono-500 (latin subsets)
    favicon.svg, og.png     logo-mark agent (fable)
  src/
    main.ts                 fable (layout-core fills the SECTIONS map)   boots engine, mounts pieces/icons/reveals, loads section modules
    engine/                 fable        (§2–§8) palette, dither, rng, ascii, grid, glyphs, raster, piece, registry, clock, tween, scale, visibility, mount, icon, fx (reveal/typewriter/countUp/dissolveTo/scrollProgress), blocks, validate, engine.css, index.ts (barrel)
    art/
      registry.ts           fable        AUTO-DISCOVERY via import.meta.glob('./*/index.ts'); nobody edits it
      placeholder/          fable        the stand-in piece (16×16, variants sm 8×8 and wide 32×16)
      <piece-or-family>/    one art agent each  index.ts exporting the piece(s) (+ parts.ts, frames.ts, README.md with the contact-sheet paths)
    styles/
      tokens.css            layout-core  every custom property from design-spec §1–3
      base.css              layout-core  reset, fonts, body, focus ring, skip link, .vh (visually hidden)
      type.css              layout-core  the type scale classes (.display .h2 … .micro) per breakpoint
      grid.css              layout-core  .wrap, .cells, .cell, .rail, .dot, .arc, .sec tints, grid-on-colour
      components.css        layout-core  nav, buttons, pills, tags, tables, tabs, accordion, cards, mosaic
      sections/<id>.css     section agents  one file per section
    sections/
      nav.ts, footer.ts     layout-core  scroll-spy, mobile menu, footer reveal + ring, walker patrol
      <id>.ts               section agents  one module per section exporting `mount(root: HTMLElement)`
    content/
      strings.ts            content agent  every visible string, typed; research list; nav items; placeholders
      meta.ts               content agent  <title>, description, og
  qa/<agent>/               each agent     screenshots/frames they looked at (committed evidence)
  .qa/<agent>/              build output   (gitignored) `npx vite build --outDir .qa/<agent>`
  scripts/
    validate.ts             fable        runs the validator over every registered piece (Node, tsx)
    sheet.ts                fable        renders contact sheets to PNG in Node (own PNG encoder, no canvas dep)
```

Rules of the road: edit only your files; never touch `src/art/registry.ts` (auto-discovery); never import another piece's internals except `fridge-family`'s exported recipe helpers (`plate()`, `coax()`) which are public by design; never import from `sections/` inside `art/`; never add dependencies (§12).

**As built (wave 0):** the engine is in place with these details builders rely on:
- Import everything from `'../../engine'` (the barrel) or from specific modules.
- `.px` containers reserve `--w × --h` art px at `--unit` (4px). `mount()` sets `--w/--h` itself; in HTML add `data-w`/`data-h` only as a self-check (a mismatch logs a console warning). Example: `<span class="px" data-piece="bloch-inline" data-variant="sm" data-decorative data-phase="7" data-io-stamp="true"></span>` (`data-io-<name>` sets a named input; booleans and numbers are parsed).
- Engine CSS is `src/engine/engine.css` (imported by `main.ts`); layout-core must not restyle `.px`, `.block`, `.strata`, `.staircase` beyond colours and positioning.
- `Stage` snaps the floor to the 4-px grid (`ceil(height/4)*4`), so block positions are multiples of 4 regardless of the stage's height; still give stages heights that are multiples of 4 when you can.
- `icon()` sizes are 2, 4, 8 or 20 px per art px; 1-colour bitmaps fill `currentColor`, others keep their palette hexes.
- `dissolveTo(container, fromMount, toId, { variant, inputs })` swaps pieces with a 4-tick ordered-dither dissolve at the DOM level (4×4 Bayer masks, one cell per art pixel; the incoming sprite is masked before it is attached and the outgoing one gets the complement). The new mount is observed like any other. Use `g.dissolve()` inside a piece for a dither between two frames of the same piece.
- `engine.css` lives in cascade layer `bp.engine` (declared first in `tokens.css`), so unlayered section CSS always wins, in dev and in the build.
- `Stage` re-lays out on resize only when the size actually changed; loop caches over 2 MB fall back to per-tick rendering.
- Harness: `preview.html?piece=all | <id> | bands-stage`, see §9. `window.__bp` exposes `clock`, `motion`, `mounts()` for QA scripts.

---

## 2. Palette module · `src/engine/palette.ts`

```ts
export const PALETTE = {
  k:'#0E1424', n:'#321B63', s:'#2A3655', m:'#475069', t:'#7F89A2', l:'#B9C2D6', e:'#E3E8F2',
  h:'#DEDBD3', p:'#F4F2ED', w:'#FFFFFF',
  v:'#7202BC', i:'#6331DF', b:'#2F5BEA', c:'#5E87F1', a:'#8FAEFF', u:'#C9D5FA', g:'#D7E3FF', r:'#C5B0F6',
  R:'#C0105E', F:'#F9E1EC',
} as const;
export type Key = keyof typeof PALETTE;            // 20 keys
export const TRANSPARENT = '.';
export const RAMPS = { metal:'ksmtlew', glow:'knvibcagw', violetGlow:'nvirg', alert:'RF' } as const;
export const RGBA: Record<Key, [number,number,number,number]>;   // precomputed
export const CSS_TOKENS: Record<string, string>;  // '--ramp-3': '#2F5BEA' …, exported for the tokens check
```
`scripts/validate.ts` parses `src/styles/tokens.css` and fails if any hex there that also exists in the palette differs, or if `--alert`/`--ramp-*` are missing.

---

## 3. Grid, ASCII compiler, glyphs, dither, RNG, raster

### 3.1 `Grid` (`grid.ts`)
An integer canvas of palette keys. `w`, `h`, `data: Uint8Array` (0 = transparent, else key index + 1).
```ts
class Grid {
  constructor(w: number, h: number);
  clear(): void;
  get(x, y): Key | null;                       // out of bounds → null
  set(x, y, k: Key | null): void;              // out of bounds → ignored (clipping is free)
  rect(x, y, w, h, k, fill = true): void;
  line(x0, y0, x1, y1, k): void;               // Bresenham + no-doubles cleanup (removes L-corner pixels)
  circle(cx, cy, r, k, fill = false): void;    // midpoint circle
  ring(cx, cy, r, k): void;                    // alias circle(fill=false), used for bursts
  blit(src: Grid | Part, x, y, opts?: { flipX?: boolean; mask?: Key[] }): void;   // '.'-transparent, integer offsets only
  text(font: Font, str: string, x, y, k, spacing = 1): number;   // returns advance width
  dither(x, y, w, h, k, level: 0|1|2|3|4, phase = 0): void;      // ordered 4×4 Bayer, screen-locked ((x+y+phase) in art space)
  dissolve(from: Grid, to: Grid, step: 0|1|2|3|4): void;         // 4-step ordered dissolve into this grid
  toImageData(): ImageData;                    // via RGBA table; alpha 0 or 255 only
  clone(): Grid; equals(other: Grid): boolean;
}
```
No floats stored anywhere. Any geometry computed in floats must be rasterised through `line/circle/set` with `Math.round`.

### 3.2 ASCII compiler (`ascii.ts`)
```ts
export function part(rows: string | string[], name?: string): Part;   // template literal → rectangular Part; throws on ragged rows or unknown keys
export function parts(sheet: string, ids: string[]): Record<string, Part>;   // several parts separated by blank lines
type Part = { w: number; h: number; data: Uint8Array; name: string };
```
Convention: template literals with one row per line, leading/trailing blank lines stripped, `.` transparent. Keep maps ≤ 64 wide; compose larger pieces from parts with `g.blit`.

### 3.3 Glyph fonts (`glyphs.ts`)
`font3x5`: digits 0–9, caps A–Z, `T C ? + - = . # Δ ✓ × / : %`, advance 4. `font5x7`: caps, digits, `✓ × - .`, advance 6. `type Font = { w, h, advance, glyphs: Record<string, Part> }`. `g.text()` draws left to right; unknown characters draw a 1-px dot and the validator warns.

### 3.4 Dither (`dither.ts`)
`BAYER4` matrix; `ditherAt(x, y, level, phase): boolean`; levels 0 (none) → 4 (full). Used by `g.dither`, `g.dissolve` and the engine's pixel fade (`fadeIn(grid, step)`).

### 3.5 RNG (`rng.ts`)
`rng(seed: number): () => number` (mulberry32). `pick(rand, arr)`, `int(rand, lo, hi)`, `shuffle(rand, arr)`. Pieces seed with `loopIndex` (per-loop variety) or a constant (fixed).

### 3.6 Raster helpers (`raster.ts`)
`project(theta, phi, tilt, az) → [x, y, z]` (unit sphere → 2D with depth, for Bloch pieces), `polar(cx, cy, r, deg)`, `eased(n, kind)` → integer spacing arrays (e.g. `spacing(6, 'inOut') = [1,2,3,3,2,1]`), `sphereTemplate(d)` (13/33 px glass orb Parts), `isoBlock(size)`.

---

## 4. The piece contract · `src/engine/piece.ts`

```ts
export interface PieceIO {
  hover: boolean; focus: boolean; click: number; progress: number; mode: string;
  [named: string]: unknown;                    // piece-specific inputs, declared in `inputs`
}
export interface Piece {
  id: string;                                  // kebab-case, unique, = folder name or `${family}-${sub}`
  size: [w: number, h: number];
  variants?: Record<string, [w, h]>;           // e.g. { sm: [11, 11], v: [24, 48] }
  ticksPerFrame: 1 | 2 | 3;
  loopTicks: number;                           // exact loop length; multiple of ticksPerFrame
  period?: number;                             // if the piece alternates loops (e.g. 384 for tc-rounds); default loopTicks
  poster: number;                              // tick (within period)
  maxColours: number;
  palette: Key[];                              // allowed keys; validator enforces
  alt: string;                                 // aria-label; '' means decorative (aria-hidden)
  cache: 'loop' | 'none';                      // 'loop' → every frame pre-rendered at mount; 'none' → rendered per tick (inputs)
  inputs?: Record<string, { type: 'boolean'|'number'|'string'; default: unknown }>;
  modes?: string[];
  states?: string[];                           // values `state()` may return
  frame(tick: number, g: Grid, io: PieceIO, variant?: string): void;   // PURE
  state?(tick: number, io: PieceIO): string;
  events?(tick: number, io: PieceIO): string[]; // names fired on this tick, e.g. ['bit']
  exports?: Record<string, unknown>;           // e.g. labelRows for fridge-hero, surfaceY for staircase
}
export function definePiece(p: Piece): Piece;  // runtime shape check in dev
```
`frame()` draws into a cleared `Grid` of the piece's (variant) size. It must not touch the DOM, `Date`, `Math.random`, or module state that changes between calls. `loopIndex = Math.floor(tick / loopTicks)`. Pieces with `cache: 'none'` must stay under 0.3 ms per frame at 64×64 (measured in the harness).

**Which tick a piece receives (revision 1, E9):** `cache: 'loop'` pieces are rendered once per frame index with `tick ∈ [0, period)`. `cache: 'none'` pieces receive the **absolute local tick** (ticks since the mount started playing, aligned to a frame start), which grows without bound; they take loop phases with `tick % loopTicks` themselves and may compare tick-valued inputs (`intro`, `since`, `bump`…) directly against it. The validator checks every uncached piece for purity under `+ period` and `+ 7·period`. Sections set tick-valued inputs from `mounted.localTick` (never `+ 1`).

### 4.1 Registry (`registry.ts`) · auto-discovery, no shared edits
`src/art/registry.ts` discovers pieces with `import.meta.glob('./*/index.ts', { eager: true })` and registers every `Piece` each module exports (default export, named exports, arrays or plain objects of pieces). The Node scripts (`validate`, `sheet`) discover the same folders from the filesystem. **Art agents never edit the registry**: create `src/art/<your-folder>/index.ts`, export your piece(s), done. Duplicate ids throw at startup and fail `npm run validate`. `getPiece(id)`, `hasPiece(id)`, `allPieces()`.

Minimal piece module:
```ts
import { definePiece, type Grid } from '../../engine';
export default definePiece({
  id: 'my-piece', size: [16, 16], ticksPerFrame: 1, loopTicks: 24, poster: 0, maxColours: 6,
  palette: ['k', 'l', 'a'], alt: 'What it shows.', cache: 'loop',
  frame(tick: number, g: Grid) { g.rect(0, 0, 16, 16, 'l', false); g.set(tick % 16, 8, 'a'); },
});
```
A family exports several: `export const fridgeMini = definePiece({...}); export const fridgeOut = definePiece({...});`.

---

## 5. Clock and scheduler · `clock.ts`

One `requestAnimationFrame` loop for the whole page.
```ts
export const TICK_MS = 1000 / 12;
export interface TickSub { kind: 'tick'; onTick(tick: number): void; }           // sprite clock, 12 fps
export interface FrameSub { kind: 'frame'; onFrame(now: number, dt: number): void; }   // smooth clock, display rate
export const clock = {
  add(sub), remove(sub), now(): number, tick(): number,
  pause(), resume(),                           // used by visibility
  get running(): boolean,
};
```
- Accumulator with a 250 ms clamp (no catch-up storms). Ticks advance in whole steps; `onTick` fires once per advanced tick, in subscription order.
- Frame subs get `dt` in ms; **never** per-frame constants (marquee/physics scale by `dt`).
- The loop **stops** (cancels rAF) when there are no subscribers or when paused; `add()` restarts it. QA verifies zero rAF callbacks with nothing visible.
- `clock.tick()` is global and monotonic; sprites compute `localTick = tick - startTick` so loops are phase-stable regardless of mount time. Sprites that must be desynchronised add a seeded `phase`.

### 5.1 Tweens (`tween.ts`)
```ts
export const ease = { power4InOut, power4Out, power3Out, backOut(s = 1.7), linear, tw /* cubic-bezier(.4,0,.2,1) */ };
export function tween(opts: { from: number; to: number; ms: number; ease; quantize?: number; onUpdate(v: number): void; onDone?(): void }): Tween;   // runs on the frame clock; `quantize` rounds output to a multiple (blocks: 4)
export function sequence(steps: Array<{ at: number; run(): Tween | void }>): Sequence;   // timeline with start times in ms; supports .reverse(), .yoyo({ hold }), .pause(), .resume(), .seek(ms)
```
Block choreography = one `sequence` with `yoyo({ hold: 1000 })`.

---

## 6. Scaling, DPR, mounting · `scale.ts`, `mount.ts`

```ts
export const UNIT = 4;                        // CSS px per art px, everywhere
export const BAND = 8;
export function devicePerArt(): number { return Math.max(1, Math.round(UNIT * (devicePixelRatio || 1))); }   // 1→4, 1.25→5, 1.5→6, 2→8, 3→12
export function fit(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D;
  // canvas.width = w*dpa; canvas.height = h*dpa; style.width = (w*dpa/dpr)px; style.height likewise; imageSmoothingEnabled = false
```
- The **container** (`<span class="px" style="--w:16;--h:16">`) reserves `w*UNIT × h*UNIT` CSS px via `inline-size: calc(var(--w) * 4px)`; the canvas inside may differ by a fraction at odd DPRs and is centred with integer device-pixel offsets. CLS = 0.
- `image-rendering: pixelated` on every `canvas.px` as a safety net.
- A `matchMedia('(resolution: Xdppx)')` listener re-fits every mounted canvas and re-blits its cached frames when the DPR changes (zoom).
- **Moving a sprite container** is only allowed via `moveUnits(el, ux, uy)` → `transform: translate(${ux*4}px, ${uy*4}px)`. Fractional transforms on `.px` containers are a QA failure.

### 6.1 Mounting a piece
```ts
export interface Mounted {
  el: HTMLElement; canvas: HTMLCanvasElement; piece: Piece; io: PieceIO;
  set(input: string, value: unknown): void;    // marks dirty
  seek(tick: number): void;                    // draw a specific tick (poster / harness)
  play(): void; stop(): void;                  // join/leave the clock (visibility uses these)
  on(event: string, cb: (tick: number) => void): () => void;   // piece events
  state(): string | undefined;
  destroy(): void;
}
export function mount(target: HTMLElement, pieceId: string, opts?: { variant?: string; decorative?: boolean; phase?: number; inputs?: Partial<PieceIO> }): Mounted;
```
Mount steps: create `<canvas class="px" role="img" aria-label=alt>` (or `aria-hidden` when `alt === ''` or `decorative`), `fit()`, pre-render frames (`cache: 'loop'`: all `period / ticksPerFrame` frames as `ImageBitmap`s, generated in idle slices of ≤ 8 ms via `requestIdleCallback` with a `setTimeout` fallback; the poster frame is rendered synchronously first so first paint is correct), register with the visibility system, and draw the poster. `onTick`: compute `localTick`, frame index; if unchanged since the last draw, skip; else `clearRect + drawImage` (cached) or `frame() → putImageData` into an offscreen then `drawImage` (uncached). Section scripts call `mount()` for every `[data-piece]` element automatically via `mountAll(root)`:
```html
<span class="px" data-piece="bloch-inline" data-variant="sm" data-decorative style="--w:11;--h:11"></span>
```

### 6.2 Icons (`icon.ts`)
`icon(id, { size = UNIT }) → SVGElement`: an inline SVG of merged `<rect>`s (adjacent same-colour runs merged per row), `shape-rendering="crispEdges"`, `fill="currentColor"` for 1-colour bitmaps, `aria-hidden`. `iconHTML(id)` for templating. Sizes must be integer multiples: `size ∈ {2, 4, 8, 20}`.

---

## 7. Visibility and reduced motion · `visibility.ts`

- One `IntersectionObserver` (`rootMargin: '200px 0px'`, `threshold: 0`). Mounted pieces, block stages, lane physics and the marquee register an element; on intersect → `play()`, on leave → `stop()`.
- `document.visibilitychange`: hidden → `clock.pause()`; visible → `clock.resume()` (the accumulator resets so no burst).
- `prefers-reduced-motion: reduce` (`motion.reduced: boolean`, live via `change`): when true, every mount draws its poster and never plays; block stages lay out their initial state; sequences do not start; reveals apply the final state instantly; tabs do not auto-advance; scroll-driven motion jumps to its end state; the typewriter prints everything. Switching at runtime applies immediately (stop all, seek posters) and back (resume).
- `document.documentElement` gets `data-motion="full|reduced"` so CSS can branch.

---

## 8. Blocks system · `blocks.ts` (used by `bands` card 15, owned by fable)

```ts
export function stage(root: HTMLElement, layout: StageLayout): Stage;   // creates .block divs on the module grid (M from CSS var --module), riders mounted inside blocks
export interface StageLayout { module: number; blocks: BlockDef[]; diamond?: { col: number; rowFromFloor: number; step: Key }; reservoir?: Key[]; }
export interface BlockDef { id: string; col: number; rowFromFloor: number; size: 1 | 0.5; step: Key; rider?: { piece: string; variant?: string; dx: number; dy: number } }
Stage.move(id, { dx?: number; dy?: number }): Tween;   // one-cell moves, quantize 4, power4InOut 800 ms
Stage.choreo(seq: Array<{ at: number; moves: Array<[id, { dx?, dy? }]> }>, opts: { yoyo: true; hold: 1000 }): Sequence;
Stage.enter(): Sequence;                       // the intro slide-ins
Stage.setStatic(): void;                       // reduced motion
```
Diamonds are `<canvas class="px band">` bitmaps at `BAND`. The staircase and strata are `stripe()` helpers producing DOM bands with the grid overlay and exporting `surfaceY(x)`.

---

## 9. Preview harness · `preview.html` + `src/preview/preview.ts`

A standalone page (second Vite input) that mounts one piece in isolation for QA. Query parameters:

| Param | Values | Effect |
|---|---|---|
| `piece` | id, or `all` | mounts the piece (or an index grid of every registered piece's poster with ids) |
| `variant` | name | mounts a variant |
| `bg` | `paper` (default) \| `ink` \| `blue` | stage background |
| `zoom` | `1` (default) \| `2` \| `4` | CSS zoom of the stage (integer; the canvas is re-fit, not scaled) |
| `tick` | number | seeks that tick and **stops** (static) |
| `play` | `0` \| `1` (default) | play or freeze |
| `mode`, `hover`, `click`, `progress`, `<input>=<value>` | | sets `io` inputs; `hover=1` forces hover |
| `sheet` | `1` | renders a contact sheet: every frame of the period (max 144; else every k-th) at 4× with tick labels, plus a 1× strip, as one big canvas with an `id="sheet"` for `frames.mjs --selector #sheet` single-shot capture |
| `grid` | `1` | overlays the art-pixel grid at 4× |
| `rm` | `1` | simulates reduced motion |

Stage markup: `<main id="stage"><span class="px" id="target">…</span></main>`, with a sidebar listing `id, size, loopTicks, period, poster, cache, inputs, state()` live, the current `tick`, the frame-generation time and the per-tick draw time. Console-clean required.

QA frame capture of a live piece:
```
cd website/tools
node frames.mjs --dir ../attempt-01/.qa/<agent> --path "/preview.html?piece=magic-square&zoom=2" --selector "#stage" --frames 72 --interval 83 --zoom 2 --out ../attempt-01/qa/<agent>/magic-square-live
node frames.mjs --dir ../attempt-01/.qa/<agent> --path "/preview.html?piece=magic-square&sheet=1" --selector "#sheet" --frames 1 --out ../attempt-01/qa/<agent>/magic-square-sheet
node frames.mjs --dir ../attempt-01/.qa/<agent> --path "/preview.html?piece=glitch-crack&hover=1" --selector "#stage" --frames 6 --interval 83 --zoom 4 --out ../attempt-01/qa/<agent>/glitch-crack-hover
```

---

## 10. Validator · `src/engine/validate.ts` + `scripts/validate.ts`

`validatePiece(piece) → { errors: string[]; warnings: string[] }`. Checks:
1. id unique and kebab-case; `size` positive; variants well-formed.
2. `loopTicks % ticksPerFrame === 0`; `period % loopTicks === 0`; `0 ≤ poster < period`.
3. For every tick in `[0, period)` (step `ticksPerFrame`) and every variant, render with default inputs: only allowed `palette` keys used; distinct colours ≤ `maxColours`; no row/width mismatch (impossible by construction, but `frame()` must not throw).
4. `frame(period) == frame(0)` (exact loop), unless `cache: 'none'` *and* the piece declares `inputs` (then it checks with defaults).
5. Orphan-pixel report on tick `poster` (warning): single pixels whose 4-neighbours are all different keys, excluding `w`/`g`/`a` (sparkles).
6. 1-px line "doubles" scan on the poster (warning).
7. `alt` present or explicitly `''`.
8. Tokens check (`tokens.css` vs `PALETTE`) once per run.
9. For `cache: 'none'` pieces: measure average `frame()` time over 48 ticks; warn > 0.3 ms, error > 1 ms (Node timing, generous).

`npm run validate` exits non-zero on any error and prints a table. `npm run sheet -- <id> [variant] [--bg ink]` writes `qa/sheets/<id>[-variant][-ink].png` (frames at 4× with labels, a 1× strip, and the poster boxed) using the Node PNG encoder (`scripts/png.ts`: zlib deflate, no dependencies). Art agents run both before reporting and **open the PNG**.

---

## 11. Section mounting · `src/sections/*.ts` and `main.ts`

```ts
export interface Section { id: string; mount(root: HTMLElement, ctx: { strings: Strings; motion: Motion; clock: Clock }): void; }
```
`main.ts`: imports `art/registry`, reads `data-motion`, runs `mountAll(document)` for every `[data-piece]`, then calls each section's `mount` with its `<section id>` root. Section modules own only their section's behaviour: inputs to pieces (`mounted.set('stamp', true)`), state readouts, scroll-driven progress (`scrollProgress(el) → 0..1`, computed in a frame sub only while visible), tabs, accordions, drag physics (trust strings: a tiny verlet of 6 bodies, `dt`-scaled, ≤ 0.2 ms per frame), the typewriter (`typewriter(el, text, { msPerChar: 40, cursor: true })`), the count-up, and reveals (`reveal(root)`: IO-driven `.rise` class; CSS does the 500 ms animation; reduced motion → class applied immediately).

HTML conventions for section agents:
- `<section id="trust" class="sec" data-tint="paper">` → `.wrap` → blocks. Eyebrow `<p class="eyebrow">`, headline `<h2 class="h2">`, lead `<p class="lead">`.
- Pieces: `<span class="px" data-piece="…" data-variant="…" data-decorative data-phase="7" style="--w:…;--h:…"></span>`. The `--w/--h` must equal the piece size (validator in dev warns on mismatch at mount).
- Every string comes from `strings.ts` (section agents never hard-code copy); `index.html` holds structure only and sections fill text via `data-str="trust.headline"` + `fillStrings(root)`, or templates in TS. Decision: **structure in `index.html`, strings injected by `fillStrings`** so QA can diff `strings.ts` against `content.md` in one place.

---

## 12. Build, QA commands and concurrency rules

**Dependencies are fable's alone.** `package.json` and `package-lock.json` are owned by the engine agent; everything anyone needs is installed up front (`vite`, `typescript`, `tsx`, `pngjs`). Art and section agents **never run `npm install`/`npm add` and never add a dependency**; if you believe you need one, write it under "Requests" in your report. `npm ci` is the only install command.

**Concurrency rules** (fifteen agents work in the same folder at once):
1. Touch only the files you own (build-plan §1). The registry is auto-discovered; `index.html`, `main.ts` and `package.json` are not yours unless the table says so.
2. Build to your own folder: `npx vite build --outDir .qa/<agent>`. `.qa/` is gitignored; never read another agent's `.qa`.
3. If you need a dev server, use **your** port from the table below (`npm run dev -- --port 52NN`; `--strictPort` is on, so a clash fails loudly) and **kill it before you finish** (`kill %1` / `pkill -f "vite --strictPort --port 52NN"`).
4. Evidence goes to `qa/<agent>/` (committed). Node sheets go to `qa/sheets/` (shared, filenames are per piece so there are no clashes).

| Port | Agent | Port | Agent | Port | Agent |
|---|---|---|---|---|---|
| 5201 | engine (fable) | 5211 | art-bloch-inline | 5221 | art-glitch-cells |
| 5202 | content | 5212 | art-qubit-folk | 5222 | art-clients |
| 5203 | layout-core | 5213 | art-certificates | 5223 | art-cascade-coin |
| 5204 | sections-1 | 5214 | art-tc-rounds | 5224 | art-bands (fable) |
| 5205 | sections-2 | 5215 | art-wall-to-lock | 5225 | art-fridge-hero (fable) |
| 5206 | sections-3 | 5216 | art-layer-packets | 5226 | art-logo-mark (fable) |
| 5207 | qa-pixel | 5217 | art-chain-flow | 5227 | art-magic-square (fable) |
| 5208 | qa-layout | 5218 | art-fridge-family | 5228 | integration (fable) |
| 5209 | qa-motion-perf | 5219 | art-icons | 5229–5240 | spare (ask the lead) |
| 5210 | qa-content / qa-a11y / qa-originality (5210 / 5230 / 5231) | 5220 | (spare) | | |

```
cd website/attempt-01
npm ci                                        # once; never npm install / add
npm run typecheck                             # tsc --noEmit
npm run validate [-- <id>]                    # tsx scripts/validate.ts (all pieces, or the ids given)
npm run sheet -- <piece-id> [variant] [--bg ink]   # Node contact sheet → qa/sheets/<id>[-variant][-ink].png
npm run dev -- --port 52NN                    # only if you must; kill it before you finish
npx vite build --outDir .qa/<agent>           # your own build for capture (never share .qa folders)
BP_ONLY=<folder>[,<folder>] npx vite build --outDir .qa/<agent>   # (added by the lead) registry holds only these art folders + placeholder, so others' half-edited pieces can't break your build
BP_SECTIONS=top,trust npx vite build ...   # (added by the lead) same for page sections: only these + nav + footer; combine with BP_ONLY
cd ../tools
node shoot.mjs --dir ../attempt-01/.qa/<agent> --out ../attempt-01/qa/<agent>/home --widths 1440,768,390 --full
node shoot.mjs --dir ../attempt-01/.qa/<agent> --out ../attempt-01/qa/<agent>/home-rm --widths 1440,390 --reduced-motion
node frames.mjs --dir ../attempt-01/.qa/<agent> --path "/" --selector "#top" --frames 36 --interval 83 --out ../attempt-01/qa/<agent>/hero
node frames.mjs --dir ../attempt-01/.qa/<agent> --path "/preview.html?piece=<id>" --selector "#stage" --frames 48 --interval 83 --zoom 2 --out ../attempt-01/qa/<agent>/<id>
```
`shoot.mjs` prints console errors and warnings: the build must be console-clean at all three widths. The final build is `npx vite build` → `dist/` (produced by the integrator only).

---

## 13. Performance budgets (checked by `qa-motion-perf`)

| Budget | Target |
|---|---|
| Engine JS | ≤ 12 KB gzip |
| Total JS (engine + sections + art) | ≤ 140 KB gzip; art data ≤ 20 KB gzip per piece |
| CSS | ≤ 40 KB gzip |
| Fonts | 5 woff2 ≤ 180 KB total, `font-display: swap`, preloaded: Grotesk 500 and Mono 400 |
| Frame generation at mount | ≤ 30 ms per piece, idle-sliced ≤ 8 ms per slice; poster synchronous |
| Per-tick main-thread work, all visible sprites | ≤ 1.5 ms (one `drawImage` each) |
| Per-frame (smooth) work | ≤ 1 ms: ≤ 16 tweened DOM nodes, transform/opacity only |
| Live canvases at once | ≤ 12 |
| Canvas backing store total | ≤ 32 MB at DPR 2 |
| Long tasks after load | none > 50 ms |
| CLS from art | 0 |
| rAF when nothing visible or tab hidden | 0 callbacks |
| LCP (mobile, 4G throttle) | ≤ 2.0 s (hero H1 text is the LCP candidate; the fridge canvas is not) |
| Lighthouse mobile | Performance ≥ 90, A11y 100, Best Practices 100 |

# Layout core · attempt-01

Owner: **layout-core**. Covers the shell (`index.html`), the token, type, grid and component CSS, the nav and the footer. The specs are `../research/briefs/design-spec.md` §1–§4 and §5.11, plus `engine-spec.md` §6, §7 and §11.

| File | What it holds |
|---|---|
| `index.html` | `<head>` meta (copied from `src/content/meta.ts`), the skip link, the nav, 10 `<section>` shells plus the footer |
| `src/main.ts` | engine bootstrap: CSS layers, `fillStrings`, `mountAll`, icons, `reveal`, then `SECTIONS` |
| `src/styles/tokens.css` | every custom property in design §1–§3, the breakpoint overrides, and the colour scopes |
| `src/styles/base.css` | reset, body, focus ring, `.vh`, `.skip`, `.em`, scroll lock |
| `src/styles/type.css` | `.display .h2 … .h6 .lead .body .small .num-xl .num-l .mono .eyebrow .micro` and helpers |
| `src/styles/grid.css` | `.wrap .sec [data-tint] .band .cells .cell .rail .dot .arc .grid-colour .split .grid-12`, plus the skeleton `.shell*` classes |
| `src/styles/components.css` | buttons, links, pill, chips and tags, `.card-dark .kv`, `.px-bracket`, `.table`, `.tabcard`, `.vtabs`, `.acc`, `.mosaic` |
| `src/sections/nav.ts` + `src/styles/sections/nav.css` | nav, mobile menu, scroll-spy, icon fallbacks, placeholder-link guard, `hydrate()` |
| `src/sections/footer.ts` + `src/styles/sections/footer.css` | footer columns, sub-footer, strata, walker patrol, bell reveal and ring |

---

## 1. The section container contract (sections agents read this)

**I own the `<section>` element. You own everything inside it.**

```html
<section id="trust" class="sec sec--trust" data-tint="paper">
  …the skeleton shell: replace all of it…
</section>
```

- **The `<section>` element is mine.** I set its `id`, its `class="sec sec--<id>"` and its `data-tint`. The `.sec` class gives it the 1px top seam, its tint and the text colour. Don't change these attributes, and don't put `padding` or `border` on `.sec` from your CSS. Style through `#<id>` or `.sec--<id>`.
- **The inside of the section is yours.** Your `mount(root, ctx)` receives the section element. Replace its children with your own markup (`root.innerHTML = …` or DOM building). My shell children (`.wrap.shell`, `.shell__head`, `.shell__stage` and the placeholders) are throwaway: nothing outside the section depends on them.
- **Keep these ids, because the nav and other links point at them:** `#top`, `#flip`, `#paradox` (inside flip), `#clients`, `#flow`, `#verify`, `#research` (inside verify), `#guarantees`, `#cta`, and the in-section ids from content (`#with-without`, `#verify-games`, `#verify-compiler`, `#verify-rounds`). The scroll-spy watches `#flip #verify #flow #clients #research`. If your markup replaces one of these, put the id back on the matching element.
- **Your module goes in `src/sections/<id>.ts` and exports `mount`.** `main.ts` discovers it automatically, with no list to edit:
  ```ts
  import type { SectionCtx } from '../main';        // { strings, motion, clock }
  import { hydrate } from './nav';
  import '../styles/sections/trust.css';             // optional: main.ts already globs every sections/*.css
  export function mount(root: HTMLElement, ctx: SectionCtx): void {
    root.innerHTML = `<div class="wrap">…</div>`;
    hydrate(root);   // fillStrings + mountAll + icon fallbacks + hydrateIcons + reveal + placeholder links
  }
  ```
  Modules are imported eagerly and mounted in page order, right after the boot (`fillStrings`, `mountAll`, icons, `reveal` on the whole document). Markup you render later needs a `hydrate(root)` call, or the engine calls themselves.
- **Your CSS goes in `src/styles/sections/<id>.css`.** `main.ts` globs every file there. My shared CSS sits in cascade layers (`@layer bp.tokens, bp.base, bp.type, bp.grid, bp.components`). Your file is unlayered, so **any rule you write beats any shared rule, whatever its specificity and wherever the bundler puts the file.** Vite hoists eager globs above static imports, so file order alone is not reliable. Don't wrap your CSS in `@layer`. Use the tokens. Never hard-code a hex that has a token.
- **Strings:** use `data-str="trust.h2"` in your templates and `hydrate()` fills them, or interpolate from `ctx.strings`. Use `richHTML()` for `Rich` values (it gives `<span class="em">`, which renders blue, or azure on dark). Never hard-code copy.
- **Full-bleed pieces** (the paradox band, the CTA band, the research strip): put them directly inside the section, not inside `.wrap`. `.band` gives a full-bleed sub-band with its own tint and seam, for example `<div id="paradox" class="band grid-colour" data-tint="blue">`.
- **CLS:** your markup arrives after JavaScript runs. For the hero, keep the outer height deterministic (`min-height: max(800px, calc(100dvh - 160px))`, which my shell already uses) so swapping the inside doesn't shift anything. If you want your markup in the HTML from first paint, which is better for LCP, send me the HTML and I will put it in `index.html`.
- **Pieces:** `<span class="px" data-piece="id" data-decorative …>` (engine §6). Use `placeholder` (`sm` 8×8, default 16×16, `wide` 32×16) until a piece lands. Don't restyle `.px`, `.block`, `.strata` or `.staircase` beyond colour and position.
- **Icons** (art-icons is in; read `src/art/icons/README.md`): write `<i data-icon="ui-chevron"></i>` (`data-size` = 2/4/8/20). From TS, `uiIcon(id, size)` (in `nav.ts`) returns the SVG markup. Only in builds without the icons folder (`BP_ONLY`) does `hydrate()` swap in a fallback glyph.
  - **Hovers:** put `data-hop` on the hover target: `step` for a chevron or arrow, `out` for ↗, `press` for ▶, `drop` for ⌄, `hop` for a playful chevron. `icons.css` is imported once, from `components.css`.
  - **Outbound buttons and inline links** take `ui-external-sm` (5×5). `ui-external` (7×7) is for whole-cell links, like the research strip.
  - **Whole CSS px:** never use `vertical-align: middle` on icons. Centre them in flex boxes whose height minus the icon height is even (48 − 20, 46 − 20, 24 − 20 → 2px top margin). `hydrate()` and the page-level watcher call `snapIcons()`, which removes the remaining horizontal sub-pixel offset left by fractional label widths, using the `translate` property. `qa/layout-core/check-icon-px.mjs` measures it.
- **Placeholder links** (`[Demo link]`, `mailto:[Contact email]`, `[GitHub]`, …): keep the href verbatim. A document-level guard cancels the click, and `hydrate()` (or the `load` pass) adds `aria-disabled="true"`, `data-placeholder` and a `title` naming the placeholder. They look like normal links and never navigate.

### Shell inventory (what each section holds now)
| Section | Tint | Shell content |
|---|---|---|
| `#top` | card | rails, arc + dot, H1 (display), lead, 2 buttons, ticker + `illustrative`, pill, placeholder fridge, 6-cell research strip |
| `#trust` | paper | centred eyebrow/h2/lead, placeholder stage cell |
| `#flip` | card | eyebrow/h2/lead, stage; `#paradox` blue band (eyebrow, display statement, sub) with grid on colour |
| `#cost` | card | eyebrow/h2/lead, stage |
| `#layer` | paper | centred eyebrow/h2/lead, stage |
| `#clients` | card | header row (eyebrow/h2/lead left, outline "Talk to us" right), stage |
| `#flow` | paper | eyebrow/h2/lead, stage |
| `#verify` | card | centred eyebrow/h2/lead, a `.mosaic--violet` panel, `#research` (h3 + lead) |
| `#guarantees` | paper | eyebrow/h2/lead, stage |
| `#cta` | ink | grid on colour, eyebrow/display/lead, 3 cells with ghost-on-dark buttons, primary-on-dark "Get in touch" |
| `#footer` | card | mine (see §4) |

---

## 2. Tokens (`tokens.css`)

`npm run validate` checks the hexes against `src/engine/palette.ts` (`ok tokens.css`).

- **Surfaces:** `--card` `--paper` `--paper-2` `--ink` `--ink-2`
- **Text:** `--text` `--text-soft` `--text-muted` `--on-dark` `--on-dark-body` `--on-dark-muted` `--on-dark-accent`
- **Lines:** `--hairline` `--hairline-strong` `--hairline-dark` `--grid-on-colour` `--dot` `--focus`
- **Actions:** `--action` `--action-hover` `--action-outline-hover` `--ghost(-hover)` `--ghost-on-dark(-hover)`
- **Ramp:** `--ramp-0` (mist) … `--ramp-6` (night). Aliases: `--blue` (`--ramp-3`) and `--blue-light` (`--ramp-1`). Alert: `--alert` and `--alert-tint`.
- **Sprite palette by name:** `--px-ink`, `--px-night` … `--px-raspberry-tint` (all 20 keys)
- **Scope-aware roles,** which components read: `--surface` `--surface-2` `--cell-bg` `--cell-hover` `--accent-text` `--line` `--line-strong` `--focus-ring`
- **Type:** `--font-display|body|mono`, plus `--fs-* --lh-* --ls-*` for every scale step. These switch at 1024 and 768 and are not fluid.
- **Grid:** `--unit` (4) `--band` (8) `--module` (128, or 64 below 1024) `--gutter` (40, or 16) `--content-max` (1728) `--nav-h` (48) `--nav-total` (49) `--cell-pad` (40/24/16) `--sec-pad-top` (160/80/64) `--seam` (80/64/48) `--sp-4 … --sp-160` `--measure-h2|lead|body`
- **Radii and motion:** `--r-control` (4) `--r-tabcard` (8) `--r-pill`, `--shadow-menu`, `--ease-ui` `--ease-rise` `--dur-ui` (150) `--dur-panel` (300) `--dur-step` (166)

**Colour scopes.** `[data-tint="ink"]` and `.on-dark` remap `--text*`, `--line`, `--accent-text`, `--focus-ring` (azure), `--ghost` and `--cell-bg` for dark backgrounds. `[data-tint="blue"]` and `.on-blue` do the same for the brand blue, with paper text, mist accents and a paper focus ring. `.on-light` resets a light card that sits inside a dark scope. Write `color: var(--text-soft)` and it is correct in every scope.

**Breakpoints:** sm < 768 ≤ md < 1024 ≤ lg. Media queries use `max-width: 1023.98px` and `767.98px`, or `min-width: 768px` and `1024px`.

## 3. Classes and utilities

**Type** (`type.css`): `.display .h2 .h3 .h4 .h5 .h6 .lead .body .small .num-xl .num-l .mono .eyebrow .micro`, `.w-500`. Colour helpers: `.t-soft .t-muted .t-accent .t-blue .t-alert .t-ink`. Measures: `.measure-h2` (880), `.measure-lead` (640), `.measure-body` (560), `.center`.

**Grid** (`grid.css`)
- `.wrap`: the content box, 40→1400 at 1440, capped at 1728. `.wrap--lined` makes the content edges lines. `.bleed`.
- `.sec` and `[data-tint=card|paper|ink|blue]`: the seam and the tint. `.band` is a full-bleed sub-band.
- `.cells`: a 1px-gap grid on `--line`. Set columns with `--cols-sm/--cols-md/--cols-lg`, or the shorthands `.cells--2/3/4/6`. Also `.cells--flush` (no side lines) and `.cells--open` (no outer border). Stacked `.cells + .cells` share one line. **Fill every row**, because an empty area shows the hairline colour.
- `.cell`: flex column, `gap` 16, padding `--cell-pad`, surface `--cell-bg`. Modifiers: `.cell--paper` `.cell--paper-2` `.cell--card` `.cell--span` `.cell__foot` (pins to the bottom) `.cell__body` (soft text) `.cell--link` (hover paper, focus ring inside). Add `.on-dark` or `.on-blue` to a cell for an ink or blue card.
- `.rail.rail--left|right`: M wide, with a 1px inner line.
- `.dot`: a 4×4 ink square centred on a point (`--x`, `--y`). Put it inside the element whose line it marks.
- `.arc`: an SVG with `.arc__front` (solid) and `.arc__back` (dashed 4/4), 960px across, at `top:-700px; left:-480px`. Copy the markup from the `#top` shell.
- `.grid-colour`: grid on colour (48px insets, plus the content-box edges once ≥1808, and horizontals every 80px), drawn between the fill and the content. On ink it switches to 6% paper. The image is also `--grid-colour-image`.
- `.split`: 340px + 1fr at lg. `.grid-12` with `.span-4/5/6/7/8/12` at lg, stacked below. `.stack` (`--stack`), `.seam-top`, `.pad-top`, `.pad-seam`.

**Components** (`components.css`)
- **Buttons:** `<a class="btn btn--primary" data-hop="step">` with `<span class="btn__label">` + `<span class="btn__icon"><i data-icon="ui-chevron"></i></span>`. Variants: `--primary`, `--outline`, `--ghost`, `--primary-on-dark`, `--ghost-on-dark`. Sizes: `--compact` (40) and `--block` (full width, glyph at the right).
  - **The pixel step** comes from `data-hop="step"` (icons.css): one art px, then two (4 → 8px).
  - **Outbound:** `data-hop="out"` + `ui-external-sm`.
  - `.btn__icon--lead` puts the glyph first. `.btn-row` gives 12px gaps and stacks full width at 8px on sm.
  - `.link--icon` is a text link with a trailing glyph, top-aligned to its first line.
- **Links:** `.link` (1px underline, offset 3, blue on hover) and `.link--quiet`.
- **Pill:** `.pill` > `.pill__tile` (48px paper-2 disc) + `.pill__label` + `.btn__icon`. Add `.pill--auto` to turn it into the 64px full-width bar below 1024.
- **Chips and tags:** `.chip-example` (RUNNING EXAMPLE), `.tag-illustrative`, `.tag` with `--blue` or `--alert`, `.eyebrow`.
- **Cards and rows:** `.card-dark` (pair it with `.on-dark`), `.kv` (`<dl>` with a 160px key column, key accent, value text), `.px-bracket` (the pull-quote bar with 2-art-px ticks).
- **Table:** `<table class="table">`. Headers are eyebrow, with `th.is-blue` or `th.is-alert`. Row titles go in `<th scope="row">` (h5). On sm, rows become cards, and each `<td>` needs a `data-label` (`td.is-blue` and `td.is-alert` colour the label).
- **Tabs:** `.tabcard` > `.tabcard__item` (active through `.is-active`, `[aria-selected]` or `[aria-current]`) + `.tabcard__arrow`, sticky at 73px. `.vtabs` > `.vtab[role=tab]` > `.vtab__bar` (fills over `--vtab-ms`, default 6s). `.is-paused` pauses it, `.is-manual` hides it, and it is hidden under reduced motion.
- **Accordion:** `.acc` > `.acc__item` > `button.acc__head[aria-expanded]` (`.acc__glyph-closed` and `.acc__glyph-open`) + `.acc__panel` > `.acc__inner`. The panel animates with grid rows from 0fr to 1fr, and its collapsed content is not focusable.
- **Mosaic:** `.mosaic` with `--violet`, `--blue` or `--azure` (40px tiles in two tints, a 7×5 repeat) > `.mosaic__plate`. The one diamond tile per row is yours to add.

**Base:** `.vh`, `.em`, `.skip`, `.focus-inset` (ring 4px inside the box), and `html.is-locked`.

## 4. Nav and footer behaviour

- **Nav.** Sticky, 48 + 1. The lg row is | logo 160 | 5 items | spacer | Get in touch | ▶ Watch the demo (ink) |. The play glyph is `ui-play` at 32px (`data-hop="press"`). Between 1024 and 1199 the cells tighten to 12px, so the full row fits. The menu ⣿ ⇄ × uses art-icons' `morph()` (3 steps, one tick each), and menu rows take `data-hop="step"`. md shows | logo | Get in touch | ▶ demo | menu |, and sm shows | mark | ▶ demo | menu |. The scroll-spy sets `aria-current="location"` on the link whose target holds the viewport's centre line (the innermost target wins) and lifts it to `--paper`. The mobile menu slides in from the right (300ms) with 64px rows and two full-width buttons. While it is open, `main`, `footer`, the skip link and the logo are `inert`, Tab cycles from × through the panel, Esc closes and returns focus to the toggle, and the body scroll is locked. Following a row closes the menu and jumps. Resizing to lg closes it.
- **Footer.**
  - The columns render from `strings.footer.columns`: 4 at lg, 2 at md, stacked on sm. Research items show ↗ and the arXiv id, and items without an `href` are plain text.
  - Socials render only once `supplied: true`, which is none today.
  - The sub-footer shows the tagline, then copyright, the 240×220 bell standing on the strata, and the built-by line.
  - **Strata:** `strata()` from `src/art/bands` (bands, gridlines, arc, walker slot) is used when it is exported. Otherwise the engine's `stripe()` and the grid in `footer.css` take over.
  - **Walker patrol** (qubit-folk contract): the walker moves 4 CSS px on even `localTick`s only. Every 36–60 ticks (seeded) it sets `since` and `precess`; on `done` it sets `since` and `hop`; on the next `done` it walks again. `dir` flips at the content-box edges. The driver's tick sub is added after the piece is playing, so it reads the current tick. It runs only while visible, and stays still under reduced motion.
  - **Footer links:** outbound links take `ui-external-sm` + `data-hop="out"` in a flex row; the arXiv id sits below.
  - **Bell:** I use logo-mark's `markSVG` (nav at scale 2, footer at scale 20) and `footerReveal({ mark, trigger: strata, distance: 240, step: 20 })`, which rings once at the page bottom. The trigger is the band line rather than the sub-footer top, because with the spec's trigger the rise finishes while the band line is still below the fold. 240 rather than 280 because the page bottom leaves the line only 256px up. In `BP_ONLY` builds without logo-mark, the same reveal and a fallback ring (3 clapper swings, a 3-step azure halo) run from `footer.ts`. Under reduced motion the bell is in place and does not ring.

## 5. Fonts

The fonts are linked from Google Fonts css2 in `index.html` (Space Grotesk 500, IBM Plex Sans 400/500, JetBrains Mono 400/500, `display=swap`). They are not self-hosted yet, because downloading the woff2 files needs the user's approval (see Known issues). To self-host, drop the five latin files into `public/fonts/`, remove the three `<link>`s, and add this to the top of `base.css`:
```css
@font-face { font-family: 'Space Grotesk'; font-weight: 500; font-display: swap; src: url('/fonts/SpaceGrotesk-500.woff2') format('woff2'); }
@font-face { font-family: 'IBM Plex Sans'; font-weight: 400; font-display: swap; src: url('/fonts/IBMPlexSans-400.woff2') format('woff2'); }
@font-face { font-family: 'IBM Plex Sans'; font-weight: 500; font-display: swap; src: url('/fonts/IBMPlexSans-500.woff2') format('woff2'); }
@font-face { font-family: 'JetBrains Mono'; font-weight: 400; font-display: swap; src: url('/fonts/JetBrainsMono-400.woff2') format('woff2'); }
@font-face { font-family: 'JetBrains Mono'; font-weight: 500; font-display: swap; src: url('/fonts/JetBrainsMono-500.woff2') format('woff2'); }
```
Then preload Grotesk 500 and Mono 400 (engine §13).

## 6. Evidence and known issues

Evidence is in `qa/layout-core/` (see `INDEX.txt`). To rebuild it: `BP_ONLY=logo-mark,bands npx vite build --outDir .qa/layout-core`, then run `shoot.mjs` and `node qa/layout-core/capture.mjs <prefix>`.
- **`r5-{1440,1024,768,390}-step-NN.png` and `-full.png`:** the skeleton at four widths. `r5-rm-*` is reduced motion. `r6-allart-*` is the build with every art folder.
- **`r5-nav-{1440,1200,1024,768,390}.png`** (DPR 2): the bar at each breakpoint. `r5-states.json` records no overflow at any width, nav height 49, and the scroll-spy result for 11 positions.
- **`r5-menu-{768,390}-{open,focus,closed}.png`:** the menu. `states.json → menu` records the Tab cycle (× → 5 rows → 2 buttons → ×), the Esc return to the toggle, the scroll lock, `main.inert`, and that a row click closes the menu and lands 73px from the top.
- **`r5-focus-{skip,navcell,inkcell,button,cite,dark,footer}-1440.png`:** the focus rings.
- **`r5-footer-{rising,ring}-1440.png` and `r5-footer-1440.png`:** the bell half risen (clipped at the band line), mid-ring with the halo, and at rest.
- **`check-static-strings.ts`:** 109 static strings and hrefs in `index.html` match `strings.ts`.
- **Icons:** `r8-*` is the build with art-icons (`BP_SECTIONS=placeholder-none BP_ONLY=icons,logo-mark,bands,qubit-folk`). `r8-hover-{primary,outline,demo,pill}-f*.png` are the `data-hop` frames (`r8-hovers-sheet.png`), `r7-morph-sheet.png` is the menu morph, and `check-icon-px.mjs` finds all 106 icon boxes on whole px at all four widths.

Known issues:
- **Fonts are linked, not self-hosted** (§5). Self-hosting needs the five woff2 downloads approved.
- **Strings are filled at runtime.** The static text in `index.html` is a first-paint copy. `check-static-strings.ts` guards it against drift.
- **`.cells` needs full rows.** An incomplete last row shows the hairline colour in the empty area.
- **The CTA grid on colour uses 6% paper,** because the spec's 10%-ink lines vanish on ink.
- **Placeholder links carry `aria-disabled="true"`.** Playwright's `click()` refuses them as "not enabled", so pass `{ force: true }` in QA scripts.
- **Hero at md (S1):** "on-chain." breaks at its hyphen once the text column is narrow (768: 416px beside a 288px fridge cell). Wrap it in `<span class="nowrap">`. The spec's three lines at 64px also need about 560px.

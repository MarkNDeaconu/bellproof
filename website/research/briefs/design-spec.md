# Bellproof website · design spec (attempt-01)

Owner: Fable, creative director. Status: **final for Phase 3**. Builders follow this spec; if something here conflicts with `content.md`, the strings in `content.md` win and the layout here wins. Companion specs: `art-spec.md` (every pixel piece), `engine-spec.md` (code contracts), `build-plan.md` (who builds what).

Reference research: `research/mistral/01-layout-visual-system.md` (anatomy), `02-motion-forensics.md` (motion), `03-pixel-craft-and-motifs.md` (pixel craft, palette). We take Mistral's *ingredients* (bordered cells, module grid, stepped bands, slow sprites riding smooth blocks, one toy, a footer reveal) and none of its assets.

---

## 0. The idea in one paragraph

A technical ledger of a page: warm paper, a visible hairline grid, calm giant headlines in one weight, and a cool blue-to-violet ramp that appears only as flat blocks at the top of the page (hero blocks) and the bottom (footer strata), with one "dusk staircase" seam between the dark CTA band and the footer. Pixel art lives *on* the grid: a dilution-refrigerator chandelier in silver and azure hangs from the nav line in the hero and is lowered into frame as the page loads; small qubit creatures ride the blocks; a Magic Square game plays itself; T/C rounds scroll past a provider who only sees question marks. Everything moves on two clocks: smooth eased geometry (blocks), and a 12 fps sprite clock. The site is crisper than the reference (integer scale everywhere) and kinder (reduced motion is honoured, focus is visible).

---

## 1. Colour tokens

All CSS custom properties live in `src/styles/tokens.css`. The sprite palette (`src/engine/palette.ts`) is the same table; the validator checks the two never drift. Contrast values are WCAG 2.x ratios, computed.

### 1.1 Surfaces

| Token | Hex | Role |
|---|---|---|
| `--card` | `#FBFAF7` | page canvas (`body`), nav bar, hero, light cells, inputs. The "primary" surface. |
| `--paper` | `#F4F2ED` | alternate section tint, inactive tabs, muted chips, hover of cells. The "secondary" surface. |
| `--paper-2` | `#ECE9E1` | deeper panels: the "Not covered" cell, the `?` blocks' face, the pill icon tile |
| `--ink` | `#0E1424` | the dark band (CTA), dark cards (certificate, "what stands behind it"), primary buttons, the solid nav cell |
| `--ink-2` | `#16203A` | secondary surface inside dark scopes (hover of dark cells, dark card inner panels) |

Never pure white as a surface. `#FFFFFF` exists only as the sprite specular `w`.

### 1.2 Ink (text)

| Token | Hex | Role | On `--card` | On `--paper` |
|---|---|---|---|---|
| `--text` | `#0E1424` | headings, body, nav labels | 17.6 AAA | 16.4 AAA |
| `--text-soft` | `#475069` | secondary copy, footer column labels, table body, sources lines | 7.7 AAA | 7.2 AAA |
| `--text-muted` | `#5C667F` | inactive tabs, placeholders, copyright, "illustrative" tags | 5.5 AA | 5.1 AA (4.7 on `--paper-2`, AA) |
| `--on-dark` | `#F4F2ED` | headings and labels on `--ink` | 16.4 AAA on ink | |
| `--on-dark-body` | `#B9C2D6` | body copy on `--ink` | 10.3 AAA on ink | |
| `--on-dark-muted` | `#7F89A2` | muted on `--ink` (card keys, footnotes) | 5.3 AA on ink | |
| `--on-dark-accent` | `#8FAEFF` (azure) | eyebrows, keys and `ACCEPTED` on `--ink` | 8.5 AAA on ink | |

### 1.3 Lines

| Token | Hex | Width | Role |
|---|---|---|---|
| `--hairline` | `#DEDBD3` | 1px | the grid: every cell border, nav dividers, rails, section seams, table rules, inputs |
| `--hairline-strong` | `#C9C5BB` | 1px | outline buttons, focus-adjacent dividers, the sticky tab card border |
| `--hairline-dark` | `#2A3655` | 1px | cell lines inside dark scopes (`navy` in the sprite palette) |
| `--grid-on-colour` | `rgba(14,20,36,.10)` | 1px | the faint grid drawn over colour bands |
| `--dot` | `#0E1424` | 4×4px | registration dots where a rail line meets a block stack or the arc |
| `--focus` | `#2F5BEA` | 2px, offset 2px | focus ring everywhere (blue on light; on dark scopes `#8FAEFF`) |

### 1.4 Actions

| Token | Value | Role |
|---|---|---|
| `--action` | `#0E1424` | primary button bg, the solid nav cell |
| `--action-hover` | `#16203A` | |
| `--action-outline` | transparent, 1px `--hairline-strong` | secondary (outline) button |
| `--action-outline-hover` | bg `#F4F2ED` | |
| `--ghost` / `--ghost-hover` | ink at 5% / 10% | ghost buttons, filter tags |
| `--action-on-dark` | bg `#F4F2ED`, text `#0E1424` | primary on the dark band |
| `--ghost-on-dark` / hover | `#F4F2ED` at 8% / 14% | |
| `--link` | inherits colour, 1px underline, offset 3px | text links. Hover: underline colour `#2F5BEA`. |

### 1.5 The ramp (the stepped bands and blocks)

Lightest first. Used **only as flat blocks**: hero blocks, diamonds, the CTA staircase, the footer strata, the colour fills of a few cells (paradox band, Bellproof diagram cell, the clients "question" cell, the `1` stat cell). Never as body text on paper.

| Step | Token | Hex | OKLCH L | Text on it |
|---|---|---|---|---|
| mist | `--ramp-0` | `#C9D5FA` | 0.87 | ink (12.6 AAA) |
| 1 azure | `--ramp-1` | `#8FAEFF` | 0.76 | ink (8.5 AAA). **Never text on paper** (1.9). |
| 2 cornflower | `--ramp-2` | `#5E87F1` | 0.64 | ink (5.4 AA). Paper on it is 3.0: large text only. |
| 3 blue | `--ramp-3` | `#2F5BEA` | 0.53 | paper (4.9 AA). White 5.5. The brand blue, `--blue`. |
| 4 indigo | `--ramp-4` | `#6331DF` | 0.49 | paper (6.2 AA) |
| 5 violet | `--ramp-5` | `#7202BC` | 0.45 | paper (7.7 AAA) |
| night | `--ramp-6` | `#321B63` | 0.30 | paper (12.8 AAA) |

Aliases: `--blue: var(--ramp-3)`, `--blue-light: var(--ramp-1)`. Accent **as text on paper** is allowed only for `--blue` (4.9 AA, used for eyebrows and the bold highlight spans), `--ramp-4` and `--ramp-5`.

**Rule of adjacency:** neighbouring blocks are always different steps and at most two steps apart, so stacks read as strata. Bands run light at the top to dark at the bottom (hero stacks, footer) or dark to light when descending into paper (CTA staircase).

**The whole page reads as one ramp:** hero blocks use steps 1–5 + mist; the CTA→footer seam steps ink → night → violet → indigo; the footer strata are blue → cornflower → azure → mist. So the ramp is laid out in order down the page, and the page ends in mist, not in black.

### 1.6 Alert (failure states only)

The deck's rust is replaced by a cool-compatible raspberry.

| Token | Hex | Role | Contrast |
|---|---|---|---|
| `--alert` | `#C0105E` | "Quantum cloud" column header, `warn` headings, cracked-stake pixels, `REJECTED`, cheating-provider border, the cascade connector | 5.4 AA on paper, 5.8 AA on card, paper on it 5.4 AA. On ink only 3.0: on dark use `--alert-tint` text or a 2px alert underline, never alert body text. |
| `--alert-tint` | `#F9E1EC` | fail backgrounds (the tall cascade bar, the "Not covered" row marker) | ink on it 14.9 AAA; alert on it 4.9 AA |

Alert is for *fail, slash, not covered, false positive/negative* only. `ACCEPTED`/`VERIFIED` is azure on dark, violet or indigo on light. The two meanings never share a colour.

### 1.7 Sprite palette (20 colours + transparent)

Key = the character used in ASCII maps. Lowercase = cool/neutral; uppercase = alert. There is no warm ramp: metals are cool, "coins" are tokens in azure/cornflower.

| Key | Name | Hex | Role |
|---|---|---|---|
| `k` | ink | `#0E1424` | silhouettes on paper, chip window, text in dark |
| `n` | night | `#321B63` | deepest shadow, violet-shadow, band step |
| `s` | navy | `#2A3655` | metal darkest, outlines on ink, dark cell lines |
| `m` | slate | `#475069` | rods, axes, metal shadow |
| `t` | steel | `#7F89A2` | metal mid, `?` glyph colour |
| `l` | silver | `#B9C2D6` | metal light, empty cell outlines |
| `e` | platinum | `#E3E8F2` | metal highlight, plate faces lit side |
| `h` | hairline | `#DEDBD3` | dust and shadows on paper, `?` block face |
| `p` | paper | `#F4F2ED` | certificate paper, knock-outs |
| `w` | white | `#FFFFFF` | specular, sparks, flash frames |
| `v` | violet | `#7202BC` | ramp 5: state vector, Bob, X-type, VERIFIED on light |
| `i` | indigo | `#6331DF` | ramp 4: shared cell, agreement |
| `b` | blue | `#2F5BEA` | ramp 3: Alice, Z-type, T blocks |
| `c` | cornflower | `#5E87F1` | ramp 2: lit outlines, tokens' rim |
| `a` | azure | `#8FAEFF` | ramp 1: glow halo, pass ring, tokens |
| `u` | mist | `#C9D5FA` | ramp 0: faint glow, band step |
| `g` | glow | `#D7E3FF` | glass fill, glow core |
| `r` | lilac | `#C5B0F6` | violet glow halo, back-side lines |
| `R` | raspberry | `#C0105E` | fail, slash, crack, REJECTED |
| `F` | raspberry-tint | `#F9E1EC` | fail background |

Ramps: **metal** `k s m t l e w` · **glow** `k n v i b c a g w` · **violet glow** `n v i r g` · **alert** `R F`. Light from the upper left, always. Full craft rules: research 03 §0–2.

---

## 2. Typography

Families (self-hosted woff2 in `public/fonts/`, `font-display: swap`, latin subset):
- **Space Grotesk 500** · every heading, nav label, button label, tab label, pill label. One weight only; hierarchy by size.
- **IBM Plex Sans 400** (and 500 for the active tab label only) · body, footer links, table cells.
- **JetBrains Mono 400** (500 for `ACCEPTED`) · eyebrows, numbers, tags, certificate rows, the ticker, lane labels, research venues. Mono uppercase gets `letter-spacing: .08em`.
- No pixel web font. Pixel glyphs inside canvases come from the engine's own 3×5 and 5×7 glyph fonts.

### 2.1 Scale (three breakpoints; not fluid)

| Token | lg ≥1024 size/line, tracking | md 768–1023 | sm <768 | Face | Where |
|---|---|---|---|---|---|
| `display` | 88 / 88, −0.02em | 64 / 64, −0.02em | 40 / 44, −0.02em | Grotesk 500 | hero H1, paradox statement, CTA headline |
| `h2` | 56 / 60, −0.01em | 44 / 48 | 30 / 36 | Grotesk 500 | section headlines |
| `h3` | 40 / 48, −0.01em | 32 / 40 | 26 / 32 | Grotesk 500 | sub-headlines ("Every classical check breaks.", "The papers behind it."), clients question (on colour: 44/48 lg) |
| `h4` | 28 / 36, 0 | 24 / 32 | 22 / 28 | Grotesk 500 | feature-row titles, card titles, cell titles |
| `h5` | 20 / 28, 0 | 20 / 28 | 18 / 26 | Grotesk 500 | tab titles, tag text, table first column |
| `h6` | 16 / 24, +0.01em | 16 / 24 | 16 / 24 | Grotesk 500 | nav, buttons, pill label, list titles |
| `lead` | 20 / 30, −0.01em | 18 / 28 | 17 / 26 | Plex 400 | sub-copy under headlines |
| `body` | 16 / 24 | 16 / 24 | 16 / 24 | Plex 400 | paragraphs, table cells, footer links |
| `small` | 13 / 20 | 13 / 20 | 13 / 20 | Plex 400 | sources lines, footnotes, copyright |
| `num-xl` | 72 / 72, −0.02em | 56 / 56 | 44 / 44 | Mono 400 | the three stats, history years, `ΔE = −12.4`, `2¹⁰⁰ ≈ 10³⁰`, `8/9`, `1` |
| `num-l` | 32 / 40 | 28 / 36 | 24 / 32 | Mono 400 | step numbers, year cells |
| `mono` | 14 / 20 | 14 / 20 | 13 / 20 | Mono 400 | certificate rows, asides, lane labels, ticker, demo details |
| `eyebrow` | 12 / 16, +0.08em, uppercase | same | 11 / 16 | Mono 400 | section eyebrows (`01 · Delegated compute`), column headers, tags |
| `micro` | 11 / 16, +0.08em, uppercase | same | same | Mono 400 | `RUNNING EXAMPLE`, `illustrative`, `COST: TINY`, lane headers |

Habits: sentence case, closing full stop on headlines. Headline measure ≤ 14 words; `h2` max-width 880px (lg). Body measure 36–44em (max-width 560px). Negative tracking only at 40px and up. Inline bold spans in copy ("**That asymmetry…**") are rendered as `color: var(--blue)` with the same weight, not bold.

### 2.2 Text motion
- **Rise reveal** (default for every headline, lead and cell when it enters the viewport): each element has `clip-path: inset(0 0 100% 0)` + `translateY(16px)`, animates to visible over 500ms `cubic-bezier(.2,.7,.2,1)`; siblings stagger 60ms. Runs once. No DOM duplication of letters, ever.
- **Hero H1**: each *line* (not letter) rises from a baseline mask, 600ms, stagger 150ms. See §5.1.
- **Ticker**: typed character by character at 40ms/char, holds 2 s, then the block cursor blinks (6 ticks on, 6 off).
- **Count-up** (stats): 600ms, eased out, mono, final digits locked. Reduced motion: final value, no typing, no rise (everything visible, static).

---

## 3. Grid, spacing, lines

### 3.1 Breakpoints and container
| Name | Range | What changes |
|---|---|---|
| `sm` | < 768 | mobile type scale, 16px gutter, module 64, nav collapses, stacked layouts |
| `md` | 768–1023 | tablet type scale, 16px gutter, module 64, nav with wordmark + menu, 2-column grids |
| `lg` | ≥ 1024 | desktop type scale, 40px gutter, module 128, full nav, rails, 1/4+3/4 splits |
| max | 1728 | content box capped and centred; outer page padding re-applied beyond 1808 |

Content box at 1440: x = 40 → 1400 (1360 wide). Many containers carry `border-inline` so the content edge is itself a grid line.

### 3.2 Modules
- **Sprite unit** `U = 4` CSS px per art pixel, site-wide, every breakpoint. A 16×16 sprite is 64×64 CSS px. (DPR handling in `engine-spec.md` §6.)
- **Band pixel** `B = 8` CSS px for everything flat and blocky: block edges, diamond steps, stepped bands.
- **Module** `M = 128` px at lg (= 16 B), `64` px below (= 8 B). Blocks are M or M/2 squares. Rails are M wide. The pixel diamond is a 15×15 stepped diamond at B (120 px) centred in an M cell; on sm it is 7×7 at B (56 px) in a 64 cell.
- **Spacing scale** (4px base): 4, 8, 12, 16, 24, 32, **40**, 64, **80**, 128, **160**. Cell padding 40 (lg) / 24 (md) / 16 (sm). Section top padding 160 above a headline block (lg) / 80 (md) / 64 (sm). Mid-section seams 80 / 64 / 48.

### 3.3 The grid-line system
1. **Everything is a cell.** Cells sit in a `.cells` container with `display:grid; gap:1px; background: var(--hairline)`; each cell paints its own surface. Lines are shared, never doubled.
2. **Seams are lines.** Every section begins with `border-top: 1px solid var(--hairline)`; the last section closes with the footer's border.
3. **Rails.** The hero has an M-wide rail on each side at lg (left only at md/sm, M=64), drawn by a 1px line on the inner edge.
4. **Registration dots.** 4×4 ink squares centred on a line: at the top of each hero block stack where it meets the rail line, where the orbit arc crosses the left rail, and at the two ends of the trust-section strings. Also at the four corners of the Magic Square panel.
5. **The orbit arc.** One 960px circle with a 1px hairline stroke, anchored off-canvas top-left (`top:-700px; left:-480px`), leaving a quarter-arc sweeping from under the nav to the left rail at y≈250. It is the equator of a Bloch sphere that is too big to see. A dotted (4 on / 4 off) second arc 24px inside it is the "back half".
6. **Grid on colour.** Colour bands and the dark CTA band carry `--grid-on-colour` lines: vertical at 48px insets from each edge and at the content-box edges, horizontal every 80px.

### 3.4 Radii and shadow
0 for all structure (cells, cards, nav, bands, blocks). 4px for buttons, inputs, tags. 8px for the sticky tab card. 999 for the two pills (announcement, `RUNNING EXAMPLE`). No shadows except the mobile menu panel (`0 8px 24px rgba(14,20,36,.08)`).

---

## 4. Components

### 4.1 Nav (`<header class="nav">`)
- Sticky, 48px + 1px bottom hairline, bg `--card`. A row of full-height cells with 1px right dividers and 16px horizontal padding. Labels `h6`.
- **lg:** `| logo 160 | Why verify | How it works | Contracts | Who it's for | Research | …spacer… | Get in touch | ▶ Watch the demo |`. The last cell is solid `--ink` with `--on-dark` text and the 8×8 pixel play glyph (32px at U) left of the label; hover `--action-hover`. "Get in touch" is a plain cell; hover bg `--paper`.
- Logo cell: the pixel bell mark at 2px/art px (24×22, SVG rects, `shape-rendering: crispEdges`) + wordmark "Bellproof" in Grotesk 500 18px, gap 10px.
- **Scroll-spy:** the cell whose section occupies the viewport centre gets bg `--paper` (the "lifted tab" look). Transition 150ms.
- **md:** `| logo 160 (mark + wordmark) | Get in touch (plain, flex 1, centred) | ▶ Watch the demo (ink) | ⣿ menu 48 |`.
- **sm:** `| mark 48 | ▶ Watch the demo (ink, flex 1, centred) | ⣿ menu 48 |`. The menu icon is a 3×3 pixel dot grid (12px at U… drawn as 3 dots of 2U with 2U gaps = 28px).
- **Open menu (sm/md):** the centre label becomes `MENU` in `micro`; the icon becomes a pixel ×. A full-height panel slides in from the right (300ms, `cubic-bezier(.4,0,.2,1)`): rows 64px tall with `h4` labels and a pixel chevron, 1px dividers; at the bottom two full-width 48px buttons: "Get in touch" (outline) and "Watch the demo" (primary). Body scroll locked. Esc closes. Focus trapped.
- Skip link "Skip to content" appears on focus at the top-left, primary-button styled.

### 4.2 Buttons
| Variant | Bg / text | Border | Hover |
|---|---|---|---|
| primary | `--ink` / `--on-dark` | none | `--ink-2` |
| outline | transparent / `--text` | 1px `--hairline-strong` | bg `--paper`, border `--text` |
| ghost | ink 5% / `--text` | none | ink 10% |
| primary-on-dark | `--paper` / `--ink` | none | `--card` |
| ghost-on-dark | paper 8% / `--on-dark` | none | paper 14% |
| text link | inherit, underline | | underline `--blue` |

- Height 48 (compact 40), padding 0 16, radius 4, label `h6`, pixel chevron 5×5 art (20px) trailing with 8px gap. Two buttons side by side: 12px gap; stacked on sm with 8px gap, full width.
- **Signature hover ("pixel step"):** the chevron steps right by one unit twice (`transform: translateX(4px)` at 0ms, `8px` at 83ms, via `transition: transform 166ms steps(2, end)`); the label does not move. On leave it steps back. Background colour 150ms `cubic-bezier(.4,0,.2,1)`. External links use the 7×7 "↗" pixel glyph instead of the chevron.
- Focus: 2px `--focus` ring, 2px offset, on every interactive element, also inside dark scopes (azure).

### 4.3 Pills and tags
- **Announcement pill:** height 56, radius 28, 1px `--hairline`, bg `--card`, padding 4 16 4 4. Left: a 48×48 tile in `--paper-2`, radius 24, holding the 12×12 TC-glyph sprite (48px). Label `h6`. Trailing chevron. Hover: bg `--paper`, plus the peek surprise described in §5.1 (a qubit creature rises from behind the pill, masked by its top edge). On sm/md the pill becomes a full-width 64px bar under the hero text with `border-block`.
- **`RUNNING EXAMPLE` chip:** `micro` text, bg `--ink`, text `--on-dark`, padding 4 12, height 24, radius 999. Placed top-right of its block, or inline before a line. Exactly as the deck.
- **`illustrative` tag:** `micro`, `--text-muted`, no background, 8px left of the number it qualifies. On dark: `--on-dark-muted`.
- **Mono tags** (`COST: TINY`, `NO QUANTUM HARDWARE NEEDED`, `FALSE POSITIVE`): `micro`, `--text-soft`, ink 5% bg, padding 4 8, radius 4. Variant `--blue` text for "with"; `--alert` text + `--alert-tint` bg for failure tags.
- **Eyebrow:** `eyebrow` style, `--blue` on light, `--on-dark-accent` on dark, 16px below the section's top padding, 16px above the headline.

### 4.4 Bordered cells and cards
- `.cells` grid as in §3.3. Cell padding per breakpoint. Cell title `h4`, body `body` in `--text-soft`, tag pinned to the bottom with `margin-top:auto`.
- Light card: a cell on `--card`. Tinted cell: `--paper`. Colour cell: a ramp step with text colour per §1.5. Dark card: `--ink` bg, `--hairline-dark` lines, `mono` rows (key `--on-dark-accent` 160px column, value `--on-dark`).
- Cells hover (only when the whole cell is a link): bg `--paper`, 150ms.

### 4.5 Tables
- A grid with `border-top` and 1px row rules. Header row `eyebrow` in `--text-soft`; a header may be coloured (`--blue` for "With Bellproof", `--alert` for "Quantum cloud" and "Without Bellproof").
- First column `h5`, other cells `body` in `--text`. Padding 16 24 (lg) / 12 16 (sm). Row min-height 72.
- sm: each row becomes a stacked card: first column as a title, the other columns as label (eyebrow) + value pairs.

### 4.6 Tabs
- **Sticky tab list (section 8):** a 1px `--hairline-strong` card, radius 8, bg `--card`, width 100% of the 1/4 column; rows 56px, padding 16, `h6`, 1px dividers; active row ink with a 7×5 pixel arrow (28px) right-aligned; inactive `--text-muted`. Sticky at `top: 73px`. Clicking scrolls to the row (smooth unless reduced motion). The active row follows scroll (row whose feature row crosses the viewport centre).
- **Vertical tabs with progress (section 6):** 5 rows, min-height 112 (lg), padding 24; each has a 20px pixel icon (5×5 art) top and an `h5` title. Inactive: bg `--paper`, `--text-muted`. Active: bg `--card`, `--text`. A 4px `--blue` bar grows down the active row's left edge over 6 s (linear; `transform: scaleY` from top), then advances. Hover pauses; click selects and stops auto-advance for good. Keyboard: arrow keys move, `aria-selected`, `role=tablist`. Reduced motion: no auto-advance, no bar.
- **Accordion (sm):** each tab is a 64px header row with a chevron that rotates by a 2-step pixel swap (› → ⌄ glyph swap, no rotation); the panel below expands with `grid-template-rows: 0fr → 1fr` 300ms.

### 4.7 CTA band (section 10)
Full-bleed `--ink`, grid overlay per §3.3.6, padding 80 40 (lg). Eyebrow azure, `display` headline in `--on-dark`, lead in `--on-dark-body`. A `.cells` row of 3 with `--hairline-dark` lines, cells 40px padding, 24×24 pixel icon (96px at U? no: icons are 6×6 art = 24px) top-left, `h4`, body pinned bottom, ghost-on-dark button. Then a centred primary-on-dark "Get in touch". The band's lower edge is the **dusk staircase** (§5.10).

### 4.8 Footer (section 11)
See §5.11.

### 4.9 Pixel icons (UI)
Every UI icon is a pixel icon drawn by the engine's bitmap system, rendered as inline SVG `<rect>`s at U (integer) via `icon()`: chevron 5×5, arrow 7×5, external 7×7, check 7×7, warn 7×7 (an exclamation in a diamond), close 7×7, menu 3×3 dots (2U each), play 8×8, caret-down 5×3. Colour follows `currentColor`. There are no outline icons.

---

## 5. Section-by-section layout spec

Section wrapper: `<section id="…" class="sec sec--<id>">`, `border-top: 1px solid var(--hairline)`, inner `.wrap` = content box. Every section has `data-tint="card|paper|ink|blue"`. Tint sequence down the page: card (hero) · card (strip) · paper (trust) · card (flip) · blue (paradox band) · card (cost) · paper (layer) · card (clients) · paper (flow) · card (verify) · paper (guarantees) · ink (CTA) · card (footer) · bands.

Art pieces are referenced by id from `art-spec.md`; sizes are art px × U.

### 5.1 Hero · `#top` · the concept: "Lowered into frame"

**What the visitor sees.** Paper, a thin grid. From the nav's bottom line, in the right third of the page, a dilution-refrigerator chandelier hangs on a hairline: five silver-platinum plates narrowing downward, a curtain of steel coax lines with azure pulses sliding down them, grey attenuator beads, and at the very bottom a navy chip box whose window glows violet. Mono temperature labels sit on hairline leaders to its left (`50 K · 4 K · 800 mK · 100 mK · 10 mK`), each anchored to a plate. To the left of it, the giant headline "Verified ◉ quantum computation, settled on-chain." with a precessing Bloch sphere inline after "Verified", the lead, two buttons, and a mono ticker. On the floor at both edges, stepped blue-violet blocks rise like strata; two small qubit creatures ride the left stack and a little certificate rides the right stack; a violet pixel diamond sits on the right rail. Everything is still except for the pulses, the sphere, and the slow, deliberate block choreography.

**Why it is ours.** The centrepiece is a scientific instrument lowered into frame like a lamp, not a mascot. The blocks are *entangled*: the left and right stacks are perfectly anti-correlated (when one sinks a module, the other rises one), and the two creatures hop in mirror sync. The arc is a Bloch equator. The intro is a cooldown.

**Geometry (lg, 1440×900).**
```
y=0    +-------+----------+-------------+-----------+-------------+----------+------------+--------------+----------------+
       |◆ Bellproof| Why verify | How it works | Contracts | Who it's for | Research |            | Get in touch | ▶ Watch the demo |  48+1
y=49   +-------+-----------------------------------------------------------------+---------------------------------------+-------+
       | rail  |   .·´ orbit arc                                                 |          ¦ hairline cable             | rail  |
       | 128   |                                                                 |          ┃                            | 128   |
       |       |  Verified ◉ quantum                                             |  50 K ···╪═══════╤═══                 |       |
       |       |  computation,                        (display 88/88, left)      |   4 K ···╪════╤══                     |       |
       |  ·    |  settled on-chain.                                              | 800 mK···╪══╤═                        |   ◆   | ← diamond (violet)
       |▓▓▓▓▓▓▓|                                                                 | 100 mK···╪═╤                          |▒▒▒▒▒▒▒|
       |▓▓qq▓▓▓|  A verification layer between the people who need quantum       |  10 mK···╪╤                           |▒▒▒▒▒▒▒|
       |▒▒▒▒▒▒▒|  answers and the clouds that compute them. Providers get paid   |          ▣ chip (violet glow)         |░░░░░░░|
       |▒▒▒▒▒▒▒|  only when the answer checks out.                               |          ·  (bit drops)               |░░░░░░░|
       |░░░░░░░|  [See how it works ›]  [Watch the demo ↗]                       |                                       |▓▓▓▓▓▓▓|
       |░░░░░░░|  job #0412 · ΔE = −12.4 ± 1.0 kcal/mol · … · ACCEPTED▌ illustr. |                                       |▓▓cc▓▓▓|
       |░░░░░░░|  [◉ Built at [Hackathon] 2026 · Watch one job… ›]  (pill)       |                            cert       |▓▓▓▓▓▓▓|
y=floor+-------+--------+-----------------------------------------------------------+--------------------+-------------+-------+
       |▓▓▓▓▓▓▓|▒▒▒▒▒▒▒▒|  (floor row: blocks only; floor blocks may slide here)   |                    |▒▒▒▒▒▒▒▒▒▒▒▒▒|░░░░░░░|  M = 128 (floor row)
       +-------+--------+--------------------------------------------------------+-----------------------+-------------+-------+
       | Built on published research | Mahadev / FOCS 2018 | KLVY / STOC 2023 | Natarajan–Zhang / FOCS 2023 | Holler–Natarajan / arXiv 2026 | Mohammed–Abadi–Mahdi / CCS 2026 |  128
       +-----------------------------+---------------------+------------------+-----------------------------+-------------------------------+---------------------------------+
```
- Hero height: `max(800px, calc(100dvh - 160px))` so the research strip peeks above the fold at 900 tall. Structure: a 3-column grid `[M rail] [1fr] [M rail]`; inside the middle, two rows: `[1fr content] [M floor]`; the content row is itself `[1fr text] [384px fridge cell]`.
- **Text column:** padding-left 40, max-width 760, vertically centred in its row with `padding-block: 80px 40px`. Headline `display`, 3 lines as written above (`<br>` after "quantum" and after "computation,"). The inline sprite `bloch-inline` (16×16 → 64px) sits after "Verified", `vertical-align: -6px`, `margin-inline: .04em .08em`, `aria-hidden`; the H1 has a visually hidden full-text copy for assistive tech. Lead (`lead`, max-width 560, `--text-soft`) 24px below. Buttons 32px below (primary "See how it works ›" → `#verify`; outline "Watch the demo ↗" → `[Demo link]`). Ticker (`mono`, `--text-soft`) 24px below the buttons, with an `illustrative` tag after it; the typed cursor is a 2U×5U ink block (8×20 px).
- **Fridge cell** (x 1016–1400 at 1440; width 384 = 3M): no border; `fridge-hero` (56×128 → 224×512; rows 109–127 are transparent fall space for the dropped bit) centred horizontally, top at the nav line (its hairline cable is part of the piece, rows 0–3). The five temperature labels are HTML (`mono`, `--text-muted`) absolutely positioned left of the fridge, right-aligned at x = fridge.left − 16, each with a 1px dotted leader (4 on 4 off) to the plate's left edge; label rows given in `art-spec.md` card 1.
- **Pill:** the last item of the text column (24px below the ticker, left-aligned to the headline), so the floor row stays free for blocks. Behind it, masked by the pill's top edge, a single qubit creature (`qubit-walker` piece in `stand` mode, 12×14 → 48×56) rises 48px into view on hover/focus (4px per frame, 12 frames → 200ms) and sinks on leave.
- **Blocks (bands system, art-spec card 15):** left rail: stack of 3 M-blocks on the floor (bottom violet, indigo, top blue); left floor x M→2M: a cornflower M-block with a mist M/2 block on top; right floor x 1400−M→1400: azure M-block; right rail: stack of 2 (indigo, blue) + diamond (violet, 15×15 at B) sitting one module above the stack; `qubit-pair` (32×16 → 128×64) rides the left rail stack; `cert-mini` (24×20 → 96×80) rides the right floor block; registration dots where each rail line meets its stack's top edge. The floor row has `overflow: hidden` on the bottom so blocks can sink out of view.
- **Orbit arc** per §3.3.5, with a dot where it crosses the left rail line.
- **Research strip:** a `.cells` row of 6: label cell (`h5`, bg `--paper`) then 5 citation cells (`mono` 14 name, `micro` venue in `--text-muted`, whole cell is a link → §12 URLs, hover `--paper`, external glyph bottom-right). Height 128 (= M). Border top and bottom.

**md (768–1023).** Rails: left only (M=64). Fridge cell 288px wide (fridge 224 centred); labels keep. `display` 64/64 in 3 lines. Blocks: left rail stack of 2 (64), floor left 64 block + 32 half, floor right 64 block with `cert-mini`; no right rail: the diamond (7×7 at B = 56) sits on the right floor block's top. Pill becomes the full-width bar. Strip: label cell spans 3, citations 3+2.

**sm (<768).** Stacked: text block (padding 64 16 24; `display` 40/44, four lines: "Verified ◉ quantum / computation, / settled / on-chain."; the inline sphere uses the 11×11 variant → 44px), lead, buttons stacked full-width, ticker (wraps, `mono` 13). Then a **fridge cell**: full width, height 480, `border-block`, the fridge hanging from the cell's top line centred, labels to its left (`micro`), floor row 64 with blocks: left corner stack of 2 (64) and `qubit-pair` (`sm` variant 24×12 → 96×48, wider than a block, so it stands on the floor beside the stack), right corner one block + 56 diamond on top. Then the pill bar (64px). Strip: 2-column grid; label cell spans 2.

**Motion.**
- *Intro (once per load; skipped entirely under reduced motion, which shows the final composition with the poster frames):*
  - 0 ms: nav, hairlines, arc fade in (300ms).
  - 100–1000: the fridge **lowers** from above the nav line (starts at −448px) to its rest, positions quantised to 4px, spacing from `power4Out` over 900ms; its cable extends with it.
  - 1000–1500: **cooldown**: labels appear top to bottom every 100ms; each plate's rim flashes azure for 1 tick as its label appears; the ticker area shows a mono readout counting `300 K → 50 K → 4 K → 800 mK → 100 mK → 10 mK` (one value per label), then clears.
  - 1500: the chip **ignites** (1 tick white, then violet glow); the first pulse starts down the coax. Idle loop starts at 1600.
  - 400–1300: H1 lines rise (600ms each, stagger 150ms); lead at 1000; buttons at 1150; pill at 1300 (all rise reveals).
  - 700–1900: blocks enter: rail stacks slide in horizontally from outside the page by one M (700ms `power4Out`, bottom block first, stagger 100ms); floor blocks rise from below the floor; riders are children of their blocks and arrive with them; registration dots fade in last (300ms).
  - 1900: ticker types (`job #0412 · ΔE = −12.4 ± 1.0 kcal/mol · test rounds passed · ACCEPTED`, 40ms/char ≈ 2.7 s), holds 2 s, cursor blinks.
- *Idle:* the block choreography (art-spec card 15: a 16.6 s yoyo sequence, moves of 0.8 s quantised to 4px, the two rails anti-correlated); sprites on their own coprime loops; a bit drops from the chip every 48 ticks (azure pixel, 2 art px per tick, lands on the floor line with a 1-tick spark); the diamond pulses violet→indigo→violet every 36 ticks.
- *Scroll:* the hero background layer (arc, blocks, fridge) gets no parallax. (Nothing in the hero depends on scroll position; it pauses when the hero leaves the viewport.)
- *Reduced motion:* static final composition; posters: fridge with pulses mid-cable and chip lit; sphere vector front-right; pair measured ↑↑; certificate stamped; ticker printed in full with a static cursor.

### 5.2 Trust · `#trust` · tint `paper`
Padding 160 0 80 (lg).
- **A. Statement with strings.** Eyebrow `01 · Delegated compute`, `h2` centred max-width 800: "We trust the cloud because we can check it." Lead centred max-width 640. Around the headline block (which is 1120 tall area at lg: `min-height: 560px`), six tag chips are absolutely positioned at lg/md in these % positions of the area (left, top; chip anchored at its centre): Storage & data (14%, 18%), AI models (82%, 14%), Genomics (8%, 62%), Risk & pricing (88%, 58%), Simulation (24%, 90%), Rollups (74%, 92%). Each chip: 1px `--hairline`, bg `--card`, padding 12 16 12 12, `h5` label, an 8×8 tag icon (32px) on the left, gap 12. Knots: 4px dots at the chip's left and right mid-edges. An SVG layer behind draws 1px `--hairline` lines from each chip's inner knot to the nearest of four knots on the headline block's bounding box (mid-left, mid-right, and two on the bottom edge at 30% and 70%); lines also run from each chip's outer knot off to the viewport edge.
  - Motion: chips rise in (translateY 8px + opacity, 300ms, stagger 70ms) when the section enters; then each drifts on its own loop (±4px, periods 6.2 / 7.1 / 8.3 / 9.1 / 6.7 / 7.9 s, positions rounded to 4px) and the strings follow (recomputed each rAF while visible). Chips are draggable on lg (pointer events; spring back to home over 600ms with `backOut`), the one toy on this page besides the Magic Square. Icons idle-bob 1 art px on their own phases.
  - sm: chips stack in a centred column, 12px gap, no strings, no drag.
- **B. Four cells** (`.cells`, 4 columns lg / 2×2 md / 1 sm), each: `h4` title, body `--text-soft`, mono tag bottom. The "Check it" cell header hosts `check-scale` (32×20 → 128×80) above the title; the other three get 16×16 icons (64px): loop arrow, target, chain-tick. Strings: titles "Check it / Re-run it / Test it / Prove it" and bodies and tags exactly as content §5.
- **C. Closing line:** `h3` centred, "Checking is cheaper than computing. **That asymmetry is what makes delegation safe.**" (bold span → `--blue`). 80px above.
- **D. Running example chip + line:** chip then `body` text, centred, max-width 640, 24px below C.

### 5.3 Flip · `#flip` · tint `card`
- **A.** Two columns 7/12 + 5/12 at lg (stack at sm): eyebrow `02 · Quantum in the cloud`, `h2` "Quantum hands back one number. Good luck checking it.", lead. Right: a bordered cell (bg `--paper`, min-height 320) holding `fridge-out` (48×48 → 192×192) centred, with its alt text.
- **B. Running example.** A `.cells` row: left cell (6/12) with the chip top-right, `h5` "The question" + `h4` question text; eyebrow "Why quantum" + body. Right column (6/12) = two stacked cells: card 1 light (eyebrow `What comes back`, `num-xl` `ΔE = −12.4`, body "kcal/mol. One classical number." + `illustrative`); card 2 dark (`--ink`; eyebrow azure `What stands behind it`, `num-xl` `2¹⁰⁰ ≈ 10³⁰` in `--on-dark`, body `--on-dark-body`).
- **C. Table.** `h3` "Every classical check breaks." then the 3-column table; "Quantum cloud" header in `--alert`. sm: stacked cards.
- **D. Paradox band** `#paradox`: full-bleed `--ramp-3` blue, padding 128 40 (lg) / 80 16; eyebrow `The verification paradox` in `--ramp-0` mist; `display` statement in `--on-dark` paper, max-width 1000; sub `lead` in mist. Stepped blocks at both edges inside the band: left edge a 2-stack (indigo on the floor, violet above) of M blocks sitting on the band's bottom edge; right edge a mist M/2 block on an indigo M block; `question-block` (16×16 → 64px) stands on the right stack. Grid-on-colour lines. Motion: when the band enters, the `?` block **bumps** once (rises 2 art px for 2 ticks, squash frame, settles). The statement rises in.

### 5.4 Cost · `#cost` · tint `card`
Four beats separated by hairlines (80px apart).
- **A.** Eyebrow `03 · The cost of a wrong answer`, `h2`, lead. Then `.cells` 3×2 (lg) / 2×3 (md) / 1 (sm); each cell: a 16×16 icon from `glitch-cells` (64px) top-left, `h4` title, body. Hover glitches the icon (1–2 frames).
- **B. Cascade.** Chip `RUNNING EXAMPLE`. `h3` "In drug discovery, the compute bill is the smallest line item." + body. Then the **staircase**: a 5-column grid aligned to the bottom, bars are cells with bg `--paper` and heights 80/160/240/320/400 (lg) (sm: a horizontal bar chart: 5 rows, widths 20/40/60/80/100%); bar 1 bg `--ink` with `--on-dark` text, bar 5 bg `--alert-tint`; inside each bar top: `micro` number (`1`–`5`), `h5` title, `small` body. Under the bars, a 1px `--alert` connector line full width with the labels `mono` left "A wrong ΔE enters here" and right "…and surfaces here, if ever". `cascade-coin` (32×24 → 128×96) rides the connector: moves right in 4px steps, pausing under each bar where its stack grows by one; at bar 5 the tower wobbles; then it dissolves and restarts (loop ≈ 60 ticks per bar → 5 s total). Then the FP/FN two cells (alert tags, `h4`, body).
- **C. Stats.** `.cells` of 3: `num-xl` big number top (count-up on enter), `body` caption bottom. The `small` sources line under the row. Closing `h3` "Candidate A's ΔE decides whether it enters this pipeline. **That number is worth verifying.**"
- **D. History.** `.cells` of 3: `num-xl` year, `h5` who, `mono` line in `--alert` ("$475M charge" etc.), body. Sources line. Closing `h3`. No sprites.

### 5.5 Layer · `#layer` · tint `paper`
- **A.** Eyebrow `04 · The verification layer`, `h2`, lead; centred, max-width 880.
- **B. Diagram.** Grid `[1fr] [192px] [1.4fr] [192px] [1fr]` at lg; min-height 360. Cells: left (bg `--card`, cell border) with `lab-bench` sprite (24×24 → 96) top, `h4` Clients, body, tag `NO QUANTUM HARDWARE NEEDED`; centre `--ramp-3` blue with `vault` sprite (24×24) top, `h4` Bellproof in paper, two mono-ruled rows (`Smart contracts` / `Verifier`, dividers `rgba(244,242,237,.4)`); right cell with `fridge-mini` (16×24 → 64×96), `h4` Quantum clouds, body, tag `NO BRAND TRUST REQUIRED`. Lanes: each lane column holds two `mono` labels (top label above a 1px hairline, bottom label below a second hairline) and `lane-left` / `lane-right` canvases (48×24 → 192×96) between the hairlines carrying the packets: left lane top row coin+envelope → right, bottom row certificate scroll ← left; right lane top padlocked question cards → right, bottom answer pixels ← left. sm/md<1024: the three cells stack and the lanes become vertical (the pieces' `v` variants, 24×48) with labels beside them.
- **C.** `h3` line 1 ("Providers are paid only when verification passes. **Fake a number, lose your stake.**"), then the pull quote as `h4` in `--text` with a 2U×full-height `--blue` left bar (the "pixel bracket": a 4px bar plus 2 art-px ticks at the top and bottom), then the `small` note in `--text-soft`.
- **D. With/without table** `#with-without` with chip; headers `Without Bellproof` in `--alert`, `With Bellproof` in `--blue`. Then text link `See the contracts →` → `#flow`.

### 5.6 Clients · `#clients` · tint `card`
- Header row: eyebrow + `h2` left; outline button `Talk to us` right (bottom-aligned); lead below the headline max-width 640; hairline under the row.
- Grid `[340px] [1fr]` (lg). Left: the vertical tab list (§4.6). Right: `.cells` 2 rows: the **question cell** (bg `--ramp-3`, `--on-dark` text, min-height 320, padding 40): eyebrow in mist "Their question", `h3` 44/48 question text; the client sprite (48×48 → 192) bottom-right with 40px inset, swapped via a 4-step dither dissolve (engine helper) on tab change. Second cell (bg `--card`): two columns: eyebrow "What rides on it" + `h4`; eyebrow "What the certificate does" + body (+ chip on the pharma tab).
- Tabs auto-advance every 6 s; the question text and sprite swap together (text: 150ms fade; sprite: 4-tick dissolve).
- md/sm: accordion; the panel renders inside the open item.

### 5.7 Flow · `#flow` · tint `paper`
- **A.** Grid 6/12 + 6/12: eyebrow `06 · Smart contracts` + `h2` left; lead right, bottom-aligned.
- **B. Swimlanes.** A two-column grid with a 1px centre spine (`--hairline`); lane headers (`micro`): left `ON-CHAIN · money, commitments, verdicts`, right `OFF-CHAIN · quantum work, heavy math`, each with `border-bottom`. Seven step rows, each 128 tall (lg), zig-zagging: on-chain steps occupy the left column, off-chain the right; a step is a **pill-card**: radius 4, padding 16 20, `num-l` step number, `h5` step title, body, and the mono aside (`--text-muted`) below; on-chain cards bg `--ramp-1` azure with ink text? No: azure fill is loud ×5. On-chain cards: bg `--card`, border-left 4px `--blue`, mono aside in `--blue`. Off-chain cards: bg `--card`, 1px `--hairline` border. The aside column header `illustrative` once at the top right. Beside each on-chain step, in a 64px gutter next to the spine, a `chain-block` canvas (16×16 → 64) with that step's glyph; beside Run `fridge-mini`, beside Verify `magnifier-scroll`. The **job token** (`job-token`, 12×12 → 48) travels down the spine: its vertical position is scroll-driven (the section's progress 0→1 maps to steps 1→7, snapped to the step rows, moved in 4px steps), with a time-based fallback (advances one step every 2 s while visible if the user has not scrolled for 4 s). As the token reaches a step, that step's chain block **clicks** (lights one ramp step, drops 2 art px and settles) and the card's left bar flashes azure for 1 tick. At Settle, the `settle` scene (48×24 → 192×96) under the last on-chain block plays honest and cheat alternately.
- **C. Outcome cells**: 2 cells, equal; honest: 2px `--blue` border (inside the hairline), check icon, `h4`, numbered list; cheating: 2px `--alert` border, warn icon.
- **D.** Note row (`h5` question + body) and the `mono` demo details line; two buttons (outline `Watch the demo ↗`, outline `Read the contracts ↗`).
- sm: single column; each step shows a lane tag (`micro`), the chain blocks sit left of the cards in a 64px gutter; the token still travels the spine on the left.

### 5.8 Verify · `#verify` · tint `card`
- Centred eyebrow `07 · How we verify`, `h2`, lead (max-width 760), padding-top 160.
- Grid `[340px] [1fr]` (lg): sticky tab list left; right a stack of three **feature rows** (cells with `border-top`), each min-height 480, padding 40, grid `[5fr] [7fr]` with 40 gap; copy block: `h3`, body, extras, CTA; panel: a bordered cell with a **mosaic** background (tiles of 40px = 5U in two ramp tints, pattern seeded, one tile per row a diamond tile) and the sprite centred on an opaque `--card` plate with 16px padding. Rows alternate copy/panel sides (copy left, panel right; panel left, copy right; copy left, panel right). md: the tab list becomes a horizontal 3-tab strip above the rows and each row stacks copy then panel. sm: accordion headers (`h5`) then copy then panel.
  - **Row 1 (`#verify-games`)**: panel tints `--ramp-5`/`--ramp-4`; sprite `magic-square` (96×64 → 384×256). Extras: stat pair (two cells: `8/9` `num-xl` + caption; the `1` cell bg `--ramp-3` with paper text), the small explainer (`h5` + body), the `RIGIDITY` eyebrow + body. CTA text link `Read the papers →` → `#research`. Under the panel: `mono` readout `classical ≤ 8/9 · quantum = 1`.
  - **Row 2 (`#verify-compiler`)**: panel tints `--ramp-3`/`--ramp-2`; sprite `wall-to-lock` (96×48 → 384×192) with HTML `micro` label under it that swaps `PHYSICAL SEPARATION` / `CRYPTOGRAPHIC SEPARATION` in sync with the piece's state (the piece exposes `state`). Extras: two mini-cells with `border-top` (eyebrows `POST-QUANTUM SECURITY`, `FROM GAMES TO COMPUTATION` + body). CTA outline `Read KLVY (STOC 2023) ↗`.
  - **Row 3 (`#verify-rounds`)**: chip; panel tints `--ramp-1`/`--ramp-0`; sprite `tc-rounds` (128×40 → 512×160) with two HTML `micro` labels `VERIFIER'S SECRET SCHEDULE` / `WHAT THE PROVIDER SEES` positioned beside its rows. Extras: three mini-cards (`.cells` 3 / stacked sm): Test round / Compute round / Verdict. CTA outline `Watch a cheater fail ↗`.
- **Research list** `#research`: `h3` "The papers behind it." + lead; `.cells` rows ×5, grid `[96px] [1fr] [200px] [112px]` (lg): `num-l` year; authors (`body`) + title (`h5`, italic off) + "what it gives us" in `small --text-soft`; venue `mono`; link cell `arXiv ↗` (whole cell a link). sm: year + stacked.

### 5.9 Guarantees · `#guarantees` · tint `paper`
- **A.** Eyebrow `08 · The certificate`, `h2`, lead (left-aligned, max-width 880).
- **B.** Grid 7/12 + 5/12: the **certificate card** (dark, `--ink`, padding 40, `eyebrow` azure title `BELLPROOF CERTIFICATE · ILLUSTRATIVE`; 8 mono rows, key column 160px azure, values paper; `verdict` value `ACCEPTED` in azure Mono 500). `cert-mint` (72×48 → 288×192) is anchored to the card's top-right corner, overlapping the card edge by 32px, on the paper side. Right: "Where it goes" list: eyebrow, 4 items with `border-top`, `h4` + body.
- **C.** `.cells` of 2, equal height: Guaranteed (bg `--card`, `h4` in `--blue`, 4 rows with the 7×7 check icon in `--blue`); Not covered (bg `--paper-2`, `h4` in `--alert`, 2 rows with the warn icon in `--alert`, bold lead-ins as `--text` then body `--text-soft`). Footnote `small` under the Not covered cell.
- **D.** Chip + `h3` closing line; text link `See a sample transcript →` → `[GitHub]`.
- Motion: certificate rows type in (engine typewriter over mono rows, 20ms/char, row by row) when the card enters, then `cert-mint` plays its stamp; the two are synchronised by the section script (the piece's `stamp` input is set when typing finishes).

### 5.10 CTA · `#cta` · tint `ink`
Per §4.7. Eyebrow `Bellproof`, `display` "Delegate quantum work. Verify every answer.", lead. Three cells (icons 6×6 → 24px azure: play / code / book; titles and bodies per content), buttons ghost-on-dark. Centred primary-on-dark "Get in touch". Then the **dusk staircase**: a 64px-tall strip at the band's bottom edge, drawn by the bands system (art-spec card 15, "staircase"): three tiers left→right in night, violet and indigo, each a sawtooth of 8px steps descending toward the footer's paper, so the ramp continues from the ink (ink → night → violet → indigo) and later resumes in the footer strata (blue → cornflower → azure → mist). `walkers` (Alice and Bob with their link, 40×16 → 160×64) walk along the top edge of the staircase from left to right in 4px steps at 8 fps, descending with the steps, pause to high-five in the middle (the shared-cell flash), continue, and re-enter from the left after leaving at the right; hover pauses them. Reduced motion: walkers standing mid-stair, poster frame.

### 5.11 Footer · `#footer` · tint `card`
1. **Link columns**: `.cells` 4 full-bleed columns (sm: stacked), padding 40 24: `small` column label in `--text-soft`, then links `body` 28px rhythm. Contents per content §13.
2. **Sub-footer** (padding 40): row 1: pixel social glyphs 24px (6×6) with text labels (`[GitHub]`, `[X]`, `[Discord]`, shipped only when supplied) left; the tagline `h6` right. Row 2 (min-height 280): copyright `small` left; the **giant bell mark** (12×11 at 20px/art px = 240×220, ink, SVG rects) centred and bottom-aligned on the top band; `Built at [Hackathon] by [Team]` small right; a `small` note "Figures marked "illustrative" are examples." also in the Legal column.
3. **Strata**: 256px, four 64px bands top→bottom `--ramp-3` blue, `--ramp-2` cornflower, `--ramp-1` azure, `--ramp-0` mist; grid-on-colour lines; a 512px quarter-arc (ink 10%) at the right; `qubit-walker` (12×14 → 48×56) patrols band 2 (cornflower), reversing at the content-box edges.
- **Footer reveal:** the bell rises from behind the bands as the sub-footer scrolls into view: `translateY` from 100% to 0, scrubbed to scroll progress (the sub-footer's top from viewport bottom to viewport bottom − 280), positions in 20px steps (one art px of the mark). When fully risen and the viewport reaches the page bottom: the **ring** gag once per visit (the clapper swings 3 times at 6 fps and an azure ring pixel-expands from the bell for 3 ticks). Reduced motion: the bell is simply in place; no ring.

---

## 6. Accessibility and quality bar
- Text contrast per §1 tables. Text never sits on animated pixel art.
- Every canvas: `role="img"` + `aria-label` from the piece's `alt`; purely decorative instances (hero riders, walkers) `aria-hidden="true"`.
- Keyboard: tabs with arrow keys; the mobile menu traps focus; skip link; all hover-only reveals also trigger on focus.
- `prefers-reduced-motion: reduce` → no intro, no loops, no auto-advance, no scroll-driven motion, posters everywhere, instant reveals; the media query is watched live.
- Zero layout shift from art: every canvas container reserves its CSS size.
- Lighthouse targets: Performance ≥ 90 (mobile), Accessibility 100, Best Practices 100.

// Nav · design-spec §4.1. Owner: layout-core.
// mount(root): the mobile menu (slide-in panel, focus trap, Esc, scroll lock), scroll-spy, placeholder-link guard.
// Also the site-chrome helpers every section may use:
//   prepareIcons(root)  swap [data-icon] whose piece is not registered yet for a fallback glyph (or the placeholder)
//   uiIcon(id, size)    SVG markup for a UI glyph: the engine's icon() when registered, else the fallback
//   hydrate(root)       fillStrings + mountAll + icons + reveal + placeholder links, for markup a section renders itself

import { Grid, hasPiece, hydrateIcons, iconSVG, motion, mountAll, mountedOf, reveal, runs, type Mounted } from '../engine';
import { fillStrings } from '../content/fill';
import { artModule } from '../art/registry';
import { isPlaceholder, strings } from '../content/strings';

/* ------------------------------------------------------------------ fallback glyphs
   Stand-ins until art-icons (art-spec card 11) and logo-mark (card 16) register their pieces. One colour,
   drawn with currentColor; same SVG shape as the engine's icon() (merged rect runs, crispEdges). */
const GLYPHS: Record<string, string> = {
  'ui-chevron': `
.#...
..#..
...#.
..#..
.#...`,
  'ui-arrow': `
...##..
....##.
#######
....##.
...##..`,
  'ui-external': `
..#####
.....##
....###
...##.#
..##..#
.##....
##.....`,
  'ui-external-sm': `
..###
...##
..#.#
.#...
#....`,
  'ui-close': `
#.....#
##...##
.##.##.
..###..
.##.##.
##...##
#.....#`,
  'ui-menu': `
#..#..#
.......
.......
#..#..#
.......
.......
#..#..#`,
  'ui-caret': `
#...#
.#.#.
..#..`,
  'ui-play': `
##......
####....
######..
########
########
######..
####....
##......`,
  // the bell, from art-spec card 16 (12×11): crown, shoulders, skirt, rim, clapper; the ✓ is negative space
  'logo-mark': `
.....##.....
....####....
...######...
...######...
...######...
..########..
..######.#..
.######.###.
.###.#.####.
#####.######
.....##.....`,
};

const ALLOWED_SIZES = new Set([2, 4, 8, 20]);

/* ------------------------------------------------------------------ art hooks
   logo-mark (card 16) and bands (card 15) export DOM helpers besides their pieces. They are looked up here
   without a hard import, and used only when their piece is in this build (so `BP_ONLY=placeholder` builds
   exercise the fallbacks). */
// integrator R2 (queue #2, #9): looked up through the art registry's module map (no glob of our own), so a BP_ONLY build
// leaves out bands/logo-mark/icons here as well and a half-edited folder cannot break it.
export function artExport<T>(folder: string, name: string, needPiece?: string): T | undefined {
  if (needPiece && !hasPiece(needPiece)) return undefined;
  const v = artModule(folder)?.[name];
  return v as T | undefined;
}
type MarkSVG = (opts: { scale: number; label?: string; className?: string }) => string;

function glyphGrid(id: string): Grid | null {
  const src = GLYPHS[id];
  if (!src) return null;
  const rows = src.trim().split('\n').map((r) => r.trim());
  const g = new Grid(rows[0].length, rows.length);
  rows.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') g.set(x, y, 'k'); }));
  return g;
}

function svgFromGrid(g: Grid, size: number, label = ''): string {
  const rects = runs(g).map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="1"/>`).join('');
  const aria = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="icon icon--fallback" width="${g.w * size}" height="${g.h * size}" viewBox="0 0 ${g.w} ${g.h}" shape-rendering="crispEdges" fill="currentColor" ${aria}>${rects}</svg>`;
}

/** SVG markup for a UI glyph or the bell: the registered piece when it exists, else the fallback, else the placeholder. */
export function uiIcon(id: string, size = 4, label = ''): string {
  const s = ALLOWED_SIZES.has(size) ? size : 4;
  if (id === 'logo-mark') {
    // the bell as logo-mark's own SVG (halo + body + clapper groups), so ring() can animate it
    const markSVG = artExport<MarkSVG>('logo-mark', 'markSVG', 'logo-mark');
    if (markSVG) return markSVG({ scale: s, label, className: s === 2 ? 'mark--nav' : 'mark--footer' });
  }
  if (hasPiece(id)) return iconSVG(id, { size: s, label });
  const g = glyphGrid(id);
  if (g) return svgFromGrid(g, s, label);
  return hasPiece('placeholder') ? iconSVG('placeholder', { size: 4, variant: 'sm', label }) : '';
}

/** Replace every [data-icon] whose piece is not registered with a fallback glyph, so hydrateIcons() never throws. */
export function prepareIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => {
    const id = el.dataset.icon ?? '';
    if (hasPiece(id) && id !== 'logo-mark') return;
    const tpl = document.createElement('template');
    tpl.innerHTML = uiIcon(id, el.dataset.size ? Number(el.dataset.size) : 4, el.dataset.label ?? '');
    const svg = tpl.content.firstElementChild;
    if (svg) el.replaceWith(svg); else el.remove();
  });
}

/* ------------------------------------------------------------------ whole-px icons
   art-icons' placement rule: icon boxes land on whole CSS px. Vertical centring is solved in CSS (flex boxes
   with even slack); horizontally a trailing glyph inherits its label's fractional text width, and cells on
   fractional grid columns do too. snapIcons() offsets each icon by its sub-pixel remainder with the
   `translate` property (no layout change; data-hop moves the rects inside, unaffected). Re-run on resize
   and after fonts load; hydrate() runs it for markup a section renders. */
export function snapIcons(root: ParentNode = document): void {
  const svgs = [...root.querySelectorAll<SVGSVGElement>('svg.icon, svg.mark')].filter((s) => s.getClientRects().length);
  const fixes = svgs.map((s) => {
    // `translate` serialises as "x" when y is 0, so default each part separately
    const parts = (s.style.translate || '').split(' ');
    const ox = parseFloat(parts[0] ?? '') || 0, oy = parseFloat(parts[1] ?? '') || 0;
    const r = s.getBoundingClientRect();
    const x = r.left - ox, y = r.top - oy;
    return [s, Math.round(x) - x, Math.round(y) - y] as const;
  });
  for (const [s, dx, dy] of fixes) {
    const v = Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01 ? '' : `${dx.toFixed(3)}px ${dy.toFixed(3)}px`;
    if (s.style.translate !== v) s.style.translate = v;
  }
}
let snapping = false;
function watchSnap(): void {
  if (snapping) return;
  snapping = true;
  let raf = 0;
  const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => snapIcons(document)); };
  document.fonts?.ready.then(run);
  document.fonts?.addEventListener?.('loadingdone', run);               // web fonts swapping in change label widths
  if (typeof ResizeObserver === 'function') new ResizeObserver(run).observe(document.body);   // any reflow (sections mounting)
  window.addEventListener('resize', run, { passive: true });
  window.addEventListener('load', run, { once: true });
  document.addEventListener('bp:snap', run);
}

/* ------------------------------------------------------------------ placeholder links
   Content keeps unfilled hrefs verbatim (`[Demo link]`, `mailto:[Contact email]`). They must never navigate:
   the click is cancelled, the link is announced as unavailable, and the tooltip names the placeholder. */
function placeholderHref(a: Element): string | null {
  const href = a.getAttribute('href');
  return href && isPlaceholder(href) ? href : null;
}

export function markPlaceholderLinks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((a) => {
    const href = placeholderHref(a);
    if (!href) return;
    a.dataset.placeholder = '';
    a.setAttribute('aria-disabled', 'true');
    if (!a.title) a.title = href.replace(/^mailto:/, '');
  });
}

let guarded = false;
function guardPlaceholderLinks(): void {
  if (guarded) return;
  guarded = true;
  const cancel = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.('a[href]');
    if (a && placeholderHref(a)) e.preventDefault();
  };
  document.addEventListener('click', cancel, true);
  // final validation: a middle-click fires `auxclick`, not `click`, and opened `/[Demo link]` (a 404) in a new tab
  document.addEventListener('auxclick', cancel, true);
  // sections render after boot: mark their links once everything has mounted
  window.addEventListener('load', () => markPlaceholderLinks(document), { once: true });
}

/* ------------------------------------------------------------------ in-page links
   Smooth scroll to #targets (a jump under reduced motion), honour scroll-padding (the sticky nav), update the
   URL, and move focus to the target so keyboard and screen-reader users land where they asked. */
let anchored = false;
function setupAnchors(): void {
  if (anchored) return;
  anchored = true;
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]');
    const id = a?.getAttribute('href')?.slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: motion.reduced ? 'auto' : 'smooth', block: 'start' });
    if (location.hash !== `#${id}`) history.pushState(null, '', `#${id}`);
    if (!target.matches('a[href], button, input, select, textarea, [tabindex]')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });
}

/* ------------------------------------------------------------------ pills (revision §1.1.8, LC5)
   A .pill's tile piece (tc-glyph `sm`) flips ?→T→C→? on hover/focus of the whole pill (art-icons hoverable()). */
type Hoverable = (target: HTMLElement, m: Mounted) => () => void;
export function wirePills(root: ParentNode = document): void {
  const hoverable = artExport<Hoverable>('icons', 'hoverable', 'tc-glyph');
  if (!hoverable) return;
  root.querySelectorAll<HTMLElement>('.pill:not([data-pill-wired])').forEach((pill) => {
    const tile = pill.querySelector<HTMLElement>('.pill__tile [data-piece]');
    const m = tile ? mountedOf(tile) : undefined;
    if (!m) return;
    hoverable(pill, m);
    pill.dataset.pillWired = '';
  });
}

/** Everything a section needs after rendering its own markup into `root`. Idempotent. */
export function hydrate(root: HTMLElement): void {
  fillStrings(root);
  mountAll(root);
  prepareIcons(root);
  hydrateIcons(root);
  reveal(root);
  markPlaceholderLinks(root);
  wirePills(root);
  requestAnimationFrame(() => snapIcons(root));
}

/* ------------------------------------------------------------------ the menu */
const LG = '(min-width: 1024px)';

function focusables(scope: ParentNode): HTMLElement[] {
  return [...scope.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((el) => el.offsetParent !== null || el.getClientRects().length > 0);
}

function setupMenu(nav: HTMLElement): void {
  const toggle = nav.querySelector<HTMLButtonElement>('.nav__toggle');
  const panel = nav.querySelector<HTMLElement>('.nav__panel');
  if (!toggle || !panel) return;
  const outside = [document.querySelector<HTMLElement>('main'), document.querySelector<HTMLElement>('footer'), document.querySelector<HTMLElement>('.skip'), nav.querySelector<HTMLElement>('.nav__logo')]
    .filter((el): el is HTMLElement => !!el);
  let open = false;

  const setOpen = (next: boolean, restoreFocus = true) => {
    if (open === next) return;
    open = next;
    nav.classList.toggle('is-open', open);
    nav.dispatchEvent(new CustomEvent('bp:menu', { detail: open }));
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? strings.ui.menuClose : strings.ui.menuOpen);
    // scroll lock without layout jump (desktop browsers with classic scrollbars)
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.toggle('is-locked', open);
    document.documentElement.style.paddingRight = open && sbw > 0 ? `${sbw}px` : '';
    outside.forEach((el) => { el.inert = open; });
    if (open) {
      requestAnimationFrame(() => snapIcons(panel));
      const first = panel.querySelector<HTMLElement>('a[href], button');
      // wait for visibility to flip before moving focus into the panel
      requestAnimationFrame(() => first?.focus({ preventScroll: true }));
    } else if (restoreFocus) {
      toggle.focus({ preventScroll: true });
    }
  };

  toggle.addEventListener('click', () => setOpen(!open));
  panel.addEventListener('transitionend', (e) => { if (e.target === panel && open) snapIcons(panel); });

  // ⣿ ⇄ × : art-icons' morph() (menu → diagonal dots → close, one tick per step); plain swap without it
  type MorphFn = (holder: Element, steps: unknown[], opts?: { size?: number }) => Promise<void>;
  const morph = artExport<MorphFn>('icons', 'morph', 'ui-menu');
  const MORPHS = artExport<Record<string, unknown[]>>('icons', 'MORPHS', 'ui-menu');
  const holder = toggle.querySelector<HTMLElement>('.nav__toggle-icon');
  const swapIcon = (toOpen: boolean) => {
    if (!holder) return;
    if (morph && MORPHS) { void morph(holder, (toOpen ? MORPHS.menuToClose : MORPHS.closeToMenu) ?? [], { size: 4 }).then(() => snapIcons(nav)); return; }
    holder.innerHTML = uiIcon(toOpen ? 'ui-close' : 'ui-menu', 4);
  };
  nav.addEventListener('bp:menu', ((e: CustomEvent<boolean>) => swapIcon(e.detail)) as EventListener);

  nav.addEventListener('keydown', (e) => {
    if (!open) return;
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return; }
    if (e.key !== 'Tab') return;
    const items = [toggle, ...focusables(panel)];
    const first = items[0], last = items[items.length - 1];
    const active = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (active === first || !nav.contains(active))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (active === last || !nav.contains(active))) { e.preventDefault(); first.focus(); }
  });

  // following a row closes the menu first (unlocks scroll), then the anchor jump proceeds
  panel.addEventListener('click', (e) => {
    const a = (e.target as Element).closest('a[href]');
    if (!a) return;
    if (placeholderHref(a)) return;
    setOpen(false, false);
  });

  const mq = matchMedia(LG);
  const panelHidden = () => mq.matches && !nav.classList.contains('nav--compact');
  mq.addEventListener('change', () => { if (panelHidden()) setOpen(false, false); });
  nav.addEventListener('bp:compact', () => { if (panelHidden()) setOpen(false, false); });
}

/* ------------------------------------------------------------------ scroll-spy
   The cell whose section holds the viewport's centre line gets aria-current (bg --paper, 150ms).
   Nested targets (#research inside #verify) win over their parent. */
function setupSpy(nav: HTMLElement): void {
  const links = [...nav.querySelectorAll<HTMLAnchorElement>('[data-spy]')];
  const ids = [...new Set(links.map((a) => a.dataset.spy!))];
  if (typeof IntersectionObserver !== 'function') return;
  const inside = new Set<HTMLElement>();
  let current: string | null = null;
  let watched: HTMLElement[] = [];

  const apply = () => {
    let best: HTMLElement | null = null;
    for (const t of inside) if (!t.isConnected) inside.delete(t); else if (!best || best.contains(t) || t.offsetHeight < best.offsetHeight) best = t;
    const id = best?.id ?? null;
    if (id === current) return;
    current = id;
    for (const a of links) {
      if (a.dataset.spy === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
  };
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const t = e.target as HTMLElement;
      if (e.isIntersecting) inside.add(t); else inside.delete(t);
    }
    apply();
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

  // Sections replace their markup after boot (and mount lazily), so a target such as #research can be a new
  // element: re-query the ids whenever <main> changes, and re-observe the ones that moved.
  const requery = () => {
    const next = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (next.length === watched.length && next.every((el, i) => el === watched[i])) return;
    watched.forEach((el) => { if (!next.includes(el)) { io.unobserve(el); inside.delete(el); } });
    next.forEach((el) => { if (!watched.includes(el)) io.observe(el); });
    watched = next;
    apply();
  };
  requery();
  const main = document.querySelector('main');
  if (main && typeof MutationObserver === 'function') {
    let t = 0;
    new MutationObserver(() => { clearTimeout(t); t = window.setTimeout(requery, 120); }).observe(main, { childList: true, subtree: true });
  }
}

/* ------------------------------------------------------------------ pause motion (revision §1.10, a11y #5)
   <button aria-pressed data-motion-toggle> in the bar and in the menu. The accessible name stays
   "Pause motion" (APG toggle-button pattern: the state is aria-pressed, the label does not flip); the glyph
   swaps ui-pause → ui-play-sm in the same 5×5 box. motion.setPaused() persists and notifies every piece. */
function setupPause(nav: HTMLElement): void {
  const buttons = [...nav.querySelectorAll<HTMLButtonElement>('[data-motion-toggle]')];
  if (!buttons.length) return;
  const sync = () => {
    const paused = motion.paused;
    for (const b of buttons) {
      if (b.getAttribute('aria-pressed') === String(paused)) continue;
      b.setAttribute('aria-pressed', String(paused));
      const holder = b.querySelector('.nav__pause-icon');
      if (holder) holder.innerHTML = uiIcon(paused ? 'ui-play-sm' : 'ui-pause', 4);
    }
    snapIcons(nav);
  };
  for (const b of buttons) b.addEventListener('click', () => { motion.setPaused(!motion.paused); });
  motion.onChange(sync);
  sync();
}

/* ------------------------------------------------------------------ compact (a11y #13)
   At 200 % text zoom (or any width where the bar's row no longer fits) the nav switches to the sm layout.
   The check toggles the class off, measures, and puts it back in the same frame (no paint in between). */
function setupCompact(nav: HTMLElement): void {
  const bar = nav.querySelector<HTMLElement>('.nav__bar');
  if (!bar || typeof ResizeObserver !== 'function') return;
  const sm = matchMedia('(max-width: 767.98px)');
  let raf = 0;
  const check = () => {
    raf = 0;
    if (sm.matches) { nav.classList.remove('nav--compact'); return; }
    const was = nav.classList.contains('nav--compact');
    nav.classList.remove('nav--compact');
    const overflow = bar.scrollWidth > bar.clientWidth + 1;
    nav.classList.toggle('nav--compact', overflow);
    if (was !== overflow) nav.dispatchEvent(new CustomEvent('bp:compact', { detail: overflow }));
  };
  const schedule = () => { if (!raf) raf = requestAnimationFrame(check); };
  // the bar keeps its own size when its row overflows, so watch the cells (they grow with text zoom)
  const ro = new ResizeObserver(schedule);
  ro.observe(bar);
  bar.querySelectorAll<HTMLElement>(':scope > *, .nav__items > li').forEach((el) => ro.observe(el));
  document.fonts?.addEventListener?.('loadingdone', schedule);
  window.addEventListener('resize', schedule, { passive: true });
  check();
}

/* ------------------------------------------------------------------ mount */
export function mount(root: HTMLElement): void {
  guardPlaceholderLinks();
  setupAnchors();
  watchSnap();
  markPlaceholderLinks(document);
  setupMenu(root);
  setupSpy(root);
  setupPause(root);
  setupCompact(root);
  wirePills(document);
}

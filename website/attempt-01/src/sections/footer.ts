// Footer · design-spec §5.11. Owner: layout-core.
// mount(root): renders the link columns and socials from strings, builds the strata (bands API when it lands,
// the engine's stripe() until then), runs the qubit-walker patrol on band 2, and the bell reveal + ring.

import { clock, hasPiece, mount as mountPiece, motion, moveUnits, observe, rng, sizeOf, stripe, type Mounted, type TickSub, type FrameSub } from '../engine';
import { escapeHTML, isExternal, strings } from '../content/strings';
import { artExport, markPlaceholderLinks, uiIcon } from './nav';

const LG = '(min-width: 1024px)';
const RANG_KEY = 'bp-footer-rang';

/* ------------------------------------------------------------------ 1 · columns */
function renderColumns(host: HTMLElement): void {
  const note = strings.footer.illustrativeNote;
  host.innerHTML = strings.footer.columns.map((col) => {
    const research = col.items.some((it) => it.detail);
    const items = col.items.map((it) => {
      if (!it.href) {
        const cls = it.label === note ? 'footer__note' : 'footer__text';
        return `<li class="${cls}">${escapeHTML(it.label)}</li>`;
      }
      const ext = isExternal(it.href);
      const glyph = ext ? uiIcon('ui-external-sm', 4) : '';
      const detail = it.detail ? `<span class="footer__detail">${escapeHTML(it.detail)}</span>` : '';
      // label + ↗ in a flex row (the glyph lands on whole px, top-aligned to the first line); detail below
      return `<li><a class="footer__link"${ext ? ' data-hop="out"' : ''} href="${escapeHTML(it.href)}"><span class="footer__link-row"><span>${escapeHTML(it.label)}</span>${glyph}</span>${detail}</a></li>`;
    }).join('');
    return `<div class="cell footer__col"><p class="small footer__label">${escapeHTML(col.label)}</p><ul class="footer__links${research ? ' footer__links--research' : ''}" role="list">${items}</ul></div>`;
  }).join('');
}

/* content §13: a social glyph ships only once the team supplies its link */
function renderSocials(host: HTMLElement): void {
  host.innerHTML = strings.footer.socials.items.filter((s) => s.supplied).map((s) =>
    `<li><a class="footer__social link link--quiet" href="${escapeHTML(s.href)}">${uiIcon(s.piece, 4)}<span>${escapeHTML(s.label)}</span></a></li>`,   // social-* are 7×7 (28px)
  ).join('');
}

/* ------------------------------------------------------------------ 3 · strata
   bands (art-spec card 15) exports `strata(el, opts)`: four 64px bands (blue, cornflower, azure, mist), its own
   gridlines, the quarter-arc and a walker slot standing on band 2. Without it, the engine's stripe() draws the
   bands, footer.css draws the grid and the walker is mounted here. Either way footer.ts runs the patrol. */
interface StrataResult { walker: HTMLElement | null; walkerMount: Mounted | null }
type StrataFn = (el: HTMLElement, opts: { walker?: string | false; walkerX?: number }) => StrataResult;

function buildStrata(el: HTMLElement): { walker: HTMLElement; mount: Mounted } {
  const fromBands = artExport<StrataFn>('bands', 'strata');
  if (typeof fromBands === 'function') {
    try {
      const r = fromBands(el, { walker: 'qubit-walker', walkerX: 0 });
      el.dataset.strata = 'bands';
      if (r.walker && r.walkerMount) { r.walker.classList.add('footer__walker'); return { walker: r.walker, mount: r.walkerMount }; }
    } catch (e) { console.warn('[footer] bands strata() failed, using stripe()', e); el.replaceChildren(); delete el.dataset.strata; }
  }
  if (!el.dataset.strata) stripe(el, { bands: ['b', 'c', 'a', 'u'], bandPx: 64, grid: false, arc: true });
  const walker = document.createElement('span');
  walker.className = 'px footer__walker';
  el.appendChild(walker);
  const id = hasPiece('qubit-walker') ? 'qubit-walker' : 'placeholder';
  return { walker, mount: mountPiece(walker, id, { decorative: true }) };
}

/* ------------------------------------------------------------------ the walker patrol
   qubit-walker (art-spec 3c; driver contract in src/art/qubit-folk/README.md) on band 2:
   - walk: move 4 CSS px when the piece's localTick is even (its pose changes on even ticks, so the planted
     foot never slides); reverse (`dir`) at the content-box edges;
   - every 36–60 ticks (seeded): `since` + `precess`; on `done` → `since` + `hop`; on `done` → `walk`.
   The tick sub is added after the piece is playing, so it runs after the piece's own tick (subscription
   order) and reads this tick's localTick. Runs only while visible; still under reduced motion. */
function patrol(strataEl: HTMLElement, el: HTMLElement, m: Mounted): void {
  const [w] = sizeOf(m.piece, m.variant);
  const declared = m.piece.inputs ?? {};
  const isWalker = m.piece.id === 'qubit-walker';
  const setInput = (k: string, v: unknown) => { if (k in declared) m.set(k, v); };

  let minU = 0, maxU = 0;
  const measure = () => {
    const W = strataEl.clientWidth;
    const gutter = matchMedia(LG).matches ? 40 : 16;
    const box = Math.min(W - 2 * gutter, 1728);
    const left = (W - box) / 2;
    minU = Math.ceil(left / 4);
    maxU = Math.max(minU, Math.floor((left + box - w * 4) / 4));
  };
  measure();

  const rand = rng(7);
  const nextStop = () => 36 + Math.floor(rand() * 25);
  let x = minU + Math.round((maxU - minU) * 0.27);
  let dir = 1, mode = 'walk', countdown = nextStop(), placeholderTick = 0;
  const place = () => { x = Math.min(maxU, Math.max(minU, x)); moveUnits(el, x, 0); };
  place();
  setInput('dir', dir);
  setInput('mode', mode);

  const resume = () => { mode = 'walk'; setInput('mode', mode); countdown = nextStop(); };
  const act = (next: 'precess' | 'hop') => {
    mode = next;
    setInput('since', m.localTick + 1);   // the next drawn tick is the action's frame 0
    setInput('mode', mode);
    // the placeholder stand-in has no `done` event: time the pause instead (12 + 6 ticks)
    if (!isWalker) setTimeout(() => (next === 'precess' ? act('hop') : resume()), next === 'precess' ? 1000 : 500);
  };
  m.on('done', () => { if (mode === 'precess') act('hop'); else if (mode === 'hop') resume(); });

  const sub: TickSub = {
    kind: 'tick',
    onTick() {
      if (mode !== 'walk') return;
      const lt = isWalker ? m.localTick : placeholderTick++;
      if (lt % 2 === 0) {
        x += dir;
        if (x >= maxU) { x = maxU; dir = -1; setInput('dir', dir); }
        else if (x <= minU) { x = minU; dir = 1; setInput('dir', dir); }
        place();
      }
      if (--countdown <= 0) act('precess');
    },
  };
  let running = false, visible = false;
  const sync = () => {
    const want = visible && !motion.reduced;
    if (want && !running) { m.play(); clock.add(sub); running = true; }
    else if (!want && running) { clock.remove(sub); running = false; }
  };
  observe(strataEl, { play: () => { visible = true; sync(); }, stop: () => { visible = false; sync(); } });
  motion.onChange(sync);
  if (typeof ResizeObserver === 'function') new ResizeObserver(() => { measure(); place(); }).observe(strataEl);
}

/* ------------------------------------------------------------------ 2 · the bell reveal + ring
   The giant mark rises from behind the strata in one-art-px (20px) steps, scrubbed by scroll while the band
   line climbs from the viewport bottom to 240px above it (the page bottom leaves the line 256px up, so the
   rise always completes). Fully risen at the page bottom → ring once per visit. Reduced motion: in place. */
function ringFallback(markEl: HTMLElement): void {
  const svg = markEl.querySelector('svg');
  if (!svg) return;
  const vb = svg.viewBox.baseVal;
  const W = vb.width, H = vb.height;
  const unit = svg.width.baseVal.value / W;
  const rects = [...svg.querySelectorAll('rect')];
  const on = new Set<number>();
  const key = (x: number, y: number) => (y + 8) * 64 + (x + 8);
  for (const r of rects) {
    const x = Number(r.getAttribute('x')), y = Number(r.getAttribute('y')), rw = Number(r.getAttribute('width'));
    for (let i = 0; i < rw; i++) on.add(key(x + i, y));
  }
  const clapper = rects.filter((r) => Number(r.getAttribute('y')) === H - 1);
  const clapperX = clapper.map((r) => Number(r.getAttribute('x')));

  // rings: 4-neighbour dilations of the silhouette, 1, 2 and 3 art px out
  const PAD = 3;
  const rings: string[] = [];
  let prev = new Set(on);
  for (let d = 1; d <= PAD; d++) {
    const next = new Set(prev);
    for (let y = -PAD; y < H + PAD; y++) for (let x = -PAD; x < W + PAD; x++) {
      if (prev.has(key(x, y))) continue;
      if (prev.has(key(x - 1, y)) || prev.has(key(x + 1, y)) || prev.has(key(x, y - 1)) || prev.has(key(x, y + 1))) next.add(key(x, y));
    }
    let r = '';
    for (let y = -PAD; y < H + PAD; y++) for (let x = -PAD; x < W + PAD; x++) {
      if (next.has(key(x, y)) && !prev.has(key(x, y))) r += `<rect x="${x + PAD}" y="${y + PAD}" width="1" height="1"/>`;
    }
    rings.push(r);
    prev = next;
  }
  const halo = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  halo.setAttribute('class', 'footer__halo');
  halo.setAttribute('viewBox', `0 0 ${W + 2 * PAD} ${H + 2 * PAD}`);
  halo.setAttribute('width', String((W + 2 * PAD) * unit));
  halo.setAttribute('height', String((H + 2 * PAD) * unit));
  halo.setAttribute('shape-rendering', 'crispEdges');
  halo.setAttribute('fill', 'currentColor');
  halo.setAttribute('aria-hidden', 'true');
  halo.style.left = `${-PAD * unit}px`;
  halo.style.top = `${-PAD * unit}px`;
  markEl.appendChild(halo);

  // 3 swings of the clapper (left, centre, right, centre) at 6 fps = 24 ticks; the ring expands on ticks 0–2
  const SWING = [-1, 0, 1, 0];
  let t = 0;
  const sub: TickSub = {
    kind: 'tick',
    onTick() {
      const step = Math.floor(t / 2);
      const off = step < 12 ? SWING[step % 4] : 0;
      clapper.forEach((r, i) => r.setAttribute('x', String(clapperX[i] + off)));
      halo.innerHTML = t < 3 ? rings[t] : '';
      t++;
      if (t > 24) { clock.remove(sub); halo.remove(); clapper.forEach((r, i) => r.setAttribute('x', String(clapperX[i]))); }
    },
  };
  clock.add(sub);
}

type FooterRevealFn = (opts: { mark: SVGSVGElement; trigger: Element; distance?: number; step?: number; height?: number }) => unknown;

function bellReveal(root: HTMLElement): void {
  const markEl = root.querySelector<HTMLElement>('.footer__bell-mark');
  const strataEl = root.querySelector<HTMLElement>('.footer__strata');
  const svg = markEl?.querySelector('svg');
  if (!markEl || !strataEl || !svg) return;
  // logo-mark's own reveal + ring (card 16), scrubbed by the band line over the same 240px
  const fromLogo = artExport<FooterRevealFn>('logo-mark', 'footerReveal', 'logo-mark');
  if (typeof fromLogo === 'function' && svg.hasAttribute('data-mark')) {
    fromLogo({ mark: svg, trigger: strataEl, distance: 240, step: 20, height: svg.height.baseVal.value });
    return;
  }
  const artPx = svg.width.baseVal.value / svg.viewBox.baseVal.width;   // 20
  const H = svg.height.baseVal.value;                                     // 220
  const RANGE = 240;

  let rang = false;
  try { rang = sessionStorage.getItem(RANG_KEY) === '1'; } catch { /* storage blocked: once per load */ }
  const ring = () => {
    if (rang || motion.reduced) return;
    rang = true;
    try { sessionStorage.setItem(RANG_KEY, '1'); } catch { /* ignore */ }
    ringFallback(markEl);
  };

  let lastY = -1;
  const update = () => {
    if (motion.reduced) { if (lastY !== 0) { lastY = 0; markEl.style.transform = ''; } return; }
    const vh = window.innerHeight;
    const line = strataEl.getBoundingClientRect().top;
    const p = Math.min(1, Math.max(0, (vh - line) / RANGE));
    const y = Math.round(((1 - p) * H) / artPx) * artPx;
    if (y !== lastY) { lastY = y; markEl.style.transform = y ? `translateY(${y}px)` : ''; }
    const atBottom = window.scrollY + vh >= document.documentElement.scrollHeight - 2;
    if (p >= 1 && atBottom) ring();
  };
  update();

  const sub: FrameSub = { kind: 'frame', onFrame: update };
  let running = false;
  observe(root.querySelector('.footer__sub') ?? root, {
    play() { if (!running && !motion.reduced) { clock.add(sub); running = true; } update(); },
    stop() { if (running) { clock.remove(sub); running = false; } update(); },
  });
  motion.onChange(() => {
    if (motion.reduced && running) { clock.remove(sub); running = false; }
    update();
  });
}

/* ------------------------------------------------------------------ mount */
export function mount(root: HTMLElement): void {
  const cols = root.querySelector<HTMLElement>('[data-footer-cols]');
  const socials = root.querySelector<HTMLElement>('[data-footer-socials]');
  const strataEl = root.querySelector<HTMLElement>('.footer__strata');
  if (cols) renderColumns(cols);
  if (socials) renderSocials(socials);
  markPlaceholderLinks(root);
  document.dispatchEvent(new Event('bp:snap'));   // the columns' ↗ glyphs onto whole px
  if (strataEl) { const w = buildStrata(strataEl); patrol(strataEl, w.walker, w.mount); }
  bellReveal(root);
}

// Footer · design-spec §5.11 as revised (revision-1 §1.8, LC4). Owner: layout-core.
// mount(root): the link columns and socials from strings; the stage below the one-row sub-footer:
//   · the bands' stepped strata (`strata()` from art-bands; the engine's stripe() if it is missing);
//   · the bell (logo-mark's markSVG), hanging from the sub-footer's bottom hairline on a 1px cable 24px long,
//     its skirt 40px into the strata, lowered in on scroll in one-art-px steps (the hero fridge's bookend);
//   · Alice and Bob (`walkers`, one clipped mount each) arriving on the strata's edge from the left and stopping
//     one on each side of the bell (lead ruling: never under it); the bell rings once per visit when they arrive;
//     they stand 6 s, walk off right, and come back 10 s later.
// One pair at a time (with sections-3's CTA pair): `bp:walkers` events. The footer announces
// { where: 'footer', state: 'present' } while its pair is on stage and 'absent' once it has walked off; the CTA pair
// waits off-stage meanwhile. The footer pair waits while the CTA pair is on stage and its strip is in view. Under
// reduced motion the footer pair is not shown (the CTA pair is the static one).
// Geometry rule (so both fit beside the bell at every width): Alice stops with her left edge on the content-left
// grid line, 24px from the bell; the bell's cable is at content-left + max(M, 48 + 24 + bell/2) (= the rail line
// whenever that leaves room); Bob stops 24px right of the bell. Below 768 the bell is drawn at 12 px/art px.

import { clock, hasPiece, mount as mountPiece, motion, moveUnits, observe, stripe, type Mounted, type TickSub } from '../engine';
import { escapeHTML, isExternal, strings } from '../content/strings';
import { artExport, markPlaceholderLinks, snapIcons, uiIcon } from './nav';

const RANG_KEY = 'bp-footer-rang';
const CABLE = 24;          // css px from the hairline to the bell's crown
const SKIRT = 40;          // css px of the skirt below the strata's top
const CREATURE = 48;       // one walker creature: 12 art px
const GAP = 24;            // creature ↔ bell
const PAIR = 112;          // Bob's offset inside the walkers canvas (28 art px)
const STAND_TICKS = 72;    // 6 s
const AWAY_TICKS = 120;    // 10 s
const LOWER_RANGE = 240;   // scroll px over which the bell is lowered (the page bottom leaves the strata top 256 px up)

/* ------------------------------------------------------------------ 1 · columns (a11y #1, #21) */
function renderColumns(host: HTMLElement): void {
  const note = strings.footer.illustrativeNote;
  host.innerHTML = strings.footer.columns.map((col) => {
    const research = col.items.some((it) => it.detail);
    const items = col.items.map((it) => {
      if (!it.href) return `<li class="${it.label === note ? 'footer__note' : 'footer__text'}">${escapeHTML(it.label)}</li>`;
      const ext = isExternal(it.href);
      const glyph = ext ? uiIcon('ui-external-sm', 4) : '';
      const detail = it.detail ? `<span class="footer__detail">${escapeHTML(it.detail)}</span>` : '';
      return `<li><a class="footer__link"${ext ? ' data-hop="out"' : ''} href="${escapeHTML(it.href)}"><span class="footer__link-row"><span>${escapeHTML(it.label)}</span>${glyph}</span>${detail}</a></li>`;
    }).join('');
    return `<div class="cell footer__col"><h2 class="small footer__label">${escapeHTML(col.label)}</h2><ul class="footer__links${research ? ' footer__links--research' : ''}" role="list">${items}</ul></div>`;
  }).join('');
}

/* content §13: a social glyph ships only once the team supplies its link */
function renderSocials(host: HTMLElement): void {
  host.innerHTML = strings.footer.socials.items.filter((s) => s.supplied).map((s) =>
    `<li><a class="footer__social link link--quiet" href="${escapeHTML(s.href)}">${uiIcon(s.piece, 4)}<span>${escapeHTML(s.label)}</span></a></li>`,
  ).join('');
  // final validation: with no link supplied the list stays as the grid's left column but is not an empty list to AT
  if (host.children.length) host.removeAttribute('aria-hidden'); else host.setAttribute('aria-hidden', 'true');
}

/* ------------------------------------------------------------------ fallback ring (logo-mark absent)
   3 clapper swings at 6 fps and a 3-step azure halo, on any engine-icon SVG of the bell. */
function ringFallback(markEl: HTMLElement): void {
  const svg = markEl.querySelector('svg');
  if (!svg) return;
  const H = svg.viewBox.baseVal.height;
  const clapper = [...svg.querySelectorAll('rect')].filter((r) => Number(r.getAttribute('y')) === H - 1);
  const xs = clapper.map((r) => Number(r.getAttribute('x')));
  const SWING = [-1, 0, 1, 0];
  let t = 0;
  const sub: TickSub = {
    kind: 'tick',
    onTick() {
      const step = Math.floor(t / 2);
      clapper.forEach((r, i) => r.setAttribute('x', String(xs[i] + (step < 12 ? SWING[step % 4] : 0))));
      if (++t > 24) { clock.remove(sub); clapper.forEach((r, i) => r.setAttribute('x', String(xs[i]))); }
    },
  };
  clock.add(sub);
}

/* ------------------------------------------------------------------ 3 · the stage */
interface StrataApi { surfaceY(x: number): number; contentBox: [number, number]; module: number; redraw(): void }
type StrataFn = (root: HTMLElement, opts?: { walker?: false }) => StrataApi;
type RingFn = (svg: SVGSVGElement) => Promise<void>;

function moduleFor(w: number): number { return w >= 1440 ? 128 : w >= 1200 ? 96 : 64; }

function buildStrata(el: HTMLElement): StrataApi {
  const fromBands = artExport<StrataFn>('bands', 'strata');
  if (typeof fromBands === 'function') {
    try { const s = fromBands(el, { walker: false }); el.dataset.strata = 'bands'; return s; }
    catch (e) { console.warn('[footer] bands strata() failed, using stripe()', e); el.replaceChildren(); }
  }
  // fallback: flat bands, flat edge (the stepped profile is the bands piece's job)
  stripe(el, { bands: ['b', 'c', 'a', 'u'], bandPx: 64, grid: false, arc: false });
  const box = (): [number, number] => {
    const W = el.clientWidth, g = W >= 1024 ? 40 : 16;
    const left = Math.max(g, (W - 1728) / 2);
    return [left, W - left];
  };
  return { surfaceY: () => 0, get contentBox() { return box(); }, get module() { return moduleFor(el.clientWidth); }, redraw() {} };
}

function stage(root: HTMLElement): void {
  const stageEl = root.querySelector<HTMLElement>('.footer__stage');
  const bellEl = root.querySelector<HTMLElement>('.footer__bell');
  const markEl = root.querySelector<HTMLElement>('.footer__bell-mark');
  const cable = root.querySelector<HTMLElement>('.footer__cable');
  const strataEl = root.querySelector<HTMLElement>('.footer__strata');
  const walkersEl = root.querySelector<HTMLElement>('.footer__walkers');
  if (!stageEl || !bellEl || !markEl || !cable || !strataEl || !walkersEl) return;
  const svg = (): SVGSVGElement | null => markEl.querySelector('svg');
  const strata = buildStrata(strataEl);

  // Alice and Bob: one `walkers` canvas each, clipped to its creature (Alice x 0–11, Bob x 28–39: no link)
  const piece = hasPiece('walkers') ? 'walkers' : 'placeholder';
  const make = (who: 'a' | 'b') => {
    const win = document.createElement('span');
    win.className = `footer__walker footer__walker--${who}`;
    const px = document.createElement('span');
    px.className = 'px';
    win.appendChild(px);
    walkersEl.appendChild(win);
    return { win, m: mountPiece(px, piece, { decorative: true }) };
  };
  const A = make('a'), B = make('b');
  const setMode = (w: { m: Mounted }, mode: string) => { if (piece === 'walkers' && w.m.io.mode !== mode) w.m.set('mode', mode); };

  // ---- geometry (re-measured on resize) ---------------------------------------------------------
  let W = 0, bw = 240, bh = 220, art = 20, zone = 204, bellX = 0, aliceStop = 0, bobStop = 0, lowerFrom = 0;
  const q4 = (v: number) => Math.round(v / 4) * 4;
  const measure = () => {
    W = stageEl.clientWidth;
    const s = svg();
    bw = s ? Math.round(s.getBoundingClientRect().width) : 240;
    bh = s ? Math.round(s.getBoundingClientRect().height) : 220;
    art = bw / 12;
    zone = CABLE + bh - SKIRT;
    const [cl] = strata.contentBox;
    const left = q4(cl);
    bellX = q4(left + Math.max(strata.module, CREATURE + GAP + bw / 2));
    aliceStop = left;
    bobStop = q4(bellX + bw / 2 + GAP);
    lowerFrom = Math.ceil((bh + CABLE) / art) * art;          // fully above the hairline
    stageEl.style.setProperty('--zone', `${zone}px`);
    bellEl.style.left = `${bellX - bw / 2}px`;
    bellEl.style.width = `${bw}px`;
    cable.style.left = `${bw / 2}px`;
  };

  // ---- the bell: lowered on its cable, scrubbed by scroll, one art px per step --------------------
  let offset = -1, lowered = false;
  const placeBell = (y: number) => {
    if (y === offset) return;
    offset = y;
    markEl.style.transform = y ? `translateY(${y}px)` : '';
    cable.style.height = `${Math.max(0, CABLE + y)}px`;
    lowered = y === 0;
  };
  const scrub = () => {
    if (motion.reduced) { placeBell(0); return; }
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const top = stageEl.getBoundingClientRect().top + zone;            // the strata's top in the viewport
    const p = Math.min(1, Math.max(0, (vh - top) / LOWER_RANGE));
    const steps = lowerFrom / art;
    placeBell(-Math.round((1 - p) * steps) * art);
  };

  // ---- the walkers ----------------------------------------------------------------------------------
  // coordination with the CTA pair (sections-3, src/sections/cta.ts)
  let ctaOnStage = false, ctaInView = false, present = false;
  const announce = (state: 'present' | 'absent') => {
    if ((state === 'present') === present) return;
    present = state === 'present';
    document.dispatchEvent(new CustomEvent('bp:walkers', { detail: { where: 'footer', state } }));
  };
  document.addEventListener('bp:walkers', (e) => {
    const d = (e as CustomEvent<{ where: string; state: string }>).detail;
    if (d?.where === 'cta') ctaOnStage = d.state === 'enter';
  });
  const ctaEl = document.getElementById('cta');
  if (ctaEl && typeof IntersectionObserver === 'function') {
    new IntersectionObserver((es) => { for (const en of es) ctaInView = en.isIntersecting; }).observe(ctaEl);
  }

  type Phase = 'away' | 'enter' | 'stand' | 'leave';
  let phase: Phase = 'away', timer = 0, ax = 0, bx = 0, aWalk = false, bWalk = false;
  const feet = (x: number) => zone + strata.surfaceY(Math.max(0, Math.min(W - 1, x + CREATURE / 2))) - 64;
  const place = () => {
    moveUnits(A.win, ax / 4, feet(ax) / 4);
    moveUnits(B.win, bx / 4, feet(bx) / 4);
  };
  const atRest = () => { ax = aliceStop; bx = bobStop; aWalk = bWalk = false; setMode(A, 'stand'); setMode(B, 'stand'); place(); };
  const offstage = () => { ax = -(PAIR + CREATURE) - 8; bx = ax + PAIR; place(); };
  let rang = false;
  try { rang = sessionStorage.getItem(RANG_KEY) === '1'; } catch { /* storage blocked: once per load */ }
  const ring = () => {
    if (rang || motion.reduced || !lowered) return;
    rang = true;
    try { sessionStorage.setItem(RANG_KEY, '1'); } catch { /* ignore */ }
    const fromLogo = artExport<RingFn>('logo-mark', 'ring', 'logo-mark');
    const s = svg();
    if (fromLogo && s?.querySelector('[data-clapper]')) void fromLogo(s); else ringFallback(markEl);
  };
  const sub: TickSub = {
    kind: 'tick',
    onTick() {
      if (phase === 'away') {
        if (!lowered) return;                                  // they arrive once the bell is down
        if (timer > 0) { timer--; return; }
        if (ctaOnStage && ctaInView) return;                   // one pair on screen at a time
        phase = 'enter'; offstage(); aWalk = bWalk = true; setMode(A, 'walk'); setMode(B, 'walk');
        announce('present');
      } else if (phase === 'enter') {
        if (aWalk) { ax += 4; if (ax >= aliceStop) { ax = aliceStop; aWalk = false; setMode(A, 'stand'); } }
        if (bWalk) { bx += 4; if (bx >= bobStop) { bx = bobStop; bWalk = false; setMode(B, 'stand'); } }
        place();
        if (!aWalk && !bWalk) { phase = 'stand'; timer = STAND_TICKS; ring(); }
      } else if (phase === 'stand') {
        if (timer-- <= 0) { phase = 'leave'; aWalk = bWalk = true; setMode(A, 'walk'); setMode(B, 'walk'); }
      } else {
        ax += 4; bx += 4; place();
        if (ax > W) { phase = 'away'; timer = AWAY_TICKS; aWalk = bWalk = false; announce('absent'); }
      }
    },
  };
  // integrator R2: the bell scrub follows scroll events (passive) instead of a display-rate frame subscriber, which kept
  // 60–120 rAF/s alive at the page end with nothing scrolling; one scroll event per frame while scrolling is the same cost.
  const onScroll = () => scrub();

  // ---- lifecycle ------------------------------------------------------------------------------------
  let visible = false, running = false;
  const sync = () => {
    const want = visible && !motion.reduced;
    if (want && !running) { A.m.play(); B.m.play(); clock.add(sub); window.addEventListener('scroll', onScroll, { passive: true }); running = true; }
    else if (!want && running) { clock.remove(sub); window.removeEventListener('scroll', onScroll); running = false; }
    walkersEl.hidden = motion.reduced;
    if (motion.reduced) { placeBell(0); phase = 'away'; atRest(); announce('absent'); }
    else scrub();
  };
  const relayout = () => {
    measure();
    if (motion.reduced || phase === 'stand') atRest();
    else if (phase === 'away') offstage();
    else place();
    offset = -1; scrub();
    snapIcons(root);
  };
  measure();
  walkersEl.hidden = motion.reduced;
  if (motion.reduced) atRest(); else offstage();
  scrub();
  observe(stageEl, { play: () => { visible = true; sync(); }, stop: () => { visible = false; sync(); } });
  motion.onChange(() => { if (!motion.reduced && phase === 'away') offstage(); sync(); });
  if (typeof ResizeObserver === 'function') {
    let lastW = stageEl.clientWidth;
    new ResizeObserver(() => { if (stageEl.clientWidth !== lastW) { lastW = stageEl.clientWidth; relayout(); } }).observe(stageEl);
  }
  window.matchMedia('(max-width: 767.98px)').addEventListener('change', relayout);   // the bell's scale changes
}

/* ------------------------------------------------------------------ mount */
export function mount(root: HTMLElement): void {
  const cols = root.querySelector<HTMLElement>('[data-footer-cols]');
  const socials = root.querySelector<HTMLElement>('[data-footer-socials]');
  if (cols) renderColumns(cols);
  if (socials) renderSocials(socials);
  markPlaceholderLinks(root);
  document.dispatchEvent(new Event('bp:snap'));   // the columns' ↗ glyphs onto whole px
  stage(root);
}

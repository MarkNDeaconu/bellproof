// Trust · design-spec §5.2 as amended by revision-1 §1.2. Owner: sections-1.
// A. centred eyebrow / h2 / lead, then the domain ledger: six cells checked one by one (left to right, one every
//    4 ticks) when the strip enters the viewport; hover re-stamps a cell. No strings, no knots, no drag.
// B. the four cells (Check it / Re-run it / Test it / Prove it) with `<h3 class="h4">` titles.
// Every animation here is a short tick subscription that ends itself; `motion.onChange` (reduced motion or the user's
// pause switch) finishes it at once and shows the checked poster.

import type { SectionCtx } from '../main';
import { clock, hasPiece, motion, type TickSub } from '../engine';
import { escapeHTML, strings } from '../content/strings';
import { hydrate } from './nav';

const missing: string[] = [];
function pieceId(id: string): string {
  if (hasPiece(id)) return id;
  if (!missing.includes(id)) missing.push(id);
  return 'placeholder';
}
function px(id: string, fallbackVariant?: string, extra = ''): string {
  const real = pieceId(id);
  const v = real === id ? '' : fallbackVariant ? ` data-variant="${fallbackVariant}"` : '';
  return `<span class="px" data-piece="${real}"${v}${extra} data-decorative></span>`;
}

/** Ticks between two stamps (revision-1 §1.2: "one every 4 ticks"). */
const STAMP_EVERY = 4;

function render(root: HTMLElement): void {
  const t = strings.trust;
  // the space text node between name and tag keeps the accessible text "Storage & data CHECKED BY HASH" (content #12)
  const entries = t.ledger.map((d, i) =>
    `<li class="cell trust__entry" data-i="${i}">` +
      `<span class="trust__ico">${px(d.piece, 'sm')}</span>` +
      `<span class="trust__slot" aria-hidden="true"><i data-icon="ui-check"></i></span>` +
      `<span class="h6 trust__name">${escapeHTML(d.name)}</span> ` +
      `<span class="micro trust__tag">${escapeHTML(d.tag)}</span>` +
    `</li>`).join('');
  // the reveal sits on each cell's children, not the cell: a clipped cell would show the grid's hairline fill as a grey slab
  const cells = t.cells.map((c, i) => { const r = ` data-reveal="${i + 1}"`; return (
    `<div class="cell trust__cell">` +
      `<span class="trust__cell-ico${i === 0 ? ' trust__cell-ico--scale' : ''}"${r}>${px(c.piece, i === 0 ? 'wide' : undefined)}</span>` +
      `<h3 class="h4"${r}>${escapeHTML(c.title)}</h3> ` +
      `<p class="body cell__body"${r}>${escapeHTML(c.body)}</p> ` +
      `<span class="tag cell__foot"${r}>${escapeHTML(c.tag)}</span>` +
    `</div>`); }).join('');
  root.innerHTML =
    `<div class="wrap trust">` +
      `<header class="trust__head">` +
        `<p class="eyebrow" data-reveal="1">${escapeHTML(t.eyebrow)}</p>` +
        `<h2 class="h2 trust__h2" data-reveal="2">${escapeHTML(t.h2)}</h2>` +
        `<p class="lead trust__lead" data-reveal="3">${escapeHTML(t.lead)}</p>` +
      `</header>` +
      `<ul class="cells trust__ledger" role="list">${entries}</ul>` +
      `<div class="cells cells--4 trust__cells">${cells}</div>` +
    `</div>`;
}

/* ------------------------------------------------------------------ the ledger */
interface Stamp { start: number; kind: 'stamp' | 'restamp' }

function setupLedger(root: HTMLElement): { replay(): void } {
  const ledger = root.querySelector<HTMLElement>('.trust__ledger')!;
  const cells = [...ledger.querySelectorAll<HTMLElement>('.trust__entry')];
  const pending = new Map<number, Stamp>();
  let started = false;                    // the left-to-right sequence has been triggered (or finished statically)

  const set = (i: number, checked: boolean, stamp: boolean) => {
    cells[i].classList.toggle('is-checked', checked);
    cells[i].classList.toggle('is-stamp', stamp);
  };

  // One tick subscriber for every pending stamp; it removes itself when nothing is pending.
  //   stamp   d=0: the check appears 1 art px high, the cell turns --card, its border flashes white · d=1: it lands
  //   restamp d=0: the check lifts off (the cell stays --card) · d=1, d=2: as stamp
  const sub: TickSub = { kind: 'tick', onTick(tick) {
    for (const [i, s] of pending) {
      const d = tick - s.start - (s.kind === 'restamp' ? 1 : 0);
      if (d < -1) continue;
      if (d === -1) { if (s.kind === 'restamp') cells[i].classList.add('is-lift'); continue; }
      cells[i].classList.remove('is-lift');
      if (d === 0) set(i, true, true);
      else { set(i, true, false); pending.delete(i); }
    }
    if (!pending.size) stopSub();
  } };
  let subbed = false;
  const startSub = () => { if (!subbed) { clock.add(sub); subbed = true; } };
  const stopSub = () => { if (subbed) { clock.remove(sub); subbed = false; } };

  /** Poster: every cell checked, nothing moving. */
  const finish = () => {
    stopSub();
    pending.clear();
    cells.forEach((c, i) => { c.classList.remove('is-lift'); set(i, true, false); });
    started = true;
  };

  const run = () => {
    if (motion.reduced) { finish(); return; }
    started = true;
    const t0 = clock.tick() + 1;
    cells.forEach((_, i) => { set(i, false, false); pending.set(i, { start: t0 + i * STAMP_EVERY, kind: 'stamp' }); });
    startSub();
  };

  // "On entering the viewport": the strip must be mostly on screen, not merely inside the engine's 200 px play margin.
  let io: IntersectionObserver | null = null;
  if (motion.reduced || typeof IntersectionObserver !== 'function') finish();
  else {
    io = new IntersectionObserver((entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io?.disconnect();
      if (!started) run();
    }, { threshold: 0.6, rootMargin: '0px 0px -10% 0px' });
    io.observe(ledger);
  }
  // reduced motion or the pause switch, at any time (also mid re-stamp): stop now and show the checked poster
  motion.onChange(() => { if (motion.reduced) { io?.disconnect(); finish(); } });

  // Hover re-stamps that cell (only once the sequence has shown it checked).
  cells.forEach((cell, i) => {
    cell.addEventListener('pointerenter', (e) => {
      if (e.pointerType === 'touch' || motion.reduced || pending.has(i) || !cell.classList.contains('is-checked')) return;
      pending.set(i, { start: clock.tick() + 1, kind: 'restamp' });
      startSub();
    });
  });

  return { replay: () => { if (!motion.reduced) run(); } };
}

/* ------------------------------------------------------------------ whole-px sprites (qa-pixel #15)
   Grid columns split the content box into fractional widths (1360 / 6, / 4), so a sprite placed by flex would sit on a
   sub-pixel x. Offset each canvas container by its remainder with the `translate` property (no layout change). */
function snapPx(root: HTMLElement): void {
  const els = [...root.querySelectorAll<HTMLElement>('.px[data-piece]')].filter((el) => el.getClientRects().length);
  const fixes = els.map((el) => {
    const [sx, sy] = (el.style.translate || '0px 0px').split(' ').map((v) => parseFloat(v) || 0);
    const r = el.getBoundingClientRect();
    const x = r.left - sx, y = r.top - (sy ?? 0);
    return [el, Math.round(x) - x, Math.round(y) - y] as const;
  });
  for (const [el, dx, dy] of fixes) {
    const v = Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01 ? '' : `${dx.toFixed(3)}px ${dy.toFixed(3)}px`;
    if (el.style.translate !== v) el.style.translate = v;
  }
}
function watchSnap(root: HTMLElement): void {
  let raf = 0;
  const run = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => snapPx(root)); };
  run();
  document.fonts?.ready.then(run);
  if (typeof ResizeObserver === 'function') new ResizeObserver(run).observe(root);
  // a reveal ends on transform: none; measure again once it has settled
  root.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') run(); });
}

export function mount(root: HTMLElement, _ctx: SectionCtx): void {
  render(root);
  hydrate(root);
  const ledger = setupLedger(root);
  watchSnap(root);
  window.__bp.sections = Object.assign((window.__bp.sections as Record<string, unknown>) ?? {}, { trust: { missing: [...missing], replay: ledger.replay } });
}

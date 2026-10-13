// Section 9 · What the certificate guarantees · `#guarantees` (design-spec §5.9, revision-1 S3-3). Owner: sections-3.
//
//   A  eyebrow, h2, lead (left, max 880)
//   B  7/12 dark certificate card (8 mono rows) with `cert-mint` on its top-right corner · 5/12 "Where it goes"
//   C  Guaranteed (card, blue, checks) | Not covered (paper-2, alert, warns)
//   D  RUNNING EXAMPLE chip and the closing h3 (revision 1 cut the footnote and the transcript link)
//
// Motion: when the card is a third in view its values type in row by row (engine typewriter, 20 ms/char); when the
// last row lands the section calls cert-mint's `stamp()` export, and ACCEPTED appears on the piece's `impact` event.
// Reduced motion or the pause switch (now or mid-typing): every value printed, ACCEPTED shown, the piece on its
// stamped poster, no typewriter or timer left running. Layout never shifts while typing (ghost copies reserve width).

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import { getPiece, hasPiece, motion, mountedOf, typewriter, type Mounted } from '../engine';
import { escapeHTML as esc, richHTML } from '../content/strings';
import { chip, icon, observeOnce, snapAll } from './verify';

const MS_PER_CHAR = 20;
const ROW_PAUSE_MS = 83;         // one sprite tick between rows: a carriage return
const IMPACT_FALLBACK_MS = 1500; // if the piece is not ticking (e.g. scrolled away), reveal the verdict anyway

export function mount(root: HTMLElement, ctx: SectionCtx): void {
  const g = ctx.strings.guarantees;
  const mint = hasPiece('cert-mint') ? 'cert-mint' : 'placeholder';
  const rows = g.certificate.rows;

  root.innerHTML = `
    <div class="wrap g-wrap">
      <header class="g-head">
        <p class="eyebrow" data-reveal="1">${esc(g.eyebrow)}</p>
        <h2 class="h2" data-reveal="2">${esc(g.h2)}</h2>
        <p class="lead" data-reveal="3">${esc(g.lead)}</p>
      </header>

      <div class="g-b">
        <div class="g-cert">
          <div class="g-card card-dark on-dark">
            <p class="eyebrow g-card__title">${esc(g.certificate.title)}</p>
            <dl class="kv g-rows">
              ${rows.map((r) => `<dt>${esc(r.key)}</dt><dd class="g-v${r.accent ? ' g-v--verdict' : ''}"><span class="vh">${esc(r.value)}</span><span class="g-v__vis" aria-hidden="true"><span class="g-v__ghost">${esc(r.value)}</span><span class="g-v__typed"></span></span></dd>`).join('')}
            </dl>
          </div>
          <div class="g-mint" role="img" aria-label="${esc(g.alt.certMint)}">
            <span class="px" data-piece="${mint}" data-decorative${mint === 'cert-mint' ? ' data-io-stamp="false"' : ''}></span>
          </div>
        </div>
        <div class="g-where">
          <h3 class="eyebrow g-where__label">${esc(g.whereItGoes.label)}</h3>
          <ul class="g-where__list" role="list">
            ${g.whereItGoes.items.map((it, i) => `<li data-reveal="${i + 1}"><h4 class="h4">${esc(it.title)}</h4><p class="g-soft">${esc(it.body)}</p></li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="cells cells--2 g-cells">
        <div class="cell cell--card g-yes">
          <h3 class="h4">${esc(g.guaranteed.title)}</h3>
          <ul class="g-list" role="list">
            ${g.guaranteed.items.map((t) => `<li><span class="g-list__icon">${icon('ui-check')}</span><span>${esc(t)}</span></li>`).join('')}
          </ul>
        </div>
        <div class="cell cell--paper-2 g-no">
          <h3 class="h4">${esc(g.notCovered.title)}</h3>
          <ul class="g-list" role="list">
            ${g.notCovered.items.map((t) => `<li><span class="g-list__icon">${icon('ui-warn')}</span><span><span class="g-lead">${esc(t.lead)}</span> <span class="g-soft">${esc(t.body)}</span></span></li>`).join('')}
          </ul>
        </div>
      </div>

      <div class="g-d">
        <p class="g-d__chip" data-reveal="1">${chip(ctx.strings)}</p>
        <p class="h3 g-d__line" data-reveal="2">${richHTML(g.closing.text)}</p>
      </div>
    </div>`;

  hydrate(root);
  snapAll(root, '.g-mint');                       // whole-pixel position for the sprite (qa-pixel #15)

  const card = root.querySelector<HTMLElement>('.g-card')!;
  const typed = [...root.querySelectorAll<HTMLElement>('.g-v__typed')];
  const verdictIdx = rows.findIndex((r) => r.accent);
  const verdictEl = typed[verdictIdx];
  const verdictText = rows[verdictIdx]?.value ?? '';
  const m = mountedOf(root.querySelector<HTMLElement>('.g-mint .px')!);
  const stamp = mint === 'cert-mint' ? (getPiece('cert-mint').exports?.stamp as ((m: Mounted) => void) | undefined) : undefined;

  // everything this section starts, so the pause switch can stop it at once
  let tw: { stop(): void } | null = null;
  const timers = new Set<number>();
  let offImpact: (() => void) | null = null;
  const later = (fn: () => void, ms: number) => { const id = window.setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); };
  const stopAll = () => {
    tw?.stop(); tw = null;
    timers.forEach((id) => clearTimeout(id)); timers.clear();
    offImpact?.(); offImpact = null;
    card.querySelectorAll('.cursor').forEach((c) => c.remove());
  };

  let verdictShown = false;
  const showVerdict = (animate: boolean) => {
    if (verdictShown || !verdictEl) return;
    verdictShown = true;
    verdictEl.textContent = verdictText;
    if (animate) verdictEl.classList.add('is-stamped');
  };
  const printAll = () => {
    typed.forEach((el, i) => { if (i !== verdictIdx) el.textContent = rows[i].value; });
    card.classList.remove('is-typing');
    card.classList.add('is-done');
  };

  let stamped = false;
  const fireStamp = () => {
    if (stamped) return;
    stamped = true;
    if (!m || !stamp) { showVerdict(!motion.reduced); return; }
    if (motion.reduced) { stamp(m); showVerdict(false); return; }
    offImpact = m.on('impact', () => { offImpact?.(); offImpact = null; showVerdict(true); });
    stamp(m);
    later(() => showVerdict(true), IMPACT_FALLBACK_MS);
  };

  /** Pause / reduced motion: finish the card statically and stop every timer. */
  const finishStatic = () => { stopAll(); printAll(); if (!stamped) fireStamp(); else showVerdict(false); };

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    if (motion.reduced) { finishStatic(); return; }
    card.classList.add('is-typing');
    const order = typed.map((_, i) => i).filter((i) => i !== verdictIdx);
    let k = 0;
    const next = () => {
      if (motion.reduced) { finishStatic(); return; }
      if (k >= order.length) { printAll(); fireStamp(); return; }
      const i = order[k++];
      const el = typed[i];
      tw = typewriter(el, rows[i].value, {
        msPerChar: MS_PER_CHAR,
        cursor: true,
        onDone: () => {
          tw = null;
          queueMicrotask(() => { el.textContent = rows[i].value; });
          later(next, ROW_PAUSE_MS);
        },
      });
    };
    next();
  };

  // reduced motion / paused: complete from the first paint; otherwise it types once, on first sight
  if (motion.reduced) start();
  else observeOnce(card, 0.35, start);
  motion.onChange((reduced) => { if (reduced) { started = true; finishStatic(); } });
}

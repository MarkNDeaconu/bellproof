// Flip · design-spec §5.3 as amended by revision-1 §1.3. Owner: sections-1.
// A. eyebrow / h2 / lead + the `fridge-out` cell (with the `illustrative` tag under the sprite, which draws "-12.4")
// B. the running example: the question cell + two stacked cards (formulas never wrap; exponents are <sup>)
// D. the paradox band (#paradox): blue, bands' static rail stacks anchored to the band's bottom, the copy kept clear of
//    both rails, and the `?` block flickers ? T C ? T C ? when the band comes into view (icons I2; no bump).
// (Part C, the "Every classical check breaks." table, is cut in revision 1.)

import type { SectionCtx } from '../main';
import { hasPiece, motion, mountedOf, type Mounted } from '../engine';
import type { Gridlines, GridlinesOpts, Paradox, ParadoxOpts } from '../art/bands';
import { escapeHTML, strings } from '../content/strings';
import { artExport, hydrate } from './nav';

type ParadoxFn = (root: HTMLElement, opts?: ParadoxOpts) => Paradox;
type GridlinesFn = (root: HTMLElement, opts?: GridlinesOpts) => Gridlines;
type FlickerFn = (m: Mounted) => void;

const missing: string[] = [];
function pieceId(id: string): string {
  if (hasPiece(id)) return id;
  if (!missing.includes(id)) missing.push(id);
  return 'placeholder';
}

function render(root: HTMLElement): void {
  const f = strings.flip;
  const ex = f.example;
  const illus = `<span class="tag-illustrative">${escapeHTML(strings.common.illustrative)}</span>`;

  root.innerHTML =
    `<div class="wrap flip">` +
      // A
      `<div class="grid-12 flip__top">` +
        `<header class="span-7 flip__head">` +
          `<p class="eyebrow" data-reveal="1">${escapeHTML(f.eyebrow)}</p>` +
          `<h2 class="h2 measure-h2 flip__h2" data-reveal="2">${escapeHTML(f.h2)}</h2>` +
          `<p class="lead measure-lead flip__lead" data-reveal="3">${escapeHTML(f.lead)}</p>` +
        `</header>` +
        `<div class="span-5 flip__fig-wrap" data-reveal="2">` +
          `<figure class="flip__fig" role="img" aria-label="${escapeHTML(f.alt.fridgeOut)}">` +
            `<span class="px flip__fridge" data-piece="${pieceId('fridge-out')}" data-decorative></span>` +
            `<span class="flip__fig-tag" aria-hidden="true">${illus}</span>` +
          `</figure>` +
        `</div>` +
      `</div>` +
      // B
      // reveals sit on the cells' children (a clipped cell would expose the grid's hairline fill as a grey slab)
      `<div class="cells flip__example">` +
        `<div class="cell flip__q">` +
          `<div class="flip__q-head" data-reveal="1"><p class="h5 t-soft">${escapeHTML(ex.questionLabel)}</p> ` +
          `<span class="chip-example">${escapeHTML(strings.common.runningExample)}</span></div>` +
          `<p class="h4 flip__question" data-reveal="1">${escapeHTML(ex.question)}</p>` +
          `<p class="eyebrow flip__why" data-reveal="2">${escapeHTML(ex.whyLabel)}</p> ` +
          `<p class="body cell__body" data-reveal="2">${escapeHTML(ex.why)}</p>` +
        `</div>` +
        `<div class="cell flip__card">` +
          `<p class="eyebrow" data-reveal="2">${escapeHTML(ex.comesBack.eyebrow)}</p> ` +
          `<p class="num-xl flip__num" data-reveal="2">${escapeHTML(ex.comesBack.value)}</p> ` +
          `<p class="body cell__body" data-reveal="2">${escapeHTML(ex.comesBack.body)} ${illus}</p>` +
        `</div>` +
        `<div class="cell flip__card on-dark">` +
          `<p class="eyebrow" data-reveal="3">${escapeHTML(ex.behind.eyebrow)}</p> ` +
          // valueHTML is trusted markup from strings.ts (`<sup>` exponents); the plain value is what assistive tech reads
          `<p class="num-xl flip__num" data-reveal="3"><span class="vh">${escapeHTML(ex.behind.value)}</span><span aria-hidden="true">${ex.behind.valueHTML}</span></p> ` +
          `<p class="body cell__body" data-reveal="3">${escapeHTML(ex.behind.body)}</p>` +
        `</div>` +
      `</div>` +
    `</div>` +
    // D · the paradox band (full-bleed, outside .wrap)
    `<div id="${escapeHTML(f.paradox.id)}" class="band grid-colour paradox" data-tint="blue">` +
      `<div class="paradox__stage" aria-hidden="true"></div>` +
      `<div class="wrap paradox__wrap">` +
        `<p class="eyebrow" data-reveal="1">${escapeHTML(f.paradox.eyebrow)}</p>` +
        `<p class="display paradox__statement" data-reveal="2">${escapeHTML(f.paradox.statement)}</p>` +
        `<p class="lead paradox__sub" data-reveal="3">${escapeHTML(f.paradox.sub)}</p>` +
      `</div>` +
    `</div>`;
}

/* ------------------------------------------------------------------ the paradox band */
function paradox(root: HTMLElement): void {
  const band = root.querySelector<HTMLElement>('.paradox')!;
  const stageRoot = root.querySelector<HTMLElement>('.paradox__stage')!;
  const make = artExport<ParadoxFn>('bands', 'paradoxStage', 'diamond');
  const flickerOnce = artExport<FlickerFn>('icons', 'flickerOnce', 'question-block');
  const lines = artExport<GridlinesFn>('bands', 'gridlines', 'diamond');
  let question: Mounted | null = null;

  if (make) {
    // the helper rebuilds itself when the hero's rail module changes (1200 / 1440): re-wire the `?` mount on every build
    const wire = (p: Paradox) => { question = p.riders.find((m) => m.piece.id === 'question-block') ?? null; };
    wire(make(stageRoot, { question: pieceId('question-block'), onRebuild: wire }));
  } else {
    if (!missing.includes('bands')) missing.push('bands');
    // no bands helper in this build: stand the question block (or the placeholder) at the right edge
    stageRoot.innerHTML = `<span class="px paradox__fallback" data-piece="${pieceId('question-block')}" data-decorative></span>`;
    hydrate(stageRoot);
    question = mountedOf(stageRoot.firstElementChild!) ?? null;
  }
  // The module grid on colour (LC8) from the same rail module as the stacks, so the copy indent (content-left + rail)
  // sits on the rail line at every width. Without bands, the shared `.grid-colour` lines stay.
  // integrator R2: the stacks stand in the hero's rails (viewport edge → M), so the band's verticals are the hero's rail
  // lines (x = M − 1 and W − M, the stacks' inner edges), not the content box's: before, the content-edge line ran into
  // the violet stack and the rail line floated 40 px off it. gutter 0 puts the box on the viewport; flip.css hides the
  // two viewport-edge lines that leaves. The copy keeps its indent (content-left + M), 40 px off the line, like the hero.
  if (lines) {
    band.classList.remove('grid-colour');
    band.prepend(lines(band, { gutter: 0, contentMax: 1e6 }).el);
  }

  // The flicker plays each time the band comes into view (at least half of it on screen), never more than once per 3 s.
  // By then the engine's own observer (200 px margin) has the mount playing, so the start tick is live (qa-pixel #16).
  const flicker = () => {
    const m = question;
    if (!m || motion.reduced || m.piece.id !== 'question-block') return;
    if (flickerOnce) flickerOnce(m);
    else m.set('flicker', m.localTick + 1);
  };
  if (typeof IntersectionObserver === 'function') {
    let lastAt = -Infinity;
    new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const now = performance.now();
        if (now - lastAt < 3000) continue;
        lastAt = now;
        flicker();
      }
    }, { threshold: 0.5 }).observe(band);
  }
}

/* ------------------------------------------------------------------ whole-px sprites (qa-pixel #15) */
function snapPx(root: HTMLElement): void {
  const els = [...root.querySelectorAll<HTMLElement>('.flip .px[data-piece]')].filter((el) => el.getClientRects().length);
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
  root.addEventListener('transitionend', (e) => { if (e.propertyName === 'transform') run(); });
}

export function mount(root: HTMLElement, _ctx: SectionCtx): void {
  render(root);
  hydrate(root);
  paradox(root);
  watchSnap(root);
  window.__bp.sections = Object.assign((window.__bp.sections as Record<string, unknown>) ?? {}, { flip: { missing: [...missing] } });
}

// Flip · design-spec §5.3. Owner: sections-1.
// A. eyebrow/h2/lead + the fridge-out cell  B. the running example (question cell + two stacked cards)
// C. "Every classical check breaks." table  D. the paradox band (#paradox): blue, grid on colour, bands' static blocks,
//    the question block bumps once when the band enters.

import type { SectionCtx } from '../main';
import { hasPiece, motion, mountedOf, observe, type Mounted, type Stage } from '../engine';
import type { ParadoxOpts, Breakpoint } from '../art/bands';
import { cellText, escapeHTML, strings } from '../content/strings';
import { artExport, hydrate } from './nav';

type ParadoxFn = (root: HTMLElement, opts?: ParadoxOpts) => { stage: Stage; riders: Mounted[]; bp: Breakpoint };

const missing: string[] = [];
function pieceId(id: string): string {
  if (hasPiece(id)) return id;
  if (!missing.includes(id)) missing.push(id);
  return 'placeholder';
}

function render(root: HTMLElement): void {
  const f = strings.flip;
  const ex = f.example;
  const tb = f.table;
  const headers = tb.headers.map((h, i) => `<th scope="col"${i === 2 ? ' class="is-alert"' : ''}>${escapeHTML(h)}</th>`).join('');
  const rows = tb.rows.map((r) =>
    `<tr><th scope="row">${escapeHTML(cellText(r[0]))}</th>${r.slice(1).map((c, i) =>
      `<td data-label="${escapeHTML(tb.headers[i + 1])}"${i === 1 ? ' class="is-alert"' : ''}>${escapeHTML(cellText(c))}</td>`).join('')}</tr>`).join('');

  root.innerHTML =
    `<div class="wrap flip">` +
      // A
      `<div class="grid-12 flip__top">` +
        `<header class="span-7 flip__head">` +
          `<p class="eyebrow" data-reveal="1">${escapeHTML(f.eyebrow)}</p>` +
          `<h2 class="h2 measure-h2" data-reveal="2">${escapeHTML(f.h2)}</h2>` +
          `<p class="lead measure-lead flip__lead" data-reveal="3">${escapeHTML(f.lead)}</p>` +
        `</header>` +
        `<div class="span-5 flip__fig-wrap" data-reveal="2">` +
          `<figure class="flip__fig" role="img" aria-label="${escapeHTML(f.alt.fridgeOut)}"><span class="px" data-piece="${pieceId('fridge-out')}" data-decorative></span></figure>` +
        `</div>` +
      `</div>` +
      // B
      `<div class="cells flip__example">` +
        `<div class="cell flip__q" data-reveal="1">` +
          `<span class="chip-example flip__chip">${escapeHTML(strings.common.runningExample)}</span>` +
          `<p class="h5 t-soft">${escapeHTML(ex.questionLabel)}</p>` +
          `<p class="h4 flip__question">${escapeHTML(ex.question)}</p>` +
          `<p class="eyebrow flip__why">${escapeHTML(ex.whyLabel)}</p>` +
          `<p class="body cell__body">${escapeHTML(ex.why)}</p>` +
        `</div>` +
        `<div class="cell flip__card" data-reveal="2">` +
          `<p class="eyebrow">${escapeHTML(ex.comesBack.eyebrow)}</p>` +
          `<p class="num-xl flip__num">${escapeHTML(ex.comesBack.value)}</p>` +
          `<p class="body cell__body">${escapeHTML(ex.comesBack.body)}<span class="tag-illustrative">${escapeHTML(strings.common.illustrative)}</span></p>` +
        `</div>` +
        `<div class="cell flip__card on-dark" data-reveal="3">` +
          `<p class="eyebrow">${escapeHTML(ex.behind.eyebrow)}</p>` +
          `<p class="num-xl flip__num">${escapeHTML(ex.behind.value)}</p>` +
          `<p class="body cell__body">${escapeHTML(ex.behind.body)}</p>` +
        `</div>` +
      `</div>` +
      // C
      `<div class="flip__table-block">` +
        `<h3 class="h3" data-reveal="1">${escapeHTML(tb.title)}</h3>` +
        `<table class="table flip__table"><thead><tr>${headers}</tr></thead><tbody>${rows}</tbody></table>` +
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

/** The question block bumps once (8 ticks) when the band enters; the piece clears `bump` itself through `bumped`. */
function bumpOnEnter(band: HTMLElement, riders: Mounted[]): void {
  const q = riders.find((m) => m.piece.id === 'question-block');
  if (!q) return;
  const un = observe(band, {
    play() {
      un();
      if (motion.reduced) return;
      // first tick after the band is on screen; the mount starts playing on the same IO pass
      setTimeout(() => {
        const start = ((q.localTick + 1) % 36 + 36) % 36;
        q.set('bump', start);
        const off = q.on('bumped', () => { off(); q.set('bump', -1); });
      }, 250);
    },
    stop() {},
  });
}

export function mount(root: HTMLElement, _ctx: SectionCtx): void {
  render(root);
  hydrate(root);

  const band = root.querySelector<HTMLElement>('.paradox')!;
  const stageRoot = root.querySelector<HTMLElement>('.paradox__stage')!;
  const make = artExport<ParadoxFn>('bands', 'paradoxStage', 'diamond');
  if (make) {
    const build = () => {
      stageRoot.replaceChildren();
      stageRoot.classList.remove('stage', 'bands-paradox');
      const r = make(stageRoot, { question: pieceId('question-block') });
      bumpOnEnter(band, r.riders);
      return r;
    };
    let last = matchMedia('(min-width: 1024px)').matches ? 'lg' : matchMedia('(min-width: 768px)').matches ? 'md' : 'sm';
    build();
    // the stage bakes positions for its width: rebuild when the breakpoint flips (bands rebuilds the hero stage itself;
    // the paradox helper is static, so the section does it)
    const onResize = () => {
      const bp = matchMedia('(min-width: 1024px)').matches ? 'lg' : matchMedia('(min-width: 768px)').matches ? 'md' : 'sm';
      if (bp !== last) { last = bp; build(); }
    };
    matchMedia('(min-width: 1024px)').addEventListener('change', onResize);
    matchMedia('(min-width: 768px)').addEventListener('change', onResize);
  } else {
    if (!missing.includes('bands')) missing.push('bands');
    // no bands helper in this build: stand the question block (or the placeholder) at the right edge
    stageRoot.innerHTML = `<span class="px paradox__fallback" data-piece="${pieceId('question-block')}" data-decorative></span>`;
    hydrate(stageRoot);
    const m = mountedOf(stageRoot.firstElementChild!);
    if (m) bumpOnEnter(band, [m]);
  }

  window.__bp.sections = Object.assign((window.__bp.sections as Record<string, unknown>) ?? {}, { flip: { missing: [...missing] } });
}

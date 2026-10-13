// Hero · design-spec §5.1 "Lowered into frame". Owner: sections-1.
// The frame is full-bleed (rails at the viewport edges, as Mistral and the layout-core skeleton): at 1440 that gives
// the text column its 760 px (800 − 40) and keeps the 384 px fridge cell inside the middle column, clear of the right
// rail (integration-notes). The block stage (bands `heroStage`) spans the frame at lg/md (floor = hero bottom) and the
// 480 px fridge cell at sm.
//
// Intro (once per load, skipped under reduced motion):
//   0       arc + rail lines fade in (300 ms)
//   100     fridge lowers (the piece's scripted intro: lowers 1–10, cools 12–16, ignites 18, in ticks)
//   400…    H1 lines rise (600 ms, stagger 150), lead 1000, buttons 1150, pill 1300
//   700     blocks enter (stage.intro(): rails from the sides, floor blocks from below)
//   1000…   readout 300 K → … → 10 mK in the ticker, labels appear with the cool-k events
//   ~1600   ignite clears the readout; 1900 the ticker types (40 ms/char), holds 2 s, cursor blinks
// Idle: the 20.8 s block choreography, sprites on their own loops, a bit drops from the chip every 48 ticks and
// continues as a 4 px HTML pixel down to the floor line (spark on landing), the diamond pulses. Everything pauses
// offscreen through the engine's IntersectionObserver.

import type { SectionCtx } from '../main';
import { clock, ease, getPiece, hasPiece, motion, mountedOf, moveUnits, tween, typewriter, type Mounted, type TickSub } from '../engine';
import type { HeroStage, HeroStageOpts } from '../art/bands';
import { escapeHTML, isExternal, strings } from '../content/strings';
import { artExport, hydrate, uiIcon } from './nav';

type HeroStageFn = (root: HTMLElement, opts?: HeroStageOpts) => HeroStage;

const SM = '(max-width: 767.98px)';
const LG_HERO = '(min-width: 1440px)';            // the lg hero geometry needs 1440 (see top.css)
const T = { arc: 0, fridge: 100, text: 400, blocks: 700, ticker: 1900 } as const;

/** Pieces this section mounts; anything not registered falls back to `placeholder` (listed in `missing`). */
const missing: string[] = [];
function pieceId(id: string): string {
  if (hasPiece(id)) return id;
  if (!missing.includes(id)) missing.push(id);
  return 'placeholder';
}
function px(id: string, opts: { variant?: string; fallbackVariant?: string; cls?: string; decorative?: boolean; attrs?: string } = {}): string {
  const real = pieceId(id);
  const variant = real === id ? opts.variant : opts.fallbackVariant;
  return `<span class="px${opts.cls ? ' ' + opts.cls : ''}" data-piece="${real}"${variant ? ` data-variant="${variant}"` : ''}${opts.decorative === false ? '' : ' data-decorative'} ${opts.attrs ?? ''}></span>`;
}

/* ------------------------------------------------------------------ markup */
function h1HTML(): string {
  const words = strings.top.h1.split(' ');
  const after = strings.top.h1SpriteAfter;
  const sphere = `<span class="hero__sphere">${px('bloch-inline', { cls: 'hero__sphere-lg' })}${px('bloch-inline', { variant: 'sm', cls: 'hero__sphere-sm' })}</span>`;
  // design §5.1: lg/md three lines "Verified ◉ quantum / computation, / settled on-chain."; sm four (settled / on-chain.)
  let lines: string[];
  if (words.length === 5 && words[0] === after) {
    lines = [`${escapeHTML(words[0])}${sphere}${escapeHTML(words[1])}`, escapeHTML(words[2]), escapeHTML(words[3]), `<span class="nowrap">${escapeHTML(words[4])}</span>`];
  } else {
    const i = words.indexOf(after);
    lines = [i >= 0 ? `${escapeHTML(words.slice(0, i + 1).join(' '))}${sphere}${escapeHTML(words.slice(i + 1).join(' '))}` : escapeHTML(strings.top.h1)];
  }
  const spans = lines.map((l, i) => `<span class="hero__line${i === lines.length - 1 && lines.length > 1 ? ' hero__line--last' : ''}" style="--i:${i}"><span class="hero__line-in">${l}</span></span>`);
  // a space joins "settled" and "on-chain." on one line at lg/md; <br> after the first two lines
  const joined = spans.length === 4 ? `${spans[0]}<br>${spans[1]}<br>${spans[2]} ${spans[3]}` : spans.join('<br>');
  return `<h1 class="display hero__h1"><span class="vh">${escapeHTML(strings.top.h1)}</span><span class="hero__lines" aria-hidden="true">${joined}</span></h1>`;
}

function btnHTML(link: { label: string; href: string }, cls: string): string {
  const glyph = isExternal(link.href) ? 'ui-external' : 'ui-chevron';
  return `<a class="btn ${cls}" href="${escapeHTML(link.href)}"><span class="btn__label">${escapeHTML(link.label)}</span><span class="btn__icon">${uiIcon(glyph, 4)}</span></a>`;
}

function pillHTML(cls: string, peek: boolean): string {
  const p = strings.top.pill;
  return `<a class="pill ${cls}" href="${escapeHTML(p.href)}">` +
    `<span class="pill__tile">${px('tc-glyph', { fallbackVariant: 'sm' })}</span>` +
    `<span class="pill__label">${escapeHTML(p.label)}</span>` +
    `<span class="btn__icon">${uiIcon('ui-chevron', 4)}</span>` +
    (peek ? `<span class="hero__peek" aria-hidden="true">${px('qubit-walker', { cls: 'hero__peek-px', attrs: 'data-io-mode="stand"' })}</span>` : '') +
    `</a>`;
}

function labelsHTML(rows: number[], plateLeft: number[]): string {
  return `<ul class="hero__labels" role="list">${strings.top.fridgeLabels.map((l, i) =>
    `<li class="hero__label" style="--row:${rows[i] ?? 22 + 16 * i};--pl:${plateLeft[i] ?? 6}"><span class="hero__label-text">${escapeHTML(l)}</span><i class="hero__leader"></i></li>`).join('')}</ul>`;
}

function stripHTML(): string {
  const s = strings.top.strip;
  const cells = s.cells.map((c) =>
    `<a class="cell cell--link focus-inset hero-strip__cite" href="${escapeHTML(c.href)}"><span class="mono">${escapeHTML(c.name)}</span><span class="micro t-muted">${escapeHTML(c.venue)}</span><span class="hero-strip__glyph">${uiIcon('ui-external', 4)}</span></a>`).join('');
  return `<div class="cells cells--flush hero-strip"><div class="cell cell--paper hero-strip__label"><p class="h5">${escapeHTML(s.label)}</p></div>${cells}</div>`;
}

function render(root: HTMLElement, rows: number[], plateLeft: number[]): void {
  const t = strings.top;
  root.innerHTML =
    `<div class="hero">` +
      `<svg class="arc" viewBox="0 0 960 960" aria-hidden="true"><circle class="arc__front" cx="480" cy="480" r="479.5"/><circle class="arc__back" cx="480" cy="480" r="455.5"/></svg>` +
      `<div class="rail rail--left"><span class="dot hero__arcdot"></span></div>` +
      `<div class="hero__stage hero__stage--frame" aria-hidden="true"></div>` +
      `<div class="hero__main">` +
        `<div class="hero__content">` +
          `<div class="hero__text">` +
            h1HTML() +
            `<p class="lead hero__lead hero__rise" style="--d:1000ms">${escapeHTML(t.lead)}</p>` +
            `<div class="btn-row hero__btns hero__rise" style="--d:1150ms">${btnHTML(t.ctas.primary, 'btn--primary')}${btnHTML(t.ctas.secondary, 'btn--outline')}</div>` +
            `<p class="mono t-soft hero__ticker"><span class="hero__ticker-text"></span><span class="tag-illustrative hero__tag">${escapeHTML(strings.common.illustrative)}</span></p>` +
            `<div class="hero__pillwrap hero__rise" style="--d:1300ms">${pillHTML('hero__pill', true)}</div>` +
          `</div>` +
          `<div class="hero__fridge">` +
            `<div class="hero__stage hero__stage--cell" aria-hidden="true"></div>` +
            `<figure class="hero__fridge-fig" role="img" aria-label="${escapeHTML(t.alt.fridge)}">${px('fridge-hero', { cls: 'hero__fridge-px', attrs: 'data-io-intro="-2"' })}</figure>` +
            labelsHTML(rows, plateLeft) +
            `<i class="hero__bit" hidden></i><i class="hero__spark" hidden></i>` +
          `</div>` +
        `</div>` +
        `<div class="hero__floor" aria-hidden="true"></div>` +
      `</div>` +
      `<div class="rail rail--right"></div>` +
    `</div>` +
    `<div class="hero__pillbar">${pillHTML('pill--auto hero__pill-bar', false)}</div>` +
    stripHTML();
}

/* ------------------------------------------------------------------ the pill peek
   A qubit creature rises 48 px from behind the pill on hover/focus (4 px per frame over 200 ms) and sinks on leave. */
function peek(pill: HTMLElement): void {
  const el = pill.querySelector<HTMLElement>('.hero__peek-px');
  if (!el) return;
  const HIDDEN = 56, SHOWN = 24;       // 32 px of the creature shows: antenna, eyes, half the orb (integrator, queue #13: at 16 the antenna tip crossed the ticker)
  let y = HIDDEN, run: { stop(): void } | null = null;
  moveUnits(el, 0, y / 4);
  const go = (to: number) => {
    if (motion.reduced) { y = to; moveUnits(el, 0, y / 4); return; }
    run?.stop();
    run = tween({ from: y, to, ms: 200 * Math.abs(to - y) / (HIDDEN - SHOWN), ease: ease.linear, quantize: 4, onUpdate: (v) => { y = v; moveUnits(el, 0, v / 4); } });
  };
  const inside = () => pill.matches(':hover, :focus-visible');
  pill.addEventListener('pointerenter', () => go(SHOWN));
  pill.addEventListener('pointerleave', () => { if (!pill.matches(':focus-visible')) go(HIDDEN); });
  pill.addEventListener('focus', () => { if (pill.matches(':focus-visible')) go(SHOWN); });
  pill.addEventListener('blur', () => { if (!inside()) go(HIDDEN); });
}

/* ------------------------------------------------------------------ the dropped bit
   On `bit-exit` the azure pixel leaves the canvas bottom; it keeps falling (2 art px per tick) as a 4×4 HTML pixel to
   the floor line (the stage bottom, or the top of a floor block standing under it) and sparks for 2 ticks. */
function bitDrop(cell: HTMLElement, fridgeEl: HTMLElement, fridge: Mounted, getStage: () => HeroStage | null): void {
  const bit = cell.querySelector<HTMLElement>('.hero__bit')!;
  const spark = cell.querySelector<HTMLElement>('.hero__spark')!;
  const bitX = Number(fridge.piece.exports?.bitX ?? 28);
  let sub: TickSub | null = null;
  const stop = () => { if (sub) { clock.remove(sub); sub = null; } bit.hidden = true; };
  const blockTopUnder = (x: number): number | null => {
    const st = getStage();
    if (!st) return null;
    let best: number | null = null;
    for (const id of st.stage.ids()) {
      const el = st.stage.get(id).el;
      if (el.classList.contains('block--diamond')) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x < r.right && r.height > 0) { if (best === null || r.top < best) best = r.top; }
    }
    return best;
  };
  fridge.on('bit-exit', () => {
    if (motion.reduced || !fridge.playing) return;
    stop();
    const cr = cell.getBoundingClientRect(), fr = fridgeEl.getBoundingClientRect();
    const st = getStage();
    const stageBottom = st ? st.root.getBoundingClientRect().bottom : cr.bottom;
    const x = fr.left + bitX * 4;
    const left = Math.round(fr.left - cr.left) + bitX * 4;
    const top = Math.round(fr.bottom - cr.top);            // canvas bottom (rows 0..127 → 512 px)
    if (fr.bottom >= stageBottom - 4) return;              // the canvas already reaches the floor (sm): nothing to continue
    bit.style.left = `${left}px`; bit.style.top = `${top}px`;
    bit.hidden = false;
    let u = 0;
    sub = { kind: 'tick', onTick() {
      u += 2;
      const under = blockTopUnder(x + 2);
      const floor = Math.min(stageBottom, under ?? Infinity);
      const yMax = Math.floor((floor - fr.bottom) / 4) * 4;
      if (u * 4 >= yMax) {
        stop();
        spark.style.left = `${left - 4}px`; spark.style.top = `${top + yMax - 8}px`;
        spark.hidden = false; spark.classList.remove('is-2');
        let n = 0;
        const s2: TickSub = { kind: 'tick', onTick() { n++; if (n === 1) spark.classList.add('is-2'); else { clock.remove(s2); spark.hidden = true; } } };
        clock.add(s2);
        return;
      }
      moveUnits(bit, 0, u);
    } };
    clock.add(sub);
  });
  motion.onChange((r) => { if (r) { stop(); spark.hidden = true; } });
}

/* ------------------------------------------------------------------ mount */
export function mount(root: HTMLElement, _ctx: SectionCtx): void {
  // the piece exports its label rows / plate edges (art-spec card 1); defaults keep the layout sane with the placeholder
  const exp = hasPiece('fridge-hero') ? (getPiece('fridge-hero').exports ?? {}) : {};
  const rows = (exp.labelRows as number[] | undefined) ?? [22, 40, 58, 74, 88];
  const plateLeft = (exp.plateLeft as number[] | undefined) ?? [6, 9, 12, 15, 18];
  render(root, rows, plateLeft);
  hydrate(root);

  const hero = root.querySelector<HTMLElement>('.hero')!;
  const fridgeCell = root.querySelector<HTMLElement>('.hero__fridge')!;
  const fridgeEl = root.querySelector<HTMLElement>('.hero__fridge-px')!;
  const fridge = mountedOf(fridgeEl)!;
  const labels = [...root.querySelectorAll<HTMLElement>('.hero__label')];
  const tickerText = root.querySelector<HTMLElement>('.hero__ticker-text')!;
  const tag = root.querySelector<HTMLElement>('.hero__tag')!;
  const isFridge = fridge.piece.id === 'fridge-hero';

  /* ---- block stage: in the frame (lg/md) or in the fridge cell (sm); rebuilt when the breakpoint flips */
  const makeStage = artExport<HeroStageFn>('bands', 'heroStage', 'diamond');
  let stage: HeroStage | null = null;
  let introPending = !motion.reduced;
  const smq = matchMedia(SM), lgq = matchMedia(LG_HERO);
  const stageRoot = () => root.querySelector<HTMLElement>(smq.matches ? '.hero__stage--cell' : '.hero__stage--frame')!;
  const stageBp = () => (lgq.matches ? 'lg' : smq.matches ? 'sm' : 'md');
  const buildStage = () => {
    stage?.destroy();
    stage = null;
    root.querySelectorAll<HTMLElement>('.hero__stage').forEach((el) => { el.replaceChildren(); el.classList.remove('stage', 'bands-hero'); });
    if (!makeStage) { if (!missing.includes('bands')) missing.push('bands'); return; }
    // the blocks wait outside the frame until intro(): hidden until then, because the engine's Stage lays every block
    // out at rest once more on its first ResizeObserver pass (which would show them in place before they slide in)
    root.classList.toggle('is-pre-intro', introPending);
    stage = makeStage(stageRoot(), { bp: stageBp(), intro: introPending, riders: { pair: pieceId('qubit-pair'), cert: pieceId('cert-mini') } });
  };
  buildStage();
  smq.addEventListener('change', buildStage);
  lgq.addEventListener('change', buildStage);

  /* ---- the intro timeline */
  const timers: number[] = [];
  const at = (ms: number, fn: () => void) => { timers.push(window.setTimeout(fn, ms)); };
  let typed = false;
  const typeTicker = () => {
    if (typed) return;
    typed = true;
    typewriter(tickerText, strings.top.ticker.text, { msPerChar: 40, cursor: true, holdMs: 2000, onDone: () => tag.classList.add('in') });
    if (motion.reduced) tag.classList.add('in');
  };
  const showLabel = (k: number) => labels[k]?.classList.add('in');
  const readout = (i: number) => { if (!typed) tickerText.textContent = strings.top.cooldown[i] ?? ''; };

  if (isFridge) {
    fridge.on('lowered', () => readout(0));
    for (let k = 1; k <= 5; k++) fridge.on(`cool-${k}`, () => { showLabel(k - 1); readout(k); });
    fridge.on('ignite', () => { if (!typed) tickerText.textContent = ''; });
  }

  const finishStatic = () => {
    timers.splice(0).forEach(clearTimeout);
    root.classList.remove('is-pre-intro');
    root.classList.add('is-go', 'is-text', 'is-landed');
    labels.forEach((l) => l.classList.add('in'));
    if (isFridge) fridge.set('intro', -1);
    stage?.setStatic();
    introPending = false;
    typeTicker();
  };

  const start = () => {
    if (motion.reduced) { finishStatic(); return; }
    at(T.arc, () => root.classList.add('is-go'));
    at(T.fridge, () => { if (isFridge) fridge.set('intro', fridge.localTick + 1); else labels.forEach((l) => l.classList.add('in')); });
    // the text rises in its real face: wait for the fonts (capped at 1.2 s), never earlier than 400 ms
    const fontsReady = typeof document.fonts?.ready?.then === 'function' ? document.fonts.ready : Promise.resolve();
    const textAt = new Promise<void>((r) => at(T.text, r));
    Promise.all([textAt, Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))])]).then(() => { if (!motion.reduced) root.classList.add('is-text'); });
    at(T.blocks, () => { introPending = false; root.classList.remove('is-pre-intro'); stage?.intro(); });
    at(T.ticker, typeTicker);
    at(2000, () => root.classList.add('is-landed'));
    if (!isFridge) { at(1000, () => readout(0)); at(1500, () => { if (!typed) tickerText.textContent = ''; }); }
  };

  // once per load
  requestAnimationFrame(start);

  motion.onChange((reduced) => {
    if (reduced) finishStatic();
    else if (isFridge && fridge.io.intro === -1) { /* back to full motion: idle loop continues; no replay */ }
  });

  /* ---- hover gags and the bit */
  const pill = root.querySelector<HTMLElement>('.hero__pill');
  if (pill) peek(pill);
  if (isFridge) bitDrop(fridgeCell, fridgeEl, fridge, () => stage);

  window.__bp.sections = Object.assign((window.__bp.sections as Record<string, unknown>) ?? {}, {
    top: { missing: [...missing], get stage() { return stage; }, fridge, replay: () => { typed = false; root.classList.remove('is-go', 'is-text', 'is-landed'); labels.forEach((l) => l.classList.remove('in')); tag.classList.remove('in'); tickerText.textContent = ''; if (isFridge) fridge.set('intro', -2); introPending = true; buildStage(); start(); } },
  });
}

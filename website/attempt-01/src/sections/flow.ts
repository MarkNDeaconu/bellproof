// Section 7 · #flow · "Seven steps. The money moves last." (design-spec §5.7, content §10)
// Owner: sections-2.
//
// Swimlanes: on-chain steps left, off-chain right, a hairline spine between them. The job token rides the
// spine: the step it heads for comes from scroll (a step is reached when its row's centre crosses the
// reading line at 60 % of the viewport), with a time fallback (no scroll for 4 s while visible → one step
// every 2 s). It travels on the smooth clock in 4-px steps; as it passes a row the chain block clicks into
// the chain (clickChainBlock) and the card's bar flashes azure for one tick. At Settle the settle scene
// plays honest and cheat in turn. Reduced motion: every block lit, the token at Settle, the settle poster.

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import { escapeHTML as esc, research } from '../content/strings';
import {
  clock, ease, hasPiece, mount as mountPiece, mountedOf, motion, moveUnits, observe, tween,
  type Mounted, type Tween,
} from '../engine';
import { clickChainBlock, resetChainBlock } from '../art/chain-flow';
import '../styles/sections/flow.css';

const READ_LINE = 0.6;          // fraction of the viewport height a row's centre must cross
const IDLE_MS = 4000;           // no scroll for this long → the time fallback starts
const STEP_MS = 2000;           // then one step per this
const TOKEN = 48;               // job-token at U = 4
const SETTLE_WAIT = 10;         // settle tick shown while the job is still on its way (escrow locked)

const pid = (id: string) => (hasPiece(id) ? id : 'placeholder');

/** Engine reveals end on `clip-path: inset(0)`, which would clip focus rings: drop it once risen. */
function unclipReveals(root: HTMLElement): void {
  root.addEventListener('transitionend', (e) => {
    const el = e.target as HTMLElement;
    if (e.propertyName === 'clip-path' && el.matches('[data-reveal].in')) el.style.clipPath = 'none';
  });
}

export function mount(root: HTMLElement, ctx: SectionCtx): void {
  const s = ctx.strings.flow;
  const c = ctx.strings.common;
  const [laneOnName, ...laneOnRest] = s.lanes.on.split(' · ');
  const [laneOffName, ...laneOffRest] = s.lanes.off.split(' · ');
  const full = !motion.reduced;
  // the commit–reveal idea's source (content §10): the CCS 2026 paper, as the footer cites it
  const ccs = research[research.length - 1];
  const ccsLabel = ctx.strings.footer.columns.flatMap((col) => col.items).find((it) => 'href' in it && it.href === ccs.url)?.label ?? ccs.venue;

  const art = (st: (typeof s.steps)[number]) => {
    if (st.piece === 'chain-block') {
      return hasPiece('chain-block')
        ? `<span class="px" data-piece="chain-block" data-decorative data-io-mode="${esc(st.mode ?? 'post')}" data-io-lit="${full ? 'false' : 'true'}"></span>`
        : `<span class="px" data-piece="placeholder" data-decorative></span>`;
    }
    // the card beside it says what the step is; the art is decoration for assistive tech
    return `<span class="px" data-piece="${pid(st.piece)}" data-decorative></span>`;
  };

  root.innerHTML = `
  <div class="wrap flow">
    <header class="flow__head">
      <div class="flow__intro">
        <p class="eyebrow" data-reveal="1">${esc(s.eyebrow)}</p>
        <h2 class="h2" data-reveal="2">${esc(s.h2)}</h2>
      </div>
      <p class="lead flow__lead" data-reveal="3">${esc(s.lead)}</p>
    </header>

    <div class="flow__lanes">
      <p class="tag-illustrative flow__illus">${esc(c.illustrative)}</p>
      <div class="flow__heads">
        <p class="micro flow__lanehead flow__lanehead--on"><span class="flow__swatch" aria-hidden="true"></span><span class="flow__lane-name">${esc(laneOnName)}</span> · ${esc(laneOnRest.join(' · '))}</p>
        <p class="micro flow__lanehead flow__lanehead--off"><span class="flow__swatch" aria-hidden="true"></span><span class="flow__lane-name">${esc(laneOffName)}</span> · ${esc(laneOffRest.join(' · '))}</p>
      </div>
      <span class="flow__spine" aria-hidden="true"></span>
      <ol class="flow__steps" role="list">
        ${s.steps.map((st, i) => `
        <li class="flow__row flow__row--${st.lane}" data-step="${i}">
          <span class="dot flow__stop" aria-hidden="true"></span>
          <article class="flow__card flow__card--${st.lane}${full ? '' : ' is-reached'}">
            <span class="num-l flow__n" aria-hidden="true">${esc(st.n)}</span>
            <div class="flow__text">
              <p class="micro flow__lanetag">${esc(st.lane === 'on' ? s.laneTags.on : s.laneTags.off)}</p>
              <h3 class="h5 flow__title"><span class="vh">${esc(st.n)}. </span>${esc(st.title)}</h3>
              <p class="flow__body">${esc(st.body)}</p>
              ${st.aside ? `<p class="mono flow__aside${st.aside === 'ACCEPTED' ? ' flow__aside--verdict' : ''}">${esc(st.aside)}</p>` : ''}
            </div>
          </article>
          <span class="flow__art flow__art--${st.piece}">${art(st)}</span>
        </li>`).join('')}
      </ol>
      <div class="flow__row flow__row--settle">
        <div class="flow__stage"><span class="flow__settle" data-settle></span></div>
      </div>
      <span class="flow__token" aria-hidden="true"><span data-token></span></span>
    </div>

    <div class="flow__outcomes cells cells--2">
      <div class="cell flow__outcome flow__outcome--honest" data-reveal="1">
        <i data-icon="ui-check" data-size="4"></i>
        <h3 class="h4">${esc(s.outcomes.honest.title)}</h3>
        <ol class="flow__list" role="list">
          ${s.outcomes.honest.items.map((it, i) => `<li><span class="mono flow__li-n" aria-hidden="true">${i + 1}</span><span>${esc(it)}</span></li>`).join('')}
        </ol>
      </div>
      <div class="cell flow__outcome flow__outcome--cheat" data-reveal="2">
        <i data-icon="ui-warn" data-size="4"></i>
        <h3 class="h4">${esc(s.outcomes.cheat.title)}</h3>
        <ol class="flow__list" role="list">
          ${s.outcomes.cheat.items.map((it, i) => `<li><span class="mono flow__li-n" aria-hidden="true">${i + 1}</span><span>${esc(it)}</span></li>`).join('')}
        </ol>
      </div>
    </div>

    <div class="flow__note">
      <div class="flow__note-text" data-reveal="1">
        <h3 class="h5">${esc(s.note.title)}</h3>
        <p class="flow__note-body">${esc(s.note.body)}</p>
        <p class="small flow__cite"><a class="link link--icon" data-hop="out" href="${esc(ccs.url)}" target="_blank" rel="noopener"><span>${esc(ccsLabel)}</span><i data-icon="ui-external-sm" data-size="2"></i></a><span class="mono flow__arxiv">${esc(ccs.arxiv)}</span></p>
      </div>
      <div class="flow__demo">
        <p class="mono flow__details">${esc(s.demoDetails)}</p>
        <div class="btn-row">
          ${s.ctas.map((l) => `<a class="btn btn--outline" data-hop="out" href="${esc(l.href)}"><span class="btn__label">${esc(l.label)}</span><span class="btn__icon"><i data-icon="ui-external-sm"></i></span></a>`).join('')}
        </div>
      </div>
    </div>
  </div>`;

  unclipReveals(root);
  hydrate(root);
  lanes(root.querySelector<HTMLElement>('.flow__lanes')!);
}

/* ------------------------------------------------------------------ the swimlane driver */
function lanes(el: HTMLElement): void {
  const rows = [...el.querySelectorAll<HTMLElement>('.flow__row[data-step]')];
  const cards = rows.map((r) => r.querySelector<HTMLElement>('.flow__card')!);
  const blocks = rows.map((r) => {
    const span = r.querySelector<HTMLElement>('[data-piece="chain-block"]');
    return span ? mountedOf(span) ?? null : null;
  });
  const tokenBox = el.querySelector<HTMLElement>('.flow__token')!;
  const token: Mounted = mountPiece(el.querySelector<HTMLElement>('[data-token]')!, pid('job-token'), {
    decorative: true, inputs: { progress: 0, walk: false },
  });
  const settle: Mounted = mountPiece(el.querySelector<HTMLElement>('[data-settle]')!, pid('settle'), { autoplay: false });
  const last = rows.length - 1;

  let stops: number[] = [];       // token y (px, multiple of 4) per row, relative to the lanes box
  let target = -1;                // step the token heads for (−1: waiting at row 1, nothing reached)
  let arrived = -1;               // highest step reached so far
  let y = 0;                      // current token y (px)
  let move: Tween | null = null;
  let visible = false;
  let lastScroll = performance.now();
  let lastAuto = 0;
  let autoStep = -1;
  let unTick: (() => void) | null = null;

  const lgMq = matchMedia('(min-width: 1024px)');
  const measure = () => {
    // the spine on a whole pixel, so the hairline, the stations and the token stay crisp
    el.style.setProperty('--spine-x', lgMq.matches ? `${Math.floor(el.clientWidth / 2)}px` : '24px');
    const top = el.getBoundingClientRect().top;
    stops = rows.map((r) => {
      const b = r.getBoundingClientRect();
      return Math.round((b.top - top + b.height / 2 - TOKEN / 2) / 4) * 4;
    });
  };
  const place = (v: number) => { y = v; moveUnits(tokenBox, 0, v / 4); };

  function flash(card: HTMLElement): void {
    card.classList.add('is-flash');
    const un = clock.add({ kind: 'tick', onTick() { card.classList.remove('is-flash'); un(); } });
  }
  function arrive(i: number, animate: boolean): void {
    cards[i].classList.add('is-reached');
    const b = blocks[i];
    if (b) {
      if (animate) clickChainBlock(b); else { b.set('lit', true); b.set('age', 8); }
    }
    if (animate) flash(cards[i]);
    if (i === last) { settle.seek(SETTLE_WAIT); if (visible && animate) settle.play(); }
  }
  function leave(i: number): void {
    cards[i].classList.remove('is-reached');
    const b = blocks[i];
    if (b) resetChainBlock(b);
    if (i === last) { settle.stop(); settle.seek(SETTLE_WAIT); }
  }
  /** Reconcile what is reached with where the token is: rows click in order as it passes them. */
  function sync(animate = true): void {
    let pos = 0;
    for (let i = 0; i < stops.length; i++) if (stops[i] <= y + 1) pos = i;
    const want = Math.min(target, pos);
    while (arrived < want) arrive(++arrived, animate);
    while (arrived > want) leave(arrived--);
    token.set('progress', Math.max(0, arrived) / last);
  }

  function goTo(step: number): void {
    step = Math.max(-1, Math.min(last, step));
    if (step === target && move) return;
    target = step;
    const goal = stops[Math.max(0, step)] ?? 0;
    move?.stop();
    if (goal === y) { move = null; token.set('walk', false); sync(); return; }
    const from = y;
    const dist = Math.abs(goal - from);
    token.set('walk', true);
    move = tween({
      from, to: goal, ms: Math.min(1100, 320 + dist * 1.6), ease: ease.power3Out, quantize: 4,
      onUpdate(v) { place(v); sync(); },
      onDone() { move = null; place(goal); token.set('walk', false); sync(); },
    });
  }

  /** The step whose row centre has crossed the reading line. */
  function scrollStep(): number {
    const line = window.innerHeight * READ_LINE;
    let step = -1;
    rows.forEach((r, i) => { const b = r.getBoundingClientRect(); if (b.top + b.height / 2 <= line) step = i; });
    return step;
  }

  const onScroll = () => {
    lastScroll = performance.now();
    autoStep = -1;
    goTo(scrollStep());
  };
  const stage = el.querySelector<HTMLElement>('.flow__stage')!;
  let verdict = '';
  const showVerdict = (st: string) => {
    const v = st === 'paid' ? 'honest' : st === 'slashed' ? 'cheat' : '';
    if (v === verdict) return;
    verdict = v;
    stage.classList.toggle('is-honest', v === 'honest');
    stage.classList.toggle('is-cheat', v === 'cheat');
  };
  const idle = () => {
    showVerdict(settle.playing ? settle.state() ?? '' : '');
    const now = performance.now();
    if (now - lastScroll < IDLE_MS || now - lastAuto < STEP_MS || move) return;
    const base = Math.max(target, scrollStep(), autoStep);
    if (base >= last) return;
    lastAuto = now;
    autoStep = base + 1;
    goTo(autoStep);
  };

  function setFinal(): void {
    move?.stop(); move = null;
    target = last;
    place(stops[last]);
    for (let i = 0; i <= last; i++) {
      cards[i].classList.add('is-reached');
      const b = blocks[i];
      if (b) { b.set('lit', true); b.set('age', 8); }
    }
    arrived = last;
    token.set('walk', false);
    token.set('progress', 1);
    settle.stop();
    settle.seek(settle.piece.poster);
    showVerdict(settle.state() ?? '');
  }
  function setLive(): void {
    // back to full motion: reflect the scroll position without replaying every click
    move?.stop(); move = null;
    target = scrollStep();
    place(stops[Math.max(0, target)]);
    arrived = last;
    while (arrived > target) leave(arrived--);
    token.set('progress', Math.max(0, arrived) / last);
    settle.seek(SETTLE_WAIT);
    if (arrived === last && visible) settle.play();
  }

  measure();
  if (motion.reduced) setFinal();
  else { rows.forEach((_, i) => leave(i)); arrived = -1; place(stops[0]); }

  observe(el, {
    play() {
      visible = true;
      if (motion.reduced) return;
      window.addEventListener('scroll', onScroll, { passive: true });
      unTick ??= clock.add({ kind: 'tick', onTick: idle });
      lastScroll = performance.now();
      goTo(scrollStep());
      if (arrived === last) settle.play();
    },
    stop() {
      visible = false;
      window.removeEventListener('scroll', onScroll);
      unTick?.(); unTick = null;
      settle.stop();
    },
  });

  // fonts, breakpoints and resizes move the rows: re-measure and keep the token on its row
  new ResizeObserver(() => {
    measure();
    if (motion.reduced) { place(stops[last]); return; }
    if (!move) { place(stops[Math.max(0, target)]); return; }
    move.stop(); move = null;
    goTo(target);
  }).observe(el);

  motion.onChange((reduced) => {
    if (reduced) { setFinal(); return; }
    setLive();
    if (visible) { window.addEventListener('scroll', onScroll, { passive: true }); unTick ??= clock.add({ kind: 'tick', onTick: idle }); }
  });
}

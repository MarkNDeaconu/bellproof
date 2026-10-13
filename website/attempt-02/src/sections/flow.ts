// Section 7 · #flow · "Seven steps. The money moves last." (design-spec §5.7, content §10; revision 1 §1.6, S2-2)
// Owner: sections-2.
//
// Swimlanes: on-chain steps left, off-chain right, a hairline spine between them; 96-px step rows with the chain
// blocks hugging their cards. The job token rides the spine: the step it heads for comes from scroll (a step is
// reached when its row's centre crosses the reading line at 60 % of the viewport), with a time fallback (no scroll
// for 4 s while visible → one step every 2 s). It travels on the smooth clock in 4-px steps and leaves a short
// azure wake that fades over 6 ticks; as it passes a row the chain block clicks into the chain (clickChainBlock)
// and the card's bar flashes azure with a 2-px glow for 3 ticks. At Settle the settle scene plays honest and cheat
// in turn, its stage edge taking the verdict's colour.
// Reduced motion (OS): every block lit, the token at Settle, the settle poster. Pause switch: everything freezes
// where it is (no scroll tracking, no timers); play resumes from the scroll position.

import type { SectionCtx } from '../main';
import { hydrate } from './nav';
import { escapeHTML as esc } from '../content/strings';
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
const WAKE = 24;                // the wake trail's length (px)
const FLASH_TICKS = 3;          // the card bar's flash on a click
const REST_AGE = 8;             // chain-block `age` at rest (CLICK_TICKS)
const SETTLE_WAIT = 10;         // settle tick shown while the job is still on its way (escrow locked)

const pid = (id: string) => (hasPiece(id) ? id : 'placeholder');

/** Engine reveals end on a slack clip-path; drop it once risen so nothing (focus rings, art) is ever clipped. */
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

  const art = (st: (typeof s.steps)[number]) => {
    if (st.piece === 'chain-block') {
      return hasPiece('chain-block')
        ? `<span class="px" data-piece="chain-block" data-decorative data-io-mode="${esc(st.mode ?? 'post')}" data-io-lit="${full ? 'false' : 'true'}"></span>`
        : `<span class="px" data-piece="placeholder" data-decorative></span>`;
    }
    // the card beside it says what the step is; the art is decoration for assistive tech
    return `<span class="px" data-piece="${pid(st.piece)}" data-decorative></span>`;
  };
  // a space text node before the tag, so assistive tech reads "… kcal/mol illustrative"
  // the aside breaks only at its " · " separators ("±1.0 kcal/mol" never splits); the tag wraps as a whole
  const aside = (st: (typeof s.steps)[number]) => !st.aside ? '' :
    `<p class="mono flow__aside${st.aside === 'ACCEPTED' ? ' flow__aside--verdict' : ''}">${st.aside.split(' · ').map((seg) => `<span class="nowrap">${esc(seg)}</span>`).join(' · ')}${st.illustrative ? ` <span class="tag-illustrative nowrap">${esc(c.illustrative)}</span>` : ''}</p>`;

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
      <div class="flow__heads">
        <p class="micro flow__lanehead flow__lanehead--on"><span class="flow__swatch" aria-hidden="true"></span><span class="flow__lane-name">${esc(laneOnName)}</span> · ${esc(laneOnRest.join(' · '))}</p>
        <p class="micro flow__lanehead flow__lanehead--off"><span class="flow__swatch" aria-hidden="true"></span><span class="flow__lane-name">${esc(laneOffName)}</span> · ${esc(laneOffRest.join(' · '))}</p>
      </div>
      <span class="flow__spine" aria-hidden="true"></span>
      <ol class="flow__steps" role="list">
        ${s.steps.map((st, i) => `
        <li class="flow__row flow__row--${st.lane}${st.piece === 'fridge-mini' ? ' flow__row--tall' : ''}" data-step="${i}">
          <span class="dot flow__stop" aria-hidden="true"></span>
          <article class="flow__card flow__card--${st.lane}${full ? '' : ' is-reached'}">
            <span class="num-l flow__n" aria-hidden="true">${esc(st.n)}</span>
            <p class="micro flow__lanetag">${esc(st.lane === 'on' ? s.laneTags.on : s.laneTags.off)}</p>
            <div class="flow__text">
              <h3 class="h5 flow__title"><span class="vh">${esc(st.n)}. </span>${esc(st.title)}</h3>
              <p class="flow__body">${esc(st.body)}</p>
              ${aside(st)}
            </div>
          </article>
          <span class="flow__art flow__art--${st.piece}">${art(st)}</span>
        </li>`).join('')}
      </ol>
      <div class="flow__row flow__row--settle">
        <figure class="flow__stage" role="img" aria-label="${esc(s.alt.chainFlow)}"><span class="flow__settle" data-settle></span></figure>
      </div>
      <span class="flow__wake" aria-hidden="true"></span>
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
        <p class="small flow__cite"><a class="link link--icon" data-hop="out" href="${esc(s.note.cite.href)}"><span>${esc(s.note.cite.label)}</span><i data-icon="ui-external-sm" data-size="2"></i></a> <span class="mono flow__arxiv">${esc(s.note.cite.detail)}</span></p>
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
  const wake = el.querySelector<HTMLElement>('.flow__wake')!;
  const token: Mounted = mountPiece(el.querySelector<HTMLElement>('[data-token]')!, pid('job-token'), {
    decorative: true, inputs: { progress: 0, walk: false },
  });
  // decorative: its <figure role="img"> carries flow.alt.chainFlow
  const settle: Mounted = mountPiece(el.querySelector<HTMLElement>('[data-settle]')!, pid('settle'), { autoplay: false, decorative: true });
  const stage = el.querySelector<HTMLElement>('.flow__stage')!;
  const last = rows.length - 1;

  let stops: number[] = [];       // token y (px, multiple of 4) per row, relative to the lanes box
  let target = -1;                // step the token heads for (−1: waiting at row 1, nothing reached)
  let arrived = -1;               // highest step reached so far
  let y = 0;                      // current token y (px)
  let dir = 1;                    // travel direction, for the wake
  let move: Tween | null = null;
  let visible = false;
  let listening = false;
  let lastScroll = performance.now();
  let lastAuto = 0;
  let autoStep = -1;
  let unTick: (() => void) | null = null;
  const flashes = new Map<HTMLElement, () => void>();

  const lgMq = matchMedia('(min-width: 1024px)');
  const measure = () => {
    // the spine on a whole pixel, so the hairline, the stations, the wake and the token stay crisp
    el.style.setProperty('--spine-x', lgMq.matches ? `${Math.floor(el.clientWidth / 2)}px` : '24px');
    const top = el.getBoundingClientRect().top;
    stops = rows.map((r) => {
      const b = r.getBoundingClientRect();
      return Math.round((b.top - top + b.height / 2 - TOKEN / 2) / 4) * 4;
    });
  };
  const place = (v: number) => {
    y = v;
    moveUnits(tokenBox, 0, v / 4);
    wake.style.transform = `translateY(${dir > 0 ? v - WAKE : v + TOKEN}px)`;
  };

  /* ---- the click: block drop (art driver) + the card's bar flashing azure with a 2-px glow for 3 ticks ---- */
  function flash(card: HTMLElement): void {
    flashes.get(card)?.();
    card.classList.add('is-flash');
    let n = 0;
    const un = clock.add({ kind: 'tick', onTick() { if (++n >= FLASH_TICKS) stopFlash(card); } });
    flashes.set(card, un);
  }
  function stopFlash(card: HTMLElement): void {
    flashes.get(card)?.();
    flashes.delete(card);
    card.classList.remove('is-flash');
  }
  function rest(b: Mounted): void { resetChainBlock(b); b.set('lit', true); b.set('age', REST_AGE); }

  function arrive(i: number, animate: boolean): void {
    cards[i].classList.add('is-reached');
    const b = blocks[i];
    if (b) { if (animate) clickChainBlock(b); else rest(b); }
    if (animate) flash(cards[i]);
    if (i === last) { settle.seek(SETTLE_WAIT); if (visible && animate) settle.play(); }
  }
  function leave(i: number): void {
    cards[i].classList.remove('is-reached');
    stopFlash(cards[i]);
    const b = blocks[i];
    if (b) resetChainBlock(b);
    if (i === last) { settle.stop(); settle.seek(SETTLE_WAIT); showVerdict(''); }
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
    if (goal === y) { move = null; token.set('walk', false); wake.classList.remove('is-moving'); sync(); return; }
    const from = y;
    const dist = Math.abs(goal - from);
    dir = goal > from ? 1 : -1;
    token.set('walk', true);
    wake.classList.add('is-moving');
    move = tween({
      from, to: goal, ms: Math.min(1000, 280 + dist * 1.6), ease: ease.power3Out, quantize: 4,
      onUpdate(v) { place(v); sync(); },
      onDone() { move = null; place(goal); token.set('walk', false); wake.classList.remove('is-moving'); sync(); },
    });
  }

  /** The step whose row centre has crossed the reading line. */
  function scrollStep(): number {
    const line = window.innerHeight * READ_LINE;
    let step = -1;
    rows.forEach((r, i) => { const b = r.getBoundingClientRect(); if (b.top + b.height / 2 <= line) step = i; });
    return step;
  }

  let verdict = '';
  function showVerdict(st: string): void {
    const v = st === 'paid' ? 'honest' : st === 'slashed' ? 'cheat' : '';
    if (v === verdict) return;
    verdict = v;
    stage.classList.toggle('is-honest', v === 'honest');
    stage.classList.toggle('is-cheat', v === 'cheat');
  }

  const onScroll = () => {
    lastScroll = performance.now();
    autoStep = -1;
    if (listening && !unTick) unTick = clock.add({ kind: 'tick', onTick: idle });   // un-park (see idle)
    goTo(scrollStep());
  };
  const idle = () => {
    showVerdict(settle.playing ? settle.state() ?? '' : '');
    const now = performance.now();
    if (now - lastScroll < IDLE_MS || now - lastAuto < STEP_MS || move) return;
    const base = Math.max(target, scrollStep(), autoStep);
    // integrator R2: the token has arrived and the settle sprite is not playing, so nothing on screen changes: park the
    // 12 fps tick (it kept ~14 rAF/s alive with nothing animating) until the next scroll event wakes it
    if (base >= last) { if (!settle.playing) { unTick?.(); unTick = null; } return; }
    lastAuto = now;
    autoStep = base + 1;
    goTo(autoStep);
  };

  /** Scroll tracking and the 12-fps idle tick run only while the lanes are near the viewport and motion is on. */
  function listen(on: boolean): void {
    if (on === listening) return;
    listening = on;
    if (on) {
      window.addEventListener('scroll', onScroll, { passive: true });
      unTick = clock.add({ kind: 'tick', onTick: idle });
      lastScroll = performance.now();
    } else {
      window.removeEventListener('scroll', onScroll);
      unTick?.(); unTick = null;
    }
  }

  /** OS reduced motion: the end state. */
  function setFinal(): void {
    move?.stop(); move = null;
    target = last;
    wake.classList.remove('is-moving');
    place(stops[last]);
    for (let i = 0; i <= last; i++) {
      cards[i].classList.add('is-reached');
      stopFlash(cards[i]);
      const b = blocks[i];
      if (b) rest(b);
    }
    arrived = last;
    token.set('walk', false);
    token.set('progress', 1);
    settle.stop();
    settle.seek(settle.piece.poster);
    showVerdict(settle.state() ?? '');
  }
  /** The pause switch: freeze where we are; anything mid-flight lands in its rest state, nothing keeps ticking. */
  function freeze(): void {
    if (move) { move.stop(); move = null; place(stops[Math.max(0, target)]); }
    wake.classList.remove('is-moving');
    token.set('walk', false);
    sync(false);
    cards.forEach(stopFlash);
    blocks.forEach((b, i) => { if (b && i <= arrived && b.state() === 'clicking') rest(b); });
    // the engine shows every poster; the settle poster is the paid scene, so only keep it once the job settled
    settle.stop();
    if (arrived === last) { settle.seek(settle.piece.poster); showVerdict(settle.state() ?? ''); }
    else { settle.seek(SETTLE_WAIT); showVerdict(''); }
  }
  /** Motion back on: reflect the scroll position without replaying every click, then track again. */
  function setLive(): void {
    move?.stop(); move = null;
    target = scrollStep();
    place(stops[Math.max(0, target)]);
    while (arrived < target) arrive(++arrived, false);
    while (arrived > target) leave(arrived--);
    token.set('progress', Math.max(0, arrived) / last);
    settle.stop();
    settle.seek(SETTLE_WAIT);
    showVerdict('');
    if (arrived === last && visible) settle.play();
  }

  measure();
  if (motion.reduced) setFinal();
  else { rows.forEach((_, i) => leave(i)); arrived = -1; place(stops[0]); }

  observe(el, {
    play() {
      visible = true;
      if (motion.reduced) return;
      listen(true);
      goTo(scrollStep());
      if (arrived === last) settle.play();
    },
    stop() {
      visible = false;
      listen(false);
      settle.stop();
    },
  });

  // fonts, breakpoints and resizes move the rows: re-measure and keep the token on its row
  new ResizeObserver(() => {
    measure();
    if (move) { move.stop(); move = null; goTo(target); return; }
    place(stops[Math.max(0, target)]);
  }).observe(el);

  motion.onChange((reduced) => {
    if (reduced) {
      listen(false);
      if (motion.paused && !motion.prefersReduced) freeze(); else setFinal();
      return;
    }
    setLive();
    if (visible) listen(true);
  });
}

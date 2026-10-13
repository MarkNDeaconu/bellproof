// card 15 · revision 1 · the hero block stage (B2, B3, B4, B6): two rail stacks, the round tiles on the right stack,
// the pair and the certificate standing on the floor, registration dots, the T/C shuffle and the intro.
//
// Structure inside `root` (the section gives it the hero frame at lg / lg-narrow, the fridge cell when stacked):
//   .bands-rail--l   a Stage M wide, anchored bottom-left, fixed height (railRows · M): the left stack
//   .bands-rail--r   the same, anchored bottom-right: the right stack (+ the reservoir under the floor), tiles inside
//   .bands-floor-slot × 2   `qubit-pair` at left: M and `cert-mini` at right: M, standing on the floor
// Nothing depends on the root's width or height: the rails are placed by CSS, so resizes never rebuild (only a change of
// layout across 1200 / 1440 does, when the layout is not forced).
//
// The shuffle is one driver: cycle time `t` (ms) → block offsets, block tones and tile cues, all pure functions of `t`
// from layouts.ts. A tick subscriber advances `t` at 12 fps; during a move a frame subscriber takes over (display rate),
// so the page is not held at display rate for the 12.8 s of each cycle in which no block moves.

import {
  clock, ease, motion, mountAll, mountedOf, observe, PALETTE, sequence,
  type FrameSub, type Key, type Mounted, type Sequence, type Stage, type TickSub, type TweenSpec,
} from '../../engine';
import {
  facesAt, heroChoreo, heroLayout, heroLayoutFor, heroLayoutFromBp, moving, rightOffsetAt, shiftStep, toneAt, TICK,
  type Breakpoint, type HeroChoreo, type HeroLayout, type HeroLayoutName, type HeroRiderIds, type TileFace,
} from './layouts';
import { railStage, resolveRider } from './rails';
import { ensureStyles } from './styles';

export { resolveRider } from './rails';

export interface HeroStageOpts {
  /** Force a layout; default `heroLayoutFor(innerWidth)` (lg ≥ 1440, lg-narrow ≥ 1200, stacked below), re-checked on resize. */
  layout?: HeroLayoutName;
  /** Legacy alias: 'lg' | 'md' | 'sm' (md → lg-narrow from 1200, else stacked; sm → stacked) or a layout name. */
  bp?: Breakpoint | HeroLayoutName;
  /** Override piece ids (missing pieces fall back to `placeholder`): pair, cert, tile. */
  riders?: Partial<HeroRiderIds>;
  /** Run the shuffle whenever the stage is in view (default true). With `intro: true` it starts when the intro ends. */
  autoplay?: boolean;
  /** Prepare the intro: blocks wait outside the stage until `intro()` (default false). */
  intro?: boolean;
}

export interface HeroStage {
  readonly root: HTMLElement;
  readonly layoutName: HeroLayoutName;
  /** Legacy alias of `layoutName`. */
  readonly bp: HeroLayoutName;
  readonly layout: HeroLayout;
  readonly module: number;
  readonly choreo: HeroChoreo;
  /** The left rail Stage (legacy `stage`); both are in `stages`. */
  readonly stage: Stage;
  readonly stages: { left: Stage; right: Stage };
  /** Every block element by id (L1…, R1…, Rr). */
  readonly blocks: Record<string, HTMLElement>;
  /** The round tiles, top → bottom of the visible right stack, then the reservoir's. */
  readonly tiles: Mounted[];
  /** The floor sprites: [pair, cert]. */
  readonly riders: Mounted[];
  readonly dots: HTMLElement[];
  /** Cycle time in ms (0 … cycleMs). */
  readonly time: number;
  readonly cycleMs: number;
  /** True while the shuffle driver is subscribed. */
  readonly playing: boolean;
  /** Slide-in (lg: rails from the sides, bottom block first; stacked: stacks rise from below the floor), 700 ms power4Out,
   *  stagger 100 ms, floor sprites rise, dots fade in last (300 ms). Resolves when the dots are in; the shuffle then
   *  starts if `autoplay`. Reduced motion: lands at once. */
  intro(): Promise<void>;
  /** Land everything at rest now (blocks, sprites, dots) and start the shuffle if `autoplay` (the intro fail-safe). */
  finish(): void;
  play(): void;
  pause(): void;
  /** Jump to cycle time `ms` (tiles change face without animating). */
  seek(ms: number): void;
  /** The poster (reduced motion): blocks at rest, ✓ on every visible tile, nothing moving. */
  setStatic(): void;
  /** Rebuild the DOM (layout re-read), keeping the cycle time. */
  rebuild(): void;
  destroy(): void;
}

const INTRO_MS = 700;
const INTRO_STAGGER = 100;

export function heroStage(root: HTMLElement, opts: HeroStageOpts = {}): HeroStage {
  ensureStyles();
  const autoplay = opts.autoplay !== false;
  const vw = () => (typeof innerWidth === 'number' ? innerWidth : root.clientWidth);
  const forced: HeroLayoutName | undefined = opts.layout ?? (opts.bp ? heroLayoutFromBp(opts.bp, vw()) : undefined);
  let introPending = !!opts.intro;
  let wantPlay = autoplay && !introPending;
  let visible = false;
  let destroyed = false;
  let t = 0;                                  // cycle time (ms)
  let tickSub: TickSub | null = null, frameSub: FrameSub | null = null;

  interface Built {
    name: HeroLayoutName; layout: HeroLayout; choreo: HeroChoreo; M: number; hs: number;
    left: Stage; right: Stage; railEls: HTMLElement[];
    blocks: Record<string, HTMLElement>; steps: Record<string, Key>; restY: Record<string, number>; side: Record<string, 'l' | 'r'>;
    tiles: Mounted[]; tileById: Record<string, Mounted>; floor: HTMLElement[]; riders: Mounted[]; dots: HTMLElement[];
    lastOff: number | null; lastTone: Record<string, Key>; enter: Sequence | null; ro: ResizeObserver | null;
  }
  let b!: Built;

  function build(prepareIntro: boolean): Built {
    const name = forced ?? heroLayoutFor(vw());
    const layout = heroLayout(name, { riders: opts.riders });
    const choreo = heroChoreo(name);
    const M = layout.module, hs = layout.railRows * M;
    root.replaceChildren();
    root.classList.add('bands-hero');
    root.dataset.layout = name;
    if (typeof getComputedStyle === 'function' && getComputedStyle(root).position === 'static') root.style.position = 'relative';

    // tiles ride inside the right-stack blocks, centred (inset 16 at M 128 / 96, 0 at 64)
    for (const td of layout.tiles) {
      const def = layout.right.find((d) => d.id === td.block)!;
      const r = resolveRider(opts.riders?.tile ?? 'round-tile', td.variant, td.size);
      const left = (M - r.size[0] * 4) / 2, bottom = (M - r.size[1] * 4) / 2;
      def.rider = { piece: r.piece, variant: r.variant, dx: left / 4, dy: (bottom - M) / 4 };
    }
    // the rails clip only at the floor (and at the outer edge, where the intro slides in); 8 px of slack inside and on top
    // keeps the 4-px registration dots (centred on the stack's top corner) whole
    const l = railStage(root, 'l', M, hs, layout.left, 'inset(-8px -8px 0 0)');
    const r = railStage(root, 'r', M, hs, layout.right, 'inset(-8px 0 0 -8px)');
    const blocks: Record<string, HTMLElement> = {}, steps: Record<string, Key> = {}, restY: Record<string, number> = {}, side: Record<string, 'l' | 'r'> = {};
    for (const [st, defs, s] of [[l.stage, layout.left, 'l'], [r.stage, layout.right, 'r']] as const) {
      for (const d of defs) {
        blocks[d.id] = st.get(d.id).el;
        steps[d.id] = d.step;
        restY[d.id] = hs - (d.rowFromFloor + d.size) * M;     // the Stage's own placement for a fixed-height rail
        side[d.id] = s;
      }
    }
    // desynchronise the tiles' idle shimmer
    layout.tiles.forEach((td, i) => { const el = blocks[td.block].querySelector<HTMLElement>('.rider'); if (el) el.dataset.phase = String(i * 11); });

    // the pair and the certificate stand on the floor, in slots that clip at the floor (they rise through it in the intro)
    const floor: HTMLElement[] = [];
    for (const f of layout.floorRiders) {
      const rr = resolveRider(f.piece, f.variant, f.size);
      const slot = document.createElement('div');
      slot.className = `bands-floor-slot bands-floor-slot--${f.id}`;
      slot.style.cssText = `position:absolute;bottom:0;${f.side}:${f.offset}px;width:${rr.size[0] * 4}px;height:${rr.size[1] * 4}px;overflow:hidden;`;
      const el = document.createElement('span');
      el.className = 'px bands-floor';
      el.dataset.piece = rr.piece;
      if (rr.variant) el.dataset.variant = rr.variant;
      el.dataset.decorative = '';
      el.dataset.floorRider = f.id;
      el.dataset.h = String(rr.size[1] * 4);
      slot.appendChild(el);
      root.appendChild(slot);
      floor.push(el);
    }
    mountAll(root);
    const tileById: Record<string, Mounted> = {};
    const tiles = layout.tiles.map((td) => (tileById[td.block] = mountedOf(blocks[td.block].querySelector('.rider')!)!));
    const riders = floor.map((el) => mountedOf(el)!);

    // registration dots: 4×4 ink squares centred on the rail line at each stack's top; children of the top block
    const dots = layout.dots.map((d) => {
      const i = document.createElement('i');
      i.className = `bands-dot bands-dot--${d.corner}`;
      blocks[d.block].appendChild(i);
      return i;
    });

    const nb: Built = {
      name, layout, choreo, M, hs, left: l.stage, right: r.stage, railEls: [l.el, r.el], blocks, steps, restY, side,
      tiles, tileById, floor, riders, dots, lastOff: null, lastTone: {}, enter: null, ro: null,
    };
    // a Stage re-lays out its blocks at rest when its rail is first measured (e.g. built while hidden): re-apply ours
    // (never during the intro: the blocks are off-stage or mid-slide; the first callback is the observer's initial report)
    if (typeof ResizeObserver === 'function') {
      let first = true;
      nb.ro = new ResizeObserver(() => { if (first) { first = false; return; } if (b === nb && !introPending) { if (motion.reduced) poster(); else apply(t, null, true); } });
      nb.ro.observe(l.el);
    }
    if (prepareIntro && !motion.reduced) prepareEnter(nb);
    return nb;
  }

  /* ------------------------------------------------------------------ state at cycle time t */
  function setTile(m: Mounted, face: TileFace, mode: 'flip' | 'fade' | 'set'): void {
    if (mode === 'fade') { m.set('from', (m.io.face as TileFace) ?? '?'); m.set('flip', -1); m.set('face', face); m.set('fade', m.localTick + 1); return; }
    m.set('fade', -1);
    m.set('face', face);
    m.set('flip', mode === 'flip' ? m.localTick + 1 : -1);    // round-tile: edge-on on the next drawn tick, half, then the face
  }

  /** Apply the shuffle state at `now`. `prev` (live advance): tile cues crossed in (prev, now] animate. `force` rewrites
   *  every transform and tone (after a rebuild or a Stage re-layout). */
  function apply(now: number, prev: number | null, force = false): void {
    if (!b) return;
    const c = b.choreo;
    const off = rightOffsetAt(c, now, b.M);
    if (force || off !== b.lastOff) {
      b.lastOff = off;
      for (const id in b.blocks) {
        const y = b.restY[id] + (b.side[id] === 'r' ? -off : off);
        b.blocks[id].style.transform = `translate(0px, ${y}px)`;
      }
    }
    for (const id in b.blocks) {
      const k = shiftStep(b.steps[id], toneAt(c, id, now));
      if (force || b.lastTone[id] !== k) { b.lastTone[id] = k; b.blocks[id].style.background = PALETTE[k]; }
    }
    if (prev === null) {
      const faces = facesAt(c, now);
      for (const id in b.tileById) { const m = b.tileById[id]; if (force || m.io.face !== faces[id] || m.io.flip !== -1) setTile(m, faces[id], 'set'); }
      return;
    }
    const wrapped = now < prev;
    for (const cue of c.tiles) {
      const crossed = wrapped ? cue.at > prev || cue.at <= now : cue.at > prev && cue.at <= now;
      if (!crossed) continue;
      const m = b.tileById[cue.tile];
      if (!m) continue;
      const late = (now - cue.at + c.cycleMs) % c.cycleMs;
      setTile(m, cue.face, late < 2 * TICK ? cue.mode : 'set');   // after a stall, land the face instead of a stale flip
    }
  }

  function advance(dt: number): void {
    const prev = t;
    t = (t + dt) % b.choreo.cycleMs;
    apply(t, prev);
    // display rate only while a block is in flight
    const need = moving(b.choreo, t);
    if (need && !frameSub && tickSub) { frameSub = { kind: 'frame', onFrame: (_n, d) => advance(d) }; clock.add(frameSub); }
    else if (!need && frameSub) { clock.remove(frameSub); frameSub = null; }
  }

  function startDriver(): void {
    if (tickSub || motion.reduced || !b) return;
    apply(t, null, true);
    tickSub = { kind: 'tick', onTick: () => { if (!frameSub) advance(TICK); } };
    clock.add(tickSub);
    if (moving(b.choreo, t)) { frameSub = { kind: 'frame', onFrame: (_n, d) => advance(d) }; clock.add(frameSub); }
  }
  function stopDriver(): void {
    if (tickSub) { clock.remove(tickSub); tickSub = null; }
    if (frameSub) { clock.remove(frameSub); frameSub = null; }
  }
  function syncPlay(): void {
    if (wantPlay && visible && !introPending && !motion.reduced && !destroyed) startDriver(); else stopDriver();
  }

  /* ------------------------------------------------------------------ intro */
  function enterOffset(x: Built, id: string): [number, number] {
    const lg = x.name !== 'stacked';
    const s = x.side[id];
    if (lg) return [s === 'l' ? -x.M : x.M, 0];
    const rows = s === 'l' ? x.layout.left.length : x.layout.right.length - 1;
    return [0, rows * x.M];                                      // stacked: the whole stack starts under the floor (B6)
  }
  function visibleIds(x: Built): string[] { return Object.keys(x.blocks).filter((id) => id !== 'Rr'); }

  function prepareEnter(x: Built): void {
    for (const id of visibleIds(x)) {
      const [dx, dy] = enterOffset(x, id);
      x.blocks[id].style.transform = `translate(${dx}px, ${x.restY[id] + dy}px)`;
    }
    x.lastOff = null;
    x.floor.forEach((f) => { f.style.transform = `translate(0px, ${Number(f.dataset.h) || 64}px)`; });
  }

  function dotsIn(x: Built): void {
    // B6: the dots fade (300 ms CSS transition). Add the class on the next frame so the transition always runs.
    const go = () => x.dots.forEach((d) => d.classList.add('in'));
    if (motion.reduced || typeof requestAnimationFrame !== 'function') go();
    else requestAnimationFrame(() => requestAnimationFrame(go));
  }

  /** Land the current build at rest and start the shuffle (B2: always on the CURRENT build). */
  function finish(): void {
    if (!b) return;
    if (motion.reduced) { poster(); introPending = false; if (autoplay) wantPlay = true; return; }
    b.enter?.pause();
    b.enter = null;
    b.floor.forEach((f) => { f.style.transform = ''; });
    apply(t, null, true);
    dotsIn(b);
    introPending = false;
    if (autoplay) wantPlay = true;
    syncPlay();
  }

  function runIntro(x: Built): Promise<void> {
    const specs: TweenSpec[] = [];
    const lg = x.name !== 'stacked';
    for (const id of visibleIds(x)) {
      const [dx, dy] = enterOffset(x, id);
      const row = x.layout[x.side[id] === 'l' ? 'left' : 'right'].find((d) => d.id === id)!.rowFromFloor;
      const at = lg ? row * INTRO_STAGGER : (x.side[id] === 'l' ? 0 : INTRO_STAGGER);
      const el = x.blocks[id], y0 = x.restY[id];
      specs.push(lg
        ? { at, ms: INTRO_MS, from: dx, to: 0, ease: ease.power4Out, quantize: 4, onUpdate: (v) => { el.style.transform = `translate(${v}px, ${y0}px)`; } }
        : { at, ms: INTRO_MS, from: dy, to: 0, ease: ease.power4Out, quantize: 4, onUpdate: (v) => { el.style.transform = `translate(0px, ${y0 + v}px)`; } });
    }
    for (const f of x.floor) {
      const h = Number(f.dataset.h) || 64;
      specs.push({ at: 2 * INTRO_STAGGER, ms: INTRO_MS, from: h, to: 0, ease: ease.power4Out, quantize: 4, onUpdate: (v) => { f.style.transform = `translate(0px, ${v}px)`; } });
    }
    return new Promise<void>((resolve) => {
      const seq = sequence(specs, { loop: false, yoyo: false, onComplete: () => { if (b === x && introPending) finish(); setTimeout(resolve, 300); } });
      x.enter = seq;
      seq.play();
    });
  }

  /* ------------------------------------------------------------------ teardown */
  function teardown(): void {
    if (!b) return;
    stopDriver();
    b.enter?.pause();
    b.ro?.disconnect();
    b.tiles.forEach((m) => m?.destroy());
    b.riders.forEach((m) => m?.destroy());
    b.left.destroy();
    b.right.destroy();
    root.replaceChildren();
  }

  /** The poster: blocks at rest, normal tones, ✓ on the visible tiles, dots and sprites in place. */
  function poster(): void {
    if (!b) return;
    stopDriver();
    b.enter?.pause();
    b.enter = null;
    b.floor.forEach((f) => { f.style.transform = ''; });
    b.lastOff = 0;
    for (const id in b.blocks) { b.blocks[id].style.transform = `translate(0px, ${b.restY[id]}px)`; b.blocks[id].style.background = PALETTE[b.steps[id]]; b.lastTone[id] = b.steps[id]; }
    for (const id in b.tileById) setTile(b.tileById[id], b.choreo.poster[id], 'set');
    b.dots.forEach((d) => d.classList.add('in'));
  }

  b = build(introPending);
  if (motion.reduced) { poster(); introPending = false; }
  else if (!introPending) { apply(t, null, true); dotsIn(b); }

  const unobserve = observe(root, {
    play: () => { visible = true; syncPlay(); },
    stop: () => { visible = false; syncPlay(); },
  });
  const unmotion = motion.onChange((reduced) => {
    if (!b) return;
    if (reduced) { poster(); introPending = false; if (autoplay) wantPlay = true; }
    else { apply(t, null, true); syncPlay(); }
  });

  let resizeTimer = 0;
  let lastW = root.clientWidth;
  const ro = !forced && typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => {
      if (destroyed || root.clientWidth === lastW) return;   // heights never matter: the rails are anchored to the floor
      lastW = root.clientWidth;
      if (heroLayoutFor(vw()) === b.name) return;
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => api.rebuild(), 120);
    })
    : null;
  ro?.observe(root);

  const api: HeroStage = {
    root,
    get layoutName() { return b.name; },
    get bp() { return b.name; },
    get layout() { return b.layout; },
    get module() { return b.M; },
    get choreo() { return b.choreo; },
    get stage() { return b.left; },
    get stages() { return { left: b.left, right: b.right }; },
    get blocks() { return b.blocks; },
    get tiles() { return b.tiles; },
    get riders() { return b.riders; },
    get dots() { return b.dots; },
    get time() { return t; },
    get cycleMs() { return b.choreo.cycleMs; },
    get playing() { return tickSub !== null; },
    intro(): Promise<void> {
      if (!introPending || motion.reduced || destroyed) { finish(); return Promise.resolve(); }
      if (b.enter) return new Promise((r) => setTimeout(r, INTRO_MS + 3 * INTRO_STAGGER + 300));
      return runIntro(b);
    },
    finish,
    play() { wantPlay = true; if (introPending) finish(); else syncPlay(); },
    pause() { wantPlay = false; syncPlay(); },
    seek(ms: number) { t = ((ms % b.choreo.cycleMs) + b.choreo.cycleMs) % b.choreo.cycleMs; if (!introPending && !motion.reduced) apply(t, null, true); },
    setStatic() { wantPlay = false; introPending = false; poster(); },
    rebuild() {
      if (destroyed) return;
      const wasIntro = introPending, running = !!b.enter;
      teardown();
      // B2: a rebuild before the intro keeps it pending; during the intro it lands at rest and the shuffle starts
      b = build(wasIntro && !running);
      if (motion.reduced) { poster(); return; }
      if (wasIntro && running) finish();
      else if (!introPending) { apply(t, null, true); dotsIn(b); syncPlay(); }
    },
    destroy() {
      destroyed = true;
      clearTimeout(resizeTimer);
      ro?.disconnect();
      unobserve(); unmotion();
      teardown();
      root.classList.remove('bands-hero');
    },
  };
  return api;
}

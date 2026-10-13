// card 15 · the hero block stage: layout + riders + diamond + registration dots + the entangled yoyo choreography,
// with visibility pausing, reduced motion, resize rebuilds and the intro slide-in. Built on engine/blocks.ts.

import {
  BAND, hasPiece, getPiece, motion, mount, mountAll, observe, sizeOf, stage, tween, ease,
  type ChoreoStep, type Mounted, type Sequence, type Stage,
} from '../../engine';
import { breakpointFor, heroChoreo, heroLayout, HOLD_MS, type Breakpoint, type HeroLayout, type HeroRiderIds } from './layouts';
import { ensureStyles } from './styles';

export interface HeroStageOpts {
  /** Force a breakpoint; default from `innerWidth` (design §3.1). */
  bp?: Breakpoint;
  /** Override rider piece ids (missing pieces fall back to `placeholder`). */
  riders?: Partial<HeroRiderIds>;
  /** Start the idle choreography as soon as the stage is visible (default true). With `intro: true` it starts after `intro()`. */
  autoplay?: boolean;
  /** Prepare the intro: blocks start outside the stage and slide in when `intro()` is called (default false). */
  intro?: boolean;
  /** Stage width to lay out for; default `root.clientWidth` (re-measured on resize). */
  width?: number;
}

export interface HeroStage {
  readonly root: HTMLElement;
  readonly bp: Breakpoint;
  readonly stage: Stage;
  readonly layout: HeroLayout;
  readonly choreo: ChoreoStep[];
  /** The idle yoyo sequence (forward, hold 1 s, reverse, hold 1 s). */
  readonly seq: Sequence;
  readonly dots: HTMLElement[];
  readonly riders: Mounted[];
  readonly diamond: Mounted | null;
  /** Plays the slide-in (rails from the sides, floor blocks from below, 700 ms power4Out, stagger 100 ms; dots fade last).
   *  Resolves when done; the idle choreography then starts if `autoplay`. Under reduced motion: static, resolves at once. */
  intro(): Promise<void>;
  play(): void;
  pause(): void;
  /** Reduced motion / teardown: the initial layout, nothing moving. */
  setStatic(): void;
  /** Re-measure and rebuild (called automatically on resize), keeping the choreography's time and direction. */
  rebuild(): void;
  destroy(): void;
}

/** Resolve a rider piece: the real piece if registered, else the placeholder in the closest variant. */
export function resolveRider(piece: string, variant: string | undefined, size: [number, number]): { piece: string; variant?: string; size: [number, number] } {
  if (hasPiece(piece)) return { piece, variant, size: sizeOf(getPiece(piece), variant) };
  const v = size[0] >= 2 * size[1] ? 'wide' : size[0] <= 8 ? 'sm' : undefined;
  return { piece: 'placeholder', variant: v, size: sizeOf(getPiece('placeholder'), v) };
}

export function heroStage(root: HTMLElement, opts: HeroStageOpts = {}): HeroStage {
  ensureStyles();
  const autoplay = opts.autoplay !== false;
  let built: Built | null = null;
  let wantPlay = autoplay && !opts.intro;
  let visible = false;
  let introPending = !!opts.intro;
  let destroyed = false;
  let resizeTimer = 0;

  interface Built {
    bp: Breakpoint; st: Stage; layout: HeroLayout; choreo: ChoreoStep[]; seq: Sequence; enter: Sequence | null;
    dots: HTMLElement[]; riders: Mounted[]; diamond: Mounted | null; floor: HTMLElement[]; width: number; height: number;
  }

  const measure = () => ({ width: opts.width ?? root.clientWidth, height: root.clientHeight });

  function build(prepareIntro: boolean): Built {
    const { width, height } = measure();
    const bp = opts.bp ?? breakpointFor(typeof innerWidth === 'number' ? innerWidth : width);
    const layout = heroLayout(bp, width, { riders: opts.riders });
    // substitute missing rider pieces (sections never wait for art) and keep the stand-in centred
    for (const b of layout.blocks) {
      if (!b.rider) continue;
      const r = resolveRider(b.rider.piece, b.rider.variant, layout.riderSizes[b.id] ?? [16, 16]);
      b.rider = { ...b.rider, piece: r.piece, variant: r.variant, dx: Math.round((layout.module / 4 - r.size[0]) / 2) };
    }
    root.replaceChildren();
    const st = stage(root, layout);
    root.classList.add('bands-hero');
    root.dataset.bp = bp;

    // the diamond: swap the static canvas for the pulsing `diamond` piece at B = 8
    let diamond: Mounted | null = null;
    const dEl = st.get('D').el;
    const canvas = dEl.querySelector('canvas');
    if (canvas) {
      const span = document.createElement('span');
      span.className = 'px bands-diamond';
      span.style.display = 'block';
      span.style.margin = canvas.style.margin;
      canvas.replaceWith(span);
      diamond = mount(span, 'diamond', { unit: BAND, variant: layout.diamondVariant, decorative: true });
    }

    // sprites standing on the floor beside the blocks (md/sm pair); with an intro pending they start below the floor
    const floor: HTMLElement[] = [];
    for (const f of layout.floorRiders) {
      const r = resolveRider(f.piece, f.variant, f.size);
      const el = document.createElement('span');
      el.className = 'px bands-floor';
      el.dataset.piece = r.piece;
      if (r.variant) el.dataset.variant = r.variant;
      el.dataset.decorative = '';
      el.dataset.floorRider = f.id;
      el.dataset.h = String(r.size[1] * 4);
      el.style.left = `${f.x}px`;
      if (prepareIntro && !motion.reduced) el.style.transform = `translate(0px, ${r.size[1] * 4}px)`;
      root.appendChild(el);
      floor.push(el);
    }
    const riders = mountAll(root);

    // registration dots: 4×4 ink squares centred on the rail line at the stack top; children of the top block so they ride it
    const dots: HTMLElement[] = [];
    for (const d of layout.dots) {
      const i = document.createElement('i');
      i.className = `bands-dot bands-dot--${d.corner}`;
      st.get(d.block).el.appendChild(i);
      dots.push(i);
    }
    if (!prepareIntro || motion.reduced) dots.forEach((d) => d.classList.add('in'));

    const choreo = heroChoreo(bp);
    const seq = st.choreo(choreo, { yoyo: true, hold: HOLD_MS });
    const enter = prepareIntro && !motion.reduced ? st.enter({ railCols: [0, layout.rightCol] }) : null;
    return { bp, st, layout, choreo, seq, enter, dots, riders, diamond, floor, width, height };
  }

  function teardown(): void {
    if (!built) return;
    built.seq.pause();
    built.enter?.pause();
    built.riders.forEach((m) => m.destroy());
    built.diamond?.destroy();
    built.st.destroy();
    built = null;
  }

  function syncPlay(): void {
    if (!built) return;
    if (motion.reduced) { built.seq.pause(); return; }
    if (wantPlay && visible) built.seq.play(); else built.seq.pause();
  }

  /** Everything at rest: dots shown, floor sprites on the floor. */
  function settle(b: Built): void {
    b.dots.forEach((d) => d.classList.add('in'));
    b.floor.forEach((f) => { f.style.transform = ''; });
  }

  built = build(introPending);
  if (motion.reduced) built.st.setStatic();

  const unobserve = observe(root, {
    play: () => { visible = true; syncPlay(); },
    stop: () => { visible = false; syncPlay(); },
  });
  const unmotion = motion.onChange((reduced) => {
    if (!built) return;
    if (reduced) { built.seq.pause(); built.enter?.pause(); built.st.setStatic(); settle(built); }
    else syncPlay();
  });

  const api: HeroStage = {
    root,
    get bp() { return built!.bp; },
    get stage() { return built!.st; },
    get layout() { return built!.layout; },
    get choreo() { return built!.choreo; },
    get seq() { return built!.seq; },
    get dots() { return built!.dots; },
    get riders() { return built!.riders; },
    get diamond() { return built!.diamond; },
    intro(): Promise<void> {
      const b = built!;
      const finish = () => { settle(b); introPending = false; if (autoplay) { wantPlay = true; syncPlay(); } };
      if (!b.enter || motion.reduced) { finish(); return Promise.resolve(); }
      return new Promise<void>((resolve) => {
        b.enter!.play();
        // floor sprites rise from below the floor with the floor blocks (700 ms power4Out, quantised to 4 px)
        b.floor.forEach((f) => {
          const h = Number(f.dataset.h) || 48;
          tween({ from: h, to: 0, ms: 700, ease: ease.power4Out, quantize: 4, onUpdate: (v) => { f.style.transform = `translate(0px, ${v}px)`; } });
        });
        setTimeout(() => { if (built === b) finish(); setTimeout(resolve, 300); }, b.enter!.duration);
      });
    },
    play() { wantPlay = true; introPending = false; syncPlay(); },
    pause() { wantPlay = false; syncPlay(); },
    setStatic() { if (!built) return; wantPlay = false; built.seq.stop(); built.enter?.stop(); built.st.setStatic(); settle(built); },
    rebuild() {
      if (!built || destroyed) return;
      const t = built.seq.time, dir = built.seq.direction;
      const introWas = introPending && !!built.enter && built.enter.time === 0;
      teardown();
      built = build(introWas);
      built.seq.seek(t);
      if (dir === -1) built.seq.reverse();
      if (motion.reduced) built.st.setStatic();
      else syncPlay();
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

  // resize: positions are baked into the tweens, so rebuild (debounced) when the stage size changes
  const ro = typeof ResizeObserver === 'function'
    ? new ResizeObserver(() => {
      if (!built) return;
      const { width, height } = measure();
      if (width === built.width && height === built.height) return;
      built.seq.pause();
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => api.rebuild(), 120);
    })
    : null;
  ro?.observe(root);

  return api;
}

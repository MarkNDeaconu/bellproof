// Small DOM effects shared by sections: reveal on enter, typewriter, count-up, dissolve swap, scroll progress.
// engine-spec §11. All honour reduced motion.

import { clock, TICK_MS } from './clock';
import { motion, observe } from './visibility';
import type { Mounted } from './mount';
import { mount } from './mount';
import type { PieceIO } from './piece';

/** IO-driven `.in` class on every `[data-reveal]` under root; CSS does the 500ms rise. */
export function reveal(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el, i) => {
    if (motion.reduced) { el.classList.add('in'); return; }
    el.style.setProperty('--reveal-delay', `${(Number(el.dataset.reveal) || (i % 6)) * 60}ms`);
    // integrator R2 (queue #17): observe() calls play() synchronously when the element is already observed and visible,
    // i.e. before `un` exists (a TDZ ReferenceError). Declare first; unobserve after the call if it already fired.
    let done = false;
    let un: (() => void) | null = null;
    un = observe(el, { play: () => { if (done) return; done = true; el.classList.add('in'); un?.(); }, stop: () => {} });
    if (done) un();
  });
}

export interface TypewriterOpts { msPerChar?: number; cursor?: boolean; holdMs?: number; onDone?(): void }

/** Types `text` into el character by character, then holds and blinks a block cursor (CSS, 3 cycles).
 *  Accessible text: a visually hidden full copy; the typed span is aria-hidden (revision 1, E2 / a11y #8).
 *  The frame subscriber ends when typing ends, so an idle page costs no rAF. */
export function typewriter(el: HTMLElement, text: string, opts: TypewriterOpts = {}): { stop(): void } {
  const msPerChar = opts.msPerChar ?? 40;
  const full = document.createElement('span');
  full.className = 'vh';
  full.textContent = text;
  const typed = document.createElement('span');
  typed.className = 'typed';
  typed.setAttribute('aria-hidden', 'true');
  const textNode = document.createTextNode('');
  typed.appendChild(textNode);
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  cursor.setAttribute('aria-hidden', 'true');
  el.replaceChildren(full, typed);
  if (opts.cursor !== false) typed.appendChild(cursor);
  el.removeAttribute('aria-label');
  cursor.style.setProperty('--hold', `${opts.holdMs ?? 2000}ms`);
  if (motion.reduced) { textNode.data = text; cursor.classList.add('static'); opts.onDone?.(); return { stop() {} }; }
  let elapsed = 0, shown = 0;
  const un = clock.add({
    kind: 'frame',
    onFrame(_n, dt) {
      elapsed += dt;
      const n = Math.min(text.length, Math.floor(elapsed / msPerChar));
      if (n !== shown) { shown = n; textNode.data = text.slice(0, n); }
      if (n >= text.length) { un(); cursor.classList.add('blink'); opts.onDone?.(); }
    },
  });
  return { stop: un };
}

export interface CountOpts { ms?: number; format?(v: number): string; decimals?: number }

/** Counts el's number from 0 to `to` once when it enters the viewport. */
export function countUp(el: HTMLElement, to: number, opts: CountOpts = {}): void {
  const fmt = opts.format ?? ((v: number) => v.toFixed(opts.decimals ?? 0));
  if (motion.reduced) { el.textContent = fmt(to); return; }
  let started = false;
  let un: (() => void) | null = null;   // integrator R2 (queue #17): declared before observe() may call play() synchronously
  un = observe(el, {
    play: () => {
      if (started) return;
      started = true;
      un?.();
      let elapsed = 0;
      const ms = opts.ms ?? 600;
      const unsub = clock.add({ kind: 'frame', onFrame(_n, dt) {
        elapsed += dt;
        const t = Math.min(1, elapsed / ms);
        el.textContent = fmt(to * (1 - Math.pow(1 - t, 3)));
        if (t >= 1) { el.textContent = fmt(to); unsub(); }
      } });
    },
    stop: () => {},
  });
  if (started) un();
}

/* ---- ordered-dither dissolve at the DOM level (integrator, queue #1; approach from sections-2's clients.ts) ----
   The incoming sprite is masked with a 4×4 Bayer pattern whose cells are one art pixel (4 CSS px, aligned to the sprite's
   own grid) and the outgoing one with the exact complement, so on every tick each art pixel shows exactly one sprite:
   4/16 → 8/16 → 12/16 → all. The incoming element is masked BEFORE it is attached (no unclipped first tick). */
const BAYER_ROWS = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function bayerMask(level: number, invert: boolean): string {
  let rects = '';
  BAYER_ROWS.forEach((row, y) => row.forEach((v, x) => { if ((v < level * 4) !== invert) rects += `<rect x='${x}' y='${y}' width='1' height='1'/>`; }));
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 4 4' shape-rendering='crispEdges'>${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
const MASKS = [0, 1, 2, 3].map((l) => ({ in: bayerMask(l, false), out: bayerMask(l, true) }));
function setMask(el: HTMLElement, img: string | null): void {
  for (const pre of ['', '-webkit-']) {
    el.style.setProperty(`${pre}mask-image`, img ?? '');
    el.style.setProperty(`${pre}mask-size`, img ? '16px 16px' : '');
    el.style.setProperty(`${pre}mask-repeat`, img ? 'repeat' : '');
  }
}

/** Swap the piece in a container with a 4-step ordered-dither dissolve (4 ticks). Returns the new mount.
 *  The new mount is observed like any other (it plays only while on screen). */
export function dissolveTo(container: HTMLElement, fromMount: Mounted | null, toId: string, opts: { variant?: string; inputs?: Partial<PieceIO> } = {}): Promise<Mounted> {
  return new Promise((resolve) => {
    const next = document.createElement('span');
    next.className = 'px px--over';
    const animate = !motion.reduced && !!fromMount;
    if (animate) setMask(next, MASKS[0].in);          // fully hidden before the first paint
    container.appendChild(next);
    const m = mount(next, toId, { variant: opts.variant, inputs: opts.inputs });
    const finish = () => { setMask(next, null); fromMount?.destroy(); fromMount?.el.remove(); next.classList.remove('px--over'); resolve(m); };
    if (!animate) { finish(); return; }
    let step = 0;
    const un = clock.add({ kind: 'tick', onTick() {
      step++;
      if (step >= 4) { un(); finish(); return; }
      setMask(next, MASKS[step].in);
      setMask(fromMount!.el, MASKS[step].out);
    } });
  });
}

/** 0..1 progress of an element through the viewport: 0 when its top reaches the viewport bottom, 1 when its bottom reaches the top. */
export function scrollProgress(el: Element): number {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const total = r.height + vh;
  return Math.min(1, Math.max(0, (vh - r.top) / total));
}

/** Calls fn(progress) every frame while el is near the viewport. Reduced motion: fn(1) once. */
export function onScrollProgress(el: Element, fn: (p: number) => void): () => void {
  if (motion.reduced) { fn(1); return () => {}; }
  let unsub: (() => void) | null = null;
  let last = -1;
  const un = observe(el, {
    play() { unsub ??= clock.add({ kind: 'frame', onFrame() { const p = scrollProgress(el); if (p !== last) { last = p; fn(p); } } }); },
    stop() { unsub?.(); unsub = null; },
  });
  return () => { un(); unsub?.(); };
}

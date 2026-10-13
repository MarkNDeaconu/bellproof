// Visibility (IntersectionObserver + Page Visibility) and motion preference. engine-spec §7.
// revision 1 (E4, E10): several observers may share one element (a Set per element, per-registration disposers);
// a user "pause motion" switch persists in localStorage and behaves exactly like prefers-reduced-motion.

import { clock } from './clock';

export interface Visible { play(): void; stop(): void }

const targets = new Map<Element, Set<Visible>>();
let io: IntersectionObserver | null = null;

function observer(): IntersectionObserver | null {
  if (io || typeof IntersectionObserver !== 'function') return io;
  io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const set = targets.get(e.target);
      if (!set) continue;
      for (const v of [...set]) { if (e.isIntersecting) v.play(); else v.stop(); }
    }
  }, { rootMargin: '200px 0px', threshold: 0 });
  return io;
}

/** Observe an element: `play()` while on screen (±200px), `stop()` otherwise. Returns unobserve for THIS registration. */
export function observe(el: Element, v: Visible): () => void {
  let set = targets.get(el);
  const first = !set;
  if (!set) { set = new Set(); targets.set(el, set); }
  set.add(v);
  const o = observer();
  if (!o) v.play();
  else if (first) o.observe(el);
  else {
    // the element is already observed: give the newcomer the current state synchronously
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    if (r.bottom >= -200 && r.top <= vh + 200) v.play();
  }
  return () => {
    const s = targets.get(el);
    if (!s) return;
    s.delete(v);
    v.stop();
    if (!s.size) { targets.delete(el); o?.unobserve(el); }
  };
}

/** How many registrations watch this element (QA / debugging). */
export function observers(el: Element): number { return targets.get(el)?.size ?? 0; }

// ---- page visibility --------------------------------------------------------------------------
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => { if (document.hidden) clock.pause(); else clock.resume(); });
}

// ---- reduced motion + user pause --------------------------------------------------------------
type MotionListener = (reduced: boolean) => void;
const motionListeners = new Set<MotionListener>();
const STORAGE_KEY = 'bp-motion';
let forced: boolean | null = null;
let userPaused = false;
const motionMq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

function readStored(): boolean {
  try { return typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY) === 'paused'; } catch { return false; }
}
function writeStored(paused: boolean): void {
  try { if (typeof localStorage !== 'undefined') { if (paused) localStorage.setItem(STORAGE_KEY, 'paused'); else localStorage.removeItem(STORAGE_KEY); } } catch { /* private mode */ }
}

function apply(): void {
  const r = motion.reduced;
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.motion = r ? 'reduced' : 'full';
    document.documentElement.classList.toggle('is-motion-paused', userPaused);
  }
  motionListeners.forEach((fn) => fn(r));
}
motionMq?.addEventListener('change', apply);

export const motion = {
  /** True when motion must not play: OS preference, the user's pause switch, or a harness override. */
  get reduced(): boolean { return forced ?? (userPaused || !!motionMq?.matches); },
  /** The OS preference alone. */
  get prefersReduced(): boolean { return !!motionMq?.matches; },
  /** The user's on-page pause switch (persisted). */
  get paused(): boolean { return userPaused; },
  setPaused(value: boolean): void { userPaused = value; writeStored(value); apply(); },
  toggle(): boolean { motion.setPaused(!userPaused); return userPaused; },
  /** Harness/test override; pass null to return to the preference + switch. */
  force(value: boolean | null): void { forced = value; apply(); },
  onChange(fn: MotionListener): () => void { motionListeners.add(fn); return () => { motionListeners.delete(fn); }; },
  /** Call once at boot, before any mount: reads the persisted switch and applies the data attribute. */
  init(): void { userPaused = readStored(); apply(); },
};

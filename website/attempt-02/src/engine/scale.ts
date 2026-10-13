// Integer scaling with DPR handling. engine-spec §6.

export const UNIT = 4;   // CSS px per art px, everywhere
export const BAND = 8;   // CSS px per band px (blocks, diamonds, strata)

export function dpr(): number { return (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1; }

/** Device pixels per art pixel: an integer, so backing-store pixels map 1:1 to device pixels. */
export function devicePerArt(unit = UNIT): number { return Math.max(1, Math.round(unit * dpr())); }

/** Size a canvas so one art pixel is exactly `devicePerArt()` device pixels, and disable smoothing. */
export function fit(canvas: HTMLCanvasElement, w: number, h: number, unit = UNIT): CanvasRenderingContext2D {
  const dpa = devicePerArt(unit);
  const d = dpr();
  canvas.width = w * dpa;
  canvas.height = h * dpa;
  canvas.style.width = `${(w * dpa) / d}px`;
  canvas.style.height = `${(h * dpa) / d}px`;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) throw new Error('2d context unavailable');
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/** The only way to move a pixel container: whole art units. */
export function moveUnits(el: HTMLElement, ux: number, uy: number, unit = UNIT): void {
  el.style.transform = `translate(${Math.round(ux) * unit}px, ${Math.round(uy) * unit}px)`;
}

const dprListeners = new Set<() => void>();
let mq: MediaQueryList | null = null;

function watch(): void {
  if (typeof matchMedia !== 'function') return;
  mq?.removeEventListener('change', onChange);
  mq = matchMedia(`(resolution: ${dpr()}dppx)`);
  mq.addEventListener('change', onChange, { once: true });
}
function onChange(): void { dprListeners.forEach((fn) => fn()); watch(); }

/** Called when the device pixel ratio changes (zoom, moving windows between screens). */
export function onDprChange(fn: () => void): () => void {
  dprListeners.add(fn);
  if (dprListeners.size === 1) watch();
  return () => { dprListeners.delete(fn); };
}

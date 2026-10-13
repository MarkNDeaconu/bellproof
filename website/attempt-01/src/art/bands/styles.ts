// card 15 · the few styles the bands helpers need, injected once from JS (no CSS import, so the Node scripts
// can import this folder). Colours/positions only; the engine's .block/.strata/.staircase rules stay in engine.css.

const CSS = `
.bands-dot { position: absolute; width: 4px; height: 4px; background: var(--ink, #0E1424); opacity: 0; transition: opacity .3s linear; pointer-events: none; }
.bands-dot--tr { top: -2px; right: -2px; }
.bands-dot--tl { top: -2px; left: -2px; }
.bands-dot.in { opacity: 1; }
:root[data-motion="reduced"] .bands-dot { opacity: 1; transition: none; }
.bands-diamond { display: block; }
.bands-floor { position: absolute; bottom: 0; will-change: transform; }
.bands-gridlines { position: absolute; inset: 0; pointer-events: none;
  background-image: linear-gradient(to bottom, rgba(14,20,36,.10) 1px, transparent 1px); background-size: 100% 80px; }
.bands-gridlines > i { position: absolute; top: 0; bottom: 0; width: 1px; background: rgba(14,20,36,.10); }
.bands-walker { position: absolute; will-change: transform; }
`;

let done = false;
export function ensureStyles(): void {
  if (done || typeof document === 'undefined') return;
  done = true;
  const s = document.createElement('style');
  s.id = 'bands-styles';
  s.textContent = CSS;
  document.head.appendChild(s);
}

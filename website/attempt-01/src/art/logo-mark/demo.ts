// QA demo for the logo-mark (built only by qa.vite.config.ts; never part of the site).
// Query: ?ring=<ms> rings the 20× samples and the footer mark <ms> after load (footer auto-ring is then off)
//        ?auto=<ms> scrolls to the page bottom over <ms> (default 1500) starting 800 ms after load
//        ?rm=1 forces reduced motion
import '../../engine/engine.css';
import { motion } from '../../engine/visibility';
import { applyRingFrame, footerMark, footerReveal, markElement, navMark, ring, ringState } from './index';
import { bellPath } from './bell';

const q = new URLSearchParams(location.search);
if (q.get('rm') === '1') motion.force(true);
motion.init();

const $ = (id: string) => document.getElementById(id) as HTMLElement;

// nav lockups
const logo = $('nav-logo');
logo.append(navMark(), document.createTextNode('Bellproof'));
$('nav-sm').append(navMark());

// scales
for (const id of ['scales-paper', 'scales-ink']) for (const s of [2, 4, 8, 20]) $(id).append(markElement({ scale: s }));

// favicon: the shipped file and an inline twin, at 16/32/48, then zoomed ×4
const favData = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges"><style>path{fill:#0E1424}@media(prefers-color-scheme:dark){path{fill:#F4F2ED}}</style><path d="${bellPath(2, 4, 6)}"/></svg>`,
)}`;
for (const [id, src] of [['fav-light', '../../../favicon.svg'], ['fav-dark', favData]] as const) {
  for (const s of [16, 32, 48]) { const img = new Image(s, s); img.src = src; img.alt = ''; $(id).append(img); }
  for (const s of [16, 32]) { const img = new Image(s * 4, s * 4); img.src = src; img.alt = ''; img.className = 'zoom'; img.style.width = `${s * 4}px`; $(id).append(img); }
}

// ring samples
const ringPaper = markElement({ scale: 20 });
const ringInk = markElement({ scale: 20 });
$('ring-paper').append(ringPaper);
$('ring-ink').append(ringInk);
$('ring-btn').addEventListener('click', () => { void ring(ringPaper); void ring(ringInk); });

// footer
const giant = footerMark();
$('giant').append(giant);
const manual = q.has('ring');
const handle = footerReveal({ mark: giant, trigger: $('subfooter'), ringOnce: !manual, onRing: () => console.info('[logo-mark] rang') });

if (manual) {
  setTimeout(() => { void ring(ringPaper); void ring(ringInk); void handle.ring(); }, Number(q.get('ring')) || 1500);
}
if (q.has('auto')) {
  const ms = Number(q.get('auto')) || 1500;
  setTimeout(() => {
    const from = window.scrollY, to = document.documentElement.scrollHeight - window.innerHeight;
    const t0 = performance.now();
    const stepFn = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      window.scrollTo(0, from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(stepFn);
    };
    requestAnimationFrame(stepFn);
  }, 800);
}

declare global { interface Window { __lm: Record<string, unknown> } }
window.__lm = { ring, handle, giant, ringPaper, ringInk, motion, applyRingFrame, ringState };

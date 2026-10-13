// Page entry. Boots the engine, fills strings, then hands each section to its module.
// revision 1 (E5): the nav and the hero mount synchronously; every other section mounts when it comes within 800 px of
// the viewport (or in idle time, in page order, as a fallback), so the boot task stays short on slow devices.
// Skeleton placeholders are never mounted: each section's hydrate() mounts its own pieces.

import './engine/engine.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/type.css';
import './styles/grid.css';
import './styles/components.css';
import './art/registry';
import { allMounts, clock, hydrateIcons, motion, mountAll, reveal } from './engine';
import { fillStrings } from './content/fill';
import { strings } from './content/strings';
import { prepareIcons } from './sections/nav';

// Section CSS (src/styles/sections/<id>.css) is picked up automatically, after the shared layers above.
import.meta.glob('./styles/sections/*.css', { eager: true });

export interface SectionCtx { strings: typeof strings; motion: typeof motion; clock: typeof clock }
export interface SectionModule { mount(root: HTMLElement, ctx: SectionCtx): void }

// Every src/sections/<id>.ts that exists, mounted on the element with that id, in page order.
const found = import.meta.glob<SectionModule>('./sections/*.ts', { eager: true });
const ORDER = ['nav', 'top', 'trust', 'flip', 'cost', 'layer', 'clients', 'flow', 'verify', 'guarantees', 'cta', 'footer'] as const;
const EAGER = new Set(['nav', 'top']);
const SECTIONS: Record<string, () => Promise<SectionModule>> = Object.fromEntries(
  ORDER.filter((id) => found[`./sections/${id}.ts`]).map((id) => [id, () => Promise.resolve(found[`./sections/${id}.ts`])]),
);

declare global { interface Window { __bp: Record<string, unknown> } }

motion.init();                      // reads the persisted pause switch before anything mounts
fillStrings(document);
mountAll(document, { skipPlaceholders: true });
prepareIcons(document);
hydrateIcons(document);
reveal(document);

const ctx: SectionCtx = { strings, motion, clock };
const mounted = new Set<string>();
function mountSection(id: string): void {
  if (mounted.has(id)) return;
  mounted.add(id);
  const root = document.getElementById(id);
  const load = SECTIONS[id];
  if (!root || !load) return;
  load().then((m) => m.mount(root, ctx)).catch((e) => console.error(`[section ${id}]`, e));
}

// eager: nav + hero
for (const id of ORDER) if (EAGER.has(id)) mountSection(id);

// lazy: the rest, when near the viewport; idle time mounts them in order anyway (so anchors, scroll-spy and search work)
const lazy = ORDER.filter((id) => !EAGER.has(id) && SECTIONS[id]);
if (typeof IntersectionObserver === 'function') {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { mountSection((e.target as HTMLElement).id); io.unobserve(e.target); }
  }, { rootMargin: '800px 0px' });
  for (const id of lazy) { const el = document.getElementById(id); if (el) io.observe(el); }
}
let i = 0;
const idle = (cb: () => void) => (typeof requestIdleCallback === 'function' ? requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 120));
const next = () => { if (i < lazy.length) { mountSection(lazy[i++]); idle(next); } };
idle(next);

window.__bp = { clock, motion, mounts: () => allMounts(), mountSection };

// Page entry. Boots the engine, fills strings, mounts every [data-piece], hydrates icons, then hands each section to its module.
// Section modules (src/sections/<id>.ts) are added by the section agents; SECTIONS below lists them in page order (layout-core).

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
// A section file that is not written yet is simply skipped, so the shell stays until it lands.
const found = import.meta.glob<SectionModule>('./sections/*.ts', { eager: true });
const ORDER = ['nav', 'top', 'trust', 'flip', 'cost', 'layer', 'clients', 'flow', 'verify', 'guarantees', 'cta', 'footer'] as const;
const SECTIONS: Record<string, () => Promise<SectionModule>> = Object.fromEntries(
  ORDER.filter((id) => found[`./sections/${id}.ts`]).map((id) => [id, () => Promise.resolve(found[`./sections/${id}.ts`])]),
);

declare global { interface Window { __bp: Record<string, unknown> } }

motion.init();
fillStrings(document);
mountAll(document);
prepareIcons(document);
hydrateIcons(document);
reveal(document);

const ctx: SectionCtx = { strings, motion, clock };
for (const [id, load] of Object.entries(SECTIONS)) {
  const root = document.getElementById(id);
  if (root) load().then((m) => m.mount(root, ctx)).catch((e) => console.error(`[section ${id}]`, e));
}

window.__bp = { clock, motion, mounts: () => allMounts() };

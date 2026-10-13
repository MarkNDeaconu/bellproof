/**
 * `fillStrings(root)`: the engine-spec §11 convention for injecting copy into
 * structure-only HTML. Owner: content agent.
 *
 *   <h2 class="h2" data-str="trust.h2"></h2>
 *   <p data-str="trust.closing"></p>               Rich → <span class="em">…</span>
 *   <h4 data-str="trust.cells.0.title"></h4>       numeric segments index arrays
 *   <a data-str="nav.demo.label" data-str-href="nav.demo.href"></a>
 *   <span data-str-aria="top.h1"></span>           sets aria-label
 *   <p data-str="flip.example.behind.valueHTML"></p>  keys ending in `HTML` are trusted markup → innerHTML
 *
 * Paths may also use brackets: `trust.cells[0].title`.
 * A link whose href is a placeholder gets `data-placeholder` so CSS/JS can treat it.
 */

import { strings, richHTML, isPlaceholder } from './strings';
import type { Rich, Illustrative } from './strings';

/** Resolve a dotted path into `strings`. Returns `undefined` if any segment is missing. */
export function getString(path: string): unknown {
  let node: unknown = strings;
  for (const seg of path.replace(/\[(\d+)\]/g, '.$1').split('.')) {
    if (seg === '') continue;
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[seg];
  }
  return node;
}

function isRich(v: unknown): v is Rich {
  return Array.isArray(v) && v.every((p) => typeof p === 'string' || (typeof p === 'object' && p !== null && 'em' in p));
}

function isIllustrative(v: unknown): v is Illustrative {
  return typeof v === 'object' && v !== null && 'text' in v && 'illustrative' in v;
}

function asText(path: string, v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (isIllustrative(v)) return v.text;
  if (isRich(v)) return v.map((p) => (typeof p === 'string' ? p : p.em)).join('');
  console.warn(`[strings] no text at "${path}"`);
  return undefined;
}

/** Fill every `[data-str]`, `[data-str-href]` and `[data-str-aria]` element under `root`. */
export function fillStrings(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-str]').forEach((el) => {
    const path = el.dataset.str ?? '';
    const v = getString(path);
    if (typeof v === 'string' && path.endsWith('HTML')) el.innerHTML = v; // trusted: authored in strings.ts
    else if (typeof v === 'string') el.textContent = v;
    else if (isIllustrative(v)) el.textContent = v.text;
    else if (isRich(v)) el.innerHTML = richHTML(v);
    else console.warn(`[strings] no text at "${path}"`);
  });
  root.querySelectorAll<HTMLElement>('[data-str-href]').forEach((el) => {
    const path = el.dataset.strHref ?? '';
    const href = asText(path, getString(path));
    if (href === undefined) return;
    el.setAttribute('href', href);
    if (isPlaceholder(href)) el.dataset.placeholder = '';
  });
  root.querySelectorAll<HTMLElement>('[data-str-aria]').forEach((el) => {
    const path = el.dataset.strAria ?? '';
    const label = asText(path, getString(path));
    if (label !== undefined) el.setAttribute('aria-label', label);
  });
}

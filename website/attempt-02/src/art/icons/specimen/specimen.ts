// Icon specimen page (art-icons QA). Every icon at every size (2, 4, 8, 20 px per art px) on paper and
// ink, rendered the way the site renders it: static glyphs through the engine's icon() (inline SVG),
// animated icons through mount() (canvas). Plus a pixel-parity test (SVG raster vs the piece bitmap)
// and the icons in their real contexts with the hover recipes from ../icons.css.

import '../../../engine/engine.css';
import '../../registry';
import '../icons.css';
import { Grid, icon, iconSVG, mount, sizeOf, type Mounted, type Piece } from '../../../engine';
import { ICON_PIECES, STATIC_ICON_IDS, MORPHS, flickerOnce, flipTile, fadeTile, hoverable, morph, type TileFace } from '../index';

const SIZES = [2, 4, 8, 20];
const root = document.getElementById('root')!;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, html = ''): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (html) e.innerHTML = html;
  return e;
};
const section = (title: string): HTMLElement => { const s = el('section'); s.append(el('h2', {}, title)); root.append(s); return s; };

interface Item { piece: Piece; variant?: string; label: string }
const staticItems: Item[] = [];
for (const p of ICON_PIECES.filter((q) => STATIC_ICON_IDS.includes(q.id))) {
  staticItems.push({ piece: p, label: p.id });
  for (const v of Object.keys(p.variants ?? {})) staticItems.push({ piece: p, variant: v, label: `${p.id}:${v}` });
}
const spriteItems: Item[] = ICON_PIECES.filter((q) => !STATIC_ICON_IDS.includes(q.id)).map((p) => ({ piece: p, label: p.id }));

// Integer geometry everywhere (fixed px columns/rows, icons at a 12-px inset) so every icon lands on
// whole CSS pixels and the screenshot parity check compares like with like.
function grid(id: string, groups: Array<{ name: string; cls: string }>, items: Item[], cell: (it: Item, g: number, z: number) => Element): HTMLElement {
  const maxW = Math.max(...items.map((it) => sizeOf(it.piece, it.variant)[0]));
  const colW = SIZES.map((z) => maxW * z + 24);
  const g = el('div', { class: 'sgrid', id });
  g.style.gridTemplateColumns = `200px ${groups.map(() => colW.map((w) => `${w}px`).join(' ')).join(' ')}`;
  g.append(el('div', { class: 'sh' }, 'id'));
  for (const gr of groups) for (const z of SIZES) g.append(el('div', { class: 'sh' }, `${gr.name} ${z}`));
  for (const it of items) {
    const [, h] = sizeOf(it.piece, it.variant);
    const rowH = `${h * 20 + 24}px`;
    const lbl = el('div', { class: 'lbl', 'data-id': it.label }, `${it.label}<br>${sizeOf(it.piece, it.variant).join('×')}`);
    lbl.style.height = rowH;
    g.append(lbl);
    groups.forEach((gr, gi) => SIZES.forEach((z) => {
      const c = el('div', { class: `sc ${gr.cls}`, 'data-id': it.label, 'data-size': String(z) });
      c.style.height = rowH;
      c.append(cell(it, gi, z));
      g.append(c);
    }));
  }
  return g;
}

// ---- A. static glyphs: SVG on paper, canvas twin on paper, SVG on ink ----------------------------
section('A · Static glyphs: icon() SVG on paper · canvas twin · SVG on ink').append(
  grid('glyphs', [{ name: 'SVG paper', cls: 'paper svg' }, { name: 'canvas paper', cls: 'paper cnv' }, { name: 'SVG ink', cls: 'ink svg' }], staticItems, (it, gi, z) => {
    if (gi !== 1) return icon(it.piece.id, { size: z, variant: it.variant });
    const holder = el('span');
    mount(holder, it.piece.id, { variant: it.variant, unit: z, autoplay: false, decorative: true });
    return holder;
  }),
);

// ---- B. animated icons (canvases, live) at every size, paper and ink -------------------------------
section('B · Animated icons (canvas, live) on paper and on ink').append(
  grid('sprites', [{ name: 'paper', cls: 'paper' }, { name: 'ink', cls: 'ink' }], spriteItems, (it, _gi, z) => {
    const holder = el('span');
    mount(holder, it.piece.id, { unit: z, decorative: true });
    return holder;
  }),
);

// ---- C. in context ----------------------------------------------------------------------------
const pieceEl = (id: string, cls = ''): { holder: HTMLElement; m: Mounted } => {
  const holder = el('span', { class: cls });
  const m = mount(holder, id, { decorative: true });
  return { holder, m };
};
{
  const s = section('C · In context (design-spec §4) · hover the buttons, cells and pill');
  const ctx = el('div', { class: 'ctx' });

  const buttons = el('div', {}, `<span class="micro">Buttons (§4.2) · data-hop="step" / "hop" / "out"</span>
    <div class="row">
      <a class="btn primary" data-hop="step" href="#">See how it works ${iconSVG('ui-chevron')}</a>
      <a class="btn outline" data-hop="out" href="#">Watch the demo ${iconSVG('ui-external-sm')}</a>
    </div>
    <div class="row">
      <a class="btn outline" data-hop="hop" href="#" id="hopbtn">See the contracts ${iconSVG('ui-chevron')}</a>
      <a class="text" data-hop="step" href="#">Read the papers ${iconSVG('ui-arrow')}</a>
    </div>`);
  ctx.append(buttons);

  const nav = el('div', {}, `<span class="micro">Nav (§4.1) · play press · menu ⇄ close morph (click)</span>
    <div class="nav"><span>Bellproof</span><span class="spacer"></span><span>Get in touch</span>
    <span class="solid" data-hop="press" id="navplay">${iconSVG('ui-play')} Watch the demo</span>
    <button class="menu" id="menubtn" aria-label="Menu">${iconSVG('ui-menu')}</button></div>
    <span class="micro">Accordion (§4.6) · › ⇄ ⌄ morph (click) · data-hop="drop" on caret</span>
    <button class="acc" id="accbtn">Pharma &amp; biotech ${iconSVG('ui-chevron')}</button>
    <div class="tabrow">Hidden test rounds ${iconSVG('ui-arrow')}</div>`);
  ctx.append(nav);

  const lists = el('div', {}, `<span class="micro">Guarantees (§5.9 C) · check in blue, warn in alert</span>
    <ul class="list"><li class="blue">${iconSVG('ui-check')}<span style="color:var(--ink)">The provider ran the computation it was paid for.</span></li>
    <li class="blue">${iconSVG('ui-check')}<span style="color:var(--ink)">The answer passed hidden test rounds.</span></li></ul>
    <ul class="list" style="background:var(--paper-2);padding:16px"><li class="alert">${iconSVG('ui-warn')}<span style="color:var(--ink)">Today's noisy chips.</span></li>
    <li class="alert">${iconSVG('ui-warn')}<span style="color:var(--ink)">A wrong model of the molecule.</span></li></ul>
    <div class="row mono" style="justify-content:space-between;border:1px solid var(--hair);padding:16px">KLVY, STOC 2023 <span data-hop="out" style="display:inline-flex">${iconSVG('ui-external')}</span></div>`);
  ctx.append(lists);

  const pillBox = el('div', {}, `<span class="micro">Announcement pill (§4.3) · tc-glyph 12×12 in a 48 tile · caret ⌄ drop</span>`);
  const pill = el('a', { class: 'pill', 'data-hop': 'step', href: '#' });
  const tile = el('span', { class: 'tile' });
  tile.append(pieceEl('tc-glyph').holder);
  pill.append(tile, document.createTextNode('One job, two providers: see who gets paid'));
  pill.insertAdjacentHTML('beforeend', iconSVG('ui-chevron'));
  pillBox.append(pill);
  pillBox.insertAdjacentHTML('beforeend', `<div class="row" data-hop="drop" style="gap:8px;cursor:pointer">More rows ${iconSVG('ui-caret')}</div>
    <span class="micro">Footer socials (§5.11) · 28 px</span>
    <div class="socials"><span>${iconSVG('social-g')}[GitHub]</span><span>${iconSVG('social-x')}[X]</span><span>${iconSVG('social-d')}[Discord]</span></div>`);
  ctx.append(pillBox);
  s.append(ctx);

  // trust chips
  const chipsBox = el('div', { style: 'margin-top:32px' }, `<span class="micro" style="color:var(--soft)">Trust tags (§5.2 A) · 8×8 at U, phases differ</span>`);
  const chips = el('div', { class: 'chips', style: 'margin-top:16px' });
  ([['tag-disk', 'Storage &amp; data'], ['tag-gpu', 'AI models'], ['tag-helix', 'Genomics'], ['tag-candles', 'Risk &amp; pricing'], ['tag-globe', 'Simulation'], ['tag-chain', 'Rollups']] as const).forEach(([id, label]) => {
    const c = el('span', { class: 'chip' });
    c.append(pieceEl(id).holder);
    c.insertAdjacentHTML('beforeend', label);
    chips.append(c);
  });
  chipsBox.append(chips);
  s.append(chipsBox);

  // trust cells
  const cells = el('div', { class: 'cells4', style: 'margin-top:32px' });
  ([['check-scale', 'Check it', 'COST: TINY'], ['trust-loop', 'Re-run it', 'COST: ONE MORE RUN'], ['trust-target', 'Test it', 'COST: SMALL'], ['trust-chain-check', 'Prove it', 'COST: ONE CHEAP ON-CHAIN CHECK']] as const).forEach(([id, title, tag]) => {
    const c = el('div');
    const art = el('div', { class: 'art' });
    art.append(pieceEl(id).holder);
    c.append(art, el('h4', {}, title), el('span', { class: 'micro', style: 'color:var(--soft)' }, tag));
    cells.append(c);
  });
  s.append(cells);

  // paradox band with the question block
  const band = el('div', { class: 'band', style: 'margin-top:32px' }, `<span class="micro" style="color:var(--mist)">The verification paradox · click the band to flicker</span>`);
  const stack = el('div', { class: 'stack' });
  const qb = pieceEl('question-block', 'qb');
  stack.append(qb.holder, el('div', { class: 'mist' }), el('div', { class: 'indigo' }));
  qb.holder.style.left = '64px';
  band.append(stack);
  band.addEventListener('click', () => flickerOnce(qb.m));
  (window as unknown as Record<string, unknown>).__qb = qb.m;
  s.append(band);

  // CTA band
  const cta = el('div', { class: 'ctaband', style: 'margin-top:32px' }, `<span class="micro" style="color:var(--azure)">Bellproof · hover a cell</span>`);
  const c3 = el('div', { class: 'cells3' });
  ([['cta-play', 'Watch the demo', 'One job, two providers, one verdict each.', 'Watch the demo'], ['cta-code', 'Read the code', 'Contracts, verifier and demo, in the open.', 'Open GitHub'], ['cta-book', 'Read the research', 'Five papers, from Mahadev 2018 to CCS 2026.', 'See the papers']] as const).forEach(([id, title, body, btn], i) => {
    const c = el('div', { id: `cta-${i}` });
    const p = pieceEl(id);
    hoverable(c, p.m);
    ((window as unknown as Record<string, Mounted[]>).__cta ??= []).push(p.m);
    c.append(p.holder, el('h4', {}, title), el('p', {}, body));
    c.insertAdjacentHTML('beforeend', `<a class="btn ghost-dark" data-hop="step" href="#">${btn} ${iconSVG('ui-chevron')}</a>`);
    c3.append(c);
  });
  cta.append(c3);
  s.append(cta);
}

// ---- D. revision 1 contexts --------------------------------------------------------------------
{
  const s = section('D · Revision 1: round-tile stack (§1.1), pill (§1.1 8), CTA cells (§1.8), pause cell (§1.10)');
  // right-rail stack: indigo, blue, cornflower M blocks with centred round tiles
  const row = el('div', { class: 'rev-row' });
  const stacks: Array<{ M: number; variant?: string }> = [{ M: 128 }, { M: 96, variant: 'md' }, { M: 64, variant: 'md' }];
  const tiles: Mounted[][] = [];
  for (const { M, variant } of stacks) {
    const stack = el('div', { class: 'tstack' });
    const list: Mounted[] = [];
    for (const colour of ['#6331DF', '#2F5BEA', '#5E87F1']) {
      const b = el('div', { class: 'tblock' });
      b.style.cssText = `width:${M}px;height:${M}px;background:${colour}`;
      const holder = el('span');
      b.append(holder);
      list.push(mount(holder, 'round-tile', { variant, decorative: true }));
      stack.append(b);
    }
    tiles.push(list);
    row.append(stack);
  }
  const all = tiles.flat();
  (window as unknown as Record<string, unknown>).__tiles = tiles;
  const ctl = el('div', { class: 'row' });
  const btn = (label: string, fn: () => void) => { const b = el('button', { class: 'btn outline' }, label); b.onclick = fn; ctl.append(b); };
  const each = (faces: TileFace[], gapMs: number) => tiles.forEach((list) => list.forEach((m, i) => setTimeout(() => flipTile(m, faces[i]), i * gapMs)));
  btn('schedule T C C', () => each(['T', 'C', 'C'], 800));
  btn('shuffle → ? ? ?', () => each(['?', '?', '?'], 0));
  btn('verdict ✓ ✓ ✓', () => each(['ok', 'ok', 'ok'], 167));
  btn('fade → ?', () => all.forEach((m) => fadeTile(m, '?')));
  s.append(row, ctl);

  // pill: 40 px, square 32 px tile, tc-glyph sm
  const pill = el('a', { class: 'pill2', href: '#', id: 'pill2' });
  const tile = el('span', { class: 'tile2' });
  const tg = el('span');
  tile.append(tg);
  const tgm = mount(tg, 'tc-glyph', { variant: 'sm', decorative: true });
  hoverable(pill, tgm);
  (window as unknown as Record<string, unknown>).__pill = tgm;
  pill.append(tile, document.createTextNode('One job, two providers: see who gets paid'));
  pill.insertAdjacentHTML('beforeend', iconSVG('ui-chevron'));
  s.append(pill);

  // pause cell
  const nav = el('div', { class: 'nav', style: 'margin-top:24px' });
  nav.innerHTML = '<span>Bellproof</span><span class="spacer"></span>';
  const pause = el('button', { class: 'pausecell', 'aria-pressed': 'false', id: 'pausecell' });
  pause.innerHTML = `${iconSVG('ui-pause')}<span>Pause motion</span>`;
  pause.onclick = () => {
    const on = pause.getAttribute('aria-pressed') !== 'true';
    pause.setAttribute('aria-pressed', String(on));
    pause.innerHTML = `${iconSVG(on ? 'ui-play-sm' : 'ui-pause')}<span>${on ? 'Play motion' : 'Pause motion'}</span>`;
  };
  nav.append(pause, el('span', {}, 'Contact'));
  s.append(nav);

  // CTA cells: each cell is the link, lg sprite left, title + body right
  const band = el('div', { class: 'ctaband', style: 'margin-top:24px' });
  const cells = el('div', { class: 'cells3 rev' });
  ([['cta-play', 'Watch the demo', 'One job, two providers, one verdict each.', 'ui-external'], ['cta-code', 'Read the code', 'Contracts, verifier and demo, in the open.', 'ui-external'], ['cta-book', 'Read the research', 'Five papers, from Mahadev 2018 to CCS 2026.', 'ui-chevron']] as const).forEach(([id, title, body, glyph], i) => {
    const a = el('a', { class: 'ctacell', href: '#', id: `rcta-${i}` });
    const holder = el('span');
    const m = mount(holder, id, { variant: 'lg', decorative: true });
    hoverable(a, m);
    ((window as unknown as Record<string, Mounted[]>).__rcta ??= []).push(m);
    const txt = el('div', {}, `<h4>${title}</h4><p>${body}</p>`);
    a.append(holder, txt);
    a.insertAdjacentHTML('beforeend', `<span class="go">${iconSVG(glyph)}</span>`);
    cells.append(a);
  });
  band.append(cells);
  s.append(band);
}

// morph wiring
{
  let open = false, acc = false;
  const menu = document.getElementById('menubtn')!;
  menu.addEventListener('click', () => { open = !open; morph(menu, open ? MORPHS.menuToClose : MORPHS.closeToMenu); });
  const accBtn = document.getElementById('accbtn')!;
  accBtn.addEventListener('click', () => { acc = !acc; morph(accBtn, acc ? MORPHS.chevronToDown : MORPHS.downToChevron); });
}

// ---- parity: SVG (as the browser rasterises it) vs the piece bitmap, every static glyph × size ----
async function parity(): Promise<{ checked: number; failed: string[] }> {
  const failed: string[] = [];
  let checked = 0;
  for (const it of staticItems) for (const z of SIZES) {
    const [w, h] = sizeOf(it.piece, it.variant);
    const g = new Grid(w, h);
    it.piece.frame(it.piece.poster, g, { hover: false, focus: false, click: 0, progress: 0, mode: '' }, it.variant);
    const svg = iconSVG(it.piece.id, { size: z, variant: it.variant }).replace('fill="currentColor"', 'fill="#0E1424"');
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = w * z; c.height = h * z;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let bad = 0;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const want = g.get(Math.floor(x / z), Math.floor(y / z)) !== null;
      const a = data[(y * c.width + x) * 4 + 3];
      if ((want && a !== 255) || (!want && a !== 0)) bad++;
    }
    checked++;
    if (bad) failed.push(`${it.label}@${z}: ${bad} px`);
  }
  return { checked, failed };
}

parity().then(({ checked, failed }) => {
  const p = document.getElementById('parity')!;
  p.textContent = failed.length ? `parity FAIL ${failed.length}/${checked}: ${failed.join(', ')}` : `parity PASS ${checked}/${checked} (SVG raster == bitmap, every glyph × size)`;
  p.className = `mono ${failed.length ? 'fail' : 'pass'}`;
  (window as unknown as Record<string, unknown>).__parity = { checked, failed };
  console.log('[icons] parity', checked, failed.length ? failed : 'all pass');
});

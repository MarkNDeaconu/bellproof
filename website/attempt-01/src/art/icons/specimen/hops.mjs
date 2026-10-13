// Measures the CSS hop recipes in art px over time (animations slowed 10× via CDP).
// node src/art/icons/specimen/hops.mjs  → qa/art-icons/browser/hops.json
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const attempt = path.resolve(here, '../../../..');
const tools = path.resolve(attempt, '../tools');
const { chromium } = createRequire(path.join(tools, 'package.json'))('playwright');
const { serve } = await import(path.join(tools, 'serve.mjs'));
const server = await serve(path.join(attempt, '.qa/art-icons'));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(server.url + '/src/art/icons/specimen/specimen.html', { waitUntil: 'networkidle' });
const cdp = await ctx.newCDPSession(page);
await cdp.send('Animation.enable');
await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 });
const out = {};
for (const [sel, name] of [['a.btn.primary[data-hop="step"]', 'step'], ['#hopbtn', 'hop'], ['a.btn.outline[data-hop="out"]', 'out'], ['#navplay', 'press'], ['[data-hop="drop"]', 'drop']]) {
  const loc = page.locator(sel).first();
  await loc.scrollIntoViewIfNeeded();
  await page.mouse.move(2, 2);
  await page.waitForTimeout(2500);
  const probe = () => loc.evaluate((e) => {
    const svg = e.querySelector('svg.icon'); const r = svg.querySelector('rect');
    const a = svg.getBoundingClientRect(), b = r.getBoundingClientRect();
    const u = a.width / svg.viewBox.baseVal.width;          // CSS px per art px
    return [+((b.x - a.x) / u - r.x.baseVal.value).toFixed(2), +((b.y - a.y) / u - r.y.baseVal.value).toFixed(2)];
  });
  const samples = [];
  const t0 = Date.now();
  await loc.hover();
  while (Date.now() - t0 < 3300) { samples.push(['in', Math.round((Date.now() - t0) / 10), await probe()]); await page.waitForTimeout(150); }
  await page.mouse.move(2, 2);
  const t1 = Date.now();
  while (Date.now() - t1 < 2200) { samples.push(['out', Math.round((Date.now() - t1) / 10), await probe()]); await page.waitForTimeout(150); }
  // compress to distinct states with the (animation-time) ms at which each began
  const states = [];
  for (const [ph, ms, v] of samples) { const k = `${ph} ${v.join(',')}`; if (!states.length || states[states.length - 1].k !== k) states.push({ k, at: `${ph}@${ms}ms` }); }
  out[name] = states.map((s) => `${s.at}: (${s.k.split(' ')[1]})`);
}
fs.writeFileSync(path.join(attempt, 'qa/art-icons/browser/hops.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close(); await server.close();

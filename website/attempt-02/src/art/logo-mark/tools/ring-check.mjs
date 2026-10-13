// Drives ring() on the demo and records the DOM state (clapper transform, halo rect count) every tick, plus
// element screenshots of the paper and ink 20× samples at ring ticks 0, 2, 3, 4 and at rest → qa/art-logo-mark/ring-tick-*.png
import { chromium } from '../../../../../tools/node_modules/playwright/index.mjs';
import { serve } from '../../../../../tools/serve.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const out = path.join(root, 'qa', 'art-logo-mark');
const server = await serve(path.join(root, '.qa', 'art-logo-mark'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(`${server.url}/src/art/logo-mark/demo.html`, { waitUntil: 'networkidle' });
await page.locator('#ring-demo').scrollIntoViewIfNeeded();
const state = () => page.evaluate(() => {
  const s = window.__lm.ringPaper;
  return { clapper: s.querySelector('[data-clapper]').getAttribute('transform') || '0', halo: s.querySelector('[data-halo]').childElementCount, tick: window.__lm.handle ? undefined : 0 };
});
console.log('rest:', await state());
const samples = [];
await page.evaluate(() => { window.__lm.ring(window.__lm.ringPaper); window.__lm.ring(window.__lm.ringInk); });
const t0 = Date.now();
const shots = { 0: 'ring-tick-00', 2: 'ring-tick-02', 3: 'ring-tick-03', 4: 'ring-tick-04', 8: 'ring-tick-08' };
for (let i = 0; i < 16; i++) {
  const s = await state();
  samples.push(`${Date.now() - t0}ms clapper=${s.clapper} haloRects=${s.halo}`);
  if (shots[i]) await page.locator('#ring-demo .row').screenshot({ path: path.join(out, `${shots[i]}.png`) });
  await page.waitForTimeout(83);
}
console.log(samples.join('\n'));
await page.waitForTimeout(500);
console.log('after:', await state());
await page.locator('#ring-demo .row').screenshot({ path: path.join(out, 'ring-rest.png') });
console.log(errors.length ? errors : 'console clean');
await browser.close(); await server.close();

// Deterministic ring evidence: applies every tick state of ringState(0..11) plus rest to the 20× DOM marks and
// screenshots each one (no clock timing involved) → qa/art-logo-mark/ring-states/tick-NN.png + sheet.png.
// Then checks reduced motion on the footer (?rm=1): the mark is in place, ring() changes nothing.
import { chromium } from '../../../../../tools/node_modules/playwright/index.mjs';
import { serve } from '../../../../../tools/serve.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const out = path.join(root, 'qa', 'art-logo-mark', 'ring-states');
fs.mkdirSync(out, { recursive: true });
const server = await serve(path.join(root, '.qa', 'art-logo-mark'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${server.url}/src/art/logo-mark/demo.html`, { waitUntil: 'networkidle' });
await page.locator('#ring-demo').scrollIntoViewIfNeeded();
const files = [];
for (let t = 0; t <= 12; t++) {
  const st = await page.evaluate((t) => {
    const f = t < 12 ? window.__lm.ringState(t) : { dx: 0, halo: 0 };
    window.__lm.applyRingFrame(window.__lm.ringPaper, f);
    window.__lm.applyRingFrame(window.__lm.ringInk, f);
    return f;
  }, t);
  const file = path.join(out, `tick-${String(t).padStart(2, '0')}.png`);
  await page.locator('#ring-demo .row').screenshot({ path: file });
  files.push(file);
  console.log(`tick ${t}: dx=${st.dx} halo=${st.halo}`);
}
const rows = [];
for (let i = 0; i < files.length; i += 4) rows.push(['(', ...files.slice(i, i + 4).flatMap((f) => [f, '-bordercolor', '#DEDBD3', '-border', '4']), '+append', ')']);
execFileSync('magick', [...rows.flat(), '-background', '#DEDBD3', '-append', path.join(out, 'sheet.png')]);

// reduced motion
await page.goto(`${server.url}/src/art/logo-mark/demo.html?rm=1`, { waitUntil: 'networkidle' });
await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(1200);
const rm = await page.evaluate(async () => {
  const g = window.__lm.giant;
  const before = { transform: g.style.transform, halo: g.querySelector('[data-halo]').childElementCount, rung: window.__lm.handle.rung };
  const p = window.__lm.ring(g);
  const during = { halo: g.querySelector('[data-halo]').childElementCount, clapper: g.querySelector('[data-clapper]').getAttribute('transform') };
  await p;
  return { reduced: window.__lm.motion.reduced, before, during, dataMotion: document.documentElement.dataset.motion };
});
console.log('reduced motion:', JSON.stringify(rm));
await page.locator('#footer-demo').screenshot({ path: path.join(root, 'qa', 'art-logo-mark', 'footer-reduced-motion.png') });
console.log(errors.length ? errors : 'console clean');
await browser.close(); await server.close();

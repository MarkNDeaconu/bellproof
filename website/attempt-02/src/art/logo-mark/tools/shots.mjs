// Element screenshots of the logo-mark demo at DPR 1 and 2 (nav lockup, scales, favicon, footer), plus pixel-level
// zoom crops, into qa/art-logo-mark/. Uses the shared Playwright install in website/tools.
//   node src/art/logo-mark/tools/shots.mjs   (from attempt-01, after the qa build)
import { chromium } from '../../../../../tools/node_modules/playwright/index.mjs';
import { serve } from '../../../../../tools/serve.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../../../..');
const out = path.join(root, 'qa', 'art-logo-mark');
fs.mkdirSync(out, { recursive: true });
const server = await serve(path.join(root, '.qa', 'art-logo-mark'));
const url = `${server.url}/src/art/logo-mark/demo.html`;
const browser = await chromium.launch();

for (const [dpr, scheme] of [[1, 'light'], [2, 'light'], [1, 'dark']]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr, colorScheme: scheme });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  const tag = `dpr${dpr}${scheme === 'dark' ? '-dark' : ''}`;
  for (const id of ['nav-demo', 'scales-demo', 'favicon-demo']) {
    await page.locator(`#${id}`).screenshot({ path: path.join(out, `demo-${id}-${tag}.png`) });
  }
  // footer at page bottom: scrolled fully, after the once-per-visit ring finished
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(1800);
  await page.locator('#footer-demo').screenshot({ path: path.join(out, `demo-footer-${tag}.png`) });
  if (errors.length) console.log(`[${tag}] console:`, errors); else console.log(`[${tag}] console clean`);
  await ctx.close();
}
await browser.close();
await server.close();
console.log('wrote demo-*.png to', out);

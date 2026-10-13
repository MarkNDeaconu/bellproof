// Screenshot a page at several widths: full page plus viewport-sized steps while scrolling
// (scrolling triggers lazy / scroll-driven animations). Also logs console errors.
//
// node shoot.mjs --url https://example.com --out ../research/x/home
// node shoot.mjs --dir ../attempt-01/dist --path / --out ../attempt-01/qa/home
// Options:
//   --widths 1440,768,390   viewport widths (height = 900, or 844 for widths < 600)
//   --full                  also save one full-page screenshot per width
//   --steps N               save N viewport screenshots, scrolling one viewport each (default 0 = all)
//   --wait ms               wait after load and after each scroll (default 1200)
//   --reduced-motion        emulate prefers-reduced-motion: reduce
//   --dark                  emulate prefers-color-scheme: dark
//   --click sel             click this selector after load (e.g. dismiss a cookie banner: 'button:has-text("Close")')
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './serve.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };

const out = opt('out', 'shot');
const widths = String(opt('widths', '1440,390')).split(',').map(Number);
const wait = Number(opt('wait', 1200));
const stepsOpt = Number(opt('steps', 0));
const full = !!opt('full', false);
let url = opt('url', null);
let server = null;
if (!url) {
  const dir = opt('dir', null);
  if (!dir) { console.error('need --url or --dir'); process.exit(1); }
  server = await serve(dir);
  url = server.url + (opt('path', '/'));
}
fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });

const browser = await chromium.launch();
const log = [];
for (const w of widths) {
  const h = w < 600 ? 844 : 900;
  const ctx = await browser.newContext({
    viewport: { width: w, height: h }, deviceScaleFactor: 1,
    reducedMotion: opt('reduced-motion', false) ? 'reduce' : 'no-preference',
    colorScheme: opt('dark', false) ? 'dark' : 'light',
  });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) log.push(`[${w}] ${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => log.push(`[${w}] pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => log.push(`[${w}] goto: ${e.message}`));
  if (opt('click', null)) { await page.locator(String(opt('click'))).first().click({ timeout: 5000 }).catch(() => log.push(`[${w}] click target not found`)); }
  await page.waitForTimeout(wait);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const n = stepsOpt || Math.ceil(total / h);
  for (let i = 0; i < n; i++) {
    await page.evaluate((y) => window.scrollTo(0, y), i * h);
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}-${w}-step-${String(i).padStart(2, '0')}.png` });
  }
  if (full) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${out}-${w}-full.png`, fullPage: true });
  }
  console.log(`width ${w}: page height ${total}px, ${n} steps`);
  await ctx.close();
}
await browser.close();
if (server) await server.close();
fs.writeFileSync(`${out}-console.txt`, log.join('\n') || 'no console errors or warnings');
console.log(log.length ? `${log.length} console messages -> ${out}-console.txt` : 'no console errors or warnings');

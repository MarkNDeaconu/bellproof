// Capture an animation as a frame sequence, a contact sheet and a GIF, so animation quality
// can be reviewed as still images.
//
// node frames.mjs --url https://example.com --selector "#hero canvas" --out ../research/x/hero-frames
// node frames.mjs --dir ../attempt-01/dist --path /art/bloch.html --selector canvas --out qa/bloch
// Options:
//   --selector css      element to capture (default: the viewport)
//   --scroll css        scroll this element into view first (default: same as --selector)
//   --frames N          number of frames (default 24)
//   --interval ms       time between frames (default 83, about 12 fps)
//   --width W           viewport width (default 1440)
//   --wait ms           wait before the first frame (default 1500)
//   --zoom N            upscale frames N times with nearest-neighbour in the contact sheet (default 1)
//   --hover             hover the element before capturing (to review hover animations)
//   --click sel         click this selector after load (e.g. dismiss a cookie banner)
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { serve } from './serve.mjs';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };

const out = path.resolve(opt('out', 'frames'));
const selector = opt('selector', null);
const scrollSel = opt('scroll', selector);
const frames = Number(opt('frames', 24));
const interval = Number(opt('interval', 83));
const width = Number(opt('width', 1440));
const zoom = Number(opt('zoom', 1));
let url = opt('url', null);
let server = null;
if (!url) {
  const dir = opt('dir', null);
  if (!dir) { console.error('need --url or --dir'); process.exit(1); }
  server = await serve(dir);
  url = server.url + opt('path', '/');
}
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
if (opt('click', null)) await page.locator(String(opt('click'))).first().click({ timeout: 5000 }).catch(() => {});
if (scrollSel && scrollSel !== true) await page.locator(scrollSel).first().scrollIntoViewIfNeeded();
if (opt('hover', false) && selector) await page.locator(selector).first().hover();
await page.waitForTimeout(Number(opt('wait', 1500)));
const target = selector && selector !== true ? page.locator(selector).first() : page;
for (let i = 0; i < frames; i++) {
  await target.screenshot({ path: path.join(out, `frame-${String(i).padStart(3, '0')}.png`) });
  await page.waitForTimeout(interval);
}
await browser.close();
if (server) await server.close();

const files = fs.readdirSync(out).filter((f) => f.startsWith('frame-')).sort().map((f) => path.join(out, f));
try {
  // Contact sheet without montage (montage needs a font for labels): build rows with +append, stack with -append.
  const tile = Math.ceil(Math.sqrt(files.length));
  const rows = [];
  for (let r = 0; r * tile < files.length; r++) {
    const rowPath = path.join(out, `_row-${r}.png`);
    execFileSync('magick', [...files.slice(r * tile, (r + 1) * tile), '-filter', 'point', '-resize', `${zoom * 100}%`, '-bordercolor', '#222222', '-border', '4', '-background', '#222222', '+append', rowPath]);
    rows.push(rowPath);
  }
  execFileSync('magick', [...rows, '-background', '#222222', '-append', path.join(out, 'contact-sheet.png')]);
  rows.forEach((p) => fs.unlinkSync(p));
  execFileSync('magick', ['-delay', String(Math.round(interval / 10)), '-loop', '0', ...files, path.join(out, 'anim.gif')]);
} catch (e) { console.error('montage/gif failed:', e.message); }
console.log(`${files.length} frames -> ${out} (contact-sheet.png, anim.gif)`);
if (errors.length) console.log('page errors:\n' + errors.join('\n'));

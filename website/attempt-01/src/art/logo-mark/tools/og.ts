// Renders public/og.png (1200×630) from the mark, the wordmark and the ramp bands, with Chromium via the shared
// Playwright install in website/tools. Fonts: Space Grotesk 500 / JetBrains Mono 400 from Google Fonts at render
// time (public/fonts/ was empty when this was written; switch the @import to the local woff2 files when they land).
//   npx tsx src/art/logo-mark/tools/og.ts [--out public/og.png]
// The fridge-hero sprite is being drawn by another agent; the card leaves its place (left column) to the mark for
// now and can be recomposed later (see README).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { PALETTE } from '../../../engine/palette';
import { markSVG } from '../bell';

const root = resolve(new URL('../../../..', import.meta.url).pathname);
const args = process.argv.slice(2);
const flag = (k: string): string | undefined => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const out = resolve(root, flag('out') ?? 'public/og.png');
const scratch = join(root, '.qa', 'art-logo-mark', 'og');
mkdirSync(scratch, { recursive: true });
mkdirSync(dirname(out), { recursive: true });

const W = 1200, H = 630;
const BAND = 28;                 // four ramp bands along the bottom
const MARK_SCALE = 30;           // 12×11 → 360×330, standing on the top band like the footer giant
const bandsTop = H - 4 * BAND;   // 518

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500&family=JetBrains+Mono&display=block');
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#FBFAF7;color:${PALETTE.k};font-family:'Space Grotesk',system-ui,sans-serif}
.card{position:relative;width:${W}px;height:${H}px}
.rule{position:absolute;background:${PALETTE.h}}
.mk{position:absolute;left:96px;top:${bandsTop - 11 * MARK_SCALE}px;line-height:0}
.text{position:absolute;left:552px;top:132px;width:560px}
.eyebrow{font:400 16px/24px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase;color:${PALETTE.b};margin:0 0 20px}
.word{font-size:104px;line-height:104px;letter-spacing:-.02em;margin:0 0 20px}
.tag{font-size:38px;line-height:46px;letter-spacing:-.01em;margin:0}
.bands{position:absolute;left:0;right:0;bottom:0;height:${4 * BAND}px}
.bands div{height:${BAND}px}
.grid{position:absolute;inset:0;background-image:linear-gradient(to right, rgba(14,20,36,.10) 1px, transparent 1px);background-size:100% 100%;background-position:48px 0;background-repeat:no-repeat}
</style></head><body><div class="card">
<div class="rule" style="left:0;right:0;top:48px;height:1px"></div>
<div class="rule" style="left:48px;top:0;bottom:${4 * BAND}px;width:1px"></div>
<div class="rule" style="right:48px;top:0;bottom:${4 * BAND}px;width:1px"></div>
<div class="mk">${markSVG({ scale: MARK_SCALE, fill: PALETTE.k, label: 'Bellproof mark' })}</div>
<div class="text">
<p class="eyebrow">Delegate quantum work. Verify every answer.</p>
<p class="word">Bellproof</p>
<p class="tag">Verified quantum computation, settled on-chain.</p>
</div>
<div class="bands"><div style="background:${PALETTE.b}"></div><div style="background:${PALETTE.c}"></div><div style="background:${PALETTE.a}"></div><div style="background:${PALETTE.u}"></div><div class="grid"></div></div>
</div></body></html>`;

const htmlPath = join(scratch, 'og.html');
writeFileSync(htmlPath, html);

interface Page { goto(url: string, o: { waitUntil: string }): Promise<unknown>; evaluate<T>(fn: () => T): Promise<T>; screenshot(o: { path: string; clip: { x: number; y: number; width: number; height: number } }): Promise<unknown> }
interface Chromium { launch(): Promise<{ newPage(o: { viewport: { width: number; height: number }; deviceScaleFactor: number }): Promise<Page>; close(): Promise<void> }> }
const { chromium } = (await import(pathToFileURL(join(root, '..', 'tools', 'node_modules', 'playwright', 'index.mjs')).href)) as { chromium: Chromium };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
const fontOk = await page.evaluate(() => document.fonts.check("500 104px 'Space Grotesk'") && document.fonts.check("16px 'JetBrains Mono'"));
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: W, height: H } });
await browser.close();
console.log(`wrote ${out} (${W}×${H}); web fonts ${fontOk ? 'loaded' : 'NOT loaded (fallback used)'}`);

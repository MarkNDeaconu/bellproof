// art-icons QA capture: node src/art/icons/specimen/capture.mjs  (from attempt-01, after the specimen build)
// Writes evidence to qa/art-icons/browser/. Uses the shared Playwright install in website/tools.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const here = path.dirname(new URL(import.meta.url).pathname);
const attempt = path.resolve(here, '../../../..');
const tools = path.resolve(attempt, '../tools');
const req = createRequire(path.join(tools, 'package.json'));
const { chromium } = req('playwright');
const { PNG } = createRequire(path.join(attempt, 'package.json'))('pngjs');
const { serve } = await import(path.join(tools, 'serve.mjs'));

const out = path.join(attempt, 'qa/art-icons/browser');
fs.mkdirSync(out, { recursive: true });
const server = await serve(path.join(attempt, '.qa/art-icons'));
const URL_ = server.url + '/src/art/icons/specimen/specimen.html';
const browser = await chromium.launch();
const report = { console: {}, parity: {}, shotParity: {}, };

function samePixels(a, b) {
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  if (A.width !== B.width || A.height !== B.height) return `size ${A.width}x${A.height} vs ${B.width}x${B.height}`;
  let bad = 0;
  for (let i = 0; i < A.data.length; i += 4) if (A.data[i] !== B.data[i] || A.data[i + 1] !== B.data[i + 1] || A.data[i + 2] !== B.data[i + 2]) bad++;
  return bad ? `${bad} px differ` : 'ok';
}

for (const dpr of [1, 2]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
  const page = await ctx.newPage();
  const msgs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') msgs.push(`${m.type()}: ${m.text()}`); });
  page.on('pageerror', (e) => msgs.push('pageerror: ' + e.message));
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__parity, null, { timeout: 15000 });
  report.parity[`dpr${dpr}`] = await page.evaluate(() => window.__parity);
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(out, `specimen-dpr${dpr}-full.png`), fullPage: true });
  for (const sel of ['#glyphs', '#sprites', '.ctx', '.chips', '.cells4', '.band', '.ctaband']) {
    const name = sel.replace(/[#.]/g, '');
    await page.locator(sel).first().screenshot({ path: path.join(out, `dpr${dpr}-${name}.png`) });
  }
  // screenshot parity: the live inline SVG vs the live canvas twin, every glyph row × size
  const rows = await page.locator('#glyphs .lbl[data-id]').all();
  const results = [];
  const frac = await page.evaluate(() => [...document.querySelectorAll('#glyphs svg, #glyphs canvas, #sprites canvas')]
    .map((e) => e.getBoundingClientRect()).filter((r) => r.x % 1 || r.y % 1 || r.width % 1 || r.height % 1).length);
  report.fractionalBoxes = report.fractionalBoxes ?? {};
  report.fractionalBoxes[`dpr${dpr}`] = frac;
  for (const row of rows) {
    const id = await row.getAttribute('data-id');
    for (const z of [2, 4, 8, 20]) {
      const svg = page.locator(`#glyphs .paper.svg[data-id="${id}"][data-size="${z}"] svg`);
      const cnv = page.locator(`#glyphs .paper.cnv[data-id="${id}"][data-size="${z}"] canvas`);
      const a = await svg.screenshot({ omitBackground: false });
      const b = await cnv.screenshot({ omitBackground: false });
      const r = samePixels(a, b);
      if (r !== 'ok') results.push(`${id}@${z}: ${r}`);
    }
  }
  report.shotParity[`dpr${dpr}`] = { rows: rows.length, sizes: 4, failures: results };
  report.console[`dpr${dpr}`] = msgs;
  await ctx.close();
}

// hover + morph frames (DPR 2), CSS animations slowed 10x through CDP so every 83 ms step is captured
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Animation.enable');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 0.1 });
  const hoverSeq = async (sel, name, n = 8, every = 415) => {
    const loc = page.locator(sel).first();
    await loc.scrollIntoViewIfNeeded();
    await page.mouse.move(5, 5);
    await page.waitForTimeout(2500);
    const dir = path.join(out, `hover-${name}`);
    fs.mkdirSync(dir, { recursive: true });
    await loc.screenshot({ path: path.join(dir, `f00-rest.png`) });
    await loc.hover();
    for (let i = 1; i <= n; i++) { await loc.screenshot({ path: path.join(dir, `f${String(i).padStart(2, '0')}.png`) }); await page.waitForTimeout(every); }
    await page.mouse.move(5, 5);
    for (let i = 1; i <= 4; i++) { await loc.screenshot({ path: path.join(dir, `leave-${i}.png`) }); await page.waitForTimeout(every); }
  };
  await hoverSeq('a.btn.primary[data-hop="step"]', 'step');
  await hoverSeq('#hopbtn', 'hop');
  await hoverSeq('a.btn.outline[data-hop="out"]', 'out');
  await hoverSeq('#navplay', 'press');
  await hoverSeq('[data-hop="drop"]', 'drop');
  await cdp.send('Animation.setPlaybackRate', { playbackRate: 1 });
  // morphs: setTimeout-driven, 83 ms per step; sample every ~28 ms
  for (const [sel, name] of [['#menubtn', 'menu'], ['#accbtn', 'accordion']]) {
    const loc = page.locator(sel);
    const dir = path.join(out, `morph-${name}`);
    fs.mkdirSync(dir, { recursive: true });
    await loc.scrollIntoViewIfNeeded();
    await loc.screenshot({ path: path.join(dir, 'f00.png') });
    await loc.click();
    for (let i = 1; i <= 8; i++) { await loc.screenshot({ path: path.join(dir, `f${String(i).padStart(2, '0')}.png`) }); await page.waitForTimeout(20); }
  }
  // canvas gestures, deterministic: stop the mount, set hover, seek ticks 0..7
  const dir = path.join(out, 'cta-hover');
  fs.mkdirSync(dir, { recursive: true });
  for (let i = 0; i < 3; i++) {
    const cell = page.locator(`#cta-${i}`);
    await cell.scrollIntoViewIfNeeded();
    for (let t = 0; t < 8; t++) {
      await page.evaluate(([i, t]) => { const m = window.__cta[i]; m.stop(); m.set('hoverAt', 0); m.set('hover', true); m.seek(t); }, [i, t]);
      await cell.locator('canvas').screenshot({ path: path.join(dir, `cta${i}-t${t}.png`) });
    }
    await page.evaluate((i) => { window.__cta[i].set('hover', false); }, i);
  }
  // question-block bump, deterministic
  const qdir = path.join(out, 'qb-bump');
  fs.mkdirSync(qdir, { recursive: true });
  await page.locator('.band').scrollIntoViewIfNeeded();
  for (let t = 0; t < 9; t++) {
    await page.evaluate((t) => { const m = window.__qb; m.stop(); m.set('bump', 0); m.seek(t); }, t);
    await page.locator('.band').screenshot({ path: path.join(qdir, `t${t}.png`) });
  }
  await ctx.close();
}

// reduced motion: posters only, hovers inert
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(URL_, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.locator('#sprites').screenshot({ path: path.join(out, 'rm-sprites-a.png') });
  await page.waitForTimeout(1500);
  await page.locator('#sprites').screenshot({ path: path.join(out, 'rm-sprites-b.png') });
  const a = fs.readFileSync(path.join(out, 'rm-sprites-a.png')), b = fs.readFileSync(path.join(out, 'rm-sprites-b.png'));
  report.reducedMotionStill = samePixels(a, b);
  const btn = page.locator('a.btn.primary[data-hop="step"]');
  await btn.scrollIntoViewIfNeeded();
  await btn.screenshot({ path: path.join(out, 'rm-btn-rest.png') });
  await btn.hover(); await page.waitForTimeout(400);
  await btn.screenshot({ path: path.join(out, 'rm-btn-hover.png') });
  report.reducedMotionHoverStill = await page.evaluate(() => getComputedStyle(document.querySelector('a.btn.primary[data-hop="step"] svg rect')).transform);
  await ctx.close();
}

await browser.close();
await server.close();
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));

// CP0 and viewport comparison: is the GPU renderer live, is Lenis gone, are the fonts in, how does each viewport read?
import { openStage, step, warm, sectionGeometry, pinnedY } from './lib/stage.mjs';
import fs from 'node:fs';
const out = 'out/review/probe'; fs.mkdirSync(out, { recursive: true });
const VIEWPORTS = (process.env.VPS || '1280x720,1120x630,1024x576').split(',').map(s => s.split('x').map(Number));
for (const [width, height] of VIEWPORTS) {
  const t0 = Date.now();
  const { browser, page, errors } = await openStage({ width, height });
  const info = await page.evaluate(() => {
    const c = document.createElement('canvas').getContext('webgl2');
    const e = c.getExtension('WEBGL_debug_renderer_info');
    return { gl: e ? c.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'no-ext', lenis: !!window.__lenis, real: String(window.__realRAF).slice(0, 40), fontInter: document.fonts.check('16px Inter'), fontMono: document.fonts.check('16px "Space Mono"'), dsf: devicePixelRatio };
  });
  console.log(width, height, JSON.stringify(info));
  await warm(page, { until: () => !!document.querySelector('.mc-hero')?.dataset.renderer });
  const g = await page.evaluate(sectionGeometry);
  console.log(JSON.stringify(g));
  const shots = [['hero', 0], ['anat', pinnedY(g.metacase, .4)], ['arch', pinnedY(g.structure, .57)], ['net', pinnedY(g.net, .63)], ['fields', pinnedY(g.fieldsTrack, .16)], ['arena0', pinnedY(g.arena, .02)], ['arena1', pinnedY(g.arena, .24)], ['run', pinnedY(g.rules, .35)], ['tracks', g.tracks.top - 60], ['team', g.team.top - 60]];
  for (const [name, y] of shots) {
    const ok = await warm(page, { y, timeoutMs: 20000 });
    for (let k = 0; k < 90; k++) await step(page, { y });
    await page.waitForTimeout(400);
    for (let k = 0; k < 6; k++) await step(page, { y });
    await page.screenshot({ path: `${out}/${width}-${name}.jpg`, type: 'jpeg', quality: 88 });
  }
  const r = await page.evaluate(() => ({ arena: document.querySelector('.mc-chapter').dataset.renderer, progress: document.querySelector('.mc-chapter').dataset.progress, lenis: !!window.__lenis, html: document.documentElement.className }));
  console.log(JSON.stringify(r), 'errors', errors.slice(0, 5), 'ms', Date.now() - t0);
  await browser.close();
}

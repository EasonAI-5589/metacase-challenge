// Before keying 05-fields in shots.mjs: which field and spread the stage shows at each track progress, and where the
// results card's parts sit, at the film's viewport. Scrolls forward as a visitor would, so the page turns its own leaves.
//   node probe-fields.mjs            SHOT=1 also writes a frame per stop to out/review/probe-fields
//   PS=.03,.1667 node probe-fields.mjs    other progress stops
import { openStage, step, warm, sectionGeometry, pinnedY, STAGE_CSS } from './lib/stage.mjs';
import fs from 'node:fs';
const out = 'out/review/probe-fields'; fs.mkdirSync(out, { recursive: true });
const { browser, page, errors } = await openStage({ extraCss: STAGE_CSS });
await warm(page, { until: () => !!document.querySelector('.mc-hero')?.dataset.renderer });
// the page's animations are held until released (the hero's entrance); release them or no leaf ever finishes turning
await page.evaluate(() => window.__release());
for (let k = 0; k < 30; k++) await step(page, { y: 0 });
const g = await page.evaluate(sectionGeometry);
// spread s of field f rests at (f + (s - .5) / 3) / 3 (metacase.js spreadAt)
const ps = (process.env.PS || '.0556,.1667,.2778,.3889,.5,.6111,.7222,.8333,.9444').split(',').map(Number);
const state = () => page.evaluate(() => {
  const b = document.querySelector('.mc-flip.is-shown .mc-book');
  return { field: document.querySelector('.mc-fbook[data-slot="center"] .mc-fbook-title')?.textContent.trim() ?? null, spread: b?.dataset.s ?? null };
});
let y0 = g.fields.top;
for (const p of ps) {
  const y = pinnedY(g.fieldsTrack, p);
  for (let k = 1; k <= 40; k++) await step(page, { y: y0 + (y - y0) * k / 40 });
  for (let k = 0; k < 70; k++) await step(page, { y });
  y0 = y;
  console.log('fields p', p, JSON.stringify(await state()));
  if (process.env.SHOT) await page.screenshot({ path: `${out}/fields-${p}.jpg`, type: 'jpeg', quality: 80 });
}
// the results card: its heading, intro and the three figures, relative to the view, at a few scroll offsets from #tracks
for (const dy of [-60, 0, 239]) {
  const y = g.tracks.top + dy;
  await warm(page, { y, timeoutMs: 20000 });
  for (let k = 0; k < 90; k++) await step(page, { y });
  console.log(`tracks${dy < 0 ? dy : '+' + dy}`, JSON.stringify(await page.evaluate(() => {
    const box = s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.bottom)]; };
    return { head: box('.mc-results-head'), intro: box('.mc-results-intro'), stats: box('.mc-results-stats'), subnav: box('.mc-subnav') };
  })));
  if (process.env.SHOT) await page.screenshot({ path: `${out}/results${dy}.jpg`, type: 'jpeg', quality: 80 });
}
console.log('errors', errors.slice(0, 5));
await browser.close();

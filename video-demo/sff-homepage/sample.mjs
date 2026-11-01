// Stills at candidate positions, one fresh page per chapter, to choose each shot's keyframes.
// node sample.mjs <name> "section:p,section:p" [cols]
import { openStage, step, warm, sectionGeometry, pinnedY, STAGE_CSS } from './lib/stage.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const [name, list, cols = '4'] = process.argv.slice(2);
const dir = `out/review/sample-${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const { browser, page, errors } = await openStage({ extraCss: STAGE_CSS });
await page.evaluate(() => window.__release());
await warm(page, { until: () => !!document.querySelector('.mc-hero')?.dataset.renderer });
const g = await page.evaluate(sectionGeometry);
console.log(JSON.stringify(Object.fromEntries(Object.entries(g).map(([k, v]) => [k, [Math.round(v.top), v.height, Math.round(v.pinTop), v.pinH]]))));
let n = 0;
for (const item of list.split(',')) {
  const [sec, val] = item.split(':');
  const y = sec === 'y' ? Number(val) : pinnedY(sec === 'fieldsTrack' ? g.fieldsTrack : g[sec], Number(val));
  await warm(page, { y, timeoutMs: 15000 });
  for (let k = 0; k < 70; k++) await step(page, { y });
  await page.waitForTimeout(250);
  for (let k = 0; k < 4; k++) await step(page, { y });
  await page.screenshot({ path: `${dir}/${String(n++).padStart(2, '0')}-${sec}-${val}.jpg`, type: 'jpeg', quality: 86 });
}
console.log('errors', errors.slice(0, 3));
await browser.close();
const c = Number(cols), rows = Math.ceil(n / c);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-pattern_type', 'glob', '-i', `${dir}/*.jpg`, '-filter_complex', `scale=640:-1,tile=${c}x${rows}:padding=4:color=0x333333`, '-frames:v', '1', `out/review/sample-${name}.jpg`]);

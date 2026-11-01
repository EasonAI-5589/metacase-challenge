// Captures shots frame by frame. FPS=10 gives the rough cut, the default 60 the master.
//   node capture.mjs 01-hero,06a-arena     FPS=10 node capture.mjs all
import { openStage, step, warm, stepsTaken, sectionGeometry, pinnedY, STAGE_CSS, FPS, ORIGIN } from './lib/stage.mjs';
import { SHOTS, CUBIC_IO } from './shots.mjs';
import { visibleText } from './lib/onscreen.mjs';
import fs from 'node:fs';

const bezier = ([x1, y1, x2, y2]) => t => {
  if (t <= 0) return 0; if (t >= 1) return 1;
  let u = t;
  for (let i = 0; i < 8; i++) {
    const x = 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u ** 2 * x2 + u ** 3 - t;
    const d = 3 * (1 - u) ** 2 * x1 + 6 * (1 - u) * u * (x2 - x1) + 3 * u ** 2 * (1 - x2);
    if (Math.abs(d) < 1e-6) break;
    u -= x / d;
  }
  return 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u ** 2 * y2 + u ** 3;
};
const io = bezier(CUBIC_IO), e2 = bezier([0.33, 1, 0.68, 1]);
const track = (keys, t) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [a, va] = keys[i - 1], [b, vb, kind] = keys[i], k = (t - a) / (b - a);
    return va + (vb - va) * (kind === 'linear' ? k : io(k));
  }
  return keys.at(-1)[1];
};

// A screenshot can stall when the GPU process hiccups. Retrying never advances the fake clock, so the frame is unchanged.
const retries = { count: 0 };
const shoot = async (page, path) => {
  for (let attempt = 0; ; attempt++) {
    try { return await page.screenshot({ path, type: 'jpeg', quality: 95, timeout: 20000 }); }
    catch (error) {
      if (attempt >= 4 || error.name !== 'TimeoutError') throw error;
      retries.count++;
      await new Promise(done => setTimeout(done, 3000));
    }
  }
};
const stamp = FPS === 60 ? 'frames' : `frames-${FPS}`;
const pick = process.argv[2] || 'all';
const list = pick === 'all' ? SHOTS : SHOTS.filter(s => pick.split(',').includes(s.id));
const report = [];
// Every half second, the readable text of the frame goes into a ledger for the provenance check.
const ledger = {};
const note = async (page, id, t, scale) => {
  if (Math.round(t * FPS) % Math.max(1, Math.round(FPS / 2))) return;
  const seen = await page.evaluate(visibleText, scale);
  const shot = ledger[id] ||= {};
  for (const [text, px] of Object.entries(seen)) { const e = shot[text] ||= { px, from: t, to: t }; e.px = Math.max(e.px, px); e.to = t; }
};

for (const shot of list) {
  const t0 = Date.now(), out = `out/${stamp}/${shot.id}`;
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const frames = Math.round(shot.seconds * FPS), mismatches = [];
  if (shot.card) {
    const { browser, page, errors } = await openStage({ width: 1920, height: 1080, dsf: 1, url: `${ORIGIN}/video-demo/sff-homepage/${shot.card}`, stageText: false });
    await step(page); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.__release());
    for (let i = 0; i < frames; i++) { await step(page); await note(page, shot.id, i / FPS, 1); await shoot(page, `${out}/${String(i).padStart(5, '0')}.jpg`); }
    report.push({ id: shot.id, frames, errors, seconds: Math.round((Date.now() - t0) / 1000) });
    console.log(JSON.stringify(report.at(-1)));
    await browser.close();
    continue;
  }
  const { browser, page, errors } = await openStage({ extraCss: STAGE_CSS + (shot.css || ''), loadout: shot.loadout || null });
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await step(page);
  await page.waitForTimeout(200);
  const g = await page.evaluate(sectionGeometry);
  const resolve = v => {
    if (typeof v === 'number') return v;
    const m = /^(\w+)([+-]\d+)?$/.exec(v);
    return g[m[1]].top + Number(m[2] || 0);
  };
  const yAt = t => {
    if (shot.y) return resolve(track(shot.y.map(([a, v]) => [a, v]), 0) ?? 0);
    const keys = shot.keys.map(([a, v, kind]) => [a, typeof v === 'object' ? resolve(v.y) : pinnedY(g[shot.section], v), kind]);
    return track(keys, t);
  };
  const yStart = shot.warmY ? resolve(shot.warmY) : yAt(0);
  const ready = shot.ready, arena = !!shot.arena;
  await warm(page, { y: yStart, timeoutMs: 30000, until: arena
    ? () => { const c = document.querySelector('.mc-chapter'), v = document.querySelector('.mc-canvas'); return c.dataset.renderer === 'webgl' && v.dataset.robotModel === 'mc-kit' && v.dataset.weaponAssets === 'kenney-cc0'; }
    : ready ? new Function(`return !!document.querySelector(${JSON.stringify(ready)})?.dataset.renderer`) : null });
  // Silent settle to a fixed step count: textures are in, the arena's camera has caught up with its target,
  // and however long loading took, every run reaches frame 0 at the same fake-clock time.
  const warmSteps = (arena ? 8 : 4) * FPS;
  await page.waitForTimeout(400);
  const overrun = stepsTaken() > warmSteps;
  while (stepsTaken() < warmSteps) await step(page, { y: yStart });
  const VEILED = 'canvas.mc-stage, [data-tags="hero"]';
  if (shot.veil) await page.evaluate(sel => { for (const c of document.querySelectorAll(sel)) c.style.opacity = '0'; }, VEILED);
  const events = [...(shot.at || []), ...(shot.releaseAt ? [[shot.releaseAt, 'window.__release()']] : [])].sort((a, b) => a[0] - b[0]);
  if (!shot.releaseAt) await page.evaluate(() => window.__release());
  for (let i = 0; i < frames; i++) {
    const t = i / FPS, y = yAt(t);
    while (events.length && events[0][0] <= t) await page.evaluate(events.shift()[1]);
    if (shot.veil) {
      const k = e2(Math.min(1, Math.max(0, (t - shot.veil[0]) / (shot.veil[1] - shot.veil[0]))));
      await page.evaluate(([sel, k]) => { for (const c of document.querySelectorAll(sel)) c.style.opacity = String(k); }, [VEILED, k]);
    }
    await step(page, { y, rate: shot.rate ? shot.rate.findLast(([a]) => a <= t)[1] : 1 });
    const at = await page.evaluate(() => ({ y: scrollY, p: Number(document.querySelector('.mc-chapter')?.dataset.progress) }));
    if (Math.abs(at.y - y) > 1) mismatches.push({ i, want: y, got: at.y });
    await note(page, shot.id, t, 1.5);
    await shoot(page, `${out}/${String(i).padStart(5, '0')}.jpg`);
  }
  const rendererState = await page.evaluate(() => ({ arena: document.querySelector('.mc-chapter').dataset.renderer || null, lenis: !!window.__lenis, fonts: document.fonts.status }));
  report.push({ id: shot.id, frames, errors, warmOverrun: overrun, screenshotRetries: retries.count, mismatches: mismatches.slice(0, 5), mismatchCount: mismatches.length, rendererState, seconds: Math.round((Date.now() - t0) / 1000) });
  console.log(JSON.stringify(report.at(-1)));
  await browser.close();
}
fs.writeFileSync(`out/review/capture-report-${FPS}fps.json`, JSON.stringify(report, null, 2));
const ledgerPath = `out/review/onscreen-${FPS}fps.json`;
const previous = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : {};
fs.writeFileSync(ledgerPath, JSON.stringify({ ...previous, ...ledger }, null, 2));

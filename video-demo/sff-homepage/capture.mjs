// Captures shots frame by frame. FPS=10 gives the rough cut, the default 60 the master.
//   node capture.mjs 01-hero,06a-arena     FPS=10 node capture.mjs all
import { openStage, step, warm, stepsTaken, sectionGeometry, pinnedY, STAGE_CSS, FPS, ORIGIN } from './lib/stage.mjs';
import { SHOTS, CUBIC_IO, XFADE } from './shots.mjs';
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

// A screenshot occasionally never returns. Playwright queues screenshots, so a retry on the same page waits behind
// the stuck one and can never succeed: the whole shot is captured again in a fresh browser instead.
const shoot = async (page, path) => {
  if (!path.startsWith('out/')) throw new Error(`frame path outside out/: ${path}`);
  return page.screenshot({ path, type: 'jpeg', quality: 95, timeout: 15000 });
};
const stamp = FPS === 60 ? 'frames' : `frames-${FPS}`;
const pick = process.argv[2] || 'all';
// `all` skips shots marked reuse: their frames stay as they are.
const list = pick === 'all' ? SHOTS.filter(s => !s.reuse) : SHOTS.filter(s => pick.split(',').includes(s.id));
const report = [];
// Every quarter second, the readable text of the frame and its box on the 1080p output go into a ledger, for the provenance and safe-area checks.
const ledger = {};
const note = async (page, id, t, scale, everyFrame = false) => {
  if (!everyFrame && Math.round(t * FPS) % Math.max(1, Math.round(FPS / 4))) return;
  const seen = await page.evaluate(visibleText, scale);
  const shot = ledger[id] ||= {};
  for (const [text, box] of Object.entries(seen)) {
    const e = shot[text] ||= { px: box.px, from: t, to: t, outside: [] };
    e.px = Math.max(e.px, box.px); e.to = t;
    const bad = [box.l < 96 && `left ${box.l}`, box.r > 1824 && `right ${box.r}`, box.t < 54 && `top ${box.t}`, box.b > 1026 && `bottom ${box.b}`].filter(Boolean);
    if (bad.length) e.outside.push([t, ...bad]);
  }
};

let active = null;
const captureShot = async (shot, attempt) => {
  const t0 = Date.now(), out = `out/${stamp}/${shot.id}`;
  delete ledger[shot.id];
  fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  const frames = Math.round(shot.seconds * FPS), mismatches = [];
  if (shot.card) {
    const { browser, page, errors } = active = await openStage({ width: 1920, height: 1080, dsf: 1, url: `${ORIGIN}/video-demo/sff-homepage/${shot.card}`, stageText: false });
    await step(page); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.__release());
    for (let i = 0; i < frames; i++) { await step(page); await note(page, shot.id, i / FPS, 1); await shoot(page, `${out}/${String(i).padStart(5, '0')}.jpg`); }
    report.push({ id: shot.id, frames, errors, attempt, seconds: Math.round((Date.now() - t0) / 1000) });
    console.log(JSON.stringify(report.at(-1)));
    await browser.close();
    return;
  }
  const [width, height] = shot.viewport || [1280, 720], scale = 1920 / width;
  const { browser, page, errors } = active = await openStage({ width, height, extraCss: STAGE_CSS + (shot.css || ''), loadout: shot.loadout || null });
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
  const boxExtents = {}, boxOutside = [];
  const events = [...(shot.at || []), ...(shot.releaseAt ? [[shot.releaseAt, 'window.__release()']] : [])].sort((a, b) => a[0] - b[0]);
  if (!shot.releaseAt) await page.evaluate(() => window.__release());
  for (let i = 0; i < frames; i++) {
    const t = i / FPS, y = yAt(t);
    while (events.length && events[0][0] <= t) await page.evaluate(events.shift()[1]);
    if (shot.veil) {
      const k = e2(Math.min(1, Math.max(0, (t - shot.veil[0]) / (shot.veil[1] - shot.veil[0]))));
      await page.evaluate(([sel, k]) => { for (const c of document.querySelectorAll(sel)) c.style.opacity = String(k); }, [VEILED, k]);
    }
    for (const f of shot.fades || []) {
      const [a, b] = f.at, v = t <= a ? f.from : t >= b ? f.to : f.from + (f.to - f.from) * e2((t - a) / (b - a));
      await page.evaluate(([sel, v]) => { for (const el of document.querySelectorAll(sel)) el.style.filter = v >= 1 ? '' : `opacity(${v})`; }, [f.sel, v]);
    }
    // text layers leave before a crossfade and arrive after it, so two sets of words never stack
    const textOut = shot.textOut ?? true, textIn = shot.textIn ?? true, end = shot.seconds - XFADE;
    const leaving = textOut ? e2(Math.min(1, Math.max(0, (end - t) / .25))) : 1;
    const arriving = textIn ? e2(Math.min(1, Math.max(0, (t - XFADE) / .25))) : 1;
    const k = Math.min(leaving, arriving), mode = k < 1 ? ((leaving < 1 ? textOut : textIn) === 'band' ? 'band' : 'all') : null;
    await page.evaluate(([k, mode]) => {
      const root = document.documentElement;
      if (mode) { root.dataset.textFade = mode; root.style.setProperty('--shoot-text', k); } else delete root.dataset.textFade;
    }, [k, mode]);
    await step(page, { y, rate: shot.rate ? shot.rate.findLast(([a]) => a <= t)[1] : 1 });
    const at = await page.evaluate(() => ({ y: scrollY, p: Number(document.querySelector('.mc-chapter')?.dataset.progress) }));
    if (Math.abs(at.y - y) > 1) mismatches.push({ i, want: y, got: at.y });
    await note(page, shot.id, t, scale, shot.auditEveryFrame);
    // Text is not the only thing that can cross the safe area: the graphics that carry it are measured too.
    if (shot.auditBoxes && t >= shot.auditBoxes.from) {
      const boxes = await page.evaluate(([selectors, scale]) => Object.fromEntries(selectors.map(sel => {
        const rects = [...document.querySelectorAll(sel)].map(el => el.getBoundingClientRect()).filter(r => r.width && r.height);
        return [sel, rects.length ? [Math.min(...rects.map(r => r.left)), Math.min(...rects.map(r => r.top)), Math.max(...rects.map(r => r.right)), Math.max(...rects.map(r => r.bottom))].map(v => Math.round(v * scale)) : null];
      })), [shot.auditBoxes.selectors, scale]);
      for (const [sel, box] of Object.entries(boxes)) if (box) {
        const seen = boxExtents[sel] ||= [...box];
        seen[0] = Math.min(seen[0], box[0]); seen[1] = Math.min(seen[1], box[1]); seen[2] = Math.max(seen[2], box[2]); seen[3] = Math.max(seen[3], box[3]);
        if (box[0] < 96 || box[1] < 54 || box[2] > 1824 || box[3] > 1026) boxOutside.push([t, sel, box]);
      }
    }
    await shoot(page, `${out}/${String(i).padStart(5, '0')}.jpg`);
  }
  const rendererState = await page.evaluate(() => ({ arena: document.querySelector('.mc-chapter').dataset.renderer || null, lenis: !!window.__lenis, fonts: document.fonts.status }));
  report.push({ id: shot.id, frames, errors, attempt, warmOverrun: overrun, ...(shot.auditBoxes ? { boxExtents, boxOutsideFrames: boxOutside.length, boxOutsideFirst: boxOutside.slice(0, 3) } : {}), mismatches: mismatches.slice(0, 5), mismatchCount: mismatches.length, rendererState, seconds: Math.round((Date.now() - t0) / 1000) });
  console.log(JSON.stringify(report.at(-1)));
  await browser.close();
};

const ledgerPath = `out/review/onscreen-${FPS}fps.json`;
for (const shot of list) {
  for (let attempt = 1; ; attempt++) {
    try { await captureShot(shot, attempt); break; }
    catch (error) {
      await active?.browser.close().catch(() => {});
      if (attempt >= 4 || error.name !== 'TimeoutError') throw error;
      console.error(`${shot.id}: attempt ${attempt} stalled, capturing the shot again`);
    }
  }
  // Written after every shot and checked here, so a later crash can never leave stale results looking fresh.
  const written = fs.readdirSync(`out/${stamp}/${shot.id}`).filter(f => f.endsWith('.jpg')).length, wanted = Math.round(shot.seconds * FPS);
  if (written !== wanted) throw new Error(`${shot.id}: ${written} frames on disk, expected ${wanted}`);
  const previous = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : {};
  fs.writeFileSync(ledgerPath, JSON.stringify({ ...previous, [shot.id]: ledger[shot.id] }, null, 2));
}
fs.writeFileSync(`out/review/capture-report-${FPS}fps.json`, JSON.stringify(report, null, 2));

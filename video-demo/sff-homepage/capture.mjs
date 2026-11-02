// Captures shots frame by frame. FPS=10 gives the rough cut, the default 60 the master.
//   node capture.mjs 01-hero,06a-arena     FPS=10 node capture.mjs all
// Shots of one take listed together are captured as one continuous run; a shot listed on its own starts from rest where it begins.
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
// A run of 'glide' keys is a monotone cubic: speed is continuous through its keys and zero where the run starts and ends.
const track = (keys, t) => {
  if (t <= keys[0][0]) return keys[0][1];
  const slope = j => (keys[j][1] - keys[j - 1][1]) / (keys[j][0] - keys[j - 1][0]);
  const tangent = j => {
    if (keys[j][2] !== 'glide' || keys[j + 1]?.[2] !== 'glide') return 0;
    const a = slope(j), b = slope(j + 1);
    return a * b <= 0 ? 0 : 2 * a * b / (a + b);
  };
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const [a, va] = keys[i - 1], [b, vb, kind] = keys[i], h = b - a, k = (t - a) / h;
    if (kind !== 'glide') return va + (vb - va) * io(k);
    const m0 = tangent(i - 1), m1 = tangent(i), k2 = k * k, k3 = k2 * k;
    return (2 * k3 - 3 * k2 + 1) * va + (k3 - 2 * k2 + k) * h * m0 + (3 * k2 - 2 * k3) * vb + (k3 - k2) * h * m1;
  }
  return keys.at(-1)[1];
};

// A screenshot occasionally never returns. Playwright queues screenshots, so a retry on the same page waits behind
// the stuck one and can never succeed: the whole take is captured again in a fresh browser instead.
const shoot = async (page, path) => {
  if (!path.startsWith('out/')) throw new Error(`frame path outside out/: ${path}`);
  return page.screenshot({ path, type: 'jpeg', quality: 95, timeout: 15000 });
};
const stamp = FPS === 60 ? 'frames' : `frames-${FPS}`;
const pick = process.argv[2] || 'all';
// `all` skips shots marked reuse: their frames stay as they are.
const list = pick === 'all' ? SHOTS.filter(s => !s.reuse) : SHOTS.filter(s => pick.split(',').includes(s.id));
// Consecutive shots of the same take share one browser and one clock.
const takes = [];
for (const s of list) { const last = takes.at(-1); if (s.take && last?.[0].take === s.take && SHOTS.indexOf(s) === SHOTS.indexOf(last.at(-1)) + 1) last.push(s); else takes.push([s]); }
const report = [];
// Every quarter second, the readable text of the frame and its box on the 1080p output go into a ledger, for the provenance and safe-area checks.
const ledger = {}, painted = {};
const SHUTTLE_FILE = `out/review/shuttle-at-${FPS}fps.json`;
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
const ARENA_READY = () => { const c = document.querySelector('.mc-chapter'), v = document.querySelector('.mc-canvas'); return c.dataset.renderer === 'webgl' && v.dataset.robotModel === 'mc-kit' && v.dataset.weaponAssets === 'kenney-cc0'; };
// A pinned 3D chapter on screen that has not drawn yet: its scene was still loading when the scroll reached it.
const UNBUILT = () => [...document.querySelectorAll('.mc-scene-pin')].filter(el => { const r = el.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && !el.dataset.renderer; }).length;

let active = null;
const captureCard = async (shot, attempt) => {
  const t0 = Date.now(), out = `out/${stamp}/${shot.id}`, frames = Math.round(shot.seconds * FPS);
  const { browser, page, errors } = active = await openStage({ width: 1920, height: 1080, dsf: 1, url: `${ORIGIN}/video-demo/sff-homepage/${shot.card}`, stageText: false });
  await step(page); await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.__release());
  for (let i = 0; i < frames; i++) { await step(page); await note(page, shot.id, i / FPS, 1); await shoot(page, `${out}/${String(i).padStart(5, '0')}.jpg`); }
  report.push({ id: shot.id, frames, errors, attempt, seconds: Math.round((Date.now() - t0) / 1000) });
  console.log(JSON.stringify(report.at(-1)));
  await browser.close();
};

const captureTake = async (take, attempt) => {
  for (const shot of take) {
    delete ledger[shot.id];
    const out = `out/${stamp}/${shot.id}`;
    fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  }
  const first = take[0];
  if (first.card) return captureCard(first, attempt);
  const [width, height] = first.viewport || [1280, 720], scale = 1920 / width;
  const shuttleAt = first.shuttleFrom ? JSON.parse(fs.readFileSync(SHUTTLE_FILE, 'utf8')) : null;
  const { browser, page, errors } = active = await openStage({ width, height, extraCss: STAGE_CSS + take.map(s => s.css || '').join('\n'), loadout: first.loadout || null, holdNavigation: take.some(s => s.holdNavigation), shuttleAt, pageDpr: first.pageDpr || null, stageText: !first.url, ...(first.url ? { url: `${ORIGIN}/${first.url}` } : {}) });
  const scrolled = !first.url;
  if (scrolled) await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await step(page);
  await page.waitForTimeout(200);
  const g = scrolled ? await page.evaluate(sectionGeometry) : {};
  const resolve = v => {
    if (typeof v === 'number') return v;
    const m = /^(\w+)([+-]\d+)?$/.exec(v);
    return g[m[1]].top + Number(m[2] || 0);
  };
  const keysOf = shot => shot.keys.map(([a, v, kind]) => [a, typeof v === 'number' ? pinnedY(g[shot.section], v) : v.s ? pinnedY(g[v.s], v.p) : resolve(v.y), kind]);
  const yAt = (shot, t) => scrolled ? track(keysOf(shot), t) : null;
  // each shot of a take picks up at rest exactly where the one before it stopped
  for (let i = 1; i < take.length; i++) {
    const end = yAt(take[i - 1], take[i - 1].seconds), start = yAt(take[i], 0);
    if (Math.abs(end - start) > 1) throw new Error(`${take[i].id} starts at y ${start}, but ${take[i - 1].id} ends at y ${end}`);
  }
  const yStart = yAt(first, 0);
  // the arriving page: its guardian's modules and models load on real time once the fake clock has passed the page's delay
  if (first.url) { for (let i = 0; i < 90; i++) await step(page); await page.waitForLoadState('networkidle'); await page.waitForTimeout(500); }
  const arena = !!first.arena, ready = first.ready ?? (first.section && g[first.section] && first.section !== 'fieldsTrack' ? `#${first.section} .mc-scene-pin` : null);
  await warm(page, { y: yStart, timeoutMs: 30000, until: arena ? ARENA_READY
    : ready ? new Function(`return !!document.querySelector(${JSON.stringify(ready)})?.dataset.renderer`) : null });
  // Silent settle to a fixed step count: textures are in, the arena's camera has caught up with its target,
  // and however long loading took, every run reaches frame 0 at the same fake-clock time.
  const warmSteps = (arena ? 8 : 4) * FPS;
  await page.waitForTimeout(400);
  const overrun = stepsTaken() > warmSteps;
  while (stepsTaken() < warmSteps) await step(page, { y: yStart });
  const VEILED = 'canvas.mc-stage, [data-tags="hero"]';
  // the same dark as the last frame of the warp, doorway glow where it was, ready for the replayed arrival
  if (first.shuttleFrom) await page.evaluate(({ x, y }) => { const r = document.documentElement; r.classList.remove('is-shuttle-out'); r.dataset.shuttle = 'econ'; r.style.setProperty('--shuttle-x', `${x}%`); r.style.setProperty('--shuttle-y', `${y}%`); window.scrollTo({ top: document.getElementById('track-econ').getBoundingClientRect().top + scrollY - 36, behavior: 'instant' }); }, shuttleAt);
  if (first.veil) await page.evaluate(sel => { for (const c of document.querySelectorAll(sel)) c.style.opacity = '0'; }, VEILED);
  if (!first.releaseAt) await page.evaluate(() => window.__release());

  for (const shot of take) {
    const t0 = Date.now(), out = `out/${stamp}/${shot.id}`, frames = Math.round(shot.seconds * FPS), mismatches = [], unbuilt = [];
    // The arena loads as the scroll nears it, on real time: by its first frame it has been on screen for a while.
    if (shot.arena && shot !== first) {
      let ok = false;
      for (let w = 0; w < 300 && !(ok = await page.evaluate(ARENA_READY)); w++) await page.waitForTimeout(200);
      if (!ok) errors.push(`${shot.id}: the arena was not ready at its first frame`);
    }
    const boxExtents = {}, boxOutside = [];
    const swapAt = (shot.swaps || []).map(p => { for (let f = 0; ; f++) if (track(shot.keys, f / FPS) >= p) return f / FPS; });
    const events = [...(shot.at || []), ...(shot.releaseAt ? [[shot.releaseAt, 'window.__release()']] : [])].sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < frames; i++) {
      const t = i / FPS, y = yAt(shot, t);
      while (events.length && events[0][0] <= t) await page.evaluate(events.shift()[1]);
      if (shot.veil) {
        const k = e2(Math.min(1, Math.max(0, (t - shot.veil[0]) / (shot.veil[1] - shot.veil[0]))));
        await page.evaluate(([sel, k]) => { for (const c of document.querySelectorAll(sel)) c.style.opacity = String(k); }, [VEILED, k]);
      }
      for (const f of shot.fades || []) {
        const [a, b] = f.at, v = t <= a ? f.from : t >= b ? f.to : f.from + (f.to - f.from) * e2((t - a) / (b - a));
        await page.evaluate(([sel, v]) => { for (const el of document.querySelectorAll(sel)) el.style.filter = v >= 1 ? '' : `opacity(${v})`; }, [f.sel, v]);
      }
      if (swapAt.length) {
        const level = swapAt.reduce((v, at) => v * (t < at - .22 || t >= at + .3 ? 1 : t < at ? 1 - io((t - at + .22) / .22) : e2((t - at) / .3)), 1);
        await page.evaluate(v => { document.querySelector('.mc-copy').style.filter = v >= 1 ? '' : `opacity(${v})`; }, level);
      }
      await step(page, { y, rate: shot.rate ? shot.rate.findLast(([a]) => a <= t)[1] : 1 });
      const at = await page.evaluate(() => ({ y: scrollY, p: Number(document.querySelector('.mc-chapter')?.dataset.progress) }));
      if (scrolled && Math.abs(at.y - y) > 1) mismatches.push({ i, want: y, got: at.y });
      if (scrolled && await page.evaluate(UNBUILT)) unbuilt.push(i);
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
    if (shot.holdNavigation) fs.writeFileSync(SHUTTLE_FILE, await page.evaluate(() => sessionStorage.getItem('metacase-shuttle')));
    painted[shot.id] = await page.evaluate(() => [...window.__painted]);
    const rendererState = await page.evaluate(() => ({ arena: document.querySelector('.mc-chapter')?.dataset.renderer || null, lenis: !!window.__lenis, fonts: document.fonts.status }));
    report.push({ id: shot.id, take: shot.take || null, frames, errors: [...errors], attempt, ...(shot === first ? { warmOverrun: overrun } : {}), ...(shot.auditBoxes ? { boxExtents, boxOutsideFrames: boxOutside.length, boxOutsideFirst: boxOutside.slice(0, 3) } : {}), mismatches: mismatches.slice(0, 5), mismatchCount: mismatches.length, unbuiltFrames: unbuilt.length, unbuiltFirst: unbuilt.slice(0, 5), rendererState, seconds: Math.round((Date.now() - t0) / 1000) });
    console.log(JSON.stringify(report.at(-1)));
  }
  await browser.close();
};

const ledgerPath = `out/review/onscreen-${FPS}fps.json`, paintedPath = `out/review/painted-${FPS}fps.json`;
fs.mkdirSync('out/review', { recursive: true });
for (const take of takes) {
  for (let attempt = 1; ; attempt++) {
    const before = report.length;
    try { await captureTake(take, attempt); break; }
    catch (error) {
      await active?.browser.close().catch(() => {});
      report.length = before;
      if (attempt >= 4 || error.name !== 'TimeoutError') throw error;
      console.error(`${take.map(s => s.id).join(',')}: attempt ${attempt} stalled, capturing the take again`);
    }
  }
  // Written after every take and checked here, so a later crash can never leave stale results looking fresh.
  for (const shot of take) {
    const written = fs.readdirSync(`out/${stamp}/${shot.id}`).filter(f => f.endsWith('.jpg')).length, wanted = Math.round(shot.seconds * FPS);
    if (written !== wanted) throw new Error(`${shot.id}: ${written} frames on disk, expected ${wanted}`);
    const previous = fs.existsSync(ledgerPath) ? JSON.parse(fs.readFileSync(ledgerPath, 'utf8')) : {};
    fs.writeFileSync(ledgerPath, JSON.stringify({ ...previous, [shot.id]: ledger[shot.id] }, null, 2));
    const paintedBefore = fs.existsSync(paintedPath) ? JSON.parse(fs.readFileSync(paintedPath, 'utf8')) : {};
    fs.writeFileSync(paintedPath, JSON.stringify({ ...paintedBefore, [shot.id]: painted[shot.id] }, null, 2));
  }
}
fs.writeFileSync(`out/review/capture-report-${FPS}fps.json`, JSON.stringify(report, null, 2));

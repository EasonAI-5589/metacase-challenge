// Deterministic capture harness: opens the locked homepage on a fake clock and steps it frame by frame.
// Everything here is shoot-only. It injects temporary CSS at runtime and never touches the site's files.
import { chromium } from 'playwright';

export const ORIGIN = process.env.SFF_ORIGIN || 'http://127.0.0.1:4199';
export const FPS = 60;

// Capture-only CSS. Scrollbars and the cursor go, and the figures that contradict each other on the
// locked page (handoff §3) stay out of frame until Eason decides which set is right.
export const SHOOT_CSS = `
  html, body { scrollbar-width: none !important; cursor: none !important; }
  html::-webkit-scrollbar, body::-webkit-scrollbar { display: none !important; }
  * { cursor: none !important; caret-color: transparent !important; }
  html, html:not(.lenis) { scroll-behavior: auto !important; }
  /* §3: 208 / 209 / 187 records on the hero and network labels */
  [data-tags="hero"] i, [data-tags="world"] i { display: none !important; }
  /* §3: the 604 counter in chapter 04 */
  .mc-catalogue-meta { visibility: hidden !important; }
  /* §3: sixteen categories and the per-domain counts in chapter 05 */
  [data-mc-code], [data-mc-overview], .mc-endnote, [data-mc-directory-title] { display: none !important; }
  /* Interaction hints that mean nothing on a stage */
  .mc-scroll-cue, .mc-access, .mc-directory-hint, .skip-link { display: none !important; }
`;

export async function openStage({ width = 1280, height = 720, dsf = 1920 / width, headless = true, language = 'en', extraCss = '', url = `${ORIGIN}/index.html` } = {}) {
  const browser = await chromium.launch({
    channel: 'chrome', headless,
    args: ['--enable-gpu', '--use-angle=metal', '--ignore-gpu-blocklist', '--enable-webgl', '--disable-gpu-vsync', '--disable-frame-rate-limit', '--force-color-profile=srgb', '--hide-scrollbars', '--disable-features=PaintHolding'],
  });
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dsf, colorScheme: 'dark', reducedMotion: 'no-preference' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('response', r => { if (r.url().startsWith(ORIGIN) && r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  // Lenis off (v2.js falls back to native scrolling), and no other network: the shoot is the local locked commit.
  await page.route('**/lenis@*/**', r => r.abort());
  await page.route(/^https:\/\//, r => r.abort());
  await page.addInitScript(([lang, css]) => {
    window.__realRAF = window.requestAnimationFrame.bind(window);
    window.__realPerf = performance.now.bind(performance);
    try { localStorage.setItem('inferencenet-language', lang); localStorage.removeItem('metacase-loadout'); } catch {}
    const inject = () => { const s = document.createElement('style'); s.dataset.shoot = '1'; s.textContent = css; (document.head || document.documentElement).append(s); };
    if (document.head) inject(); else document.addEventListener('DOMContentLoaded', inject, { once: true });
    // seek every CSS/WAAPI animation to the fake clock; finished ones really finish, so their promises resolve
    window.__holdUntil = 0;
    window.__seekAnimations = () => {
      const now = performance.now();
      for (const a of document.getAnimations()) {
        if (a.__seen === undefined) a.__seen = Math.max(now, window.__holdUntil || 0);
        const timing = a.effect?.getComputedTiming?.();
        const end = timing?.endTime ?? 0, local = Math.max(0, now - a.__seen);
        try {
          if (Number.isFinite(end) && local >= end && a.playState !== 'finished') a.finish();
          else if (!Number.isFinite(end) || local < end) { a.pause(); a.currentTime = local; }
        } catch {}
      }
    };
    window.__settle = () => new Promise(done => window.__realRAF(() => window.__realRAF(() => { const c = new MessageChannel(); c.port1.onmessage = () => done(); c.port2.postMessage(0); })));
  }, [language, SHOOT_CSS + extraCss]);
  // Paused before navigation: nothing on the page runs on its own time until a step advances the clock.
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { browser, context, page, errors };
}

const stepCounter = { i: 0 };
export const frameDt = i => Math.round((i + 1) * 1000 / FPS) - Math.round(i * 1000 / FPS);

// Advance the page by one video frame, with scroll set first so rAF callbacks read the new position.
export async function step(page, { y = null, sync = null } = {}) {
  const dt = frameDt(stepCounter.i++);
  await page.evaluate(([y]) => {
    if (y !== null) { window.scrollTo({ top: y, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); }
  }, [y]);
  await page.clock.runFor(dt);
  await page.evaluate(() => { window.__seekAnimations(); return window.__settle(); });
  if (sync) await sync(page);
}

// Warm up without showing: lets lazy modules, textures and GLBs load while the clock barely moves.
export async function warm(page, { y = null, until = null, timeoutMs = 60000 } = {}) {
  const start = Date.now();
  for (;;) {
    await step(page, { y });
    if (!until || await page.evaluate(until)) { await page.waitForTimeout(150); await step(page, { y }); if (!until || await page.evaluate(until)) return true; }
    if (Date.now() - start > timeoutMs) return false;
    await page.waitForTimeout(100);
  }
}

export const sectionGeometry = `(() => {
  const out = {};
  for (const id of ['top','metacase','structure','net','fields','arena','rules','tracks','team']) {
    const s = document.getElementById(id), pin = s.querySelector('.mc-scene-pin, .mc-pin, [data-fieldbooks]');
    const r = s.getBoundingClientRect();
    out[id] = { top: r.top + scrollY, height: s.offsetHeight, pinTop: pin ? parseFloat(getComputedStyle(pin).top) || 0 : 0, pinH: pin ? pin.offsetHeight : 0 };
  }
  const track = document.querySelector('.mc-fieldbooks-track'), fb = document.querySelector('[data-fieldbooks]');
  if (track) { const r = track.getBoundingClientRect(); out.fieldsTrack = { top: r.top + scrollY, height: track.offsetHeight, pinTop: parseFloat(getComputedStyle(fb).top) || 0, pinH: fb.offsetHeight }; }
  return out;
})()`;

// scrollY that puts a pinned chapter at the given 0..1 progress
export const pinnedY = (g, p) => g.top - g.pinTop + p * (g.height - g.pinH);

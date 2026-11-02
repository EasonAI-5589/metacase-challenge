// Deterministic capture harness: opens the locked homepage on a fake clock and steps it frame by frame.
// Everything here is shoot-only. It injects temporary CSS at runtime and never touches the site's files.
import { chromium } from 'playwright';

export const ORIGIN = process.env.SFF_ORIGIN || 'http://127.0.0.1:4199';
export const FPS = Number(process.env.FPS || 60);

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

// Big-screen framing, shoot-only: the page as a visitor sees it (its header, section nav, chapter subtitles and body copy
// all stay), with the page's own short labels raised to a size the back of a hall can read.
// Output is 1.5x these CSS pixels, so 19px here is 28.5px on screen and 48px is 72px.
export const STAGE_CSS = `
  /* Stage safe area: 96 px left and right, 54 px top and bottom on the 1080p output. The page's .wrap ignores
     --mc-gutter (only chapter 05 reads it), so every container that starts a text edge is set here. */
  :root { --mc-gutter: 64px !important; }
  .v2-footer { display: none !important; }
  .mc-home .wrap { max-width: none !important; padding: 0 var(--mc-gutter) !important; margin: 0 !important; }

  /* hero: the page's own lead and buttons, the hosting line */
  .mc-eyebrow { font-size: 19px !important; }
  .mc-hosts { display: grid !important; gap: 12px !important; justify-items: start !important; margin-top: 28px !important; }
  .mc-host { font-size: 21px !important; letter-spacing: 0 !important; text-transform: none !important; font-family: var(--font-sans) !important; color: var(--text-secondary) !important; }
  [data-tags="hero"] span { font-size: 19px !important; }

  /* chapter heads */
  .mc-label { font-size: 19px !important; letter-spacing: .02em !important; }
  .mc-label > span { font-size: 19px !important; height: 30px !important; min-width: 40px !important; }
  .mc-scene-head { position: relative; z-index: 3; }
  .mc-scene-pin::after { content: ""; position: absolute; inset: 0 0 auto 0; height: 36%; z-index: 1; pointer-events: none; background: linear-gradient(180deg, color-mix(in oklab, var(--bg-canvas) 82%, transparent) 30%, transparent); }

  /* captions and rails: the short label stays, the long sentence goes */
  .mc-captions span, .mc-captions small { display: none !important; }
  .mc-captions .mc-caption-statement span { display: block !important; white-space: nowrap !important; }
  .mc-captions .mc-caption-statement { max-width: none !important; }
  .mc-captions b { font-size: 25px !important; letter-spacing: .01em !important; }
  .mc-rail { zoom: 1.5; }
  .mc-scene-foot, .mc-bottom { bottom: 36px !important; }
  .mc-captions { bottom: 104px !important; padding: 0 !important; }
  .mc-captions li { left: var(--mc-gutter) !important; }
  /* a caption leaves before the next one arrives, so two never stack in the same spot */
  .mc-captions li { transition-duration: .25s !important; transition-delay: 0s !important; }
  .mc-captions li.current { transition-delay: .25s !important; }

  /* chapter 01 stage notes */
  .mc-notes li { width: 350px !important; padding: 18px 20px !important; translate: -6px -50% !important; }
  .mc-notes li::before { width: calc(var(--lead, 0px) - 6px) !important; }
  .mc-notes li::after { right: calc(100% - 9px + var(--lead, 0px)) !important; }
  .mc-notes span, .mc-notes em { display: none !important; }
  .mc-notes b { font-size: 19px !important; }
  .mc-notes strong { font-size: 25px !important; line-height: 1.15 !important; }

  /* labels riding on the 3D */
  .mc-tags { z-index: 2 !important; }
  .mc-tags span { font-size: 19px !important; }
  .mc-tags i { font-size: 19px !important; letter-spacing: 0 !important; text-transform: none !important; }

  /* chapter 04 */
  .mc-catalogue-meta { display: none !important; }
  .mc-fields-rail { zoom: 1 !important; }
  .mc-book .mc-page-desc { display: none !important; }
  .mc-book .mc-page-name { font-size: 24px !important; line-height: 1.16 !important; }
  .mc-book .mc-call { font-size: 19px !important; }
  .mc-fbook-label small { font-size: 19px !important; }
  .is-books .mc-fbook:not([data-slot="center"]) .mc-fbook-title { font-size: 20px !important; }
  .mc-fbook-n { font-size: 19px !important; }
  .is-books .mc-fbook[data-slot="center"] .mc-fbook-title { font-size: 34px !important; }

  /* chapter 05 */
  .mc-copy { max-width: none !important; width: auto !important; }
  .mc-copy h2 { font-size: 48px !important; line-height: 1.04 !important; white-space: nowrap !important; }
  .mc-enter, .mc-wheel-label, .mc-phase-index { display: none !important; }
  .mc-loadout { zoom: 1.3; left: calc(var(--mc-gutter) / 1.3) !important; width: 360px !important; max-width: none !important; bottom: 28px !important; padding: 14px 16px !important; transition: opacity .35s var(--ease-standard) !important; }
  .mc-chapter:not([data-phase="1"]) .mc-loadout { opacity: 0 !important; }
  .mc-loadout-summary, .mc-loadout-type, .mc-carried, .mc-model-roster { display: none !important; }
  .mc-bottom { transition: opacity .3s var(--ease-standard); }
  .mc-chapter[data-phase="1"] .mc-bottom { opacity: 0 !important; }
  .mc-step-label, .mc-loadout-label { font-size: 14.5px !important; }
  /* a media query on the page sets these to nowrap and clips the third model name */
  .mc-chapter[data-phase="1"] .mc-variant-chips { flex-wrap: wrap !important; overflow: visible !important; }
  .mc-loadout .mc-chip, .mc-loadout .mc-model-btn, .mc-loadout .mc-effort-btn, .mc-loadout .mc-confirm { font-size: 14px !important; }
  .mc-loadout .mc-confirm { padding: 8px 12px !important; }
  [data-mc-equipped] { font-size: 21px !important; }
  /* the wheel stands clear of the wider panel */
  .mc-wheel { translate: 60px 0 !important; }
  /* type only: zoom would scale the inline translate too and pull the labels out of their doorways */
  .mc-portal.is-compact em { font-size: 19px !important; }
  .mc-portal.is-compact i { width: 32px !important; height: 32px !important; }
  /* the link on a room's threshold and the weapon's tag, on the way through the tunnels */
  .mc-portal.is-active small { font-size: 19px !important; }
  .mc-portal.is-active b { font-size: 22px !important; }
  .mc-floating-harness small { display: none !important; }
  .mc-floating-harness strong { font-size: 19px !important; }
  .mc-domain-directory { display: none !important; }
  .mc-corner { font-size: 19px !important; }

  /* chapter 07: the numbers are the picture */
  .mc-results-card { display: block !important; padding: 56px 64px !important; }
  .mc-results-actions, .mc-submit, .mc-results-stats small[data-no-translate] { display: none !important; }
  .mc-results-head h2 { font-size: 52px !important; }
  .mc-results-stats { margin-top: 44px !important; gap: 20px !important; align-items: stretch !important; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1.12fr) minmax(0, 1fr) !important; }
  .mc-results-stats li { padding: 32px 28px 30px !important; }
  .mc-results-stats b { font-size: 116px !important; }
  .mc-results-stats span { font-size: 25px !important; line-height: 1.2 !important; margin-top: 14px; text-wrap: balance; }
  .mc-results-stats small { font-size: 19px !important; line-height: 1.3 !important; color: var(--text-secondary) !important; margin-top: 10px; text-wrap: balance; }

  /* chapter 08: host and the two partner labs in one frame */
  .mc-join { padding: 24px 0 !important; }
  .mc-join-card { display: block !important; }
  .mc-join-copy { padding: 40px 56px 0 !important; background: none !important; }
  .mc-join-copy h2 { font-size: 52px !important; margin-top: 12px !important; }
  .mc-join-copy .mc-cta, .mc-join-card > .mc-art, .mc-org-note, .mc-team-students, .mc-person span { display: none !important; }
  .mc-team { display: grid !important; grid-template-columns: minmax(0, 1fr) minmax(0, 2.1fr) !important; gap: 20px !important; padding: 24px 56px 40px !important; margin: 0 !important; border: 0 !important; background: none !important; align-items: stretch !important; }
  .mc-org-host { grid-column: auto !important; display: flex !important; flex-direction: column !important; gap: 14px !important; justify-content: flex-start !important; padding: 20px !important; }
  .mc-org-host .mc-person-lead { padding: 14px 0 0 !important; border: 0 !important; background: none !important; box-shadow: none !important; border-top: 1px solid var(--border-hairline) !important; border-radius: 0 !important; }
  .mc-org-host .mc-person-lead img { width: 64px !important; height: 64px !important; }
  .mc-team-partners { grid-column: auto !important; }
  .mc-team-partners .mc-orgs { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 20px !important; }
  .mc-org h3, .mc-org h3 a, .mc-org-host h3 a { font-size: 30px !important; line-height: 1.1 !important; letter-spacing: -.02em !important; }
  .mc-org-full { font-size: 19px !important; line-height: 1.3 !important; }
  .mc-team-kicker { font-size: 19px !important; letter-spacing: 0 !important; text-transform: none !important; }
  .mc-person a { font-size: 21px !important; }
  .mc-person b { font-size: 19px !important; }
`;

// Page text trimmed to an exact substring for the frame. The DOM of the running shoot only, never the files.
export async function applyStageText(page) {
  await page.evaluate(() => {
    // fixed line break for the page's sentence, so "experience-based" is never split at its hyphen
    const statement = document.querySelector('#net .mc-caption-statement span');
    if (statement) statement.innerHTML = 'A foundation for<br>experience-based AI.';
    const small = document.querySelector('.mc-results-stats li:first-child small');
    if (small) small.textContent = '3 fields × 200 tasks · 18 classes';
  });
}

// Banners painted in the tunnels that state the per-field record counts handoff §3 keeps out of frame.
export const PAINT_HIDDEN = 'candidate records';

// How many frames this page has been stepped: padded to a fixed count before a shot, so its scenes' clocks start alike.
export const stepsTaken = () => stepCounter.i;

export async function openStage({ width = 1280, height = 720, dsf = 1920 / width, headless = true, language = 'en', extraCss = '', url = `${ORIGIN}/index.html`, stageText = true, loadout = null, shuttleAt = null, pageDpr = null, holdNavigation = false } = {}) {
  stepCounter.i = 0; stepCounter.due = 0;
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
  // The portal's warp ends by leaving for the Challenge page, which is its own shot: the iris finishes here instead.
  if (holdNavigation) await page.route('**/challenge.html*', r => r.abort('aborted'));
  await page.addInitScript(([lang, css, saved, at, dpr, hidden]) => {
    if (dpr) Object.defineProperty(window, 'devicePixelRatio', { get: () => dpr });
    try { if (at) sessionStorage.setItem('metacase-shuttle', JSON.stringify(at)); } catch {}
    // Text painted into canvases is logged for the provenance check. The tunnels' banners carry the contradictory per-field
    // records (handoff §3, arena-data.js danmaku): such a banner is cleared to nothing, so it never reaches the scene.
    // The open book's 200 ms fade uses a strong ease-out that drops it in 6 frames, the biggest single jump in the film: linear here.
    const animate = Element.prototype.animate;
    Element.prototype.animate = function (frames, options) {
      const fadesOut = this.classList?.contains('mc-book') && Array.isArray(frames) && frames.at(-1)?.opacity === 0;
      return animate.call(this, frames, fadesOut ? { ...options, easing: 'linear' } : options);
    };
    window.__painted = new Set();
    const paint = CanvasRenderingContext2D.prototype.fillText, banned = new RegExp(hidden, 'i');
    CanvasRenderingContext2D.prototype.fillText = function (text, ...rest) {
      window.__painted.add(String(text));
      if (banned.test(text)) { this.clearRect(0, 0, this.canvas.width, this.canvas.height); return; }
      return paint.call(this, text, ...rest);
    };
    window.__realRAF = window.requestAnimationFrame.bind(window);
    window.__realPerf = performance.now.bind(performance);
    try { localStorage.setItem('inferencenet-language', lang); if (saved) localStorage.setItem('metacase-loadout', saved); else localStorage.removeItem('metacase-loadout'); } catch {}
    const inject = () => { const s = document.createElement('style'); s.dataset.shoot = '1'; s.textContent = css; (document.head || document.documentElement).append(s); };
    if (document.head) inject(); else document.addEventListener('DOMContentLoaded', inject, { once: true });
    // seek every CSS/WAAPI animation to the fake clock; finished ones really finish, so their promises resolve
    window.__holdUntil = Infinity;
    window.__release = () => { window.__holdUntil = 0; const now = performance.now(); for (const a of document.getAnimations()) if (a.__seen === Infinity) a.__seen = now; };
    window.__seekAnimations = () => {
      const now = performance.now();
      for (const a of document.getAnimations()) {
        if (a.__seen === undefined) a.__seen = window.__holdUntil === Infinity ? Infinity : now;
        const timing = a.effect?.getComputedTiming?.();
        const end = timing?.endTime ?? 0, local = Math.max(0, now - a.__seen);
        try {
          if (Number.isFinite(end) && local >= end && a.playState !== 'finished') a.finish();
          else if (!Number.isFinite(end) || local < end) { a.pause(); a.currentTime = local; }
        } catch {}
      }
    };
    window.__settle = () => new Promise(done => window.__realRAF(() => window.__realRAF(() => { const c = new MessageChannel(); c.port1.onmessage = () => done(); c.port2.postMessage(0); })));
  }, [language, SHOOT_CSS + extraCss, loadout ? JSON.stringify(loadout) : null, shuttleAt, pageDpr, PAINT_HIDDEN]);
  // Paused before navigation: nothing on the page runs on its own time until a step advances the clock.
  await page.clock.install({ time: 0 });
  await page.clock.pauseAt(1000);
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (stageText) await applyStageText(page);
  return { browser, context, page, errors };
}

const stepCounter = { i: 0 };
// During warm-up the clock is stepped at the same size; only captured frames are kept.
export const frameDt = i => Math.round((i + 1) * 1000 / FPS) - Math.round(i * 1000 / FPS);

// Advance the page by one video frame, with scroll set first so rAF callbacks read the new position.
export async function step(page, { y = null, sync = null, rate = 1 } = {}) {
  // `rate` slows the page's own clock against film time; scroll is keyed to film time and is not affected.
  stepCounter.due = (stepCounter.due || 0) + frameDt(stepCounter.i++) * rate;
  const dt = Math.floor(stepCounter.due);
  stepCounter.due -= dt;
  await page.evaluate(([y]) => {
    if (y !== null) { window.scrollTo({ top: y, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); }
  }, [y]);
  if (dt > 0) await page.clock.runFor(dt);
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

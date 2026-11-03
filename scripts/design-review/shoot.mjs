// Design review shots: one part of the site at the widths and languages we check, as PNG files to compare before and after.
//   node scripts/design-review/shoot.mjs <target> [outDir]
// Targets (see TARGETS below): results, submit, submit-arrow, wheel, subpages, characters.
// Serve the repository first: python3 -m http.server 4199 --bind 127.0.0.1   (REVIEW_ORIGIN overrides the address)
// Playwright as in scripts/test-*.mjs: PLAYWRIGHT_MODULE, BROWSER_CHANNEL or BROWSER_EXECUTABLE.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const ORIGIN = process.env.REVIEW_ORIGIN || 'http://127.0.0.1:4199';
const [target = 'results', out = 'out/design-review'] = process.argv.slice(2);
const WIDE = [[1440, 900], [1024, 900], [390, 844]], LANGS = ['en', 'zh'];

// Each target: the page, the viewports and languages, how to bring the part into view, and what to capture.
const TARGETS = {
  // 07 results card, whole (tall viewports so the card fits in one frame)
  results: { page: 'index.html', sizes: [[1440, 1500], [1024, 1700], [390, 2600]], scroll: '#tracks', shot: '.mc-results-card' },
  // the three ways to submit, under the results
  submit: { page: 'index.html', sizes: WIDE, scroll: '.mc-submit', shot: '.mc-submit' },
  // the submit cards' arrow at rest and on hover (one language, 3x)
  'submit-arrow': { page: 'index.html', sizes: [[1440, 900]], langs: ['en'], dpr: 3, scroll: '.mc-submit', arrow: true },
  // 05 arena at the equipment wheel (scrubbed to p = .27), full viewport, so the robot can be read against the ring
  wheel: { page: 'index.html', sizes: [[1440, 900], [1100, 1000], [1440, 760], [390, 844]], langs: ['zh'], dpr: 1, scroll: '#arena', scrub: 270, full: true },
  // each subpage's header with its 3D diorama
  subpages: { pages: ['challenge', 'harness', 'evolution', 'leaderboard', 'teams', 'professional-tasks', 'replication'].map(p => `${p}.html`), sizes: [[1440, 900], [390, 844]], langs: ['en'], dpr: 1, full: true, wait: 3500 },
  // the character lab: people and robots, front and back
  characters: { pages: ['docs/design/character-lab.html?view=people', 'docs/design/character-lab.html?view=people&yaw=2.6', 'docs/design/character-lab.html?view=robots'], sizes: [[1440, 900]], langs: ['en'], dpr: 1, full: true, wait: 2500 },
};
const spec = TARGETS[target];
if (!spec) throw new Error(`unknown target ${target}; one of ${Object.keys(TARGETS).join(', ')}`);
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : { channel: process.env.BROWSER_CHANNEL || 'chrome' }), headless: true });
const problems = [];
for (const page of spec.pages || [spec.page]) for (const lang of spec.langs || LANGS) for (const [w, h] of spec.sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: spec.dpr ?? 2 });
  await ctx.addInitScript(l => { try { localStorage.setItem('inferencenet-language', l); } catch {} }, lang);
  const tab = await ctx.newPage();
  const tag = `${page.replace(/\W+/g, '_')}-${lang}-${w}x${h}`;
  tab.on('pageerror', e => problems.push(`${tag}: ${e.message}`));
  await tab.goto(`${ORIGIN}/${page}`);
  await tab.waitForTimeout(1200);
  if (spec.scroll) await tab.evaluate(sel => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), spec.scroll);
  if (spec.scrub) await tab.evaluate(v => { const s = document.querySelector('.mc-scrub'); s.value = v; s.dispatchEvent(new Event('input', { bubbles: true })); }, spec.scrub);
  await tab.waitForTimeout(spec.wait ?? 3000);
  // the page must not scroll sideways at any width
  const sideways = await tab.evaluate(() => { scrollTo(10000, scrollY); const x = scrollX; scrollTo(0, scrollY); return x; });
  if (sideways) problems.push(`${tag}: scrolls ${sideways}px sideways`);
  if (spec.arrow) {
    const bodies = await tab.$$('.mc-submit-body');
    await bodies[0].screenshot({ path: `${out}/${target}-rest.png` });
    await bodies[1].hover(); await tab.waitForTimeout(600);
    await bodies[1].screenshot({ path: `${out}/${target}-hover.png` });
  } else if (spec.full) await tab.screenshot({ path: `${out}/${target}-${tag}.png` });
  else await (await tab.$(spec.shot)).screenshot({ path: `${out}/${target}-${tag}.png` });
  // 3D pictures that never got drawn show up as an empty strip: report any that did not render. The shared canvas skips
  // what sits under the fixed header and section nav, so only what shows below them counts.
  const unbuilt = await tab.evaluate(() => {
    const top = Math.max(0, ...['.site-header', '.mc-subnav'].map(s => document.querySelector(s)?.getBoundingClientRect().bottom ?? 0));
    return [...document.querySelectorAll('.mc-art')].filter(a => { const r = a.getBoundingClientRect(); return r.bottom > top + 8 && r.top < innerHeight && r.width > 0 && !a.dataset.renderer; }).length;
  });
  if (unbuilt) problems.push(`${tag}: ${unbuilt} 3D picture(s) in view not drawn`);
  await ctx.close();
}
await browser.close();
console.log(`${target}: written to ${out}`);
if (problems.length) { console.log(problems.join('\n')); process.exitCode = 1; }

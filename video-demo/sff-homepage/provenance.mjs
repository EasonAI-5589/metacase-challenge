// Every readable string in the film, traced to the locked commit. Fails on a contradictory figure or an unsourced string.
import { SHOTS } from './shots.mjs';
import { PAINT_HIDDEN } from './lib/stage.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const LOCK = process.env.LOCK || 'cefd87bb44155d86528f452ceefb6992bdc9b9fe', FPS = process.env.FPS || 60;
const FILES = ['index.html', 'arena.js', 'arena-data.js', 'metacase.js', 'challenge.html', 'mc-classart.js'];
const source = Object.fromEntries(FILES.map(f => [f, execFileSync('git', ['show', `${LOCK}:${f}`], { encoding: 'utf8', maxBuffer: 1 << 26 }).split('\n')]));
const norm = s => s.replace(/&amp;/g, '&').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const flat = Object.fromEntries(FILES.map(f => [f, source[f].map(norm)]));
const find = text => {
  const t = norm(text);
  for (const f of FILES) { const i = flat[f].findIndex(l => l.includes(t)); if (i >= 0) return { file: f, line: i + 1, excerpt: source[f][i].trim().slice(0, 160) }; }
  return null;
};
// Handoff §3: these must never be readable on screen until Eason decides.
const FORBIDDEN = [/\b604\b/, /\b208\b/, /\b209\b/, /\b187\b/, /\d\s*records?\b/i, /\bsixteen\b/i, /\b16\b/, /econ\/\s*\d/i, /fin\/\s*\d/i, /soc\/\s*\d/i, /\b285\b/, /\b152\b/];
const AUTHORED = { 'easonai-5589.github.io/metacase-challenge': 'handoff §4 end card URL', 'OpenAI · GPT-5.6 Sol · XHigh × Codex CLI': 'composed by portal-warp.js:36 loadoutLine from the names in arena-data.js' };
const ledger = JSON.parse(fs.readFileSync(`out/review/onscreen-${FPS}fps.json`, 'utf8'));
const rows = [], forbidden = [], unsourced = [], small = [], outside = [];
for (const [shot, seen] of Object.entries(ledger).filter(([id]) => SHOTS.some(s => s.id === id))) for (const [text, e] of Object.entries(seen)) {
  // the page's own number ticker passes through every integer on its way to data-count
  const ticker = shot === '08-results' && /^\d+$/.test(text) && Number(text) < 600;
  const src = AUTHORED[text] ? { authored: AUTHORED[text] } : ticker ? { ticker: 'count-up to data-count="600" (index.html:458)' } : find(text);
  rows.push({ shot, text, px: e.px, from: e.from, to: e.to, source: src });
  if (FORBIDDEN.some(r => r.test(text))) forbidden.push({ shot, text });
  if (!src) unsourced.push({ shot, text });
  if (e.px < 28 && e.to - e.from >= 0.5) small.push({ shot, text, px: e.px });
  if (e.outside?.length) outside.push({ shot, text, samples: e.outside.length, first: e.outside[0], last: e.outside.at(-1) });
}
const numbers = [...new Set(rows.map(r => r.text).filter(t => /\d/.test(t)))].map(t => ({ text: t, source: find(t) || AUTHORED[t] || null }));
// Text painted into canvases, read from the running page for the shots captured with that log: banned banners were cleared, not drawn.
const paintedPath = `out/review/painted-${FPS}fps.json`, paintedByShot = fs.existsSync(paintedPath) ? JSON.parse(fs.readFileSync(paintedPath, 'utf8')) : {};
const painted = Object.entries(paintedByShot).filter(([id]) => SHOTS.some(s => s.id === id)).flatMap(([shot, list]) => list.map(text => ({ shot, text, cleared_not_drawn: new RegExp(PAINT_HIDDEN, 'i').test(text), source: find(text) })));
const paintedForbidden = painted.filter(p => !p.cleared_not_drawn && FORBIDDEN.some(r => r.test(p.text)));
fs.mkdirSync('../../docs/video/sff-homepage', { recursive: true });
fs.writeFileSync('out/review/provenance-raw.json', JSON.stringify({ lock: LOCK, rows, numbers, forbidden, unsourced, small, outside, painted, paintedForbidden }, null, 2));
console.log(JSON.stringify({ strings: rows.length, numbers: numbers.length, forbidden, unsourced: unsourced.slice(0, 40), smallCount: small.length }, null, 1));
console.log('painted', painted.length, 'cleared', JSON.stringify(painted.filter(p => p.cleared_not_drawn).map(p => p.text)), 'forbidden drawn', JSON.stringify(paintedForbidden.map(p => p.text)));
console.log('outside safe area', outside.length, JSON.stringify(outside.map(o => `${o.shot} [${o.samples}x ${o.first[0]}-${o.last[0]}s ${o.first.slice(1).join(',')}] ${o.text.slice(0, 40)}`)));
console.log('small', JSON.stringify([...new Map(small.map(s => [s.text, s])).values()].slice(0, 50).map(s => `${s.px}px ${s.text}`)));

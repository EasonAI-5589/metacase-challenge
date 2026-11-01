// Every readable string in the film, traced to the locked commit. Fails on a contradictory figure or an unsourced string.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const LOCK = process.env.LOCK || 'cefd87bb44155d86528f452ceefb6992bdc9b9fe', FPS = process.env.FPS || 60;
const FILES = ['index.html', 'arena.js', 'arena-data.js', 'metacase.js'];
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
const AUTHORED = { 'easonai-5589.github.io/metacase-challenge': 'handoff §4 end card URL' };
const ledger = JSON.parse(fs.readFileSync(`out/review/onscreen-${FPS}fps.json`, 'utf8'));
const rows = [], forbidden = [], unsourced = [], small = [];
for (const [shot, seen] of Object.entries(ledger)) for (const [text, e] of Object.entries(seen)) {
  // the page's own number ticker passes through every integer on its way to data-count
  const ticker = shot === '08-results' && /^\d+$/.test(text) && Number(text) < 600;
  const src = AUTHORED[text] ? { authored: AUTHORED[text] } : ticker ? { ticker: 'count-up to data-count="600" (index.html:458)' } : find(text);
  rows.push({ shot, text, px: e.px, from: e.from, to: e.to, source: src });
  if (FORBIDDEN.some(r => r.test(text))) forbidden.push({ shot, text });
  if (!src) unsourced.push({ shot, text });
  if (e.px < 28 && e.to - e.from >= 0.5) small.push({ shot, text, px: e.px });
}
const numbers = [...new Set(rows.map(r => r.text).filter(t => /\d/.test(t)))].map(t => ({ text: t, source: find(t) || AUTHORED[t] || null }));
fs.mkdirSync('../../docs/video/sff-homepage', { recursive: true });
fs.writeFileSync('out/review/provenance-raw.json', JSON.stringify({ lock: LOCK, rows, numbers, forbidden, unsourced, small }, null, 2));
console.log(JSON.stringify({ strings: rows.length, numbers: numbers.length, forbidden, unsourced: unsourced.slice(0, 40), smallCount: small.length }, null, 1));
console.log('small', JSON.stringify([...new Map(small.map(s => [s.text, s])).values()].slice(0, 50).map(s => `${s.px}px ${s.text}`)));

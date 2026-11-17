/* playground-runs.js — playground.html's last section: the recorded runs of FIN-T1-003 as a grid of
 * model x harness, and a card for the selected run. The numbers and the three notes per run come
 * from playground-runs-data.js, which is generated from the runs' replay records. A cell's colour
 * is its reward on one hue; the reward is also printed in the cell, so colour is never the only cue. */
import { MODEL_CHARACTERS } from './arena-data.js?v=20261028-cascade';
import { MODELS, HARNESSES, RUNS, REPLAYED, PILOT_REWARD, DIMENSIONS } from './playground-runs-data.js?v=20261117-playground';

const table = document.querySelector('[data-pg="table"]'), card = document.querySelector('[data-pg="card"]');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const keep = s => `<span data-no-translate>${esc(s)}</span>`;
const fixed = (n, d) => n.toFixed(d);
const count = n => n.toLocaleString('en-US');
const keyOf = (h, m) => `${h.key}__${m.key}`;
const POINTS = ['How it worked', 'Along the way', 'Where the score came from'];

function drawTable() {
  const head = `<thead><tr><td class="pg-corner"></td>${HARNESSES.map(h => `<th scope="col" data-no-translate>${esc(h.name)}</th>`).join('')}</tr></thead>`;
  const rows = MODELS.map(m => {
    const v = MODEL_CHARACTERS[m.vendor];
    const mark = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${v.color}" fill-rule="${v.rule || 'nonzero'}" d="${v.logo}"/></svg>`;
    const cells = HARNESSES.map(h => {
      const key = keyOf(h, m), run = RUNS[key];
      if (!run) return `<td><span class="pg-empty" title="${esc(m.name)} · ${esc(h.name)}: not run"></span></td>`;
      const label = `${m.name} · ${h.name}: reward ${fixed(run.reward, 3)}`;
      return `<td><button class="pg-cell" type="button" data-key="${key}" style="--v:${run.reward}" aria-pressed="false" aria-label="${esc(label)}" title="${esc(label)}"${key === REPLAYED ? ' data-replayed' : ''}>${run.reward ? fixed(run.reward, 2) : '0'}</button></td>`;
    }).join('');
    return `<tr><th scope="row" data-no-translate>${mark}${esc(m.name)}</th>${cells}</tr>`;
  }).join('');
  table.insertAdjacentHTML('beforeend', `${head}<tbody>${rows}</tbody>`);
}

function flagOf(key, run) {
  const flags = [];
  if (run.redlines.length) flags.push(`<span>Red line</span> ${keep(run.redlines.join(', '))} <span>was triggered, so the reward is 0. Scored on the criteria alone:</span> ${keep(fixed(run.graded, 3))}`);
  else if (!run.report && !run.workbook) flags.push('<span>The run ended without writing either deliverable, so every criterion scored 0.</span>');
  if (key === REPLAYED) flags.push(`<span>The replay above is an earlier pilot run of this pairing, which scored</span> ${keep(fixed(PILOT_REWARD, 3))}<span>. This cell is the pairing's run in the November grid.</span>`);
  return flags.map(f => `<p class="pg-flag">${f}</p>`).join('');
}

function drawCard(key, measuring = false) {
  const run = RUNS[key]; if (!run) return;
  if (!measuring) shown = key;
  const [hKey, mKey] = key.split('__'), h = HARNESSES.find(x => x.key === hKey), m = MODELS.find(x => x.key === mKey);
  const fact = (label, value) => `<div><dt>${label}</dt><dd data-no-translate>${esc(value)}</dd></div>`;
  const positive = run.met + run.partial + run.missed;
  const facts = [
    fact('Model requests', count(run.requests)), fact('Tool calls', count(run.calls)),
    fact('Criteria met', `${run.met} / ${positive}`), fact('Partly met', String(run.partial)),
    fact('Penalties applied', `${run.penalties} / ${run.penaltyTotal}`), fact('Red lines held', `${2 - run.redlines.length} / 2`),
    fact('Report characters', run.report ? count(run.report.chars) : '—'), fact('Workbook formulas', run.workbook ? count(run.workbook.formulas) : '—'),
  ].join('');
  const dims = DIMENSIONS.map((name, i) => { const [got, of] = run.dims[i]; return `<span>${name}</span><i style="--f:${of ? Math.max(0, got) / of : 0}"></i><span data-no-translate>${+got.toFixed(2)} / ${of}</span>`; }).join('');
  const points = run.points.map((text, i) => `<div><dt>${POINTS[i]}</dt><dd>${esc(text)}</dd></div>`).join('');
  card.innerHTML = `
    <div class="pg-card-head">
      <div><h3 data-no-translate>${esc(m.name)} · ${esc(h.name)}</h3><p class="pg-card-sub" data-no-translate>${esc(run.harness)} · ${esc(run.model)}</p></div>
      <div class="pg-reward"><small>Reward</small><b data-no-translate>${fixed(run.reward, 3)}</b></div>
    </div>
    ${flagOf(key, run)}
    <dl class="pg-facts">${facts}</dl>
    <p class="pg-sub">Points by dimension</p>
    <div class="pg-dims">${dims}</div>
    <p class="pg-sub">What the record shows</p>
    <dl class="pg-points">${points}</dl>`;
  if (!measuring) table.querySelectorAll('.pg-cell').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.key === key)));
}

drawTable();
let shown = REPLAYED;
function fit() {
  card.style.minHeight = '';
  let tallest = 0;
  for (const key of Object.keys(RUNS)) { drawCard(key, true); tallest = Math.max(tallest, card.offsetHeight); }
  card.style.minHeight = `${tallest}px`;
  drawCard(shown);
}
table.addEventListener('click', e => { const b = e.target.closest('.pg-cell'); if (b) drawCard(b.dataset.key); });
// The opening screen's choice asks for its run's record; agent-run.js then glides the page down here.
document.addEventListener('playground:show-run', e => { if (RUNS[e.detail.key]) drawCard(e.detail.key); });
const asked = new URLSearchParams(location.search).get('run');
if (RUNS[asked]) shown = asked;
fit();
let fitting = 0;
addEventListener('resize', () => { clearTimeout(fitting); fitting = setTimeout(fit, 200); });
document.fonts?.ready.then(fit);

// Writes docs/video/sff-homepage/{provenance,render-receipt}.json from what the run actually produced.
import { SHOTS, DIP, LOADOUT } from './shots.mjs';
import { SHOOT_CSS, STAGE_CSS } from './lib/stage.mjs';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';

const DOCS = '../../docs/video/sff-homepage';
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const hash = s => crypto.createHash('sha256').update(s).digest('hex');
const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const out = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8' }).split('\n')[0].trim();

const raw = read('out/review/provenance-raw.json');
const verify = read('out/review/verify-report.json');
const render = read('out/review/render-commands.json');
// Some shots were recaptured; the last log line of each is the one in the master.
const capture = Object.values(Object.fromEntries(['master-final', 'master-v2', 'master-v3'].flatMap(name => fs.readFileSync(`out/review/${name}.log`, 'utf8').split('\n').filter(l => l.startsWith('{')).map(l => JSON.parse(l))).map(r => [r.id, r]))).filter(r => SHOTS.some(s => s.id === r.id));
const LOCK = raw.lock;

const fontPaths = ['assets/fonts/inter-latin.woff2', 'assets/fonts/space-mono-latin.woff2'];
const provenance = {
  video: 'metacase-sff-stage-1080p60.mp4',
  locked_commit: LOCK,
  source_page: 'index.html at the locked commit, served from 127.0.0.1:4199',
  stream: verify.video,
  audio: verify.audio,
  chapters: render.chapters,
  chapter_change: { dims_to_dark_seconds: DIP.out, dark_frames: DIP.darkFrames, rises_seconds: DIP.in, double_exposure: 'none: the master is a concat, with no crossfade between shots' },
  shots: SHOTS.map(s => ({ id: s.id, seconds: s.seconds, keys: s.keys || s.y || null, clock_rate: s.rate || null, page_controls_fired_at: (s.at || []).map(a => a[0]) })),
  arena_loadout_on_screen: LOADOUT,
  shoot_only_changes: {
    note: 'Runtime only. No site file was edited. Full text is in video-demo/sff-homepage/lib/stage.mjs.',
    css_sha256: hash(SHOOT_CSS + STAGE_CSS),
    text_trims_to_exact_substrings: {
      '.mc-lead': 'an open benchmark and research arena built around reusable Metacases (index.html:97, first letter shown in capitals)',
      '.mc-results-stats li:first-child small': '3 fields × 200 tasks · 18 classes (index.html:458)',
    },
    hidden_contradictory_figures: ['208 / 209 / 187 records (index.html:90-92, 186-188)', '604 tasks (index.html:216)', 'SIXTEEN CASE CATEGORIES and econ/ 5 fin/ 6 soc/ 5 (index.html:370-371, 410)'],
  },
  on_screen_text: raw.rows.map(r => ({ shot: r.shot, text: r.text, output_px: r.px, seconds: [r.from, r.to], source: r.source })),
  numbers: raw.numbers,
  checks: { forbidden_strings_on_screen: raw.forbidden, strings_without_source: raw.unsourced },
  painted_text: raw.painted, painted_forbidden_drawn: raw.paintedForbidden,
  not_covered: 'The ledger reads DOM text. Text painted into canvases is logged per run for the shots captured with that log (02 to 06c); on the reused shots (01, 07, 08, 09, end card) the scene sources were grepped for the contradictory figures instead.',
};
fs.writeFileSync(`${DOCS}/provenance.json`, JSON.stringify(provenance, null, 2) + '\n');

const receipt = {
  locked_commit: LOCK,
  rendered_at: new Date().toISOString(),
  tools: {
    ffmpeg: out('ffmpeg', ['-version']),
    node: process.version,
    playwright: read('node_modules/playwright/package.json').version,
    chrome: out('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--version']),
    webgl_renderer: 'ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)',
  },
  capture: { viewport: '1280x720', device_scale_factor: 1.5, end_card_viewport: '1920x1080', fps: 60, method: 'page.clock paused before navigation, stepped per frame after a fixed warm-up; CSS and WAAPI animations seeked to the fake clock; JPEG q95', per_shot: capture },
  font_sha256: Object.fromEntries(fontPaths.map(f => [f, sha(`../../${f}`)])),
  frames: verify.video.frames,
  commands: render.commands,
  outputs: { [verify.file]: { bytes: verify.bytes, sha256: verify.sha256 }, 'out/final/metacase-sff-stage-poster.jpg': { bytes: fs.statSync('out/final/metacase-sff-stage-poster.jpg').size, sha256: sha('out/final/metacase-sff-stage-poster.jpg') } },
  version: 'v3 (CP3-R3): selection and shuttle redone',
  supersedes: { file: 'out/final/metacase-sff-stage-1080p60-v2.1.mp4', sha256: '9debd036903366d1528b58cd497f1a12e54d1f4f26dbc94c074c9673fc9cdf66' },
  recaptured_for_this_version: SHOTS.filter(s => !s.reuse).map(s => s.id),
  flash_calibration: read('out/review/flash-calibration.json'),
  intermediates_sha256: Object.fromEntries(SHOTS.map(x => [x.id, sha(`out/master/${x.id}.mp4`)])),
  reused_frames: SHOTS.filter(s => s.reuse).map(s => s.id),
  acceptance: { checks: verify.checks, black: verify.black, freezes: verify.freezes, flash: verify.flash, safe_area_96x54_text_outside: raw.outside, safe_area_outside_by_shot: Object.fromEntries(SHOTS.map(x => [x.id, raw.outside.filter(o => o.shot === x.id).reduce((n, o) => n + o.samples, 0)])), small_text_under_28px: [...new Map(raw.small.map(s => [s.text, s])).values()] },
};
fs.writeFileSync(`${DOCS}/render-receipt.json`, JSON.stringify(receipt, null, 2) + '\n');
console.log('written', Object.keys(receipt.outputs));

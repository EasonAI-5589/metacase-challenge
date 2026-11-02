// Acceptance for the stage master (handoff §8). Reads the rendered file back and prints one JSON report.
//   node verify.mjs [file]
import { SHOTS, DIP, timeline } from './shots.mjs';
import { flashAnalysis, readRgb, JOIN_FRAMES } from './lib/flash.mjs';
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';

const file = process.argv[2] || 'out/final/metacase-sff-stage-1080p60.mp4';
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8' }));
const v = probe.streams.find(s => s.codec_type === 'video'), a = probe.streams.find(s => s.codec_type === 'audio');
const ffmpegLog = args => spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr;

// A frame is black only below 3 % luma for 0.1 s or more; the film may open dark, and each chapter change is a planned dip.
const black = [...ffmpegLog(['-hide_banner', '-i', file, '-vf', 'blackdetect=d=0.1:pix_th=0.03', '-an', '-f', 'null', '-'])
  .matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map(m => ({ start: +m[1], end: +m[2] }));

// Freezes: 2 s or more with no change above -60 dB.
const freezeLog = ffmpegLog(['-hide_banner', '-i', file, '-vf', 'freezedetect=n=-60dB:d=2', '-an', '-f', 'null', '-']);
const starts = [...freezeLog.matchAll(/freeze_start: ([\d.]+)/g)].map(m => +m[1]);
const ends = [...freezeLog.matchAll(/freeze_end: ([\d.]+)/g)].map(m => +m[1]);
const freezes = starts.map((start, i) => ({ start, end: ends[i] ?? +probe.format.duration }));

// Which shot each moment falls in, so a freeze can be judged against the storyboard's holds.
const chapters = timeline();
const shotAt = t => chapters.find(c => t >= c.start && t < c.end)?.id ?? 'end';

// Two different questions about brightness changes, reported separately.
//
// 1. Handoff §4, strict: no 60×60 px cell flips between bright and dark more than 3 times in a second. A moving edge
//    trips this as readily as a strobe. The result stands as measured, and each window is checked against the storyboard:
//    does it overlap a scripted move, or is it unexplained?
const FPS = 60;
const signal = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-vf', 'scale=32:18,format=gray', '-an', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
const W = 32, H = 18, N = Math.floor(signal.length / (W * H));
const flipWindows = {};
for (let c = 0; c < W * H; c++) {
  const flips = []; let state = null;
  for (let f = 0; f < N; f++) {
    const y = signal[f * W * H + c];
    const next = y > 150 ? 1 : y < 60 ? 0 : state;
    if (state !== null && next !== state) flips.push(f);
    state = next;
  }
  for (let i = 3; i < flips.length; i++) if (flips[i] - flips[i - 3] <= FPS) {
    const at = (flips[i - 3] / FPS).toFixed(1);
    (flipWindows[at] ||= new Set()).add(c);
  }
}
// Every chapter change must pass through the dark: the darkest frame between two shots proves no double exposure.
const meanLuma = f => { let sum = 0; for (let i = 0; i < W * H; i++) sum += signal[f * W * H + i]; return sum / (W * H); };
const dips = chapters.slice(0, -1).map((c, i) => {
  const from = Math.round((c.end - DIP.out) * FPS), to = Math.round((c.end + DIP.darkFrames / FPS + DIP.in) * FPS);
  let darkest = 255; for (let f = from; f <= to && f < N; f++) darkest = Math.min(darkest, meanLuma(f));
  return { from: c.id, to: chapters[i + 1].id, at: +c.end.toFixed(3), darkest_mean_luma: +darkest.toFixed(1) };
});
const inPlannedDip = b => b.end - b.start <= 1 && chapters.slice(0, -1).some(c => b.start >= c.end - DIP.out - .1 && b.end <= c.end + DIP.darkFrames / FPS + DIP.in + .4);
const movingAt = t => {
  const c = chapters.find(x => t >= x.start && t < x.end), shot = c && SHOTS.find(s => s.id === c.id), keys = shot?.keys;
  if (!shot) return false;
  const local = t - c.start;
  // moves on the page's own clock: the book change, the warp and the arrival after it
  if ((shot.pageMotion || []).some(([a, b]) => local >= a && local <= b) || shot.id === '06c-challenge-arrive' && local <= 2.4) return true;
  if (!keys) return false;
  for (let i = 1; i < keys.length; i++) if (local >= keys[i - 1][0] && local <= keys[i][0]) return JSON.stringify(keys[i - 1][1]) !== JSON.stringify(keys[i][1]);
  return false;
};
const duringMove = at => Array.from({ length: 21 }, (_, i) => at + i * .05).some(movingAt);
const cellFlips = Object.entries(flipWindows).map(([at, cells]) => ({ at: +at, shot: shotAt(+at), cells: cells.size, screenPercent: +(cells.size / (W * H) * 100).toFixed(2), duringScriptedMove: duringMove(+at) })).sort((p, q) => p.at - q.at);

// 2. True strobe, after WCAG 2.3.1 general flash: a flash is a pair of opposing relative-luminance changes of at least 0.1
//    with the darker state under 0.8, and it fails when more than 3 flashes in one second (over 6 transitions) occur
//    concurrently over more than 25 % of a 10-degree field. That field is a 341×256 rectangle at 1024×768, so 640×480 here.
//    "Concurrently" is what separates a flash from a moving pattern: cells turning the same way within a few frames.
//    Two figures come out, because they answer different questions:
//      true_strobe_flash          windows where the concurrent test fails
//      fast_pattern_motion_seconds seconds where over 25 % of a rectangle cycles quickly at all, in any phase
//    An approximation on a 64×36 grid, calibrated by calibrate-flash.mjs. Not a certified PSE test; saturated red is not tested.
const rgbFrames = readRgb(file);
const flash = flashAnalysis(rgbFrames);
// How wide "concurrently" is decides the result near the edge, so every width is reported, not just the chosen one.
flash.by_concurrency_window = Object.fromEntries(JOIN_FRAMES.map(join => [`${join}_frames`, flashAnalysis(rgbFrames, { join }).true_strobe_flash]));

const num = s => { const [x, y] = s.split('/').map(Number); return y ? x / y : x; };
const report = {
  file,
  bytes: fs.statSync(file).size,
  sha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),
  video: { codec: v.codec_name, profile: v.profile, width: v.width, height: v.height, fps: num(v.r_frame_rate), pix_fmt: v.pix_fmt, color_space: v.color_space, color_primaries: v.color_primaries, color_transfer: v.color_transfer, color_range: v.color_range, frames: Number(v.nb_frames), duration: +v.duration },
  audio: a ? { codec: a.codec_name, rate: Number(a.sample_rate), channels: a.channels } : null,
  faststart: (() => { const head = fs.readFileSync(file).subarray(0, 4096); return head.includes('moov') && head.indexOf('moov') < head.indexOf('mdat') || !head.includes('mdat'); })(),
  black: black.map(b => ({ ...b, shot: shotAt(b.start) })),
  freezes: freezes.map(f => ({ ...f, seconds: +(f.end - f.start).toFixed(2), shot: shotAt(f.start) })),
  chapter_dips: dips,
  flash: {
    ...flash,
    true_strobe_method: 'After WCAG 2.3.1 general flash, on a 64×36 grid: over 3 concurrent flashes per second over more than 25 % of a 640×480 rectangle. Calibrated by calibrate-flash.mjs. An approximation, not a certified PSE test; saturated red is not tested separately.',
    page_turn_grid_crossings: cellFlips.length,
    page_turn_grid_crossings_method: 'Handoff §4 strict limit, on a 32×18 grid: a cell flips bright/dark more than 3 times in a second. Each window is checked against the shot keys.',
    unexplained_cell_flip_windows: cellFlips.filter(w => !w.duringScriptedMove).length,
    cell_flip_windows: cellFlips,
  },
};
report.checks = {
  duration_105_135: report.video.duration >= 105 && report.video.duration <= 135,
  size_1920x1080: v.width === 1920 && v.height === 1080,
  fps_60: Math.abs(report.video.fps - 60) < 0.01,
  h264_high: v.codec_name === 'h264' && v.profile === 'High',
  yuv420p: v.pix_fmt === 'yuv420p',
  bt709: v.color_space === 'bt709' && v.color_primaries === 'bt709' && v.color_transfer === 'bt709',
  audio_aac_48k_stereo: !!a && a.codec_name === 'aac' && Number(a.sample_rate) === 48000 && a.channels === 2,
  faststart: report.faststart,
  black_only_at_open_or_planned_dips: black.every(b => b.start < 1 || inPlannedDip(b)),
  every_chapter_change_through_dark: dips.every(d => d.darkest_mean_luma <= 30),
  no_true_strobe_flash: flash.true_strobe_flash === 0,
  no_fast_pattern_motion: flash.fast_pattern_motion_seconds === 0,
  cell_flips_all_during_scripted_moves: cellFlips.every(w => w.duringScriptedMove),
  // Stays false while any window exists: motion explains these windows, it does not make the handoff's strict limit pass.
  handoff_strict_cell_flip_limit: cellFlips.length === 0,
};
console.log(JSON.stringify(report, null, 2));
fs.writeFileSync('out/review/verify-report.json', JSON.stringify(report, null, 2));

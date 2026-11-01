// Acceptance for the stage master (handoff §8). Reads the rendered file back and prints one JSON report.
//   node verify.mjs [file]
import { SHOTS, XFADE } from './shots.mjs';
import { execFileSync, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';

const file = process.argv[2] || 'out/final/metacase-sff-stage-1080p60.mp4';
const probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file], { encoding: 'utf8' }));
const v = probe.streams.find(s => s.codec_type === 'video'), a = probe.streams.find(s => s.codec_type === 'audio');
const ffmpegLog = args => spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 1 << 28 }).stderr;

// A frame is black only below 3 % luma for 0.1 s or more; the film may open dark, nowhere else.
const black = [...ffmpegLog(['-hide_banner', '-i', file, '-vf', 'blackdetect=d=0.1:pix_th=0.03', '-an', '-f', 'null', '-'])
  .matchAll(/black_start:([\d.]+) black_end:([\d.]+)/g)].map(m => ({ start: +m[1], end: +m[2] }));

// Freezes: 2 s or more with no change above -60 dB.
const freezeLog = ffmpegLog(['-hide_banner', '-i', file, '-vf', 'freezedetect=n=-60dB:d=2', '-an', '-f', 'null', '-']);
const starts = [...freezeLog.matchAll(/freeze_start: ([\d.]+)/g)].map(m => +m[1]);
const ends = [...freezeLog.matchAll(/freeze_end: ([\d.]+)/g)].map(m => +m[1]);
const freezes = starts.map((start, i) => ({ start, end: ends[i] ?? +probe.format.duration }));

// Which shot each moment falls in, so a freeze can be judged against the storyboard's holds.
const chapters = []; { let t = 0; for (const s of SHOTS) { chapters.push({ id: s.id, start: +t.toFixed(3), end: +(t + s.seconds).toFixed(3) }); t += s.seconds - XFADE; } }
const shotAt = t => chapters.find(c => t >= c.start && t < c.end)?.id ?? 'end';

// Flicker: no region may flip between bright and dark more than 3 times in one second (handoff §4).
const signal = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-vf', 'scale=32:18,format=gray', '-an', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
const W = 32, H = 18, N = Math.floor(signal.length / (W * H)), FPS = 60;
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
const flicker = Object.entries(flipWindows).map(([at, cells]) => ({ at: +at, shot: shotAt(+at), cells: cells.size, screenPercent: +(cells.size / (W * H) * 100).toFixed(2) })).sort((p, q) => p.at - q.at);

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
  flicker,
};
report.checks = {
  duration_75_90: report.video.duration >= 75 && report.video.duration <= 90,
  size_1920x1080: v.width === 1920 && v.height === 1080,
  fps_60: Math.abs(report.video.fps - 60) < 0.01,
  h264_high: v.codec_name === 'h264' && v.profile === 'High',
  yuv420p: v.pix_fmt === 'yuv420p',
  bt709: v.color_space === 'bt709' && v.color_primaries === 'bt709' && v.color_transfer === 'bt709',
  audio_aac_48k_stereo: !!a && a.codec_name === 'aac' && Number(a.sample_rate) === 48000 && a.channels === 2,
  faststart: report.faststart,
  black_only_at_open: black.every(b => b.start < 1),
  no_flicker: flicker.length === 0,
  flicker_under_1pct_of_screen: flicker.every(w => w.screenPercent < 1),
};
console.log(JSON.stringify(report, null, 2));
fs.writeFileSync('out/review/verify-report.json', JSON.stringify(report, null, 2));

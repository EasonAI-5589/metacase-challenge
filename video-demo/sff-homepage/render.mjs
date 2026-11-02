// Frames → per-shot intermediates → crossfaded master with a silent AAC track, plus the poster.
//   node render.mjs           60 fps master into out/final
//   FPS=10 node render.mjs    rough cut into out/review/rough.mp4
//   KEEP_FRAMES=0 deletes each shot's frames after its intermediate is written.
import { SHOTS, XFADE } from './shots.mjs';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
const FPS = Number(process.env.FPS || 60), master = FPS === 60;
const frameDir = master ? 'out/frames' : `out/frames-${FPS}`, midDir = master ? 'out/master' : `out/review/mid-${FPS}`;
fs.mkdirSync(midDir, { recursive: true });
// With an explicit shot list the other intermediates are reused, so their original encode commands stay in the record.
const earlier = process.argv[2] && fs.existsSync('out/review/render-commands.json') ? JSON.parse(fs.readFileSync('out/review/render-commands.json', 'utf8')).commands : [];
const commands = earlier.filter(c => SHOTS.some(s => !process.argv[2].split(',').includes(s.id) && c.includes(`${midDir}/${s.id}.mp4`) && !c.includes('xfade')));
const run = args => { commands.push(['ffmpeg', ...args].join(' ')); execFileSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] }); };
const COLOR = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
const only = process.argv[2]?.split(',');
for (const s of SHOTS) {
  const out = `${midDir}/${s.id}.mp4`, dir = `${frameDir}/${s.id}`;
  if ((only && !only.includes(s.id)) || !fs.existsSync(`${dir}/00000.jpg`)) { if (!fs.existsSync(out)) throw new Error(`missing ${dir}`); continue; }
  run(['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${dir}/%05d.jpg`, '-vf', 'scale=in_range=full:in_color_matrix=bt601:out_range=tv:out_color_matrix=bt709,format=yuv420p',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', master ? '10' : '20', ...COLOR, out]);
  if (process.env.KEEP_FRAMES === '0') { fs.rmSync(dir, { recursive: true, force: true }); }
}
const inputs = SHOTS.flatMap(s => ['-i', `${midDir}/${s.id}.mp4`]);
let filter = '', last = '0:v', offset = 0;
SHOTS.slice(1).forEach((s, i) => {
  offset += SHOTS[i].seconds - XFADE;
  const tag = i === SHOTS.length - 2 ? 'out' : `v${i}`;
  // text on text muddies in a dissolve, so such a pair dips through the dark instead
  filter += `[${last}][${i + 1}:v]xfade=transition=${s.dip ? 'fadeblack' : 'fade'}:duration=${XFADE}:offset=${offset.toFixed(4)}[${tag}];`;
  last = tag;
});
filter = filter.replace(/\[out\];$/, ',setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv[out]');
const finalPath = master ? 'out/final/metacase-sff-stage-1080p60.mp4' : 'out/review/rough.mp4';
fs.mkdirSync('out/final', { recursive: true });
run(['-y', '-loglevel', 'error', ...inputs, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-filter_complex', filter, '-map', '[out]', '-map', `${SHOTS.length}:a`, '-shortest',
  '-c:v', 'libx264', '-profile:v', 'high', '-preset', master ? 'slow' : 'veryfast', '-crf', master ? '15' : '24', '-pix_fmt', 'yuv420p', ...COLOR, '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709', '-r', String(FPS), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', finalPath]);
const duration = SHOTS.reduce((a, s) => a + s.seconds, 0) - XFADE * (SHOTS.length - 1);
const starts = []; { let t = 0; for (const s of SHOTS) { starts.push({ id: s.id, start: +t.toFixed(3), end: +(t + s.seconds).toFixed(3) }); t += s.seconds - XFADE; } }
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if (master) {
  const poster = 'out/final/metacase-sff-stage-poster.jpg';
  run(['-y', '-loglevel', 'error', '-ss', process.env.POSTER_AT || '7.0', '-i', finalPath, '-frames:v', '1', '-q:v', '2', '-vf', 'scale=in_range=tv:in_color_matrix=bt709:out_range=full:out_color_matrix=bt601', poster]);
  fs.writeFileSync('out/review/render-commands.json', JSON.stringify({ commands, chapters: starts, duration, sha256: { [finalPath]: sha(finalPath), [poster]: sha(poster) } }, null, 2));
}
console.log(finalPath, duration.toFixed(2), JSON.stringify(starts));

// Frames → per-shot intermediates → master with a dip through the dark wherever the film leaves the page and a silent AAC track, plus the poster.
//   node render.mjs           60 fps master into out/final
//   FPS=10 node render.mjs    rough cut into out/review/rough.mp4
//   KEEP_FRAMES=0 deletes each shot's frames after its intermediate is written.
import { SHOTS, DIP, timeline } from './shots.mjs';
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
const FPS = Number(process.env.FPS || 60), master = FPS === 60;
const frameDir = master ? 'out/frames' : `out/frames-${FPS}`, midDir = master ? 'out/master' : `out/review/mid-${FPS}`;
fs.mkdirSync(midDir, { recursive: true });
// With an explicit shot list the other intermediates are reused, so their original encode commands stay in the record.
const earlier = process.argv[2] && fs.existsSync('out/review/render-commands.json') ? JSON.parse(fs.readFileSync('out/review/render-commands.json', 'utf8')).commands : [];
const commands = earlier.filter(c => SHOTS.some(s => !process.argv[2].split(',').includes(s.id) && c.includes(`${midDir}/${s.id}.mp4`) && !c.includes('filter_complex')));
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
// The page's dark on the film's luma scale (sampled from the title card and the end card). eq's contrast pivots at code 128,
// so brightness (1-k)(D-128)/255 moves every pixel towards D and leaves the frame untouched at k = 1.
const DARK_LUMA = 23;
const eased = x => `(st(0,clip(${x},0,1));ld(0)*ld(0)*(3-2*ld(0)))`;
// A joined shot continues the one before it: no fade on either side of that seam.
const lit = (s, next) => {
  const fadeIn = s.joined ? 0 : s.fadeIn ?? DIP.in, fadeOut = next?.joined ? 0 : s.fadeOut ?? DIP.out, parts = [];
  if (fadeIn) parts.push(eased(`t/${fadeIn}`));
  if (fadeOut) parts.push(`(1-${eased(`(t-${(s.seconds - fadeOut).toFixed(4)})/${fadeOut}`)})`);
  return parts.join('*');
};
const dip = (s, next) => { const k = lit(s, next); return k && `,eq=contrast='${k}':brightness='(1-${k})*${((DARK_LUMA - 128) / 255).toFixed(5)}':saturation='${k}':eval=frame`; };
// A joined pair has no dark frames between them: one take's frames run on, and the warp's last frame is the arrival's first.
const chain = SHOTS.map((s, i) => `[${i}:v]${i < SHOTS.length - 1 && !SHOTS[i + 1].joined ? `tpad=stop=${DIP.darkFrames}:stop_mode=clone` : 'null'}${dip(s, SHOTS[i + 1])},setsar=1[s${i}];`).join('');
const filter = `${chain}${SHOTS.map((_, i) => `[s${i}]`).join('')}concat=n=${SHOTS.length}:v=1:a=0,setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv[out]`;
const finalPath = master ? 'out/final/metacase-sff-stage-1080p60.mp4' : 'out/review/rough.mp4';
fs.mkdirSync('out/final', { recursive: true });
run(['-y', '-loglevel', 'error', ...inputs, '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-filter_complex', filter, '-map', '[out]', '-map', `${SHOTS.length}:a`, '-shortest',
  '-c:v', 'libx264', '-profile:v', 'high', '-preset', master ? 'slow' : 'veryfast', '-crf', master ? '15' : '24', '-pix_fmt', 'yuv420p', ...COLOR, '-x264-params', 'colorprim=bt709:transfer=bt709:colormatrix=bt709', '-r', String(FPS), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', finalPath]);
const starts = timeline(FPS), duration = starts.at(-1).end;
const sha = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if (master) {
  const poster = 'out/final/metacase-sff-stage-poster.jpg';
  run(['-y', '-loglevel', 'error', '-ss', process.env.POSTER_AT || '7.0', '-i', finalPath, '-frames:v', '1', '-q:v', '2', '-vf', 'scale=in_range=tv:in_color_matrix=bt709:out_range=full:out_color_matrix=bt601', poster]);
  fs.writeFileSync('out/review/render-commands.json', JSON.stringify({ commands, chapters: starts, duration, sha256: { [finalPath]: sha(finalPath), [poster]: sha(poster) } }, null, 2));
}
console.log(finalPath, duration.toFixed(2), JSON.stringify(starts));

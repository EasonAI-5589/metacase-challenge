// A sheet of chosen moments: node sheet.mjs out.jpg cols width dir:second dir:second ...
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const [out, cols, width, ...moments] = process.argv.slice(2);
const list = moments.map(m => { const [d, s] = m.split(':'); return `file '${fs.realpathSync(`${d}/${String(Math.round(Number(s) * Number(process.env.FPS || 60))).padStart(5, '0')}.jpg`)}'\nduration 1`; });
fs.writeFileSync(`${out}.list`, list.join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', `${out}.list`, '-vf', `scale=${width}:-1,tile=${cols}x${Math.ceil(moments.length / cols)}:padding=4:color=0x333333`, '-frames:v', '1', '-q:v', '4', out]);
fs.rmSync(`${out}.list`); console.log(out);

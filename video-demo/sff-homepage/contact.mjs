// Three keyframes per shot in one sheet: first, middle, last. node contact.mjs <framesDir> <out.jpg> [perShot] [width]
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { SHOTS } from './shots.mjs';
const [dir, out, perShot = '3', width = '560'] = process.argv.slice(2);
const n = Number(perShot), inputs = [], shots = SHOTS.map(s => s.id).filter(id => fs.existsSync(`${dir}/${id}`)); // retired shots' frames may still be on disk
for (const s of shots) {
  const files = fs.readdirSync(`${dir}/${s}`).filter(f => f.endsWith('.jpg')).sort();
  for (let k = 0; k < n; k++) inputs.push(`${dir}/${s}/${files[Math.min(files.length - 1, Math.round(k * (files.length - 1) / (n - 1)))]}`);
}
const tmp = `${out}.list`; fs.writeFileSync(tmp, inputs.map(p => `file '${fs.realpathSync(p)}'\nduration 1`).join('\n'));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', tmp, '-vf', `${process.env.SAFE ? 'drawbox=x=96:y=54:w=1728:h=972:color=red@0.8:t=3,' : ''}scale=${width}:-1,tile=${n}x${shots.length}:padding=4:color=0x333333`, '-frames:v', '1', '-q:v', '4', out]);
fs.rmSync(tmp); console.log(out, inputs.length);

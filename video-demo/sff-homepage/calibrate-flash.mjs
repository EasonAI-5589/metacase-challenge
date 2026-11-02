// Runs the flash test on synthetic clips with known answers, at every concurrency window.
import { flashAnalysis, readRgb, JOIN_FRAMES } from './lib/flash.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const dir = process.argv[2]; fs.mkdirSync(dir, { recursive: true });
const CLIPS = [
  ['full screen 2 Hz', false, `geq=lum='if(lt(mod(T*2\\,1)\\,0.5)\\,235\\,16)'`],
  ['full screen 3 Hz (the limit)', false, `geq=lum='if(lt(mod(T*3\\,1)\\,0.5)\\,235\\,16)'`],
  ['full screen 5 Hz', true, `geq=lum='if(lt(mod(T*5\\,1)\\,0.5)\\,235\\,16)'`],
  ['full screen 10 Hz', true, `geq=lum='if(lt(mod(T*10\\,1)\\,0.5)\\,235\\,16)'`],
  ['full screen 5 Hz, soft sine', true, `geq=lum='125+110*sin(2*PI*5*T)'`],
  ['large patch 5 Hz, 800x600', true, `geq=lum='if(between(X\\,560\\,1360)*between(Y\\,240\\,840)*lt(mod(T*5\\,1)\\,0.5)\\,235\\,16)'`],
  ['small patch 5 Hz, 240x200', false, `geq=lum='if(between(X\\,840\\,1080)*between(Y\\,440\\,640)*lt(mod(T*5\\,1)\\,0.5)\\,235\\,16)'`],
  ['moving bars 5 Hz per spot', false, `geq=lum='if(lt(mod(X+1200*T\\,240)\\,120)\\,235\\,16)'`],
];
const rows = [];
CLIPS.forEach(([name, shouldFail, filter], i) => {
  const out = `${dir}/c${i}.mp4`;
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=1920x1080:r=60:d=3,format=gray', '-vf', filter, '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '12', '-pix_fmt', 'yuv420p', out]);
  const rgb = readRgb(out), byJoin = Object.fromEntries(JOIN_FRAMES.map(join => [join, flashAnalysis(rgb, { join }).true_strobe_flash]));
  const pattern = flashAnalysis(rgb).fast_pattern_motion_seconds;
  rows.push({ clip: name, expected: shouldFail ? 'strobe' : 'not strobe', strobe_seconds_by_join: byJoin, correct_by_join: Object.fromEntries(JOIN_FRAMES.map(j => [j, (byJoin[j] > 0) === shouldFail])), fast_pattern_seconds: pattern });
});
for (const r of rows) console.log(JSON.stringify(r));
const correct = Object.fromEntries(JOIN_FRAMES.map(j => [j, rows.filter(r => r.correct_by_join[j]).length]));
console.log('correct of', rows.length, JSON.stringify(correct));
fs.writeFileSync('out/review/flash-calibration.json', JSON.stringify({ rows, correct }, null, 2));

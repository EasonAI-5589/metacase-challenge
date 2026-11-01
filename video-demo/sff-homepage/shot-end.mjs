// A still of the end card at its rest pose, plus an independent decode of its QR from the rendered pixels.
import { chromium } from 'playwright';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import fs from 'node:fs';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, colorScheme: 'dark' });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('response', r => r.status() >= 400 && !r.url().includes('favicon') && errs.push(`${r.status()} ${r.url()}`));
await p.goto('http://127.0.0.1:4199/video-demo/sff-homepage/cards/end.html');
await p.waitForFunction(() => document.documentElement.dataset.ready === '1'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2500);
await p.screenshot({ path: 'out/review/end-still.png' });
const png = PNG.sync.read(fs.readFileSync('out/review/end-still.png'));
const read = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
console.log('errors', errs, 'qr', read?.data);
const box = await p.evaluate(() => [...document.querySelectorAll('.title span,.title em,.crests,.host,.qr,.cta,.url')].map(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return { c: e.className || e.tagName, x: Math.round(r.left), y: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), fs: s.fontSize }; }));
console.log(JSON.stringify(box));
await b.close();

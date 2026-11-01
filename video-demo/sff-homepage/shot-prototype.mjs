// Screenshots every direction of the prototype page and checks the console stays clean.
import { chromium } from 'playwright';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, colorScheme: 'dark' });
const errs = []; p.on('console', m => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', e => errs.push(e.message));
for (const [i, n] of ['margin', 'bookplate', 'signature'].entries()) for (const part of ['end', 'mark']) {
  await p.goto(`http://127.0.0.1:4199/video-demo/sff-homepage/cards/prototype.html?shoot&v=${i + 1}&part=${part}`);
  await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(1800);
  await p.screenshot({ path: `out/review/proto-${n}-${part}.jpg`, type: 'jpeg', quality: 85 });
}
console.log('errors', errs); await b.close();

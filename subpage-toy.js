/* subpage-toy.js — the homepage's toy world on the other pages: a small 3D diorama in each
 * page header (the kit's people and robot on a round plinth, with the page's own props), and
 * the class pictures from the field books beside the Challenge page's class list.
 * Loaded as a module on every page but the homepage. Local Three.js r170 only. */
import { classArt, sectionArt } from './mc-classart.js?v=20261102-toybook';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const page = [...document.body.classList].find(c => c.startsWith('v2-page-'))?.slice(8) || '';

/* ---- class pictures beside each class on the Challenge page ---- */
document.querySelectorAll('.class-item .class-row').forEach(row => {
  const call = row.querySelector('.class-call');
  if (!call || row.querySelector('.toy-badge')) return;
  const badge = document.createElement('span');
  badge.className = 'toy-badge'; badge.setAttribute('aria-hidden', 'true'); badge.dataset.noTranslate = '';
  badge.innerHTML = classArt(call.textContent.trim().split('.').pop());
  row.prepend(badge);
  row.classList.add('has-badge');
});

/* ---- a toy picture over each chapter heading, its colour stepping through the three tracks ---- */
let spots = 0;
document.querySelectorAll('main section[id]').forEach(section => {
  const art = sectionArt(section.id);
  const head = section.querySelector('.section-heading > div:first-child') || section.querySelector('h2')?.parentElement;
  if (!art || !head || head.querySelector('.toy-spot') || head.closest('.page-hero')) return;
  const spot = document.createElement('span');
  spot.className = 'toy-spot'; spot.setAttribute('aria-hidden', 'true'); spot.dataset.noTranslate = '';
  spot.style.setProperty('--tc', `var(--track-${(spots++ % 3) + 1})`);
  spot.innerHTML = art;
  head.prepend(spot);
});

/* ---- the header diorama ---- */
const hero = document.querySelector('.page-hero');
const SCENES = { challenge: 1, harness: 1, evolution: 1, leaderboard: 1, teams: 1, 'professional-tasks': 1, replication: 1 };
let webgl = false;
try { const c = document.createElement('canvas'); webgl = !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { /* no 3D */ }
if (hero && SCENES[page] && webgl) {
  // a header with its own panel on the right (Business Analysis) takes the picture at the panel's top
  const panel = hero.querySelector('.professional-hero-note');
  const holder = document.createElement('div');
  holder.className = panel ? 'toy-hero is-inline' : 'toy-hero'; holder.setAttribute('aria-hidden', 'true');
  const canvas = document.createElement('canvas');
  holder.append(canvas);
  if (panel) panel.prepend(holder);
  else { hero.append(holder); hero.classList.add('has-toy'); }
  const start = () => import('./subpage-toy-scenes.js?v=20261105-grip').then(m => m.mount(canvas, page, { reduce })).catch(() => holder.remove());
  // build when the header is near the view; the header is at the top, so normally at once
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); start(); } }, { rootMargin: '200px' });
    io.observe(holder);
  } else start();
}

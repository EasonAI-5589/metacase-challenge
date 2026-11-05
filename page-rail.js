/* page-rail.js — the page's chapters as a bookmark rail down the side of the window, on every
 * page. One tab per chapter: the rail fills as the page is read, the current tab stands out, and
 * a click goes straight to that chapter without playing the scenes in between. The chapter bar
 * under the header supplies the list and the names, so translation stays in one place. */
(() => {
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = x => Math.max(0, Math.min(1, x));
  const TONES = ['var(--track-1)', 'oklch(70% 0.16 290)', 'var(--track-2)'];
  const READING_LINE = .4; // a chapter is current once its top has passed this share of the window

  const seen = new Set();
  const chapters = [...document.querySelectorAll('.subnav a[href^="#"], .board-nav a[href^="#"]')].flatMap(link => {
    const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    if (!target || seen.has(target)) return [];
    seen.add(target);
    return [{ link, target, number: link.querySelector('.subnav-number, .n')?.textContent.trim() || '' }];
  });
  if (chapters.length < 2) return;

  const nameOf = link => {
    const copy = link.cloneNode(true);
    copy.querySelectorAll('.subnav-number, .n, [aria-hidden="true"]').forEach(el => el.remove());
    return copy.textContent.replace(/\s+/g, ' ').trim();
  };

  // Straight to a chapter: a pinned chapter lands where its scene sticks, any other under the bars.
  const veil = document.createElement('div');
  veil.className = 'page-rail-veil';
  function jump(target) {
    const pin = target.querySelector('.mc-pin, .mc-scene-pin'), header = document.querySelector('.site-header'), bar = document.querySelector('.subnav');
    const pinned = pin && getComputedStyle(pin).position === 'sticky';
    const offset = pinned ? parseFloat(getComputedStyle(pin).top) || 0
      : (header ? header.offsetHeight : 64) + (bar && getComputedStyle(bar).position === 'sticky' ? bar.offsetHeight : 0) + 8;
    const go = () => {
      const top = scrollY + target.getBoundingClientRect().top - offset;
      if (window.__lenis) window.__lenis.scrollTo(top, { immediate: true, force: true });
      else window.scrollTo({ top, behavior: 'instant' });
    };
    if (reduce) { go(); return; }
    // a quick dip covers the cut, so the scenes between are not seen and the new one has a frame to draw
    veil.classList.add('is-on');
    setTimeout(() => { go(); requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.remove('is-on'))); }, 170);
  }
  const follow = (event, target, hash) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    jump(target);
    history.replaceState(null, '', hash);
  };

  const nav = document.createElement('nav'), list = document.createElement('ol');
  nav.className = 'page-rail';
  nav.dataset.noTranslate = '';
  const counted = chapters.some(chapter => chapter.number);
  const tabs = chapters.map(({ link, target, number }, i) => {
    const item = document.createElement('li'), tab = document.createElement('a');
    const mark = document.createElement('span'), name = document.createElement('span');
    const hash = link.getAttribute('href');
    tab.href = hash;
    tab.style.setProperty('--rc', TONES[i % TONES.length]);
    mark.className = 'page-rail-mark';
    mark.textContent = number || (counted ? '·' : String(i + 1).padStart(2, '0'));
    name.className = 'page-rail-name';
    tab.addEventListener('click', event => follow(event, target, hash));
    tab.append(mark, name);
    item.append(tab);
    list.append(item);
    return { tab, name };
  });
  nav.append(list);
  document.body.append(veil, nav);

  // The homepage's own chapter bar goes straight there too: gliding would replay every scene on the way.
  document.querySelectorAll('.mc-subnav a[href^="#"]').forEach((link, i) => {
    link.addEventListener('click', event => follow(event, chapters[i].target, link.getAttribute('href')));
  });

  const rename = () => {
    nav.setAttribute('aria-label', chapters[0].link.closest('[aria-label]').getAttribute('aria-label'));
    tabs.forEach(({ name }, i) => { name.textContent = nameOf(chapters[i].link); });
  };
  rename();
  new MutationObserver(rename).observe(root, { attributes: true, attributeFilter: ['lang'] });

  let queued = false, last = -2;
  function paint() {
    queued = false;
    const line = innerHeight * READING_LINE, n = chapters.length;
    const tops = chapters.map(({ target }) => target.getBoundingClientRect().top - line);
    const current = tops.findLastIndex(top => top <= 0);
    // the fill reaches each tab as its chapter reaches the reading line
    let fill = 0;
    if (current >= 0) {
      const end = current + 1 < n ? tops[current + 1] : root.scrollHeight - scrollY - line;
      fill = (current + clamp(-tops[current] / Math.max(1, end - tops[current]))) / (n - 1);
    }
    nav.style.setProperty('--rail-p', clamp(fill).toFixed(4));
    if (current === last) return;
    last = current;
    tabs.forEach(({ tab }, i) => {
      tab.classList.toggle('on', i === current);
      tab.classList.toggle('done', i < current);
      if (i === current) tab.setAttribute('aria-current', 'location'); else tab.removeAttribute('aria-current');
    });
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(paint); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  addEventListener('load', queue);
  paint();
})();

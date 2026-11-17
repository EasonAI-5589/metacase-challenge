/* challenge.js — the three tracks of the Challenge page as tabs, like the three cases on the
 * Metacase pages: one track's page is open at a time. Without this script the tabs are plain links
 * and the three tracks stand one under another. A link or an address that names a track, or
 * anything inside one (a class, its recorded run), opens that track first. Runs before
 * portal-warp.js, so a visitor arriving through a portal lands on a track that is already open. */
(() => {
  const section = document.getElementById('tracks');
  const list = section && section.querySelector('.ch-tabs');
  if (!list) return;
  const tabs = [...list.querySelectorAll('.ch-tab')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('href').slice(1)));
  if (!tabs.length || panels.some(panel => !panel)) return;

  list.setAttribute('role', 'tablist');
  tabs.forEach((tab, i) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', tab.id);
  });
  section.classList.add('is-tabbed');

  let current = -1;
  function select(i, focus) {
    if (i !== current) {
      current = i;
      tabs.forEach((tab, k) => {
        tab.setAttribute('aria-selected', String(k === i));
        tab.tabIndex = k === i ? 0 : -1;
        panels[k].hidden = k !== i;
      });
    }
    if (focus) tabs[i].focus({ preventScroll: true });
  }

  // the element a hash names, and the track it belongs to (-1: none of them)
  const named = hash => {
    if (!hash || hash.length < 2) return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch { return null; }
  };
  const trackOf = el => (el ? panels.findIndex(panel => panel === el || panel.contains(el)) : -1);

  const first = named(location.hash), start = trackOf(first);
  select(start < 0 ? 0 : start);
  // The page was laid out with all three tracks before this ran: put the named place back in view
  // once the page has settled, unless the reader has already moved. (A portal arrival is placed by
  // portal-warp.js, a few named anchors by language.js; doing it again here is harmless.)
  if (start >= 0) {
    let moved = false;
    const stop = () => { moved = true; };
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
    inputs.forEach(type => addEventListener(type, stop, { passive: true }));
    const settle = () => {
      inputs.forEach(type => removeEventListener(type, stop));
      if (!moved && named(location.hash) === first) first.scrollIntoView({ block: 'start', behavior: 'instant' });
    };
    if (document.readyState === 'complete') requestAnimationFrame(settle);
    else addEventListener('load', () => requestAnimationFrame(settle), { once: true });
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      select(i);
      history.replaceState(history.state, '', `#${panels[i].id}`);
    });
    tab.addEventListener('keydown', event => {
      const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      const next = (to + tabs.length) % tabs.length;
      select(next, true);
      history.replaceState(history.state, '', `#${panels[next].id}`);
    });
  });

  // a link elsewhere on the page to something inside a track opens that track before the jump
  document.addEventListener('click', event => {
    const link = event.target.closest && event.target.closest('a[href^="#"]');
    if (!link || link.classList.contains('ch-tab')) return;
    const i = trackOf(named(link.getAttribute('href')));
    if (i >= 0) select(i);
  }, true);
  addEventListener('hashchange', () => {
    const el = named(location.hash), i = trackOf(el);
    if (i < 0) return;
    select(i);
    el.scrollIntoView({ block: 'start' });
  });
})();

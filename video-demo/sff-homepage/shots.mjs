// The film as data: one fresh page per shot, scroll keyframes in seconds → chapter progress (or raw y).
// `at` fires the page's own controls at a given second, exactly as a click would. No cursor is drawn.
const CLICK = (selector, index = 0) => `document.querySelectorAll(${JSON.stringify(selector)})[${index}]?.click()`;
const PROVIDER = i => CLICK('[data-mc-model-chips] [data-model-index]', i);
const VARIANT = i => CLICK('[data-mc-variant-chips] [data-variant-index]', i);
const EFFORT = i => CLICK('[data-mc-effort-chips] [data-effort-index]', i);
const EQUIP = CLICK('.mc-confirm');
const PORTAL = id => CLICK(`[data-portal="${id}"]`);

export const LOADOUT = { model: 0, variant: 2, effort: 3, harness: 3 };

// The homepage is filmed as a visitor scrolls it: shots that share a `take` run in one browser on one clock, each picking up
// at rest exactly where the last one stopped, so a chapter change is the page's own scroll from one chapter into the next.
// Nothing is skipped inside a chapter: every stage the page has is crossed. The frame only dims to the page's dark where the
// film leaves the page (the Challenge page back to chapter 06, and the end card; DIP, applied in render.mjs).
// A key is a progress of the shot's own `section`, or { s, p } for another chapter's progress, or { y } for a page position.
// Keys marked 'glide' form a run with continuous speed that starts and ends at rest (see track in capture.mjs).
const G = 'glide';

// portal-warp.js arrive() and lightTrack(), replayed: the dark clears from the doorway, one ring, then the track's frame lights.
const ARRIVE_CLEAR = `document.documentElement.classList.add('is-shuttle-out')`;
const ARRIVE_GLOW = `{ const g = document.createElement('span'); g.className = 'track-glow'; g.setAttribute('aria-hidden', 'true'); document.getElementById('track-econ').append(g);
  const out = 'cubic-bezier(0.23, 1, 0.32, 1)'; g.animate([{ opacity: 0, easing: out }, { opacity: 1, offset: .18, easing: out }, { opacity: 0 }], { duration: 1400 }).finished.then(() => g.remove(), () => g.remove()); }`;
const ARRIVE_DONE = `{ const r = document.documentElement; delete r.dataset.shuttle; r.classList.remove('is-shuttle-out'); r.style.removeProperty('--shuttle-x'); r.style.removeProperty('--shuttle-y'); }`;
const CHALLENGE_CSS = `
  .subnav, .reading-progress, .track-gates, .site-header { display: none !important; }
  .section-heading:has(#tracks-title) { visibility: hidden !important; }
  .v2-page-challenge .field-track { scroll-margin-top: 36px !important; padding: 26px 44px 22px !important; margin-inline: 40px !important; }
  .v2-page-challenge .track-hero-row { gap: 20px 40px !important; }
  .v2-page-challenge .track-head .pill, .v2-page-challenge .track-head .track-tag { font-size: 19px !important; }
  .v2-page-challenge .track-hero-copy > h3 { font-size: 64px !important; margin-top: 20px !important; }
  .v2-page-challenge .track-hero-copy > .track-summary { font-size: 21px !important; line-height: 1.35 !important; color: var(--text-primary) !important; max-width: 30em !important; }
  .v2-page-challenge .track-guardian-canvas { width: 336px !important; height: 246px !important; }
  .v2-page-challenge .track-guardian-badge { font-size: 19px !important; letter-spacing: 0 !important; white-space: nowrap !important; padding: 7px 14px !important; }
  .v2-page-challenge .class-desc, .v2-page-challenge .class-feature { display: none !important; }
  .v2-page-challenge .class-list { margin-top: 12px !important; }
  .v2-page-challenge .class-row { grid-template-columns: 210px minmax(0, 1fr) auto !important; }
  .v2-page-challenge .class-item { padding-block: 4px !important; }
  .v2-page-challenge .class-call, .v2-page-challenge .class-count { font-size: 19px !important; }
  .v2-page-challenge .class-name { font-size: 24px !important; }
`;

export const SHOTS = [
  // Take 'home': the hero, then one scroll down the page through chapters 01-05 into the arena.
  { id: '01-hero', seconds: 8.4, take: 'home', veil: [1.0, 3.0], releaseAt: 0.35, ready: '.mc-hero', fadeIn: 0,
    keys: [[0, { y: 0 }], [6.6, { y: 0 }], [8.4, { s: 'metacase', p: .03 }]] },
  { id: '02-metacase', seconds: 22.6, take: 'home', joined: true, section: 'metacase',
    // A leaf turns only inside p = boundary - .0188 .. boundary (metacase-anatomy.js:336), so the path crosses that window slowly:
    // the fold, then 0.95 s (57 frames) for the turn, then the next page rises, then a hold.
    // Past .8 the book closes and its stage tabs form the signature (CHAPTERS, metacase-anatomy.js:14); its note shows past .88
    // (metacase.js), so the hold sits beyond that before the page moves on.
    keys: [[0, .03], [.8, .03], [3.2, .197], [3.8, .197],
      [4.4, .2452, G], [5.35, .264, G], [6.25, .331, G], [7.25, .331],
      [7.85, .3792, G], [8.8, .398, G], [9.7, .465, G], [10.7, .465],
      [11.3, .5132, G], [12.25, .532, G], [13.15, .599, G], [14.15, .599],
      [14.75, .6472, G], [15.7, .666, G], [16.6, .733, G], [17.6, .733],
      [19.4, .95], [20.8, .95], [22.6, { s: 'structure', p: .1 }]] },
  // Three steps: facts (to .4), similar structures (.4-.7), reuse (.7-1, metacase-archive.js:204-245).
  // metacase-archive.js:207 steps the camera at p = .4, the page's own cut; it is crossed while the scroll moves.
  { id: '03-retrieval', seconds: 11.6, take: 'home', joined: true, section: 'structure',
    keys: [[0, .1], [.5, .1], [2.5, .28], [3.7, .28], [5.6, .55], [6.8, .55], [8.5, .86], [9.8, .86], [11.6, { s: 'net', p: .07 }]] },
  { id: '04-network', seconds: 13.2, take: 'home', joined: true, section: 'net',
    // the page dives into the shelves around .63, so that step gets its own hold instead of being crossed at peak speed
    keys: [[0, .07], [1.6, .15], [1.9, .15], [4.4, .38], [5.0, .38], [7.4, .63], [8.0, .63], [10.2, .84], [11.0, .84], [13.2, { y: 'fields' }]] },
  // The chapter title, then the page scrolls on until the book stage pins, and steps through the three books.
  // The open book is the brightest thing in the film: it leaves for the arena over 3 s, as a sweep, not a flash.
  { id: '05-fields', seconds: 15.0, take: 'home', joined: true, section: 'fieldsTrack',
    keys: [[0, { y: 'fields' }], [.4, { y: 'fields' }], [2.4, .1], [4.4, .1], [5.9, .45], [8.6, .45], [10.1, .8], [12.0, .8], [15.0, { s: 'arena', p: .015 }]],
    // the page's 1.4 s book change runs on its own clock after the scroll crosses a boundary
    pageMotion: [[2.4, 5.4], [5.9, 8.9], [10.1, 13.1]],
    auditEveryFrame: true,
    auditBoxes: { from: 2.4, selectors: ['.mc-fields-rail', '.mc-fields-rail li', '.mc-flip.is-shown .mc-book', '.mc-flip.is-shown .mc-leaf.is-cover', '.mc-fbook .mc-fbook-label'] } },
  // One continuous take, so selecting the loadout runs straight into the shuttle with nothing to match at a seam.
  // Selecting: each click leaves 1.0-1.2 s for the robot's full turn into its new armour and the panel's cascade.
  // Harness is floor((p - .16) / .22 * 6) (arena.js:329), so the wheel stops at .295: at .31 it would equip Terminus-2, not Codex CLI.
  // Shuttle: the panel and wheel leave before the scroll passes .3067, past which the panel would offer the next harness.
  // Clicking a portal fires the page's own warp; the navigation it ends with is stopped so the iris can finish on this page.
  { id: '06-arena-shuttle', seconds: 29, take: 'home', joined: true, section: 'arena', arena: true, holdNavigation: true, fadeOut: 0,
    keys: [[0, .015], [1.8, .015], [3.8, .175], [9.0, .175],
      [9.5, .1875, G], [11.9, .2825, G], [12.4, .295, G], [15.0, .295],
      // the camera rides up to the robot at the end of each room, so the dwell sits mid-room and the close-ups pass quicker;
      // in the last room it all but goes through the robot (.857-.895), which is crossed as a fly-by
      [16.6, .41, G], [18.6, .50, G], [19.8, .60, G], [21.8, .69, G], [23.0, .79, G], [24.1, .845, G], [24.6, .90, G], [26.9, .965, G], [29, .965]],
    // the page swaps its heading in one frame at each of these progress values (arena.js stops): it leaves and returns instead
    swaps: [.16, .38, .57, .76, .93],
    fades: [{ sel: '.mc-loadout, .mc-wheel', at: [14.5, 15.0], from: 1, to: 0 }],
    at: [[4.0, PROVIDER(1)], [5.2, PROVIDER(2)], [6.4, PROVIDER(0)], [7.5, VARIANT(2)], [8.4, EFFORT(3)], [12.5, EQUIP], [27.7, PORTAL('econ')]],
    // the iris and its rings at 0.7x, so they can be seen passing the lens
    rate: [[0, 1], [27.7, .7]] },
  // The Challenge page under the same dark. The page's own arrival runs during warm-up, while the guardian's 3D loads,
  // and is replayed at frame 0 with the page's own classes, keyframes and timings (portal-warp.js arrive, lightTrack).
  { id: '06c-challenge-arrive', seconds: 5.5, url: 'challenge.html?via=portal#track-econ', joined: true, fadeIn: 0, loadout: LOADOUT, shuttleFrom: '06-arena-shuttle', pageDpr: 2,
    css: CHALLENGE_CSS,
    at: [[.15, ARRIVE_CLEAR], [.15 + .26 / .7, ARRIVE_GLOW], [.15 + .7 / .7, ARRIVE_DONE]],
    rate: [[0, .7], [1.8, 1]] },
  // Take 'home-end': back on the homepage, the participation workflow, then on down through the results to the team.
  // All five stages of metacase-run.js: Choose (to .2), Configure (.2-.36), Execute with the docking flash (.345-.385) and
  // the work (.41-.58), Verify (.62-.86), Contribute (.83-.97). Each is held once and the scroll moves between them.
  { id: '07-rules', seconds: 11.0, take: 'home-end', section: 'rules', ready: '#rules .mc-scene-pin',
    keys: [[0, .16], [.4, .185], [1.1, .185], [2.0, .31], [2.5, .31], [4.3, .6], [4.9, .6], [6.0, .79], [6.6, .79], [8.2, .98], [9.4, .98], [11.0, { y: 'tracks' }]] },
  // The results card is taller than the view under the header and section nav: its heading first, then down until the
  // three figures stand whole above the bottom edge.
  { id: '08-results', seconds: 6.8, take: 'home-end', joined: true,
    keys: [[0, { y: 'tracks' }], [1.4, { y: 'tracks' }], [3.0, { y: 'tracks+250' }], [5.2, { y: 'tracks+250' }], [6.8, { y: 'team-72' }]] },
  { id: '09-team', seconds: 3.8, take: 'home-end', joined: true, keys: [[0, { y: 'team-72' }], [3.8, { y: 'team-72' }]], css: 'main { padding-bottom: 240px !important; }' },
  // The end card has its own entrance out of the dark and is the last thing on screen.
  { id: '10-end', seconds: 7, reuse: true, card: 'cards/end.html', fadeIn: 0, fadeOut: 0 },
];

// Handoff §5: a hard cut or a fade of at most 0.4 s. Both fades stay inside that; the frames of full dark sit between them.
// A joined shot has neither: it continues the previous one's last frame.
export const DIP = { out: 0.35, in: 0.4, darkFrames: 7 };
export const timeline = (fps = 60) => {
  let t = 0;
  return SHOTS.map((s, i) => { const start = t, end = t + s.seconds; t = end + (SHOTS[i + 1]?.joined ? 0 : DIP.darkFrames / fps); return { id: s.id, start: +start.toFixed(3), end: +end.toFixed(3) }; });
};
export const CUBIC_IO = [0.65, 0, 0.35, 1];

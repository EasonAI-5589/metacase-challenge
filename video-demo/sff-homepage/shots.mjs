// The film as data: one fresh page per shot, scroll keyframes in seconds → chapter progress (or raw y).
// `at` fires the page's own controls at a given second, exactly as a click would. No cursor is drawn.
const CLICK = (selector, index = 0) => `document.querySelectorAll(${JSON.stringify(selector)})[${index}]?.click()`;
const PROVIDER = i => CLICK('[data-mc-model-chips] [data-model-index]', i);
const VARIANT = i => CLICK('[data-mc-variant-chips] [data-variant-index]', i);
const EFFORT = i => CLICK('[data-mc-effort-chips] [data-effort-index]', i);
const EQUIP = CLICK('.mc-confirm');
const PORTAL = id => CLICK(`[data-portal="${id}"]`);

export const LOADOUT = { model: 0, variant: 2, effort: 3, harness: 3 };

// Two kinds of change, and neither ever double-exposes two scenes:
//   between chapters the whole frame dims to the page's dark and the next scene rises (DIP, applied in render.mjs);
//   inside a chapter `dips` dim only the 3D scene and its labels while the heading and rail stay put, and the scroll
//   jumps while the scene is dark. Each dip is [starts dimming, dark at, fully back].
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
  { id: '01-hero', seconds: 8.7, reuse: true, y: [[0, 0], [8.7, 0]], veil: [1.0, 3.0], releaseAt: 0.35, ready: '.mc-hero', fadeIn: 0 },
  { id: '02-metacase', seconds: 18.4, section: 'metacase', ready: '#metacase .mc-scene-pin',
    // A leaf turns only inside p = boundary - .0188 .. boundary (metacase-anatomy.js:336), so the path crosses that window slowly:
    // the fold, then 0.95 s (57 frames) for the turn, then the next page rises, then a hold.
    keys: [[0, .03], [.8, .03], [3.2, .197], [3.8, .197],
      [4.4, .2452, G], [5.35, .264, G], [6.25, .331, G], [7.25, .331],
      [7.85, .3792, G], [8.8, .398, G], [9.7, .465, G], [10.7, .465],
      [11.3, .5132, G], [12.25, .532, G], [13.15, .599, G], [14.15, .599],
      [14.75, .6472, G], [15.7, .666, G], [16.6, .733, G], [18.4, .733]] },
  // metacase-archive.js:207 steps the camera at p = .4 (`p > .4 ? 1 : 0`), a one-frame jump on the page itself.
  // The scene is dark when the scroll crosses it, and the heading never moves.
  { id: '03-retrieval', seconds: 11.2, section: 'structure', ready: '#structure .mc-scene-pin',
    dips: [[5.95, 6.2, 6.6]],
    keys: [[0, .1], [.6, .1], [2.8, .28], [4.6, .28], [6.21, .39], [6.2101, .41], [8.7, .68], [11.2, .68]] },
  { id: '04-network', seconds: 13.6, section: 'net', ready: '#net .mc-scene-pin',
    // the page dives into the shelves around .63, so that step gets its own hold instead of being crossed at peak speed
    keys: [[0, .07], [1.8, .15], [2.1, .15], [4.8, .38], [5.5, .38], [8.1, .63], [8.7, .63], [11.1, .84], [13.6, .84]] },
  // Two compositions: the chapter title alone on the dark canvas, then the whole stage at its sticky position.
  // The larger viewport shrinks the whole shot to 0.92 so the stage fits the safe area; transform: scale would
  // break the page's own FLIP measurements. 70 CSS px of gutter is 96 px on output at this device scale.
  { id: '05-fields', seconds: 15.4, section: 'fieldsTrack', ready: null, viewport: [1392, 783], releaseAt: 0.2,
    css: `:root { --mc-gutter: 70px !important; }
      .mc-catalogue { padding-top: 300px !important; }
      .mc-catalogue .mc-head { margin-bottom: 460px !important; }
      [data-fieldbooks] { top: 41px !important; }
      .mc-fields-rail { margin-top: 24px !important; }
      .mc-label, .mc-label > span, .mc-book .mc-call, .mc-fbook-label small, .mc-fbook-n, .is-books .mc-fbook:not([data-slot="center"]) .mc-fbook-title { font-size: 20.5px !important; }`,
    // The title fades out, the scroll cuts while nothing is showing, and the stage fades in where it will stay,
    // so no readable text ever crosses the bottom of the safe area on its way in.
    keys: [[0, { y: 'fields' }], [3.1, { y: 'fields' }], [3.1001, .1], [5.4, .1], [6.9, .45], [10.0, .45], [11.5, .8], [15.4, .8]],
    // the page's 1.4 s book change runs on its own clock after the scroll crosses a boundary
    pageMotion: [[5.4, 8.4], [10.0, 13.0]],
    fades: [{ sel: '.mc-catalogue .mc-head', at: [2.85, 3.1], from: 1, to: 0 }, { sel: '[data-fieldbooks], canvas.mc-stage', at: [3.1, 3.5], from: 0, to: 1 }],
    auditEveryFrame: true,
    // from the first frame after the cut: until then the stage is off screen and fully transparent
    auditBoxes: { from: 3.11, selectors: ['.mc-fields-rail', '.mc-fields-rail li', '.mc-flip.is-shown .mc-book', '.mc-flip.is-shown .mc-leaf.is-cover', '.mc-fbook .mc-fbook-label'] } },
  // One continuous take, so selecting the loadout runs straight into the shuttle with nothing to match at a seam.
  // Selecting: each click leaves 1.0-1.2 s for the robot's full turn into its new armour and the panel's cascade.
  // Harness is floor((p - .16) / .22 * 6) (arena.js:329), so the wheel stops at .295: at .31 it would equip Terminus-2, not Codex CLI.
  // Shuttle: the panel and wheel leave before the scroll passes .3067, past which the panel would offer the next harness.
  // Clicking a portal fires the page's own warp; the navigation it ends with is stopped so the iris can finish on this page.
  { id: '06-arena-shuttle', seconds: 29, section: 'arena', ready: '.mc-chapter', arena: true, holdNavigation: true, fadeOut: 0,
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
  { id: '07-rules', seconds: 8.8, reuse: true, section: 'rules', ready: '#rules .mc-scene-pin',
    // the scene is dark while the scroll skips the docking flash (.345-.385) and every muzzle spark (.41-.58)
    dips: [[2.7, 2.95, 3.3], [3.95, 4.2, 4.55]],
    keys: [[0, .16], [.4, .185], [1.2, .185], [2.1, .31], [2.96, .31], [2.9601, .386], [4.21, .392], [4.2101, .585], [5.5, .6], [6.3, .7], [6.9, .7], [7.5, .78], [8.8, .78]] },
  { id: '08-results', seconds: 6.5, reuse: true, y: [[0, 'tracks'], [6.5, 'tracks']], warmY: 'tracks-1500', ready: null, css: '#team { visibility: hidden !important; }' },
  { id: '09-team', seconds: 4.2, reuse: true, y: [[0, 'team-72'], [4.2, 'team-72']], warmY: 'team-1500', ready: null, css: '#tracks { visibility: hidden !important; } main { padding-bottom: 240px !important; }' },
  // The end card has its own entrance out of the dark and is the last thing on screen.
  { id: '10-end', seconds: 7, reuse: true, card: 'cards/end.html', fadeIn: 0, fadeOut: 0 },
];

// Handoff §5: a hard cut or a fade of at most 0.4 s. Both fades stay inside that; the frames of full dark sit between them.
export const DIP = { out: 0.35, in: 0.4, darkFrames: 7 };
export const SCENE_LAYER = 'canvas.mc-stage, .mc-tags, .mc-captions';
export const timeline = (fps = 60) => {
  let t = 0;
  return SHOTS.map((s, i) => { const start = t, end = t + s.seconds; t = end + (SHOTS[i + 1]?.joined ? 0 : DIP.darkFrames / fps); return { id: s.id, start: +start.toFixed(3), end: +end.toFixed(3) }; });
};
export const CUBIC_IO = [0.65, 0, 0.35, 1];

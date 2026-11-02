// The film as data: one fresh page per shot, scroll keyframes in seconds → chapter progress (or raw y).
// `at` fires the page's own controls at a given second, exactly as a click would. No cursor is drawn.
const CLICK = (selector, index = 0) => `document.querySelectorAll(${JSON.stringify(selector)})[${index}]?.click()`;
const PROVIDER = i => CLICK('[data-mc-model-chips] [data-model-index]', i);
const VARIANT = i => CLICK('[data-mc-variant-chips] [data-variant-index]', i);
const EFFORT = i => CLICK('[data-mc-effort-chips] [data-effort-index]', i);
const EQUIP = CLICK('.mc-confirm');

export const LOADOUT = { model: 0, variant: 2, effort: 3, harness: 3 };

export const SHOTS = [
  { id: '01-hero', seconds: 9, y: [[0, 0], [9, 0]], veil: [1.0, 3.0], releaseAt: 0.35, ready: '.mc-hero', textIn: false },
  { id: '02-metacase', seconds: 11.5, section: 'metacase', ready: '#metacase .mc-scene-pin',
    // A leaf turns only inside p = boundary - .0188 .. boundary (metacase-anatomy.js:336), so the path crosses that window slowly:
    // the fold goes quickly, the turn takes 0.55 s, the next page rises, then a hold. Each stage still gets 2 s.
    keys: [[0, .03], [.9, .03], [2.3, .197], [2.8, .197],
      [3.15, .2452, 'linear'], [3.7, .264, 'linear'], [4.2, .331, 'linear'], [4.8, .331],
      [5.15, .3792, 'linear'], [5.7, .398, 'linear'], [6.2, .465, 'linear'], [6.8, .465],
      [7.15, .5132, 'linear'], [7.7, .532, 'linear'], [8.2, .599, 'linear'], [8.8, .599],
      [9.15, .6472, 'linear'], [9.7, .666, 'linear'], [10.2, .733, 'linear'], [11.5, .733]] },
  // metacase-archive.js:207 steps the camera at p = .4 (`p > .4 ? 1 : 0`), a one-frame jump on the page itself.
  // The shot is split there so the jump falls inside the crossfade instead of on screen.
  { id: '03a-retrieval', seconds: 4.75, section: 'structure', ready: '#structure .mc-scene-pin', textOut: 'band', textIn: true,
    keys: [[0, .1], [.7, .1], [2.0, .28], [3.6, .28], [3.85, .33, 'linear'], [4.75, .395, 'linear']] },
  { id: '03b-retrieval', seconds: 4.25, section: 'structure', ready: '#structure .mc-scene-pin', textIn: 'band',
    keys: [[0, .405], [.3, .42, 'linear'], [1.4, .68], [4.25, .68]] },
  { id: '04-network', seconds: 10, section: 'net', ready: '#net .mc-scene-pin',
    // the page dives into the shelves around .63, so that step gets its own hold instead of being crossed at peak speed
    keys: [[0, .07], [.3, .07], [1.4, .15], [1.6, .15], [3.2, .38], [3.7, .38], [5.2, .63], [5.6, .63], [7.0, .84], [10, .84]] },
  // Two compositions: the chapter title alone on the dark canvas, then the whole stage at its sticky position.
  // The larger viewport shrinks the whole shot to 0.92 so the stage fits the safe area; transform: scale would
  // break the page's own FLIP measurements. 70 CSS px of gutter is 96 px on output at this device scale.
  { id: '05-fields', seconds: 14.1, section: 'fieldsTrack', ready: null, viewport: [1392, 783], textIn: false, releaseAt: 0.2,
    css: `:root { --mc-gutter: 70px !important; }
      .mc-catalogue { padding-top: 300px !important; }
      .mc-catalogue .mc-head { margin-bottom: 460px !important; }
      [data-fieldbooks] { top: 41px !important; }
      .mc-fields-rail { margin-top: 24px !important; }
      .mc-label, .mc-label > span, .mc-book .mc-call, .mc-fbook-label small, .mc-fbook-n, .is-books .mc-fbook:not([data-slot="center"]) .mc-fbook-title { font-size: 20.5px !important; }`,
    // The title fades out, the scroll cuts while nothing is showing, and the stage fades in where it will stay,
    // so no readable text ever crosses the bottom of the safe area on its way in.
    keys: [[0, { y: 'fields' }], [3.4, { y: 'fields' }], [3.4001, .1], [5.7, .1], [6.5, .45], [9.1, .45], [9.9, .8], [14.1, .8]],
    fades: [{ sel: '.mc-catalogue .mc-head', at: [3.2, 3.4], from: 1, to: 0 }, { sel: '[data-fieldbooks], canvas.mc-stage', at: [3.4, 3.9], from: 0, to: 1 }],
    auditEveryFrame: true,
    // from the first frame after the cut: until then the stage is off screen and fully transparent
    auditBoxes: { from: 3.41, selectors: ['.mc-fields-rail', '.mc-fields-rail li', '.mc-flip.is-shown .mc-book', '.mc-flip.is-shown .mc-leaf.is-cover', '.mc-fbook .mc-fbook-label'] },
    // the page's 1.4 s book change runs at 0.55x and its bright fade-out at 0.3x: no abrupt brightness jump on a big screen
    rate: [[0, 1], [5.7, .55], [6.0, .3], [6.7, .55], [9.1, .55], [9.3, .3], [10.1, .55], [12.8, 1]] },
  { id: '06a-arena', seconds: 8.8, section: 'arena', ready: '.mc-chapter', arena: true,
    keys: [[0, .015], [2.3, .015], [3.4, .17], [5.0, .17], [6.0, .29], [8.8, .29]],
    // one explained provider switch and back to the page's default, then model, effort, harness; at least 2 s stable at the end
    at: [[3.5, PROVIDER(1)], [4.2, PROVIDER(0)], [4.7, VARIANT(2)], [4.95, EFFORT(3)], [6.2, EQUIP]] },
  { id: '06b-choose', seconds: 3.8, section: 'arena', ready: '.mc-chapter', arena: true, loadout: LOADOUT,
    keys: [[0, .955], [3.8, .975]] },
  { id: '07-rules', seconds: 8.5, section: 'rules', ready: '#rules .mc-scene-pin',
    // two hard cuts inside the shot skip the docking flash (.345-.385) and every muzzle spark (.41-.58)
    keys: [[0, .15], [.7, .185], [1.5, .185], [2.4, .31], [3.1, .31], [3.1001, .386], [4.3, .392], [4.3001, .585], [5.6, .6], [6.4, .7], [7.0, .7], [7.6, .78], [8.5, .78]] },
  { id: '08-results', seconds: 6.8, reuse: true, textOut: false, y: [[0, 'tracks'], [6.8, 'tracks']], warmY: 'tracks-1500', ready: null, css: '#team { visibility: hidden !important; }' },
  { id: '09-team', seconds: 4.5, dip: true, textIn: false, y: [[0, 'team-72'], [4.5, 'team-72']], warmY: 'team-1500', ready: null, css: '#tracks { visibility: hidden !important; } main { padding-bottom: 240px !important; }' },
  { id: '10-end', seconds: 7, reuse: true, card: 'cards/end.html' },
];

// Crossfade into each shot, seconds. Handoff §5: hard cut or at most 0.4 s.
export const XFADE = 0.3;
export const CUBIC_IO = [0.65, 0, 0.35, 1];

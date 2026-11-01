// The film as data: one fresh page per shot, scroll keyframes in seconds → chapter progress (or raw y).
// `at` fires the page's own controls at a given second, exactly as a click would. No cursor is drawn.
const CLICK = (selector, index = 0) => `document.querySelectorAll(${JSON.stringify(selector)})[${index}]?.click()`;
const PROVIDER = i => CLICK('[data-mc-model-chips] [data-model-index]', i);
const VARIANT = i => CLICK('[data-mc-variant-chips] [data-variant-index]', i);
const EFFORT = i => CLICK('[data-mc-effort-chips] [data-effort-index]', i);
const EQUIP = CLICK('.mc-confirm');

export const LOADOUT = { model: 0, variant: 2, effort: 3, harness: 3 };

export const SHOTS = [
  { id: '01-hero', seconds: 9.5, y: [[0, 0], [9.5, 0]], veil: [1.0, 3.0], releaseAt: 0.35, ready: '.mc-hero' },
  { id: '02-metacase', seconds: 11.5, section: 'metacase', ready: '#metacase .mc-scene-pin',
    keys: [[0, .03], [.9, .03], [2.3, .19], [3.0, .19], [4.2, .33], [4.9, .33], [6.1, .465], [6.8, .465], [8.0, .6], [8.7, .6], [9.9, .735], [11.5, .735]] },
  { id: '03-retrieval', seconds: 9, section: 'structure', ready: '#structure .mc-scene-pin',
    keys: [[0, .1], [.7, .1], [2.0, .28], [4.0, .28], [5.6, .68], [9, .68]] },
  { id: '04-network', seconds: 10, section: 'net', ready: '#net .mc-scene-pin',
    keys: [[0, .07], [.6, .07], [1.8, .15], [2.3, .15], [3.5, .38], [5.1, .38], [6.3, .84], [10, .84]] },
  { id: '05-fields', seconds: 12.5, section: 'fieldsTrack', ready: '.mc-fbook[data-slot="center"] .mc-art',
    // the network's own words would ghost through the crossfade at a new height; its 3D may stay
    css: '#net .mc-captions, #net .mc-scene-foot, #net .mc-scene-head, #net .mc-tags { visibility: hidden !important; }',
    // starts with the first book below the reveal line, so it opens on camera after the crossfade
    keys: [[0, { y: 'fields-232' }], [1.5, { y: 'fields+48' }], [3.5, { y: 'fields+48' }], [4.6, .1], [6.2, .1], [7.0, .45], [9.0, .45], [9.8, .8], [12.5, .8]] },
  { id: '06a-arena', seconds: 9.5, section: 'arena', ready: '.mc-chapter', arena: true,
    keys: [[0, .015], [2.8, .015], [4.0, .17], [6.9, .17], [8.1, .29], [9.5, .29]],
    // provider: the next two in page order, then back to the page's default; every tap turns the agent once
    at: [[4.2, PROVIDER(1)], [4.9, PROVIDER(2)], [5.6, PROVIDER(0)], [6.3, VARIANT(2)], [6.75, EFFORT(3)], [8.5, EQUIP]] },
  { id: '06b-choose', seconds: 4, section: 'arena', ready: '.mc-chapter', arena: true, loadout: LOADOUT,
    keys: [[0, .955], [4, .975]] },
  { id: '07-rules', seconds: 8.5, section: 'rules', ready: '#rules .mc-scene-pin',
    // two hard cuts inside the shot skip the docking flash (.345-.385) and every muzzle spark (.41-.58)
    keys: [[0, .15], [.7, .185], [1.5, .185], [2.4, .31], [3.1, .31], [3.1001, .386], [4.3, .392], [4.3001, .585], [5.6, .6], [6.4, .7], [7.0, .7], [7.6, .78], [8.5, .78]] },
  { id: '08-results', seconds: 7, y: [[0, 'tracks'], [7, 'tracks']], warmY: 'tracks-1500', ready: null, css: '#team { visibility: hidden !important; }' },
  { id: '09-team', seconds: 3.5, y: [[0, 'team-72'], [3.5, 'team-72']], warmY: 'team-1500', ready: null, css: '#tracks { visibility: hidden !important; } main { padding-bottom: 240px !important; }' },
  { id: '10-end', seconds: 7, card: 'cards/end.html' },
];

// Crossfade into each shot, seconds. Handoff §5: hard cut or at most 0.4 s.
export const XFADE = 0.3;
export const CUBIC_IO = [0.65, 0, 0.35, 1];

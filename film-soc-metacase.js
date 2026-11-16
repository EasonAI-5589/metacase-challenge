/* film-soc-metacase.js — beat 4 of the society Metacase film (HR-T3-114): Reflection & reuse, where
 * every item of the case is taken back to the place in the yard it is about. This beat takes five
 * beats of scroll (LONG in the film). Everything is a pure function of real, the beat's progress;
 * t only adds idle life. The robot walks to each place and looks.
 *   real 0–.03    the yard as the run left it: the 84 listed supervisors on the ground, the four
 *                 hubs behind them, the three package crates on the bench in front
 *   real .03–.42  seven evidence items, .0557 each, in the page's order:
 *                 the roster (one of the 84 walks off the ground: 83 in scope); attendance (three
 *                 people turn amber at the sign-out terminal: 360 minutes each, pending); the tests
 *                 (two void practice sheets); the opportunity log (the ground sorts into three
 *                 pens: 73, 8 and 2); behaviour coding (a board of 1,145 observations with 18 in
 *                 dispute, six supervisors marked); the hubs' weekly metrics (24 weeks at each hub,
 *                 the week of 18 May an estimate at all four); the disruptions (a chiller repair a
 *                 day apart: this run placed it at HUB-01, the rubric names HUB-03)
 *   real .425     what failed: the whole yard, the hubs flagged
 *   real .46–.81  eight scores, .044 each, each on a sign at its place: packages A, B and C on
 *                 their crates (10 / 10, 17 / 17, 13 / 13), the sample on the pens (39 / 39), then
 *                 behaviour (0 / 3), the hub comparison (0 / 9), attribution (0 / 6) and
 *                 traceability (0 / 9, five source chains that break off); the total over the hubs
 *                 climbs to 79 / 106
 *   real .81–.86  the yard is gathered: people and props turn to light and rise; the open Metacase
 *                 book comes down onto the cleared ground; the 0.745 medallion flies from the total
 *                 sign onto its page (.855)
 *   real .86–1    the ending, on lp (.54–1), shared with the other cases: the light pours into the
 *                 page, the cover lifts, hangs and slams (.69), light leaks from the seam, the tabs
 *                 slide out, the thread draws the signature through them, the book rises and turns.
 *                 The hubs stay behind it.
 * Reduced motion gets one still, at .855: the book lies open in the yard, the medallion on its page.
 * All entities and data of this case are synthetic; the set carries names, counts, statuses and
 * amounts only. */
import { yard, crowd, hub, crate, sign, pen, STATUS, cameraLine, pathAt, lin, ease, mix, backOut } from './film-soc-kit.js?v=mc-1c165fc3e2';

const TAU = Math.PI * 2;
const easeOut = (x, k = 3) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), k);
const easeIn = (x, k = 2) => Math.pow(Math.min(1, Math.max(0, x)), k);
const springy = x => { const p = Math.min(1, Math.max(0, x)) - 1; return 1 + 2.6 * p * p * p + 1.6 * p * p; }; // passes 1, settles
const bump = (x, a, w) => { const u = (x - a) / w; return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI); };
const flash = (x, a, w) => { const u = (x - a) / w; return u < 0 || u >= 1 ? 0 : (1 - u) * (1 - u); };
// a decaying wobble after an impact at a: 1 at the hit, swinging to rest over w
const wobble = (x, a, w, cycles = 1.25) => { const u = (x - a) / w; return u < 0 || u >= 1 ? 0 : Math.cos(u * Math.PI * 2 * cycles) * (1 - u) * (1 - u); };

// The book lands in the middle of the yard: its own coordinates sit at (BX, 0, BZ) of the set.
const BX = .5, BZ = .5;
const END_A = .86, atEnd = old => END_A + (old - .54) / .46 * (1 - END_A);
// The ending's camera line, joined by a C1 Hermite spline in real: high over the landed book, a
// push onto the page, low in front of the fore-edge for the slam, up as the tabs come out, and round
// to a low three-quarter on the risen book.
const END_KEYS = [
  { at: END_A, pos: [-1.2, 7.0, 10.8], look: [.7, .55, .1], fov: 35.5, g: 5.6, sx: -0.2, sy: 0 },
  { at: atEnd(.6), pos: [-.7 + BX, 5.0, 8.9 + BZ], look: [BX, .4, .9 + BZ], fov: 33, g: 4.6, sx: 0, sy: 0 },
  { at: atEnd(.66), pos: [BX, 1.6, 7.5 + BZ], look: [BX, .6, BZ], fov: 32, g: 4.3, sx: 0, sy: 0 },
  { at: atEnd(.72), pos: [BX, 1.6, 7.6 + BZ], look: [BX, .6, BZ], fov: 32, g: 4.3, sx: 0, sy: 0 },
  { at: atEnd(.8), pos: [.1 + BX, 2.8, 9.6 + BZ], look: [-.5 + BX, .7, 1.2 + BZ], fov: 31, g: 4.8, sx: 0.3, sy: 0 },
  { at: atEnd(.95), pos: [5.2 + BX, 2.6, 9.6 + BZ], look: [.3 + BX, 1.45, .5 + BZ], fov: 30, g: 5.2, sx: 0.4, sy: 0 },
  { at: 1, pos: [5.05 + BX, 2.55, 9.3 + BZ], look: [.3 + BX, 1.45, .5 + BZ], fov: 30, g: 5.2, sx: 0.4, sy: 0 },
];
// The camera in the yard: one shot per place, eased from one to the next. g, sx and sy are for the
// stacked layout only: the width of the shot's group, and where its middle is.
const WIDE = { pos: [1.5, 6.6, 11.2], look: [1.1, .3, -.3], fov: 34, g: 6.4, sx: -0.35, sy: 0 };
const GROUND = { pos: [.5, 5.2, 7.4], look: [.4, .2, .2], fov: 36, g: 4.9, sx: 0.45, sy: 0.2 };
const STATION = { pos: [.75, 5.4, 7.6], look: [.65, .3, .1], fov: 36, g: 5.1, sx: 0.4, sy: 0.2 };
const PENS = { pos: [.55, 5.4, 7.6], look: [.45, .2, .1], fov: 36, g: 5.1, sx: .45, sy: .5 };
const BOARD = { pos: [1.25, 6.4, 8.6], look: [1.15, .4, -.2], fov: 36, g: 6.9, sx: .35, sy: .3 };
const HUBS = { pos: [.05, 5.8, 5.2], look: [-.05, .4, -2.0], fov: 36, g: 5.7, sx: 0.55, sy: 0.5 };
const REPAIR = { pos: [-.2, 5.4, 4.6], look: [-.35, .5, -2.2], fov: 36, g: 5.0, sx: 0.5, sy: 0.5 };
const CRATES = { pos: [.45, 4.6, 8.6], look: [.2, .6, 1.4], fov: 36, g: 4.9, sx: .42, sy: 1.3 };
const SHELF = { pos: [2.0, 3.6, 7.2], look: [2.0, .4, 2.0], fov: 35, g: 4.4, sx: 0.6, sy: 0.1 };
const LAND = { pos: END_KEYS[0].pos, look: END_KEYS[0].look, fov: END_KEYS[0].fov, g: END_KEYS[0].g, sx: END_KEYS[0].sx, sy: END_KEYS[0].sy };
const YARD_KEYS = [[0, WIDE], [.028, WIDE], [.042, GROUND], [.083, GROUND], [.097, STATION], [.195, STATION], [.209, PENS], [.25, PENS], [.264, BOARD], [.306, BOARD],
  [.32, HUBS], [.362, HUBS], [.376, REPAIR], [.42, REPAIR], [.434, WIDE], [.455, WIDE], [.47, CRATES], [.588, CRATES], [.602, PENS], [.632, PENS], [.646, BOARD], [.676, BOARD],
  [.69, HUBS], [.72, HUBS], [.734, REPAIR], [.764, REPAIR], [.778, SHELF], [.81, SHELF], [.832, LAND], [END_A, LAND]].map(([at, s]) => ({ at, ...s }));

// The score medallion: where it lands on the front page and where its arc starts and bends (the
// book's own set coordinates), when it leaves (lp) and how it tumbles on the way.
const DUR = .2, HOVER = 1.2, SIZE = 1.3;
const TOKENS = [
  { key: 'medal', color: 0xf2b545, land: [0, 1.2], from: [.45, 2.3, -3.28], bend: [.1, 4.8, -1.2], s: .125, spin: [1.4, 3.2, .2], yaw: -.15 },
];
// The seven evidence items and the eight scoring groups, in the order of the page's cards.
const EV_A = .03, EV_W = .39 / 7, SC_A = .46, SC_W = .044;
const GROUPS = [
  { id: 'A', pts: 10, max: 10 }, { id: 'B', pts: 17, max: 17 }, { id: 'C', pts: 13, max: 13 }, { id: 'SAMPLE', pts: 39, max: 39 },
  { id: 'BEHAVIOUR', pts: 0, max: 3 }, { id: 'OPERATIONS', pts: 0, max: 9 }, { id: 'ATTRIBUTION', pts: 0, max: 6 }, { id: 'TRACEABILITY', pts: 0, max: 9 },
];
const TOTAL = 106, GATHER = .812, LAND_A = .822, LAND_B = .848, MEDAL_HIT = .855, POUR_A = .54;
// The ending's timeline (lp) was written for .54–1; real maps onto it, and the medallion's flight
// (lp .125–.325) onto real .812–.855. Nothing else on lp happens before .54.
const lpOf = r => (r <= GATHER ? .125 * r / GATHER : r <= MEDAL_HIT ? .125 + (r - GATHER) / (MEDAL_HIT - GATHER) * .2 : r <= END_A ? .325 + (r - MEDAL_HIT) / (END_A - MEDAL_HIT) * .215 : .54 + (r - END_A) / (1 - END_A) * .46);
const SIG = 0;

// where things stand in the yard (set coordinates)
const HUB_X = [-1.6, -.2, 1.2, 2.6], HUB_Z = -2.55, HUB_S = .8, WEEKS = 24, BAR_Z = -1.92;
const BENCH = { x: .62, z: 2.3, top: .25 }, PACK_X = [-.8, .45, 1.95];
const SPOT = { x: 2.1, z: -.1 }, BOARD_AT = { x: 3.75, z: -.4 }, CHILLER = { x: 1.9, z: -2.15 }, SHELF_AT = { x: 3.3, z: 2.3 }, TOTAL_X = .95, GAP_X = -1.0;
const MARK2 = [16, 47, 68], MARK3 = [25, 59], MARK5 = [8, 19, 27, 36, 48, 55];   // the people an item is about (indices on the ground)

export async function build(ctx) {
  const { THREE, kit, set, accent, reduce, camera, renderer, util, hand, layout } = ctx;
  const { PALETTE, BOOK, BOOK_CENTRE, STAGE_COLORS, GUN_HOLD, add, block, cyl, ball, rbox, mat, closedBook, bookTabs, robot } = kit;
  const { smooth, lerp, glowSprite } = util;
  const { PW, PD, T, BOARD: BOARD_T } = BOOK;
  const PAGE = BOARD_T + T / 2;                     // the open pages: the block splits at its middle
  const SPINE_H = T + BOARD_T * 2;
  const glowMap = glowSprite(0xffffff, 1).material.map;
  const additive = (color, opacity = 1, map = glowMap) => new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const sprite = (color, size, opacity = 0) => { const s = glowSprite(color, size, opacity); s.material.fog = false; s.renderOrder = 2; return s; };
  const basic = (color = 0xffffff) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const own = (color, intensity = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: .5 });
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  const MONO = '"Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  function canvasTexture(W, H, draw) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const paint = () => { const g = c.getContext('2d'); g.clearRect(0, 0, W, H); draw(g, W, H); tex.needsUpdate = true; };
    paint(); document.fonts?.ready.then(paint);
    return tex;
  }
  // a cloud of glowing points whose positions and colours the update writes in place
  // (paint: true draws normally, with an alpha per point, so it shows on the cream page too)
  function cloud(n, size, parent, paint = false) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * (paint ? 4 : 3));
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(col, paint ? 4 : 3).setUsage(THREE.DynamicDrawUsage));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: glowMap, vertexColors: true, transparent: true, depthWrite: false, blending: paint ? THREE.NormalBlending : THREE.AdditiveBlending, sizeAttenuation: true, fog: false }));
    pts.frustumCulled = false; pts.renderOrder = 3; parent.add(pts);
    return { pts, pos, col, done() { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; } };
  }

  /* ================= the yard ================= */
  const ground = yard({ THREE, kit, set, accent });
  const big = (text, size = 84, color = '#ffffff') => ({ text, size, weight: 800, color, font: MONO });
  const small = (text, color = '#aab6cc', size = 38) => ({ text, size, weight: 700, color, track: 3 });
  // a sign on a post; it grows out of the ground when shown
  function post(key, lines, x, z, { w = 1.3, h = .44, color = STATUS.verified, up = .8, ry = 0, k = 1.25 } = {}) {
    const s = sign({ THREE, kit, key: `meta-${key}`, lines, w, h, color, post: up, px: 512 });
    s.group.position.set(x, 0, z); s.group.rotation.y = ry; s.group.visible = false; set.add(s.group);
    s.k = k;
    return s;
  }
  const show = (obj, on) => { const g = obj.group || obj; g.visible = on > .01; if (g.visible) g.scale.setScalar(Math.max(.001, backOut(on, 1.5)) * (obj.k || 1)); };
  const ROSE = hex(0xffc2cf), AMB = hex(0xffd27a), GRN = hex(0x7ff0a6);

  /* ---- the hubs, the 24 weeks of metrics in front of each, and the chiller ---- */
  const HUB_COLORS = [PALETTE.teal, PALETTE.sky, PALETTE.violet, 0];
  const hubs = HUB_X.map((x, k) => { const h = hub({ THREE, kit, name: `HUB-0${k + 1}`, color: HUB_COLORS[k], deferred: k === 3 }); h.group.position.set(x, 0, HUB_Z); h.group.scale.setScalar(HUB_S); set.add(h.group); return h; });
  const weekBars = new THREE.InstancedMesh(new THREE.BoxGeometry(.034, 1, .034).translate(0, .5, 0), basic(), HUB_X.length * WEEKS);
  weekBars.frustumCulled = false; set.add(weekBars);
  const weekH = [], weekBase = [], CHART_Y = .9, chartEdge = own(PALETTE.sky, .5);
  HUB_X.forEach((x, k) => {
    for (let w = 0; w < WEEKS; w++) { const r = Math.sin(k * 12.9898 + w * 7.233) * 43758.5453; weekH.push(w === WEEKS - 1 ? .66 : .2 + .4 * (r - Math.floor(r))); }
    // the chart's board, over the hub's roof
    const b = new THREE.Group(); b.position.set(x, CHART_Y - .05, HUB_Z); b.visible = false; set.add(b); weekBase.push(b);
    add(b, rbox(1.1, .82, .04, .02), mat(0x0d1524), 0, .41, 0, false);
    add(b, rbox(1.15, .87, .02, .02), chartEdge, 0, .41, -.012, false);
    [-.4, .4].forEach(dx => cyl(b, .02, .02, .2, 0x394560, dx, -.2, 0, 6));
  });
  const chiller = new THREE.Group(); chiller.position.set(CHILLER.x, 0, CHILLER.z); chiller.visible = false; set.add(chiller);
  block(chiller, .34, .5, .3, PALETTE.slate, 0, 0, 0, .05);
  const fan = cyl(chiller, .12, .12, .03, PALETTE.ink, 0, .11, .155, 20); fan.rotation.x = Math.PI / 2; fan.position.set(0, .27, .155);
  const fanBlade = add(chiller, rbox(.2, .035, .012, .006), mat(PALETTE.stone), 0, .27, .175, false);
  const chillLamp = own(STATUS.pending, 1.2); ball(chiller, .04, chillLamp, .1, .54, .08, 10);
  // this run's marker (a pin over HUB-01) and the rubric's (a ring over HUB-03)
  const pin = new THREE.Group(); pin.visible = false; set.add(pin);
  const pinMat = own(STATUS.disputed, 1.4);
  add(pin, new THREE.ConeGeometry(.1, .26, 14).rotateX(Math.PI), pinMat, 0, 0, 0, false); ball(pin, .1, pinMat, 0, .2, 0, 14);
  const ringMat = own(PALETTE.teal, 1.5);
  const ring = add(set, new THREE.TorusGeometry(.42, .022, 8, 48).rotateX(Math.PI / 2), ringMat, HUB_X[2], .98, HUB_Z, false); ring.visible = false;
  // the dotted line from where this run put the repair to where the rubric has it
  const ARC = 12, arcDots = new THREE.InstancedMesh(new THREE.SphereGeometry(.04, 8, 6), basic(), ARC);
  arcDots.frustumCulled = false; set.add(arcDots);

  /* ---- the people: 84 on the roll-call ground, later in three pens ---- */
  const NP = 84, people = crowd({ THREE, kit, n: NP }); set.add(people.group);
  const gridAt = i => [-1.2 + (i % 10) * .27, -1.05 + Math.floor(i / 10) * .26];
  const penAt = i => (i < 73 ? [-.1 + (i % 10 - 4.5) * .255, -.05 + (Math.floor(i / 10) - 3.5) * .255] : i < 81 ? [1.95 + ((i - 73) % 2 - .5) * .26, -.4 + (Math.floor((i - 73) / 2) - 1.5) * .255] : [1.95 + (i - 81.5) * .26, .75]);
  const P = Array.from({ length: NP }, (_, i) => ({ g: gridAt(i), p: i === 83 ? [1.75, .55] : penAt(i), st: ((i * 7) % 10) / 10 }));
  const pens = [
    pen({ THREE, kit, w: 2.8, d: 2.25, color: STATUS.verified }), pen({ THREE, kit, w: .78, d: 1.25, color: STATUS.pending }), pen({ THREE, kit, w: .78, d: .5, color: STATUS.neutral }),
  ];
  [[-.1, -.05], [1.95, -.4], [1.95, .75]].forEach(([x, z], k) => { pens[k].group.position.set(x, 0, z); pens[k].group.visible = false; set.add(pens[k].group); });
  const MARKS = 6, marks = new THREE.InstancedMesh(new THREE.RingGeometry(.15, .2, 28).rotateX(-Math.PI / 2), basic(), MARKS);
  marks.frustumCulled = false; set.add(marks);
  const BLUE = new THREE.Color(0x4a7fd4), C_PEND = new THREE.Color(STATUS.pending), C_NEUT = new THREE.Color(STATUS.neutral), C_DISP = new THREE.Color(STATUS.disputed), C_OK = new THREE.Color(STATUS.verified), tc = new THREE.Color();
  people.hat(83, PALETTE.slate);

  /* ---- the bench with the three packages, as the run disposed of them ---- */
  const bench = new THREE.Group(); set.add(bench);
  block(bench, 4.0, BENCH.top, .72, 0x26324d, BENCH.x, 0, BENCH.z, .05);
  const benchEdge = own(accent, .8); block(bench, 4.04, .03, .76, benchEdge, BENCH.x, BENCH.top - .035, BENCH.z, .012).castShadow = false;
  const PASS = [[true], [true, true, true, false], [true, false]], WOOD = new THREE.Color(0xc79a5b);
  const packs = PASS.map((pass, k) => {
    const c = crate({ THREE, kit, letter: 'ABC'[k], units: pass.length });
    c.group.position.set(PACK_X[k], BENCH.top, BENCH.z); bench.add(c.group);
    c.segments.forEach((s, j) => { const to = pass[j] ? C_OK : C_PEND; s.mat.color.copy(WOOD).lerp(to, .7); s.mat.emissive = to.clone(); s.mat.emissiveIntensity = .28; });
    return c;
  });
  // A's retained tenth, amber, beside it
  block(bench, .05, .5, .52, mat(STATUS.pending, { emissive: STATUS.pending, intensity: .4 }), PACK_X[0] + .36, BENCH.top, BENCH.z, .02);

  /* ---- the things an item brings with it: they rise for their item and fold away after ---- */
  // the sign-out terminal (attendance)
  const terminal = new THREE.Group(); terminal.position.set(SPOT.x, 0, SPOT.z); terminal.visible = false; set.add(terminal);
  cyl(terminal, .05, .07, .62, 0x394560, 0, 0, 0, 10);
  block(terminal, .46, .5, .2, 0x26324d, 0, .5, 0, .05);
  const termScreen = basic(0xffb347); add(terminal, new THREE.PlaneGeometry(.34, .2), termScreen, 0, .82, .102, false);
  const termLamp = own(STATUS.pending, 1.4); ball(terminal, .05, termLamp, 0, 1.05, 0, 12);
  // the test desk (two void practice sheets)
  const voidTex = canvasTexture(256, 340, (g, w, h) => {
    g.fillStyle = '#f6efe0'; g.beginPath(); g.roundRect(0, 0, w, h, 18); g.fill();
    g.fillStyle = '#cbc4b4'; [40, 72, 104, 220, 252, 284].forEach((y, i) => g.fillRect(28, y, i % 2 ? 150 : 200, 12));
    g.save(); g.translate(w / 2, h / 2 + 2); g.rotate(-.22);
    g.strokeStyle = hex(STATUS.disputed); g.lineWidth = 8; g.strokeRect(-98, -38, 196, 76);
    g.fillStyle = hex(STATUS.disputed); g.font = '800 62px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('VOID', 0, 4); g.restore();
  });
  const desk = new THREE.Group(); desk.position.set(SPOT.x, 0, SPOT.z); desk.visible = false; set.add(desk);
  block(desk, 1.0, .36, .5, 0x394560, 0, 0, 0, .05);
  [-.24, .24].forEach(x => { const s = add(desk, new THREE.PlaneGeometry(.34, .45), new THREE.MeshStandardMaterial({ map: voidTex, roughness: .8 }), x, .6, .02, false); s.rotation.x = -.3; });
  // the observation board: 1,145 coded observations, 18 of them in dispute (six supervisors, three each)
  const OBS = 1145, COLS = 47, DISPUTED = new Set([101, 102, 103, 262, 263, 264, 418, 419, 420, 577, 578, 579, 803, 804, 805, 990, 991, 992]);
  const obsTex = canvasTexture(1000, 640, (g, w, h) => {
    g.fillStyle = '#101a2e'; g.fillRect(0, 0, w, h);
    const cw = 20, ch = 24, x0 = (w - COLS * cw) / 2, y0 = 20;
    for (let i = 0; i < OBS; i++) { g.fillStyle = DISPUTED.has(i) ? '#ff5d7c' : '#5b77a6'; g.fillRect(x0 + (i % COLS) * cw + 2, y0 + Math.floor(i / COLS) * ch + 3, cw - 5, ch - 7); }
  });
  const obsBoard = new THREE.Group(); obsBoard.position.set(BOARD_AT.x, 0, BOARD_AT.z); obsBoard.rotation.y = -.3; obsBoard.visible = false; set.add(obsBoard);
  [-.5, .5].forEach(x => block(obsBoard, .08, .4, .08, 0x394560, x, 0, 0, .03));
  add(obsBoard, rbox(1.36, .9, .07, .04), mat(0x151f36), 0, .82, 0);
  const obsEdge = own(STATUS.disputed, .6); add(obsBoard, rbox(1.42, .96, .04, .03), obsEdge, 0, .82, -.02, false);
  add(obsBoard, new THREE.PlaneGeometry(1.25, .8), new THREE.MeshBasicMaterial({ map: obsTex, toneMapped: false }), 0, .82, .04, false);
  // the source shelf, and five chains towards what the conclusions rest on; each breaks off halfway
  const shelf = new THREE.Group(); shelf.position.set(SHELF_AT.x, 0, SHELF_AT.z); shelf.rotation.y = -.3; shelf.visible = false; set.add(shelf);
  block(shelf, .78, .5, .4, 0x394560, 0, 0, 0, .04);
  [0x9aa3b2, 0x6aa8e8, 0x45b5b0, 0x7d6ad8, 0xf2b545].forEach((c, k) => block(shelf, .1, .1, .3, c, -.28 + k * .14, .5, 0, .02).castShadow = false);
  const CHAINS = [[PACK_X[0], .78, 2.3], [PACK_X[1], .78, 2.3], [PACK_X[2], .78, 2.3], [-.1, .5, .3], [1.2, .7, -2.2]], LINKS = 8;   // to the packages, the people and the hubs
  const chainDots = new THREE.InstancedMesh(new THREE.SphereGeometry(.035, 8, 6), basic(), CHAINS.length * LINKS);
  chainDots.frustumCulled = false; set.add(chainDots);

  /* ---- the signs ---- */
  const S = {
    roster: post('roster', [small('84 NAMES'), big('83 IN SCOPE', 70)], 0, -1.42, { w: 1.5, up: .95 }),
    attend: post('attend', [big('3 × 360 MIN', 70), small('NO SIGN-OUT · PENDING', AMB, 34)], SPOT.x, SPOT.z - .2, { w: 1.6, up: 1.2, color: STATUS.pending }),
    tests: post('tests', [big('2 VOID PRACTICE', 58), small('79 VALID TESTS', '#aab6cc', 36)], SPOT.x, SPOT.z - .2, { w: 1.6, up: 1.0, color: STATUS.neutral }),
    pen1: post('pen1', [big('73'), small('EVALUABLE', GRN)], -.1, -1.3, { w: 1.0, up: .62 }),
    pen2: post('pen2', [big('8'), small('NO OPPORTUNITY', AMB, 34)], 2.0, -1.15, { w: 1.05, up: .62, color: STATUS.pending }),
    pen3: post('pen3', [big('2'), small('RESTRICTED')], 1.95, 1.14, { w: .9, up: 0, color: STATUS.neutral }),
    coding: post('coding', [big('18 / 1,145', 76), small('DISPUTED', ROSE)], BOARD_AT.x - .15, BOARD_AT.z - .25, { w: 1.3, up: 1.38, ry: -.3, color: STATUS.disputed }),
    weeks: post('weeks', [big('WEEK OF 18 MAY', 58), small('ESTIMATES · 4 HUBS', AMB, 36)], GAP_X, -2.72, { w: 1.6, up: 1.55, color: STATUS.pending }),
    repair: post('repair', [small('REPAIR END', AMB), big('± 1 DAY', 76)], CHILLER.x - .12, CHILLER.z - .1, { w: .95, up: .95, color: STATUS.pending }),
    run: post('run', [big('THIS RUN', 84, ROSE)], HUB_X[0], -2.75, { w: .95, h: .28, up: 1.45, color: STATUS.disputed }),
    rubric: post('rubric', [big('RUBRIC', 84, '#9fe6e2')], HUB_X[2], -2.75, { w: .8, h: .28, up: 1.45, color: PALETTE.teal }),
    held: post('held', [big('13 / 13', 80), small('CRITERIA MET', GRN)], 0, -1.42, { w: 1.3, up: .95 }),
    lost9: post('lost9', [big('9 LOST', 80, ROSE), small('HUB NET CHANGES', ROSE, 34)], GAP_X, -2.72, { w: 1.4, up: 1.3, color: STATUS.disputed }),
    lost6: post('lost6', [big('6 LOST', 80, ROSE), small('ANALYSIS, ARGUMENT', ROSE, 34)], 1.9, -2.72, { w: 1.5, up: 1.3, color: STATUS.disputed }),
    total: post('total', [big('0 / 106', 118, AMB)], TOTAL_X, -2.78, { w: 1.7, h: .5, up: 1.6, color: 0xf2b545 }),
  };
  const scoreLines = g => (g.id.length === 1 ? [big(`${g.pts} / ${g.max}`, 96, g.pts ? GRN : ROSE)] : [small(g.id, g.pts ? GRN : ROSE), big(`${g.pts} / ${g.max}`, 84)]);
  const SCORE_AT = [[PACK_X[0], BENCH.z, .95, 0], [PACK_X[1], BENCH.z, .95, 0], [PACK_X[2], BENCH.z, .95, 0], [-.1, -1.45, 1.2, 0], [BOARD_AT.x - .15, BOARD_AT.z - .25, 1.38, -.3], [GAP_X, -2.72, 1.55, 0], [CHILLER.x, CHILLER.z - .1, .95, 0], [SHELF_AT.x, SHELF_AT.z - .3, .85, -.3]];
  const scoreSigns = GROUPS.map((g, j) => post(`score-${j}`, scoreLines(g), SCORE_AT[j][0], SCORE_AT[j][1], { w: g.id.length === 1 ? .8 : 1.25, h: g.id.length === 1 ? .3 : .44, up: SCORE_AT[j][2], ry: SCORE_AT[j][3], color: g.pts ? STATUS.verified : STATUS.disputed }));
  let shownTotal = 0;

  /* ---- the light the yard is gathered into ---- */
  const NG = 150, gather = cloud(NG, .36, set);
  const gSrc = [], gCol = [];
  { const anchors = [[PACK_X[0], .6, BENCH.z], [PACK_X[1], .6, BENCH.z], [PACK_X[2], .6, BENCH.z], [SHELF_AT.x, .5, SHELF_AT.z], [BOARD_AT.x, .9, BOARD_AT.z], [CHILLER.x, .4, CHILLER.z], [GAP_X, 1.3, -2.7], [TOTAL_X, 1.4, -2.78]];
    for (let i = 0; i < NG; i++) {
      if (i < 83) { gSrc.push([P[i].p[0], .3, P[i].p[1]]); gCol.push(new THREE.Color(i < 73 ? 0x6aa8e8 : 0xf2b545)); }
      else { const a = anchors[i % anchors.length], r = Math.sin(i * 12.9898) * 43758.5453, q = Math.sin(i * 78.233) * 12543.7; gSrc.push([a[0] + ((r - Math.floor(r)) - .5) * .8, a[1] + ((q - Math.floor(q)) - .5) * .3, a[2] + ((q * 3.1 - Math.floor(q * 3.1)) - .5) * .4]); gCol.push(new THREE.Color(STAGE_COLORS[i % 5])); }
    } }

  /* ================= the book and its ending (the book's coordinates start at BX, BZ) ================= */
  const stage = new THREE.Group(); stage.position.set(BX, 0, BZ); stage.visible = false; set.add(stage);
  // The book lies turned a quarter (spine along x, pages towards the viewer); stage and book
  // coordinates swap like this while it rests on the ground.
  const toBook = (out, x, y, z) => out.set(z, y, -x);
  const toStage = (out, v) => out.set(-v.z, v.y, v.x);
  const REST = new THREE.Vector3(0, BOOK_CENTRE.y, BOOK_CENTRE.x);     // the closed book's centre, stage coordinates
  // a warm pool of light on the ground that the book throws once it holds the run
  const poolMat = additive(0xffc982, 0);
  const pool = add(stage, new THREE.PlaneGeometry(6.4, 6.4), poolMat, REST.x, .012, REST.z, false); pool.rotation.x = -Math.PI / 2; pool.receiveShadow = false;
  // the halo under the risen book, and the ring of dust the landing and the slam throw out
  const haloMat = additive(accent, 0, null);
  const halo = add(stage, new THREE.TorusGeometry(1.75, .02, 6, 128), haloMat, 0, .02, 0, false); halo.rotation.x = Math.PI / 2;
  const dustMat = additive(0xfff1d6, 0, null);
  const dust = add(stage, new THREE.RingGeometry(.94, 1, 96), dustMat, REST.x, .02, REST.z, false); dust.rotation.x = -Math.PI / 2;

  /* ---- the book: the homepage's closedBook, opened. Its front board moves to a hinge at the
   * spine, and the block of pages splits at its middle, half on each side of the spread. ---- */
  const lift = new THREE.Group(); lift.position.copy(REST); stage.add(lift);   // rise
  const lean = new THREE.Group(); lift.add(lean);                             // lean to the camera
  const spin = new THREE.Group(); lean.add(spin);                             // turn
  const orient = new THREE.Group(); orient.rotation.y = -Math.PI / 2; spin.add(orient);
  const book = closedBook(); book.position.copy(BOOK_CENTRE).multiplyScalar(-1); orient.add(book);
  const [, pages, spine] = book.children, lines = book.children.slice(3, 8), gilts = book.children.slice(8, 10);
  const front = book.children.find(c => c.isGroup);
  const hinge = new THREE.Group(); hinge.position.set(0, PAGE, 0); book.add(hinge);
  hinge.add(front); front.position.set(PW / 2 + .05, T / 2 + BOARD_T / 2, 0);
  pages.scale.y = .5; pages.position.y = BOARD_T + T / 4;
  // the cloth of this book flashes warm when it slams, so it gets its own copy of the kit's cover
  const kitCover = book.children[0].material, coverMat = kitCover.clone(); coverMat.emissive.setHex(0xffc98a); coverMat.emissiveIntensity = 0;
  book.traverse(o => { if (o.isMesh && o.material === kitCover) o.material = coverMat; });
  const leftPages = add(hinge, rbox(PW, T, PD, .02), mat(PALETTE.cream), PW / 2, T / 4, 0); leftPages.scale.y = .5;
  // the seam between the halves is the line the light leaks from when the cover shuts
  const seamMat = new THREE.MeshStandardMaterial({ color: 0xe4dccb, emissive: 0xffd49a, emissiveIntensity: 0, roughness: .8 });
  lines[2].material = seamMat;
  // the title page, printed on the half that rides on the cover (so it reads once open)
  const titleTex = canvasTexture(1024, 768, (g, W) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = '16px';
    g.fillStyle = '#1f2a3a'; g.font = '750 104px Inter, Arial, sans-serif'; g.fillText('METACASE', W / 2, 150);
    if ('letterSpacing' in g) g.letterSpacing = '4px';
    g.fillStyle = '#d8b46a'; g.fillRect(W * .26, 222, W * .48, 5);
    g.fillStyle = '#2c5468'; g.font = '700 58px "Space Mono", ui-monospace, monospace'; g.fillText('HR-T3-114', W / 2, 292);
    g.fillStyle = '#e1d8c5';
    for (let k = 0; k < 5; k++) g.fillRect(W * .2, 380 + k * 40, W * (k % 3 === 2 ? .36 : .6), 10);
    STAGE_COLORS.forEach((c, i) => { g.fillStyle = hex(c); g.beginPath(); g.roundRect(W / 2 - 5 * 36 + i * 72 + 8, 610, 56, 56, 12); g.fill(); });
  });
  const title = new THREE.Mesh(new THREE.PlaneGeometry(PD * .94, PW * .94), new THREE.MeshStandardMaterial({ map: titleTex, transparent: true, roughness: .85, depthWrite: false }));
  // reads left to right along the spine, its top towards the far edge, facing down on the hinge
  title.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0)));
  title.position.set(PW / 2, -.0035, 0); hinge.add(title);

  // the fore-edge tabs and the thread through their tips: the Metacase's signature
  const { tabs, tips, nodes, links } = bookTabs(book, SIG);
  const tabMats = tabs.map(tab => (tab.children[0].material = tab.children[0].material.clone()));
  const nodeMats = nodes.map(n => (n.material = n.material.clone()));
  const threadMat = links[0].material.clone(); links.forEach(l => (l.material = threadMat));
  const linkA = tips.slice(0, -1).map(p => p.clone().setY(p.y + .02)), linkB = tips.slice(1).map(p => p.clone().setY(p.y + .02));
  const tabFlares = tips.map((p, i) => { const s = sprite(STAGE_COLORS[i], 1.2); s.position.copy(p); book.add(s); return s; });
  const sigGlow = sprite(0xffe7b8, 2.8); sigGlow.position.set(PW + .5, tips[0].y, 0); book.add(sigGlow);
  const coreGlow = sprite(0xffd49a, 4.2); coreGlow.position.set(PW / 2, PAGE, 0); book.add(coreGlow);

  // light leaking from the gap as the cover comes down: three soft blades along the open edges
  const blade = (w, x, z, ry) => { const m = add(book, new THREE.PlaneGeometry(w, 1), additive(0xffd9a6, 0), x, PAGE, z, false); m.rotation.y = ry; m.receiveShadow = false; m.renderOrder = 2; return m; };
  const blades = [blade(PD + .6, PW + .02, 0, Math.PI / 2), blade(PW + .6, PW / 2, PD / 2 + .02, 0), blade(PW + .6, PW / 2, -PD / 2 - .02, 0)];

  /* ---- the front page: a slot that lights as the medallion lands ---- */
  const landAt = tk => toBook(new THREE.Vector3(), tk.land[0], PAGE, tk.land[1]);
  const slots = TOKENS.map(tk => {
    const at = landAt(tk), m = new THREE.MeshStandardMaterial({ color: tk.color, emissive: tk.color, emissiveIntensity: .35, roughness: .5 });
    const slotRing = add(book, new THREE.TorusGeometry(.5, .016, 6, 72), m, at.x, PAGE + .004, at.z, false); slotRing.rotation.x = Math.PI / 2; slotRing.receiveShadow = false;
    const print = add(book, new THREE.PlaneGeometry(1.5, 1.5), additive(tk.color, 0), at.x, PAGE + .006, at.z, false); print.rotation.x = -Math.PI / 2; print.receiveShadow = false;
    const shockMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(tk.color).multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, fog: false });
    const shock = add(book, new THREE.RingGeometry(.9, 1, 72), shockMat, at.x, PAGE + .008, at.z, false); shock.rotation.x = -Math.PI / 2; shock.receiveShadow = false;
    return { m, ring: slotRing, print, shock };
  });

  /* ---- the medallion ---- */
  // A token is root (position, squash; turned back to stage axes) → pivot (the fold: hinged at its
  // foot, it falls away from the viewer) → body (spin, idle). Its path is in book coordinates.
  function token(tk, centre) {
    const land = landAt(tk);
    const root = new THREE.Group(); root.position.copy(land); root.rotation.y = Math.PI / 2; book.add(root);
    const pivot = new THREE.Group(); pivot.scale.setScalar(SIZE); root.add(pivot);
    const body = new THREE.Group(); body.position.y = centre; pivot.add(body);
    const p0 = toBook(new THREE.Vector3(), ...tk.from), p1 = toBook(new THREE.Vector3(), ...tk.bend);
    const p3 = land.clone().setY(PAGE + HOVER), p2 = toBook(new THREE.Vector3(), tk.land[0] + Math.sign(tk.from[0] - tk.land[0]) * .9, PAGE + 2.6, tk.land[1] - .8);
    return { tk, root, pivot, body, centre, p: [p0, p1, p2, p3], e: tk.s + DUR, color: new THREE.Color(tk.color), land };
  }
  const bez = (out, p, u) => {
    const a = p[0], b = p[1], c = p[2], d = p[3], v = 1 - u, A = v * v * v, B = 3 * v * v * u, C = 3 * v * u * u, D = u * u * u;
    return out.set(A * a.x + B * b.x + C * c.x + D * d.x, A * a.y + B * b.y + C * c.y + D * d.y, A * a.z + B * b.z + C * c.z + D * d.z);
  };
  const travel = f => easeOut(f / .78, 2.2);

  // the score medallion: 0.745 in the middle, a ring of 28 ticks for the 28 checks to earn (19 met)
  const medal = token(TOKENS[0], .38);
  const medalTex = canvasTexture(512, 512, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#f2b545'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
    g.fillStyle = '#ffd77a'; g.beginPath(); g.arc(c, c, c - 22, 0, TAU); g.fill();
    g.lineCap = 'round'; g.lineWidth = 10;
    for (let i = 0; i < 28; i++) {
      const a = -Math.PI / 2 + (i + .5) / 28 * TAU;
      g.strokeStyle = i < 19 ? '#1f6f6a' : 'rgba(31,42,58,.22)';
      g.beginPath(); g.moveTo(c + Math.cos(a) * 190, c + Math.sin(a) * 190); g.lineTo(c + Math.cos(a) * 218, c + Math.sin(a) * 218); g.stroke();
    }
    g.fillStyle = '#1f2a3a'; g.font = '800 128px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('0.745', c, c + 6);
  });
  const goldMat = mat(0xffcf4a, { emissive: 0xffb020, intensity: .3, rough: .3 }).clone();
  const coin = add(medal.body, new THREE.CylinderGeometry(.36, .36, .07, 56), goldMat); coin.rotation.x = Math.PI / 2;
  const edge = add(medal.body, new THREE.TorusGeometry(.36, .024, 10, 64), goldMat, 0, 0, 0, false); edge.receiveShadow = false;
  const faceMat = new THREE.MeshStandardMaterial({ map: medalTex, emissive: 0xffffff, emissiveMap: medalTex, emissiveIntensity: .2, roughness: .35 });
  [1, -1].forEach(s => { const f = add(medal.body, new THREE.CircleGeometry(.335, 56), faceMat, 0, 0, s * .0365, false); f.rotation.y = s > 0 ? 0 : Math.PI; f.receiveShadow = false; });
  const medalGlow = sprite(0xffd27a, 1.5); medal.body.add(medalGlow);

  const flyers = [medal];
  const TRAIL = 18, trails = cloud(flyers.length * TRAIL, .22, book);
  const sparks = cloud(TOKENS.length * 12, .13, book, true);
  const motes = cloud(64, .12, stage);
  const PUFF = 40, puff = cloud(PUFF, .16, stage);   // the air the slam pushes out of the pages
  const puffCol = new THREE.Color(0xffd9a6);
  const moteSeed = Array.from({ length: 64 }, (_, i) => [((i * 0.61803) % 1), ((i * 0.3819 + .17) % 1), ((i * 0.7548 + .4) % 1)]);
  const moteCol = moteSeed.map((_, i) => new THREE.Color(STAGE_COLORS[i % 5]));

  /* ---- the robot, the model that ran it: it walks to each place, and ends beside the book ---- */
  const bot = robot(PALETTE.cream, 0x8ff6ff);
  bot.root.scale.setScalar(1.15); set.add(bot.root);
  const botArms = bot.root.children[0].children.filter(c => c.isGroup && c !== bot.head);
  // armed with the harness from the Strategy beat, if that beat has built it
  if (hand.weapon) {
    const gun = hand.weapon.create();
    gun.position.copy(GUN_HOLD.at); gun.rotation.copy(GUN_HOLD.turn); gun.scale.setScalar(hand.weapon.holdScale);
    gun.traverse(o => { if (o.isMesh) o.castShadow = true; });
    bot.root.add(gun); bot.grip(1);
  }
  const END_SPOT = [2.72 + BX, .85 + BZ];
  const sc = j => SC_A + j * SC_W, ev = k => EV_A + k * EV_W;
  const WALK = [[0, 2.9, 1.5], [ev(0), 2.9, 1.5], [ev(0) + .012, 2.6, 1.45], [ev(1), 2.6, 1.45], [ev(1) + .012, 3.0, .3], [ev(3), 3.0, .3], [ev(3) + .01, 2.9, 1.55], [ev(4), 2.9, 1.55],
    [ev(4) + .012, 2.9, -1.3], [ev(5), 2.9, -1.3], [ev(5) + .012, 2.0, -1.45], [ev(6), 2.0, -1.45], [ev(6) + .012, -.9, -1.45], [.425, -.9, -1.45],
    [.431, 2.9, -1.45], [.44, 2.9, 1.5], [sc(0), 2.9, 1.5], [sc(0) + .009, PACK_X[0] + .65, 1.55], [sc(1), PACK_X[0] + .65, 1.55], [sc(1) + .008, PACK_X[1] + .75, 1.55], [sc(2), PACK_X[1] + .75, 1.55],
    [sc(2) + .008, PACK_X[2] + .65, 1.55], [sc(3), PACK_X[2] + .65, 1.55], [sc(3) + .008, 2.9, 1.55], [sc(4), 2.9, 1.55], [sc(4) + .011, 2.9, -1.3], [sc(5), 2.9, -1.3], [sc(5) + .011, 2.0, -1.45],
    [sc(6), 2.0, -1.45], [sc(6) + .011, -.9, -1.45], [sc(7), -.9, -1.45], [sc(7) + .004, 2.9, -1.45], [sc(7) + .011, 2.9, 1.2], [sc(7) + .016, 2.5, 1.6], [GATHER, 2.5, 1.6],
    [GATHER + .014, END_SPOT[0], END_SPOT[1]], [1, END_SPOT[0], END_SPOT[1]]];
  // what it looks at: [real, x, y, z], eased from one to the next
  const LOOK = [[0, 0, .5, -.5], [ev(0), 0, .5, -.5], [ev(0) + .012, 0, .3, 0], [ev(0) + .03, 1.2, .3, .8], [ev(1), 1.75, .3, .55], [ev(1) + .012, SPOT.x, .8, SPOT.z], [ev(3), SPOT.x, .8, SPOT.z],
    [ev(3) + .012, .6, .3, 0], [ev(4), 1.6, .3, 0], [ev(4) + .014, BOARD_AT.x, .9, BOARD_AT.z], [ev(5), BOARD_AT.x, .9, BOARD_AT.z], [ev(5) + .014, -.2, .4, BAR_Z], [ev(6), -.2, .4, BAR_Z],
    [ev(6) + .014, HUB_X[0], 1.3, HUB_Z], [ev(6) + .03, HUB_X[0], 1.3, HUB_Z], [ev(6) + .042, CHILLER.x, .5, CHILLER.z], [.425, CHILLER.x, .5, CHILLER.z], [.44, 0, .5, -1], [sc(0), 0, .5, -1],
    [sc(0) + .01, PACK_X[0], .7, BENCH.z], [sc(1), PACK_X[0], .7, BENCH.z], [sc(1) + .01, PACK_X[1], .7, BENCH.z], [sc(2), PACK_X[1], .7, BENCH.z], [sc(2) + .01, PACK_X[2], .7, BENCH.z],
    [sc(3), PACK_X[2], .7, BENCH.z], [sc(3) + .01, -.1, .3, 0], [sc(4), -.1, .3, 0], [sc(4) + .013, BOARD_AT.x, .9, BOARD_AT.z], [sc(5), BOARD_AT.x, .9, BOARD_AT.z], [sc(5) + .013, -.2, .6, HUB_Z],
    [sc(6), -.2, .6, HUB_Z], [sc(6) + .013, CHILLER.x, .6, CHILLER.z], [sc(7), CHILLER.x, .6, CHILLER.z], [sc(7) + .018, SHELF_AT.x, .5, SHELF_AT.z], [GATHER, SHELF_AT.x, .5, SHELF_AT.z],
    [GATHER + .012, BX, 2.6, BZ + .6], [.84, BX, 2.6, BZ + .6], [.85, BX, .6, BZ + 1.2], [1, BX, .6, BZ + 1.2]];
  const walker = { x: 0, z: 0, ry: 0, walk: 0 }, focus = new THREE.Vector3();
  function focusAt(real) {
    let i = 0;
    while (i < LOOK.length - 2 && real > LOOK[i + 1][0]) i++;
    const a = LOOK[i], b = LOOK[i + 1], k = ease(real, a[0], b[0]);
    return focus.set(mix(a[1], b[1], k), mix(a[2], b[2], k), mix(a[3], b[3], k));
  }

  /* ---- the camera line: the yard's shots, then the ending's spline ---- */
  const shot = { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 }, cam = { from: shot, to: shot };
  const shoot = cameraLine(YARD_KEYS);
  const kv = END_KEYS.map(k => [...k.pos, ...k.look, k.fov]), kt = END_KEYS.map(k => k.at);
  const km = kv.map((v, i) => v.map((_, c) => (i === 0 || i === kv.length - 1 ? 0 : (kv[i + 1][c] - kv[i - 1][c]) / (kt[i + 1] - kt[i - 1]))));
  function pose(real) {
    let g, sx, sy;
    if (real <= END_A) {
      shoot(real, cam);
      let i = 0;
      while (i < YARD_KEYS.length - 2 && real > YARD_KEYS[i + 1].at) i++;
      const ka = YARD_KEYS[i], kb = YARD_KEYS[i + 1], k = ease(real, ka.at, kb.at);
      g = mix(ka.g, kb.g, k); sx = mix(ka.sx, kb.sx, k); sy = mix(ka.sy, kb.sy, k);
    } else {
      let i = 0; while (i < kt.length - 2 && real > kt[i + 1]) i++;
      const h = kt[i + 1] - kt[i], s = Math.min(1, Math.max(0, (real - kt[i]) / h)), s2 = s * s, s3 = s2 * s;
      const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
      const a = kv[i], b = kv[i + 1], ma = km[i], mb = km[i + 1];
      for (let c = 0; c < 7; c++) {
        const v = h00 * a[c] + h10 * h * ma[c] + h01 * b[c] + h11 * h * mb[c];
        if (c < 3) shot.pos[c] = v; else if (c < 6) shot.look[c - 3] = v; else shot.fov = v;
      }
      const ka = END_KEYS[i], kb = END_KEYS[i + 1], k = s2 * (3 - 2 * s);
      g = mix(ka.g, kb.g, k); sx = mix(ka.sx, kb.sx, k); sy = mix(ka.sy, kb.sy, k);
    }
    // With the copy below the picture (the framework's stacked layout) the frame is narrow and low:
    // each shot stands back until its group fits the width, and is centred on it.
    if (!layout?.stacked) return;
    const p = shot.pos, l = shot.look, d = Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]);
    const back = Math.max(1, g / (2 * d * Math.tan(shot.fov * Math.PI / 360) * camera.aspect));
    for (let c = 0; c < 3; c++) p[c] = l[c] + (p[c] - l[c]) * back;
    p[0] += sx; l[0] += sx; p[1] += sy; l[1] += sy;
  }

  /* ---- with the copy below the picture (the framework's stacked layout) the copy lies over the
   * lower part of the canvas: a curtain in the page's own colour, fading in just above the copy,
   * keeps the set out from under the text ---- */
  const curtainMat = new THREE.ShaderMaterial({
    uniforms: { uTop: { value: -1 }, uSoft: { value: .08 }, uColor: { value: new THREE.Color(0x05070e) } },
    vertexShader: 'varying float vY; void main() { vY = position.y; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: 'uniform float uTop; uniform float uSoft; uniform vec3 uColor; varying float vY; void main() { gl_FragColor = vec4(uColor, 1. - smoothstep(uTop, uTop + uSoft, vY));\n#include <colorspace_fragment>\n}',
    transparent: true, depthTest: false, depthWrite: false, fog: false, toneMapped: false,
  });
  const curtain = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), curtainMat);
  curtain.frustumCulled = false; curtain.renderOrder = 999; curtain.visible = false; set.add(curtain);
  function drawCurtain(ui) {
    curtain.visible = !!(layout?.stacked && ui?.el && renderer?.domElement);
    if (!curtain.visible) return;
    const c = renderer.domElement.getBoundingClientRect(), a = ui.el.getBoundingClientRect();
    if (a.height > 0 && c.height > 0) { curtainMat.uniforms.uTop.value = 1 - 2 * (a.top - c.top) / c.height; curtainMat.uniforms.uSoft.value = 2 * 26 / c.height; }
    const bg = set.parent?.background; if (bg?.isColor) curtainMat.uniforms.uColor.value.copy(bg);
  }

  const all = [medal], idles = [0];
  const v1 = new THREE.Vector3(), seen = new THREE.Vector3(), m4 = new THREE.Matrix4(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(), qId = new THREE.Quaternion(), zero = new THREE.Vector3(0, 0, 0);
  const setRGB = (attr, i, r, g, b) => { const a = attr.array; a[i * 3] = r; a[i * 3 + 1] = g; a[i * 3 + 2] = b; };
  for (let i = 0; i < MARKS; i++) { marks.setMatrixAt(i, m4.compose(zero, qId, zero)); marks.setColorAt(i, tc.setRGB(1, 1, 1)); }
  for (let i = 0; i < HUB_X.length * WEEKS; i++) { weekBars.setMatrixAt(i, m4.compose(zero, qId, zero)); weekBars.setColorAt(i, tc.setRGB(.4, .6, .9)); }
  for (let i = 0; i < ARC; i++) { arcDots.setMatrixAt(i, m4.compose(zero, qId, zero)); arcDots.setColorAt(i, tc.setRGB(1, 1, 1)); }
  for (let i = 0; i < CHAINS.length * LINKS; i++) { chainDots.setMatrixAt(i, m4.compose(zero, qId, zero)); chainDots.setColorAt(i, tc.setRGB(1, 1, 1)); }
  const chainFrom = new THREE.Vector3(SHELF_AT.x - .1, .62, SHELF_AT.z);

  function update(real, t, dt, ui) {
    if (reduce) { real = .855; t = 0; }
    const lp = lpOf(real), idle = reduce ? 0 : 1;
    pose(real); drawCurtain(ui);
    const jolt = wobble(lp, .69, .035, 2.5);   // the slam jolts the camera, briefly
    shot.pos[1] -= jolt * .1; shot.look[1] -= jolt * .06;
    // an item's window: 0 outside it, 1 while it is told
    const evOn = k => { const u = (real - ev(k)) / EV_W; return ease(u, .04, .18) * (1 - ease(u, .9, 1)); };
    const gone = ease(real, GATHER, GATHER + .012), here = 1 - gone;
    const scNow = j => ease(real, sc(j) + .003, sc(j) + .013) * (1 - ease(real, sc(j) + SC_W - .006, sc(j) + SC_W));

    /* ---------- the yard ---------- */
    // the people: the roll-call ground, then the three pens; pawn 83 (listed in error) walks off
    const toPens = ease(real, ev(3) + .008, ev(3) + .012), on2 = evOn(1), on3 = evOn(2), on5 = Math.max(evOn(4), scNow(4)), hooray = sc(3) + .006;
    let nm = 0;
    for (let i = 0; i < NP; i++) {
      const q = P[i];
      let k, s = 1, lift = 0;
      if (i === 83) { k = ease(real, ev(0) + .014, ev(0) + .04); s = 1 - ease(real, ev(0) + .036, ev(0) + .048); }
      else { k = ease(real, ev(3) + .01 + q.st * .014, ev(3) + .026 + q.st * .014); s = 1 - ease(real, GATHER + q.st * .01, GATHER + .012 + q.st * .01); lift = bump(real, hooray + q.st * .012, .012) * .14; }
      const x = mix(q.g[0], q.p[0], k), z = mix(q.g[1], q.p[1], k);
      const step = Math.sin(k * Math.PI);
      people.place(i, x, z, { y: step * .04 + lift + Math.abs(Math.sin(t * 2 + i)) * .008 * idle, ry: step * (q.p[0] > q.g[0] ? 1.2 : -1.2), s: Math.max(.0001, s) });
      // its colour: what an item marks it as, then the group it falls into
      tc.copy(BLUE);
      if (i === 83) tc.lerp(C_NEUT, ease(real, ev(0) + .004, ev(0) + .014));
      else if (i >= 81) tc.lerp(C_NEUT, ease(real, ev(3) + .002, ev(3) + .008));
      else if (i >= 73) tc.lerp(C_PEND, ease(real, ev(3) + .002, ev(3) + .008));
      let mark = 0, mc = C_PEND;
      if (MARK2.includes(i)) { mark = on2; mc = C_PEND; } else if (MARK3.includes(i)) { mark = on3; mc = C_NEUT; } else if (MARK5.includes(i)) { mark = on5; mc = C_DISP; }
      if (mark > 0) {
        tc.lerp(mc, mark);
        if (nm < MARKS) { const r = 1 + .25 * Math.sin(t * 4 + i) * idle; p3.set(x, .014, z); s3.set(mark * r, 1, mark * r); marks.setMatrixAt(nm, m4.compose(p3, qId, s3)); setRGB(marks.instanceColor, nm, mc.r * 1.8, mc.g * 1.8, mc.b * 1.8); nm++; }
      }
      people.tint(i, tc.getHex());
    }
    for (; nm < MARKS; nm++) marks.setMatrixAt(nm, m4.compose(zero, qId, zero));
    marks.instanceMatrix.needsUpdate = true; marks.instanceColor.needsUpdate = true;
    people.commit();
    people.group.visible = here > 0 || real < GATHER + .03;
    pens.forEach((p, k) => { const up = toPens * here; p.group.visible = up > .01; p.group.scale.set(1, Math.max(.001, up), 1); p.mat.emissiveIntensity = .55 + (k === 0 ? bump(real, hooray, .03) * 1.6 : 0); });

    // the hubs: their weeks of metrics, the estimated week, the repair and the two markers
    // the charts stand over the roofs for their own items only
    const weeksUp = Math.max(evOn(5), scNow(5)), est = Math.max(ease(real, ev(5) + .02, ev(5) + .03) * evOn(5), scNow(5)), tall = 1;
    weekBars.visible = weeksUp > 0;
    if (weekBars.visible) {
      for (let k = 0, n = 0; k < HUB_X.length; k++) for (let w = 0; w < WEEKS; w++, n++) {
        const up = ease(weeksUp, w / WEEKS * .6, w / WEEKS * .6 + .4), last = w === WEEKS - 1;
        p3.set(HUB_X[k] - .46 + w * .04, CHART_Y, HUB_Z + .04); s3.set(last ? 1.6 : 1, Math.max(.001, weekH[n] * up * tall), last ? 1.6 : 1);
        weekBars.setMatrixAt(n, m4.compose(p3, qId, s3));
        if (last) { const g = 1 + est * (.9 + .5 * Math.sin(t * 4) * idle); setRGB(weekBars.instanceColor, n, mix(.5, 1.5 * g, est), mix(.85, .85 * g, est), mix(1.3, .15 * g, est)); }
        else setRGB(weekBars.instanceColor, n, .5, .85, 1.3);
      }
      weekBars.instanceMatrix.needsUpdate = true; weekBars.instanceColor.needsUpdate = true;
    }
    weekBase.forEach(b => { b.visible = weeksUp > .01; b.scale.y = Math.max(.001, weeksUp); });
    const chillUp = ease(real, ev(6) + .004, ev(6) + .014) * here;
    show(chiller, chillUp); fanBlade.rotation.z = t * 5 * idle + real * 300;
    chillLamp.emissiveIntensity = 1.2 + .8 * Math.sin(t * 5) * idle;
    const markers = Math.max(evOn(6), scNow(6));
    pin.visible = markers > .01; pin.position.set(HUB_X[0], 1.0 + (1 - backOut(markers, 2)) * 1.2 + Math.sin(t * 2.4) * .04 * idle, HUB_Z); pin.scale.setScalar(Math.max(.001, markers));
    ring.visible = markers > .01; ring.scale.setScalar(Math.max(.001, markers) * (1 + .06 * Math.sin(t * 3) * idle)); ring.rotation.y = t * .8 * idle;
    arcDots.visible = markers > .01;
    if (arcDots.visible) {
      const u6 = (real - ev(6)) / EV_W, again = scNow(6);
      for (let k = 0; k < ARC; k++) {
        const u = (k + 1) / (ARC + 1), on = Math.max(lin(u6, .3 + u * .25, .36 + u * .25) * evOn(6), again), s = on * (1 + .25 * Math.sin(t * 5 - k * .7) * idle);
        p3.set(mix(HUB_X[0], HUB_X[2], u), mix(1.3, 1.05, u) + Math.sin(u * Math.PI) * .75, HUB_Z); s3.set(s, s, s);
        arcDots.setMatrixAt(k, m4.compose(p3, qId, s3)); setRGB(arcDots.instanceColor, k, mix(1.7, .35, u), mix(.4, 1.5, u), mix(.55, 1.45, u));
      }
      arcDots.instanceMatrix.needsUpdate = true; arcDots.instanceColor.needsUpdate = true;
    }
    const failed = bump(real, .425, .035), opsHot = flash(real, sc(5) + .005, .03);
    hubs.forEach((h, k) => { if (k < 3) h.bandMat.emissiveIntensity = .35 + failed * 1.6 + opsHot * 2; });

    // the bench and what each item brings with it
    show(bench, here);
    benchEdge.emissiveIntensity = .8 + flash(real, sc(0) + .006, .02) * 2 + flash(real, sc(1) + .006, .02) * 2 + flash(real, sc(2) + .006, .02) * 2;
    show(terminal, evOn(1)); termLamp.emissiveIntensity = 1.4 + Math.sin(t * 6) * .8 * idle; termScreen.color.setRGB(1.0, .62 + .2 * Math.sin(t * 6) * idle, .15);
    show(desk, evOn(2));
    show(obsBoard, on5); obsEdge.emissiveIntensity = .6 + .5 * Math.sin(t * 3) * idle;
    const shelfUp = ease(real, sc(7) + .003, sc(7) + .013) * here;
    show(shelf, shelfUp);
    chainDots.visible = shelfUp > 0;
    if (chainDots.visible) {
      for (let c = 0, n = 0; c < CHAINS.length; c++) for (let l = 0; l < LINKS; l++, n++) {
        const u = (l + 1) / (LINKS + 1) * .5, on = lin(real, sc(7) + .012 + l * .0015 + c * .001, sc(7) + .016 + l * .0015 + c * .001) * here, end = l === LINKS - 1;
        p3.set(mix(chainFrom.x, CHAINS[c][0], u), mix(chainFrom.y, CHAINS[c][1], u) + Math.sin(u * Math.PI) * .7, mix(chainFrom.z, CHAINS[c][2], u));
        const s = on * (end ? 1.5 + .4 * Math.sin(t * 5 + c) * idle : 1); s3.set(s, s, s);
        chainDots.setMatrixAt(n, m4.compose(p3, qId, s3));
        if (end) setRGB(chainDots.instanceColor, n, 1.8, .35, .55); else setRGB(chainDots.instanceColor, n, .9, .95, 1.1);
      }
      chainDots.instanceMatrix.needsUpdate = true; chainDots.instanceColor.needsUpdate = true;
    }

    // the signs
    show(S.held, ease(real, .003, .01) * (1 - ease(real, .022, .028)));
    const lost = ease(real, .43, .44) * (1 - ease(real, .451, .457)); show(S.lost9, lost); show(S.lost6, lost);
    show(S.roster, evOn(0)); show(S.attend, evOn(1)); show(S.tests, evOn(2));
    const penSigns = Math.max(ease(real, ev(3) + .026, ev(3) + .036) * (1 - ease(real, ev(4) - .006, ev(4))), scNow(3));   // for their own item, and again for the sample's score
    show(S.pen1, penSigns); show(S.pen2, penSigns); show(S.pen3, penSigns);
    show(S.coding, evOn(4)); show(S.weeks, evOn(5)); show(S.repair, evOn(6)); show(S.run, evOn(6)); show(S.rubric, evOn(6));
    let total = 0;
    // a package's score stays on its crate while the three are told; the others stand for their own item
    scoreSigns.forEach((s, j) => { const on = j < 3 ? ease(real, sc(j) + .003, sc(j) + .013) * (1 - ease(real, sc(3) - .004, sc(3) + .004)) : scNow(j); show(s, on); if (on > 0) s.frameMat.emissiveIntensity = 1 + flash(real, sc(j) + .01, .02) * 3; if (real >= sc(j) + .008) total += GROUPS[j].pts; });
    if (total !== shownTotal) { shownTotal = total; S.total.redraw([big(`${total} / ${TOTAL}`, 118, AMB)]); }
    show(S.total, ease(real, sc(0) - .008, sc(0) + .002) * (1 - ease(real, .826, .838)));
    S.total.frameMat.emissiveIntensity = 1 + flash(real, sc(0) + .008, .02) * 2 + flash(real, sc(1) + .008, .02) * 2 + flash(real, sc(2) + .008, .02) * 2 + flash(real, sc(3) + .008, .02) * 3 + flash(real, GATHER, .02) * 4;

    // the yard is gathered: its light rises, hangs over the middle, then pours into the page
    gather.pts.visible = real > GATHER - .002 && lp < .68;
    if (gather.pts.visible) {
      for (let i = 0; i < NG; i++) {
        const q = i * 3, st = (i * 37 % 100) / 100, g1 = ease(real, GATHER + st * .012, GATHER + .018 + st * .012), g2 = ease(lp, POUR_A + .005 + st * .035, POUR_A + .05 + st * .035);
        const a = st * TAU * 3 + t * .5 * idle + lp * 6, r = .45 + .75 * ((i * 61 % 100) / 100), hx = BX + Math.cos(a) * r, hy = 2.25 + .6 * ((i * 13 % 100) / 100) + Math.sin(t * 1.3 + i) * .05 * idle, hz = BZ + .6 + Math.sin(a) * r * .7;
        const tx = BX + (((i * 29) % 100) / 100 - .5) * 2.4, tz = BZ + .35 + ((i * 53 % 100) / 100) * 1.7, src = gSrc[i];
        let x = mix(src[0], hx, g1), y = mix(src[1], hy, g1) + Math.sin(g1 * Math.PI) * .5, z = mix(src[2], hz, g1);
        x = mix(x, tx, g2); y = mix(y, PAGE + .04, g2 * g2); z = mix(z, tz, g2);
        gather.pos[q] = x; gather.pos[q + 1] = y; gather.pos[q + 2] = z;
        const f = g1 * (1 - g2 * g2 * g2) * (1.2 + .4 * Math.sin(t * 3 + i) * idle), c = gCol[i];
        gather.col[q] = c.r * f; gather.col[q + 1] = c.g * f; gather.col[q + 2] = c.b * f;
      }
      gather.done();
    }
    ground.rimMat.emissiveIntensity = 1 + Math.sin(t * 2) * .12 * idle + failed * 1.2 + flash(real, GATHER, .03) * 2 + flash(real, LAND_B, .03) * 2.5 + flash(lp, .69, .07) * 2.6 + flash(lp, .8, .08) * 1.6;

    /* ---------- the book ---------- */
    const arrive = easeOut(lin(real, LAND_A, LAND_B), 3), thud = wobble(real, LAND_B, .012, 1.5);
    stage.visible = real >= LAND_A - .001;
    /* the cover: lifts (ease in-out), hangs at the vertical, falls (ease-in) and slams at .69 */
    const cx = lin(lp, .58, .69);
    const angle = cx < .45 ? Math.PI - Math.PI / 2 * smooth(cx / .45) : Math.PI / 2 * (1 - easeIn((cx - .45) / .55, 2.2));
    hinge.rotation.z = angle;
    const shut = 1 - angle / Math.PI;
    const sp = lerp(.5, 1, shut);
    spine.scale.y = sp; spine.position.y = SPINE_H * sp / 2;
    gilts[0].position.y = SPINE_H * sp * .18 + .015; gilts[1].position.y = SPINE_H * sp * .82 + .015;
    lines[3].visible = lines[4].visible = shut > .985;
    const slam = flash(lp, .69, .07), hitK = wobble(lp, .69, .075, 1.5);

    /* the medallion */
    let attention = 0;
    for (let k = 0; k < flyers.length; k++) {
      const tok = flyers[k], { tk, root, pivot, body } = tok, f = (lp - tk.s) / DUR;
      root.visible = f > 0 && shut < .7;
      idles[k] = 0;
      if (!root.visible) continue;
      let sy = 1, sxz = 1;
      if (f < 1) {
        // arc in, hang (rising a touch: the anticipation), then drop under gravity
        if (f < .78) bez(root.position, tok.p, travel(f));
        else root.position.copy(tok.p[3]);
        if (f >= .78 && f < .88) root.position.y += Math.sin(lin(f, .78, .88) * Math.PI / 2) * .1;
        if (f >= .88) { const d = lin(f, .88, 1); root.position.y = lerp(PAGE + HOVER + .1, PAGE, easeIn(d, 2.2)); sy = 1 + .16 * d; sxz = 1 - .07 * d; }
        const left = 1 - smooth(f / .86);   // how much of the tumble is still to unwind
        body.rotation.set(tk.spin[0] * TAU * left, tk.yaw + tk.spin[1] * TAU * left, tk.spin[2] * TAU * left);
      } else {
        root.position.copy(tok.land);
        const w = wobble(lp, tok.e, .06, 1.25);
        sy = 1 - .3 * w; sxz = 1 + .14 * w;
        body.rotation.set(0, tk.yaw, 0);
      }
      // idle life once it has settled: the medallion sways
      const still = smooth(lin(lp, tok.e + .02, tok.e + .07)) * (1 - smooth(lin(lp, .54, .56)));
      body.position.y = tok.centre;
      body.rotation.y += Math.sin(t * .6) * .45 * still;
      idles[k] = still;
      // fold back flat (hinged at the foot), then press into the page as the cover comes over
      const fold = smooth(lin(lp, .545 + k * .016, .59 + k * .016)), press = smooth(lin(lp, .6 + k * .01, .655 + k * .01));
      pivot.rotation.x = -Math.PI / 2 * fold;
      sy *= lerp(1, .08, press);
      root.scale.set(sxz, sy, sxz);
      attention = Math.max(attention, smooth(lin(f, -.15, .1)) * (1 - smooth(lin(f, 1, 1.4))));
      if (attention > 0) toStage(seen, root.position);
    }
    const mIdle = idles[0];
    medalGlow.material.opacity = medal.root.visible ? .22 * mIdle + .6 * flash(lp, medal.e, .05) : 0;
    goldMat.emissiveIntensity = .3 + 1.6 * flash(lp, medal.e, .06) + .12 * Math.sin(t * 2.3) * mIdle;
    faceMat.emissiveIntensity = .2 + .9 * flash(lp, medal.e, .06);
    // its trail
    for (let k = 0; k < flyers.length; k++) {
      const tok = flyers[k], f = (lp - tok.tk.s) / DUR, vis = f > 0 && f < .9 ? 1 - lin(f, .55, .84) : 0;
      for (let j = 0; j < TRAIL; j++) {
        const q = (k * TRAIL + j) * 3, g = f - (j + 1) * .013;
        if (vis <= 0 || g <= 0) { trails.col[q] = trails.col[q + 1] = trails.col[q + 2] = 0; continue; }
        bez(v1, tok.p, travel(Math.min(g, .78)));
        trails.pos[q] = v1.x; trails.pos[q + 1] = v1.y + tok.centre * SIZE; trails.pos[q + 2] = v1.z;
        const fade = vis * (1 - j / TRAIL) * .85;
        trails.col[q] = tok.color.r * fade; trails.col[q + 1] = tok.color.g * fade; trails.col[q + 2] = tok.color.b * fade;
      }
    }
    trails.done();

    /* the slot lights as the medallion lands, prints it as it folds, then goes under the cover */
    for (let k = 0; k < all.length; k++) {
      const tok = all[k], s = slots[k], landed = lp >= tok.e ? 1 : 0;
      const hitM = flash(lp, tok.e, .06), printK = bump(lp, .56 + k * .014, .1);
      s.m.emissiveIntensity = .35 + landed * .9 + hitM * 4 + printK * 2.5 + Math.sin(t * 2.2 + k) * .12 + (1 - landed) * smooth(lin((lp - tok.tk.s) / DUR, .5, 1)) * 1.4;
      s.ring.visible = shut < .75;
      const wait = 1 - landed, coming = smooth(lin((lp - tok.tk.s) / DUR, .6, 1));
      s.ring.scale.setScalar(1 + hitM * .18 + wait * (Math.sin(t * 2.4 + k * 1.7) * .035 - coming * .12));
      s.print.material.opacity = (hitM * .9 + landed * .16 + printK * .7) * (1 - smooth(lin(shut, .55, .8)));
      s.print.visible = s.print.material.opacity > .005;
      const g = lin(lp, tok.e, tok.e + .065);
      s.shock.visible = g > 0 && g < 1;
      s.shock.scale.setScalar(.2 + easeOut(g, 2.4) * .95);
      s.shock.material.opacity = (1 - g) * (1 - g) * .9;
      // a burst of sparks off the landing
      for (let j = 0; j < 12; j++) {
        const q = (k * 12 + j) * 3, c4 = (k * 12 + j) * 4, gs = lin(lp, tok.e, tok.e + .05);
        if (gs <= 0 || gs >= 1) { sparks.col[c4 + 3] = 0; continue; }
        const ang = (j / 12 + k * .13) * TAU, r = easeOut(gs, 2) * (.55 + (j % 3) * .12);
        sparks.pos[q] = tok.land.x + Math.cos(ang) * r; sparks.pos[q + 1] = PAGE + .04 + Math.sin(gs * Math.PI) * (.28 + (j % 4) * .06); sparks.pos[q + 2] = tok.land.z + Math.sin(ang) * r;
        sparks.col[c4] = tok.color.r * 1.8; sparks.col[c4 + 1] = tok.color.g * 1.8; sparks.col[c4 + 2] = tok.color.b * 1.8; sparks.col[c4 + 3] = 1 - gs * gs;
      }
    }
    sparks.done();

    /* light from the closing gap, the slam and the seam */
    const gap = Math.sin(Math.min(angle, Math.PI / 2)) * PW;
    const leak = smooth(lin(angle, Math.PI * .4, .02)) * (shut < 1 ? 1 : 0);
    for (let i = 0; i < blades.length; i++) {
      const m = blades[i], o = leak * (i ? .55 : .8) + slam * (i ? .7 : 1);
      m.material.opacity = o; m.visible = o > .005;
      m.scale.y = .12 + gap * .55 + slam * .5;
      m.position.y = PAGE + gap * .2;
    }
    coverMat.emissiveIntensity = flash(lp, .69, .045) * .2 + flash(lp, .8, .06) * .08;
    seamMat.emissiveIntensity = slam * 6 + smooth(lin(lp, .69, .72)) * (.7 + Math.sin(t * 2) * .15);
    coreGlow.material.opacity = leak * .45 + slam * .8 + smooth(lin(lp, POUR_A + .02, POUR_A + .06)) * (1 - smooth(lin(lp, .6, .66))) * .35; coreGlow.visible = coreGlow.material.opacity > .005;

    /* the book: it comes down, takes the slam's squash, then the tabs, the thread, the rise and the turn */
    const crouch = bump(lp, .775, .03);
    book.scale.set(1 + .035 * hitK + .02 * crouch + .03 * thud, 1 - .08 * hitK - .05 * crouch - .07 * thud, 1 + .035 * hitK + .02 * crouch + .03 * thud);
    for (let i = 0; i < tabs.length; i++) {
      const k = springy(lin(lp, .7 + i * .016, .735 + i * .016));
      tabs[i].scale.set(Math.max(.001, k), 1, 1); tabs[i].visible = k > .002;
      const pop = flash(lp, .712 + i * .016, .05);
      tabMats[i].emissiveIntensity = .3 + pop * 1.5 + k * (.35 + Math.sin(t * 2 + i * .9) * .08);
      tabFlares[i].material.opacity = pop * .6; tabFlares[i].visible = pop > .005;
      const n = springy(lin(lp, .72 + i * .016, .745 + i * .016));
      nodes[i].scale.setScalar(Math.max(.001, n)); nodes[i].visible = n > .01;
      nodeMats[i].emissiveIntensity = 1.1 + pop * 2 + Math.sin(t * 2.4 + i) * .2 * n;
    }
    for (let i = 0; i < links.length; i++) {
      const k = easeOut(lin(lp, .735 + i * .018, .765 + i * .018), 2), l = links[i];
      l.visible = k > .01; l.scale.y = Math.max(.001, k * l.userData.len);
      l.position.lerpVectors(linkA[i], linkB[i], k / 2);
    }
    const thread = smooth(lin(lp, .74, .82));
    threadMat.emissiveIntensity = .9 + flash(lp, .8, .06) * 3 + thread * Math.sin(t * 2.6) * .25;
    sigGlow.material.opacity = thread * (.32 + Math.sin(t * 2) * .06) + flash(lp, .8, .06) * .5; sigGlow.visible = sigGlow.material.opacity > .005;

    const up = smooth(lin(lp, .79, .96)), turn = smooth(lin(lp, .785, .97));
    const bob = Math.sin(t * 1.2) * .05 * up;
    lift.position.set(REST.x, REST.y + up * 1.28 + bob + (1 - arrive) * 7, lerp(REST.z, .55, up));
    spin.rotation.y = 1.42 * turn + Math.sin(t * .4) * .06 * up;
    lean.rotation.set(.3 * turn, 0, Math.sin(t * .8) * .018 * up);
    halo.position.set(lift.position.x, .02, lift.position.z);
    halo.scale.setScalar((1 + Math.sin(t * 1.6) * .03) * lerp(.7, 1, up));
    haloMat.opacity = up * (.7 + Math.sin(t * 1.6) * .1) * .5;
    halo.visible = up > .01;
    pool.position.set(lift.position.x, .012, lift.position.z);
    poolMat.opacity = (slam * .35 + smooth(lin(lp, .69, .74)) * .12 + up * .22 + arrive * .1) * .5;
    pool.visible = poolMat.opacity > .005;
    // the slam's puff: gilt dust thrown out of the pages along the ground
    for (let i = 0; i < PUFF; i++) {
      const q = i * 3, g = lin(lp, .69, .75 + (i % 5) * .006);
      if (g <= 0 || g >= 1) { puff.col[q] = puff.col[q + 1] = puff.col[q + 2] = 0; continue; }
      const ang = (i / PUFF) * TAU + (i % 3) * .21, ex = Math.cos(ang), ez = Math.sin(ang);
      const rx = 1.8 * Math.sign(ex) * Math.min(1, Math.abs(ex) * 1.6), rz = 1.35 * Math.sign(ez) * Math.min(1, Math.abs(ez) * 1.6), out = easeOut(g, 2.6) * (1.1 + (i % 4) * .25);
      puff.pos[q] = REST.x + rx + ex * out; puff.pos[q + 1] = .08 + Math.sin(g * Math.PI) * (.25 + (i % 3) * .1); puff.pos[q + 2] = REST.z + rz + ez * out;
      const fade = (1 - g) * (1 - g) * 1.6;
      puff.col[q] = puffCol.r * fade; puff.col[q + 1] = puffCol.g * fade; puff.col[q + 2] = puffCol.b * fade;
    }
    puff.done();
    // a ring of dust at the landing, and again at the slam
    const dl = lin(real, LAND_B, LAND_B + .02), dg = lp >= .69 ? lin(lp, .69, .77) : dl;
    dust.visible = !reduce && dg > 0 && dg < 1; dust.scale.setScalar(1.5 + easeOut(dg, 2.5) * (lp >= .69 ? .9 : 1.6)); dustMat.opacity = (1 - dg) * (1 - dg) * .8;

    // motes orbit the risen book, climbing slowly, in the five stage colours
    for (let i = 0; i < 64; i++) {
      const q = i * 3;
      if (up <= 0) { motes.col[q] = motes.col[q + 1] = motes.col[q + 2] = 0; continue; }
      const seed = moteSeed[i], a = seed[0], b = seed[1], c = seed[2], vis = up * (.5 + .5 * Math.sin(t * 1.3 + i));
      const ang = a * TAU + t * (.22 + b * .2) * (i % 2 ? 1 : -1), r = 1.9 + b * 1.1, y = ((c + t * .05 * (.5 + a)) % 1) * 2.6;
      motes.pos[q] = lift.position.x + Math.cos(ang) * r; motes.pos[q + 1] = .1 + y; motes.pos[q + 2] = lift.position.z + Math.sin(ang) * r * .8;
      const fade = vis * Math.sin(Math.PI * Math.min(1, y / 2.6)) * 1.1;
      motes.col[q] = moteCol[i].r * fade; motes.col[q + 1] = moteCol[i].g * fade; motes.col[q + 2] = moteCol[i].b * fade;
    }
    motes.done();

    /* ---------- the robot: walks to each place and looks; startles at the slam, cheers the signature, looks up at the book ---------- */
    pathAt(WALK, real, walker);
    focusAt(real);
    if (attention > 0) focus.lerp(v1.set(seen.x + BX, seen.y, seen.z + BZ), attention);
    if (up > 0) focus.lerp(v1.set(lift.position.x + BX, lift.position.y, lift.position.z + BZ), up);
    const faced = Math.atan2(focus.x - walker.x, focus.z - walker.z);
    let ry = faced;
    if (walker.walk > 0) { let d = walker.ry - faced; d -= Math.round(d / TAU) * TAU; ry = faced + d * Math.min(1, walker.walk); }
    bot.update(t * idle + real * 220, walker.walk);   // the stride also follows the scroll, so it walks while the clock is held
    bot.root.rotation.y = ry;
    const reach = Math.hypot(focus.x - walker.x, focus.z - walker.z);
    bot.head.rotation.x = -Math.max(-.3, Math.min(.75, Math.atan2(focus.y - .9, reach) * 1.4)) * (1 - walker.walk * .6);
    const cheer = bump(lp, .8, .09) + bump(real, hooray, .02) * .6;
    for (let k = 0; k < botArms.length; k++) { botArms[k].rotation.z = (k ? 1 : -1) * (.1 + 2.35 * cheer + .15 * slam); botArms[k].rotation.x -= .4 * cheer; }
    let hop = slam * .16 + bump(lp, .805, .03) * .2 + bump(lp, .845, .03) * .14 + bump(real, LAND_B, .012) * .12 + bump(real, hooray, .02) * .1;
    for (let k = 0; k < all.length; k++) hop += bump(lp, all[k].e, .025) * .06;
    bot.root.position.set(walker.x, hop, walker.z);
  }

  update(0, 0);
  return { camera: cam, update };
}

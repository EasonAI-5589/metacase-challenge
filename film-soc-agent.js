/* film-soc-agent.js — beat 1 of the society Metacase film (HR-T3-114): Prior practice & strategy.
 * The measuring yard. The robot (gemini-3.8-flash) stands on its pad at the left; the three
 * packages wait as crates in front of the hubs and the supervisors. One step of the copy at a time:
 *   lp .00–.20  thresholds: six hurdles rise in front of the crates, two per package (A: 85% of the
 *               1,620 planned minutes, for 90% of supervisors; B: 90% delayed-test coverage, 75%
 *               behaviour attainment; C: two net gains above zero, a usable close-out index); the
 *               count climbs to 6
 *      .22–.44  candidate treatments: a bench rises with two cards, the provider's (accept all)
 *               and the pre-review's (A conditional; B, C by unit). The robot walks over, runs
 *               down the six hurdles again (each turns green), drops the first card and takes the
 *               second; crates B and C come apart into their units, A glows amber: conditional
 *      .46–.655 choice of measure: 73 supervisors walk out into a block; three rulers measure the
 *               same people against the contract's 75% line: 73, 67 and 53 of 73. The third stops
 *               short of the line; the robot takes the second
 *      .67–.79  comparison design: the supervisors walk home; a column of change rises in front of
 *               every hub; the deferred fourth hub's column is taken off each trained hub's, and
 *               what is left glows: the net change
 *      .795–.88 the harness comes down into the robot's hands, for the next beat.
 * Everything is a function of lp, plus a little idle life from t (none with ctx.reduce).
 * Hand-off: hand.robot.create() and hand.weapon.create() build new copies of the armed robot and of
 * its weapon (never this beat's own nodes); hand.armed keeps the plain data.
 * All entities, people and amounts of this case are synthetic. */
import { mergeGeometries } from './assets/vendor/three/BufferGeometryUtils.js';
import { yard, crowd, hub, crate, sign, cameraLine, pathAt, STATUS, lin, sm, ease, mix, backOut, hit } from './film-soc-kit.js?v=mc-1c165fc3e2';

const AMBER = 0xf2b545, EYE = 0xffd666, STEEL = 0x8f9bb5, NAVY = 0x1c2740, TEAL = 0x45b5b0;
const S = 1.5, HOLD = .8;              // the armed robot's scale for the later beats, and the weapon's length in its hands
const SB = 1.3;                        // this beat's own robot: a little smaller, so it stands clear of the props
const RX = -.35, RZ = 1.2;             // the robot's pad
const HUB_X = [.1, 1.45, 2.8, 4.15], HUB_Z = -2.45;
const LANE = [.9, 2.15, 3.5], CRATE_Z = -.8;
// the six contract thresholds: lane, row (0 behind, 1 in front), the figure and what it measures
const HURDLES = [
  { lane: 0, row: 0, big: '85%', small: 'of 1,620 planned min' }, { lane: 0, row: 1, big: '90%', small: 'of supervisors' },
  { lane: 1, row: 0, big: '90%', small: 'delayed-test coverage' }, { lane: 1, row: 1, big: '75%', small: 'behaviour attainment' },
  { lane: 2, row: 0, big: '> 0', small: 'two core net gains' }, { lane: 2, row: 1, big: 'usable', small: 'close-out index' },
];
// three ways to count behaviour attainment among the 73 with two verified incidents
const MEASURES = [{ n: 73, tag: 'all reviewed items' }, { n: 67, tag: 'last round, mean' }, { n: 53, tag: 'last round, all five ≥ 3' }];
const TAKEN = 1;
// each trained hub's net change on the response-SLA rate, in points (shown as heights, not printed)
const NET = [6.5, 4.5, 2.0], REF_H = .34, NET_UNIT = .1;
const T = {
  hurdle: .02, hurdleStep: .029,
  bench: .225, cards: [.245, .27], recheck: .30, recheckStep: .0125, choose: .388, split: .402,
  sink: .392, clear: .445, clearEnd: .475,
  out: .462, block: .5, grow: [.515, .55, .585], growLen: .03, pick: .632,
  home: .655, cols: .69, take: .722, takeStep: .013, ref: .762, colsOut: .775,
  dropA: .795, dropB: .85,
};
const WALK = [
  [0, RX, RZ], [.205, RX, RZ], [.25, .2, 2.4], [.445, .2, 2.4], [.5, -.25, 1.85], [.655, -.25, 1.85],
  [.7, RX, RZ], [1, RX, RZ],
];
// Where the robot looks: [lp, x, y, z], in set coordinates.
const FOCUS = [
  [0, .9, .8, -.15], [.08, 2.15, .8, -.15], [.14, 3.5, .8, -.15], [.2, 3.5, .6, .5],
  [.26, 2.2, .6, 2.3], [.3, .9, .7, -.15], [.375, 3.5, .5, .5], [.4, 2.75, .6, 2.3], [.45, 2.75, .6, 2.3],
  [.5, 1.95, .3, .1], [.53, 1.95, .2, 1.2], [.565, 1.95, .2, 1.6], [.6, 1.95, .2, 2.0], [.64, 1.95, .2, 1.6], [.66, 1.95, .2, 1.6],
  [.7, 2.1, .8, -1.2], [.75, 4.15, .5, -1.2], [.79, 2.1, .8, -1.2],
  [.81, RX - .2, 3.6, 1.3], [.85, RX, 1.1, 1.5], [1, RX + 1.3, 1.2, 5],
];
const pulse = (x, at, rise, fall) => (x < at ? 0 : x < at + rise ? sm((x - at) / rise) : Math.exp(-(x - at - rise) / fall));
const outCubic = x => 1 - (1 - x) * (1 - x) * (1 - x);

export async function build({ THREE, kit, set, labelTexture, loadWeapons, hand, util, camera, reduce, layout }) {
  const { PALETTE, GUN_HOLD, add, cyl, block, rbox, mat, glowMat } = kit;
  const ctx = { THREE, kit };
  const additive = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, ...extra });
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const glowClone = (color, k) => glowMat(color, k).clone(); // kit materials are shared: clone before animating
  const cAmber = new THREE.Color(AMBER), cGold = new THREE.Color(0xffc95a), cGreen = new THREE.Color(STATUS.verified), cRose = new THREE.Color(STATUS.disputed);
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  function printed(parent, key, lines, w, h, x = 0, y = 0, z = 0, px = 512) {
    const tex = labelTexture(`film-soc-plan-${key}`, lines, { width: px, height: Math.round(px * h / w) });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.position.set(x, y, z); m.renderOrder = 2; parent.add(m);
    return m;
  }

  /* ---- the yard, the hubs, the supervisors at home in front of the trained hubs, the pad ---- */
  const ground = yard({ THREE, kit, set, accent: AMBER });
  const hubs = ['HUB-01', 'HUB-02', 'HUB-03', 'HUB-04'].map((name, i) => {
    const h = hub({ ...ctx, name, color: [PALETTE.teal, PALETTE.sky, PALETTE.violet, 0][i], deferred: i === 3 });
    h.group.position.set(HUB_X[i], 0, HUB_Z); h.group.scale.setScalar(.92); set.add(h.group);
    return h;
  });
  const people = crowd({ ...ctx, n: 83 }); set.add(people.group);
  const BLUE = 0x4a7fd4, GREY = 0x6f7a90;
  // home: in front of the three trained hubs; slot: the 73 with two verified incidents, in the block
  const P = [];
  for (let i = 0; i < 83; i++) {
    const g = i % 3, j = Math.floor(i / 3), col = j % 7, row = Math.floor(j / 7);
    P.push({ hx: HUB_X[g] - .51 + col * .17 + (row % 2) * .04, hz: -1.82 + row * .18, ph: hash(i) * 6.28 });
  }
  const BX0 = .75, BDX = .2, BZ0 = -.5, BDZ = .25, RULER_LEN = 12 * BDX + .12;
  for (let s = 0; s < 73; s++) { P[s].sx = BX0 + Math.floor(s / 6) * BDX; P[s].sz = BZ0 + (s % 6) * BDZ; }
  cyl(set, .82, .9, .1, NAVY, RX, .05, RZ, 48);
  const padRim = add(set, new THREE.TorusGeometry(.86, .022, 8, 72), glowClone(AMBER, 1.2), RX, .1, RZ, false);
  padRim.rotation.x = Math.PI / 2;
  const plateTex = labelTexture('film-soc-agent-model', [{ text: 'gemini-3.8-flash', size: 56, weight: 700, color: '#ffffff', track: 2 }], { width: 640, height: 128 });
  const nameplate = new THREE.Mesh(new THREE.PlaneGeometry(1.3, .26), new THREE.MeshBasicMaterial({ map: plateTex, color: cGold, transparent: true, depthWrite: false }));
  nameplate.position.set(RX + .3, .12, RZ + 1.15); nameplate.rotation.x = -Math.PI / 2 + .85; nameplate.renderOrder = 2; set.add(nameplate);

  /* ---- the robot and its weapon, which arrives last ---- */
  const bot = kit.robot(PALETTE.cream, EYE);
  bot.root.scale.setScalar(SB); bot.root.position.set(RX, .1, RZ); set.add(bot.root);
  const eyeShared = mat(EYE, { emissive: EYE, intensity: 2.2 }), eyeMat = eyeShared.clone();
  bot.root.traverse(o => { if (o.material === eyeShared) o.material = eyeMat; });
  const anchor = new THREE.Object3D();
  anchor.position.copy(GUN_HOLD.at); anchor.rotation.copy(GUN_HOLD.turn); anchor.scale.setScalar(HOLD); bot.root.add(anchor);

  let library = null;
  try { library = await loadWeapons(); } catch { library = null; }
  function matteClone(src) { // a matte copy of a shared arena model, with its own materials
    const obj = src.clone(true), mats = [], made = new Map();
    obj.traverse(o => {
      if (!o.isMesh) return;
      let m = made.get(o.material);
      if (!m) {
        const s = o.material;
        m = new THREE.MeshStandardMaterial({ color: s.color ? s.color.clone() : 0xffffff, map: s.map || null, emissive: 0xffffff, emissiveMap: s.map || null, emissiveIntensity: 0, roughness: .7, metalness: 0 });
        made.set(s, m); mats.push({ m, glow: 0 });
      }
      o.material = m; o.castShadow = true; o.receiveShadow = true;
    });
    return { obj, mats };
  }
  function blaster(color) { // the kit's blaster, merged to one mesh per material
    const src = kit.blaster(color);
    src.updateMatrixWorld(true);
    const groups = new Map();
    src.traverse(o => { if (o.isMesh) { if (!groups.has(o.material)) groups.set(o.material, []); groups.get(o.material).push(o.geometry.clone().applyMatrix4(o.matrixWorld)); } });
    const obj = new THREE.Group(), mats = [];
    for (const [s, geos] of groups) {
      const merged = mergeGeometries(geos);
      geos.forEach(g => g.dispose());
      if (!merged) continue;
      const m = s.clone(), glow = s.emissive.getHex() ? s.emissiveIntensity : 0;
      if (!glow) { m.emissive.copy(m.color); m.emissiveIntensity = 0; }
      const mesh = new THREE.Mesh(merged, m); mesh.castShadow = mesh.receiveShadow = true; obj.add(mesh);
      mats.push({ m, glow });
    }
    return obj.children.length ? { obj, mats } : { obj: src, mats: [] };
  }
  const makeWeapon = () => (library ? matteClone(library.weapons[0]) : blaster(AMBER));
  const pick = makeWeapon(); pick.obj.visible = false; set.add(pick.obj);
  const shade = glow => { for (const e of pick.mats) e.m.emissiveIntensity = e.glow + glow; };
  const pickLabel = printed(set, 'harness', [{ text: 'DeepSeek Harness', size: 60, weight: 650, color: '#ffffff', track: 1 }], 1.9, .32, 0, 0, 0, 640);
  pickLabel.material.color.copy(cGold); pickLabel.visible = false;

  /* ---- reusable light: a stretched beam, a flash, and floor rings ---- */
  const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const beam = color => { const m = new THREE.Mesh(beamGeo, additive(color, 0)); m.visible = false; m.frustumCulled = false; set.add(m); return m; };
  const UP = V(0, 1, 0), dir = V();
  function stretch(m, a, b, r) {
    dir.copy(b).sub(a);
    const L = dir.length();
    if (L < 1e-4) { m.visible = false; return; }
    m.position.copy(a).addScaledVector(dir, .5);
    m.quaternion.setFromUnitVectors(UP, dir.divideScalar(L));
    m.scale.set(r, L, r); m.visible = true;
  }
  const link = beam(AMBER), column = beam(AMBER);
  const flash = util.glowSprite(0xffe2a8, 1, 0); set.add(flash);
  const ringGeo = new THREE.TorusGeometry(1, .03, 6, 96); ringGeo.rotateX(Math.PI / 2);
  const pulses = [0, 1].map(() => { const m = new THREE.Mesh(ringGeo, additive(AMBER, 0)); m.position.set(RX, .12, RZ); m.visible = false; m.frustumCulled = false; set.add(m); return m; });

  /* ---- acts one and two: the crates, the six hurdles, the bench with the two treatments ---- */
  const early = new THREE.Group(); set.add(early);
  const packs = [['A', 1], ['B', 4], ['C', 2]].map(([letter, units], i) => {
    const c = crate({ ...ctx, letter, units, unitW: .36 }); c.group.position.set(LANE[i], 0, CRATE_Z); early.add(c.group);
    c.segments.forEach(sg => { sg.mat.emissive.setHex(AMBER); sg.mat.emissiveIntensity = 0; sg.x0 = sg.mesh.position.x; });
    return c;
  });
  const hurdles = HURDLES.map((h, i) => {
    const s = sign({ ...ctx, key: `plan-hurdle-${i}`, w: 1.1, h: .4, color: AMBER, post: h.row ? .14 : .62, px: 512, lines: [{ text: h.big, size: h.big.length > 4 ? 84 : 100, weight: 800, color: '#ffffff' }, { text: h.small, size: 40, weight: 600, color: '#f2c96a' }] });
    s.group.position.set(LANE[h.lane], 0, h.row ? .5 : -.15); s.group.visible = false; early.add(s.group);
    return { ...h, s, at: T.hurdle + i * T.hurdleStep, again: T.recheck + i * T.recheckStep, top: V(LANE[h.lane], (h.row ? .14 : .62) + .2, h.row ? .5 : -.15) };
  });
  const bench = new THREE.Group(); bench.position.set(2.2, 0, 2.3); bench.visible = false; early.add(bench);
  block(bench, 2.4, .1, .56, 0x2f3a56, 0, .06, 0, .03);
  for (const sx of [-1, 1]) block(bench, .1, .06, .5, 0x1a2338, sx * 1.05, 0, 0, .02);
  const cards = [
    { x: -.58, color: STEEL, lines: [{ text: 'PROVIDER', size: 44, weight: 800, color: '#c8d0e0', track: 5 }, { text: 'accept all', size: 96, weight: 800, color: '#ffffff' }, { text: 'A, B, C in full', size: 46, weight: 600, color: '#c8d0e0' }] },
    { x: .58, color: AMBER, lines: [{ text: 'PRE-REVIEW · 29 May', size: 42, weight: 800, color: '#f2c96a', track: 3 }, { text: 'A conditional', size: 78, weight: 800, color: '#ffffff' }, { text: 'B, C by unit', size: 78, weight: 800, color: '#ffffff' }] },
  ].map((c, i) => {
    const s = sign({ ...ctx, key: `plan-card-${i}`, w: 1.08, h: .68, color: c.color, px: 640, lines: c.lines });
    s.group.position.set(c.x, .16, 0); s.group.visible = false; bench.add(s.group);
    return { ...c, s, at: T.cards[i] };
  });

  /* ---- act three: three rulers in front of the block, and the contract's 75% line across them ---- */
  const rulers = new THREE.Group(); rulers.visible = false; set.add(rulers);
  const RZS = [1.15, 1.72, 2.29], RX0 = BX0 - .06;
  const fillGeo = new THREE.BoxGeometry(1, .07, .16); fillGeo.translate(.5, .035, 0);
  const rules = MEASURES.map((m, i) => {
    block(rulers, RULER_LEN + .08, .04, .24, 0x141c2e, RX0 + RULER_LEN / 2, 0, RZS[i], .015);
    const fillMat = glowClone(AMBER, .9);
    const fill = new THREE.Mesh(fillGeo, fillMat); fill.position.set(RX0, .04, RZS[i]); rulers.add(fill);
    const s = sign({ ...ctx, key: `plan-measure-${i}`, w: 1.22, h: .34, color: AMBER, px: 640, lines: [{ text: `${m.n} / 73`, size: 96, weight: 800, color: '#ffffff' }, { text: m.tag, size: 40, weight: 600, color: '#f2c96a' }] });
    s.group.position.set(RX0 + RULER_LEN + .72, .02, RZS[i] - .02); s.group.rotation.x = -1.1; rulers.add(s.group);
    return { ...m, fill, fillMat, s, z: RZS[i] };
  });
  const gateX = RX0 + RULER_LEN * .75, gateMat = glowClone(0xffffff, 1.4);
  const gate = new THREE.Group(); gate.position.set(gateX, 0, 1.72); rulers.add(gate);
  add(gate, rbox(.03, .3, 1.5, .012), gateMat, 0, .17, 0, false);
  const gateSign = sign({ ...ctx, key: 'plan-gate', w: .56, h: .28, color: 0xffffff, post: .34, px: 256, lines: [{ text: '75%', size: 96, weight: 800, color: '#ffffff' }] });
  gateSign.group.position.set(0, 0, -.88); gate.add(gateSign.group);

  /* ---- act four: a column of change in front of every hub; the reference's is taken off the others ---- */
  const cols = new THREE.Group(); cols.visible = false; set.add(cols);
  const colGeo = rbox(.36, 1, .36, .04).clone().translate(0, .5, 0), COL_Z = -.95;
  const columns = HUB_X.map((x, i) => {
    const trained = i < 3, h = trained ? REF_H + NET[i] * NET_UNIT : REF_H;
    cyl(cols, .34, .38, .05, NAVY, x, .025, COL_Z, 28);
    const m = (trained ? glowClone(TEAL, .5) : mat(STEEL, { emissive: STEEL, intensity: .25 }).clone());
    const body = add(cols, colGeo, m, x, .05, COL_Z);
    let low = null, lowMat = null;
    if (trained) { lowMat = mat(STEEL, { emissive: STEEL, intensity: .2 }).clone(); low = add(cols, rbox(.385, 1, .385, .04).clone().translate(0, .5, 0), lowMat, x, .05, COL_Z); low.visible = false; }
    return { x, trained, h, body, m, low, lowMat, at: T.take + i * T.takeStep };
  });
  const ghost = [0, 1, 2].map(() => { const g = new THREE.Mesh(new THREE.BoxGeometry(.4, REF_H, .4), additive(0xc8d4ee, 0)); g.visible = false; cols.add(g); return g; });
  const refRing = new THREE.Mesh(ringGeo, additive(STEEL, 0)); refRing.visible = false; refRing.frustumCulled = false; refRing.position.set(HUB_X[3], .07, COL_Z); cols.add(refRing);
  const refSign = sign({ ...ctx, key: 'plan-ref', w: 1.2, h: .36, color: STEEL, post: .62, px: 512, lines: [{ text: 'same-period reference', size: 44, weight: 800, color: '#ffffff' }, { text: 'not yet trained', size: 36, weight: 600, color: '#c8d0e0' }] });
  refSign.group.position.set(HUB_X[3] - .12, 0, COL_Z + .5); refSign.group.rotation.y = -.25; cols.add(refSign.group);
  const formula = sign({ ...ctx, key: 'plan-net', w: 3.4, h: .34, color: TEAL, px: 1280, lines: [{ text: 'hub change − reference change = net change', size: 62, weight: 700, color: '#ffffff' }] });
  formula.group.position.set(2.1, .02, -.3); formula.group.rotation.x = -.95; cols.add(formula.group);

  /* ---- hand-off: copies of the armed robot and its weapon, for the beats after this one ---- */
  const template = makeWeapon().obj;
  hand.armed = { harness: 'DeepSeek Harness', weaponIndex: 0, accent: AMBER, model: 'gemini-3.8-flash', eye: EYE, weapon: () => template.clone(true) };
  hand.weapon = { harness: 'DeepSeek Harness', weaponIndex: 0, holdScale: HOLD, template, create: () => template.clone(true) };
  hand.robot = {
    model: 'gemini-3.8-flash', harness: 'DeepSeek Harness', color: PALETTE.cream, eye: EYE, scale: S,
    make: () => kit.robot(PALETTE.cream, EYE),
    // returns { root, robot, weapon, update(t) }: a new robot with the weapon in its hands; call update every frame
    create() {
      const r = kit.robot(PALETTE.cream, EYE), w = template.clone(true);
      w.position.copy(GUN_HOLD.at); w.rotation.copy(GUN_HOLD.turn); w.scale.setScalar(HOLD);
      r.root.add(w); r.root.scale.setScalar(S); r.grip(1);
      return { root: r.root, robot: r, weapon: w, update: (t, walking = 0) => r.update(t, walking) };
    },
  };
  hand.plan = { thresholds: 6, measure: MEASURES[TAKEN].tag, attained: MEASURES[TAKEN].n, of: 73 };

  /* ---- the camera: over the hurdles, down to the bench, above the block, in to the hubs, the catch ---- */
  const cam = { from: { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 }, to: { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 } };
  const line = cameraLine([
    { at: 0, pos: [1.6, 3.6, 7.6], look: [2.0, .75, -.1], fov: 34 },
    { at: .2, pos: [1.8, 3.4, 7.6], look: [2.05, .75, 0], fov: 34 },
    { at: .27, pos: [2.0, 3.4, 8.0], look: [2.05, .6, .55], fov: 34 },
    { at: .385, pos: [2.1, 3.4, 8.0], look: [2.1, .6, .5], fov: 34 },
    { at: .43, pos: [2.2, 3.6, 7.7], look: [2.15, .5, .1], fov: 34 },
    { at: .5, pos: [2.2, 5.0, 7.9], look: [2.2, .2, .8], fov: 34 },
    { at: .65, pos: [2.3, 4.8, 7.9], look: [2.25, .2, .8], fov: 34 },
    { at: .71, pos: [2.0, 3.4, 7.3], look: [2.05, .7, -.9], fov: 33 },
    { at: .785, pos: [2.2, 3.3, 7.2], look: [2.1, .7, -.9], fov: 33 },
    { at: .86, pos: [.7, 2.3, 6.4], look: [.2, 1.2, 1.0], fov: 31 },
    { at: 1, pos: [.9, 2.3, 6.6], look: [.3, 1.25, 1.0], fov: 31 },
  ]);
  line(0, cam);

  /* ---- scratch, so update allocates nothing ---- */
  const v = V(), w = V(), focus = V(), head0 = V();
  const m4 = new THREE.Matrix4();
  const holdPos = V(), holdQuat = new THREE.Quaternion(), holdScl = V();
  const zAxis = V(0, 0, 1), qRoll = new THREE.Quaternion(), qStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.2, Math.PI / 2, 0));
  const skyPos = V(RX - .3, 5.2, RZ + .25);
  const walker = { x: RX, z: RZ, ry: .5, walk: 0 }, colA = new THREE.Color(), colB = new THREE.Color();
  function focusAt(lp, out) {
    let i = 0;
    while (i < FOCUS.length - 2 && lp > FOCUS[i + 1][0]) i++;
    const a = FOCUS[i], b = FOCUS[i + 1], k = sm(lin(lp, a[0], b[0]));
    return out.set(mix(a[1], b[1], k), mix(a[2], b[2], k), mix(a[3], b[3], k));
  }

  return {
    camera: cam,
    update(lp, t, dt, ui) {
      if (reduce) { lp = .77; t = 0; } // reduced motion gets one still: the comparison design, all of it in place
      const stacked = !!layout?.stacked;
      const catchHit = pulse(lp, T.dropB, .004, .03);

      /* the robot: it walks to each act, looks at what the step names, hops when it decides */
      const fly = lin(lp, T.dropA, T.dropB);
      const recoilR = lin(lp, T.dropB, .89), recoil = Math.sin(Math.PI * recoilR) * (1 - recoilR) * 1.7;
      const hop = Math.sin(Math.PI * lin(lp, T.choose, T.choose + .03)) * .1 + Math.sin(Math.PI * lin(lp, T.pick, T.pick + .03)) * .08;
      pathAt(WALK, lp, walker);
      focusAt(lp, focus);
      // the body stays turned to the camera's side of the stage; the head does the looking
      const stand = mix(mix(.42, .7, ease(lp, .69, .72) * (1 - ease(lp, .77, .79))), .25, sm(lin(lp, .8, .87)));
      bot.root.position.set(walker.x, .1 + hop - recoil * .07, walker.z);
      bot.root.rotation.set(-recoil * .06, walker.walk > 0 ? mix(stand, walker.ry, walker.walk) : stand, 0);
      const punch = pulse(lp, T.dropB, .002, .009), sp = SB * (1 + .04 * punch);
      bot.root.scale.set(sp * (1 + recoil * .045), sp * (1 - recoil * .07), sp * (1 + recoil * .045));
      bot.grip(sm(lin(lp, .815, T.dropB)));
      bot.update(reduce ? 0 : t + lp * 60, reduce ? 0 : walker.walk);
      bot.root.updateMatrix(); anchor.updateMatrix();
      m4.multiplyMatrices(bot.root.matrix, anchor.matrix).decompose(holdPos, holdQuat, holdScl);
      const head = bot.head;
      head.getWorldPosition(head0); set.worldToLocal(head0);
      v.copy(focus).sub(head0);
      const pitch = Math.max(-.5, Math.min(.3, -Math.atan2(v.y, Math.hypot(v.x, v.z))));
      const yaw = Math.max(-.55, Math.min(.55, Math.atan2(v.x, Math.abs(v.z) + 1.2) - bot.root.rotation.y));
      head.rotation.y = yaw * (1 - .8 * sm(lin(lp, .87, .9))); head.rotation.x = pitch * (1 - .6 * sm(lin(lp, .87, .9)));
      eyeMat.emissiveIntensity = 2.2 + catchHit * 2.5 + pulse(lp, T.choose, .006, .03) * 2 + pulse(lp, T.pick, .006, .03) * 2;

      /* acts one and two */
      const clear = ease(lp, T.clear, T.clearEnd);
      early.visible = clear < 1; early.position.y = -1.6 * clear;
      let n = 0;
      const chosen = ease(lp, T.choose, T.choose + .015);
      hurdles.forEach(h => {
        const r = backOut(lin(lp, h.at, h.at + .03), 1.4);
        if (lp >= h.at + .012) n++;
        const gone = ease(lp, T.sink + h.lane * .004, T.sink + .02 + h.lane * .004);
        h.s.group.visible = r > .01 && gone < 1; h.s.group.scale.set(1, Math.max(.001, r), 1); h.s.group.position.y = -1.1 * gone;
        const again = ease(lp, h.again, h.again + .01);
        h.s.frameMat.color.copy(colA.copy(cAmber).lerp(cGreen, again)); h.s.frameMat.emissive.copy(h.s.frameMat.color);
        h.s.frameMat.emissiveIntensity = .9 + hit(lp, h.at + .02, .03) * 2 + hit(lp, h.again, .02) * 2.5 + .12 * Math.sin(t * 1.6 + h.lane);
      });
      ui.set('hours', String(n));
      const benchUp = backOut(lin(lp, T.bench, T.bench + .03), 1.2);
      bench.visible = benchUp > .01; bench.scale.setScalar(Math.max(.001, benchUp));
      cards.forEach((c, i) => {
        const up = backOut(lin(lp, c.at, c.at + .03), 1.5), fall = i === 0 ? ease(lp, T.choose, T.choose + .025) : 0, win = i === 1 ? chosen : 0;
        c.s.group.visible = up > .01; c.s.group.scale.setScalar(Math.max(.001, up));
        c.s.group.rotation.x = -.2 - 1.25 * fall; c.s.group.position.y = .16 + win * .1;
        c.s.labelMat.opacity = 1 - .75 * fall;
        c.s.frameMat.emissiveIntensity = (1 + hit(lp, c.at + .025, .03) * 1.5) * (1 - .9 * fall) + win * (.8 + hit(lp, T.choose, .04) * 3);
      });
      // the crates: B and C come apart into their units, A glows amber (conditional)
      const split = ease(lp, T.split, T.split + .03);
      packs.forEach((c, i) => {
        const mid = (c.segments.length - 1) / 2;
        c.segments.forEach((sg, j) => {
          sg.mesh.position.x = sg.x0 + (j - mid) * .1 * split * (i ? 1 : 0);
          sg.mesh.position.y = .25 + (i ? Math.sin(Math.PI * lin(lp, T.split + j * .006, T.split + .03 + j * .006)) * .12 : 0);
          sg.mat.emissiveIntensity = i ? hit(lp, T.split + .03 + j * .006, .03) * .8 : split * (.35 + .12 * Math.sin(t * 3));
        });
        c.strap.visible = !(i && split > .05);
      });

      /* the supervisors: at home, out to the block for the three measures, home again */
      const act3 = lp >= T.out && lp < T.home + .05;
      const g = T.grow, m = lp < g[1] ? 0 : lp < g[2] ? 1 : lp < T.pick ? 2 : TAKEN;
      const counted = lp >= T.pick ? 73 : 73 * lin(lp, g[m], g[m] + T.growLen);
      for (let i = 0; i < 83; i++) {
        const p = P[i];
        let x = p.hx, z = p.hz, y = Math.abs(Math.sin(t * 1.3 + p.ph)) * .012, ry = Math.sin(t * .5 + p.ph) * .35, tint = BLUE;
        if (i < 73) {
          const a = T.out + i / 73 * .018, b = T.home + (72 - i) / 73 * .015;
          const k = ease(lp, a, a + .03) * (1 - ease(lp, b, b + .03));
          if (k > 0) {
            x = mix(p.hx, p.sx, k); z = mix(p.hz, p.sz, k);
            if (k < 1) { y += Math.abs(Math.sin(k * 14 + p.ph)) * .05; ry = lp < T.home ? 0 : Math.PI; } else ry *= .4;
            if (act3 && lp >= g[0] && i < counted) { tint = i < MEASURES[m].n ? STATUS.verified : GREY; y += hit(counted, i, 6) * .07; }
          }
        }
        people.place(i, x, z, { y, ry, s: .72 }); people.tint(i, tint);
      }
      people.commit();
      const rulersIn = ease(lp, T.block - .005, T.block + .02) * (1 - ease(lp, T.home - .002, T.home + .025));
      rulers.visible = rulersIn > 0; rulers.position.y = -.5 * (1 - rulersIn);
      const picked = ease(lp, T.pick, T.pick + .015);
      rules.forEach((r, i) => {
        const k = lin(lp, g[i], g[i] + T.growLen), short = r.n < 73 * .75 ? ease(lp, g[i] + T.growLen, g[i] + T.growLen + .012) : 0;
        r.fill.scale.x = Math.max(.001, RULER_LEN * r.n / 73 * k);
        r.fillMat.color.copy(colA.copy(cAmber).lerp(cRose, short)); r.fillMat.emissive.copy(r.fillMat.color);
        const dimmed = i === TAKEN ? 0 : picked * .6;
        r.fillMat.emissiveIntensity = (.9 + (i === TAKEN ? picked * .9 + hit(lp, T.pick, .04) * 2 : 0)) * (1 - dimmed);
        r.s.group.scale.setScalar(Math.max(.001, backOut(lin(lp, g[i] + T.growLen - .008, g[i] + T.growLen + .014))));
        r.s.frameMat.color.copy(colB.copy(cAmber).lerp(cRose, short)); r.s.frameMat.emissive.copy(r.s.frameMat.color);
        r.s.frameMat.emissiveIntensity = (1 + (i === TAKEN ? picked * 1.2 + hit(lp, T.pick, .04) * 3 : 0)) * (1 - dimmed);
        r.s.labelMat.opacity = 1 - dimmed * .8;
        r.fill.position.y = .04 + (i === TAKEN ? picked * .03 : 0);
      });
      gateMat.emissiveIntensity = 1.2 + hit(lp, g[2] + T.growLen, .04) * 3 + .2 * Math.sin(t * 3);

      /* act four: the columns of change, and the reference taken off each trained hub */
      const colsIn = ease(lp, T.cols, T.cols + .02) * (1 - ease(lp, T.colsOut, T.colsOut + .02));
      cols.visible = colsIn > 0;
      columns.forEach((c, i) => {
        const grow = backOut(lin(lp, T.cols + .004 + i * .006, T.cols + .034 + i * .006), 1.2) * colsIn;
        c.body.scale.y = Math.max(.001, c.h * grow);
        if (c.trained) {
          const fly2 = lin(lp, c.at, c.at + .014), taken = ease(lp, c.at + .012, c.at + .02);
          c.low.visible = taken > 0 && colsIn > 0; c.low.scale.y = Math.max(.001, REF_H * taken * colsIn);
          c.m.emissiveIntensity = .5 + taken * (.9 + .2 * Math.sin(t * 2.4 + i)) + hit(lp, c.at + .014, .03) * 2;
          const gh = ghost[i];
          gh.visible = fly2 > 0 && fly2 < 1;
          if (gh.visible) { const e = sm(fly2); gh.position.set(mix(HUB_X[3], c.x, e), .05 + REF_H / 2 + Math.sin(Math.PI * fly2) * .7, COL_Z); gh.material.opacity = .5 * Math.sin(Math.PI * fly2) + .15; }
        } else c.m.emissiveIntensity = .25 + hit(lp, T.ref, .04) * 2 + .5 * ease(lp, T.take, T.take + .01);
      });
      const rr = lin(lp, T.ref, T.ref + .04);
      refRing.visible = rr > 0 && rr < 1; refRing.scale.setScalar(.4 + .9 * outCubic(rr)); refRing.material.opacity = (1 - rr) * (1 - rr);
      refSign.group.scale.setScalar(Math.max(.001, backOut(lin(lp, T.cols + .03, T.cols + .055)) * colsIn));
      formula.group.scale.setScalar(Math.max(.001, backOut(lin(lp, T.cols + .015, T.cols + .045)) * colsIn));
      formula.frameMat.emissiveIntensity = 1 + hit(lp, T.take + .04, .05) * 2;
      hubs.forEach((h, i) => { if (i < 3) h.bandMat.emissiveIntensity = .35 + .1 * Math.sin(t * 1.5 + i) + colsIn * .4; });

      /* the robot's line of sight: to the hurdle it reads, the card it takes, the ruler, the reference */
      let aim = 0;
      for (const h of hurdles) { const k = Math.max(hit(lp, h.at, .028), hit(lp, h.again, .012)); if (k > aim) { aim = k; w.copy(h.top); } }
      const k2 = ease(lp, T.choose - .012, T.choose) * (1 - ease(lp, .43, .44));
      if (k2 > aim) { aim = k2; w.set(2.78, .66, 2.32); }
      const k3 = ease(lp, T.pick - .012, T.pick) * (1 - ease(lp, .65, .658));
      if (k3 > aim) { aim = k3; w.set(RX0 + RULER_LEN * .5, .12, RZS[TAKEN]); }
      const k4 = ease(lp, T.take - .012, T.take) * (1 - ease(lp, T.ref + .012, T.ref + .024));
      if (k4 > aim) { aim = k4; w.set(HUB_X[3], .05 + REF_H, COL_Z); }
      link.visible = false;
      if (aim > .02) { head0.y += .22; stretch(link, head0, w, .011); link.material.opacity = .34 * Math.min(1, aim * 1.5); }

      /* the harness: down a column of light, into the hands */
      pick.obj.visible = lp >= T.dropA;
      column.visible = false;
      if (pick.obj.visible) {
        const o = pick.obj;
        if (fly < 1) {
          const e = sm(fly);
          o.position.lerpVectors(skyPos, holdPos, e);
          o.position.x += Math.sin(fly * Math.PI) * .28;
          qRoll.setFromAxisAngle(zAxis, Math.PI * 2 * sm(fly));
          o.quaternion.copy(qStart).slerp(holdQuat, sm(lin(fly, .1, .95))).multiply(qRoll);
          o.scale.setScalar(mix(HOLD * 1.25, holdScl.x, sm(lin(fly, .2, 1))));
        } else {
          o.position.copy(holdPos); o.quaternion.copy(holdQuat); o.scale.copy(holdScl);
        }
        shade(Math.sin(Math.PI * fly) * .4 + catchHit * .9 + (fly >= 1 ? .06 : 0));
        const beamOn = Math.sin(Math.PI * fly);
        if (beamOn > .002) {
          v.copy(skyPos).setY(skyPos.y + 1.5);
          w.copy(holdPos);
          stretch(column, v, w, .22);
          column.material.opacity = beamOn * .12;
        }
      }
      pickLabel.visible = fly > 0 && lp < T.dropB + .03;
      if (pickLabel.visible) {
        pickLabel.position.copy(pick.obj.position); pickLabel.position.y += .5; pickLabel.position.x += .15;
        pickLabel.quaternion.copy(camera.quaternion);
        pickLabel.material.opacity = sm(lin(fly, 0, .2)) * (1 - sm(lin(lp, T.dropB, T.dropB + .03)));
      }
      for (let i = 0; i < 2; i++) {
        const r = lin(lp, T.dropB + i * .012, T.dropB + .07 + i * .012);
        pulses[i].scale.setScalar(.9 + 3 * outCubic(r));
        pulses[i].material.opacity = (1 - r) * (1 - r) * (i ? .7 : 1);
        pulses[i].visible = r > 0 && r < 1;
      }
      flash.position.copy(holdPos);
      flash.material.opacity = catchHit * .6;
      flash.scale.setScalar(.5 + .9 * catchHit);

      ground.rimMat.emissiveIntensity = 1 + .25 * Math.sin(t * 2) + hit(lp, T.choose, .04) * 1.5 + hit(lp, T.pick, .04) * 1.5 + hit(lp, T.ref, .04) * 1.2 + catchHit * 3;
      padRim.material.emissiveIntensity = 1.1 + .2 * Math.sin(t * 2.6) + catchHit * 4;

      const shake = catchHit * .05 * Math.sin(lp * 2400);
      line(lp, cam, stacked ? -.05 : -.45 - Math.max(0, 1.85 - camera.aspect) * .9, stacked ? 2.1 : 1.15);
      cam.from.pos[0] = cam.to.pos[0] += shake; cam.from.pos[1] = cam.to.pos[1] += shake * .6;
    },
  };
}

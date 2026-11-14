/* film-soc-agent.js — beat 1 of the social-science Metacase film (HR-T3-114): Prior practice & strategy.
 * The robot (gemini-3.8-flash) stands at the left of the plinth and the stage rises in front of it,
 * one step of the copy at a time. Each prop carries only numbers, identifiers and short labels.
 *   lp .00–.22  thresholds: the Rules v1.1 board rises with package A's two thresholds (85% of the
 *               planned minutes, met by 90%), then the board for B (90%, 75%) and C (at least 2
 *               metrics); an “uploaded = reviewed” plaque rises between them, the rules strike it
 *               and it drops
 *      .22–.44  candidate treatments: two paths draw out, to the provider's 816,000 accepted in
 *               full and to the pre-review view (A 90%, B 3/4, C 1/2); the rules strike the first,
 *               it topples dark, and the second lights
 *      .44–.66  choice of measure: three columns grow to 73, 67 and 53 of 73 supervisors, the three
 *               ways behaviour attainment can be counted; the contract's 75% gate drops across them
 *               and the third falls below it; the agent takes the second
 *      .66–.88  comparison design: the three trained hubs and the deferred fourth rise; a line runs
 *               from each trained hub to HUB-04, the same-period reference. Then the harness comes
 *               down into the robot's hands, for the next beat.
 * Everything is a function of lp, plus a little idle life from t (none with ctx.reduce).
 * Hand-off: hand.robot.create() and hand.weapon.create() build new copies of the armed robot and of
 * its weapon (never this beat's own nodes); hand.armed keeps the plain data.
 * Adapted from film-agent.js (the finance film's beat 1); all entities and data are synthetic. */
import { mergeGeometries } from './assets/vendor/three/BufferGeometryUtils.js';

const AMBER = 0xf2b545, EYE = 0xffd666, STEEL = 0x6f86c8, NAVY = 0x1c2740, DEEP = 0x111a2d, RED = 0xe2667a, TEAL = 0x45b5b0;
const S = 1.5, HOLD = .8;              // the robot's scale, and the weapon's length in its hands
const RX = -2.6, RZ = .75;             // where the robot stands
const T = {
  clearA: .452, clearB: .49,           // thresholds and treatments sink
  riseC: .462, riseCEnd: .5,
  growA: .495, growStep: .03, growLen: .034,
  gate: .596, gateEnd: .612,
  choose: .632,
  clearC: .668, clearCEnd: .705,
  riseD: .672, riseDEnd: .715,
  linkA: .722, linkStep: .013, linkLen: .012, ref: .762,
  dropA: .795, dropB: .85,
};
// Where the robot stands: [lp, x, z]. It reads the thresholds from its pad, steps out to the two
// treatments, to the columns and to the hubs, and is back on the pad when the harness comes down.
const WALK = [
  [0, RX, RZ], [.205, RX, RZ], [.25, -2.05, 1.45], [.445, -2.05, 1.45], [.5, -1.85, 1.15], [.655, -1.85, 1.15],
  [.705, -1.95, .25], [.765, -1.95, .25], [.795, RX, RZ], [1, RX, RZ],
];
// Where the robot looks: [lp, x, y, z], in set coordinates.
const FOCUS = [
  [0, -.55, 1.5, -2.1], [.06, -.55, 1.5, -2.1], [.1, 2.35, 1.5, -2.1], [.14, .9, 1.2, -1.1], [.2, .9, 1.2, -1.1],
  [.26, 1.2, .7, .3], [.32, .95, .7, -.8], [.38, 1.75, .7, 1.75], [.45, 1.75, .7, 1.75],
  [.5, -.55, 1.6, .55], [.53, .95, 1.6, .55], [.56, 2.45, 1.4, .55], [.6, .95, 1.95, .55], [.63, .95, 1.6, .55], [.66, .95, 1.6, .55],
  [.7, .85, .9, -1.2], [.75, .85, .8, 1.25], [.79, .85, .8, 1.25],
  [.81, -2.8, 3.6, .9], [.85, -2.6, 1.1, 1.1], [1, -1, 1.2, 4],
];
// The camera: over the boards, across the two treatments, level with the columns, over the hubs, in on the catch.
const KEYS = [
  { t: 0, pos: [-.4, 4.4, 12.8], look: [.1, 1.3, -.5], fov: 34 },
  { t: .2, pos: [.1, 4.0, 11.8], look: [.2, 1.25, -.5], fov: 33 },
  { t: .42, pos: [.5, 4.7, 11.6], look: [.2, .85, .2], fov: 33 },
  { t: .5, pos: [.6, 4.5, 12.2], look: [.45, 1.35, .3], fov: 33 },
  { t: .65, pos: [.6, 4.5, 12.2], look: [.45, 1.35, .3], fov: 33 },
  { t: .72, pos: [.5, 5.0, 11.6], look: [.35, .75, .1], fov: 33 },
  { t: .79, pos: [.5, 5.0, 11.6], look: [.35, .75, .1], fov: 33 },
  { t: .86, pos: [-1.2, 2.5, 9.0], look: [-1.7, 1.35, .3], fov: 31 },
  { t: .9, pos: [-1.0, 2.5, 9.4], look: [-1.6, 1.4, .3], fov: 31 },
];

const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const sm = x => x * x * (3 - 2 * x);
const outBack = (x, s = 1.6) => { const u = x - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
const outCubic = x => 1 - (1 - x) * (1 - x) * (1 - x);
const mix = (a, b, k) => a + (b - a) * k;
const pulse = (x, at, rise, fall) => (x < at ? 0 : x < at + rise ? sm((x - at) / rise) : Math.exp(-(x - at - rise) / fall));
const window01 = (x, a, b, c, d) => lin(x, a, b) * (1 - lin(x, c, d));

// The camera keys as a C1 Hermite curve (Catmull-Rom tangents, at rest at both ends).
const keyValue = (k, field, c) => (field === 'fov' ? KEYS[k].fov : KEYS[k][field][c]);
const keyTangent = (k, field, c) => (k === 0 || k === KEYS.length - 1 ? 0 : (keyValue(k + 1, field, c) - keyValue(k - 1, field, c)) / (KEYS[k + 1].t - KEYS[k - 1].t));
function camAt(lp, field, c) {
  const n = KEYS.length;
  if (lp <= KEYS[0].t) return keyValue(0, field, c);
  if (lp >= KEYS[n - 1].t) return keyValue(n - 1, field, c);
  let i = 0;
  while (lp > KEYS[i + 1].t) i++;
  const h = KEYS[i + 1].t - KEYS[i].t, s = (lp - KEYS[i].t) / h, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * keyValue(i, field, c) + (s3 - 2 * s2 + s) * h * keyTangent(i, field, c)
    + (-2 * s3 + 3 * s2) * keyValue(i + 1, field, c) + (s3 - s2) * h * keyTangent(i + 1, field, c);
}

export async function build({ THREE, kit, set, labelTexture, loadWeapons, hand, util, camera, reduce, layout }) {
  const { PALETTE, GUN_HOLD, add, cyl, block, rbox, mat, glowMat } = kit;
  const additive = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, ...extra });
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const glowClone = (color, k) => glowMat(color, k).clone(); // kit materials are shared: clone before animating
  const cAmber = new THREE.Color(AMBER), cSteel = new THREE.Color(STEEL), cGold = new THREE.Color(0xffc95a), cRed = new THREE.Color(RED);
  // a printed plane; lines as labelTexture takes them, aspect from the plane's own size
  function printed(parent, key, lines, w, h, x = 0, y = 0, z = 0, px = 512) {
    const tex = labelTexture(`film-soc-plan-${key}`, lines, { width: px, height: Math.round(px * h / w) });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.position.set(x, y, z); m.renderOrder = 2; parent.add(m);
    return m;
  }

  /* ---- the plinth and the robot's pad ---- */
  cyl(set, 4.3, 4.45, .32, NAVY, 0, -.32, 0, 72);
  cyl(set, 4.46, 4.2, .55, DEEP, 0, -.87, 0, 72);
  const rim = add(set, new THREE.TorusGeometry(4.37, .03, 8, 180), glowClone(AMBER, 1.1), 0, .005, 0, false);
  rim.rotation.x = Math.PI / 2;
  cyl(set, .82, .9, .1, NAVY, RX, 0, RZ, 48);
  const padRim = add(set, new THREE.TorusGeometry(.86, .022, 8, 72), glowClone(AMBER, 1.2), RX, .1, RZ, false);
  padRim.rotation.x = Math.PI / 2;
  const plateTex = labelTexture('film-soc-agent-model', [{ text: 'gemini-3.8-flash', size: 56, weight: 700, color: '#ffffff', track: 2 }], { width: 640, height: 128 });
  const nameplate = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .32), new THREE.MeshBasicMaterial({ map: plateTex, color: cGold, transparent: true, depthWrite: false }));
  nameplate.position.set(RX, .12, RZ + 1.3); nameplate.rotation.x = -Math.PI / 2 + .85; nameplate.renderOrder = 2; set.add(nameplate);

  /* ---- the robot and its weapon, which arrives last ---- */
  const bot = kit.robot(PALETTE.cream, EYE);
  bot.root.scale.setScalar(S); bot.root.position.set(RX, .1, RZ); set.add(bot.root);
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

  /* ---- reusable light: a stretched beam, a flash, and a floor ring ---- */
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
  const link = beam(AMBER), bolt = beam(0xffe2a8), column = beam(AMBER);
  const flash = util.glowSprite(0xffe2a8, 1, 0); set.add(flash);
  const redFlash = util.glowSprite(RED, 1, 0); set.add(redFlash);
  const ringGeo = new THREE.TorusGeometry(1, .03, 6, 96); ringGeo.rotateX(Math.PI / 2);
  const shock = new THREE.Mesh(ringGeo, additive(AMBER, 0)); shock.visible = false; shock.frustumCulled = false; set.add(shock);
  const pulses = [0, 1].map(() => { const m = new THREE.Mesh(ringGeo, additive(AMBER, 0)); m.position.set(RX, .12, RZ); m.visible = false; m.frustumCulled = false; set.add(m); return m; });

  /* ---- act one and two: the threshold boards, the claim the rules reject, the two treatments ---- */
  const rulesAndOptions = new THREE.Group(); set.add(rulesAndOptions);
  function ruleBoard(key, lines, x, z, yaw, w, h) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = yaw; rulesAndOptions.add(g);
    block(g, w * .62, .14, .55, DEEP, 0, 0, 0, .04);
    add(g, rbox(w, h, .14, .07), mat(NAVY), 0, h / 2 + .12, 0);
    const edge = glowClone(AMBER, 1);
    add(g, rbox(w + .08, h + .08, .05, .08), edge, 0, h / 2 + .12, -.06, false);
    printed(g, key, lines, w * .92, h * .8, 0, h / 2 + .12, .08, 768);
    return { g, h, edge, at: V(x, h * .62, z + .12) };
  }
  const boards = [
    ruleBoard('rules', [{ text: 'Rules v1.1', size: 104, weight: 800, color: '#ffffff', track: 1 }, { text: 'A', size: 150, weight: 800, color: '#f2b545' }, { text: '85%  ·  90%', size: 92, weight: 700, color: '#f2b545', track: 1 }], -.55, -2.2, .1, 2.1, 2.3),
    ruleBoard('gates', [{ text: 'B', size: 120, weight: 800, color: '#ffffff' }, { text: '90%  ·  75%', size: 92, weight: 700, color: '#f2b545', track: 1 }, { text: 'C', size: 120, weight: 800, color: '#ffffff' }, { text: '≥ 2', size: 92, weight: 700, color: '#f2b545', track: 1 }], 2.35, -2.2, -.1, 2.1, 2.3),
  ];
  const plaque = new THREE.Group(); plaque.position.set(.9, 0, -1.05); rulesAndOptions.add(plaque);
  const plaqueTilt = new THREE.Group(); plaque.add(plaqueTilt);
  cyl(plaqueTilt, .05, .05, .8, DEEP, 0, 0, 0, 10);
  add(plaqueTilt, rbox(1.45, .62, .08, .05), mat(NAVY), 0, 1.05, 0);
  const plaqueEdge = glowClone(RED, 1.1);
  add(plaqueTilt, rbox(1.5, .67, .04, .06), plaqueEdge, 0, 1.05, -.05, false);
  const plaqueFace = printed(plaqueTilt, 'uploaded', [{ text: 'UPLOADED', size: 84, weight: 800, color: '#ffffff', track: 4 }, { text: '= REVIEWED', size: 84, weight: 800, color: '#ffffff', track: 4 }], 1.36, .54, 0, 1.05, .05, 640);

  // the provider's claim (all three packages accepted, 816,000 yuan) and the pre-review view the agent adopts
  const OPTIONS = [
    { key: 'full', lines: [{ text: '816,000', size: 112, weight: 800, color: '#ffffff', track: 1 }], x: .95, z: -.25 },
    { key: 'unit', lines: [{ text: 'A 90%', size: 104, weight: 800, color: '#ffffff', track: 1 }, { text: 'B 3/4 · C 1/2', size: 70, weight: 700, color: '#ffffff', track: 1 }], x: 1.75, z: 1.75 },
  ];
  const WIN = 1;
  const options = OPTIONS.map(o => {
    const dx = o.x - RX, dz = o.z - RZ, dist = Math.hypot(dx, dz), ux = dx / dist, uz = dz / dist;
    // the path on the floor, drawn from the pad's edge by scaling x
    const pathGeo = new THREE.BoxGeometry(1, .014, .085); pathGeo.translate(.5, 0, 0);
    const pathMat = additive(AMBER, 0);
    const path = new THREE.Mesh(pathGeo, pathMat);
    path.position.set(RX + ux * .9, .03, RZ + uz * .9); path.rotation.y = -Math.atan2(uz, ux); path.frustumCulled = false; rulesAndOptions.add(path);
    const runner = util.glowSprite(0xffe2a8, .42, 0); rulesAndOptions.add(runner);
    // the pedestal, and the token standing on it, hinged at its foot so it can topple
    const stand = new THREE.Group(); stand.position.set(o.x, 0, o.z); rulesAndOptions.add(stand);
    cyl(stand, .5, .56, .1, NAVY, 0, 0, 0, 40);
    const standRim = add(stand, new THREE.TorusGeometry(.53, .018, 6, 60), glowClone(AMBER, .8), 0, .1, 0, false);
    standRim.rotation.x = Math.PI / 2;
    const hinge = new THREE.Group(); hinge.position.y = .1; stand.add(hinge);
    add(hinge, rbox(1.02, .7, .09, .06), mat(NAVY), 0, .35, 0);
    const edge = glowClone(AMBER, 1.2);
    add(hinge, rbox(1.08, .76, .04, .07), edge, 0, .35, -.05, false);
    const face = printed(hinge, `opt-${o.key}`, o.lines, .94, .62, 0, .35, .055, 512);
    return { ...o, ux, uz, len: dist - .9 - .55, path, pathMat, runner, stand, standRim, hinge, edge, face, at: V(o.x, .55, o.z + .1) };
  });
  const STRIKES = [
    { from: boards[0].at, to: V(.9, 1.05, -1.0), a: .158, b: .178 },
    { from: boards[0].at, to: options[0].at, a: .34, b: .365 },
  ];

  /* ---- act three: three ways to count behaviour attainment, and the contract's 75% gate ---- */
  const measures = new THREE.Group(); set.add(measures);
  const MX = [-.55, .95, 2.45], MZ = .55, BASE = .06, UNIT = 2.5 / 73, GATE_Y = BASE + 73 * .75 * UNIT;
  const MEASURES = [
    { n: 73, pct: '100%', tag: 'ALL ITEMS' },
    { n: 67, pct: '91.8%', tag: 'LAST ROUND' },
    { n: 53, pct: '72.6%', tag: 'ALL FIVE ≥ 3' },
  ];
  const barGeo = rbox(.78, 1, .78, .06).clone().translate(0, .5, 0);
  const bars = MEASURES.map((m, i) => {
    const g = new THREE.Group(); g.position.set(MX[i], 0, MZ); measures.add(g);
    cyl(g, .64, .7, BASE, NAVY, 0, 0, 0, 40);
    const material = mat(AMBER, { emissive: AMBER, intensity: .35 }).clone();
    const body = add(g, barGeo, material, 0, BASE, 0);
    const ring = add(g, new THREE.TorusGeometry(.67, .02, 6, 60), glowClone(AMBER, .8), 0, BASE, 0, false);
    ring.rotation.x = Math.PI / 2;
    const count = printed(set, `measure-n-${i}`, [{ text: `${m.n} / 73`, size: 118, weight: 800, color: '#ffffff', track: 1 }], 1.15, .36, 0, 0, 0, 512);
    count.visible = false;
    const pct = printed(g, `measure-pct-${i}`, [{ text: m.pct, size: 124, weight: 800, color: '#f2b545', track: 1 }], .95, .32, 0, .05, .98, 384);
    pct.rotation.x = -Math.PI / 2 + .35;
    const tag = printed(g, `measure-tag-${i}`, [{ text: m.tag, size: 62, weight: 700, color: '#aab4c8', track: 3 }], 1.3, .2, 0, .05, 1.34, 512);
    tag.rotation.x = -Math.PI / 2 + .35;
    return { ...m, g, body, material, ring, count, h: m.n * UNIT };
  });
  // the gate: a sheet of light at 75% of the 73, which drops through the three columns
  const gate = new THREE.Group(); gate.position.set(.95, 3.6, MZ); measures.add(gate);
  const gateSheet = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.25), additive(AMBER, 0, { side: THREE.DoubleSide }));
  gateSheet.rotation.x = -Math.PI / 2; gate.add(gateSheet);
  const gateMat = glowClone(AMBER, 1.3);
  for (const sz of [-1, 1]) add(gate, rbox(4.56, .035, .035, .015), gateMat, 0, 0, sz * .625, false);
  for (const sx of [-1, 1]) add(gate, rbox(.035, .035, 1.25, .015), gateMat, sx * 2.26, 0, 0, false);
  const gateLabel = printed(set, 'gate', [{ text: '75%', size: 156, weight: 800, color: '#ffffff', track: 1 }], .8, .36, 0, 0, 0, 384);
  gateLabel.visible = false;

  /* ---- act four: three trained hubs, each read against the deferred fourth ---- */
  const hubs = new THREE.Group(); set.add(hubs);
  const HUBS = [
    { id: 'HUB-01', sub: 'TRAINED', x: -.85, z: -1.15, trained: true },
    { id: 'HUB-02', sub: 'TRAINED', x: .85, z: -1.55, trained: true },
    { id: 'HUB-03', sub: 'TRAINED', x: 2.55, z: -1.15, trained: true },
    { id: 'HUB-04', sub: 'DEFERRED', x: .85, z: 1.25, trained: false },
  ];
  const HUB_Y = .5;
  const hubNodes = HUBS.map((h, i) => {
    const g = new THREE.Group(); g.position.set(h.x, 0, h.z); hubs.add(g);
    const color = h.trained ? TEAL : STEEL;
    cyl(g, .66, .74, .12, NAVY, 0, 0, 0, 40);
    const ring = add(g, new THREE.TorusGeometry(.7, .02, 6, 60), glowClone(color, .9), 0, .12, 0, false);
    ring.rotation.x = Math.PI / 2;
    // a small cold store: a block with a lit band and a flat roof
    block(g, .86, .46, .62, h.trained ? 0xe9eef7 : 0x9aa6bf, 0, .12, 0, .05);
    const band = add(g, rbox(.9, .06, .66, .02), glowClone(color, 1.1), 0, .4, 0, false);
    block(g, .94, .09, .7, 0x33415f, 0, .58, 0, .03);
    const plate = printed(g, `hub-${i}`, [
      { text: h.id, size: 104, weight: 800, color: '#ffffff', track: 2 },
      { text: h.sub, size: 60, weight: 700, color: h.trained ? '#7fe0db' : '#aab4c8', track: 5 },
    ], 1.25, .52, 0, h.trained ? 1.2 : .05, h.trained ? 0 : 1.1, 512);
    if (!h.trained) plate.rotation.x = -Math.PI / 2 + .35;
    return { ...h, g, ring, band, plate };
  });
  const hubLinks = [0, 1, 2].map(() => beam(TEAL));
  const hubRunners = [0, 1, 2].map(() => { const sp = util.glowSprite(0xbff7f2, .38, 0); set.add(sp); return sp; });
  const refRing = new THREE.Mesh(ringGeo, additive(STEEL, 0)); refRing.visible = false; refRing.frustumCulled = false; set.add(refRing);
  const hv = V(), hw = V(), he = V();

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

  /* ---- the camera line, written into the arrays the framework reads every frame ---- */
  const cam = { from: { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 }, to: { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 } };
  function placeCamera(lp, shake, narrow, stacked) {
    const raise = stacked ? .35 : 0;
    for (let c = 0; c < 3; c++) {
      cam.from.pos[c] = cam.to.pos[c] = camAt(lp, 'pos', c) + (c === 0 ? shake : c === 1 ? shake * .6 : 0);
      // in a squarer window beside the copy, aim further left so the robot clears the column
      const clearCopy = c === 0 ? Math.max(0, 1.85 - camera.aspect) * 2.4 * (1 - narrow) : 0;
      cam.from.look[c] = cam.to.look[c] = camAt(lp, 'look', c) * (c === 0 ? 1 - narrow * .4 : 1) + (c === 1 ? raise : 0) - clearCopy;
    }
    // portrait: the set is wider than the frame, so stand further back
    if (narrow > 0) for (let c = 0; c < 3; c++) cam.from.pos[c] = cam.to.pos[c] = cam.to.look[c] + (cam.to.pos[c] - cam.to.look[c]) * (1 + .6 * narrow);
    cam.from.fov = cam.to.fov = camAt(lp, 'fov', 0);
  }
  placeCamera(0, 0, 0, false);

  /* ---- scratch, so update allocates nothing ---- */
  const v = V(), w = V(), focus = V(), head0 = V(), boltEnd = V();
  const m4 = new THREE.Matrix4();
  const holdPos = V(), holdQuat = new THREE.Quaternion(), holdScl = V();
  const zAxis = V(0, 0, 1), qRoll = new THREE.Quaternion(), qStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.2, Math.PI / 2, 0));
  const skyPos = V(RX - .3, 5.2, RZ + .25);
  function focusAt(lp, out) {
    let i = 0;
    while (i < FOCUS.length - 2 && lp > FOCUS[i + 1][0]) i++;
    const a = FOCUS[i], b = FOCUS[i + 1], k = sm(lin(lp, a[0], b[0]));
    return out.set(mix(a[1], b[1], k), mix(a[2], b[2], k), mix(a[3], b[3], k));
  }

  return {
    camera: cam,
    update(lp, t, dt, ui) {
      if (reduce) { lp = 1; t = 0; }
      const narrow = Math.min(1, Math.max(0, (1.1 - camera.aspect) / .4));
      const catchHit = pulse(lp, T.dropB, .004, .03);

      /* the robot: turned towards the stage; it hops when the option is chosen and the gate falls */
      const fly = lin(lp, T.dropA, T.dropB);
      const recoilR = lin(lp, T.dropB, .89), recoil = Math.sin(Math.PI * recoilR) * (1 - recoilR) * 1.7;
      const hop = Math.sin(Math.PI * lin(lp, .42, .452)) * .09 + Math.sin(Math.PI * lin(lp, T.choose, T.choose + .035)) * .07;
      let wi = 0;
      while (wi < WALK.length - 2 && lp > WALK[wi + 1][0]) wi++;
      const wa = WALK[wi], wb = WALK[wi + 1], wk = sm(lin(lp, wa[0], wb[0]));
      const moving = wa[1] !== wb[1] || wa[2] !== wb[2], stride = moving ? Math.sin(Math.PI * lin(lp, wa[0], wb[0])) : 0;
      const bx = mix(wa[1], wb[1], wk), bz = mix(wa[2], wb[2], wk);
      const heading = moving ? Math.atan2(wb[1] - wa[1], wb[2] - wa[2]) : 0;
      bot.root.position.set(bx, .1 + hop - recoil * .07, bz);
      bot.root.rotation.set(-recoil * .06, mix(mix(.42, .22, sm(lin(lp, .8, .87))), heading, Math.min(1, stride * 1.6)), 0);
      const punch = pulse(lp, T.dropB, .002, .009), sp = S * (1 + .04 * punch);
      bot.root.scale.set(sp * (1 + recoil * .045), sp * (1 - recoil * .07), sp * (1 + recoil * .045));
      bot.grip(sm(lin(lp, .815, T.dropB)));
      bot.update(reduce ? 0 : t + lp * 60, reduce ? 0 : Math.min(1, stride * 1.5));
      bot.root.updateMatrix(); anchor.updateMatrix();
      m4.multiplyMatrices(bot.root.matrix, anchor.matrix).decompose(holdPos, holdQuat, holdScl);

      focusAt(lp, focus);
      const head = bot.head;
      head.getWorldPosition(head0); set.worldToLocal(head0);
      v.copy(focus).sub(head0);
      const yaw = Math.max(-.55, Math.min(.55, Math.atan2(v.x, Math.abs(v.z) + 1.2) - bot.root.rotation.y));
      const pitch = Math.max(-.55, Math.min(.3, -Math.atan2(v.y, Math.hypot(v.x, v.z))));
      head.rotation.y = yaw * (1 - .8 * sm(lin(lp, .87, .9))); head.rotation.x = pitch * (1 - .6 * sm(lin(lp, .87, .9)));
      eyeMat.emissiveIntensity = 2.2 + catchHit * 2.5 + pulse(lp, .42, .006, .03) * 2;

      /* act one and two rise in turn, then sink together */
      const clearAB = sm(lin(lp, T.clearA, T.clearB));
      rulesAndOptions.position.y = -3.5 * clearAB; rulesAndOptions.visible = clearAB < 1;
      boards.forEach((b, i) => {
        const r = outBack(lin(lp, .015 + i * .06, .08 + i * .06), 1.2);
        b.g.position.y = -(b.h + .4) * (1 - r); b.g.visible = r > 0;
        const hit = STRIKES.some(s => s.from === b.at && lp >= s.a && lp < s.b + .01);
        b.edge.emissiveIntensity = .8 + .2 * Math.sin(t * 1.6 + i) + (hit ? 2.2 : 0);
      });
      const plaqueUp = outBack(lin(lp, .115, .152), 1.3), plaqueHit = pulse(lp, STRIKES[0].b, .003, .02);
      const plaqueFall = sm(lin(lp, STRIKES[0].b, .212));
      plaque.position.y = -1.5 * (1 - plaqueUp) - 1.6 * plaqueFall;
      plaque.position.x = .9 + Math.sin(lp * 900) * .02 * plaqueHit;
      plaqueTilt.rotation.x = -.5 * plaqueFall;
      plaque.visible = lp > .115 && plaqueFall < 1;
      plaqueEdge.emissiveIntensity = (1.1 + plaqueHit * 3) * (1 - .9 * plaqueFall);
      plaqueFace.material.opacity = 1 - plaqueFall;

      const fallen = [sm(lin(lp, STRIKES[1].b, STRIKES[1].b + .03)), 0];
      const chosen = sm(lin(lp, .42, .435)), chosenHit = pulse(lp, .42, .004, .03);
      options.forEach((o, i) => {
        const a = .225 + i * .035, draw = sm(lin(lp, a, a + .045)), up = outBack(lin(lp, a + .03, a + .06), 1.5);
        const dead = fallen[i], win = i === WIN ? chosen : 0;
        o.path.scale.x = Math.max(.001, o.len * draw); o.path.visible = draw > 0;
        o.pathMat.opacity = (.5 + win * .8) * (1 - .82 * dead);
        o.pathMat.color.copy(cAmber).lerp(cSteel, dead);
        const u = (t * .5 + i * .33) % 1, on = draw >= 1 ? 1 - dead : 0;
        o.runner.position.set(o.path.position.x + o.ux * o.len * u, .1, o.path.position.z + o.uz * o.len * u);
        o.runner.material.opacity = on * Math.sin(Math.PI * u) * (.55 + win * .6);
        o.stand.scale.setScalar(Math.max(.001, up));
        o.stand.visible = up > 0;
        o.stand.position.y = (i === WIN ? Math.sin(Math.PI * lin(lp, .42, .445)) * .16 : 0);
        o.hinge.rotation.x = -1.42 * dead;
        o.edge.emissive.copy(cAmber).lerp(cSteel, dead);
        o.edge.color.copy(o.edge.emissive);
        o.edge.emissiveIntensity = (1 + win * 1.6 + (i === WIN ? chosenHit * 4 : 0) + .15 * Math.sin(t * 2 + i)) * (1 - .9 * dead);
        o.standRim.material.emissiveIntensity = (.8 + win * 1.8) * (1 - .9 * dead);
        o.face.material.color.setScalar(1 - .72 * dead);
      });
      const shockR = lin(lp, .42, .47);
      shock.visible = shockR > 0 && shockR < 1 && clearAB < 1;
      shock.position.set(OPTIONS[WIN].x, .1, OPTIONS[WIN].z); shock.scale.setScalar(.6 + 1.7 * outCubic(shockR));
      shock.material.opacity = (1 - shockR) * (1 - shockR);

      /* the strikes: one bolt at a time, from a board to its target */
      bolt.visible = false; redFlash.material.opacity = 0;
      for (const s of STRIKES) {
        if (lp < s.a || lp > s.b + .025) continue;
        const go = lin(lp, s.a, s.b);
        boltEnd.lerpVectors(s.from, s.to, go);
        stretch(bolt, s.from, boltEnd, .03 + .025 * Math.sin(Math.PI * go));
        bolt.material.opacity = (go < 1 ? .85 : .85 * (1 - lin(lp, s.b, s.b + .025)));
        const hit = lp >= s.b ? 1 - lin(lp, s.b, s.b + .025) : 0;
        if (hit > 0) { redFlash.position.copy(s.to); redFlash.scale.setScalar(1.1 + (1 - hit) * .9); redFlash.material.opacity = hit * .9; }
      }

      /* act three: the columns grow, the gate drops, the third falls below it, the second is taken */
      const riseC = sm(lin(lp, T.riseC, T.riseCEnd)), clearC = sm(lin(lp, T.clearC, T.clearCEnd));
      measures.position.y = -3.4 * (1 - riseC) - 3.6 * clearC;
      measures.visible = riseC > 0 && clearC < 1;
      const gateFall = lin(lp, T.gate, T.gateEnd), gateHit = pulse(lp, T.gateEnd, .002, .02);
      const below = sm(lin(lp, T.gateEnd + .004, T.gateEnd + .02)), belowHit = pulse(lp, T.gateEnd + .004, .003, .02);
      const taken = sm(lin(lp, T.choose, T.choose + .015)), takenHit = pulse(lp, T.choose, .004, .03);
      let active = null;
      bars.forEach((b, i) => {
        const a = T.growA + i * T.growStep, grow = outCubic(lin(lp, a, a + T.growLen));
        b.body.scale.y = Math.max(.001, b.h * grow);
        if (grow > 0 && grow < 1) active = b;
        const dead = i === 2 ? below : 0, win = i === 1 ? taken : 0, rest = i === 0 ? taken : 0;
        b.material.color.copy(cAmber).lerp(cRed, dead).lerp(cSteel, rest * .65);
        b.material.emissive.copy(b.material.color);
        b.material.emissiveIntensity = (.35 + win * .3 + (i === 1 ? takenHit * 1.1 : 0) + (i === 2 ? belowHit * 2 : 0) + .04 * Math.sin(t * 2 + i)) * (1 - .35 * dead) * (1 - .45 * rest);
        b.ring.material.emissive.copy(b.material.color); b.ring.material.color.copy(b.material.color);
        b.ring.material.emissiveIntensity = (.8 + win * 2.2 + (i === 1 ? takenHit * 3 : 0)) * (1 - .5 * dead) * (1 - .5 * rest);
        b.g.position.y = i === 1 ? Math.sin(Math.PI * lin(lp, T.choose, T.choose + .035)) * .14 : 0;
        b.count.visible = measures.visible && grow > .04;
        b.count.position.set(MX[i], measures.position.y + b.g.position.y + BASE + b.h * grow + .34, MZ);
        b.count.quaternion.copy(camera.quaternion);
        b.count.material.opacity = sm(lin(grow, .04, .4)) * (1 - clearC);
        b.count.material.color.setScalar(1 - .35 * dead - .3 * rest);
      });
      const gateIn = sm(lin(lp, T.gate - .012, T.gate));
      gate.visible = gateIn > 0;
      gate.position.y = mix(3.6, GATE_Y, gateFall * gateFall) + Math.abs(Math.sin(Math.min(1, lin(lp, T.gateEnd, T.gateEnd + .014)) * Math.PI)) * .05;
      gateSheet.material.opacity = gateIn * (.1 + .05 * Math.sin(t * 2) + gateHit * .35);
      gateMat.emissiveIntensity = 1.2 + .2 * Math.sin(t * 2) + gateHit * 3;
      gateLabel.visible = measures.visible && gateIn > 0;
      gateLabel.position.set(.95 - 2.72, measures.position.y + gate.position.y + .02, MZ + .2);
      gateLabel.quaternion.copy(camera.quaternion);
      gateLabel.material.opacity = gateIn * (1 - clearC);

      /* act four: the hubs rise; each trained hub draws a line to the deferred one, which answers */
      const riseD = outBack(lin(lp, T.riseD, T.riseDEnd), 1.15);
      const planOut = reduce ? 0 : sm(lin(lp, .8, .845)); // the stage clears for the catch
      hubs.position.y = -2.6 * (1 - riseD + planOut); hubs.visible = riseD > 0 && planOut < 1;
      const sixHit = pulse(lp, T.ref, .003, .022);
      const refAt = hubNodes[3];
      hubNodes.forEach((h, i) => {
        if (h.trained) h.plate.quaternion.copy(camera.quaternion);
        const lit = i < 3 ? pulse(lp, T.linkA + i * T.linkStep, .003, .02) : sixHit;
        h.ring.material.emissiveIntensity = .9 + .15 * Math.sin(t * 2 + i) + lit * 3;
        h.band.material.emissiveIntensity = 1.1 + lit * 2.5;
      });
      for (let i = 0; i < 3; i++) {
        const a = T.linkA + i * T.linkStep, draw = sm(lin(lp, a, a + T.linkLen)), h = hubNodes[i];
        hubLinks[i].visible = false; hubRunners[i].material.opacity = 0;
        if (draw <= 0 || !hubs.visible) continue;
        hv.set(h.x, HUB_Y + hubs.position.y, h.z); he.set(refAt.x, HUB_Y + hubs.position.y, refAt.z);
        hw.lerpVectors(hv, he, draw);
        stretch(hubLinks[i], hv, hw, .022);
        hubLinks[i].material.opacity = .55 * (1 - planOut);
        if (draw >= 1) {
          const u = (t * .55 + i * .33) % 1;
          hubRunners[i].position.lerpVectors(hv, he, u);
          hubRunners[i].material.opacity = Math.sin(Math.PI * u) * .8 * (1 - planOut);
        }
      }
      const refR = lin(lp, T.ref, T.ref + .045);
      refRing.visible = refR > 0 && refR < 1 && hubs.visible;
      refRing.position.set(refAt.x, .14 + hubs.position.y, refAt.z); refRing.scale.setScalar(.7 + 1.5 * outCubic(refR));
      refRing.material.opacity = (1 - refR) * (1 - refR);

      /* the robot's line of attention: the board it reads, the column it counts, the hub it compares against */
      const linkOn = Math.max(window01(lp, .03, .06, .13, .16), window01(lp, T.growA - .004, T.growA + .006, T.gate - .008, T.gate - .002), window01(lp, T.choose - .012, T.choose - .002, .65, .66), window01(lp, T.linkA - .012, T.linkA - .002, T.ref + .012, T.ref + .024));
      link.visible = false;
      if (linkOn > 0) {
        if (active) w.set(active.g.position.x, measures.position.y + BASE + active.body.scale.y, MZ);
        else if (lp > T.choose - .02 && lp < .665) w.set(MX[1], measures.position.y + BASE + bars[1].h * .7, MZ + .4);
        else if (lp > T.linkA - .02) w.set(refAt.x, HUB_Y + .3 + hubs.position.y, refAt.z);
        else w.copy(focus);
        head0.y += .22;
        stretch(link, head0, w, .011);
        link.material.opacity = .34 * linkOn;
      }

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

      rim.material.emissiveIntensity = 1 + .25 * Math.sin(t * 2) + chosenHit * 1.4 + gateHit * 1.4 + takenHit * 1.6 + sixHit * 1.2 + catchHit * 3;
      padRim.material.emissiveIntensity = 1.1 + .2 * Math.sin(t * 2.6) + catchHit * 4;

      // reduced motion gets one still: the plan's shot, not the catch's close-up
      placeCamera(reduce ? .79 : lp, catchHit * .05 * Math.sin(lp * 2400), narrow, !!layout?.stacked);
    },
  };
}

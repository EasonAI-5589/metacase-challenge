/* film-agent.js — beat 1 of the Metacase film: Prior practice & strategy.
 * The robot (qwen3.7-max) stands at the left of the plinth and the stage rises in front of it, one
 * step of the copy at a time. Each prop carries only numbers, dates and identifiers.
 *   lp .00–.22  rules: the CAS 24 and Policy B boards rise; an 80–125% plaque rises between them,
 *               CAS 24 strikes it and it drops
 *      .22–.44  options: three paths draw out to 100% (continue), 70% (rebalance) and P&L; the
 *               boards strike down the first two, they topple dark, and the P&L path lights
 *      .44–.66  review hours: five towers hold the 16 one-hour blocks of packs A–E. A, B and C (11)
 *               hop onto the two six-hour days, 4 and 5 August, leaving one hour spare; the gate
 *               drops at the 5 August 18:00 lock; D and E land after it, on 6 and 7 August
 *      .66–.88  the plan: a nine-row board, the first row ticked. At 103 s rows D01–D06 tick
 *               together while the swap's valuation stack beside it stays dark; the workbook row
 *               pulses in progress and the report row stays empty. Then the harness comes down
 *               into the robot's hands, for the next beat.
 * Everything is a function of lp, plus a little idle life from t (none with ctx.reduce).
 * Hand-off: hand.robot.create() and hand.weapon.create() build new copies of the armed robot and of
 * its weapon (never this beat's own nodes); hand.armed keeps the plain data. */
import { mergeGeometries } from './assets/vendor/three/BufferGeometryUtils.js';

const AMBER = 0xf2b545, EYE = 0xffd666, STEEL = 0x6f86c8, NAVY = 0x1c2740, DEEP = 0x111a2d, RED = 0xe2667a;
const S = 1.5, HOLD = .8;              // the robot's scale, and the weapon's length in its hands
const RX = -2.6, RZ = .75;             // where the robot stands
const T = {
  clearA: .452, clearB: .49,           // rules and options sink
  riseC: .462, riseCEnd: .5,
  hopA: .495, hopStep: .0075, hopLen: .022,
  gate: .596, gateEnd: .612,
  lateA: .612, lateStep: .0055,
  clearC: .668, clearCEnd: .705,
  riseD: .672, riseDEnd: .715,
  tickOne: .722, tickSix: .748,
  dropA: .795, dropB: .85,
};
// Where the robot looks: [lp, x, y, z], in set coordinates.
const FOCUS = [
  [0, -.55, 1.5, -2.1], [.1, -.55, 1.5, -2.1], [.14, .9, 1.2, -1.1], [.2, .9, 1.2, -1.1],
  [.26, 1.4, .7, .7], [.32, .95, .7, -.8], [.38, 2.5, .7, .55], [.42, 1.35, .7, 2.05], [.45, 1.35, .7, 2.05],
  [.5, .2, .9, -.85], [.59, .4, .3, 1], [.63, 2.8, .3, 1], [.7, .75, 2.1, -1.2], [.79, .75, 2.1, -1.2],
  [.81, -2.8, 3.6, .9], [.85, -2.6, 1.1, 1.1], [1, -1, 1.2, 4],
];
// The camera: over the boards, across the options, high over the hours, back to the plan, in on the catch.
const KEYS = [
  { t: 0, pos: [-.4, 4.4, 12.8], look: [.1, 1.3, -.5], fov: 34 },
  { t: .2, pos: [.1, 4.0, 11.8], look: [.2, 1.25, -.5], fov: 33 },
  { t: .42, pos: [.5, 4.7, 11.6], look: [.2, .85, .2], fov: 33 },
  { t: .5, pos: [.5, 7.0, 10.2], look: [.3, .2, .55], fov: 33 },
  { t: .65, pos: [.5, 7.0, 10.2], look: [.3, .2, .55], fov: 33 },
  { t: .72, pos: [.5, 3.8, 11.2], look: [.15, 1.5, -.7], fov: 33 },
  { t: .79, pos: [.5, 3.8, 11.2], look: [.15, 1.5, -.7], fov: 33 },
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
  const cAmber = new THREE.Color(AMBER), cSteel = new THREE.Color(STEEL), cGold = new THREE.Color(0xffc95a);
  // a printed plane; lines as labelTexture takes them, aspect from the plane's own size
  function printed(parent, key, lines, w, h, x = 0, y = 0, z = 0, px = 512) {
    const tex = labelTexture(`film-plan-${key}`, lines, { width: px, height: Math.round(px * h / w) });
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
  const plateTex = labelTexture('film-agent-model', [{ text: 'qwen3.7-max', size: 66, weight: 700, color: '#ffffff', track: 3 }], { width: 640, height: 128 });
  const nameplate = new THREE.Mesh(new THREE.PlaneGeometry(1.45, .29), new THREE.MeshBasicMaterial({ map: plateTex, color: cGold, transparent: true, depthWrite: false }));
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
  const makeWeapon = () => (library ? matteClone(library.weapons[2]) : blaster(AMBER));
  const pick = makeWeapon(); pick.obj.visible = false; set.add(pick.obj);
  const shade = glow => { for (const e of pick.mats) e.m.emissiveIntensity = e.glow + glow; };
  const pickLabel = printed(set, 'harness', [{ text: 'Claude Code', size: 76, weight: 650, color: '#ffffff', track: 1 }], 1.6, .32, 0, 0, 0, 640);
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

  /* ---- act one and two: the rule boards, the abolished test, the three options ---- */
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
    ruleBoard('cas', [{ text: 'CAS 24', size: 136, weight: 800, color: '#ffffff', track: 2 }], -.55, -2.2, .1, 2.1, 2.3),
    ruleBoard('policy', [{ text: 'Policy B', size: 112, weight: 800, color: '#ffffff', track: 1 }, { text: '2026-06', size: 72, weight: 600, color: '#f2b545', track: 2 }], 2.35, -2.2, -.1, 2.1, 2.3),
  ];
  const plaque = new THREE.Group(); plaque.position.set(.9, 0, -1.05); rulesAndOptions.add(plaque);
  const plaqueTilt = new THREE.Group(); plaque.add(plaqueTilt);
  cyl(plaqueTilt, .05, .05, .8, DEEP, 0, 0, 0, 10);
  add(plaqueTilt, rbox(1.45, .62, .08, .05), mat(NAVY), 0, 1.05, 0);
  const plaqueEdge = glowClone(RED, 1.1);
  add(plaqueTilt, rbox(1.5, .67, .04, .06), plaqueEdge, 0, 1.05, -.05, false);
  const plaqueFace = printed(plaqueTilt, 'corridor', [{ text: '80–125%', size: 104, weight: 800, color: '#ffffff', track: 1 }], 1.36, .54, 0, 1.05, .05, 640);

  const OPTIONS = [
    { key: '100', text: '100%', x: .95, z: -.25 },
    { key: '70', text: '70%', x: 2.5, z: .55 },
    { key: 'pl', text: 'P&L', x: 1.35, z: 2.05 },
  ];
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
    const face = printed(hinge, `opt-${o.key}`, [{ text: o.text, size: 150, weight: 800, color: '#ffffff', track: 1 }], .94, .62, 0, .35, .055, 512);
    return { ...o, ux, uz, len: dist - .9 - .55, path, pathMat, runner, stand, standRim, hinge, edge, face, at: V(o.x, .55, o.z + .1) };
  });
  const STRIKES = [
    { from: boards[0].at, to: V(.9, 1.05, -1.0), a: .158, b: .178 },
    { from: boards[0].at, to: options[0].at, a: .312, b: .335 },
    { from: boards[1].at, to: options[1].at, a: .368, b: .39 },
  ];

  /* ---- act three: the hours ---- */
  const hours = new THREE.Group(); set.add(hours);
  const CELL = .5, ROWZ = [.7, 1.4], X0 = -1, XLATE = 2.45, GATEX = 1.97;
  const tileMat = mat(0x1a2440), edgeOn = glowClone(AMBER, .7), edgeOff = glowClone(STEEL, .4), spare = glowClone(AMBER, .7);
  const cell = (x, z, edge) => {
    add(hours, rbox(.46, .05, .46, .02), tileMat, x, .03, z);
    add(hours, rbox(.49, .014, .49, .006), edge, x, .012, z, false);
  };
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) cell(X0 + i * CELL, ROWZ[r], r === 1 && i === 5 ? spare : edgeOn);
  for (let i = 0; i < 3; i++) cell(XLATE + i * CELL, ROWZ[0], edgeOff);
  for (let i = 0; i < 2; i++) cell(XLATE + i * CELL, ROWZ[1], edgeOff);
  const floorLabel = (key, text, x, z, color) => {
    const m = printed(hours, `day-${key}`, [{ text, size: 112, weight: 700, color, track: 1 }], .62, .3, x, .05, z, 384);
    m.rotation.x = -Math.PI / 2 + .35;
  };
  floorLabel('4', '8/4', X0 - .58, ROWZ[0], '#f2b545');
  floorLabel('5', '8/5', X0 - .58, ROWZ[1], '#f2b545');
  floorLabel('6', '8/6', XLATE + 1 + .45, ROWZ[0], '#8e9ab3');
  floorLabel('7', '8/7', XLATE + .5 + .45, ROWZ[1], '#8e9ab3');
  // the gate at the lock: two posts, a header with the date, and a bar that drops across the track
  const gateZ = [.28, 1.82];
  gateZ.forEach(z => block(hours, .13, 1.05, .13, DEEP, GATEX, 0, z, .04));
  add(hours, rbox(.2, .36, 1.84, .05), mat(NAVY), GATEX, 1.17, 1.05);
  const headerGlow = glowClone(AMBER, .9);
  add(hours, rbox(.22, .4, 1.9, .05), headerGlow, GATEX, 1.17, 1.05, false).scale.set(.8, 1.0, 1.0);
  const gateLabel = printed(set, 'gate', [{ text: '8/5 18:00', size: 112, weight: 800, color: '#ffffff', track: 1 }], 1.5, .34, 0, 0, 0, 640);
  gateLabel.visible = false;
  const barMat = glowClone(AMBER, 1.3);
  const bar = add(hours, rbox(.1, .12, 1.5, .04), barMat, GATEX, .95, 1.05, false);
  // the towers: one block per review hour, per pack
  const PACKS = [
    { id: 'A', n: 4, color: 0x45b5b0, x: -1.05 },
    { id: 'B', n: 3, color: 0x7d6ad8, x: -.15 },
    { id: 'C', n: 4, color: 0x6aa8e8, x: .75 },
    { id: 'D', n: 3, color: 0xef8a4b, x: 1.65 },
    { id: 'E', n: 2, color: 0xe2667a, x: 2.55 },
  ];
  const TOWERZ = -.75, STEP_Y = .33;
  const cubeGeo = rbox(.42, .3, .42, .05), letterGeo = new THREE.PlaneGeometry(.3, .3);
  const blocks = {};
  for (const p of PACKS) {
    const material = mat(p.color, { emissive: p.color, intensity: .28 });
    const tex = labelTexture(`film-plan-pack-${p.id}`, [{ text: p.id, size: 200, weight: 800, color: '#0b1220' }], { width: 256, height: 256 });
    const letterMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    blocks[p.id] = [];
    for (let k = 0; k < p.n; k++) {
      const m = new THREE.Mesh(cubeGeo, material); m.castShadow = m.receiveShadow = true; hours.add(m);
      const letter = new THREE.Mesh(letterGeo, letterMat); letter.rotation.x = -Math.PI / 2; letter.position.y = .156; letter.renderOrder = 2; m.add(letter);
      m.position.set(p.x, .15 + k * STEP_Y, TOWERZ);
      blocks[p.id].push({ m, from: m.position.clone() });
    }
    blocks[p.id].reverse(); // the top of each tower goes first
  }
  const seat = (x, z) => V(x, .205, z);
  const early = [
    ...[0, 1, 2, 3].map(i => ['A', i, seat(X0 + i * CELL, ROWZ[0])]),
    ['B', 0, seat(X0 + 4 * CELL, ROWZ[0])], ['B', 1, seat(X0 + 5 * CELL, ROWZ[0])], ['B', 2, seat(X0, ROWZ[1])],
    ...[0, 1, 2, 3].map(i => ['C', i, seat(X0 + (i + 1) * CELL, ROWZ[1])]),
  ];
  const late = [
    ...[0, 1, 2].map(i => ['D', i, seat(XLATE + i * CELL, ROWZ[0])]),
    ...[0, 1].map(i => ['E', i, seat(XLATE + i * CELL, ROWZ[1])]),
  ];
  const flights = [];
  early.forEach(([id, k, to], i) => flights.push({ ...blocks[id][k], to, a: T.hopA + i * T.hopStep, arc: .75 }));
  late.forEach(([id, k, to], i) => flights.push({ ...blocks[id][k], to, a: T.lateA + i * T.lateStep, arc: 1.2 }));

  /* ---- act four: the recorded plan, and the valuation stack it never touched ---- */
  const plan = new THREE.Group(); plan.position.set(.65, 0, -1.2); set.add(plan);
  const BW = 3.2, BH = 3.25, BY = .15;
  add(plan, rbox(BW, BH, .14, .08), mat(NAVY), 0, BY + BH / 2, 0);
  const planEdge = glowClone(AMBER, 1);
  add(plan, rbox(BW + .08, BH + .08, .05, .09), planEdge, 0, BY + BH / 2, -.06, false);
  const ROWS = ['', 'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'XLSX', 'DOCX'];
  const rowY = i => BY + BH - .66 - i * .3;
  const boxMat = glowClone(STEEL, .5), barPlain = mat(0x33415f), tickMat = glowClone(AMBER, 1.5);
  const planRows = ROWS.map((text, i) => {
    const y = rowY(i);
    add(plan, rbox(.2, .2, .02, .03), mat(DEEP), -1.3, y, .075, false);
    add(plan, rbox(.235, .235, .012, .035), boxMat, -1.3, y, .066, false);
    if (text) printed(plan, `row-${text}`, [{ text, size: 92, weight: 700, color: '#e8ecf5', track: 1 }], .68, .25, -.72, y, .08, 384);
    add(plan, rbox(i === 0 ? 2.0 : 1.5 - (i % 3) * .22, .07, .012, .02), barPlain, i === 0 ? .1 : -.28 + (1.5 - (i % 3) * .22) / 2, y, .075, false);
    const tick = new THREE.Group(); tick.position.set(-1.3, y, .1); plan.add(tick);
    const a = add(tick, rbox(.11, .04, .02, .012), tickMat, -.055, -.02, 0, false); a.rotation.z = -.85;
    const b = add(tick, rbox(.21, .04, .02, .012), tickMat, .04, .015, 0, false); b.rotation.z = .9;
    tick.scale.setScalar(.001);
    return tick;
  });
  const rowFlash = util.glowSprite(AMBER, 3.2, 0); rowFlash.position.set(-.9, rowY(3.5), .3); plan.add(rowFlash);
  const working = add(plan, new THREE.SphereGeometry(.06, 12, 10), glowClone(AMBER, 2), -1.3, rowY(7), .1, false);
  const clockFace = printed(plan, 'clock', [{ text: '103 s', size: 116, weight: 800, color: '#f2b545', track: 2 }], 1.3, .36, 0, BY + BH - .28, .085, 640);
  clockFace.material.opacity = 0;
  // the swap's daily valuations: a stack of sheets beside the board, dark throughout
  const stack = new THREE.Group(); stack.position.set(3.2, 0, -.55); set.add(stack);
  for (let i = 0; i < 6; i++) block(stack, .96, .08, .7, i % 2 ? 0x2a3550 : 0x222c44, 0, i * .1, 0, .025);
  const stackRing = new THREE.Mesh(new THREE.TorusGeometry(.72, .012, 6, 60), additive(STEEL, .4)); stackRing.rotation.x = Math.PI / 2; stackRing.position.y = .02; stack.add(stackRing);
  printed(stack, 'swap', [{ text: 'IRS-2026-0031', size: 66, weight: 700, color: '#8e9ab3', track: 1 }], 1.2, .2, 0, .34, .52, 640).rotation.x = -.3;
  const query = printed(stack, 'query', [{ text: '?', size: 300, weight: 800, color: '#f2b545' }], .55, .55, 0, 1.15, 0, 256);
  query.material.opacity = 0;

  /* ---- hand-off: copies of the armed robot and its weapon, for the beats after this one ---- */
  const template = makeWeapon().obj;
  hand.armed = { harness: 'Claude Code', weaponIndex: 2, accent: AMBER, model: 'qwen3.7-max', eye: EYE, weapon: () => template.clone(true) };
  hand.weapon = { harness: 'Claude Code', weaponIndex: 2, holdScale: HOLD, template, create: () => template.clone(true) };
  hand.robot = {
    model: 'qwen3.7-max', harness: 'Claude Code', color: PALETTE.cream, eye: EYE, scale: S,
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
      const hop = Math.sin(Math.PI * lin(lp, .42, .452)) * .09 + Math.sin(Math.PI * lin(lp, T.gate, T.gate + .035)) * .05;
      bot.root.position.set(RX, .1 + hop - recoil * .07, RZ);
      bot.root.rotation.set(-recoil * .06, mix(.42, .22, sm(lin(lp, .8, .87))), 0);
      const punch = pulse(lp, T.dropB, .002, .009), sp = S * (1 + .04 * punch);
      bot.root.scale.set(sp * (1 + recoil * .045), sp * (1 - recoil * .07), sp * (1 + recoil * .045));
      bot.grip(sm(lin(lp, .815, T.dropB)));
      bot.update(t, 0);
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
        const r = outBack(lin(lp, .015 + i * .045, .08 + i * .045), 1.2);
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

      const fallen = [sm(lin(lp, STRIKES[1].b, STRIKES[1].b + .03)), sm(lin(lp, STRIKES[2].b, STRIKES[2].b + .03)), 0];
      const chosen = sm(lin(lp, .42, .435)), chosenHit = pulse(lp, .42, .004, .03);
      options.forEach((o, i) => {
        const a = .225 + i * .02, draw = sm(lin(lp, a, a + .045)), up = outBack(lin(lp, a + .03, a + .06), 1.5);
        const dead = fallen[i], win = i === 2 ? chosen : 0;
        o.path.scale.x = Math.max(.001, o.len * draw); o.path.visible = draw > 0;
        o.pathMat.opacity = (.5 + win * .8) * (1 - .82 * dead);
        o.pathMat.color.copy(cAmber).lerp(cSteel, dead);
        const u = (t * .5 + i * .33) % 1, on = draw >= 1 ? 1 - dead : 0;
        o.runner.position.set(o.path.position.x + o.ux * o.len * u, .1, o.path.position.z + o.uz * o.len * u);
        o.runner.material.opacity = on * Math.sin(Math.PI * u) * (.55 + win * .6);
        o.stand.scale.setScalar(Math.max(.001, up));
        o.stand.visible = up > 0;
        o.stand.position.y = (i === 2 ? Math.sin(Math.PI * lin(lp, .42, .445)) * .16 : 0);
        o.hinge.rotation.x = -1.42 * dead;
        o.edge.emissive.copy(cAmber).lerp(cSteel, dead);
        o.edge.color.copy(o.edge.emissive);
        o.edge.emissiveIntensity = (1 + win * 1.6 + (i === 2 ? chosenHit * 4 : 0) + .15 * Math.sin(t * 2 + i)) * (1 - .9 * dead);
        o.standRim.material.emissiveIntensity = (.8 + win * 1.8) * (1 - .9 * dead);
        o.face.material.color.setScalar(1 - .72 * dead);
      });
      const shockR = lin(lp, .42, .47);
      shock.visible = shockR > 0 && shockR < 1 && clearAB < 1;
      shock.position.set(OPTIONS[2].x, .1, OPTIONS[2].z); shock.scale.setScalar(.6 + 1.7 * outCubic(shockR));
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

      /* act three */
      const riseC = sm(lin(lp, T.riseC, T.riseCEnd)), clearC = sm(lin(lp, T.clearC, T.clearCEnd));
      hours.position.y = -2.2 * (1 - riseC) - 2.4 * clearC;
      hours.visible = riseC > 0 && clearC < 1;
      let active = null;
      for (const f of flights) {
        const e = lin(lp, f.a, f.a + T.hopLen);
        f.m.position.lerpVectors(f.from, f.to, sm(e));
        f.m.position.y += Math.sin(Math.PI * e) * f.arc;
        const land = pulse(lp, f.a + T.hopLen, .002, .006);
        f.m.scale.set(1 + land * .14, 1 - land * .22, 1 + land * .14);
        if (e > 0 && e < 1) active = f;
      }
      const gateFall = lin(lp, T.gate, T.gateEnd), gateHit = pulse(lp, T.gateEnd, .002, .02);
      bar.position.y = mix(.95, .13, gateFall * gateFall) + Math.abs(Math.sin(Math.min(1, lin(lp, T.gateEnd, T.gateEnd + .012)) * Math.PI)) * .04;
      barMat.emissiveIntensity = (gateFall > 0 ? 1.8 : .35) + gateHit * 3;
      headerGlow.emissiveIntensity = .7 + .15 * Math.sin(t * 2) + gateHit * 2.4;
      spare.emissiveIntensity = .4 + .5 * (.5 + .5 * Math.sin(t * 2.4)) * lin(lp, T.lateA, T.lateA + .02);
      gateLabel.visible = hours.visible;
      gateLabel.position.set(GATEX, 1.7 + hours.position.y, .1); // over the gate's far end, clear of its header
      gateLabel.quaternion.copy(camera.quaternion);
      gateLabel.material.opacity = riseC * (1 - clearC);

      /* act four */
      const riseD = outBack(lin(lp, T.riseD, T.riseDEnd), 1.15);
      const planOut = reduce ? 0 : sm(lin(lp, .8, .845)); // the stage clears for the catch
      plan.position.y = -(BH + .6) * (1 - riseD + planOut); plan.visible = riseD > 0 && planOut < 1;
      stack.position.y = -1.2 * (1 - sm(lin(lp, T.riseD + .01, T.riseDEnd))) - 1.5 * planOut;
      stack.visible = lp > T.riseD && planOut < 1;
      const sixHit = pulse(lp, T.tickSix, .003, .022);
      planRows.forEach((tick, i) => {
        const at = i === 0 ? T.tickOne : i <= 6 ? T.tickSix : Infinity;
        const s = lin(lp, at, at + .012);
        tick.scale.setScalar(Math.max(.001, outBack(s, 2.4)));
      });
      tickMat.emissiveIntensity = 1.5 + sixHit * 3;
      rowFlash.material.opacity = sixHit * .75;
      planEdge.emissiveIntensity = .9 + sixHit * 2.2 + .12 * Math.sin(t * 1.8);
      clockFace.material.opacity = sm(lin(lp, T.tickSix - .006, T.tickSix + .004));
      const inProgress = lin(lp, T.tickSix + .01, T.tickSix + .025);
      working.scale.setScalar(Math.max(.001, inProgress * (.82 + .22 * Math.sin(t * 5))));
      query.material.opacity = sm(lin(lp, T.tickSix + .018, T.tickSix + .04)) * (.75 + .25 * Math.sin(t * 2.4));
      query.position.y = 1.15 + Math.sin(t * 1.6) * .04;
      query.quaternion.copy(camera.quaternion);
      stackRing.material.opacity = .22 + .22 * lin(lp, T.tickSix, T.tickSix + .03);

      /* the robot's line of attention: the board it reads, the block it places, the row it marks */
      const linkOn = Math.max(window01(lp, .03, .06, .13, .16), window01(lp, T.hopA - .004, T.hopA + .006, T.gate - .006, T.gate), window01(lp, T.lateA - .002, T.lateA + .006, .648, .658), window01(lp, T.tickOne - .012, T.tickOne - .002, T.tickSix + .012, T.tickSix + .024));
      link.visible = false;
      if (linkOn > 0) {
        if (active) w.copy(active.m.position).setY(active.m.position.y + hours.position.y);
        else if (lp > .6 && lp > T.tickOne - .02) w.set(plan.position.x - .9, rowY(3.5), plan.position.z + .12);
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

      rim.material.emissiveIntensity = 1 + .25 * Math.sin(t * 2) + chosenHit * 1.4 + gateHit * 1.8 + sixHit * .8 + catchHit * 3;
      padRim.material.emissiveIntensity = 1.1 + .2 * Math.sin(t * 2.6) + catchHit * 4;

      // reduced motion gets one still: the plan's shot, not the catch's close-up
      placeCamera(reduce ? .79 : lp, catchHit * .05 * Math.sin(lp * 2400), narrow, !!layout?.stacked);
    },
  };
}

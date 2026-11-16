/* film-econ-agent.js — beat 1 of the economics Metacase film: Prior practice & strategy (econ-0157).
 * On the plotting table (film-econ-kit.js) the robot (gpt-6-astra) looks for the script, falls back
 * on public source, and fixes the specification. Each prop carries only numbers, identifiers and
 * short labels from the page's copy.
 *   lp .00–.10  practice: a sign names the command, eventstudyinteract (Sun–Abraham). Under it five
 *               cohort blocks slide onto a rail, as wide as their shares of the treated
 *               observations, and one bar draws under them: one effect per cohort, weighted by
 *               share. A TWFE plate beside the sign is crossed out and drops
 *      .10–.20  the search: the robot walks to a search mast; its lamp turns to six stations in
 *               turn (GitHub, Google, Bing, Dataverse, DataCite, Crossref). Four lamps go red. Two
 *               replication packages come back from Dataverse; the robot looks, both are crossed
 *               out and stay aside: other studies, no script
 *      .20–.27  back to the source: two sheets of public source land by the mast
 *               (eventstudyinteract.ado, reghdfe.ado) and the stat counts them; a third, avar,
 *               goes out on its way down
 *      .27–.66  the specification: the search clears and a settings panel rises. Four levers are
 *               thrown, one for each setting the task states (FE, cohort, control, cluster), and
 *               the readout shows −66.33. The fifth control, the covariates dial, is tried twice:
 *               each other position has no support and gives another number; the dial goes back
 *               to none and the readout locks on −66.33
 *      .67–.79  the note: the script, main.py, stands up in front and the robot pins a note on
 *               it: baseline, no covariates; the columns' covariates unverified
 *      .795–.88 the harness (Terminus-2) comes down into the robot's hands, for the next beat
 * Everything is a function of lp, plus a little idle life from t (none with ctx.reduce).
 * Hand-off: hand.robot.create() and hand.weapon.create() build new copies of the armed robot and of
 * its weapon (never this beat's own nodes); hand.armed keeps the plain data. */
import { mergeGeometries } from './assets/vendor/three/BufferGeometryUtils.js';
import { plotTable, printed, walker, beam, mark, aim, lin, sm, mix, outBack, outCubic, pulse, window01 } from './film-econ-kit.js?v=mc-401ead81de';

const AMBER = 0xf2b545, EYE = 0xffd666, STEEL = 0x6f86c8, NAVY = 0x1c2740, DEEP = 0x0d1524, RED = 0xe2667a, TEAL = 0x45b5b0;
const S = 1.5, HOLD = .8;              // the robot's scale, and the weapon's length in its hands
const HALF = Math.PI / 2;
const SHARES = [14, 8, 65, 79, 14];    // treated observations by cohort, 2013 … 2017 (180 in all)
const COHORT_COLORS = [0x45b5b0, 0x5fc3d6, 0x6aa8e8, 0x7d6ad8, 0xa58be8];
const STATIONS = [
  { name: 'GitHub', x: 2.86, z: -.85 }, { name: 'Google', x: 4.04, z: -.85 }, { name: 'Bing', x: 2.86, z: .3 },
  { name: 'Dataverse', x: 4.04, z: .3, found: true }, { name: 'DataCite', x: 2.86, z: 1.45 }, { name: 'Crossref', x: 4.04, z: 1.45 },
];
const MAST = { x: .2, z: 1.25, y: 1.72 };
const T = {
  blockA: .012, blockStep: .008, blockLen: .022, barA: .058, barB: .078, twfeX: .07, twfeDrop: .084,
  searchA: .084, sweepA: .108, sweepStep: .009, sweepLen: .016,
  parcelA: .156, parcelStep: .006, parcelLen: .018, crossA: .186, crossStep: .007,
  srcA: .205, srcStep: .02, srcLen: .016, avarA: .242, avarOut: .258,
  clearA: .256, clearB: .288, shelfA: .262, shelfB: .296,
  panelA: .275, panelB: .31, levers: [.318, .334, .35, .366], readA: .384,
  tryA: [.41, .5], tryLen: .03, tryHold: .028, lock: .59,
  noteRise: .672, noteFly: .688, notePin: .704, headA: .72,
  dropA: .795, dropB: .85,
};
// where the robot stands and which way it faces: [lp, x, z, yaw]
const WALK = [
  [0, -1.7, 1.0, 1.6], [.082, -1.7, 1.0, 1.6], [.104, -.75, 1.25, 1.25], [.165, -.75, 1.25, 1.25], [.178, -.75, 1.25, .5], [.2, -.75, 1.25, .5],
  [.212, -.75, 1.25, .95], [.255, -.75, 1.25, .95], [.292, -1.15, 1.0, 1.2], [.665, -1.15, 1.0, 1.2],
  [.7, -.25, 2.35, .95], [.775, -.25, 2.35, .95], [.795, -.25, 2.35, .45], [1, -.25, 2.35, .45],
];
// The camera: the sign, high over the search, level with the panel, in on the note, close on the catch.
const KEYS = [
  { t: 0, pos: [.1, 4.0, 9.8], look: [.35, 1.0, -1.5], fov: 33 },
  { t: .085, pos: [.2, 4.0, 9.8], look: [.35, 1.0, -1.5], fov: 33 },
  { t: .125, pos: [1.2, 6.2, 9.8], look: [1.4, .4, .7], fov: 33 },
  { t: .25, pos: [1.2, 6.2, 9.8], look: [1.4, .4, .7], fov: 33 },
  { t: .31, pos: [.95, 3.9, 10.2], look: [.95, 1.1, -.1], fov: 33 },
  { t: .64, pos: [1.2, 3.8, 10.0], look: [1.0, 1.1, -.1], fov: 33 },
  { t: .71, pos: [1.2, 3.8, 9.8], look: [1.3, .85, 1.2], fov: 33 },
  { t: .78, pos: [1.2, 3.8, 9.8], look: [1.3, .85, 1.2], fov: 33 },
  { t: .86, pos: [-.5, 4.1, 9.3], look: [-.1, 1.1, 2.2], fov: 31 },
  { t: .9, pos: [-.3, 4.1, 9.6], look: [0, 1.15, 2.2], fov: 31 },
];
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

export async function build({ THREE, kit, set, loadWeapons, hand, util, camera, reduce, layout }) {
  const { PALETTE, GUN_HOLD, add, cyl, block, ball, rbox, mat, glowMat } = kit;
  const additive = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const glow = (color, k) => glowMat(color, k).clone(); // kit materials are shared: clone before animating
  const flat = (geo, material, x, y, z, parent = set) => add(parent, geo, material, x, y, z, false);
  const P = o => printed({ THREE, kit, parent: set, ...o });
  const MONO = '"Space Mono", ui-monospace, monospace';
  const cAmber = new THREE.Color(AMBER), cSteel = new THREE.Color(STEEL), cRed = new THREE.Color(RED), cTeal = new THREE.Color(TEAL), cGold = new THREE.Color(0xffc95a), cGrey = new THREE.Color(0x56607a);

  const table = plotTable({ THREE, kit, set, accent: AMBER });
  const nameplate = P({ key: 'agent-model', lines: [{ text: 'gpt-6-astra', size: 66, weight: 700, color: '#ffffff', track: 3 }], w: 1.2, h: .24, x: 0, y: .1, z: 0, px: 640 });
  nameplate.material.color.copy(cGold); nameplate.rotation.x = -HALF + .85;

  /* ---- the robot and its weapon, which arrives last ---- */
  const bot = kit.robot(PALETTE.cream, EYE);
  bot.root.scale.setScalar(S); set.add(bot.root);
  const anchor = new THREE.Object3D();
  anchor.position.copy(GUN_HOLD.at); anchor.rotation.copy(GUN_HOLD.turn); anchor.scale.setScalar(HOLD); bot.root.add(anchor);
  const walk = walker(WALK), where = { x: 0, z: 0, yaw: 0, walking: 0 };

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
      const m = s.clone(), glowing = s.emissive.getHex() ? s.emissiveIntensity : 0;
      if (!glowing) { m.emissive.copy(m.color); m.emissiveIntensity = 0; }
      const mesh = new THREE.Mesh(merged, m); mesh.castShadow = mesh.receiveShadow = true; obj.add(mesh);
      mats.push({ m, glow: glowing });
    }
    return obj.children.length ? { obj, mats } : { obj: src, mats: [] };
  }
  const WEAPON = 4;                                   // arena-models.js: Terminus-2
  const makeWeapon = () => (library ? matteClone(library.weapons[WEAPON]) : blaster(AMBER));
  const pick = makeWeapon(); pick.obj.visible = false; set.add(pick.obj);
  const shade = k => { for (const e of pick.mats) e.m.emissiveIntensity = e.glow + k; };
  const pickLabel = P({ key: 'harness', lines: [{ text: 'Terminus-2', size: 78, weight: 650, color: '#ffffff', track: 1 }], w: 1.6, h: .32, px: 640 });
  pickLabel.material.color.copy(cGold); pickLabel.visible = false;
  const armedName = P({ key: 'agent-armed', lines: [{ text: 'gpt-6-astra × Terminus-2', size: 54, weight: 700, color: '#ffffff', track: 2 }], w: 2.3, h: .24, px: 1024 });
  armedName.material.color.copy(cGold); armedName.rotation.x = -HALF + .85;

  /* ---- reusable light ---- */
  const link = beam({ THREE, parent: set, color: AMBER }), sweep = beam({ THREE, parent: set, color: 0xffe2a8 }), fetch = beam({ THREE, parent: set, color: AMBER }), column = beam({ THREE, parent: set, color: AMBER });
  const flash = util.glowSprite(0xffe2a8, 1, 0); set.add(flash);
  const ringGeo = new THREE.TorusGeometry(1, .03, 6, 96); ringGeo.rotateX(HALF);
  const pulses = [0, 1].map(() => { const m = new THREE.Mesh(ringGeo, additive(AMBER, 0)); m.visible = false; m.frustumCulled = false; set.add(m); return m; });

  /* ---- act one: the command's sign, the cohort rail, the search mast and its stations ---- */
  const act1 = new THREE.Group(); set.add(act1);
  const sign = new THREE.Group(); sign.position.set(.2, 0, -2.5); act1.add(sign);
  for (const sx of [-1.45, 1.45]) cyl(sign, .035, .045, 1.2, 0x394560, sx, 0, 0, 10);
  flat(rbox(3.3, .9, .06, .03), mat(DEEP), 0, 1.55, 0, sign);
  const signEdge = glow(AMBER, 1.1);
  flat(rbox(3.37, .97, .03, .03), signEdge, 0, 1.55, -.02, sign);
  printed({ THREE, kit, parent: sign, key: 'command', lines: [{ text: 'eventstudyinteract', size: 86, weight: 700, color: '#ffffff', font: MONO }], w: 3.1, h: .4, x: 0, y: 1.68, z: .035, px: 1024 });
  printed({ THREE, kit, parent: sign, key: 'estimator', lines: [{ text: 'Sun–Abraham', size: 150, weight: 700, color: '#f2b545' }], w: 1.5, h: .26, x: 0, y: 1.3, z: .035, px: 640 });
  // the cohort rail: five blocks as wide as their shares, and the one bar they add up to
  const RAIL = { x0: -1.2, z: -1.7, w: 3.0, gap: .06 };
  flat(rbox(RAIL.w + .3, .04, .36, .015), mat(0x26324f), RAIL.x0 + RAIL.w / 2, .02, RAIL.z, act1);
  const unit = (RAIL.w - RAIL.gap * 4) / 180;
  let cursor = RAIL.x0;
  const cohorts = SHARES.map((n, i) => {
    const w = n * unit, m = mat(COHORT_COLORS[i], { emissive: COHORT_COLORS[i], intensity: .25 }).clone();
    const mesh = add(act1, rbox(w, .26, .26, Math.min(.05, w * .3)), m, 0, .17, RAIL.z);
    const x = cursor + w / 2; cursor += w + RAIL.gap;
    return { mesh, m, x, at: T.blockA + i * T.blockStep };
  });
  const sumMat = glow(AMBER, 1.6);
  const sumBar = flat(rbox(1, .06, .1, .02), sumMat, 0, .05, RAIL.z + .34, act1);
  const sumName = printed({ THREE, kit, parent: act1, key: 'by-share', lines: [{ text: 'weighted by share', size: 62, weight: 700, color: '#ffe2a8' }], w: 1.7, h: .2, x: RAIL.x0 + RAIL.w / 2, y: .08, z: RAIL.z + .62, px: 640 });
  sumName.rotation.x = -HALF + .8;
  const twfe = new THREE.Group(); twfe.position.set(2.5, 0, -2.5); act1.add(twfe);
  cyl(twfe, .03, .04, .75, 0x394560, 0, 0, 0, 10);
  flat(rbox(.92, .42, .05, .03), mat(DEEP), 0, .95, 0, twfe);
  const twfeEdge = glow(STEEL, .8);
  flat(rbox(.98, .48, .03, .03), twfeEdge, 0, .95, -.014, twfe);
  printed({ THREE, kit, parent: twfe, key: 'twfe', lines: [{ text: 'TWFE', size: 150, weight: 800, color: '#aab6cc' }], w: .84, h: .32, x: 0, y: .95, z: .03, px: 512 });
  const crossMat = glow(RED, 2);
  const twfeCross = mark({ THREE, kit, kind: 'cross', material: crossMat, size: .5 }); twfeCross.position.set(0, .95, .07); twfe.add(twfeCross);

  // the search mast: a pole, a lamp housing that turns to each station in turn
  const search = new THREE.Group(); act1.add(search);
  const mast = new THREE.Group(); mast.position.set(MAST.x, 0, MAST.z); search.add(mast);
  cyl(mast, .3, .34, .1, 0x26324f, 0, 0, 0, 24);
  cyl(mast, .05, .07, 1.5, 0x394560, 0, .1, 0, 12);
  const head = new THREE.Group(); head.position.y = MAST.y; mast.add(head);
  block(head, .34, .26, .34, 0x26324f, 0, -.13, 0, .06);
  const lampMat = glow(0xffe2a8, 1.2);
  const lens = flat(new THREE.CylinderGeometry(.11, .14, .16, 20), lampMat, .22, 0, 0, head); lens.rotation.z = -HALF;
  const stations = STATIONS.map((s, i) => {
    const g = new THREE.Group(); g.position.set(s.x, 0, s.z); search.add(g);
    cyl(g, .028, .036, .58, 0x394560, 0, 0, 0, 10);
    const lamp = glow(STEEL, .5);
    ball(g, .075, lamp, 0, .62, 0, 12).castShadow = false;
    flat(rbox(1.1, .4, .04, .03), mat(DEEP), 0, 1.02, 0, g);
    const edge = glow(STEEL, .5);
    flat(rbox(1.15, .45, .03, .03), edge, 0, 1.02, -.012, g);
    printed({ THREE, kit, parent: g, key: `station-${s.name}`, lines: [{ text: s.name, size: s.name.length > 7 ? 104 : 124, weight: 700, color: '#ffffff' }], w: 1.04, h: .32, x: 0, y: 1.02, z: .025, px: 512 });
    return { ...s, g, lamp, edge, at: T.sweepA + i * T.sweepStep, top: V(s.x, .62, s.z), yaw: Math.atan2(-(s.z - MAST.z), s.x - MAST.x) };
  });
  // the two replication packages that come back: other studies, set aside
  const parcels = [{ x: .4, z: 2.15 }, { x: .85, z: 2.62 }].map((to, i) => {
    const g = new THREE.Group(); act1.add(g);
    const m = mat(0xc79a5b).clone();
    add(g, rbox(.4, .3, .34, .04), m, 0, .15, 0);
    flat(rbox(.42, .05, .36, .012), mat(0x6b4a2a), 0, .16, 0, g);
    const x = mark({ THREE, kit, kind: 'cross', material: crossMat, size: .34 }); x.position.set(0, .52, 0); g.add(x);
    return { g, m, x, to, at: T.parcelA + i * T.parcelStep, crossAt: T.crossA + i * T.crossStep, base: new THREE.Color(0xc79a5b) };
  });
  const FROM_STATION = stations[3].top;

  /* ---- the public source: two sheets that stay, a third that goes out ---- */
  const paperGeo = rbox(1.0, 1.12, .03, .012);
  function sheet(key, lines, ink = '#1f2a3a') {
    const g = new THREE.Group(); set.add(g);
    const inner = new THREE.Group(); inner.rotation.x = -.2; g.add(inner);
    const paper = mat(0xf2ede0).clone();
    add(inner, paperGeo, paper, 0, .58, 0);
    printed({ THREE, kit, parent: inner, key, lines: lines.map(text => ({ text, size: 150, weight: 700, color: ink, font: MONO })), w: .9, h: lines.length * .17, x: 0, y: .88 - (lines.length - 1) * .05, z: .02, px: 768 });
    for (let r = 0; r < 4; r++) flat(rbox(r % 2 ? .52 : .7, .035, .006, .003), mat(0xb9c0cf), -.41 + (r % 2 ? .26 : .35), .52 - r * .1, .018, inner);
    return { g, paper };
  }
  const sources = [
    { ...sheet('src-esi', ['eventstudy', 'interact.ado']), land: V(1.6, 0, 2.3), shelf: V(2.6, .02, 2.5), at: T.srcA },
    { ...sheet('src-reghdfe', ['reghdfe.ado']), land: V(2.4, 0, 2.5), shelf: V(3.5, .02, 2.5), at: T.srcA + T.srcStep },
  ];
  const avar = sheet('src-avar', ['avar']);
  avar.paper.transparent = true;
  const avarFlash = util.glowSprite(RED, 1.6, 0); set.add(avarFlash);

  /* ---- act two: the settings panel ---- */
  const panel = new THREE.Group(); panel.position.set(1.75, 0, -.35); set.add(panel);
  const face = new THREE.Group(); face.rotation.x = -.16; panel.add(face);
  flat(rbox(4.7, 1.5, .1, .05), mat(0x18223a), 0, .8, 0, face);
  const panelEdge = glow(AMBER, .9);
  flat(rbox(4.78, 1.58, .06, .05), panelEdge, 0, .8, -.03, face);
  const LX = [-1.85, -1.07, -.29, .49];
  const levers = ['FE', 'cohort', 'control', 'cluster'].map((name, i) => {
    flat(rbox(.12, .62, .03, .03), mat(0x0a101c), LX[i], .68, .055, face);
    const knobMat = glow(STEEL, .6);
    const knob = flat(new THREE.SphereGeometry(.105, 16, 12), knobMat, LX[i], .45, .1, face);
    printed({ THREE, kit, parent: face, key: `lever-${name}`, lines: [{ text: name, size: 150, weight: 800, color: '#ffffff' }], w: .7, h: .26, x: LX[i], y: 1.28, z: .06, px: 512 });
    return { knob, knobMat, at: T.levers[i], x: LX[i] };
  });
  // the covariates dial: none, and two other positions no source supports
  const DIAL = { x: 1.62, y: .68, r: .36, angles: [2.45, 1.57, .69] };
  flat(new THREE.CylinderGeometry(DIAL.r, DIAL.r, .04, 40), mat(0x0a101c), DIAL.x, DIAL.y, .06, face).rotation.x = HALF;
  const dialRing = glow(STEEL, .7);
  flat(new THREE.TorusGeometry(DIAL.r, .022, 8, 48), dialRing, DIAL.x, DIAL.y, .08, face);
  const pointer = new THREE.Group(); pointer.position.set(DIAL.x, DIAL.y, .1); face.add(pointer);
  const pointerMat = glow(AMBER, 1.6);
  flat(rbox(.3, .05, .03, .02), pointerMat, .15, 0, 0, pointer);
  flat(new THREE.SphereGeometry(.06, 12, 10), pointerMat, 0, 0, 0, pointer);
  printed({ THREE, kit, parent: face, key: 'dial-name', lines: [{ text: 'covariates', size: 104, weight: 700, color: '#aab6cc' }], w: .95, h: .22, x: DIAL.x, y: 1.3, z: .06, px: 512 });
  const stops = ['none', '?', '?'].map((text, i) => {
    const a = DIAL.angles[i], r = DIAL.r + .2;
    const m = printed({ THREE, kit, parent: face, key: `stop-${i === 0 ? 'none' : 'q'}`, lines: [{ text, size: i === 0 ? 150 : 260, weight: 800, color: '#ffffff' }], w: i === 0 ? .46 : .2, h: .2, x: DIAL.x + Math.cos(a) * r - (i === 0 ? .14 : 0), y: DIAL.y + Math.sin(a) * r, z: .07, px: 384 });
    return m;
  });
  const noSupport = printed({ THREE, kit, parent: face, key: 'no-support', lines: [{ text: 'no support', size: 110, weight: 700, color: '#ff9aa8' }], w: .9, h: .2, x: DIAL.x, y: .16, z: .07, px: 512 });
  // the readout over the panel
  const readout = new THREE.Group(); readout.position.set(-.55, 1.62, -.26); panel.add(readout);
  flat(rbox(2.3, .74, .06, .03), mat(DEEP), 0, .37, 0, readout);
  const readEdge = glow(AMBER, 1);
  flat(rbox(2.37, .81, .03, .03), readEdge, 0, .37, -.02, readout);
  const readMain = printed({ THREE, kit, parent: readout, key: 'coef', lines: [{ text: '−66.33', size: 250, weight: 800, color: '#ffd666' }], w: 2.1, h: .6, x: 0, y: .37, z: .035, px: 768 });
  const readOther = printed({ THREE, kit, parent: readout, key: 'coef-other', lines: [{ text: 'another number', size: 104, weight: 700, color: '#8e9ab3' }], w: 2.1, h: .34, x: 0, y: .37, z: .036, px: 768 });

  /* ---- act three: the script and the note pinned on it ---- */
  const script = new THREE.Group(); script.position.set(1.0, 0, 2.3); set.add(script);
  const scriptIn = new THREE.Group(); scriptIn.rotation.x = -.2; script.add(scriptIn);
  add(scriptIn, rbox(1.25, 1.2, .03, .012), mat(0xf2ede0), 0, .62, 0);
  printed({ THREE, kit, parent: scriptIn, key: 'script-name', lines: [{ text: 'main.py', size: 190, weight: 800, color: '#1f2a3a', font: MONO }], w: 1.05, h: .26, x: 0, y: 1.02, z: .02, px: 640 });
  const headMat = glow(AMBER, .2);
  flat(rbox(1.05, .16, .008, .004), headMat, 0, .78, .018, scriptIn);
  for (let r = 0; r < 4; r++) flat(rbox(r % 2 ? .62 : .9, .04, .006, .003), mat(0xb9c0cf), -.52 + (r % 2 ? .31 : .45), .58 - r * .11, .018, scriptIn);
  const note = new THREE.Group(); set.add(note);
  add(note, rbox(1.5, .58, .025, .012), mat(0xffe9a8), 0, 0, 0);
  printed({ THREE, kit, parent: note, key: 'note', lines: [{ text: 'baseline · no covariates', size: 76, weight: 800, color: '#2a2118' }, { text: 'column covariates: unverified', size: 60, weight: 700, color: '#8a4b12' }], w: 1.4, h: .44, x: 0, y: 0, z: .016, px: 1024 });
  const pin = flat(new THREE.SphereGeometry(.05, 12, 10), glow(RED, 1.5), 0, .23, .03, note);
  const NOTE_AT = V(1.3, .4, 2.46);

  /* ---- hand-off: copies of the armed robot and its weapon, for the beats after this one ---- */
  const template = makeWeapon().obj;
  hand.armed = { harness: 'Terminus-2', weaponIndex: WEAPON, accent: AMBER, model: 'gpt-6-astra', eye: EYE, weapon: () => template.clone(true) };
  hand.weapon = { harness: 'Terminus-2', weaponIndex: WEAPON, holdScale: HOLD, template, create: () => template.clone(true) };
  hand.robot = {
    model: 'gpt-6-astra', harness: 'Terminus-2', color: PALETTE.cream, eye: EYE, scale: S,
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
  const cp = [0, 0, 0], cl = [0, 0, 0];
  function placeCamera(lp, shake) {
    for (let c = 0; c < 3; c++) { cp[c] = camAt(lp, 'pos', c) + (c === 0 ? shake : c === 1 ? shake * .6 : 0); cl[c] = camAt(lp, 'look', c); }
    if (layout?.stacked) cl[1] += .2;
    aim(cam.from, cp, cl, camAt(lp, 'fov', 0), camera.aspect); aim(cam.to, cp, cl, camAt(lp, 'fov', 0), camera.aspect);
  }
  placeCamera(0, 0);

  /* ---- scratch, so update allocates nothing ---- */
  const v = V(), w = V(), head0 = V(), col = new THREE.Color(), m4 = new THREE.Matrix4();
  anchor.updateMatrix();
  const holdPos = V(), holdQuat = new THREE.Quaternion(), holdScl = V();
  const zAxis = V(0, 0, 1), qRoll = new THREE.Quaternion(), qStart = new THREE.Quaternion().setFromEuler(new THREE.Euler(-.2, HALF, 0));
  const skyPos = V(), mastTop = V(MAST.x, MAST.y, MAST.z);
  const leverWorld = levers.map(() => V()), dialWorld = V();
  const arc = (out, a, b, k, lift) => out.lerpVectors(a, b, k).setY(mix(a.y, b.y, k) + Math.sin(Math.PI * k) * lift);

  return {
    camera: cam,
    update(lp, t, dt, ui) {
      if (reduce) { lp = 1; t = 0; }
      const catchHit = pulse(lp, T.dropB, .004, .03);

      /* the robot */
      walk(lp, where);
      const recoilR = lin(lp, T.dropB, .89), recoil = Math.sin(Math.PI * recoilR) * (1 - recoilR) * 1.7;
      const hop = Math.sin(Math.PI * lin(lp, T.readA, T.readA + .03)) * .09 + Math.sin(Math.PI * lin(lp, T.lock, T.lock + .035)) * .1 + Math.sin(Math.PI * lin(lp, T.notePin, T.notePin + .03)) * .06;
      bot.root.position.set(where.x, hop - recoil * .07, where.z);
      bot.root.rotation.set(-recoil * .12, where.yaw, 0);
      const fly = lin(lp, T.dropA, T.dropB);
      bot.grip(sm(lin(fly, .55, 1)));
      bot.update(t, where.walking);
      // the robot is a child of the set, so its matrix is already in set coordinates
      bot.root.updateMatrix();
      head0.set(0, .84, .1).applyMatrix4(bot.root.matrix);
      m4.multiplyMatrices(bot.root.matrix, anchor.matrix).decompose(holdPos, holdQuat, holdScl);

      /* act one: the sign, the rail, the mast, the stations, the packages */
      const clear = sm(lin(lp, T.clearA, T.clearB));
      act1.position.y = -3.2 * clear; act1.visible = clear < 1;
      if (act1.visible) {
        signEdge.emissiveIntensity = 1.1 + .15 * Math.sin(t * 1.8) + 1.5 * pulse(lp, T.barB, .004, .03);
        for (const c of cohorts) {
          const k = lin(lp, c.at, c.at + T.blockLen), e = outCubic(k);
          c.mesh.position.x = c.x + 3.2 * (1 - e); c.mesh.position.y = .17 + Math.sin(Math.PI * k) * .25;
          c.mesh.visible = k > 0;
          c.m.emissiveIntensity = .25 + 1.6 * pulse(lp, c.at + T.blockLen, .003, .02) + .8 * pulse(lp, T.barB, .004, .03);
        }
        const bar = sm(lin(lp, T.barA, T.barB));
        sumBar.scale.x = Math.max(.001, bar * RAIL.w); sumBar.position.x = RAIL.x0 + bar * RAIL.w / 2; sumBar.visible = bar > 0;
        sumMat.emissiveIntensity = 1.6 + 2.5 * pulse(lp, T.barB, .004, .03);
        sumName.material.opacity = window01(lp, T.barB - .01, T.barB + .01, T.searchA, T.searchA + .012); // gone before the search stands in front of it
        const crossed = outBack(lin(lp, T.twfeX, T.twfeX + .01), 2.2), drop = sm(lin(lp, T.twfeDrop, T.twfeDrop + .02));
        twfeCross.scale.setScalar(Math.max(.001, crossed));
        twfe.position.y = -1.8 * drop; twfe.rotation.x = -.5 * drop; twfe.visible = drop < 1;
        twfeEdge.emissiveIntensity = .8 * (1 - crossed) + .2;

        // the search rises when the robot turns to it; then the sweep
        const sr = outBack(lin(lp, T.searchA, T.searchA + .022), 1.2);
        search.position.y = -2.4 * (1 - sr); search.visible = sr > 0;
        sweep.visible = false;
        let aimYaw = Math.sin(t * .5) * .5 + .4, lampOn = 0;
        for (const s of stations) {
          const on = window01(lp, s.at, s.at + .004, s.at + T.sweepLen - .004, s.at + T.sweepLen);
          if (on > 0) {
            aimYaw = s.yaw; lampOn = on;
            sweep.userData.stretch(mastTop, s.top, .03 + .03 * on); sweep.material.opacity = .5 * on; sweep.position.y += act1.position.y;
          }
          const done = sm(lin(lp, s.at + T.sweepLen * .6, s.at + T.sweepLen));
          col.copy(cSteel).lerp(s.found ? cAmber : cRed, done);
          s.lamp.color.copy(col); s.lamp.emissive.copy(col); s.lamp.emissiveIntensity = .5 + 1.4 * done + 3 * on;
          s.edge.color.copy(col); s.edge.emissive.copy(col); s.edge.emissiveIntensity = .5 + .5 * done + 2 * on;
        }
        // before the sweep the lamp idles; during it, it turns from station to station
        const sweeping = window01(lp, T.sweepA - .012, T.sweepA, T.sweepA + 6 * T.sweepStep + T.sweepLen, T.sweepA + 6 * T.sweepStep + T.sweepLen + .02);
        head.rotation.y = mix(Math.sin(t * .5) * .5 + .4, aimYaw, sweeping);
        lampMat.emissiveIntensity = 1.2 + 3 * lampOn + .3 * Math.sin(t * 3);

        // the packages: back from the Dataverse station, set down by the mast, crossed out and greyed
        fetch.visible = false;
        for (const p of parcels) {
          const k = lin(lp, p.at, p.at + T.parcelLen);
          p.g.position.set(p.to.x, -.5 * (1 - outBack(k, 1.4)), p.to.z);
          p.g.visible = k > 0;
          const on = window01(lp, p.at, p.at + .004, p.at + T.parcelLen - .004, p.at + T.parcelLen + .004);
          if (on > 0) { w.set(p.to.x, .2, p.to.z); fetch.userData.stretch(FROM_STATION, w, .02 + .02 * on); fetch.material.opacity = .45 * on; fetch.position.y += act1.position.y; }
          const x = outBack(lin(lp, p.crossAt, p.crossAt + .01), 2.2);
          p.x.scale.setScalar(Math.max(.001, x)); p.x.quaternion.copy(camera.quaternion);
          p.m.color.copy(p.base).lerp(cGrey, sm(lin(lp, p.crossAt, p.crossAt + .02)));
        }
        crossMat.emissiveIntensity = 2 + 2.5 * Math.max(pulse(lp, T.crossA, .003, .02), pulse(lp, T.crossA + T.crossStep, .003, .02), pulse(lp, T.twfeX, .003, .02));
      } else { sweep.visible = false; fetch.visible = false; }

      /* the public source */
      const shelf = sm(lin(lp, T.shelfA, T.shelfB));
      let read = 0;
      for (const s of sources) {
        const k = lin(lp, s.at, s.at + T.srcLen), e = outBack(k, 1.3);
        s.g.visible = k > 0 && lp < T.dropA - .005;
        s.g.position.lerpVectors(s.land, s.shelf, shelf);
        const away = sm(lin(lp, T.dropA - .03, T.dropA - .005));
        s.g.position.y += -1.3 * (1 - e) + Math.sin(Math.PI * shelf) * .5 - .9 * away;
        s.g.rotation.x = -1.0 * shelf; // laid back on the table once it has been read
        s.g.scale.setScalar(.85);
        if (k >= 1) read++;
      }
      ui.set('hours', String(read));
      const av = lin(lp, T.avarA, T.avarOut), gone = sm(lin(av, .55, 1));
      avar.g.visible = av > 0 && gone < 1;
      avar.g.position.set(3.5, mix(-1.25, -.42, outCubic(lin(av, 0, .5))), 2.4); // half way out of the table, and no further
      avar.paper.opacity = (1 - gone) * (av > .5 ? .55 + .45 * Math.sin(lp * 2600) : 1);
      avar.g.scale.setScalar(.8);
      avarFlash.position.set(3.5, .45, 2.45); avarFlash.material.opacity = Math.sin(Math.PI * lin(av, .5, 1)) * .8;

      /* act two: the settings panel */
      const rise = outBack(lin(lp, T.panelA, T.panelB), 1.15);
      panel.position.y = -3.4 * (1 - rise); panel.visible = rise > 0;
      panel.position.z = -.35 - 1.5 * sm(lin(lp, T.noteRise - .012, T.noteRise + .02));
      if (panel.visible) {
        panel.updateMatrixWorld(true);
        levers.forEach((l, i) => {
          const k = outBack(lin(lp, l.at, l.at + .012), 2), hit = pulse(lp, l.at + .008, .003, .025);
          l.knob.position.y = mix(.45, .92, k);
          col.copy(cSteel).lerp(cTeal, Math.min(1, k)); l.knobMat.color.copy(col); l.knobMat.emissive.copy(col);
          l.knobMat.emissiveIntensity = .6 + 1.2 * Math.min(1, k) + 3 * hit;
          leverWorld[i].set(l.x, mix(.45, .92, k), .1); face.localToWorld(leverWorld[i]); set.worldToLocal(leverWorld[i]);
        });
        dialWorld.set(DIAL.x, DIAL.y, .12); face.localToWorld(dialWorld); set.worldToLocal(dialWorld);
        // the dial is tried twice and comes back to none
        let at = DIAL.angles[0], off = 0;
        T.tryA.forEach((a, i) => {
          const out = sm(lin(lp, a, a + T.tryLen)), back = sm(lin(lp, a + T.tryLen + T.tryHold, a + T.tryLen * 2 + T.tryHold)), k = out * (1 - back);
          at += (DIAL.angles[i + 1] - DIAL.angles[0]) * k; off = Math.max(off, k);
        });
        pointer.rotation.z = at + (off > 0 && off < 1 ? Math.sin(t * 30) * .02 : 0);
        const locked = pulse(lp, T.lock, .004, .04), shown = sm(lin(lp, T.readA, T.readA + .012));
        readMain.material.opacity = shown * (1 - sm(lin(off, .25, .6)));
        readOther.material.opacity = shown * sm(lin(off, .4, .75)) * (.75 + .25 * Math.sin(t * 9));
        noSupport.material.opacity = sm(lin(off, .5, .85));
        stops.forEach((m, i) => { m.material.opacity = i === 0 ? .6 + .4 * (1 - off) : .35 + .65 * (i === 1 ? window01(lp, T.tryA[0], T.tryA[0] + T.tryLen, T.tryA[0] + T.tryLen + T.tryHold, T.tryA[0] + 2 * T.tryLen + T.tryHold) : window01(lp, T.tryA[1], T.tryA[1] + T.tryLen, T.tryA[1] + T.tryLen + T.tryHold, T.tryA[1] + 2 * T.tryLen + T.tryHold)); });
        col.copy(cAmber).lerp(cRed, sm(lin(off, .4, .8)));
        pointerMat.color.copy(col); pointerMat.emissive.copy(col);
        dialRing.color.copy(cSteel).lerp(cAmber, sm(lin(lp, T.lock, T.lock + .01))); dialRing.emissive.copy(dialRing.color);
        dialRing.emissiveIntensity = .7 + 3 * locked;
        readEdge.color.copy(col); readEdge.emissive.copy(col);
        readEdge.emissiveIntensity = 1 + 2.2 * pulse(lp, T.readA, .004, .03) + 3 * locked + .12 * Math.sin(t * 2);
        panelEdge.emissiveIntensity = .9 + 1.2 * locked + .1 * Math.sin(t * 1.6);
      }

      /* act three: the script and its note */
      const up = outBack(lin(lp, T.noteRise, T.noteRise + .03), 1.2);
      script.position.y = -2.4 * (1 - up); script.visible = up > 0;
      const nf = lin(lp, T.noteFly, T.notePin), pinned = pulse(lp, T.notePin, .003, .03);
      note.visible = nf > 0;
      if (note.visible) {
        v.set(where.x + Math.sin(where.yaw) * .45, .62, where.z + Math.cos(where.yaw) * .45); // out of its hands
        arc(note.position, v, NOTE_AT, sm(nf), .08);
        note.scale.setScalar(mix(.25, 1, sm(nf)) * (1 + .12 * pinned));
        note.rotation.set(-.2 * sm(nf), 0, (1 - sm(nf)) * .6 + .04);
      }
      pin.scale.setScalar(Math.max(.001, outBack(lin(lp, T.notePin - .004, T.notePin + .008), 2.5)));
      headMat.emissiveIntensity = .2 + 1.6 * sm(lin(lp, T.headA, T.headA + .015)) + 2.5 * pulse(lp, T.headA + .012, .003, .03);

      /* the robot's line of attention: the lever it throws, the dial it tries, the sheets it reads */
      let target = null, linkOn = 0;
      levers.forEach((l, i) => { const on = window01(lp, l.at - .008, l.at, l.at + .008, l.at + .014); if (on > linkOn) { linkOn = on; target = leverWorld[i]; } });
      for (const a of T.tryA) { const on = window01(lp, a - .006, a, a + T.tryLen * 2 + T.tryHold, a + T.tryLen * 2 + T.tryHold + .01); if (on > linkOn) { linkOn = on; target = dialWorld; } }
      for (const p of parcels) { const on = window01(lp, p.crossAt - .008, p.crossAt, p.crossAt + .006, p.crossAt + .012); if (on > linkOn) { linkOn = on; target = w.copy(p.g.position).setY(.3); } }
      link.visible = false;
      if (linkOn > 0 && target) { link.userData.stretch(head0, target, .012); link.material.opacity = .4 * linkOn; }

      /* the harness: down a column of light, into the hands */
      pick.obj.visible = lp >= T.dropA;
      column.visible = false;
      skyPos.set(where.x - .3, 3.5, where.z + .25);
      if (pick.obj.visible) {
        const o = pick.obj;
        if (fly < 1) {
          const e = sm(fly);
          o.position.lerpVectors(skyPos, holdPos, e);
          o.position.x += Math.sin(fly * Math.PI) * .28;
          qRoll.setFromAxisAngle(zAxis, Math.PI * 2 * sm(fly));
          o.quaternion.copy(qStart).slerp(holdQuat, sm(lin(fly, .1, .95))).multiply(qRoll);
          o.scale.setScalar(mix(HOLD * 1.25, holdScl.x, sm(lin(fly, .2, 1))));
        } else { o.position.copy(holdPos); o.quaternion.copy(holdQuat); o.scale.copy(holdScl); }
        shade(Math.sin(Math.PI * fly) * .4 + catchHit * .9 + (fly >= 1 ? .06 : 0));
        const beamOn = Math.sin(Math.PI * fly);
        if (beamOn > .002) { v.copy(skyPos).setY(skyPos.y + 1.5); column.userData.stretch(v, holdPos, .22); column.material.opacity = beamOn * .12; }
      }
      const named = sm(lin(lp, T.dropB, T.dropB + .02));
      armedName.material.opacity = named; nameplate.material.opacity = 1 - named;
      for (let i = 0; i < 2; i++) {
        const r = lin(lp, T.dropB + i * .012, T.dropB + .07 + i * .012);
        pulses[i].position.set(where.x, .03, where.z);
        pulses[i].scale.setScalar(.9 + 3 * outCubic(r));
        pulses[i].material.opacity = (1 - r) * (1 - r) * (i ? .7 : 1);
        pulses[i].visible = r > 0 && r < 1;
      }
      flash.position.copy(holdPos); flash.material.opacity = catchHit * .6; flash.scale.setScalar(.5 + .9 * catchHit);

      table.rimMat.emissiveIntensity = 1 + .25 * Math.sin(t * 2) + 1.2 * pulse(lp, T.barB, .004, .03) + 1.6 * pulse(lp, T.lock, .004, .04) + 1.2 * pulse(lp, T.notePin, .003, .03) + 3 * catchHit;
      nameplate.position.set(where.x + .3, .1, Math.min(where.z + .78, 2.92));
      armedName.position.set(where.x + .75, .1, nameplate.position.z);

      // reduced motion gets one still: the note's shot, not the catch's close-up
      placeCamera(reduce ? .76 : lp, catchHit * .05 * Math.sin(lp * 2400));
    },
  };
}

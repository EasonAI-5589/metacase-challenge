/* film-agent.js — beat 1 of the Metacase film: Agent. The model is the character, the harness its weapon.
 * The armory: ten harnesses ride a tilted selector wheel around the model, the cream robot with an
 * amber eye (qwen3.7-max). The wheel wakes out of the plinth, spins like a slot reel and settles on
 * Claude Code; the rack hops up into a halo behind the robot with the pick at its crown, and the
 * weapon drops out of its socket into the robot's hands. The catch rings through the halo.
 *   lp 0.00–0.02   dormant: ten pedestals docked flat on the plinth, rims dark
 *   lp 0.02–0.15   wake: rims ignite in a chase, the pedestals jump up into the wheel, its ticks draw on
 *   lp 0.10–0.41   spin: 17 slots, a fast start and a long slow-down with a small overshoot; the
 *                  pointer flaps at each peg, the rack banks and streaks at speed, the names blur out;
 *                  the copy's slot rolls through the name under the pointer
 *   lp 0.404       lock: the pointer clamps on Claude Code, the socket flares; the other nine names
 *                  fade out and their pedestals dim to embers by .49
 *   lp 0.408–0.52  halo: the rack hops, pick first, from the wheel into a halo standing behind the robot
 *                  (the front pedestal arcs over its head); the pointer rises away
 *   lp 0.55–0.675  lift: the socket dips, the weapon rises out of the crown and charges
 *   lp 0.675–0.755 drop: a swoop out and down into the hands, a barrel roll and a trail; it looks up,
 *                  follows it and reaches; grip. The camera pushes in from .70 to .76
 *   lp 0.755       catch: a white flash, a punch of scale, recoil, two ring pulses, sparks
 *   lp 0.76–0.82   held close on the catch; then it turns to the camera as the shot eases back by .90
 * Everything is a function of lp, plus a little idle life from t (none with ctx.reduce).
 * Hand-off: hand.robot.create() and hand.weapon.create() build new copies of the armed robot and of
 * its weapon (never this beat's own nodes); hand.armed keeps the plain data. */
import { mergeGeometries } from './assets/vendor/three/BufferGeometryUtils.js';

const N = 10, TAU = Math.PI * 2, STEP = TAU / N;
const AMBER = 0xf2b545, EYE = 0xffd666, STEEL = 0x6f86c8, NAVY = 0x1c2740, DEEP = 0x111a2d;
const S = 1.5, ROBOT_Z = .75;          // the robot's scale and place on its pad
const DISP = .84, HOLD = .8;           // a weapon's length on a pedestal (world units) and in the hands (robot units)
// The rack in the order of the copy's list (index 0 is the pick). glb: index into loadArenaWeapons().
const RACK = [
  { name: 'Claude Code', glb: 2, color: AMBER },
  { name: 'Codex CLI', glb: 3, color: 0x6aa8e8 },
  { name: 'OpenCode', glb: 5, color: 0x45b5b0 },
  { name: 'DeepSeek Harness', glb: 0, color: 0x4a7fd4 },
  { name: 'DeepAgents', glb: 1, color: 0x3f9d6a },
  { name: 'OpenAI Agents SDK', color: 0x6aa8e8 },
  { name: 'Claude Agent SDK', color: 0xe2667a },
  { name: 'OpenHands SDK', color: 0x7d6ad8 },
  { name: 'Terminus-2', glb: 4, color: 0xef8a4b },
  { name: 'mini-SWE-agent', color: 0x3f9d6a },
];
// The wheel: a ring tilted around the robot (back up, front down); the halo: a ring standing behind it.
const WHEEL = { c: 1.55, zc: -.45, r: 3.1, th: .42 };
const HALO = { c: 2.1, zc: -1.6, r: 2.05, th: 1.32 };
const DOCK = { y: .06, zc: -.3, r: 3.5 };
const START = 3, TURNS = 2;            // DeepSeek Harness is under the pointer when the wheel wakes; two turns later, Claude Code
const PSI0 = -START * STEP, PSI1 = -TURNS * TAU;
const T = { wake: .02, spinA: .10, spinB: .40, ovA: .368, ovB: .411, lock: .404, halo: .408, lift: .55, flyA: .675, flyB: .755 };
// The camera line: a high establishing shot of the wheel, down towards the robot as the weapon
// lifts, a hard push in onto the catch (held), then eased back a little for the hand-off.
const KEYS = [
  { t: 0, pos: [-2.4, 5.2, 13.2], look: [-.6, 1.4, -.6], fov: 34 },
  { t: .25, pos: [-1.2, 4.5, 12.2], look: [-.6, 1.6, -.7], fov: 33 },
  { t: .45, pos: [.2, 3.6, 11.0], look: [-.5, 1.9, -.8], fov: 32 },
  { t: .7, pos: [1.0, 2.2, 8.0], look: [-.4, 2.05, -.6], fov: 31 },
  { t: .76, pos: [.8, 1.55, 6.9], look: [-.2, 1.4, -.5], fov: 30 },
  { t: .82, pos: [.8, 1.55, 6.9], look: [-.2, 1.4, -.5], fov: 30 },
  { t: .9, pos: [1.25, 1.6, 7.6], look: [-.2, 1.5, -.5], fov: 30 },
];

const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const sm = x => x * x * (3 - 2 * x);
const smoother = x => x * x * x * (x * (x * 6 - 15) + 10);
const outCubic = x => 1 - (1 - x) * (1 - x) * (1 - x);
const outBack = (x, s = 1.6) => { const u = x - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
const mix = (a, b, k) => a + (b - a) * k;
// a flash: up over `rise`, then an exponential fall of time constant `fall` (all in lp)
const pulse = (x, at, rise, fall) => (x < at ? 0 : x < at + rise ? sm((x - at) / rise) : Math.exp(-(x - at - rise) / fall));

// The wheel's angle at lp: a quick quadratic start, a long slow-down, and a small overshoot that
// rolls back onto the pick by .56. The two parts meet at the same speed: 2A/a = P(1 - A)/(1 - a).
const SPIN_A = .18, SPIN_P = 2.4, SPIN_AA = SPIN_P * SPIN_A / (2 + (SPIN_P - 2) * SPIN_A);
function spin(lp) {
  const x = lin(lp, T.spinA, T.spinB), a = SPIN_A, A = SPIN_AA;
  const s = x < a ? A * (x / a) * (x / a) : A + (1 - A) * (1 - (1 - (x - a) / (1 - a)) ** SPIN_P);
  const r = lin(lp, T.ovA, T.ovB);
  return PSI0 + (PSI1 - PSI0) * s - Math.sin(Math.PI * r) * (1 - r) * .55 * STEP;
}
// A point of a ring at angle u (0 = its top, at the back), in set coordinates.
function ringPoint(out, u, p) {
  const cu = Math.cos(u);
  return out.set(p.r * Math.sin(u), p.c + p.r * cu * Math.sin(p.th), p.zc - p.r * cu * Math.cos(p.th));
}
function blend(out, k) {
  out.c = mix(WHEEL.c, HALO.c, k); out.zc = mix(WHEEL.zc, HALO.zc, k); out.r = mix(WHEEL.r, HALO.r, k); out.th = mix(WHEEL.th, HALO.th, k);
  return out;
}
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
  const { PALETTE, GUN_HOLD, add, cyl, mat, glowMat } = kit;
  const glowMap = util.glowSprite(0xffffff, 1).material.map;
  const additive = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, ...extra });
  const col = new THREE.Color(), cSteel = new THREE.Color(STEEL), cAmber = new THREE.Color(AMBER), cHot = new THREE.Color(0xffe2a8);
  const cSlate = new THREE.Color(0x8e9ab3), cCream = new THREE.Color(0xfff4dc), cGold = new THREE.Color(0xffc95a);

  /* ---- the plinth, the docking circle and the robot's pad ---- */
  cyl(set, 4.3, 4.45, .32, NAVY, 0, -.32, 0, 72);
  cyl(set, 4.46, 4.2, .55, DEEP, 0, -.87, 0, 72);
  const rim = add(set, new THREE.TorusGeometry(4.37, .03, 8, 180), glowMat(AMBER, 1.1).clone(), 0, .005, 0, false); // kit materials are shared: clone before animating
  rim.rotation.x = Math.PI / 2;
  const dockMat = additive(STEEL, .45), dock = add(set, new THREE.TorusGeometry(DOCK.r, .012, 6, 180), dockMat, 0, .012, DOCK.zc, false);
  dock.rotation.x = Math.PI / 2;
  cyl(set, .82, .9, .1, NAVY, 0, 0, ROBOT_Z, 48);
  const padRim = add(set, new THREE.TorusGeometry(.86, .022, 8, 72), glowMat(AMBER, 1.2).clone(), 0, .1, ROBOT_Z, false);
  padRim.rotation.x = Math.PI / 2;
  const plateTex = labelTexture('film-agent-model', [{ text: 'qwen3.7-max', size: 66, weight: 700, color: '#ffffff', track: 3 }], { width: 640, height: 128 });
  const nameplate = new THREE.Mesh(new THREE.PlaneGeometry(1.45, .29), new THREE.MeshBasicMaterial({ map: plateTex, color: cGold, transparent: true, depthWrite: false }));
  nameplate.position.set(0, .12, ROBOT_Z + 1.34); nameplate.rotation.x = -Math.PI / 2 + .85; nameplate.renderOrder = 2; set.add(nameplate);

  /* ---- the robot: the model ---- */
  const bot = kit.robot(PALETTE.cream, EYE);
  bot.root.scale.setScalar(S); bot.root.position.set(0, .1, ROBOT_Z); set.add(bot.root);
  const eyeShared = mat(EYE, { emissive: EYE, intensity: 2.2 }), eyeMat = eyeShared.clone();
  bot.root.traverse(o => { if (o.material === eyeShared) o.material = eyeMat; });
  const anchor = new THREE.Object3D(); // where the weapon is held, in the robot's own units
  anchor.position.copy(GUN_HOLD.at); anchor.rotation.copy(GUN_HOLD.turn); anchor.scale.setScalar(HOLD); bot.root.add(anchor);

  /* ---- the ten weapons: the arena's six models, the kit's blaster for the other four ---- */
  let library = null;
  try { library = await loadWeapons(); } catch { library = null; }
  // A matte copy of a shared arena model, with its own materials (so this beat can light it alone).
  function matteClone(src) {
    const obj = src.clone(true), mats = [], made = new Map();
    obj.traverse(o => {
      if (!o.isMesh) return;
      let m = made.get(o.material);
      if (!m) {
        const s = o.material;
        m = new THREE.MeshStandardMaterial({ color: s.color ? s.color.clone() : 0xffffff, map: s.map || null, emissive: 0xffffff, emissiveMap: s.map || null, emissiveIntensity: 0, roughness: .7, metalness: 0 });
        made.set(s, m); mats.push({ m, base: m.color.clone(), glow: 0 });
      }
      o.material = m; o.castShadow = true; o.receiveShadow = true;
    });
    return { obj, mats };
  }
  // The kit's blaster, merged to one mesh per material (nine draw calls down to three).
  function blaster(color) {
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
      mats.push({ m, base: m.color.clone(), glow });
    }
    return obj.children.length ? { obj, mats } : { obj: src, mats: [] };
  }
  const makeWeapon = j => (library && RACK[j].glb != null ? matteClone(library.weapons[RACK[j].glb]) : blaster(RACK[j].color));
  const weapons = RACK.map((_, j) => { const w = makeWeapon(j); set.add(w.obj); return w; });
  const pick = weapons[0];
  function shade(w, glow, dim) { for (const e of w.mats) { e.m.emissiveIntensity = e.glow + glow; e.m.color.copy(e.base).multiplyScalar(dim); } }

  /* ---- the pedestals: three instanced meshes and a glow under each ---- */
  const discGeo = new THREE.CylinderGeometry(.4, .28, .1, 32);
  const rimGeo = new THREE.TorusGeometry(.4, .02, 6, 48); rimGeo.rotateX(Math.PI / 2); rimGeo.translate(0, .05, 0);
  const faceGeo = new THREE.CylinderGeometry(.31, .31, .012, 32); faceGeo.translate(0, .056, 0);
  const discs = new THREE.InstancedMesh(discGeo, mat(NAVY), N);
  const rims = new THREE.InstancedMesh(rimGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
  const faces = new THREE.InstancedMesh(faceGeo, additive(0xffffff, .6), N);
  discs.castShadow = true; discs.receiveShadow = true;
  for (const m of [discs, rims, faces]) { m.frustumCulled = false; set.add(m); }
  for (let j = 0; j < N; j++) { rims.setColorAt(j, col.setRGB(0, 0, 0)); faces.setColorAt(j, col); }

  // Additive glow points (one draw call each set): under the pedestals, the speed streaks, the trail, the sparks.
  function cloud(n, size) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), rgb = new Float32Array(n * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: glowMap, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    pts.frustumCulled = false; set.add(pts);
    return {
      put(i, p, c, k) { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; rgb[i * 3] = c.r * k; rgb[i * 3 + 1] = c.g * k; rgb[i * 3 + 2] = c.b * k; },
      commit() { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; },
    };
  }
  const STREAK = 8, TRAIL = 64, SPARKS = 36;
  const under = cloud(N, .95), streak = cloud(N * STREAK, .3), trail = cloud(TRAIL, .28), sparks = cloud(SPARKS, .13);
  let seed = 11; // the sparks' directions: a fixed, seeded spray
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const sparkDir = Array.from({ length: SPARKS }, () => { const a = rnd() * TAU, up = .35 + rnd() * .9; return new THREE.Vector3(Math.cos(a), up, Math.sin(a)).normalize().multiplyScalar(.9 + rnd() * 1.6); });

  /* ---- the labels: each harness's name, under its pedestal on the wheel, beside it in the halo ---- */
  const labelGeo = new THREE.PlaneGeometry(1.5, .3);
  const ruler = document.createElement('canvas').getContext('2d');
  ruler.font = '650 60px Inter, Arial, sans-serif';
  const textW = RACK.map(spec => Math.min(1.4, ruler.measureText(spec.name).width / 640 * 1.5)); // printed width, world units
  const labels = RACK.map(spec => {
    const tex = labelTexture(`film-agent-${spec.name}`, [{ text: spec.name, size: 60, weight: 650, color: '#ffffff', track: 1 }], { width: 640, height: 128 });
    const m = new THREE.Mesh(labelGeo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0 }));
    m.renderOrder = 3; set.add(m);
    return m;
  });

  /* ---- the wheel's track: a glowing ring and its ticks, turning with the rack ---- */
  const ring = new THREE.Group(); set.add(ring);
  const trackMat = additive(AMBER, 1), track = add(ring, new THREE.TorusGeometry(1, .008, 6, 240), trackMat, 0, 0, 0, false);
  track.rotation.x = Math.PI / 2;
  const innerMat = additive(STEEL, .5), inner = add(ring, new THREE.TorusGeometry(.93, .004, 4, 200), innerMat, 0, 0, 0, false);
  inner.rotation.x = Math.PI / 2;
  const spinner = new THREE.Group(); ring.add(spinner);
  const TICKS = 40, tickMat = additive(0xffe2a8, .85), ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(.007, .007, .03), tickMat, TICKS);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < TICKS; i++) { const a = i / TICKS * TAU; m4.makeRotationY(Math.PI - a).setPosition(Math.sin(a) * .97, 0, -Math.cos(a) * .97); ticks.setMatrixAt(i, m4); }
  ticks.frustumCulled = false; spinner.add(ticks);

  /* ---- the selector: a pointer over the top of the wheel and its beam ---- */
  const pointer = new THREE.Group(); set.add(pointer);
  const pointerMat = new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: AMBER, emissiveIntensity: 1.2, roughness: .4, metalness: 0 });
  const tip = add(pointer, new THREE.ConeGeometry(.16, .36, 4), pointerMat, 0, -.18, 0, false); tip.rotation.x = Math.PI;
  const pointerGlow = util.glowSprite(AMBER, 1.1, .5); pointerGlow.position.y = -.12; pointer.add(pointerGlow);
  const beamGeo = new THREE.CylinderGeometry(.05, .55, 1, 32, 1, true); beamGeo.translate(0, -.5, 0);
  { // a vertical fade in vertex colours: bright under the pointer, dim at the socket
    const p = beamGeo.attributes.position, c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) c[i * 3] = c[i * 3 + 1] = c[i * 3 + 2] = mix(.12, 1, p.getY(i) + 1);
    beamGeo.setAttribute('color', new THREE.BufferAttribute(c, 3));
  }
  const beamMat = additive(AMBER, 0, { vertexColors: true, side: THREE.DoubleSide });
  const beam = new THREE.Mesh(beamGeo, beamMat); set.add(beam);
  const lockFlash = util.glowSprite(0xffd27a, 1.2, 0); set.add(lockFlash);

  /* ---- the catch: two ring pulses on the floor and a flash ---- */
  const pulseGeo = new THREE.TorusGeometry(1, .03, 6, 120); pulseGeo.rotateX(Math.PI / 2);
  const pulses = [0, 1].map(() => { const m = new THREE.Mesh(pulseGeo, additive(AMBER, 0)); m.position.set(0, .12, ROBOT_Z); m.frustumCulled = false; set.add(m); return m; });
  const catchFlash = util.glowSprite(0xffe7b0, 1.6, 0); set.add(catchFlash);
  const whiteout = util.glowSprite(0xffffff, 1, 0); set.add(whiteout); // the catch's one white frame

  /* ---- hand-off: copies of the armed robot and its weapon, for the beats after this one ---- */
  const template = makeWeapon(0).obj;
  // armed.weapon() and robot.make() are the shapes the trajectory beat asks for: a weapon copy, and
  // the bare robot it arms itself; create() builds the whole armed rig
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
  // narrow: 0 beside the copy (the keys aim a little left of the subject, to set it right of the
  // copy), 1 in a portrait frame with the copy below, where the subject is centred instead
  function placeCamera(lp, shake, narrow, stacked) {
    // stacked: the catch sits higher in the frame, above the copy
    const raise = stacked ? .5 * sm(lin(lp, .64, .74)) : 0;
    for (let c = 0; c < 3; c++) {
      cam.from.pos[c] = cam.to.pos[c] = camAt(lp, 'pos', c) + (c === 1 ? shake * .6 : c === 0 ? shake : 0);
      cam.from.look[c] = cam.to.look[c] = camAt(lp, 'look', c) * (c === 0 ? 1 - narrow : 1) + (c === 1 ? raise : 0);
    }
    cam.from.fov = cam.to.fov = camAt(lp, 'fov', 0);
  }
  placeCamera(0, 0, 0, false);

  /* ---- scratch, so update allocates nothing ---- */
  const pedPos = Array.from({ length: N }, () => new THREE.Vector3());
  const v = new THREE.Vector3(), w = new THREE.Vector3(), top = new THREE.Vector3();
  const p0 = new THREE.Vector3(), p1 = new THREE.Vector3(), p2 = new THREE.Vector3(), p3 = new THREE.Vector3();
  const holdPos = new THREE.Vector3(), holdQuat = new THREE.Quaternion(), holdScl = new THREE.Vector3();
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qRoll = new THREE.Quaternion(), zAxis = new THREE.Vector3(0, 0, 1);
  const eul = new THREE.Euler(), dummy = new THREE.Object3D(), pg = { c: 0, zc: 0, r: 0, th: 0 };
  const bez = (out, e) => { const u = 1 - e; return out.copy(p0).multiplyScalar(u * u * u).addScaledVector(p1, 3 * u * u * e).addScaledVector(p2, 3 * u * e * e).addScaledVector(p3, e * e * e); };

  return {
    camera: cam,
    update(lp, t, dt, ui) {
      if (reduce) { lp = 1; t = 0; }
      const narrow = Math.min(1, Math.max(0, (1.1 - camera.aspect) / .4));
      /* the wheel's state */
      const haloG = sm(lin(lp, T.halo + .01, T.halo + .1));     // the track follows the median pedestal
      const psiBase = spin(lp), psi = psiBase + Math.sin(t * .4) * .03 * haloG;
      const omega = (spin(lp + 1e-3) - spin(lp - 1e-3)) / 2e-3 / STEP; // slots per unit of lp, negative while it turns
      const speed = Math.min(1, Math.abs(omega) / 80);
      const f = -psiBase / STEP, nearest = Math.round(f), d = f - nearest;
      const front = ((nearest % N) + N) % N;
      const peg = Math.exp(-(d / .12) * (d / .12));             // a slot lined up with the pointer
      const woke = lin(lp, T.wake, .14);
      const locked = sm(lin(lp, T.lock, T.lock + .02)), lockHit = pulse(lp, T.lock, .008, .045);
      const lift = lin(lp, T.lift, T.flyA), fly = lin(lp, T.flyA, T.flyB);
      const impact = pulse(lp, T.flyB, .004, .035);
      const ember = sm(lin(lp, T.lock + .01, T.lock + .085));  // the nine others go dark after the lock
      const white = lp >= T.flyB && lp < T.flyB + .006 ? 1 - (lp - T.flyB) / .006 : 0;
      const punch = pulse(lp, T.flyB, .002, .009);

      /* the robot: its stance first, since the hold pose follows it */
      const recoilR = lin(lp, T.flyB, .81), recoil = Math.sin(Math.PI * recoilR) * (1 - recoilR) * 1.7;
      const hop = Math.sin(Math.PI * lin(lp, T.lock, T.lock + .05)) * .09;
      bot.root.position.set(0, .1 + hop - recoil * .07, ROBOT_Z);
      bot.root.rotation.set(-recoil * .06, .34 * sm(lin(lp, .77, .87)), 0);
      const sp = S * (1 + .04 * punch);
      bot.root.scale.set(sp * (1 + recoil * .045), sp * (1 - recoil * .07), sp * (1 + recoil * .045));
      bot.grip(sm(lin(lp, .72, T.flyB)));
      bot.update(t, 0);
      bot.root.updateMatrix(); anchor.updateMatrix();
      m4.multiplyMatrices(bot.root.matrix, anchor.matrix).decompose(holdPos, holdQuat, holdScl);

      /* the top of the wheel, under the pointer; it becomes the halo's crown */
      const crown = smoother(lin(lp, T.halo, T.halo + .07));
      ringPoint(top, 0, WHEEL);
      if (crown > 0) { ringPoint(w, 0, HALO); top.lerp(w, crown); top.y += Math.sin(Math.PI * crown) * .35; }

      /* the pedestals: docked, then on the wheel, then in the halo */
      for (let j = 0; j < N; j++) {
        const order = (j - START + N) % N, k = Math.min(j, N - j);
        const rise = lin(lp, T.wake + order * .0105, T.wake + .075 + order * .0105);
        const ign = lin(lp, .012 + order * .0105, .04 + order * .0105);
        const u = psi + j * STEP;
        ringPoint(v, u, WHEEL);
        const ud = PSI0 + j * STEP;
        w.set(DOCK.r * Math.sin(ud), DOCK.y, DOCK.zc - DOCK.r * Math.cos(ud));
        const pos = pedPos[j].lerpVectors(w, v, outBack(rise, 1.3));
        // the hop into the halo, the pick first; whatever is in front of the robot arcs over its head
        const e = smoother(lin(lp, T.halo + k * .009, T.halo + .07 + k * .009));
        if (e > 0) {
          const over = .35 + 2.5 * Math.max(0, 1 - Math.abs(pos.x) / 1.3) * lin(pos.z, ROBOT_Z - .8, ROBOT_Z + .2);
          ringPoint(w, u, HALO);
          pos.lerp(w, e); pos.y += Math.sin(Math.PI * e) * over;
        }
        pos.y += Math.sin(t * 1.3 + j * 1.7) * .035 * rise;
        // how squarely this slot sits under the pointer while the wheel is choosing
        let du = (u % TAU + TAU) % TAU; if (du > Math.PI) du -= TAU;
        const front01 = Math.max(0, 1 - Math.abs(du) / (STEP * .6)) * (1 - locked) * rise;
        const wave = pulse(lp, T.flyB + .004 + (5 - k) * .007, .004, .03); // the catch, climbing the halo
        const shimmer = e * (.5 + .5 * Math.sin(t * 2.2 - k * .9)) * .3;  // idle life once the halo stands
        let level = ign * .55 + front01 * (1.4 + peg * 1.4) + wave * 3 + shimmer, tone = front01;
        if (j === 0) { level += locked * (2.6 + lockHit * 3) + lift * 1.5 - fly * 1.2; tone = Math.max(tone, locked); }
        else level = level * (1 - .45 * locked) * (1 - .85 * ember) + wave * .6 * ember;
        if (j === 0) pos.y -= Math.sin(Math.PI * lift) * .12;   // the socket dips as the weapon leaves it
        const bank = omega * .0026 * Math.cos(u) * rise;          // the rack leans into its speed
        dummy.position.copy(pos); dummy.rotation.set(0, 0, bank);
        const grow = .75 + .25 * rise, squash = j === 0 ? 1 - Math.sin(Math.PI * lift) * .25 : 1;
        dummy.scale.set(grow, grow * squash, grow);
        dummy.updateMatrix();
        discs.setMatrixAt(j, dummy.matrix); rims.setMatrixAt(j, dummy.matrix); faces.setMatrixAt(j, dummy.matrix);
        rims.setColorAt(j, col.copy(cSteel).lerp(cAmber, tone).multiplyScalar(.25 + level * 1.15));
        faces.setColorAt(j, col.copy(cSteel).lerp(cAmber, tone).multiplyScalar(.04 + level * .22));
        v.copy(pos); v.y -= .16;
        under.put(j, v, col.copy(cSteel).lerp(cAmber, tone), .05 + level * .32);
        for (let s = 0; s < STREAK; s++) { // a comet tail behind each pedestal at speed
          ringPoint(w, u + (s + 1) * .055 * speed, WHEEL); w.y += .12;
          streak.put(j * STREAK + s, w, cAmber, speed * speed * 1.8 * (1 - s / STREAK) * rise);
        }
        // the weapon on its pedestal (the pick is placed below once it lifts)
        const wpn = weapons[j], big = j === 0 ? Math.max(front01, locked) : front01;
        if (j !== 0 || lp < T.lift) {
          wpn.obj.position.copy(pos); wpn.obj.position.y += .26 + .04 * rise;
          wpn.obj.rotation.set(0, Math.PI / 2 + Math.sin(t * .55 + j * 1.3) * .45 * rise - omega * .004, bank * 1.4);
          wpn.obj.scale.setScalar(DISP * (.6 + .4 * rise) * (1 + .2 * big + .06 * peg * front01));
        }
        shade(wpn, front01 * (.18 + peg * .25) + wave * (j === 0 ? .6 : .15) + (j === 0 ? locked * .35 : 0), j === 0 ? 1 : 1 - .4 * locked - .45 * ember);
        // the label: under the pedestal on the wheel, beside it (outwards) in the halo; hidden low in
        // front, behind the robot, and while the wheel blurs past
        const lab = labels[j], out = j === 0 ? 0 : e * (1 - narrow), side = pos.x < 0 ? -1 : 1;
        lab.position.set(pos.x + side * (.44 + textW[j] / 2) * out, pos.y - .36 * (1 - out) - .02 * out, pos.z);
        lab.quaternion.copy(camera.quaternion);
        const high = lin(pos.y, .75, 1.35), behind = e * lin(1.1 - Math.abs(pos.x), 0, .35) * (pos.y < 2.4 ? 1 : 0);
        // the pick's name has done its job once the weapon drops (the copy holds it): it leaves the push-in
        lab.material.opacity = rise * Math.max(high, e) * (1 - .9 * speed) * (1 - behind) * (j === 0 ? 1 - sm(lin(lp, .64, .7)) : 1 - ember);
        lab.visible = lab.material.opacity > .002;
        if (j === 0 && locked > 0) lab.material.color.copy(cCream).lerp(cGold, locked);
        else lab.material.color.copy(cSlate).lerp(cCream, Math.min(1, front01 * 1.5));
        lab.scale.setScalar(1 + .22 * front01 + (j === 0 ? .18 * locked : 0));
      }
      discs.instanceMatrix.needsUpdate = rims.instanceMatrix.needsUpdate = faces.instanceMatrix.needsUpdate = true;
      rims.instanceColor.needsUpdate = faces.instanceColor.needsUpdate = true;
      under.commit(); streak.commit();

      /* the track: on the wheel, then the halo; it dims while the rack is in the air between them */
      blend(pg, haloG);
      ring.position.set(0, pg.c, pg.zc); ring.rotation.x = pg.th; ring.scale.setScalar(pg.r);
      spinner.rotation.y = -psi;
      ticks.count = Math.round(TICKS * lin(lp, .03, .15));
      const between = 1 - .85 * Math.sin(Math.PI * haloG);
      trackMat.color.setHex(AMBER).multiplyScalar(woke * (.35 + speed * 1.5 + lockHit * 1.4 + impact * 2.2));
      trackMat.opacity = woke * between;
      innerMat.opacity = .5 * woke * between * (1 - .5 * haloG);
      tickMat.opacity = .85 * (.45 + .55 * speed + .4 * impact) * between;
      dockMat.opacity = .45 * (1 - .7 * woke) + .3 * impact;

      /* the pointer drops in as the wheel wakes, flaps at each peg, clamps on the pick, then rises away */
      const drop = outBack(lin(lp, .06, .14), 1.4), away = sm(lin(lp, T.lock + .02, T.lock + .09));
      pointer.position.copy(top); pointer.position.y += 1.0 - .16 * locked + Math.sin(t * 2) * .025 + (1 - drop) * 1.4 + away * 1.2;
      pointer.rotation.z = -Math.sin(d * TAU) * .34 * Math.min(1, speed * 3 + .15) * (1 - locked) * woke;
      pointer.scale.setScalar(Math.max(.001, lin(lp, .06, .1) * (1 - away)) * (1 + .3 * lockHit));
      pointer.visible = lp > .06 && away < 1;
      pointerMat.emissiveIntensity = .4 + woke * (.8 + peg * speed * 2.5) + lockHit * 4;
      pointerGlow.material.opacity = lin(lp, .06, .12) * (1 - away) * (.3 + .4 * peg * speed + lockHit);
      const beamOn = lin(lp, .06, .12) * (1 - away) * (.06 + .16 * peg * (1 - locked) * Math.min(1, speed * 4 + .3) + .3 * locked);
      beam.position.copy(pointer.position); beam.scale.set(1, Math.max(.01, pointer.position.y - top.y - .1), 1);
      beamMat.opacity = beamOn; beam.visible = beamOn > .002;
      lockFlash.position.copy(top); lockFlash.position.y += .35;
      lockFlash.material.opacity = lockHit * .55 + lift * (1 - fly) * .18;
      lockFlash.scale.setScalar(1.2 + lockHit * 1.1);

      /* the pick: lift out of the crown, swoop down into the hands */
      if (lp >= T.lift) {
        const o = pick.obj, lifted = outCubic(lift);
        p0.copy(pedPos[0]); p0.y += .3 + .38 * lifted;
        qa.setFromEuler(eul.set(-.18 * lifted, Math.PI / 2, .1 * Math.sin(lift * Math.PI)));
        const dispScale = DISP * 1.2 * (1 + .12 * lifted);
        if (fly <= 0) {
          o.position.copy(p0); o.quaternion.copy(qa); o.scale.setScalar(dispScale);
        } else if (fly < 1) {
          p1.copy(p0).add(v.set(1.3, .45, 1.5));
          p3.copy(holdPos);
          p2.copy(holdPos).add(v.set(1.15, .85, 1.25));
          bez(o.position, smoother(fly));
          qb.copy(qa).slerp(holdQuat, smoother(lin(fly, .08, .96)));
          o.quaternion.copy(qb).multiply(qRoll.setFromAxisAngle(zAxis, TAU * sm(fly)));
          o.scale.setScalar(mix(dispScale, holdScl.x, sm(lin(fly, .15, 1))));
        } else {
          o.position.copy(holdPos); o.quaternion.copy(holdQuat); o.scale.copy(holdScl);
        }
        shade(pick, .35 * locked + lift * .5 * (1 - fly) + Math.sin(Math.PI * fly) * .4 + impact * .9 + (fly >= 1 ? .06 : 0), 1);
      }
      const trailOn = fly > 0 && fly < 1 ? Math.sin(Math.PI * fly) : 0;
      for (let i = 0; i < TRAIL; i++) {
        const k = 1 - i / TRAIL;
        if (trailOn > 0) bez(v, smoother(Math.max(0, fly - i * .0045))); else v.copy(holdPos);
        trail.put(i, v, cHot, trailOn * 1.1 * k * k);
      }
      trail.commit();

      /* its eyes: up at the wheel while it turns and at the crown, on the weapon as it drops, then
       * a glance at its hands and back to the camera */
      const head = bot.head;
      const watch = lin(lp, .08, .18) * (1 - lin(lp, .66, .7));
      const follow = lin(lp, .68, .71) * (1 - lin(lp, .78, .84));
      let yaw = head.rotation.y * (1 - watch) - d * .35 * Math.min(1, speed * 3) * watch;
      let pitch = -.4 * watch - .12 * sm(lin(lp, T.lift, T.lift + .08)) * watch - lockHit * .1;
      if (follow > 0) {
        head.getWorldPosition(w); set.worldToLocal(w);
        v.copy(pick.obj.position).sub(w);
        const ty = Math.max(-.7, Math.min(.7, Math.atan2(v.x, Math.abs(v.z) + .8) - bot.root.rotation.y));
        const tp = Math.max(-.5, Math.min(.22, -Math.atan2(v.y, Math.hypot(v.x, v.z) + .5)));
        yaw = mix(yaw, ty, follow); pitch = mix(pitch, tp, follow);
      }
      pitch += .08 * pulse(lp, T.flyB, .006, .03);
      head.rotation.y = yaw * (1 - .7 * sm(lin(lp, .8, .88)));
      head.rotation.x = pitch;
      eyeMat.emissiveIntensity = 2.2 + peg * speed * 2.2 + lockHit * 2.5 + impact * 2.5 + .4 * locked;

      /* the catch (additive light reads far brighter than its opacity once tone-mapped: keep it brief) */
      for (let i = 0; i < 2; i++) {
        const r = lin(lp, T.flyB + i * .02, T.flyB + .13 + i * .02);
        pulses[i].scale.setScalar(.9 + 3.5 * outCubic(r));
        pulses[i].material.opacity = (1 - r) * (1 - r) * (i ? .7 : 1);
        pulses[i].visible = r > 0 && r < 1;
      }
      catchFlash.position.copy(holdPos);
      catchFlash.material.opacity = impact * .55;
      catchFlash.scale.setScalar(.4 + .9 * impact);
      whiteout.position.copy(holdPos); whiteout.visible = white > 0;
      whiteout.material.opacity = white; whiteout.scale.setScalar(9 + 5 * white);
      const age = lin(lp, T.flyB, T.flyB + .09), live = age > 0 && age < 1;
      for (let i = 0; i < SPARKS; i++) {
        v.copy(holdPos).addScaledVector(sparkDir[i], Math.sqrt(age) * 1.1);
        v.y -= age * age * 1.4;
        sparks.put(i, v, cHot, live ? (1 - age) * (1 - age) * 2.2 : 0);
      }
      sparks.commit();
      rim.material.emissiveIntensity = 1 + .25 * Math.sin(t * 2) + lockHit * .8 + impact * 3;
      padRim.material.emissiveIntensity = 1.1 + .2 * Math.sin(t * 2.6) + lift * .8 + impact * 4;
      nameplate.material.opacity = .55 + .45 * woke;

      /* the copy: its slot rolls through the name under the pointer, then holds Claude Code */
      ui.set('pair', RACK[lp >= T.lock ? 0 : front].name);
      placeCamera(lp, impact * .05 * Math.sin(lp * 2400), narrow, !!layout?.stacked);
    },
  };
}

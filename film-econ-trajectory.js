/* film-econ-trajectory.js — beat 2 of the economics Metacase film: Actions & execution (econ-0157).
 * The plotting table (film-econ-kit.js) becomes the estimation bench. The robot (gpt-6-astra, armed
 * with Terminus-2 in the beat before) works with its harness: every action on the bench starts as
 * a shot from it. Along the front edge a tape gains one tick per tool call (52), and a tube along
 * the back edge fills with the context the run reads and writes (1k to 49k tokens).
 *   lp .00–.21  source reading: a zero rail stands across the bench and five cohort bars hang from
 *               it, as wide as their shares of the treated observations (14, 8, 65, 79, 14) and as
 *               long as the cohort effects of this run (one of them points up). A line draws
 *               across them at their share-weighted mean and reads −66.33; a band opens round the
 *               line in two layers, the clustered variance and the term for the estimated shares,
 *               and reads SE 25.05
 *      .22–.30  sample definition: the share labels lock first; then singletons fall out of the
 *               bench through a sieve (76; one of them amber, the treated one), and the two
 *               counters run down, 3,246 to 3,170 observations and 717 to 641 departments
 *      .31–.39  degrees of freedom: six year chips, five of them count: 5 parameters
 *      .40–.49  the independent check: a second set of five bars, from explicit dummies, rises
 *               behind the first and matches it bar for bar; five ticks
 *      .50–.80  the failure: the front of the bench clears for a terminal. An outside lookup
 *               spins and holds it; the two files queued behind it never move. The robot
 *               interrupts it, the queue is gone and the tray shows two empty places; two more
 *               shots write main.py and 157_result.json
 *      .80–.88  held: the estimate and the two files
 * The bar lengths are the run's own cohort effects (−38.2, 27.6, −49.2, −104.9, −9.7); the copy
 * prints only their weights and their mean, and so do the props.
 * Everything is a function of lp, plus a little idle life from t (none with ctx.reduce). */
import { plotTable, printed, walker, beam, mark, aim, lin, sm, mix, outBack, outCubic, pulse, window01 } from './film-econ-kit.js?v=mc-401ead81de';

const AMBER = 0xf2b545, STEEL = 0x6f86c8, RED = 0xe2667a, TEAL = 0x45b5b0, GREEN = 0x3f9d6a, DEEP = 0x0d1524, VIOLET = 0x7d6ad8;
const HALF = Math.PI / 2, S = 1.5;
const RUN = { requests: 40, calls: 52, tok0: 1, tok1: 49 };
const SHARES = [14, 8, 65, 79, 14];                               // treated observations by cohort, 2013 … 2017
const EFFECTS = [-38.247, 27.639, -49.194, -104.950, -9.705];     // this run's cohort effects; their share-weighted mean is −66.33
const MEAN = -66.327, SE = 25.053;
const COHORT_COLORS = [0x45b5b0, 0x5fc3d6, 0x6aa8e8, 0x7d6ad8, 0xa58be8];
const UNIT = .012;                                                // world units per unit of the outcome
const CHART = { x0: -.65, w: 3.4, gap: .2, z: -1.3, y0: 1.55, d: .44 };
const T = {
  bars: [.03, .052, .074, .096, .118], barLen: .02, lineA: .14, lineB: .16, bandA: .172, bandB: .188, seAt: .192,
  lockA: .212, sieveA: .225, chipStep: .007, chipLen: .03, countA: .235, countB: .285,
  dof: .315, dofStep: .01,
  second: [.40, .412, .424, .436, .448], secondLen: .02, ticks: .452, tickStep: .006,
  clearA: .485, clearB: .51, termA: .5, termB: .525, queueA: .53, stop: .6, missA: .63, write: [.69, .73], writeLen: .022,
  callsA: .01, callsB: .82,
};
// where the robot stands and which way it faces: [lp, x, z, yaw]
const WALK = [
  [0, -1.5, .75, 1.5], [.2, -1.5, .75, 1.5], [.228, -.8, 1.75, 1.25], [.49, -.8, 1.75, 1.25],
  [.53, -.7, 1.8, 1.25], [.82, -.7, 1.8, 1.25], [.86, -.7, 1.8, 1.0], [1, -.7, 1.8, 1.0],
];
const KEYS = [
  { t: 0, pos: [.7, 3.8, 11.4], look: [.85, 1.2, -.7], fov: 33 },
  { t: .2, pos: [.8, 3.8, 11.4], look: [.85, 1.2, -.7], fov: 33 },
  { t: .25, pos: [1.1, 5.0, 11.6], look: [1.05, .85, .1], fov: 33 },
  { t: .47, pos: [1.2, 5.0, 11.6], look: [1.05, .85, .1], fov: 33 },
  { t: .53, pos: [1.3, 4.5, 10.8], look: [1.35, .75, 1.0], fov: 33 },
  { t: .8, pos: [1.4, 4.5, 10.8], look: [1.35, .75, 1.0], fov: 33 },
  { t: .88, pos: [1.5, 4.3, 11.4], look: [1.25, .85, .5], fov: 33 },
];
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

export async function build({ THREE, kit, set, accent, loadWeapons, hand, util, camera, reduce, layout }) {
  const { PALETTE, GUN_HOLD, add, cyl, block, rbox, mat, glowMat } = kit;
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const glow = (color, k) => glowMat(color, k).clone();
  const flat = (geo, material, x, y, z, parent = set) => add(parent, geo, material, x, y, z, false);
  const P = o => printed({ THREE, kit, parent: set, ...o });
  const MONO = '"Space Mono", ui-monospace, monospace';
  const cAmber = new THREE.Color(AMBER), cSteel = new THREE.Color(STEEL), cRed = new THREE.Color(RED), cTeal = new THREE.Color(TEAL), cGreen = new THREE.Color(0x58d08c), cViolet = new THREE.Color(accent ?? VIOLET), col = new THREE.Color();

  const table = plotTable({ THREE, kit, set, accent: accent ?? VIOLET });

  /* ---- the robot (the model), armed with the harness ---- */
  let rig = null;
  try { rig = hand.robot?.create?.() ?? null; } catch { rig = null; }
  if (!rig) {
    const r = kit.robot(hand.robot?.color ?? PALETTE.cream, hand.robot?.eye ?? 0xffd666);
    let gun = null;
    try { gun = hand.armed?.weapon?.() ?? (await loadWeapons()).weapons[hand.armed?.weaponIndex ?? 4].clone(true); } catch { gun = null; }
    if (!gun) gun = kit.blaster(AMBER);
    gun.position.copy(GUN_HOLD.at); gun.rotation.copy(GUN_HOLD.turn); gun.scale.setScalar(.8);
    r.root.add(gun); r.root.scale.setScalar(S); r.grip(1);
    rig = { root: r.root, robot: r, weapon: gun, update: (t, walking = 0) => r.update(t, walking) };
  }
  set.add(rig.root);
  const walk = walker(WALK), where = { x: 0, z: 0, yaw: 0, walking: 0 };
  const shot = beam({ THREE, parent: set, color: 0xd9ccff });
  const muzzleFlash = util.glowSprite(0xd9ccff, .6, 0); set.add(muzzleFlash);
  const hitFlash = util.glowSprite(0xffffff, .9, 0); set.add(hitFlash);

  /* ---- the tape of tool calls along the front edge, the context tube along the back ---- */
  const TAPE = { x0: -.6, x1: 4.3, z: 2.98 };
  flat(rbox(TAPE.x1 - TAPE.x0 + .2, .02, .2, .008), mat(0x232e4a), (TAPE.x0 + TAPE.x1) / 2, .012, TAPE.z);
  const tickGeo = rbox(.05, .1, .14, .012).clone(); tickGeo.translate(0, .05, 0);
  const tape = new THREE.InstancedMesh(tickGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .6, emissive: 0xb7a8ff, emissiveIntensity: .9 }), RUN.calls);
  tape.frustumCulled = false; set.add(tape);
  const TUBE = { x0: -.6, x1: 2.7, z: 2.74, y: .05 };
  flat(rbox(TUBE.x1 - TUBE.x0, .06, .07, .03), mat(0x232e4a), (TUBE.x0 + TUBE.x1) / 2, TUBE.y, TUBE.z);
  const tubeMat = glow(accent ?? VIOLET, 1.5);
  const tubeFill = flat(rbox(1, .08, .09, .035), tubeMat, TUBE.x0, TUBE.y, TUBE.z);
  const tokName = P({ key: 'tokens-end', lines: [{ text: `${RUN.tok1}k tokens`, size: 110, weight: 700, color: '#cfc6ff' }], w: 1.2, h: .22, x: TUBE.x1 + .72, y: .1, z: TUBE.z, px: 640 });
  tokName.rotation.x = -HALF + .75;

  /* ---- the chart: a zero rail, five cohort bars hanging from it, their mean and its band ---- */
  const chart = new THREE.Group(); set.add(chart);
  const { x0, w: CW, gap, z: CZ, y0, d: CD } = CHART;
  for (const x of [x0 - .28, x0 + CW + .28]) cyl(chart, .04, .05, y0 + .05, 0x394560, x, 0, CZ, 10);
  const railMat = glow(0x9fd8ff, 1.1);
  flat(rbox(CW + .7, .05, .08, .02), railMat, x0 + CW / 2, y0, CZ, chart);
  const zeroName = printed({ THREE, kit, parent: chart, key: 'zero', lines: [{ text: '0', size: 200, weight: 800, color: '#cfe0f2' }], w: .2, h: .24, x: x0 - .5, y: y0, z: CZ + .05, px: 128 });
  const unit = (CW - gap * 4) / 180, barGeo = rbox(1, 1, CD, .03).clone(); barGeo.translate(0, -.5, 0);
  let cursor = x0;
  const bars = SHARES.map((n, i) => {
    const w = n * unit, x = cursor + w / 2, len = Math.abs(EFFECTS[i]) * UNIT, upward = EFFECTS[i] > 0; cursor += w + gap;
    const m = mat(COHORT_COLORS[i], { emissive: COHORT_COLORS[i], intensity: .2 }).clone();
    const mesh = add(chart, barGeo, m, x, y0, CZ); mesh.scale.set(w, .001, 1);
    // the same bar from the second method: a pale twin behind
    const m2 = new THREE.MeshStandardMaterial({ color: 0xcdd6ee, emissive: STEEL, emissiveIntensity: .5, roughness: .6, transparent: true, opacity: .0 });
    const twin = add(chart, barGeo, m2, x, y0, CZ - CD - .08, false); twin.scale.set(w, .001, 1);
    const label = printed({ THREE, kit, parent: chart, key: `share-${i}`, lines: [{ text: String(n), size: 190, weight: 800, color: '#ffffff' }], w: .4, h: .26, x, y: 2.2, z: CZ, px: 256 });
    const tickMat = glow(TEAL, 1.6);
    const tick = mark({ THREE, kit, kind: 'tick', material: tickMat, size: .26 }); tick.position.set(x, 2.52, CZ); chart.add(tick);
    return { mesh, m, twin, m2, label, tick, tickMat, w, x, len, upward, at: T.bars[i], at2: T.second[i], tickAt: T.ticks + i * T.tickStep };
  });
  const sharesName = printed({ THREE, kit, parent: chart, key: 'shares-name', lines: [{ text: 'shares', size: 150, weight: 700, color: '#aab6cc' }], w: .7, h: .22, x: x0 + CW + .62, y: 2.2, z: CZ, px: 384 });
  const firstName = printed({ THREE, kit, parent: chart, key: 'shares-first', lines: [{ text: 'computed first', size: 96, weight: 700, color: '#ffe2a8' }], w: 1.0, h: .2, x: x0 + CW + .62, y: 1.96, z: CZ, px: 512 });
  const meanY = y0 + MEAN * UNIT, lineMat = glow(AMBER, 1.8);
  const meanLine = flat(rbox(1, .045, .045, .02), lineMat, x0, meanY, CZ + CD / 2 + .04, chart);
  const band1 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  band1.position.set(x0 + CW / 2, meanY, CZ + CD / 2 + .02); chart.add(band1);
  const band2 = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffd98a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
  band2.position.set(x0 + CW / 2, meanY, CZ + CD / 2 + .025); chart.add(band2);
  const readout = new THREE.Group(); readout.position.set(x0 + CW + .95, 0, CZ + .5); chart.add(readout);
  cyl(readout, .03, .04, .3, 0x394560, 0, 0, 0, 10);
  flat(rbox(1.34, .86, .05, .03), mat(DEEP), 0, .72, 0, readout);
  const readEdge = glow(AMBER, 1);
  flat(rbox(1.4, .92, .03, .03), readEdge, 0, .72, -.014, readout);
  const readMean = printed({ THREE, kit, parent: readout, key: 'mean', lines: [{ text: '−66.33', size: 250, weight: 800, color: '#ffd666' }], w: 1.24, h: .4, x: 0, y: .9, z: .03, px: 640 });
  const readSe = printed({ THREE, kit, parent: readout, key: 'se', lines: [{ text: 'SE 25.05', size: 150, weight: 700, color: '#ffffff' }], w: 1.1, h: .26, x: 0, y: .5, z: .03, px: 512 });
  const twinName = printed({ THREE, kit, parent: chart, key: 'dummies', lines: [{ text: 'explicit dummies', size: 96, weight: 700, color: '#cdd6ee' }], w: 1.5, h: .24, x: x0 + CW / 2, y: 2.9, z: CZ - CD, px: 640 });

  /* ---- sample definition: the sieve, the singletons, the two counters ---- */
  const sample = new THREE.Group(); set.add(sample);
  const SIEVE = { x: 3.2, z: 1.5, y: .95 };
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(sample, .025, .03, SIEVE.y, 0x394560, SIEVE.x + sx * .42, 0, SIEVE.z + sz * .32, 8);
  const sieveMat = glow(0x9fd8ff, .8);
  flat(new THREE.TorusGeometry(.5, .03, 8, 40), sieveMat, SIEVE.x, SIEVE.y, SIEVE.z, sample).rotation.x = HALF;
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(.49, 24), new THREE.MeshBasicMaterial({ color: 0x9fd8ff, wireframe: true, transparent: true, opacity: .35 }));
  mesh.rotation.x = -HALF; mesh.position.set(SIEVE.x, SIEVE.y, SIEVE.z); sample.add(mesh);
  flat(rbox(1.0, .05, .8, .02), mat(0x232e4a), SIEVE.x, .025, SIEVE.z, sample);
  const dropName = printed({ THREE, kit, parent: sample, key: 'singletons', lines: [{ text: '76', size: 96, weight: 800, color: '#ffffff' }, { text: 'seen once', size: 52, weight: 700, color: '#aab6cc' }], w: .7, h: .36, x: SIEVE.x + .82, y: .55, z: SIEVE.z, px: 384 });
  const chips = Array.from({ length: 8 }, (_, i) => {
    const m = mat(i === 5 ? AMBER : 0x9aa3b2, i === 5 ? { emissive: AMBER, intensity: .6 } : {}).clone();
    const c = add(sample, rbox(.16, .06, .12, .02), m, 0, 0, 0);
    const b = bars[[2, 3, 2, 3, 0, 3, 4, 1][i]];
    return { c, from: V(b.x + (i % 3 - 1) * .1, y0 - .2, CZ + .3), rest: V(SIEVE.x - .3 + (i % 4) * .2, .08 + Math.floor(i / 4) * .07, SIEVE.z - .1 + (i % 2) * .22), at: T.sieveA + i * T.chipStep };
  });
  // two counters that run down: each shows its number in ten steps (textures made once)
  function counter(key, from, to, caption, x) {
    const g = new THREE.Group(); g.position.set(x, 0, 1.75); sample.add(g);
    flat(rbox(1.3, .78, .05, .03), mat(DEEP), 0, .44, 0, g);
    const edge = glow(TEAL, .9);
    flat(rbox(1.36, .84, .03, .03), edge, 0, .44, -.014, g);
    const steps = Array.from({ length: 9 }, (_, k) => {
      const n = Math.round(from + (to - from) * k / 8);
      const m = printed({ THREE, kit, parent: g, key: `${key}-${k}`, lines: [{ text: n.toLocaleString('en-US'), size: 210, weight: 800, color: '#ffffff' }], w: 1.2, h: .36, x: 0, y: .56, z: .03, px: 512 });
      m.visible = false; return m;
    });
    printed({ THREE, kit, parent: g, key: `${key}-caption`, lines: [{ text: caption, size: 110, weight: 700, color: '#8ff0e6' }], w: 1.2, h: .2, x: 0, y: .22, z: .03, px: 512 });
    return { g, edge, steps };
  }
  const counters = [counter('obs', 3246, 3170, 'observations', .35), counter('dept', 717, 641, 'departments', 1.75)];

  /* ---- degrees of freedom: six year chips, five of them count ---- */
  const dof = new THREE.Group(); set.add(dof);
  const yearChips = Array.from({ length: 6 }, (_, i) => {
    const m = glow(STEEL, .3);
    const c = add(dof, rbox(.24, .1, .24, .03), m, i * .29, .05, 2.42);
    return { c, m, at: T.dof + i * T.dofStep };
  });
  const dofName = printed({ THREE, kit, parent: dof, key: 'dof', lines: [{ text: '6 year effects', size: 78, weight: 700, color: '#aab6cc' }, { text: '5 parameters', size: 92, weight: 800, color: '#ffffff' }], w: 1.2, h: .42, x: 2.18, y: .12, z: 2.4, px: 640 });
  dofName.rotation.x = -HALF + .75;

  /* ---- the failure: a terminal held by a lookup, the queue behind it, the tray ---- */
  const fail = new THREE.Group(); set.add(fail);
  const TERM = { x: .6, z: 1.55 }, TRAY = { x: 3.1, z: 1.72 };
  const term = new THREE.Group(); term.position.set(TERM.x, 0, TERM.z); fail.add(term);
  block(term, .5, .5, .4, 0x26324f, 0, 0, 0, .05);
  flat(rbox(1.25, .86, .08, .04), mat(0x101827), 0, 1.0, 0, term);
  const screenMat = mat(0x10212e, { emissive: TEAL, intensity: .35 }).clone();
  flat(rbox(1.13, .74, .02, .02), screenMat, 0, 1.0, .045, term);
  const spinMat = glow(0x8ff6ff, 1.8);
  const spinner = flat(new THREE.TorusGeometry(.17, .034, 8, 28, Math.PI * 1.5), spinMat, 0, 1.08, .07, term);
  const lookupName = printed({ THREE, kit, parent: term, key: 'lookup', lines: [{ text: 'outside lookup', size: 110, weight: 700, color: '#d9fff7', font: MONO }], w: 1.0, h: .18, x: 0, y: .76, z: .062, px: 640 });
  const stopCross = mark({ THREE, kit, kind: 'cross', material: glow(RED, 2.2), size: .34 }); stopCross.position.set(0, 1.08, .09); term.add(stopCross);
  const buttonMat = glow(RED, .8);
  const button = flat(new THREE.SphereGeometry(.11, 16, 10, 0, Math.PI * 2, 0, HALF), buttonMat, .0, .5, .0, term);
  // the queue rail from the terminal to the tray, with the two commands that never run
  flat(rbox(TRAY.x - TERM.x - .9, .03, .12, .012), mat(0x2a3656), (TERM.x + TRAY.x) / 2 - .05, .25, TERM.z + .1, fail);
  const queued = [0, 1].map(i => {
    const m = mat(0x6d7890).clone(); m.transparent = true;
    const c = add(fail, rbox(.34, .24, .03, .012), m, TERM.x + .95 + i * .42, .42, TERM.z + .1);
    return { c, m };
  });
  const tray = new THREE.Group(); tray.position.set(TRAY.x, 0, TRAY.z); fail.add(tray);
  flat(rbox(2.9, .08, .7, .03), mat(0x232e4a), 0, .04, 0, tray);
  const FILES = [{ lines: ['main.py'], x: -.72 }, { lines: ['157_result', '.json'], x: .72 }];
  const files = FILES.map((f, i) => {
    const slotMat = glow(RED, 0);
    const slot = new THREE.Group(); slot.position.set(f.x, 0, 0); tray.add(slot);
    for (const sx of [-1, 1]) flat(rbox(.03, .74, .03, .01), slotMat, sx * .65, .48, 0, slot);
    for (const sy of [.11, .85]) flat(rbox(1.33, .03, .03, .01), slotMat, 0, sy, 0, slot);
    const card = new THREE.Group(); card.position.set(f.x, 0, 0); tray.add(card);
    add(card, rbox(1.26, .72, .04, .015), mat(0xf2ede0), 0, .48, 0);
    const edge = glow(GREEN, 1.2);
    flat(rbox(1.32, .78, .02, .02), edge, 0, .48, -.02, card);
    printed({ THREE, kit, parent: card, key: `file-${i}`, lines: f.lines.map(text => ({ text, size: f.lines.length > 1 ? 104 : 150, weight: 800, color: '#1f2a3a', font: MONO })), w: 1.16, h: .5, x: 0, y: .48, z: .025, px: 640 });
    const tick = mark({ THREE, kit, kind: 'tick', material: glow(0x58d08c, 1.8), size: .24 }); tick.position.set(.5, 1.0, .02); card.add(tick);
    return { slotMat, card, edge, tick, at: T.write[i], world: V(TRAY.x + f.x, .5, TRAY.z) };
  });

  hand.outputs = { files: ['main.py', '157_result.json'], color: GREEN };
  hand.trajectory = { requests: RUN.requests, calls: RUN.calls, tokens: `${RUN.tok1}k`, crash: 'stalled lookup' };

  /* ---- the shots: [lp, target] — what each visible action aims at ---- */
  const lineEnd = V(x0 + CW, meanY, CZ + .3), sieveTop = V(SIEVE.x, SIEVE.y, SIEVE.z), dofAt = V(.72, .1, 2.42), buttonAt = V(TERM.x, .55, TERM.z + .1);
  const SHOTS = [
    ...bars.map(b => [b.at, V(b.x, y0, CZ + .2)]), [T.lineA, lineEnd], [T.bandA, lineEnd], [T.sieveA, sieveTop], [T.dof, dofAt],
    ...bars.map(b => [b.at2, V(b.x, y0, CZ - .3)]), [T.stop - .012, buttonAt], ...files.map(f => [f.at, f.world]),
  ];

  /* ---- the camera ---- */
  const cam = { from: { pos: [0, 0, 0], look: [0, 0, 0], fov: 33 }, to: { pos: [0, 0, 0], look: [0, 0, 0], fov: 33 } };
  const cp = [0, 0, 0], cl = [0, 0, 0];
  function placeCamera(lp) {
    for (let c = 0; c < 3; c++) { cp[c] = camAt(lp, 'pos', c); cl[c] = camAt(lp, 'look', c); }
    if (layout?.stacked) cl[1] += .2;
    aim(cam.from, cp, cl, camAt(lp, 'fov', 0), camera.aspect); aim(cam.to, cp, cl, camAt(lp, 'fov', 0), camera.aspect);
  }
  placeCamera(0);
  const dummy = new THREE.Object3D(), m4 = new THREE.Matrix4(), muzzle = V();

  return {
    camera: cam,
    update(lp, t, dt, ui) {
      if (reduce) { lp = 1; t = 0; }

      /* the run's two meters */
      const run = lin(lp, T.callsA, T.callsB), nCalls = Math.round(RUN.calls * run);
      ui.set('calls', nCalls);
      for (let i = 0; i < RUN.calls; i++) {
        const born = lin(run * RUN.calls, i, i + 1), k = i < nCalls ? 1 : 0;
        dummy.position.set(mix(TAPE.x0, TAPE.x1, i / (RUN.calls - 1)), .02, TAPE.z);
        dummy.scale.set(k, k * (1 + .8 * (i === nCalls - 1 ? 1 - born : 0)), k); dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
        tape.setMatrixAt(i, dummy.matrix);
      }
      tape.instanceMatrix.needsUpdate = true;
      const fill = Math.max(.001, run * (TUBE.x1 - TUBE.x0));
      tubeFill.scale.x = fill; tubeFill.position.x = TUBE.x0 + fill / 2;
      tubeMat.emissiveIntensity = 1.5 + .3 * Math.sin(t * 2.4);

      /* the robot and its shots */
      walk(lp, where);
      let kick = 0, aimAt = null, shotOn = 0;
      for (const s of SHOTS) {
        const on = window01(lp, s[0] - .004, s[0], s[0] + .004, s[0] + .012);
        if (on > shotOn) { shotOn = on; aimAt = s[1]; }
        kick = Math.max(kick, pulse(lp, s[0], .002, .012));
      }
      rig.root.position.set(where.x - Math.sin(where.yaw) * .06 * kick, 0, where.z - Math.cos(where.yaw) * .06 * kick);
      rig.root.rotation.set(-.1 * kick, where.yaw, 0);
      rig.update(t, where.walking);
      rig.root.updateMatrix(); rig.weapon.updateMatrix();
      m4.multiplyMatrices(rig.root.matrix, rig.weapon.matrix);
      muzzle.set(0, 0, .52).applyMatrix4(m4);
      shot.visible = false;
      if (shotOn > 0 && aimAt) { shot.userData.stretch(muzzle, aimAt, .02 + .02 * shotOn); shot.material.opacity = .75 * shotOn; hitFlash.position.copy(aimAt); }
      muzzleFlash.position.copy(muzzle); muzzleFlash.material.opacity = kick * .9;
      hitFlash.material.opacity = kick * .7;

      /* the chart */
      for (const b of bars) {
        const k = outBack(lin(lp, b.at, b.at + T.barLen), 1.2), len = Math.max(.001, b.len * k);
        b.mesh.scale.y = len; b.mesh.position.y = b.upward ? y0 + len : y0;
        b.m.emissiveIntensity = .2 + 1.5 * pulse(lp, b.at + T.barLen * .7, .003, .02) + .6 * pulse(lp, T.lineB, .004, .03);
        b.label.material.opacity = sm(lin(lp, b.at + .006, b.at + T.barLen));
        const k2 = outBack(lin(lp, b.at2, b.at2 + T.secondLen), 1.2), len2 = Math.max(.001, b.len * k2);
        b.twin.scale.y = len2; b.twin.position.y = b.upward ? y0 + len2 : y0;
        b.m2.opacity = .78 * Math.min(1, k2); b.twin.visible = k2 > 0;
        const tk = outBack(lin(lp, b.tickAt, b.tickAt + .01), 2.2);
        b.tick.scale.setScalar(Math.max(.001, tk)); b.tickMat.emissiveIntensity = 1.6 + 3 * pulse(lp, b.tickAt + .006, .003, .02);
        const lock = pulse(lp, T.lockA, .004, .035);
        b.label.material.color.setRGB(1, 1 - .25 * lock, 1 - .7 * lock);
      }
      sharesName.material.opacity = sm(lin(lp, T.bars[4], T.bars[4] + .02));
      firstName.material.opacity = sm(lin(lp, T.lockA, T.lockA + .012));
      twinName.material.opacity = sm(lin(lp, T.second[0], T.second[0] + .02));
      const line = sm(lin(lp, T.lineA, T.lineB)), ll = Math.max(.001, line * CW);
      meanLine.scale.x = ll; meanLine.position.x = x0 + ll / 2; meanLine.visible = line > 0;
      lineMat.emissiveIntensity = 1.8 + 2.5 * pulse(lp, T.lineB, .004, .03);
      const b1 = sm(lin(lp, T.bandA, T.bandA + .008)), b2 = sm(lin(lp, T.bandA + .008, T.bandB));
      band1.scale.set(CW, Math.max(.001, 2 * 24.89 * UNIT * b1), 1); band1.material.opacity = .16 * b1; band1.visible = b1 > 0;
      band2.scale.set(CW, Math.max(.001, 2 * SE * UNIT * (.9 + .1 * b2)), 1); band2.material.opacity = .12 * b2; band2.visible = b2 > 0;
      const rd = outBack(lin(lp, T.lineA, T.lineA + .025), 1.2);
      readout.position.y = -1.9 * (1 - rd); readout.visible = rd > 0;
      readMean.material.opacity = sm(lin(lp, T.lineB - .005, T.lineB + .008));
      readSe.material.opacity = sm(lin(lp, T.seAt, T.seAt + .01));
      readEdge.emissiveIntensity = 1 + 2.5 * pulse(lp, T.lineB, .004, .03) + 2 * pulse(lp, T.seAt, .004, .03) + 2 * pulse(lp, T.ticks + 5 * T.tickStep, .004, .03) + .12 * Math.sin(t * 2);
      railMat.emissiveIntensity = 1.1 + .15 * Math.sin(t * 1.7);
      zeroName.quaternion.copy(camera.quaternion);

      /* sample definition and degrees of freedom: they clear when the terminal comes */
      const clear = sm(lin(lp, T.clearA, T.clearB));
      const sr = outBack(lin(lp, T.lockA, T.lockA + .022), 1.15);
      sample.position.y = -2.6 * (1 - sr) - 2.6 * clear; sample.visible = sr > 0 && clear < 1;
      if (sample.visible) {
        for (const c of chips) {
          const k = lin(lp, c.at, c.at + T.chipLen), e = sm(lin(k, 0, .62)), fall = sm(lin(k, .62, 1));
          c.c.visible = k > 0;
          c.c.position.lerpVectors(c.from, sieveTop, e); c.c.position.y += Math.sin(Math.PI * e) * .7;
          if (fall > 0) c.c.position.lerpVectors(sieveTop, c.rest, fall);
          c.c.rotation.set(k * 5, k * 3, 0);
          if (k >= 1) c.c.rotation.set(0, .3, 0);
        }
        sieveMat.emissiveIntensity = .8 + 2 * window01(lp, T.sieveA, T.sieveA + .01, T.sieveA + .07, T.sieveA + .09) * (.6 + .4 * Math.sin(t * 20));
        dropName.material.opacity = sm(lin(lp, T.sieveA + .03, T.sieveA + .05)); dropName.quaternion.copy(camera.quaternion);
        const run2 = lin(lp, T.countA, T.countB), step = Math.min(8, Math.floor(run2 * 8 + 1e-6));
        for (const c of counters) {
          c.steps.forEach((m, k) => { m.visible = k === step; });
          c.edge.emissiveIntensity = .9 + 1.2 * (run2 > 0 && run2 < 1 ? 1 : 0) + 2.5 * pulse(lp, T.countB, .004, .03);
        }
      }
      const dr = sm(lin(lp, T.dof - .012, T.dof));
      dof.position.y = -.6 * (1 - dr) - 1.2 * clear; dof.visible = dr > 0 && clear < 1;
      if (dof.visible) {
        yearChips.forEach((y, i) => {
          const k = i === 0 ? 0 : sm(lin(lp, y.at, y.at + .008));
          col.copy(cSteel).lerp(cTeal, k); y.m.color.copy(col); y.m.emissive.copy(col);
          y.m.emissiveIntensity = .3 + 1.2 * k + 2.5 * pulse(lp, y.at + .006, .003, .02) * (i === 0 ? 0 : 1);
          y.c.position.y = .05 + .05 * k;
        });
        dofName.material.opacity = sm(lin(lp, T.dof + 6 * T.dofStep, T.dof + 6 * T.dofStep + .012));
      }

      /* the failure */
      const tr = outBack(lin(lp, T.termA, T.termB), 1.15);
      fail.position.y = -2.6 * (1 - tr); fail.visible = tr > 0;
      if (fail.visible) {
        const stopped = sm(lin(lp, T.stop, T.stop + .008)), stopHit = pulse(lp, T.stop, .003, .03);
        spinner.rotation.z = -(reduce ? 0 : t * 5) * (1 - stopped) - lp * 90 * (1 - stopped);
        spinner.visible = stopped < 1;
        col.copy(cTeal).lerp(cRed, stopped); screenMat.emissive.copy(col); screenMat.emissiveIntensity = .35 + .25 * (1 - stopped) * Math.sin(t * 6) + 1.2 * stopHit;
        stopCross.scale.setScalar(Math.max(.001, outBack(stopped, 2.2)));
        lookupName.material.opacity = .95;
        button.position.y = .5 - .05 * pulse(lp, T.stop - .004, .003, .02);
        buttonMat.emissiveIntensity = .8 + .6 * Math.sin(t * 5) * (1 - stopped) + 3 * stopHit;
        queued.forEach((q, i) => {
          const inK = sm(lin(lp, T.queueA + i * .012, T.queueA + .02 + i * .012)), gone = sm(lin(lp, T.stop + .008, T.stop + .028));
          q.c.visible = inK > 0 && gone < 1;
          q.c.position.x = TERM.x + .95 + i * .42 + (1 - inK) * -.5 + (gone > 0 ? 0 : Math.sin(t * 22 + i * 2) * .012);
          q.c.position.y = .42 - .5 * gone; q.m.opacity = inK * (1 - gone);
        });
        const miss = window01(lp, T.missA, T.missA + .008, T.write[0] - .01, T.write[0]);
        files.forEach((f, i) => {
          const w = lin(lp, f.at, f.at + T.writeLen), e = outBack(w, 1.3), hit = pulse(lp, f.at + T.writeLen * .8, .003, .03);
          const missing = i === 0 ? miss : window01(lp, T.missA, T.missA + .008, T.write[1] - .01, T.write[1]);
          f.slotMat.emissiveIntensity = missing * (1.4 + .9 * Math.sin(t * 10));
          f.slotMat.color.copy(cSteel).lerp(cRed, missing); f.slotMat.emissive.copy(f.slotMat.color);
          f.card.visible = w > 0; f.card.scale.setScalar(Math.max(.001, e)); f.card.position.y = .6 * (1 - sm(w));
          f.edge.emissiveIntensity = 1.2 + 3 * hit;
          f.tick.scale.setScalar(Math.max(.001, outBack(lin(lp, f.at + T.writeLen, f.at + T.writeLen + .01), 2.2)));
        });
      }

      const edgeHit = Math.max(pulse(lp, T.lineB, .004, .03), pulse(lp, T.ticks + 5 * T.tickStep, .004, .03), pulse(lp, T.write[1] + T.writeLen, .004, .04));
      const alarm = window01(lp, T.termB, T.termB + .02, T.stop, T.stop + .02);
      table.rimMat.color.copy(cViolet).lerp(cRed, alarm * (.45 + .25 * Math.sin(t * 6))).lerp(cGreen, pulse(lp, T.write[1] + T.writeLen, .004, .05)); table.rimMat.emissive.copy(table.rimMat.color);
      table.rimMat.emissiveIntensity = 1.1 + .2 * Math.sin(t * 1.6) + 2 * edgeHit;
      tokName.material.opacity = .45 + .55 * run;

      placeCamera(reduce ? .86 : lp);
    },
  };
}

/* agent-run-stage.js — the workshop agent-run.html's run plays in. One long stage along +x: the
 * agent walks from station to station and each step of the run has its own action there.
 *   archive   -15 … -10   55 files; the scan, and every file the run opens lights up
 *   lectern    -8 … -4    the register's six rows; the letter as raw binary, then decoded
 *   plan       -3 … 1     the nine-item plan; six ticks that are only the agent's own claim
 *   wall        2 … 7     the conflict: 70% against 100%, and a memo past the 3 August cutoff
 *   valuation   8 … 13    two ring towers, 30 June and 31 July; the difference is carried to P&L
 *   bench      14 … 21    the five sheets; the crash, the read-back and the repair
 *   press      22 … 27    the report's sections, then the two deliverables in the output tray
 * Everything is a function of p, the position along STEPS: step i plays while p goes from i - 1 to
 * i (the entrance is step 0, from -1), so Back and the rail can land anywhere. Only idle life uses t.
 * Text on the props is numbers, dates and identifiers, so it needs no translation. */

const MONO = '"Space Mono", ui-monospace, monospace', INK = '#eef2f7', AMBER = 0xf2b545, RED = 0xff3348, COOL = 0x7ff6ff, VIOLET = 0xb9a9ff, GREEN = 0x3f9d6a;
const S = 1.5; // the robot's scale
const AT = {
  gate: [-19, 1], a2: [-13.8, 1], a1: [-11.2, 1.1], lectern: [-8.7, 1], plan: [-3.2, .95],
  w1: [2.9, 1], w2: [4.5, 1], w3: [6.2, 1], value: [7.9, 1], bench: [15.9, 1.55], press: [22.3, .95], tray: [25.2, .95],
};
// [step, k from, k to, stand (or null to turn on the spot), what it faces]
const ROUTE = [
  [0, .05, .72, 'a2', [-13.8, -1.5]],
  [1, .1, .42, 'a1', [-11.2, -1.5]],
  [2, .08, .5, 'lectern', [-7.4, -1.3]],
  [3, 0, .12, null, [-5, -1.3]],
  [4, 0, .12, null, [-15, -1]],
  [4, .62, .8, null, [-3.6, -1.2]],
  [5, .02, .42, 'plan', [-1, -1.5]],
  [6, .04, .3, 'w1', [3.2, -1.7]],
  [6, .4, .54, 'w2', [4.6, -1.7]],
  [6, .64, .78, 'w3', [6.1, -1.7]],
  [7, .04, .5, 'plan', [-1, -1.5]],
  [8, .02, .42, 'value', [10, -1.1]],
  [9, .03, .36, 'bench', [18, -1.5]],
  [11, .3, .6, 'press', [23.6, -1]],
  [12, .02, .36, 'bench', [16.6, -1.5]],
  [14, .18, .62, 'tray', [26.6, -.6]],
];
// Each step's closing shot: look at x, y, z; distance, elevation, azimuth; field of view.
const SHOTS = [
  [-12.4, 1.15, -1, 12.5, .22, -.12, 30], [-12.3, 1.1, -.8, 11.5, .28, .14, 30], [-7, 1, -.7, 11.5, .24, .08, 30], [-6.5, 1, -.8, 10.5, .18, .24, 30],
  [-7, 1.3, -.5, 12.5, .52, -.2, 30], [-1.8, 1.15, -.7, 10.5, .24, -.15, 30], [4.4, 1.15, -.6, 11, .26, .1, 30], [-1.8, 1.15, -.7, 10.5, .18, .2, 30],
  [10.3, 1.15, -.5, 11.5, .28, -.12, 30], [18, 1.15, -.6, 12.5, .3, .05, 30], [17.6, 1.1, -.5, 10, .16, -.2, 30], [21, 1, -.5, 14.5, .28, -.1, 30],
  [17.9, 1.1, -.7, 10, .18, .18, 30], [18.2, 1.2, -.6, 11, .28, -.05, 30], [25, 1.05, -.2, 12.5, .4, -.32, 30],
];
// File types of the files each step opens, as the record has them: 0 CSV, 1 DOCX.
const OPENS = { 2: [0, 1], 3: [0, 0], 4: [0, 0, 0, 0], 6: [1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 8: [0, 0] };

export async function build({ THREE, kit, set, util, camera, errLight, makeRobot, weapon }) {
  const { PALETTE, GUN_HOLD, add, cyl, ball, block, rbox, mat, glowMat, labelTexture } = kit;
  const { clamp, smooth, ramp, lerp, glowSprite } = util;
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const backEase = (x, s = 1.7) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
  const bump = (x, a, b, c) => ramp(x, a, b) * (1 - ramp(x, b, c));
  const additive = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, ...extra });
  const line = (text, size, color = INK, o = {}) => ({ text, size, color, font: MONO, weight: 700, ...o });
  const rig = new THREE.Group(); set.add(rig);
  let p = -1;
  const K = i => clamp(p - (i - 1));                    // step i's own progress, 0..1
  const win = (i, a, b) => clamp((K(i) - a) / (b - a));
  const facing = [];
  function plate(key, lines, w, h, parent, x = 0, y = 0, z = 0, face = false, pixels = 1024) {
    const tex = labelTexture(`ar-${key}`, lines, { width: pixels, height: Math.max(64, Math.round(pixels * h / w)) });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.position.set(x, y, z); parent.add(m); if (face) facing.push(m);
    return m;
  }
  const fade = (m, o) => { m.visible = o > .01; m.material.opacity = clamp(o); };
  const pop = (obj, k) => { obj.visible = k > .001; obj.scale.setScalar(Math.max(.001, backEase(k))); };
  const rise = (obj, k, from = -2.6) => { obj.visible = k > 0; obj.position.y = lerp(from, 0, backEase(k, 1.1)); };

  /* ---- the floor: one long slab, a walkway along the front, a pad under each station ---- */
  block(rig, 50, .3, 8, 0x1c2740, 5, -.3, -.4, .14);
  block(rig, 50.6, .5, 8.5, 0x111a2d, 5, -.8, -.4, .14);
  [[3.62, 49.6], [-4.42, 49.6]].forEach(([z, w]) => block(rig, w, .012, .035, glowMat(0x6f86c8, 1), 5, .001, z, .004).castShadow = false);
  block(rig, 49, .006, .62, mat(0x24314f), 5, .002, 1, .002).castShadow = false;
  const PADS = [[-12.8, 3.4, 0x45b5b0], [-6.2, 2.7, 0x7d6ad8], [-1, 2.3, AMBER], [4.6, 2.7, 0xe2667a], [10.6, 2.6, 0x6aa8e8], [17.8, 3.8, GREEN], [24.6, 2.9, AMBER]];
  const pads = PADS.map(([x, r, c]) => {
    const m = add(rig, new THREE.TorusGeometry(r, .022, 8, 96), additive(c, .2), x, .012, -.55, false); m.rotation.x = Math.PI / 2; m.scale.z = .2;
    return { m, x, r };
  });

  /* ---- the gate into the sandbox, and the rubric sealed outside the fence ---- */
  const arch = add(rig, new THREE.TorusGeometry(1.9, .09, 12, 48, Math.PI), mat(0x2b3a5e, { rough: .5 }), -17.6, 0, 1, true); arch.rotation.y = Math.PI / 2;
  const archGlow = add(rig, new THREE.TorusGeometry(1.76, .018, 8, 48, Math.PI), glowMat(0x8ff6ff, 1.4), -17.6, 0, 1, false); archGlow.rotation.y = Math.PI / 2;
  plate('gate', [line('FIN-T1-003', 150, '#8ff6ff')], 1.6, .3, rig, -17.5, 2.25, 1, true);
  const fence = new THREE.Mesh(new THREE.PlaneGeometry(49, 2.6), additive(0x6f86c8, .05, { side: THREE.DoubleSide })); fence.position.set(5, 1.3, -4.35); rig.add(fence);
  const rubric = new THREE.Group(); rubric.position.set(-11.5, 0, -6.1); rig.add(rubric);
  cyl(rubric, .5, .6, .9, 0x1c2740, 0, 0, 0, 24); cyl(rubric, .34, .34, .62, mat(0x6f86c8, { rough: .4 }), 0, .9, 0, 24);
  const seals = [0, 1].map(n => { const r = add(rubric, new THREE.TorusGeometry(.42, .03, 8, 40), glowMat(AMBER, 1.2), 0, 1.05 + n * .3, 0, false); r.rotation.x = Math.PI / 2; return r; });
  const rubricTag = plate('rubric', [line('RUBRIC · 27', 130, '#f2b545')], 1.3, .26, rubric, 0, 2.05, 0, true);

  /* ---- the archive: 55 files, by type, each a function of when the run opens it ---- */
  const TYPE = [0x45b5b0, 0x7d6ad8, AMBER, 0x9aa3b2];
  const unread = TYPE.map(c => mat(c, { emissive: c, intensity: .08 })), read = TYPE.map(c => mat(c, { emissive: c, intensity: 1.15 }));
  const FILE = rbox(.62, .05, .44, .02);
  const PILES = [[-15.3, -1.5, 9, 0], [-14.4, -1.5, 9, 0], [-13.3, -1.7, 14, 1], [-12.2, -1.7, 14, 1], [-11.1, -1.5, 8, 2], [-10.2, -1.3, 1, 3]];
  const files = [];
  PILES.forEach(([x, z, n, type]) => { for (let j = 0; j < n; j++) { const m = add(rig, FILE, unread[type], x, 0, z); m.rotation.y = (files.length * 2.399 % 1 - .5) * .14; files.push({ m, type, y: .03 + j * .062, i: files.length, flown: null }); } });
  const COUNTS = [['csv', 'CSV 18', -14.85, 0x45b5b0], ['doc', 'DOCX 28', -12.75, 0x7d6ad8], ['pdf', 'PDF/HTML 8', -11.1, AMBER], ['log', 'LOG 1', -10.2, 0x9aa3b2]]
    .map(([key, text, x, c]) => plate(`count-${key}`, [line(text, 130, `#${c.toString(16).padStart(6, '0')}`)], 1.25, .26, rig, x, 1.5, -1.5, true));
  const scan = add(rig, new THREE.TorusGeometry(1, .02, 8, 72), additive(COOL, 0), -12.8, .4, -1.5, false); scan.rotation.x = Math.PI / 2;
  const folder = plate('output', [line('OUTPUT', 130, '#8ff6ff')], 1.5, .3, rig, 0, 0, 0, true);

  /* ---- the files that fly: from their pile to where the step needs them ---- */
  const flights = [];
  const nextFile = type => files.find(f => f.type === type && !f.flown);
  function fly(step, a, b, type, to, { lift = 2, hideAt = 2 } = {}) {
    const src = nextFile(type); src.flown = step;
    flights.push({ step, a, b, hideAt, lift, src, to, from: V(src.m.position.x, src.y, src.m.position.z), m: add(rig, FILE, read[type]) });
  }
  const LEFT_TABLE = V(-3.75, .5, -1.3), EVIDENCE = V(2.3, .05, -.7), VALUE_STAND = V(8.4, .45, -2);
  fly(2, .02, .44, OPENS[2][0], V(-7.4, 1.1, -1.05), { hideAt: .62 }); fly(2, .06, .5, OPENS[2][1], V(-5, 1.1, -1.05), { hideAt: .76 });
  OPENS[3].forEach((t, j) => fly(3, .6 + j * .06, .9 + j * .03, t, LEFT_TABLE.clone().setY(.5 + j * .06)));
  OPENS[4].forEach((t, j) => fly(4, .24, .68, t, LEFT_TABLE.clone().setY(.62 + j * .06).setX(LEFT_TABLE.x + (j % 2 ? .02 : -.02)), { lift: 3.2 }));
  OPENS[6].forEach((t, j) => fly(6, .04 + j * .022, .2 + j * .022, t, EVIDENCE.clone().setY(.05 + j * .058), { lift: 2.6 }));
  OPENS[8].forEach((t, j) => fly(8, .2 + j * .04, .52 + j * .04, t, VALUE_STAND.clone().setY(.45 + j * .06), { lift: 3 }));

  /* ---- the lectern: the register and the letter ---- */
  const table = (x, z) => { block(rig, 1.3, .06, .8, 0x8a5f3f, x, .42, z, .03); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => block(rig, .07, .42, .07, 0x5d3e2a, x + a * .55, 0, z + b * .32, .02)); };
  table(LEFT_TABLE.x, LEFT_TABLE.z);
  const register = new THREE.Group(); register.position.set(-7.4, 0, -1.3); rig.add(register);
  block(register, 2.4, .1, .5, 0x26345a, 0, 0, 0, .04); block(register, 2.3, 1.85, .06, 0x16233c, 0, .1, -.05, .04);
  const ENTRIES = ['D01  HR-01     3,118,484.29', 'D02  HR-03     4,480,000.00', 'D03  HR-01       283,416.56', 'D04  HKSub               —', 'D05  USSub     6,000,000.00', 'D06  IRS-0031     35,371.91'];
  const regRows = ENTRIES.map((text, i) => plate(`entry-${i}`, [line(text, 74)], 2.1, .22, register, 0, 1.68 - i * .24, -.015));
  const unposted = plate('unposted', [line('6 UNPOSTED', 92, '#f2b545')], 1.4, .22, register, 0, .3, -.015);
  // the letter: a shader that resolves from noise to its printed page as uDecode goes 0..1
  const letter = new THREE.Group(); letter.position.set(-5, 0, -1.3); rig.add(letter);
  block(letter, 1.5, .1, .5, 0x26345a, 0, 0, 0, .04); block(letter, 1.4, 1.85, .06, 0xf6efe0, 0, .1, -.05, .04);
  const printed = labelTexture('ar-letter', [line('60', 150, '#2c5468'), line('D01 – D06', 104, '#1f2a3a'), line('REPLACE', 84, '#555f70'), line('KEEP', 84, '#555f70'), line('REJECT', 84, '#555f70')], { width: 768, height: 1024, bg: '#f6efe0' });
  const letterMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: printed }, uDecode: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;uniform sampler2D uMap;uniform float uDecode,uTime;
      float h(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
      void main(){ vec2 c=floor(vUv*vec2(48.,64.)); float n=h(c+floor(uTime*14.));
        vec3 noise=mix(vec3(.05,.07,.13),vec3(.55,.62,.8),step(.55,n));
        float edge=1.-uDecode*1.1; vec4 t=texture2D(uMap,vUv);
        float on=smoothstep(edge-.02,edge+.02,1.-vUv.y)*step(.001,uDecode);
        vec3 col=mix(noise,t.rgb,on)+vec3(.4,.9,1.)*(1.-smoothstep(0.,.03,abs(1.-vUv.y-edge)))*step(.001,uDecode)*step(uDecode,.98);
        gl_FragColor=vec4(pow(col,vec3(2.2)),1.);}`,
  });
  const page = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.72), letterMat); page.position.set(0, 1.05, -.015); letter.add(page);
  const binaryTag = plate('binary', [line('UNREADABLE', 96, '#e2667a')], 1.3, .22, letter, 0, 2.2, 0, true);
  const docxTag = plate('python-docx', [line('READABLE', 96, '#8ff6ff')], 1.2, .24, letter, 0, 2.2, 0, true);
  const decoder = add(rig, new THREE.TorusGeometry(.42, .026, 8, 48), additive(COOL), 0, 0, 0, false);

  /* ---- the plan board, and the valuation file nothing has opened yet ---- */
  const boardG = new THREE.Group(); boardG.position.set(-1, 0, -1.5); rig.add(boardG);
  block(boardG, 3.3, 2.75, .08, 0x16233c, 0, .05, -.05, .05);
  const NAMES = ['READ', 'D01', 'D02', 'D03', 'D04', 'D05', 'D06', 'XLSX', 'DOCX'];
  const tickAmber = glowMat(AMBER, 1.3), tickGreen = glowMat(0x4ade80, 1.3), tickBox = mat(0x2b3a5e);
  const planRows = NAMES.map((name, i) => {
    const g = new THREE.Group(); g.position.set(-1, 2.5 - i * .27, .02); boardG.add(g);
    block(g, .17, .17, .02, tickBox, 0, -.085, 0, .02).castShadow = false;
    const tick = new THREE.Group(); tick.position.z = .03; g.add(tick);
    const a = block(tick, .04, .09, .012, tickAmber, -.03, -.05, 0, .006), b = block(tick, .04, .19, .012, tickAmber, .04, -.08, 0, .006);
    a.rotation.z = .7; b.rotation.z = -.6; a.castShadow = b.castShadow = false;
    const text = plate(`plan-${i}`, [line(name, 118)], .95, .2, g, .72, 0, 0);
    return { g, tick, parts: [a, b], text };
  });
  const crate = new THREE.Group(); crate.position.set(1.45, 0, -1.3); rig.add(crate);
  [0, 1, 2, 3, 4].forEach(j => block(crate, .62 - (j % 2) * .04, .1, .44, 0x1b2438, 0, j * .12, 0, .02));
  plate('crate', [line('IRS-2026-0031', 92, '#7a869c')], 1.3, .2, crate, 0, 1.25, 0, true);
  const crateQ = plate('crate-q', [line('?', 420, '#f2b545')], .5, .5, crate, 0, .88, 0, true);

  /* ---- the evidence wall ---- */
  const wall = new THREE.Group(); wall.position.set(4.6, 0, -1.8); rig.add(wall);
  block(wall, 4.8, 2.7, .1, 0x1b2438, 0, 0, -.05, .05);
  const doc = (key, x, big, small, color) => {
    const g = new THREE.Group(); g.position.set(x, 1.4, .05); wall.add(g);
    block(g, 1.05, 1.4, .03, 0xf6efe0, 0, -.7, 0, .03);
    plate(`${key}-no`, [line(small, 110, '#5a6578')], .9, .2, g, 0, .48, .02);
    plate(`${key}-big`, [line(big, 280, color)], .95, .55, g, 0, -.05, .02);
    ball(g, .05, mat(RED, { emissive: RED, intensity: .9 }), 0, .62, .04, 12);
    return g;
  };
  const docs = [doc('d40', -1.65, '70%', 'No. 40', '#1d6b67'), doc('d32', -.3, '100%', 'No. 32', '#94640f'), doc('d42', 1.5, '8/4', 'No. 42', '#be123c')];
  const thread = add(wall, new THREE.CylinderGeometry(.012, .012, 1, 6), new THREE.MeshBasicMaterial({ color: 0xff4358, toneMapped: false }), 0, 2, .12, false); thread.rotation.z = Math.PI / 2;
  const notEqual = plate('neq', [line('≠', 340, '#ff5a6d')], .5, .5, wall, -.97, 1.42, .12);
  const cutoff = block(wall, .03, 2.5, .02, glowMat(AMBER, 1.5), .68, .08, .07, .006); cutoff.castShadow = false;
  const cutoffTag = plate('cutoff', [line('8/3 18:00', 110, '#f2b545')], 1.1, .22, wall, .68, 2.74, .1);
  const stamp = plate('stamp', [line('AFTER CUTOFF', 120, '#ff5a6d')], 1.3, .26, wall, 1.5, .72, .14); stamp.rotation.z = .16;

  /* ---- the valuation: two ring towers, and the July difference that is carried to P&L ---- */
  const RING = new THREE.CylinderGeometry(.42, .42, .045, 30), steel = mat(0x8ea3cc, { rough: .4 }), hot = glowMat(VIOLET, 1.1);
  const towerRings = (parent, x, z, n, m, y0 = 0) => Array.from({ length: n }, (_, j) => add(parent, RING, m, x, y0 + .03 + j * .05, z));
  const towerA = towerRings(rig, 9.1, -1.1, 13, steel), towerB = towerRings(rig, 10.5, -1.1, 13, steel);
  const delta = new THREE.Group(); rig.add(delta); const towerD = towerRings(delta, 0, 0, 31, hot);
  const tag0630 = plate('v0630', [line('06-30', 100, '#9fb1c9'), line('−1,277,351.45', 104)], 1.7, .5, rig, 9.1, 1.25, -1.1, true);
  const tag0731 = plate('v0731', [line('07-31', 100, '#9fb1c9'), line('−4,395,835.74', 104)], 1.7, .5, rig, 10.5, 2.95, -1.1, true);
  const tagDelta = plate('vdelta', [line('−3,118,484.29', 120, '#c9bcff')], 1.8, .3, delta, 0, 1.95, 0, true);
  const RESERVE = V(12.5, 0, -1.7), PNL = V(12.5, 0, .45);
  const pad = (key, at, c, text) => { const r = add(rig, new THREE.TorusGeometry(.62, .03, 8, 48), glowMat(c, 1), at.x, .02, at.z, false); r.rotation.x = Math.PI / 2; plate(key, [line(text, 170, `#${c.toString(16).padStart(6, '0')}`)], 1.1, .28, rig, at.x, .32, at.z + .75, true); return r; };
  pad('reserve', RESERVE, 0x9aa3b2, 'RESERVE'); const pnlPad = pad('pnl', PNL, 0x4ade80, 'P&L');
  const reserveX = plate('x', [line('✕', 400, '#ff5a6d')], .9, .9, rig, RESERVE.x, 1.1, RESERVE.z, true);

  /* ---- the bench: the terminal and five sheets, each a slab whose bars are its rows ---- */
  const desk = new THREE.Group(); desk.position.set(16, 0, -.45); rig.add(desk);
  block(desk, 1.5, .07, .8, 0x8a5f3f, 0, .5, 0, .03); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => block(desk, .08, .5, .08, 0x5d3e2a, a * .65, 0, b * .32, .02));
  const term = kit.terminal(PALETTE.violet); term.root.position.set(0, .58, 0); term.root.scale.setScalar(2.6); desk.add(term.root);
  const screenMat = term.screen.material.clone(); term.screen.material = screenMat;
  const nameError = plate('nameerror', [line('NameError', 170, '#ff5a6d')], 1.8, .42, desk, .2, 2.85, -.4, true);
  const SLABS = [{ x: 16.6, base: 3, full: 39 }, { x: 17.65, base: 21, full: 39 }, { x: 18.7, base: 18, full: 50 }, { x: 19.75, base: 16, full: 47 }, { x: 20.8, base: 23, full: 23 }];
  const ROW_GEO = new THREE.PlaneGeometry(.68, .02), matrix = new THREE.Matrix4(), rowAt = (out, i, dy = 0, spin = 0) => out.makeRotationZ(spin).setPosition(0, 2 - i * .037 + dy, .036);
  SLABS.forEach((s, n) => {
    s.g = new THREE.Group(); s.g.position.set(s.x, 0, -1.6); rig.add(s.g);
    s.back = new THREE.MeshStandardMaterial({ color: 0x1e3a2f, emissive: RED, emissiveIntensity: 0, roughness: .7 });
    add(s.g, rbox(.86, 2.1, .06, .04), s.back, 0, 1.05, 0);
    s.rows = new THREE.InstancedMesh(ROW_GEO, new THREE.MeshBasicMaterial({ color: 0x8ff0bb, toneMapped: false }), 50); s.rows.frustumCulled = false; s.rows.count = 0; s.g.add(s.rows);
    for (let i = 0; i < 50; i++) s.rows.setMatrixAt(i, rowAt(matrix, i));
    plate(`sheet-${n}`, [line(String(n + 1), 400, '#8ff0bb')], .24, .24, s.g, 0, 2.28, .04);
    if (n < 2) { s.crack = plate('crack', [line('/\\/\\/', 200, '#ff3348')], .8, 1.5, s.g, 0, 1.05, .05); s.crack.rotation.z = 1.2; s.crack.material.blending = THREE.AdditiveBlending; s.done = plate(`enh-${n}`, [line(`Sheet ${n + 1} enhanced`, 84, '#8ff6ff')], 1.5, .22, s.g, 0, 2.62, .1, true); }
    s.fell = false;
  });
  const threeRows = plate('3rows', [line('3 rows', 150, '#ff5a6d')], 1.1, .3, rig, 16.6, 2.72, -1.5, true);
  const thirtyNine = plate('39rows', [line('39 rows', 150, '#8ff0bb')], 1.2, .3, rig, 16.6, 2.72, -1.5, true);
  const sweep = add(rig, new THREE.PlaneGeometry(.07, 2.5), additive(COOL, 0), 16, 1.2, -1.5, false);
  const sparks = Array.from({ length: 14 }, (_, i) => { const s = glowSprite(i % 2 ? 0xffb347 : RED, .16, 0); s.visible = false; rig.add(s); return { s, a: i * 2.399, up: .7 + (i * 7 % 5) * .25, out: .8 + (i * 3 % 4) * .4 }; });

  /* ---- the press and the output tray ---- */
  const REPORT = V(23.7, 0, -1);
  const sections = ['D01', 'D02', 'D03', 'D04', 'D05', 'D06'].map((name, i) => {
    const g = new THREE.Group(); rig.add(g); block(g, 1.05, .05, 1.35, 0xf6efe0, 0, -.025, 0, .02);
    const face = plate(`sec-${i}`, [line(name, 300, '#2c5468')], .9, .36, g, 0, .03, 0); face.rotation.x = -Math.PI / 2;
    return g;
  });
  const cover = new THREE.Group(); rig.add(cover); block(cover, 1.12, .07, 1.42, 0x2c5468, 0, -.035, 0, .02);
  const coverFace = plate('docx', [line('DOCX', 300, '#ffffff')], .9, .36, cover, 0, .045, 0); coverFace.rotation.x = -Math.PI / 2;
  const tray = new THREE.Group(); tray.position.set(26.6, 0, -.6); rig.add(tray);
  cyl(tray, 1.35, 1.5, .2, 0x26345a, 0, 0, 0, 40);
  const trayRing = add(tray, new THREE.TorusGeometry(1.42, .03, 8, 72), glowMat(0x8ff6ff, 1), 0, .21, 0, false); trayRing.rotation.x = Math.PI / 2;
  plate('tray', [line('OUTPUT', 130, '#8ff6ff')], 1.5, .3, tray, 0, .55, 1.65, true);
  const twoFiles = plate('tray-2', [line('2 files', 140, '#4ade80')], 1.1, .3, tray, 0, 2.15, 0, true);
  const xlsx = new THREE.Group(); rig.add(xlsx); add(xlsx, rbox(1.05, .34, .85, .05), mat(GREEN, { emissive: GREEN, intensity: .25 }));
  const xlsxFace = plate('xlsx', [line('XLSX', 300, '#ffffff')], .8, .3, xlsx, 0, .18, 0); xlsxFace.rotation.x = -Math.PI / 2;

  /* ---- the agent, its holster and its lens ---- */
  const bot = makeRobot(), root = bot.root; root.rotation.order = 'YXZ'; root.scale.setScalar(S); rig.add(root);
  let eyeMat = null; root.traverse(o => { if (o.isMesh && o.material?.emissiveIntensity >= 2 && !eyeMat) eyeMat = o.material; });
  const eyeBase = eyeMat?.emissive.clone(), redC = new THREE.Color(RED);
  const gun = weapon() || kit.blaster(AMBER); gun.scale.setScalar(.6); root.add(gun);
  const qHold = new THREE.Quaternion().setFromEuler(GUN_HOLD.turn), qBack = new THREE.Quaternion().setFromEuler(new THREE.Euler(-1.25, 0, .22)), BACK = V(.02, .62, -.3);
  const handLens = kit.lens(AMBER); handLens.scale.setScalar(1.15); handLens.position.set(.24, .62, .34); root.add(handLens);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(2.9, 48), additive(0xffffff, .34, { map: glowSprite(0xffffff, 1).material.map })); pool.rotation.x = -Math.PI / 2; rig.add(pool);
  const ping = add(rig, new THREE.TorusGeometry(.5, .016, 6, 56), additive(VIOLET, 0), 0, 0, 0, false); ping.rotation.x = Math.PI / 2;
  const reqTex = labelTexture('ar-req', [line('R0', 300, '#e9e3ff')], { width: 512, height: 256 });
  const reqTag = new THREE.Mesh(new THREE.PlaneGeometry(.72, .36), new THREE.MeshBasicMaterial({ map: reqTex, transparent: true, depthWrite: false })); rig.add(reqTag); facing.push(reqTag);
  const question = plate('q', [line('?', 420, '#f2b545')], .52, .52, rig, 0, 0, 0, true), alarm = plate('bang', [line('!', 420, '#ff5a6d')], .52, .52, rig, 0, 0, 0, true);
  const muzzleFlash = glowSprite(0xd9ccff, .7, 0); rig.add(muzzleFlash);
  const bolts = Array.from({ length: 6 }, () => Array.from({ length: 8 }, (_, j) => { const s = glowSprite(0xffffff, .3 - j * .028, 0); s.visible = false; rig.add(s); return s; }));
  // the context follows the agent: a hovering tower of rings, 27k to 100k tokens
  const follower = new THREE.Group(); rig.add(follower);
  const RINGS = 26, ringMesh = new THREE.InstancedMesh(new THREE.TorusGeometry(.2, .03, 8, 28), glowMat(VIOLET, .9), RINGS); ringMesh.frustumCulled = false; follower.add(ringMesh);
  for (let i = 0; i < RINGS; i++) ringMesh.setMatrixAt(i, matrix.makeRotationX(Math.PI / 2).setPosition(0, .35 + i * .075, 0));
  const tokTex = labelTexture('ar-tok', [line('27k', 300, '#ffffff')], { width: 512, height: 256 });
  const tokTag = new THREE.Mesh(new THREE.PlaneGeometry(.7, .35), new THREE.MeshBasicMaterial({ map: tokTex, transparent: true, depthWrite: false })); follower.add(tokTag); facing.push(tokTag);

  /* ---- the route, flattened to global p ---- */
  const standOf = key => AT[key];
  const legs = []; { let at = AT.gate, face = [-13, 0]; ROUTE.forEach(([step, a, b, key, look]) => { const to = key ? standOf(key) : at; legs.push({ p0: step - 1 + a, p1: step - 1 + b, from: at, to, face0: face, face1: look, walk: !!key }); at = to; face = look; }); }
  const angleTo = (x0, z0, [x, z]) => Math.atan2(x - x0, z - z0);
  const wrap = a => a - Math.round(a / (Math.PI * 2)) * Math.PI * 2;
  function pose(q, out) { // where the agent is at p = q, and which way it is looking
    let leg = null, hold = legs[0];
    if (q <= legs[0].p0) { out.x = legs[0].from[0]; out.z = legs[0].from[1]; out.yaw = angleTo(out.x, out.z, legs[0].face0); out.walk = 0; return out; }
    for (const l of legs) { if (q >= l.p0 && q < l.p1) leg = l; if (q >= l.p1) hold = l; }
    if (!leg) { out.x = hold.to[0]; out.z = hold.to[1]; out.yaw = angleTo(out.x, out.z, hold.face1); out.walk = 0; return out; }
    const k = (q - leg.p0) / (leg.p1 - leg.p0), e = smooth(k);
    out.x = lerp(leg.from[0], leg.to[0], e); out.z = lerp(leg.from[1], leg.to[1], e);
    const a0 = angleTo(leg.from[0], leg.from[1], leg.face0), a1 = angleTo(leg.to[0], leg.to[1], leg.face1);
    if (!leg.walk) { out.yaw = a0 + wrap(a1 - a0) * e; out.walk = 0; return out; }
    const heading = Math.atan2(leg.to[0] - leg.from[0], leg.to[1] - leg.from[1]);
    const inb = ramp(k, 0, .18), out_ = 1 - ramp(k, .82, 1);
    out.yaw = k < .5 ? a0 + wrap(heading - a0) * inb : a1 + wrap(heading - a1) * out_;
    out.walk = inb * out_;
    return out;
  }

  const me = { x: 0, z: 0, yaw: 0, walk: 0 }, trail = { x: 0, z: 0, yaw: 0, walk: 0 };
  const muzzle = V(), a3 = V(), b3 = V(), c3 = V(), tmp = V(), headAt = V(), shake = V();
  let usedBolts = 0, kick = 0;
  function bolt(q, to, color = 0xb9a9ff, lift = .55) {
    if (q <= 0 || q >= 1 || usedBolts >= bolts.length) return;
    const trailSprites = bolts[usedBolts++];
    kick = Math.max(kick, 1 - q);
    trailSprites.forEach((s, j) => {
      const u = q - j * .05;
      s.visible = u > 0; if (!s.visible) return;
      c3.copy(muzzle).lerp(to, .5); c3.y += lift;
      a3.copy(muzzle).lerp(c3, u); b3.copy(c3).lerp(to, u);
      s.position.copy(a3).lerp(b3, u); s.material.color.setHex(color); s.material.opacity = (1 - j / 8) * .95;
    });
  }

  const shot = { pos: [0, 0, 0], look: [0, 0, 0], fov: 30 };
  const shotOf = (i, out) => { const [x, y, z, d, el, az, fov] = SHOTS[i]; out.look = [x, y, z]; out.pos = [x + d * Math.sin(az) * Math.cos(el), y + d * Math.sin(el), z + d * Math.cos(az) * Math.cos(el)]; out.fov = fov; return out; };
  const s0 = { pos: 0, look: 0, fov: 0 }, s1 = { pos: 0, look: 0, fov: 0 };
  const api = {
    shot, dim: 0,
    update(pos, t, dt, live) {
      p = pos;
      usedBolts = 0; kick = 0;

      /* the agent: where it is, what it holds, how it stands */
      pose(p, me); pose(p - .06, trail);
      const crash = K(10), knock = bump(crash, .42, .47, .86), err = ramp(crash, .42, .46) * (1 - ramp(K(13), .2, .55));
      const hop = Math.sin(Math.PI * win(7, .86, 1)) * .34;
      const down = ramp(K(14), .82, .98);
      const away = knock * .75;
      root.position.set(me.x - Math.sin(me.yaw) * away, hop, me.z - Math.cos(me.yaw) * away);
      // at rest it always stands three-quarters on to the camera, so the face and the harness show
      const camYaw = Math.atan2(shot.pos[0] - me.x, shot.pos[2] - me.z), off = wrap(me.yaw - camYaw), yaw = lerp(camYaw + clamp(off, -.85, .85), me.yaw, me.walk);
      root.rotation.y = yaw; root.rotation.x = -knock * .32 + K(12) * (1 - K(13)) * .12 + down * .1; root.rotation.z = Math.sin(t * 40) * .02 * knock;
      const drawn = (1 - me.walk) * (1 - down) * ramp(p, -.2, 0);
      bot.grip(drawn);
      bot.update(t, me.walk);
      gun.position.lerpVectors(BACK, GUN_HOLD.at, drawn); gun.quaternion.copy(qBack).slerp(qHold, drawn);
      // the head: reads what the agent is working on; hangs when it powers down
      if (me.walk < .5) bot.head.rotation.y = Math.sin(t * .7) * .08; bot.head.rotation.x = -me.walk * .06 + down * .38 + knock * -.3 + K(12) * (1 - K(13)) * .22;
      handLens.visible = win(12, .36, .42) > 0 && K(13) <= 0; handLens.position.y = .66 + Math.sin(t * 1.4) * .02;
      if (eyeMat) { eyeMat.emissive.copy(eyeBase).lerp(redC, err * .9); eyeMat.emissiveIntensity = 2.2 * (1 - down * .7); }
      root.updateMatrixWorld(true);
      gun.localToWorld(muzzle.set(0, 0, .52));
      headAt.set(me.x, 1.55 * S + hop, me.z);
      pool.position.set(me.x, .018, me.z);

      const padNear = x => Math.exp(-Math.pow((x - me.x) / 3.2, 2));
      pads.forEach(d => { d.m.material.opacity = .08 + .62 * padNear(d.x); });

      /* the context and the current request */
      follower.position.set(trail.x - 1.05, Math.sin(t * 1.5) * .05, trail.z - .35);
      ringMesh.count = Math.round(clamp(live.tok / 100) * RINGS);
      tokTag.position.set(0, .55 + ringMesh.count * .075, 0);
      const toks = `${Math.round(live.tok)}k`; if (tokTex.userData.shown !== toks) { tokTex.userData.shown = toks; tokTex.userData.redraw([line(toks, 300, '#ffffff')]); }
      const req = `R${Math.round(live.req)}`; if (reqTex.userData.shown !== req) { reqTex.userData.shown = req; reqTex.userData.redraw([line(req, 300, '#e9e3ff')]); }
      reqTag.position.copy(headAt).setY(headAt.y + .55); reqTag.visible = live.req > .5;
      const f = clamp(p - Math.floor(p)), pulse = Math.pow(1 - clamp(f / .22), 2) * (p > 0 && p <= 14 ? 1 : 0);
      ping.position.copy(headAt); ping.scale.setScalar(.4 + (1 - pulse) * 2.2); ping.material.opacity = pulse * .85;
      fade(question, bump(K(2), .84, .94, 1.3) * (1 - win(3, .1, .22))); question.position.copy(headAt).setY(headAt.y + .62);
      fade(alarm, ramp(K(12), .78, .86) * (1 - ramp(K(13), .05, .18))); alarm.position.copy(headAt).setY(headAt.y + .62);
      if (question.visible || alarm.visible || down > .5 || (K(10) > .4 && K(11) < .25)) reqTag.visible = false;

      /* step 0: the files arrive; step 1: the scan and mkdir */
      files.forEach(f2 => {
        const k = win(0, .22 + f2.i * .011, .42 + f2.i * .011), fp = f2.m.position;
        f2.m.visible = k > 0; fp.y = f2.y + (1 - backEase(k, .8)) * 5.5;
        const q = f2.flown === null ? 0 : K(f2.flown);
        const wanted = q > .01 ? read[f2.type] : unread[f2.type]; if (f2.m.material !== wanted) f2.m.material = wanted;
      });
      rubricTag.visible = true; seals.forEach((r, n) => { r.rotation.z = t * (n ? -.5 : .4); });
      const sc = win(1, .1, .62); scan.material.opacity = bump(sc, 0, .15, 1) * .9; scan.scale.setScalar(.6 + sc * 3.5); scan.position.y = .3 + sc * 1.5;
      COUNTS.forEach((m, n) => fade(m, ramp(K(1), .36 + n * .08, .46 + n * .08) * (1 - ramp(K(2), .05, .2))));
      const mk = win(1, .68, .98); fade(folder, bump(mk, 0, .2, 1)); folder.position.set(lerp(me.x + .6, me.x + 9, mk * mk), 2.2, me.z);
      bolt(win(1, .14, .4), tmp.set(-12.8, .9, -1.6), 0x8ff6ff); bolt(win(1, .66, .84), tmp.set(me.x + 6, 2.2, me.z), 0x8ff6ff);

      /* the flying files */
      flights.forEach(l => {
        const q = clamp((K(l.step) - l.a) / (l.b - l.a));
        l.m.visible = q > 0 && K(l.step) < l.hideAt;
        if (!l.m.visible) return;
        const e = smooth(q);
        l.m.position.lerpVectors(l.from, l.to, e); l.m.position.y += Math.sin(q * Math.PI) * l.lift;
        l.m.rotation.set((1 - q) * q * 8, (1 - e) * 5, (1 - q) * q * 4);
      });
      bolt(win(2, .02, .2), tmp.set(-13.3, .8, -1.7), 0xb9a9ff); bolt(win(2, .05, .22), tmp.set(-12.2, .8, -1.7), 0xb9a9ff);

      /* the register and the letter */
      rise(register, win(2, .46, .64));
      regRows.forEach((m, i) => fade(m, ramp(K(2), .6 + i * .035, .66 + i * .035)));
      fade(unposted, ramp(K(2), .84, .92));
      rise(letter, win(2, .66, .82));
      letterMat.uniforms.uTime.value = t; letterMat.uniforms.uDecode.value = win(3, .26, .62);
      fade(binaryTag, ramp(K(2), .82, .9) * (1 - win(3, .24, .34))); fade(docxTag, ramp(K(3), .3, .4) * (1 - ramp(K(4), 0, .15)));
      const dq = win(3, .06, .26), ds = win(3, .26, .62);
      decoder.visible = dq > 0 && ds < 1;
      if (decoder.visible) { decoder.position.lerpVectors(muzzle, tmp.set(-5, 1.92, -1.15), smooth(dq)); decoder.position.y -= ds * 1.74; decoder.scale.set(1 + dq * .7, .1 + dq * .14, 1); decoder.rotation.y = 0; decoder.lookAt?.(camera.position.x, decoder.position.y, camera.position.z); }
      // four calls at once: four bolts out, four files back together
      if (K(4) > 0) [[-15, -1.5], [-14.4, -1.5], [-13.3, -1.7], [-12.2, -1.7]].forEach(([x, z], n) => bolt(win(4, .1 + n * .012, .3 + n * .012), tmp.set(x, .8, z), 0xb9a9ff, .4 + n * .2));

      /* the plan */
      rise(boardG, win(5, .36, .56));
      const claimed = K(7), allDone = ramp(K(14), .7, .8);
      planRows.forEach((r, i) => {
        const show = ramp(K(5), .55 + i * .04, .62 + i * .04); r.g.visible = show > 0; r.g.scale.setScalar(Math.max(.001, show)); r.text.material.opacity = show;
        const at = i <= 6 ? win(7, .55 + i * .045, .64 + i * .045) : i === 7 ? win(9, .92, 1) : win(14, .72, .82);
        r.tick.visible = at > 0; r.tick.scale.setScalar(Math.max(.001, backEase(at, 3)));
        const m = allDone > .5 ? tickGreen : tickAmber; r.parts.forEach(x => { if (x.material !== m) x.material = m; });
      });
      planRows[0].text.material.color.setScalar(claimed > .3 ? 1 : .7 + Math.sin(t * 5) * .3);
      crate.visible = true; const unqueried = ramp(K(5), .6, .8) * (1 - ramp(K(8), .1, .3));
      fade(crateQ, unqueried * (K(7) > 0 ? .6 + Math.sin(t * 4) * .4 : .35)); crateQ.position.y = .88 + Math.sin(t * 2) * .05;

      /* the wall */
      rise(wall, win(6, .1, .3));
      pop(docs[0], win(6, .3, .42)); pop(docs[1], win(6, .52, .64)); pop(docs[2], win(6, .8, .92));
      docs[2].position.z = .05 + (1 - win(6, .8, .92)) * 1.2;
      const th = win(6, .62, .74); thread.visible = th > 0; thread.scale.y = Math.max(.001, th * 1.35); thread.position.set(-1.65 + th * .675, 2.02, .12);
      fade(notEqual, ramp(K(6), .72, .8)); notEqual.position.y = 2.02;
      cutoff.scale.y = Math.max(.001, win(6, .7, .82)); cutoff.visible = K(6) > .7; fade(cutoffTag, ramp(K(6), .78, .84));
      fade(stamp, ramp(K(6), .92, .95)); stamp.scale.setScalar(1 + (1 - ramp(K(6), .92, .96)) * 1.3);
      bolt(win(6, .3, .4), tmp.set(2.95, 1.6, -1.75)); bolt(win(6, .52, .62), tmp.set(4.3, 1.6, -1.75)); bolt(win(6, .8, .9), tmp.set(6.1, 1.6, -1.75), RED);

      /* the valuation */
      const grow = (rings, a, b) => { const n = ramp(K(8), a, b) * rings.length; rings.forEach((m, j) => { m.visible = j < n; }); };
      grow(towerA, .42, .52); grow(towerB, .5, .56); grow(towerD, .56, .66);
      fade(tag0630, ramp(K(8), .5, .56)); fade(tag0731, ramp(K(8), .64, .7) * (1 - ramp(K(9), .4, .6)));
      const lift = win(8, .7, .76), toR = win(8, .76, .84), toP = win(8, .88, .98);
      tmp.set(10.5, .66 + lift * .5, -1.1).lerp(c3.set(RESERVE.x, 1.1, RESERVE.z), smooth(toR));
      tmp.lerp(c3.set(PNL.x, -.62, PNL.z), smooth(toP)); tmp.y = toP > 0 ? lerp(1.1, -.0, smooth(toP)) : tmp.y; delta.position.copy(tmp);
      fade(tagDelta, ramp(K(8), .72, .78));
      fade(reserveX, bump(K(8), .84, .87, 1.4) * (1 - ramp(K(9), 0, .3))); pnlPad.material.emissiveIntensity = 1 + ramp(K(8), .96, 1) * 1.6;
      bolt(win(8, .46, .58), tmp.set(10.5, 1.2, -1.1));

      /* the bench */
      SLABS.forEach((s, n) => {
        const up = n < 3 ? win(9, .4 + n * .06, .56 + n * .06) : win(9, .72 + (n - 3) * .06, .86 + (n - 3) * .06);
        const fold = win(14, .04, .26);
        s.g.visible = up > 0 && fold < 1;
        s.g.position.y = lerp(-2.4, 0, backEase(up, 1.1));
        s.g.position.x = lerp(s.x, 18.7, smooth(fold)); s.g.scale.setScalar(Math.max(.001, 1 - fold));
        const repaired = win(13, .3, .75);
        let n2 = s.base, ghost = 0;
        if (n === 2 || n === 3) n2 = Math.round(lerp(s.base, s.full, win(11, .06, .24)));
        if (n < 2) { ghost = Math.round(lerp(0, s.full - s.base, win(10, .05, .38)) * (K(10) < .42 ? 1 : 0)); n2 = Math.round(lerp(s.base, s.full, repaired)); }
        const falling = n < 2 && K(10) >= .42 && K(10) < .78;
        if (falling) { s.fell = true; s.rows.count = s.full; for (let i = s.base; i < s.full; i++) { const q = clamp((K(10) - .42 - (i - s.base) * .004) / .3); rowAt(matrix, i, -q * q * 3.2, q * (i % 2 ? 2 : -2)); matrix.elements[12] = (i % 5 - 2) * q * .25; s.rows.setMatrixAt(i, matrix); } s.rows.instanceMatrix.needsUpdate = true; } else {
          if (s.fell) { s.fell = false; for (let i = 0; i < 50; i++) s.rows.setMatrixAt(i, rowAt(matrix, i)); s.rows.instanceMatrix.needsUpdate = true; }
          s.rows.count = Math.min(50, n2 + ghost);
        }
        s.rows.material.color.setHex(n < 2 && err > .5 ? 0xff8a96 : 0x8ff0bb);
        s.back.emissiveIntensity = n < 2 ? err * .55 + bump(K(10), .05, .3, .42) * .1 : err * .1;
        if (n < 2) { fade(s.crack, err); s.crack.material.opacity *= .7 + Math.sin(t * 22 + n) * .3; fade(s.done, bump(K(10), .12 + n * .12, .18 + n * .12, .42)); }
      });
      if (K(9) > 0) { bolt(win(9, .38, .5), tmp.set(17.6, 1.2, -1.5), 0x8ff0bb); bolt(win(9, .7, .82), tmp.set(20.2, 1.2, -1.5), 0x8ff0bb); }
      bolt(win(10, .05, .2), tmp.set(16.6, 1.4, -1.5), 0x8ff6ff); bolt(win(10, .17, .32), tmp.set(17.65, 1.4, -1.5), 0x8ff6ff);
      fade(nameError, err * (1 - ramp(K(11), .2, .4)));
      screenMat.emissive.setHex(err > .5 ? RED : PALETTE.teal); screenMat.emissiveIntensity = .55 + err * 1.1 * (.6 + Math.sin(t * 18) * .4);
      errLight.intensity = err * 26 * (.75 + Math.sin(t * 13) * .25);
      sparks.forEach((sp, i) => { const q = clamp((K(10) - .42) / .26); sp.s.visible = q > 0 && q < 1; if (!sp.s.visible) return; sp.s.position.set(16 + Math.cos(sp.a) * sp.out * q, 1.6 + sp.up * q * (1.8 - q * 1.8) * 2, -.45 + Math.sin(sp.a) * sp.out * q); sp.s.material.opacity = (1 - q); });
      bolt(win(11, .06, .16), tmp.set(18.7, 1.4, -1.5), 0x8ff0bb); bolt(win(11, .13, .24), tmp.set(19.75, 1.4, -1.5), 0x8ff0bb);
      // the read-back scan and the repair
      const scanQ = win(12, .4, .7), cool = win(13, .2, .55);
      sweep.material.opacity = bump(scanQ, 0, .1, 1) * .85 + bump(cool, 0, .2, 1) * .9;
      sweep.position.x = scanQ < 1 ? lerp(16, 21.4, scanQ) : lerp(16, 18.3, cool); sweep.visible = sweep.material.opacity > .01;
      fade(threeRows, ramp(K(12), .7, .78) * (1 - ramp(K(13), .25, .4)) * (K(14) < .1 ? 1 : 0));
      fade(thirtyNine, ramp(K(13), .62, .74) * (1 - win(14, 0, .08)));
      bolt(win(13, .06, .24), tmp.set(16.6, 1.4, -1.5), COOL); bolt(win(13, .1, .28), tmp.set(17.65, 1.4, -1.5), COOL);

      /* the press and the tray */
      sections.forEach((g, i) => {
        const q = win(11, .6 + i * .05, .7 + i * .05), to = win(14, .66, .86);
        g.visible = q > 0 && to <= 0;
        const y = .05 + i * .06;
        g.position.set(REPORT.x, y + (1 - backEase(q, .6)) * 2.4, REPORT.z); g.rotation.x = (1 - q) * -1.3; g.rotation.y = (i % 2 ? 1 : -1) * .03;
      });
      {
        const q = win(11, .92, 1), to = win(14, .66, .86), e = smooth(to);
        cover.visible = q > 0;
        cover.position.set(lerp(REPORT.x, 26.05, e), lerp(.45, .34, e) + (1 - q) * 1.5 + Math.sin(to * Math.PI) * 1.1, lerp(REPORT.z, -.5, e)); cover.rotation.x = (1 - q) * -1;
        cover.scale.y = lerp(1, 3, q);
      }
      {
        const up = win(14, .05, .2), go = win(14, .62, .78);
        xlsx.visible = up > 0; xlsx.scale.setScalar(Math.max(.001, backEase(up, 1.4)));
        tmp.set(18.7, lerp(.2, 1.3, up), -1.2).lerp(c3.set(root.position.x, 2.95, root.position.z), ramp(K(14), .14, .24));
        tmp.lerp(c3.set(27.15, .42, -.6), smooth(go)); tmp.y += Math.sin(go * Math.PI) * .6; xlsx.position.copy(tmp); xlsx.rotation.y = (1 - go) * Math.sin(t) * .15;
      }
      trayRing.material.emissiveIntensity = 1 + bump(K(14), .86, .9, 1.2) * 2.5 + ramp(K(1), .9, 1) * .2;
      fade(twoFiles, ramp(K(14), .88, .96));

      // the muzzle flash, recoil and unused bolts
      for (let n = usedBolts; n < bolts.length; n++) bolts[n].forEach(s => { s.visible = false; });
      muzzleFlash.position.copy(muzzle); muzzleFlash.material.opacity = kick > .75 && drawn > .4 ? (kick - .75) * 4 : 0;
      gun.position.z -= Math.max(0, kick - .8) * .25;

      /* the crash takes the room; the camera shakes, the rig does not move under it */
      const black = bump(crash, .415, .43, .5);
      api.dim = clamp(err * .34 + black * .55);
      const shakeAmt = ramp(crash, .42, .43) * (1 - ramp(crash, .46, .62)) * .16;
      shake.set(Math.sin(t * 47) * shakeAmt, Math.sin(t * 61 + 1) * shakeAmt * .7, 0);

      /* the camera: each step eases from the last step's shot to its own */
      const i = clamp(Math.floor(p) + 1, 0, SHOTS.length - 1), prev = Math.max(0, i - 1), u = smooth(clamp((p - (i - 1)) / .72));
      shotOf(prev, s0); shotOf(i, s1);
      if (p < 0) { s0.look = [-16, 1.2, 0]; s0.pos = [-22, 2.6, 8]; s0.fov = 30; }
      for (let c = 0; c < 3; c++) { shot.pos[c] = lerp(s0.pos[c], s1.pos[c], u); shot.look[c] = lerp(s0.look[c], s1.look[c], u); }
      shot.pos[0] += shake.x; shot.pos[1] += shake.y;
      shot.fov = lerp(s0.fov, s1.fov, u);
      facing.forEach(m => { m.quaternion.copy(camera.quaternion); });
    },
  };
  api.update(-1, 0, 0, { req: 0, tok: 26.6 });
  return api;
}

/* The judging steps play on the film's own set; here the agent walks round the outside of it, and
 * each step gets its own shot and its own figure over the work. p is the position along STEPS. */
export function dressJudge({ THREE, kit, set, util, camera }) {
  const { clamp, smooth, ramp, lerp } = util;
  const FIRST = 15;
  const K = (p, n) => clamp(p - (FIRST + n - 1));
  const line = (text, size, color = INK) => ({ text, size, color, font: MONO, weight: 700 });
  const facing = [];
  const plaque = (key, lines, w, h, x, y, z) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: kit.labelTexture(`ar-j-${key}`, lines, { width: 1024, height: Math.round(1024 * h / w) }), transparent: true, depthWrite: false }));
    m.position.set(x, y, z); m.visible = false; set.add(m); facing.push(m); return m;
  };
  const dv01 = plaque('dv01', [line('DV01', 120, '#8ff0bb'), line('−132,480.55', 170), line('±0.01', 96, '#8ff0bb')], 1.25, .62, 1.1, 1.72, .3);
  const none = plaque('r19', [line('0 formulas', 170, '#ff5a6d'), line('5 sheets', 104, '#c6d0e0')], 1.3, .46, 1, 1.66, .3);
  const r51 = plaque('r51', [line('G2 held', 150, '#ff9aa8'), line('R51  3 / 5', 130)], 1.8, .62, 0, 2.15, 1.4);
  const score = plaque('score', [line('0.333', 300), line('57.25 / 172', 120, '#f2b545')], 2.1, 1.05, 0, 2.05, -.2);
  // angles round the plinth, from +z towards +x; the pad is where film-grading.js stands the robot
  const PAD_A = Math.atan2(2.95, -1.45), R0 = Math.hypot(2.95, 1.45), R1 = 3.02;
  const STOPS = [[PAD_A, R0], [PAD_A, R0], [1.08, R1], [.64, R1], [.24, R1], [PAD_A, R0]];
  const place = (q, out) => {
    const n = clamp(Math.floor(q - FIRST + 1), 0, 5), k = clamp(q - (FIRST - 1) - n), walkK = ramp(k, .05, .62), a = STOPS[n], b = STOPS[Math.min(n + 1, 5)];
    out.a = lerp(a[0], b[0], smooth(walkK)); out.r = lerp(a[1], b[1], smooth(walkK)); out.walk = a[0] === b[0] ? 0 : ramp(walkK, 0, .15) * (1 - ramp(walkK, .85, 1)); out.sign = Math.sign(b[0] - a[0]) || 1;
    return out;
  };
  const here = { a: 0, r: 0, walk: 0, sign: 1 };
  const CLOSE = { 1: { pos: [3.1, 2.2, 7.4], look: [1.05, 1.15, 0], fov: 30 }, 2: { pos: [-.9, 1.9, 6.9], look: [1.05, 1.05, 0], fov: 30 } };
  return {
    afterUpdate(p, t, bot) { // the film's update has run: move its robot and set the figures
      place(p, here);
      const x = Math.sin(here.a) * here.r, z = Math.cos(here.a) * here.r, centre = Math.atan2(-x, -z);
      const tangent = centre + (here.sign > 0 ? -Math.PI / 2 : Math.PI / 2);
      bot.update(t, here.walk);
      bot.root.position.set(x, Math.sin(Math.PI * clamp((K(p, 3) - .78) / .22)) * .24, z);
      bot.root.rotation.y = centre + ((tangent - centre + Math.PI) % (Math.PI * 2) - Math.PI) * here.walk;
      const slump = ramp(K(p, 2), .55, .85) * (1 - ramp(K(p, 3), 0, .3));
      bot.head.rotation.y = Math.sin(t * .7) * .08; bot.head.rotation.x = slump * .42 - ramp(K(p, 4), .6, 1) * .18;
      dv01.visible = K(p, 1) > .45 && K(p, 2) < .2; dv01.material.opacity = ramp(K(p, 1), .45, .6) * (1 - ramp(K(p, 2), .02, .2));
      none.visible = K(p, 2) > .45 && K(p, 3) < .2; none.material.opacity = ramp(K(p, 2), .45, .6) * (1 - ramp(K(p, 3), .02, .2));
      r51.visible = K(p, 3) > .7 && K(p, 4) < .2; r51.material.opacity = ramp(K(p, 3), .7, .85) * (1 - ramp(K(p, 4), .02, .2));
      score.visible = K(p, 4) > .6; score.material.opacity = ramp(K(p, 4), .6, .85);
      facing.forEach(m => { m.quaternion.copy(camera.quaternion); });
    },
    // film pose in, this step's pose out
    shot(p, pose) {
      let out = pose;
      [1, 2].forEach(n => {
        const w = smooth(clamp(K(p, n) / .55)) * (1 - smooth(clamp(K(p, n + 1) / .55)));
        if (w <= 0) return;
        const c = CLOSE[n];
        out = { pos: out.pos.map((v, i) => lerp(v, c.pos[i], w)), look: out.look.map((v, i) => lerp(v, c.look[i], w)), fov: lerp(out.fov, c.fov, w) };
      });
      return out;
    },
  };
}

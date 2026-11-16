/* film-soc-trajectory.js — beat 2 of the society Metacase film (HR-T3-114): Actions & execution.
 * The roll call. The armed robot works the task in the yard, and the people it counts are there:
 *   lp .00–.21  evidence gathering: it reads the four documents, then every workbook and detail
 *               file in the racks; each file it reads lifts and its status lamp lights (four stay
 *               amber). The scoreboard by the fourth hub counts requests, tool calls and tokens.
 *      .22–.38  recomputation: the racks sink; the 83 supervisors walk out to the 1,377-minute
 *               line. 82 cross it, one stops at 1,170; three wear amber: 360 minutes each still
 *               pending, left out of the count. The test means tip up in front.
 *      .38–.50  stratification: they walk into three pens: 73 can be evaluated, 8 lack
 *               opportunity, 2 are restricted by leave or transfer.
 *      .44–.52  the press that builds the files rises; the workbook comes out, ten sheets
 *      .52–.70  failure: the memo's script takes the first row of an empty table and the press
 *               jams (red, a shake). The robot finds the empty tray, rewrites the script and runs
 *               it again: the memo comes out.
 *      .70–.86  read-back: the ten sheets fan out over the table and the robot scans them: ten
 *               sheets, three cells with formulas, the rest typed values; R86, 85 calls, 208k.
 *      .86–1    held; the framework dollies on to the next set.
 * Everything is a function of lp; t only adds idle life (breathing, shimmer).
 * All entities, people and figures of this case are synthetic. */
import { yard, crowd, hub, sign, pen, cameraLine, pathAt, STATUS, lin, sm, ease, mix, backOut, hit } from './film-soc-kit.js?v=mc-1c165fc3e2';

const TYPES = [{ key: 'DOCX', n: 4, color: 0xe9edf5, x: .45 }, { key: 'XLSX', n: 5, color: 0x7d6ad8, x: 1.4 }, { key: 'CSV', n: 8, color: 0x6aa8e8, x: 2.7 }];
const PENDING = new Set([2, 5, 12, 15]);   // the files whose status is not "reviewed", as the task beat marked them
const HUB_X = [.1, 1.45, 2.8, 4.15], HUB_Z = -2.45, RACK_Z = -.75;
const TOK0 = 5, TOK1 = 208;                // the context in thousands of tokens: the first request and the last
const RUN = { requests: 86, calls: 85 };
// tool calls made by local progress (piecewise linear): reading, recomputing, sorting, building, fixing, reading back
const CALLS = [[0, 0], [.015, 1], [.205, 41], [.38, 55], [.5, 62], [.52, 66], [.7, 76], [.8, 85], [1, 85]];
const T = {
  read: .02, docStep: .012, fileStep: .0105, racksOut: .208,
  march: .225, marchSpan: .05, marchLen: .05, tally: .33, means: .345,
  sort: .385, sortSpan: .04, sortLen: .05,
  press: .44, sheets: .47, sheetStep: .0045, crash: .52, find: .575, fix: .62, rerun: .66, memo: .675,
  fan: .712, scan: .735, scanEnd: .785, found: .775, turn: .8,
};
const LINE_Z = 1.0, FX0 = .2, FDX = .16, FZ0 = 1.25, FDZ = .2;      // the minutes line and the rows beyond it
const PENS = [
  { n: 73, word: 'can be evaluated', x: 1.3, z: -.15, w: 2.45, d: 1.35, cols: 13, color: STATUS.verified, tint: 0x4a7fd4 },
  { n: 8, word: 'lack opportunity', x: 3.2, z: -.2, w: .95, d: .62, cols: 4, color: 0x6aa8e8, tint: 0x8fb8e8 },
  { n: 2, word: 'leave or transfer', x: 4.2, z: -.2, w: .7, d: .5, cols: 2, color: 0x9aa3b2, tint: 0x8a93a3 },
];
const MX = 2.4, MZ = 1.55, TABLE_X = 3.65;
const WALK = [[0, -.4, .75], [.205, -.4, .75], [.25, -.45, 1.0], [.44, -.45, 1.0], [.5, .55, 2.7], [1, .55, 2.7]];

export async function build({ THREE, kit, set, accent, loadWeapons, hand, util, camera, reduce, labelTexture, layout }) {
  const { PALETTE, GUN_HOLD, add, cyl, block, ball, rbox, mat, glowMat } = kit;
  const { glowSprite } = util;
  const ctx = { THREE, kit };
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const additive = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, ...extra });
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const VIOLET = accent ?? 0x7d6ad8, RED = 0xff2a3d;

  const rig = new THREE.Group(); set.add(rig); // everything shakes together; the camera does not

  /* ---- the yard, the hubs and the supervisors ---- */
  const ground = yard({ THREE, kit, set: rig, accent: VIOLET });
  const hubs = ['HUB-01', 'HUB-02', 'HUB-03', 'HUB-04'].map((name, i) => {
    const h = hub({ ...ctx, name, color: [PALETTE.teal, PALETTE.sky, PALETTE.violet, 0][i], deferred: i === 3 });
    h.group.position.set(HUB_X[i], 0, HUB_Z); h.group.scale.setScalar(.92); rig.add(h.group);
    return h;
  });
  const people = crowd({ ...ctx, n: 83 }); rig.add(people.group);
  // home (in front of the trained hubs), the place at the minutes line, the place in a pen
  const P = [];
  for (let i = 0; i < 83; i++) {
    const g = i % 3, j = Math.floor(i / 3), col = j % 7, row = Math.floor(j / 7);
    const p = { hx: HUB_X[g] - .51 + col * .17 + (row % 2) * .04, hz: -1.82 + row * .18, ph: hash(i) * 6.28 };
    if (i < 82) { p.lx = FX0 + (i % 21) * FDX; p.lz = FZ0 + Math.floor(i / 21) * FDZ; } else { p.lx = FX0 + 1.52; p.lz = LINE_Z - .3; } // the last one stops short
    const s = i < 73 ? 0 : i < 81 ? 1 : 2, q = PENS[s], k = i - [0, 73, 81][s], rows = Math.ceil(q.n / q.cols);
    p.pen = s; p.px = q.x + ((k % q.cols) - (q.cols - 1) / 2) * .17; p.pz = q.z + (Math.floor(k / q.cols) - (rows - 1) / 2) * .19;
    P.push(p);
  }
  const WAIT = [61, 62, 81];                     // three with 360 minutes pending: in the front row, side by side
  WAIT.forEach((i, k) => { P[i].lx = FX0 + (18 + k) * FDX; P[i].lz = FZ0 + 3 * FDZ; P[i].wait = true; });
  { const moved = [P[81].lx]; P[79].lx = FX0 + 19 * FDX; P[79].lz = FZ0 + 2 * FDZ; P[80].lx = FX0 + 20 * FDX; P[80].lz = FZ0 + 2 * FDZ; void moved; }
  P[61].wait = P[62].wait = P[81].wait = true;

  /* ---- the racks with the 17 files (as the task beat left them), each with its status lamp ---- */
  const racks = new THREE.Group(); rig.add(racks);
  TYPES.forEach(ty => {
    const w = ty.n * .15 + .22;
    block(racks, w, .1, .42, 0x26324c, ty.x, 0, RACK_Z, .03);
    block(racks, w, .5, .04, 0x1a2338, ty.x, .1, RACK_Z - .19, .015);
  });
  const F = [];
  TYPES.forEach((ty, k) => { for (let j = 0; j < ty.n; j++) { const i = F.length; F.push({ k, x: ty.x + (j - (ty.n - 1) / 2) * .15, at: i < 4 ? T.read + i * T.docStep : T.read + 4 * T.docStep + (i - 4) * T.fileStep }); } });
  const files = new THREE.InstancedMesh(rbox(.11, .32, .24, .025), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7 }), 17);
  files.castShadow = true; files.frustumCulled = false; racks.add(files);
  F.forEach((f, i) => files.setColorAt(i, new THREE.Color(TYPES[f.k].color)));
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(.042, 12, 9), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 17);
  lamps.frustumCulled = false; racks.add(lamps);

  /* ---- the scoreboard by the fourth hub: requests, tool calls, tokens ---- */
  const BIG = { size: 112, weight: 800, color: '#ffffff' }, SUB = { size: 62, weight: 700, color: '#c9bcff' };
  const boardLines = (r, c, k) => [{ ...BIG, text: `R${r}` }, { ...SUB, text: `${c} tool calls` }, { ...SUB, text: `${k}k tokens` }];
  const board = sign({ ...ctx, key: 'traj-board', w: 1.3, h: .9, color: VIOLET, post: 1.1, px: 512, lines: boardLines(0, 0, TOK0) });
  board.group.position.set(-.3, 0, -2.5); board.group.rotation.y = .15; rig.add(board.group);
  let shownReq = -1, shownCall = -1, shownTok = -1;

  /* ---- the minutes line and what the recomputation finds ---- */
  const roll = new THREE.Group(); roll.visible = false; rig.add(roll);
  const lineMat = glowMat(PALETTE.amber, 1.3).clone();
  add(roll, rbox(3.9, .03, .05, .012), lineMat, 1.9, .02, LINE_Z, false);
  const lineSign = sign({ ...ctx, key: 'traj-line', w: 1.0, h: .38, color: PALETTE.amber, post: .32, px: 512, lines: [{ text: '1,377 min', size: 100, weight: 800, color: '#ffffff' }, { text: '85% of 1,620', size: 44, weight: 600, color: '#f2c96a' }] });
  lineSign.group.position.set(3.85, 0, LINE_Z - .12); lineSign.group.rotation.y = -.3; roll.add(lineSign.group);
  const tag = (key, lines, w, h, color) => { const s = sign({ ...ctx, key, w, h, color, px: 384, lines }); roll.add(s.group); return s; };
  const shortTag = tag('traj-short', [{ text: '1,170', size: 96, weight: 800, color: '#ffffff' }], .5, .22, STATUS.disputed);
  shortTag.group.position.set(P[82].lx, .5, P[82].lz);
  const waitTag = tag('traj-wait', [{ text: '360 min pending', size: 54, weight: 800, color: '#ffd27a' }], .98, .2, STATUS.pending);
  waitTag.group.position.set(FX0 + 19 * FDX, .52, FZ0 + 3 * FDZ);
  const tally = sign({ ...ctx, key: 'traj-tally', w: 1.0, h: .4, color: STATUS.verified, px: 512, lines: [{ text: '82 / 83', size: 118, weight: 800, color: '#ffffff' }, { text: 'reach 1,377 min', size: 42, weight: 600, color: '#8fe6b4' }] });
  tally.group.position.set(1.05, .02, 2.42); tally.group.rotation.x = -.95; roll.add(tally.group);
  const means = sign({ ...ctx, key: 'traj-means', w: 2.0, h: .4, color: PALETTE.teal, px: 768, lines: [{ text: '59.06 · 94.07 · 90.27', size: 80, weight: 800, color: '#ffffff' }, { text: 'mean test scores', size: 38, weight: 600, color: '#9fdcd8' }] });
  means.group.position.set(2.75, .02, 2.42); means.group.rotation.x = -.95; roll.add(means.group);

  /* ---- the three pens ---- */
  const pens = PENS.map((q, i) => {
    const f = pen({ ...ctx, w: q.w, d: q.d, h: .24, color: q.color, gate: Math.min(.6, q.w * .5), gateSide: 1 });
    f.group.position.set(q.x, 0, q.z); f.group.visible = false; rig.add(f.group);
    const w = i ? .94 : 1.5;
    const lines = n => [{ text: String(n), size: i ? 92 : 96, weight: 800, color: '#ffffff' }, { text: q.word, size: i ? 40 : 44, weight: 600, color: '#dfe6f5' }];
    const s = sign({ ...ctx, key: `traj-pen-${i}`, w, h: .46, color: q.color, post: 1.2, px: i ? 384 : 640, lines: lines(0) });
    s.group.position.set(q.x, 0, q.z - q.d / 2 - .12); s.group.visible = false; rig.add(s.group);
    return { ...q, f, s, lines, shown: -1 };
  });

  /* ---- the press that builds the two files, its table, the workbook's ten sheets and the memo ---- */
  const press = new THREE.Group(); press.position.set(MX, 0, MZ); press.visible = false; rig.add(press);
  const pressMat = mat(0x4a5a82, { emissive: RED, intensity: 0 }).clone();
  block(press, 1.0, .62, .6, pressMat, 0, 0, 0, .06);
  block(press, .52, .12, .42, 0x2a3550, -.18, .62, 0, .03);
  block(press, .4, .05, .46, 0x6a7ba6, .68, .34, 0, .02).rotation.z = -.25;
  const trimMat = glowMat(VIOLET, .9).clone(); add(press, rbox(1.03, .035, .63, .012), trimMat, 0, .5, 0, false);
  add(press, rbox(.46, .2, .02, .01), mat(0x0d1524, { emissive: VIOLET, intensity: .25 }), -.18, .28, .31, false);
  const lampMat = glowMat(0x9aa3b2, 1.2).clone(); ball(press, .07, lampMat, .34, .7, .12, 12);
  const cLamp = { idle: new THREE.Color(0x9aa3b2), ok: new THREE.Color(STATUS.verified), bad: new THREE.Color(RED) };
  const tray = new THREE.Group(); press.add(tray);                     // the empty table the script trips on
  const trayMat = glowMat(RED, 0).clone();
  add(tray, rbox(.42, .03, .32, .012), mat(0x141c2e), 0, 0, 0, false);
  for (const sz of [-1, 1]) add(tray, rbox(.44, .035, .02, .008), trayMat, 0, .01, sz * .16, false);
  for (const sx of [-1, 1]) add(tray, rbox(.02, .035, .32, .008), trayMat, sx * .21, .01, 0, false);
  const state = sign({ ...ctx, key: 'traj-state', w: 1.5, h: .36, color: RED, post: 0, px: 640, lines: [{ text: 'first row of an empty table', size: 50, weight: 800, color: '#ffffff' }] });
  state.group.position.set(-.1, .02, .8); state.group.rotation.x = -.95; press.add(state.group);
  const STATES = [[{ text: 'first row of an empty table', size: 50, weight: 800, color: '#ffffff' }], [{ text: 'script rewritten · run again', size: 50, weight: 800, color: '#ffffff' }]];
  let stateShown = 0;
  const table = new THREE.Group(); table.position.set(TABLE_X, 0, MZ); table.visible = false; rig.add(table);
  block(table, 1.3, .07, .7, 0x56658c, 0, .3, 0, .03);
  for (const sx of [-1, 1]) block(table, .08, .3, .6, 0x1a2338, sx * .55, 0, 0, .02);
  // a printed face for the sheets (a grid under a header band) and for the memo (lines of text)
  function paperTexture(grid) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 192;
    const g = c.getContext('2d');
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 192);
    if (grid) {
      g.fillStyle = '#3f9d6a'; g.fillRect(0, 0, 256, 30);
      g.strokeStyle = '#9fc4b0'; g.lineWidth = 2;
      for (let y = 30; y < 192; y += 27) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
      for (const x of [40, 112, 184]) { g.beginPath(); g.moveTo(x, 30); g.lineTo(x, 192); g.stroke(); }
      g.fillStyle = '#8a97a8'; for (let r = 0; r < 6; r++) for (let k = 0; k < 3; k++) g.fillRect(50 + k * 72, 40 + r * 27, 30 + hash(r * 3 + k) * 26, 8);
    } else {
      g.fillStyle = '#4f6fb8'; g.fillRect(18, 16, 120, 14);
      g.fillStyle = '#8a97a8'; for (let r = 0; r < 9; r++) g.fillRect(18, 46 + r * 16, 150 + hash(r) * 70, 6);
    }
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; return tex;
  }
  const SHEETS = 10, sheets = new THREE.InstancedMesh(rbox(.5, .014, .36, .005), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8, map: paperTexture(true) }), SHEETS);
  sheets.castShadow = true; sheets.frustumCulled = false; rig.add(sheets);
  for (let i = 0; i < SHEETS; i++) sheets.setColorAt(i, new THREE.Color(i % 2 ? 0xf2fbf5 : 0xdff3e8));
  const CELLS = [2, 5, 8];                       // three sheets carry one formula cell each
  const cells = CELLS.map(() => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.16, .06), new THREE.MeshBasicMaterial({ color: 0xffc23d, toneMapped: false, transparent: true, opacity: 0 })); m.rotation.order = 'YXZ'; rig.add(m); return m; });
  const memoMat = new THREE.MeshStandardMaterial({ color: 0xe6edff, roughness: .8, emissive: RED, emissiveIntensity: 0, map: paperTexture(false) });
  const memo = add(rig, rbox(.4, .014, .54, .005), memoMat, 0, 0, 0); memo.visible = false;
  const found = sign({ ...ctx, key: 'traj-found', w: 1.5, h: .46, color: STATUS.verified, px: 640, lines: [{ text: '10 sheets', size: 100, weight: 800, color: '#ffffff' }, { text: '3 formula cells · the rest typed', size: 44, weight: 600, color: '#8fe6b4' }] });
  found.group.position.set(TABLE_X - .2, .02, MZ + .8); found.group.rotation.x = -.95; found.group.visible = false; rig.add(found.group);

  /* ---- the robot (the model), armed with the harness ---- */
  let made = null;
  try { made = hand.robot?.create?.() ?? null; } catch { made = null; }
  let bot, gun;
  if (made?.root) { bot = made.robot; gun = made.weapon; }
  else {
    bot = kit.robot(PALETTE.cream, 0xffd666);
    try { const { weapons } = await loadWeapons(); gun = weapons[hand.armed?.weaponIndex ?? 0].clone(true); } catch { gun = kit.blaster(PALETTE.amber); }
    gun.position.copy(GUN_HOLD.at); gun.rotation.copy(GUN_HOLD.turn); gun.scale.setScalar(.8); bot.root.add(gun); bot.grip?.(1);
  }
  // smaller than in the beat before: at the read-back's low camera it must not stand in front of a sign
  const S = 1.15, root = bot.root; root.rotation.order = 'YXZ'; root.scale.setScalar(S); rig.add(root);
  const eyeMats = [];
  { const seen = new Map();
    root.traverse(o => {
      if (!o.isMesh || !o.material?.isMeshStandardMaterial || o.material.emissiveIntensity < 2) return;
      if (!seen.has(o.material)) { const c = o.material.clone(); seen.set(o.material, c); eyeMats.push({ m: c, base: c.emissive.clone(), i: c.emissiveIntensity }); }
      o.material = seen.get(o.material);
    }); }
  const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const shot = new THREE.Mesh(beamGeo, additive(0xd9ccff, 0)); shot.visible = false; shot.frustumCulled = false; rig.add(shot);
  const muzzleFlash = glowSprite(0xd9ccff, .5, 0); rig.add(muzzleFlash);
  const spot = glowSprite(0xd9ccff, .5, 0); rig.add(spot);
  const redGlow = glowSprite(RED, 3, 0); redGlow.position.set(MX, .7, MZ); rig.add(redGlow);
  const UP = V(0, 1, 0), dir = V();
  function stretch(m, a, b, r) {
    dir.copy(b).sub(a);
    const L = dir.length();
    if (L < 1e-4) { m.visible = false; return; }
    m.position.copy(a).addScaledVector(dir, .5);
    m.quaternion.setFromUnitVectors(UP, dir.divideScalar(L));
    m.scale.set(r, L, r); m.visible = true;
  }

  // hand-off for the later beats: data, not scene nodes
  hand.workbook = { sheets: 10, formulas: 3, color: 0x3f9d6a };
  hand.outputs = { files: ['workbook', 'memo'], color: 0x3f9d6a };
  hand.trajectory = { requests: RUN.requests, calls: RUN.calls, tokens: `${TOK1}k`, crash: 'IndexError', strata: [73, 8, 2], reach: [82, 83] };

  const cam = { from: { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 }, to: { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 } };
  const line = cameraLine([
    { at: 0, pos: [1.6, 3.7, 7.7], look: [2.0, .7, -.4], fov: 34 },
    { at: .2, pos: [1.8, 3.5, 7.7], look: [2.05, .65, -.3], fov: 34 },
    { at: .27, pos: [2.1, 4.8, 8.4], look: [2.2, .3, .9], fov: 34 },
    { at: .37, pos: [2.2, 4.7, 8.4], look: [2.25, .3, .95], fov: 34 },
    { at: .43, pos: [2.3, 4.6, 7.8], look: [2.4, .35, -.1], fov: 34 },
    { at: .49, pos: [2.3, 4.4, 7.8], look: [2.4, .4, .1], fov: 34 },
    { at: .55, pos: [2.3, 3.1, 7.4], look: [2.35, .75, 1.3], fov: 33 },
    { at: .69, pos: [2.5, 3.0, 7.3], look: [2.4, .75, 1.3], fov: 33 },
    { at: .75, pos: [2.55, 2.3, 8.0], look: [2.45, 1.15, 1.3], fov: 33 },
    { at: 1, pos: [2.75, 2.2, 8.0], look: [2.5, 1.15, 1.3], fov: 33 },
  ]);
  line(0, cam);

  const o = new THREE.Object3D(), m4 = new THREE.Matrix4(), muzzle = V(), target = V(), v = V();
  const cGrey = new THREE.Color(0x6a7386), cOk = new THREE.Color(STATUS.verified), cWait = new THREE.Color(STATUS.pending), cRed = new THREE.Color(RED), cCool = new THREE.Color(0x7ff6ff);
  const walker = { x: 0, z: 0, ry: 0, walk: 0 };
  const callsAt = lp => { let i = 0; while (i < CALLS.length - 2 && lp > CALLS[i + 1][0]) i++; const a = CALLS[i], b = CALLS[i + 1]; return mix(a[1], b[1], lin(lp, a[0], b[0])); };

  const api = {
    camera: cam,
    dim: 0,
    update(lp, t, dt, ui) {
      if (reduce) lp = 1;
      const tt = reduce ? 0 : t, live = reduce ? 0 : 1;

      /* the numbers: the copy counts the calls; the scoreboard shows requests, calls and context */
      const cf = callsAt(lp), nCall = Math.floor(cf + 1e-6), nReq = lp >= .8 ? RUN.requests : Math.min(RUN.requests - 1, nCall + (lp > .004 ? 1 : 0));
      const tok = Math.round(TOK0 + (TOK1 - TOK0) * Math.pow(nCall / RUN.calls, 1.15));
      ui.set('calls', nCall);
      if (nReq !== shownReq || nCall !== shownCall || tok !== shownTok) { shownReq = nReq; shownCall = nCall; shownTok = tok; board.redraw(boardLines(nReq, nCall, tok)); }
      board.frameMat.emissiveIntensity = 1 + .15 * Math.sin(tt * 2) + hit(cf % 1, 0, .5) * .5 * (lp < .8 ? 1 : 0);

      /* the crash: for a moment everything but the red goes dim, and the set shakes */
      const crash = hit(lp, T.crash, .035) * live, jam = ease(lp, T.crash, T.crash + .004) * (1 - ease(lp, T.fix + .03, T.rerun));
      api.dim = .7 * crash;
      const shake = live * (ease(lp, T.crash - .002, T.crash + .003) * (1 - ease(lp, T.crash + .004, T.crash + .06)));
      rig.position.set(shake * (Math.sin(tt * 53) * .7 + Math.sin(lp * 4000) * .5) * .06, shake * Math.sin(tt * 47 + 1) * .03, shake * Math.sin(tt * 41 + 2) * .04);

      /* the racks: each file lifts while it is read, and its lamp keeps the status that was found */
      const racksOut = ease(lp, T.racksOut, T.racksOut + .03);
      racks.visible = racksOut < 1; racks.position.y = -1.2 * racksOut;
      let reading = -1;
      for (let i = 0; i < 17; i++) {
        const f = F[i], len = i < 4 ? T.docStep : T.fileStep, k = lin(lp, f.at, f.at + len), lift = Math.sin(k * Math.PI);
        if (k > 0 && k < 1) reading = i;
        o.position.set(f.x, .26 + lift * .2, RACK_Z + lift * .08); o.rotation.set(lift * .5, 0, 0); o.scale.setScalar(1); o.updateMatrix(); files.setMatrixAt(i, o.matrix);
        const read = lp >= f.at + len * .5;
        o.position.set(f.x, .47 + lift * .2, RACK_Z + .1 + lift * .12); o.rotation.set(0, 0, 0);
        o.scale.setScalar(read ? 1 + hit(lp, f.at + len * .5, .012) + (PENDING.has(i) ? .4 : 0) : .7); o.updateMatrix(); lamps.setMatrixAt(i, o.matrix);
        lamps.setColorAt(i, read ? (PENDING.has(i) ? cWait : cOk) : cGrey);
      }
      files.instanceMatrix.needsUpdate = true; lamps.instanceMatrix.needsUpdate = true; lamps.instanceColor.needsUpdate = true;

      /* the supervisors: home, to the line, into the pens */
      const inPen = [0, 0, 0];
      for (let i = 0; i < 83; i++) {
        const p = P[i];
        const a = T.march + i / 83 * T.marchSpan, k1 = ease(lp, a, a + T.marchLen);
        const b = T.sort + i / 83 * T.sortSpan, k2 = ease(lp, b, b + T.sortLen);
        let x = mix(mix(p.hx, p.lx, k1), p.px, k2), z = mix(mix(p.hz, p.lz, k1), p.pz, k2);
        let y = Math.abs(Math.sin(tt * 1.3 + p.ph)) * .012, ry = Math.sin(tt * .5 + p.ph) * .3, tint = 0x4a7fd4, hat = PALETTE.amber;
        const moving = (k1 > 0 && k1 < 1) || (k2 > 0 && k2 < 1);
        if (moving) { y += Math.abs(Math.sin((k1 + k2) * 16 + p.ph)) * .05; ry = k2 > 0 ? Math.atan2(p.px - p.lx, p.pz - p.lz) : 0; }
        if (k1 >= 1 && k2 <= 0) { if (i === 82) tint = STATUS.disputed; y += hit(lp, T.tally, .02) * .08 * (i === 82 ? 0 : 1); }
        if (p.wait && k1 > .5 && k2 < .5) hat = 0xff8a2a;
        if (k2 >= 1) { inPen[p.pen]++; tint = PENS[p.pen].tint; }
        people.place(i, x, z, { y, ry, s: .72 }); people.tint(i, tint); people.hat(i, hat);
      }
      people.commit();
      const rollIn = ease(lp, T.march - .01, T.march + .02) * (1 - ease(lp, T.sort + .01, T.sort + .05));
      roll.visible = rollIn > 0; roll.position.y = -.4 * (1 - rollIn);
      lineMat.emissiveIntensity = 1.3 + .25 * Math.sin(tt * 3) + hit(lp, T.tally, .04) * 2;
      shortTag.group.scale.setScalar(Math.max(.001, backOut(lin(lp, T.march + T.marchSpan + T.marchLen - .01, T.tally))));
      waitTag.group.scale.setScalar(Math.max(.001, backOut(lin(lp, T.tally - .03, T.tally))));
      waitTag.frameMat.emissiveIntensity = 1 + .4 * Math.sin(tt * 4);
      tally.group.scale.setScalar(Math.max(.001, backOut(lin(lp, T.tally, T.tally + .025))));
      means.group.scale.setScalar(Math.max(.001, backOut(lin(lp, T.means, T.means + .025))));
      pens.forEach((q, i) => {
        const up = ease(lp, T.sort - .012 + i * .006, T.sort + .018 + i * .006);
        q.f.group.visible = q.s.group.visible = up > 0; q.f.group.scale.y = Math.max(.001, backOut(up)); q.s.group.scale.setScalar(Math.max(.001, backOut(up)));
        if (inPen[i] !== q.shown) { q.shown = inPen[i]; q.s.redraw(q.lines(inPen[i])); }
        q.f.mat.emissiveIntensity = .55 + .1 * Math.sin(tt * 2 + i) + (inPen[i] >= q.n ? hit(lp, T.sort + T.sortSpan + T.sortLen, .04) * 1.5 : 0);
      });

      /* the press, the workbook, the jam and the memo */
      const pressUp = backOut(lin(lp, T.press, T.press + .03), 1.2);
      press.visible = table.visible = pressUp > .01; press.scale.setScalar(Math.max(.001, pressUp)); table.scale.setScalar(Math.max(.001, pressUp));
      const fixed = ease(lp, T.fix, T.fix + .03), rerun = ease(lp, T.rerun, T.rerun + .01);
      pressMat.emissiveIntensity = jam * (.35 + .15 * Math.sin(tt * 9)) * (1 - fixed);
      trimMat.color.setHex(VIOLET).lerp(cRed, jam * (1 - fixed)); trimMat.emissive.copy(trimMat.color); trimMat.emissiveIntensity = .9 + hit(lp, T.rerun, .04) * 2;
      lampMat.color.copy(lp < T.crash ? (lp > T.sheets ? cLamp.ok : cLamp.idle) : rerun > .5 ? cLamp.ok : cLamp.bad); lampMat.emissive.copy(lampMat.color);
      lampMat.emissiveIntensity = 1.4 + (jam > 0 && rerun < .5 ? Math.sin(tt * 12) * .8 : 0);
      redGlow.material.opacity = (crash * .6 + jam * .12) * (1 - fixed);
      // the empty tray: fed in at the crash, pulled out and held up when the cause is found, dropped once fixed
      const feed = ease(lp, T.crash - .02, T.crash), pull = ease(lp, T.find, T.find + .025), drop = ease(lp, T.rerun, T.rerun + .02);
      tray.visible = feed > 0 && drop < 1;
      tray.position.set(-.18 - .5 * (1 - feed) - .35 * pull, .72 + .45 * pull - .3 * (1 - feed), .0 + .35 * pull); tray.rotation.z = .5 * pull; tray.rotation.x = .5 * pull;
      tray.scale.setScalar(1 - drop);
      trayMat.emissive.copy(cRed).lerp(cCool, fixed); trayMat.color.copy(trayMat.emissive); trayMat.emissiveIntensity = (.3 + jam * 1.6 + hit(lp, T.find + .025, .04) * 2) * (1 - drop);
      const st = lp >= T.fix + .02 ? 1 : 0;
      if (st !== stateShown) { stateShown = st; state.redraw(STATES[st]); }
      const stateIn = backOut(lin(lp, T.crash + .004, T.crash + .03)) * (1 - ease(lp, T.memo + .02, T.memo + .05));
      state.group.visible = stateIn > .01; state.group.scale.setScalar(Math.max(.001, stateIn));
      state.frameMat.color.copy(cRed).lerp(cOk, fixed); state.frameMat.emissive.copy(state.frameMat.color); state.frameMat.emissiveIntensity = 1.2 + jam * .6 * Math.sin(tt * 10) + hit(lp, T.fix + .02, .04) * 2;
      // the workbook's sheets: out of the press onto the table, then fanned out for the read-back
      const fan = ease(lp, T.fan, T.fan + .03);
      for (let i = 0; i < SHEETS; i++) {
        const a = T.sheets + i * T.sheetStep, k = ease(lp, a, a + .014);
        const sx = mix(MX + .55, TABLE_X - .2, k), sy = mix(.42, .38 + i * .017, k) + Math.sin(k * Math.PI) * .12, sz = MZ;
        const fx = TABLE_X - .95 + i * .18, fy = 2.15 + Math.sin(i / 9 * Math.PI) * .22, scan = hit(lp, T.scan + (T.scanEnd - T.scan) * i / 9, .02);
        o.position.set(mix(sx, fx, fan), mix(sy, fy, fan) + scan * .06, mix(sz, MZ - .05, fan));
        o.rotation.set(mix(0, 1.25, fan), mix(0, -.18 + i * .04, fan), 0, 'YXZ'); o.scale.setScalar(k > 0 ? mix(1, .72, fan) : .001); o.updateMatrix();
        sheets.setMatrixAt(i, o.matrix);
        const c = CELLS.indexOf(i);
        if (c >= 0) {
          const cell = cells[c], seen = ease(lp, T.scan + (T.scanEnd - T.scan) * i / 9, T.scan + (T.scanEnd - T.scan) * i / 9 + .01);
          cell.position.copy(v.set(.08 - c * .09, .012, -.06 + c * .07).applyMatrix4(o.matrix)); cell.rotation.set(1.25 - Math.PI / 2, -.18 + i * .04, 0);
          cell.material.opacity = fan * seen; cell.scale.setScalar(mix(1, .72, fan) * (1 + hit(lp, T.scan + (T.scanEnd - T.scan) * i / 9 + .01, .03) * .8));
        }
      }
      sheets.instanceMatrix.needsUpdate = true;
      // the memo: half out and red at the crash, out for good after the fix, upright beside the fan for the read-back
      const stuck = ease(lp, T.crash - .012, T.crash), outK = ease(lp, T.memo, T.memo + .025);
      memo.visible = stuck > 0 && press.visible;
      memo.position.set(mix(mix(MX + .35, MX + .62, stuck), TABLE_X + .32, outK) + fan * .5, mix(mix(.45, .4, outK), 2.15, fan) + (1 - fixed) * jam * Math.sin(tt * 40) * .01, MZ + mix(0, .02, outK) - fan * .05);
      memo.rotation.set(mix(0, 1.25, fan), mix(Math.PI / 2, 0, outK) + fan * .22, jam * (1 - fixed) * .18, 'YXZ');
      memoMat.emissiveIntensity = jam * (1 - fixed) * (.5 + .2 * Math.sin(tt * 11));
      const foundIn = backOut(lin(lp, T.found, T.found + .025));
      found.group.visible = foundIn > .01; found.group.scale.setScalar(Math.max(.001, foundIn)); found.frameMat.emissiveIntensity = 1 + hit(lp, T.found + .02, .04) * 2;

      /* the robot: where it stands, what it aims the harness at */
      pathAt(WALK, lp, walker);
      let aim = 0;
      if (reading >= 0) { target.set(F[reading].x, .45, RACK_Z + .1); aim = 1; }
      else if (lp > T.march + .03 && lp < T.sort) { target.set(mix(.4, 3.7, (cf % 1)), .1, LINE_Z); aim = lp < T.tally + .03 ? .8 : 0; }
      else if (lp >= T.sort && lp < T.press) { const q = PENS[Math.min(2, Math.floor(lin(lp, T.sort + .02, T.press) * 3))]; target.set(q.x, .3, q.z); aim = .7; }
      else if (lp >= T.sheets && lp < T.crash) { target.set(MX - .2, .6, MZ); aim = .8; }
      else if (lp >= T.find && lp < T.find + .035) { target.set(MX - .55, 1.1, MZ + .3); aim = .5; }
      else if (lp >= T.fix && lp < T.rerun) { target.set(MX - .05, .5, MZ + .3); aim = 1; }
      else if (lp >= T.scan && lp < T.scanEnd + .005) { target.set(TABLE_X - .95 + lin(lp, T.scan, T.scanEnd) * 1.62, 2.2, MZ); aim = 1; }
      const recoil = hit(lp, T.crash, .05), lean = ease(lp, T.find - .02, T.find) * (1 - ease(lp, T.rerun, T.rerun + .02));
      const turn = ease(lp, T.turn, T.turn + .025), hop = Math.sin(Math.PI * lin(lp, T.turn + .02, T.turn + .05)) * .04 + Math.sin(Math.PI * lin(lp, T.tally, T.tally + .03)) * .08;
      const faceTo = aim > 0 || lp >= T.press ? Math.atan2((aim > 0 ? target.x : MX) - walker.x, (aim > 0 ? target.z : MZ) - walker.z) : .5;
      // keep the face towards the camera's side: never turn further than a quarter from it
      const stand = mix(Math.max(.2, Math.min(.75, faceTo)), .35, turn);
      root.position.set(walker.x - recoil * .12, hop, walker.z);
      root.rotation.set(-recoil * .22 + lean * .12, walker.walk > 0 ? mix(stand, walker.ry, walker.walk) : stand, 0);
      (made?.update ?? ((a, b) => bot.update(a, b)))(walker.walk > .05 ? lp * 110 : tt, walker.walk * live);
      const red = jam * (1 - fixed);
      for (const e of eyeMats) { e.m.emissive.copy(e.base).lerp(cRed, red); e.m.color.copy(e.m.emissive); e.m.emissiveIntensity = e.i + red * 1.5 + hit(lp, T.turn + .02, .04) * 2; }
      // a tool call: a short ribbon from the muzzle to what it works on, once per call
      root.updateMatrix(); gun.updateMatrix(); m4.multiplyMatrices(root.matrix, gun.matrix); muzzle.set(0, 0, .52).applyMatrix4(m4);
      const beat = aim > 0 && lp < T.turn ? Math.max(0, 1 - (cf % 1) * 1.6) * aim : 0, steady = lp >= T.fix && lp < T.rerun ? .8 : lp >= T.scan && lp < T.scanEnd ? .7 : 0;
      const on = Math.max(beat, steady) * live;
      shot.visible = false;
      if (on > .02) { stretch(shot, muzzle, target, .012 + .01 * on); shot.material.opacity = .55 * on; shot.material.color.copy(red > .3 ? cRed : steady ? cCool : cOk).lerp(cCool, .5); }
      muzzleFlash.position.copy(muzzle); muzzleFlash.material.opacity = on * .8; muzzleFlash.scale.setScalar(.25 + on * .3);
      spot.position.copy(target); spot.material.opacity = on * .7; spot.scale.setScalar(.2 + on * .35);

      ground.rimMat.emissiveIntensity = 1 + .2 * Math.sin(tt * 1.8) + hit(lp, T.tally, .04) * 1.5 + crash * 2 + hit(lp, T.found, .04) * 1.5;
      ground.rimMat.color.setHex(VIOLET).lerp(cRed, red * .8); ground.rimMat.emissive.copy(ground.rimMat.color);
      hubs.forEach((h, i) => { if (i < 3) h.bandMat.emissiveIntensity = .35 + .1 * Math.sin(tt * 1.5 + i); });

      const stacked = !!layout?.stacked;
      // the reduced-motion still stands a little further back: its frame is not the pinned one
      line(reduce ? .84 : lp, cam, stacked ? -.2 : -.4 - Math.max(0, 1.85 - camera.aspect) * .9 + (reduce ? .3 : 0), stacked ? 2.2 : reduce ? 1.27 : 1.15);
    },
  };
  return api;
}

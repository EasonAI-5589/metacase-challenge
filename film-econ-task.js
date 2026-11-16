/* film-econ-task.js — beat 0 of the economics Metacase film: Context & evidence (econ-0157).
 * The case is laid out on the plotting table (film-econ-kit.js). The robot brings the one data
 * file, data_for_analysis.dta, to a reader at the table's side, and the panel unrolls over the
 * table as a field of tiles: six columns, one per year (2012 to 2017), and twelve rows of
 * departments, counting up to 3,246 department-years. What the copy names then appears on the
 * panel itself, in the copy's order:
 *   lp .00–.05  the robot walks in with the file and feeds it to the reader
 *      .05–.15  the panel unrolls from the reader's corner; the year labels stand up; the count runs
 *      .16–.22  the variables: an upright axis named comp rises and every tile takes a height (the
 *               outcome is a number in each cell); a legend names inspectmain, which turns 0 to 1
 *      .30–.39  treatment and sample: the five cohort rows (first inspected 2013 … 2017) turn amber
 *               from their first inspection year on, a staircase of staggered treatment; the
 *               legend reads 180 / 3,246; the rows never inspected are framed teal: the control
 *      .40–.49  the four settings the task states stand up along the back edge: FE (row and
 *               column lines flash), cohort, control, cluster
 *      .50–.66  what is open: three empty sockets for the numbers to deliver (coef, SE, p), a
 *               30-minute dial, and a fifth post that stays dark under a question mark: the
 *               covariates the task does not name
 *      .66–.88  held; the robot walks on along the front edge towards the next set
 * The staircase is schematic (five cohort rows of twelve); the true counts are the printed ones.
 * Every state is a function of lp, so scrubbing backwards replays it; t only adds idle life. */
import { plotTable, axis, printed, walker, aim, lin, sm, mix, outBack, outCubic, pulse, window01 } from './film-econ-kit.js?v=mc-401ead81de';

const YEARS = [
  { key: '2012', color: 0x9aa3b2, rows: 605 }, { key: '2013', color: 0x45b5b0, rows: 517 }, { key: '2014', color: 0x5fc3d6, rows: 490 },
  { key: '2015', color: 0x6aa8e8, rows: 551 }, { key: '2016', color: 0x7d6ad8, rows: 540 }, { key: '2017', color: 0xa58be8, rows: 543 },
];
const ROWS = YEARS.reduce((n, y) => n + y.rows, 0); // 3,246 department-years
const NC = 6, NR = 12, N = NC * NR;
const X0 = -.7, DX = .68, Z0 = -2.15, DZ = .36, TW = .58, TD = .28;
const FIRST_COHORT_ROW = 7;            // rows 7..11: first inspected in 2013 … 2017; rows 0..6: never inspected
const READER = { x: -1.7, z: -.2 };
const EYE = 0xffd666, S = 1.4;

// the timeline, in local progress
const T = {
  insertA: .03, insertB: .05,
  rollA: .052, rollB: .145, pop: .02,
  axisA: .16, barsA: .168, barsB: .205, legendA: .19,
  treatA: .30, treatStep: .014, tagA: .335, frameA: .355,
  posts: [.40, .42, .44, .46],
  sockets: [.51, .53, .55], dialA: .57, queryA: .61,
};
const HALF = Math.PI / 2;
// where the robot stands and which way it faces: [lp, x, z, yaw]
const WALK = [
  [0, -2.9, 1.6, 2.6], [.03, -2.5, -.2, 1.3], [.155, -2.5, -.2, 1.3], [.175, -2.5, -.2, 2.3], [.215, -2.5, -.2, 2.3],
  [.275, -1.9, 1.1, 1.2], [.4, -1.9, 1.1, 1.2], [.42, -1.9, 1.1, 2.0], [.485, -1.9, 1.1, 2.0],
  [.53, -1.5, 2.6, 1.15], [.6, -1.5, 2.6, 1.15], [.625, -1.5, 2.6, 1.8], [.74, -1.5, 2.6, 1.8], [.79, -1.5, 2.6, 1.15], [1, -1.5, 2.6, 1.15],
];

export async function build({ THREE, kit, set, reduce, hand, util, layout, camera: viewCamera }) {
  const { PALETTE, add, block, cyl, rbox, mat, glowMat } = kit;
  const TEAL = PALETTE.teal, AMBER = PALETTE.amber, STEEL = 0x6f86c8, NAVY = 0x1c2740, DEEP = 0x111a2d;
  const glow = (c, i) => glowMat(c, i).clone(); // kit materials are shared across beats: clone what this beat animates
  const flat = (geo, material, x, y, z, parent = set) => add(parent, geo, material, x, y, z, false);
  const P = o => printed({ THREE, kit, parent: set, ...o });
  const MONO = '"Space Mono", ui-monospace, monospace';
  let seed = 20240157;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  const table = plotTable({ THREE, kit, set, accent: TEAL });

  /* ---- the panel: one instanced tile per cell ---- */
  const tileGeo = rbox(TW, .1, TD, .03).clone(); tileGeo.translate(0, .05, 0);
  const tiles = new THREE.InstancedMesh(tileGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7, emissive: 0xffffff, emissiveIntensity: 0 }), N);
  tiles.castShadow = true; tiles.receiveShadow = true; tiles.frustumCulled = false; set.add(tiles);
  const cell = [];
  const far = Math.hypot(5 * DX + .4, Math.max(READER.z - Z0, Z0 + 11 * DZ - READER.z)); // the farthest cell from the reader's corner
  for (let r = 0; r < NR; r++) for (let c = 0; c < NC; c++) {
    const x = X0 + c * DX, z = Z0 + r * DZ, d = Math.hypot(x - (X0 - .4), z - READER.z);
    const cohort = r - FIRST_COHORT_ROW;                 // 0..4 for the cohort rows
    const treated = cohort >= 0 && c >= cohort + 1;      // from its first inspection year on
    cell.push({
      x, z, c, r, start: T.rollA + (T.rollB - T.rollA - T.pop) * d / far, h: 1.1 + rnd() * 2.6,
      treatAt: treated ? T.treatA + cohort * T.treatStep + (c - cohort - 1) * .004 : 9, // 9: never
      base: new THREE.Color(YEARS[c].color).multiplyScalar(r < FIRST_COHORT_ROW ? .78 : 1),
    });
  }
  const amberCol = new THREE.Color(0xffb62e), white = new THREE.Color(0xffffff), col = new THREE.Color();
  // the year labels, tilted up at the foot of each column
  const yearLabels = YEARS.map((y, c) => {
    const m = P({ key: `year-${y.key}`, lines: [{ text: y.key, size: 150, weight: 700, color: '#cfe0f2', font: MONO }], w: .56, h: .2, x: X0 + c * DX, y: .1, z: 2.07, px: 384 });
    m.rotation.x = -HALF + .9; return m;
  });
  // row and column lines over the panel: the fixed effects and the clusters flash them
  const lineMat = c => new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
  const lines = (list, material) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(list, 3)); const l = new THREE.LineSegments(g, material); l.frustumCulled = false; set.add(l); return l; };
  const GX0 = X0 - DX / 2, GX1 = X0 + 5.5 * DX, GZ0 = Z0 - DZ / 2, GZ1 = Z0 + 11.5 * DZ, LY = .5;
  const rowList = [], colList = [];
  for (let r = 0; r <= NR; r++) rowList.push(GX0, LY, GZ0 + r * DZ, GX1, LY, GZ0 + r * DZ);
  for (let c = 0; c <= NC; c++) colList.push(GX0 + c * DX, LY, GZ0, GX0 + c * DX, LY, GZ1);
  const rowMat = lineMat(0x8ff6ff), colMat = lineMat(0x8ff6ff);
  lines(rowList, rowMat); lines(colList, colMat);

  /* ---- the reader, its cable and the file ---- */
  const reader = new THREE.Group(); reader.position.set(READER.x, 0, READER.z); set.add(reader);
  block(reader, .5, .42, .62, 0x26324f, 0, 0, 0, .06);
  const slotMat = glow(TEAL, .6);
  flat(rbox(.06, .26, .4, .02), slotMat, -.255, .24, 0, reader);
  const cableMat = glow(TEAL, .3);
  const cable = flat(rbox(1, .03, .05, .012), cableMat, 0, .02, READER.z); // from the reader to the panel's edge
  const cableA = READER.x + .25, cableB = GX0;
  cable.position.x = (cableA + cableB) / 2; cable.scale.x = cableB - cableA;
  const fileMat = glow(TEAL, .5);
  const file = new THREE.Group(); set.add(file);
  flat(rbox(.3, .38, .09, .03), mat(0xe9eef6), 0, 0, 0, file).castShadow = true;
  flat(rbox(.22, .1, .1, .02), fileMat, 0, .08, 0, file);
  const fileName = P({ key: 'file-name', lines: [{ text: 'data_for_analysis.dta', size: 50, weight: 700, color: '#ffffff', font: MONO }], w: 2.1, h: .29, x: READER.x - .2, y: 2.0, z: READER.z - .2, px: 640 });

  /* ---- the variables: the outcome's axis and the treatment's legend ---- */
  const compAxis = axis({ THREE, kit, len: 1.25, ticks: 4, color: 0x9fd8ff });
  compAxis.group.rotation.z = HALF; compAxis.group.position.set(GX0 - .14, 0, GZ0 - .12); set.add(compAxis.group);
  const compName = P({ key: 'comp', lines: [{ text: 'comp', size: 190, weight: 800, color: '#ffffff', font: MONO }], w: .78, h: .34, x: GX0 - .62, y: 1.32, z: GZ0 - .12, px: 384 });
  const legend = new THREE.Group(); legend.position.set(4.0, 0, .35); set.add(legend);
  flat(rbox(1.36, .74, .05, .03), mat(0x0d1524), 0, .45, 0, legend);
  const legendEdge = glow(AMBER, 1);
  flat(rbox(1.42, .8, .03, .03), legendEdge, 0, .45, -.014, legend);
  const legendName = printed({ THREE, kit, parent: legend, key: 'inspectmain', lines: [{ text: 'inspectmain = 1', size: 60, weight: 700, color: '#f2b545', font: MONO }], w: 1.28, h: .22, x: 0, y: .64, z: .03, px: 640 });
  const legendCount = printed({ THREE, kit, parent: legend, key: 'treated-count', lines: [{ text: '180 / 3,246', size: 104, weight: 800, color: '#ffffff' }], w: 1.28, h: .32, x: 0, y: .32, z: .03, px: 640 });

  /* ---- the control group: a teal frame round the rows never inspected, and its name ---- */
  const frameMat = glow(0x8ff6ff, 1.6);
  const CZ0 = GZ0 - .03, CZ1 = GZ0 + FIRST_COHORT_ROW * DZ - .03, FY = .03;
  const frame = new THREE.Group(); set.add(frame);
  for (const z of [CZ0, CZ1]) flat(rbox(GX1 - GX0 + .12, .05, .05, .018), frameMat, (GX0 + GX1) / 2, FY, z, frame);
  for (const x of [GX0 - .03, GX1 + .03]) flat(rbox(.05, .05, CZ1 - CZ0, .018), frameMat, x, FY, (CZ0 + CZ1) / 2, frame);
  const controlName = P({ key: 'control-name', lines: [{ text: 'never inspected', size: 74, weight: 700, color: '#8ff0e6' }, { text: 'control group', size: 62, weight: 600, color: '#cfe0f2' }], w: 1.6, h: .5, x: 3.78, y: .2, z: -2.02, px: 640 });
  controlName.rotation.x = -HALF + .95;

  /* ---- the four settings the task states, and the one it does not ---- */
  const POST_Z = -2.78, postX = [-.3, .85, 2.0, 3.15];
  const posts = ['FE', 'cohort', 'control', 'cluster'].map((name, i) => {
    const g = new THREE.Group(); g.position.set(postX[i], 0, POST_Z); set.add(g);
    cyl(g, .03, .04, 1.0, 0x394560, 0, 0, 0, 10);
    flat(rbox(1.0, .42, .05, .03), mat(0x0d1524), 0, 1.2, 0, g);
    const edge = glow(TEAL, 1.1);
    flat(rbox(1.06, .48, .03, .03), edge, 0, 1.2, -.014, g);
    printed({ THREE, kit, parent: g, key: `setting-${name}`, lines: [{ text: name, size: 150, weight: 800, color: '#ffffff' }], w: .92, h: .36, x: 0, y: 1.2, z: .03, px: 512 });
    return { g, edge, at: T.posts[i] };
  });
  const open = new THREE.Group(); open.position.set(4.28, 0, POST_Z); set.add(open);
  cyl(open, .03, .04, 1.0, 0x2a3350, 0, 0, 0, 10);
  flat(rbox(1.0, .42, .05, .03), mat(0x0d1524), 0, 1.2, 0, open);
  const openEdge = glow(STEEL, .35);
  flat(rbox(1.06, .48, .03, .03), openEdge, 0, 1.2, -.014, open);
  printed({ THREE, kit, parent: open, key: 'setting-covariates', lines: [{ text: 'covariates', size: 104, weight: 700, color: '#8e9ab3' }], w: .92, h: .3, x: 0, y: 1.2, z: .03, px: 512 });
  const query = P({ key: 'query', lines: [{ text: '?', size: 300, weight: 800, color: '#f2b545' }], w: .5, h: .5, x: 4.28, y: 1.85, z: POST_Z, px: 256 });

  /* ---- what is to be delivered: three empty sockets; and the time allowed ---- */
  const ringGeo = new THREE.TorusGeometry(.25, .024, 8, 48); ringGeo.rotateX(HALF);
  const sockets = ['coef', 'SE', 'p'].map((name, i) => {
    const x = .55 + i * .76, z = 2.78, ringMat = glow(AMBER, .2);
    const g = new THREE.Group(); g.position.set(x, 0, z); set.add(g);
    flat(new THREE.CylinderGeometry(.24, .24, .012, 32), mat(0x0c1322), 0, .008, 0, g);
    flat(ringGeo, ringMat, 0, .03, 0, g);
    const name3 = P({ key: `socket-${name}`, lines: [{ text: name, size: 170, weight: 800, color: '#ffe2a8' }], w: .42, h: .2, x, y: .06, z: z + .02, px: 256 });
    name3.rotation.x = -HALF + .7;
    return { g, ringMat, label: name3, at: T.sockets[i] };
  });
  const dial = new THREE.Group(); dial.position.set(3.72, 0, 2.66); set.add(dial);
  const face = new THREE.Group(); face.position.y = .1; face.rotation.x = -.95; dial.add(face); // leaning back
  const dialMat = glow(AMBER, 1.2);
  flat(new THREE.TorusGeometry(.36, .028, 8, 48), dialMat, 0, .36, 0, face);
  flat(new THREE.CylinderGeometry(.35, .35, .03, 40), mat(0x0d1524), 0, .36, -.02, face).rotation.x = HALF;
  const handPivot = new THREE.Group(); handPivot.position.set(0, .36, .02); face.add(handPivot);
  flat(rbox(.028, .3, .02, .01), dialMat, 0, .15, 0, handPivot);
  printed({ THREE, kit, parent: face, key: 'limit', lines: [{ text: '30', size: 190, weight: 800, color: '#ffffff' }, { text: 'min', size: 96, weight: 700, color: '#ffe2a8' }], w: .46, h: .4, x: 0, y: .36, z: .03, px: 384 });

  /* ---- the robot ---- */
  const bot = kit.robot(PALETTE.cream, EYE);
  bot.root.scale.setScalar(S); set.add(bot.root);
  const walk = walker(WALK), where = { x: 0, z: 0, yaw: 0, walking: 0 };

  hand.task = { id: 'econ-0157', rows: ROWS, years: YEARS.map(y => ({ year: y.key, color: y.color, rows: y.rows })), checks: 3 };

  /* ---- the camera: high over the whole table, then down to a three-quarter view from the right ---- */
  const FROM = { pos: [-2.2, 9.0, 9.8], look: [.7, .1, -.1], fov: 38 }, TO = { pos: [1.5, 5.6, 12.2], look: [.55, .4, -.1], fov: 31 };
  const camera = { from: { pos: [...FROM.pos], look: [...FROM.look], fov: FROM.fov }, to: { pos: [...TO.pos], look: [...TO.look], fov: TO.fov } };
  const stackedQuery = layout ? null : matchMedia('(max-width: 600px), (max-aspect-ratio: 11/10)');
  const isStacked = () => (layout ? layout.stacked : stackedQuery.matches);
  const dummy = new THREE.Object3D(), camQuat = viewCamera.quaternion, cTeal = new THREE.Color(TEAL), cAmber = new THREE.Color(AMBER);

  return {
    camera,
    update(lp, t, dt, ui) {
      const L = reduce ? 1 : lp, T2 = reduce ? 0 : t;

      /* the robot and the file it carries */
      walk(L, where);
      bot.root.position.set(where.x, 0, where.z); bot.root.rotation.y = where.yaw;
      const carry = 1 - lin(L, T.insertA, T.insertB);
      bot.grip(sm(lin(carry, 0, .5)));
      bot.update(T2, where.walking);
      const fly = sm(lin(L, T.insertA, T.insertB)), sx = Math.sin(where.yaw), cz = Math.cos(where.yaw);
      const hx = where.x + sx * .42, hz = where.z + cz * .42, slotX = READER.x - .2;
      file.position.set(mix(hx, slotX, fly), mix(.5, .26, fly) + Math.sin(Math.PI * fly) * .25, mix(hz, READER.z, fly));
      file.rotation.y = where.yaw + HALF * fly * 0;
      file.scale.setScalar(1 - .75 * sm(lin(L, T.insertB - .006, T.insertB + .004)));
      file.visible = L < T.insertB + .004;
      const fed = pulse(L, T.insertB, .004, .03), rolling = window01(L, T.insertB, T.insertB + .01, T.rollB, T.rollB + .03);
      slotMat.emissiveIntensity = .6 + 4 * fed + 1.2 * rolling * (.6 + .4 * Math.sin(T2 * 9));
      cableMat.emissiveIntensity = .3 + 3 * fed + 1.6 * rolling * (.6 + .4 * Math.sin(T2 * 9 + 1));
      fileName.material.opacity = window01(L, T.insertB, T.insertB + .02, .25, .28); // gone once the robot walks on
      fileName.quaternion.copy(camQuat);

      /* the panel */
      const bars = lin(L, T.barsA, T.barsB);
      let shown = 0;
      for (let i = 0; i < N; i++) {
        const q = cell[i], a = lin(L, q.start, q.start + T.pop);
        shown += a;
        const pop = a <= 0 ? 0 : outBack(a, 1.4);
        // the heights arrive as a wave from the axis' corner
        const hk = sm(lin(bars, (q.c + q.r * .35) / 12, (q.c + q.r * .35) / 12 + .45));
        const tk = sm(lin(L, q.treatAt, q.treatAt + .012)), hit = pulse(L, q.treatAt, .004, .02);
        dummy.position.set(q.x, .012 + .05 * tk + .1 * hit, q.z);
        dummy.scale.set(pop, pop * mix(.5, q.h, hk) * (1 + .12 * hit), pop);
        dummy.rotation.set(0, 0, 0); dummy.updateMatrix();
        tiles.setMatrixAt(i, dummy.matrix);
        const born = pulse(L, q.start + T.pop * .5, .004, .016);
        col.copy(q.base).lerp(amberCol, tk).lerp(white, Math.min(1, born * .7 + hit * .6));
        tiles.setColorAt(i, col);
      }
      tiles.instanceMatrix.needsUpdate = true; tiles.instanceColor.needsUpdate = true;
      ui.set('files', Math.round(ROWS * shown / N).toLocaleString('en-US'));
      yearLabels.forEach((m, c) => { m.material.opacity = sm(lin(L, T.rollA + .02 + c * .012, T.rollA + .05 + c * .012)); });

      /* the variables */
      const ax = outBack(lin(L, T.axisA, T.axisA + .03), 1.2);
      compAxis.group.scale.setScalar(Math.max(.001, ax)); compAxis.group.visible = ax > 0;
      compAxis.mat.emissiveIntensity = 1.2 + 2.5 * pulse(L, T.axisA + .02, .004, .03);
      compName.material.opacity = sm(lin(L, T.axisA + .015, T.axisA + .04));
      compName.quaternion.copy(camQuat);
      const lg = outBack(lin(L, T.legendA, T.legendA + .03), 1.2);
      legend.position.y = -1.6 * (1 - lg); legend.visible = lg > 0;
      legendName.material.opacity = sm(lin(L, T.legendA + .01, T.legendA + .035));
      legendCount.material.opacity = sm(lin(L, T.tagA, T.tagA + .02));
      const tagHit = pulse(L, T.tagA, .004, .03);
      legendEdge.emissiveIntensity = 1 + 2.4 * tagHit + .15 * Math.sin(T2 * 2);

      /* the control group */
      const fr = sm(lin(L, T.frameA, T.frameA + .02)), frHit = pulse(L, T.frameA + .012, .004, .03), ctlHit = pulse(L, T.posts[2] + .012, .004, .03);
      frame.visible = fr > 0;
      frameMat.emissiveIntensity = (1.6 + 3 * frHit + 3 * ctlHit) * fr;
      controlName.material.opacity = sm(lin(L, T.frameA + .01, T.frameA + .035));

      /* the settings */
      for (const p of posts) {
        const k = outBack(lin(L, p.at, p.at + .022), 1.3);
        p.g.position.y = -1.9 * (1 - k); p.g.visible = k > 0;
        p.edge.emissiveIntensity = 1.1 + 3 * pulse(L, p.at + .014, .004, .03) + .12 * Math.sin(T2 * 2 + p.at * 90);
      }
      const fe = pulse(L, T.posts[0] + .012, .006, .035), cl = pulse(L, T.posts[3] + .012, .006, .035), co = pulse(L, T.posts[1] + .012, .006, .035);
      rowMat.opacity = .85 * Math.max(fe, cl); colMat.opacity = .85 * fe;
      const ok = outBack(lin(L, T.queryA, T.queryA + .025), 1.3);
      open.position.y = -1.9 * (1 - ok); open.visible = ok > 0;
      query.material.opacity = sm(lin(L, T.queryA + .02, T.queryA + .04)) * (.7 + .3 * Math.sin(T2 * 2.4));
      query.position.y = 1.85 + Math.sin(T2 * 1.6) * .04; query.quaternion.copy(camQuat);

      /* the sockets and the dial */
      for (const s of sockets) {
        const k = sm(lin(L, s.at, s.at + .012)), hit = pulse(L, s.at, .004, .025);
        s.ringMat.emissiveIntensity = .2 + 1.3 * k + 3.5 * hit + .25 * k * Math.sin(T2 * 2.2 + s.at * 60);
        s.label.material.opacity = k;
        const open2 = outBack(lin(L, s.at - .012, s.at + .006), 1.6);
        s.g.scale.setScalar(Math.max(.001, open2)); s.g.visible = open2 > 0;
      }
      const dk = outBack(lin(L, T.dialA, T.dialA + .025), 1.3);
      dial.scale.setScalar(Math.max(.001, dk)); dial.visible = dk > 0;
      dialMat.emissiveIntensity = 1.2 + 2.5 * pulse(L, T.dialA + .016, .004, .03);
      handPivot.rotation.z = -.5 - T2 * .5;

      /* the table's edge answers the file, the staircase and the open item (cohort flash: amber) */
      const edgeAmber = Math.max(co, tagHit, pulse(L, T.queryA + .02, .004, .04));
      table.rimMat.color.copy(cTeal).lerp(cAmber, Math.min(1, edgeAmber)); table.rimMat.emissive.copy(table.rimMat.color);
      table.rimMat.emissiveIntensity = 1.1 + .2 * Math.sin(T2 * 1.5) + 2.5 * fed + 1.6 * edgeAmber + 1.2 * frHit;

      /* stacked (the copy below the picture): the frame centres on the table */
      const stacked = isStacked();
      FROM.look[0] = stacked ? .6 : .7; TO.look[0] = stacked ? .7 : .55;
      aim(camera.from, FROM.pos, FROM.look, FROM.fov, viewCamera.aspect); aim(camera.to, TO.pos, TO.look, TO.fov, viewCamera.aspect);
    },
  };
}

/* film-soc-grading.js — beat 3 of the society Metacase film (HR-T3-114): Outcomes & verification.
 * The yard after the agent has stopped. Its work stands where it left it: the three package crates
 * on the acceptance desk, the memo and the workbook on their stands. Only now is the rubric lowered
 * into the yard, sealed, onto the lamp wall at the back: 34 lamps, 28 criteria to earn and six
 * penalties. Every lamp is judged by a session of its own: a spark leaves the thing it judges and
 * flies to its lamp, which turns green (met), stays a dull red (missed) or, for a penalty, stays
 * dark (not triggered). The robot does not touch anything: it steps back, walks to whatever is
 * being judged and watches.
 *
 * lp timeline (the page's story marks are 0, .347, .475, .523 and .72)
 *   .00–.06   the sealed rubric comes down its cable onto the wall; the lamps wake; the robot steps
 *             back from the desk and waits behind its far end; the plates and tags of a step fold
 *             away once it has been judged, and the packages' plates stand again for the verdict
 *   .06–.33   the acceptance desk: the press stamps A (.105: conditional, 220,320 for approval, a
 *             tenth slides off as retained, 24,480), B (.175: three of four units, 275,400) and C
 *             (.245: one of two, 102,000). Units that pass turn green, the others stay amber. Two
 *             lamps for each package (status, amount), then ten more from the workbook
 *   .347–.46  the measuring rack: the reported 67 of 73 and the rubric's 73 of 73 both run past the
 *             75% line, so B stands; the lamp for the choice of measure stays red
 *   .45–.47   the six penalties are judged: none is triggered
 *   .475–.52  the hubs: one pooled bar, 4.33, is all the memo shows; beside it the three net changes
 *             it left out (6.5, 4.5, 2.0) stand as empty outlines: three lamps stay red
 *   .523–.67  the memo: its claim is flagged amber; the thread to the source files breaks off
 *   .72       the verdict: the wall counts 19 of 28 and 0 of 6, the meter stands at 79 of 106
 *   .80–1     hold, with idle life
 * Everything is a function of lp, plus small idle motion from t (none when ctx.reduce).
 * All entities and data of this case are synthetic. */
import { yard, hub, crate, sign, STATUS, cameraLine, pathAt, lin, sm, ease, mix, backOut, hit } from './film-soc-kit.js?v=mc-1c165fc3e2';

const TAU = Math.PI * 2;
const TOTAL = 106, EARNED = 79;
// The run's outcome, in the order the lamps are judged: M met, X missed (19 and 9 of the 28
// criteria to earn), N a penalty (6, none triggered). Six package checks, ten on scope, attendance
// and tests, opportunity and behaviour (the middle one, the choice of measure, is missed), the
// penalties, three hub-level net changes and two on attribution (all missed), then four general
// ones (traceability and closure missed).
const ORDER = 'MMMMMM' + 'MMMMMMMMMM' + 'MXM' + 'NNNNNN' + 'XXXXX' + 'XMXX';
// each check's points, as the rubric weights them; the met ones sum to the run's 79
const WEIGHTS = [7, 10, 10, 3, 7, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3];
// when each lamp is judged (lp), and what its spark leaves from
const HIT = [.113, .123, .183, .195, .253, .263,
  .296, .3, .304, .308, .312, .316, .32, .324, .328, .332,
  .356, .432, .446,
  .452, .455, .458, .461, .464, .467,
  .498, .506, .514, .562, .578,
  .62, .635, .65, .665];
const SRC = 'AABBCC' + 'WWWWWWWWWW' + 'WRW' + 'KKKKKK' + '123MM' + 'TWTT';
const FLY = .03, VERDICT = .72;
const STAMPS = [.105, .175, .245];

// where things stand, in set coordinates (the yard is centred on x = .5)
const WALL = { x: -.2, z: -2.35 }, DESK = { x: .15, z: 1.25, top: .3 }, RACK = { x: -2.3, z: 2.1 }, RAIL_Z = .62;
const HUBS = [2.5, 3.35, 4.2], HUB_Z = -1.75, BAR_Z = -1.02, POOL_X = 1.95, PT = .2;   // PT: bar height per point
const NET = [6.5, 4.5, 2.0], POOLED = 4.33;
const MEMO = { x: 3.6, z: 1.7 }, BOOK = { x: 4.3, z: 1.15 }, FILES = { x: 4.2, z: 2.55 };

const springy = x => { const p = Math.min(1, Math.max(0, x)) - 1; return 1 + 2.6 * p * p * p + 1.6 * p * p; };
const decay = (x, k) => (x < 0 ? 0 : Math.exp(-x / k));

function canvasTexture(THREE, w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
function roundRect(g, x, y, w, h, r, fill) { g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }

export async function build({ THREE, kit, set, accent, loadWeapons, hand, util, reduce, layout, camera: viewCamera, renderer }) {
  const { PALETTE, add, block, cyl, ball, rbox, mat, robot, GUN_HOLD } = kit;
  const { clamp, glowSprite } = util;
  const glowMap = glowSprite(0xffffff, 1).material.map;
  const own = (color, emissive = color, intensity = 1, rough = .5) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: rough, metalness: 0 });
  const basic = (color = 0xffffff) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
  const additive = (opts = {}) => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, ...opts });
  const tc = new THREE.Color();
  const label = (key, lines, w, h, px = 512) => {
    const tex = kit.labelTexture(`soc-grade:${key}`, lines, { width: px, height: Math.round(px * h / w) });
    const material = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false });
    return { mesh: new THREE.Mesh(new THREE.PlaneGeometry(w, h), material), material };
  };
  const MONO = '"Space Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  const css = n => '#' + n.toString(16).padStart(6, '0');

  /* ---- the yard ---- */
  const ground = yard({ THREE, kit, set, accent });

  /* ---- the lamp wall: 28 criteria in four rows, six penalties beside them, a meter underneath ---- */
  const wall = new THREE.Group(); wall.position.set(WALL.x, 0, WALL.z); set.add(wall);
  [-1.7, 1.7].forEach(x => block(wall, .3, .46, .5, 0x1f2b47, x, 0, 0, .05));
  block(wall, 4.6, 2.46, .16, 0x151f36, 0, .42, 0, .06);
  const wallEdge = own(accent, accent, .7);
  add(wall, rbox(4.66, .05, .2, .02), wallEdge, 0, 2.9, 0, false);
  add(wall, rbox(.03, 1.75, .02, .01), mat(0x2c3a5c), 1.0, 1.72, .085, false);          // between criteria and penalties
  const N = ORDER.length, lampAt = [];
  { let k = 0, q = 0;
    for (let i = 0; i < N; i++) {
      if (ORDER[i] === 'N') { lampAt.push([1.42 + (q % 2) * .42, 2.09 - Math.floor(q / 2) * .38]); q++; }
      else { lampAt.push([-1.95 + (k % 7) * .42, 2.28 - Math.floor(k / 7) * .38]); k++; }
    } }
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(.115, 18, 12).scale(1, 1, .55), basic(), N);
  const sockets = new THREE.InstancedMesh(new THREE.TorusGeometry(.14, .014, 6, 28), basic(), N);
  const halos = new THREE.InstancedMesh(new THREE.PlaneGeometry(.62, .62), additive({ map: glowMap }), N);
  const sparks = new THREE.InstancedMesh(new THREE.SphereGeometry(.05, 10, 8), basic(), N);
  const sparkGlow = new THREE.InstancedMesh(new THREE.PlaneGeometry(.42, .42), additive({ map: glowMap }), N);
  const m4 = new THREE.Matrix4(), p3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), zero = new THREE.Vector3(0, 0, 0), qId = new THREE.Quaternion();
  for (let i = 0; i < N; i++) {
    const [x, y] = lampAt[i], pen = ORDER[i] === 'N';
    lamps.setMatrixAt(i, m4.makeTranslation(x, y, .1)); lamps.setColorAt(i, tc.setRGB(.03, .035, .05));
    sockets.setMatrixAt(i, m4.makeTranslation(x, y, .09)); sockets.setColorAt(i, pen ? tc.setRGB(.55, .38, .1) : tc.setRGB(.3, .36, .5));
    halos.setMatrixAt(i, m4.makeTranslation(x, y, .12)); halos.setColorAt(i, tc.setRGB(0, 0, 0));
    sparks.setMatrixAt(i, m4.compose(zero, qId, zero)); sparks.setColorAt(i, tc.setRGB(1.4, 1.9, 2.4));
    sparkGlow.setMatrixAt(i, m4.compose(zero, qId, zero)); sparkGlow.setColorAt(i, tc.setRGB(.5, .8, 1));
  }
  [lamps, sockets, halos].forEach(m => { m.frustumCulled = false; wall.add(m); });
  [sparks, sparkGlow].forEach(m => { m.frustumCulled = false; m.renderOrder = 3; set.add(m); });
  halos.renderOrder = 2;
  // the two headings: what the lamps are, and (after the verdict) how they came out
  const head = (key, text, x, color) => { const l = label(key, [{ text, size: 62, weight: 700, color, font: MONO, track: 3 }], 1.9, .2, 768); l.mesh.position.set(x, 2.68, .09); wall.add(l.mesh); return l; };
  const headA0 = head('h-a0', '28 CRITERIA', -.69, '#aab6cc'), headA1 = head('h-a1', '19 / 28 MET', -.69, '#7ff0a6');
  const headB0 = head('h-b0', '6 PENALTIES', 1.63, '#aab6cc'), headB1 = head('h-b1', '0 / 6 TRIGGERED', 1.63, '#ffd27a');
  [headB0, headB1].forEach(l => l.mesh.scale.set(.62, .8, 1));
  // the meter: 106 points long, filled to the points earned
  const METER = { x0: -2.0, len: 4.0, y: .72 };
  add(wall, rbox(METER.len + .08, .14, .04, .02), mat(0x080c17, { rough: .95 }), 0, METER.y, .085, false);
  const fillMat = basic(0xffb347);
  const fill = add(wall, new THREE.BoxGeometry(1, .09, .03).translate(.5, 0, 0), fillMat, METER.x0, METER.y, .11, false);
  const meterTicks = new THREE.InstancedMesh(rbox(.02, .2, .02, .008), mat(0x4a5a80), 5); wall.add(meterTicks);   // one draw for the five
  for (let k = 0; k <= 4; k++) meterTicks.setMatrixAt(k, m4.makeTranslation(METER.x0 + METER.len * k / 4, METER.y, .1));
  const scoreLines = pts => [{ text: `${pts} / ${TOTAL}`, size: 150, weight: 800, color: '#ffd27a', font: MONO }];
  const scoreSign = sign({ THREE, kit, key: 'grade-score', lines: scoreLines(0), w: 1.7, h: .52, color: accent, px: 768 });
  scoreSign.group.position.set(-.75, 2.98, 0); wall.add(scoreSign.group);
  let shownPts = 0;

  /* ---- the sealed rubric: a case on a cable, lowered onto the wall once the agent has stopped ---- */
  const DOCK = new THREE.Vector3(WALL.x + 1.55, 2.93, WALL.z);
  const rubric = new THREE.Group(); set.add(rubric);
  block(rubric, .7, .4, .32, 0x1f2b47, 0, 0, 0, .06);
  const bandMat = own(PALETTE.amber, PALETTE.amber, .8);
  [-.24, .24].forEach(x => block(rubric, .05, .42, .34, bandMat, x, -.01, 0, .015).castShadow = false);
  const sealMat = own(PALETTE.amber, PALETTE.amber, 1.2);
  ball(rubric, .07, sealMat, 0, .44, 0, 12);
  const rubricTag = label('rubric', [{ text: 'RUBRIC', size: 120, weight: 800, color: '#ffe3ad', font: MONO, track: 6 }], .4, .13);
  rubricTag.mesh.position.set(0, .2, .165); rubric.add(rubricTag.mesh);
  const cable = add(rubric, new THREE.CylinderGeometry(.012, .012, 1, 6).translate(0, .5, 0), mat(0x5d6d8c), 0, .5, 0, false);
  const sealRing = add(set, new THREE.TorusGeometry(.5, .02, 6, 48), additive({ color: 0xffc45a, opacity: 0 }), DOCK.x, DOCK.y + .2, DOCK.z, false);

  /* ---- the acceptance desk: three crates under a stamping press ---- */
  block(set, 4.7, DESK.top, .95, 0x26324d, DESK.x, 0, DESK.z, .05);
  const deskEdge = own(accent, accent, .8);
  block(set, 4.74, .03, .99, deskEdge, DESK.x, DESK.top - .035, DESK.z, .012).castShadow = false;
  // the press: a column on a rail behind the desk, its arm reaching over the crates
  block(set, 4.9, .1, .16, 0x394560, DESK.x, 0, RAIL_Z, .03);
  const column = new THREE.Group(); column.position.set(DESK.x - 2.3, 0, RAIL_Z); set.add(column);
  block(column, .3, .16, .3, 0x2f3a56, 0, .08, 0, .04);
  cyl(column, .055, .065, 1.95, 0x394560, 0, .16, 0, 10);
  add(column, rbox(.12, .1, .86, .03), mat(0x394560), 0, 2.05, (DESK.z - RAIL_Z) / 2 + .06);
  const carriage = new THREE.Group(); carriage.position.set(0, 2.05, DESK.z - RAIL_Z); column.add(carriage);
  add(carriage, rbox(.3, .18, .3, .05), mat(0x2f3a56), 0, 0, 0);
  const pistonMat = mat(0x9aa3b2, { rough: .35 });
  const piston = add(carriage, new THREE.CylinderGeometry(.035, .035, 1, 10).translate(0, -.5, 0), pistonMat, 0, -.08, 0, false);
  const stampHead = new THREE.Group(); carriage.add(stampHead);
  add(stampHead, rbox(.5, .12, .5, .04), mat(0x2f3a56), 0, .06, 0);
  const padMat = own(PALETTE.amber, PALETTE.amber, .6);
  add(stampHead, rbox(.44, .03, .44, .012), padMat, 0, -.012, 0, false);
  const REST_Y = -.32, CRATE_TOP = DESK.top + .5;
  const PACK = [
    { letter: 'A', units: 1, x: DESK.x - 1.6, pass: [true], lines: [{ text: 'CONDITIONAL', size: 50, weight: 800, color: css(STATUS.pending), track: 3 }, { text: '220,320', size: 104, weight: 800, color: '#ffffff', font: MONO }, { text: '24,480 retained', size: 44, weight: 700, color: css(STATUS.pending) }], w: 1.2, h: .66, color: STATUS.pending },
    { letter: 'B', units: 4, x: DESK.x - .1, pass: [true, true, true, false], lines: [{ text: '3 / 4 UNITS', size: 56, weight: 800, color: '#7ff0a6', track: 3 }, { text: '275,400', size: 110, weight: 800, color: '#ffffff', font: MONO }], w: 1.2, h: .54, color: STATUS.verified },
    { letter: 'C', units: 2, x: DESK.x + 1.6, pass: [true, false], lines: [{ text: '1 / 2 UNITS', size: 56, weight: 800, color: '#7ff0a6', track: 3 }, { text: '102,000', size: 110, weight: 800, color: '#ffffff', font: MONO }], w: 1.2, h: .54, color: STATUS.verified },
  ];
  const WOOD = new THREE.Color(0xc79a5b), GREEN = new THREE.Color(STATUS.verified), AMBER = new THREE.Color(STATUS.pending);
  const packs = PACK.map((p, i) => {
    const c = crate({ THREE, kit, letter: p.letter, units: p.units });
    c.group.position.set(p.x, DESK.top, DESK.z); set.add(c.group);
    c.segments.forEach(s => { s.mat.emissive = new THREE.Color(0x000000); });
    const plate = sign({ THREE, kit, key: `grade-pack-${p.letter}`, lines: p.lines, w: p.w, h: p.h, color: p.color });
    plate.group.position.set(p.x, 1.02, DESK.z - .05); plate.group.rotation.x = -.12; plate.group.visible = false; set.add(plate.group);
    const ring = add(set, new THREE.RingGeometry(.84, 1, 48).rotateX(-Math.PI / 2), additive({ opacity: 0 }), p.x, DESK.top + .012, DESK.z, false);
    return { ...p, crate: c, plate, ring, at: STAMPS[i] };
  });
  // A's retained tenth: a slice that comes off its right end and stays amber
  const chipMat = mat(0xc79a5b).clone(); chipMat.emissive = new THREE.Color(0x000000);
  const chip = block(set, .05, .5, .52, chipMat, 0, DESK.top, DESK.z, .02); chip.visible = false;

  /* ---- the measuring rack: two measures of behaviour attainment against the 75% line ---- */
  const rack = new THREE.Group(); rack.position.set(RACK.x, 0, RACK.z); rack.rotation.y = .1; set.add(rack);
  [-.85, .85].forEach(x => block(rack, .09, .62, .09, 0x394560, x, 0, -.12, .03));
  const board = new THREE.Group(); board.position.set(0, .56, 0); board.rotation.x = -.42; rack.add(board);
  add(board, rbox(2.3, 1.0, .07, .04), mat(0x151f36), 0, .5, 0);
  const rackEdge = own(PALETTE.sky, PALETTE.sky, .6);
  add(board, rbox(2.36, 1.06, .04, .03), rackEdge, 0, .5, -.02, false);
  const TRACK = { x0: -.28, len: 1.3 }, ROWS = [{ y: .66, value: 67 / 73, big: '67 / 73', small: 'REPORTED' }, { y: .3, value: 1, big: '73 / 73', small: 'RUBRIC' }];
  const rows = ROWS.map((r, k) => {
    add(board, rbox(TRACK.len + .04, .13, .03, .02), mat(0x080c17, { rough: .95 }), TRACK.x0 + TRACK.len / 2, r.y, .04, false);
    const material = basic(0x6aa8e8);
    const bar = add(board, new THREE.BoxGeometry(1, .09, .03).translate(.5, 0, 0), material, TRACK.x0, r.y, .06, false);
    const cap = label(`rack-${k}`, [{ text: r.big, size: 128, weight: 800, color: '#ffffff', font: MONO }, { text: r.small, size: 58, weight: 700, color: '#aab6cc', track: 4 }], .7, .31);
    cap.mesh.position.set(-.72, r.y, .045); board.add(cap.mesh);
    return { ...r, bar, material, cap };
  });
  const lineMat = basic(0xffb347);
  const line75 = add(board, rbox(.03, .78, .03, .012), lineMat, TRACK.x0 + TRACK.len * .75, .47, .07, false);
  const cap75 = label('rack-75', [{ text: '75%', size: 150, weight: 800, color: '#ffd27a', font: MONO }], .34, .15, 256);
  cap75.mesh.position.set(TRACK.x0 + TRACK.len * .75, .92, .045); board.add(cap75.mesh);
  const BAR_BLUE = new THREE.Color(.42, .66, .92), BAR_GREEN = new THREE.Color(.16, 1.0, .42);

  /* ---- the hubs: one pooled bar in front of the three net changes it hides ---- */
  const HUB_COLORS = [PALETTE.teal, PALETTE.sky, PALETTE.violet];
  HUBS.forEach((x, k) => { const h = hub({ THREE, kit, name: `HUB-0${k + 1}`, color: HUB_COLORS[k] }); h.group.position.set(x, 0, HUB_Z); h.group.scale.setScalar(.6); set.add(h.group); });
  const ghostFill = new THREE.MeshBasicMaterial({ color: STATUS.disputed, transparent: true, opacity: .24, depthWrite: false });
  const ghostLine = new THREE.LineBasicMaterial({ color: new THREE.Color(1.5, .45, .6), transparent: true, opacity: 1 });
  const ghosts = NET.map((v, k) => {
    const g = new THREE.Group(); g.position.set(HUBS[k], 0, BAR_Z); set.add(g);
    const box = new THREE.BoxGeometry(.36, 1, .2).translate(0, .5, 0);
    const body = new THREE.Mesh(box, ghostFill); g.add(body);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(box), ghostLine); g.add(edges);
    g.scale.y = v * PT;
    const tag = sign({ THREE, kit, key: `grade-net-${k}`, lines: [{ text: v.toFixed(1), size: 150, weight: 800, color: '#ffc2cf', font: MONO }], w: .62, h: .32, color: STATUS.disputed, px: 256 });
    tag.group.position.set(HUBS[k], v * PT + .08, BAR_Z); set.add(tag.group);
    return { g, tag, h: v * PT };
  });
  const poolMat = own(PALETTE.cream, PALETTE.amber, .12, .6);
  const pooled = add(set, new THREE.BoxGeometry(.4, 1, .22).translate(0, .5, 0), poolMat, POOL_X, 0, BAR_Z);
  // the line the four stand on: the pooled figure, then the three it was pooled from
  const baseMat = own(PALETTE.cream, PALETTE.amber, .5);
  const BASE_LEN = HUBS[2] + .25 - (POOL_X - .22);
  const baseLine = add(set, rbox(BASE_LEN, .02, .05, .01), baseMat, (POOL_X + HUBS[2]) / 2, .012, BAR_Z + .2, false);
  const pooledTag = sign({ THREE, kit, key: 'grade-pooled', lines: [{ text: POOLED.toFixed(2), size: 120, weight: 800, color: '#ffffff', font: MONO }, { text: 'POOLED', size: 52, weight: 700, color: '#aab6cc', track: 4 }], w: .78, h: .44, color: PALETTE.cream });
  set.add(pooledTag.group);

  /* ---- the deliverables: the memo and the workbook (ten sheets), and the thread to the sources ---- */
  const memoTex = canvasTexture(THREE, 384, 512, (g, w) => {
    roundRect(g, 0, 0, w, 512, 26, '#f6efe0');
    roundRect(g, 0, 0, w, 74, 26, '#6aa8e8'); g.fillStyle = '#6aa8e8'; g.fillRect(0, 40, w, 34);
    roundRect(g, 26, 20, 34, 40, 6, '#ffffff'); g.fillStyle = '#6aa8e8'; [30, 40, 50].forEach(y => g.fillRect(32, y, 22, 4));
    roundRect(g, 32, 104, 230, 22, 8, '#1f2a3a');
    roundRect(g, 32, 136, 150, 12, 6, '#9aa3b2');
    [.92, .86, .9, .62, 0, .88, .94, .7, 0, .9, .8].forEach((f, k) => { if (f) roundRect(g, 32, 172 + k * 22, (w - 64) * f, 10, 5, '#cfc7b6'); });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) roundRect(g, 32 + c * 108, 428 + r * 22, 98, 14, 4, r === 0 ? '#6aa8e8' : '#ddd5c4');
  });
  const workbookTex = canvasTexture(THREE, 512, 400, (g, w) => {
    roundRect(g, 0, 0, w, 400, 24, '#f6efe0');
    roundRect(g, 0, 0, w, 62, 24, '#3f9d6a'); g.fillStyle = '#3f9d6a'; g.fillRect(0, 30, w, 32);
    roundRect(g, 22, 14, 34, 34, 6, '#ffffff'); g.fillStyle = '#3f9d6a'; g.fillRect(28, 22, 22, 4); g.fillRect(28, 30, 22, 4); g.fillRect(28, 38, 22, 4); g.fillRect(37, 20, 4, 24);
    const x0 = 20, y0 = 78, cw = (w - 40) / 6, ch = 25;
    for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) {
      g.fillStyle = r === 0 ? '#bfe0cb' : c === 0 ? '#e7dfcf' : (r * 7 + c * 3) % 11 === 0 ? '#f8d58a' : (r + c) % 4 === 0 ? '#d6ecdd' : '#fbf7ee';
      g.fillRect(x0 + c * cw + 1, y0 + r * ch + 1, cw - 2, ch - 2);
    }
    g.fillStyle = '#d2c9b6'; for (let r = 0; r <= 10; r++) g.fillRect(x0, y0 + r * ch, w - 40, 2); for (let c = 0; c <= 6; c++) g.fillRect(x0 + c * cw, y0, 2, ch * 10);
    for (let k = 0; k < 10; k++) roundRect(g, 22 + k * 47, 344, 42, 34, 6, k === 0 ? '#3f9d6a' : '#ddd5c4');
  });
  function stand(tex, w, h, edgeColor, x, z, turn) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = turn; set.add(g);
    block(g, w * .62, .14, .44, 0x26324d, 0, 0, -.04, .05);
    const lean = new THREE.Group(); lean.position.y = .16; lean.rotation.x = -.13; g.add(lean);
    add(lean, rbox(w + .07, h + .07, .07, .035), own(edgeColor, edgeColor, .35), 0, h / 2, -.05);
    add(lean, rbox(w, h, .1, .045), mat(0xf7f5f0), 0, h / 2, 0);
    const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .22, roughness: .75, metalness: 0 });
    add(lean, new THREE.PlaneGeometry(w * .94, h * .94), face, 0, h / 2, .052, false);
    return { g, lean, face, h };
  }
  const memo = stand(memoTex, .74, 1.0, PALETTE.sky, MEMO.x, MEMO.z, -.22);
  const workbook = stand(workbookTex, .9, .7, PALETTE.green, BOOK.x, BOOK.z, -.5);
  // the flagged claim: a bar on the memo's page and the words beside it
  const claimMat = additive({ color: 0xffb347, opacity: 0 });
  add(memo.lean, new THREE.PlaneGeometry(.6, .05), claimMat, -.02, .5, .06, false);
  const claim = sign({ THREE, kit, key: 'grade-claim', lines: [{ text: '“irrefutably prove”', size: 66, weight: 800, color: '#ffd27a' }], w: 1.34, h: .3, color: STATUS.pending });
  claim.group.position.set(MEMO.x - .25, 1.36, MEMO.z + .05); claim.group.rotation.y = -.3; claim.group.visible = false; set.add(claim.group);
  // the source files, and the thread that should run from the memo's conclusions to them
  const files = new THREE.Group(); files.position.set(FILES.x, 0, FILES.z); files.rotation.y = -.3; set.add(files);
  block(files, .62, .3, .4, 0x394560, 0, 0, 0, .04);
  [0x9aa3b2, 0x6aa8e8, 0x45b5b0, 0x7d6ad8].forEach((c, k) => block(files, .1, .08, .3, c, -.21 + k * .14, .3, 0, .02).castShadow = false);
  const filesTag = label('files', [{ text: '17 FILES', size: 150, weight: 800, color: '#e8edf7', font: MONO, track: 3 }], .52, .16);
  filesTag.mesh.position.set(0, .15, .205); files.add(filesTag.mesh);
  const DOTS = 14, GAP_A = 5, GAP_B = 9;
  const T0 = new THREE.Vector3(MEMO.x + .34, 1.02, MEMO.z + .12), T1 = new THREE.Vector3(FILES.x - .05, .42, FILES.z - .1);
  const dotAt = (out, k) => { const u = k / (DOTS - 1); return out.set(mix(T0.x, T1.x, u), mix(T0.y, T1.y, u) + Math.sin(u * Math.PI) * .42, mix(T0.z, T1.z, u)); };
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(.03, 8, 6), basic(), DOTS);
  dots.frustumCulled = false; set.add(dots);
  for (let k = 0; k < DOTS; k++) { dots.setMatrixAt(k, m4.compose(zero, qId, zero)); dots.setColorAt(k, tc.setRGB(.9, .95, 1.1)); }
  const GAP = dotAt(new THREE.Vector3(), (GAP_A + GAP_B - 1) / 2);
  const crossMat = basic(new THREE.Color(1.8, .35, .55));
  const cross = new THREE.Group(); cross.position.copy(GAP); set.add(cross);
  [-1, 1].forEach(s => { const m = add(cross, rbox(.3, .05, .05, .02), crossMat, 0, 0, 0, false); m.rotation.z = s * Math.PI / 4; });
  const noIndex = sign({ THREE, kit, key: 'grade-noindex', lines: [{ text: 'NO SOURCE INDEX', size: 62, weight: 800, color: '#ffc2cf', track: 3 }], w: 1.15, h: .24, color: STATUS.disputed });
  noIndex.group.position.set(GAP.x + .2, GAP.y - .62, GAP.z + .05); noIndex.group.rotation.y = -.3; noIndex.group.visible = false; set.add(noIndex.group);

  // the verdict's ring across the yard
  const shockMat = additive({ color: 0x000000 });
  const shock = add(set, new THREE.RingGeometry(.93, 1, 128).rotateX(-Math.PI / 2), shockMat, WALL.x, .02, WALL.z + .4, false); shock.renderOrder = 2;

  /* ---- the agent: it has stopped. It walks to whatever is being judged and watches ---- */
  const bot = hand.dressedRobot?.() ?? robot(PALETTE.cream, 0x8ff6ff);
  bot.root.scale.setScalar(1.15); set.add(bot.root);
  let gun;
  const wi = hand.armed?.weaponIndex ?? 0;
  try { const { weapons } = await loadWeapons(); gun = weapons[wi].clone(true); } catch { gun = kit.blaster(accent); }
  gun.scale.setScalar(.56); gun.position.copy(GUN_HOLD.at); gun.rotation.copy(GUN_HOLD.turn); bot.root.add(gun); bot.grip(1);
  const WALK = [[0, .5, 2.35], [.028, 2.95, 2.2], [.05, 2.6, .15], [.335, 2.6, .15], [.342, 2.95, 1.9], [.348, 2.2, 2.6], [.36, -.65, 2.6], [.455, -.65, 2.6], [.47, 2.95, 2.55], [.478, 2.95, .4], [.487, 1.55, -.2],
    [.519, 1.55, -.2], [.528, 2.85, .3], [.54, 2.85, 1.45], [.688, 2.85, 1.45], [.698, 2.95, 2.5], [.715, 2.3, 2.65], [1, 2.3, 2.65]];
  // what it looks at: [lp, x, y, z], eased from one to the next
  const LOOK = [[0, DOCK.x, 4.5, DOCK.z], [.045, DOCK.x, DOCK.y, DOCK.z], [.075, PACK[0].x, .8, DESK.z], [.14, PACK[0].x, .8, DESK.z], [.16, PACK[1].x, .8, DESK.z], [.21, PACK[1].x, .8, DESK.z],
    [.232, PACK[2].x, .8, DESK.z], [.29, PACK[2].x, .8, DESK.z], [.32, BOOK.x, .6, BOOK.z], [.335, BOOK.x, .6, BOOK.z], [.365, RACK.x, .95, RACK.z], [.455, RACK.x, .95, RACK.z],
    [.485, HUBS[1], .7, BAR_Z], [.519, HUBS[1], .7, BAR_Z], [.54, MEMO.x, .9, MEMO.z], [.585, MEMO.x, .9, MEMO.z], [.61, GAP.x, GAP.y, GAP.z], [.68, GAP.x, GAP.y, GAP.z], [.715, WALL.x, 1.7, WALL.z], [1, WALL.x, 1.7, WALL.z]];
  const walker = { x: 0, z: 0, ry: 0, walk: 0 }, focus = new THREE.Vector3();
  function focusAt(lp) {
    let i = 0;
    while (i < LOOK.length - 2 && lp > LOOK[i + 1][0]) i++;
    const a = LOOK[i], b = LOOK[i + 1], k = ease(lp, a[0], b[0]);
    return focus.set(mix(a[1], b[1], k), mix(a[2], b[2], k), mix(a[3], b[3], k));
  }

  // what the next beat may reuse (data only)
  hand.grade = { score: EARNED / TOTAL, earned: EARNED, total: TOTAL, met: 19, partly: 0, missed: 9, penaltiesTriggered: 0, redLines: 0, order: ORDER };

  /* ---- the camera line: the wall as the rubric lands, the desk, the rack, the hubs, the memo, then the whole yard ---- */
  // g, sx and sy are for the stacked layout only: the width of the shot's group, and where its middle is
  const pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 }, cam = { from: pose, to: pose };
  const KEYS = [
    { at: 0, pos: [-.6, 1.7, 6.4], look: [-.35, 2.2, -2.2], fov: 40, g: 5.9, sx: .15, sy: -.4 },
    { at: .045, pos: [-.6, 1.9, 6.6], look: [-.35, 2.0, -2.2], fov: 40, g: 5.9, sx: .15, sy: -.4 },
    { at: .085, pos: [.1, 3.5, 8.9], look: [-.15, .95, .9], fov: 36, g: 6.0, sx: .6, sy: .9 },
    { at: .3, pos: [.3, 3.5, 8.9], look: [-.08, .95, .9], fov: 36, g: 6.0, sx: .55, sy: .9 },
    { at: .365, pos: [-2.1, 4.4, 7.4], look: [-2.3, .8, 2.1], fov: 35, g: 3.7, sx: 0.4, sy: 0.1 },
    { at: .45, pos: [-1.95, 4.4, 7.4], look: [-2.25, .8, 2.1], fov: 35, g: 3.7, sx: 0.4, sy: 0.1 },
    { at: .49, pos: [2.72, 4.6, 3.3], look: [2.52, .65, -1.0], fov: 36, g: 4.5, sx: .45, sy: .2 },
    { at: .52, pos: [2.82, 4.6, 3.3], look: [2.57, .65, -1.0], fov: 36, g: 4.5, sx: .45, sy: .2 },
    { at: .555, pos: [1.75, 2.9, 6.35], look: [3.36, .8, 1.73], fov: 34, g: 3.1, sx: 0.25, sy: 0.1 },
    { at: .665, pos: [1.9, 2.9, 6.4], look: [3.42, .8, 1.76], fov: 34, g: 3.1, sx: 0.25, sy: 0.1 },
    { at: .76, pos: [.2, 4.6, 10.4], look: [0, 1.4, -.6], fov: 31, g: 6.3, sx: .2, sy: .1 },
    { at: 1, pos: [.3, 4.5, 10.4], look: [0, 1.4, -.6], fov: 31, g: 6.3, sx: .2, sy: .1 },
  ];
  const shoot = cameraLine(KEYS);
  // With the copy below the picture (the framework's stacked layout) the frame is narrow and low:
  // each shot stands back until its group fits the width, and is centred on it.
  function frame(lp) {
    shoot(lp, cam);
    if (!layout?.stacked) return;
    let i = 0;
    while (i < KEYS.length - 2 && lp > KEYS[i + 1].at) i++;
    const ka = KEYS[i], kb = KEYS[i + 1], k = ease(lp, ka.at, kb.at), p = pose.pos, l = pose.look;
    const d = Math.hypot(p[0] - l[0], p[1] - l[1], p[2] - l[2]), sx = mix(ka.sx, kb.sx, k), sy = mix(ka.sy, kb.sy, k);
    const back = Math.max(1, mix(ka.g, kb.g, k) / (2 * d * Math.tan(pose.fov * Math.PI / 360) * viewCamera.aspect));
    for (let c = 0; c < 3; c++) p[c] = l[c] + (p[c] - l[c]) * back;
    p[0] += sx; l[0] += sx; p[1] += sy; l[1] += sy;
  }
  frame(0);

  const setRGB = (attr, i, r, g, b) => { const a = attr.array; a[i * 3] = r; a[i * 3 + 1] = g; a[i * 3 + 2] = b; };
  const srcAt = (out, code) => {
    switch (code) {
      case 'A': return out.set(PACK[0].x, CRATE_TOP, DESK.z);
      case 'B': return out.set(PACK[1].x, CRATE_TOP, DESK.z);
      case 'C': return out.set(PACK[2].x, CRATE_TOP, DESK.z);
      case 'W': return out.set(BOOK.x, .8, BOOK.z);
      case 'R': return out.set(RACK.x + .4, 1.2, RACK.z);
      case 'K': return out.copy(DOCK);
      case 'M': return out.set(MEMO.x, 1.1, MEMO.z);
      case 'T': return out.copy(GAP);
      default: return out.set(HUBS[+code - 1], NET[+code - 1] * PT, BAR_Z);
    }
  };
  const a3 = new THREE.Vector3(), b3 = new THREE.Vector3();
  const OUT = { M: [.1, .95, .36], X: [.42, .08, .14], N: [.07, .075, .1] }, FLASH = { M: 2.6, X: 1.4, N: 1.1 };

  // the small upright things do without a shadow of their own: fewer draws in the wide shot
  [wall, rubric, column, scoreSign.group, claim.group, noIndex.group, pooledTag.group, ...packs.map(pk => pk.plate.group), ...ghosts.map(gh => gh.tag.group)].forEach(g => g.traverse(o => { o.castShadow = false; }));

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

  return {
    camera: cam,
    update(lp, t, dt, ui) {
      if (reduce) { lp = 1; t = 0; }
      const idle = reduce ? 0 : 1;
      frame(lp); drawCurtain(ui);

      /* the rubric comes down its cable and docks; the seal springs off and the lamps wake */
      const down = lin(lp, .004, .045), fall = (1 - down) * (1 - down) * (1 - down);
      rubric.position.set(DOCK.x, DOCK.y + fall * 4.6 + Math.sin(Math.PI * lin(lp, .045, .058)) * .05, DOCK.z);
      rubric.rotation.z = Math.sin(t * 1.7) * .04 * (1 - sm(down)) * idle;
      const reel = ease(lp, .048, .075);
      cable.scale.y = Math.max(.001, 7 * (1 - reel)); cable.visible = reel < 1;
      const sealPop = lin(lp, .046, .07);
      sealRing.visible = sealPop > 0 && sealPop < 1; sealRing.scale.setScalar(.4 + sealPop * 1.6); sealRing.material.opacity = (1 - sealPop) * .9;
      sealRing.rotation.x = Math.PI / 2;
      const verdict = decay(lp - VERDICT, .03), vOn = ease(lp, VERDICT, VERDICT + .02);
      let fire = 0;
      for (let i = 0; i < N; i++) if (SRC[i] === 'K') fire += hit(lp, HIT[i] - FLY, .02);
      bandMat.emissiveIntensity = .5 + (1 - sm(down)) * .6 * (1 + Math.sin(t * 2.4) * idle) + hit(lp, .046, .03) * 3 + fire * 1.2 + verdict * 2;
      sealMat.emissiveIntensity = 1.2 + hit(lp, .046, .03) * 4;

      /* the lamps: asleep, unjudged, then each one's outcome as its spark lands */
      let pts = 0, shownSum = 0, lastFlash = 0, flying = 0;
      for (let i = 0; i < N; i++) {
        const kind = ORDER[i], o = OUT[kind], post = lp - HIT[i], wake = ease(lp, .052 + i * .0007, .068 + i * .0007);
        const [lx, ly] = lampAt[i];
        if (post >= 0) {
          const fl = decay(post, .016) * FLASH[kind], wave = kind === 'M' ? decay(lp - VERDICT - i * .0022, .02) * 1.8 : 0;
          const hum = kind === 'M' ? .12 * Math.sin(t * 2.2 + i) * idle : 0, g = 1 + fl + wave + hum, w = fl * .3;
          setRGB(lamps.instanceColor, i, o[0] * g + w, o[1] * g + w, o[2] * g + w);
          const hI = kind === 'M' ? .55 + fl * .3 + wave * .5 + hum : kind === 'X' ? .1 + fl * .12 : fl * .1;
          setRGB(halos.instanceColor, i, o[0] * hI, o[1] * hI, o[2] * hI);
          lastFlash = Math.max(lastFlash, decay(post, .02));
          if (WEIGHTS[i] && kind === 'M') { pts += WEIGHTS[i] * sm(post / .014); shownSum += WEIGHTS[i]; }
        } else {
          const pulse = 1 + .15 * Math.sin(t * 2 + i * .8) * idle + ease(lp, HIT[i] - FLY, HIT[i]) * .8;
          if (kind === 'N') setRGB(lamps.instanceColor, i, mix(.03, .13 * pulse, wake), mix(.035, .1 * pulse, wake), mix(.05, .2 * pulse, wake));
          else setRGB(lamps.instanceColor, i, mix(.03, .26 * pulse, wake), mix(.035, .33 * pulse, wake), mix(.05, .5 * pulse, wake));
          setRGB(halos.instanceColor, i, 0, 0, 0);
        }
        // its spark: an arc from what it judges to its lamp
        const f = (lp - (HIT[i] - FLY)) / FLY;
        if (f > 0 && f < 1) {
          srcAt(a3, SRC[i]); b3.set(WALL.x + lx, ly, WALL.z + .14);
          const k = sm(f);
          p3.lerpVectors(a3, b3, k); p3.y += Math.sin(f * Math.PI) * (.9 + (i % 3) * .25);
          const s = .7 + Math.sin(f * Math.PI) * .8;
          flying++;
          s3.set(s, s, s); sparks.setMatrixAt(i, m4.compose(p3, qId, s3));
          q4.copy(viewCamera.quaternion); s3.set(1 + s * .6, 1 + s * .6, 1); sparkGlow.setMatrixAt(i, m4.compose(p3, q4, s3));
        } else { sparks.setMatrixAt(i, m4.compose(zero, qId, zero)); sparkGlow.setMatrixAt(i, m4.compose(zero, qId, zero)); }
      }
      lamps.instanceColor.needsUpdate = true; halos.instanceColor.needsUpdate = true;
      sparks.instanceMatrix.needsUpdate = true; sparkGlow.instanceMatrix.needsUpdate = true;
      sparks.visible = sparkGlow.visible = flying > 0;
      // the headings turn into the counts at the verdict
      headA0.material.opacity = headB0.material.opacity = 1 - vOn; headA1.material.opacity = headB1.material.opacity = vOn;
      headA0.mesh.visible = headB0.mesh.visible = vOn < 1; headA1.mesh.visible = headB1.mesh.visible = vOn > 0;
      // the meter and the points on the sign
      const score = pts / TOTAL;
      fill.scale.x = Math.max(.0001, METER.len * score); fill.visible = score > .0005;
      const fI = 1 + lastFlash * .7 + verdict * 1.4 + .08 * Math.sin(t * 2) * idle;
      fillMat.color.setRGB(1.0 * fI, .55 * fI, .1 * fI);
      if (shownSum !== shownPts) { shownPts = shownSum; scoreSign.redraw(scoreLines(shownSum)); }
      scoreSign.frameMat.emissiveIntensity = 1 + lastFlash * .8 + verdict * 3;
      scoreSign.board.scale.setScalar(1 + verdict * .12);
      wallEdge.emissiveIntensity = .6 + lastFlash * .5 + verdict * 2.5 + .1 * Math.sin(t * 1.5) * idle;

      /* the acceptance desk: the press runs along its beam and stamps each crate */
      let cx = DESK.x - 2.3, drop = 0, stampFlash = 0;
      for (let i = 0; i < 3; i++) {
        const at = STAMPS[i];
        cx = mix(cx, PACK[i].x, ease(lp, at - .055, at - .022));
        const d = lin(lp, at - .02, at), up = ease(lp, at + .008, at + .03);
        if (lp >= at - .02 && lp < at + .03) drop = d * d * (1 - up);
        stampFlash += hit(lp, at, .03);
      }
      cx = mix(cx, DESK.x - 2.3, ease(lp, STAMPS[2] + .032, STAMPS[2] + .058));   // back to its end of the rail
      column.position.x = cx;
      const reach = mix(-REST_Y, 2.05 - CRATE_TOP - .01, drop);   // from the beam down to the head's underside
      stampHead.position.y = -reach; piston.scale.y = Math.max(.01, reach - .1);
      padMat.emissiveIntensity = .6 + stampFlash * 4;
      deskEdge.emissiveIntensity = .8 + stampFlash * 2.2 + verdict * 1.5;
      for (let i = 0; i < 3; i++) {
        const pk = packs[i], post = lp - pk.at, wob = post >= 0 && post < .04 ? Math.exp(-post / .012) * Math.cos(post / .012 * 2.3) : 0;
        pk.crate.group.scale.set(1 + .06 * wob, 1 - .12 * wob, 1 + .06 * wob);
        pk.crate.segments.forEach((s, j) => {
          const k = ease(lp, pk.at + .006 + j * .008, pk.at + .02 + j * .008), to = pk.pass[j] ? GREEN : AMBER;
          s.mat.color.copy(WOOD).lerp(to, k * .72);
          s.mat.emissive.copy(to); s.mat.emissiveIntensity = k * (.32 + (pk.pass[j] ? decay(lp - VERDICT, .03) * .8 : .1 * Math.sin(t * 2.2 + j) * idle));
        });
        // the plates fold away while the other things are judged, and stand again for the verdict
        const show = lin(lp, pk.at + .03, pk.at + .055) * (1 - ease(lp, .335, .35) + ease(lp, .7, .72));
        pk.plate.group.visible = show > 0;
        if (show > 0) { pk.plate.board.scale.setScalar(Math.max(.001, backOut(show, 1.6))); pk.plate.frameMat.emissiveIntensity = 1 + hit(lp, pk.at + .03, .04) * 3 + verdict * 1.5; }
        const rg = lin(lp, pk.at, pk.at + .05);
        pk.ring.visible = rg > 0 && rg < 1; pk.ring.scale.setScalar(.3 + rg * 1.1); pk.ring.material.opacity = (1 - rg) * (1 - rg) * .9;
        pk.ring.material.color.setHex(i === 0 ? STATUS.pending : STATUS.verified);
      }
      // A: a tenth slides off its right end and stays amber (retained); the rest goes for approval
      const slide = ease(lp, STAMPS[0] + .012, STAMPS[0] + .045), segA = packs[0].crate.segments[0];
      chip.visible = lp > STAMPS[0] + .008;
      segA.mesh.scale.x = chip.visible ? .88 : 1; segA.mesh.position.x = chip.visible ? -.025 : 0;
      chip.position.set(PACK[0].x + .185 + slide * .2, DESK.top + .25, DESK.z);
      chipMat.color.copy(WOOD).lerp(AMBER, slide * .8); chipMat.emissive.copy(AMBER); chipMat.emissiveIntensity = slide * (.45 + .12 * Math.sin(t * 2.4) * idle);

      /* the measuring rack: both measures run past the 75% line */
      const rackUp = ease(lp, .336, .36) * (1 - ease(lp, .458, .472));
      rack.visible = rackUp > 0; rack.scale.setScalar(Math.max(.001, backOut(rackUp, 1.3)));
      rows.forEach((r, k) => {
        const v = r.value * ease(lp, .362 + k * .032, .39 + k * .032), over = sm(lin(v, .75, .8));
        r.bar.scale.x = Math.max(.0001, TRACK.len * v); r.bar.visible = v > .001;
        r.material.color.copy(BAR_BLUE).lerp(BAR_GREEN, over).multiplyScalar(1 + hit(lp, .385 + k * .032, .03) * 1.2);
        r.cap.material.opacity = ease(lp, .355 + k * .032, .37 + k * .032);
      });
      const cross75 = hit(lp, .383, .03) + hit(lp, .415, .03);
      lineMat.color.setRGB(1.0 * (1 + cross75 * 2), .62 * (1 + cross75 * 2), .12 * (1 + cross75 * 2));
      rackEdge.emissiveIntensity = .6 + cross75 * 1.6;
      // B stands: its passed units answer once both measures are over the line
      const stands = hit(lp, .422, .04);
      packs[1].plate.frameMat.emissiveIntensity += stands * 3;

      /* the hubs: the pooled bar stands alone, then sinks to show the three it hid */
      const poolUp = ease(lp, .476, .49);
      pooled.visible = poolUp > 0; pooled.scale.y = Math.max(.001, POOLED * PT * poolUp);
      poolMat.emissiveIntensity = .12 + hit(lp, .49, .03) * .8;
      const hubTags = 1 - ease(lp, .53, .545) + ease(lp, .7, .72);   // folded away while the memo is read
      pooledTag.group.visible = poolUp > .5 && hubTags > 0; pooledTag.board.scale.setScalar(Math.max(.001, hubTags));
      pooledTag.group.position.set(POOL_X, pooled.scale.y + .06, BAR_Z);
      baseLine.visible = poolUp > 0; baseLine.scale.x = Math.max(.001, ease(lp, .49, .512)); baseLine.position.x = POOL_X - .22 + BASE_LEN / 2 * baseLine.scale.x;
      ghosts.forEach((gh, k) => {
        const up = ease(lp, .494 + k * .008, .508 + k * .008);
        gh.g.visible = up > 0; gh.g.scale.y = Math.max(.001, gh.h * up);
        gh.tag.group.visible = up > .6 && hubTags > 0; gh.tag.group.position.y = gh.h * up + .08; gh.tag.board.scale.setScalar(Math.max(.001, hubTags));
        gh.tag.frameMat.emissiveIntensity = 1 + hit(lp, .508 + k * .008, .03) * 3 + .15 * Math.sin(t * 2 + k) * idle;
      });
      ghostLine.opacity = .75 + .25 * Math.sin(t * 2.2) * idle;

      /* the memo: the claim is flagged, and the thread to the source files breaks off */
      const away = 1 - ease(lp, .69, .705);   // the two notes fold away before the verdict's wide shot
      const flag = ease(lp, .526, .545) * away;
      claimMat.opacity = flag * (.75 + .2 * Math.sin(t * 3) * idle);
      claim.group.visible = flag > 0; claim.board.scale.setScalar(Math.max(.001, backOut(flag, 1.6)));
      claim.frameMat.emissiveIntensity = 1 + hit(lp, .545, .04) * 3;
      memo.face.emissiveIntensity = .22 + hit(lp, .526, .05) * .5 + verdict * .4;
      workbook.face.emissiveIntensity = .22 + ease(lp, .29, .3) * (1 - ease(lp, .335, .345)) * .35 + verdict * .4;
      for (let k = 0; k < DOTS; k++) {
        const fromMemo = k < GAP_A, inGap = k >= GAP_A && k < GAP_B;
        const on = inGap ? 0 : fromMemo ? lin(lp, .585 + k * .003, .592 + k * .003) : lin(lp, .585 + (DOTS - 1 - k) * .003, .592 + (DOTS - 1 - k) * .003);
        if (on <= 0) { dots.setMatrixAt(k, m4.compose(zero, qId, zero)); continue; }
        dotAt(p3, k); const s = backOut(on, 2) * (1 + (k === GAP_A - 1 || k === GAP_B ? .5 + .3 * Math.sin(t * 5) * idle : 0));
        s3.set(s, s, s); dots.setMatrixAt(k, m4.compose(p3, qId, s3));
        const edge = k === GAP_A - 1 || k === GAP_B ? ease(lp, .606, .615) : 0;
        setRGB(dots.instanceColor, k, mix(.9, 1.8, edge), mix(.95, .35, edge), mix(1.1, .55, edge));
      }
      dots.instanceMatrix.needsUpdate = true; dots.instanceColor.needsUpdate = true;
      const broke = lin(lp, .608, .628);
      cross.visible = broke > 0; cross.scale.setScalar(Math.max(.001, backOut(broke, 2.2)));
      cross.quaternion.copy(viewCamera.quaternion);
      const ni = ease(lp, .615, .64) * away;
      noIndex.group.visible = ni > 0; noIndex.board.scale.setScalar(Math.max(.001, backOut(ni, 1.6)));
      noIndex.frameMat.emissiveIntensity = 1 + hit(lp, .64, .04) * 3;

      /* the verdict: a ring crosses the yard, the kerb flares */
      const vpost = lp - VERDICT;
      if (vpost > 0 && vpost < .12) {
        const sI = decay(vpost, .028) * 1.5, sS = .8 + 5.2 * (1 - Math.pow(2, -10 * vpost / .07));
        shock.visible = true; shock.scale.set(sS, 1, sS); shockMat.color.setRGB(1.6 * sI, 1.0 * sI, .35 * sI);
      } else shock.visible = false;
      ground.rimMat.emissiveIntensity = 1 + stampFlash * 1.2 + lastFlash * .25 + verdict * 1.6 + .12 * Math.sin(t * 1.5) * idle;

      /* the robot: steps back, then walks to each thing as it is judged; it only watches */
      pathAt(WALK, lp, walker);
      focusAt(lp);
      const faced = Math.atan2(focus.x - walker.x, focus.z - walker.z);
      let ry = faced;
      if (walker.walk > 0) { let d = walker.ry - faced; d -= Math.round(d / TAU) * TAU; ry = faced + d * Math.min(1, walker.walk); }
      const flinch = stampFlash, hop = Math.sin(Math.PI * clamp((lp - VERDICT) / .03)) * .16 + flinch * .07;
      bot.update(t * idle + lp * 40, walker.walk);   // the stride also follows the scroll, so it walks while the clock is held
      bot.root.position.set(walker.x - Math.sin(ry) * .08 * flinch, hop, walker.z - Math.cos(ry) * .08 * flinch);
      bot.root.rotation.y = ry;
      const dist = Math.hypot(focus.x - walker.x, focus.z - walker.z), headY = .62 * 1.15 + .3;
      bot.head.rotation.y = Math.sin(t * .8) * .06 * idle * (1 - walker.walk);
      bot.head.rotation.x = clamp(-Math.atan2(focus.y - headY, dist), -.6, .45) * (1 - walker.walk * .6);
      bot.head.rotation.z = (ease(lp, .39, .41) - ease(lp, .44, .455)) * .22 + (ease(lp, .545, .56) - ease(lp, .67, .69)) * -.16;   // it tilts its head at the two measures, and at the claim

      ui.set('score', score.toFixed(3));
    },
  };
}

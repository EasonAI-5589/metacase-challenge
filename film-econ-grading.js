/* film-econ-grading.js — beat 3 of the economics Metacase film: Outcomes (econ-0157).
 * No judge here: the grader calls no model, it compares the result file with a reference. So the
 * set is a comparing instrument on the plotting table: a leaning board with three number lines,
 * one for each figure (coefficient, standard error, p-value). The agent has stopped and steps
 * aside; only then does Harbor's crane lower the sealed reference onto the board. It opens and
 * three reference rings slide down the reference line, one onto each rail. A bead for each figure
 * leaves 157_result.json and runs along its rail to where its value lies: the first two seat in
 * their rings (they match to 11 and to 9 decimals); the p-value's bead stops a hair beside its
 * ring, and a magnified inset shows the two bases, 0.00831 (t, 640 degrees of freedom) against
 * 0.00811 (normal), 0.0002 apart. Then the rule: a tolerance band lights on each rail, a lamp per
 * rail turns green, and the three lamps are wired in series: only when all three are on does the
 * current reach the verdict, which turns from 0 to 1. Last, what was run afterwards: with column
 * 2's five covariates the first two figures slide out of their bands (−69.35, 4.6% off; 22.68,
 * 9.5% off), drawn hollow in rose, a layer apart from this run; its verdict reads 0.
 *
 * lp timeline (the camera runs its own spline)
 *   0.00–0.06  the agent walks from the board to its pad; the crane lowers the sealed reference
 *   0.06–0.10  the seal springs off, the reference line draws down the board, three rings land
 *   0.095–0.20 the coefficient's bead, then the standard error's: out of the file, along the rail, into the ring
 *   0.23–0.30  the p-value's bead; 0.285–0.36 the inset with both bases
 *   0.365–0.39 the tolerance bands; 0.40, 0.43, 0.46 the lamps; 0.465–0.49 the current climbs: 1
 *   0.52–0.67  the other specification: two hollow beads leave their bands, two red lamps, a 0
 *   0.72       the verdict locks: the table's rim and the lamps flare
 *   0.74–1.00  hold, with idle life
 * Everything is a function of lp, plus small idle motion from t (none when ctx.reduce). */
import { plotTable } from './film-econ-kit.js?v=mc-401ead81de';

const TAU = Math.PI * 2;
const BX = 1.0, BZ = -.85, TILT = .2;                       // the board: where it stands and how far it leans back
const PANEL = { u0: -1.5, u1: 2.75, v0: .2, v1: 2.8 };
// the rails, in board coordinates (u across, v up the board): the reference at u = ref, one percent = pct
const RAIL = { u0: -1.3, u1: 1.75, ref: 1.05, pct: .22, v: [1.9, 1.27, .64] };
const LAMP_U = 2.32, HEAD_V = 2.5;
// What the grader compares, in order. off: where the agent's figure lies from the reference, in rail
// units (the p-value's 0.0002 on a band of 0.01). ghost: the same figure under column 2's covariates.
const ROWS = [
  { name: 'coefficient', tol: 'within 1%', value: '−66.3269', note: '11 decimals', off: 0, ghost: { value: '−69.35', note: '4.6% off', pct: -4.6 } },
  { name: 'standard error', tol: 'within 1%', value: '25.0531', note: '9 decimals', off: 0, ghost: { value: '22.68', note: '9.5% off', pct: -9.5 } },
  { name: 'p-value', tol: 'within 0.01', value: '0.00831', note: 'gap 0.0002', off: .0044, ghost: null },
];
const T = {
  walkA: .004, walkB: .06, lowerA: 0, lowerB: .055, open: .06, lineA: .064, pins: [.08, .09, .1],
  beads: [.095, .15, .23], fly: .02, slide: .03,           // each bead: leaves the file, flies to its rail, slides to its value
  insetA: .285, insetB: .305, insetC: .345, insetD: .362,
  bands: [.365, .375, .385], lamps: [.4, .43, .46], busA: .465, snap: .49,
  ghostTag: .52, ghosts: [.54, .57], ghostSlide: .06, ghostLamps: [.61, .65], ghostVerdict: .665, ghostDim: .7,
  verdict: .72,
};
const CLICK = T.beads.map(a => a + T.fly + T.slide);        // when each bead reaches its value

const decay = (x, k) => (x < 0 ? 0 : Math.exp(-x / k));
const springy = x => { const p = Math.min(1, Math.max(0, x)) - 1; return 1 + 2.6 * p * p * p + 1.6 * p * p; };

function canvasTexture(THREE, w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = () => { const g = c.getContext('2d'); g.clearRect(0, 0, w, h); paint(g, w, h); tex.needsUpdate = true; };
  draw(); document.fonts?.ready.then(draw);
  return tex;
}
function roundRect(g, x, y, w, h, r, fill) { g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }

export async function build({ THREE, kit, set, accent, loadWeapons, hand, util, reduce, layout: ctxLayout, camera: viewCamera }) {
  const { PALETTE, add, block, cyl, ball, rbox, mat, robot, GUN_HOLD } = kit;
  const { clamp, smooth, ramp, lerp, easeOut, glowSprite } = util;
  const MONO = '"Space Mono", ui-monospace, SFMono-Regular, monospace';
  const GREEN = 0x3fd08a, ROSE = PALETTE.rose, CYAN = 0x8ff6ff, AMBER = PALETTE.amber, NAVY = 0x1f2b47;
  const own = (color, emissive = color, intensity = 1, rough = .5) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: rough, metalness: 0 });
  const basic = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, toneMapped: false, fog: false });
  const additive = (color, opacity = 0) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false, side: THREE.DoubleSide });

  /* ---- the plotting table, shared by the five economics sets ---- */
  const { rimMat } = plotTable({ THREE, kit, set, accent });

  /* ---- the board: a dark panel leaning back on a base, a glowing frame, three rails ---- */
  const PW = PANEL.u1 - PANEL.u0, PU = (PANEL.u0 + PANEL.u1) / 2;
  block(set, PW + .3, .2, 1.1, NAVY, BX + PU, 0, BZ - .22, .06);
  add(set, rbox(PW + .34, .03, 1.14, .012), own(accent, accent, .8), BX + PU, .185, BZ - .22, false);
  const board = new THREE.Group(); board.position.set(BX, .18, BZ); board.rotation.x = -TILT; set.add(board);
  const PH = PANEL.v1 - PANEL.v0, PV = (PANEL.v0 + PANEL.v1) / 2;
  add(board, rbox(PW, PH, .1, .05), mat(0x0f1626, { rough: .85 }), PU, PV, 0);
  const frameMat = own(accent, accent, .55);
  add(board, rbox(PW + .1, PH + .1, .06, .06), frameMat, PU, PV, -.04, false);
  // two struts behind
  [-1, 1].forEach(s => { const m = block(board, .12, 2.1, .12, NAVY, PU + s * 1.6, .1, -.45, .04); m.rotation.x = .5; });
  board.updateMatrix();
  const toSet = (out, u, v, w = 0) => out.set(u, v, w).applyMatrix4(board.matrix);
  const fromSet = new THREE.Matrix4().copy(board.matrix).invert();

  // printed text on the board: a plane with a transparent label, w × h in board units
  const text = (key, lines, w, h, u, v, opts = {}) => {
    const tw = opts.px || 1024, th = Math.round(tw * h / w);
    const tex = kit.labelTexture(`film-econ-grade-${key}`, lines, { width: tw, height: th });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: opts.opacity ?? 1, depthWrite: false, toneMapped: false, fog: false }));
    m.position.set(u, v, opts.w ?? .062); m.renderOrder = 4; (opts.parent || board).add(m);
    return m;
  };
  // the header: what this instrument is, and (later) what the rose layer is
  text('head', [{ text: 'grader · calls no model', size: 92, weight: 600, color: '#aab6cc', track: 2 }], 1.9, .235, -.48, HEAD_V);
  const ghostTag = text('ghost-tag', [
    { text: 'column 2 · five covariates', size: 84, weight: 700, color: '#ff9aa6', track: 1 },
    { text: 'run afterwards', size: 70, weight: 600, color: '#d98a94', track: 2 },
  ], 1.3, .275, .55, RAIL.v[0] + .3, { opacity: 0 });

  // the rails: a rod, a tick every percent (or every 0.01 for the p-value), the name at the left
  const railMat = own(0x9fd8ff, 0x9fd8ff, .55);
  const NT = 14, ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(.014, .1, .014), basic(0xffffff), NT * 3);
  ticks.frustumCulled = false; board.add(ticks);
  const tc = new THREE.Color(), dummy = new THREE.Object3D();
  const rows = ROWS.map((r, i) => {
    const v = RAIL.v[i];
    add(board, rbox(RAIL.u1 - RAIL.u0 + .1, .03, .03, .012), railMat, (RAIL.u0 + RAIL.u1) / 2, v, .075, false);
    for (let k = -10; k <= 3; k++) {
      const major = k % 5 === 0;
      dummy.position.set(RAIL.ref + k * RAIL.pct, v, .07); dummy.scale.set(1, major ? 1.5 : .8, 1); dummy.updateMatrix();
      ticks.setMatrixAt(i * NT + k + 10, dummy.matrix); ticks.setColorAt(i * NT + k + 10, tc.setHex(major ? 0x8fa6c8 : 0x4f6386));
    }
    text(`name-${i}`, [{ text: r.name, size: 150, weight: 700, color: '#f0f4fb' }], 1.2, .23, RAIL.u0 + .56, v + .21);
    const tol = text(`tol-${i}`, [{ text: r.tol, size: 150, weight: 600, color: '#8ff0bd', track: 1 }], .78, .15, RAIL.ref - RAIL.pct - .46, v - .17, { opacity: 0 });
    // the tolerance band: a soft green field with a bracket at each end
    const bandMat = additive(GREEN, 0), band = add(board, new THREE.PlaneGeometry(RAIL.pct * 2, .34), bandMat, RAIL.ref, v, .066, false);
    const edgeMat = own(GREEN, GREEN, 1.2); edgeMat.transparent = true; edgeMat.opacity = 0;
    const edges = [-1, 1].map(s => add(board, rbox(.022, .4, .022, .008), edgeMat, RAIL.ref + s * RAIL.pct, v, .08, false));
    // the reference ring, which slides down the reference line onto the rail
    const ringMat = own(AMBER, AMBER, 1.3), ring = add(board, new THREE.TorusGeometry(.112, .02, 8, 32), ringMat, RAIL.ref, PANEL.v1, .1, false);
    // the agent's figure: a bead
    const beadMat = own(0xe9fbff, CYAN, 1.6), bead = add(board, new THREE.SphereGeometry(.072, 20, 14), beadMat, RAIL.u0, v, .11, false);
    const flare = glowSprite(0xbff3ff, .7, 0); flare.material.fog = false; flare.renderOrder = 5; board.add(flare);
    const value = text(`val-${i}`, [{ text: r.value, size: 190, weight: 800, color: '#ffffff', font: MONO, track: -2 }], .86, .215, RAIL.ref + .64, v + .215, { opacity: 0 });
    const note = text(`note-${i}`, [{ text: r.note, size: 150, weight: 600, color: i === 2 ? '#ffd27a' : '#a9f0c6', track: 1 }], .86, .16, RAIL.ref + .64, v - .17, { opacity: 0 });
    // the lamp at the end of the rail
    const socket = add(board, new THREE.TorusGeometry(.135, .022, 8, 32), mat(0x2a3550), LAMP_U, v, .07, false);
    const lampMat = own(0x26324d, 0x000000, 0), lamp = add(board, new THREE.SphereGeometry(.1, 20, 14), lampMat, LAMP_U, v, .08, false);
    const row = { ...r, i, v, tol, band, bandMat, edgeMat, edges, ring, ringMat, bead, beadMat, flare, value, note, socket, lamp, lampMat, start: new THREE.Vector3(), ghost: null };
    if (r.ghost) {
      // the other specification: a hollow rose bead, the stretch it has moved, its figure and how far off it is
      const gu = RAIL.ref + r.ghost.pct * RAIL.pct;
      const gMat = own(ROSE, ROSE, 1.4); gMat.transparent = true;
      const gBead = add(board, new THREE.TorusGeometry(.085, .024, 8, 28), gMat, RAIL.ref, v, .13, false);
      const gTrailMat = basic(new THREE.Color(ROSE).multiplyScalar(.9), .55);
      const gTrail = add(board, new THREE.BoxGeometry(1, .018, .012), gTrailMat, RAIL.ref, v, .1, false);
      const gValue = text(`gval-${i}`, [{ text: r.ghost.value, size: 200, weight: 800, color: '#ff9aa6', font: MONO, track: -2 }], .62, .19, -.93, v - .19, { opacity: 0 });
      const gNote = text(`gnote-${i}`, [{ text: r.ghost.note, size: 190, weight: 700, color: '#ff7f90', track: 1 }], .62, .17, -.3, v - .19, { opacity: 0 });
      const gLampMat = own(ROSE, ROSE, 1.6); gLampMat.transparent = true;
      const gLamp = add(board, new THREE.TorusGeometry(.185, .016, 8, 36), gLampMat, LAMP_U, v, .09, false);
      row.ghost = { u: gu, mat: gMat, bead: gBead, trail: gTrail, trailMat: gTrailMat, value: gValue, note: gNote, lamp: gLamp, lampMat: gLampMat };
    }
    return row;
  });
  // the reference line: drawn down the board from the sealed box, through the three rails
  const lineMat = basic(new THREE.Color(AMBER).multiplyScalar(.85), .8);
  const refLine = add(board, new THREE.BoxGeometry(.012, 1, .008), lineMat, RAIL.ref, PANEL.v1, .064, false);
  const LINE_LEN = PANEL.v1 - .38;

  // the lamps in series: the current climbs from the lowest lamp to the verdict only through lit lamps
  const busMats = [0, 1, 2].map(() => own(0x2a3550, GREEN, 0));
  const busSpan = [[RAIL.v[2] + .14, RAIL.v[1] - .14], [RAIL.v[1] + .14, RAIL.v[0] - .14], [RAIL.v[0] + .14, HEAD_V - .24]];
  busSpan.forEach(([a, b], k) => add(board, rbox(.034, b - a, .03, .012), busMats[k], LAMP_U, (a + b) / 2, .07, false));
  // the verdict: 0 until the current arrives, then 1
  add(board, rbox(.64, .44, .04, .03), mat(0x0a0f1c), LAMP_U, HEAD_V, .05, false);
  const verdictFrame = own(accent, accent, .5);
  add(board, rbox(.7, .5, .03, .035), verdictFrame, LAMP_U, HEAD_V, .034, false);
  const digit0 = text('v0', [{ text: '0', size: 200, weight: 800, color: '#6f7d99', font: MONO }], .4, .4, LAMP_U, HEAD_V, { w: .075, px: 256 });
  const digit1 = text('v1', [{ text: '1', size: 200, weight: 800, color: '#ffe9b8', font: MONO }], .4, .4, LAMP_U, HEAD_V, { w: .078, px: 256, opacity: 0 });
  const verdictGlow = glowSprite(0xffc45a, 1.6, 0); verdictGlow.material.fog = false; verdictGlow.position.set(LAMP_U, HEAD_V, .2); verdictGlow.renderOrder = 5; board.add(verdictGlow);
  // the other specification's verdict, hollow, beside it
  const gVerdictMat = own(ROSE, ROSE, 1.2); gVerdictMat.transparent = true; gVerdictMat.opacity = 0;
  const gVerdict = new THREE.Group(); gVerdict.position.set(LAMP_U - .72, HEAD_V, .06); board.add(gVerdict);
  [[0, .2, .5, .022], [0, -.2, .5, .022], [-.24, 0, .022, .42], [.24, 0, .022, .42]].forEach(([x, y, w, h]) => add(gVerdict, rbox(w, h, .02, .008), gVerdictMat, x, y, 0, false));
  const gDigit = text('g0', [{ text: '0', size: 200, weight: 800, color: '#ff8fa0', font: MONO }], .34, .34, 0, 0, { parent: gVerdict, w: .012, px: 256, opacity: 0 });

  /* ---- the inset: the p-value's two bases, magnified ---- */
  const inset = new THREE.Group(); inset.position.set(.05, .8, .3); board.add(inset);
  add(inset, rbox(2.2, .98, .04, .04), mat(0x0a1120, { rough: .9 }), 0, 0, 0, false);
  const insetFrame = own(CYAN, CYAN, .9);
  add(inset, rbox(2.27, 1.05, .03, .045), insetFrame, 0, 0, -.014, false);
  const insetTex = canvasTexture(THREE, 1024, 456, (g, w, h) => {
    // the band runs past both ends; the two figures stand 0.0002 apart inside it
    roundRect(g, 26, 150, w - 52, 150, 18, 'rgba(63,208,138,.2)');
    g.fillStyle = '#8ff0bd'; g.font = '600 38px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('inside the tolerance of 0.01', w / 2, 352);
    g.fillStyle = '#9fd8ff'; g.fillRect(40, 222, w - 80, 6);
    const xa = 360, xb = 664;
    g.fillStyle = '#f2b545'; g.fillRect(xa - 5, 168, 10, 114);
    g.fillStyle = '#8ff6ff'; g.fillRect(xb - 5, 168, 10, 114);
    g.font = `800 62px ${MONO}`;
    g.fillStyle = '#ffd27a'; g.fillText('0.00811', xa - 130, 62);
    g.fillStyle = '#c9fbff'; g.fillText('0.00831', xb + 130, 62);
    g.font = '600 36px Inter, Arial, sans-serif';
    g.fillStyle = '#d9b45c'; g.fillText('reference · normal', xa - 130, 116);
    g.fillStyle = '#9fdfe6'; g.fillText('agent · t, 640 df', xb + 130, 116);
    g.strokeStyle = '#ffffff'; g.lineWidth = 4; g.beginPath(); g.moveTo(xa + 14, 250); g.lineTo(xb - 14, 250); g.stroke();
    g.fillStyle = '#ffffff'; g.font = `800 46px ${MONO}`; g.fillText('0.0002', (xa + xb) / 2, 196);
    g.font = '600 34px Inter, Arial, sans-serif'; g.fillStyle = '#aab6cc'; g.fillText('p-value: the two bases', w / 2, 414);
  });
  const insetFace = new THREE.Mesh(new THREE.PlaneGeometry(2.1, .935), new THREE.MeshBasicMaterial({ map: insetTex, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
  insetFace.position.z = .025; insetFace.renderOrder = 6; inset.add(insetFace);
  // two fine lines from the p-value's ring to the inset's corners: this is that spot, enlarged
  const zoomMat = additive(CYAN, 0);
  const zooms = [[.8, .18], [.8, -.3]].map(([du, dv]) => {
    const a = new THREE.Vector3(RAIL.ref, RAIL.v[2], .1), b = new THREE.Vector3(inset.position.x + du, inset.position.y + dv, inset.position.z);
    const m = add(board, new THREE.CylinderGeometry(.006, .006, 1, 6), zoomMat, 0, 0, 0, false);
    m.position.copy(a).lerp(b, .5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); m.scale.y = a.distanceTo(b);
    return m;
  });

  /* ---- the result file: 157_result.json on a little stand; the beads leave from its three lines ---- */
  const fileTex = canvasTexture(THREE, 512, 400, (g, w) => {
    roundRect(g, 0, 0, w, 400, 24, '#f6efe0');
    roundRect(g, 0, 0, w, 62, 24, '#3f9d6a'); g.fillStyle = '#3f9d6a'; g.fillRect(0, 30, w, 32);
    g.fillStyle = '#ffffff'; g.font = `700 36px ${MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('157_result.json', w / 2, 32);
    g.textAlign = 'left';
    [['coefficient', '−66.3269'], ['standard_error', '25.0531'], ['p_value', '0.00831']].forEach(([key, val], k) => {
      const y = 132 + k * 82;
      g.font = `600 30px ${MONO}`; g.fillStyle = '#2f7d55'; g.fillText(key, 40, y);
      g.font = `800 40px ${MONO}`; g.fillStyle = '#1f2a3a'; g.fillText(val, 60, y + 40);
    });
  });
  const FILE = { x: 1.25, z: 2.35, turn: .12, w: .92, h: .72 };
  const file = new THREE.Group(); file.position.set(FILE.x, 0, FILE.z); file.rotation.y = FILE.turn; set.add(file);
  block(file, FILE.w * .62, .14, .46, 0x26324d, 0, 0, -.04, .05);
  block(file, FILE.w * .66, .03, .5, own(PALETTE.green, PALETTE.green, .9), 0, .13, -.04, .015).castShadow = false;
  const lean = new THREE.Group(); lean.position.y = .16; lean.rotation.x = -.16; file.add(lean);
  add(lean, rbox(FILE.w + .07, FILE.h + .07, .07, .035), own(PALETTE.green, PALETTE.green, .35), 0, FILE.h / 2, -.05);
  add(lean, rbox(FILE.w, FILE.h, .1, .045), mat(0xf7f5f0), 0, FILE.h / 2, 0);
  const fileFace = new THREE.MeshStandardMaterial({ map: fileTex, emissive: 0xffffff, emissiveMap: fileTex, emissiveIntensity: .22, roughness: .75, metalness: 0 });
  add(lean, new THREE.PlaneGeometry(FILE.w * .94, FILE.h * .94), fileFace, 0, FILE.h / 2, .052, false);
  set.updateMatrix(); file.updateMatrix(); lean.updateMatrix();
  rows.forEach((r, i) => {
    // where line i of the file is, in board coordinates (the bead's first position)
    r.start.set(-FILE.w * .18, FILE.h * (.6 - i * .2), .08).applyMatrix4(lean.matrix).applyMatrix4(file.matrix).applyMatrix4(fromSet);
  });

  /* ---- Harbor's crane, behind the board, and the sealed reference it lowers ---- */
  const dock = toSet(new THREE.Vector3(), RAIL.ref, PANEL.v1 + .245, 0);   // the box's centre once it stands on the board's top edge
  const MAST = { x: 4.1, z: -2.5, h: 4.4 };
  block(set, .62, .16, .62, PALETTE.ink, MAST.x, 0, MAST.z, .04);
  for (let k = 0; k < 10; k++) { block(set, .2, .44, .2, AMBER, MAST.x, .16 + k * .44, MAST.z, .02); block(set, .24, .04, .24, PALETTE.ink, MAST.x, .16 + k * .44, MAST.z, .01); }
  const jib = new THREE.Group(); jib.position.set(MAST.x, MAST.h + .2, MAST.z); set.add(jib);
  const reach = Math.hypot(dock.x - MAST.x, dock.z - MAST.z);
  jib.rotation.y = Math.atan2(-(dock.z - MAST.z), dock.x - MAST.x);
  block(jib, reach + .9, .15, .17, AMBER, (reach + .9) / 2 - .5, 0, 0, .02);
  block(jib, .6, .3, .3, PALETTE.ink, -.62, -.06, 0, .04);
  block(jib, .26, .32, .26, PALETTE.slate, 0, .15, 0, .04);
  block(jib, .2, .1, .22, PALETTE.ink, reach, -.1, 0, .02);
  const sign = text('harbor', [{ text: 'Harbor', size: 250, weight: 800, color: '#1f2a3a', track: 4 }], .62, .2, 0, 0, { parent: set, w: 0, px: 512 });
  sign.position.set(MAST.x - .02, 3.62, MAST.z + .125);
  add(set, rbox(.7, .26, .04, .02), mat(PALETTE.cream), MAST.x - .02, 3.62, MAST.z + .1, false);
  const JIB_Y = MAST.h + .1, cable = add(set, new THREE.CylinderGeometry(.012, .012, 1, 5), mat(PALETTE.ink), dock.x, JIB_Y, dock.z, false);
  const box = new THREE.Group(); set.add(box);
  add(box, rbox(.58, .46, .46, .06), mat(0x3a4c78, { rough: .6 }), 0, 0, 0);
  const bandMat = own(AMBER, AMBER, .8);
  [-.15, .15].forEach(y => add(box, rbox(.6, .035, .48, .012), bandMat, 0, y, 0, false));
  add(box, rbox(.12, .08, .12, .02), mat(PALETTE.ink), 0, .26, 0, false);                       // the lug the hook holds
  text('ref', [{ text: 'reference', size: 200, weight: 800, color: '#ffe9bf', track: 2 }], .52, .125, 0, 0, { parent: box, w: .236 });
  const slitMat = basic(0xffffff);
  add(box, rbox(.34, .02, .3, .008), slitMat, 0, -.235, 0, false);                               // the mouth underneath, lit once open
  const sealMat = basic(0xffffff, 1); sealMat.transparent = true;
  const seals = [0, 1].map(() => add(set, new THREE.TorusGeometry(.42, .024, 8, 56), sealMat, 0, 0, 0, false));
  const boxGlow = glowSprite(0xffd9a0, 1.2, 0); boxGlow.material.fog = false; boxGlow.renderOrder = 5; set.add(boxGlow);
  const HANG_Y = JIB_Y - .75;

  /* ---- the agent: it has stopped. It walks off to its pad and watches; it touches nothing ---- */
  const bot = hand.dressedRobot?.() ?? robot(PALETTE.cream, CYAN);
  const SCALE = 1.15, WALK = [[2.35, 1.5], [3.25, 1.45], [3.66, .4]], PEEK = [3.46, .22];
  bot.root.scale.setScalar(SCALE); set.add(bot.root);
  let gun;
  const wi = hand.armed?.weaponIndex ?? 4;      // arena-models.js: Terminus-2, the harness of this run
  try { const { weapons } = await loadWeapons(); gun = weapons[wi].clone(true); } catch { gun = kit.blaster(accent); }
  gun.scale.setScalar(.56); gun.position.copy(GUN_HOLD.at); gun.rotation.copy(GUN_HOLD.turn); bot.root.add(gun); bot.grip(1);
  const padMat = own(CYAN, CYAN, 1);
  const botPad = add(set, new THREE.TorusGeometry(.42, .025, 8, 48), padMat, WALK[2][0], .012, WALK[2][1], false); botPad.rotation.x = Math.PI / 2;

  // what the next beat may reuse (data only)
  hand.grade = { score: 1, comparisons: 3, passed: 3, diagnostics: 0, order: 'MMMG' };

  /* ---- the camera line: up at the descending box, back for the board, in on the p-value, back for
   * the lamps, a touch left for the other specification, then the wide frontal hold ---- */
  const KEYS = [
    { at: 0, pos: [-1.6, 1.1, 6.2], look: [.9, 2.7, -1.0], fov: 44 },
    { at: .11, pos: [0, 2.4, 8.3], look: [1.5, 1.6, -.6], fov: 36 },
    { at: .21, pos: [.3, 2.4, 8.5], look: [1.45, 1.55, -.6], fov: 36 },
    { at: .31, pos: [.8, 1.75, 6.9], look: [1.05, 1.2, -.7], fov: 36 },
    { at: .44, pos: [1.3, 2.5, 9.0], look: [1.75, 1.65, -.7], fov: 35 },
    { at: .6, pos: [.5, 2.5, 9.1], look: [1.6, 1.65, -.7], fov: 35 },
    { at: .77, pos: [.6, 3.4, 10.2], look: [1.5, 1.45, -.4], fov: 31 },
  ];
  const pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 };
  const camera = { from: pose, to: pose };
  const cr = (p0, p1, p2, p3, u) => .5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u);
  const stackedQuery = ctxLayout ? null : matchMedia('(max-width: 600px), (max-aspect-ratio: 11/10)');
  const isStacked = () => (ctxLayout ? ctxLayout.stacked : stackedQuery.matches);
  function cameraAt(lp) {
    const last = KEYS.length - 1;
    let j = 0;
    while (j < last - 1 && lp >= KEYS[j + 1].at) j++;
    let u = clamp((lp - KEYS[j].at) / (KEYS[j + 1].at - KEYS[j].at));
    u = smooth(u);
    const k0 = KEYS[Math.max(0, j - 1)], k1 = KEYS[j], k2 = KEYS[j + 1], k3 = KEYS[Math.min(last, j + 2)];
    for (let c = 0; c < 3; c++) {
      pose.pos[c] = cr(k0.pos[c], k1.pos[c], k2.pos[c], k3.pos[c], u);
      pose.look[c] = cr(k0.look[c], k1.look[c], k2.look[c], k3.look[c], u);
    }
    pose.fov = cr(k0.fov, k1.fov, k2.fov, k3.fov, u);
    if (isStacked()) fitStacked();
  }
  // With the copy below the picture (stacked), the picture's free area is the part of the frame above the copy; the
  // framework lifts the look point to its middle and backs off by `push`. One still, frontal shot is fitted to that
  // area: from the hanging reference (top) to the table's front edge (bottom), and as wide as the board and the robot.
  const FIT = { x: BX + .73, top: [4.0, -1.4], bottom: [0, 3.2], half: 2.45, near: .4, pitch: .12, fov: 36 };
  const fit = { free: -1, aspect: -1, cy: 1.9, cz: .9, D: 14, push: 1 };
  function fitStacked() {
    const view = viewCamera && viewCamera.view;
    const free = view && view.fullHeight ? clamp(1 - 2 * view.offsetY / view.fullHeight, .3, 1) : .5, aspect = (viewCamera && viewCamera.aspect) || .56;
    const c = Math.cos(FIT.pitch), s = Math.sin(FIT.pitch);
    if (free !== fit.free || aspect !== fit.aspect) {
      fit.free = free; fit.aspect = aspect;
      const ty = Math.tan(FIT.fov * Math.PI / 360), lim = free * ty * .9, limH = ty * aspect * .94;
      let cy = 1.9, cz = .9, d = 14;
      for (let k = 0; k < 8; k++) {
        const py = cy + s * d, pz = cz + c * d;
        const up = (y, z) => ((y - py) * c - (z - pz) * s) / (-(y - py) * s - (z - pz) * c);   // how high a point stands in the frame
        const tt = up(FIT.top[0], FIT.top[1]), tb = up(FIT.bottom[0], FIT.bottom[1]), mid = (tt + tb) / 2;
        cy += mid * d * c * .9; cz -= mid * d * s * .9;                                       // the two ends, centred
        d *= clamp(Math.max((tt - tb) / 2 / lim, FIT.half / ((pz - FIT.near) * limH)), .7, 1.4);
      }
      fit.cy = cy; fit.cz = cz; fit.D = d; fit.push = clamp(1.4 * free / aspect, 1, 2.2);
    }
    pose.fov = FIT.fov;
    pose.look[0] = FIT.x; pose.look[1] = fit.cy; pose.look[2] = fit.cz;
    pose.pos[0] = FIT.x; pose.pos[1] = fit.cy + s * fit.D / fit.push; pose.pos[2] = fit.cz + c * fit.D / fit.push;
  }
  cameraAt(0);

  /* ---- per-frame scratch (nothing is allocated in update) ---- */
  const p3 = new THREE.Vector3(), a3 = new THREE.Vector3(), aim = new THREE.Vector3(), rimBase = new THREE.Color(accent), rimRed = new THREE.Color(1, .3, .4), rimGreen = new THREE.Color(.3, 1, .6);
  const lampOff = new THREE.Color(0x26324d), lampOn = new THREE.Color(GREEN), beadCyan = new THREE.Color(CYAN), beadGreen = new THREE.Color(GREEN), busOff = new THREE.Color(0x2a3550);
  const walkAt = (out, k) => {            // along the two legs of the walk, k in 0..1
    const s = clamp(k) * 2, i = Math.min(1, Math.floor(s)), f = s - i;
    return out.set(lerp(WALK[i][0], WALK[i + 1][0], f), 0, lerp(WALK[i][1], WALK[i + 1][1], f));
  };
  const scoreAt = lp => (lp > T.snap ? easeOut(clamp((lp - T.snap) / .03)) : 0);

  return {
    camera,
    update(lp, t, dt, ui) {
      if (reduce) { lp = 1; t = 0; }
      const idle = reduce ? 0 : 1;
      cameraAt(lp);

      /* the crane lowers the sealed reference; it settles on the board's top edge and leans with it */
      const low = smooth(clamp((lp - T.lowerA) / (T.lowerB - T.lowerA))), seat = smooth(clamp((low - .7) / .3));
      const sway = (1 - low) * Math.sin(t * 1.3) * .035 * idle, land = decay(lp - T.lowerB, .012) * Math.cos((lp - T.lowerB) / .012 * 2.2);
      const by = lerp(HANG_Y, dock.y, low) - (lp > T.lowerB ? land * .03 : 0);
      box.position.set(dock.x + sway, by, dock.z); box.rotation.set(-TILT * seat, 0, sway * 1.2);
      box.scale.set(1 + (lp > T.lowerB ? land * .05 : 0), 1 - (lp > T.lowerB ? land * .07 : 0), 1);
      // the cable: taut while it carries the box, then wound back up
      const wound = smooth(clamp((lp - T.open) / .04)), cableEnd = lerp(by + .28, JIB_Y - .25, wound);
      cable.position.set(dock.x + sway * .5, (JIB_Y + cableEnd) / 2, dock.z); cable.scale.y = Math.max(.01, JIB_Y - cableEnd);
      // the seal: two rings spring off, and the mouth underneath lights
      const open = ramp(lp, T.open, T.open + .02);
      for (let k = 0; k < 2; k++) {
        const s = seals[k];
        s.position.set(box.position.x, box.position.y + (k ? .1 : -.1), box.position.z + .02);
        s.rotation.set(Math.PI / 2 - TILT * seat + open * (k ? .6 : -.6), 0, t * (k ? -1.1 : 1.3) * idle);
        s.scale.setScalar(1 + easeOut(open) * 1.3); s.visible = open < .999;
      }
      sealMat.opacity = 1 - open; sealMat.color.setRGB(1.6 + open * 2, 1 + open * 1.2, .3);
      const pour = decay(lp - T.open, .03);
      slitMat.color.setRGB(.2 + open * 1.2 + pour, .16 + open * .8 + pour * .7, .1 + open * .3);
      bandMat.emissiveIntensity = .7 + (1 - open) * .4 * (1 + Math.sin(t * 2.4) * idle) + pour * 2 + decay(lp - T.verdict, .03) * 1.5;
      boxGlow.position.set(box.position.x, box.position.y - .2, box.position.z + .3);
      boxGlow.material.opacity = clamp(pour * .8 + open * .12);

      /* the reference line draws down the board and a ring rides down it to each rail */
      const drawn = easeOut(clamp((lp - T.lineA) / .04));
      refLine.scale.y = Math.max(.001, drawn * LINE_LEN); refLine.position.y = PANEL.v1 - drawn * LINE_LEN / 2;
      refLine.visible = drawn > .001;

      let clickGlow = 0, lit = 0, latest = -1;
      for (let i = 0; i < 3; i++) {
        const r = rows[i];
        // the ring
        const fall = clamp((lp - (T.pins[i] - .02)) / .02), hitP = decay(lp - T.pins[i], .012);
        r.ring.visible = fall > 0;
        r.ring.position.y = lerp(PANEL.v1, r.v, fall * fall);
        r.ring.scale.setScalar(1 + hitP * .35 * Math.cos((lp - T.pins[i]) / .008));
        // the bead: out of the file, onto the rail's start, along it to its value
        const a = T.beads[i], f1 = clamp((lp - a) / T.fly), f2 = clamp((lp - a - T.fly) / T.slide), click = lp - CLICK[i];
        const target = RAIL.ref + r.off;
        r.bead.visible = lp > a - .012;
        const swell = clamp((lp - (a - .012)) / .012);
        if (f1 < 1) {
          const h = smooth(f1);
          r.bead.position.set(lerp(r.start.x, RAIL.u0, h), lerp(r.start.y, r.v, h) + Math.sin(f1 * Math.PI) * .45, lerp(r.start.z, .11, h) + Math.sin(f1 * Math.PI) * .5);
          r.bead.scale.setScalar(swell * (1 - .2 * Math.sin(f1 * Math.PI)));
        } else {
          const u = lerp(RAIL.u0, target, springy(f2));
          r.bead.position.set(u, r.v, .11);
          const sq = click > 0 ? decay(click, .01) * Math.cos(click / .01 * 2.2) : 0;
          r.bead.scale.set(1 + sq * .3, 1 - sq * .3, 1);
        }
        const flash = decay(click, .018);
        if (click > 0) { clickGlow += flash; if (click < .05) latest = i; }
        // the lamp: green once the rule is applied to this rail
        const on = smooth(clamp((lp - T.lamps[i]) / .012)), lampHit = decay(lp - T.lamps[i], .02);
        lit += on;
        const wave = decay(lp - T.verdict - i * .004, .025);
        r.lampMat.color.copy(lampOff).lerp(lampOn, on);
        r.lampMat.emissive.setHex(GREEN); r.lampMat.emissiveIntensity = on * (1.5 + lampHit * 2.5 + wave * 2 + .15 * Math.sin(t * 2.2 + i) * idle);
        r.lamp.scale.setScalar(1 + lampHit * .25);
        r.beadMat.emissive.copy(beadCyan).lerp(beadGreen, on);
        r.beadMat.emissiveIntensity = 1.5 + flash * 3 + lampHit * 1.5 + .2 * Math.sin(t * 3 + i) * idle;
        r.ringMat.emissiveIntensity = 1.2 + hitP * 2 + flash * 2.5;
        r.flare.position.set(r.bead.position.x, r.bead.position.y, .2);
        r.flare.material.opacity = clamp(flash * .9 + lampHit * .4); r.flare.scale.setScalar(.5 + flash * .5);
        // its figure and what the comparison found
        const shown = smooth(clamp(click / .015));
        r.value.material.opacity = shown; r.value.visible = shown > .01;
        r.value.position.y = r.v + .215 - (1 - shown) * .06;
        const noted = smooth(clamp((click - (i === 2 ? .095 : .012)) / .015));     // the p-value's gap is stated once the inset has shown it
        r.note.material.opacity = noted; r.note.visible = noted > .01;
        // the tolerance band and its brackets
        const band = smooth(clamp((lp - T.bands[i]) / .015));
        r.bandMat.opacity = band * (.2 + lampHit * .25 + .03 * Math.sin(t * 2 + i) * idle);
        r.edgeMat.opacity = band; r.edgeMat.emissiveIntensity = 1.1 + lampHit * 2;
        r.edges[0].visible = r.edges[1].visible = band > .01; r.band.visible = band > .005;
        r.edges[0].scale.y = r.edges[1].scale.y = Math.max(.001, band);
        r.tol.material.opacity = band; r.tol.visible = band > .01;
      }

      /* the lamps in series: the current climbs lamp by lamp once all three are on */
      const climb = clamp((lp - T.busA) / (T.snap - T.busA));
      const snapped = lp > T.snap, bump = decay(lp - T.snap, .03), vWave = decay(lp - T.verdict, .03);
      for (let k = 0; k < 3; k++) {
        const on = smooth(clamp(climb * 3 - k));
        busMats[k].color.copy(busOff).lerp(lampOn, on);
        busMats[k].emissiveIntensity = on * (1.3 + bump * 2 + vWave * 2 + .15 * Math.sin(t * 5 - k * 1.2) * idle);
      }
      const score = scoreAt(lp);
      digit1.material.opacity = snapped ? 1 : 0; digit1.visible = snapped;
      digit0.material.opacity = snapped ? 0 : .9; digit0.visible = !snapped;
      const pop = snapped ? 1 + bump * .5 : 1;
      digit1.scale.setScalar(pop);
      verdictFrame.emissiveIntensity = .45 + (snapped ? 1.1 : 0) + bump * 3 + vWave * 2.5 + (snapped ? .15 * Math.sin(t * 1.6) * idle : 0);
      verdictGlow.material.opacity = clamp(bump * .9 + vWave * .7 + (snapped ? .12 : 0)); verdictGlow.scale.setScalar(1.2 + bump * 1.2 + vWave);

      /* the inset: the p-value's spot enlarged, both bases in view */
      const ins = springy(clamp((lp - T.insetA) / (T.insetB - T.insetA))) * (1 - smooth(clamp((lp - T.insetC) / (T.insetD - T.insetC))));
      inset.visible = ins > .01;
      inset.scale.setScalar(Math.max(.001, ins)); inset.position.z = .12 + .2 * clamp(ins);
      insetFrame.emissiveIntensity = .9 + .2 * Math.sin(t * 2.4) * idle;
      zoomMat.opacity = clamp(ins) * .55; zooms[0].visible = zooms[1].visible = ins > .5;

      /* the other specification: run afterwards, a layer apart. Hollow rose beads leave their bands */
      const tag = smooth(clamp((lp - T.ghostTag) / .015)), dimG = 1 - .45 * smooth(clamp((lp - T.ghostDim) / .04));
      ghostTag.material.opacity = tag * dimG; ghostTag.visible = tag > .01;
      let redFlare = 0;
      for (let i = 0; i < 2; i++) {
        const g = rows[i].ghost, a = T.ghosts[i], f = clamp((lp - a) / T.ghostSlide), on = smooth(clamp((lp - (a - .012)) / .012));
        const u = lerp(RAIL.ref, g.u, smooth(f)), out = RAIL.ref - u > RAIL.pct ? 1 : 0;
        g.bead.visible = on > .01; g.bead.position.x = u; g.bead.scale.setScalar(on * (1 + .08 * Math.sin(t * 3 + i) * idle));
        g.mat.opacity = on * dimG; g.mat.emissiveIntensity = .9 + out * 1.2 + decay(lp - a - T.ghostSlide, .02) * 2;
        const len = RAIL.ref - u;
        g.trail.visible = len > .01; g.trail.scale.x = Math.max(.001, len); g.trail.position.x = RAIL.ref - len / 2; g.trailMat.opacity = .55 * dimG;
        const arrived = smooth(clamp((lp - a - T.ghostSlide) / .015));
        g.value.material.opacity = arrived * dimG; g.value.visible = arrived > .01;
        g.note.material.opacity = arrived * dimG; g.note.visible = arrived > .01;
        const red = smooth(clamp((lp - T.ghostLamps[i]) / .012)), redHit = decay(lp - T.ghostLamps[i], .02);
        g.lamp.visible = red > .01; g.lampMat.opacity = red * dimG; g.lampMat.emissiveIntensity = 1.3 + redHit * 3;
        g.lamp.scale.setScalar(1 + (1 - red) * .6 + redHit * .15);
        redFlare += redHit;
      }
      const gv = smooth(clamp((lp - T.ghostVerdict) / .015)), gvHit = decay(lp - T.ghostVerdict, .02);
      gVerdict.visible = gv > .01; gVerdictMat.opacity = gv * dimG; gVerdictMat.emissiveIntensity = 1.1 + gvHit * 3;
      gDigit.material.opacity = gv * dimG; gVerdict.scale.setScalar(1 + (1 - gv) * .3);
      redFlare += gvHit;

      /* light answers: the frame and the table's rim take each click, turn green at the verdict, red for the other run */
      frameMat.emissiveIntensity = .5 + clickGlow * .5 + bump * 1.2 + vWave * 1.4;
      rimMat.emissive.copy(rimBase).lerp(rimGreen, clamp(clickGlow * .5 + bump * .6)).lerp(rimRed, clamp(redFlare) * .7);
      rimMat.emissiveIntensity = 1 + clickGlow * .6 + bump * 1.2 + vWave * 1.5 + .12 * Math.sin(t * 1.5) * idle;
      fileFace.emissiveIntensity = .22 + (lp > T.beads[0] - .02 && lp < CLICK[2] ? .12 : 0) + vWave * .4;

      /* the agent: it walks off to its pad, follows each figure, leans in for the p-value, hops at the 1,
       * and steps back from the other run's red */
      const walk = clamp((lp - T.walkA) / (T.walkB - T.walkA)), wk = smooth(walk);
      walkAt(p3, wk);
      const peek = smooth(clamp((lp - .245) / .04)) * (1 - smooth(clamp((lp - .36) / .04)));
      p3.x = lerp(p3.x, PEEK[0], peek); p3.z = lerp(p3.z, PEEK[1], peek);
      const flinch = smooth(clamp((lp - .555) / .02)) * (1 - smooth(clamp((lp - .69) / .04)));
      p3.x += flinch * .22; p3.z += flinch * .16;
      const moving = Math.sin(Math.PI * walk) + Math.sin(Math.PI * clamp((lp - .245) / .04)) * .7 + Math.sin(Math.PI * clamp((lp - .36) / .04)) * .7;
      const stride = (wk * 3.6 + peek * 1.2) * 9;
      const hop = Math.sin(Math.PI * clamp((lp - T.snap) / .03)) * .2 + Math.sin(Math.PI * clamp((lp - T.verdict) / .03)) * .12;
      bot.update(t * idle, 0);
      bot.root.position.set(p3.x, Math.abs(Math.sin(stride)) * .05 * clamp(moving) + Math.abs(Math.sin(t * 2.1)) * .02 * idle * (1 - clamp(moving)) + hop, p3.z);
      // what it looks at
      if (lp < T.pins[2]) aim.copy(box.position);
      else {
        let ci = 0; for (let i = 0; i < 3; i++) if (lp >= T.beads[i] - .02) ci = i;
        toSet(aim, rows[ci].bead.position.x, rows[ci].bead.position.y, .1);
        const toInset = clamp(ins); if (toInset > 0) aim.lerp(toSet(a3, inset.position.x, inset.position.y, .3), toInset);
        const toLamps = smooth(clamp((lp - T.lamps[0] + .015) / .02)) * (1 - smooth(clamp((lp - T.ghosts[0] + .01) / .02)));
        const li = lp >= T.busA ? 3 : lp >= T.lamps[2] ? 2 : lp >= T.lamps[1] ? 1 : 0;
        if (toLamps > 0) aim.lerp(toSet(a3, LAMP_U, li === 3 ? HEAD_V : RAIL.v[li], .1), toLamps);
        const toGhost = smooth(clamp((lp - T.ghosts[0] + .01) / .02)) * (1 - smooth(clamp((lp - T.verdict + .03) / .03)));
        if (toGhost > 0) { const gi = lp >= T.ghosts[1] ? 1 : 0; aim.lerp(toSet(a3, rows[gi].ghost.bead.position.x, RAIL.v[gi], .1), toGhost); }
        const toVerdict = smooth(clamp((lp - T.verdict + .03) / .03));
        if (toVerdict > 0) aim.lerp(toSet(a3, LAMP_U, HEAD_V, .1), toVerdict);
      }
      const bx = bot.root.position.x, bz = bot.root.position.z;
      // it faces the way it walks, then turns to the board
      const facing = Math.atan2(aim.x - bx, aim.z - bz), heading = Math.atan2(WALK[2][0] - WALK[0][0], WALK[2][1] - WALK[0][1]);
      const turned = smooth(clamp((walk - .75) / .25)), started = smooth(clamp(walk / .15));
      let yaw = lerp(facing, heading, started * (1 - turned));
      bot.root.rotation.y = yaw;
      let rel = facing - yaw; rel -= Math.round(rel / TAU) * TAU;
      const dist = Math.hypot(aim.x - bx, aim.z - bz), headY = .62 * SCALE + .3;
      bot.head.rotation.y = clamp(rel, -1.2, 1.2) + Math.sin(t * .8) * .05 * idle + Math.sin((lp - .6) / .012) * .22 * flinch * (lp > .6 && lp < .66 ? 1 : 0);
      bot.head.rotation.x = clamp(-Math.atan2(aim.y - headY, dist), -.6, .45);
      padMat.emissiveIntensity = .6 + turned * .6 + bump * 2;

      ui.set('score', score.toFixed(3));
    },
  };
}

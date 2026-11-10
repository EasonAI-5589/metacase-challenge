/* film-task.js — beat 0 of the Metacase film: Task.
 * FIN-T1-003's 55 read-only files rain into a glass container (the Docker container the agent
 * will work in) and settle into stacks by type: 18 CSV, 28 DOCX, 8 PDF/HTML, 1 LOG. The lid
 * swings shut. Outside the glass, the reviewer sends a tablet reading 8/5 18:00, the hour the
 * books lock, into a vault: it floats in, the door slams, the wheel spins and the bolts click home.
 * Every state is a function of lp, so scrubbing backwards replays it; t only adds idle life.
 *   lp .00–.02  the open container under its intake beam; the vault open, the tablet in hand
 *      .02–.52  the rain: a few files, then a downpour; each one squashes, flashes and rings
 *               its stack; the last, the single LOG, falls alone
 *      .535–.62 the lid falls shut, bounces twice, the glass edges flash
 *      .55–.665 the reviewer lifts the tablet; it arcs into the vault trailing light
 *      .655–.76 the door winds up, swings, slams; the vault jolts
 *      .74–.80  the wheel spins down and clicks: bolts out, lamp on, a shock ring, rim flash
 *      .80–1    held; the framework dollies on to the next set from .82 */

const TYPES = [
  { key: 'CSV', color: 0x45b5b0, ink: '#1d6b67' },
  { key: 'DOCX', color: 0x7d6ad8, ink: '#4a3c9c' },
  { key: 'PDF/HTML', color: 0xf2b545, ink: '#94640f' },
  { key: 'LOG', color: 0x9aa3b2, ink: '#454c5b' },
];
// six stacks on the container floor, back row tall, front row short; the LOG stands alone
const STACKS = [
  { type: 1, n: 14, x: -.8, z: -.42 }, { type: 1, n: 14, x: 0, z: -.42 }, { type: 0, n: 9, x: .8, z: -.42 },
  { type: 0, n: 9, x: -.8, z: .42 }, { type: 2, n: 8, x: 0, z: .42 }, { type: 3, n: 1, x: .8, z: .42 },
];
const N = 55;

// the timeline, in local progress
const RAIN_A = -.025, RAIN_B = .425, FALL = .085, LAND = .78, LOG_AT = .455;
const LID_A = .535, LID_B = .585;
const LIFT_A = .55, FLY_A = .575, FLY_B = .665;
const DOOR_ANT = .655, DOOR_A = .672, DOOR_B = .735;
const SPIN_A = .742, CLICK = .79;

const ease3 = x => 1 - (1 - x) * (1 - x) * (1 - x);
const backOut = x => { const c = 1.9, y = x - 1; return 1 + (c + 1) * y * y * y + c * y * y; };
const pulse = (age, tau) => (age < 0 ? 0 : Math.exp(-age / tau));
// a slam's rebound: two shrinking hops over `span`
const hops = (age, span, amp) => (age < 0 || age > span ? 0 : amp * Math.abs(Math.sin(age / span * Math.PI * 2)) * (1 - age / span) ** 2);
// a jolt: a quick decaying shake over `span`
const jolt = (age, span, amp) => (age < 0 || age > span ? 0 : amp * Math.sin(age / span * Math.PI * 3) * (1 - age / span) ** 2);

export async function build({ THREE, kit, set, labelTexture, reduce, hand, util, layout }) {
  const { PALETTE, add, block, cyl, ball, rbox, mat, glowMat } = kit;
  const { clamp, smooth, lerp } = util;
  const TEAL = PALETTE.teal, AMBER = PALETTE.amber, GILT = 0xd8b46a;
  let seed = 20260803;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  // kit materials are shared across beats: clone every one this beat animates
  const glow = (c, i) => glowMat(c, i).clone();
  const flat = (geo, material, x, y, z, parent = set) => add(parent, geo, material, x, y, z, false);
  const additive = (color, opacity = 0) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });

  /* ---- the plinth: dark navy, a glowing rim that answers the lid and the lock ---- */
  const PX = .5;
  cyl(set, 3.95, 4.1, .3, 0x1c2740, PX, -.3, 0, 72);
  cyl(set, 4.11, 3.85, .55, 0x111a2d, PX, -.85, 0, 72);
  const rimMat = glow(TEAL, 1.1);
  flat(new THREE.TorusGeometry(4.02, .03, 8, 160), rimMat, PX, .005, 0).rotation.x = Math.PI / 2;

  /* ---- the container: a base, a glass box with glowing teal edges, a hinged lid ---- */
  const CX = -1.05, W = 2.5, D = 1.75, H = 1.7, Y0 = .2;
  block(set, 2.8, Y0, 2.05, 0x1a2440, CX, 0, 0, .06);
  flat(rbox(2.84, .035, 2.09, .015), glowMat(TEAL, .9), CX, Y0 - .03, 0);
  const floorMat = mat(0x0f2a3c, { emissive: TEAL, intensity: .2 }).clone();
  flat(rbox(W - .04, .012, D - .04, .005), floorMat, CX, Y0 + .006, 0);
  const edgeMat = glow(TEAL, 1.5);
  const rod = (w, h, d, x, y, z, parent = set) => flat(rbox(w, h, d, Math.min(w, h, d) * .45), edgeMat, x, y, z, parent);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) rod(.07, H, .07, CX + sx * W / 2, Y0 + H / 2, sz * D / 2);
  for (const y of [Y0 + .035, Y0 + H - .035]) {
    for (const sz of [-1, 1]) rod(W + .07, .07, .07, CX, y, sz * D / 2);
    for (const sx of [-1, 1]) rod(.07, .07, D, CX + sx * W / 2, y, 0);
  }
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xd6fbf6, transparent: true, opacity: .06, roughness: .06, metalness: 0, depthWrite: false, side: THREE.DoubleSide });
  const pane = (w, h, x, y, z, ry, rx = 0, parent = set) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); parent.add(m); return m; };
  pane(W, H, CX, Y0 + H / 2, D / 2, 0); pane(W, H, CX, Y0 + H / 2, -D / 2, 0);
  pane(D, H, CX - W / 2, Y0 + H / 2, 0, Math.PI / 2); pane(D, H, CX + W / 2, Y0 + H / 2, 0, Math.PI / 2);
  // the lid hinges on the back top edge; open, it leans back past upright
  const lid = new THREE.Group(); lid.position.set(CX, Y0 + H, -D / 2); set.add(lid);
  pane(W, D, 0, .02, D / 2, 0, -Math.PI / 2, lid);
  rod(W + .07, .06, .06, 0, .03, D, lid);
  for (const sx of [-1, 1]) rod(.06, .06, D, sx * W / 2, .03, D / 2, lid);
  rod(.5, .05, .08, 0, .075, D - .03, lid);
  // the task's id on the base
  const idTex = labelTexture('film-task-id', [{ text: 'FIN-T1-003', size: 112, weight: 700, color: '#9ff3ee', font: '"Space Mono", ui-monospace, monospace', track: 16 }], { width: 1024, height: 160 });
  const idPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.4, .22), new THREE.MeshBasicMaterial({ map: idTex, transparent: true, depthWrite: false }));
  idPlate.position.set(CX, .1, 1.03); set.add(idPlate);
  // the intake beam the files fall through: a soft shaft, brightest face-on, gone at its edges
  const beamMat = new THREE.ShaderMaterial({
    uniforms: { color: { value: new THREE.Color(0x8ff6ff) }, opacity: { value: 0 } },
    vertexShader: 'varying vec3 vN;varying vec3 vV;varying float vY;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vY=uv.y;gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 color;uniform float opacity;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float f=abs(dot(normalize(vN),normalize(vV)));gl_FragColor=vec4(color,pow(f,2.2)*pow(1.-vY,1.7)*smoothstep(0.,.06,vY)*opacity);}',
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 7.4, 48, 1, true), beamMat);
  beam.position.set(CX, Y0 + 3.7, 0); beam.scale.z = .72; set.add(beam);

  /* ---- the files: 55 small tiles in the homepage's tile finish — cream slab, glowing type edge,
   * the type printed on top — drawn as instances, so the rain is six draw calls ---- */
  const TH = .06, PITCH = .066, PAD = .02;
  const pads = STACKS.map(s => {
    const m = mat(TYPES[s.type].color, { emissive: TYPES[s.type].color, intensity: .15 }).clone();
    flat(rbox(.64, PAD, .48, .01), m, CX + s.x, Y0 + PAD / 2, s.z);
    return m;
  });
  const body = new THREE.InstancedMesh(rbox(.56, TH, .4, .025), mat(0xf7f5f0), N);
  const band = new THREE.InstancedMesh(rbox(.585, .022, .425, .01).clone().translate(0, -.012, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), N);
  body.castShadow = body.receiveShadow = true; band.castShadow = false;
  const labelGeo = new THREE.PlaneGeometry(.42, .21).rotateX(-Math.PI / 2).translate(0, TH / 2 + .002, .02);
  const labels = TYPES.map((ty, k) => {
    const tex = labelTexture(`film-task-type-${k}`, [{ text: ty.key, size: ty.key.length > 4 ? 118 : 168, weight: 800, color: ty.ink, track: 6 }], { width: 512, height: 256 });
    const m = new THREE.InstancedMesh(labelGeo, new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), STACKS.reduce((n, s) => n + (s.type === k ? s.n : 0), 0));
    m.castShadow = false;
    return m;
  });
  for (const m of [body, band, ...labels]) { m.frustumCulled = false; set.add(m); }
  // type colours normalised to their brightest channel, so every edge glows at the same level
  const tint = TYPES.map(ty => { const c = new THREE.Color(ty.color), k = 1 / Math.max(c.r, c.g, c.b); return [c.r * k, c.g * k, c.b * k]; });

  // Order: layer by layer across the stacks, so all six rise together; the LOG falls last, alone.
  const order = [];
  for (let l = 0; l < 14; l++) STACKS.forEach((s, j) => { if (j !== 5 && l < s.n) order.push([j, l]); });
  order.push([5, 0]);
  const F = { start: new Float32Array(N), land: new Float32Array(N), stack: new Uint8Array(N), type: new Uint8Array(N), slot: new Uint8Array(N),
    tx: new Float32Array(N), ty: new Float32Array(N), tz: new Float32Array(N), yaw: new Float32Array(N),
    sx: new Float32Array(N), sy: new Float32Array(N), sz: new Float32Array(N), rx: new Float32Array(N), ry: new Float32Array(N), rz: new Float32Array(N), ph: new Float32Array(N) };
  const slots = [0, 0, 0, 0], firstStart = new Float32Array(6).fill(9), firstLand = new Float32Array(6).fill(9);
  order.forEach(([j, l], i) => {
    const s = STACKS[j];
    // sparse first drops, then a downpour: start times bunch up towards the end
    const a = i < N - 1 ? RAIN_A + (RAIN_B - RAIN_A) * Math.pow(i / (N - 2), .62) : LOG_AT;
    F.start[i] = a; F.land[i] = a + FALL * LAND; F.stack[i] = j; F.type[i] = s.type; F.slot[i] = slots[s.type]++;
    F.tx[i] = CX + s.x + (rnd() - .5) * .03; F.ty[i] = Y0 + PAD + TH / 2 + l * PITCH; F.tz[i] = s.z + (rnd() - .5) * .03; F.yaw[i] = (rnd() - .5) * .1;
    F.sx[i] = F.tx[i] + (rnd() - .5) * 2.4; F.sy[i] = 4.5 + rnd() * 1.5; F.sz[i] = F.tz[i] + (rnd() - .5) * 1.6;
    F.rx[i] = (rnd() - .5) * 2.8; F.ry[i] = (rnd() - .5) * 4.4; F.rz[i] = (rnd() - .5) * 2.4; F.ph[i] = rnd() * Math.PI * 2;
    if (l === 0) { firstStart[j] = a; firstLand[j] = F.land[i]; }
  });
  for (let i = 0; i < N; i++) band.setColorAt(i, new THREE.Color(1, 1, 1));
  // a ring that blooms out of a stack whenever a file lands on it
  const ringGeo = new THREE.RingGeometry(.3, .36, 40).rotateX(-Math.PI / 2);
  const rings = STACKS.map(s => { const m = new THREE.Mesh(ringGeo, additive(TYPES[s.type].color)); m.position.set(CX + s.x, 0, s.z); m.visible = false; set.add(m); return m; });

  /* ---- the vault: a heavy dark shell, an amber-lit inside, a door with a wheel and three bolts ---- */
  const VX = 2.45, VZ = -.2, VW = 1.45, VH = 1.6, VD = 1.2, VT = .2, VF = .1;
  const vault = new THREE.Group(); vault.position.set(VX, 0, VZ); vault.rotation.y = -.14; set.add(vault);
  const steel = mat(0x252e48, { rough: .55 }), steelHi = mat(0x313d5e, { rough: .45 }), gilt = mat(GILT, { rough: .35 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(vault, .07, .09, VF, PALETTE.ink, sx * (VW / 2 - .18), 0, sz * (VD / 2 - .18), 12);
  block(vault, VW, VT, VD, steel, 0, VF, 0, .08);
  block(vault, VW, VT, VD, steel, 0, VF + VH - VT, 0, .08);
  for (const sx of [-1, 1]) block(vault, VT, VH, VD, steel, sx * (VW / 2 - VT / 2), VF, 0, .08);
  block(vault, VW, VH, VT, steel, 0, VF, -VD / 2 + VT / 2, .08);
  const innerMat = glow(AMBER, .8);
  block(vault, VW - 2 * VT, VH - 2 * VT, .03, innerMat, 0, VF + VT, -VD / 2 + VT + .015, .01).castShadow = false;
  block(vault, VW - 2 * VT, .02, VD - VT, mat(0x3b2a14, { emissive: AMBER, intensity: .18 }), 0, VF + VT, VT / 2, .01).castShadow = false;
  flat(rbox(VW + .04, .04, VD + .04, .02), glowMat(AMBER, .7), 0, VF + .03, 0, vault);
  // the cradle the rubric comes to rest on
  block(vault, .62, .12, .34, steelHi, 0, VF + VT, -.1, .03);
  flat(rbox(.66, .025, .38, .01), glowMat(AMBER, 1.1), 0, VF + VT + .125, -.1, vault);
  const trim = glowMat(AMBER, .8), OW = VW - 2 * VT, OH = VH - 2 * VT, oy = VF + VH / 2;
  for (const sy of [-1, 1]) flat(rbox(OW + .07, .035, .035, .015), trim, 0, oy + sy * (OH / 2 + .02), VD / 2 + .005, vault);
  for (const sx of [-1, 1]) flat(rbox(.035, OH + .07, .035, .015), trim, sx * (OW / 2 + .02), oy, VD / 2 + .005, vault);
  const lampMat = mat(0x3a2d14, { emissive: AMBER, intensity: .15 }).clone();
  cyl(vault, .1, .11, .05, PALETTE.ink, 0, VF + VH, VD / 2 - .2, 16);
  ball(vault, .07, lampMat, 0, VF + VH + .09, VD / 2 - .2, 16);
  const BOLT_Y = [-.45, 0, .45];
  BOLT_Y.forEach(y => block(vault, .11, .13, .2, steelHi, -VW / 2 + .055, oy + y - .065, VD / 2 + .1, .03));
  const innerGlow = util.glowSprite(AMBER, 1.9, .5); innerGlow.position.set(0, oy, VD / 2 - .25); vault.add(innerGlow);
  // the door: hinged on the right edge, centred on the opening when shut
  const DW = VW - .1, DH = VH - .1, DT = .14;
  const hinge = new THREE.Group(); hinge.position.set(VW / 2 - .03, oy, VD / 2 + .01); vault.add(hinge);
  const door = new THREE.Group(); door.position.x = -DW / 2 + .02; hinge.add(door);
  add(door, rbox(DW, DH, DT, .07), steelHi, 0, 0, DT / 2);
  add(door, rbox(DW - .26, DH - .26, .04, .03), steel, 0, 0, DT + .012);
  for (const y of [-.48, .48]) cyl(hinge, .05, .05, .26, PALETTE.ink, 0, y - .13, .07, 12);
  const wheel = new THREE.Group(); wheel.position.set(0, 0, DT + .06); door.add(wheel);
  const ringMat = glow(AMBER, 1.6);
  flat(new THREE.TorusGeometry(.28, .036, 10, 56), ringMat, 0, 0, 0, wheel);
  add(wheel, new THREE.CylinderGeometry(.095, .095, .08, 24), steelHi, 0, 0, 0).rotation.x = Math.PI / 2;
  ball(wheel, .05, ringMat, 0, 0, .05, 14);
  for (let k = 0; k < 3; k++) {
    const spoke = new THREE.Group(); spoke.rotation.z = k * Math.PI * 2 / 3; wheel.add(spoke);
    block(spoke, .04, .38, .04, gilt, 0, 0, 0, .015);
    ball(spoke, .048, ringMat, 0, .4, 0, 12);
  }
  const BOLT_X = -DW / 2 + .2;
  const bolts = BOLT_Y.map(y => { const b = add(door, new THREE.CylinderGeometry(.045, .045, .3, 14), gilt, BOLT_X, y, DT + .03); b.rotation.z = Math.PI / 2; return b; });
  // the shock ring of the lock
  const shock = new THREE.Mesh(new THREE.RingGeometry(.74, .8, 72).rotateX(-Math.PI / 2), additive(AMBER));
  shock.position.set(VX, .03, VZ); shock.visible = false; set.add(shock);

  /* ---- the independent reviewer, and a tablet with the lock's date and hour on its face ---- */
  const EX = .95, EZ = 1.12, EYAW = .32, ES = 1.12;
  const expert = kit.person(2);
  expert.root.position.set(EX, 0, EZ); expert.root.rotation.y = EYAW; expert.root.scale.setScalar(ES); set.add(expert.root);
  const torso = expert.root.children[0];
  const arms = torso.children.filter(c => c.isGroup && Math.abs(c.position.x) > .2 && c.position.y > .5);
  const head = torso.children.find(c => c.isGroup && c.position.x === 0 && c.position.y > .6);
  const tablet = new THREE.Group(); set.add(tablet);
  const TW = .62, THT = .46;
  add(tablet, rbox(TW, THT, .06, .05), mat(0xf7f5f0), 0, 0, 0);
  const tabEdgeMat = glow(AMBER, 1.4);
  flat(rbox(TW + .05, THT + .05, .026, .03), tabEdgeMat, 0, 0, -.014, tablet);
  const rubricTex = labelTexture('film-task-lock', [
    { text: '8/5', size: 270, weight: 800, color: '#b9770f', track: -4 },
    { text: '18:00', size: 230, weight: 800, color: '#b9770f', track: -2 },
  ], { width: 1024, height: 740 });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(TW * .94, THT * .94), new THREE.MeshStandardMaterial({ map: rubricTex, transparent: true, roughness: .8 }));
  face.position.z = .031; tablet.add(face);
  const tabGlow = util.glowSprite(AMBER, 1.2, .35); tabGlow.position.z = -.06; tablet.add(tabGlow);
  // where it is held (set coordinates), where it goes, and the arc between
  const P0 = new THREE.Vector3(0, .44, .31).multiplyScalar(ES).applyAxisAngle(new THREE.Vector3(0, 1, 0), EYAW).add(new THREE.Vector3(EX, 0, EZ));
  vault.updateMatrix();
  const P2 = new THREE.Vector3(0, VF + VT + .14 + THT * .42, -.1).applyMatrix4(vault.matrix);
  const P0up = P0.clone(); P0up.y += .13;
  const P1 = P0up.clone().lerp(P2, .5); P1.y += 1.25; P1.z += .55;
  const bez = (out, s) => { const a = 1 - s; return out.set(a * a * P0up.x + 2 * a * s * P1.x + s * s * P2.x, a * a * P0up.y + 2 * a * s * P1.y + s * s * P2.y, a * a * P0up.z + 2 * a * s * P1.z + s * s * P2.z); };
  const trail = Array.from({ length: 6 }, (_, k) => { const s = util.glowSprite(AMBER, .42 - k * .045, 0); set.add(s); return s; });

  // Later beats may want the task's facts; data only, they build their own objects.
  hand.task = { id: 'FIN-T1-003', files: TYPES.map((ty, k) => ({ type: ty.key, color: ty.color, count: [18, 28, 8, 1][k] })), rubricChecks: 27 };

  /* ---- the camera: high and wide over the open container, then down to three-quarters ---- */
  const camera = {
    from: { pos: [-3.0, 10.6, 10.2], look: [-.2, .6, 0], fov: 38 },
    to: { pos: [3.2, 4.4, 11.6], look: [-.05, .9, 0], fov: 30 },
  };
  const LOOK_Y = camera.to.look[1];
  // Beside the copy the framework shifts the picture right, so the look target sits left of the
  // composition; with the copy stacked below (same query as the framework) it centres on it.
  const stackedQuery = layout ? null : matchMedia('(max-width: 600px), (max-aspect-ratio: 11/10)');
  const isStacked = () => (layout ? layout.stacked : stackedQuery.matches);

  const dummy = new THREE.Object3D();
  const cTeal = new THREE.Color(TEAL), cAmber = new THREE.Color(AMBER);
  const stackCount = new Uint8Array(6), stackLast = new Float32Array(6);
  const colors = band.instanceColor.array;
  let lastL = -1, flying = 1, landed = 0, flashSum = 0;

  function placeFiles(L, T) {
    stackCount.fill(0); stackLast.fill(-1);
    landed = 0; flying = 0; flashSum = 0;
    for (let i = 0; i < N; i++) {
      const u = (L - F.start[i]) / FALL, ty = F.type[i];
      let level = .78;
      if (u <= 0) {
        dummy.position.set(F.sx[i], F.sy[i], F.sz[i]); dummy.rotation.set(0, 0, 0); dummy.scale.set(0, 0, 0);
      } else if (u < LAND) {
        // the fall: drift in early, drop under gravity, tumble flat just before the stack
        const f = u / LAND, h = 1 - (1 - f) * (1 - f), e = smooth(f), loose = 1 - f, drop = .4 * f + .6 * f * f, born = Math.min(1, f / .14);
        dummy.position.set(
          F.sx[i] + (F.tx[i] - F.sx[i]) * h + Math.sin(T * 2.3 + F.ph[i]) * .07 * loose,
          F.sy[i] + (F.ty[i] - F.sy[i]) * drop,
          F.sz[i] + (F.tz[i] - F.sz[i]) * h + Math.cos(T * 1.9 + F.ph[i]) * .05 * loose);
        dummy.rotation.set(F.rx[i] * (1 - e) + Math.sin(T * 3.1 + F.ph[i]) * .25 * loose, F.yaw[i] + F.ry[i] * (1 - e), F.rz[i] * (1 - e) + Math.cos(T * 2.7 + F.ph[i]) * .25 * loose);
        // each file arrives out of the beam: it swells from a spark, white-hot, then cools to its colour
        dummy.scale.setScalar(.2 + .8 * ease3(born));
        level = 1.15 + 3.5 * (1 - smooth(f / .3)); flying++;
      } else {
        // the landing: squash, a small hop and a wobble that die away
        const s = Math.min(1, (u - LAND) / (1 - LAND)), k = (1 - s) ** 3, sq = k * Math.cos(s * Math.PI * 2.5) * .32;
        dummy.position.set(F.tx[i], F.ty[i] + .07 * Math.sin(s * Math.PI) * (1 - s) - sq * TH / 2, F.tz[i]);
        dummy.rotation.set(.12 * Math.sin(s * Math.PI * 2) * (1 - s) * (1 - s) * (F.ph[i] > 3 ? 1 : -1), F.yaw[i], 0);
        dummy.scale.set(1 + sq * .4, 1 - sq, 1 + sq * .4);
        const age = L - F.land[i], fl = pulse(age, .012);
        level = .78 + 3.2 * fl; flashSum += fl;
        landed++;
        const j = F.stack[i]; stackCount[j]++; if (F.land[i] > stackLast[j]) stackLast[j] = F.land[i];
      }
      dummy.updateMatrix();
      body.setMatrixAt(i, dummy.matrix); band.setMatrixAt(i, dummy.matrix); labels[ty].setMatrixAt(F.slot[i], dummy.matrix);
      const c = tint[ty]; colors[i * 3] = c[0] * level; colors[i * 3 + 1] = c[1] * level; colors[i * 3 + 2] = c[2] * level;
    }
    body.instanceMatrix.needsUpdate = band.instanceMatrix.needsUpdate = band.instanceColor.needsUpdate = true;
    for (const m of labels) m.instanceMatrix.needsUpdate = true;
    // each stack's pad wakes as its first file nears, and its ring blooms on every landing
    for (let j = 0; j < 6; j++) {
      const n = stackCount[j], age = L - stackLast[j];
      pads[j].emissiveIntensity = n ? .55 + 1.6 * pulse(age, .012) : .12 + .75 * smooth((L - firstStart[j]) / (firstLand[j] - firstStart[j]));
      const ring = rings[j];
      if (n && age < .03) {
        ring.visible = true; ring.position.y = Y0 + PAD + n * PITCH + .01;
        ring.scale.setScalar(1 + ease3(age / .03) * 1.4); ring.material.opacity = .9 * (1 - age / .03);
      } else ring.visible = false;
    }
  }

  return {
    camera,
    update(lp, t, dt, ui) {
      const L = reduce ? 1 : lp, T = reduce ? 0 : t;
      if (L !== lastL || flying) { placeFiles(L, T); lastL = L; }
      ui.set('files', String(landed));

      /* the container: beam while it rains, the lid's fall, edges that answer landings and the slam */
      const rain = (.5 + .5 * smooth(L / .05)) * (1 - smooth((L - .5) / .07));
      beamMat.uniforms.opacity.value = .55 * rain * (.9 + .1 * Math.sin(T * 3));
      beam.visible = rain > .001;
      const lc = clamp((L - LID_A) / (LID_B - LID_A)), lidAge = L - LID_B;
      lid.rotation.x = L < LID_B ? -1.92 * (1 - lc * lc) : -hops(lidAge, .032, .13);
      const lidFlash = pulse(lidAge, .018);
      edgeMat.emissiveIntensity = 1.35 + .15 * Math.sin(T * 1.6) + .45 * Math.min(1, flashSum) + 3.2 * lidFlash;
      floorMat.emissiveIntensity = .18 + .35 * landed / N + .45 * Math.min(1.5, flashSum) + 1.2 * lidFlash;

      /* the expert: watches the rain, lifts the rubric, lets it go, watches the vault lock */
      expert.update(T, 0);
      const charge = smooth((L - LIFT_A) / (FLY_A - LIFT_A));
      let arm;
      if (L < FLY_A) arm = -1.0 + .03 * Math.sin(T * 1.7) - .3 * charge;
      else if (L < FLY_A + .025) arm = lerp(-1.3, -1.6, smooth((L - FLY_A) / .025));
      else arm = lerp(-1.6, 0, smooth((L - FLY_A - .025) / .05));
      arms[0].rotation.x = arms[1].rotation.x = arm;
      if (head) {
        const watch = smooth((L - FLY_A) / .07), nod = Math.sin(clamp((L - CLICK - .004) / .035) * Math.PI);
        head.rotation.y += lerp(-.55 + Math.sin(T * .45) * .12, .9, watch);
        head.rotation.x = .28 * charge * (1 - watch) + .2 * nod;
      }

      /* the rubric: in hand, then an arc into the vault with a trail of light */
      const fc = clamp((L - FLY_A) / (FLY_B - FLY_A)), fe = smooth(fc), flight = fc > 0 && fc < 1 ? Math.sin(fc * Math.PI) : 0;
      if (fc <= 0) {
        tablet.position.copy(P0); tablet.position.y += .13 * charge + Math.sin(T * 1.7) * .015;
        tablet.rotation.set(-.24 * (1 - charge), EYAW, 0); tablet.scale.setScalar(1);
      } else {
        bez(tablet.position, fe);
        if (fc >= 1) tablet.position.y += Math.sin(T * 2) * .01;
        tablet.rotation.set(-.24 * (1 - fe) + .18 * flight, lerp(EYAW, vault.rotation.y, fe), -.32 * flight);
        tablet.scale.setScalar(lerp(1, .84, fe));
      }
      const landedIn = pulse(L - FLY_B, .015);
      tabEdgeMat.emissiveIntensity = 1.4 + .3 * Math.sin(T * 2) + 2.2 * charge * (1 - fc) + 3 * flight + 2 * landedIn;
      tabGlow.material.opacity = .3 + .25 * charge + .4 * flight;
      for (let k = 0; k < trail.length; k++) {
        const s = fe - (k + 1) * .045;
        trail[k].visible = flight > .01 && s > 0;
        if (trail[k].visible) { bez(trail[k].position, s); trail[k].material.opacity = flight * .7 * (1 - k / trail.length); }
      }

      /* the vault: a creak while open, a wind-up, the swing, the slam; then the wheel and the click */
      const O = 1.95;
      let ang;
      if (L < DOOR_ANT) ang = O + .03 * Math.sin(T * .8) * (1 - smooth((L - DOOR_ANT + .03) / .03));
      else if (L < DOOR_A) ang = O + .12 * Math.sin(Math.PI * (L - DOOR_ANT) / (DOOR_A - DOOR_ANT));
      else if (L < DOOR_B) { const c = (L - DOOR_A) / (DOOR_B - DOOR_A); ang = O * (1 - c * c); }
      else ang = hops(L - DOOR_B, .03, .1);
      hinge.rotation.y = ang;
      const slam = L - DOOR_B;
      vault.position.x = VX + jolt(slam, .022, .035);
      innerMat.emissiveIntensity = .75 + .2 * Math.sin(T * 2.2) + 3 * landedIn;
      innerGlow.material.opacity = .32 * clamp(ang / O * 1.6) * (1 + 1.5 * landedIn);
      const spin = clamp((L - SPIN_A) / (CLICK - SPIN_A)), click = clamp((L - CLICK) / .012), ca = L - CLICK;
      wheel.rotation.z = -Math.PI * 2.5 * ease3(spin) - .45 * backOut(click);
      const bo = backOut(clamp((L - CLICK - .002) / .01));
      for (const b of bolts) b.position.x = BOLT_X - .19 * bo;
      const flare = pulse(ca, .014);
      ringMat.emissiveIntensity = 1.5 + 1.4 * spin * (1 - click) + 5 * flare + (L > CLICK + .02 ? .25 * Math.sin(T * 2) : 0);
      lampMat.emissiveIntensity = L < CLICK ? .15 : 1.8 + 3.5 * pulse(ca, .01) + .3 * Math.sin(T * 2.4);
      if (ca >= 0 && ca < .035) {
        const s = ca / .035; shock.visible = true;
        shock.position.x = vault.position.x; shock.scale.setScalar(1 + 2.4 * ease3(s)); shock.material.opacity = (1 - s) ** 2.2;
      } else shock.visible = false;

      /* the plinth's rim: teal, flaring with the lid; amber for a moment when the lock clicks */
      const lockFlash = pulse(ca, .03);
      rimMat.color.copy(cTeal).lerp(cAmber, lockFlash); rimMat.emissive.copy(rimMat.color);
      rimMat.emissiveIntensity = 1.1 + .2 * Math.sin(T * 1.5) + 2 * lidFlash + 2.6 * lockFlash;

      /* a small kick of the camera on the slam and the click */
      // stacked: the frame follows the rubric to the vault as it is locked away, so the punchline stays in
      const stacked = isStacked(), vx = stacked ? .6 * smooth((L - .55) / .25) : 0;
      camera.from.look[0] = (stacked ? .25 : -.2) + vx;
      camera.to.look[0] = (stacked ? .42 : -.05) + vx;
      camera.to.look[1] = LOOK_Y + jolt(slam, .02, .035) + jolt(ca, .016, .025) + jolt(lidAge, .016, .02);
    },
  };
}

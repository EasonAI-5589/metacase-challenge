/* film-grading.js — beat 3 of the Metacase film: Grading.
 * The two deliverables (the Word report and the Excel workbook) stand on the plinth under a
 * dark arch that is also the score dial. The expert rubric arrives sealed: a canister on the
 * keystone, held by two lock rings, with one light for each of its 27 checks. The lid springs
 * open and the canister fires its judge medallions one by one; each flips through the air and
 * stamps down into a ring around the deliverables: 20 checks to earn (3 met, 6 partly met,
 * 11 missed), 5 penalties that stay unlit, and last the 2 red lines, which land as shields and
 * close a red line around the work. The canister's lights turn into the scoreboard, and every
 * earned point snaps the needle and fills the dial, up to 57.25 of 172 = 0.333.
 *
 * lp timeline (the camera runs its own spline: low under the arch, up over the cascade, down to
 * the gate for the shields, back for the frontal reveal, which it reaches at 0.77)
 *   0.00–0.06  the sealed canister hums; the lock rings spring off and the lid flips open
 *   0.075–0.50 25 medallions fire, 16.5 thousandths apart: a target ring locks on, the medallion
 *              pops out of the mouth, flips along an arc and stamps down (squash, flash, the rim
 *              takes its colour). Met and partly met rise off the floor in a column of their
 *              light and snap the needle forward; missed lie dark. An early run of points on the
 *              right (to 0.19), the penalties land dark round the back and the score holds, a dry
 *              spell, then a late rally on the left reaches 0.333 at 0.50
 *   0.51–0.66  the two red-line shields are fired last, dive and plant; each draws its half of the
 *              red line; the lid slams shut (nothing flows back); the line closes and a field
 *              flares over the deliverables, a band of light rises through it, then it holds
 *   0.72–0.80  the verdict locks: a shockwave crosses the plinth, the dial, ticks and keystone flare
 *   0.80–1.00  hold, with idle life: the awarded medallions float, the robot watches, the field hums
 * Everything is a function of lp, plus small idle motion from t (none when ctx.reduce). */

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const PLINTH_R = 3.35, RING_R = 2.5, RED_R = 2.02;
const DIAL = { y: 1.05, z: -.62, R: 2.0, tube: .28, a0: 225 * DEG, span: 270 * DEG };
const CAN = { y: DIAL.y + DIAL.R + .19, z: DIAL.z, r: .34, h: .56 };   // the rubric's canister, on the keystone
const TOTAL = 172, EARNED = 57.25;
// The run's outcome, in the order the medallions land round the ring: M met, P partly met,
// X missed (3, 6 and 11 of the 20 checks to earn), N a penalty (5, none triggered). The counts
// are the run's; the order is staging: an early run of points on the right, the penalties and
// a dry spell round the back, a late rally on the left, so the final frontal shot shows all 9.
const ORDER = 'XPMXPPXMNNNNNXXXXXXPXMPXP';
const PTS = { M: 8.6, P: (EARNED - 3 * 8.6) / 6 };       // an illustrative split; the sum is the run's 57.25
const COIN_T0 = .075, STEP = .0165, POP = .008, FLY = .022;
const SHIELD_T0 = [.51, .575], S_POP = .012, S_FLY = .03, ARC_TIME = .05;
const VERDICT = .72;

const expo = x => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
const decay = (x, k) => (x < 0 ? 0 : Math.exp(-x / k));
// eases past 1 and settles (the needle's snap)
const springy = x => { const p = Math.min(1, Math.max(0, x)) - 1; return 1 + 2.6 * p * p * p + 1.6 * p * p; };

function canvasTexture(THREE, w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  paint(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
function roundRect(g, x, y, w, h, r, fill) { g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }

// A tube along an arc, indexed in order along the arc so setDrawRange sweeps it from its start.
function arcTube(THREE, R, r, a0, span, tubular, radial) {
  const pos = [], nor = [], idx = [], dir = Math.sign(span) || 1;
  for (let i = 0; i <= tubular; i++) {
    const u = a0 + span * i / tubular, cu = Math.cos(u), su = Math.sin(u);
    for (let j = 0; j <= radial; j++) {
      const v = j / radial * TAU, cv = Math.cos(v), sv = Math.sin(v);
      pos.push((R + r * cv) * cu, (R + r * cv) * su, r * sv); nor.push(cv * cu, cv * su, sv);
    }
  }
  for (let i = 0; i < tubular; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    if (dir > 0) idx.push(a, b, a + 1, b, b + 1, a + 1); else idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  g.userData.perSegment = radial * 6; g.userData.segments = tubular;
  g.setDrawRange(0, 0);
  return g;
}
const sweep = (geo, k) => geo.setDrawRange(0, Math.round(Math.min(1, Math.max(0, k)) * geo.userData.segments) * geo.userData.perSegment);

export async function build({ THREE, kit, set, accent, loadWeapons, hand, util, reduce, layout: ctxLayout }) {
  const { PALETTE, add, block, cyl, ball, rbox, mat, robot, GUN_HOLD } = kit;
  const { clamp, smooth, ramp, lerp, easeOut, glowSprite } = util;
  const glowMap = glowSprite(0xffffff, 1).material.map;
  const own = (color, emissive = color, intensity = 1, rough = .5) => new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: rough, metalness: 0 });
  const additive = (opts = {}) => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, ...opts });
  const tc = new THREE.Color();

  /* ---- the plinth: dark navy, an amber rim, and a darker band the medallions land on ---- */
  cyl(set, PLINTH_R, PLINTH_R + .15, .32, 0x1c2740, 0, -.32, 0, 72);
  cyl(set, PLINTH_R + .16, PLINTH_R - .1, .5, 0x111a2d, 0, -.82, 0, 72);
  const rimMat = own(accent, accent, 1.1);
  const rim = add(set, new THREE.TorusGeometry(PLINTH_R + .06, .03, 8, 128), rimMat, 0, .005, 0, false); rim.rotation.x = Math.PI / 2;
  const band = add(set, new THREE.RingGeometry(RING_R - .3, RING_R + .3, 96), mat(0x141b2e, { rough: .9 }), 0, .004, 0, false);
  band.rotation.x = -Math.PI / 2;

  /* ---- the arch, which is the dial: a dark 270° frame, a channel, the fill, ticks and a needle ---- */
  const dial = new THREE.Group(); dial.position.set(0, DIAL.y, DIAL.z); set.add(dial);
  const frame = add(dial, new THREE.TorusGeometry(DIAL.R, DIAL.tube, 18, 160, DIAL.span), mat(0x1f2b47, { rough: .7 }), 0, 0, 0);
  frame.rotation.z = -45 * DEG; frame.scale.z = .62;
  const edgeMat = own(accent, accent, .5);
  const edge = add(dial, new THREE.TorusGeometry(DIAL.R + DIAL.tube + .012, .02, 6, 160, DIAL.span), edgeMat, 0, 0, 0, false); edge.rotation.z = -45 * DEG;
  add(dial, arcTube(THREE, DIAL.R, .1, DIAL.a0, -DIAL.span, 270, 10), mat(0x080c17, { rough: .95 }), 0, 0, .15, false).geometry.setDrawRange(0, Infinity);
  const fillMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const fillGeo = arcTube(THREE, DIAL.R, .105, DIAL.a0, -DIAL.span, 270, 12);
  add(dial, fillGeo, fillMat, 0, 0, .17, false);
  const head = glowSprite(0xffc45a, 1, .85); head.position.z = .3; dial.add(head);
  // ticks: 21, every twentieth of the score; longer at the quarters
  const TICKS = 21, tickMesh = new THREE.InstancedMesh(rbox(.05, .2, .05, .02), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), TICKS);
  {
    const tm = new THREE.Matrix4(), tq = new THREE.Quaternion(), tp = new THREE.Vector3(), ts = new THREE.Vector3(), zAxis = new THREE.Vector3(0, 0, 1);
    for (let i = 0; i < TICKS; i++) {
      const u = DIAL.a0 - DIAL.span * i / (TICKS - 1), major = i % 5 === 0;
      tp.set(Math.cos(u) * (DIAL.R + .2), Math.sin(u) * (DIAL.R + .2), .1);
      tq.setFromAxisAngle(zAxis, u - Math.PI / 2); ts.set(1, major ? 1.3 : .7, 1);
      tickMesh.setMatrixAt(i, tm.compose(tp, tq, ts)); tickMesh.setColorAt(i, tc.setRGB(.4, .44, .54));
    }
  }
  dial.add(tickMesh);
  // the keystone, and the needle on its hub (behind the deliverables)
  const keyMat = own(PALETTE.amber, PALETTE.amber, .5, .45);
  add(dial, rbox(.5, .34, .58, .08), keyMat, 0, DIAL.R + .02, 0);
  const needle = new THREE.Group(); needle.position.z = .32; dial.add(needle);
  add(needle, rbox(1.5, .09, .06, .03), mat(PALETTE.cream, { rough: .4 }), .75, 0, 0);
  const tipMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  add(needle, rbox(.32, .13, .08, .04), tipMat, 1.42, 0, .01, false);
  cyl(dial, .2, .2, .12, PALETTE.ink, 0, -.06, .32, 24).rotation.x = Math.PI / 2;
  ball(dial, .09, own(PALETTE.amber, PALETTE.amber, 1.2), 0, 0, .4, 14);
  // feet where the arch meets the plinth
  [-1, 1].forEach(s => block(set, .78, .24, .86, 0x1f2b47, s * 1.76, 0, DIAL.z, .07));

  /* ---- the deliverables: a Word report and an Excel workbook (five sheets), on little stands ---- */
  const report = canvasTexture(THREE, 384, 512, (g, w) => {
    roundRect(g, 0, 0, w, 512, 26, '#f6efe0');
    roundRect(g, 0, 0, w, 74, 26, '#6aa8e8'); g.fillStyle = '#6aa8e8'; g.fillRect(0, 40, w, 34);
    roundRect(g, 26, 20, 34, 40, 6, '#ffffff'); g.fillStyle = '#6aa8e8'; [30, 40, 50].forEach(y => g.fillRect(32, y, 22, 4));
    roundRect(g, 32, 104, 230, 22, 8, '#1f2a3a');
    roundRect(g, 32, 136, 150, 12, 6, '#9aa3b2');
    [.92, .86, .9, .62, 0, .88, .94, .7, 0, .9, .8].forEach((f, k) => { if (f) roundRect(g, 32, 172 + k * 22, (w - 64) * f, 10, 5, k === 6 ? '#f2b545' : '#cfc7b6'); });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) roundRect(g, 32 + c * 108, 428 + r * 22, 98, 14, 4, r === 0 ? '#6aa8e8' : '#ddd5c4');
  });
  const workbook = canvasTexture(THREE, 512, 400, (g, w) => {
    roundRect(g, 0, 0, w, 400, 24, '#f6efe0');
    roundRect(g, 0, 0, w, 62, 24, '#3f9d6a'); g.fillStyle = '#3f9d6a'; g.fillRect(0, 30, w, 32);
    roundRect(g, 22, 14, 34, 34, 6, '#ffffff'); g.fillStyle = '#3f9d6a'; g.fillRect(28, 22, 22, 4); g.fillRect(28, 30, 22, 4); g.fillRect(28, 38, 22, 4); g.fillRect(37, 20, 4, 24);
    const x0 = 20, y0 = 78, cw = (w - 40) / 6, ch = 25;
    for (let r = 0; r < 10; r++) for (let c = 0; c < 6; c++) {
      g.fillStyle = r === 0 ? '#bfe0cb' : c === 0 ? '#e7dfcf' : (r * 7 + c * 3) % 11 === 0 ? '#f8d58a' : (r + c) % 4 === 0 ? '#d6ecdd' : '#fbf7ee';
      g.fillRect(x0 + c * cw + 1, y0 + r * ch + 1, cw - 2, ch - 2);
    }
    g.fillStyle = '#d2c9b6'; for (let r = 0; r <= 10; r++) g.fillRect(x0, y0 + r * ch, w - 40, 2); for (let c = 0; c <= 6; c++) g.fillRect(x0 + c * cw, y0, 2, ch * 10);
    for (let k = 0; k < 5; k++) roundRect(g, 22 + k * 94, 344, 86, 34, 8, k === 0 ? '#3f9d6a' : '#ddd5c4');
  });
  const slabs = [];
  function slab(tex, w, h, edgeColor, x, z, turn) {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = turn; set.add(g);
    block(g, w * .62, .14, .5, 0x26324d, 0, 0, -.04, .05);
    block(g, w * .66, .03, .54, own(edgeColor, edgeColor, .9), 0, .13, -.04, .015).castShadow = false;
    const lean = new THREE.Group(); lean.position.y = .16; lean.rotation.x = -.13; g.add(lean);
    add(lean, rbox(w + .07, h + .07, .07, .035), own(edgeColor, edgeColor, .35), 0, h / 2, -.05);
    add(lean, rbox(w, h, .1, .045), mat(0xf7f5f0), 0, h / 2, 0);
    const face = new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: .22, roughness: .75, metalness: 0 });
    add(lean, new THREE.PlaneGeometry(w * .94, h * .94), face, 0, h / 2, .052, false);
    // the judges' reading line, sliding down the page while the checks run
    const scan = add(lean, new THREE.PlaneGeometry(w * .98, .04), additive({ color: 0x8ff6ff, opacity: 0 }), 0, h / 2, .07, false);
    slabs.push({ g, face, scan, h });
  }
  slab(report, .92, 1.24, PALETTE.sky, -.72, .32, .2);
  slab(workbook, 1.18, .92, PALETTE.green, .74, .26, -.2);

  /* ---- the 25 medallions (instanced): a cream coin (dark for a penalty) with an inlay that lights ---- */
  const N = ORDER.length, S = N + 2;
  const coinGeo = new THREE.LatheGeometry([[0, -.045], [.17, -.045], [.195, -.026], [.2, 0], [.195, .026], [.17, .045], [.163, .045], [.156, .032], [0, .032]].map(([x, y]) => new THREE.Vector2(x, y)), 36);
  const coins = new THREE.InstancedMesh(coinGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .5, metalness: 0 }), N);
  coins.castShadow = true; coins.receiveShadow = true;
  const inlays = new THREE.InstancedMesh(new THREE.CircleGeometry(.152, 32).rotateX(-Math.PI / 2).translate(0, .035, 0), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N);
  // flight trails, target-and-impact rings, and the light each lit medallion throws on the floor
  const trailTex = canvasTexture(THREE, 4, 128, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.7, 'rgba(110,110,110,1)'); gr.addColorStop(1, 'rgba(255,255,255,1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const trails = new THREE.InstancedMesh(new THREE.CylinderGeometry(.25, 1, 1, 12, 1, true).translate(0, .5, 0), additive({ map: trailTex }), S);
  const rings = new THREE.InstancedMesh(new THREE.RingGeometry(.84, 1, 48).rotateX(-Math.PI / 2), additive(), S);
  const pools = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), additive({ map: glowMap }), S);
  const INSTANCED = [coins, inlays, trails, rings, pools];
  INSTANCED.forEach((m, k) => { m.frustumCulled = false; if (k > 1) m.renderOrder = 2; set.add(m); });

  // slots: the medallions run from the front right, round the back, to the front left; the shields keep the gap
  const slots = [];
  for (let i = 0; i < N; i++) {
    const theta = 42 * DEG + i * (276 * DEG / (N - 1)), k = ORDER[i], t0 = COIN_T0 + i * STEP;
    slots.push({ theta, x: Math.sin(theta) * RING_R, z: Math.cos(theta) * RING_R, kind: k, t0, hit: t0 + POP + FLY, pts: PTS[k] || 0, lit: k === 'M' || k === 'P', rise: .55 + .35 * Math.max(0, Math.cos(theta)) });
  }
  const OUT = { M: [.1, .95, .36], P: [1.1, .5, .04], X: [.12, .14, .19], N: [.05, .055, .08], R: [1.6, .16, .28] };
  const TINT = { M: [.72, 1, .8], P: [1, .86, .58] };   // the body of an awarded medallion warms to its colour
  const FLASH = { M: 2.6, P: 2.4, X: .7, N: .35, R: 3.4 };
  const POOL = { M: .9, P: .8, X: 0, N: 0, R: .6 };
  for (let i = 0; i < N; i++) {
    coins.setColorAt(i, slots[i].kind === 'N' ? tc.setRGB(.12, .15, .24) : tc.setRGB(.96, .94, .9));
    inlays.setColorAt(i, tc.setRGB(.5, .55, .65));
  }
  for (let i = 0; i < S; i++) { tc.setRGB(0, 0, 0); trails.setColorAt(i, tc); rings.setColorAt(i, tc); pools.setColorAt(i, tc); }

  /* ---- the red-line shields, and the red line they draw ---- */
  const shape = new THREE.Shape();
  shape.moveTo(0, -.4); shape.quadraticCurveTo(.31, -.22, .31, .08); shape.lineTo(.31, .3);
  shape.quadraticCurveTo(.16, .38, 0, .31); shape.quadraticCurveTo(-.16, .38, -.31, .3); shape.lineTo(-.31, .08);
  shape.quadraticCurveTo(-.31, -.22, 0, -.4);
  const shieldGeo = new THREE.ExtrudeGeometry(shape, { depth: .07, bevelEnabled: true, bevelThickness: .03, bevelSize: .025, bevelSegments: 3, curveSegments: 14 }).translate(0, 0, -.035);
  const RED = 0xe0405a;
  const shields = [24, -24].map((deg, k) => {
    const theta = deg * DEG, root = new THREE.Group(); set.add(root);
    const bodyMat = own(RED, RED, .3, .45), glowM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    add(root, shieldGeo, bodyMat, 0, 0, 0);
    const halo = add(root, shieldGeo, glowM, 0, 0, -.045, false); halo.scale.set(1.14, 1.1, .5);
    add(root, rbox(.42, .09, .05, .035), mat(PALETTE.cream, { rough: .4 }), 0, .04, .07);     // the line
    const r = RED_R + .12, t0 = SHIELD_T0[k];
    return { root, bodyMat, glowM, theta, t0, x: Math.sin(theta) * r, z: Math.cos(theta) * r, hit: t0 + S_POP + S_FLY, slot: N + k };
  });
  const redMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  // u = theta − 90° maps a plinth angle onto the arc's own angle once the arc is laid flat
  const uOf = th => th - Math.PI / 2, [R0, R1] = [shields[0].theta, shields[1].theta];
  const arcs = [
    arcTube(THREE, RED_R, .03, uOf(R0), 180 * DEG - R0, 140, 6),      // right half, round to the back
    arcTube(THREE, RED_R, .03, uOf(R1), -(180 * DEG + R1), 140, 6),   // left half, round to the back
    arcTube(THREE, RED_R, .03, uOf(R1), R0 - R1, 40, 6),              // the gate, left to right
  ];
  arcs.forEach(geo => { const m = add(set, geo, redMat, 0, .03, 0, false); m.rotation.x = -Math.PI / 2; });
  // the field over the deliverables: it flares as the line closes, a band of light rises, then it holds
  const field = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(1, .28, .4) }, uI: { value: 0 }, uRise: { value: -1 }, uT: { value: 0 } },
    vertexShader: 'varying vec3 vN;varying vec3 vV;varying float vY;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vY=position.y;gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'uniform vec3 uColor;uniform float uI;uniform float uRise;uniform float uT;varying vec3 vN;varying vec3 vV;varying float vY;void main(){float rim=pow(1.-abs(dot(normalize(vN),normalize(vV))),3.2);float lines=.8+.2*sin(vY*90.-uT*1.4);float band=smoothstep(.07,0.,abs(vY-uRise));float a=(rim*lines+band*1.4)*uI*(1.-smoothstep(.7,1.,vY)*.7);gl_FragColor=vec4(uColor*a,1.);}',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
  });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 24, 0, TAU, 0, Math.PI / 2), field);
  dome.renderOrder = 3; dome.visible = false; set.add(dome);
  // the verdict's shockwave
  const shockMat = additive({ color: 0x000000 });
  const shock = add(set, new THREE.RingGeometry(.92, 1, 128).rotateX(-Math.PI / 2), shockMat, 0, .02, 0, false); shock.renderOrder = 2;

  /* ---- the sealed rubric: a canister with a light per check, two lock rings and a hinged lid ---- */
  const can = new THREE.Group(); can.position.set(0, CAN.y, CAN.z); set.add(can);
  cyl(can, CAN.r, CAN.r + .05, CAN.h, 0x1f2b47, 0, 0, 0, 40);
  const bandMat = own(PALETTE.amber, PALETTE.amber, .8);
  [.07, CAN.h - .05].forEach(y => { const b = add(can, new THREE.TorusGeometry(CAN.r + .03 - y * .06, .022, 6, 48), bandMat, 0, y, 0, false); b.rotation.x = Math.PI / 2; });
  const mouthMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  add(can, new THREE.CircleGeometry(CAN.r - .06, 32).rotateX(-Math.PI / 2), mouthMat, 0, CAN.h + .003, 0, false);
  const lid = new THREE.Group(); lid.position.set(0, CAN.h, -CAN.r); can.add(lid);
  cyl(lid, CAN.r + .05, CAN.r + .05, .08, 0x26324d, 0, 0, CAN.r, 40);
  add(lid, new THREE.CircleGeometry(CAN.r - .02, 32).rotateX(Math.PI / 2), mouthMat, 0, -.004, CAN.r, false);   // its underside carries the light inside
  ball(lid, .07, own(PALETTE.amber, PALETTE.amber, 1.2), 0, .11, CAN.r, 12);
  const mouthGlow = glowSprite(0xbfe9ff, 1, 0); mouthGlow.position.set(0, CAN.y + CAN.h + .15, CAN.z); set.add(mouthGlow);
  const lights = new THREE.InstancedMesh(new THREE.SphereGeometry(.032, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N + 2);
  {
    const m = new THREE.Matrix4();
    for (let i = 0; i < N + 2; i++) {
      // the first to fire faces the reader; the rest run round the canister
      const a = (i / (N + 2)) * TAU, r = CAN.r + .045;
      lights.setMatrixAt(i, m.makeTranslation(Math.sin(a) * r, CAN.h * .5, Math.cos(a) * r));
      lights.setColorAt(i, tc.setRGB(.5, .7, .95));
    }
  }
  can.add(lights);
  const lockMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true });
  const locks = [0, 1].map(() => add(set, new THREE.TorusGeometry(.5, .028, 8, 64), lockMat, 0, 0, CAN.z, false));
  const MOUTH = new THREE.Vector3(0, CAN.y + CAN.h, CAN.z);

  /* ---- the agent: it has stopped; now it waits for its verdict, Claude Code lowered ---- */
  const bot = hand.dressedRobot?.() ?? robot(PALETTE.cream, 0x8ff6ff); // agent-run.html's loadout
  const BOT = { x: 2.95, z: -1.45 };
  const botYaw = Math.atan2(-BOT.x - .3, 1.2 - BOT.z);
  bot.root.position.set(BOT.x, 0, BOT.z); bot.root.scale.setScalar(1.15); bot.root.rotation.y = botYaw; set.add(bot.root);
  let gun;
  const wi = hand.armed?.weaponIndex ?? 2;
  try { const { weapons } = await loadWeapons(); gun = weapons[wi].clone(true); } catch { gun = kit.blaster(accent); }
  gun.scale.setScalar(.56); gun.position.copy(GUN_HOLD.at); gun.rotation.copy(GUN_HOLD.turn); bot.root.add(gun); bot.grip(1);
  const botPad = add(set, new THREE.TorusGeometry(.42, .025, 8, 48), own(0x8ff6ff, 0x8ff6ff, 1), BOT.x, .012, BOT.z, false); botPad.rotation.x = Math.PI / 2;

  // what the next beat may reuse (data only)
  hand.grade = { score: EARNED / TOTAL, earned: EARNED, total: TOTAL, met: 3, partly: 6, missed: 11, penaltiesTriggered: 0, redLinesHeld: 2, order: ORDER };

  /* ---- per-frame scratch (nothing is allocated in update) ---- */
  const m4 = new THREE.Matrix4(), p3 = new THREE.Vector3(), q4 = new THREE.Quaternion(), s3 = new THREE.Vector3(), e3 = new THREE.Euler(0, 0, 0, 'YXZ');
  const a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), d3 = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0), qId = new THREE.Quaternion(), zero = new THREE.Vector3(0, 0, 0);
  const rimBase = new THREE.Color(accent), rimHot = new THREE.Color(), rimRed = new THREE.Color(1, .3, .4);
  const setRGB = (attr, i, r, g, b) => { const a = attr.array; a[i * 3] = r; a[i * 3 + 1] = g; a[i * 3 + 2] = b; };
  // The camera line through the beat: low under the arch, up over the cascade, down to the gate as
  // the shields land, then back for the frontal reveal of the dial. A Catmull-Rom spline through
  // these keys, written into the camera the framework reads each frame (from and to are one pose).
  const KEYS = [
    { at: 0, pos: [-3.4, .75, 5.8], look: [.15, 2.45, -.3], fov: 46 },
    { at: .16, pos: [-2.6, 2.3, 8.3], look: [.9, 1.65, -.4], fov: 40 },
    { at: .4, pos: [.4, 3.6, 8.6], look: [.2, 1.25, -.3], fov: 38 },
    { at: .6, pos: [.35, 1.3, 7.4], look: [.4, 1.1, .5], fov: 40 },
    { at: .77, pos: [-.25, 3.7, 12.2], look: [-.1, 1.4, -.3], fov: 31 },
  ];
  const pose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 };
  const camera = { from: pose, to: pose };
  const cr = (p0, p1, p2, p3, u) => .5 * (2 * p1 + (p2 - p0) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (3 * p1 - p0 - 3 * p2 + p3) * u * u * u);
  function cameraAt(lp) {
    const last = KEYS.length - 1;
    let j = 0;
    while (j < last - 1 && lp >= KEYS[j + 1].at) j++;
    let u = clamp((lp - KEYS[j].at) / (KEYS[j + 1].at - KEYS[j].at));
    if (j === last - 1) u = 1 - (1 - u) * (1 - u);          // settle into the reveal
    const k0 = KEYS[Math.max(0, j - 1)], k1 = KEYS[j], k2 = KEYS[j + 1], k3 = KEYS[Math.min(last, j + 2)];
    for (let c = 0; c < 3; c++) {
      pose.pos[c] = cr(k0.pos[c], k1.pos[c], k2.pos[c], k3.pos[c], u);
      pose.look[c] = cr(k0.look[c], k1.look[c], k2.look[c], k3.look[c], u);
    }
    pose.fov = cr(k0.fov, k1.fov, k2.fov, k3.fov, u);
    // The reveal leans left to clear the copy beside the picture; with the copy below it (the
    // framework's stacked layout, same query) the dial is centred instead.
    // Stacked, the shields and the reveal also sit higher, above the copy.
    if (isStacked()) { const d = .5 * smooth((lp - .6) / .17); pose.pos[0] += d; pose.look[0] += d - .4 * smooth(lp / .16); pose.look[1] += .5 * smooth((lp - .45) / .1); }
  }
  const stackedQuery = ctxLayout ? null : matchMedia('(max-width: 600px), (max-aspect-ratio: 11/10)');
  const isStacked = () => (ctxLayout ? ctxLayout.stacked : stackedQuery.matches);
  cameraAt(0);

  // the flight from the canister's mouth to a slot: an arc that rises and then falls hard
  const flight = (out, from, x, y, z, f, rise) => {
    const h = smooth(f);
    return out.set(lerp(from.x, x, h), lerp(from.y, y, f * f) + Math.sin(f * Math.PI) * rise, lerp(from.z, z, h));
  };
  function scoreAt(lp, ease) {
    let pts = 0;
    for (let i = 0; i < N; i++) { const s = slots[i]; if (s.pts && lp > s.hit) pts += s.pts * ease((lp - s.hit) / .022); }
    return pts / TOTAL;
  }
  const easeIn = x => easeOut(clamp(x));
  // a trail: a tapered streak from the medallion back along its path
  function trail(i, f, from, x, y, z, rise, intensity, r, g, b) {
    if (f <= 0 || f >= 1 || intensity <= .002) { trails.setMatrixAt(i, m4.compose(zero, qId, zero)); setRGB(trails.instanceColor, i, 0, 0, 0); return; }
    flight(a3, from, x, y, z, f, rise); flight(b3, from, x, y, z, Math.max(0, f - .3), rise);
    d3.subVectors(b3, a3); const len = d3.length();
    if (len < 1e-3) { trails.setMatrixAt(i, m4.compose(zero, qId, zero)); return; }
    q4.setFromUnitVectors(yAxis, d3.divideScalar(len)); s3.set(.075, len, .075);
    trails.setMatrixAt(i, m4.compose(a3, q4, s3)); setRGB(trails.instanceColor, i, r * intensity, g * intensity, b * intensity);
  }

  return {
    camera,
    update(lp, t, dt, ui) {
      if (reduce) { lp = 1; t = 0; }
      const idle = reduce ? 0 : 1;
      cameraAt(lp);

      /* the seal: two lock rings spring off, the lid flips open on its hinge, the mouth lights */
      const open = ramp(lp, .005, .05);
      for (let k = 0; k < 2; k++) {
        const l = locks[k];
        l.position.set(0, CAN.y + (k ? .44 : .12) + (k ? 1 : -1) * expo(open) * .3, CAN.z);
        l.rotation.set(Math.PI / 2 + Math.sin(t * .9 + k) * .12 * idle + open * (k ? .5 : -.5), 0, t * (k ? -1.1 : 1.3) * idle);
        l.scale.setScalar(1 + expo(open) * 2.4); l.visible = open < .999;
      }
      lockMat.opacity = 1 - open;
      lockMat.color.setRGB(1.6 * (1 + open * 2), 1 * (1 + open * 2), .25);
      // the lid flips open, and slams shut once the last check is out: nothing flows back
      const SHUT = shields[1].t0 + S_POP + .02, shut = clamp((lp - SHUT) / .035);
      lid.rotation.x = -springy(ramp(lp, .015, .06)) * 1.4 * (1 - shut * shut) - .14 * Math.sin(Math.PI * clamp((lp - SHUT - .035) / .014));
      const slam = decay(lp - SHUT - .035, .012);
      let fire = 0;
      for (let i = 0; i < N; i++) fire += decay(lp - slots[i].t0, .01);
      for (let k = 0; k < 2; k++) fire += decay(lp - shields[k].t0, .014) * 1.5;
      const loaded = 1 - ramp(lp, SHUT, SHUT + .035);
      const mI = (.15 + .85 * open) * loaded * (1 + .12 * Math.sin(t * 3) * idle) + fire * .9 + decay(lp - VERDICT, .03) * 1.4;
      mouthMat.color.setRGB(.55 * mI + .1, .8 * mI + .1, 1.1 * mI + .12);
      mouthGlow.material.opacity = clamp(mI * .5 * (1 - shut * .8)); mouthGlow.scale.setScalar(.45 + mI * .35);
      bandMat.emissiveIntensity = .6 + fire * .8 + slam * 3 + decay(lp - VERDICT, .03) * 2.5 + (1 - open) * .5 * (1 + Math.sin(t * 2.4) * idle);

      let latest = -1, latestK = 'X', impactGlow = 0, slabPulse = 0;
      for (let i = 0; i < N; i++) {
        const s = slots[i];
        const a = clamp((lp - s.t0) / POP), f = clamp((lp - s.t0 - POP) / FLY), post = lp - s.hit, o = OUT[s.kind];
        let tilt = 0, yaw = s.theta, sy = 1, sxz = 1;
        if (a <= 0) {
          // still in the canister
          p3.copy(MOUTH); s3.set(0, 0, 0);
        } else if (f <= 0) {
          // anticipation: it pops out of the mouth, spinning, and hangs for a moment
          p3.set(MOUTH.x, MOUTH.y - .12 + .42 * easeOut(a), MOUTH.z); yaw = a * 5; sxz = sy = lerp(.4, 1, easeOut(a));
        } else if (post <= 0) {
          // the flight: one flip along the arc, landing face up
          b3.set(MOUTH.x, MOUTH.y + .3, MOUTH.z);
          flight(p3, b3, s.x, .045, s.z, f, s.rise);
          tilt = (TAU) * easeOut(f); yaw = 5 + f * 2; sy = 1 + .25 * f * f; sxz = 1 - .08 * f;
        } else {
          // the stamp: squash and a damped settle; the awarded ones then rise and float
          const k = Math.exp(-post / .014) * Math.cos(post / .014 * 2.3);
          sy = 1 - .55 * k; sxz = 1 + .34 * k;
          const lift = s.lit ? smooth((post - .02) / .05) : 0;
          p3.set(s.x, .045 * sy + lift * (.24 + Math.sin(t * 1.7 + i) * .035 * idle), s.z);
          yaw = s.theta + (s.lit ? lift * (t * .9 * idle + i) : 0);
          tilt = s.lit ? lift * .18 : 0;
          if (post < .06) { latest = i; latestK = s.kind; }
          impactGlow += decay(post, .02) * FLASH[s.kind];
          if (s.lit) slabPulse += decay(post, .025);
        }
        e3.set(tilt, yaw, 0); q4.setFromEuler(e3); if (a > 0) s3.set(sxz, sy, sxz);
        coins.setMatrixAt(i, m4.compose(p3, q4, s3)); inlays.setMatrixAt(i, m4);
        // the inlay: unjudged before, the outcome after; a flash at the stamp and a wave at the verdict
        if (post > 0) {
          const fl = decay(post, .016) * FLASH[s.kind];
          const wave = s.lit ? decay(lp - (VERDICT + .003 * i), .02) * 1.6 : 0;
          const hum = s.kind === 'M' ? .15 * Math.sin(t * 2.4 + i) * idle : s.kind === 'P' ? .08 * Math.sin(t * 1.7 + i) * idle : 0;
          const g = 1 + fl + wave + hum, w = fl * .35;
          setRGB(inlays.instanceColor, i, o[0] * g + w, o[1] * g + w, o[2] * g + w);
        } else if (s.kind === 'N') setRGB(inlays.instanceColor, i, .2, .18, .32);
        else { const h = .7 + .15 * Math.sin(t * 2 + i * .8) * idle + a * .6; setRGB(inlays.instanceColor, i, .5 * h, .6 * h, .78 * h); }

        // the target ring locks on while it flies, then flashes in the outcome's colour
        if (post > 0) {
          const rI = decay(post, .022) * FLASH[s.kind] * .75, rS = .3 + 1.25 * expo(post / .05);
          setRGB(rings.instanceColor, i, o[0] * rI + rI * .2, o[1] * rI + rI * .2, o[2] * rI + rI * .2);
          p3.set(s.x, .012, s.z); s3.set(rS, 1, rS);
        } else if (a > 0) {
          const k = a * .3 + f * .7, rI = .25 + .55 * k;
          setRGB(rings.instanceColor, i, .5 * rI, .85 * rI, 1.1 * rI);
          p3.set(s.x, .012, s.z); s3.set(lerp(.9, .3, smooth(k)), 1, lerp(.9, .3, smooth(k)));
        } else { setRGB(rings.instanceColor, i, 0, 0, 0); s3.set(0, 0, 0); }
        rings.setMatrixAt(i, m4.compose(p3, qId, s3));
        // light on the floor under a lit medallion
        const pI = post > 0 ? POOL[s.kind] * smooth((post - .01) / .05) * (1 + .12 * Math.sin(t * 1.7 + i) * idle) + decay(post, .02) * FLASH[s.kind] * .3 : 0;
        setRGB(pools.instanceColor, i, o[0] * pI, o[1] * pI, o[2] * pI);
        p3.set(s.x, .008, s.z); s3.set(1.15, 1, 1.15); pools.setMatrixAt(i, m4.compose(p3, qId, s3));
        // its trail through the air (or, once awarded, a column of its light)
        b3.set(MOUTH.x, MOUTH.y + .3, MOUTH.z);
        if (post > 0 && s.lit) {
          // an awarded medallion holds a short column of its light
          const lift = smooth((post - .02) / .05), pI = lift * (1.05 + .15 * Math.sin(t * 2.2 + i) * idle) + decay(post - .02, .03) * .9;
          p3.set(s.x, .05 + lift * .2, s.z); s3.set(.13, 1.0 * lift + .001, .13);
          trails.setMatrixAt(i, m4.compose(p3, qId, s3)); setRGB(trails.instanceColor, i, o[0] * pI, o[1] * pI, o[2] * pI);
          const tint = TINT[s.kind], w = smooth(post / .02);
          setRGB(coins.instanceColor, i, lerp(.96, tint[0], w), lerp(.94, tint[1], w), lerp(.9, tint[2], w));
        } else {
          trail(i, post > 0 ? 0 : f, b3, s.x, .045, s.z, s.rise, 1.3 * Math.sin(Math.PI * Math.min(1, f * 1.15)), .55, .8, 1.1);
          if (s.lit) setRGB(coins.instanceColor, i, .96, .94, .9);
        }
      }

      /* the shields: fired last; they dive, plant point first and flare */
      let redFlare = 0;
      for (let k = 0; k < 2; k++) {
        const sh = shields[k], i = sh.slot;
        const a = clamp((lp - sh.t0) / S_POP), f = clamp((lp - sh.t0 - S_POP) / S_FLY), post = lp - sh.hit;
        let yaw, tiltX = 0, sc = .55, sy = 1, sxz = 1;
        if (a <= 0) { p3.copy(MOUTH); yaw = 0; sc = 0; }
        else if (f <= 0) { p3.set(MOUTH.x, MOUTH.y - .2 + .75 * easeOut(a), MOUTH.z); yaw = sh.theta + (1 - easeOut(a)) * 4; sc = lerp(.25, .85, easeOut(a)); tiltX = -.25 * Math.sin(a * Math.PI); }
        else if (post <= 0) {
          b3.set(MOUTH.x, MOUTH.y + .55, MOUTH.z);
          flight(p3, b3, sh.x, .3, sh.z, f, 1.0); yaw = sh.theta + (1 - easeOut(f)) * TAU; sc = .85; tiltX = .2 * f; sy = 1 + .2 * f * f;
        } else {
          const kk = Math.exp(-post / .016) * Math.cos(post / .016 * 2.1);
          p3.set(sh.x, .3 - .03 + .015 * kk, sh.z); yaw = sh.theta; sc = .85; tiltX = -.08 * kk; sy = 1 - .3 * kk; sxz = 1 + .18 * kk;
          redFlare += decay(post, .03);
          impactGlow += decay(post, .025) * FLASH.R;
        }
        sh.root.position.copy(p3); sh.root.rotation.set(tiltX, yaw, 0, 'YXZ'); sh.root.scale.set(sc * sxz + 1e-4, sc * sy + 1e-4, sc * sxz + 1e-4); sh.root.visible = sc > 0;
        const flare = post > 0 ? decay(post, .03) * 4 : 0, held = post > 0 ? 1 : 0, beat = .12 * Math.sin(t * 2.2 + k * 1.3) * idle * held;
        sh.bodyMat.emissiveIntensity = .3 + held * .25 + flare * .5 + beat;
        sh.glowM.color.setRGB(1.9 * (.45 + held * .6 + flare + beat), .25 * (.45 + held * .6 + flare), .38 * (.45 + held * .6 + flare));
        // its ring, its light on the floor and its trail
        const o = OUT.R;
        if (post > 0) { const rI = decay(post, .028) * 2.4, rS = .4 + 1.7 * expo(post / .06); setRGB(rings.instanceColor, i, o[0] * rI, o[1] * rI, o[2] * rI); p3.set(sh.x, .014, sh.z); s3.set(rS, 1, rS); }
        else if (a > 0) { const kq = a * .3 + f * .7, rI = .4 + .8 * kq; setRGB(rings.instanceColor, i, 1.2 * rI, .25 * rI, .35 * rI); p3.set(sh.x, .014, sh.z); s3.set(lerp(1.3, .45, smooth(kq)), 1, lerp(1.3, .45, smooth(kq))); }
        else { setRGB(rings.instanceColor, i, 0, 0, 0); s3.set(0, 0, 0); }
        rings.setMatrixAt(i, m4.compose(p3, qId, s3));
        const pI = post > 0 ? POOL.R * smooth(post / .03) + decay(post, .03) * 1.4 : 0;
        setRGB(pools.instanceColor, i, o[0] * pI, o[1] * pI, o[2] * pI);
        p3.set(sh.x, .009, sh.z); s3.set(1.25, 1, 1.25); pools.setMatrixAt(i, m4.compose(p3, qId, s3));
        b3.set(MOUTH.x, MOUTH.y + .55, MOUTH.z);
        trail(i, post > 0 ? 0 : f, b3, sh.x, .3, sh.z, 1.0, 1.6 * Math.sin(Math.PI * Math.min(1, f * 1.15)), 1.4, .3, .42);
      }
      for (let k = 0; k < INSTANCED.length; k++) { const m = INSTANCED[k]; m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true; }
      // the canister's lights: loaded, then out as each one fires, then its outcome once it lands
      for (let i = 0; i < N + 2; i++) {
        const isShield = i >= N, t0 = isShield ? shields[i - N].t0 : slots[i].t0, hit = isShield ? shields[i - N].hit : slots[i].hit, kind = isShield ? 'R' : slots[i].kind;
        if (lp > hit) {
          const o = OUT[kind], g = (kind === 'X' || kind === 'N' ? .6 : 1) * (1 + decay(lp - hit, .015) * 2 + (kind === 'M' || kind === 'P' ? decay(lp - VERDICT - i * .003, .02) * 1.5 : 0));
          setRGB(lights.instanceColor, i, o[0] * g, o[1] * g, o[2] * g);
        } else if (lp > t0) { const g = decay(lp - t0, .006) * 2.5 + .05; setRGB(lights.instanceColor, i, .6 * g, .8 * g, 1 * g); }
        else { const g = (kind === 'N' ? .35 : 1) * ((1 - open) * .45 + .55 + .1 * Math.sin(t * 2.4 - i * .4) * idle); kind === 'R' ? setRGB(lights.instanceColor, i, 1.3 * g, .2 * g, .3 * g) : setRGB(lights.instanceColor, i, .5 * g, .72 * g, .98 * g); }
      }
      lights.instanceColor.needsUpdate = true;

      /* the red line: the first shield draws the right half, the second the left half and the gate */
      const r0 = expo((lp - shields[0].hit) / ARC_TIME), r1 = expo((lp - shields[1].hit) / ARC_TIME);
      sweep(arcs[0], r0); sweep(arcs[1], r1); sweep(arcs[2], r1);
      const closed = shields[1].hit + ARC_TIME * .5, cpost = lp - closed;
      const redI = 1 + redFlare * 1.6 + decay(cpost, .03) * 2.2 + .18 * Math.sin(t * 2.6) * idle;
      redMat.color.setRGB(1.9 * redI, .3 * redI, .42 * redI);
      if (cpost > 0) {
        dome.visible = true;
        field.uniforms.uI.value = 1.8 * decay(cpost, .03) + .07 * smooth(cpost / .03) + .02 * Math.sin(t * 1.8) * idle;
        field.uniforms.uRise.value = cpost < .1 ? cpost / .1 * 1.1 : -1;
        field.uniforms.uT.value = t * idle;
        const bulge = 1 + .06 * decay(cpost, .02);
        dome.scale.set(RED_R * bulge, 3.4 * expo(cpost / .035), RED_R * bulge);
      } else dome.visible = false;

      /* the dial: the fill snaps forward with every point, the needle overshoots and settles */
      const score = scoreAt(lp, easeIn), needleV = scoreAt(lp, springy);
      sweep(fillGeo, score);
      let bump = 0;
      for (let i = 0; i < N; i++) if (slots[i].pts) bump += decay(lp - slots[i].hit, .02);
      const vpost = lp - VERDICT, verdict = decay(vpost, .03);
      const fI = 1 + bump * .8 + verdict * 1.6 + .1 * Math.sin(t * 2) * idle;
      fillMat.color.setRGB(1.0 * fI, .48 * fI, .06 * fI);
      tipMat.color.setRGB(1.25 * fI, .62 * fI, .12 * fI);
      const hu = DIAL.a0 - DIAL.span * score;
      head.position.set(Math.cos(hu) * DIAL.R, Math.sin(hu) * DIAL.R, .3);
      head.scale.setScalar(score > .001 ? .5 + bump * .6 + verdict * 1.1 + .05 * Math.sin(t * 3) * idle : 0);
      needle.rotation.z = DIAL.a0 - DIAL.span * needleV;
      keyMat.emissiveIntensity = .45 + verdict * 3 + bump * .4 + (lp > VERDICT ? .25 + .12 * Math.sin(t * 1.5) * idle : 0);
      edgeMat.emissiveIntensity = .45 + verdict * 1.8 + bump * .25;
      for (let i = 0; i < TICKS; i++) {
        const fr = i / (TICKS - 1);
        if (score >= fr - 1e-4) { const pu = 1 + verdict + decay(lp - VERDICT - fr * .04, .015) * 2; setRGB(tickMesh.instanceColor, i, 1.1 * pu, .55 * pu, .08 * pu); }
        else setRGB(tickMesh.instanceColor, i, .36, .4, .5);
      }
      tickMesh.instanceColor.needsUpdate = true;
      // the verdict's shockwave across the plinth
      if (vpost > 0 && vpost < .12) {
        const sI = decay(vpost, .028) * 1.5, sS = .6 + 2.9 * expo(vpost / .07);
        shock.visible = true; shock.scale.set(sS, 1, sS); shockMat.color.setRGB(1.6 * sI, 1.0 * sI, .35 * sI);
      } else shock.visible = false;

      /* light answers the stamps: the rim takes the colour of the last impact, the pages glow */
      if (latest >= 0) { const o = OUT[latestK]; rimHot.setRGB(Math.min(1, o[0]), Math.min(1, o[1]), Math.min(1, o[2])); }
      const heat = clamp(impactGlow * .3) * (latestK === 'X' || latestK === 'N' ? .25 : 1);
      rimMat.emissive.copy(rimBase).lerp(latest >= 0 ? rimHot : rimBase, heat);
      if (redFlare > .02) rimMat.emissive.lerp(rimRed, clamp(redFlare));
      rimMat.emissiveIntensity = 1 + impactGlow * .3 + verdict * 1.4 + .12 * Math.sin(t * 1.5) * idle;
      // the judges read the pages while the checks run
      const reading = ramp(lp, .07, .11) * (1 - ramp(lp, .6, .66));
      for (let k = 0; k < 2; k++) {
        const sl = slabs[k], sweepY = (t * .5 * idle + lp * 7 + k * .37) % 1;
        sl.face.emissiveIntensity = .2 + slabPulse * .3 + verdict * .45 + reading * .05;
        sl.scan.position.y = sl.h * (.97 - sweepY * .94);
        sl.scan.material.opacity = reading * .8 * Math.sin(sweepY * Math.PI);
        sl.g.position.y = Math.min(1, slabPulse) * .015;
      }

      /* the robot waits: it watches the canister, follows each stamp, then looks up at the dial */
      bot.update(t * idle, 0);
      const cur = clamp((lp - COIN_T0 - POP) / STEP, 0, N - 1), ci = Math.floor(cur), cf = cur - ci;
      const th = lerp(slots[ci].theta, slots[Math.min(N - 1, ci + 1)].theta, smooth(cf));
      let tx = Math.sin(th) * RING_R, ty = 0, tz = Math.cos(th) * RING_R;
      const early = 1 - ramp(lp, COIN_T0 - .02, COIN_T0 + .02);
      tx = lerp(tx, 0, early); ty = lerp(ty, MOUTH.y + .3, early); tz = lerp(tz, MOUTH.z, early);
      const sw = ramp(lp, SHIELD_T0[0], SHIELD_T0[0] + .02) * (1 - ramp(lp, VERDICT - .04, VERDICT - .01));
      const sx = lerp(shields[0].x, shields[1].x, ramp(lp, SHIELD_T0[1], shields[1].hit));
      tx = lerp(tx, sx, sw); ty = lerp(ty, .3, sw); tz = lerp(tz, shields[0].z, sw);
      const up = ramp(lp, VERDICT - .04, VERDICT);
      tx = lerp(tx, -.6, up); ty = lerp(ty, DIAL.y + DIAL.R * .8, up); tz = lerp(tz, DIAL.z, up);
      let rel = Math.atan2(tx - BOT.x, tz - BOT.z) - botYaw; rel -= Math.round(rel / TAU) * TAU;
      const dist = Math.hypot(tx - BOT.x, tz - BOT.z), headY = .62 * 1.15 + .3;
      bot.head.rotation.y = clamp(rel, -1.2, 1.2) + Math.sin(t * .8) * .05 * idle;
      bot.head.rotation.x = clamp(-Math.atan2(ty - headY, dist), -.6, .45);
      const flinch = decay(lp - shields[0].hit, .012) + decay(lp - shields[1].hit, .012);
      const hop = Math.sin(Math.PI * clamp((lp - VERDICT) / .03)) * .14;
      bot.root.position.set(BOT.x - Math.sin(botYaw) * .1 * flinch, Math.abs(Math.sin(t * 2.1)) * .025 * idle + hop, BOT.z - Math.cos(botYaw) * .1 * flinch);

      ui.set('score', score.toFixed(3));
    },
  };
}

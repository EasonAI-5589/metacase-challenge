/* film-econ-kit.js — stage pieces shared by the five beats of the economics film (film-econ-*.js).
 * The economics case is drawn on a plotting table: a square slab with a fine grid and two axes,
 * where the finance film stands on a round plinth. Every beat of the case builds its set on this
 * table, so the five sets read as one place; what stands on the table is each beat's own.
 * Nothing here animates: a piece returns the materials a beat may want to drive. */

// The table top, in set coordinates: centred on (X, 0, Z), W wide (x) and D deep (z), top at y = 0.
export const TABLE = { X: .5, Z: 0, W: 8.4, D: 6.2, R: .34, CELL: .4, TOP: 0x1c2740, SKIRT: 0x111a2d, LINE: 0x35608a };

function roundedRect(THREE, w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
// A slab with rounded corners, its top face at y = 0 of the returned mesh and h thick below it.
export function slab(THREE, w, d, r, h, material) {
  const geo = new THREE.ExtrudeGeometry(roundedRect(THREE, w, d, r), { depth: h, bevelEnabled: false, curveSegments: 10 });
  geo.rotateX(Math.PI / 2); // the shape's plane becomes the ground; the extrusion runs down
  const m = new THREE.Mesh(geo, material); m.receiveShadow = true; m.castShadow = false;
  return m;
}

/* The plotting table. Returns { group, rimMat, gridMat, top } where rimMat is the glowing edge line
 * (a clone, safe to animate: emissiveIntensity) and gridMat the grid's line material (opacity). */
export function plotTable({ THREE, kit, set, accent = kit.PALETTE.teal, grid = true }) {
  const { X, Z, W, D, R, CELL, TOP, SKIRT, LINE } = TABLE;
  const group = new THREE.Group(); group.position.set(X, 0, Z); set.add(group);
  const top = slab(THREE, W, D, R, .3, kit.mat(TOP)); group.add(top);
  const skirt = slab(THREE, W + .16, D + .16, R + .08, .55, kit.mat(SKIRT)); skirt.position.y = -.3; group.add(skirt);
  // the glowing edge: one closed line a little inside the rim
  const rimMat = kit.glowMat(accent, 1.1).clone();
  const pts = roundedRect(THREE, W - .1, D - .1, R - .04).getPoints(12).map(p => new THREE.Vector3(p.x, 0, p.y));
  const rim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', .02), 220, .028, 6, true), rimMat);
  rim.position.y = .006; group.add(rim);
  // the grid: fine lines every CELL, a brighter one every fifth
  const gridMat = new THREE.LineBasicMaterial({ color: LINE, transparent: true, opacity: .42, depthWrite: false });
  if (grid) {
    const fine = [], bold = [], hw = W / 2 - .3, hd = D / 2 - .3;
    const nx = Math.floor(hw / CELL), nz = Math.floor(hd / CELL);
    for (let i = -nx; i <= nx; i++) (i % 5 === 0 ? bold : fine).push(i * CELL, 0, -hd, i * CELL, 0, hd);
    for (let j = -nz; j <= nz; j++) (j % 5 === 0 ? bold : fine).push(-hw, 0, j * CELL, hw, 0, j * CELL);
    const lines = (list, material) => {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(list, 3));
      const l = new THREE.LineSegments(g, material); l.position.y = .004; l.frustumCulled = false; group.add(l); return l;
    };
    lines(fine, gridMat);
    const boldMat = gridMat.clone(); boldMat.opacity = .8; lines(bold, boldMat);
  }
  return { group, rimMat, gridMat, top };
}

/* An axis lying on the table: a glowing rod of length len along +x from the group's origin, with an
 * arrowhead and n evenly spaced ticks. Rotate the returned group to point it elsewhere (y is up:
 * rotation.z = Math.PI / 2 stands it upright). Returns { group, mat } (mat is a clone). */
export function axis({ THREE, kit, len = 3, ticks = 6, color = 0x9fd8ff, r = .022 }) {
  const group = new THREE.Group(), mat = kit.glowMat(color, 1.2).clone();
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), mat); rod.rotation.z = -Math.PI / 2; rod.position.x = len / 2; group.add(rod);
  const head = new THREE.Mesh(new THREE.ConeGeometry(r * 3.2, r * 9, 10), mat); head.rotation.z = -Math.PI / 2; head.position.x = len + r * 4; group.add(head);
  for (let i = 1; i <= ticks; i++) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(r * 1.4, r * 6, r * 1.4), mat); t.position.set(len * i / (ticks + 1), 0, 0); group.add(t);
  }
  return { group, mat };
}

/* A small standing plate with printed text, for a number or a name on the table: a dark plate with
 * a glowing frame and a label on its front (+z). w × h in world units; lines as kit.labelTexture
 * takes them. Returns { group, frameMat, label } (label is the textured plane; its material is
 * transparent, so its opacity can fade the text). */
export function plate({ THREE, kit, key, lines, w = 1.1, h = .5, color = kit.PALETTE.teal, texWidth = 512, texHeight = 256 }) {
  const group = new THREE.Group();
  const back = new THREE.Mesh(kit.rbox(w, h, .05, .02), kit.mat(0x0d1524)); back.position.y = h / 2; group.add(back);
  const frameMat = kit.glowMat(color, 1.1).clone();
  const frame = new THREE.Mesh(kit.rbox(w + .05, h + .05, .03, .012), frameMat); frame.position.set(0, h / 2, -.012); group.add(frame);
  const tex = kit.labelTexture(key, lines, { width: texWidth, height: texHeight });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(w * .94, h * .9), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  label.position.set(0, h / 2, .027); group.add(label);
  return { group, frameMat, label };
}

/* ---- small helpers the economics beats share (pure functions and simple props) ---- */
export const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
export const sm = x => x * x * (3 - 2 * x);
export const mix = (a, b, k) => a + (b - a) * k;
export const outCubic = x => 1 - (1 - x) * (1 - x) * (1 - x);
export const outBack = (x, s = 1.6) => { const u = x - 1; return 1 + (s + 1) * u * u * u + s * u * u; };
// a hit at `at`: rises over `rise`, then decays with time constant `fall` (all in lp)
export const pulse = (x, at, rise, fall) => (x < at ? 0 : x < at + rise ? sm((x - at) / rise) : Math.exp(-(x - at - rise) / fall));
// 1 between b and c, ramping up over a..b and down over c..d
export const window01 = (x, a, b, c, d) => lin(x, a, b) * (1 - lin(x, c, d));
const turnTo = (a, b, k) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return a + d * k; };

/* The robot's walk as a pure function of lp. keys: [[lp, x, z, yaw], ...] in order; between two keys
 * at different places it walks (easing in and out, turning into the direction of travel and out of
 * it again), between two keys at the same place it stands and turns from one yaw to the other.
 * yaw is the heading at rest (0 faces +z, the camera; Math.PI / 2 faces +x).
 * Returns at(lp, out) -> out = { x, z, yaw, walking } with walking 0..1 for robot.update(t, walking). */
export function walker(keys) {
  return function at(lp, out) {
    let i = 0;
    while (i < keys.length - 2 && lp > keys[i + 1][0]) i++;
    const a = keys[i], b = keys[i + 1], u = lin(lp, a[0], b[0]), e = sm(u);
    const dx = b[1] - a[1], dz = b[2] - a[2], far = Math.hypot(dx, dz);
    out.x = a[1] + dx * e; out.z = a[2] + dz * e;
    if (far < .02) { out.yaw = turnTo(a[3], b[3], e); out.walking = 0; return out; }
    const travel = Math.atan2(dx, dz), into = sm(lin(u, 0, .18)), outOf = sm(lin(u, .8, 1));
    out.yaw = turnTo(turnTo(a[3], travel, into), b[3], outOf);
    out.walking = Math.min(1, Math.sin(Math.PI * u) * 2.2);
    return out;
  };
}

/* Printed text on a plane (transparent, not depth-written): lines as kit.labelTexture takes them,
 * the texture's aspect from w × h. Returns the mesh; its material's opacity fades the text. */
export function printed({ THREE, kit, parent, key, lines, w, h, x = 0, y = 0, z = 0, px = 512 }) {
  const tex = kit.labelTexture(`film-econ:${key}`, lines, { width: px, height: Math.max(16, Math.round(px * h / w)) });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.position.set(x, y, z); m.renderOrder = 2; if (parent) parent.add(m);
  return m;
}

/* A beam of light between two points: beam() makes it (hidden); beam.userData.stretch(a, b, r) lays
 * it from a to b with radius r. Additive, so its material's opacity is its brightness. */
export function beam({ THREE, parent, color = 0xffe2a8 }) {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.visible = false; m.frustumCulled = false; parent.add(m);
  const up = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3();
  m.userData.stretch = (a, b, r) => {
    dir.copy(b).sub(a);
    const len = dir.length();
    if (len < 1e-4) { m.visible = false; return; }
    m.position.copy(a).addScaledVector(dir, .5);
    m.quaternion.setFromUnitVectors(up, dir.divideScalar(len));
    m.scale.set(r, len, r); m.visible = true;
  };
  return m;
}

/* A tick or a cross, about `size` across, drawn with two strokes in the x–y plane.
 * Returns the group (scale it from .001 to 1 to stamp it in). */
export function mark({ THREE, kit, kind = 'tick', material, size = .3 }) {
  const g = new THREE.Group(), t = size * .16;
  const stroke = (len, x, y, rot) => { const m = new THREE.Mesh(kit.rbox(len, t, t * .6, t * .25), material); m.position.set(x, y, 0); m.rotation.z = rot; g.add(m); };
  if (kind === 'tick') { stroke(size * .42, -size * .2, -size * .08, -.85); stroke(size * .8, size * .14, size * .06, .9); }
  else { stroke(size, 0, 0, Math.PI / 4); stroke(size, 0, 0, -Math.PI / 4); }
  return g;
}

/* Write a camera pose into one of the two poses a beat returns (camera.from or camera.to). In a
 * narrow window (portrait: the copy sits below the picture) the table is wider than the frame, so
 * the camera backs away from its look target by up to `back` of the distance and its field of view
 * opens by up to `widen` degrees (backing off alone would take the table into the fog). */
export function aim(pose, pos, look, fov, aspect, back = .3, widen = 14) {
  const narrow = Math.min(1, Math.max(0, (1.1 - aspect) / .4)), k = 1 + back * narrow;
  for (let c = 0; c < 3; c++) { pose.look[c] = look[c]; pose.pos[c] = look[c] + (pos[c] - look[c]) * k; }
  pose.fov = fov + widen * narrow;
  return pose;
}

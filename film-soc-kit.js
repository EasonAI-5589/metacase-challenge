/* film-soc-kit.js — stage pieces shared by the five beats of the society film (film-soc-*.js).
 * The society case is about people and the places they work in, so it is drawn in a yard: a paved
 * ground with lamp posts, small hub buildings, crowds of supervisors and the three work packages
 * as crates, where the finance film stands on a round plinth. Every beat of the case builds its set
 * on this yard, so the five sets read as one place; what happens in the yard is each beat's own.
 * Nothing here animates by itself: a piece returns what a beat may want to drive.
 * All people, hubs and amounts of this case are synthetic. */

import { mergeGeometries } from './assets/vendor/three/BufferGeometryUtils.js';

// The yard, in set coordinates: centred on (X, 0, Z), W wide (x) and D deep (z), top at y = 0.
export const YARD = { X: .5, Z: 0, W: 8.6, D: 6.2, R: 1.1, TOP: 0x222b3d, SKIRT: 0x131b2c, JOINT: 0x3a4660, LAMP: 0xffc978 };
// Status colours used across the case: verified, pending (also estimated, awaiting approval), disputed.
export const STATUS = { verified: 0x3f9d6a, pending: 0xf2b545, disputed: 0xe2667a, neutral: 0x9aa3b2 };

function roundedRect(THREE, w, d, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + d - r); s.absarc(x + w - r, y + d - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + d); s.absarc(x + r, y + d - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
export function slab(THREE, w, d, r, h, material) {
  const geo = new THREE.ExtrudeGeometry(roundedRect(THREE, w, d, r), { depth: h, bevelEnabled: false, curveSegments: 14 });
  geo.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(geo, material); m.receiveShadow = true; m.castShadow = false;
  return m;
}

/* The yard. Returns { group, rimMat, lampMats } — rimMat is the glowing kerb line (a clone, safe to
 * animate), lampMats the four lamp bulbs' materials (clones). Paving joints are drawn as a brick
 * bond; lamps: false leaves the posts out (a beat whose camera sits low may want that). */
export function yard({ THREE, kit, set, accent = kit.PALETTE.amber, lamps = true }) {
  const { X, Z, W, D, R, TOP, SKIRT, JOINT, LAMP } = YARD;
  const group = new THREE.Group(); group.position.set(X, 0, Z); set.add(group);
  group.add(slab(THREE, W, D, R, .3, kit.mat(TOP)));
  const skirt = slab(THREE, W + .18, D + .18, R + .09, .55, kit.mat(SKIRT)); skirt.position.y = -.3; group.add(skirt);
  const rimMat = kit.glowMat(accent, 1.0).clone();
  const pts = roundedRect(THREE, W - .12, D - .12, R - .05).getPoints(14).map(p => new THREE.Vector3(p.x, 0, p.y));
  const rim = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', .02), 240, .028, 6, true), rimMat);
  rim.position.y = .006; group.add(rim);
  // paving: long joints across, short joints staggered row by row
  const list = [], hw = W / 2 - .5, hd = D / 2 - .5, row = .62, brick = 1.24;
  const inside = (x, z) => { const dx = Math.max(0, Math.abs(x) - (W / 2 - R)), dz = Math.max(0, Math.abs(z) - (D / 2 - R)); return dx * dx + dz * dz < (R - .25) * (R - .25); };
  for (let j = 0, z = -hd; z <= hd + 1e-6; z += row, j++) {
    list.push(-hw, 0, z, hw, 0, z);
    if (z + row > hd + 1e-6) break;
    for (let x = -hw + (j % 2 ? brick / 2 : 0); x <= hw; x += brick) if (inside(x, z) && inside(x, z + row)) list.push(x, 0, z, x, 0, z + row);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(list, 3));
  const joints = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: JOINT, transparent: true, opacity: .5, depthWrite: false }));
  joints.position.y = .004; joints.frustumCulled = false; group.add(joints);
  const lampMats = [];
  if (lamps) {
    for (const [sx, sz] of [[-1, -1], [1, -1]]) {
      const post = new THREE.Group(); post.position.set(sx * (W / 2 - .55), 0, sz * (D / 2 - .55)); group.add(post);
      kit.cyl(post, .035, .05, 1.7, 0x394560, 0, .85, 0, 10);
      kit.cyl(post, .12, .12, .05, 0x394560, 0, 1.72, 0, 12);
      const m = kit.glowMat(LAMP, 1.6).clone(); lampMats.push(m);
      kit.ball(post, .1, m, 0, 1.62, 0, 12).castShadow = false;
    }
  }
  return { group, rimMat, lampMats };
}

/* A crowd of supervisors as instanced pawns: a body, a round head and a hard hat each. One crowd is
 * three draw calls whatever its size, so 83 people cost nothing; use kit.person() only for the one
 * or two figures a shot is about.
 *   const c = crowd({ THREE, kit, n: 83 }); set.add(c.group);
 *   c.place(i, x, z, { y = 0, ry = 0, s = 1 });  c.tint(i, hex)  (the body);  c.hat(i, hex);  c.commit();
 * Call commit() once per frame after the placements. A pawn stands .52 tall at s = 1. */
export function crowd({ THREE, kit, n, body = 0x4a7fd4, hat = kit.PALETTE.amber, skin = 0xf0c9a0 }) {
  const group = new THREE.Group();
  const bodyGeo = new THREE.CapsuleGeometry(.1, .16, 4, 10); bodyGeo.translate(0, .18, 0);
  const headGeo = new THREE.SphereGeometry(.105, 14, 10); headGeo.translate(0, .41, 0);
  const hatGeo = new THREE.SphereGeometry(.115, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2); hatGeo.translate(0, .435, 0);
  const make = (geo, color) => {
    const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .78 }), n);
    m.castShadow = true; m.frustumCulled = false; group.add(m);
    const c = new THREE.Color(color); for (let i = 0; i < n; i++) m.setColorAt(i, c);
    return m;
  };
  const bodies = make(bodyGeo, body), heads = make(headGeo, skin), hats = make(hatGeo, hat);
  const o = new THREE.Object3D(), col = new THREE.Color();
  return {
    group, n,
    place(i, x, z, { y = 0, ry = 0, s = 1 } = {}) {
      o.position.set(x, y, z); o.rotation.set(0, ry, 0); o.scale.setScalar(s); o.updateMatrix();
      bodies.setMatrixAt(i, o.matrix); heads.setMatrixAt(i, o.matrix); hats.setMatrixAt(i, o.matrix);
    },
    tint(i, hex) { bodies.setColorAt(i, col.setHex(hex)); },
    hat(i, hex) { hats.setColorAt(i, col.setHex(hex)); },
    commit() {
      for (const m of [bodies, heads, hats]) { m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    },
  };
}

/* A hub: a small warehouse with a roller door, a coloured roof band and its name over the door.
 * About 1.3 wide, .95 tall, 1 deep; front faces +z. deferred: true draws the reference hub (the one
 * not yet trained) with a dashed look: grey roof band and a dimmer sign.
 * Returns { group, bandMat, signMat } (clones, safe to animate). */
export function hub({ THREE, kit, name = 'HUB-01', color = kit.PALETTE.teal, deferred = false }) {
  const group = new THREE.Group(), P = kit.PALETTE;
  kit.block(group, 1.3, .7, 1, P.wall, 0, 0, 0, .05);
  const bandMat = kit.mat(deferred ? P.slate : color, { emissive: deferred ? 0 : color, intensity: deferred ? 0 : .35 }).clone();
  kit.block(group, 1.38, .16, 1.08, bandMat, 0, .7, 0, .05);
  kit.block(group, 1.2, .08, .9, 0x2f3a56, 0, .86, 0, .03);
  kit.block(group, .5, .44, .04, 0x334061, -.22, 0, .5, .02).castShadow = false;       // roller door
  for (let i = 0; i < 4; i++) kit.block(group, .5, .012, .045, 0x4a5a80, -.22, .08 + i * .1, .5, .004).castShadow = false;
  kit.block(group, .2, .2, .04, P.window, .36, .3, .5, .02).castShadow = false;       // window
  const tex = kit.labelTexture(`soc-hub:${name}:${deferred ? 1 : 0}`, [{ text: name, size: 150, weight: 800, color: deferred ? '#c8cfdb' : '#ffffff', font: 'ui-monospace, SFMono-Regular, Menlo, monospace', track: 6 }], { width: 1024, height: 256 });
  const signMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, opacity: deferred ? .7 : 1 });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(.9, .225), signMat); sign.position.set(0, .78, .546); group.add(sign);
  return { group, bandMat, signMat };
}

/* A work package: a crate cut into `units` equal segments (A is one, B four, C two), strapped
 * together, with its letter on the front of the first segment. Each segment is its own mesh with
 * its own material, so a beat can light, grey out or lift the units one by one.
 * Returns { group, segments: [{ mesh, mat }], width, strap, tag, unitW, gap }: to pull the units apart,
 * move each segment's mesh along x (and hide the strap). The crate stands on y = 0, front faces +z. */
export function crate({ THREE, kit, letter = 'A', units = 1, color = 0xc79a5b, unitW = .42, h = .5, d = .52 }) {
  const group = new THREE.Group(), gap = .035, width = units * unitW + (units - 1) * gap, segments = [];
  for (let i = 0; i < units; i++) {
    const m = kit.mat(color).clone();
    const mesh = kit.block(group, unitW, h, d, m, -width / 2 + unitW / 2 + i * (unitW + gap), 0, 0, .04);
    segments.push({ mesh, mat: m });
  }
  const strap = kit.block(group, width + .03, .05, d + .03, 0x6b4a2a, 0, h * .5 - .025, 0, .012); strap.castShadow = false;
  const tex = kit.labelTexture(`soc-crate:${letter}`, [{ text: letter, size: 190, weight: 800, color: '#2a2118' }], { width: 256, height: 256 });
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(.26, .26), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  tag.position.set(-width / 2 + unitW / 2, h * .76, d / 2 + .004); group.add(tag);
  return { group, segments, width, strap, tag, unitW, gap };
}

/* ---- small tools the beats share ---- */
export const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
export const sm = x => { const p = Math.min(1, Math.max(0, x)); return p * p * (3 - 2 * p); };
export const ease = (x, a, b) => sm(lin(x, a, b));
export const mix = (a, b, k) => a + (b - a) * k;
export const backOut = (x, s = 1.9) => { const p = Math.min(1, Math.max(0, x)) - 1; return 1 + (s + 1) * p * p * p + s * p * p; };
// 1 at the moment a, fading over w; 0 before it
export const hit = (x, a, w) => { const u = (x - a) / w; return u < 0 || u >= 1 ? 0 : (1 - u) * (1 - u); };

/* A sign: a dark plate with a glowing frame and printed text on its front (+z), optionally on a
 * post (post = the height of the plate's lower edge). w × h in world units; lines as
 * kit.labelTexture takes them, drawn on a canvas px wide. Returns { group, board, frameMat,
 * labelMat, redraw(lines) } — board is the plate without the post (scale or hinge it), labelMat is
 * transparent (fade the text with its opacity), redraw prints new lines on the same texture. */
export function sign({ THREE, kit, key, lines, w = 1, h = .42, color = kit.PALETTE.amber, post = 0, px = 512, dark = 0x0d1524 }) {
  const group = new THREE.Group(), board = new THREE.Group(); board.position.y = post; group.add(board);
  if (post > 0) kit.cyl(group, .022, .028, post, 0x394560, 0, post / 2, 0, 8);
  const back = new THREE.Mesh(kit.rbox(w, h, .05, .02), kit.mat(dark)); back.position.y = h / 2; back.castShadow = true; board.add(back);
  const frameMat = kit.glowMat(color, 1).clone();
  const frame = new THREE.Mesh(kit.rbox(w + .05, h + .05, .03, .012), frameMat); frame.position.set(0, h / 2, -.012); board.add(frame);
  const tex = kit.labelTexture(`soc-sign:${key}`, lines, { width: px, height: Math.round(px * h / w) });
  const labelMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(w * .94, h * .9), labelMat); label.position.set(0, h / 2, .028); board.add(label);
  return { group, board, frameMat, labelMat, redraw: l => tex.userData.redraw(l) };
}

/* A pen: a low fence round a w × d rectangle centred on the group's origin, as one mesh. gate is
 * the width of an opening in the middle of the side named by gateSide (-1 the back, -z; 1 the
 * front, +z). Returns { group, mat } (mat is a clone: its emissiveIntensity can pulse). */
export function pen({ THREE, kit, w = 1.6, d = 1.1, h = .26, color = STATUS.verified, gate = 0, gateSide = -1 }) {
  const geos = [], box = (bw, bh, bd, x, y, z) => { const g = new THREE.BoxGeometry(bw, bh, bd); g.translate(x, y, z); geos.push(g); };
  const nx = Math.max(2, Math.round(w / .4)), nz = Math.max(2, Math.round(d / .4));
  for (let i = 0; i <= nx; i++) for (const sz of [-1, 1]) {
    const x = -w / 2 + w * i / nx;
    if (gate && sz === gateSide && Math.abs(x) < gate / 2 - 1e-3) continue;
    box(.05, h, .05, x, h / 2, sz * d / 2);
  }
  for (let j = 1; j < nz; j++) for (const sx of [-1, 1]) box(.05, h, .05, sx * w / 2, h / 2, -d / 2 + d * j / nz);
  for (const y of [h * .5, h * .92]) {
    for (const sz of [-1, 1]) {
      if (gate && sz === gateSide) { const seg = (w - gate) / 2; for (const s of [-1, 1]) box(seg, .028, .028, s * (gate / 2 + seg / 2), y, sz * d / 2); }
      else box(w, .028, .028, 0, y, sz * d / 2);
    }
    for (const sx of [-1, 1]) box(.028, .028, d, sx * w / 2, y, 0);
  }
  const mat = kit.mat(color, { emissive: color, intensity: .55 }).clone();
  const mesh = new THREE.Mesh(mergeGeometries(geos), mat); mesh.castShadow = true;
  geos.forEach(g => g.dispose());
  const group = new THREE.Group(); group.add(mesh);
  return { group, mat };
}

/* A camera line through keys [{ at, pos: [x, y, z], look: [x, y, z], fov }] (set coordinates, at in
 * local progress, ascending). write(lp, cam, dx = 0, back = 1) fills cam.from and cam.to with the
 * pose at lp, eased between neighbouring keys; dx moves the look target (and the camera) along x,
 * back > 1 stands further away along the view line. A beat returns cam as its camera and calls
 * write every frame, as the finance film's beats do. */
export function cameraLine(keys) {
  const p = [0, 0, 0], l = [0, 0, 0];
  return function write(lp, cam, dx = 0, back = 1) {
    let i = 0;
    while (i < keys.length - 2 && lp > keys[i + 1].at) i++;
    const a = keys[i], b = keys[Math.min(i + 1, keys.length - 1)], k = sm(lin(lp, a.at, b.at === a.at ? a.at + 1 : b.at));
    for (let c = 0; c < 3; c++) { p[c] = mix(a.pos[c], b.pos[c], k); l[c] = mix(a.look[c], b.look[c], k); }
    l[0] += dx; p[0] += dx;
    for (let c = 0; c < 3; c++) {
      const v = l[c] + (p[c] - l[c]) * back;
      cam.from.pos[c] = cam.to.pos[c] = v; cam.from.look[c] = cam.to.look[c] = l[c];
    }
    cam.from.fov = cam.to.fov = mix(a.fov ?? 34, b.fov ?? 34, k);
  };
}

/* Where a walker is on a path of keys [[lp, x, z], ...]: fills out = { x, z, ry, walk } — ry is the
 * heading while it moves (unchanged while it stands, so set it yourself for a stand), walk is 0..1
 * (0 standing, 1 in mid-stride between two different points). */
export function pathAt(keys, lp, out) {
  let i = 0;
  while (i < keys.length - 2 && lp > keys[i + 1][0]) i++;
  const a = keys[i], b = keys[i + 1], u = lin(lp, a[0], b[0]), k = sm(u);
  out.x = mix(a[1], b[1], k); out.z = mix(a[2], b[2], k);
  const moving = (a[1] !== b[1] || a[2] !== b[2]) && u > 0 && u < 1;
  out.walk = moving ? Math.min(1, Math.sin(u * Math.PI) * 1.6) : 0;
  if (moving) out.ry = Math.atan2(b[1] - a[1], b[2] - a[2]);
  return out;
}

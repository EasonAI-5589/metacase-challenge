/* film-soc-task.js — beat 0 of the society Metacase film (HR-T3-114): Context & evidence.
 * The intake yard. Four hubs stand at the back with the supervisors in front of the three trained
 * ones. A clerk wheels a cart in from the right and the task's 17 source files hop off it into three
 * racks by kind (4 documents, 5 workbooks, 8 detail files); the empty cart is wheeled out again; six plates drop from the gantry over
 * the racks with what the files hold. Three crates land in front, the work packages A, B and C,
 * each with its amount, B in four units and C in two. A scanner then runs along the gantry under
 * the settlement rule: a file that was only uploaded keeps its amber lamp, and the payment lever
 * the clerk tries is locked. Last, a fence rises round the detail files (personal learning data)
 * and two boards say what the data may and may never be used for.
 * Every state is a function of lp, so scrubbing backwards replays it; t only adds idle life.
 *   lp .00–.31  the cart comes in and goes; the files hop into their racks (17 by .26); the six plates drop
 *      .27–.47  the crates land (A .29, B .335, C .38), their amounts tip up, the units flash
 *      .47–.52  the plates lift away
 *      .535–.64 the rule comes down on the gantry; the scanner crosses; four lamps stay amber
 *      .55–.66  the clerk comes back in to the payment lever and pulls: locked
 *      .66–.80  the fence rises round the detail files; the two boards drop
 *      .80–1    held; the framework dollies on to the next set
 * All entities, people and amounts of this case are synthetic. */
import { yard, crowd, hub, crate, sign, pen, cameraLine, pathAt, STATUS, lin, sm, ease, mix, backOut, hit } from './film-soc-kit.js?v=mc-1c165fc3e2';

// the three racks, in the order the cart passes them; n files each (17 in all)
const TYPES = [
  { key: 'DOCX', name: '4 documents', n: 4, color: 0xe9edf5, x: -.19 },
  { key: 'XLSX', name: '5 workbooks', n: 5, color: 0x7d6ad8, x: .86 },
  { key: 'CSV', name: '8 detail files', n: 8, color: 0x6aa8e8, x: 2.2 },
];
const N = 17;
// what the files hold, as the copy lists it
const HOLD = [['4,940', 'responses'], ['755', 'attendance events'], ['341', 'opportunity records'], ['1,145', 'observations'], ['720', 'tickets'], ['96', 'hub-weeks']];
// the packages: letter, units, amount, x of the crate
const PACKS = [
  { letter: 'A', units: 1, amount: '244,800', sub: 'yuan', x: -.05, at: .29 },
  { letter: 'B', units: 4, amount: '367,200', sub: 'yuan · 4 units', x: 1.12, at: .335 },
  { letter: 'C', units: 2, amount: '204,000', sub: 'yuan · 2 units', x: 2.6, at: .38 },
];
// files whose lamp stays amber under the scanner: uploaded, not reviewed (an illustration of the rule)
const PENDING = new Set([2, 5, 12, 15]);

const RZ = -.15, GZ = -.38, BEAM_Y = 1.7, CART_Z = .82, CRATE_Z = 1.75;
const CART_IN = 4.7, CART_TURN = .75, CART_T = .17, CART_OUT = [.262, .31], FLY = .032;
const PLATE_A = .06, PLATE_STEP = .034, PLATES_OUT = [.47, .515];
const RULE_AT = .535, SCAN_A = .548, SCAN_B = .628;
const PULL = .632, FENCE_A = .66, GREEN_AT = .70, RED_AT = .735;

export async function build({ THREE, kit, set, labelTexture, reduce, hand, util, layout, camera: viewCamera }) {
  const { PALETTE, add, block, cyl, ball, rbox, mat, glowMat } = kit;
  const ctx = { THREE, kit };
  const additive = (color, opacity = 0) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  /* ---- the yard, the hubs at the back and the supervisors in front of the trained ones ---- */
  const ground = yard({ THREE, kit, set, accent: PALETTE.teal });
  const HUBS = [
    { name: 'HUB-01', color: PALETTE.teal, x: -.8 }, { name: 'HUB-02', color: PALETTE.sky, x: .7 },
    { name: 'HUB-03', color: PALETTE.violet, x: 2.2 }, { name: 'HUB-04', color: 0, x: 3.7, deferred: true },
  ].map(h => { const g = hub({ ...ctx, name: h.name, color: h.color, deferred: !!h.deferred }); g.group.position.set(h.x, 0, -2.3); set.add(g.group); return { ...h, ...g }; });
  const people = crowd({ ...ctx, n: 83 }); set.add(people.group);
  const spots = [];
  for (let i = 0; i < 83; i++) {
    const g = Math.min(2, Math.floor(i / 28)), j = i - g * 28, col = j % 7, row = Math.floor(j / 7);
    spots.push({ x: HUBS[g].x - .66 + col * .22 + (row % 2) * .05, z: -1.62 + row * .2, ph: hash(i) * 6.28 });
  }

  /* ---- the racks: a base, a back panel and a name over each; the files stand on the base ---- */
  const bayMats = TYPES.map(ty => {
    const w = ty.n * .15 + .22, m = mat(0x26324c, { emissive: ty.color, intensity: 0 }).clone();
    block(set, w, .1, .42, m, ty.x, 0, RZ, .03);
    block(set, w, .5, .04, 0x1a2338, ty.x, .1, RZ - .19, .015);
    const tex = labelTexture(`film-soc-task-bay-${ty.key}`, [{ text: ty.name, size: 54, weight: 700, color: '#dfe6f5', track: 1 }], { width: 512, height: 80 });
    const name = new THREE.Mesh(new THREE.PlaneGeometry(.96, .15), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
    name.position.set(ty.x, .05, RZ + .3); name.rotation.x = -Math.PI / 2 + .5; set.add(name);
    return m;
  });
  const fileGeo = rbox(.11, .32, .24, .025);
  const files = new THREE.InstancedMesh(fileGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7 }), N);
  files.castShadow = true; files.frustumCulled = false; set.add(files);
  const lamps = new THREE.InstancedMesh(new THREE.SphereGeometry(.042, 12, 9), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N);
  lamps.frustumCulled = false; set.add(lamps);

  /* ---- the cart and the clerk who pushes it ---- */
  const cart = new THREE.Group(); set.add(cart);
  block(cart, 1.45, .07, .52, 0x394560, 0, .16, 0, .025);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = cyl(cart, .08, .08, .05, PALETTE.ink, sx * .52, .08, sz * .22, 14); w.rotation.x = Math.PI / 2; }
  for (const sz of [-1, 1]) cyl(cart, .018, .018, .5, 0x9aa3b2, -.74, .45, sz * .2, 6);
  { const bar = cyl(cart, .022, .022, .44, PALETTE.amber, -.74, .7, 0, 6); bar.rotation.x = Math.PI / 2; }
  const clerk = kit.person(3, { hardHat: true }); clerk.root.scale.setScalar(.62); set.add(clerk.root);
  const cartEase = u => u + .45 * (sm(u) - u);
  // the cart comes in from the right, stops by the last rack, and is wheeled out again once it is empty
  const cartX = lp => (lp < CART_OUT[0] ? mix(CART_IN, CART_TURN, cartEase(lin(lp, 0, CART_T))) : mix(CART_TURN, CART_IN + 1, sm(lin(lp, CART_OUT[0], CART_OUT[1]))));
  const reach = x => { for (let i = 0; i <= 2000; i++) { const lp = i / 2000 * CART_T; if (cartX(lp) <= x) return lp; } return CART_T; };
  // every file: its rack slot, its seat on the cart, when it leaves and when it lands
  const F = [];
  TYPES.forEach((ty, k) => {
    const first = reach(ty.x + .75), step = k === 2 ? .0068 : .009;
    for (let j = 0; j < ty.n; j++) {
      const i = F.length, dep = first + j * step;
      F.push({ k, slot: new THREE.Vector3(ty.x + (j - (ty.n - 1) / 2) * .15, .26, RZ), seat: new THREE.Vector3(-.5 + Math.floor(i / 2) * .135, .39, i % 2 ? .13 : -.13), dep, land: dep + FLY, from: cartX(dep), lift: .75 + hash(i + 3) * .3 });
    }
  });
  F.forEach((f, i) => files.setColorAt(i, new THREE.Color(TYPES[f.k].color)));
  const clerkPath = [[.55, 5.2, 1.62], [.612, 3.8, 1.62], [1, 3.8, 1.62]];
  const walker = { x: 0, z: 0, ry: Math.PI / 2, walk: 0 };

  /* ---- the gantry over the racks: six plates, the rule, the scanner, and later the two boards ---- */
  for (const x of [-.92, 3.22]) cyl(set, .05, .06, BEAM_Y, 0x394560, x, BEAM_Y / 2, GZ, 10);
  block(set, 4.3, .09, .13, 0x33405c, 1.15, BEAM_Y - .045, GZ, .03);
  const hang = (s, x, h, drop = 0) => { const holder = new THREE.Group(); holder.position.set(x, BEAM_Y - .05, GZ + .02); s.group.position.y = -h - .05 - drop; holder.add(s.group); set.add(holder); holder.visible = false; return holder; };
  const plates = HOLD.map(([n, word], i) => {
    const s = sign({ ...ctx, key: `task-hold-${i}`, w: 1.08, h: .44, color: PALETTE.teal, px: 640, lines: [{ text: n, size: 124, weight: 800, color: '#ffffff' }, { text: word, size: 52, weight: 600, color: '#9fdcd8' }] });
    return { s, holder: hang(s, 0 + (i % 3) * 1.15, .44, i < 3 ? 0 : .5), at: PLATE_A + i * PLATE_STEP };
  });
  const rule = sign({ ...ctx, key: 'task-rule', w: 2.5, h: .54, color: PALETTE.amber, px: 1024, lines: [{ text: 'SETTLEMENT RULES v1.1', size: 50, weight: 700, color: '#f2c96a', track: 5 }, { text: 'uploaded ≠ reviewed', size: 104, weight: 800, color: '#ffffff' }] });
  rule.group.position.set(1.15, BEAM_Y + .02, GZ); rule.group.visible = false; set.add(rule.group);
  const scanner = new THREE.Group(); scanner.visible = false; set.add(scanner);
  block(scanner, .34, .13, .24, 0x1a2338, 0, -.13, 0, .04);
  const scanLamp = glowMat(0xd8ffe6, 2).clone(); ball(scanner, .05, scanLamp, 0, -.15, .13, 10);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.3, 1.25, 20, 1, true), additive(0xbfffd8, 0)); cone.position.set(0, -.76, .1); scanner.add(cone);
  const upTex = labelTexture('film-soc-task-uploaded', [{ text: 'uploaded', size: 72, weight: 800, color: '#ffd27a' }], { width: 320, height: 96 });
  const upTags = [...PENDING].map(i => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.52, .156), new THREE.MeshBasicMaterial({ map: upTex, transparent: true, toneMapped: false, depthWrite: false }));
    m.position.set(F[i].slot.x, .6 + (i % 2) * .17, RZ + .14); m.visible = false; m.renderOrder = 3; set.add(m);
    return { m, i };
  });
  const boards = [
    { at: GREEN_AT, x: 1.65, color: STATUS.verified, head: 'USE FOR', ink: '#8fe6b4', words: ['evaluation', 'coaching', 'acceptance'], size: 76 },
    { at: RED_AT, x: 2.75, color: STATUS.disputed, head: 'NEVER FOR', ink: '#ff9aa8', words: ['discipline', 'reassignment', 'pay cut', 'dismissal'], size: 62 },
  ].map((b, i) => {
    const s = sign({ ...ctx, key: `task-use-${i}`, w: 1.04, h: .9, color: b.color, px: 560, lines: [{ text: b.head, size: 46, weight: 800, color: b.ink, track: 5 }, ...b.words.map(text => ({ text, size: b.size, weight: 700, color: '#ffffff' }))] });
    return { ...b, s, holder: hang(s, b.x, .9) };
  });
  const fence = pen({ ...ctx, w: 1.66, d: .86, h: .3, color: PALETTE.teal, gate: .5, gateSide: 1 });
  fence.group.position.set(TYPES[2].x, 0, RZ - .02); fence.group.visible = false; set.add(fence.group);

  /* ---- the packages: crates that land in front, each with its amount on a tipped placard ---- */
  const packs = PACKS.map((p, i) => {
    const c = crate({ ...ctx, letter: p.letter, units: p.units, unitW: .36 }); c.group.position.set(p.x, 0, CRATE_Z); c.group.visible = false; set.add(c.group);
    c.segments.forEach(sg => { sg.mat.emissive.setHex(PALETTE.amber); sg.mat.emissiveIntensity = 0; });
    const w = [.8, 1.3, 1.1][i];
    const s = sign({ ...ctx, key: `task-pack-${p.letter}`, w, h: .44, color: PALETTE.amber, px: 640, lines: [{ text: p.amount, size: [150, 120, 130][i], weight: 800, color: '#ffffff' }, { text: p.sub, size: [50, 46, 46][i], weight: 600, color: '#f2c96a' }] });
    s.group.position.set(p.x, .02, CRATE_Z + .62); s.group.rotation.x = -.95; s.group.visible = false; set.add(s.group);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1, .02, 6, 64), additive(PALETTE.amber, 0)); ring.rotation.x = Math.PI / 2; ring.position.set(p.x, .03, CRATE_Z); ring.visible = false; set.add(ring);
    return { ...p, c, s, ring };
  });

  /* ---- the payment lever: a box, an arm, a padlock and its sign ---- */
  const LX = 3.35, LZ = 1.62;
  block(set, .3, .34, .3, 0x26324c, LX, 0, LZ, .05);
  const arm = new THREE.Group(); arm.position.set(LX, .34, LZ); set.add(arm);
  cyl(arm, .022, .022, .46, 0x9aa3b2, 0, .23, 0, 8); ball(arm, .055, glowMat(PALETTE.amber, 1.2), 0, .48, 0, 12);
  const lock = new THREE.Group(); lock.position.set(LX - .02, .2, LZ + .17); set.add(lock);
  const lockMat = mat(0xd8b46a, { emissive: STATUS.disputed, intensity: 0, rough: .4 }).clone();
  add(lock, rbox(.15, .12, .06, .02), lockMat, 0, 0, 0); { const sh = add(lock, new THREE.TorusGeometry(.045, .014, 6, 16, Math.PI), lockMat, 0, .06, 0); sh.castShadow = false; }
  const paySign = sign({ ...ctx, key: 'task-pay', w: 1.02, h: .36, color: STATUS.disputed, post: .78, px: 512, lines: [{ text: 'approve payment', size: 62, weight: 800, color: '#ffffff' }, { text: 'not this role', size: 44, weight: 600, color: '#ff9aa8' }] });
  paySign.group.position.set(LX + .1, 0, LZ - .47); paySign.group.rotation.y = -.2; set.add(paySign.group);
  const lockFlash = util.glowSprite(STATUS.disputed, .7, 0); lockFlash.position.set(LX, .3, LZ + .2); set.add(lockFlash);

  // Later beats may want the task's facts; data only, they build their own objects.
  hand.task = { id: 'HR-T3-114', files: [2, 1, 0].map(k => ({ type: TYPES[k].key, color: TYPES[k].color, count: TYPES[k].n })), rubricChecks: 34, supervisors: 83, hubs: HUBS.map(h => ({ name: h.name, color: h.color, deferred: !!h.deferred })) };

  /* ---- the camera: high over the whole yard, down to the crates, then round to the fenced rack ---- */
  const cam = { from: { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 }, to: { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 } };
  const line = cameraLine([
    { at: 0, pos: [1.2, 6.6, 8.3], look: [1.5, .5, -.6], fov: 36 },
    { at: .24, pos: [1.4, 5.3, 8.3], look: [1.5, .5, -.2], fov: 35 },
    { at: .33, pos: [1.6, 4.1, 8.7], look: [1.55, .45, .5], fov: 33 },
    { at: .5, pos: [1.7, 4.0, 8.6], look: [1.6, .5, .45], fov: 33 },
    { at: .58, pos: [1.8, 3.7, 8.4], look: [1.65, .8, .2], fov: 33 },
    { at: .66, pos: [1.9, 3.6, 8.2], look: [1.7, .8, .2], fov: 33 },
    { at: .76, pos: [2.0, 3.2, 7.8], look: [1.6, .9, -.1], fov: 32 },
    { at: 1, pos: [2.1, 3.1, 7.7], look: [1.65, .9, -.1], fov: 32 },
  ]);
  line(0, cam);

  const o = new THREE.Object3D(), col = new THREE.Color(), grey = new THREE.Color(0x6a7386), cOk = new THREE.Color(STATUS.verified), cWait = new THREE.Color(STATUS.pending);
  let landed = 0;

  return {
    camera: cam,
    update(lp, t, dt, ui) {
      const L = reduce ? 1 : lp, T = reduce ? 0 : t;

      /* the cart, the files and the count */
      const cx = cartX(L);
      cart.position.set(cx, 0, CART_Z);
      const scanX = mix(-.75, 3.05, lin(L, SCAN_A, SCAN_B)), scanning = L >= SCAN_A;
      landed = 0;
      const bayHit = [0, 0, 0];
      for (let i = 0; i < N; i++) {
        const f = F[i], u = lin(L, f.dep, f.land);
        if (u >= 1) { landed++; bayHit[f.k] = Math.max(bayHit[f.k], hit(L, f.land, .02)); }
        const e = sm(u), sq = hit(L, f.land, .014);
        if (u <= 0) { o.position.set(cx + f.seat.x, f.seat.y, CART_Z + f.seat.z); o.rotation.set(0, 0, 0); }
        else {
          o.position.set(mix(f.from + f.seat.x, f.slot.x, e), mix(f.seat.y, f.slot.y, e) + Math.sin(u * Math.PI) * f.lift, mix(CART_Z + f.seat.z, f.slot.z, e));
          o.rotation.set(0, 0, (1 - e) * Math.PI * 2 * (i % 2 ? 1 : -1));
        }
        o.scale.set(1 + sq * .22, 1 - sq * .3, 1 + sq * .22); o.position.y -= sq * .05;
        o.updateMatrix(); files.setMatrixAt(i, o.matrix);
        // its lamp: grey once it stands in the rack; green, or amber, once the scanner has passed
        const seen = scanning && f.slot.x <= scanX, wait = PENDING.has(i);
        o.position.set(f.slot.x, .47, RZ + .1); o.rotation.set(0, 0, 0);
        o.scale.setScalar(u >= 1 ? (seen ? 1 + (wait ? .5 + .25 * Math.sin(T * 5 + i) : 0) + hit(scanX, f.slot.x, .5) : .8) : .001);
        o.updateMatrix(); lamps.setMatrixAt(i, o.matrix);
        lamps.setColorAt(i, seen ? (wait ? cWait : cOk) : grey);
      }
      files.instanceMatrix.needsUpdate = true; lamps.instanceMatrix.needsUpdate = true; lamps.instanceColor.needsUpdate = true;
      ui.set('files', String(landed));
      bayMats.forEach((m, k) => { m.emissiveIntensity = bayHit[k] * .9; });

      /* the clerk: with the cart in and out, then back in to the lever */
      cart.visible = cx < 5.25;
      if (L < clerkPath[0][0]) {
        const coming = L < CART_T, going = L >= CART_OUT[0];
        walker.x = cx + 1; walker.z = CART_Z;
        walker.walk = coming ? Math.min(1, Math.sin(lin(L, 0, CART_T) * Math.PI) * 3) : going ? Math.min(1, Math.sin(lin(L, CART_OUT[0], CART_OUT[1]) * Math.PI) * 3) : 0;
        walker.ry = going ? mix(-.5, Math.PI / 2, ease(L, CART_OUT[0], CART_OUT[0] + .012)) : mix(-Math.PI / 2, -.5, ease(L, CART_T, CART_T + .02));
      } else {
        pathAt(clerkPath, L, walker);
        if (L >= .612) walker.ry = mix(-Math.PI / 2, -.7, ease(L, .665, .7));
      }
      clerk.root.visible = walker.x < 5.15;
      const pull = ease(L, PULL, PULL + .012) * (1 - ease(L, PULL + .018, PULL + .03)), shake = hit(L, PULL + .012, .03);
      clerk.root.position.set(walker.x, 0, walker.z); clerk.root.rotation.y = walker.ry; clerk.root.rotation.z = pull * .12;
      clerk.update(walker.walk > .05 ? L * 110 : T, walker.walk);
      arm.rotation.z = .32 - pull * .2 + shake * Math.sin(L * 2600) * .05;
      lock.rotation.z = shake * Math.sin(L * 3100) * .35; lockMat.emissiveIntensity = shake * 2.2;
      lockFlash.material.opacity = shake * .7; lockFlash.scale.setScalar(.4 + shake * .6);
      paySign.frameMat.emissiveIntensity = .9 + shake * 2.5 + .15 * Math.sin(T * 2.2);

      /* the six plates under the gantry */
      const out = 1 - ease(L, PLATES_OUT[0], PLATES_OUT[1]);
      for (const p of plates) {
        const k = backOut(lin(L, p.at, p.at + .028)) * out;
        p.holder.visible = k > .01; p.holder.scale.setScalar(Math.max(.001, k));
        p.s.frameMat.emissiveIntensity = 1 + hit(L, p.at + .02, .03) * 2;
      }

      /* the packages */
      for (const p of packs) {
        const u = lin(L, p.at - .03, p.at), down = u * u, age = L - p.at;
        p.c.group.visible = u > 0;
        const hop = age < 0 || age > .03 ? 0 : .22 * Math.abs(Math.sin(age / .03 * Math.PI * 2)) * (1 - age / .03) ** 2;
        const sq = hit(L, p.at, .012);
        p.c.group.position.y = (1 - down) * 4.2 + hop;
        p.c.group.scale.set(1 + sq * .1, 1 - sq * .18, 1 + sq * .1);
        const r = lin(L, p.at, p.at + .035);
        p.ring.visible = r > 0 && r < 1; p.ring.scale.setScalar(.5 + 1.3 * (1 - (1 - r) ** 3)); p.ring.material.opacity = (1 - r) * (1 - r) * .8;
        const k = backOut(lin(L, p.at + .012, p.at + .04));
        p.s.group.visible = k > .01; p.s.group.scale.setScalar(Math.max(.001, k));
        // its units flash one after the other
        p.c.segments.forEach((sg, j) => { sg.mat.emissiveIntensity = hit(L, p.at + .045 + j * .012, .02) * .9; });
        p.s.frameMat.emissiveIntensity = 1 + hit(L, p.at + .03, .03) * 1.6;
      }

      /* the rule, the scanner and the files that were only uploaded */
      const ruleIn = backOut(lin(L, RULE_AT, RULE_AT + .03));
      rule.group.visible = ruleIn > .01; rule.group.scale.setScalar(Math.max(.001, ruleIn));
      rule.frameMat.emissiveIntensity = 1 + hit(L, RULE_AT + .025, .04) * 2 + .15 * Math.sin(T * 2);
      const scanOn = ease(L, SCAN_A - .012, SCAN_A) * (1 - ease(L, SCAN_B + .004, SCAN_B + .02));
      scanner.visible = scanOn > .01; scanner.position.set(scanX, BEAM_Y - .05, GZ + .1);
      cone.material.opacity = scanOn * (.2 + .04 * Math.sin(T * 9));
      for (const u of upTags) {
        const k = scanning ? backOut(lin(scanX, F[u.i].slot.x, F[u.i].slot.x + .35)) : 0;
        u.m.visible = k > .01; u.m.scale.setScalar(Math.max(.001, k));
      }

      /* the data boundary: the fence round the detail files and the two boards over it */
      const up = ease(L, FENCE_A, FENCE_A + .04);
      fence.group.visible = up > 0; fence.group.scale.y = Math.max(.001, backOut(up)); fence.mat.emissiveIntensity = .55 + hit(L, FENCE_A + .04, .05) * 1.6 + .12 * Math.sin(T * 2.4);
      for (const b of boards) {
        const k = backOut(lin(L, b.at, b.at + .03));
        b.holder.visible = k > .01; b.holder.scale.setScalar(Math.max(.001, k));
        b.s.frameMat.emissiveIntensity = 1 + hit(L, b.at + .025, .04) * 2;
      }

      /* the supervisors: an idle sway; they hop when a crate lands */
      const hopAll = Math.max(hit(L, PACKS[0].at, .02), hit(L, PACKS[1].at, .02), hit(L, PACKS[2].at, .02));
      for (let i = 0; i < 83; i++) {
        const s = spots[i];
        people.place(i, s.x, s.z, { y: hopAll * .08 * (.5 + hash(i)) + Math.abs(Math.sin(T * 1.3 + s.ph)) * .012, ry: Math.sin(T * .5 + s.ph) * .35, s: .8 });
      }
      people.commit();
      ground.rimMat.emissiveIntensity = 1 + .2 * Math.sin(T * 1.8) + hopAll * 1.5;
      for (const h of HUBS) if (!h.deferred) h.bandMat.emissiveIntensity = .35 + .1 * Math.sin(T * 1.5 + h.x);

      /* the camera; with the copy stacked below, the frame centres on the action */
      const stacked = !!layout?.stacked;
      line(L, cam, stacked ? 0 : -.3, stacked ? 1.9 : 1.12);
      cam.to.look[1] = cam.from.look[1] += hopAll * .03;
    },
  };
}

/* film-econ-metacase.js — beat 4 of the economics Metacase film: Reflection (econ-0157).
 * One number, and the settings it depends on. On the plotting table a route runs from the data to
 * the reported figure, −66.33, and at five places it forks: the covariates, the control cohort,
 * the terms of the variance, the order in which singletons are dropped, the basis of the p-value.
 * The robot walks the route. At each fork the branch not taken lights first and shows the figure
 * it would have led to; then the robot settles the fork: a medallion lands on the junction (green:
 * met; amber: met with a reservation), the stretch ahead lights, a barrier drops on the other
 * branch. This beat takes five beats of scroll (LONG in the film). Everything is a pure function
 * of real, the beat's progress; t only adds idle life.
 *   real 0–.07    what held: a light runs the whole route once, from the data to the figure
 *   real .07–.42  the five forks, .07 each, in the order of the copy's cards
 *   real .425–.55 what failed, first: the p-value passes only on tolerance (a plate over fork five)
 *        .55–.67  second: the robot walks back to the start; the authors' script was never found,
 *                 so the route rests on the task's settings alone
 *        .67–.775 third: a time rule along the front of the table. The estimate stood at 185 s;
 *                 five more minutes went on searching; a stalled lookup; then the files, written
 *   real .775–.86 the route leaves the table: the props sink, the lit route rises as points of
 *                 light, the open Metacase book forms in its place; the five medallions and the
 *                 1.000 fly onto its front page
 *   real .86–1    the ending, on lp (.54–1), as in the other two films: everything pours into the
 *                 page, the cover lifts, hangs and slams (.69), light leaks from the seam, the tabs
 *                 slide out, the thread draws the signature through them, the book rises and turns.
 * Reduced motion gets one still, at .42: the route with all five forks settled. */
import { plotTable, plate } from './film-econ-kit.js?v=mc-401ead81de';

const TAU = Math.PI * 2;
const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const easeOut = (x, k = 3) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), k);
const easeIn = (x, k = 2) => Math.pow(Math.min(1, Math.max(0, x)), k);
const springy = x => { const p = Math.min(1, Math.max(0, x)) - 1; return 1 + 2.6 * p * p * p + 1.6 * p * p; }; // passes 1, settles
const bump = (x, a, w) => { const u = (x - a) / w; return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI); };
const flash = (x, a, w) => { const u = (x - a) / w; return u < 0 || u >= 1 ? 0 : (1 - u) * (1 - u); };
// a decaying wobble after an impact at a: 1 at the hit, swinging to rest over w
const wobble = (x, a, w, cycles = 1.25) => { const u = (x - a) / w; return u < 0 || u >= 1 ? 0 : Math.cos(u * Math.PI * 2 * cycles) * (1 - u) * (1 - u); };

// The ending's camera, authored as keys (set coordinates) joined by a C1 Hermite spline: high over
// the book, a push onto the page, then low in front of the fore-edge for the slam (the cover falls
// towards the lens), up as the tabs come out, and round to a low hero three-quarter on the risen book.
const END_A = .86, atEnd = old => END_A + (old - .54) / .46 * (1 - END_A);
const END_KEYS = [
  { at: .85, pos: [-1.7, 7.0, 10.3], look: [.2, .55, -.4], fov: 35.5 },
  { at: atEnd(.6), pos: [-.7, 5.0, 8.9], look: [0, .4, .9], fov: 33 },
  { at: atEnd(.66), pos: [0, 1.6, 7.5], look: [0, .6, 0], fov: 32 },
  { at: atEnd(.72), pos: [0, 1.6, 7.6], look: [0, .6, 0], fov: 32 },
  { at: atEnd(.8), pos: [.1, 2.8, 9.6], look: [-.5, .7, 1.2], fov: 31 },
  { at: atEnd(.95), pos: [5.2, 2.6, 9.6], look: [.3, 1.45, .5], fov: 30 },
  { at: 1, pos: [5.05, 2.55, 9.3], look: [.3, 1.45, .5], fov: 30 },
];

// The score medallion: where it lands on the front page and where its arc starts (the plate with
// the reported figure) and bends (set coordinates), when it leaves (s) and how it tumbles on the way.
const DUR = .2, HOVER = 1.2, SIZE = 1.3;
const TOKENS = [
  { key: 'medal', color: 0xf2b545, land: [0, 1.2], from: [4.05, .9, .45], bend: [3.6, 4.2, .9], s: .125, spin: [1.4, 3.2, .2], yaw: -.15 },
];
// The ending's timeline (lp) was written for .54–1; real maps onto it, and the medallion's flight
// (lp .125–.325) onto real .80–.85. Nothing else on lp happens before .54.
const lpOf = r => (r <= .8 ? .125 * r / .8 : r <= .85 ? .125 + (r - .8) / .05 * .2 : r <= END_A ? .325 + (r - .85) / .01 * .215 : .54 + (r - END_A) / (1 - END_A) * .46);

// The five forks, in the order of the copy's cards: identifiers and figures only on the set; the copy
// carries the words. take: the branch this run took; alt: the other branch. out: M met, P met with a
// reservation (the covariates were not verified; the p-value passes on tolerance).
const FORKS = [
  { name: 'covariates', take: ['−66.33', 'no covariates'], alt: ['−69.35', 'column 2 covariates'], out: 'P' },
  { name: 'control cohort', take: ['never inspected'], alt: ['not yet treated'], out: 'M' },
  { name: 'variance', take: ['25.05', 'two terms'], alt: ['24.89', 'first term alone'], out: 'M' },
  { name: 'singletons', take: ['3,170 · 641', 'shares first, then dropped'], alt: ['3,246 · 717', 'not dropped'], out: 'M' },
  { name: 'p-value basis', take: ['0.00831', 't · 640 df'], alt: ['0.00811', 'normal'], out: 'P' },
];
const C_A = .07, C_W = .07, NC = FORKS.length;
// inside a fork's stretch (u, 0..1): the walk in, the other branch, the choice
const WALK_B = .18, ALT_A = .16, ALT_B = .28, FIRE = .42, HIT = .52, LIGHT_B = .7, BAR_A = .58, FOLD_A = .88, FOLD_B = .96;
const OUT = { M: [.1, .95, .36], P: [1.1, .5, .04] }, FLASH = { M: 2.6, P: 2.4 };
// what failed: the tolerance, the script that was never found, the time
const TOL_A = .437, BACK_A = .552, BACK_B = .6, FRAME_A = .6, STAMP = .645, RULE_A = .67, LEAVE_A = .775, LEAVE_B = .8;
const RULE = { z: 2.2, x0: -.9, x1: 3.3, total: 485, stood: 185, stall: [400, 455] };
const ruleX = s => RULE.x0 + (RULE.x1 - RULE.x0) * s / RULE.total;
const RUN = { toStood: [.688, .705], toStall: [.712, .735], interrupt: .755, toEnd: [.757, .772] };
const coinX = i => -1.12 + i * .56, COIN_Z = 2.02, COIN_S = 1.55, COIN_J = 1.25;
const SIG = 0;
// the route: where it runs on the table (z as a function of x), and its nodes: the data, five forks, the figure
const zR = x => .9 + .2 * Math.sin((x + 2.25) * 1.165);
const NODE_X = [-3.0, -2.25, -.9, .45, 1.8, 3.15, 4.0];
const FRONT_Z = 3.15;                                // the plotting table's front edge
const SIDE = .5;                                     // the robot walks beside the route, on the reader's side, and stops to the left of each fork

export async function build(ctx) {
  const { THREE, kit, set, accent, reduce, camera, util, hand, layout } = ctx;
  const { PALETTE, BOOK, BOOK_CENTRE, STAGE_COLORS, GUN_HOLD, add, block, cyl, rbox, mat, glowMat, closedBook, bookTabs, robot } = kit;
  const { smooth, lerp, glowSprite } = util;
  const { PW, PD, T, BOARD } = BOOK;
  const PAGE = BOARD + T / 2;                     // the open pages: the block splits at its middle
  const SPINE_H = T + BOARD * 2;
  const glowMap = glowSprite(0xffffff, 1).material.map;
  const additive = (color, opacity = 1, map = glowMap) => new THREE.MeshBasicMaterial({ color, map, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const sprite = (color, size, opacity = 0) => { const s = glowSprite(color, size, opacity); s.material.fog = false; s.renderOrder = 2; return s; };
  const hex = n => '#' + n.toString(16).padStart(6, '0');
  function canvasTexture(W, H, draw) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const paint = () => { const g = c.getContext('2d'); g.clearRect(0, 0, W, H); draw(g, W, H); tex.needsUpdate = true; };
    paint(); document.fonts?.ready.then(paint);
    return tex;
  }
  // a cloud of glowing points whose positions and colours the update writes in place
  // (paint: true draws normally, with an alpha per point, so it shows on the cream page too)
  function cloud(n, size, parent, paint = false) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(n * 3), col = new Float32Array(n * (paint ? 4 : 3));
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(col, paint ? 4 : 3).setUsage(THREE.DynamicDrawUsage));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size, map: glowMap, vertexColors: true, transparent: true, depthWrite: false, blending: paint ? THREE.NormalBlending : THREE.AdditiveBlending, sizeAttenuation: true, fog: false }));
    pts.frustumCulled = false; pts.renderOrder = 3; parent.add(pts);
    return { pts, pos, col, done() { geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; } };
  }
  // The book lies turned a quarter (spine along x, pages towards the viewer); set and book
  // coordinates swap like this while it rests on the plinth.
  const toBook = (out, x, y, z) => out.set(z, y, -x);
  const toSet = (out, v) => out.set(-v.z, v.y, v.x);
  const REST = new THREE.Vector3(0, BOOK_CENTRE.y, BOOK_CENTRE.x);     // the closed book's centre, set coordinates

  /* ---- the plotting table, shared by the five economics sets ---- */
  const { rimMat } = plotTable({ THREE, kit, set, accent });
  const innerMat = { opacity: 0 };
  // a warm pool of light on the plinth that the book throws once it holds the run
  const poolMat = additive(0xffc982, 0);
  const pool = add(set, new THREE.PlaneGeometry(6.4, 6.4), poolMat, REST.x, .012, REST.z, false); pool.rotation.x = -Math.PI / 2; pool.receiveShadow = false;
  // the halo under the risen book, and the ring of dust the slam throws out
  const haloMat = additive(accent, 0, null);
  const halo = add(set, new THREE.TorusGeometry(1.75, .02, 6, 128), haloMat, 0, .02, 0, false); halo.rotation.x = Math.PI / 2;
  const dustMat = additive(0xfff1d6, 0, null);
  const dust = add(set, new THREE.RingGeometry(.94, 1, 96), dustMat, REST.x, .02, REST.z, false); dust.rotation.x = -Math.PI / 2;

  /* ---- the book: the homepage's closedBook, opened. Its front board moves to a hinge at the
   * spine, and the block of pages splits at its middle, half on each side of the spread. ---- */
  const lift = new THREE.Group(); lift.position.copy(REST); set.add(lift);   // rise
  const lean = new THREE.Group(); lift.add(lean);                             // lean to the camera
  const spin = new THREE.Group(); lean.add(spin);                             // turn
  const orient = new THREE.Group(); orient.rotation.y = -Math.PI / 2; spin.add(orient);
  const book = closedBook(); book.position.copy(BOOK_CENTRE).multiplyScalar(-1); orient.add(book);
  const [, pages, spine] = book.children, lines = book.children.slice(3, 8), gilts = book.children.slice(8, 10);
  const front = book.children.find(c => c.isGroup);
  const hinge = new THREE.Group(); hinge.position.set(0, PAGE, 0); book.add(hinge);
  hinge.add(front); front.position.set(PW / 2 + .05, T / 2 + BOARD / 2, 0);
  pages.scale.y = .5; pages.position.y = BOARD + T / 4;
  // the cloth of this book flashes warm when it slams, so it gets its own copy of the kit's cover
  const kitCover = book.children[0].material, coverMat = kitCover.clone(); coverMat.emissive.setHex(0xffc98a); coverMat.emissiveIntensity = 0;
  book.traverse(o => { if (o.isMesh && o.material === kitCover) o.material = coverMat; });
  const leftPages = add(hinge, rbox(PW, T, PD, .02), mat(PALETTE.cream), PW / 2, T / 4, 0); leftPages.scale.y = .5;
  // the seam between the halves is the line the light leaks from when the cover shuts
  const seamMat = new THREE.MeshStandardMaterial({ color: 0xe4dccb, emissive: 0xffd49a, emissiveIntensity: 0, roughness: .8 });
  lines[2].material = seamMat;
  // the title page, printed on the half that rides on the cover (so it reads once open)
  const titleTex = canvasTexture(1024, 768, (g, W) => {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if ('letterSpacing' in g) g.letterSpacing = '16px';
    g.fillStyle = '#1f2a3a'; g.font = '750 104px Inter, Arial, sans-serif'; g.fillText('METACASE', W / 2, 150);
    if ('letterSpacing' in g) g.letterSpacing = '4px';
    g.fillStyle = '#d8b46a'; g.fillRect(W * .26, 222, W * .48, 5);
    g.fillStyle = '#2c5468'; g.font = '700 58px "Space Mono", ui-monospace, monospace'; g.fillText('econ-0157', W / 2, 292);
    g.fillStyle = '#e1d8c5';
    for (let k = 0; k < 5; k++) g.fillRect(W * .2, 380 + k * 40, W * (k % 3 === 2 ? .36 : .6), 10);
    STAGE_COLORS.forEach((c, i) => { g.fillStyle = hex(c); g.beginPath(); g.roundRect(W / 2 - 5 * 36 + i * 72 + 8, 610, 56, 56, 12); g.fill(); });
  });
  const title = new THREE.Mesh(new THREE.PlaneGeometry(PD * .94, PW * .94), new THREE.MeshStandardMaterial({ map: titleTex, transparent: true, roughness: .85, depthWrite: false }));
  // reads left to right along the spine, its top towards the far edge, facing down on the hinge
  title.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0)));
  title.position.set(PW / 2, -.0035, 0); hinge.add(title);

  // the fore-edge tabs and the thread through their tips: the Metacase's signature
  const { tabs, tips, nodes, links } = bookTabs(book, SIG);
  const tabMats = tabs.map(tab => (tab.children[0].material = tab.children[0].material.clone()));
  const nodeMats = nodes.map(n => (n.material = n.material.clone()));
  const threadMat = links[0].material.clone(); links.forEach(l => (l.material = threadMat));
  const linkA = tips.slice(0, -1).map(p => p.clone().setY(p.y + .02)), linkB = tips.slice(1).map(p => p.clone().setY(p.y + .02));
  const tabFlares = tips.map((p, i) => { const s = sprite(STAGE_COLORS[i], 1.2); s.position.copy(p); book.add(s); return s; });
  const sigGlow = sprite(0xffe7b8, 2.8); sigGlow.position.set(PW + .5, tips[0].y, 0); book.add(sigGlow);
  const coreGlow = sprite(0xffd49a, 4.2); coreGlow.position.set(PW / 2, PAGE, 0); book.add(coreGlow);

  // light leaking from the gap as the cover comes down: three soft blades along the open edges
  const blade = (w, x, z, ry) => { const m = add(book, new THREE.PlaneGeometry(w, 1), additive(0xffd9a6, 0), x, PAGE, z, false); m.rotation.y = ry; m.receiveShadow = false; m.renderOrder = 2; return m; };
  const blades = [blade(PD + .6, PW + .02, 0, Math.PI / 2), blade(PW + .6, PW / 2, PD / 2 + .02, 0), blade(PW + .6, PW / 2, -PD / 2 - .02, 0)];

  /* ---- the front page: a slot that lights as the medallion lands ---- */
  const landAt = tk => toBook(new THREE.Vector3(), tk.land[0], PAGE, tk.land[1]);
  const slots = TOKENS.map(tk => {
    const at = landAt(tk), m = new THREE.MeshStandardMaterial({ color: tk.color, emissive: tk.color, emissiveIntensity: .35, roughness: .5 });
    const ring = add(book, new THREE.TorusGeometry(.5, .016, 6, 72), m, at.x, PAGE + .004, at.z, false); ring.rotation.x = Math.PI / 2; ring.receiveShadow = false;
    const print = add(book, new THREE.PlaneGeometry(1.5, 1.5), additive(tk.color, 0), at.x, PAGE + .006, at.z, false); print.rotation.x = -Math.PI / 2; print.receiveShadow = false;
    const shockMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(tk.color).multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, fog: false });
    const shock = add(book, new THREE.RingGeometry(.9, 1, 72), shockMat, at.x, PAGE + .008, at.z, false); shock.rotation.x = -Math.PI / 2; shock.receiveShadow = false;
    return { m, ring, print, shock };
  });

  /* ---- the medallion ---- */
  // A token is root (position, squash; turned back to set axes) → pivot (the fold: hinged at its
  // foot, it falls away from the viewer) → body (spin, idle). Its path is in book coordinates.
  function token(tk, centre) {
    const land = landAt(tk);
    const root = new THREE.Group(); root.position.copy(land); root.rotation.y = Math.PI / 2; book.add(root);
    const pivot = new THREE.Group(); pivot.scale.setScalar(SIZE); root.add(pivot);
    const body = new THREE.Group(); body.position.y = centre; pivot.add(body);
    const p0 = toBook(new THREE.Vector3(), ...tk.from), p1 = toBook(new THREE.Vector3(), ...tk.bend);
    const p3 = land.clone().setY(PAGE + HOVER), p2 = toBook(new THREE.Vector3(), tk.land[0] + Math.sign(tk.from[0] - tk.land[0]) * .9, PAGE + 2.6, tk.land[1] - .8);
    return { tk, root, pivot, body, centre, p: [p0, p1, p2, p3], e: tk.s + DUR, color: new THREE.Color(tk.color), land };
  }
  const bez = (out, p, u) => {
    const a = p[0], b = p[1], c = p[2], d = p[3], v = 1 - u, A = v * v * v, B = 3 * v * v * u, C = 3 * v * u * u, D = u * u * u;
    return out.set(A * a.x + B * b.x + C * c.x + D * d.x, A * a.y + B * b.y + C * c.y + D * d.y, A * a.z + B * b.z + C * c.z + D * d.z);
  };
  const travel = f => easeOut(f / .78, 2.2);

  // the score medallion: 1.000 in the middle, a ring of three ticks for the three comparisons
  const medal = token(TOKENS[0], .38);
  const medalTex = canvasTexture(512, 512, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#f2b545'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
    g.fillStyle = '#ffd77a'; g.beginPath(); g.arc(c, c, c - 22, 0, TAU); g.fill();
    g.lineCap = 'round'; g.lineWidth = 10;
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i + .5) / 3 * TAU;
      g.strokeStyle = i < 2 ? '#1f6f6a' : '#b06a12';
      g.beginPath(); g.moveTo(c + Math.cos(a) * 190, c + Math.sin(a) * 190); g.lineTo(c + Math.cos(a) * 218, c + Math.sin(a) * 218); g.stroke();
    }
    g.fillStyle = '#1f2a3a'; g.font = '800 128px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1.000', c, c + 6);
  });
  const goldMat = mat(0xffcf4a, { emissive: 0xffb020, intensity: .3, rough: .3 }).clone();
  const coin = add(medal.body, new THREE.CylinderGeometry(.36, .36, .07, 56), goldMat); coin.rotation.x = Math.PI / 2;
  const edge = add(medal.body, new THREE.TorusGeometry(.36, .024, 10, 64), goldMat, 0, 0, 0, false); edge.receiveShadow = false;
  const faceMat = new THREE.MeshStandardMaterial({ map: medalTex, emissive: 0xffffff, emissiveMap: medalTex, emissiveIntensity: .2, roughness: .35 });
  [1, -1].forEach(s => { const f = add(medal.body, new THREE.CircleGeometry(.335, 56), faceMat, 0, 0, s * .0365, false); f.rotation.y = s > 0 ? 0 : Math.PI; f.receiveShadow = false; });
  const medalGlow = sprite(0xffd27a, 1.5); medal.body.add(medalGlow);

  const flyers = [medal];
  const TRAIL = 18, trails = cloud(flyers.length * TRAIL, .22, book);
  const sparks = cloud(TOKENS.length * 12, .13, book, true);
  const motes = cloud(64, .12, set);
  const PUFF = 40, puff = cloud(PUFF, .16, set);   // the air the slam pushes out of the pages
  const puffCol = new THREE.Color(0xffd9a6);
  const moteSeed = Array.from({ length: 64 }, (_, i) => [((i * 0.61803) % 1), ((i * 0.3819 + .17) % 1), ((i * 0.7548 + .4) % 1)]);
  const moteCol = moteSeed.map((_, i) => new THREE.Color(STAGE_COLORS[i % 5]));

  /* ---- the route: six stretches from the data to the figure, each a dim line and a bright one that draws over it ---- */
  const MONO = '"Space Mono", ui-monospace, SFMono-Regular, monospace';
  const TEAL = accent, ALT = 0xa79bff, GREEN = 0x3fd08a, AMBER = PALETTE.amber, ROSE = PALETTE.rose, CYAN = 0x8ff6ff;
  const own = (color, intensity = 1) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: .5 });
  const path = new THREE.Group(); set.add(path);       // everything that sinks into the table when the route leaves
  const SEG = 40, RAD = 8;
  const sweep = (geo, k) => geo.setDrawRange(0, Math.round(Math.min(1, Math.max(0, k)) * SEG) * RAD * 6);
  const routeCurve = (x0, x1) => new THREE.CatmullRomCurve3(Array.from({ length: 9 }, (_, k) => { const x = x0 + (x1 - x0) * k / 8; return new THREE.Vector3(x, .035, zR(x)); }));
  const segs = NODE_X.slice(0, -1).map((x0, j) => {
    const curve = routeCurve(x0, NODE_X[j + 1]);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x2b4a66, emissive: TEAL, emissiveIntensity: .25, roughness: .7 });
    add(path, new THREE.TubeGeometry(curve, SEG, .045, RAD), baseMat, 0, 0, 0, false);
    const litGeo = new THREE.TubeGeometry(curve, SEG, .056, RAD), litMat = own(TEAL, 1.5);
    add(path, litGeo, litMat, 0, 0, 0, false); sweep(litGeo, 0);
    return { baseMat, litGeo, litMat, mid: (x0 + NODE_X[j + 1]) / 2 };
  });
  const runner = sprite(0xbff7f2, 1.1); path.add(runner);

  // printed labels lying on the table, tipped up towards the reader
  const flatLabel = (key, lines, w, h, x, z, opts = {}) => {
    const tw = 1024, th = Math.round(tw * h / w), tilt = opts.tilt ?? .5;
    const tex = kit.labelTexture(`film-econ-path-${key}`, lines, { width: tw, height: th });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: opts.opacity ?? 1, depthWrite: false, toneMapped: false, fog: false }));
    m.rotation.x = -Math.PI / 2 + tilt; m.position.set(x, .03 + Math.sin(tilt) * h / 2, z); m.renderOrder = 4; (opts.parent || path).add(m);
    return m;
  };
  const plateLines = (a, main, sub, k = 1) => (a.length > 1
    ? [{ text: a[0], size: (a[0].length > 8 ? 84 : 108) * k, weight: 800, color: main, font: MONO, track: -1 }, { text: a[1], size: (a[1].length > 20 ? 40 : 46) * k, weight: 600, color: sub }]
    : [{ text: a[0], size: 70 * k, weight: 700, color: main }]);
  const standing = (key, lines, w, h, color, x, z, turn = 0) => {
    const p = plate({ THREE, kit, key: `film-econ-path-${key}`, lines, w, h, color, texWidth: Math.round(256 * (w * .94) / (h * .9)), texHeight: 256 });
    p.group.position.set(x, 0, z); p.group.rotation.y = turn; path.add(p.group);
    return p;
  };

  // the data at the start, the reported figure at the end
  const dataPlate = standing('data', [{ text: 'data', size: 92, weight: 800, color: '#ffffff' }, { text: '3,246 observations', size: 44, weight: 600, color: '#9fd8ff' }], .9, .44, 0x9fd8ff, NODE_X[0] - .22, zR(NODE_X[0]) - .62, .22);
  const goal = new THREE.Group(); set.add(goal);        // the figure's plate stays until the medallion has left it
  const goalPlate = plate({ THREE, kit, key: 'film-econ-path-goal', lines: [{ text: '−66.33', size: 112, weight: 800, color: '#ffffff', font: MONO, track: -1 }, { text: 'this run', size: 46, weight: 600, color: '#8fe6df' }], w: 1.0, h: .5, color: TEAL, texWidth: 535, texHeight: 256 });
  goalPlate.group.position.set(4.08, 0, zR(4) - .62); goalPlate.group.rotation.y = -.3; goal.add(goalPlate.group);
  const goalRingMat = own(TEAL, 1.2);
  const goalRing = add(goal, new THREE.TorusGeometry(.2, .03, 8, 36), goalRingMat, NODE_X[6], .04, zR(NODE_X[6]), false); goalRing.rotation.x = Math.PI / 2;
  cyl(path, .12, .14, .07, 0x26324d, NODE_X[0], 0, zR(NODE_X[0]), 20);

  /* ---- the forks ---- */
  const coinGeo = new THREE.LatheGeometry([[0, -.045], [.17, -.045], [.195, -.026], [.2, 0], [.195, .026], [.17, .045], [.163, .045], [.156, .032], [0, .032]].map(([x, y]) => new THREE.Vector2(x, y)), 36);
  const inlayGeo = new THREE.CircleGeometry(.152, 32).rotateX(-Math.PI / 2).translate(0, .035, 0);
  const coinRingGeo = new THREE.RingGeometry(.84, 1, 48).rotateX(-Math.PI / 2);
  const forks = FORKS.map((f, i) => {
    const x = NODE_X[i + 1], z = zR(x), warn = f.out === 'P';
    // the branch not taken: it peels off towards the back and ends at a barrier
    const altCurve = new THREE.CatmullRomCurve3([[x, z], [x + .3, z - .1], [x + .62, z - .5], [x + .8, z - 1.15], [x + .8, -1.3]].map(([px, pz]) => new THREE.Vector3(px, .03, pz)));
    const altBaseMat = new THREE.MeshStandardMaterial({ color: 0x343a5e, emissive: ALT, emissiveIntensity: .1, roughness: .8 });
    add(path, new THREE.TubeGeometry(altCurve, SEG, .034, RAD), altBaseMat, 0, 0, 0, false);
    const altGeo = new THREE.TubeGeometry(altCurve, SEG, .044, RAD), altMat = new THREE.MeshStandardMaterial({ color: 0x4a4f7a, emissive: ALT, emissiveIntensity: 1.4, roughness: .6 });
    add(path, altGeo, altMat, 0, 0, 0, false); sweep(altGeo, 0);
    const barMat = own(ROSE, 1.1), bar = new THREE.Group(); bar.position.set(x + .47, 0, z - .32); bar.rotation.y = -.67; path.add(bar);
    add(bar, rbox(.5, .085, .06, .02), barMat, 0, .2, 0, false);
    [-1, 1].forEach(s => add(bar, rbox(.045, .2, .045, .012), mat(0x2f3a56), s * .2, .1, 0, false));
    // the junction, the fork's name, and the two plates
    const nodeMat = own(CYAN, .7), node = add(path, new THREE.TorusGeometry(.15, .024, 8, 36), nodeMat, x, .04, z, false); node.rotation.x = Math.PI / 2;
    const name = flatLabel(`name-${i}`, [{ text: f.name, size: 150, weight: 700, color: '#dfe8f7', track: 1 }], .95, .19, x + .72, 1.62, { tilt: .4 });
    name.position.z = 2.12;
    const altPlate = standing(`alt-${i}`, plateLines(f.alt, '#e6e1ff', '#b9b0ee'), 1.15, .5, ALT, x + .8, -1.8);
    const takePlate = standing(`take-${i}`, [{ text: f.name, size: 38, weight: 600, color: '#a9b8d2', track: 2 }, ...plateLines(f.take, '#ffffff', warn ? '#ffd27a' : '#a9f0c6', .88)], 1.15, .6, warn ? AMBER : GREEN, x + .72, 2.36);
    takePlate.group.rotation.x = -.95;
    // the medallion that settles it, and the ring it throws on landing
    const g = new THREE.Group();
    const body = new THREE.Mesh(coinGeo, new THREE.MeshStandardMaterial({ color: 0xf5efe5, roughness: .5 })); body.castShadow = true; g.add(body);
    const inlay = new THREE.Mesh(inlayGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, fog: false })); g.add(inlay);
    g.visible = false; set.add(g);
    const ring = new THREE.Mesh(coinRingGeo, additive(0xffffff, 0, null)); ring.position.set(x, .05, z); ring.renderOrder = 2; ring.visible = false; set.add(ring);
    return { ...f, i, x, z, warn, altBaseMat, altGeo, altMat, bar, barMat, node, nodeMat, name, altPlate, takePlate, coin: { g, inlay, ring }, at: new THREE.Vector3(x, .06, z), slot: new THREE.Vector3(coinX(i), PAGE + .08, COIN_Z), altAt: new THREE.Vector3(x + .8, .3, -1.8), takeAt: new THREE.Vector3(x + .72, .2, 2.3) };
  });

  /* ---- what failed ---- */
  // first: the p-value passes only on tolerance. A plate over the fifth fork, on a fine stem.
  const F5 = forks[NC - 1];
  const tol = new THREE.Group(); tol.position.set(F5.x - .3, 2.0, F5.z); path.add(tol);
  const tolPlate = plate({ THREE, kit, key: 'film-econ-path-tol', lines: [{ text: '0.0002 within 0.01', size: 74, weight: 800, color: '#ffffff', font: MONO, track: -2 }, { text: 'passes only on tolerance', size: 50, weight: 600, color: '#ffd27a' }], w: 1.7, h: .5, color: AMBER, texWidth: 909, texHeight: 256 });
  tolPlate.group.position.y = -.25; tol.add(tolPlate.group);
  const tolStem = add(path, new THREE.CylinderGeometry(.008, .008, 1, 6), additive(AMBER, 0, null), F5.x + .1, .6, F5.z, false);
  // second: the authors' script. An empty frame beside the start, and what the route rests on instead.
  const MISS = { x: -2.38, z: -1.25, w: 1.3, h: .8 };
  const miss = new THREE.Group(); miss.position.set(MISS.x, .22, MISS.z); miss.rotation.y = .08; path.add(miss);
  const missMat = own(0x9aa3b2, .9);
  for (let k = 0; k < 4; k++) {                      // a dashed outline: three dashes on each side
    const horiz = k < 2, y = horiz ? (k ? MISS.h + .1 : .1) : .1 + MISS.h / 2, len = horiz ? MISS.w : MISS.h;
    for (let d = 0; d < 3; d++) {
      const o = (d - 1) * len / 3;
      add(miss, rbox(horiz ? len / 3 - .09 : .025, horiz ? .025 : len / 3 - .09, .025, .008), missMat, horiz ? o : (k === 2 ? -1 : 1) * MISS.w / 2, horiz ? y : y + o, 0, false);
    }
  }
  [-1, 1].forEach(sx => add(miss, rbox(.03, .32, .03, .01), mat(0x4a5a80), sx * (MISS.w / 2 - .12), -.06, 0, false));
  const upright = (key, lines, w, h, parent, x, y, z = .01, opacity = 0) => {
    const tw = 1024, th = Math.round(tw * h / w), tex = kit.labelTexture(`film-econ-path-${key}`, lines, { width: tw, height: th });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false, toneMapped: false, fog: false }));
    m.position.set(x, y, z); m.renderOrder = 4; parent.add(m); return m;
  };
  const missName = upright('miss-name', [{ text: "authors' script", size: 150, weight: 600, color: '#c3cee0' }], 1.15, .21, miss, 0, .1 + MISS.h * .64);
  const missStamp = upright('miss-stamp', [{ text: 'never found', size: 170, weight: 800, color: '#ff8fa0', track: 2 }], 1.15, .255, miss, 0, .1 + MISS.h * .3, .03); missStamp.rotation.z = .12;
  const pings = [0, 1, 2].map(() => { const m = new THREE.Mesh(coinRingGeo, additive(0xbfd7ff, 0, null)); m.position.set(MISS.x + .1, .03, MISS.z + .45); m.renderOrder = 2; m.visible = false; path.add(m); return m; });
  const rests = upright('rests', [{ text: "the task's settings alone", size: 104, weight: 700, color: '#ffd27a', track: 1 }], 1.34, .17, miss, 0, -.1, .02);   // under the frame: what the route rests on instead
  // third: the time rule along the front of the table, 0 to about eight minutes
  const rule = new THREE.Group(); rule.position.set(0, 0, RULE.z); path.add(rule);
  const ruleLen = RULE.x1 - RULE.x0;
  add(rule, rbox(ruleLen + .12, .05, .16, .02), mat(0x26324d), (RULE.x0 + RULE.x1) / 2, .025, 0, false);
  for (let s = 0; s <= 480; s += 60) add(rule, rbox(.022, .07, .24, .006), mat(0x7d93b6), ruleX(s), .035, 0, false);
  const barOf = (color, y) => { const m = own(color, 1.3), b = add(rule, new THREE.BoxGeometry(1, .05, .11), m, 0, y + .03, 0, false); return { m, b }; };
  const fillTeal = barOf(TEAL, .045), fillAmber = barOf(AMBER, .046), fillRed = barOf(0xff3a52, .05);
  const span = (bar, a, b) => { const w = Math.max(.001, ruleX(b) - ruleX(a)); bar.b.scale.x = w; bar.b.position.x = ruleX(a) + w / 2; bar.b.visible = w > .002; };
  const flag = new THREE.Group(); flag.position.set(ruleX(RULE.stood), 0, -.02); rule.add(flag);
  add(flag, new THREE.CylinderGeometry(.014, .014, .7, 8), mat(0xdfe8f7), 0, .35, 0, false);
  const flagMat = own(TEAL, 1.2); add(flag, rbox(.3, .17, .02, .01), flagMat, .16, .6, 0, false);
  const stoodLabel = flatLabel('stood', [{ text: '185 s · estimate stood', size: 112, weight: 700, color: '#8fe6df', track: 1 }], 1.62, .23, ruleX(RULE.stood) - .05, .34, { parent: rule, tilt: .45, opacity: 0 });
  const searchLabel = flatLabel('search', [{ text: 'five more minutes · searching', size: 106, weight: 700, color: '#ffd27a', track: 1 }], 1.95, .23, (ruleX(RULE.stood) + ruleX(RULE.stall[0])) / 2 + .1, .74, { parent: rule, tilt: .45, opacity: 0 });
  const stallLabel = flatLabel('stall', [{ text: 'stalled lookup', size: 140, weight: 800, color: '#ff8fa0', track: 1 }], 1.15, .23, (ruleX(RULE.stall[0]) + ruleX(RULE.stall[1])) / 2, .34, { parent: rule, tilt: .45, opacity: 0 });
  const stallAt = (ruleX(RULE.stall[0]) + ruleX(RULE.stall[1])) / 2;
  const spinner = add(rule, new THREE.TorusGeometry(.17, .022, 8, 28, Math.PI * 1.5), own(0xff5a70, 1.8), stallAt, .62, 0, false);
  // the two files at the end of the rule: outlines until they are written
  const fileMat = new THREE.MeshStandardMaterial({ color: 0x26324d, emissive: GREEN, emissiveIntensity: 0, roughness: .6 });
  const files = [0, 1].map(k => { const m = add(rule, rbox(.2, .27, .03, .015), fileMat, RULE.x1 + .2 + k * .27, .17, 0, false); m.rotation.x = -.15; return m; });
  const filesLabel = flatLabel('files', [{ text: 'files written', size: 150, weight: 700, color: '#a9f0c6', track: 1 }], 1.0, .23, RULE.x1 + .2, .74, { parent: rule, tilt: .45, opacity: 0 });

  // the lit route as points of light: it lifts off the table, hangs over the book, and pours into the page
  const NL = 56, light = cloud(NL, .2, set);
  const lightCol = new THREE.Color(TEAL).multiplyScalar(1.5);

  /* ---- the robot, the model that ran it: it walks the route ---- */
  const bot = robot(PALETTE.cream, CYAN);
  const SCALE = 1.15; bot.root.scale.setScalar(SCALE); set.add(bot.root);
  const botArms = bot.root.children[0].children.filter(c => c.isGroup && c !== bot.head);
  // armed with the harness from the Strategy beat, if that beat has built it
  const muzzleMark = new THREE.Object3D();
  if (hand.weapon) {
    const gun = hand.weapon.create();
    gun.position.copy(GUN_HOLD.at); gun.rotation.copy(GUN_HOLD.turn); gun.scale.setScalar(hand.weapon.holdScale);
    gun.traverse(o => { if (o.isMesh) o.castShadow = true; });
    muzzleMark.position.set(0, 0, .93); gun.add(muzzleMark); bot.root.add(gun); bot.grip(1);
  } else { muzzleMark.position.set(0, .5, .3); bot.root.add(muzzleMark); }
  const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true).translate(0, .5, 0);
  const eyeBeam = new THREE.Mesh(beamGeo, additive(CYAN, 0, null)); eyeBeam.frustumCulled = false; eyeBeam.visible = false; set.add(eyeBeam);
  const muzzleFlare = sprite(0xffe2a0, .9); set.add(muzzleFlare);
  // where it stands and when it walks: legs [from time, to time, to x, to z, along the route?]
  const stopX = i => NODE_X[i + 1] - .88, onRoute = x => zR(x) + SIDE;
  const START = [NODE_X[0] + .6, onRoute(NODE_X[0] + .6)], BACK = [-.85, onRoute(-.85)], ASIDE = [2.72, .85];
  const RULE_BOT = RULE.z - .42;                       // the robot's line along the time rule: behind it
  const LEGS = [
    ...FORKS.map((_, i) => [C_A + i * C_W, C_A + (i + WALK_B) * C_W, stopX(i), onRoute(stopX(i)), true]),
    [BACK_A, BACK_B, BACK[0], BACK[1], true],
    [RULE_A - .002, RUN.toStood[0] - .002, RULE.x0 + .35, RULE_BOT, false],
    [RUN.toStood[0], RUN.toStood[1], ruleX(RULE.stood) - .5, RULE_BOT, false],
    [RUN.toStall[0], RUN.toStall[1], ruleX(RULE.stall[0]) - .45, RULE_BOT, false],
    [RUN.toEnd[0], RUN.toEnd[1], RULE.x1 - .1, RULE_BOT, false],
    [LEAVE_A + .003, LEAVE_B, ASIDE[0], ASIDE[1], false],
  ];
  const walk = { x: 0, z: 0, moving: 0, heading: 0 };
  function botAt(real) {
    let x = START[0], z = START[1];
    walk.moving = 0;
    for (let k = 0; k < LEGS.length; k++) {
      const [a, b, tx, tz, route] = LEGS[k];
      if (real <= a) break;
      if (real >= b) { x = tx; z = tz; continue; }
      const f = (real - a) / (b - a), s = smooth(f), nx = lerp(x, tx, s), nz = route ? lerp(z - onRoute(x), tz - onRoute(tx), s) + onRoute(nx) : lerp(z, tz, s);
      walk.moving = Math.sin(Math.PI * f); walk.heading = Math.atan2(tx - x, route ? 0 : tz - z);
      x = nx; z = nz; break;
    }
    walk.x = x; walk.z = z;
  }

  /* ---- the camera line: the whole table, then fork by fork beside the robot, the start again for
   * the missing script, the front for the time rule, then up over the book for the ending ---- */
  const shot = { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 };
  const forkShot = (f, d = 1) => ({ pos: [f.x + .2 + .75 * d, .35 + 3.7 * d, f.z - .2 + 7.1 * d], look: [f.x + .2, .35, f.z - .2], fov: 34 });
  const WIDE = { pos: [-2.1, 7.9, 13.9], look: [-.65, 0, .1], fov: 33 };
  const PATH_KEYS = [
    { at: 0, ...WIDE }, { at: .05, ...WIDE },
    ...forks.flatMap((f, i) => [{ at: C_A + (i + .2) * C_W, ...forkShot(f) }, { at: C_A + (i + .9) * C_W, ...forkShot(f) }]),
    { at: TOL_A + .012, ...forkShot(F5, .86) }, { at: BACK_A - .004, ...forkShot(F5, .86) },
    { at: BACK_B, pos: [-1.5, 3.2, 6.5], look: [-2.2, .55, -.6], fov: 34 }, { at: RULE_A - .006, pos: [-1.5, 3.2, 6.5], look: [-2.2, .55, -.6], fov: 34 },
    { at: RUN.toStood[0], pos: [.9, 5.7, 8.5], look: [1.0, 0, 2.35], fov: 34 }, { at: RUN.toEnd[1], pos: [.9, 5.7, 8.5], look: [1.0, 0, 2.35], fov: 34 },
    { at: LEAVE_B + .012, pos: [-1.9, 7.1, 10.5], look: [.2, .55, -.4], fov: 35.5 },
    { at: .85, pos: END_KEYS[0].pos, look: END_KEYS[0].look, fov: END_KEYS[0].fov },
  ];
  const kv = END_KEYS.map(k => [...k.pos, ...k.look, k.fov]), kt = END_KEYS.map(k => k.at);
  const km = kv.map((v, i) => v.map((_, c) => (i === 0 || i === kv.length - 1 ? 0 : (kv[i + 1][c] - kv[i - 1][c]) / (kt[i + 1] - kt[i - 1]))));
  function pose(real) {
    if (real < .85) {                                 // the route: ease from key to key, at rest on each
      let i = 0; while (i < PATH_KEYS.length - 2 && real > PATH_KEYS[i + 1].at) i++;
      const a = PATH_KEYS[i], b = PATH_KEYS[i + 1], s = smooth(lin(real, a.at, b.at));
      for (let c = 0; c < 3; c++) { shot.pos[c] = lerp(a.pos[c], b.pos[c], s); shot.look[c] = lerp(a.look[c], b.look[c], s); }
      shot.fov = lerp(a.fov, b.fov, s);
      return;
    }
    let i = 0; while (i < kt.length - 2 && real > kt[i + 1]) i++;
    const h = kt[i + 1] - kt[i], s = Math.min(1, Math.max(0, (real - kt[i]) / h)), s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    const a = kv[i], b = kv[i + 1], ma = km[i], mb = km[i + 1];
    for (let c = 0; c < 7; c++) {
      const v = h00 * a[c] + h10 * h * ma[c] + h01 * b[c] + h11 * h * mb[c];
      if (c < 3) shot.pos[c] = v; else if (c < 6) shot.look[c - 3] = v; else shot.fov = v;
    }
  }

  const all = [medal], idles = [0];
  const v1 = new THREE.Vector3(), aim = new THREE.Vector3(), seen = new THREE.Vector3(), muzzle = new THREE.Vector3(), headAt = new THREE.Vector3(), beamDir = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const centre = new THREE.Vector3(REST.x, PAGE + .2, REST.z);
  const cWarn = new THREE.Color(AMBER), cMet = new THREE.Color(GREEN), cCyan = new THREE.Color(CYAN), cTmp = new THREE.Color();
  const turnTo = (from, to, k) => { let d = to - from; d -= Math.round(d / TAU) * TAU; return from + d * k; };

  function update(real, t) {
    if (reduce) { real = .42; t = 0; }
    const lp = lpOf(real), idle = reduce ? 0 : 1;
    pose(real);
    const stacked = !!layout?.stacked, routeShot = 1 - smooth(lin(real, LEAVE_B, .85));
    if (stacked) {
      // with the copy below the picture, stand further back and centre what the shot is about
      // the opening shot and the time rule are wide: centre them and stand back; the tolerance plate hangs high: look up to it
      const whole = 1 - smooth(lin(real, .05, .085)), ruleS = smooth(lin(real, RULE_A, RUN.toStood[0])) * (1 - smooth(lin(real, LEAVE_A, LEAVE_B)));
      const tolS = smooth(lin(real, TOL_A, TOL_A + .012)) * (1 - smooth(lin(real, BACK_A - .004, BACK_A)));
      const forkS = smooth(lin(real, .07, .09)) * (1 - smooth(lin(real, BACK_A, BACK_A + .02)));
      const back = (.5 - .15 * whole + .5 * ruleS) * routeShot, dx = 1.15 * whole + .6 * ruleS + .4 * forkS;
      shot.look[0] += dx; shot.pos[0] += dx; shot.look[1] += .45 * tolS; shot.look[2] -= 1.5 * ruleS; shot.pos[2] -= 1.5 * ruleS;
      for (let c = 0; c < 3; c++) shot.pos[c] = shot.look[c] + (shot.pos[c] - shot.look[c]) * (1 + back);
      // Nothing may reach below the picture's free area (the part of the frame above the copy; the framework lifts
      // the look point to its middle and backs off by `push`). The table's front edge is the lowest thing in every
      // shot, the ending's included: stand back until it is inside.
      const view = camera.view, free = view && view.fullHeight ? Math.min(1, Math.max(.3, 1 - 2 * view.offsetY / view.fullHeight)) : .5;
      const push = Math.min(2.2, Math.max(1, 1.4 * free / camera.aspect)), lim = free * Math.tan(shot.fov * Math.PI / 360) * .92;
      for (let k = 0; k < 3; k++) {
        const ox = (shot.pos[0] - shot.look[0]) * push, oy = (shot.pos[1] - shot.look[1]) * push, oz = (shot.pos[2] - shot.look[2]) * push, len = Math.hypot(ox, oy, oz);
        const fx = -ox / len, fy = -oy / len, fz = -oz / len;                                  // the way the camera looks
        const ux = -fy * fx, uy = 1 - fy * fy, uz = -fy * fz, ul = Math.hypot(ux, uy, uz);     // up, in the frame
        const rx = -ox, ry = -shot.look[1] - oy, rz = FRONT_Z - shot.look[2] - oz;             // the front edge, from the camera
        const tan = (rx * ux + ry * uy + rz * uz) / ul / (rx * fx + ry * fy + rz * fz);
        if (tan >= -lim) break;
        const grow = Math.min(1.5, -tan / lim);
        for (let c = 0; c < 3; c++) shot.pos[c] = shot.look[c] + (shot.pos[c] - shot.look[c]) * grow;
      }
    }
    const jolt = wobble(lp, .69, .035, 2.5);   // the slam jolts the camera, briefly
    shot.pos[1] -= jolt * .1; shot.look[1] -= jolt * .06;

    /* the cover: lifts (ease in-out), hangs at the vertical, falls (ease-in) and slams at .69 */
    const cx = lin(lp, .58, .69);
    const angle = cx < .45 ? Math.PI - Math.PI / 2 * smooth(cx / .45) : Math.PI / 2 * (1 - easeIn((cx - .45) / .55, 2.2));
    hinge.rotation.z = angle;
    const shut = 1 - angle / Math.PI;
    const sp = lerp(.5, 1, shut);
    spine.scale.y = sp; spine.position.y = SPINE_H * sp / 2;
    gilts[0].position.y = SPINE_H * sp * .18 + .015; gilts[1].position.y = SPINE_H * sp * .82 + .015;
    lines[3].visible = lines[4].visible = shut > .985;
    const slam = flash(lp, .69, .07), hit = wobble(lp, .69, .075, 1.5);

    /* the route leaves the table: its props sink flat and go; the figure's plate follows once the medallion has left it */
    const leave = smooth(lin(real, LEAVE_A, LEAVE_B)), goalLeave = smooth(lin(real, .812, .84));
    path.visible = leave < 1; path.scale.y = Math.max(.001, 1 - leave);
    goal.visible = goalLeave < 1; goal.scale.y = Math.max(.001, 1 - goalLeave);
    const dataUp = Math.max(1 - smooth(lin(real, .05, .066)), smooth(lin(real, BACK_B - .012, BACK_B)) * (1 - smooth(lin(real, RULE_A - .004, RULE_A + .01))));
    dataPlate.group.scale.y = Math.max(.001, dataUp); dataPlate.group.visible = dataUp > .002;
    const goalUp = Math.max(1 - smooth(lin(real, .05, .066)), smooth(lin(real, C_A + (NC - 1 + .1) * C_W, C_A + (NC - 1 + .25) * C_W)) * (1 - smooth(lin(real, BACK_A, BACK_A + .015))));
    goalPlate.group.scale.y = Math.max(.001, goalUp); goalPlate.group.visible = goalUp > .002;

    /* what held: a light runs the route once, and the first stretch stays lit */
    const run = lin(real, .008, .058), runX = lerp(NODE_X[0], NODE_X[6], smooth(run)), running = run > 0 && run < 1;
    runner.visible = running; runner.position.set(runX, .12, zR(runX)); runner.material.opacity = running ? .9 * Math.sin(run * Math.PI) ** .5 : 0;
    const c_ = (real - C_A) / C_W, cur = Math.floor(c_), u = c_ - cur, inA = cur >= 0 && cur < NC;
    for (let j = 0; j < segs.length; j++) {
      const sg = segs[j], pass = running ? Math.exp(-(((runX - sg.mid) / .8) ** 2)) : 0;
      const cu = j === 0 ? 1 : j - 1 < cur ? 1 : j - 1 === cur ? u : 0;
      const litK = j === 0 ? smooth(lin(run, .08, .2)) : smooth(lin(cu, HIT, LIGHT_B));
      sweep(sg.litGeo, litK);
      sg.baseMat.emissiveIntensity = .25 + pass * 2.2 + (running ? .25 : 0);
      sg.litMat.emissiveIntensity = 1.35 + .15 * Math.sin(t * 2.2 - j * .9) * idle + (j - 1 === cur ? flash(u, HIT, .2) * 2 : 0);
    }
    goalRingMat.emissiveIntensity = 1.1 + (running ? flash(run, .9, .1) * 3 : 0) + .2 * Math.sin(t * 2) * idle;
    goalPlate.frameMat.emissiveIntensity = 1.0 + flash(run, .9, .1) * 2.5 + flash(real, .8, .02) * 2;

    /* the forks */
    bot.root.updateMatrixWorld(true);
    muzzleMark.getWorldPosition(muzzle); set.worldToLocal(muzzle);
    let coinPulse = 0, scan = 0, look = 0;                        // look: 0 ahead, 1 the other branch's plate, 2 the plate of the branch taken
    const coinPress = smooth(lin(lp, .6, .655));
    for (let i = 0; i < NC; i++) {
      const f = forks[i], cu = i < cur ? 1 : i === cur ? u : 0, here = i === cur ? 1 : 0;
      // the other branch draws out and shows its figure; once the fork is settled it goes dark behind its barrier
      const closed = smooth(lin(cu, BAR_A - .02, BAR_A + .12));
      const past = i === NC - 1 ? smooth(lin(real, BACK_A, BACK_A + .015)) : smooth(lin(cu, FOLD_A, FOLD_B));   // read, then folded away: only the medallion stays
      sweep(f.altGeo, lin(cu, ALT_A, ALT_B));
      f.altMat.emissiveIntensity = lerp(1.6, .06, closed) + .2 * Math.sin(t * 3 + i) * idle * here * (1 - closed);
      f.altBaseMat.emissiveIntensity = .1 + .12 * here;
      const altUp = springy(lin(cu, ALT_A + .06, ALT_A + .14)) * (1 - past);
      f.altPlate.group.scale.set(1, Math.max(.001, altUp), 1); f.altPlate.group.visible = altUp > .002;
      f.altPlate.frameMat.emissiveIntensity = lerp(1.4, .3, closed) + flash(cu, ALT_A + .14, .12) * 2;
      f.altPlate.label.material.opacity = lerp(1, .55, closed);
      const drop = lin(cu, BAR_A, BAR_A + .09), dropped = drop >= 1 ? 1 : easeIn(drop, 2);
      f.bar.visible = cu > BAR_A; f.bar.position.y = (1 - dropped) * .9 + wobble(cu, BAR_A + .09, .1, 1.5) * .06;
      f.barMat.emissiveIntensity = 1 + flash(cu, BAR_A + .09, .1) * 3;
      // the branch taken: its plate lies in front, with the colour of the outcome
      const takeUp = springy(lin(cu, HIT, HIT + .1)) * (1 - past);
      f.takePlate.group.scale.set(1, Math.max(.001, takeUp), 1); f.takePlate.group.visible = takeUp > .002;
      f.takePlate.frameMat.emissiveIntensity = 1.1 + flash(cu, HIT + .08, .15) * 2.5 + (f.warn ? .25 * Math.sin(t * 2.4) * idle : 0);
      // the junction and its name
      const settled = smooth(lin(cu, HIT, HIT + .04));
      f.nodeMat.color.copy(cCyan).lerp(f.warn ? cWarn : cMet, settled); f.nodeMat.emissive.copy(f.nodeMat.color);
      f.nodeMat.emissiveIntensity = .6 + here * (.8 + .3 * Math.sin(t * 4) * idle) * (1 - settled) + flash(cu, HIT, .12) * 3;
      const shown = Math.max(1 - smooth(lin(real, .05, .068)), smooth(lin(real, C_A + (i - 1) * C_W - .012, C_A + (i - 1) * C_W)));
      f.name.material.opacity = (.6 + .4 * here) * shown * (1 - smooth(lin(cu, HIT - .04, HIT))); f.name.visible = f.name.material.opacity > .01;
      // the medallion: fired from the harness onto the junction; later it flies to the book's front page
      const c = f.coin, fl = (cu - FIRE) / (HIT - FIRE), toPage = lin(real, .802 + i * .007, .826 + i * .007);
      c.g.visible = cu > FIRE && shut < .7; c.ring.visible = false;
      if (c.g.visible) {
        if (fl < 1) {
          const k = smooth(fl);
          c.g.position.lerpVectors(muzzle, f.at, k); c.g.position.y += Math.sin(k * Math.PI) * .9;
          c.g.rotation.set((1 - k) * Math.PI * 4, 0, 0); c.g.scale.setScalar(COIN_J);
          c.inlay.material.color.setRGB(.2, .24, .34);
        } else {
          const col = OUT[f.out], hitC = here ? flash(u, HIT, .1) : 0, landP = flash(real, .826 + i * .007, .012);
          coinPulse = Math.max(coinPulse, hitC, landP);
          const k = smooth(toPage), s = lerp(COIN_J, COIN_S, k);
          c.g.position.lerpVectors(f.at, f.slot, k); c.g.position.y += Math.sin(k * Math.PI) * (1.6 + i * .12);
          c.g.rotation.set(k < 1 ? k * TAU * 2 : 0, 0, 0);
          c.g.scale.set(s * (1 + hitC * .2), s * (1 - hitC * .45) * lerp(1, .15, coinPress), s * (1 + hitC * .2));
          c.inlay.material.color.setRGB(col[0], col[1], col[2]).multiplyScalar(1 + (hitC + landP) * FLASH[f.out] + (i === NC - 1 ? bump(real, TOL_A, .1) * 1.5 : 0));
          if (hitC > .01) { c.ring.visible = true; c.ring.scale.setScalar(.3 + (1 - hitC) * 1.0); c.ring.material.opacity = hitC; c.ring.material.color.setRGB(Math.max(col[0], .4), Math.max(col[1], .4), Math.max(col[2], .45)); }
        }
      }
      if (here) { scan = Math.sin(lin(u, ALT_A + .08, FIRE - .02) * Math.PI); look = u > FIRE - .03 ? 2 : u > ALT_A + .04 ? 1 : 0; }
    }
    muzzleFlare.position.copy(muzzle); muzzleFlare.material.opacity = inA ? flash(u, FIRE, .1) : 0;

    /* what failed, first: the tolerance plate rises over the fifth fork */
    const tolUp = springy(lin(real, TOL_A, TOL_A + .014)) * (1 - smooth(lin(real, BACK_A, BACK_A + .02))), tolDim = 1 - .5 * smooth(lin(real, BACK_A, BACK_B));
    tol.visible = tolUp > .002; tol.scale.setScalar(Math.max(.001, tolUp)); tol.position.y = 2.0 + Math.sin(t * 1.3) * .03 * idle;
    tolPlate.frameMat.emissiveIntensity = (1.3 + flash(real, TOL_A + .012, .03) * 3 + .3 * Math.sin(t * 2.6) * idle) * tolDim;
    tolStem.visible = tolUp > .5; tolStem.material.opacity = .5 * tolDim; tolStem.scale.y = 1.66; tolStem.position.y = .9;

    /* second: the empty frame where the authors' script would be; pings go out and nothing comes back */
    const frameUp = springy(lin(real, FRAME_A - .012, FRAME_A + .004)) * (1 - smooth(lin(real, RULE_A - .004, RULE_A + .01)));
    miss.visible = frameUp > .002; miss.scale.set(1, Math.max(.001, frameUp), 1);
    missMat.emissiveIntensity = .7 + .3 * Math.sin(t * 3) * idle + flash(real, STAMP, .03) * 2;
    missName.material.opacity = smooth(lin(real, FRAME_A, FRAME_A + .01)) * .85;
    const stamped = lin(real, STAMP, STAMP + .008);
    missStamp.material.opacity = stamped > 0 ? 1 : 0; missStamp.scale.setScalar(1 + (1 - easeOut(stamped, 3)) * 1.2);
    for (let k = 0; k < 3; k++) {
      const g = lin(real, .608 + k * .011, .632 + k * .011), m = pings[k];
      m.visible = g > 0 && g < 1; m.scale.setScalar(.2 + easeOut(g, 2) * 1.7); m.material.opacity = (1 - g) * (1 - g) * .8;
    }
    rests.material.opacity = smooth(lin(real, STAMP + .008, STAMP + .02)) * (1 - smooth(lin(real, RULE_A - .004, RULE_A + .01)));

    /* third: the time rule. The robot's place on it is the time that has passed */
    const ruleUp = smooth(lin(real, RULE_A, RULE_A + .014));
    rule.visible = ruleUp > .002; rule.scale.set(1, Math.max(.001, ruleUp), 1);
    const ran = real < RUN.toStood[0] ? 0 : real < RUN.toStood[1] ? RULE.stood * smooth(lin(real, ...RUN.toStood)) : real < RUN.toStall[0] ? RULE.stood
      : real < RUN.toStall[1] ? lerp(RULE.stood, RULE.stall[0], smooth(lin(real, ...RUN.toStall))) : real < RUN.interrupt ? lerp(RULE.stall[0], RULE.stall[1], lin(real, RUN.toStall[1], RUN.interrupt))
        : lerp(RULE.stall[1], RULE.total, smooth(lin(real, ...RUN.toEnd)));
    span(fillTeal, 0, Math.min(ran, RULE.stood)); span(fillAmber, RULE.stood, Math.max(RULE.stood, ran)); span(fillRed, RULE.stall[0], Math.max(RULE.stall[0], Math.min(ran, RULE.stall[1])));
    const stood = springy(lin(real, RUN.toStood[1] - .003, RUN.toStood[1] + .006)), stalled = real > RUN.toStall[1] - .002 && real < RUN.interrupt ? 1 : 0;
    flag.visible = stood > .002; flag.scale.set(1, Math.max(.001, stood), 1); flagMat.emissiveIntensity = 1.1 + flash(real, RUN.toStood[1], .02) * 3;
    stoodLabel.material.opacity = smooth(lin(real, RUN.toStood[1], RUN.toStood[1] + .008));
    searchLabel.material.opacity = smooth(lin(real, RUN.toStall[0] + .004, RUN.toStall[0] + .014));
    stallLabel.material.opacity = smooth(lin(real, RUN.toStall[1] - .002, RUN.toStall[1] + .006));
    fillRed.m.emissiveIntensity = 1.3 + stalled * (.8 + .8 * Math.sin(t * 9) * idle);
    spinner.visible = stalled > 0; spinner.rotation.z = -t * 5 * idle - real * 400;
    const written = smooth(lin(real, RUN.toEnd[1] - .002, RUN.toEnd[1] + .006));
    fileMat.emissiveIntensity = written * (1.1 + flash(real, RUN.toEnd[1], .02) * 2.5); fileMat.color.setHex(0x26324d).lerp(cTmp.setHex(0xdff5e8), written);
    files.forEach((m, k) => { m.position.y = .17 + bump(real, RUN.toEnd[1] - .002 + k * .003, .012) * .12; });
    filesLabel.material.opacity = written;

    /* the lit route as light: it lifts off the table, hangs over the book and pours into the page */
    for (let i = 0; i < NL; i++) {
      const q = i * 3, x = lerp(NODE_X[0], NODE_X[6], i / (NL - 1));
      const k1 = smooth(lin(real, LEAVE_A + i * .0003, LEAVE_B + .012 + i * .0003)), k2 = smooth(lin(lp, .54 + i / NL * .02, .6 + i / NL * .02));
      if (k1 <= 0 || k2 >= 1) { light.col[q] = light.col[q + 1] = light.col[q + 2] = 0; continue; }
      const a = i / NL * TAU * 1.5 + t * .35 * idle, hx = Math.cos(a) * (1.9 + .3 * Math.sin(i)), hz = REST.z + Math.sin(a) * 1.5, hy = 2.5 + .35 * Math.sin(i * 1.7 + t * idle);
      const px = lerp(x, hx, k1), py = lerp(.08, hy, k1), pz = lerp(zR(x), hz, k1);
      light.pos[q] = lerp(px, centre.x + (px - centre.x) * .12, k2); light.pos[q + 1] = lerp(py, centre.y, k2) + Math.sin(k2 * Math.PI) * .5; light.pos[q + 2] = lerp(pz, centre.z + (pz - centre.z) * .12, k2);
      const fade = Math.min(1, k1 * 3) * (1 - k2 * k2) * (.8 + .2 * Math.sin(t * 2 + i) * idle);
      light.col[q] = lightCol.r * fade; light.col[q + 1] = lightCol.g * fade; light.col[q + 2] = lightCol.b * fade;
    }
    light.done();

    /* the robot: where it stands, which way it faces, what it looks at */
    botAt(real);
    let attention = 0;
    aim.set(walk.x + 2.5, .7, walk.z + .6);
    let stand = 1.05;                                   // at rest it faces along the route, half towards the reader
    if (inA) {
      const f = forks[cur];
      if (look === 1) { aim.copy(f.altAt); stand = 2.1; } else if (look === 2) { aim.copy(f.takeAt); stand = .95; }
    } else if (real >= C_A + NC * C_W && real < BACK_A) { aim.set(tol.position.x, tol.position.y, tol.position.z); stand = .5; }
    else if (real >= BACK_A && real < RULE_A) { aim.set(MISS.x, .7, MISS.z); stand = Math.atan2(MISS.x - walk.x, MISS.z - walk.z) + .6; }
    else if (real >= RULE_A && real < LEAVE_A) {
      stand = stalled ? 1.2 : .5;
      if (real < RUN.toStall[0]) aim.set(ruleX(RULE.stood), .6, RULE.z); else if (real < RUN.interrupt + .004) aim.set(stallAt, .62, RULE.z); else aim.set(RULE.x1 + .3, .2, RULE.z);
    }
    if (real >= LEAVE_A) aim.copy(centre);

    /* the medallion */
    for (let k = 0; k < flyers.length; k++) {
      const tok = flyers[k], { tk, root, pivot, body } = tok, f = (lp - tk.s) / DUR;
      root.visible = f > 0 && shut < .7;
      idles[k] = 0;
      if (!root.visible) continue;
      let sy = 1, sxz = 1;
      if (f < 1) {
        // arc in, hang (rising a touch: the anticipation), then drop under gravity
        if (f < .78) bez(root.position, tok.p, travel(f));
        else root.position.copy(tok.p[3]);
        if (f >= .78 && f < .88) root.position.y += Math.sin(lin(f, .78, .88) * Math.PI / 2) * .1;
        if (f >= .88) { const d = lin(f, .88, 1); root.position.y = lerp(PAGE + HOVER + .1, PAGE, easeIn(d, 2.2)); sy = 1 + .16 * d; sxz = 1 - .07 * d; }
        const left = 1 - smooth(f / .86);   // how much of the tumble is still to unwind
        body.rotation.set(tk.spin[0] * TAU * left, tk.yaw + tk.spin[1] * TAU * left, tk.spin[2] * TAU * left);
      } else {
        root.position.copy(tok.land);
        const w = wobble(lp, tok.e, .06, 1.25);
        sy = 1 - .3 * w; sxz = 1 + .14 * w;
        body.rotation.set(0, tk.yaw, 0);
      }
      // idle life once it has settled: the medallion sways
      const idle = smooth(lin(lp, tok.e + .02, tok.e + .07)) * (1 - smooth(lin(lp, .54, .56)));
      body.position.y = tok.centre;
      body.rotation.y += Math.sin(t * .6) * .45 * idle;
      idles[k] = idle;
      // fold back flat (hinged at the foot), then press into the page as the cover comes over
      const fold = smooth(lin(lp, .545 + k * .016, .59 + k * .016)), press = smooth(lin(lp, .6 + k * .01, .655 + k * .01));
      pivot.rotation.x = -Math.PI / 2 * fold;
      sy *= lerp(1, .08, press);
      root.scale.set(sxz, sy, sxz);
      // attention: the robot follows whatever is in the air
      const a = smooth(lin(f, -.15, .1)) * (1 - smooth(lin(f, 1, 1.4)));
      if (a > 0) { attention = Math.max(attention, a); aim.lerp(toSet(seen, root.position), a); }
    }
    const mIdle = idles[0];
    medalGlow.material.opacity = medal.root.visible ? .22 * mIdle + .6 * flash(lp, medal.e, .05) : 0;
    goldMat.emissiveIntensity = .3 + 1.6 * flash(lp, medal.e, .06) + .12 * Math.sin(t * 2.3) * mIdle;
    faceMat.emissiveIntensity = .2 + .9 * flash(lp, medal.e, .06);

    // trails behind the three solid tokens
    for (let k = 0; k < flyers.length; k++) {
      const tok = flyers[k], f = (lp - tok.tk.s) / DUR, show = f > 0 && f < .9 ? 1 - lin(f, .55, .84) : 0;
      for (let j = 0; j < TRAIL; j++) {
        const q = (k * TRAIL + j) * 3, g = f - (j + 1) * .013;
        if (show <= 0 || g <= 0) { trails.col[q] = trails.col[q + 1] = trails.col[q + 2] = 0; continue; }
        bez(v1, tok.p, travel(Math.min(g, .78)));
        trails.pos[q] = v1.x; trails.pos[q + 1] = v1.y + tok.centre * SIZE; trails.pos[q + 2] = v1.z;
        const fade = show * (1 - j / TRAIL) * .85;
        trails.col[q] = tok.color.r * fade; trails.col[q + 1] = tok.color.g * fade; trails.col[q + 2] = tok.color.b * fade;
      }
    }
    trails.done();

    /* the slot lights as the medallion lands, prints it as it folds, then goes under the cover */
    for (let k = 0; k < all.length; k++) {
      const tok = all[k], s = slots[k], landed = lp >= tok.e ? 1 : 0;
      const hitK = flash(lp, tok.e, .06), printK = bump(lp, .56 + k * .014, .1);
      s.m.emissiveIntensity = .35 + landed * .9 + hitK * 4 + printK * 2.5 + Math.sin(t * 2.2 + k) * .12 + (1 - landed) * smooth(lin((lp - tok.tk.s) / DUR, .5, 1)) * 1.4;
      s.ring.visible = shut < .75;
      const wait = 1 - landed, coming = smooth(lin((lp - tok.tk.s) / DUR, .6, 1));
      s.ring.scale.setScalar(1 + hitK * .18 + wait * (Math.sin(t * 2.4 + k * 1.7) * .035 - coming * .12));
      s.print.material.opacity = (hitK * .9 + landed * .16 + printK * .7) * (1 - smooth(lin(shut, .55, .8)));
      s.print.visible = s.print.material.opacity > .005;
      const g = lin(lp, tok.e, tok.e + .065);
      s.shock.visible = g > 0 && g < 1;
      s.shock.scale.setScalar(.2 + easeOut(g, 2.4) * .95);
      s.shock.material.opacity = (1 - g) * (1 - g) * .9;
      // a burst of sparks off the landing
      for (let j = 0; j < 12; j++) {
        const q = (k * 12 + j) * 3, c4 = (k * 12 + j) * 4, gs = lin(lp, tok.e, tok.e + .05);
        if (gs <= 0 || gs >= 1) { sparks.col[c4 + 3] = 0; continue; }
        const ang = (j / 12 + k * .13) * TAU, r = easeOut(gs, 2) * (.55 + (j % 3) * .12);
        sparks.pos[q] = tok.land.x + Math.cos(ang) * r; sparks.pos[q + 1] = PAGE + .04 + Math.sin(gs * Math.PI) * (.28 + (j % 4) * .06); sparks.pos[q + 2] = tok.land.z + Math.sin(ang) * r;
        sparks.col[c4] = tok.color.r * 1.8; sparks.col[c4 + 1] = tok.color.g * 1.8; sparks.col[c4 + 2] = tok.color.b * 1.8; sparks.col[c4 + 3] = 1 - gs * gs;
      }
    }
    sparks.done();

    /* light from the closing gap, the slam and the seam */
    const gap = Math.sin(Math.min(angle, Math.PI / 2)) * PW;
    const leak = smooth(lin(angle, Math.PI * .4, .02)) * (shut < 1 ? 1 : 0);
    for (let i = 0; i < blades.length; i++) {
      const m = blades[i], o = leak * (i ? .55 : .8) + slam * (i ? .7 : 1);
      m.material.opacity = o; m.visible = o > .005;
      m.scale.y = .12 + gap * .55 + slam * .5;
      m.position.y = PAGE + gap * .2;
    }
    coverMat.emissiveIntensity = flash(lp, .69, .045) * .2 + flash(lp, .8, .06) * .08;
    seamMat.emissiveIntensity = slam * 6 + smooth(lin(lp, .69, .72)) * (.7 + Math.sin(t * 2) * .15);
    coreGlow.material.opacity = leak * .45 + slam * .8; coreGlow.visible = coreGlow.material.opacity > .005;

    /* the book: slam squash, then the tabs, the thread, the rise and the turn */
    const crouch = bump(lp, .775, .03);
    book.scale.set(1 + .035 * hit + .02 * crouch, 1 - .08 * hit - .05 * crouch, 1 + .035 * hit + .02 * crouch);
    for (let i = 0; i < tabs.length; i++) {
      const k = springy(lin(lp, .7 + i * .016, .735 + i * .016));
      tabs[i].scale.set(Math.max(.001, k), 1, 1); tabs[i].visible = k > .002;
      const pop = flash(lp, .712 + i * .016, .05);
      tabMats[i].emissiveIntensity = .3 + pop * 1.5 + k * (.35 + Math.sin(t * 2 + i * .9) * .08);
      tabFlares[i].material.opacity = pop * .6; tabFlares[i].visible = pop > .005;
      const n = springy(lin(lp, .72 + i * .016, .745 + i * .016));
      nodes[i].scale.setScalar(Math.max(.001, n)); nodes[i].visible = n > .01;
      nodeMats[i].emissiveIntensity = 1.1 + pop * 2 + Math.sin(t * 2.4 + i) * .2 * n;
    }
    for (let i = 0; i < links.length; i++) {
      const k = easeOut(lin(lp, .735 + i * .018, .765 + i * .018), 2), l = links[i];
      l.visible = k > .01; l.scale.y = Math.max(.001, k * l.userData.len);
      l.position.lerpVectors(linkA[i], linkB[i], k / 2);
    }
    const thread = smooth(lin(lp, .74, .82));
    threadMat.emissiveIntensity = .9 + flash(lp, .8, .06) * 3 + thread * Math.sin(t * 2.6) * .25;
    sigGlow.material.opacity = thread * (.32 + Math.sin(t * 2) * .06) + flash(lp, .8, .06) * .5; sigGlow.visible = sigGlow.material.opacity > .005;

    const up = smooth(lin(lp, .79, .96)), turn = smooth(lin(lp, .785, .97));
    const bob = Math.sin(t * 1.2) * .05 * up;
    lift.position.set(REST.x, REST.y + up * 1.28 + bob, lerp(REST.z, .55, up));
    spin.rotation.y = 1.42 * turn + Math.sin(t * .4) * .06 * up;
    lean.rotation.set(.3 * turn, 0, Math.sin(t * .8) * .018 * up);
    // the plinth answers: rim flares on the slam and on the signature, the halo and the pool follow the book
    rimMat.emissiveIntensity = 1.1 + Math.sin(t * 2) * .2 + slam * 2.6 + flash(lp, .8, .08) * 1.6 + coinPulse * 2.2;
    innerMat.opacity = .14 + up * .2 + slam * .4;
    halo.position.set(lift.position.x, .02, lift.position.z);
    halo.scale.setScalar((1 + Math.sin(t * 1.6) * .03) * lerp(.7, 1, up));
    haloMat.opacity = up * (.7 + Math.sin(t * 1.6) * .1) * .5;
    halo.visible = up > .01;
    pool.position.set(lift.position.x, .012, lift.position.z);
    poolMat.opacity = (slam * .35 + smooth(lin(lp, .69, .74)) * .12 + up * .22) * .5;
    pool.visible = poolMat.opacity > .005;
    // the slam's puff: gilt dust thrown out of the pages along the plinth
    for (let i = 0; i < PUFF; i++) {
      const q = i * 3, g = lin(lp, .69, .75 + (i % 5) * .006);
      if (g <= 0 || g >= 1) { puff.col[q] = puff.col[q + 1] = puff.col[q + 2] = 0; continue; }
      const ang = (i / PUFF) * TAU + (i % 3) * .21, ex = Math.cos(ang), ez = Math.sin(ang);
      const rx = 1.8 * Math.sign(ex) * Math.min(1, Math.abs(ex) * 1.6), rz = 1.35 * Math.sign(ez) * Math.min(1, Math.abs(ez) * 1.6), out = easeOut(g, 2.6) * (1.1 + (i % 4) * .25);
      puff.pos[q] = REST.x + rx + ex * out; puff.pos[q + 1] = .08 + Math.sin(g * Math.PI) * (.25 + (i % 3) * .1); puff.pos[q + 2] = REST.z + rz + ez * out;
      const fade = (1 - g) * (1 - g) * 1.6;
      puff.col[q] = puffCol.r * fade; puff.col[q + 1] = puffCol.g * fade; puff.col[q + 2] = puffCol.b * fade;
    }
    puff.done();
    const dg = lin(lp, .69, .77);
    dust.visible = dg > 0 && dg < 1; dust.scale.setScalar(1.5 + easeOut(dg, 2.5) * .9); dustMat.opacity = (1 - dg) * (1 - dg) * .8;

    // motes orbit the risen book, climbing slowly, in the five stage colours
    for (let i = 0; i < 64; i++) {
      const q = i * 3;
      if (up <= 0) { motes.col[q] = motes.col[q + 1] = motes.col[q + 2] = 0; continue; }
      const seed = moteSeed[i], a = seed[0], b = seed[1], c = seed[2], vis = up * (.5 + .5 * Math.sin(t * 1.3 + i));
      const ang = a * TAU + t * (.22 + b * .2) * (i % 2 ? 1 : -1), r = 1.9 + b * 1.1, y = ((c + t * .05 * (.5 + a)) % 1) * 2.6;
      motes.pos[q] = lift.position.x + Math.cos(ang) * r; motes.pos[q + 1] = .1 + y; motes.pos[q + 2] = lift.position.z + Math.sin(ang) * r * .8;
      const fade = vis * Math.sin(Math.PI * Math.min(1, y / 2.6)) * 1.1;
      motes.col[q] = moteCol[i].r * fade; motes.col[q + 1] = moteCol[i].g * fade; motes.col[q + 2] = moteCol[i].b * fade;
    }
    motes.done();

    /* the book forms where the route was: it swells out of a pool of light before the medallions arrive */
    const bookIn = lin(real, LEAVE_A + .012, LEAVE_B + .016);
    lift.visible = bookIn > 0;
    lift.scale.setScalar(Math.max(.001, springy(bookIn)));
    poolMat.opacity += flash(real, LEAVE_A + .012, .05) * .5; pool.visible = poolMat.opacity > .005;

    /* the robot again: it walks, turns, reads, fires; startles at the slam, cheers the signature, looks up at the book */
    bot.update(t, 0);
    if (up > 0) aim.lerp(lift.position, up);
    const bx = walk.x, bz = walk.z, ending = smooth(lin(real, LEAVE_B, LEAVE_B + .02));
    const faced = Math.atan2(aim.x - bx, aim.z - bz);
    if (lp >= .54) stand = faced; else if (ending > 0) stand = turnTo(stand, Math.max(-1.75, Math.min(-.7, faced)), ending);
    const yaw = turnTo(stand, walk.heading, Math.min(1, walk.moving * 1.6));
    bot.root.rotation.y = yaw;
    let rel = faced - yaw; rel -= Math.round(rel / TAU) * TAU;
    const reach = Math.hypot(aim.x - bx, aim.z - bz);
    bot.head.rotation.y = Math.max(-1.25, Math.min(1.25, rel)) * (1 - Math.min(1, walk.moving * 1.4)) + Math.sin(real * 900) * .25 * bump(real, STAMP + .004, .02);
    bot.head.rotation.x = -Math.max(-.3, Math.min(.75, Math.atan2(aim.y - .9, reach) * 1.2));
    const cheer = bump(lp, .8, .09) + bump(real, RUN.toEnd[1] + .001, .012) * .6;
    for (let k = 0; k < botArms.length; k++) { botArms[k].rotation.z = (k ? 1 : -1) * (.1 + 2.35 * cheer + .15 * slam); botArms[k].rotation.x -= .4 * cheer; }
    let hop = slam * .16 + bump(lp, .805, .03) * .2 + bump(lp, .845, .03) * .14 + bump(real, RUN.interrupt, .008) * .22 + (inA ? bump(u, FIRE - .02, .1) * .07 : 0);
    for (let k = 0; k < all.length; k++) hop += bump(lp, all[k].e, .025) * .06;
    const stride = (walk.x * 1.0 + walk.z * .6) * 9;
    bot.root.position.set(bx, hop + Math.abs(Math.sin(stride)) * .05 * Math.min(1, walk.moving * 1.5), bz);
    // its eyes run along the other branch to the figure it would have led to
    bot.head.getWorldPosition(headAt); set.worldToLocal(headAt); headAt.y += .2;
    eyeBeam.visible = false;
    if (inA && scan > .01) {
      beamDir.subVectors(forks[cur].altAt, headAt); const len = beamDir.length();
      if (len > .001) { eyeBeam.visible = true; eyeBeam.position.copy(headAt); eyeBeam.quaternion.setFromUnitVectors(UP, beamDir.divideScalar(len)); eyeBeam.scale.set(.012, len, .012); eyeBeam.material.opacity = scan * .7; }
    }
  }

  update(0, 0);
  return { camera: { from: shot, to: shot }, update };
}

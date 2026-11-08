/* film-metacase.js — beat 4 of the Metacase film: Metacase. The homepage's Metacase book lies
 * open on its plinth, its spine across the view: the title page at the back, the empty page in
 * front. One token from each earlier beat (a file, the Claude Code weapon, a light ribbon, the
 * score medallion) flies in on its own arc and lands on the front page as a pop-up. The pop-ups
 * fold back flat, the cover lifts, hangs and slams shut towards the viewer, light leaks from the
 * seam, the five fore-edge tabs slide out in turn and the thread draws the solution signature
 * through their tips; then the book rises off the plinth and turns into a hero three-quarter view.
 * Everything is a pure function of lp (scrubbing back plays it backwards); t only adds idle life.
 *   lp .02–.535  the four flights, .105 apart: arc in, hang, drop, squash and settle
 *   lp .545–.67  the pop-ups fold back flat and press into the page, which prints them in light
 *   lp .58–.69   the cover lifts, hangs at the vertical, falls and slams (.69)
 *   lp .69–.82   seam flash and dust ring; the tabs slide out in turn; the thread draws through them
 *   lp .775–.97  the book crouches, rises and turns; halo and motes come up; the camera settles low */
const TAU = Math.PI * 2;
const lin = (x, a, b) => Math.min(1, Math.max(0, (x - a) / (b - a)));
const easeOut = (x, k = 3) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), k);
const easeIn = (x, k = 2) => Math.pow(Math.min(1, Math.max(0, x)), k);
const springy = x => { const p = Math.min(1, Math.max(0, x)) - 1; return 1 + 2.6 * p * p * p + 1.6 * p * p; }; // passes 1, settles
const bump = (x, a, w) => { const u = (x - a) / w; return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI); };
const flash = (x, a, w) => { const u = (x - a) / w; return u < 0 || u >= 1 ? 0 : (1 - u) * (1 - u); };
// a decaying wobble after an impact at a: 1 at the hit, swinging to rest over w
const wobble = (x, a, w, cycles = 1.25) => { const u = (x - a) / w; return u < 0 || u >= 1 ? 0 : Math.cos(u * Math.PI * 2 * cycles) * (1 - u) * (1 - u); };

// The camera line, authored as keys (set coordinates) joined by a C1 Hermite spline in lp: a high
// wide shot that leaves sky for the arrivals, a push onto the pop-ups, then low in front of the
// fore-edge for the slam (the cover falls towards the lens), up as the tabs come out, and round to a
// low hero three-quarter on the risen book.
const KEYS = [
  { at: 0, pos: [-2.2, 7.4, 10.8], look: [.2, .2, .1], fov: 36 },
  { at: .3, pos: [-1.6, 6.3, 9.6], look: [.15, .3, .5], fov: 34 },
  { at: .55, pos: [-.7, 5.0, 8.9], look: [0, .4, .9], fov: 33 },
  { at: .66, pos: [0, 1.6, 7.5], look: [0, .6, 0], fov: 32 },
  { at: .72, pos: [0, 1.6, 7.6], look: [0, .6, 0], fov: 32 },
  { at: .8, pos: [.1, 2.8, 9.6], look: [-.5, .7, 1.2], fov: 31 },
  { at: .95, pos: [5.2, 2.6, 9.6], look: [.3, 1.45, .5], fov: 30 },
  { at: 1, pos: [5.05, 2.55, 9.3], look: [.3, 1.45, .5], fov: 30 },
];

// The four tokens, each from one earlier beat: where it lands on the front page and where its
// arc starts and bends (set coordinates), when it leaves (s) and how it tumbles on the way.
const DUR = .2, HOVER = 1.2, SIZE = 1.3;
const TOKENS = [
  { key: 'file', color: 0x45b5b0, land: [-.95, .98], from: [-3.5, 9.5, -8], bend: [-2.5, 9, -3], s: .02, spin: [2.2, 1.6, .6], yaw: .12 },
  { key: 'weapon', color: 0xf2b545, land: [.72, .9], from: [6.5, 8.5, -7], bend: [4, 8, -2.5], s: .125, spin: [.5, 2.4, 1.2], yaw: -.08 },
  { key: 'ribbon', color: 0x9d8cff, land: [-.55, 1.98], from: [.5, 10.5, -9], bend: [-.5, 8.5, -3.5], s: .23 },
  { key: 'medal', color: 0xf2b545, land: [.95, 1.95], from: [9, 5.5, -3], bend: [5, 6.5, -.5], s: .335, spin: [1.4, 3.2, .2], yaw: -.15 },
];
const SIG = 0;

export async function build(ctx) {
  const { THREE, kit, set, accent, loadWeapons, reduce, hand, util } = ctx;
  const { PALETTE, BOOK, BOOK_CENTRE, STAGE_COLORS, add, cyl, rbox, mat, glowMat, closedBook, bookTabs, robot } = kit;
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

  /* ---- the plinth: dark navy with a glowing rim, top at y = 0 ---- */
  cyl(set, 3.55, 3.7, .32, 0x1c2740, 0, -.32, 0, 72);
  cyl(set, 3.71, 3.45, .5, 0x111a2d, 0, -.82, 0, 72);
  const rimMat = glowMat(accent, 1.1).clone();
  const rim = add(set, new THREE.TorusGeometry(3.62, .026, 8, 160), rimMat, 0, .005, 0, false); rim.rotation.x = Math.PI / 2;
  const innerMat = additive(accent, .16, null);
  const inner = add(set, new THREE.TorusGeometry(3.0, .008, 4, 160), innerMat, 0, .004, 0, false); inner.rotation.x = Math.PI / 2;
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
    g.fillStyle = '#2c5468'; g.font = '700 58px "Space Mono", ui-monospace, monospace'; g.fillText('FIN-T1-003', W / 2, 292);
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

  /* ---- the front page: four slots, one per token, that light as their token lands ---- */
  const landAt = tk => toBook(new THREE.Vector3(), tk.land[0], PAGE, tk.land[1]);
  const slots = TOKENS.map(tk => {
    const at = landAt(tk), m = new THREE.MeshStandardMaterial({ color: tk.color, emissive: tk.color, emissiveIntensity: .35, roughness: .5 });
    const ring = add(book, new THREE.TorusGeometry(.5, .016, 6, 72), m, at.x, PAGE + .004, at.z, false); ring.rotation.x = Math.PI / 2; ring.receiveShadow = false;
    const print = add(book, new THREE.PlaneGeometry(1.5, 1.5), additive(tk.color, 0), at.x, PAGE + .006, at.z, false); print.rotation.x = -Math.PI / 2; print.receiveShadow = false;
    const shockMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(tk.color).multiplyScalar(1.6), transparent: true, opacity: 0, depthWrite: false, fog: false });
    const shock = add(book, new THREE.RingGeometry(.9, 1, 72), shockMat, at.x, PAGE + .008, at.z, false); shock.rotation.x = -Math.PI / 2; shock.receiveShadow = false;
    return { m, ring, print, shock };
  });

  /* ---- the tokens ---- */
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

  // 1 · a file: three sheets, stacked in flight, fanned on the page
  const file = token(TOKENS[0], .36);
  const docTex = tag => canvasTexture(256, 336, (g, W) => {
    g.fillStyle = '#fbf8f1'; g.beginPath(); g.roundRect(0, 0, W, 336, 18); g.fill();
    g.fillStyle = hex(TOKENS[0].color); g.beginPath(); g.roundRect(0, 0, W, 70, [18, 18, 0, 0]); g.fill();
    g.fillStyle = '#ffffff'; g.font = '700 34px "Space Mono", ui-monospace, monospace'; g.textBaseline = 'middle'; g.fillText(tag, 22, 37);
    g.fillStyle = '#d9d0bd'; for (let k = 0; k < 7; k++) g.fillRect(22, 104 + k * 30, (W - 44) * (k % 3 === 2 ? .55 : 1), 10);
  });
  const sheets = ['DOCX', 'CSV', 'PDF'].map((tag, k) => {
    const foot = new THREE.Group(); foot.position.set(0, -.34, -k * .035); file.body.add(foot);
    add(foot, rbox(.5, .68, .022, .02), mat(0xfbf8f1), 0, .34, 0);
    const face = add(foot, new THREE.PlaneGeometry(.47, .63), new THREE.MeshStandardMaterial({ map: docTex(tag), roughness: .7 }), 0, .34, .0125, false); face.receiveShadow = false;
    return foot;
  });

  // 2 · the weapon: the arena's Claude Code blaster (the kit's blaster if the models can't load)
  const weapon = token(TOKENS[1], .48);
  let gun;
  try {
    const { weapons } = await loadWeapons();
    gun = (weapons[hand.armed?.weaponIndex] || weapons[2]).clone(true); // never the shared original
  } catch { gun = kit.blaster(PALETTE.amber); }
  gun.scale.setScalar(.95); gun.rotation.y = Math.PI / 2; weapon.body.add(gun);
  gun.traverse(o => { if (o.isMesh) o.castShadow = true; });
  const gunGlow = sprite(PALETTE.amber, 1.6); weapon.body.add(gunGlow);

  // 3 · a light ribbon: one tube from the sky to the page that ends in the run's line, rising
  // like the context did, with a red dip where the script crashed and the climb after the fix
  const rib = TOKENS[2], ribRoot = new THREE.Group(); ribRoot.position.copy(landAt(rib)); ribRoot.rotation.set(0, Math.PI / 2, 0, 'YXZ'); book.add(ribRoot);
  const ribSet = new THREE.Vector3(rib.land[0], PAGE, rib.land[1]);   // its root, in set coordinates (its own axes are the set's)
  const SQ = [.07, .15, .21, .3, .35, .42, .1, .3, .43, .52, .63, .7];
  const squiggle = SQ.map((y, i) => new THREE.Vector3((-.44 + i * .88 / (SQ.length - 1)) * SIZE, (y + .03) * SIZE, 0));
  const ribArc = new THREE.CubicBezierCurve3(new THREE.Vector3(...rib.from).sub(ribSet), new THREE.Vector3(...rib.bend).sub(ribSet), squiggle[0].clone().add(new THREE.Vector3(-.6, 2.4, -.9)), squiggle[0].clone());
  const ribPath = new THREE.CurvePath(); ribPath.add(ribArc); ribPath.add(new THREE.CatmullRomCurve3(squiggle, false, 'catmullrom', .15));
  const RS = 360, RR = 6, ribLens = ribPath.getCurveLengths(), ARC = ribLens[0] / ribLens[1];
  const ribGeo = new THREE.TubeGeometry(ribPath, RS, .032, RR, false);
  {
    const n = ribGeo.attributes.position.count, colors = new Float32Array(n * 3), c = new THREE.Color(), violet = new THREE.Color(rib.color), red = new THREE.Color(0xff4d5e), pale = new THREE.Color(0xe7e0ff);
    for (let j = 0; j <= RS; j++) for (let i = 0; i <= RR; i++) {
      const v = j * (RR + 1) + i, u = j / RS, x = ribGeo.attributes.position.getX(v);
      if (u < ARC) c.copy(pale).lerp(violet, u / ARC);
      else c.copy(x > -.08 && x < .13 ? red : violet);
      colors.set([c.r, c.g, c.b], v * 3);
    }
    ribGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }
  const flowTex = canvasTexture(256, 4, (g, W, H) => {
    const grad = g.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgb(120,120,120)'); grad.addColorStop(.42, 'rgb(150,150,150)'); grad.addColorStop(.5, 'rgb(255,255,255)'); grad.addColorStop(.62, 'rgb(150,150,150)'); grad.addColorStop(1, 'rgb(120,120,120)');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
  });
  flowTex.wrapS = THREE.RepeatWrapping; flowTex.repeat.x = 60; flowTex.colorSpace = THREE.NoColorSpace;
  const ribMat = new THREE.MeshBasicMaterial({ vertexColors: true, map: flowTex, fog: false });
  ribMat.color.setScalar(1.9);
  const ribbon = new THREE.Mesh(ribGeo, ribMat); ribbon.frustumCulled = false; ribbon.renderOrder = 2; ribRoot.add(ribbon);
  const RLUT = 480, ribLut = new Float32Array((RLUT + 1) * 3);
  { const v = new THREE.Vector3(); for (let i = 0; i <= RLUT; i++) { ribPath.getPointAt(i / RLUT, v); ribLut.set([v.x, v.y, v.z], i * 3); } }
  const ribHead = sprite(0xe9e3ff, .36); ribRoot.add(ribHead);
  const ribAt = (out, u) => { const x = Math.min(RLUT, Math.max(0, u * RLUT)), i = Math.min(RLUT - 1, Math.floor(x)), f = x - i, a = i * 3, b = a + 3; return out.set(lerp(ribLut[a], ribLut[b], f), lerp(ribLut[a + 1], ribLut[b + 1], f), lerp(ribLut[a + 2], ribLut[b + 2], f)); };
  const ribbonToken = { tk: rib, e: rib.s + DUR, color: new THREE.Color(rib.color), land: landAt(rib) };

  // 4 · the score medallion: 0.333 in the middle, a ring of 27 ticks for the 27 checks
  const medal = token(TOKENS[3], .38);
  const medalTex = canvasTexture(512, 512, (g, W) => {
    const c = W / 2;
    g.fillStyle = '#f2b545'; g.beginPath(); g.arc(c, c, c, 0, TAU); g.fill();
    g.fillStyle = '#ffd77a'; g.beginPath(); g.arc(c, c, c - 22, 0, TAU); g.fill();
    g.lineCap = 'round'; g.lineWidth = 10;
    for (let i = 0; i < 27; i++) {
      const a = -Math.PI / 2 + (i + .5) / 27 * TAU;
      g.strokeStyle = i < 3 ? '#1f6f6a' : i < 9 ? '#b06a12' : 'rgba(31,42,58,.22)';
      g.beginPath(); g.moveTo(c + Math.cos(a) * 190, c + Math.sin(a) * 190); g.lineTo(c + Math.cos(a) * 218, c + Math.sin(a) * 218); g.stroke();
    }
    g.fillStyle = '#1f2a3a'; g.font = '800 128px Inter, Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('0.333', c, c + 6);
  });
  const goldMat = mat(0xffcf4a, { emissive: 0xffb020, intensity: .3, rough: .3 }).clone();
  const coin = add(medal.body, new THREE.CylinderGeometry(.36, .36, .07, 56), goldMat); coin.rotation.x = Math.PI / 2;
  const edge = add(medal.body, new THREE.TorusGeometry(.36, .024, 10, 64), goldMat, 0, 0, 0, false); edge.receiveShadow = false;
  const faceMat = new THREE.MeshStandardMaterial({ map: medalTex, emissive: 0xffffff, emissiveMap: medalTex, emissiveIntensity: .2, roughness: .35 });
  [1, -1].forEach(s => { const f = add(medal.body, new THREE.CircleGeometry(.335, 56), faceMat, 0, 0, s * .0365, false); f.rotation.y = s > 0 ? 0 : Math.PI; f.receiveShadow = false; });
  const medalGlow = sprite(0xffd27a, 1.5); medal.body.add(medalGlow);

  const flyers = [file, weapon, medal];
  const TRAIL = 18, trails = cloud(flyers.length * TRAIL, .22, book);
  const sparks = cloud(TOKENS.length * 12, .13, book, true);
  const motes = cloud(64, .12, set);
  const PUFF = 40, puff = cloud(PUFF, .16, set);   // the air the slam pushes out of the pages
  const puffCol = new THREE.Color(0xffd9a6);
  const moteSeed = Array.from({ length: 64 }, (_, i) => [((i * 0.61803) % 1), ((i * 0.3819 + .17) % 1), ((i * 0.7548 + .4) % 1)]);
  const moteCol = moteSeed.map((_, i) => new THREE.Color(STAGE_COLORS[i % 5]));

  /* ---- the robot, the model that ran it, watching from beside the spread ---- */
  const bot = robot(PALETTE.cream, 0x8ff6ff);
  bot.root.scale.setScalar(1.15); bot.root.position.set(1.75, 0, -2.4); set.add(bot.root);
  const botArms = bot.root.children[0].children.filter(c => c.isGroup && c !== bot.head);

  /* ---- the camera line ---- */
  const shot = { pos: [0, 0, 0], look: [0, 0, 0], fov: 34 };
  const kv = KEYS.map(k => [...k.pos, ...k.look, k.fov]), kt = KEYS.map(k => k.at);
  const km = kv.map((v, i) => v.map((_, c) => (i === 0 || i === kv.length - 1 ? 0 : (kv[i + 1][c] - kv[i - 1][c]) / (kt[i + 1] - kt[i - 1]))));
  function pose(lp) {
    let i = 0; while (i < kt.length - 2 && lp > kt[i + 1]) i++;
    const h = kt[i + 1] - kt[i], s = Math.min(1, Math.max(0, (lp - kt[i]) / h)), s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    const a = kv[i], b = kv[i + 1], ma = km[i], mb = km[i + 1];
    for (let c = 0; c < 7; c++) {
      const v = h00 * a[c] + h10 * h * ma[c] + h01 * b[c] + h11 * h * mb[c];
      if (c < 3) shot.pos[c] = v; else if (c < 6) shot.look[c - 3] = v; else shot.fov = v;
    }
  }

  const all = [file, weapon, ribbonToken, medal], idles = [0, 0, 0];
  const v1 = new THREE.Vector3(), aim = new THREE.Vector3(), seen = new THREE.Vector3();
  const centre = new THREE.Vector3(REST.x, PAGE + .2, REST.z), sky = new THREE.Vector3(-3, 6.5, 0);

  function update(lp, t) {
    if (reduce) { lp = 1; t = 0; }
    pose(lp);
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

    /* the tokens */
    let attention = 0; aim.lerpVectors(sky, centre, smooth(lin(lp, .45, .56)));
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
      // idle life once it has settled: the sheets breathe, the weapon hovers and turns, the medallion sways
      const idle = smooth(lin(lp, tok.e + .02, tok.e + .07)) * (1 - smooth(lin(lp, .54, .56)));
      body.position.y = tok.centre;
      if (k === 0) body.position.y += Math.sin(t * 1.3 + 1) * .02 * idle;
      if (k === 1) { body.position.y += (Math.sin(t * 1.6) * .045 + .06) * idle; body.rotation.y += Math.sin(t * .7) * .4 * idle; }
      if (k === 2) body.rotation.y += Math.sin(t * .6) * .45 * idle;
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
    // the file's sheets fan out once it lands, and the top one riffles while it waits
    const fan = file.root.visible ? springy(lin(lp, file.e + .004, file.e + .05)) * (1 - smooth(lin(lp, .54, .56))) : 0;
    for (let j = 0; j < sheets.length; j++) { const s = sheets[j]; s.rotation.z = (1 - j) * .3 * fan; s.position.x = (1 - j) * .07 * fan; s.rotation.x = -.08 * fan + (j === 0 ? Math.sin(t * 1.7) * .03 * fan : 0); }
    const wIdle = idles[1], mIdle = idles[2];
    gunGlow.material.opacity = weapon.root.visible ? .22 * wIdle + .5 * flash(lp, weapon.e, .05) + .25 * (1 - smooth(lin((lp - TOKENS[1].s) / DUR, 0, .3))) : 0;
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

    /* the ribbon: a window slides along the tube, so it streaks across the sky and then writes its line */
    {
      const f = (lp - rib.s) / DUR;
      const head = f <= 0 ? 0 : f < .6 ? ARC * easeOut(f / .6, 1.6) : ARC + (1 - ARC) * easeOut(lin(f, .6, 1), 1.4);
      const tail = Math.max(0, head - (1 - ARC));
      const a = Math.floor(tail * RS), b = Math.min(RS, Math.ceil(head * RS));
      ribbon.visible = f > 0 && b > a && shut < .7;
      ribGeo.setDrawRange(a * RR * 6, (b - a) * RR * 6);
      ribAt(ribHead.position, head);
      ribHead.material.opacity = f > 0 && f < 1.2 ? (1 - lin(f, 1, 1.2)) * .95 : 0;
      ribHead.visible = ribHead.material.opacity > .01;
      flowTex.offset.x = -t * .35 - lp * 6;
      const fold = smooth(lin(lp, .56, .605)), press = smooth(lin(lp, .62, .66));
      ribRoot.rotation.x = -Math.PI / 2 * fold; ribRoot.scale.y = lerp(1, .1, press);
      const att = f > 0 ? smooth(lin(f, -.1, .1)) * (1 - smooth(lin(f, 1, 1.15))) : 0;
      if (att > 0) { attention = Math.max(attention, att); aim.lerp(ribAt(seen, head).add(ribSet), att); }
    }

    /* the slots light as their token lands, print it as it folds, then go under the cover */
    for (let k = 0; k < 4; k++) {
      const tok = all[k], s = slots[k], landed = lp >= tok.e ? 1 : 0;
      const hitK = flash(lp, tok.e, .06), printK = bump(lp, .56 + k * .014, .1);
      s.m.emissiveIntensity = .35 + landed * .9 + hitK * 4 + printK * 2.5 + Math.sin(t * 2.2 + k) * .12 + (1 - landed) * smooth(lin((lp - tok.tk.s) / DUR, .5, 1)) * 1.4;
      s.ring.visible = shut < .75;
      const wait = 1 - landed, coming = smooth(lin((lp - tok.tk.s) / DUR, .6, 1));
      s.ring.scale.setScalar(1 + hitK * .18 + wait * (Math.sin(t * 2.4 + k * 1.7) * .035 - coming * .12));
      s.print.material.opacity = (hitK * .9 + landed * .16 + printK * .7) * (k === 2 ? .5 : 1) * (1 - smooth(lin(shut, .55, .8)));
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
    rimMat.emissiveIntensity = 1.1 + Math.sin(t * 2) * .2 + slam * 2.6 + flash(lp, .8, .08) * 1.6;
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

    /* the robot: watches each arrival, startles at the slam, cheers the signature, looks up at the book */
    bot.update(t, 0);
    if (up > 0) aim.lerp(lift.position, up);
    const bx = bot.root.position.x, bz = bot.root.position.z;
    bot.root.rotation.y = Math.atan2(aim.x - bx, aim.z - bz);
    const reach = Math.hypot(aim.x - bx, aim.z - bz);
    bot.head.rotation.x = -Math.max(-.25, Math.min(.75, Math.atan2(aim.y - .9, reach) * 1.4));
    const cheer = bump(lp, .8, .09);
    for (let k = 0; k < botArms.length; k++) { botArms[k].rotation.z = (k ? 1 : -1) * (.1 + 2.35 * cheer + .15 * slam); botArms[k].rotation.x -= .4 * cheer; }
    let hop = slam * .16 + bump(lp, .805, .03) * .2 + bump(lp, .845, .03) * .14;
    for (let k = 0; k < 4; k++) hop += bump(lp, all[k].e, .025) * .06;
    bot.root.position.y = hop;
  }

  update(0, 0);
  return { camera: { from: shot, to: shot }, update };
}

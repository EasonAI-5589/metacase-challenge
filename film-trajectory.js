/* film-trajectory.js — beat 2 of the Metacase film: Trajectory.
 * The armed robot works the task beside a low desk. Every model request pings out of its head;
 * every tool call leaves the harness's muzzle as a ribbon of light, pulls a file out of the
 * container's stacks and comes back, and leaves a thread behind, so the run draws its own
 * trajectory over the set. The context rises beside it as a tower of rings, 27k to 100k tokens.
 * Then a script dies on a NameError: the set shakes, the eye, the terminal, the threads and the
 * half-written sheet go red and the sheet cracks. The agent reads its files back, the fix sweeps
 * the set cool from the floor up, the sheet snaps together and four more sheets fly out of the
 * muzzle onto it: the workbook's five.
 *
 * lp timeline   0–.06 establish · .06–.41 reading (R1–R13, files pulled and lit) · .41–.49
 *               writing (terminal, sheet one rises) · .48–.52 the run (charge, lean in) · .52
 *               crash, shake to .58 · .62–.70 read-back (the error stays red) · .70–.757 the
 *               cool sweep, floor to top · .716 re-form · .736–.77 four sheets land · .77–.79
 *               the workbook lights · .75–.826 checking, R28, 54 calls, 100k · .80 the robot
 *               turns to camera · .82–1 the framework dollies on.
 * Everything is a function of lp; t only adds idle life (breathing, shimmer, flowing threads). */
export async function build({ THREE, kit, set, accent, loadWeapons, hand, util, camera, reduce, labelTexture, layout }) {
  const { PALETTE, GUN_HOLD, add, cyl, block, rbox, mat, glowMat } = kit;
  const { clamp, smooth, ramp, lerp, glowSprite } = util;
  const expoOut = x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
  const inOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const back = (x, s = 1.9) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
  // up fast, down slow: 0 before a, 1 at peak, 0 again at b
  const bump = (x, a, peak, b) => (x <= a || x >= b ? 0 : x < peak ? expoOut((x - a) / (peak - a)) : 1 - smooth((x - peak) / (b - peak)));
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const C = hex => new THREE.Color(hex);
  const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
  const additive = (color, opacity = 1, extra = {}) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, ...extra });

  const COL = {
    call: C(0xb9a9ff), result: C(0x8ff6ff), plan: C(0xf2b545), run: C(0xfff2f0), probe: C(0xe8f6ff), carry: C(0xa8f5c8), binary: C(0xbfc6d4),
    red: C(0xff2a3d), cool: C(0x7ff6ff), violet: C(accent), sheet: C(0x3f9d6a), steel: C(0xa9b8d8),
  };

  /* ---- the layout (set coordinates; the plinth top is y = 0) ---- */
  const BOT = { x: -.35, z: .45, rot: .12, s: 1.35 };
  const DESK = { x: .98, z: -.38, rot: -.42 };
  const PAD = { x: 1.55, z: 1.3, top: .16 };
  const TOWER = { x: 2.35, z: -.95, rings: 25, first: 7, y0: .2, dy: .1 };
  const STACKS = [ // x, z, count, type: 18 CSV, 28 DOCX, 8 PDF/HTML, 1 LOG, as the task beat stacked them
    [-2.45, .5, 9, 0], [-2.5, -.72, 9, 0], [-1.65, -1.78, 14, 1], [-.38, -2.25, 14, 1], [1.2, -1.98, 8, 2], [2.62, .4, 1, 3],
  ];

  /* ---- the run, as data: 28 requests ---- */
  const CRASH = .52;
  const REQ = [];
  for (let i = 0; i <= 16; i++) REQ.push(lerp(.065, .495, i / 16));
  REQ.push(.622, .641, .66, .685, .705, .728);
  for (let i = 23; i <= 27; i++) REQ.push(lerp(.748, .804, (i - 23) / 4)); // all done before the dolly at .82

  const rig = new THREE.Group(); set.add(rig); // everything shakes together; the camera does not

  /* ---- the plinth, its light pool and the shaft of light over the robot ---- */
  cyl(rig, 3.3, 3.45, .3, 0x1c2740, 0, -.3, 0, 64);
  cyl(rig, 3.46, 3.18, .5, 0x111a2d, 0, -.8, 0, 64);
  const rim = add(rig, new THREE.TorusGeometry(3.38, .03, 8, 128), glowMat(accent, 1.2).clone(), 0, .005, 0, false);
  rim.rotation.x = Math.PI / 2;
  const radial = glowSprite(0xffffff, 1).material.map;
  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.1, 48), additive(0xffffff, 1, { map: radial }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(BOT.x * .5, .012, 0); rig.add(pool);
  const shaftTex = (() => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.04)'); gr.addColorStop(.86, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,.85)');
    g.fillStyle = gr; g.fillRect(0, 0, 4, 256); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.35, 1.75, 7.5, 48, 1, true), additive(0xffffff, 1, { map: shaftTex, side: THREE.DoubleSide }));
  shaft.position.set(BOT.x, 3.75, BOT.z - .1); rig.add(shaft);

  /* ---- the robot (the model), armed with the harness ---- */
  let bot = null;
  const given = hand.robot;
  try { if (typeof given === 'function') bot = given(); else if (typeof given?.make === 'function') bot = given.make(); } catch { bot = null; }
  if (!bot?.root) bot = kit.robot(given?.color ?? PALETTE.cream, given?.eye ?? 0x8ff6ff);
  const root = bot.root; root.rotation.order = 'YXZ'; root.scale.setScalar(BOT.s); rig.add(root);
  // own materials, so this robot can take the red light without tinting the other beats' robots
  const eyeMats = [], hullMats = [], hullHex = given?.color ?? PALETTE.cream;
  { const seen = new Map();
    root.traverse(o => {
      if (!o.isMesh || !o.material?.isMeshStandardMaterial) return;
      const m = o.material;
      if (!seen.has(m)) {
        const c = m.clone(); seen.set(m, c);
        if (m.emissiveIntensity >= 2) eyeMats.push({ m: c, base: c.color.clone(), i: c.emissiveIntensity });
        else if (m.color.getHex() === hullHex) hullMats.push(c);
      }
      o.material = seen.get(m);
    }); }
  const aerialMat = (() => { let found = null; bot.head?.traverse(o => { if (!found && o.isMesh && o.material?.emissive && o.material.color.getHex() === PALETTE.amber) found = o.material; }); return found; })();

  let gun = null;
  const armed = hand.armed || {};
  try {
    if (typeof armed.weapon === 'function') gun = armed.weapon();
    else { const { weapons } = await loadWeapons(); gun = weapons[armed.weaponIndex ?? 2].clone(true); }
  } catch { gun = null; }
  if (!gun) gun = kit.blaster(armed.accent ?? PALETTE.amber);
  gun.scale.setScalar(.55); gun.position.copy(GUN_HOLD.at); gun.rotation.copy(GUN_HOLD.turn); root.add(gun); bot.grip?.(1);
  const gunAxis = V(0, 0, 1).applyEuler(GUN_HOLD.turn), gunRest = GUN_HOLD.at.clone();
  const muzzleFlash = glowSprite(0xd9ccff, .5, 0); rig.add(muzzleFlash);
  // the rest pose, where the threads the calls leave behind start
  root.position.set(BOT.x, 0, BOT.z); root.rotation.set(0, BOT.rot, 0); root.updateMatrix(); gun.updateMatrix();
  const m4 = new THREE.Matrix4().multiplyMatrices(root.matrix, gun.matrix);
  const MUZZLE = V(0, 0, .52).applyMatrix4(m4), MDIR = V(0, 0, 1).transformDirection(m4);

  // request pings: rings that leave the head
  const pings = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(.5, .016, 6, 64), additive(COL.violet, 0));
    m.rotation.x = Math.PI / 2; m.visible = false; rig.add(m); return m;
  });
  const thought = glowSprite(0xc9bcff, 1.4, 0); rig.add(thought);

  /* ---- the low desk and its terminal ---- */
  const desk = new THREE.Group(); desk.position.set(DESK.x, 0, DESK.z); desk.rotation.y = DESK.rot; rig.add(desk);
  { const w = 1.1, d = .6, h = .5;
    block(desk, w, .07, d, 0x8a5f3f, 0, h - .07, 0, .03);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => block(desk, .07, h - .07, .07, 0x5d3e2a, sx * (w / 2 - .08), 0, sz * (d / 2 - .08), .02)); }
  const term = kit.terminal(PALETTE.violet); term.root.position.set(0, .5, -.04); term.root.scale.setScalar(2.35); desk.add(term.root);
  term.root.children.forEach((c, k) => { if (k >= 2 && k <= 4) c.visible = false; }); // the screen draws its own code
  const screenMat = new THREE.ShaderMaterial({
    uniforms: { uScroll: { value: 0 }, uTime: { value: 0 }, uRed: { value: 0 }, uCool: { value: 0 }, uFlash: { value: 0 }, uGlitch: { value: 0 } },
    vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;uniform float uScroll,uTime,uRed,uCool,uFlash,uGlitch;
      float h(float n){return fract(sin(n*91.7+7.3)*43758.5453);}
      void main(){
        float y=(1.-vUv.y)*7.+uScroll, row=floor(y), fy=fract(y);
        float jit=(h(row+floor(uTime*22.))-.5)*uGlitch*.3;
        float x=vUv.x+jit, ind=floor(h(row*3.1)*3.)*.08, len=.16+h(row*7.7)*.5, len2=.08+h(row*5.3)*.18;
        float on=step(.3,fy)*step(fy,.72);
        float a=on*step(.07+ind,x)*step(x,.07+ind+len);
        float b=on*step(.11+ind+len,x)*step(x,.11+ind+len+len2);
        vec3 base=mix(vec3(.62,.55,1.),vec3(.55,1.,.96),uCool), hi=vec3(.9,.95,1.);
        vec3 ink=mix(base,vec3(1.,.16,.22),uRed), ink2=mix(hi,vec3(1.,.35,.3),uRed);
        vec3 bg=mix(vec3(.03,.04,.09),vec3(.22,.01,.03),uRed)+vec3(.04,.1,.1)*uCool;
        vec3 c=bg+(ink*a*1.8+ink2*b*1.1)*(1.-uRed*.72);
        c*=.86+.14*sin(vUv.y*190.);
        c+=vec3(.6,.7,1.)*uFlash*.5;
        gl_FragColor=vec4(c,1.);}`,
  });
  term.screen.material = screenMat;
  const errTex = labelTexture('film-traj-nameerror', [{ text: 'NameError', size: 196, weight: 700, color: '#ffffff', font: '"Space Mono", ui-monospace, monospace', track: 2 }], { width: 1024, height: 256 });
  const errLabel = new THREE.Mesh(new THREE.PlaneGeometry(.4, .1), additive(0xff3348, 0, { map: errTex }));
  errLabel.position.set(0, .225, .038); term.root.add(errLabel);
  desk.updateMatrix(); term.root.updateMatrix();
  const TERM = V(0, .24, .05).applyMatrix4(term.root.matrix).applyMatrix4(desk.matrix);
  const termGlow = glowSprite(0xb9a9ff, 1.3, 0); termGlow.position.copy(TERM); rig.add(termGlow);

  /* ---- the container's 55 files: the task beat's tiles, type colours and labels ---- */
  const KEYS = ['CSV', 'DOCX', 'PDF/HTML', 'LOG'], INKS = ['#1d6b67', '#4a3c9c', '#94640f', '#454c5b'];
  const TYPES = [0x45b5b0, 0x7d6ad8, 0xf2b545, 0x9aa3b2].map((hex, k) => {
    const c = C(hand.task?.files?.[k]?.color ?? hex), m = 1 / Math.max(c.r, c.g, c.b);
    return c.multiplyScalar(m); // normalised, so every edge glows at the same level
  });
  const SH = { w: .56, h: .06, d: .4, gap: .066 };
  const sheets = [], perType = [0, 0, 0, 0];
  STACKS.forEach(([sx, sz, n, type], s) => {
    const facing = Math.atan2(BOT.x - sx, BOT.z - sz), dir = V(Math.sin(facing), 0, Math.cos(facing));
    for (let j = 0; j < n; j++) {
      const k = sheets.length, jr = (hash(k * 2.3) - .5) * .12, jx = (hash(k * 5.1) - .5) * .035, jz = (hash(k * 1.7) - .5) * .035;
      const base = V(sx + jx, .022 + SH.h / 2 + j * SH.gap, sz + jz);
      sheets.push({ s, type, slot: perType[type]++, base, rot: facing + jr, dir, hits: [],
        arrive: base.clone().addScaledVector(dir, .16).setY(base.y + .05), leave: base.clone().addScaledVector(dir, .36).setY(base.y + .14) });
    }
    const foot = add(rig, rbox(.66, .022, .5, .01), mat(TYPES[type].getHex(), { emissive: TYPES[type].getHex(), intensity: .2 }), sx, .011, sz, false);
    foot.rotation.y = facing;
  });
  const paper = new THREE.InstancedMesh(rbox(SH.w, SH.h, SH.d, .025), mat(0xf7f5f0), sheets.length);
  const edges = new THREE.InstancedMesh(rbox(SH.w + .025, .022, SH.d + .025, .01).clone().translate(0, -.012, 0), new THREE.MeshBasicMaterial({ color: 0xffffff }), sheets.length);
  const labelGeo = new THREE.PlaneGeometry(.42, .21).rotateX(-Math.PI / 2).translate(0, SH.h / 2 + .002, .02);
  const labels = KEYS.map((key, k) => new THREE.InstancedMesh(labelGeo, new THREE.MeshStandardMaterial({
    map: labelTexture(`film-task-type-${k}`, [{ text: key, size: key.length > 4 ? 118 : 168, weight: 800, color: INKS[k], track: 6 }], { width: 512, height: 256 }),
    transparent: true, roughness: .8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), Math.max(1, perType[k])));
  paper.castShadow = paper.receiveShadow = true; edges.castShadow = false;
  [paper, edges, ...labels].forEach(m => { m.frustumCulled = false; rig.add(m); });
  labels.forEach(m => { m.castShadow = false; });
  sheets.forEach((_, i) => edges.setColorAt(i, COL.violet));

  /* ---- the context tower: one ring per 4k tokens, 27k to 100k ---- */
  cyl(rig, .44, .5, .12, 0x26324d, TOWER.x, 0, TOWER.z, 32);
  const towerRim = add(rig, new THREE.TorusGeometry(.45, .022, 8, 48), glowMat(accent, 1.4).clone(), TOWER.x, .125, TOWER.z, false); towerRim.rotation.x = Math.PI / 2;
  const ringGeo = new THREE.TorusGeometry(.27, .038, 8, 40); ringGeo.rotateX(Math.PI / 2);
  const rings = new THREE.InstancedMesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), TOWER.rings);
  rings.frustumCulled = false;
  for (let j = 0; j < TOWER.rings; j++) rings.setColorAt(j, COL.violet);
  rig.add(rings);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, 1, 10, 1, true), additive(COL.violet, .55));
  core.position.set(TOWER.x, 0, TOWER.z); rig.add(core);
  const cap = glowSprite(0xd2c8ff, .9, .8); rig.add(cap);
  const ringStep = 73 / (TOWER.rings - TOWER.first);
  // the numbers live in the set: the context over its tower, the request count over the robot's head
  const TAG = { size: 150, weight: 700, color: '#ffffff', track: -2 }, SUB = { size: 62, weight: 600, color: '#b9b0e8', track: 4 };
  const tokTex = labelTexture('film-traj-tokens', [{ ...TAG, text: '27k' }, { ...SUB, text: 'tokens' }], { width: 512, height: 288 });
  const tokTag = new THREE.Mesh(new THREE.PlaneGeometry(.92, .52), new THREE.MeshBasicMaterial({ map: tokTex, transparent: true, depthWrite: false, fog: false }));
  tokTag.renderOrder = 4; rig.add(tokTag);
  const reqTex = labelTexture('film-traj-requests', [{ ...TAG, text: 'R0', color: '#e9e3ff' }], { width: 512, height: 200 });
  const reqTag = new THREE.Mesh(new THREE.PlaneGeometry(.66, .26), new THREE.MeshBasicMaterial({ map: reqTex, transparent: true, depthWrite: false, fog: false, opacity: 0 }));
  reqTag.renderOrder = 4; rig.add(reqTag);
  let tagTok = -1, tagReq = -1;

  /* ---- the output pad, the workbook and its first sheet ---- */
  cyl(rig, .62, .68, PAD.top, 0x26324d, PAD.x, 0, PAD.z, 40);
  const padRim = add(rig, new THREE.TorusGeometry(.63, .024, 8, 64), glowMat(0x3f9d6a, 1.3).clone(), PAD.x, PAD.top + .004, PAD.z, false); padRim.rotation.x = Math.PI / 2;
  const padGlow = glowSprite(0xff3a4a, 3, 0); padGlow.position.set(PAD.x, PAD.top + .35, PAD.z); rig.add(padGlow);
  const WB = { w: .8, h: .05, d: .56, step: .064 };
  const SLOTS = [0, 1, 2, 3, 4].map(k => V(PAD.x, PAD.top + WB.h / 2 + .012 + k * WB.step, PAD.z));
  // the five empty places, drawn as faint outlines over the pad until a sheet takes each one
  const ghostGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(WB.w, WB.h, WB.d));
  const ghosts = SLOTS.map(p => { const g = new THREE.LineSegments(ghostGeo, additive(COL.sheet, 0)); g.position.copy(p); rig.add(g); return g; });
  function sheetTexture(rows) {
    const W = 512, H = 352, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), top = 46, rh = 27, cols = [0, 64, 250, 384, W];
    g.fillStyle = '#fbf8f1'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#3f9d6a'; g.fillRect(0, 0, W, top);
    g.fillStyle = '#e9f6ee'; [16, 84, 268, 400].forEach((x, k) => g.fillRect(x, 17, [30, 120, 80, 70][k], 12));
    for (let r = 0; r < rows; r++) {
      const y = top + r * rh + 9;
      g.fillStyle = '#b4bcc8'; g.fillRect(14, y, 34, 9);
      g.fillStyle = '#5b6576'; g.fillRect(80, y, 70 + hash(r + 1) * 100, 9);
      g.fillStyle = '#2f7d55'; g.fillRect(262 + hash(r + 9) * 40, y, 70, 9);
      g.fillStyle = '#8a93a3'; g.fillRect(398 + hash(r + 4) * 30, y, 60, 9);
    }
    g.strokeStyle = '#dfe5dc'; g.lineWidth = 2;
    for (let y = top; y <= H; y += rh) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    cols.forEach(x => { g.beginPath(); g.moveTo(x, top); g.lineTo(x, H); g.stroke(); });
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    return tex;
  }
  const fullTex = sheetTexture(11), partTex = sheetTexture(3); // the rerun fills sheet one; the crash left it at three rows
  const wbPaper = mat(0xf7f5f0).clone(), wbTop = new THREE.MeshStandardMaterial({ map: fullTex, roughness: .8 });
  function workSheet() {
    const g = new THREE.Group();
    add(g, rbox(WB.w, WB.h, WB.d, .02), wbPaper);
    const edge = add(g, rbox(WB.w + .03, .02, WB.d + .03, .01), new THREE.MeshBasicMaterial({ color: COL.sheet.clone() }), 0, -.01, 0, false);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(WB.w - .05, WB.d - .05), wbTop); top.rotation.x = -Math.PI / 2; top.position.y = WB.h / 2 + .002; g.add(top);
    g.userData.edge = edge; g.visible = false; rig.add(g);
    return g;
  }
  // sheet one: six shards that read as one sheet until the crash
  const one = new THREE.Group(); one.position.copy(SLOTS[0]); rig.add(one);
  const shardPaper = mat(0xf7f5f0).clone(), shardTop = new THREE.MeshStandardMaterial({ map: partTex, roughness: .8 });
  const shardEdge = additive(COL.red, 0);
  const shards = [];
  for (let ri = 0; ri < 2; ri++) for (let ci = 0; ci < 3; ci++) {
    const k = shards.length, w = WB.w / 3, d = WB.d / 2, g = new THREE.Group(), x = (ci - 1) * w, z = (ri - .5) * d;
    add(g, rbox(w - .004, WB.h, d - .004, .012), shardPaper);
    const rimG = new THREE.Mesh(rbox(w + .012, WB.h * .5, d + .012, .01), shardEdge); g.add(rimG); // the red cut, lit from inside
    const geo = new THREE.PlaneGeometry(w - .006, d - .006), uv = geo.attributes.uv;
    for (let v = 0; v < uv.count; v++) uv.setXY(v, (ci + uv.getX(v)) / 3, (1 - ri + uv.getY(v)) / 2);
    const top = new THREE.Mesh(geo, shardTop); top.rotation.x = -Math.PI / 2; top.position.y = WB.h / 2 + .002; g.add(top);
    g.position.set(x, 0, z); one.add(g);
    const out = V(x, 0, z).normalize();
    shards.push({ g, x, z, out: out.multiplyScalar(.08 + hash(k * 3.7) * .08), lift: .12 + hash(k * 9.1) * .22, rx: (hash(k * 2.9) - .5) * 1, rz: (hash(k * 4.3) - .5) * 1, ry: (hash(k * 6.1) - .5) * .6 });
  }
  const oneEdge = add(one, rbox(WB.w + .03, .02, WB.d + .03, .01), new THREE.MeshBasicMaterial({ color: COL.sheet.clone() }), 0, -.01, 0, false);
  one.visible = false;
  const book = [one, workSheet(), workSheet(), workSheet(), workSheet()];
  const bookRot = [0, .05, -.06, .035, -.03];

  /* ---- 54 tool calls: an out leg from the muzzle and a return leg to the head ---- */
  const LEAD = 1.4, OUT_D = .036, BACK_D = .03; // a ribbon's head reaches its target at 1/LEAD of the leg
  const legs = [], calls = [];
  const T_TERM = { type: 'term' }, T_PAD = k => ({ type: 'pad', k });
  function call(time, to, o = {}) {
    const leg = { a: time, d: o.d ?? OUT_D, out: true, to, color: o.color ?? COL.call, width: o.width ?? .042, glow: o.glow ?? 3, noise: 0, carry: o.carry ?? 0, run: !!o.run };
    leg.hit = leg.a + leg.d / LEAD; legs.push(leg); calls.push(leg);
    if (to.type === 'sheet') sheets[to.i].hits.push(leg.hit);
    legs.push({ a: leg.hit, d: BACK_D, out: false, to, color: o.backColor ?? COL.result, width: .03, glow: o.noise ? 2.4 : 2, noise: o.noise ?? 0 });
    return leg;
  }
  // which file each reading call pulls: a walk around the stacks, never the same unread file twice
  let seed = 11;
  const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const unread = STACKS.map((_, s) => sheets.map((sh, i) => (sh.s === s ? i : -1)).filter(i => i >= 0));
  const pick = s => { const list = unread[s]; return list.length ? list.splice(Math.floor(rnd() * list.length), 1)[0] : sheets.findIndex(sh => sh.s === s); };
  const WALK = [0, 2, 3, 3, 1, 0, 4, 2, 3, 1, 2, 5, 0, 4, 1, 2, 3, 2, 1, 3, 0, 3, 4, 2, 1];
  const readTargets = [];
  for (let c = 0; c < 25; c++) readTargets.push(c === 3 ? readTargets[2] : { type: 'sheet', i: pick(WALK[c]) });
  const readSheets = readTargets.map(t => t.i);
  let c = 0;
  REQ.forEach((tr, r) => {
    const n = r === 0 || r === 16 ? 1 : 2;
    for (let j = 0; j < n; j++, c++) {
      const tc = tr + .005 + j * .011;
      if (c === 0) call(tc, T_TERM, { color: COL.plan });                                    // TodoWrite: the plan
      else if (c < 25) call(tc, readTargets[c], c === 2 ? { noise: 1, backColor: COL.binary } : {}); // R2: the commission comes back as raw binary; R3 rereads it
      else if (c === 25) call(tc, T_TERM, { color: COL.plan });
      else if (c === 26 || c === 29) call(tc, T_TERM);                                       // writing the script
      else if (c < 31) call(tc, T_PAD(0));                                                   // sheet one starts to fill
      else if (c === 31) call(CRASH - .028 / LEAD, T_PAD(0), { color: COL.run, width: .075, glow: 3.6, d: .028, run: true }); // the run that dies
      else if (c < 36) call(tc, T_PAD(0), { color: COL.probe, glow: 2.4 });                  // reading its files back
      else if (c === 36) call(tc, T_TERM, { color: COL.plan });
      else if (c === 37) call(tc, T_TERM, { color: COL.cool });                              // the fix
      else if (c < 40) call(tc, T_PAD(0), { color: COL.cool });                              // the rerun
      else if (c < 44) call(tc, T_PAD(c - 39), { color: COL.carry, width: .05, carry: c - 39 }); // sheets two to five
      else call(tc, c % 2 ? { type: 'sheet', i: readSheets[(c * 7) % readSheets.length] } : T_PAD(4), { color: COL.call }); // checking
    }
  });
  const FIXHIT = calls[37].hit, REFORM = calls[38].hit, SWEEP = [FIXHIT, FIXHIT + .055];
  const carryLegs = [null, ...calls.filter(l => l.carry)];
  carryLegs.forEach(l => { if (l) { l.pos = V(); l.live = false; } });

  const targetPoint = (out, to, leaving) => {
    if (to.type === 'sheet') return out.copy(leaving ? sheets[to.i].leave : sheets[to.i].arrive);
    if (to.type === 'term') return out.copy(TERM);
    return out.copy(SLOTS[to.k]).setY(PAD.top + .06 + to.k * WB.step + (leaving ? .1 : 0));
  };
  // the shape of a ribbon: up out of the muzzle (or the file), over, and down onto the target (or the head)
  const shape = (w0, w1, w2, w3, dir, out) => {
    const dist = w0.distanceTo(w3);
    if (out) { w1.copy(w0).addScaledVector(dir, .55 + dist * .12); w1.y += .5 + dist * .14; }
    else { w1.copy(w0); w1.y += .7 + dist * .18; }
    w2.copy(w3); w2.y += (out ? .95 : .55) + dist * .22;
  };

  // the ribbons in flight: a pool of tubes bent on the GPU between their tail and head
  const RIB_VS = `uniform vec3 p0,p1,p2,p3;uniform float head,tail,width;varying float vS;
    vec3 bez(float t){float u=1.-t;return u*u*u*p0+3.*u*u*t*p1+3.*u*t*t*p2+t*t*t*p3;}
    vec3 dbez(float t){float u=1.-t;return 3.*u*u*(p1-p0)+6.*u*t*(p2-p1)+3.*t*t*(p3-p2);}
    void main(){float s=position.x,a=position.y,t=mix(tail,head,s);vec3 c=bez(t),T=normalize(dbez(t)+vec3(1e-4,0.,0.));
      vec3 N=normalize(cross(T,abs(T.y)>.9?vec3(1.,0.,0.):vec3(0.,1.,0.))),B=cross(T,N);vS=s;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(c+(cos(a)*N+sin(a)*B)*width*(.12+.88*s*s),1.);}`;
  const RIB_FS = `uniform vec3 color;uniform float time,glow,noise;varying float vS;
    float h(float n){return fract(sin(n*91.7)*43758.5453);}
    void main(){float s0=max(vS,0.),fade=pow(s0,1.3),sh=.72+.28*sin(vS*30.-time*12.);
      float hiss=mix(1.,step(.5,h(floor(vS*36.)+floor(time*30.)*1.7)),noise);
      gl_FragColor=vec4(mix(color,vec3(1.),pow(s0,6.)*.8)*fade*sh*hiss*glow,1.);}`;
  const tubeGeo = (S, R) => {
    const p = [], idx = [];
    for (let i = 0; i <= S; i++) for (let j = 0; j < R; j++) p.push(i / S, j / R * Math.PI * 2, 0);
    for (let i = 0; i < S; i++) for (let j = 0; j < R; j++) { const a = i * R + j, b = i * R + (j + 1) % R, cc = (i + 1) * R + j, d = (i + 1) * R + (j + 1) % R; idx.push(a, cc, b, b, cc, d); }
    return { p, idx };
  };
  const ribbonGeo = (() => { const { p, idx } = tubeGeo(44, 6), g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx); return g; })();
  const NSLOT = 16;
  const slots = Array.from({ length: NSLOT }, () => {
    const u = { p0: { value: V() }, p1: { value: V() }, p2: { value: V() }, p3: { value: V() }, head: { value: 0 }, tail: { value: 0 }, width: { value: .03 }, color: { value: C(0xffffff) }, time: { value: 0 }, glow: { value: 1 }, noise: { value: 0 } };
    const m = new THREE.Mesh(ribbonGeo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: RIB_VS, fragmentShader: RIB_FS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.frustumCulled = false; m.visible = false; rig.add(m);
    const tip = glowSprite(0xffffff, .5, 0); rig.add(tip);
    return { m, u, tip };
  });
  legs.sort((a, b) => a.a - b.a);
  const bySlot = Array.from({ length: NSLOT }, () => []);
  legs.forEach((l, i) => bySlot[i % NSLOT].push(l));

  // the threads: every call leaves its path behind, so by the end the run has drawn its trajectory.
  // One merged mesh; each thread appears once its ribbon has passed and then shimmers with t.
  const threads = (() => {
    const S = 34, R = 4, { p, idx } = tubeGeo(S, R), per = (S + 1) * R, n = calls.length;
    const pos = new Float32Array(per * n * 3), P = [0, 1, 2, 3].map(() => new Float32Array(per * n * 3)), col = new Float32Array(per * n * 3), info = new Float32Array(per * n * 4), index = [];
    const a = V(), b = V(), cc = V(), d = V(), tint = C(0);
    calls.forEach((l, k) => {
      a.copy(MUZZLE); targetPoint(d, l.to, false); shape(a, b, cc, d, MDIR, true);
      if (l.to.type === 'sheet') tint.copy(TYPES[sheets[l.to.i].type]); else if (l.to.type === 'term') tint.copy(COL.violet); else tint.copy(COL.sheet);
      if (l.carry) tint.copy(COL.carry);
      for (let v = 0; v < per; v++) {
        const o = k * per + v;
        pos.set([p[v * 3], p[v * 3 + 1], 0], o * 3);
        [a, b, cc, d].forEach((q, j) => P[j].set([q.x, q.y, q.z], o * 3));
        col.set([tint.r, tint.g, tint.b], o * 3);
        info.set([l.a + l.d, l.run ? .016 : .0085, l.run ? 1 : 0, hash(k * 1.9)], o * 4);
      }
      idx.forEach(i => index.push(i + k * per));
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    ['aP0', 'aP1', 'aP2', 'aP3'].forEach((name, j) => g.setAttribute(name, new THREE.BufferAttribute(P[j], 3)));
    g.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); g.setAttribute('aInfo', new THREE.BufferAttribute(info, 4)); g.setIndex(index);
    const u = { uLp: { value: 0 }, uTime: { value: 0 }, uHot: { value: 0 }, uSweepY: { value: -1 }, uLive: { value: 1 } };
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec3 aP0,aP1,aP2,aP3,aCol;attribute vec4 aInfo;uniform float uLp,uHot,uSweepY;varying vec3 vCol;varying float vA,vS,vSeed;
        vec3 bez(float t){float u=1.-t;return u*u*u*aP0+3.*u*u*t*aP1+3.*u*t*t*aP2+t*t*t*aP3;}
        vec3 dbez(float t){float u=1.-t;return 3.*u*u*(aP1-aP0)+6.*u*t*(aP2-aP1)+3.*t*t*(aP3-aP2);}
        void main(){float s=position.x,a=position.y,age=uLp-aInfo.x,on=step(0.,age);
          vec3 c=bez(s),T=normalize(dbez(s)+vec3(1e-4,0.,0.)),N=normalize(cross(T,abs(T.y)>.9?vec3(1.,0.,0.):vec3(0.,1.,0.))),B=cross(T,N);
          float clear=smoothstep(0.,.3,uSweepY-c.y),red=uHot*(1.-clear),run=aInfo.z*on*(1.-clear);
          float cool=uSweepY>-.5?exp(-pow((uSweepY-c.y)/.3,2.)):0.;
          vCol=mix(mix(aCol,vec3(1.,.13,.2),max(red*.9,run)),vec3(.5,1.,1.),cool);
          vA=on*(.26+1.4*exp(-max(age,0.)/.025)+red*.5+run*.9+cool*1.2);vS=s;vSeed=aInfo.w;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(c+(cos(a)*N+sin(a)*B)*aInfo.y*on,1.);}`,
      fragmentShader: `uniform float uTime,uLive;varying vec3 vCol;varying float vA,vS,vSeed;
        void main(){float pulse=smoothstep(.86,1.,fract(vS*1.4-uTime*.32+vSeed*7.))*uLive;
          float ends=smoothstep(0.,.06,vS)*(1.-smoothstep(.92,1.,vS));
          gl_FragColor=vec4(vCol*vA*ends*(.6+1.8*pulse),1.);}`,
    }));
    m.frustumCulled = false; rig.add(m);
    return u;
  })();

  // impacts: a ring that blooms where a call lands
  const NIMP = 6;
  const impacts = Array.from({ length: NIMP }, () => {
    const m = new THREE.Mesh(new THREE.RingGeometry(.2, .26, 40).rotateX(-Math.PI / 2), additive(0xffffff, 0, { side: THREE.DoubleSide }));
    m.visible = false; rig.add(m); return m;
  });

  /* ---- the sweep, the glitch bars ---- */
  const sweepTex = (() => {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.7, 'rgba(255,255,255,.02)'); gr.addColorStop(.92, 'rgba(255,255,255,.2)'); gr.addColorStop(.975, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const sweep = new THREE.Mesh(new THREE.CircleGeometry(3.5, 72), additive(COL.cool, 0, { map: sweepTex, side: THREE.DoubleSide }));
  sweep.rotation.x = -Math.PI / 2; sweep.visible = false; rig.add(sweep);
  const bars = new THREE.Group(); bars.position.set(.5, 1.2, .9); rig.add(bars);
  const barGeo = new THREE.PlaneGeometry(1, 1);
  const barList = Array.from({ length: 12 }, (_, k) => { const m = new THREE.Mesh(barGeo, additive(k % 2 ? 0x55e0ff : 0xff2a3d, 0)); m.visible = false; bars.add(m); return m; });

  /* ---- scratch state for update: nothing is allocated per frame ---- */
  const dummy = new THREE.Object3D(); dummy.rotation.order = 'YXZ';
  const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
  const muzzle = V(), mdir = V(), headPt = V(), w0 = V(), w1 = V(), w2 = V(), w3 = V(), hp = V();
  const bez = (out, a, b, c2, d, t) => { const u = 1 - t; return out.set(0, 0, 0).addScaledVector(a, u * u * u).addScaledVector(b, 3 * u * u * t).addScaledVector(c2, 3 * u * t * t).addScaledVector(d, t * t * t); };
  const yawTo = p => clamp(Math.atan2(p.x - BOT.x, p.z - BOT.z) - BOT.rot, -1.3, 1.3);
  calls.forEach(l => { targetPoint(w0, l.to, false); l.yaw = yawTo(w0); });
  // the context after request r has come back: reading is heavy early, so it climbs fast first
  const tokAfter = r => (r < 0 ? 27 : 27 + 73 * Math.pow((r + 1) / REQ.length, .82));
  const tokens = lp => {
    let r = -1; for (let i = 0; i < REQ.length; i++) if (REQ[i] <= lp) r = i;
    if (r < 0) return 27;
    return lerp(tokAfter(r - 1), tokAfter(r), ramp(lp, REQ[r] + .006, REQ[r] + .024));
  };
  // red from the crash until the sweep has risen past height y; the sweep's own flash as it passes
  const sweepY = lp => (lp < SWEEP[0] ? -1 : lerp(-.05, 3.1, inOut((lp - SWEEP[0]) / (SWEEP[1] - SWEEP[0]))));
  const hot = lp => ramp(lp, CRASH - .003, CRASH + .002) * (1 - .62 * ramp(lp, CRASH + .015, .615));
  const redAt = (lp, y) => hot(lp) * (1 - smooth((sweepY(lp) - y) / .3));
  // the error itself (the eye, the screen, the broken sheet) stays red until the fix reaches it
  const errAt = (lp, y) => ramp(lp, CRASH - .003, CRASH + .002) * (1 - smooth((sweepY(lp) - y) / .3));
  const coolAt = (lp, y) => (lp < SWEEP[0] || lp > SWEEP[1] + .02 ? 0 : Math.exp(-Math.pow((sweepY(lp) - y) / .32, 2)));
  const CAM_YAW = yawTo(V(3.1, 0, 7.5));

  // hand-off for the grading beat: data, not scene nodes
  hand.workbook = { sheets: 5, rows: 39, color: 0x3f9d6a };
  hand.trajectory = { requests: 28, calls: 54, tokens: '100k', crash: 'NameError' };

  const shot = {
    from: { pos: [-6.1, 4.3, 7.9], look: [-.25, .95, -.4], fov: 34 },
    to: { pos: [3.15, 2.55, 7.45], look: [.3, 1.25, -.25], fov: 33 },
  };
  const api = {
    camera: shot,
    dim: 0,
    update(lp, t, dt, ui) {
      if (reduce) lp = 1;
      const tt = reduce ? 0 : t, live = reduce ? 0 : 1;
      // a portrait frame is narrow: aim a little right of the robot, so the tower and the pad stay in
      const portrait = layout ? layout.stacked : camera.aspect < .9;
      shot.from.look[0] = portrait ? .25 : .28; shot.to.look[0] = portrait ? .85 : .72;

      /* the numbers: the copy counts the calls, the set shows the requests and the context */
      let nReq = 0; for (let i = 0; i < REQ.length; i++) if (REQ[i] <= lp) nReq++;
      let nCall = 0, latest = -1; for (let i = 0; i < calls.length; i++) if (calls[i].a <= lp) { nCall++; latest = i; }
      const tok = tokens(lp);
      ui.set('calls', nCall);
      const kTok = Math.round(tok);
      if (kTok !== tagTok) { tagTok = kTok; tokTex.userData.redraw([{ ...TAG, text: `${kTok}k` }, { ...SUB, text: 'tokens' }]); }
      if (nReq !== tagReq) { tagReq = nReq; reqTex.userData.redraw([{ ...TAG, text: `R${nReq}`, color: '#e9e3ff' }]); }
      // the crash: for a moment everything but the red goes dark
      const black = bump(lp, CRASH - .001, CRASH + .002, CRASH + .03) * live;
      api.dim = .88 * black;
      const unlit = 1 - .85 * black;

      /* the shake: hard at the crash, one aftershock; the camera is untouched */
      const shake = live * (ramp(lp, CRASH - .002, CRASH + .003) * (1 - ramp(lp, CRASH + .004, .585)) + .3 * bump(lp, .552, .558, .6));
      rig.position.set(
        shake * (Math.sin(tt * 53) * .7 + Math.sin(tt * 31 + lp * 400) * .5) * .08,
        shake * Math.sin(tt * 47 + 1) * .04,
        shake * (Math.sin(tt * 41 + 2) * .6 + Math.sin(lp * 610) * .4) * .05);

      /* the robot: where it looks, how it leans */
      let yaw = 0;
      if (latest >= 0) { const cur = calls[latest], prev = latest ? calls[latest - 1].yaw : 0; yaw = lerp(prev, cur.yaw, inOut((lp - cur.a) / .012)); }
      yaw = lerp(yaw, CAM_YAW, Math.max(.75 * bump(lp, CRASH, CRASH + .008, .61), ramp(lp, .795, .825)));
      const red = errAt(lp, 1.15), recoil = bump(lp, CRASH, CRASH + .007, .575);
      let ping = 0; for (let i = 0; i < REQ.length; i++) { const age = lp - REQ[i]; if (age >= 0 && age < .02) ping = Math.max(ping, Math.pow(1 - age / .02, 2)); }
      const lean = .1 * bump(lp, .488, .512, CRASH + .001) - .26 * recoil + .14 * bump(lp, .615, .64, .69) + .06 * bump(lp, .775, .79, .82);
      bot.update(tt, 0);
      root.position.set(BOT.x, .12 * recoil - .035 * bump(lp, .488, .512, CRASH) + .03 * ping * (1 - ping) * 4, BOT.z);
      root.rotation.set(lean, BOT.rot + clamp(yaw * .32, -.36, .36) + Math.sin(tt * .5) * .03 * live, 0);
      bot.head.rotation.y = clamp(yaw * .5, -.62, .62) + Math.sin(tt * .8) * .07 * live + red * Math.sin(tt * 38) * .1 * live;
      bot.head.rotation.x = .15 * bump(lp, .615, .64, .69) + .2 * bump(lp, .775, .79, .825) - .14 * recoil;
      // the harness kicks on each shot
      let kick = 0; if (latest >= 0) { const age = lp - calls[latest].a; kick = age < .018 ? Math.pow(1 - age / .018, 2) * (calls[latest].run ? 2 : 1) : 0; }
      gun.position.copy(gunRest).addScaledVector(gunAxis, -.06 * kick);
      gun.rotation.set(GUN_HOLD.turn.x, GUN_HOLD.turn.y, GUN_HOLD.turn.z - .25 * kick);
      root.updateMatrix(); gun.updateMatrix();
      m4.multiplyMatrices(root.matrix, gun.matrix);
      muzzle.set(0, 0, .52).applyMatrix4(m4); mdir.set(0, 0, 1).transformDirection(m4);
      headPt.set(0, .92, .08).applyMatrix4(root.matrix);
      // before the run: the muzzle charges, white-hot
      const charge = lp < CRASH - .02 ? ramp(lp, .478, CRASH - .02) : 0;
      muzzleFlash.position.copy(muzzle); muzzleFlash.material.opacity = Math.max(kick, charge);
      muzzleFlash.scale.setScalar(Math.min(.52, .3 + kick * .22 + charge * (.2 + Math.sin(tt * 40) * .03 * live))); // under the muzzle's height, so the floor never cuts it
      // eyes and hull take the light of the moment
      const cool = coolAt(lp, 1.15);
      for (let k = 0; k < eyeMats.length; k++) {
        const { m, base, i } = eyeMats[k];
        tmpC.copy(base).lerp(COL.red, red); m.color.copy(tmpC); m.emissive.copy(tmpC);
        m.emissiveIntensity = i * (1 + ping * .5 - red * .25 * (live ? .8 + .2 * Math.sin(tt * 40) : 1)) + cool * 2;
      }
      const hullRed = redAt(lp, 1.15);
      tmpC.copy(COL.red).multiplyScalar(hullRed).lerp(COL.cool, cool * .6);
      for (let k = 0; k < hullMats.length; k++) { hullMats[k].emissive.copy(tmpC); hullMats[k].emissiveIntensity = .35 * hullRed + .4 * cool; }
      if (aerialMat) aerialMat.emissiveIntensity = 1.6 + ping * 4;
      thought.position.copy(headPt).setY(headPt.y + .55); thought.material.opacity = ping * .8; thought.scale.setScalar(.6 + ping * .9);
      reqTag.position.copy(headPt); reqTag.position.y += .98 + ping * .06; reqTag.quaternion.copy(camera.quaternion);
      reqTag.material.opacity = ramp(lp, .05, .08) * (.62 + .38 * ping); reqTag.scale.setScalar(1 + .12 * ping);
      reqTag.material.color.copy(tmpC.setRGB(1, 1, 1)).lerp(COL.red, red * .8);
      // pings: the three latest requests, each a ring leaving the head
      for (let k = 0; k < 3; k++) {
        let age = 1; for (let i = k; i < REQ.length; i += 3) if (REQ[i] <= lp) age = lp - REQ[i];
        const ring = pings[k]; ring.visible = age < .05;
        if (!ring.visible) continue;
        const u = age / .05;
        ring.position.copy(headPt).setY(headPt.y + .05 + u * .3); ring.scale.setScalar(.35 + expoOut(u) * 1.2);
        ring.material.opacity = Math.pow(1 - u, 1.4);
        ring.material.color.copy(COL.violet).lerp(COL.red, redAt(lp, 1.3)).multiplyScalar(2.4);
      }

      /* the ribbons in flight */
      for (let k = 1; k < 5; k++) carryLegs[k].live = false;
      for (let s = 0; s < NSLOT; s++) {
        const sl = slots[s]; let leg = null;
        const list = bySlot[s]; for (let i = 0; i < list.length; i++) { const l = list[i]; if (lp >= l.a && lp < l.a + l.d) { leg = l; break; } }
        if (!leg) { sl.m.visible = false; sl.tip.visible = false; continue; }
        const u = (lp - leg.a) / leg.d, head = inOut(u * LEAD), tail = Math.pow(clamp((u - .3) / .7), 2);
        if (leg.out) { w0.copy(muzzle); targetPoint(w3, leg.to, false); shape(w0, w1, w2, w3, mdir, true); }
        else { targetPoint(w0, leg.to, true); w3.copy(headPt); shape(w0, w1, w2, w3, mdir, false); }
        sl.u.p0.value.copy(w0); sl.u.p1.value.copy(w1); sl.u.p2.value.copy(w2); sl.u.p3.value.copy(w3);
        sl.u.head.value = head; sl.u.tail.value = tail; sl.u.width.value = leg.width; sl.u.glow.value = leg.glow; sl.u.noise.value = leg.noise; sl.u.time.value = tt;
        sl.u.color.value.copy(leg.color); if (leg.run) sl.u.color.value.lerp(COL.red, ramp(head, .5, 1)); // the run turns red as it lands
        sl.m.visible = head - tail > .002;
        bez(hp, w0, w1, w2, w3, head);
        sl.tip.visible = sl.m.visible && head < 1; sl.tip.position.copy(hp);
        sl.tip.material.color.copy(sl.u.color.value); sl.tip.material.opacity = 1;
        sl.tip.scale.setScalar((leg.out ? .42 : .28) * (leg.run ? 2.4 : 1) * (.85 + .15 * Math.sin(tt * 30 + s)));
        if (leg.carry) { leg.pos.copy(hp); leg.live = true; } // a carried sheet rides the head
      }
      threads.uLp.value = lp; threads.uTime.value = tt; threads.uHot.value = hot(lp); threads.uSweepY.value = sweepY(lp); threads.uLive.value = live;
      for (let k = 0; k < NIMP; k++) {
        let leg = null; for (let i = k; i < calls.length; i += NIMP) if (calls[i].hit <= lp) leg = calls[i];
        const m = impacts[k], age = leg ? lp - leg.hit : 1; m.visible = age < .03;
        if (!m.visible) continue;
        const u = age / .03; targetPoint(m.position, leg.to, false); m.position.y -= .03;
        m.scale.setScalar((.6 + expoOut(u) * 1.8) * (leg.run ? 2 : 1)); m.material.opacity = Math.pow(1 - u, 1.6);
        m.material.color.copy(leg.color).multiplyScalar(2.2); if (leg.run) m.material.color.copy(COL.red).multiplyScalar(2.6);
      }

      /* the files: pulled out on a hit, edges lit once read */
      for (let i = 0; i < sheets.length; i++) {
        const sh = sheets[i]; let first = -1, age = 1;
        for (let h = 0; h < sh.hits.length; h++) if (sh.hits[h] <= lp) { if (first < 0) first = sh.hits[h]; age = lp - sh.hits[h]; }
        const k = age / .05, pull = k < 1 ? (k < .28 ? expoOut(k / .28) : 1 - inOut((k - .28) / .72)) : 0;
        dummy.position.copy(sh.base).addScaledVector(sh.dir, pull * .36); dummy.position.y += pull * .12;
        dummy.rotation.set(-pull * .3, sh.rot + pull * .15, 0); dummy.scale.set(1, 1, 1); dummy.updateMatrix();
        paper.setMatrixAt(i, dummy.matrix); edges.setMatrixAt(i, dummy.matrix); labels[sh.type].setMatrixAt(sh.slot, dummy.matrix);
        const read = first >= 0 ? 1 : 0, flash = k < 1 ? Math.pow(1 - k, 2) : 0;
        tmpC.copy(TYPES[sh.type]).multiplyScalar(.28 + read * (1.25 + .2 * Math.sin(tt * 2.1 + i) * live) + flash * 3.5);
        tmpC.lerp(tmpC2.copy(COL.red).multiplyScalar(1.4), redAt(lp, sh.base.y + .2) * .5).lerp(tmpC2.copy(COL.cool).multiplyScalar(2), coolAt(lp, sh.base.y + .1));
        edges.setColorAt(i, tmpC.multiplyScalar(unlit));
      }
      paper.instanceMatrix.needsUpdate = true; edges.instanceMatrix.needsUpdate = true; edges.instanceColor.needsUpdate = true;
      for (let k = 0; k < labels.length; k++) labels[k].instanceMatrix.needsUpdate = true;

      /* the context tower */
      let top = TOWER.y0;
      for (let j = 0; j < TOWER.rings; j++) {
        const th = 27 + (j - TOWER.first + 1) * ringStep, k = j < TOWER.first ? 1 : clamp((tok - (th - ringStep)) / ringStep);
        const y = TOWER.y0 + j * TOWER.dy;
        dummy.rotation.set(0, 0, 0);
        if (k <= 0) { dummy.scale.setScalar(1e-4); dummy.position.set(TOWER.x, y, TOWER.z); }
        else {
          dummy.position.set(TOWER.x, y + (1 - back(k)) * .9, TOWER.z);
          dummy.rotation.set(Math.sin(tt * 1.3 + j) * .04 * live, 0, Math.cos(tt * 1.1 + j * .7) * .04 * live);
          dummy.scale.setScalar(.8 + .2 * expoOut(k) + Math.sin(tt * 2 + j * .5) * .015 * live);
          top = Math.max(top, lerp(TOWER.y0, y, smooth(k * 1.5)));
        }
        dummy.updateMatrix(); rings.setMatrixAt(j, dummy.matrix);
        const land = j < TOWER.first ? 0 : clamp(1 - (tok - th) / 6) * (k >= 1 ? 1 : k), f = j / (TOWER.rings - 1);
        tmpC.copy(COL.violet).lerp(tmpC2.setRGB(.86, .84, 1), f * .55).multiplyScalar(1.15 + f * .9 + land * 2.4);
        const flick = live ? .55 + .45 * Math.sin(tt * 33 + j * 1.7) : 1;
        tmpC.lerp(tmpC2.copy(COL.red).multiplyScalar(2.2 * flick), redAt(lp, y) * .85).lerp(tmpC2.copy(COL.cool).multiplyScalar(2.6), coolAt(lp, y));
        rings.setColorAt(j, tmpC);
      }
      rings.instanceMatrix.needsUpdate = true; rings.instanceColor.needsUpdate = true;
      core.scale.y = top; core.position.y = top / 2;
      core.material.color.copy(COL.violet).lerp(COL.red, redAt(lp, top) * .8).multiplyScalar(1.6);
      cap.position.set(TOWER.x, top + .16, TOWER.z);
      tokTag.position.set(TOWER.x, top + .62, TOWER.z); tokTag.quaternion.copy(camera.quaternion);
      tokTag.material.color.copy(tmpC.setRGB(1, 1, 1)).lerp(COL.red, redAt(lp, top) * .8);
      tokTag.material.opacity = ramp(lp, .02, .07); cap.scale.setScalar(.7 + .1 * Math.sin(tt * 2.4) * live + ping * .3);
      cap.material.color.copy(COL.violet).lerp(COL.red, redAt(lp, top)).lerp(COL.cool, coolAt(lp, top));
      towerRim.material.emissiveIntensity = 1.4 + ping * 1.2;

      /* the terminal */
      let termAge = 1, nTerm = 0;
      for (let i = 0; i < calls.length; i++) { const l = calls[i]; if (l.to.type === 'term' && l.hit <= lp) { nTerm++; termAge = lp - l.hit; } }
      const tflash = termAge < .02 ? Math.pow(1 - termAge / .02, 2) : 0;
      const tRed = ramp(lp, CRASH - .003, CRASH + .002) * (.75 + .25 * hot(lp)) * (1 - ramp(lp, FIXHIT - .002, FIXHIT + .01)), tCool = ramp(lp, FIXHIT - .002, FIXHIT + .008) * (1 - ramp(lp, .8, .9) * .6);
      screenMat.uniforms.uScroll.value = lp * 26 + nTerm * 3 + tt * .25;
      screenMat.uniforms.uTime.value = tt; screenMat.uniforms.uRed.value = tRed; screenMat.uniforms.uCool.value = tCool;
      screenMat.uniforms.uFlash.value = tflash; screenMat.uniforms.uGlitch.value = tRed * live;
      errLabel.material.opacity = tRed * (!live || Math.sin(tt * 26) > -.6 ? 1 : .3) * ramp(lp, CRASH + .003, CRASH + .01);
      errLabel.material.color.setRGB(2.4, .75, .8);
      termGlow.material.opacity = .2 + tflash * .7 + tRed * .8 + tCool * .15;
      termGlow.material.color.copy(COL.violet).lerp(COL.red, tRed).lerp(COL.cool, tCool);

      /* sheet one: rises, cracks, re-forms */
      const appear = ramp(lp, .462, .49), crack = expoOut((lp - CRASH - .002) / .02) * (1 - inOut((lp - (REFORM - .014)) / .014));
      one.visible = lp >= .462;
      one.position.copy(SLOTS[0]); one.position.y -= (1 - expoOut((lp - .462) / .028)) * .1;
      one.scale.set(.94 + .06 * appear, 1, .94 + .06 * appear); one.rotation.y = bookRot[0];
      const padRed = errAt(lp, .3) * (.6 + .4 * hot(lp)), padCool = coolAt(lp, .3), reformFlash = bump(lp, REFORM - .004, REFORM, REFORM + .03);
      for (let k = 0; k < shards.length; k++) {
        const sd = shards[k];
        const fl = Math.sin(tt * 1.7 + k * 1.3) * .015 * live;
        sd.g.position.set(sd.x + sd.out.x * crack, crack * (sd.lift + fl), sd.z + sd.out.z * crack);
        sd.g.rotation.set(sd.rx * crack, sd.ry * crack, sd.rz * crack);
      }
      shardTop.map = lp >= REFORM ? fullTex : partTex;
      tmpC.copy(COL.red).multiplyScalar(padRed).lerp(COL.cool, Math.max(padCool, reformFlash));
      shardPaper.emissive.copy(tmpC); shardPaper.emissiveIntensity = 1.1 * padRed + .8 * Math.max(padCool, reformFlash);
      shardTop.emissive.copy(tmpC); shardTop.emissiveIntensity = .6 * padRed + .5 * Math.max(padCool, reformFlash);
      shardEdge.opacity = clamp(crack * 2) * Math.max(padRed, .25 * hot(lp)) * (live ? .8 + .2 * Math.sin(tt * 30) : 1);
      shardEdge.color.copy(COL.red).multiplyScalar(2.6);
      oneEdge.visible = crack < .05;
      oneEdge.material.color.copy(COL.sheet).multiplyScalar(1.4 + bump(lp, .462, .47, .5) * 2.5 + reformFlash * 2.5).lerp(COL.red, padRed);
      const impact = bump(lp, CRASH - .002, CRASH + .004, .6);
      padGlow.material.opacity = impact * .95 + padRed * .25 + reformFlash * .6;
      padGlow.material.color.copy(reformFlash > padRed ? COL.cool : COL.red);
      padGlow.scale.setScalar(1.6 + 2.4 * impact + reformFlash);

      /* the other four sheets: carried out of the muzzle, landed, settled */
      let padHit = 0;
      for (let i = 0; i < calls.length; i++) { const l = calls[i]; if (l.to.type === 'pad' && l.hit <= lp && l.hit > REFORM) padHit = Math.max(padHit, bump(lp, l.hit, l.hit + .003, l.hit + .03)); }
      const done = bump(lp, .772, .786, .86);
      for (let k = 1; k < 5; k++) {
        const g = book[k], leg = carryLegs[k], rest = SLOTS[k];
        g.visible = lp >= leg.a;
        if (!g.visible) continue;
        const age = lp - leg.hit;
        if (age < 0) {
          const h = inOut((lp - leg.a) / leg.d * LEAD);
          if (leg.live) g.position.copy(leg.pos); else g.position.copy(muzzle).lerp(rest, h);
          g.rotation.set(Math.sin(h * Math.PI) * .45, bookRot[k] + (1 - h) * Math.PI * 1.5, 0);
          g.scale.setScalar(.55 + .45 * h);
        } else {
          const sq = bump(age, 0, .002, .03);
          g.position.copy(rest); g.position.y -= sq * .012;
          g.rotation.set(0, bookRot[k], 0); g.scale.set(1 + sq * .08, 1 - sq * .35, 1 + sq * .08);
        }
        const land = bump(age, 0, .002, .04), wave = bump(lp, .772 + k * .005, .779 + k * .005, .84);
        g.userData.edge.material.color.copy(COL.sheet).multiplyScalar(1.4 + land * 3 + wave * 2.5 + padHit * 1.2 + Math.sin(tt * 1.8 + k) * .15 * live);
      }
      for (let k = 0; k < 5; k++) {
        const filled = k === 0 ? lp >= .462 : lp >= carryLegs[k].hit;
        ghosts[k].visible = !filled && lp > .3;
        ghosts[k].material.opacity = ramp(lp, .3 + k * .02, .4 + k * .02) * (.55 + .25 * Math.sin(tt * 3 + k) * live);
      }
      padRim.material.emissiveIntensity = 1.3 + done * 2 + padHit + reformFlash * 2 + padRed * 1.5;
      padRim.material.emissive.copy(COL.sheet).lerp(COL.red, padRed);

      /* the light of the moment: the rim, the pool, the shaft, the sweep, the glitch */
      const allRed = redAt(lp, 0), floorCool = coolAt(lp, .2);
      rim.material.emissive.copy(COL.violet).lerp(COL.red, allRed).lerp(COL.cool, coolAt(lp, 0));
      rim.material.emissiveIntensity = 1.1 + ping * .5 + allRed * 1.4 + Math.sin(tt * 2) * .15 * live + done * .5;
      pool.material.color.copy(COL.steel).multiplyScalar((.3 + ping * .2 + tflash * .1) * .4).lerp(tmpC.copy(COL.red).multiplyScalar(.95), Math.max(impact, allRed * .45)).lerp(tmpC2.copy(COL.cool).multiplyScalar(.6 * .4), floorCool);
      shaft.material.color.copy(COL.steel).multiplyScalar((.075 + ping * .06) * .4).lerp(tmpC.copy(COL.red).multiplyScalar(.26), impact * .9 + redAt(lp, 2) * .25).lerp(tmpC2.copy(COL.cool).multiplyScalar(.2 * .4), Math.max(coolAt(lp, 1.5), done * .5));
      const sy = sweepY(lp);
      sweep.visible = sy > -.5 && sy < 3.08;
      if (sweep.visible) {
        const k = clamp(sy / 3.1);
        sweep.position.y = sy; sweep.scale.setScalar(lerp(1, .42, k)); sweep.material.opacity = Math.min(1, (sy + .5) * 2) * (1 - smooth((k - .55) / .45));
        sweep.material.color.copy(COL.cool).multiplyScalar(2);
      }
      const gl = live * ramp(lp, CRASH - .001, CRASH + .003) * (1 - ramp(lp, .565, .6));
      bars.visible = gl > 0;
      if (bars.visible) {
        bars.quaternion.copy(camera.quaternion);
        const tick = Math.floor(tt * 24);
        for (let k = 0; k < barList.length; k += 2) {
          const r = barList[k], cy = barList[k + 1], on = hash(k * 13.1 + tick) < .6 * gl + .12;
          r.visible = cy.visible = on;
          if (!on) continue;
          const x = (hash(k + tick * .37) - .5) * 2.4, y = (hash(k * 3 + tick * .71) - .5) * 2, w = .25 + hash(k * 7 + tick) * 1.3, h = .012 + hash(k * 5 + tick) * .035;
          r.position.set(x, y, k * .01); r.scale.set(w, h, 1); cy.position.set(x + .035, y - .012, k * .01 + .005); cy.scale.set(w * .8, h * .7, 1);
          r.material.opacity = gl * (.6 + hash(k + tick * 1.3) * .4); cy.material.opacity = r.material.opacity * .7;
        }
      }
    },
  };
  return api;
}

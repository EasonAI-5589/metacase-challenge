/* mc-verdict.js — "Evidence, disposition and score" on the Metacase page: the robot from the film
 * works through the findings on its plinth while the cards scroll beside it. The film's language
 * (mc-kit's robot and weapon, the plinth, sheets, medallions, ring towers), but reader-paced: the
 * copy is a normal column, the stage is sticky, and the cards hold every figure in the page's text.
 *
 * s is the position of the reading line along the 13 cards: at s = i, card i is on the line.
 * Card i plays from s = i - .75 to i + .25 (local u, 0..1), so at rest on a card u = .75 and the
 * picture holds that card's result.
 *   six conflicts   u 0–.14 the papers fly in · .12–.34 the robot reads them · .30–.42 they clash
 *                   (or a date hits the cutoff, or a void rule is struck out) · .46–.62 a medallion
 *                   flies to its slot and stamps: met, partly met or missed, as in the film · .85–1 filed
 *   seven groups    five ring towers' worth of plinth rises at s 5.15–5.7; one ring is two points.
 *                   u 0–.14 the draft appears · .20–.30 the robot rules on it and the stamp lands ·
 *                   .30–.42 it sinks in · .36–.70 the rings light to the points earned; the rest go dim red
 * Everything is a function of s; t only adds idle life. Debug: metacase.html?verdict=3.5&film-gl. */
import * as THREE from './assets/vendor/three/three.module.js';
import * as kit from './mc-kit.js?v=20261105-grip';
import { createPost } from './mc-toon.js?v=20261102-toy';
import { loadArenaWeapons } from './arena-models.js?v=20261028-cascade';
import { clamp, smooth, ramp, lerp, glowSprite } from './mc-stage.js?v=20261105-grip';

const { PALETTE, GUN_HOLD, add, cyl, rbox, mat } = kit;

// Numbers and dates only on the set, so the picture needs no translation; the cards carry the words.
const CONFLICTS = [
  { a: '70%', b: '100%', out: 'M' },
  { a: '08-04', gate: true, out: 'M' },
  { a: '09-18', b: '09-16', out: 'P' },
  { a: '80–125%', strike: true, out: 'M' },
  { a: '−13,220.44', b: '−13,220.46', out: 'X' },
  { a: '−4,431,207.65', b: '−4,395,835.74', out: 'P' },
];
const GROUPS = [
  { pts: 27.5, max: 64, stamp: 'no' },
  { pts: 12.25, max: 38, stamp: 'no' },
  { pts: 7.5, max: 20, stamp: 'amend' },
  { pts: 2.5, max: 10, stamp: 'amend' },
  { pts: 0, max: 20, stamp: 'no' },
  { pts: 7.5, max: 10, stamp: '11 h' },
  { pts: 0, max: 10, stamp: '—' },
];
const NC = CONFLICTS.length, NG = GROUPS.length, LAST = NC + NG - 1;
const OUT = { M: [.1, .95, .36], P: [1.1, .5, .04], X: [.12, .14, .19] };
const FLASH = { M: 2.6, P: 2.4, X: .7 };
const RED = 0xff2a3d, CYAN = 0x8ff6ff, TEAL = 0x45b5b0, AMBER = 0xf2b545;
const PLINTH_R = 3.95, BOT = { x: 2.45, z: .6, s: 1.25 }, YAW_A = -1.5, YAW_MIN = -1.5, YAW_MAX = -1.2; // it stays turned towards the camera
const SHEET = { w: 1.8, h: 1.22, y: 1.5, z: -.35, lx: -2, rx: .55, cx: -.72, gate: .42 };
const COIN_Z = 2.35, coinX = i => -2.1 + i * .74, COIN_S = 1.55;
const FIRE = .46, HIT = .62, LEAVE = .85;
const RING_PTS = 2, RING_DY = .082, RING_Y0 = .12;
const towerAt = j => { const k = j / (NG - 1); return { x: lerp(-3.2, 1.35, k), z: -1.1 - Math.sin(k * Math.PI) * .7 }; };
const SHOT_A = { pos: [0, 3.1, 10.7], look: [-.1, .78, 0] }, SHOT_B = { pos: [-.2, 5, 11.6], look: [-.35, 1, -.5] }, FOV = 34;
const STACKED = '(max-width: 600px), (max-aspect-ratio: 11/10)';

const back = (x, s = 1.7) => { x = clamp(x) - 1; return 1 + (s + 1) * x * x * x + s * x * x; };
const inOut = x => { x = clamp(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const flashAt = (x, at, w) => { const k = (x - at) / w; return k < 0 || k >= 1 ? 0 : (1 - k) * (1 - k); };
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

function webglOk(strict) {
  try {
    const c = document.createElement('canvas'), o = strict ? { failIfMajorPerformanceCaveat: true } : undefined;
    const gl = c.getContext('webgl2', o) || c.getContext('webgl', o);
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

function canvasTexture(w, h, paint) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = () => { paint(c.getContext('2d'), w, h); tex.needsUpdate = true; };
  draw(); document.fonts?.ready.then(draw);
  return tex;
}
// a sheet of paper: ruled lines and, if it has one, a figure in the middle
const sheetTexture = text => canvasTexture(768, 522, (g, w, h) => {
  g.fillStyle = '#f6efe0'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#cbc4b4';
  [[56, 52, 300], [56, 88, 210], [56, 424, 656], [56, 460, 420]].forEach(([x, y, l]) => g.fillRect(x, y, l, 16));
  if (!text) { [150, 206, 262, 318, 374].forEach((y, i) => g.fillRect(56, y, i % 2 ? 560 : 656, 16)); return; }
  g.fillStyle = '#1f2a3a'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `650 ${text.length > 8 ? 92 : 148}px Inter, Arial, sans-serif`;
  g.fillText(text, w / 2, h / 2 + 8, w * .9);
});
// the ruling stamped on a draft
const stampTexture = kind => canvasTexture(256, 256, (g, w, h) => {
  const color = kind === 'no' ? '#ff4a55' : kind === 'amend' ? '#f2b545' : kind === '—' ? '#8a93a6' : '#45b5b0';
  g.clearRect(0, 0, w, h);
  g.strokeStyle = g.fillStyle = color; g.lineWidth = 16; g.lineCap = 'round';
  g.beginPath(); g.arc(w / 2, h / 2, 106, 0, Math.PI * 2); g.stroke();
  if (kind === 'no') {
    g.lineWidth = 26; g.beginPath(); g.moveTo(82, 82); g.lineTo(174, 174); g.moveTo(174, 82); g.lineTo(82, 174); g.stroke();
    return;
  }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = `700 ${kind.length > 2 ? 74 : 128}px Inter, Arial, sans-serif`;
  g.fillText(kind === 'amend' ? '≈' : kind, w / 2, h / 2 + 6, w * .7);
});

export function createVerdict(root) {
  const stage = root.querySelector('.mc-verdict-stage'), canvas = root.querySelector('.mc-verdict-canvas');
  const cards = [...root.querySelectorAll('.mc-verdict-step')];
  const hud = root.querySelector('.mc-verdict-hud'), totalEl = root.querySelector('[data-verdict-total]');
  const params = new URLSearchParams(location.search);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let held = params.has('verdict') ? clamp(parseFloat(params.get('verdict')) || 0, -1, LAST) : null;
  const heldT = params.has('t') ? parseFloat(params.get('t')) || 0 : null;
  const relaxed = held != null || params.has('film-gl');
  if (!canvas || cards.length !== LAST + 1 || !webglOk(!relaxed)) return null;
  root.classList.add('is-live');

  const stacked = matchMedia(STACKED);
  let renderer, scene, camera, post, ready = false, disabled = false, W = 0, H = 0, lowFx = false, update = () => {};

  function goStatic() {
    disabled = true; root.classList.remove('is-live');
    cards.forEach(c => c.classList.remove('is-active'));
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  /* ---- the reading line: which card is on it, as a continuous position ---- */
  function lineY() {
    if (!stacked.matches) return innerHeight * .52;
    const r = stage.getBoundingClientRect();
    return r.bottom + (innerHeight - r.bottom) * .5;
  }
  const centre = el => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; };
  function progress() {
    const y = lineY(), c = cards.map(centre);
    if (y >= c[LAST]) return LAST;
    if (y < c[0]) return clamp((y - c[0]) / (c[1] - c[0]), -1, 0);
    let i = 0;
    while (i < LAST - 1 && y >= c[i + 1]) i++;
    return i + (y - c[i]) / (c[i + 1] - c[i]);
  }
  let active = -1, shownTotal = '', hudOn = false;
  function paint(s) {
    const k = clamp(Math.round(s), 0, LAST);
    if (k !== active) { cards[active]?.classList.remove('is-active'); cards[k].classList.add('is-active'); active = k; }
    const on = s > 5.4;
    if (on !== hudOn) { hudOn = on; hud.classList.toggle('is-on', on); }
  }

  /* ---- the set ---- */
  async function build() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    } catch (error) { console.warn('The verdict stage could not start WebGL.', error); goStatic(); return; }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    const bg = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#05070e');
    scene.background = bg;
    const light = kit.lights(scene, { span: 9, shadowSize: 1024 });
    light.key.position.set(5.5, 11, 4.4);
    camera = new THREE.PerspectiveCamera(FOV, 1, .1, 80);
    post = createPost(renderer, { bloom: .34, threshold: .85, vignette: 0 });
    resize();
    const set = new THREE.Group(); scene.add(set);
    const additive = (opts = {}) => new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, ...opts });
    const glowOwn = (color, intensity = 1.2) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: .5 });

    /* the plinth, as in the grading beat */
    cyl(set, PLINTH_R, PLINTH_R + .15, .32, 0x1c2740, 0, -.32, 0, 72);
    cyl(set, PLINTH_R + .16, PLINTH_R - .1, .5, 0x111a2d, 0, -.82, 0, 72);
    const rimMat = glowOwn(AMBER, 1.1);
    add(set, new THREE.TorusGeometry(PLINTH_R + .06, .03, 8, 128), rimMat, 0, .005, 0, false).rotation.x = Math.PI / 2;

    /* the robot, armed with Claude Code */
    const bot = kit.robot(PALETTE.cream, CYAN);
    bot.root.position.set(BOT.x, 0, BOT.z); bot.root.scale.setScalar(BOT.s); set.add(bot.root);
    let gun;
    try { const { weapons } = await loadArenaWeapons(); gun = weapons[2].clone(true); } catch { gun = kit.blaster(AMBER); }
    gun.scale.setScalar(.56); gun.position.copy(GUN_HOLD.at); gun.rotation.copy(GUN_HOLD.turn); bot.root.add(gun); bot.grip(1);
    const muzzleMark = new THREE.Object3D(); muzzleMark.position.set(0, 0, .93); gun.add(muzzleMark);
    add(set, new THREE.TorusGeometry(.5, .025, 8, 48), glowOwn(CYAN, 1), BOT.x, .012, BOT.z, false).rotation.x = Math.PI / 2;
    const flare = glowSprite(0xffe2a0, .9, 0); set.add(flare);

    /* the two sheets, whose faces change with the card */
    const blank = sheetTexture('');
    const tex = CONFLICTS.map(c => ({ a: sheetTexture(c.a), b: c.b ? sheetTexture(c.b) : blank }));
    const makeSheet = () => {
      const g = new THREE.Group();
      add(g, rbox(SHEET.w + .05, SHEET.h + .05, .05, .03), mat(0x5d6d8c), 0, 0, -.012);
      const faceMat = new THREE.MeshStandardMaterial({ map: blank, roughness: .8 });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(SHEET.w, SHEET.h), faceMat); face.position.z = .02; g.add(face);
      set.add(g);
      return { g, faceMat };
    };
    const L = makeSheet(), R = makeSheet();
    const stampTex = GROUPS.map(g => stampTexture(g.stamp));
    const stampMat = new THREE.MeshBasicMaterial({ map: stampTex[0], transparent: true, depthWrite: false, toneMapped: false });
    const stamp = new THREE.Mesh(new THREE.PlaneGeometry(.92, .92), stampMat); stamp.position.z = .05; L.g.add(stamp);

    /* the clash between two papers: two jagged lines of light and a glow where they meet */
    const jag = seed => {
      const pts = [];
      for (let i = 0; i <= 9; i++) {
        const w = i && i < 9 ? .1 : 0, h = Math.sin(seed * 7.1 + i * 12.9898) * 43758.5453, r = h - Math.floor(h);
        pts.push(new THREE.Vector3(i / 9, (r - .5) * 2 * w, Math.cos(i * 2.3 + seed) * w));
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1), 60, .016, 6);
    };
    const arcs = [1, 2].map(seed => { const m = new THREE.Mesh(jag(seed), new THREE.MeshBasicMaterial({ color: new THREE.Color(RED).multiplyScalar(2.2), toneMapped: false })); m.frustumCulled = false; set.add(m); return m; });
    const clashGlow = glowSprite(RED, 1.3, 0); set.add(clashGlow);

    /* the fact cutoff a late paper cannot cross, and the bar that strikes out a void rule */
    const gateMat = glowOwn(TEAL, 1.3);
    const gate = add(set, new THREE.CylinderGeometry(.05, .05, 2.8, 12), gateMat, SHEET.gate, 1.4, SHEET.z, false);
    const strike = add(set, rbox(2.45, .14, .05, .03), glowOwn(RED, 1.8), SHEET.cx, SHEET.y, SHEET.z + .1, false); strike.rotation.z = .42;

    /* beams: the robot reading, and its ruling leaving the muzzle */
    const beamGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true).translate(0, .5, 0);
    const eyeBeam = new THREE.Mesh(beamGeo, additive({ color: CYAN })), fireBeam = new THREE.Mesh(beamGeo, additive({ color: AMBER }));
    [eyeBeam, fireBeam].forEach(m => { m.frustumCulled = false; set.add(m); });
    const impact = glowSprite(0xffffff, 1.2, 0); set.add(impact);

    /* the six medallions: the film's coin, cream with an inlay that takes the outcome */
    const coinGeo = new THREE.LatheGeometry([[0, -.045], [.17, -.045], [.195, -.026], [.2, 0], [.195, .026], [.17, .045], [.163, .045], [.156, .032], [0, .032]].map(([x, y]) => new THREE.Vector2(x, y)), 36);
    const inlayGeo = new THREE.CircleGeometry(.152, 32).rotateX(-Math.PI / 2).translate(0, .035, 0);
    const ringGeo2 = new THREE.RingGeometry(.84, 1, 48).rotateX(-Math.PI / 2);
    const coins = CONFLICTS.map((c, i) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(coinGeo, new THREE.MeshStandardMaterial({ color: 0xf5efe5, roughness: .5 })); body.castShadow = true; g.add(body);
      const inlay = new THREE.Mesh(inlayGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); g.add(inlay);
      set.add(g);
      const ring = new THREE.Mesh(ringGeo2, additive()); ring.position.set(coinX(i), .03, COIN_Z); ring.renderOrder = 2; set.add(ring);
      return { g, inlay, ring, out: c.out, slot: new THREE.Vector3(coinX(i), .08, COIN_Z) };
    });

    /* the towers: one ring for two points, dark until earned */
    const towers = GROUPS.map((g, j) => {
      const at = towerAt(j), rings = Math.ceil(g.max / RING_PTS);
      const text = `${g.pts} / ${g.max}`;
      const label = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .366), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, toneMapped: false, opacity: 0,
        map: kit.labelTexture(`verdict-${j}`, [{ text, size: 170, weight: 600, color: '#dfe9f7' }], { width: 768, height: 256 }) }));
      set.add(label);
      const pad = add(set, new THREE.TorusGeometry(.36, .018, 8, 40), glowOwn(TEAL, .5), at.x, .012, at.z, false); pad.rotation.x = Math.PI / 2;
      return { ...at, rings, earned: g.pts / RING_PTS, pts: g.pts, label, pad, top: RING_Y0 + rings * RING_DY };
    });
    const ringCount = towers.reduce((n, t) => n + t.rings, 0);
    const towerRings = new THREE.InstancedMesh(new THREE.TorusGeometry(.24, .03, 8, 32).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), ringCount);
    towerRings.frustumCulled = false; set.add(towerRings);
    const GHOST = new THREE.Color(.05, .068, .12), LOST = new THREE.Color(.2, .05, .075), LIT = new THREE.Color(TEAL).multiplyScalar(1.5), HOT = new THREE.Color(.6, 1.8, 1.7);
    const dummy = new THREE.Object3D(), tc = new THREE.Color(), oc = new THREE.Color();
    for (let i = 0; i < ringCount; i++) { towerRings.setColorAt(i, GHOST); towerRings.setMatrixAt(i, dummy.matrix); }

    const V = () => new THREE.Vector3();
    const pos = V(), look = V(), pa = V(), pb = V(), la = V(), lb = V(), muzzle = V(), head = V(), target = V(), dir = V(), a = V(), UP = new THREE.Vector3(0, 1, 0);
    pa.fromArray(SHOT_A.pos); pb.fromArray(SHOT_B.pos); la.fromArray(SHOT_A.look); lb.fromArray(SHOT_B.look);
    const STACK = new THREE.Vector3(-3.6, .5, -2.4);
    function beam(m, from, to, r, opacity) {
      dir.subVectors(to, from);
      const len = dir.length();
      m.visible = opacity > .01 && len > .001;
      if (!m.visible) return;
      m.position.copy(from); m.quaternion.setFromUnitVectors(UP, dir.divideScalar(len)); m.scale.set(r, len, r); m.material.opacity = opacity;
    }
    function placeSheet(sh, x, u, cur, phase, t, idle, tilt = 0) {
      const enter = back(u / .14), gone = smooth((u - LEAVE) / (1 - LEAVE));
      a.set(x, SHEET.y + Math.sin(t * 1.4 + phase) * .025 * idle, SHEET.z);
      sh.g.position.lerpVectors(STACK, a, clamp(enter));
      sh.g.position.y += Math.sin(clamp(u / .14) * Math.PI) * .4;
      if (gone) { a.copy(sh.g.position); sh.g.position.lerp(coins[cur].slot, gone); }
      sh.g.rotation.set(-.05, 0, tilt);
      sh.g.scale.setScalar(Math.max(.001, clamp(enter) * (1 - gone)));
    }

    update = (s, t) => {
      const idle = reduce ? 0 : 1;
      const cur = Math.floor(s + .75), u = s + .75 - cur, jc = cur - NC;
      const inA = cur >= 0 && cur < NC, inB = jc >= 0 && jc < NG;
      // the first group waits for the camera and the towers
      const ub = jc > 0 ? u : u < .75 ? clamp((u - .35) / .4) * .75 : u;
      const transit = ramp(s, 5.1, 5.55), rise = ramp(s, 5.15, 5.7);

      /* the camera: close on the papers, then back to take in the towers */
      pos.lerpVectors(pa, pb, transit); look.lerpVectors(la, lb, transit);
      pos.x += (clamp(s / 5) - .5) * (1 - transit) * .6;
      const aspect = W / H;
      pos.sub(look).multiplyScalar(clamp(1.14 / aspect, 1, 1.9)).add(look);
      camera.position.copy(pos); camera.aspect = aspect; camera.lookAt(look); camera.updateProjectionMatrix(); camera.updateMatrixWorld();

      /* the papers */
      L.g.visible = R.g.visible = stamp.visible = false;
      arcs.forEach(m => { m.visible = false; }); clashGlow.material.opacity = 0;
      gate.visible = strike.visible = false;
      target.set(SHEET.cx, SHEET.y, SHEET.z);
      let scan = 0, yaw = YAW_A;
      if (inA) {
        const c = CONFLICTS[cur], pair = !!c.b, gone = smooth((u - LEAVE) / (1 - LEAVE));
        let lx = pair ? SHEET.lx : SHEET.cx, tilt = 0;
        if (c.gate) {
          const go = ramp(u, .2, .34), recoil = ramp(u, .34, .5);
          lx = lerp(lerp(-2.15, SHEET.gate - SHEET.w / 2 - .04, go * go), -1.75, recoil);
          tilt = recoil * .2;
        }
        const clash = pair ? ramp(u, .3, .42) * (1 - gone) : 0, shake = Math.sin(t * 47) * .014 * clash * idle;
        L.g.visible = true; L.faceMat.map = tex[cur].a;
        placeSheet(L, lx - shake, u, cur, 0, t, idle, tilt);
        if (pair) { R.g.visible = true; R.faceMat.map = tex[cur].b; placeSheet(R, SHEET.rx + shake, u, cur, 1.7, t, idle); }
        if (clash > .01) {
          const x0 = SHEET.lx + SHEET.w / 2, span = SHEET.rx - SHEET.w / 2 - x0;
          arcs.forEach((m, k) => { m.visible = true; m.position.set(x0, SHEET.y, SHEET.z); m.scale.x = span * clash; m.rotation.x = (k ? -1 : 1) * t * 9 * idle + k; });
          clashGlow.position.set(x0 + span / 2, SHEET.y, SHEET.z + .1);
          clashGlow.scale.setScalar(1.25 + Math.sin(t * 21) * .18 * idle); clashGlow.material.opacity = clash * .85;
        }
        if (c.gate) { gate.visible = true; gate.scale.y = Math.max(.001, ramp(u, .08, .18) * (1 - gone)); gateMat.emissiveIntensity = 1.3 + flashAt(u, .34, .14) * 6; }
        if (c.strike) { strike.visible = true; strike.scale.x = Math.max(.001, ramp(u, .3, .42) * (1 - gone)); }
        const sweep = ramp(u, .12, .34);
        scan = Math.sin(clamp((u - .12) / .22) * Math.PI);
        target.set(pair ? lerp(SHEET.lx, SHEET.rx, sweep) : L.g.position.x + (sweep - .5) * 1, SHEET.y, SHEET.z);
        if (u > FIRE) target.lerp(coins[cur].slot, smooth((u - FIRE) / .16));
      }

      /* the towers and the running total */
      let total = 0;
      towerRings.visible = rise > .001;
      if (towerRings.visible) {
        let n = 0;
        towers.forEach((tw, j) => {
          const f = j < jc ? 1 : j === jc ? inOut((ub - .36) / .34) : 0, e = tw.earned * f, settled = j < jc || (j === jc && ub > .7);
          total += tw.pts * f;
          const up = clamp(rise * 1.7 - j * .11);
          for (let r = 0; r < tw.rings; r++, n++) {
            const lit = clamp(e - r), front = j === jc && f > 0 && f < 1 && lit > 0 && lit < 1;
            towerRings.setColorAt(n, tc.copy(settled ? LOST : GHOST).lerp(front ? HOT : LIT, lit));
            dummy.position.set(tw.x, RING_Y0 + r * RING_DY - (1 - up) * .5, tw.z);
            dummy.scale.setScalar(Math.max(.001, up)); dummy.updateMatrix(); towerRings.setMatrixAt(n, dummy.matrix);
          }
          const op = j < jc ? .7 : j === jc ? ramp(ub, .55, .72) : 0;
          tw.label.visible = op > .01;
          if (tw.label.visible) { tw.label.material.opacity = op; tw.label.scale.setScalar(j === jc ? 1 : .68); tw.label.position.set(tw.x, tw.top + (j === jc ? .3 : .22), tw.z); tw.label.quaternion.copy(camera.quaternion); }
          tw.pad.visible = up > .5; tw.pad.material.emissiveIntensity = j === jc ? 1.8 : .5;
        });
        towerRings.instanceMatrix.needsUpdate = true; towerRings.instanceColor.needsUpdate = true;
      } else towers.forEach(tw => { tw.label.visible = false; tw.pad.visible = false; });
      const text = total.toFixed(2);
      if (text !== shownTotal) { shownTotal = text; totalEl.textContent = text; }

      /* a draft arrives over the tower, the ruling lands on it, it sinks in */
      if (inB) {
        const tw = towers[jc], enter = back(ub / .14), sink = inOut((ub - .3) / .12);
        const top = tw.top + .72 - sink * .6;
        L.g.visible = ub > 0 && sink < 1;
        L.faceMat.map = blank;
        L.g.position.set(tw.x, top + Math.sin(t * 1.4) * .02 * idle, tw.z);
        L.g.quaternion.copy(camera.quaternion);
        L.g.scale.setScalar(Math.max(.001, .5 * clamp(enter) * (1 - sink)));
        stamp.visible = ub > .24; stampMat.map = stampTex[jc];
        stamp.scale.setScalar(Math.max(.001, back((ub - .24) / .08, 2.4)));
        const aim = Math.atan2(tw.x - BOT.x, tw.z - BOT.z), prev = jc ? Math.atan2(towers[jc - 1].x - BOT.x, towers[jc - 1].z - BOT.z) : YAW_A;
        yaw = clamp(lerp(prev, prev + wrap(aim - prev), jc ? ramp(ub, 0, .2) : ramp(u, .25, .6)), YAW_MIN, YAW_MAX);
        target.set(tw.x, ub > .36 ? tw.top * .6 : top, tw.z);
      } else if (cur >= NC) yaw = YAW_MIN;

      /* the robot: it reads, rules and watches */
      const recoilA = inA ? flashAt(u, FIRE, .1) : 0, recoilB = inB ? flashAt(ub, .2, .1) : 0, recoil = Math.max(recoilA, recoilB);
      bot.update(t * idle, 0);
      bot.root.position.set(BOT.x - Math.sin(yaw) * .08 * recoil, Math.abs(Math.sin(t * 2.1)) * .02 * idle, BOT.z - Math.cos(yaw) * .08 * recoil);
      bot.root.rotation.y = yaw;
      bot.head.getWorldPosition(head); head.y += .2;
      const rel = wrap(Math.atan2(target.x - BOT.x, target.z - BOT.z) - yaw), dist = Math.hypot(target.x - BOT.x, target.z - BOT.z);
      bot.head.rotation.y = clamp(rel, -.35, .35) + Math.sin(t * .8) * .04 * idle;
      bot.head.rotation.x = clamp(-Math.atan2(target.y - head.y, dist), -.6, .45);
      muzzleMark.getWorldPosition(muzzle);
      beam(eyeBeam, head, target, .012, scan * .8);
      let fire = 0;
      if (inB) { fire = Math.sin(clamp((ub - .2) / .1) * Math.PI); a.copy(L.g.position); beam(fireBeam, muzzle, a, .028, fire); }
      else fireBeam.visible = false;
      flare.position.copy(muzzle); flare.material.opacity = Math.max(recoil, fire * .7);

      /* the medallions */
      let pulse = 0;
      coins.forEach((c, i) => {
        const cu = i < cur ? 1 : i === cur ? u : 0, fl = (cu - FIRE) / (HIT - FIRE);
        c.g.visible = cu > FIRE; c.ring.visible = false;
        if (!c.g.visible) return;
        const col = OUT[c.out];
        if (fl < 1) {
          const k = smooth(fl);
          c.g.position.lerpVectors(muzzle, c.slot, k); c.g.position.y += Math.sin(k * Math.PI) * 1.05;
          c.g.rotation.set((1 - k) * Math.PI * 4, 0, 0); c.g.scale.setScalar(COIN_S);
          c.inlay.material.color.setRGB(.2, .24, .34);
          return;
        }
        const hit = i === cur ? flashAt(u, HIT, .1) : 0;
        pulse = Math.max(pulse, hit);
        c.g.position.copy(c.slot); c.g.rotation.set(0, 0, 0);
        c.g.scale.set(COIN_S * (1 + hit * .2), COIN_S * (1 - hit * .45), COIN_S * (1 + hit * .2));
        c.inlay.material.color.setRGB(col[0], col[1], col[2]).multiplyScalar(1 + hit * FLASH[c.out]);
        if (hit > .01) {
          c.ring.visible = true; c.ring.scale.setScalar(.35 + (1 - hit) * 1.2); c.ring.material.opacity = hit;
          c.ring.material.color.setRGB(Math.max(col[0], .4), Math.max(col[1], .4), Math.max(col[2], .45));
        }
      });

      /* light answers: the rim takes the colour of the ruling, a flash where it lands */
      const landing = inB ? flashAt(ub, .26, .14) : 0;
      if (inA && pulse > 0) { const col = OUT[CONFLICTS[cur].out]; oc.setRGB(col[0], col[1], col[2]); } else oc.setHex(AMBER);
      rimMat.emissive.copy(oc); rimMat.emissiveIntensity = 1.1 + Math.max(pulse, landing) * 2.2;
      if (landing > .01) { impact.position.copy(L.g.position); impact.scale.setScalar(.8 + (1 - landing) * 1.2); impact.material.opacity = landing; } else impact.material.opacity = 0;
    };
    if (disabled) return;
    ready = true;
    wake();
  }

  // the pin sits under whatever is sticky above it; a phone's header wraps to two rows
  function measureTop() {
    let top = 0;
    for (const el of [document.querySelector('.site-header'), document.querySelector('.subnav')]) {
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.position === 'sticky' || cs.position === 'fixed') top = Math.max(top, (parseFloat(cs.top) || 0) + el.offsetHeight);
    }
    if (top) root.style.setProperty('--verdict-top', `${top}px`);
  }
  function resize() {
    measureTop();
    if (!renderer) return;
    const w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight);
    if (w === W && h === H) return;
    W = w; H = h;
    renderer.setSize(W, H, false);
    post.setSize(W, H);
  }
  function draw() {
    if (lowFx) { renderer.setRenderTarget(null); renderer.render(scene, camera); }
    else post.render(scene, camera);
  }

  /* ---- a GPU that cannot keep up loses bloom and shadows first, then the stage ---- */
  const gov = { skip: 12, samples: [], stage: 0, off: relaxed || reduce };
  function govern(ms) {
    if (gov.off || gov.stage > 1) return;
    if (gov.skip > 0) { gov.skip--; return; }
    gov.samples.push(ms);
    if (gov.samples.length < 60) return;
    const med = gov.samples.sort((x, y) => x - y)[30];
    gov.samples = []; gov.skip = 6;
    if (med > 28 && gov.stage === 0) {
      gov.stage = 1; lowFx = true; renderer.shadowMap.enabled = false; renderer.setPixelRatio(1); W = H = 0; resize();
    } else if (med > 45 && gov.stage === 1) {
      gov.stage = 2; goStatic(); renderer.dispose();
    } else if (med <= 28) gov.stage = 3;
  }

  /* ---- the loop: only while the stage is near the window and the tab is visible ---- */
  let raf = 0, near = false, last = performance.now(), clock = 0, built = false;
  function frame(now) {
    const ms = now - last; last = now; clock += Math.min(.05, Math.max(0, ms / 1000));
    let s = held ?? progress();
    if (reduce) s = Math.round(clamp(s, 0, LAST));
    paint(s);
    if (ready) { update(s, heldT ?? clock); draw(); govern(ms); }
  }
  function loop(now) {
    raf = 0;
    if (disabled || !near || document.hidden) return;
    frame(now);
    if (!reduce) raf = requestAnimationFrame(loop);
  }
  function wake() { if (!raf && near && !document.hidden && !disabled) { last = performance.now(); raf = requestAnimationFrame(loop); } }

  new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && !built) { built = true; build(); } }, { rootMargin: '100% 0px' }).observe(root);
  new IntersectionObserver(es => { near = es.some(e => e.isIntersecting); if (near) wake(); }, { rootMargin: '30% 0px' }).observe(root);
  document.addEventListener('visibilitychange', wake);
  addEventListener('scroll', wake, { passive: true });
  new ResizeObserver(() => { resize(); wake(); }).observe(stage);
  measureTop();
  document.fonts?.ready.then(measureTop);

  // ?verdict=s: bring that card onto the reading line (and hold the picture there)
  const api = { get state() { return { active, ready, W, H, lowFx }; } };
  if (held != null) {
    const place = () => {
      const i = clamp(Math.floor(held), 0, LAST - 1), f = held - i;
      const y = lerp(centre(cards[i]), centre(cards[i + 1]), f) + scrollY - lineY();
      window.scrollTo({ top: y, behavior: 'instant' });
      window.__lenis?.scrollTo(y, { immediate: true, force: true });
    };
    addEventListener('load', () => { place(); setTimeout(place, 600); setTimeout(place, 1500); }, { once: true });
    api.hold = s => { held = clamp(s, -1, LAST); place(); wake(); };
  }
  return api;
}

const host = document.querySelector('[data-verdict]');
if (host) { const api = createVerdict(host); if (new URLSearchParams(location.search).has('verdict')) window.__verdict = api; }

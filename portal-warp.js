/* portal-warp.js — the shuttle from a portal in the arena (index.html) into its track on the
 * Challenge page, and the track guardians beside each track heading there. The shuttle is plain
 * elements and CSS (v2.css, "the shuttle") that animate only transform and opacity, so the
 * compositor keeps it smooth while the next page loads: leaving, an iris of the tunnel's dark grows
 * from the doorway with rings rushing past; theme.js raises the same dark over the Challenge page's
 * first frame, and this module clears it, with one ring, once the track is in place. */
import { HARNESS_NAMES, MODEL_CHARACTERS, EFFORTS, DEFAULT_EFFORT } from './arena-data.js?v=20261028-cascade';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));

// The loadout chosen in the arena: provider (model), the provider's model (variant), the
// reasoning effort and the harness.
function readLoadout() {
  try {
    const raw = JSON.parse(localStorage.getItem('metacase-loadout') || '{}');
    const model = clamp(Math.round(Number(raw.model) || 0), 0, MODEL_CHARACTERS.length - 1);
    return {
      model,
      variant: clamp(Math.round(Number(raw.variant) || 0), 0, MODEL_CHARACTERS[model].variants.length - 1),
      effort: clamp(Number.isInteger(raw.effort) ? raw.effort : DEFAULT_EFFORT, 0, EFFORTS.length - 1),
      harness: clamp(Math.round(Number(raw.harness) || 0), 0, HARNESS_NAMES.length - 1),
    };
  } catch {
    return { model: 0, variant: 0, effort: DEFAULT_EFFORT, harness: 0 };
  }
}
function saveLoadout(l) {
  const m = MODEL_CHARACTERS[l.model];
  try {
    localStorage.setItem('metacase-loadout', JSON.stringify({ ...l, provider: m.provider, modelName: m.variants[l.variant], effortName: EFFORTS[l.effort], harnessName: HARNESS_NAMES[l.harness] }));
  } catch {}
}
const loadoutLine = l => `${MODEL_CHARACTERS[l.model].provider} · ${MODEL_CHARACTERS[l.model].variants[l.variant]} · ${EFFORTS[l.effort]} × ${HARNESS_NAMES[l.harness]}`;

// Three.js, the toy kit and the harness weapons: only the guardians need them, and only once the
// page has settled (the shuttle uses none).
let kitPromise;
function deps() {
  kitPromise ||= Promise.all([
    import('./assets/vendor/three/three.module.js'), import('./mc-kit.js'), import('./arena-models.js'),
  ]).then(([THREE, kit, { loadArenaWeapons }]) => ({ THREE, kit, weapons: loadArenaWeapons().catch(() => null) }));
  return kitPromise;
}

// The model's brand plate, painted for the chest of every armed robot: the provider's mark
// (filled, on its 0..24 grid), its name and the chosen model.
function paintChest(ctx, m, l = { variant: 0 }) {
  ctx.clearRect(0, 0, 256, 256);
  ctx.fillStyle = 'rgba(8, 12, 22, 0.92)';
  ctx.strokeStyle = m.color;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.roundRect(14, 14, 228, 228, 40);
  ctx.fill();
  ctx.stroke();
  if (m.logo && typeof Path2D !== 'undefined') {
    ctx.save();
    ctx.translate(68, 36);
    ctx.scale(5, 5); // 24 units → 120 px
    ctx.fillStyle = m.color;
    ctx.fill(new Path2D(m.logo), m.rule || 'nonzero');
    ctx.restore();
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 30px Inter, Arial, sans-serif';
  ctx.fillText(m.badge, 128, 186, 212);
  ctx.fillStyle = '#c9d4e6';
  ctx.font = '600 20px Inter, Arial, sans-serif';
  ctx.fillText(m.variants[l.variant] || m.variants[0], 128, 216, 212);
}

// Flying towards a point at a steady speed reads as exponential growth: slow at first, then rushing.
const rush = (from, to, steps = 6) => Array.from({ length: steps + 1 }, (_, k) => from * (to / from) ** (k / steps));
const FADE = [0, .85, .85, .7, .45, .2, 0]; // a ring's opacity along the same steps
const SHIFT = 'cubic-bezier(0.77, 0, 0.175, 1)'; // v2.css --shuttle-inout: something moving on screen
const OPEN = 560, RING = 380, COVER = 400, LEAVE = 540; // the iris; each ring; the window covered; the next page requested
const SIZE = 160; // px: the iris and rings start the size of a doorway and are scaled up (v2.css)

// Take a portal at (x, y): save the loadout, cover the window from the doorway, go to `href`.
// onCovered runs once the window is covered, so the page behind can stop drawing.
export function warp({ x, y, track, href, model, variant, effort, harness, onCovered }) {
  const cur = readLoadout();
  const pick = (v, fallback, hi) => Number.isFinite(v) ? clamp(Math.round(v), 0, hi) : fallback;
  const activeModel = pick(model, cur.model, MODEL_CHARACTERS.length - 1);
  saveLoadout({
    model: activeModel,
    variant: pick(variant, activeModel === cur.model ? cur.variant : 0, MODEL_CHARACTERS[activeModel].variants.length - 1),
    effort: pick(effort, cur.effort, EFFORTS.length - 1),
    harness: pick(harness, cur.harness, HARNESS_NAMES.length - 1),
  });
  if (reduced()) { location.href = href; return; }
  // The iris: a disc of the tunnel's dark, a little wider than the reach from the doorway to the
  // window's farthest corner. It starts as a doorway-sized disc scaled up by transform alone.
  const D = 2.4 * Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const big = D / SIZE;
  const shuttle = document.createElement('div');
  shuttle.className = 'mc-shuttle';
  shuttle.dataset.shuttle = track;
  shuttle.setAttribute('aria-hidden', 'true');
  shuttle.style.setProperty('--shuttle-x', `${Math.round(x)}px`);
  shuttle.style.setProperty('--shuttle-y', `${Math.round(y)}px`);
  shuttle.innerHTML = '<i class="mc-shuttle-iris"></i>' + '<i class="mc-shuttle-ring"></i>'.repeat(3);
  document.body.append(shuttle);
  const [iris, ...rings] = shuttle.children;
  iris.animate([
    { transform: 'scale(1)', opacity: 0 },
    { transform: `scale(${(1 + (big - 1) * .04).toFixed(3)})`, opacity: 1, offset: .16 },
    { transform: `scale(${big.toFixed(3)})`, opacity: 1 },
  ], { duration: OPEN, easing: SHIFT, fill: 'forwards' });
  // light rings rush out of the doorway and past the reader, one after another
  const steps = rush(.85, big);
  rings.forEach((ring, k) => ring.animate(steps.map((s, i) => ({ transform: `scale(${s.toFixed(3)})`, opacity: FADE[i] })),
    { duration: RING, delay: 40 + k * 70, easing: 'linear', fill: 'both' }));
  // the Challenge page opens under the same dark, its glow where the doorway was
  try { sessionStorage.setItem('metacase-shuttle', JSON.stringify({ x: Math.round(x / innerWidth * 1000) / 10, y: Math.round(y / innerHeight * 1000) / 10 })); } catch {}
  setTimeout(() => onCovered?.(), COVER);
  setTimeout(() => { location.href = href; }, LEAVE);
  addEventListener('pageshow', event => { if (event.persisted) shuttle.remove(); }, { once: true });
}

// Arriving on the Challenge page through a portal: theme.js has painted the dark over the first
// frame (html[data-shuttle]); once the track is in place, the dark clears outward from the doorway
// with one ring, and the track's frame lights briefly.
function arrive(target) {
  const root = document.documentElement;
  const land = () => target.scrollIntoView({ block: 'start', behavior: 'instant' });
  land();
  requestAnimationFrame(() => {
    land();
    if (!root.dataset.shuttle) return;
    root.classList.add('is-shuttle-out');
    setTimeout(() => lightTrack(target), 260);
    setTimeout(() => {
      delete root.dataset.shuttle;
      root.classList.remove('is-shuttle-out');
      root.style.removeProperty('--shuttle-x'); root.style.removeProperty('--shuttle-y');
    }, 700);
  });
}
// The track's frame lights from inside and fades: a painted layer whose opacity alone animates.
function lightTrack(target) {
  const glow = document.createElement('span');
  glow.className = 'track-glow';
  glow.setAttribute('aria-hidden', 'true');
  target.append(glow);
  const done = () => glow.remove(), out = 'cubic-bezier(0.23, 1, 0.32, 1)';
  glow.animate([{ opacity: 0, easing: out }, { opacity: 1, offset: .18, easing: out }, { opacity: 0 }], { duration: 1400 }).finished.then(done, done);
}

const page = document.body && document.body.classList.contains('v2-page-challenge');
if (page) {
  const params = new URLSearchParams(location.search), through = params.get('via') === 'portal';
  if (through) history.replaceState(history.state, '', location.pathname + location.hash);
  const target = through && document.getElementById(location.hash.slice(1));
  // the guardians' 3D waits until the arrival has cleared, so it never competes with it
  mountTrackGuardians(target ? 900 : 0);
  if (target) arrive(target);
  else delete document.documentElement.dataset.shuttle;
  document.querySelectorAll('.track-gate').forEach(gate => gate.addEventListener('click', () => {
    const to = document.getElementById(gate.getAttribute('href').slice(1));
    if (to) setTimeout(() => lightTrack(to), 650);
  }));
}
async function mountTrackGuardians(delay = 0) {
  const tracks = [...document.querySelectorAll('.field-track')];
  if (!tracks.length) return;
  const loadout = readLoadout();
  const containers = tracks.map((trackEl, idx) => {
    const head = trackEl.querySelector('.track-head');
    const title = trackEl.querySelector(':scope > h3');
    const summary = trackEl.querySelector(':scope > .track-summary');
    const banner = document.createElement('div');
    banner.className = 'track-hero-row';
    const copyCol = document.createElement('div');
    copyCol.className = 'track-hero-copy';
    trackEl.insertBefore(banner, head);
    if (head) copyCol.append(head);
    if (title) copyCol.append(title);
    if (summary) copyCol.append(summary);
    const stageCard = document.createElement('div');
    stageCard.className = 'track-guardian';
    stageCard.setAttribute('data-no-translate', '');
    const canvas = document.createElement('canvas');
    canvas.className = 'track-guardian-canvas';
    canvas.width = 240;
    canvas.height = 176;
    canvas.setAttribute('aria-hidden', 'true');
    const badge = document.createElement('button');
    badge.type = 'button';
    badge.className = 'track-guardian-badge';
    const dot = document.createElement('i'), text = document.createElement('span');
    badge.append(dot, text);
    stageCard.append(canvas, badge);
    banner.append(copyCol, stageCard);
    text.textContent = loadoutLine(loadout);
    dot.style.background = (MODEL_CHARACTERS[loadout.model] || MODEL_CHARACTERS[0]).color;
    return { trackEl, idx, canvas, badge, dot, text };
  });

  if (delay) await new Promise(done => setTimeout(done, delay));
  try {
    const { THREE, kit: { robot, block, cyl, add, mat, PALETTE }, weapons } = await deps();
    const weaponLib = await weapons;
    const domainColors = [0x45b5b0, 0xf2b545, 0x7d6ad8];

    const views = containers.map(({ canvas, badge, dot, text, idx }) => {
      const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
      renderer.setSize(240, 176, false);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 240 / 176, 0.1, 40);
      camera.position.set(0.35, 1.55, 3.65);
      camera.lookAt(0, 0.85, 0);

      scene.add(new THREE.HemisphereLight(0xeef4ff, 0x1a2030, 2.2));
      const key = new THREE.DirectionalLight(0xfff4e4, 2.8);
      key.position.set(-2.5, 4.5, 3.5);
      scene.add(key);
      const rim = new THREE.DirectionalLight(domainColors[idx] || 0x45b5b0, 1.8);
      rim.position.set(2.5, 2.2, -2.5);
      scene.add(rim);

      const root = new THREE.Group();
      root.rotation.y = -0.28;
      scene.add(root);

      const dColor = domainColors[idx] || 0x45b5b0;
      cyl(root, 0.68, 0.76, 0.1, 0x1c2536, 0, -0.05, 0, 32);
      const pedRing = add(root, new THREE.TorusGeometry(0.7, 0.025, 10, 40), mat(dColor, { emissive: dColor, intensity: 1.4 }), 0, 0.05, 0, false);
      pedRing.rotation.x = Math.PI / 2;

      const bot = robot(PALETTE.cream, 0x67f5ff);
      if (bot.head.children[4]) bot.head.children[4].visible = false;
      if (bot.head.children[5]) bot.head.children[5].visible = false;
      bot.root.scale.setScalar(1.38);
      bot.root.position.y = 0.05;
      root.add(bot.root);

      const hullMeshes = [], darkMeshes = [], eyeMeshes = [];
      bot.root.traverse(n => {
        if (!n.isMesh || !n.material) return;
        const hex = n.material.color?.getHex?.();
        if (hex === PALETTE.cream) hullMeshes.push(n);
        else if (hex === 0x1b2230) darkMeshes.push(n);
        else if (hex === 0x67f5ff) eyeMeshes.push(n);
      });
      const trimMat = mat(0x10a37f, { emissive: 0x10a37f, intensity: 0.75 });
      for (const s of [-1, 1]) {
        const pld = block(bot.root, 0.14, 0.15, 0.22, trimMat, s * 0.28, 0.38, 0, 0.035);
        pld.rotation.z = -s * 0.2;
      }

      // Chest brand logo canvas texture on the 3D guardian robot
      const chestCanvas = document.createElement('canvas');
      chestCanvas.width = 256;
      chestCanvas.height = 256;
      const chestCtx = chestCanvas.getContext('2d');
      const chestTex = new THREE.CanvasTexture(chestCanvas);
      chestTex.colorSpace = THREE.SRGBColorSpace;
      const chestPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.3, 0.28),
        new THREE.MeshBasicMaterial({ map: chestTex, transparent: true }),
      );
      chestPlane.position.set(0, 0.28, 0.215);
      bot.root.add(chestPlane);

      function paintGuardianChest(m) {
        paintChest(chestCtx, m, loadout);
        chestTex.needsUpdate = true;
      }

      const crown = add(bot.head, new THREE.TorusGeometry(0.22, 0.026, 10, 32), trimMat, 0, 0.48, 0, false);
      crown.rotation.x = 0.2;

      const weaponHand = new THREE.Group();
      weaponHand.position.set(0.36, 0.42, 0.28);
      weaponHand.rotation.set(-0.15, -0.35, 0.08);
      bot.root.add(weaponHand);
      const weaponClones = weaponLib
        ? weaponLib.weapons.map(w => {
            const c = w.clone(true);
            c.scale.setScalar(0.88);
            weaponHand.add(c);
            return c;
          })
        : [];

      function syncLoadout() {
        const m = MODEL_CHARACTERS[loadout.model] || MODEL_CHARACTERS[0];
        hullMeshes.forEach(mesh => mesh.material.color.setHex(m.hull));
        darkMeshes.forEach(mesh => mesh.material.color.setHex(m.limb || 0x1b2230));
        eyeMeshes.forEach(mesh => {
          mesh.material.color.setHex(m.eye);
          if (mesh.material.emissive) mesh.material.emissive.setHex(m.eye);
        });
        trimMat.color.setHex(m.trim);
        if (trimMat.emissive) trimMat.emissive.setHex(m.trim);
        paintGuardianChest(m);
        weaponClones.forEach((wc, wIdx) => { wc.visible = wIdx === loadout.harness; });
        dot.style.background = m.color;
        dot.style.boxShadow = `0 0 8px ${m.color}`;
        text.textContent = loadoutLine(loadout);
      }
      syncLoadout();

      badge.addEventListener('click', () => {
        loadout.harness = (loadout.harness + 1) % HARNESS_NAMES.length;
        if (loadout.harness === 0) { loadout.model = (loadout.model + 1) % MODEL_CHARACTERS.length; loadout.variant = 0; }
        saveLoadout(loadout);
        views.forEach(v => v.syncLoadout());
        request();
      });

      return { canvas, renderer, scene, camera, bot, weaponHand, syncLoadout, idx };
    });

    // only the guardians in view are drawn (none while the tab is hidden)
    const shown = new Set();
    let raf = 0;
    const tick = now => {
      raf = 0;
      const t = now * 0.001;
      shown.forEach(v => {
        v.bot.update(t + v.idx, 0);
        v.weaponHand.position.y = 0.42 + Math.sin(t * 2.2 + v.idx) * 0.025;
        v.renderer.render(v.scene, v.camera);
      });
      if (shown.size && !reduced()) raf = requestAnimationFrame(tick);
    };
    const request = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const watch = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const v = views.find(view => view.canvas === entry.target);
        if (v && entry.isIntersecting) shown.add(v); else if (v) shown.delete(v);
      });
      request();
    });
    views.forEach(v => watch.observe(v.canvas));
  } catch (err) {
    console.warn('Track guardian 3D preview skipped:', err);
  }
}

/* metacase-film.js — the Metacase page's film: one pinned Three.js stage for the page body.
 * Scrolling drives a single camera line through one real run of FIN-T1-003, in five beats
 * (Task · Agent · Trajectory · Grading · Metacase). The framework owns the renderer, the
 * camera line, the copy beside it, the progress rail and the static path; each beat is its
 * own module (film-*.js) that builds its set and animates it from its local progress.
 *
 * Beat contract — film-*.js:
 *   export async function build(ctx) -> { camera: { from, to }, update(lp, t, dt, ui), dim? }
 *   ctx: THREE, kit (mc-kit.js), set (a Group at this beat's world origin, x = SPACING × index),
 *        index, accent, loadWeapons(), labelTexture, reduce, hand (shared, built in order),
 *        util (clamp, smooth, ramp, lerp, easeOut, glowSprite), layout ({ stacked }, live),
 *        camera and renderer (read only).
 *   camera.from / camera.to: { pos: [x, y, z], look: [x, y, z], fov? } in set coordinates.
 *   update(lp, t, dt, ui): lp is local progress, 0..1 (clamped); ui = { el, set, count, highlight }.
 *   dim: optional 0..1 the beat may set in update; while it is the current beat the stage lights
 *        are scaled by (1 - dim), so one colour can own the frame.
 *   A beat's story ends by lp .88: from 1 - DOLLY (.90) the camera whips on to the next set.
 * Debug: metacase.html?film=0.42 holds global progress (add &t=2 to hold the clock);
 * _film-dev.html?beat=2&lp=0.6 renders one beat on its own. Either one also allows software GL. */
import * as THREE from './assets/vendor/three/three.module.js';
import * as kit from './mc-kit.js?v=20261105-grip';
import { createPost } from './mc-toon.js?v=20261102-toy';
import { loadArenaWeapons } from './arena-models.js?v=20261028-cascade';
import { clamp, smooth, ramp, lerp, glowSprite } from './mc-stage.js?v=20261105-grip';

const N = 5, SPACING = 12, DOLLY = .10, ARC = .5, PULL = 1.5, STREAK = 2.4;
export const ACCENTS = [0x45b5b0, 0xf2b545, 0x7d6ad8, 0xf2b545, 0x45b5b0];
// The copy sits below the picture (instead of beside it) under this query; CSS uses the same one.
export const STACKED = '(max-width: 600px), (max-aspect-ratio: 11/10)';
const DEFAULT_CAMERA = { from: { pos: [-3, 3.2, 10], look: [0, 1, 0], fov: 34 }, to: { pos: [3, 2.6, 8.5], look: [0, 1, 0], fov: 34 } };
const BEATS = [
  () => import('./film-task.js?v=20261109-film'),
  () => import('./film-agent.js?v=20261109-film'),
  () => import('./film-trajectory.js?v=20261109-film'),
  () => import('./film-grading.js?v=20261109-film'),
  () => import('./film-metacase.js?v=20261109-film'),
];
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const smoother = x => { const p = clamp(x); return p * p * p * (p * (p * 6 - 15) + 10); };
const util = { clamp, smooth, ramp, lerp, easeOut, glowSprite };

// strict: refuse software GL (blocklisted GPUs, VMs, remote desktops), where the film cannot keep up.
// Browsers flag it as a major performance caveat; a software rasteriser that is not flagged is
// recognised by name.
function webglAvailable(strict) {
  try {
    const c = document.createElement('canvas'), o = strict ? { failIfMajorPerformanceCaveat: true } : undefined;
    const gl = c.getContext('webgl2', o) || c.getContext('webgl', o);
    if (!gl) return false;
    let soft = false;
    if (strict) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      const name = `${gl.getParameter(gl.RENDERER)} ${info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : ''}`;
      soft = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !soft;
  } catch { return false; }
}
let weaponsPromise = null;
const loadWeapons = () => (weaponsPromise ||= loadArenaWeapons());

/* Counters: [data-n] elements carry data-from, data-to and optionally data-decimals,
 * data-suffix and data-prefix; count(k) formats the value k of the way from one to the other. */
function formatCount(el, k) {
  const d = el.dataset, from = parseFloat(d.from ?? '0'), to = parseFloat(d.to ?? '0');
  const v = from + (to - from) * clamp(k), places = parseInt(d.decimals || '0', 10);
  return (d.prefix || '') + (places ? v.toFixed(places) : String(Math.round(v))) + (d.suffix || '');
}

export function createFilm(section, { dev = null } = {}) {
  const root = document.documentElement;
  const pin = section.querySelector('.mc-film-pin'), canvas = section.querySelector('.mc-film-canvas');
  const articles = [...section.querySelectorAll('.mc-beat')];
  const ticks = [...section.querySelectorAll('.mc-film-tick')].map(el => ({ el, fill: el.querySelector('.mc-film-fill'), shown: -1 }));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const params = new URLSearchParams(location.search);
  const held = dev ? null : params.has('film') ? clamp(parseFloat(params.get('film')) || 0) : null;
  const heldT = dev?.t ?? (params.has('t') ? parseFloat(params.get('t')) || 0 : null);
  const debug = !!dev || held != null;

  /* ---- scroll markers: the step ids (the subnav's targets) sit on the articles in the markup, so
   * the page works as a column without this script; in film mode they move onto markers laid over
   * the scroll track, one per beat, and move back if the film falls back to the column. ---- */
  let steps = null;
  function enterSteps() {
    steps = document.createElement('div'); steps.className = 'mc-film-steps';
    articles.forEach((a, k) => {
      const m = document.createElement('div'); m.className = 'mc-film-step'; m.style.setProperty('--k', k);
      if (a.id) { m.id = a.id; a.dataset.step = a.id; a.removeAttribute('id'); }
      steps.append(m);
    });
    section.append(steps);
  }
  function leaveSteps() {
    if (!steps) return;
    [...steps.children].forEach((m, k) => { if (m.id && articles[k]) { articles[k].id = m.id; m.removeAttribute('id'); } });
    steps.remove(); steps = null;
  }

  /* ---- the static path: no WebGL (or one too slow to keep up). The five articles read as a
   * column with the final numbers they were written with. ---- */
  let disabled = false;
  function goStatic() {
    disabled = true;
    section.classList.remove('is-film', 'is-reduce');
    section.classList.add('is-static');
    leaveSteps();
    articles.forEach(a => { a.classList.add('is-active'); a.classList.remove('is-past'); });
    section.dataset.renderer = 'static';
    delete section.dataset.subnavCurrent;
    root.classList.remove('film-pinned');
    document.dispatchEvent(new CustomEvent('film:beat'));
    return { static: true };
  }
  if (!canvas || !pin || !articles.length || !webglAvailable(!debug && !params.has('film-gl'))) return goStatic();

  section.classList.add('is-film');
  if (reduce) section.classList.add('is-reduce');
  if (dev) section.classList.add('is-dev');
  section.dataset.renderer = 'pending';
  enterSteps();

  /* ---- layout: where the pin sticks (under the sticky header and the subnav) and its size ---- */
  let filmTop = 0, pinH = 0, W = 0, H = 0, copyTop = 0;
  const stackedQuery = matchMedia(STACKED), layout = { stacked: stackedQuery.matches };
  function measure() {
    if (dev) filmTop = 0;
    else {
      let top = 0;
      for (const el of [document.querySelector('.site-header'), document.querySelector('.subnav')]) {
        if (!el) continue;
        const cs = getComputedStyle(el);
        if (cs.position === 'sticky' || cs.position === 'fixed') top = Math.max(top, (parseFloat(cs.top) || 0) + el.offsetHeight);
      }
      filmTop = top;
      section.style.setProperty('--film-top', `${top}px`);
    }
    pinH = pin.offsetHeight;
    layout.stacked = stackedQuery.matches;
    // stacked: the picture fills what the tallest beat's copy leaves free above it
    const copy = section.querySelector('.mc-film-copy');
    if (copy && layout.stacked) {
      const tallest = Math.max(...articles.map(a => a.offsetHeight));
      copyTop = Math.max(pinH * .4, copy.offsetTop - tallest - 20);
    } else copyTop = pinH;
  }
  measure();
  const range = () => Math.max(1, section.offsetHeight - pinH);
  function progress() {
    if (held != null) return held;
    if (dev) return clamp((dev.beat + dev.lp) / N);
    return clamp((filmTop - section.getBoundingClientRect().top) / range());
  }
  // The scroll position at which the film shows beat k at local progress lp.
  function scrollFor(k, lp = .05) {
    return scrollY + section.getBoundingClientRect().top - filmTop + clamp((k + lp) / N) * range();
  }
  function scrollToY(y, smoothly) {
    const lenis = window.__lenis;
    if (smoothly && !reduce) {
      if (lenis) lenis.scrollTo(y, { duration: 1.2 }); else window.scrollTo({ top: y, behavior: 'smooth' });
      return;
    }
    // an instant jump: set the position natively first (never smoothed), then resync Lenis to it
    window.scrollTo({ top: y, behavior: 'instant' });
    lenis?.scrollTo(y, { immediate: true, force: true });
  }

  /* ---- the copy: one article per beat, revealed when its beat is current ---- */
  const pending = new Map(), written = new WeakMap(), pendingLists = new Map(), listShown = new WeakMap();
  const counters = articles.map(a => [...a.querySelectorAll('[data-n][data-to]')]);
  function makeUI(i) {
    const el = articles[i], nodes = new Map(), lists = new Map();
    const node = name => { if (!nodes.has(name)) nodes.set(name, el?.querySelector(`[data-n="${name}"]`) || null); return nodes.get(name); };
    const list = name => { if (!lists.has(name)) lists.set(name, el?.querySelector(`[data-list="${name}"]`) || null); return lists.get(name); };
    return {
      el,
      set(name, text) { const n = node(name); if (n) pending.set(n, String(text)); },
      count(name, k) { const n = node(name); if (n) pending.set(n, formatCount(n, k)); },
      highlight(name, index) { const l = list(name); if (l) pendingLists.set(l, index); },
    };
  }
  const uis = articles.map((_, i) => makeUI(i));
  const roll = [{ transform: 'translateY(-.32em)', opacity: .25 }, { transform: 'none', opacity: 1 }];
  function flush() {
    for (const [n, text] of pending) {
      if (written.get(n) === text) continue;
      const had = written.has(n);
      n.textContent = text; written.set(n, text);
      // a slot (data-roll) clicks over to each new value
      if (had && !reduce && n.hasAttribute('data-roll') && n.animate) n.animate(roll, { duration: 140, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' });
    }
    pending.clear();
    for (const [l, index] of pendingLists) {
      if (listShown.get(l) === index) continue;
      listShown.set(l, index);
      [...l.children].forEach((c, j) => c.classList.toggle('is-on', j === index));
    }
    pendingLists.clear();
  }

  let active = -2;
  const ids = articles.map(a => a.dataset.step || '');
  function setActive(k) {
    if (k === active) return;
    active = k;
    articles.forEach((a, i) => { a.classList.toggle('is-active', i === k); a.classList.toggle('is-past', k >= 0 && i < k); });
    ticks.forEach(({ el }, i) => {
      el.classList.toggle('is-on', i === k); el.classList.toggle('is-done', k >= 0 && i < k);
      if (i === k) el.setAttribute('aria-current', 'step'); else el.removeAttribute('aria-current');
    });
    section.dataset.beat = String(k);
    // the subnav follows the film's own beat (site.js reads this), so every navigation agrees
    if (!dev) {
      if (k >= 0 && ids[k]) section.dataset.subnavCurrent = ids[k]; else delete section.dataset.subnavCurrent;
      document.dispatchEvent(new CustomEvent('film:beat'));
    }
  }
  // The film's copy is current only while the pin holds most of the window.
  function inView() {
    if (dev || held != null) return true;
    const r = section.getBoundingClientRect();
    return r.top < innerHeight * .4 && r.bottom > filmTop + pinH * .6;
  }
  let pinned = false;
  function setPinned(on) {
    if (dev || on === pinned) return;
    pinned = on;
    // the page rail hides and the page's backdrop pauses while the film holds the window
    root.classList.toggle('film-pinned', on);
  }
  // the beat whose copy shows: the next one as soon as the camera whips towards it
  const copyBeat = (k, lp) => (lp > 1 - DOLLY * .5 && k < N - 1 ? k + 1 : k);
  function paintDom(g, k, lp) {
    const shown = inView();
    setPinned(shown);
    setActive(shown ? copyBeat(k, lp) : -1);
    ticks.forEach((t, i) => {
      const f = Math.round(clamp(g - i) * 1000) / 1000;
      if (f !== t.shown) { t.shown = f; t.fill.style.transform = `scaleX(${f})`; }
    });
    // default counting, which a beat's own update can override within the same frame
    counters.forEach((list, i) => { const k2 = reduce ? 1 : ramp(clamp(g - i), .05, .65); list.forEach(n => pending.set(n, formatCount(n, k2))); });
  }

  // Keyboard: focus moving into another beat's copy brings that beat on screen.
  articles.forEach((a, k) => a.addEventListener('focusin', () => { if (!disabled && !dev && held == null && active !== k) scrollToY(scrollFor(k, .3), false); }));
  ticks.forEach(({ el }, k) => el.addEventListener('click', () => { if (!disabled && !dev && held == null) scrollToY(scrollFor(k, .05), true); }));

  /* ---- the world: one renderer, one scene, five sets along +x ---- */
  let renderer = null, post = null, scene = null, camera = null, light = null, dust = null, streaks = null, ready = false;
  let dprCap = innerWidth < 700 ? 1.5 : 1.75, lowFx = false;
  const sets = [], beats = [], settled = [];
  const hand = {};
  const pos = new THREE.Vector3(), look = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), la = new THREE.Vector3(), lb = new THREE.Vector3(), away = new THREE.Vector3();

  // Dust through the whole world, and a copy of it as streaks that stretch along the camera's
  // travel while it whips from one set to the next (the stretch is a uniform: no buffer writes).
  function makeDust() {
    const n = 520, geo = new THREE.BufferGeometry(), p = new Float32Array(n * 3), c = new Float32Array(n * 3), col = new THREE.Color();
    const lp2 = new Float32Array(n * 6), lc = new Float32Array(n * 6), end = new Float32Array(n * 2);
    let s = 7;
    const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < n; i++) {
      p[i * 3] = -14 + rnd() * (SPACING * (N - 1) + 28); p[i * 3 + 1] = -1.5 + rnd() * 9; p[i * 3 + 2] = -14 + rnd() * 24;
      col.setHex([0x8ff6ff, 0xf2b545, 0xb7a8ff, 0xffffff][i % 4]).multiplyScalar(.35 + rnd() * .5);
      c.set([col.r, col.g, col.b], i * 3);
      for (let e = 0; e < 2; e++) { lp2.set([p[i * 3], p[i * 3 + 1], p[i * 3 + 2]], (i * 2 + e) * 3); lc.set([col.r, col.g, col.b], (i * 2 + e) * 3); end[i * 2 + e] = e; }
    }
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    const sprite = glowSprite(0xffffff, 1).material.map;
    const points = new THREE.Points(geo, new THREE.PointsMaterial({ size: .09, map: sprite, vertexColors: true, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(lp2, 3)); lg.setAttribute('aCol', new THREE.BufferAttribute(lc, 3)); lg.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
    const lines = new THREE.LineSegments(lg, new THREE.ShaderMaterial({
      uniforms: { uStretch: { value: new THREE.Vector3() }, uAlpha: { value: 0 } },
      vertexShader: 'attribute vec3 aCol;attribute float aEnd;uniform vec3 uStretch;varying vec3 vCol;varying float vA;void main(){vCol=aCol;vA=1.-aEnd;gl_Position=projectionMatrix*modelViewMatrix*vec4(position-uStretch*aEnd,1.);}',
      fragmentShader: 'uniform float uAlpha;varying vec3 vCol;varying float vA;void main(){gl_FragColor=vec4(vCol*vA*uAlpha*2.2,1.);}',
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    lines.frustumCulled = false; lines.visible = false;
    points.add(lines);
    return { points, lines };
  }

  function normalize(beat) {
    const cam = beat && beat.camera && beat.camera.from ? beat.camera : DEFAULT_CAMERA;
    if (!cam.to) cam.to = cam.from;
    return { raw: beat || {}, camera: cam, update: typeof beat?.update === 'function' ? beat.update : () => {} };
  }
  const poseInto = (out, outLook, k, q) => {
    const x = k * SPACING;
    out.set(q.pos[0] + x, q.pos[1], q.pos[2]);
    outLook.set(q.look[0] + x, q.look[1], q.look[2]);
    return q.fov ?? 34;
  };

  let base = null;
  async function build() {
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
    } catch (error) {
      console.warn('The film could not start WebGL.', error);
      goStatic(); stop(); return;
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    scene = new THREE.Scene();
    const bg = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#05070e');
    scene.background = bg;
    scene.fog = new THREE.Fog(bg, 16, 40);
    light = kit.lights(scene, { span: 11, shadowSize: 2048 });
    scene.add(light.key.target);
    base = { hemi: light.hemi.intensity, key: light.key.intensity, rim: light.rim.intensity };
    camera = new THREE.PerspectiveCamera(34, 1, .1, 120);
    post = createPost(renderer, { bloom: .34, threshold: .85, vignette: .3 });
    ({ points: dust, lines: streaks } = makeDust()); scene.add(dust);
    resize();

    const only = dev ? (dev.chain ? i => i <= dev.beat : i => i === dev.beat) : () => true;
    const modules = await Promise.all(BEATS.map((load, i) => (only(i) ? load().catch(error => { console.warn(`Film beat ${i} could not be loaded.`, error); return null; }) : null)));
    for (let i = 0; i < N; i++) {
      if (!only(i)) continue;
      const set = new THREE.Group(); set.name = `beat-${i}`; set.position.x = i * SPACING; scene.add(set); sets[i] = set;
      const ctx = { THREE, kit, set, index: i, accent: ACCENTS[i], loadWeapons, labelTexture: kit.labelTexture, reduce, hand, util, layout, camera, renderer };
      try {
        if (!modules[i]?.build) throw new Error('no build()');
        beats[i] = normalize(await modules[i].build(ctx));
      } catch (error) {
        console.warn(`Film beat ${i} could not be built.`, error);
        beats[i] = normalize(null);
      }
    }
    if (disabled) return;
    ready = true;
    section.dataset.renderer = 'webgl';
    stillKey = -1;
    wake();
  }

  function resize() {
    measure();
    const w = Math.max(1, pin.clientWidth), h = Math.max(1, pin.clientHeight);
    if (!renderer || (w === W && h === H)) return;
    W = w; H = h;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
    renderer.setSize(W, H, false);
    post.setSize(W, H);
    stillKey = -1;
  }

  // Beats are authored for a 16:10 frame centred on their look target. Beside the copy the
  // picture shifts right; above it (stacked) it rises into the space the copy leaves free and the
  // camera backs off to keep the width.
  function frameCamera(fov) {
    const aspect = W / H;
    let shiftX = 0, liftY = 0, push = 1;
    if (layout.stacked) {
      const free = clamp(copyTop / H, .4, 1);
      liftY = (1 - free) / 2;
      push = clamp(1.4 * (H * free) / W, 1, 2.2);
    } else {
      shiftX = clamp((aspect - .9) * .14, .06, .14);
      push = clamp(1.6 / aspect, 1, 1.35);
    }
    if (push !== 1) pos.sub(look).multiplyScalar(push).add(look);
    camera.position.copy(pos);
    camera.fov = fov; camera.aspect = aspect;
    camera.setViewOffset(W, H, -W * shiftX, H * liftY, W, H);
    camera.lookAt(look);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }

  // The story steps under a beat's heading: each <li data-at> lights once the beat's local
  // progress reaches its mark (the moments named in that beat's film-*.js timeline).
  const storyMarks = articles.map(a => [...a.querySelectorAll('[data-list="story"] > [data-at]')].map(li => parseFloat(li.dataset.at) || 0));
  function storyStep(i, lp) {
    const marks = storyMarks[i];
    if (!marks?.length) return;
    let k = 0;
    for (let j = 0; j < marks.length; j++) if (lp >= marks[j]) k = j;
    uis[i].highlight('story', k);
  }
  function callUpdate(i, lp, t, dt) {
    storyStep(i, lp);
    try { beats[i].update(lp, t, dt, uis[i]); } catch (error) {
      console.warn(`Film beat ${i} update failed; it is frozen from here.`, error);
      beats[i].update = () => {};
    }
  }
  function setLights(k) {
    const dim = clamp(+(beats[k]?.raw.dim) || 0);
    light.hemi.intensity = base.hemi * (1 - dim); light.key.intensity = base.key * (1 - dim); light.rim.intensity = base.rim * (1 - dim);
  }
  function draw() {
    if (lowFx) { renderer.setRenderTarget(null); renderer.render(scene, camera); }
    else post.render(scene, camera);
  }

  function renderWorld(g, k, lp, t, dt) {
    // Only the current set is drawn and updated, plus the next one while the camera whips to it
    // and the last one for a moment after; the others settle once at 0 or 1 and stay hidden.
    for (let i = 0; i < N; i++) {
      if (!beats[i]) continue;
      const live = i === k || (i === k + 1 && lp > 1 - DOLLY) || (i === k - 1 && lp < .05);
      sets[i].visible = live;
      if (live) { settled[i] = null; callUpdate(i, clamp(g - i), t, dt); }
      else { const side = i < k ? 1 : 0; if (settled[i] !== side) { settled[i] = side; callUpdate(i, side, t, dt); } }
    }
    // the camera line: from → to across the beat, then a whip to the next beat's opening shot
    const cur = beats[k] || normalize(null), next = k < N - 1 ? beats[k + 1] : null;
    let fov, focus, swing = 0;
    if (next && lp > 1 - DOLLY) {
      // The eye leads: it snaps round to the next set first and the body follows fast, pushing in
      // (a narrower field) rather than craning back, so the next set grows in frame all the way.
      const v = (lp - (1 - DOLLY)) / DOLLY, u = smoother(v), lead = smooth(v * 1.4);
      swing = Math.sin(u * Math.PI);
      const fa = poseInto(a, la, k, cur.camera.to), fb = poseInto(b, lb, k + 1, next.camera.from);
      pos.lerpVectors(a, b, u);
      look.lerpVectors(la, lb, lead);
      away.set(pos.x - look.x, 0, pos.z - look.z);
      if (away.lengthSq() > 1e-4) pos.addScaledVector(away.normalize(), swing * PULL);
      pos.y += swing * ARC;
      fov = lerp(fa, fb, u) - swing * 4; focus = lerp(k, k + 1, u) * SPACING;
    } else {
      const u = smooth(lp / (1 - DOLLY));
      const fa = poseInto(a, la, k, cur.camera.from), fb = poseInto(b, lb, k, cur.camera.to);
      pos.lerpVectors(a, b, u); look.lerpVectors(la, lb, u);
      fov = lerp(fa, fb, u); focus = k * SPACING;
    }
    frameCamera(fov);
    setLights(k);
    // the key light and its shadow follow the camera's subject along the line
    light.key.position.set(focus + 5.5, 11, 4.4); light.key.target.position.set(focus, 0, 0); light.key.target.updateMatrixWorld();
    dust.position.y = Math.sin(t * .15) * .25; dust.rotation.y = Math.sin(t * .05) * .02;
    // motion streaks: the dust stretches back along the travel while the camera whips
    streaks.visible = swing > .02;
    if (streaks.visible) { streaks.material.uniforms.uStretch.value.set(swing * swing * STREAK, 0, 0); streaks.material.uniforms.uAlpha.value = swing; }
    draw();
  }

  /* ---- reduced motion: composed stills. The stage stays pinned, but each beat is one finished
   * frame at its closing shot; changing beat dips the picture out and back in (200 ms) with no
   * camera travel, and nothing renders between changes. ---- */
  let stillKey = -1, dipTimer = 0;
  function renderStill(k) {
    for (let i = 0; i < N; i++) {
      if (!beats[i]) continue;
      sets[i].visible = i === k;
      if (i === k && settled[i] !== 'still') { settled[i] = 'still'; callUpdate(i, 1, 0, 0); }
    }
    const cur = beats[k] || normalize(null);
    const fov = poseInto(pos, look, k, cur.camera.to);
    frameCamera(fov); setLights(k);
    light.key.position.set(k * SPACING + 5.5, 11, 4.4); light.key.target.position.set(k * SPACING, 0, 0); light.key.target.updateMatrixWorld();
    streaks.visible = false;
    draw();
  }
  function still(k) {
    if (k === stillKey || dipTimer) return;
    if (stillKey < 0) { stillKey = k; renderStill(k); return; }
    pin.classList.add('is-dip');
    dipTimer = setTimeout(() => {
      dipTimer = 0;
      const g = progress() * N, kk = clamp(Math.floor(g), 0, N - 1);
      stillKey = copyBeat(kk, clamp(g - kk));
      renderStill(stillKey);
      pin.classList.remove('is-dip');
    }, 100);
  }

  /* ---- the frame-time governor: a GPU that cannot keep up first loses resolution, shadows and
   * bloom; if it still cannot, the film gives way to the column. ---- */
  // (?film-gl, which allows software GL for testing, also holds the governor off unless ?film-gov)
  const gov = { skip: 12, samples: [], stage: 0, off: debug || reduce || (params.has('film-gl') && !params.has('film-gov')) };
  function govern(ms) {
    if (gov.off || disabled || gov.stage > 1) return;
    if (gov.skip > 0) { gov.skip--; return; }
    gov.samples.push(ms);
    if (gov.samples.length < 60) return;
    const med = gov.samples.sort((x, y) => x - y)[30];
    gov.samples = []; gov.skip = 6;
    if (med > 28 && gov.stage === 0) {
      gov.stage = 1; lowFx = true; dprCap = 1;
      renderer.shadowMap.enabled = false; light.key.castShadow = false;
      scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.needsUpdate = true; }); });
      W = H = 0; resize();
      section.dataset.quality = 'low';
    } else if (med > 45 && gov.stage === 1) {
      gov.stage = 2; goStatic(); stop();
      renderer.dispose();
    } else if (med <= 28) gov.stage = 3; // keeping up: stop measuring
  }

  /* ---- the loop: only while the film is near the window and the tab is visible ---- */
  let raf = 0, near = !!dev, last = performance.now(), clock = 0, built = false;
  function frame(now) {
    const ms = now - last;
    const dt = Math.min(.05, Math.max(0, ms / 1000)); last = now; clock += dt;
    const t = heldT ?? clock;
    const p = progress(), g = p * N;
    const k = dev ? dev.beat : clamp(Math.floor(g), 0, N - 1);
    const lp = dev ? clamp(dev.lp) : clamp(g - k);
    const gg = dev ? dev.beat + lp : g;
    paintDom(gg, k, lp);
    if (ready) {
      if (reduce && !dev) still(copyBeat(k, lp));
      else { renderWorld(gg, k, lp, t, dt); govern(ms); }
    }
    flush();
  }
  function loop(now) {
    raf = 0;
    if (disabled || !near || document.hidden) return;
    frame(now);
    // reduced motion renders on demand (scroll, resize, a finished dip); the film runs every frame
    if (!reduce || dev) raf = requestAnimationFrame(loop);
  }
  function wake() { if (!raf && near && !document.hidden && !disabled) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = 0; near = false; }
  const startBuild = () => { if (!built) { built = true; build(); } };

  if (dev) { startBuild(); wake(); }
  else if ('IntersectionObserver' in window) {
    // build a viewport ahead; run while any part of the film is within half a viewport
    new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) startBuild(); }, { rootMargin: '100% 0px' }).observe(section);
    new IntersectionObserver(es => {
      near = es.some(e => e.isIntersecting);
      if (near) wake(); else { setActive(-1); setPinned(false); }
    }, { rootMargin: '50% 0px' }).observe(section);
  } else { near = true; startBuild(); wake(); }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
  addEventListener('scroll', wake, { passive: true });
  new ResizeObserver(() => { resize(); wake(); }).observe(pin);
  addEventListener('resize', () => { resize(); wake(); });
  stackedQuery.addEventListener?.('change', () => { resize(); stillKey = -1; wake(); });
  document.fonts?.ready.then(() => { measure(); stillKey = -1; wake(); });
  if (reduce) addEventListener('load', () => setTimeout(() => { stillKey = -1; wake(); }, 300), { once: true });

  // ?film=x: bring the pin on screen at that point of the film (and keep it there).
  if (held != null) {
    const place = () => scrollToY(scrollFor(Math.min(N - 1, Math.floor(held * N)), held * N - Math.min(N - 1, Math.floor(held * N))), false);
    place();
    addEventListener('load', () => requestAnimationFrame(place), { once: true });
  }

  const api = {
    section,
    get state() { const g = progress() * N; return { p: g / N, beat: active, lp: clamp(g - clamp(Math.floor(g), 0, N - 1)), ready, renderer: section.dataset.renderer, quality: lowFx ? 'low' : 'full' }; },
    scrollFor,
    setLocal(beat, lp) { if (dev) { dev.beat = beat; dev.lp = lp; wake(); } },
  };
  if (debug) window.__film = api;
  return api;
}

/* The private dev page (_film-dev.html) borrows the page's own film markup and renders one beat. */
export async function mountFilmDev(host, { beat = 0, lp = 0, t = null, chain = false } = {}) {
  const html = await (await fetch('metacase.html', { cache: 'no-store' })).text();
  const section = new DOMParser().parseFromString(html, 'text/html').querySelector('.mc-film');
  const film = document.importNode(section, true);
  host.append(film);
  return createFilm(film, { dev: { beat: clamp(Math.round(beat), 0, N - 1), lp: clamp(lp), t, chain } });
}

const section = document.querySelector('.mc-film');
if (section && !section.hasAttribute('data-film-manual')) createFilm(section);

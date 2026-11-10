/* agent-run.js — agent-run.html: pick a model and a harness, then click through one recorded run.
 * The run plays in agent-run-stage.js and the check on the film's film-grading.js; both are functions
 * of a position along STEPS. That position is the page's scroll: scrolling moves it and every control
 * only scrolls, so the two can never disagree. ?hold=6.4 pins it, for debugging.
 * Only one pairing has a recorded run on this task. Any other choice dresses the robot and changes
 * nothing else; the page says so before the run starts and for as long as it lasts. */
import * as THREE from './assets/vendor/three/three.module.js';
import * as kit from './mc-kit.js?v=20261105-grip';
import { createPost } from './mc-toon.js?v=20261102-toy';
import { loadArenaWeapons } from './arena-models.js?v=20261028-cascade';
import { clamp, smooth, ramp, lerp, glowSprite } from './mc-stage.js?v=20261105-grip';
import { MODEL_CHARACTERS, HARNESS_NAMES } from './arena-data.js?v=20261028-cascade';
import { CRESTS, paintPlate } from './metacase-run.js?v=20261110-agentrun';
import { RECORDED, RECORDED_LABEL, TOTALS, GROUPS, STEPS } from './agent-run-data.js?v=20261110-agentfacts';
import { build as buildRunStage, dressJudge } from './agent-run-stage.js?v=20261110-agentfacts';

const $ = (selector, root = document) => root.querySelector(selector);
const app = $('.ar-app'), canvas = $('.ar-canvas'), fade = $('.ar-fade');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const STACKED = matchMedia('(max-width: 760px), (max-aspect-ratio: 11/10)');
const easeOut = x => 1 - Math.pow(1 - clamp(x), 3);
const util = { clamp, smooth, ramp, lerp, easeOut, glowSprite };
const PICK_X = -12, RUN_SETTLE = .06, JUDGE_ACCENT = 0xf2b545;
const loadGrading = () => import('./film-grading.js?v=20261110-agentrun');

const load = { ...RECORDED };
const variants = MODEL_CHARACTERS.map((_, i) => (i === RECORDED.model ? RECORDED.variant : 0));
const isRecorded = () => load.model === RECORDED.model && load.variant === RECORDED.variant && load.harness === RECORDED.harness;
const modelName = () => MODEL_CHARACTERS[load.model].variants[load.variant];

/* ---- the choice ---- */
const el = {
  models: $('[data-ar="models"]'), versions: $('[data-ar="versions"]'), harnesses: $('[data-ar="harnesses"]'),
  status: $('[data-ar="status"]'), statusTitle: $('[data-ar="status-title"]'), statusBody: $('[data-ar="status-body"]'),
  reset: $('[data-ar="reset"]'), start: $('[data-ar="start"]'), startLabel: $('[data-ar="start-label"]'),
};
function radio(name, value, html) {
  const label = document.createElement('label'); label.className = 'ar-option';
  label.innerHTML = `<input type="radio" name="${name}" value="${value}"><span class="ar-option-face">${html}</span>`;
  return label;
}
const escapeHTML = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
MODEL_CHARACTERS.forEach((m, i) => {
  const mark = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="${m.color}" fill-rule="${m.rule || 'nonzero'}" d="${m.logo}"/></svg>`;
  el.models.append(radio('ar-model', i, `${mark}<span data-no-translate>${escapeHTML(m.provider)}</span>`));
});
HARNESS_NAMES.forEach((name, i) => el.harnesses.append(radio('ar-harness', i, `<span data-no-translate>${escapeHTML(name)}</span>`)));
function drawVersions() {
  el.versions.replaceChildren(...MODEL_CHARACTERS[load.model].variants.map((v, i) => radio('ar-version', i, `<span data-no-translate>${escapeHTML(v)}</span>`)));
}
function syncChoice() {
  const check = (root, value) => root.querySelectorAll('input').forEach(input => { input.checked = +input.value === value; });
  check(el.models, load.model); check(el.versions, load.variant); check(el.harnesses, load.harness);
  const recorded = isRecorded();
  el.status.classList.toggle('is-recorded', recorded);
  el.statusTitle.textContent = recorded ? 'This pairing has a recorded run.' : 'This pairing has no recorded run on this task.';
  el.statusBody.textContent = recorded
    ? 'Every step that follows is taken from its log.'
    : 'You will step through the run recorded with Qwen 3.7 Max and Claude Code. Your selection changes how the agent looks, not what it did or how it scored.';
  el.reset.hidden = recorded;
  el.startLabel.textContent = recorded ? 'Start the run' : 'Start the recorded run';
  dressPick();
}
el.models.addEventListener('change', e => { load.model = +e.target.value; load.variant = variants[load.model]; drawVersions(); syncChoice(); });
el.versions.addEventListener('change', e => { load.variant = variants[load.model] = +e.target.value; syncChoice(); });
el.harnesses.addEventListener('change', e => { load.harness = +e.target.value; syncChoice(); });
el.reset.addEventListener('click', () => { Object.assign(load, RECORDED); variants[load.model] = load.variant; drawVersions(); syncChoice(); });

/* ---- the run's panel ---- */
const ui = {
  step: $('[data-ar="step"]'), tag: $('[data-ar="tag"]'), count: $('[data-ar="count"]'), when: $('[data-ar="when"]'),
  title: $('[data-ar="title"]'), body: $('[data-ar="body"]'), say: $('[data-ar="say"]'), sayText: $('[data-ar="say-text"]'),
  facts: $('[data-ar="facts"]'), log: $('[data-ar="log"]'), logBody: $('[data-ar="log-body"]'), note: $('[data-ar="note"]'),
  back: $('[data-ar="back"]'), next: $('[data-ar="next"]'), nextLabel: $('[data-ar="next-label"]'), rail: $('[data-ar="rail"]'),
  ending: $('[data-ar="ending"]'), again: $('[data-ar="again"]'), repick: [...document.querySelectorAll('[data-ar="repick"]')],
  pairing: $('[data-ar="pairing"]'), pick: $('[data-ar="your-pick"]'), pickName: $('[data-ar="your-pick-name"]'),
  stats: { req: $('[data-stat="req"]'), calls: $('[data-stat="calls"]'), files: $('[data-stat="files"]'), tok: $('[data-stat="tok"]'), t: $('[data-stat="t"]') },
};
ui.pairing.textContent = `${RECORDED_LABEL.model} · ${RECORDED_LABEL.harness}`;
GROUPS.forEach((name, g) => {
  const group = document.createElement('div'); group.className = 'ar-rail-group'; group.style.flexGrow = STEPS.filter(s => s.group === g).length;
  const label = document.createElement('span'); label.className = 'ar-rail-label'; label.textContent = name;
  const ticks = document.createElement('div'); ticks.className = 'ar-rail-ticks';
  STEPS.forEach((s, i) => {
    if (s.group !== g) return;
    const tick = document.createElement('button'); tick.type = 'button'; tick.className = 'ar-tick'; tick.dataset.i = i;
    if (s.tone) tick.dataset.tone = s.tone;
    tick.title = s.title; tick.setAttribute('aria-label', s.title);
    ticks.append(tick);
  });
  group.append(label, ticks); ui.rail.append(group);
});
const ticks = [...ui.rail.querySelectorAll('.ar-tick')];

let phase = 'pick', index = 0;
function paintStep() {
  const s = STEPS[index], last = index === STEPS.length - 1;
  ui.step.dataset.tone = s.tone || '';
  ui.tag.textContent = s.tag;
  ui.count.textContent = `Step ${index + 1} of ${STEPS.length}`;
  ui.when.textContent = s.beat === 1 ? 'After the run' : s.from ? `Requests ${s.from}–${s.req}` : s.req ? `Request ${s.req}` : 'Before the first request';
  ui.title.textContent = s.title;
  ui.body.textContent = s.body;
  ui.say.hidden = !s.say;
  if (s.say) ui.sayText.textContent = s.say;
  ui.facts.replaceChildren(...s.facts.map(([label, value]) => {
    const row = document.createElement('div'); row.className = 'ar-fact';
    const name = document.createElement('span'); name.textContent = label;
    row.append(name);
    if (Array.isArray(value)) {
      const list = document.createElement('ul');
      list.append(...value.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
      row.append(list);
    } else { const text = document.createElement('p'); text.textContent = value; row.append(text); }
    return row;
  }));
  // the original record: left open from step to step for anyone who has opened it
  ui.log.hidden = !s.log;
  if (s.log) ui.logBody.replaceChildren(...s.log.map(([label, text]) => {
    const row = document.createElement('div'); row.className = 'ar-trace-row';
    const name = document.createElement('span'); name.textContent = label;
    const code = document.createElement('pre'); code.textContent = text;
    row.append(name, code); return row;
  }));
  ui.note.hidden = !s.note;
  if (s.note) ui.note.textContent = s.note;
  ui.back.disabled = index === 0;
  ui.next.hidden = last;
  ui.ending.hidden = !last;
  ui.nextLabel.textContent = s.beat === 0 && STEPS[index + 1]?.beat === 1 ? 'Send to the judge' : 'Next step';
  ticks.forEach((t, i) => {
    t.classList.toggle('is-done', i < index); t.classList.toggle('is-on', i === index);
    if (i === index) t.setAttribute('aria-current', 'step'); else t.removeAttribute('aria-current');
  });
  $('.ar-step-scroll').scrollTop = 0;
}
function setPhase(next) {
  phase = next;
  app.dataset.phase = next;
  if (next === 'run') {
    ui.pick.hidden = isRecorded();
    ui.pickName.textContent = `${modelName()} · ${HARNESS_NAMES[load.harness]}`;
  }
  stage?.size();
}

/* ---- the track: where in the page's scroll each step plays. Lengths are in pin heights. ---- */
const PICK_ZONE = .5, PER_SECOND = .12, HOLD = .22, FADE_ZONE = .08;
const pin = $('.ar-pin'), track = { P: 0, S: [], A: [], rest: [], end: 0, top: 0, fade: 1, h: 0 };
const trackY = () => window.scrollY - track.top;
const setScroll = y => window.scrollTo({ top: y + track.top, behavior: 'instant' });
function posAt(y) {          // -1 on the configuration; step i plays from i - 1 to i, then holds at i
  if (y < track.P) return -1;
  let i = STEPS.length - 1;
  while (i > 0 && y < track.S[i]) i--;
  return i - 1 + clamp((y - track.S[i]) / track.A[i]);
}
function yAt(p) {
  const i = clamp(Math.ceil(p), 0, STEPS.length - 1);
  return Number.isInteger(p) ? track.rest[i] : track.S[i] + (p - (i - 1)) * track.A[i];
}
function measureTrack() {
  const header = $('.site-header');
  const top = header ? Math.round(header.getBoundingClientRect().height) : 0;
  app.style.setProperty('--ar-top', `${top}px`);
  const h = pin.offsetHeight || innerHeight, resized = track.h && h !== track.h;
  const keep = resized && trackY() >= track.P ? posAt(trackY()) : null;
  track.h = h; track.P = h * PICK_ZONE; track.fade = h * FADE_ZONE;
  let y = track.P;
  STEPS.forEach((s, i) => { track.S[i] = y; track.A[i] = s.dur * h * PER_SECOND; track.rest[i] = y + track.A[i]; y = track.rest[i] + h * HOLD; });
  track.end = y;
  app.style.height = `${Math.round(y + h)}px`;
  track.top = app.getBoundingClientRect().top + window.scrollY - top;
  if (keep !== null) setScroll(yAt(keep));
}

/* ---- the controls: each one drives the scroll ---- */
let drive = null, held = null, display = -1;
function driveTo(i, from, to, ms, back = false) {
  if (reduced || !stage) { drive = null; setScroll(to); wake(); return; }
  setScroll(from);
  drive = { index: i, from, to, ms: Math.max(1, ms), back, start: performance.now(), at: from };
  wake();
}
function playStep(i) {       // play step i's animation at its own pace, from wherever it has got to
  const y = trackY(), from = y > track.S[i] && y < track.rest[i] ? y : track.S[i];
  driveTo(i, from, track.rest[i], STEPS[i].dur * 1000 * (track.rest[i] - from) / track.A[i]);
}
function goNext() {
  if (phase !== 'run') return;
  const p = posAt(trackY());
  const target = drive ? drive.index + 1 : Number.isInteger(p) ? p + 1 : index; // mid-step: finish this one first
  if (target < STEPS.length) playStep(target);
}
function goBack() {
  if (phase !== 'run') return;
  const target = (drive ? drive.index : index) - 1;
  if (target < 0) return;
  const y = trackY(), to = track.rest[target];
  driveTo(target, y, to, clamp(Math.abs(y - to) / (track.h * 1.6) * 1000, 300, 900), true);
}
function at(p) {
  const q = Math.max(p, 0), i = clamp(Math.floor(q), 0, STEPS.length - 1), a = STEPS[i], b = STEPS[Math.min(i + 1, STEPS.length - 1)], f = clamp(q - i);
  const crossing = a.beat !== b.beat, lpOf = s => s.lp ?? 0;
  return {
    p: crossing && f < .5 ? i : p,
    beat: crossing ? (f < .5 ? a.beat : b.beat) : a.beat,
    lp: crossing ? (f < .5 ? lpOf(a) : lerp(0, lpOf(b), (f - .5) * 2)) : lerp(lpOf(a), lpOf(b), f),
    dark: crossing ? 1 - Math.abs(f - .5) * 2 : 0,
    req: lerp(a.req, b.req, f), tok: lerp(a.tok, b.tok, f), calls: lerp(a.calls, b.calls, f), files: lerp(a.files, b.files, f), t: lerp(a.t, b.t, f),
  };
}
const shown = {};
function write(key, text) { if (shown[key] !== text) { shown[key] = text; ui.stats[key].textContent = text; } }
function paintStats(now) {
  write('req', String(Math.round(now.req)));
  write('calls', String(Math.round(now.calls)));
  write('files', String(Math.round(now.files)));
  write('tok', `${Math.round(now.tok)}k`);
  write('t', `${now.t.toFixed(1)} s`);
}

/* ---- the stage ---- */
function webglAvailable() {
  try {
    const c = document.createElement('canvas'), strict = !new URLSearchParams(location.search).has('gl');
    const gl = c.getContext('webgl2', strict ? { failIfMajorPerformanceCaveat: true } : undefined);
    if (!gl) return false;
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    const name = `${gl.getParameter(gl.RENDERER)} ${info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : ''}`;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return !strict || !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch { return false; }
}
let stage = null, armory = null;
const armoryPromise = loadArenaWeapons().then(library => { armory = library; return library; }).catch(() => null);
const loadWeapons = () => armoryPromise.then(library => { if (!library) throw new Error('No weapons'); return library; });

// A robot in this loadout: the arena's armour, crest and chest plate.
function dressedRobot(l) {
  const m = MODEL_CHARACTERS[l.model], bot = kit.robot(m.hull, m.eye), body = bot.root.children[0], head = bot.head;
  const own = new Map();
  bot.root.traverse(o => { if (!o.isMesh) return; if (!own.has(o.material)) own.set(o.material, o.material.clone()); o.material = own.get(o.material); });
  body.children[1].material.color.setHex(m.limb);
  const visor = head.children[1].material; visor.emissive.setHex(m.eye); visor.emissiveIntensity = .28;
  const trim = new THREE.MeshStandardMaterial({ color: m.trim, emissive: m.trim, emissiveIntensity: .18, roughness: .5 });
  const core = new THREE.MeshStandardMaterial({ color: m.eye, emissive: m.eye, emissiveIntensity: 1.5, roughness: .4 });
  [-1, 1].forEach(s => { kit.block(body, .16, .18, .26, trim, s * .3, .36, 0, .045).rotation.z = -s * .24; });
  kit.block(body, .43, .28, .012, kit.PALETTE.ink, 0, .27, .19, .006).castShadow = false;
  kit.ball(body, .032, core, 0, .2, .2, 12).castShadow = false;
  const crest = new THREE.Group(); CRESTS[l.model](crest, trim, core); head.add(crest);
  const c = document.createElement('canvas'); c.width = 512; c.height = 320;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const draw = () => { const g = c.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 512, 320); paintPlate(g, m, l.variant, l.effort); tex.needsUpdate = true; };
  draw(); document.fonts?.ready.then(draw);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(.4, .25), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
  plate.position.set(0, .41, .199); body.add(plate);
  return bot;
}

// The stand the agent is configured on, in the film's finish.
function buildPick(scene) {
  const set = new THREE.Group(); set.position.x = PICK_X; scene.add(set);
  kit.cyl(set, 2.3, 2.42, .3, 0x1c2740, 0, -.3, 0, 64);
  kit.cyl(set, 2.42, 2.2, .5, 0x111a2d, 0, -.8, 0, 64);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1.2 });
  const rim = kit.add(set, new THREE.TorusGeometry(2.36, .03, 8, 128), rimMat, 0, .005, 0, false); rim.rotation.x = Math.PI / 2;
  const pool = glowSprite(0xffffff, 5.2, .32); pool.position.y = .03; set.add(pool);
  const flash = glowSprite(0xffffff, 3.2, 0); flash.position.y = 1.2; set.add(flash);
  const holder = new THREE.Group(); set.add(holder);
  const state = { bot: null, gun: null, key: '', pop: 1, color: new THREE.Color(0xffffff) };
  function place(l) {
    const m = MODEL_CHARACTERS[l.model], key = `${l.model}.${l.variant}.${l.effort}`;
    if (key !== state.key) {
      if (state.bot) holder.remove(state.bot.root);
      state.key = key; state.bot = dressedRobot(l); state.gun = null; state.gunAt = -1;
      state.bot.root.scale.setScalar(2.05); holder.add(state.bot.root);
      rimMat.emissive.setHex(m.trim); rimMat.color.setHex(m.trim); pool.material.color.setHex(m.trim); flash.material.color.setHex(m.eye);
      state.pop = 0;
    }
    if (armory && state.gunAt !== l.harness) {
      if (state.gun) state.bot.root.remove(state.gun);
      const gun = armory.weapons[l.harness].clone(true);
      gun.scale.setScalar(.9); gun.position.copy(kit.GUN_HOLD.at); gun.rotation.copy(kit.GUN_HOLD.turn);
      state.bot.root.add(gun); state.bot.grip(1); state.gun = gun; state.gunAt = l.harness;
      state.pop = Math.min(state.pop, .35);
    }
  }
  return {
    set, place,
    camera: { pos: [0, 2.75, 10.4], look: [0, 1.32, 0], fov: 28 },
    update(dt, t) {
      state.pop = Math.min(1, state.pop + dt * 2.6);
      const k = state.pop, wobble = 1 + Math.sin(k * Math.PI) * .07;
      holder.scale.set(1 / wobble, wobble, 1 / wobble);
      holder.position.y = Math.sin(k * Math.PI) * .22;
      flash.material.opacity = (1 - k) * .75;
      holder.rotation.y = reduced ? -.28 : -.28 + Math.sin(t * .55) * .16;
      state.bot?.update(reduced ? 0 : t, 0);
    },
  };
}

function createStage() {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  let dprCap = innerWidth < 700 ? 1.5 : 1.75;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const bg = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--bg-canvas').trim() || '#05070e');
  scene.background = bg; scene.fog = new THREE.Fog(bg, 18, 42);
  const light = kit.lights(scene, { span: 11, shadowSize: 2048 });
  scene.add(light.key.target);
  const base = { hemi: light.hemi.intensity, key: light.key.intensity, rim: light.rim.intensity };
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 120);
  const post = createPost(renderer, { bloom: .34, threshold: .85, vignette: .3 });

  // dust in the air, as in the film
  {
    const n = 420, p = new Float32Array(n * 3), c = new Float32Array(n * 3), col = new THREE.Color();
    let s = 7; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    for (let i = 0; i < n; i++) {
      p.set([-30 + rnd() * 66, -1.5 + rnd() * 9, -14 + rnd() * 24], i * 3);
      col.setHex([0x8ff6ff, 0xf2b545, 0xb7a8ff, 0xffffff][i % 4]).multiplyScalar(.35 + rnd() * .5);
      c.set([col.r, col.g, col.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(p, 3)); geo.setAttribute('color', new THREE.BufferAttribute(c, 3));
    scene.add(new THREE.Points(geo, new THREE.PointsMaterial({ size: .09, map: glowSprite(0xffffff, 1).material.map, vertexColors: true, transparent: true, opacity: .8, depthWrite: false, blending: THREE.AdditiveBlending })));
  }

  const pick = buildPick(scene);
  // the crash's red light lives in the scene for good: adding a light later would recompile every material
  const errLight = new THREE.PointLight(0xff3348, 0, 16, 1.6); errLight.position.set(17.5, 2.6, .4); scene.add(errLight);
  const layout = { stacked: STACKED.matches };
  let W = 0, H = 0, lowFx = false;
  function size() {
    layout.stacked = STACKED.matches;
    const w = Math.max(1, canvas.clientWidth), h = Math.max(1, canvas.clientHeight);
    if (w === W && h === H) return;
    W = w; H = h;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, dprCap));
    renderer.setSize(W, H, false); post.setSize(W, H);
  }
  const position = new THREE.Vector3(), look = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), la = new THREE.Vector3(), lb = new THREE.Vector3();
  // settle: how far the picture drops in the frame, so the set's tall tower clears the counters
  function frameCamera(fov, x = 0, settle = 0) {
    const aspect = W / H;
    let shift = 0, push = 1, drop = 0;
    if (layout.stacked) push = clamp(1.3 * H / W, 1, 2.2);
    else { shift = clamp((aspect - .9) * .25, .1, .2); push = clamp(1.86 / aspect, 1.1, 1.45) * (1 + settle * .7); drop = settle; }
    if (push !== 1) position.sub(look).multiplyScalar(push).add(look);
    camera.position.copy(position);
    camera.fov = fov; camera.aspect = aspect;
    camera.setViewOffset(W, H, -W * shift, -H * drop, W, H);
    camera.lookAt(look);
    camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    light.key.position.set(x + 5.5, 11, 4.4); light.key.target.position.set(x, 0, 0); light.key.target.updateMatrixWorld();
  }
  function draw() { if (lowFx) { renderer.setRenderTarget(null); renderer.render(scene, camera); } else post.render(scene, camera); }

  /* ---- the two sets, built for one loadout ---- */
  const sets = [];
  let builtKey = '', building = null, run = null, grading = null, judge = null, judgeBot = null;
  const beatUI = { el: app, set() {}, count() {}, highlight() {} }, live = { req: 0, tok: 26.6 };
  async function build(l) {
    const key = `${l.model}.${l.variant}.${l.harness}.${l.effort}`;
    if (key === builtKey) return;
    if (building) await building;
    sets.forEach(set => scene.remove(set)); sets.length = 0;
    const library = await armoryPromise;
    const makeRobot = () => dressedRobot(l);
    const hand = { dressedRobot: () => (judgeBot = makeRobot()), armed: { harness: HARNESS_NAMES[l.harness], weaponIndex: l.harness, accent: JUDGE_ACCENT } };
    building = (async () => {
      const gradingModule = await loadGrading();
      [0, 1].forEach(i => { const set = new THREE.Group(); set.visible = false; scene.add(set); sets[i] = set; });
      run = await buildRunStage({ THREE, kit, set: sets[0], util, camera, errLight, makeRobot, weapon: () => (library ? library.weapons[l.harness].clone(true) : null) });
      grading = await gradingModule.build({ THREE, kit, set: sets[1], index: 1, accent: JUDGE_ACCENT, loadWeapons, labelTexture: kit.labelTexture, reduce: false, hand, util, layout, camera, renderer });
      judge = dressJudge({ THREE, kit, set: sets[1], util, camera });
      builtKey = key;
      // Compile the sets' shaders now, while the configuration panel is still up, so the first
      // step does not stall on a black frame.
      sets.forEach(set => { set.visible = true; });
      run.update(0, 0, 0, live); grading.update(.09, 0, 0, beatUI); judge.afterUpdate(15, 0, judgeBot);
      camera.aspect = W / H; camera.updateProjectionMatrix();
      try { await renderer.compileAsync(scene, camera); } catch (error) { console.warn('Shaders were not precompiled.', error); }
      sets.forEach(set => { set.visible = false; });
    })();
    await building; building = null;
  }

  // The frame-time governor: a GPU that cannot keep up loses resolution, shadows and bloom.
  const gov = { skip: 20, samples: [], done: new URLSearchParams(location.search).has('gl') };
  function govern(ms) {
    if (gov.done) return;
    if (gov.skip > 0) { gov.skip--; return; }
    gov.samples.push(ms);
    if (gov.samples.length < 60) return;
    const median = gov.samples.sort((x, y) => x - y)[30];
    gov.done = true;
    if (median > 28) {
      lowFx = true; dprCap = 1; renderer.shadowMap.enabled = false; light.key.castShadow = false;
      scene.traverse(o => { if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(mat => { mat.needsUpdate = true; }); });
      W = H = 0; size();
    }
  }

  return {
    size, build, pick, live, govern,
    renderPick(dt, t) {
      sets.forEach(set => { set.visible = false; });
      pick.set.visible = true;
      light.hemi.intensity = base.hemi; light.key.intensity = base.key; light.rim.intensity = base.rim;
      pick.update(dt, t);
      const c = pick.camera;
      position.set(c.pos[0] + PICK_X, c.pos[1], c.pos[2]); look.set(c.look[0] + PICK_X, c.look[1], c.look[2]);
      frameCamera(c.fov, PICK_X);
      draw();
    },
    renderRun(dt, t, now) {
      pick.set.visible = false;
      live.req = now.req; live.tok = now.tok;
      sets.forEach((set, i) => { set.visible = i === now.beat; });
      let pose, dim = 0;
      if (now.beat === 0) { run.update(now.p, t, dt, live); pose = run.shot; dim = clamp(+run.dim || 0); }
      else {
        grading.update(now.lp, t, dt, beatUI);
        judge.afterUpdate(now.p, t, judgeBot);
        pose = judge.shot(now.p, grading.camera.from);
      }
      position.fromArray(pose.pos); look.fromArray(pose.look);
      frameCamera(pose.fov ?? 34, pose.look[0], now.beat === 0 ? RUN_SETTLE : 0);
      light.hemi.intensity = base.hemi * (1 - dim); light.key.intensity = base.key * (1 - dim); light.rim.intensity = base.rim * (1 - dim);
      draw();
    },
  };
}
function dressPick() { if (stage) stage.pick.place(load); wake(); }

/* ---- building the run's sets for the chosen loadout: ahead of time, and again if it changes ---- */
let readyKey = null, buildJob = null;
const loadKey = () => `${load.model}.${load.variant}.${load.harness}.${load.effort}`;
const isReady = () => !stage || readyKey === loadKey();
function ensureBuilt() {
  if (buildJob) return buildJob;
  if (isReady()) return Promise.resolve();
  const key = loadKey();
  app.dataset.busy = '';
  buildJob = stage.build({ ...load })
    .then(() => { readyKey = key; })
    .catch(error => { console.warn('The run stage could not be built.', error); app.dataset.renderer = 'static'; stage = null; })
    .finally(() => { buildJob = null; delete app.dataset.busy; wake(); });
  return buildJob;
}

/* ---- the loop: only while the stage is on screen and the tab is visible ---- */
let raf = 0, last = performance.now(), clock = 0, onScreen = true;
function frame(ts) {
  raf = 0;
  if (document.hidden || !onScreen) return;
  const ms = ts - last, dt = Math.min(.05, Math.max(0, ms / 1000));
  last = ts;
  if (!reduced) clock += dt;
  if (drive) {
    if (Math.abs(trackY() - drive.at) > 3) drive = null; // the reader scrolled: they take over
    else {
      const k = clamp((performance.now() - drive.start) / drive.ms);
      drive.at = lerp(drive.from, drive.to, drive.back ? smooth(k) : k);
      setScroll(drive.at);
      if (k >= 1) drive = null;
    }
  }
  const y = trackY(), wantRun = held !== null || y >= track.P;
  if (held !== null || y > track.P * .15) void ensureBuilt();
  const nextPhase = wantRun && isReady() ? 'run' : 'pick';
  if (nextPhase !== phase) setPhase(nextPhase);
  const target = held ?? posAt(y), step = clamp(Math.ceil(target), 0, STEPS.length - 1);
  if (step !== index) { index = step; paintStep(); }
  // the picture eases towards the scroll, so a wheel's notches do not show; a long jump arrives at once
  if (held !== null) display = held;
  else if (reduced) display = Math.ceil(target);
  else if (Math.abs(target - display) > 1.5) display = target;
  else { display += (target - display) * (1 - Math.exp(-dt * 10)); if (Math.abs(target - display) < 1e-4) display = target; }
  const now = at(display);
  paintStats(now);
  const entering = held === null ? clamp(1 - Math.abs(y - track.P) / track.fade) : 0, dark = Math.max(now.dark, entering);
  fade.style.opacity = dark ? String(dark) : '';
  if (stage) {
    if (phase === 'pick') { stage.pick.place(load); stage.renderPick(dt, clock); }
    else stage.renderRun(dt, clock, now);
    stage.govern(ms);
  }
  // with reduced motion a still is drawn only when something changed
  if (!reduced || drive) raf = requestAnimationFrame(frame);
}
function wake() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
function resize() { measureTrack(); stage?.size(); wake(); }

/* ---- actions ---- */
el.start.addEventListener('click', async () => {
  el.start.disabled = true;
  const label = el.startLabel.textContent;
  el.startLabel.textContent = 'Preparing the stage';
  await ensureBuilt();
  el.start.disabled = false; el.startLabel.textContent = label;
  playStep(0);
});
ui.next.addEventListener('click', goNext);
ui.back.addEventListener('click', goBack);
canvas.addEventListener('click', goNext);    // a left click anywhere on the stage is the same step
ui.again.addEventListener('click', () => { drive = null; setScroll(track.S[0]); display = -1; playStep(0); });
ui.repick.forEach(button => button.addEventListener('click', () => { drive = null; setScroll(0); wake(); }));
ui.rail.addEventListener('click', e => {
  const t = e.target.closest('.ar-tick');
  if (!t) return;
  const i = +t.dataset.i;
  if (i > index) playStep(i); else { drive = null; setScroll(track.rest[i]); wake(); }
});
addEventListener('keydown', e => {
  if (phase !== 'run' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest?.('input, textarea, select, a, button, summary') && e.key === ' ') return;
  if ((e.key === 'ArrowRight' || e.key === ' ') && index < STEPS.length - 1) { e.preventDefault(); goNext(); }
  else if (e.key === 'ArrowLeft' && index > 0) { e.preventDefault(); goBack(); }
});

/* ---- start ---- */
drawVersions();
ui.stats.req.nextElementSibling.textContent = `/ ${TOTALS.requests}`;
ui.stats.calls.nextElementSibling.textContent = `/ ${TOTALS.calls}`;
ui.stats.files.nextElementSibling.textContent = `/ ${TOTALS.files}`;
paintStep();
if (webglAvailable()) {
  try { stage = createStage(); app.dataset.renderer = 'webgl'; }
  catch (error) { console.warn('The stage could not start WebGL.', error); app.dataset.renderer = 'static'; }
} else app.dataset.renderer = 'static';
measureTrack();
syncChoice();
setPhase('pick');
armoryPromise.then(wake);
document.fonts?.ready.then(wake);
const roomy = window.requestIdleCallback || (fn => setTimeout(fn, 900));
roomy(() => { void ensureBuilt(); });        // most visitors keep the default: have it ready
const resizeWatch = new ResizeObserver(resize); resizeWatch.observe(pin); resizeWatch.observe($('.site-header'));
addEventListener('resize', resize);
addEventListener('scroll', wake, { passive: true });
STACKED.addEventListener?.('change', resize);
document.addEventListener('visibilitychange', () => { if (!document.hidden) wake(); });
new IntersectionObserver(es => { onScreen = es.some(e => e.isIntersecting); if (onScreen) wake(); }).observe(app);
const params = new URLSearchParams(location.search), startAt = params.get('step');
if (params.has('hold')) { held = parseFloat(params.get('hold')) || 0; window.__arHold = v => { held = v; wake(); }; wake(); }
else if (startAt !== null) void ensureBuilt().then(() => { setScroll(track.rest[clamp((parseInt(startAt, 10) || 1) - 1, 0, STEPS.length - 1)]); wake(); });

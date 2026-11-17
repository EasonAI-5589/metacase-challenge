/* subpage-toy-scenes.js — the header dioramas of the pages other than the homepage, built
 * from the homepage's kit: a round plinth, the kit's people and robot, and each page's props.
 *   challenge   three portal arches, the robot on its ring between two visitors
 *   harness     a workbench, the robot arming itself, a harness turning on a pedestal
 *   evolution   a stair of Metacase tiles winding up, the robot partway, a loop overhead
 *   leaderboard a podium of three robots, a cup, confetti, two people cheering
 *   teams       a round table of people and the robot, a flag for each of the four institutions
 *   professional-tasks  a desk of documents and charts, an analyst, the robot with a report
 *   replication a reading desk, a researcher with the book, the robot with its lens, a fitted line
 *   metacase-economics  five departments, one per inspection wave, each with its queue of applicants;
 *               the robot walks the street with its lens, the author stands with the paper
 *   metacase-society    the society film's yard: four hubs, the supervisors, a trainer, and the robot
 *               going round the three work packages (on the film's own ground, film-soc-kit.js,
 *               loaded only on that page)
 * The picture is drawn on a transparent canvas over the page's own backdrop. */
import * as THREE from './assets/vendor/three/three.module.js';
import * as kit from './mc-kit.js?v=20261105-grip';
import { PALETTE, GUN_HOLD, mat, add, block, cyl, ball, person, robot, tile, bookStack, tree, lights, blaster, lens, terminal, closedBook } from './mc-kit.js?v=20261105-grip';
import { createPost } from './mc-toon.js?v=20261102-toy';

const TRACK = [0x45b5b0, 0xf2b545, 0x7d6ad8];
const WOOD = 0x8a5f3f, WOOD_DARK = 0x5d3e2a;
const glow = (c, i = 1.6) => mat(c, { emissive: c, intensity: i, rough: .5 });

function plinth(scene, color = 0x1c2740) {
  cyl(scene, 3.2, 3.35, .32, color, 0, -.32, 0, 48);
  cyl(scene, 3.36, 3.1, .5, 0x111a2d, 0, -.82, 0, 48);
  const ring = add(scene, new THREE.TorusGeometry(3.25, .025, 8, 96), glow(PALETTE.teal, 1.1), 0, .005, 0, false);
  ring.rotation.x = Math.PI / 2;
  return ring;
}
function arch(parent, color, x, z, turn) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = turn; parent.add(g);
  [-1, 1].forEach(s => block(g, .28, 2.1, .34, WOOD, s * .78, 0, 0, .06));
  block(g, 1.9, .3, .4, WOOD_DARK, 0, 2.05, 0, .07);
  block(g, .5, .22, .44, mat(color, { emissive: color, intensity: .5 }), 0, 2.09, .02, .06);
  const door = add(g, new THREE.CircleGeometry(.72, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .78 }), 0, 1.08, .02, false);
  door.scale.y = 1.3;
  const rim = add(g, new THREE.TorusGeometry(.74, .05, 8, 48), glow(color, 1.8), 0, 1.08, .04, false); rim.scale.y = 1.3;
  block(g, 1.5, .06, .7, mat(color, { emissive: color, intensity: .7 }), 0, 0, .25, .03).castShadow = false;
  return { g, door, rim };
}
function table(parent, w, d, x = 0, z = 0, h = .72) {
  const g = new THREE.Group(); g.position.set(x, 0, z); parent.add(g);
  block(g, w, .08, d, WOOD, 0, h - .08, 0, .03);
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => block(g, .08, h - .08, .08, WOOD_DARK, sx * (w / 2 - .1), 0, sz * (d / 2 - .1), .02));
  return g;
}
function board(parent, x, y, z, turn = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = turn; parent.add(g);
  block(g, 1.5, 1, .06, 0xfffdf7, 0, 0, 0, .05);
  block(g, 1.6, 1.1, .04, WOOD_DARK, 0, -.05, -.03, .05);
  [-1, 1].forEach(s => block(g, .06, y, .06, WOOD_DARK, s * .6, -y, -.02, .02));
  return g;
}
const at = (o, x, y, z, ry = 0, s = 1) => { o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); return o; };
const smooth = x => { const p = Math.min(1, Math.max(0, x)); return p * p * (3 - 2 * p); };
/* A round the robot walks for ever: stops = [{ x, z, hold, face }] (hold in seconds; face = [x, z] it
 * looks at while it waits). round(t) gives where it is: { x, z, ry, walk (0..1), stop (index while it
 * waits, else -1), lap }. It walks at `speed` and turns smoothly into each stop. */
function makeRound(stops, speed = .9) {
  const legs = stops.map((a, i) => { const b = stops[(i + 1) % stops.length]; return Math.hypot(b.x - a.x, b.z - a.z) / speed; });
  const total = stops.reduce((n, a, i) => n + a.hold + legs[i], 0);
  const turn = (a, b, k) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return a + d * k; };
  const facing = a => (a.face ? Math.atan2(a.face[0] - a.x, a.face[1] - a.z) : 0);
  return t => {
    const lap = Math.floor(t / total); let u = t - lap * total;
    for (let i = 0; i < stops.length; i++) {
      const a = stops[i], b = stops[(i + 1) % stops.length];
      if (u < a.hold) return { x: a.x, z: a.z, ry: facing(a), walk: 0, stop: i, lap, since: u };
      u -= a.hold;
      if (u < legs[i]) {
        const k = u / legs[i], e = smooth(k), head = Math.atan2(b.x - a.x, b.z - a.z);
        const ry = k < .18 ? turn(facing(a), head, smooth(k / .18)) : k > .82 ? turn(head, facing(b), smooth((k - .82) / .18)) : head;
        return { x: a.x + (b.x - a.x) * e, z: a.z + (b.z - a.z) * e, ry, walk: Math.sin(k * Math.PI) ** .5, stop: -1, legFrom: i, lap, since: 0 };
      }
      u -= legs[i];
    }
    return { x: stops[0].x, z: stops[0].z, ry: facing(stops[0]), walk: 0, stop: 0, lap, since: 0 };
  };
}

const BUILD = {
  challenge(scene, tick) {
    const arches = [-1, 0, 1].map((k, i) => arch(scene, TRACK[i], k * 1.95, -1.25 + Math.abs(k) * .55, -k * .42));
    const bot = robot(PALETTE.cream, 0x8ff6ff); scene.add(at(bot.root, 0, 0, 1.05, 0, 1.25));
    const pad = add(scene, new THREE.TorusGeometry(.55, .04, 8, 48), glow(PALETTE.teal, 1.6), 0, .02, 1.05, false); pad.rotation.x = Math.PI / 2;
    const a = person(4), b = person(9);
    scene.add(at(a.root, -1.7, 0, 1.3, .5, 1.05), at(b.root, 1.75, 0, 1.15, -.6, 1.05));
    tick.push(t => { bot.update(t, 0); a.update(t, 0); b.update(t + 2, 0); bot.root.position.y = Math.sin(t * 1.6) * .05 + .05;
      arches.forEach((ar, i) => { ar.rim.material.emissiveIntensity = 1.4 + Math.sin(t * 2 + i * 2) * .5; ar.door.material.opacity = .66 + Math.sin(t * 1.4 + i) * .1; }); });
  },
  harness(scene, tick) {
    const bench = table(scene, 2.4, 1, -.6, -.4);
    const term = terminal(PALETTE.teal); bench.add(at(term.root, -.6, .72, -.1, .2, 1.3));
    bench.add(at(bookStack(3, 1), .7, .72, 0, .3, .9));
    const bot = robot(PALETTE.cream, 0x8ff6ff); scene.add(at(bot.root, -.4, 0, .75, .25, 1.2));
    const held = blaster(PALETTE.teal); held.scale.setScalar(.55); held.position.copy(GUN_HOLD.at); held.rotation.copy(GUN_HOLD.turn); bot.root.add(held); bot.grip();
    // a harness on a pedestal, turning in its rings
    const ped = new THREE.Group(); ped.position.set(1.65, 0, .35); scene.add(ped);
    cyl(ped, .45, .55, .5, 0x26324d, 0, 0, 0, 32);
    const top = add(ped, new THREE.TorusGeometry(.46, .03, 8, 40), glow(PALETTE.amber, 1.4), 0, .5, 0, false); top.rotation.x = Math.PI / 2;
    const gun = blaster(PALETTE.amber); gun.scale.setScalar(.9); gun.position.y = 1.15; ped.add(gun);
    const rings = [0, 1].map(k => { const r = add(ped, new THREE.TorusGeometry(.62 + k * .12, .018, 8, 48), glow(k ? PALETTE.violet : PALETTE.teal, 1.5), 0, 1.15, 0, false); return r; });
    const eng = person(10, { hardHat: true }); scene.add(at(eng.root, 2.2, 0, 1.4, -.9, 1.05));
    [[-2.2, -.9], [-2.4, .1]].forEach(([x, z], k) => block(scene, .6, .5, .6, k ? PALETTE.orange : PALETTE.sky, x, 0, z, .06));
    tick.push(t => { bot.update(t, 0); eng.update(t, 0); gun.rotation.y = t * .8; gun.position.y = 1.15 + Math.sin(t * 1.8) * .06;
      rings[0].rotation.set(t * .9, t * .4, 0); rings[1].rotation.set(-t * .6, 0, t * .7); });
  },
  evolution(scene, tick) {
    const steps = [];
    for (let k = 0; k < 8; k++) {
      const a = -2.4 + k * .62, r = 1.7, t = tile({ sig: k % 5, edge: [PALETTE.teal, PALETTE.sky, PALETTE.violet, PALETTE.amber, PALETTE.green][k % 5], size: .62, glow: 1.2 });
      t.position.set(Math.sin(a) * r, .05 + k * .26, Math.cos(a) * r * .7 - .3); t.rotation.y = a; scene.add(t); steps.push(t);
      if (k) block(scene, .12, .05 + k * .26, .12, 0x2a3756, t.position.x, 0, t.position.z, .03);
    }
    const bot = robot(PALETTE.cream, 0xc4a7ff); scene.add(at(bot.root, 0, 0, 0, 0, .95));
    const loop = add(scene, new THREE.TorusGeometry(.75, .04, 10, 80, Math.PI * 1.7), glow(PALETTE.violet, 1.4), 0, 2.75, -.6, false);
    const head = ball(scene, .09, glow(PALETTE.amber, 2), 0, 2.75, -.6, 12);
    scene.add(at(tree(1.3), -2.2, 0, 1.2), at(tree(.9, 0x6fc48f), 2.3, 0, 1.0));
    const fan = person(7); scene.add(at(fan.root, 1.2, 0, 1.75, -.4, 1));
    tick.push(t => {
      // the robot climbs the stair and starts again at the foot
      const u = (t * .32) % 1, k = Math.min(6.999, u * 7), i = Math.floor(k), f = k - i, A = steps[i].position, B = steps[i + 1].position;
      bot.root.position.lerpVectors(A, B, f); bot.root.position.y = A.y + (B.y - A.y) * f + .16 + Math.sin(f * Math.PI) * .25;
      bot.root.rotation.y = steps[i].rotation.y + Math.PI / 2;
      bot.update(t * 2, 1); fan.update(t, 0);
      loop.rotation.z = t * .6; head.position.set(Math.cos(t * .6 + Math.PI * 1.7) * .75, 2.75 + Math.sin(t * .6 + Math.PI * 1.7) * .75, -.6);
      steps.forEach((s, j) => { s.userData.mark.material.emissiveIntensity = j === i + 1 ? 2.2 : 1; });
    });
  },
  leaderboard(scene, tick) {
    const spots = [[0, 1.05, 0xffd666], [-1.2, .72, 0xdfe7f2], [1.2, .48, 0xe2a36a]];
    const bots = spots.map(([x, h, c], k) => {
      block(scene, 1.05, h, 1, k ? 0x2c3a5c : 0x34466e, x, 0, 0, .08);
      block(scene, 1.08, .08, 1.03, mat(c, { emissive: c, intensity: .45, rough: .4 }), x, h - .04, 0, .04);
      const b = robot(PALETTE.cream, [0xffd666, 0x8ff6ff, 0xffb38a][k]); scene.add(at(b.root, x, h, .05, 0, k ? 1 : 1.15)); return b;
    });
    // the cup, held up over the winner's head
    const cup = new THREE.Group(), gold = mat(0xffcf4a, { emissive: 0xffb020, intensity: .35, rough: .3 });
    add(cup, new THREE.CylinderGeometry(.2, .1, .32, 24), gold, 0, .16, 0); add(cup, new THREE.CylinderGeometry(.05, .05, .1, 12), gold, 0, -.04, 0);
    add(cup, new THREE.CylinderGeometry(.13, .15, .05, 20), gold, 0, -.11, 0);
    [-1, 1].forEach(s => { const h = add(cup, new THREE.TorusGeometry(.08, .02, 8, 20), gold, s * .21, .18, 0); h.rotation.y = Math.PI / 2; });
    bots[0].root.add(at(cup, 0, 1.25, 0, 0, 1.1));
    const confetti = Array.from({ length: 26 }, (_, k) => {
      const c = block(scene, .09, .02, .14, mat([PALETTE.teal, PALETTE.amber, PALETTE.violet, PALETTE.rose, PALETTE.sky][k % 5]), 0, 0, 0, .01); c.castShadow = false;
      c.userData = { x: (Math.random() - .5) * 4.6, z: (Math.random() - .5) * 2 - .3, s: .4 + Math.random() * .5, p: Math.random() * 10 }; return c;
    });
    const fans = [person(2), person(11)]; scene.add(at(fans[0].root, -2.3, 0, 1.25, .6), at(fans[1].root, 2.35, 0, 1.2, -.6));
    const arms = fans.map(f => f.root.children[0].children.filter(c => c.isGroup && Math.abs(c.position.x) > .2 && c.position.y > .5));
    tick.push(t => {
      bots.forEach((b, k) => { b.update(t + k, 0); b.root.position.y = spots[k][1] + Math.abs(Math.sin(t * 3 + k)) * .06; });
      fans.forEach((f, k) => { f.update(t + k, 0); arms[k].forEach((a, j) => { a.rotation.x = Math.PI + Math.sin(t * 6 + j + k) * .25; }); });
      confetti.forEach(c => { const d = c.userData, y = 4.2 - ((t * d.s + d.p) % 4.4); c.position.set(d.x + Math.sin(t + d.p) * .3, y, d.z); c.rotation.set(t * 3 + d.p, t * 2, d.p); });
    });
  },
  teams(scene, tick) {
    cyl(scene, 1.15, 1.15, .07, WOOD, 0, .66, -.1, 40); cyl(scene, .12, .2, .66, WOOD_DARK, 0, 0, -.1, 16);
    [[-.4, .3, .4], [.45, .2, -.5]].forEach(([x, z, r]) => scene.add(at(terminal(PALETTE.teal).root, x, .73, z - .1, r, .8)));
    const seats = [[-1.55, .5, 1.1], [1.6, .45, -1.15], [-.9, -1.25, .5], [.95, -1.3, -.55], [0, 1.45, Math.PI]];
    const crew = seats.map(([x, z, r], k) => { const p = k === 4 ? robot(PALETTE.cream, 0x8ff6ff) : person(k * 4 + 1); scene.add(at(p.root, x, 0, z - .1, r + Math.PI, k === 4 ? 1.05 : 1.05)); return p; });
    crew.forEach((p, k) => { if (k < 4) p.root.lookAt(0, 0, -.1); });
    // one flag per institution, in the colours the Teams backdrop gives them: NTU, SUFE, HKU, Tsinghua
    [...TRACK, PALETTE.rose].forEach((c, k) => {
      const x = -2.1 + k * 1.4, z = -2.15;
      cyl(scene, .03, .03, 2.1, 0xd9dde5, x, 0, z, 8);
      const flag = block(scene, .7, .42, .03, mat(c, { emissive: c, intensity: .25 }), x + .36, 1.62, z, .04); flag.userData.k = k;
      tick.push(t => { flag.rotation.y = Math.sin(t * 2 + k) * .18; });
    });
    tick.push(t => crew.forEach((p, k) => p.update(t + k * 1.3, 0)));
  },
  'professional-tasks'(scene, tick) {
    const desk = table(scene, 2.6, 1.1, -.2, -.5);
    desk.add(at(terminal(PALETTE.amber).root, -.7, .72, -.15, .15, 1.2));
    [[.3, 0], [.75, .15]].forEach(([x, z], k) => desk.add(at(bookStack(4 - k, k + 2), x, .72, z, k * .5, .7)));
    const chart = board(scene, 1.6, 1.55, -1.2, -.45);
    [[-.5, .3], [-.25, .5], [0, .38], [.25, .66], [.5, .78]].forEach(([x, h], k) => block(chart, .16, h, .03, k === 4 ? PALETTE.amber : PALETTE.sky, x, -.42, .04, .03));
    const analyst = person(6), lead = person(13);
    scene.add(at(analyst.root, -.6, 0, .55, Math.PI + .2, 1.05), at(lead.root, 1.15, 0, .45, -.7, 1.05));
    const bot = robot(PALETTE.cream, 0xffd666); scene.add(at(bot.root, -2, 0, .6, .6, 1.05));
    const report = tile({ sig: 3, edge: PALETTE.amber, size: .3 }); report.position.set(0, .55, .3); report.rotation.x = -1.1; bot.root.add(report);
    tick.push(t => { analyst.update(t, 0); lead.update(t + 1, 0); bot.update(t, 0); bot.root.position.y = Math.abs(Math.sin(t * 2.2)) * .05; });
  },
  replication(scene, tick) {
    const desk = table(scene, 2.2, 1.1, -.5, -.3);
    const book = closedBook(); desk.add(at(book, -.55, .72, -.05, .3, .32));
    desk.add(at(bookStack(3, 4), .6, .72, -.1, -.3, .7));
    const fit = board(scene, 1.55, 1.55, -1.1, -.4);
    [[-.55, -.3], [-.38, -.18], [-.2, -.2], [-.02, -.02], [.16, .02], [.34, .18], [.52, .26]].forEach(([x, y]) => ball(fit, .045, PALETTE.teal, x, y, .07, 10));
    const line = block(fit, 1.25, .025, .02, mat(PALETTE.rose, { emissive: PALETTE.rose, intensity: .4 }), 0, -.03, .07, .01); line.rotation.z = .42;
    const reader = person(3); scene.add(at(reader.root, -.5, 0, .55, Math.PI, 1.05));
    const bot = robot(PALETTE.cream, 0x8ff6ff); scene.add(at(bot.root, 1.0, 0, .85, -.5, 1.05));
    const glass = lens(PALETTE.amber); glass.position.set(.34, .5, .3); glass.scale.setScalar(1.4); bot.root.add(glass);
    tick.push(t => { reader.update(t, 0); bot.update(t, 0); glass.rotation.z = Math.sin(t * 1.5) * .3; });
  },
  /* econ-0157: from 2013 inspection teams entered the departments in five waves, and the paper asks
   * whether the competition for their posts changed afterwards. Five departments stand in an arc,
   * one per wave, each with its queue of applicants. The robot walks the street with its lens: as it
   * passes a department the inspection arrives (a beam, the flag turns amber) and the queue shortens.
   * Then it reads the count of observations on the sign at the front, where the author stands with
   * the paper. */
  'metacase-economics'(scene, tick, { reduce = false } = {}) {
    const AMBER = new THREE.Color(PALETTE.amber), GREY = new THREE.Color(0x9aa3b2), QUEUE = 4;
    const depts = [2013, 2014, 2015, 2016, 2017].map((year, k) => {
      const th = (-56 + k * 28) * Math.PI / 180, x = Math.sin(th) * 2.5, z = -Math.cos(th) * 2.5 + .3, ry = Math.atan2(-x, 1.1 - z);
      const g = new THREE.Group(); at(g, x, 0, z, ry, 1.32); scene.add(g);
      block(g, .92, .08, .72, PALETTE.stone, 0, 0, 0, .03);
      block(g, .74, .5, .46, PALETTE.wall, 0, .08, -.06, .04);
      for (let i = 0; i < 4; i++) cyl(g, .035, .04, .46, PALETTE.wall, -.3 + i * .2, .08, .26, 10);
      block(g, .2, .3, .03, PALETTE.ink, 0, .08, .18, .02).castShadow = false; // the door
      block(g, .88, .14, .68, PALETTE.wall, 0, .54, 0, .03);
      const label = new THREE.Mesh(new THREE.PlaneGeometry(.5, .125), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false,
        map: kit.labelTexture(`hero-econ-year:${year}`, [{ text: String(year), size: 190, weight: 800, color: '#2a2f3b', font: 'ui-monospace, SFMono-Regular, Menlo, monospace', track: 8 }], { width: 1024, height: 256 }) }));
      label.position.set(0, .61, .343); g.add(label);
      block(g, .7, .07, .5, 0x2f3a56, 0, .68, 0, .03);
      cyl(g, .014, .014, .62, PALETTE.ink, .26, .75, -.12, 6);
      const flagMat = mat(0x9aa3b2, { emissive: PALETTE.amber, intensity: 0 }).clone();
      block(g, .26, .16, .02, flagMat, .4, 1.19, -.12, .01).castShadow = false;
      const lampMat = mat(0x5a6378, { emissive: PALETTE.amber, intensity: 0 }).clone();
      ball(g, .05, lampMat, .26, 1.38, -.12, 10).castShadow = false;
      // the inspection: a beam from above and a ring on the ground before the door
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(.05, .5, 2.2, 24, 1, true), new THREE.MeshBasicMaterial({ color: PALETTE.amber, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      beam.position.set(0, 1.15, .05); g.add(beam);
      const ring = add(g, new THREE.TorusGeometry(.56, .018, 8, 48), new THREE.MeshBasicMaterial({ color: PALETTE.amber, transparent: true, opacity: 0 }), 0, .012, .1, false); ring.rotation.x = Math.PI / 2;
      // where its queue stands: out from the door, towards the middle of the street
      const dx = Math.sin(ry), dz = Math.cos(ry);
      return { x, z, ry, dx, dz, flagMat, lampMat, beam, ring };
    });
    // the applicants: small figures, a body and a head each (two draw calls for all of them)
    const N = depts.length * QUEUE, SHIRTS = [0x4a7fd4, 0xe2667a, 0x3f9d6a, 0x7d6ad8, 0x45b5b0, 0xef8a4b];
    const bodyGeo = new THREE.CapsuleGeometry(.1, .17, 4, 10); bodyGeo.translate(0, .185, 0);
    const headGeo = new THREE.SphereGeometry(.108, 14, 10); headGeo.translate(0, .43, 0);
    const pawn = (geo, tint) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .78 }), N); m.castShadow = true; m.frustumCulled = false; scene.add(m);
      const c = new THREE.Color(); for (let i = 0; i < N; i++) m.setColorAt(i, c.setHex(tint(i))); return m; };
    const bodies = pawn(bodyGeo, i => SHIRTS[(i * 5 + 1) % SHIRTS.length]), heads = pawn(headGeo, i => PALETTE.skins[(i * 3) % PALETTE.skins.length]);
    const o = new THREE.Object3D();
    // the size of the panel on a small sign at the front (3,246 department-year observations), and the
    // author with the paper
    const sign = new THREE.Group(); at(sign, .35, 0, 2.15, .1, 1); scene.add(sign);
    cyl(sign, .03, .04, .52, 0x394560, 0, 0, 0, 8);
    block(sign, 1.0, .44, .05, 0x0d1524, 0, .5, 0, .03);
    const frameMat = mat(PALETTE.amber, { emissive: PALETTE.amber, intensity: 1.1, rough: .5 }).clone();
    block(sign, 1.06, .5, .03, frameMat, 0, .47, -.02, .03).castShadow = false;
    const figure = new THREE.Mesh(new THREE.PlaneGeometry(.92, .4), new THREE.MeshBasicMaterial({ transparent: true, toneMapped: false,
      map: kit.labelTexture('hero-econ-sample', [{ text: '3,246', size: 128, weight: 800, color: '#ffe9b8', font: 'ui-monospace, SFMono-Regular, Menlo, monospace' }, { text: 'observations', size: 44, weight: 600, color: '#d9c9a0' }], { width: 512, height: 224 }) }));
    figure.position.set(0, .72, .027); sign.add(figure);
    const lectern = new THREE.Group(); at(lectern, -1.25, 0, 2.0, .35, 1); scene.add(lectern);
    block(lectern, .5, .58, .36, WOOD, 0, 0, 0, .05);
    lectern.add(at(closedBook(), -.2, .6, .02, .1, .15));
    const author = person(3); scene.add(at(author.root, -1.85, 0, 1.55, .75, 1.05));
    // the robot with its lens: along the street, to the sign, and back
    const bot = robot(PALETTE.cream, 0x8ff6ff); scene.add(bot.root); bot.root.scale.setScalar(1.2);
    const glass = lens(PALETTE.amber); glass.position.set(.34, .5, .3); glass.scale.setScalar(1.4); bot.root.add(glass);
    const SIGN = { x: 1.3, z: 1.8 };
    const round = makeRound([
      { x: -2.2, z: .95, hold: 1.2, face: [3, .95] },
      { x: 2.2, z: .95, hold: .7, face: [3, 1.6] },
      { ...SIGN, hold: 3.6, face: [.9, 4] },
    ], .95);
    let still = null; // reduced motion: at the sign, every wave arrived
    for (let u = 0; u < 60 && !still; u += .25) { const q = round(u); if (q.stop === 2) still = { ...q, since: 9 }; }
    tick.push(t => {
      const r = reduce && still ? still : round(t);
      bot.root.position.set(r.x, 0, r.z); bot.root.rotation.y = r.ry; bot.update(t, r.walk);
      glass.rotation.z = Math.sin(t * 1.5) * .3;
      // on the way along the street each wave arrives as the robot comes level with its department;
      // all five stay while it reads the sign, and clear as it walks back
      const along = r.stop === 0 || (r.stop === -1 && r.legFrom === 0);
      const back = r.stop === -1 && r.legFrom === 2 ? 1 - smooth(Math.hypot(r.x - SIGN.x, r.z - SIGN.z) / 1.6) : 1;
      depts.forEach((d, k) => {
        const on = along ? smooth((r.x - d.x * .85 + .25) / .5) : back;
        d.flagMat.color.copy(GREY).lerp(AMBER, on); d.flagMat.emissiveIntensity = on * .6;
        d.lampMat.emissiveIntensity = on * 2.2;
        d.ring.material.opacity = on * .8;
        d.beam.material.opacity = along ? Math.sin(Math.min(1, Math.max(0, on)) * Math.PI) * .32 : 0;
        // the queue: four before the inspection, two after; the last two step away and are gone
        for (let j = 0; j < QUEUE; j++) {
          const leave = j >= 2 ? smooth(on * 1.6 - (QUEUE - 1 - j) * .5) : 0, i = k * QUEUE + j, dist = .78 + j * .33;
          o.position.set(d.x + d.dx * dist + d.dz * leave * .5, Math.abs(Math.sin(t * 2.4 + i * 1.9)) * .02, d.z + d.dz * dist - d.dx * leave * .5);
          o.rotation.y = d.ry + Math.PI + Math.sin(t * .8 + i) * .25; o.scale.setScalar(Math.max(.001, 1 - leave)); o.updateMatrix();
          bodies.setMatrixAt(i, o.matrix); heads.setMatrixAt(i, o.matrix);
        }
      });
      bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
      frameMat.emissiveIntensity = r.stop === 2 ? 1.5 + Math.sin(t * 4) * .5 : 1;
      author.update(t, 0);
    });
  },
  /* HR-T3-114: supervisors at three hubs were trained and a fourth, deferred, is the reference; the
   * agent prepares a recommendation for each of the provider's three work packages. The robot goes
   * round the crates with its clipboard, and each unit takes its status as it is checked. */
  async 'metacase-society'(scene, tick, { reduce = false } = {}) {
    // the same version string as the society film's own imports of the kit, so it is fetched once;
    // when the kit changes, change it here with them
    const K = await import('./film-soc-kit.js?v=mc-1c165fc3e2');
    const S = .58, set = new THREE.Group(); set.scale.setScalar(S); set.position.x = -K.YARD.X * S; scene.add(set);
    const yard = K.yard({ THREE, kit, set, accent: 0x7d6ad8 });
    const g = new THREE.Group(); g.position.set(K.YARD.X, 0, 0); set.add(g); // yard-centred coordinates
    const HUBS = [{ x: -2.75, color: PALETTE.teal }, { x: -.95, color: PALETTE.sky }, { x: .85, color: PALETTE.violet }, { x: 2.65, color: 0, deferred: true }];
    HUBS.forEach((h, i) => { const b = K.hub({ THREE, kit, name: `HUB-0${i + 1}`, color: h.color, deferred: !!h.deferred }); at(b.group, h.x, 0, -2.05, 0, 1.25); g.add(b.group); });
    // the supervisors of the three trained hubs, eight before each
    const N = 24, people = K.crowd({ THREE, kit, n: N }); g.add(people.group);
    const spots = []; for (let h = 0; h < 3; h++) for (let k = 0; k < 8; k++) spots.push([HUBS[h].x - .5 + (k % 4) * .33, -.95 + Math.floor(k / 4) * .42, h * 8 + k]);
    // the trainer, facing them
    const trainer = person(10, { hardHat: true }); g.add(at(trainer.root, -3.55, 0, -.35, 1.25, 1.45));
    // the three work packages: A one unit, B four, C two
    const PACKS = [{ letter: 'A', units: 1, x: -2.3, status: ['pending'] }, { letter: 'B', units: 4, x: -.2, status: ['verified', 'verified', 'verified', 'pending'] }, { letter: 'C', units: 2, x: 2.2, status: ['verified', 'pending'] }];
    const base = new THREE.Color(0xc79a5b), crates = PACKS.map(pk => { const c = K.crate({ THREE, kit, letter: pk.letter, units: pk.units, unitW: .5, h: .6, d: .62 }); at(c.group, pk.x, 0, 1.75, 0, 1); g.add(c.group); return c; });
    // the robot with its clipboard goes from crate to crate
    const bot = robot(PALETTE.cream, 0xb7a8ff); g.add(bot.root); bot.root.scale.setScalar(1.7);
    const clip = tile({ sig: 3, edge: PALETTE.amber, size: .3 }); clip.position.set(0, .55, .3); clip.rotation.x = -1.1; bot.root.add(clip);
    // (it stands behind each crate, so it faces the viewer while it checks)
    const round = makeRound(PACKS.map(pk => ({ x: pk.x, z: .3, hold: 2.6, face: [pk.x, 1.4] })).concat([{ x: 3.5, z: .95, hold: 2.2, face: [1.2, 3] }]), 1.3);
    const tint = new THREE.Color();
    let still = null; // reduced motion: the robot standing back, every unit with its status
    for (let u = 0; u < 60 && !still; u += .25) { const q = round(u); if (q.stop === 3) still = { ...q, since: 9 }; }
    tick.push(t => {
      const r = reduce && still ? still : round(t);
      bot.root.position.set(r.x, 0, r.z); bot.root.rotation.y = r.ry; bot.update(t, r.walk);
      // a crate keeps its units' statuses from the moment the robot has checked it until the round starts again
      crates.forEach((c, i) => c.segments.forEach((seg, j) => {
        // (the fourth stop is the robot standing back; on the walk home from it the crates clear)
        const done = r.stop === 3 ? 1 : r.stop >= 0 ? (i < r.stop ? 1 : i === r.stop ? smooth((r.since - j * .35) / .5) : 0) : r.legFrom === 3 ? 1 - smooth((r.x < 3 ? 1 : 0)) : (i <= r.legFrom ? 1 : 0);
        seg.mat.color.copy(base).lerp(tint.setHex(K.STATUS[PACKS[i].status[j]]), done * .85);
        seg.mat.emissive.setHex(K.STATUS[PACKS[i].status[j]]); seg.mat.emissiveIntensity = done * .28;
      }));
      spots.forEach(([x, z, i]) => people.place(i, x, z, { y: Math.abs(Math.sin(t * 2.2 + i * 1.7)) * .03, ry: Math.sin(t * .7 + i) * .35 - .6, s: 1.2 }));
      people.commit();
      trainer.update(t, 0); trainer.root.rotation.y = 1.25 + Math.sin(t * .9) * .25;
      yard.lampMats.forEach((m, i) => { m.emissiveIntensity = 1.5 + Math.sin(t * 1.1 + i * 2) * .25; });
    });
    return { rim: yard.rimMat, look: [0, .4, 0], far: 9.9 };
  },
};

export async function mount(canvas, name, { reduce = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  lights(scene, { span: 6, shadowSize: 1024 });
  const tick = [];
  // a scene may bring its own ground and return its glowing rim, and say where the camera looks
  // and how far it stands; the others stand on the round plinth
  const own = await BUILD[name](scene, tick, { reduce });
  const rim = own?.rim || plinth(scene).material;
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 80);
  const look = new THREE.Vector3(...(own?.look || [0, .95, 0])), far = own?.far || 10.4;
  const post = createPost(renderer, { bloom: .22, threshold: .9, vignette: 0, alpha: true });
  let w = 0, h = 0;
  const size = () => {
    const r = canvas.getBoundingClientRect();
    if (!r.width || (r.width === w && r.height === h)) return;
    w = r.width; h = r.height;
    renderer.setSize(w, h, false); post.setSize(w, h);
    camera.aspect = w / h; camera.fov = w / h < 1.05 ? 34 : 29; camera.updateProjectionMatrix();
  };
  let px = 0, py = 0;
  if (!reduce) addEventListener('pointermove', e => { px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; }, { passive: true });
  let visible = true, last = performance.now(), clock = 0;
  const frame = now => {
    // A frame's timestamp can predate `last`: rAF reports when the frame began, which is before a
    // long mount ended. The clock must not run backwards, since the Evolution stair indexes by it.
    clock += Math.max(0, Math.min(.05, (now - last) / 1000)); last = now;
    size();
    const yaw = Math.sin(clock * .18) * .16 + px * .18;
    camera.position.set(Math.sin(yaw) * far, 4 - py * .5, Math.cos(yaw) * far);
    camera.lookAt(look);
    tick.forEach(f => f(clock));
    rim.emissiveIntensity = 1 + Math.sin(clock * 1.5) * .25;
    post.render(scene, camera);
  };
  const loop = now => { if (!visible || document.hidden) { raf = 0; return; } frame(now); raf = requestAnimationFrame(loop); };
  let raf = 0;
  const run = () => { if (!raf && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible) run(); }).observe(canvas);
  document.addEventListener('visibilitychange', run);
  addEventListener('resize', () => { if (reduce) frame(performance.now()); });
  frame(performance.now() + 1500);
  canvas.dataset.ready = '1';
  run();
}

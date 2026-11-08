/* Metacase Challenge backdrop engine
 * One canvas renderer, several semantic modes:
 *   field         homepage: a sparse flow field that follows the active section
 *   dev100        Challenge: a 10 × 10 task matrix in perspective, cells resolving
 *   orbit         Harness: model core, tool ring and environment ring exchanging calls
 *   contour       Self-evolving: a moving fitness landscape with an optimiser climbing it
 *   bump          Leaderboard: a continuously scrolling rank chart
 *   ledger        Business deliverables: a sheet whose mismatched cells reconcile
 *   globe       Teams: the Earth turned to East Asia, NTU, HKU, SUFE and Tsinghua marked and linked
 * Usage: Backdrop.mount(canvas, { mode, focus: [x, y] }) → { setTone(i), destroy() }
 */
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, k) => a + (b - a) * k;

  // resolve any CSS color (including oklch) to [r, g, b]
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  function rgb(c) {
    probe.clearRect(0, 0, 1, 1); probe.fillStyle = "#000"; probe.fillStyle = c; probe.fillRect(0, 0, 1, 1);
    const d = probe.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2]];
  }
  const css = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
  // Soft glows come from one cached radial texture per colour; shadowBlur is far too slow per frame.
  const sprites = new Map();
  function glow(ctx, c, x, y, r, a = 1) {
    const key = c.join(",");
    let tex = sprites.get(key);
    if (!tex) {
      tex = document.createElement("canvas"); tex.width = tex.height = 64;
      const g = tex.getContext("2d"), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, `rgba(${key},1)`); grd.addColorStop(0.3, `rgba(${key},.45)`); grd.addColorStop(1, `rgba(${key},0)`);
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64); sprites.set(key, tex);
    }
    ctx.globalAlpha = a; ctx.drawImage(tex, x - r, y - r, r * 2, r * 2); ctx.globalAlpha = 1;
  }
  function palette() {
    const cs = getComputedStyle(document.documentElement);
    const dark = document.documentElement.dataset.theme !== "light";
    return {
      dark,
      t1: rgb(cs.getPropertyValue("--track-1").trim()),
      t2: rgb(cs.getPropertyValue("--track-2").trim()),
      v: dark ? [150, 128, 255] : [104, 84, 214],
      r: dark ? [240, 114, 122] : [196, 64, 82],
      ink: dark ? [238, 242, 247] : [14, 20, 32],
      bg: rgb(cs.getPropertyValue("--paper").trim() || (dark ? "#05070e" : "#f6f5f1")),
    };
  }

  // seeded PRNG so layouts are stable between visits
  function prng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

  /* ------------------------------------------------------------ modes */
  const MODES = {};

  MODES.field = {
    init(S) {
      S.parts = [];
      const n = Math.round(clamp(S.w * S.h / 13000, 50, 130));
      for (let i = 0; i < n; i++) S.parts.push(this.spawn(S, true));
      S.tone = 0; S.toneK = 0;
    },
    spawn(S, anywhere) {
      return { x: Math.random() * S.w, y: anywhere ? Math.random() * S.h : Math.random() * S.h, life: 200 + Math.random() * 400, age: anywhere ? Math.random() * 300 : 0, c: Math.random() };
    },
    step(S, dt, t) {
      const boost = 1 + Math.min(6, Math.abs(S.velocity()) * 0.35);
      S.toneK = lerp(S.toneK, S.tone, 0.03);
      for (let i = 0; i < S.parts.length; i++) {
        const p = S.parts[i];
        const a = Math.sin(p.x * 0.0021 + t * 0.00011) * 1.7 + Math.cos(p.y * 0.0026 - t * 0.00008) * 1.7 + Math.sin((p.x + p.y) * 0.0012) * 0.9;
        const sp = 0.32 * boost * dt / 16;
        p.px = p.x; p.py = p.y;
        p.x += Math.cos(a) * sp; p.y += Math.sin(a) * sp - S.scrollDy * 0.04;
        const dx = p.x - S.mx, dy = p.y - S.my, d2 = dx * dx + dy * dy;
        if (d2 < 14000) { const k = (1 - d2 / 14000) * 1.6; p.x += dx / Math.sqrt(d2 + 1) * k; p.y += dy / Math.sqrt(d2 + 1) * k; }
        p.age += dt / 16;
        if (p.age > p.life || p.x < -20 || p.x > S.w + 20 || p.y < -20 || p.y > S.h + 20) S.parts[i] = this.spawn(S, false);
      }
    },
    draw(S, ctx, P) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,0.075)"; ctx.fillRect(0, 0, S.w, S.h);
      ctx.globalCompositeOperation = "source-over";
      const tones = [[P.t1, P.t2], [P.t2, P.t1], [P.v, P.t1], [P.t1, P.v]];
      const k = S.toneK, i0 = Math.floor(k) % 4, i1 = (i0 + 1) % 4, f = k - Math.floor(k);
      ctx.lineWidth = 1.1; ctx.lineCap = "round";
      for (const p of S.parts) {
        if (p.px === undefined) continue;
        const pair0 = tones[i0], pair1 = tones[i1], sel = p.c < 0.72 ? 0 : 1;
        const c = [0, 1, 2].map(j => lerp(pair0[sel][j], pair1[sel][j], f) | 0);
        const fade = Math.min(1, p.age / 40) * Math.min(1, (p.life - p.age) / 60);
        ctx.strokeStyle = css(c, (P.dark ? 0.55 : 0.45) * fade);
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
    },
    trails: true,
  };

  MODES.dev100 = {
    init(S) {
      S.cells = [];
      for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) S.cells.push({ r, c, s: 0, k: 0, hold: 0 });
      S.timer = 0; S.solved = 0;
    },
    step(S, dt, t) {
      S.timer += dt;
      while (S.timer > 150) {
        S.timer -= 150;
        const cell = S.cells[(Math.random() * 100) | 0];
        if (cell.s === 0) { cell.s = 1; cell.k = 0; }
      }
      for (const c of S.cells) {
        if (c.s === 1) { c.k += dt / 900; if (c.k >= 1) { c.s = 2; c.k = 0; c.hold = 1200 + Math.random() * 1800; } }
        else if (c.s === 2) { c.hold -= dt; if (c.hold < 0) { c.s = 3; c.k = 0; } }
        else if (c.s === 3) { c.k += dt / 1200; if (c.k >= 1) { c.s = 0; c.k = 0; } }
      }
      S.scan = (t * 0.00012) % 1.4 - 0.2;
    },
    project(S, gx, gz) {
      const ry = -0.42 + S.pmx * 0.16, rx = 1.02 + S.pmy * 0.08;
      const x = (gx - 4.5) * 1, z = (gz - 4.5) * 1;
      const x1 = x * Math.cos(ry) - z * Math.sin(ry), z1 = x * Math.sin(ry) + z * Math.cos(ry);
      const y2 = -z1 * Math.sin(rx), z2 = z1 * Math.cos(rx);
      const f = 14 / (14 + z2), sc = Math.min(S.w, S.h * 1.6) * 0.043;
      return [S.cx + x1 * f * sc, S.cy + y2 * f * sc, f];
    },
    draw(S, ctx, P) {
      ctx.clearRect(0, 0, S.w, S.h);
      for (const c of S.cells) {
        const a = this.project(S, c.c, c.r), b = this.project(S, c.c + 0.82, c.r), d = this.project(S, c.c, c.r + 0.82), e = this.project(S, c.c + 0.82, c.r + 0.82);
        const scanD = Math.abs(c.r / 9 - S.scan);
        let fill = null, alpha = 0;
        if (c.s === 1) { fill = P.t2; alpha = 0.18 + 0.42 * Math.sin(c.k * Math.PI); }
        else if (c.s === 2) { fill = P.t1; alpha = 0.42; }
        else if (c.s === 3) { fill = P.t1; alpha = 0.42 * (1 - c.k); }
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(e[0], e[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
        if (fill) { ctx.fillStyle = css(fill, alpha); ctx.fill(); }
        ctx.strokeStyle = css(P.ink, 0.07 + (scanD < 0.06 ? 0.25 * (1 - scanD / 0.06) : 0));
        ctx.lineWidth = 1; ctx.stroke();
      }
    },
  };

  MODES.ledger = {
    init(S) {
      const R = prng(3);
      S.colW = [1.5, 1.1, 1.1, 0.9, 0.7]; S.rows = 13; S.cells = [];
      for (let r = 0; r < S.rows; r++) S.colW.forEach((w, c) => S.cells.push({ r, c, s: 0, k: 0, len: 0.35 + R() * 0.5 }));
      S.timer = 0;
    },
    step(S, dt, t) {
      S.timer += dt;
      while (S.timer > 260) {
        S.timer -= 260;
        const r = 1 + ((Math.random() * (S.rows - 1)) | 0), c = Math.random() < 0.7 ? S.colW.length - 1 : 3;
        const cell = S.cells[r * S.colW.length + c];
        if (cell.s === 0) { cell.s = 1; cell.k = 0; }
      }
      for (const c of S.cells) {
        if (c.s === 1) { c.k += dt / 1100; if (c.k >= 1) { c.s = 2; c.k = 0; } }
        else if (c.s === 2) { c.k += dt / 2200; if (c.k >= 1) { c.s = 0; c.k = 0; } }
      }
      S.scan = (t * 0.00016) % 1.25 - 0.1;
    },
    project(S, gx, gy) {
      const total = S.colW.reduce((a, b) => a + b, 0);
      const ry = -0.5 + S.pmx * 0.14, rx = 0.95 + S.pmy * 0.08;
      const x = (gx - total / 2) * 2.2, z = (gy - S.rows / 2) * 0.62;
      const x1 = x * Math.cos(ry) - z * Math.sin(ry), z1 = x * Math.sin(ry) + z * Math.cos(ry);
      const y2 = -z1 * Math.sin(rx), z2 = z1 * Math.cos(rx);
      const f = 14 / (14 + z2), sc = Math.min(S.w, S.h * 1.6) * 0.042;
      return [S.cx + x1 * f * sc, S.cy + y2 * f * sc];
    },
    draw(S, ctx, P) {
      ctx.clearRect(0, 0, S.w, S.h);
      const edges = [0]; S.colW.forEach(w => edges.push(edges[edges.length - 1] + w));
      for (const c of S.cells) {
        const x0 = edges[c.c] + 0.04, x1 = edges[c.c + 1] - 0.04, y0 = c.r + 0.06, y1 = c.r + 0.94;
        const a = this.project(S, x0, y0), b = this.project(S, x1, y0), d = this.project(S, x1, y1), e = this.project(S, x0, y1);
        const scanD = Math.abs(c.r / (S.rows - 1) - S.scan);
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(d[0], d[1]); ctx.lineTo(e[0], e[1]); ctx.closePath();
        let fill = c.r === 0 ? css(P.ink, 0.07) : null;
        if (c.s === 1) fill = css(P.t2, 0.2 + 0.45 * Math.abs(Math.sin(c.k * Math.PI * 2)));
        else if (c.s === 2) fill = css(P.t1, 0.38 * (1 - c.k));
        if (scanD < 0.05 && !fill) fill = css(P.ink, 0.05);
        if (fill) { ctx.fillStyle = fill; ctx.fill(); }
        ctx.strokeStyle = css(P.ink, 0.07); ctx.lineWidth = 1; ctx.stroke();
        // a figure inside the cell
        const m0 = this.project(S, x0 + 0.12, (y0 + y1) / 2), m1 = this.project(S, x0 + 0.12 + (x1 - x0 - 0.24) * c.len, (y0 + y1) / 2);
        ctx.strokeStyle = c.s === 1 ? css(P.t2, 0.9) : c.s === 2 ? css(P.t1, 0.9) : css(P.ink, c.r === 0 ? 0.28 : 0.14);
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.lineTo(m1[0], m1[1]); ctx.stroke();
      }
      // the scan line across the sheet
      const s0 = this.project(S, 0, S.scan * S.rows), s1 = this.project(S, edges[edges.length - 1], S.scan * S.rows);
      const g = ctx.createLinearGradient(s0[0], s0[1], s1[0], s1[1]);
      g.addColorStop(0, css(P.t1, 0)); g.addColorStop(0.5, css(P.t1, 0.55)); g.addColorStop(1, css(P.t1, 0));
      ctx.strokeStyle = g; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();
    },
  };

  MODES.orbit = {
    init(S) {
      const R = prng(5);
      S.rings = [{ r: 0.42, n: 5, sp: 0.00022, label: "TOOLS" }, { r: 0.7, n: 8, sp: -0.00013, label: "HARNESS" }, { r: 1, n: 12, sp: 0.00007, label: "ENVIRONMENT" }];
      S.rings.forEach(g => { g.nodes = Array.from({ length: g.n }, (_, i) => ({ a: i / g.n * TAU + R() * 0.4, glow: 0 })); });
      S.calls = []; S.timer = 0;
    },
    pos(S, ring, a) {
      const R = Math.min(S.w * 0.33, S.h * 0.8) * ring.r, tilt = 0.36 + S.pmy * 0.06, rot = -0.22 + S.pmx * 0.1;
      const x = Math.cos(a) * R, y = Math.sin(a) * R * tilt;
      return [S.cx + x * Math.cos(rot) - y * Math.sin(rot), S.cy + x * Math.sin(rot) + y * Math.cos(rot), Math.sin(a)];
    },
    step(S, dt, t) {
      S.t = t;
      S.rings.forEach(g => g.nodes.forEach(n => { n.a += g.sp * dt; n.glow = Math.max(0, n.glow - dt / 900); }));
      S.timer += dt;
      if (S.timer > 380) {
        S.timer = 0;
        const gi = Math.random() < 0.55 ? 0 : (Math.random() < 0.6 ? 1 : 2), g = S.rings[gi];
        S.calls.push({ g: gi, n: (Math.random() * g.n) | 0, k: 0, out: true, c: gi === 0 ? 0 : 1 });
      }
      for (let i = S.calls.length - 1; i >= 0; i--) {
        const c = S.calls[i]; c.k += dt / 700;
        if (c.k >= 1) { if (c.out) { c.out = false; c.k = 0; S.rings[c.g].nodes[c.n].glow = 1; } else S.calls.splice(i, 1); }
      }
    },
    draw(S, ctx, P) {
      ctx.clearRect(0, 0, S.w, S.h);
      // rings
      S.rings.forEach((g, gi) => {
        ctx.beginPath();
        for (let a = 0; a <= TAU + 0.01; a += TAU / 120) { const p = this.pos(S, g, a); a === 0 ? ctx.moveTo(p[0], p[1]) : ctx.lineTo(p[0], p[1]); }
        ctx.strokeStyle = css(P.ink, gi === 2 ? 0.1 : 0.16); ctx.lineWidth = 1; ctx.setLineDash(gi === 1 ? [3, 6] : []); ctx.stroke(); ctx.setLineDash([]);
        const lp = this.pos(S, g, -Math.PI / 2 - 0.25);
        ctx.font = "10px 'Space Mono', monospace"; ctx.fillStyle = css(P.ink, 0.3); ctx.fillText(g.label, lp[0] + 6, lp[1] - 6);
      });
      // calls: packets travel core ↔ node
      for (const c of S.calls) {
        const g = S.rings[c.g], n = g.nodes[c.n], p = this.pos(S, g, n.a), k = c.out ? c.k : 1 - c.k;
        const x = lerp(S.cx, p[0], k), y = lerp(S.cy, p[1], k), col = c.c ? P.t2 : P.t1;
        ctx.strokeStyle = css(col, 0.18); ctx.beginPath(); ctx.moveTo(S.cx, S.cy); ctx.lineTo(p[0], p[1]); ctx.stroke();
        glow(ctx, col, x, y, 12, 0.7);
        ctx.fillStyle = css(col, 1); ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill();
      }
      // nodes (depth-sorted feel via alpha)
      S.rings.forEach((g, gi) => g.nodes.forEach(n => {
        const p = this.pos(S, g, n.a), depth = (p[2] + 1) / 2, col = gi === 0 ? P.t1 : gi === 1 ? P.v : P.t2;
        const r = (2.8 + depth * 2.4) * (1 + n.glow * 0.9);
        if (n.glow > 0.02) { ctx.fillStyle = css(col, n.glow * 0.25); ctx.beginPath(); ctx.arc(p[0], p[1], r * 4, 0, TAU); ctx.fill(); }
        ctx.fillStyle = css(col, 0.35 + depth * 0.5); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, TAU); ctx.fill();
      }));
      // core
      const pulse = 1 + Math.sin(S.t * 0.003) * 0.08;
      const grd = ctx.createRadialGradient(S.cx, S.cy, 0, S.cx, S.cy, 60 * pulse);
      grd.addColorStop(0, css(P.ink, 0.9)); grd.addColorStop(0.18, css(P.t1, 0.5)); grd.addColorStop(1, css(P.t1, 0));
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(S.cx, S.cy, 60 * pulse, 0, TAU); ctx.fill();
      ctx.font = "10px 'Space Mono', monospace"; ctx.fillStyle = css(P.ink, 0.55); ctx.fillText("MODEL", S.cx - 16, S.cy + 30);
    },
  };

  MODES.contour = {
    init(S) {
      S.peaks = [{ x: 0.7, y: 0.35, s: 0.16, h: 1 }, { x: 0.45, y: 0.65, s: 0.2, h: 0.7 }, { x: 0.88, y: 0.72, s: 0.12, h: 0.55 }, { x: 0.25, y: 0.3, s: 0.14, h: 0.45 }];
      S.agent = null; S.trail = []; S.restart = 0;
    },
    height(S, x, y) {
      let v = 0;
      for (const p of S.peaks) { const dx = x - p.cx, dy = y - p.cy; v += p.h * Math.exp(-(dx * dx + dy * dy) / (2 * p.s * p.s)); }
      return v;
    },
    step(S, dt, t) {
      S.peaks.forEach((p, i) => { p.cx = p.x + Math.sin(t * 0.00009 + i * 1.7) * 0.06; p.cy = p.y + Math.cos(t * 0.00011 + i) * 0.05; });
      if (!S.agent || S.restart > 0 && (S.restart -= dt) <= 0) {
        S.agent = { x: 0.08 + Math.random() * 0.3, y: 0.55 + Math.random() * 0.4, vx: 0, vy: 0 }; S.trail = []; S.restart = 0;
      }
      const a = S.agent, e = 0.002;
      const gx = (this.height(S, a.x + e, a.y) - this.height(S, a.x - e, a.y)) / (2 * e);
      const gy = (this.height(S, a.x, a.y + e) - this.height(S, a.x, a.y - e)) / (2 * e);
      a.vx = a.vx * 0.9 + gx * 0.0009 * dt / 16; a.vy = a.vy * 0.9 + gy * 0.0009 * dt / 16;
      a.x += a.vx; a.y += a.vy;
      S.trail.push([a.x, a.y]); if (S.trail.length > 220) S.trail.shift();
      if (Math.hypot(a.vx, a.vy) < 0.00015 && S.trail.length > 60 && !S.restart) S.restart = 2400;
    },
    draw(S, ctx, P) {
      ctx.clearRect(0, 0, S.w, S.h);
      const NX = 54, NY = Math.round(NX * S.h / S.w), vals = new Float32Array((NX + 1) * (NY + 1));
      for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) vals[j * (NX + 1) + i] = this.height(S, i / NX, j / NY);
      const sx = S.w / NX, sy = S.h / NY, L = 11;
      ctx.lineWidth = 1;
      for (let l = 1; l <= L; l++) {
        const lv = l / (L + 1), k = l / L;
        const c = [0, 1, 2].map(q => lerp(P.t1[q], P.t2[q], k) | 0);
        ctx.strokeStyle = css(l % 4 === 0 ? c : P.ink, l % 4 === 0 ? 0.42 : 0.08 + k * 0.06);
        ctx.beginPath();
        for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
          const a = vals[j * (NX + 1) + i], b = vals[j * (NX + 1) + i + 1], d = vals[(j + 1) * (NX + 1) + i], e = vals[(j + 1) * (NX + 1) + i + 1];
          const idx = (a > lv) | ((b > lv) << 1) | ((e > lv) << 2) | ((d > lv) << 3);
          if (idx === 0 || idx === 15) continue;
          const x = i * sx, y = j * sy;
          const T = [x + sx * (lv - a) / (b - a), y], R = [x + sx, y + sy * (lv - b) / (e - b)];
          const B = [x + sx * (lv - d) / (e - d), y + sy], Lf = [x, y + sy * (lv - a) / (d - a)];
          const seg = { 1: [Lf, T], 2: [T, R], 3: [Lf, R], 4: [R, B], 5: [Lf, T, R, B], 6: [T, B], 7: [Lf, B], 8: [B, Lf], 9: [B, T], 10: [T, R, B, Lf], 11: [B, R], 12: [R, Lf], 13: [R, T], 14: [T, Lf] }[idx];
          for (let q = 0; q < seg.length; q += 2) { ctx.moveTo(seg[q][0], seg[q][1]); ctx.lineTo(seg[q + 1][0], seg[q + 1][1]); }
        }
        ctx.stroke();
      }
      // optimiser trail
      if (S.trail.length > 1) {
        ctx.lineWidth = 2; ctx.lineCap = "round";
        for (let i = 1; i < S.trail.length; i++) {
          const k = i / S.trail.length;
          ctx.strokeStyle = css(P.t1, k * 0.9);
          ctx.beginPath(); ctx.moveTo(S.trail[i - 1][0] * S.w, S.trail[i - 1][1] * S.h); ctx.lineTo(S.trail[i][0] * S.w, S.trail[i][1] * S.h); ctx.stroke();
        }
        const h = S.trail[S.trail.length - 1];
        glow(ctx, P.t1, h[0] * S.w, h[1] * S.h, 18, 0.9);
        ctx.fillStyle = css(P.ink, 1); ctx.beginPath(); ctx.arc(h[0] * S.w, h[1] * S.h, 4, 0, TAU); ctx.fill();
      }
    },
  };

  MODES.bump = {
    init(S) {
      S.K = 9; S.cols = []; S.off = 0;
      let ranks = Array.from({ length: S.K }, (_, i) => i);
      for (let i = 0; i < 12; i++) { S.cols.push(ranks.slice()); ranks = this.shuffle(ranks); }
      S.next = ranks;
    },
    shuffle(r) {
      const out = r.slice();
      for (let n = 0; n < 2; n++) { const i = (Math.random() * (out.length - 1)) | 0; const p = out.indexOf(i), q = out.indexOf(i + 1); [out[p], out[q]] = [out[q], out[p]]; }
      return out;
    },
    step(S, dt) {
      S.off += dt * 0.00018;
      if (S.off >= 1) { S.off -= 1; S.cols.shift(); S.cols.push(S.next); S.next = this.shuffle(S.next); }
    },
    draw(S, ctx, P) {
      ctx.clearRect(0, 0, S.w, S.h);
      const colW = S.w / 8, top = S.h * 0.16, rowH = (S.h * 0.7) / (S.K - 1);
      const xOf = i => (i - S.off) * colW - colW * 0.5;
      // grid columns
      ctx.lineWidth = 1;
      for (let i = 0; i < S.cols.length; i++) { const x = xOf(i); ctx.strokeStyle = css(P.ink, 0.05); ctx.beginPath(); ctx.moveTo(x, top - 20); ctx.lineTo(x, top + rowH * (S.K - 1) + 20); ctx.stroke(); }
      for (let line = 0; line < S.K; line++) {
        const hi = line === 0 ? P.t1 : line === 1 ? P.t2 : line === 2 ? P.v : null;
        ctx.strokeStyle = hi ? css(hi, 0.85) : css(P.ink, 0.12);
        ctx.lineWidth = hi ? 2.2 : 1.2;
        ctx.beginPath();
        for (let i = 0; i < S.cols.length; i++) {
          const x = xOf(i), y = top + S.cols[i].indexOf(line) * rowH;
          if (i === 0) ctx.moveTo(x, y);
          else { const px = xOf(i - 1), py = top + S.cols[i - 1].indexOf(line) * rowH, mx = (px + x) / 2; ctx.bezierCurveTo(mx, py, mx, y, x, y); }
        }
        ctx.stroke();
        if (hi) {
          for (let i = 0; i < S.cols.length; i++) {
            const x = xOf(i), y = top + S.cols[i].indexOf(line) * rowH;
            ctx.fillStyle = css(hi, 1); ctx.beginPath(); ctx.arc(x, y, 3.2, 0, TAU); ctx.fill();
          }
        }
      }
    },
  };

  /* ---- globe (Teams): the Earth turned to East Asia, the host and its three partners marked in
   * their colours and linked, collaborators dotted around the world. The city band is placed above
   * the header diorama's flags, so the round table stands in front of the planet.
   * Land: Natural Earth 1:110m land (public domain) via world-atlas 2.0.2, one bit per 1.5° cell,
   * north to south and west to east (scripts/build-land-mask.mjs). */
  const LAND = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD/wAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//8////44AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPx/n////+AAAA/AAYAAAAfAAAAAAAAAAAAAAAAEO3v4f////+AAAPgAAAAAAAAcAAAAAAAAAAAAAADAAAfgP////+AAAHAAAAAAAAAMAAAAAAAAAAAAAAA9jjCAAP///+AAAAAAAAHgAAP/8AAPAAAAAAAAAAcAAAAAAD///8AAAAAAAAYAAD//gAAAAAAAAAAAAAe6zs/AAB///4AAAAAAABgDA/////wGAAAAwAEAAAI/wM//AAf//4AAAAAAABwHf/////z/+AABAB//wPI/+sEP4A///wAAAAf8AACHf////////8B8wH/////ww3mB4Af/8AAAAD//xjf7v///////////7A////////+B/g//gAAAAH//4///f///////////GH////////0P5Af4AH4AAPx+H///////////////AAf///////Ng+AP4ADAAA/n////////////////+AD///////8COMAHwAAAAD/P///////////////v8AD/7/////4APwABgAAAAH/P//////////////wfAAA+AH////4APzAAAAAAAD/D/////////////JhgAAAFAAf///8AH/gAAAAAIAOD////////////4AHAAAAQAAP////wH/gAAAAAMBuP////////////wAPgAACAAAH////+f/8AAAAAWAhf////////////AAPAAAAAAAT////+f/+AAAAA3H//////////////+AOAAAAAAAB/////f/8AAAAAHn//////////////+AIAAAAAAAB//////8wAAAAAMf//////////////9AAAAAAAAAA//////2HAAAAAF///////////////4AAAAAAAAAAf/////+AgAAAAD///////////////4AAAAAAAAAAf//////wAAAAAB///yfx/////////wAAAAAAAAAAf/////yAAAAAAB/z/gPj/////////jAAAAAAAAAAf/////gAAAAAA/wY/gDx////////8HAAAAAAAAAAf/////AAAAAAA/gGfnn4////////wAAAAAAAAAAAf////+AAAAAAA/ACY//4///////1gGAAAAAAAAAAP////8AAAAAAA/ACM//4///////hwEAAAAAAAAAAH////4AAAAAAAOLgA//////////4wcAAAAAAAAAAH////4AAAAAAAN/gDC/////////wz8AAAAAAAAAAB////wAAAAAAAf/gAA/////////wDgAAAAAAAAAAA////AAAAAAAA//8YB/////////4EAAAAAAAAAAAAX///AAAAAAAA///f//////////4AAAAAAAAAAAAAX/5BAAAAAAAB//////z///////4AAAAAAAAAAAAAb/gBAAAAAAAH////8/5///////4AAAAAAAAAAAAAF/gBoAAAAAAP////+/4f//////wAAAAAAAAAAAAAE/gAAAAAAAAP////+f8wH/////gAAAAAAAAAAAAAAfgAAAAAAAAf/////P/4D/////IAAAAAAAAAAAAAAPgAQAAAAAAf/////v/8D/+f/4AAAAAAAAAAAAAAAPgwOAAAAAAf/////n/4Af8P+AAAAAAAAAAAAAAAAHxwAwAAAAAf/////n/wAfwH+wAAAAAAAAAAAAAAAB/gAAAAAAAf/////z/gAfgH+AMAAAAAAAAAAAAAAAT8AAAAAAAf/////z+AAfAF/AIAAAAAAAAAAAAAAAB+AAAAAAAf/////94AAOAB/gIAAAAAAAAAAAAAAAAMAAAAAAAf//////AAAOAA/gCAAAAAAAAAAAAAAAAEBQAAAAAP/////+MAAGAAHAFAAAAAAAAAAAAAAAACDfgAAAAH//////8AAGAACAAAAAAAAAAAAAAAAAABP/wAAAAH//////4AABABgADAAAAAAAAAAAAAAAAAP/4AAAAD//////4AABAAQABAAAAAAAAAAAAAAAAAP//gAAAA/H////wAAAACYBgAAAAAAAAAAAAAAAAAH//wAAAAAA////wAAAADYDAAAAAAAAAAAAAAAAAAP//wAAAAAA////gAAAABoPgAAAAAAAAAAAAAAAAAf//4AAAAAA///+AAAAAA4fuQAAAAAAAAAAAAAAAA///+AAAAAA///8AAAAAAYfASAAAAAAAAAAAAAAAA////AAAAAA///4AAAAAAcfYBYAAAAAAAAAAAAAAA////8AAAAAf//4AAAAAAOCEh/AAAAAAAAAAAAAAA/////AAAAAP//wAAAAAAGAAAPgAAAAAAAAAAAAAA/////gAAAAP//wAAAAAADIABPwIAAAAAAAAAAAAAf////gAAAAH//wAAAAAAAOAAPYCAAAAAAAAAAAAAP////AAAAAH//4AAAAAAAACAAMAAAAAAAAAAAAAAP///+AAAAAH//4AAAAAAAAAAAAAAAAAAAAAAAAAAH///+AAAAAH//4AAAAAAAAAHhAAAAAAAAAAAAAAAH///8AAAAAP//4IAAAAAAAAvjAAAAAAAAAAAAAAAD///8AAAAAP//4cAAAAAAAB/jgAAAAAAAAAAAAAAA///8AAAAAP//h4AAAAAAAD/7gAAAAAAAAAAAAAAAf//8AAAAAP//B4AAAAAAAH//wAAAAAAAAAAAAAAAf//4AAAAAH/+AwAAAAAAAf//4AQAAAAAAAAAAAAAf//4AAAAAH//BwAAAAAAB///8AIAAAAAAAAAAAAAf//gAAAAAD//BwAAAAAAD///+AAAAAAAAAAAAAAAf/8AAAAAAD/+BgAAAAAAD////AAAAAAAAAAAAAAAf/8AAAAAAD/8AAAAAAAAD////AAAAAAAAAAAAAAAf/8AAAAAAD/8AAAAAAAAD////AAAAAAAAAAAAAAA//4AAAAAAB/4AAAAAAAAB////AAAAAAAAAAAAAAA//wAAAAAAA/wAAAAAAAAB////AAAAAAAAAAAAAAA//gAAAAAAA/gAAAAAAAAB/h//AAAAAAAAAAAAAAA//AAAAAAAA+AAAAAAAAAB+Av+AAAAAAAAAAAAAAA/8AAAAAAAAAAAAAAAAAAAAAP8AAQAAAAAAAAAAAB/8AAAAAAAAAAAAAAAAAAAAAH8AAIAAAAAAAAAAAB/4AAAAAAAAAAAAAAAAAAAAADQAAOAAAAAAAAAAAB/gAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAB+AAAAAAAAAAAAAAAAAAAAAAAYAAIAAAAAAAAAAAB+AAAAAAAAAAAAAAAAAAAAAAAYAAwAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAADAAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAAAAHAAAAAAAAAAAAD8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADwYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB4AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGAAAAAAAAAAAADwAACAefH/gAAAAAAAAAAAAAAAAEAAAAAAAAAAAB//8B///////4AAAAAAAAAAAAAAA/AAAAAAAAAAH///8P////////8AAAAAAAAAAAAAB3gAAAAATf//////8//////////+AAAAAAAAAAAgAHgAAAAH////////////////////AAAAAAAB4B////gAAAAP///////////////////4AAAAD////////4AAAAD////////////////////gAAALP///////8AAAAD/////////////////////gAABj////////wAAHg//////////////////////4AAAAD///////8AQ/AB////////////////////+AAAAB//////////AGP//////////////////////AAAAA///////////////////////////////////8A/8AAf///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////";
  const DEG = Math.PI / 180;
  const unit = (lat, lon) => [Math.cos(lat * DEG) * Math.sin(lon * DEG), Math.sin(lat * DEG), Math.cos(lat * DEG) * Math.cos(lon * DEG)];
  const VIEW = { lon: 112, lat: -30 };   // looking up at Asia from the south, so the four cities sit near the top

  MODES.globe = {
    init(S) {
      const bits = atob(LAND), ROWS = 120, COLS = 240, STEP = 1.5, hub = unit(24, 112), near = Math.cos(27 * DEG), pts = [];
      const isLand = (r, c) => { if (r < 0 || r >= ROWS) return true; c = (c + COLS) % COLS; const i = r * COLS + c; return (bits.charCodeAt(i >> 3) >> (7 - (i & 7))) & 1; };
      for (let r = 0; r < ROWS; r++) {
        const lat = 90 - STEP / 2 - r * STEP, every = Math.max(1, Math.round(1 / Math.max(Math.cos(lat * DEG), 0.1)));   // even density towards the poles
        for (let c = 0; c < COLS; c += every) {
          const i = r * COLS + c;
          if (!isLand(r, c)) continue;
          const u = unit(lat, -180 + STEP / 2 + c * STEP), coast = !isLand(r - 1, c) || !isLand(r + 1, c) || !isLand(r, c - every) || !isLand(r, c + every);
          pts.push(u[0], u[1], u[2], (u[0] * hub[0] + u[1] * hub[1] + u[2] * hub[2] > near ? 6 : 0) + (coast ? 3 : 0));
        }
      }
      S.land = Float32Array.from(pts); S.buf = new Float32Array(pts.length); S.bin = new Uint8Array(pts.length / 4);
      S.cities = [
        { id: "TSINGHUA · BEIJING", lat: 40.0, lon: 116.33, c: "r" }, { id: "SUFE · SHANGHAI", lat: 31.3, lon: 121.5, c: "t2" },
        { id: "HKU · HONG KONG", lat: 22.28, lon: 114.14, c: "v" }, { id: "NTU · SINGAPORE", lat: 1.35, lon: 103.68, c: "t1" },
      ].map((c, i) => ({ ...c, u: unit(c.lat, c.lon), ph: i * 0.27 }));
      const R = prng(9), n = S.land.length / 4;
      S.peers = Array.from({ length: 28 }, () => { const j = ((R() * n) | 0) * 4; return { u: [S.land[j], S.land[j + 1], S.land[j + 2]], a: (R() * 4) | 0 }; });
      S.pulses = []; S.timer = 0; S.t = 0; S.fade = reduce ? 1 : 0; S.born = performance.now();
    },
    step(S, dt) {
      S.t += dt; S.timer += dt;
      if (S.lay && S.lay.toy !== null) S.fade = Math.min(1, S.fade + dt / 1100);
      if (S.timer > 560) {
        S.timer = 0;
        const C = S.cities;
        if (Math.random() < 0.6) { const a = (Math.random() * 4) | 0; let b = (Math.random() * 3) | 0; if (b >= a) b++; S.pulses.push({ from: C[a].u, to: C[b].u, c: C[b].c, k: 0 }); }
        else { const p = S.peers[(Math.random() * S.peers.length) | 0]; S.pulses.push({ from: p.u, to: C[p.a].u, c: null, k: 0 }); }
      }
      for (let i = S.pulses.length - 1; i >= 0; i--) { S.pulses[i].k += dt / 1700; if (S.pulses[i].k >= 1) S.pulses.splice(i, 1); }
    },
    // where the globe goes: centred on the diorama, its top just under the hero's top edge and the
    // southernmost city (Singapore) just above the flags. Measured from layout boxes (offsets), which the
    // hero's entrance and scroll transforms leave alone, so it is worked out once per size.
    layout(S, ctx) {
      const toy = document.querySelector(".page-hero .toy-hero"), L = S.lay, now = performance.now();
      if (L && L.w === S.w && L.h === S.h && L.toy === !!toy && (L.toy !== null || now - S.born < 1800)) return L;
      if (!toy && now - S.born < 1800 && !reduce) return (S.lay = { w: S.w, h: S.h, toy: null });   // the diorama is still loading
      let cx = S.w * 0.72, flags = S.h * 0.4, maxR = Math.min(S.w * 0.42, S.h * 0.7);
      const hero = toy && toy.offsetParent;
      if (toy && hero) {
        const abs = getComputedStyle(toy).position === "absolute";   // desktop: centred with translate: 0 -50%
        const left = toy.offsetLeft + (S.w - hero.clientWidth) / 2, top = toy.offsetTop - (abs ? toy.offsetHeight / 2 : 0);
        cx = left + toy.offsetWidth / 2;
        flags = top + toy.offsetHeight * 0.235;                        // the flags' tops
        maxR = Math.min(toy.offsetWidth * 0.62, S.w * 0.56);
      }
      const v = this.view(VIEW.lon, VIEW.lat, 0, 0, 1), ys = S.cities.map(c => -v(c.u)[1]);
      const fTop = Math.max(...ys), fBot = Math.min(...ys), limb = 12, bottom = flags - 18;
      const R = clamp((bottom - limb) / (1 - fBot), 140, Math.max(140, maxR));   // limb to Singapore spans (1 - fBot) R
      const top = limb + (1 - fTop) * R;                       // Beijing, the northernmost city
      if (L && L.toy === false && toy) S.fade = 0;            // the diorama arrived after the fallback: fade in again in place
      return (S.lay = { w: S.w, h: S.h, toy: !!(toy && hero), R, gx: cx, gy: top + fTop * R });
    },
    // orthographic view: turn the Earth so (lon, lat) faces the viewer; returns screen x, y, depth, distance² from the centre
    view(lon, lat, gx, gy, R) {
      const sl = Math.sin(lon * DEG), cl = Math.cos(lon * DEG), sp = Math.sin(lat * DEG), cp = Math.cos(lat * DEG);
      return p => { const x1 = p[0] * cl - p[2] * sl, z1 = p[0] * sl + p[2] * cl, y2 = p[1] * cp - z1 * sp, z2 = p[1] * sp + z1 * cp; return [gx + R * x1, gy - R * y2, z2, x1 * x1 + y2 * y2]; };
    },
    // a great circle from a to b, lifted towards its middle
    arc(a, b, k) {
      const w = Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1));
      if (w < 1e-4) return a;
      const s = Math.sin(w), ka = Math.sin((1 - k) * w) / s, kb = Math.sin(k * w) / s, lift = 1 + (0.04 + w * 0.2) * Math.sin(Math.PI * k);
      return [(a[0] * ka + b[0] * kb) * lift, (a[1] * ka + b[1] * kb) * lift, (a[2] * ka + b[2] * kb) * lift];
    },
    path(ctx, v, a, b, steps = 28) {
      let on = false;
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) { const q = v(this.arc(a, b, i / steps)); if (q[2] > 0 || q[3] > 1) { on ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); on = true; } else on = false; }
      ctx.stroke();
    },
    draw(S, ctx, P) {
      ctx.clearRect(0, 0, S.w, S.h);
      const L = this.layout(S, ctx);
      if (!L.R) { if (!S.retry) S.retry = setTimeout(() => { S.retry = 0; this.draw(S, ctx, P); }, 1900); return; }
      if (reduce && !L.toy && (S.tries = (S.tries || 0) + 1) < 6) setTimeout(() => this.draw(S, ctx, P), 900);   // still picture: redraw once the diorama is in
      const f = S.fade, { R, gx, gy } = L;
      if (f <= 0) return;
      const lon0 = VIEW.lon + 5 * Math.sin(S.t / 7000) + S.pmx * 8, lat0 = VIEW.lat - S.pmy * 4, v = this.view(lon0, lat0, gx, gy, R);

      // the planet: a thin atmosphere, a dark ocean lit from the upper left, a bright limb
      const disc = () => { ctx.beginPath(); ctx.arc(gx, gy, R, 0, TAU); };
      const halo = ctx.createRadialGradient(gx, gy, R, gx, gy, R * 1.12);
      halo.addColorStop(0, css(P.t1, 0.16 * f)); halo.addColorStop(1, css(P.t1, 0));
      ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(gx, gy, R * 1.12, 0, TAU); ctx.fill();
      ctx.fillStyle = css(mix(P.bg, P.t1, 0.09), 0.94 * f); disc(); ctx.fill();
      const lit = ctx.createRadialGradient(gx - R * 0.35, gy - R * 0.45, 0, gx - R * 0.35, gy - R * 0.45, R * 1.2);
      lit.addColorStop(0, css(P.ink, 0.07 * f)); lit.addColorStop(1, css(P.ink, 0));
      ctx.fillStyle = lit; disc(); ctx.fill();
      const rim = ctx.createRadialGradient(gx, gy, R * 0.8, gx, gy, R);
      rim.addColorStop(0, css(P.t1, 0)); rim.addColorStop(1, css(P.t1, 0.18 * f));
      ctx.fillStyle = rim; disc(); ctx.fill();
      ctx.strokeStyle = css(P.t1, 0.4 * f); ctx.lineWidth = 1.2; disc(); ctx.stroke();

      // graticule every 30°
      ctx.strokeStyle = css(P.ink, 0.06 * f); ctx.lineWidth = 1;
      for (let m = -180; m < 180; m += 30) { ctx.beginPath(); let on = false; for (let la = -84; la <= 84; la += 4) { const q = v(unit(la, m)); if (q[2] > 0) { on ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); on = true; } else on = false; } ctx.stroke(); }
      for (let la = -60; la <= 60; la += 30) { ctx.beginPath(); let on = false; for (let m = -180; m <= 180; m += 4) { const q = v(unit(la, m)); if (q[2] > 0) { on ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); on = true; } else on = false; } ctx.stroke(); }

      // land: one pass to project, then a shade per region (world or East Asia), coast or inland, and depth
      const D = S.land, B = S.buf, N = S.bin, sl = Math.sin(lon0 * DEG), cl = Math.cos(lon0 * DEG), sp = Math.sin(lat0 * DEG), cp = Math.cos(lat0 * DEG);
      const dot = clamp(R * 1.5 * DEG * 0.44, 1.5, 4.2);
      let n = 0;
      for (let i = 0; i < D.length; i += 4) {
        const x1 = D[i] * cl - D[i + 2] * sl, z1 = D[i] * sl + D[i + 2] * cl, z2 = D[i + 1] * sp + z1 * cp;
        if (z2 <= 0.02) continue;
        // each dot foreshortened along the radius, as a mark on a sphere would be
        const y2 = D[i + 1] * cp - z1 * sp, k = 1 - z2 * z2, zz = z2 * z2;
        B[n * 4] = gx + R * x1; B[n * 4 + 1] = gy - R * y2;
        B[n * 4 + 2] = k < 1e-4 ? dot : Math.max(0.7, dot * Math.sqrt((zz * x1 * x1 + y2 * y2) / k));
        B[n * 4 + 3] = k < 1e-4 ? dot : Math.max(0.7, dot * Math.sqrt((zz * y2 * y2 + x1 * x1) / k));
        N[n++] = D[i + 3] + (z2 > 0.66 ? 2 : z2 > 0.33 ? 1 : 0);
      }
      for (let s = 0; s < 12; s++) {
        const asia = s > 5, coast = s % 6 > 2, depth = s % 3, a = (coast ? 0.3 : 0.2) + depth * 0.13;
        ctx.fillStyle = asia ? css(coast ? mix(P.t1, P.ink, 0.5) : mix(P.t1, P.bg, 0.12), Math.min(1, a + 0.22) * f) : css(mix(P.ink, P.t1, 0.25), a * 0.8 * f);
        ctx.beginPath();
        for (let j = 0; j < n; j++) if (N[j] === s) ctx.rect(B[j * 4] - B[j * 4 + 2] / 2, B[j * 4 + 1] - B[j * 4 + 3] / 2, B[j * 4 + 2], B[j * 4 + 3]);
        ctx.fill();
      }

      // collaborators around the world, and their links to the partner nearest them in the drawing
      for (const p of S.peers) {
        const q = v(p.u); if (q[2] <= 0.05) continue;
        if (v(S.cities[p.a].u)[2] > 0) { ctx.strokeStyle = css(P.ink, 0.07 * f); this.path(ctx, v, p.u, S.cities[p.a].u, 20); }
        ctx.fillStyle = css(P.ink, 0.42 * f); ctx.beginPath(); ctx.arc(q[0], q[1], 1.8, 0, TAU); ctx.fill();
      }
      // the four institutions, all linked
      ctx.lineWidth = 1.1;
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { ctx.strokeStyle = css(P.ink, 0.28 * f); this.path(ctx, v, S.cities[i].u, S.cities[j].u); }
      for (const pl of S.pulses) {
        const q = v(this.arc(pl.from, pl.to, pl.k)); if (q[2] <= 0 && q[3] <= 1) continue;
        const col = pl.c ? P[pl.c] : P.ink;
        if (pl.c) glow(ctx, col, q[0], q[1], 12, 0.7 * f);
        ctx.fillStyle = css(col, (pl.c ? 1 : 0.75) * f); ctx.beginPath(); ctx.arc(q[0], q[1], pl.c ? 2.6 : 1.8, 0, TAU); ctx.fill();
      }
      ctx.font = (R < 260 ? 10 : 11) + "px 'Space Mono', monospace";
      S.cities.forEach((c, i) => {
        const q = v(c.u); if (q[2] <= 0) return;
        const col = P[c.c], ph = (S.t / 2600 + c.ph) % 1, w = ctx.measureText(c.id).width;
        const right = (R >= 260 || i % 2 === 1) && q[0] + 14 + w < S.w - 8, x = right ? q[0] + 13 : q[0] - 13 - w;
        glow(ctx, col, q[0], q[1], 30, 0.55 * f);
        ctx.strokeStyle = css(col, (1 - ph) * 0.75 * f); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(q[0], q[1], 5 + ph * 15, 0, TAU); ctx.stroke();
        ctx.fillStyle = css(col, f); ctx.beginPath(); ctx.arc(q[0], q[1], 4.2, 0, TAU); ctx.fill();
        ctx.fillStyle = css(P.bg, 0.62 * f); ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x - 5, q[1] - 8, w + 10, 16, 4) : ctx.rect(x - 5, q[1] - 8, w + 10, 16); ctx.fill();
        ctx.fillStyle = css(P.ink, 0.88 * f); ctx.fillText(c.id, x, q[1] + 4);
      });
    },
  };

  const BUDGETS = { field: { dpr: 1, fps: 36 }, contour: { fps: 30 }, globe: { fps: 30 }, orbit: { fps: 45 }, dev100: { fps: 40 }, ledger: { fps: 40 }, bump: { fps: 40 } };

  /* ------------------------------------------------------------ mount */
  function mount(canvas, opts = {}) {
    const mode = MODES[opts.mode];
    if (!mode) throw new Error("Unknown backdrop mode " + opts.mode);
    const ctx = canvas.getContext("2d");
    const host = opts.host || canvas.parentElement;
    const S = { w: 0, h: 0, mx: -1e4, my: -1e4, pmx: 0, pmy: 0, tmx: 0, tmy: 0, scrollDy: 0, velocity: opts.velocity || (() => 0) };
    let P = palette(), raf = 0, running = false, last = 0, lastY = scrollY, drawn = 0, paused = false;
    // Background art does not need retina pixels or 60 fps; the budgets keep it off the critical path.
    const budget = { dpr: 1.25, fps: 40, ...(BUDGETS[opts.mode] || {}), ...(opts.budget || {}) };

    function resize() {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, budget.dpr);
      S.w = r.width; S.h = r.height;
      canvas.width = Math.round(S.w * dpr); canvas.height = Math.round(S.h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const f = opts.focus || [0.5, 0.5]; S.cx = S.w * f[0]; S.cy = S.h * f[1];
      if (!S.ready) { mode.init(S); S.ready = true; }
      if (!running) frame(performance.now(), true);
    }
    function frame(t, once) {
      if (!once && running && t - drawn < 1000 / budget.fps - 1.5) { raf = requestAnimationFrame(frame); return; }
      drawn = t;
      const dt = Math.min(64, t - (last || t)); last = t;
      S.pmx = lerp(S.pmx, S.tmx, 0.05); S.pmy = lerp(S.pmy, S.tmy, 0.05);
      S.scrollDy = lerp(S.scrollDy, scrollY - lastY, 0.2); lastY = scrollY;
      mode.step(S, dt || 16, t); mode.draw(S, ctx, P);
      if (!once && running) raf = requestAnimationFrame(frame);
    }
    function setRunning(on) {
      const next = on && !reduce && !document.hidden && !paused;
      if (next === running) return;
      running = next;
      if (running) { last = 0; raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf);
    }

    new ResizeObserver(resize).observe(canvas);
    resize();
    if (reduce) { for (let i = 0; i < 240; i++) mode.step(S, 33, i * 33); mode.draw(S, ctx, P); }

    host.addEventListener("pointermove", e => {
      const r = canvas.getBoundingClientRect();
      S.mx = e.clientX - r.left; S.my = e.clientY - r.top;
      S.tmx = S.mx / S.w - 0.5; S.tmy = S.my / S.h - 0.5;
    }, { passive: true });
    host.addEventListener("pointerleave", () => { S.mx = S.my = -1e4; S.tmx = S.tmy = 0; });
    new MutationObserver(() => { P = palette(); if (mode.trails) ctx.clearRect(0, 0, S.w, S.h); if (!running) frame(performance.now(), true); })
      .observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; setRunning(visible); }).observe(canvas);
    document.addEventListener("visibilitychange", () => setRunning(visible));
    setRunning(true);

    // pause(true): something opaque covers the window (a pinned 3D scene), so stop drawing until it leaves
    return { setTone(i) { S.tone = i; }, pause(on) { paused = !!on; setRunning(visible); }, state: S };
  }

  window.Backdrop = { mount, modes: Object.keys(MODES) };
})();

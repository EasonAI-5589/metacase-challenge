// A general-flash test after WCAG 2.3.1, on a 64×36 grid. See verify.mjs for what the two figures mean.
// A strobe needs both conditions at once: the same cells cycling over 3 flashes a second, and turning together over the area limit.
// Calibrated by calibrate-flash.mjs. An approximation, not a certified PSE test.
import { execFileSync } from 'node:child_process';

export const JOIN_FRAMES = [2, 3, 6];

export function flashAnalysis(rgb, { fps: FPS = 60, join: JOIN = 3 } = {}) {
  const SW = 64, SH = 36, CELL = 30, SN = Math.floor(rgb.length / (SW * SH * 3));
  const LUT = Float64Array.from({ length: 256 }, (_, i) => { const c = i / 255; return c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
  const RW = Math.round(640 / CELL), RH = Math.round(480 / CELL), LIMIT = Math.floor(RW * RH * .25);
  const events = [new Map(), new Map()]; // direction → frame → cells starting a transition there
  const quickBySecond = new Map(); let worst = 0, worstAt = null;
  for (let c = 0; c < SW * SH; c++) {
    const marks = [];
    let low = null, high = null, dir = 0;
    for (let f = 0; f < SN; f++) {
      const o = (f * SW * SH + c) * 3, L = .2126 * LUT[rgb[o]] + .7152 * LUT[rgb[o + 1]] + .0722 * LUT[rgb[o + 2]];
      if (low === null) { low = high = L; continue; }
      if (dir >= 0 && L > high) high = L;
      if (dir <= 0 && L < low) low = L;
      if (dir >= 0 && high - L >= .1 && L < .8) { marks.push([f, 0]); dir = -1; low = L; }
      else if (dir <= 0 && L - low >= .1 && low < .8) { marks.push([f, 1]); dir = 1; high = L; }
    }
    // A strobe is the same place going back and forth, so only transitions in a cycle of over 3 flashes a second count.
    const hot = new Uint8Array(marks.length);
    let from = 0;
    for (let i = 0; i < marks.length; i++) {
      while (marks[i][0] - marks[from][0] >= FPS) from++; // a window strictly under one second
      const n = i - from + 1;
      if (n > worst) { worst = n; worstAt = { second: +(marks[i][0] / FPS).toFixed(2), x: (c % SW) * CELL, y: Math.floor(c / SW) * CELL }; }
      if (n > 6) {
        hot.fill(1, from, i + 1);
        const s = Math.floor(marks[i][0] / FPS);
        (quickBySecond.get(s) || quickBySecond.set(s, new Set()).get(s)).add(c);
      }
    }
    marks.forEach(([f, d], i) => { if (hot[i]) (events[d].get(f) || events[d].set(f, []).get(f)).push(c); });
  }
  const densest = cells => {
    const sat = new Int32Array((SW + 1) * (SH + 1)), grid = new Uint8Array(SW * SH);
    for (const c of cells) grid[c] = 1;
    for (let y = 1; y <= SH; y++) for (let x = 1; x <= SW; x++) sat[y * (SW + 1) + x] = grid[(y - 1) * SW + x - 1] + sat[(y - 1) * (SW + 1) + x] + sat[y * (SW + 1) + x - 1] - sat[(y - 1) * (SW + 1) + x - 1];
    let best = 0;
    for (let y = 0; y <= SH - RH; y++) for (let x = 0; x <= SW - RW; x++) best = Math.max(best, sat[(y + RH) * (SW + 1) + x + RW] - sat[y * (SW + 1) + x + RW] - sat[(y + RH) * (SW + 1) + x] + sat[y * (SW + 1) + x]);
    return best;
  };
  // Concurrent transitions: a direction's cells within JOIN frames, densest rectangle over the limit counts as one transition.
  const big = [];
  for (const map of events) {
    let lastEnd = -Infinity;
    for (let f = 0; f < SN; f++) {
      const cells = new Set();
      for (let g = f; g < f + JOIN; g++) for (const c of map.get(g) || []) cells.add(c);
      if (cells.size > LIMIT && densest(cells) > LIMIT && f >= lastEnd) { big.push(f); lastEnd = f + JOIN; }
    }
  }
  big.sort((p, q) => p - q);
  const strobe = new Set(); let from = 0;
  for (let i = 0; i < big.length; i++) {
    while (big[i] - big[from] >= FPS) from++;
    if (i - from + 1 > 6) strobe.add(Math.floor(big[i] / FPS));
  }
  const pattern = [...quickBySecond].map(([second, cells]) => ({ second, cellsCycling: cells.size, densestInRect: densest(cells) })).filter(w => w.densestInRect > LIMIT).sort((p, q) => p.second - q.second);
  return {
    true_strobe_flash: strobe.size, strobe_seconds: [...strobe].sort((p, q) => p - q), concurrent_full_area_transitions: big.length,
    fast_pattern_motion_seconds: pattern.length, fast_pattern_motion: pattern, area_limit_cells: LIMIT, max_luminance_transitions_per_second_any_cell: worst, worst_cell: worstAt,
  };
}
export const readRgb = file => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', file, '-vf', 'scale=64:36:flags=area,format=rgb24', '-an', '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });

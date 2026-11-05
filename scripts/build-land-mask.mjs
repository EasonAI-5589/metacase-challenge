// Builds the land mask the Teams backdrop globe draws (LAND in backdrop.js): Natural Earth 1:110m
// land (public domain), as packaged by world-atlas 2.0.2, sampled at the centre of every cell of a
// 1.5° grid. Rows run from 90°N to 90°S, columns from 180°W eastwards; one bit per cell, most
// significant bit first, base64-encoded. Not part of the site build.
//
//   npm i --no-save --prefix <dir> world-atlas@2.0.2 topojson-client@3.1.0 d3-geo@3.1.1
//   node scripts/build-land-mask.mjs <dir>
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const dir = resolve(process.argv[2] || '.');
const mod = path => import(pathToFileURL(resolve(dir, 'node_modules', path)).href);
const { feature } = await mod('topojson-client/src/index.js');
const { geoContains } = await mod('d3-geo/src/index.js');
const topo = JSON.parse(await readFile(resolve(dir, 'node_modules/world-atlas/land-110m.json'), 'utf8'));
const land = feature(topo, topo.objects.land);

const STEP = 1.5, ROWS = 180 / STEP, COLS = 360 / STEP;
const bytes = new Uint8Array(ROWS * COLS / 8);
let count = 0;
for (let r = 0; r < ROWS; r++) {
  const lat = 90 - STEP / 2 - r * STEP;
  for (let c = 0; c < COLS; c++) {
    const lon = -180 + STEP / 2 + c * STEP, i = r * COLS + c;
    if (geoContains(land, [lon, lat])) { bytes[i >> 3] |= 0x80 >> (i & 7); count++; }
  }
}
console.error(`${ROWS} x ${COLS} cells, ${count} land`);
console.log(Buffer.from(bytes).toString('base64'));

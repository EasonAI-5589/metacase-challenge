/* mc-classart.js — a toy picture for each class of case in the field books: the same soft
 * blocks as the 3D kit (rounded corners, a light band on top, a ground shadow), drawn flat.
 * Fills come from classes the stylesheet colours with the field's own colour (--tc). */
const ground = '<ellipse class="sh" cx="80" cy="108" rx="52" ry="7"/>';
const blob = '<circle class="bg" cx="80" cy="60" r="50"/>';
// a block: body, a lighter top band, and an optional inner face
const blk = (x, y, w, h, cls = 'a', r = 8) => `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/><rect class="hl" x="${x + 3}" y="${y + 3}" width="${w - 6}" height="${Math.min(8, h / 3)}" rx="${Math.min(4, r)}"/>`;
const coin = (x, y) => `<ellipse class="y" cx="${x}" cy="${y + 6}" rx="16" ry="6"/><rect class="y" x="${x - 16}" y="${y - 2}" width="32" height="8"/><ellipse class="yl" cx="${x}" cy="${y - 2}" rx="16" ry="6"/>`;
const person = (x, y, cls) => `<circle class="${cls}" cx="${x}" cy="${y}" r="9"/><path class="${cls}" d="M${x - 15} ${y + 30}a15 15 0 0 1 30 0z"/>`;

const ART = {
  // economics
  replication: blk(34, 24, 92, 70, 'w', 10) + '<path class="k ln" d="M46 82 116 38"/>' + [[52, 74], [62, 72], [70, 62], [82, 58], [90, 50], [102, 46], [112, 36]].map(([x, y]) => `<circle class="a" cx="${x}" cy="${y}" r="5"/>`).join('') + '<rect class="r" x="98" y="70" width="22" height="16" rx="5"/><text x="109" y="82" class="tx">β</text>',
  markets: [[44, 50, 30], [62, 36, 46], [80, 56, 26], [98, 30, 50], [116, 42, 34]].map(([x, y, h], k) => `<rect class="k" x="${x - 1.5}" y="${y - 8}" width="3" height="${h + 16}" rx="1.5"/>${blk(x - 8, y, 16, h, k === 2 ? 'r' : 'a', 4)}`).join(''),
  data: [2, 1, 0].map(k => `<rect class="a" x="48" y="${30 + k * 22}" width="64" height="22"/><ellipse class="a" cx="80" cy="${52 + k * 22}" rx="32" ry="9"/>`).join('') + [1, 2].map(k => `<path class="b ln sl" d="M48 ${30 + k * 22}a32 9 0 0 0 64 0"/>`).join('') + '<ellipse class="b" cx="80" cy="30" rx="32" ry="9"/><ellipse class="hl" cx="74" cy="28" rx="18" ry="4"/>' + [0, 1, 2].map(k => `<circle class="w" cx="100" cy="${46 + k * 22}" r="3"/>`).join(''),
  publicfinance: '<path class="w" d="M38 46 80 22 122 46z"/>' + blk(40, 46, 80, 8, 'w', 3) + [50, 68, 86, 104].map(x => blk(x, 56, 10, 34, 'a', 4)).join('') + blk(36, 90, 88, 10, 'w', 4) + '<circle class="y" cx="80" cy="36" r="5"/>',
  monetary: coin(66, 82) + coin(66, 70) + coin(66, 58) + coin(98, 84) + coin(98, 72) + '<circle class="a" cx="104" cy="40" r="16"/><text x="104" y="46" class="tx w-tx">%</text>',
  statistics: blk(34, 26, 92, 68, 'w', 10) + [[46, 62, 22], [62, 50, 34], [78, 58, 26], [94, 40, 44], [110, 46, 38]].map(([x, y, h], k) => blk(x - 6, y, 12, h, k % 2 ? 'b' : 'a', 3)).join('') + '<path class="r ln" d="M42 56q20-26 40-6t40-22"/>',
  // finance
  accounting: blk(38, 24, 84, 72, 'a', 10) + blk(48, 30, 64, 60, 'w', 6) + [44, 56, 68].map(y => `<rect class="k" x="56" y="${y}" width="30" height="4" rx="2" opacity=".35"/><rect class="b" x="92" y="${y}" width="12" height="4" rx="2"/>`).join('') + '<circle class="g" cx="104" cy="82" r="12"/><path class="w ln" d="M98 82l4 4 8-8"/>',
  numeric: blk(46, 18, 68, 84, 'a', 12) + blk(54, 26, 52, 18, 'k', 5) + '<text x="80" y="40" class="tx w-tx">42</text>' + [0, 1, 2].flatMap(r => [0, 1, 2].map(c => blk(54 + c * 18, 50 + r * 16, 14, 12, r === 2 && c === 2 ? 'r' : 'w', 4))).join(''),
  payments: blk(30, 34, 84, 54, 'a', 10) + '<rect class="k" x="30" y="46" width="84" height="10"/>' + blk(40, 64, 22, 14, 'y', 4) + blk(62, 26, 70, 46, 'b', 10) + '<rect class="w" x="72" y="56" width="30" height="5" rx="2.5"/><circle class="r" cx="116" cy="40" r="6"/><circle class="y" cx="124" cy="40" r="6" opacity=".9"/>',
  filings: blk(52, 18, 62, 78, 'b', 8) + blk(44, 24, 62, 78, 'w', 8) + [38, 48, 58, 68].map((y, k) => `<rect class="k" x="54" y="${y}" width="${k === 3 ? 26 : 42}" height="4" rx="2" opacity=".35"/>`).join('') + '<circle class="a" cx="94" cy="84" r="10"/><path class="w ln" d="M90 84h8M94 80v8"/>',
  credit: '<path class="a" d="M80 18 116 30v26c0 22-16 36-36 44-20-8-36-22-36-44V30z"/><path class="hl" d="M80 24 108 34v6H52v-6z"/><path class="w ln th" d="M64 58l12 12 22-24"/>',
  nlp: blk(28, 26, 70, 44, 'w', 14) + '<path class="w" d="M42 68 38 84 56 70z"/>' + [44, 56].map(y => `<rect class="k" x="40" y="${y}" width="${y === 44 ? 44 : 30}" height="5" rx="2.5" opacity=".35"/>`).join('') + blk(70, 54, 62, 38, 'a', 14) + '<path class="a" d="M118 90 124 104 106 92z"/>' + [64, 74, 84].map(x => `<circle class="w" cx="${x + 22}" cy="73" r="4"/>`).join(''),
  // social science
  law: '<rect class="k" x="78" y="26" width="4" height="64" rx="2"/><rect class="a" x="42" y="30" width="76" height="6" rx="3"/><path class="k ln" d="M50 36 40 62M50 36l10 26M110 36l-10 26M110 36l10 26"/><path class="b" d="M36 62h28a14 9 0 0 1-28 0z"/><path class="b" d="M96 62h28a14 9 0 0 1-28 0z"/>' + blk(60, 88, 40, 10, 'a', 4) + '<circle class="y" cx="80" cy="24" r="6"/>',
  business: blk(36, 40, 88, 56, 'a', 12) + '<path class="k" d="M66 40v-8a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v8h-6v-6H72v6z"/><rect class="k" x="36" y="62" width="88" height="5" opacity=".3"/>' + blk(72, 56, 16, 16, 'y', 4),
  policy: blk(40, 50, 80, 46, 'w', 8) + '<path class="a" d="M34 52 80 24 126 52z"/>' + [52, 72, 92].map(x => blk(x, 62, 16, 22, 'b', 4)).join('') + '<rect class="k" x="100" y="10" width="3" height="22"/><path class="r" d="M103 11h18l-5 6 5 6h-18z"/>',
  society: person(56, 44, 'b') + person(104, 44, 'b') + person(80, 36, 'a'),
  hr: blk(46, 24, 68, 78, 'w', 10) + '<rect class="k" x="72" y="16" width="16" height="12" rx="4"/>' + '<circle class="a" cx="80" cy="50" r="12"/><path class="a" d="M62 80a18 16 0 0 1 36 0z"/>' + '<rect class="b" x="58" y="86" width="44" height="6" rx="3"/>',
  psychology: '<path class="b" d="M54 100V84c-9-7-14-17-14-28 0-21 17-36 40-36s40 15 40 36c0 5-1 9-3 13l7 11h-9v8c0 5-4 9-9 9H86v3z"/>' + '<circle class="y" cx="80" cy="54" r="15"/><path class="yl" d="M72 47a10 10 0 0 1 14 0"/><rect class="w" x="75" y="69" width="10" height="9" rx="3"/>',
};
const FALLBACK = blk(40, 26, 80, 68, 'a', 12) + blk(52, 38, 56, 44, 'w', 6);

export function classArt(id) {
  return `<svg viewBox="0 0 160 120" focusable="false">${ground}${blob}${ART[id] || FALLBACK}</svg>`;
}

// Generates the end-card QR locally, then decodes it back with an independent reader.
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import fs from 'node:fs';
const url = process.env.QR_URL || 'https://easonai-5589.github.io/metacase-challenge/';
const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'Q', margin: 0, color: { dark: '#05070E', light: '#0000' } });
fs.writeFileSync('cards/qr.svg', svg);
const buf = await QRCode.toBuffer(url, { errorCorrectionLevel: 'Q', margin: 4, scale: 8 });
const png = PNG.sync.read(buf);
const read = jsQR(new Uint8ClampedArray(png.data), png.width, png.height);
if (read?.data !== url) throw new Error(`QR decode mismatch: ${read?.data}`);
console.log('QR ok', url, `version ${read.version}`);

// Create a display derivative; the archived NASA original remains unchanged.
// Edge's WebP encoder may produce different bytes across browser versions.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
const source = process.argv[2] || '../sources/missions/muslim-world/2026-10-09/nasa-earth.jpg';
const bytes = await readFile(source);
const browser = await chromium.launch({ channel: 'msedge' });
try {
  const page = await browser.newPage();
  const encoded = await page.evaluate(async url => {
    const photo = new Image(); photo.src = url; await photo.decode();
    const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.drawImage(photo, 0, 0, 2048, 1024);
    return canvas.toDataURL('image/webp', .82).split(',')[1];
  }, 'data:image/jpeg;base64,' + bytes.toString('base64'));
  const output = Buffer.from(encoded, 'base64');
  await writeFile('public/assets/muslim-world/earth.webp', output);
  console.log(JSON.stringify({ width: 2048, height: 1024, bytes: output.length }));
} finally { await browser.close(); }

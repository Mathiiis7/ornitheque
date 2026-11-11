// Loupe sur une zone d'image PNG, avec une grille de repères en pixels de l'image, pour tracer des
// découpes à la main. Usage : node outils/verif/_loupe-image.mjs <image> <x0> <y0> <x1> <y1> <zoom> <sortie.png> [pas]
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const [img, x0, y0, x1, y1, zoom, sortie, pas = '20'] = process.argv.slice(2);
const b64 = readFileSync(img).toString('base64');
const nav = await chromium.launch();
const page = await nav.newPage();
await page.setContent('<body style="margin:0;background:#888"><canvas id="c"></canvas></body>');
await page.evaluate(async ({ b64, x0, y0, x1, y1, zoom, pas }) => {
  const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
  const w = x1 - x0, h = y1 - y0, c = document.getElementById('c'); c.width = w * zoom; c.height = h * zoom;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#7a8a86'; x.fillRect(0, 0, c.width, c.height);   // fond gris : la transparence se voit
  x.drawImage(im, x0, y0, w, h, 0, 0, c.width, c.height);
  x.font = '11px sans-serif';
  for(let gx = Math.ceil(x0 / pas) * pas; gx <= x1; gx += pas){ const px = (gx - x0) * zoom; x.strokeStyle = gx % 100 ? 'rgba(0,160,255,.35)' : 'rgba(255,0,0,.7)'; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, c.height); x.stroke(); if(gx % 100 === 0){ x.fillStyle = '#f00'; x.fillText(gx, px + 2, 11); } }
  for(let gy = Math.ceil(y0 / pas) * pas; gy <= y1; gy += pas){ const py = (gy - y0) * zoom; x.strokeStyle = gy % 100 ? 'rgba(0,160,255,.35)' : 'rgba(255,0,0,.7)'; x.beginPath(); x.moveTo(0, py); x.lineTo(c.width, py); x.stroke(); if(gy % 100 === 0){ x.fillStyle = '#f00'; x.fillText(gy, 2, py - 2); } }
}, { b64, x0: +x0, y0: +y0, x1: +x1, y1: +y1, zoom: +zoom, pas: +pas });
await page.locator('#c').screenshot({ path: sortie });
await nav.close();

// Fabrique le logo martin-pêcheur et ses icônes à partir du dessin retouché par Mathis dans Figma.
//
// Source : assets/logos/sources/martin-figma.svg (fond gris de Figma déjà retiré).
// Sorties, dans assets/logos/ :
//   martin.svg        recadré au carré sur l'oiseau, 4 % de marge comme la huppe
//                     (une icône collée aux bords paraît sale) ; sert aux <img> et au favicon
//   martin-512.png    manifeste
//   martin-192.png    manifeste, apple-touch-icon et favicon de secours (Safari ne lit pas
//                     un favicon SVG)
// Le cadre se mesure au navigateur (getBBox), pas à la main : Figma laisse des marges
// inégales autour du dessin dans son carré de 27.
//
// Usage : node outils/build/icones-martin.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const RACINE = process.cwd();
const SOURCE = join(RACINE, 'assets', 'logos', 'sources', 'martin-figma.svg');
const DOSSIER = join(RACINE, 'assets', 'logos');
const TAILLES = [512, 192];

const brut = readFileSync(SOURCE, 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(brut);
const b = await page.evaluate(() => {
  const r = document.querySelector('svg').getBBox();
  return { x: r.x, y: r.y, w: r.width, h: r.height };
});

const cote = Math.max(b.w, b.h) * 1.08;
const x0 = b.x + b.w / 2 - cote / 2, y0 = b.y + b.h / 2 - cote / 2;
const vb = [x0, y0, cote, cote].map((v) => +v.toFixed(3)).join(' ');
const svg = brut
  .replace(/<svg[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">`)
  .replace(/\r?\n+/g, '\n');
writeFileSync(join(DOSSIER, 'martin.svg'), svg);
console.log(`dessin ${b.w.toFixed(2)} x ${b.h.toFixed(2)} -> carré ${cote.toFixed(2)}, viewBox ${vb}`);
console.log(`ecrit  assets/logos/martin.svg  ${(svg.length / 1024).toFixed(1)} Ko`);

for (const t of TAILLES) {
  await page.setViewportSize({ width: t, height: t });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:${t}px;height:${t}px}</style>${svg}`);
  const png = await page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: t, height: t } });
  writeFileSync(join(DOSSIER, `martin-${t}.png`), png);
  console.log(`ecrit  assets/logos/martin-${t}.png  ${(png.length / 1024).toFixed(1)} Ko`);
}
await browser.close();

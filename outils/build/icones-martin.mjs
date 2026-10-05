// Fabrique le logo martin-pêcheur et ses icônes à partir du dessin retouché par Mathis dans Figma.
//
// Source : assets/logos/sources/martin-figma.svg (fond gris de Figma déjà retiré). Version
// définitive du 2026-10-05 : les points de la calotte et de l'aile de la planche Arrow, reportés
// par archives/logos-motifs/motifs-martin.mjs puis retouchés par Mathis dans Figma.
// Sorties, dans assets/logos/ :
//   martin.svg        le martin entier, recadré au carré avec 4 % de marge (une icône collée
//                     aux bords paraît sale). Plus affiché depuis le 2026-10-05 (la tête
//                     encadrée l'a remplacé partout), gardé pour la mascotte. Ses rendus PNG
//                     sont partis dans archives/logos-martin-entier/ le même jour.
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
  // Les groupes masqués (points de la calotte et de l'aile, version du 2026-10-05) débordent
  // du dessin avant masquage - une bande de l'aile descend jusqu'à x = 0,08 - et getBBox
  // ignore les masques : on les laisse hors du calcul, ils restent dans la tête et l'aile.
  const els = [...document.querySelector('svg').children].filter((e) => e.tagName !== 'mask' && !e.hasAttribute('mask'));
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const e of els) {
    const r = e.getBBox();
    x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y); x1 = Math.max(x1, r.x + r.width); y1 = Math.max(y1, r.y + r.height);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
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


// ---------- Le logo : la tête dans le cadre ----------
// Choisi par Mathis le 2026-10-05 parmi les essais de tete-martin.mjs : le n° 17 (cadrage
// entre « entière » et « serrée », zoomé de 5 %, oiseau descendu de 0,3), fond vert pâle
// #ddedec (--accent à 14 % sur blanc), foncé le même jour à #d3e7e6 (18 %) à la demande de
// Mathis, « un tout petit peu trop clair ». Coins à 20 % du côté, comme l'entête (11 px sur 54).
//   logo.svg       entête et favicon, coins arrondis
//   logo-sombre.svg  l'entête en thème sombre : même tête sur sapin #1d524e (essai sapin-3,
//                  choisi par Mathis le même jour) ; app.js bascule entre les deux
//   logo-NNN.png   manifeste et apple-touch-icon : carré PLEIN, sans arrondi, parce que le
//                  téléphone découpe lui-même ses coins, et qu'iOS peint en noir les coins
//                  transparents d'une icône.
const L = { x: 10.05, y: 1.55, c: 13.3, fond: '#d3e7e6' };
const formes = brut.replace(/<\/?svg[^>]*>/g, '').replace(/<rect[^>]*\/>/g, '').trim();
const tuile = (rx, fond = L.fond) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${L.x} ${L.y} ${L.c} ${L.c}">
<defs><clipPath id="cadre"><rect x="${L.x}" y="${L.y}" width="${L.c}" height="${L.c}" rx="${rx}"/></clipPath></defs>
<g clip-path="url(#cadre)">
<rect x="${L.x}" y="${L.y}" width="${L.c}" height="${L.c}" fill="${fond}"/>
${formes}
</g>
</svg>
`;
const logo = tuile((L.c * 0.2).toFixed(2));
writeFileSync(join(DOSSIER, 'logo.svg'), logo);
console.log(`ecrit  assets/logos/logo.svg  ${(logo.length / 1024).toFixed(1)} Ko`);
writeFileSync(join(DOSSIER, 'logo-sombre.svg'), tuile((L.c * 0.2).toFixed(2), '#1d524e'));
console.log('ecrit  assets/logos/logo-sombre.svg');
for (const t of TAILLES) {
  await page.setViewportSize({ width: t, height: t });
  await page.setContent(`<style>html,body{margin:0}svg{display:block;width:${t}px;height:${t}px}</style>${tuile(0)}`);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: t, height: t } });
  writeFileSync(join(DOSSIER, `logo-${t}.png`), png);
  console.log(`ecrit  assets/logos/logo-${t}.png  ${(png.length / 1024).toFixed(1)} Ko`);
}
await browser.close();

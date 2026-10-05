// Essais de logo « tête du martin dans le cadre » : on recadre le dessin de la mascotte
// sur la tête, dans un carré aux coins arrondis comme l'entête (11 px sur 54, soit 20 %).
// Écrit des candidats dans notes-privees/logos-candidats/martin-2026-10-05/ (hors dépôt), que le banc des logos
// de localhost fait défiler.
//
// Usage : node outils/build/tete-martin.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const RACINE = process.cwd();
const SOURCE = join(RACINE, 'assets', 'logos', 'sources', 'martin-figma.svg');
const DOSSIER = join(RACINE, 'notes-privees', 'logos-candidats', 'martin-2026-10-05');

// Les formes seules, sans la balise <svg> ni le fond gris de Figma.
const formes = readFileSync(SOURCE, 'utf8')
  .replace(/<\/?svg[^>]*>/g, '').replace(/<rect[^>]*\/>/g, '').trim();

// [nom, x, y, côté du carré (unités du dessin, 27 de large), fond]
// Repères mesurés dans le dessin : arrière de la tête x 10, pointe du bec x 24,9, œil (17 ; 6).
const essais = [
  ['8-tete-entiere.svg', 9.3, 1.2, 16.2, '#e7eceb'], // bec entier, épaules visibles
  ['9-tete-serree.svg', 9.4, 1.9, 11.8, '#e7eceb'],  // tête plus grosse, le bec sort du cadre
  ['10-tete-serree-creme.svg', 9.4, 1.9, 11.8, '#faecc5'],
  // Entre-deux (côté 14) : le bec ne perd que sa pointe. Fonds tirés de la charte :
  ['11-tete-mi-blanc.svg', 9.7, 1.5, 14, '#ffffff'],   // --surface
  ['12-tete-mi-vert-pale.svg', 9.7, 1.5, 14, '#ddedec'], // --accent à 14 % sur blanc
  ['13-tete-mi-encre.svg', 9.7, 1.5, 14, '#15201e'],   // --ink, le fond sombre du thème
  ['14-tete-serree-vert-pale.svg', 9.4, 1.9, 11.8, '#ddedec'],
  ['15-tete-mi-vert-pale-bas.svg', 9.7, 0.9, 14, '#ddedec'], // le 12, oiseau descendu de 0,6
  ['16-tete-mi-vert-pale-mi-bas.svg', 9.7, 1.2, 14, '#ddedec'], // entre le 12 et le 15 : descendu de 0,3
  ['17-tete-16-zoom.svg', 10.05, 1.55, 13.3, '#ddedec'], // le 16 zoomé de 5 %, même centre
  // Le cadrage 17 sur d'autres fonds :
  ...[
    ['creme', '#faecc5'],      // la crème de la gorge
    ['peche', '#f9e8db'],      // l'orange du ventre à 18 % sur blanc
    ['ciel', '#dcebf5'],       // l'eau, bleu pâle
    ['gris', '#dde4e2'],       // --surface-3
    ['sapin', '#123c39'],      // bleu-vert très sombre, de la famille de l'accent
    ['encre', '#15201e'],      // --ink
  ].map(([n, f]) => [`18-tete-17-${n}.svg`, 10.05, 1.55, 13.3, f]),
  // Sapin un peu moins foncé, en trois pas (au-delà, la tête bleu-vert s'y fond) :
  ...[['sapin-2', '#184844'], ['sapin-3', '#1d524e'], ['sapin-4', '#225c57']]
    .map(([n, f]) => [`19-tete-17-${n}.svg`, 10.05, 1.55, 13.3, f]),
  // Retouches demandées : sapin entre le 3 et le 4, vert pâle un cran plus soutenu (--accent à 20 %).
  ['20-tete-17-sapin-3b.svg', 10.05, 1.55, 13.3, '#1f5752'],
  ['20-tete-17-vert-pale-b.svg', 10.05, 1.55, 13.3, '#cee5e4'],
  // Couleurs relevées sur l'échantillon envoyé par Mathis : fond #d8e9e1, liseré #80caa1
  // (2 px sur 90, soit 0,3 unité ici, posé à l'intérieur du cadre).
  ['21-tete-17-menthe.svg', 10.05, 1.55, 13.3, '#d8e9e1'],
  ['21-tete-17-menthe-lisere.svg', 10.05, 1.55, 13.3, '#d8e9e1', '#80caa1'],
];

for (const [nom, x, y, c, fond, bord] of essais) {
  const r = (c * 0.2).toFixed(2);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${c} ${c}">
<defs><clipPath id="cadre"><rect x="${x}" y="${y}" width="${c}" height="${c}" rx="${r}"/></clipPath></defs>
<g clip-path="url(#cadre)">
<rect x="${x}" y="${y}" width="${c}" height="${c}" fill="${fond}"/>
${formes}
</g>${bord ? `
<rect x="${x + 0.15}" y="${y + 0.15}" width="${c - 0.3}" height="${c - 0.3}" rx="${(c * 0.2 - 0.15).toFixed(2)}" fill="none" stroke="${bord}" stroke-width="0.3"/>` : ''}
</svg>
`;
  writeFileSync(join(DOSSIER, nom), svg);
  console.log(`ecrit  notes-privees/logos-candidats/martin-2026-10-05/${nom}`);
}

// Donne au perché de base les pattes du premier envoi (« A »), choix de Mathis le 2026-10-05.
// Arrow 2, à qui on l'avait demandé, n'a ajouté que deux pattes minuscules.
//   node outils/build/perche-pattes.mjs
// Lit notes-privees/mascotte/perche-pattes-1.svg (le perché D, ventre déjà débarrassé de ses pieds
// en bloc par Arrow 2) et planche-4.svg (les pattes de A, lignes 101 et 102),
// écrit notes-privees/mascotte/perche-base-2.svg.
import fs from 'node:fs';

const DOS = 'notes-privees/mascotte/';
const base = fs.readFileSync(DOS + 'perche-pattes-1.svg', 'utf8');
const a = fs.readFileSync(DOS + 'planche-4.svg', 'utf8').split(/\r?\n/);
if (!a[100].includes('m12.51 28.96') || !a[101].includes('m11.48 29.02')) throw new Error('planche-4.svg a changé');

// Pattes de A : le haut des pattes est à y = 29, vers x = 12,5. Sous le ventre de D, le même point
// est à (12,4 ; 22,05) : collées au ventre (à 22,4, Mathis les trouvait détachées). Échelle 0,9 : D est un peu plus fin que A.
const POSE = 'translate(12.4 22.05) scale(0.9) translate(-12.5 -29)';
const pattes = [
  a[100].replace('#BE5D31', '#B83A22'), // les deux pieds et la patte du fond, plus sombres
  a[101].replace('#D2763E', '#C8452B'), // la patte de devant, vermillon
].map((l) => l.trim());

let svg = base.replace(/<g stroke="none" id="slender_legs_and_feet">.*?<\/g>/s, '');
if (svg === base) throw new Error('pattes d\'Arrow 2 introuvables');
// Les pattes passent sous le ventre : on les pose juste avant lui.
svg = svg.replace('<path d="M18.66 11.58', `<g transform="${POSE}">${pattes.join('')}</g><path d="M18.66 11.58`);
if (!svg.includes(POSE)) throw new Error('ventre introuvable');

// Le reflet de l'œil revient : Mathis le préfère finalement (2026-10-05). C'est celui de la retouche n° 3.
const PUPILLE = '<circle cx="19.11" cy="8.018" r=".6445" fill="#120D0A"/>';
if (!svg.includes(PUPILLE)) throw new Error('pupille introuvable');
svg = svg.replace(PUPILLE, PUPILLE + '\n  <circle cx="19.23" cy="7.779" r=".166" fill="#fff"/>');
fs.writeFileSync(DOS + 'perche-base-2.svg', svg);
console.log('ok');

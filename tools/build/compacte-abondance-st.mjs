#!/usr/bin/env node
/*
  compacte-abondance-st.mjs - retire de REAL_ABUNDANCE_ST_FR ce que personne ne lit.

  POURQUOI
  La table sort de tools/ebirdst/build-abundance-by-country.R avec, pour chacune des 456
  especes, 52 valeurs hebdomadaires et quatre champs annexes. Mesure du 2026-09-28 : elle
  pesait 31,7 Ko servis, dont 24,6 Ko pour ces seules valeurs hebdomadaires - 78 % du poids.

  Un seul endroit du code les lisait, _countryHasSpecies, pour une question oui/non : l espece
  est-elle presente au moins une semaine, donc entre-t-elle au catalogue du pays. Aucun ecran
  n affichait la courbe.

  Et cette question elle-meme ne decidait plus rien. Mesure du 2026-09-28 sur les 456 especes :
  399 entrent au catalogue par leur BAR CHART eBird, zero par la seule presence hebdomadaire,
  zero par le seul tier S&T. Depuis que les bar charts couvrent la France, la condition etait
  morte. Elle a donc ete retiree d app.js, et la table ne porte plus ni w ni indicateur.

  ta, tn, tl et tr ne sont lus nulle part non plus - tr vaut meme null pour les 456 especes.

  CE QU IL FAIT
  { a, an, al, t, ta, tn, tl, w:[52], tr }  ->  { a, an, al, t }
  Les quatre champs gardes sont exactement ceux que le code lit : t pour le tier affiche, et
  a/an/al pour _stUtilisable, qui decide si ce tier est utilisable.

  Idempotent : relancer sur une table deja compactee ne change rien. A REPASSER apres chaque
  regeneration par le script R, qui porte la consigne en tete, sinon les 24,6 Ko reviennent en
  silence. Attention : depuis le retrait de la condition, une table regeneree et NON compactee
  ne se contente plus de peser plus lourd - ses valeurs hebdomadaires ne sont plus lues du tout.

      node tools/build/compacte-abondance-st.mjs

  app.js est en CRLF : on ne decoupe pas sur \r\n en dur, on detecte, et on reecrit avec les
  memes fins de ligne. Un fichier devenu mixte casserait en silence tous les scripts qui le
  modifient ligne par ligne.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'app.js');
const NOM = 'REAL_ABUNDANCE_ST_FR';
const GARDES = ['a', 'an', 'al', 't'];

const brut = readFileSync(APP, 'utf8');
const sep = brut.includes('\r\n') ? '\r\n' : '\n';
const lignes = brut.split(sep);

const i = lignes.findIndex((l) => l.startsWith('const ' + NOM + ' = '));
if (i < 0) { console.error('DEFAUT : ' + NOM + ' introuvable dans app.js'); process.exit(1); }

const ligne = lignes[i];
const table = JSON.parse(ligne.slice(ligne.indexOf('{'), ligne.lastIndexOf('}') + 1));

const ko = (n) => (n / 1024).toFixed(1) + ' Ko';
const gzip = (o) => gzipSync(Buffer.from(JSON.stringify(o), 'utf8'), { level: 6 }).length;
const avant = gzip(table);

let retires = 0;
const compact = {};
for (const [sci, v] of Object.entries(table)) {
  const o = {};
  for (const c of GARDES) o[c] = v[c];
  for (const c of Object.keys(v)) if (!GARDES.includes(c)) retires++;
  compact[sci] = o;
}

const apres = gzip(compact);
lignes[i] = 'const ' + NOM + ' = ' + JSON.stringify(compact) + ';';
writeFileSync(APP, lignes.join(sep), 'utf8');

console.log(Object.keys(compact).length + ' especes, ' + retires + ' champ(s) retire(s).');
console.log('table : ' + ko(avant) + ' -> ' + ko(apres) + ' servis' +
  (avant > apres ? ', ' + ko(avant - apres) + ' de moins.' : ' (deja compactee).'));

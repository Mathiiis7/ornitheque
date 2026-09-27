#!/usr/bin/env node
/*
  compacte-abondance-st.mjs - retire de REAL_ABUNDANCE_ST_FR ce que personne ne lit.

  POURQUOI
  La table sort de build-abundance-by-country.R avec, pour chacune des 456 especes, 52 valeurs
  hebdomadaires et quatre champs annexes. Mesure du 2026-09-28 : elle pese 31,7 Ko servis, dont
  24,6 Ko pour ces seules valeurs hebdomadaires - 78 % du poids.

  Or UN seul endroit du code les lit, _countryHasSpecies (app.js), et il pose une question
  oui/non : « cette espece est-elle presente au moins une semaine ? », pour decider si elle
  entre au catalogue du pays. Aucun ecran n'affiche la courbe. 52 nombres par espece pour un
  booleen, telecharges par chaque visiteur.

  Et ta, tn, tl, tr ne sont lus nulle part - tr vaut meme null pour les 456 especes.

  CE QU'IL FAIT
  { a, an, al, t, ta, tn, tl, w:[52], tr }  ->  { a, an, al, t, p:1 si presente }
  Les champs gardes sont exactement ceux que le code lit : t, et a/an/al pour _stUtilisable.

  Idempotent : relancer sur une table deja compactee ne change rien. A REPASSER apres chaque
  regeneration par le script R, sinon les 24,6 Ko reviennent en silence. Le code lecteur, lui,
  accepte les deux formes, donc une table regeneree et non compactee ne casse rien - elle pese
  seulement plus lourd.

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

let presentes = 0, deja = 0;
const compact = {};
for (const [sci, v] of Object.entries(table)) {
  const o = { a: v.a, an: v.an, al: v.al, t: v.t };
  // p = presente au moins une semaine. Sur une table deja compactee, w a disparu et p est la.
  if (v.p === 1) { o.p = 1; presentes++; deja++; }
  else if (Array.isArray(v.w) && v.w.some((x) => x > 0)) { o.p = 1; presentes++; }
  compact[sci] = o;
}

const apres = gzip(compact);
lignes[i] = 'const ' + NOM + ' = ' + JSON.stringify(compact) + ';';
writeFileSync(APP, lignes.join(sep), 'utf8');

console.log(Object.keys(compact).length + ' especes, ' + presentes + ' presentes au moins une semaine.');
console.log('table : ' + ko(avant) + ' -> ' + ko(apres) + ' servis, ' + ko(avant - apres) + ' de moins.');
if (deja === presentes && deja > 0) console.log('(table deja compactee : rien change)');

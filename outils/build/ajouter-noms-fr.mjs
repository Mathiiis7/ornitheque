#!/usr/bin/env node
/*
  ajouter-noms-fr.mjs - Ajoute à FR_NAMES (app.js) le nom français eBird des espèces des pays du site qui
  n'en ont pas, ni directement ni par SCI_ALIAS.

  POURQUOI. La taxonomie eBird d'octobre 2026 a séparé des espèces (Chevalier des prairies, Arrenga à bec
  jaune, Grand-duc nacurutu...) : les pays du monde, récoltés après, les portent, et FR_NAMES, plus ancien,
  ne les connaissait pas. 37 espèces dans 74 pays s'affichaient sans nom français (audit du 2026-11-10).

  Nom pris dans la nomenclature européenne d'eBird (locale=fr_FR), comme align-fr-names.mjs, et avec la même
  règle d'apostrophe : la droite, jamais la typographique, pour que le nom reste tapable dans la recherche.
  Un nom existant n'est jamais remplacé.

  Usage : node outils/build/ajouter-noms-fr.mjs [--dry]
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EBIRD_API_KEY } from './cle-ebird.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = join(RACINE, 'app.js');
const DRY = process.argv.includes('--dry');
let app = readFileSync(APP, 'utf8');
const ligne = app.match(/^const FR_NAMES = (\{.*\});/m);
const FR = JSON.parse(ligne[1]);
const i = app.indexOf('const SCI_ALIAS = {'), bloc = app.slice(i, app.indexOf('\n};', i));
const ALIAS = Object.fromEntries([...bloc.matchAll(/^\s*['"]([^'"]+)['"]\s*:\s*['"]([^'"]+)['"]/gm)].map(m => [m[1], m[2]]));
const connu = s => FR[s] || FR[ALIAS[s]];

// Toutes les espèces des pays du site : les 48 (tables communes) et les pays du monde (un fichier chacun).
const especes = new Set();
for (const t of Object.values(JSON.parse(readFileSync(join(RACINE, 'data', 'rarity_pays.json'), 'utf8')))) for (const s in t) especes.add(s);
const monde = JSON.parse(app.match(/^const PAYS_MONDE = (\{.*\});/m)[1]);
for (const cc of Object.keys(monde)) {
  const f = join(RACINE, 'data', 'countries', cc.toLowerCase(), 'pays.json');
  if (existsSync(f)) for (const s in JSON.parse(readFileSync(f, 'utf8')).rarete) especes.add(s);
}
const manquants = [...especes].filter(s => !connu(s));
if (!manquants.length) { console.log('Aucune espece sans nom francais.'); process.exit(0); }

const tax = await (await fetch('https://api.ebird.org/v2/ref/taxonomy/ebird?fmt=json&locale=fr_FR&cat=species',
  { headers: { 'X-eBirdApiToken': EBIRD_API_KEY } })).json();
const parSci = Object.fromEntries(tax.map(t => [t.sciName.toLowerCase(), t.comName]));
const ajouts = {}, introuvables = [];
for (const s of manquants) {
  const nom = parSci[s];
  if (nom) ajouts[s] = nom.replace(/’/g, "'"); else introuvables.push(s);
}
for (const [s, n] of Object.entries(ajouts)) console.log(`  ${s.padEnd(32)} ${n}`);
if (introuvables.length) console.log('Sans nom chez eBird :', introuvables.join(', '));
console.log(`${Object.keys(ajouts).length} noms a ajouter.`);
if (DRY) process.exit(0);

// FR_NAMES est rangé par ordre alphabétique du nom latin : on garde cet ordre.
const tout = { ...FR, ...ajouts };
const range = Object.fromEntries(Object.keys(tout).sort().map(k => [k, tout[k]]));
app = app.replace(ligne[0], () => `const FR_NAMES = ${JSON.stringify(range)};`);
writeFileSync(APP, app, 'utf8');
console.log(`FR_NAMES : ${Object.keys(FR).length} -> ${Object.keys(range).length} noms.`);

#!/usr/bin/env node
/*
  verser-pays.mjs - Verse la rareté et les fréquences mensuelles d'un ou plusieurs pays dans
  data/rarity_pays.json et data/freq_monthly_pays.json.

  POURQUOI. Depuis le 2026-09-27, ces deux tables ne vivent plus dans app.js (sortir-raretes.mjs,
  sortir-freq-mensuelles.mjs, qui ne servaient qu'une fois). inject-rarity-multi-country.mjs ne
  remplace qu'une table présente dans app.js : pour un pays nouveau, il dit « introuvable » et
  n'écrit rien (constaté sur le Maroc le 2026-11-09). Ce script est l'étape qui manquait.

  Entrée : data/generated/real-rarity-<cc>-ebird.generated.js (build-rarity-multi-country.mjs).
  Un pays déjà présent est remplacé, les autres sont gardés tels quels.

  Usage : node outils/build/verser-pays.mjs MA[,TR,...]
*/
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODES_MONDE } from './pays-monde.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const lireGenere = cc => {
  const src = join(RACINE, 'data', 'generated', `real-rarity-${cc.toLowerCase()}-ebird.generated.js`);
  if (!existsSync(src)) return null;
  const t = readFileSync(src, 'utf8');
  return { freq: JSON.parse(t.match(/REAL_FREQ_MONTHLY_\w+ = (\{.*\});/)[1]),
           rarete: JSON.parse(t.match(/REAL_RARITY_\w+_EBIRD = (\{.*\});/)[1]) };
};

// --monde : les pays du monde n'entrent PAS dans les fichiers communs (docs/ajouter-un-pays.md,
// « deux étages ») : un fichier par pays, et des morceaux par espèce pour le sélecteur.
if (process.argv.includes('--monde')) {
  const parSp = {}, nbEsp = {};
  let n = 0;
  // Les zones de la fiche, avec le nom qu'eBird leur donne, voyagent avec le pays : la liste
  // REGIONS_BY_COUNTRY de app.js aurait pris 2 400 lignes, pour des pays que peu ouvriront.
  // Seules les zones qui ont des donnees (freq_by_region.json) sont proposees.
  const { PAYS_MONDE } = await import('./pays-monde.mjs');
  const nomsZones = Object.fromEntries(PAYS_MONDE.map(p => [p.cc, p.noms || {}]));
  // Noms en français d'abord (zones-monde-noms.mjs), ceux d'eBird sinon.
  const fZ = join(RACINE, 'outils', 'config', 'zones-monde-noms.json');
  const ZONES_FR = existsSync(fZ) ? JSON.parse(readFileSync(fZ, 'utf8')) : {};
  // Les exotiques zone par zone voyagent aussi avec le pays (inject-exotic-by-region.mjs les sort d'app.js).
  const fE = join(RACINE, 'outils', 'config', 'exotiques-zones-monde.json');
  const EXO_ZONES = existsSync(fE) ? JSON.parse(readFileSync(fE, 'utf8')) : {};
  for (const cc of CODES_MONDE) {
    const d = lireGenere(cc);
    if (!d) { console.warn(`  ${cc} : pas de table generee, saute`); continue; }
    const fbr = join(RACINE, 'data', 'countries', cc.toLowerCase(), 'freq_by_region.json');
    const avecDonnees = existsSync(fbr) ? Object.keys(JSON.parse(readFileSync(fbr, 'utf8'))).filter(z => z !== cc) : [];
    d.zones = avecDonnees.map(code => ({ code, name: ZONES_FR[code] || nomsZones[cc][code] || code }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    if (EXO_ZONES[cc]) d.exoZones = EXO_ZONES[cc];
    mkdirSync(join(RACINE, 'data', 'countries', cc.toLowerCase()), { recursive: true });
    writeFileSync(join(RACINE, 'data', 'countries', cc.toLowerCase(), 'pays.json'), JSON.stringify(d), 'utf8');
    nbEsp[cc] = Object.keys(d.rarete).length;
    for (const [s, m] of Object.entries(d.freq)) (parSp[s] ||= {})[cc] = [d.rarete[s] || 0, ...m.map(v => +v.toFixed(4))];
    n++;
  }
  // Morceaux par espèce, sur les deux premières lettres du nom latin (184 fichiers, mesuré le 2026-11-09).
  const dossier = join(RACINE, 'data', 'especes-monde');
  rmSync(dossier, { recursive: true, force: true });
  mkdirSync(dossier, { recursive: true });
  const morceaux = {};
  for (const [s, v] of Object.entries(parSp)) (morceaux[s.slice(0, 2)] ||= {})[s] = v;
  for (const [k, v] of Object.entries(morceaux)) writeFileSync(join(dossier, k + '.json'), JSON.stringify(v), 'utf8');
  writeFileSync(join(RACINE, 'outils', 'config', 'pays-monde-especes.json'), JSON.stringify(nbEsp), 'utf8');
  console.log(`${n} pays ecrits (data/countries/xx/pays.json), ${Object.keys(morceaux).length} morceaux par espece.`);
  process.exit(0);
}

const pays = (process.argv[2] || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
const versMonde = pays.filter(cc => CODES_MONDE.includes(cc));
if (versMonde.length) { console.error(`ARRET : ${versMonde.join(',')} sont des pays du monde, passer --monde.`); process.exit(1); }
if (!pays.length) { console.error('Usage : node outils/build/verser-pays.mjs MA[,TR,...]'); process.exit(1); }

const CIBLES = [
  { fichier: join(RACINE, 'data', 'rarity_pays.json'),        table: cc => `REAL_RARITY_${cc}_EBIRD` },
  { fichier: join(RACINE, 'data', 'freq_monthly_pays.json'),  table: cc => `REAL_FREQ_MONTHLY_${cc}` },
];
const json = CIBLES.map(c => JSON.parse(readFileSync(c.fichier, 'utf8')));

for (const cc of pays) {
  const src = join(RACINE, 'data', 'generated', `real-rarity-${cc.toLowerCase()}-ebird.generated.js`);
  if (!existsSync(src)) { console.error(`ARRET : ${src} absent (lancer build-rarity-multi-country.mjs ${cc})`); process.exit(1); }
  const texte = readFileSync(src, 'utf8');
  CIBLES.forEach((c, i) => {
    const m = texte.match(new RegExp(`export const ${c.table(cc)} = (\\{.*\\});`));
    if (!m) { console.error(`ARRET : ${c.table(cc)} introuvable dans ${src}`); process.exit(1); }
    const avant = json[i][cc] ? Object.keys(json[i][cc]).length : 0;
    json[i][cc] = JSON.parse(m[1]);
    console.log(`${cc} -> ${c.fichier.split(/[\\/]/).pop()} : ${Object.keys(json[i][cc]).length} especes` + (avant ? ` (remplace ${avant})` : ' (nouveau)'));
  });
}

CIBLES.forEach((c, i) => {
  const ordonne = Object.fromEntries(Object.keys(json[i]).sort().map(k => [k, json[i][k]]));
  writeFileSync(c.fichier, JSON.stringify(ordonne), 'utf8');
  console.log(`Ecrit ${c.fichier.split(/[\\/]/).pop()} : ${Object.keys(ordonne).length} pays, ${Math.round(Buffer.byteLength(JSON.stringify(ordonne)) / 1024)} Ko`);
});

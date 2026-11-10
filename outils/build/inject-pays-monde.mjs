#!/usr/bin/env node
/*
  inject-pays-monde.mjs - Écrit dans app.js la table PAYS_MONDE (nom, préposition, continent, nombre
  d'espèces de chaque pays du monde) et la boucle qui les inscrit dans COUNTRIES_REG et CONTINENT_BY_CC.

  POURQUOI une table et une boucle : 193 pays en blocs de sept lignes comme les 48 d'avant auraient
  ajouté 1 400 lignes identiques à app.js ; la table pèse ~9 Ko.

  Relit app.js juste avant d'écrire et ne remplace QUE le bloc entre ses deux balises (une autre
  conversation travaille dans le même fichier : jamais de réécriture depuis une copie).
  Première fois : le bloc est posé juste avant « const CONTINENT_ORDER ».

  Entrées : outils/config/pays-monde-noms.json (pays-monde-noms.mjs),
            outils/config/pays-monde-especes.json (verser-pays.mjs --monde).
  Usage : node outils/build/inject-pays-monde.mjs
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CODES_MONDE } from './pays-monde.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = join(RACINE, 'app.js');
const noms = JSON.parse(readFileSync(join(RACINE, 'outils', 'config', 'pays-monde-noms.json'), 'utf8'));
const nb = JSON.parse(readFileSync(join(RACINE, 'outils', 'config', 'pays-monde-especes.json'), 'utf8'));

const table = {};
for (const cc of CODES_MONDE) {
  if (!noms[cc] || !nb[cc]) { console.warn(`  ${cc} : nom ou donnees absents, saute`); continue; }
  table[cc] = [noms[cc].nom, noms[cc].prep, noms[cc].continent, nb[cc]];
}

// Sans zones : eBird n'en publie pas, aucune ne porte de liste, ou aucun contour n'a pu être tracé
// (Porto Rico, îles Caïmans...). Ils s'ouvrent d'une seule pièce, comme Malte.
import { existsSync } from 'node:fs';
const sansZones = Object.keys(table).filter(cc => {
  const lc = cc.toLowerCase();
  if (!existsSync(join(RACINE, 'data', 'carte-zones', lc + '.json'))) return true;
  const fbr = join(RACINE, 'data', 'countries', lc, 'freq_by_region.json');
  return !existsSync(fbr) || !Object.keys(JSON.parse(readFileSync(fbr, 'utf8'))).some(z => z !== cc);
});

const DEBUT ='// PAYS_MONDE : debut du bloc ecrit par outils/build/inject-pays-monde.mjs';
const FIN = '// PAYS_MONDE : fin du bloc';
const bloc = [
  DEBUT,
  '// Les pays du monde ajoutes le 2026-11-09 (docs/ajouter-un-pays.md, « deux etages »). Leurs donnees',
  '// ne sont pas dans les fichiers communs : barTier() et monthly() restent vides tant que',
  '// _chargerPaysMonde(cc) n\'a pas lu data/countries/xx/pays.json. nbEspeces sert au selecteur,',
  '// qui affiche le nombre d\'especes de chaque pays avant d\'en avoir lu aucun.',
  '// [nom, preposition, continent du selecteur, nombre d\'especes]',
  `const PAYS_MONDE = ${JSON.stringify(table)};`,
  'for(const [cc, [nom, prep, continent, nbEspeces]] of Object.entries(PAYS_MONDE)){',
  '  if(COUNTRIES_REG[cc]) continue;',
  '  COUNTRIES_REG[cc] = { name: nom, flagCode: cc, monde: true, nbEspeces, prep, hasBarchart: true,',
  '    barTier: () => _RARETE_PAYS[cc] || {},',
  '    monthly: () => _FREQ_MENSUELLE_PAYS[cc] || {},',
  '    monthlyByRegion: () => REAL_FREQ_MONTHLY_BY_REGION_MULTI[cc] || null };',
  '  CONTINENT_BY_CC[cc] = continent;',
  '}',
  '// Pays du monde sans zones (aucune publiee par eBird, aucune avec des listes, ou aucun contour) :',
  '// ils rejoignent Malte, le Kosovo et les Feroe dans _SANS_DECOUPAGE et CT_PAYS_SANS_ZONES.',
  `const PAYS_MONDE_SANS_ZONES = ${JSON.stringify(sansZones)};`,
  FIN,
];

const brut = readFileSync(APP, 'utf8');
const sep = brut.includes('\r\n') ? '\r\n' : '\n';
const lignes = brut.split(/\r?\n/);
const i = lignes.indexOf(DEBUT), j = lignes.indexOf(FIN);
if (i >= 0 && j > i) lignes.splice(i, j - i + 1, ...bloc);
else {
  const k = lignes.findIndex(l => l.startsWith('const CONTINENT_ORDER = '));
  if (k < 0) { console.error('ARRET : « const CONTINENT_ORDER » introuvable dans app.js'); process.exit(1); }
  lignes.splice(k, 0, ...bloc);
}
writeFileSync(APP, lignes.join(sep), 'utf8');
console.log(`PAYS_MONDE : ${Object.keys(table).length} pays, ${(Buffer.byteLength(bloc.join('\n')) / 1024).toFixed(1)} Ko dans app.js`);

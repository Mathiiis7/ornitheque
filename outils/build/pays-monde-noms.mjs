#!/usr/bin/env node
/*
  pays-monde-noms.mjs - Nom français, préposition et continent des pays du monde ajoutés le 2026-11-09.

  POURQUOI. Le site écrit « en France », « au Maroc », « aux États-Unis », « à Malte » : le genre, le
  nombre et le statut d'île du nom commandent la préposition (commentaire de _PREP_PAYS dans app.js).
  Pour 200 pays d'un coup, la règle générale est écrite ici, et toutes ses exceptions à la main.

  Sources : noms de data/carte-pays.json (Natural Earth, traduits), complétés à la main pour les
  territoires qu'il ne sépare pas (Réunion, Guadeloupe...) ; continent : champ CONTINENT de Natural
  Earth admin-0, ramené aux cinq groupes du sélecteur (Europe, Amérique, Afrique, Océanie, Asie).

  Entrée : outils/config/pays-a-ajouter.json (inventaire-pays.mjs).
  Sortie : outils/config/pays-monde-noms.json = { CC: { nom, prep, continent } }
  Usage : node outils/build/pays-monde-noms.mjs
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const liste = JSON.parse(readFileSync(join(RACINE, 'outils', 'config', 'pays-a-ajouter.json'), 'utf8'));
const cartePays = JSON.parse(readFileSync(join(RACINE, 'data', 'carte-pays.json'), 'utf8'));
const NOM_CARTE = Object.fromEntries(cartePays.features.map(f => [f.properties.cc, f.properties.nom]));
const adm0 = JSON.parse(readFileSync(join(RACINE, 'notes-privees', 'contours-monde', 'ne_50m_admin_0_countries.geojson'), 'utf8'));
const CONTINENT_NE = Object.fromEntries(adm0.features.map(f => [f.properties.ISO_A2_EH || f.properties.ISO_A2, f.properties.CONTINENT]));

// Territoires que la carte des pays ne sépare pas : noms écrits à la main.
const NOMS_MAIN = {
  AC: 'Îles Ashmore-et-Cartier', BV: 'Île Bouvet', BQ: 'Pays-Bas caribéens', CX: 'Île Christmas',
  CP: 'Île Clipperton', CC: 'Îles Cocos', CS: 'Îles de la mer de Corail', GF: 'Guyane', GP: 'Guadeloupe',
  XX: 'Haute mer', MQ: 'Martinique', YT: 'Mayotte', MC: 'Monaco', RE: 'La Réunion',
  SX: 'Saint-Martin (partie néerlandaise)', TK: 'Tokelau', TV: 'Tuvalu',
  UM: 'Îles mineures éloignées des États-Unis', VA: 'Vatican',
};
const CONTINENT_MAIN = {
  AC: 'Océanie', BV: 'Autres', BQ: 'Amérique', CX: 'Océanie', CP: 'Amérique', CC: 'Océanie', CS: 'Océanie',
  GF: 'Amérique', GP: 'Amérique', XX: 'Autres', MQ: 'Amérique', YT: 'Afrique', MC: 'Europe', RE: 'Afrique',
  SX: 'Amérique', TK: 'Océanie', TV: 'Océanie', UM: 'Océanie', VA: 'Europe',
};
const GROUPE = { 'Africa': 'Afrique', 'Europe': 'Europe', 'Asia': 'Asie', 'North America': 'Amérique',
  'South America': 'Amérique', 'Oceania': 'Océanie', 'Antarctica': 'Autres', 'Seven seas (open ocean)': 'Autres' };

// Prépositions qui échappent à la règle, écrites une à une.
const PREP_MAIN = {
  // à : îles et cités sans article
  CU: 'à', MG: 'à', MU: 'à', SG: 'à', BH: 'à', TW: 'à', LC: 'à', SM: 'à', MC: 'à', HK: 'à', MO: 'à',
  PR: 'à', TT: 'à', ST: 'à', KN: 'à', AG: 'à', AW: 'à', AI: 'à', GU: 'à', NR: 'à', TV: 'à', DJ: 'à',
  BN: 'à', OM: 'à', YT: 'à', CW: 'à', SX: 'à', TK: 'à', NU: 'à', VA: 'au', BV: 'à', CX: 'à', CP: 'à',
  RE: 'à', MS: 'à', BL: 'à', MF: 'à', PM: 'à', SH: 'à', NF: 'à', PN: 'à', AS: 'aux', BB: 'à',
  // aux : noms au pluriel
  BS: 'aux', PH: 'aux', MV: 'aux', SC: 'aux', KM: 'aux', AE: 'aux', FJ: 'aux', WS: 'aux', TO: 'aux',
  KI: 'aux', PW: 'aux', MH: 'aux', SB: 'aux', BM: 'aux', KY: 'aux', TC: 'aux', VG: 'aux', VI: 'aux',
  FK: 'aux', FM: 'aux', MP: 'aux', CK: 'aux', CC: 'aux', AC: 'aux', CS: 'aux', UM: 'aux', BQ: 'aux',
  GS: 'aux', HM: 'aux', TF: 'aux', IO: 'aux', XX: 'en',
  // au : masculins qui finissent par -e
  MX: 'au', KH: 'au', MZ: 'au', ZW: 'au', BZ: 'au', SR: 'au', CG: 'au', CD: 'au',
  // la Grenade, la Dominique, la Barbade : « à la »
  GD: 'à la', DM: 'à la', BB: 'à la',
  // relus un par un le 2026-11-09 sur la première sortie
  HT: 'en', YE: 'au', CG: 'en', VC: 'à', WF: 'à', PN: 'aux', IO: 'dans le', GS: 'en',
  BV: 'à l’', CX: 'à l’', CP: 'à l’', NF: 'à l’',
};
// Noms trop officiels de la carte, raccourcis comme on les dit.
const NOMS_COURTS = { CN: 'Chine', VN: 'Vietnam', PN: 'îles Pitcairn', XX: 'haute mer',
  BV: 'île Bouvet', CX: 'île Christmas', CP: 'île Clipperton', NF: 'île Norfolk', IO: 'Territoire britannique de l’océan Indien' };
const CONTINENT_CORRIGE = { MV: 'Asie', MU: 'Afrique', SC: 'Afrique', SH: 'Afrique', IO: 'Asie' };
const VOYELLE = /^[AEIOUYÂÉÈÊÎÏÔÖÛÜ]/i;
function prep(cc, nom){
  if (PREP_MAIN[cc]) return PREP_MAIN[cc];
  if (VOYELLE.test(nom)) return 'en';                 // en Inde, en Équateur, en Iran
  if (/e$/.test(nom.split(/[ -]/)[0])) return 'en';   // en Turquie, en Côte d'Ivoire, en Papouasie-Nouvelle-Guinée
  return 'au';                                         // au Japon, au Pérou, au Costa Rica
}

const sortie = {}, manques = [];
for (const p of liste) {
  const nom = NOMS_COURTS[p.cc] || NOMS_MAIN[p.cc] || NOM_CARTE[p.cc];
  if (!nom) { manques.push(p.cc + ' ' + p.nom); continue; }
  const continent = CONTINENT_CORRIGE[p.cc] || CONTINENT_MAIN[p.cc] || GROUPE[CONTINENT_NE[p.cc]] || 'Autres';
  sortie[p.cc] = { nom, prep: prep(p.cc, nom), continent };
}
writeFileSync(join(RACINE, 'outils', 'config', 'pays-monde-noms.json'), JSON.stringify(sortie, null, 1));
console.log(Object.keys(sortie).length + ' pays nommes' + (manques.length ? ', SANS NOM : ' + manques.join(' | ') : ''));
const parPrep = {};
for (const [cc, v] of Object.entries(sortie)) (parPrep[v.prep] ||= []).push(`${v.prep} ${v.nom}`);
for (const [p, l] of Object.entries(parPrep)) console.log(`\n[${p}] ${l.length} : ${l.join(', ')}`);
const autres = Object.entries(sortie).filter(([, v]) => v.continent === 'Autres').map(([cc, v]) => v.nom);
console.log('\nContinent « Autres » :', autres.join(', '));

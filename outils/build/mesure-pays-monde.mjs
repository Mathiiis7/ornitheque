#!/usr/bin/env node
/*
  mesure-pays-monde.mjs - Nombre d'espèces et de listes eBird 2019-2026 de chaque pays du monde récolté.

  POURQUOI. Décider quels pays valent un Birdydex sur des chiffres, pas à l'œil. Précédent du
  2026-09-26 : Vatican (46 espèces), Monaco (94), Saint-Marin (103), Liechtenstein (178), Andorre (169)
  écartés. Un pays avec trop peu de listes donne des paliers de rareté faits de hasard.

  Lit outils/ebird-barcharts-raw/ebird-barchart-<CC>-2019-2026.txt (téléchargés avec --national).
  Usage : node outils/build/mesure-pays-monde.mjs
*/
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PAYS_MONDE, ECARTES } from './pays-monde.mjs';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const noms = JSON.parse(readFileSync(join(RACINE, 'outils', 'config', 'pays-monde-noms.json'), 'utf8'));
const lignes = [], absents = [];
for (const p of PAYS_MONDE) {
  const f = join(RACINE, 'outils', 'ebird-barcharts-raw', `ebird-barchart-${p.cc}-2019-2026.txt`);
  if (!existsSync(f)) { absents.push(p.cc); continue; }
  const txt = readFileSync(f, 'utf8').split(/\r?\n/);
  const ss = txt.find(l => /^Sample Size/i.test(l));
  const listes = ss ? ss.split('\t').slice(1, 49).reduce((a, v) => a + (+v || 0), 0) : 0;
  // Espèces : lignes de données, hors « sp. », hybrides, « X ou Y », formes domestiques.
  const especes = txt.filter(l => l.includes('\t') && !/^(Sample Size|Frequency|Number of taxa)/i.test(l)
    && l.split('\t')[0].trim() && !/ sp\.|hybride| x | ou |\/|domestique|\(/i.test(l.split('\t')[0])).length;
  lignes.push({ cc: p.cc, nom: (noms[p.cc] || {}).nom || p.nom, especes, listes: Math.round(listes), zones: p.zones.length });
}
lignes.sort((a, b) => a.listes - b.listes);
console.log('cc   listes  especes zones  nom');
for (const l of lignes) console.log(`${l.cc}  ${String(l.listes).padStart(7)}  ${String(l.especes).padStart(5)}  ${String(l.zones).padStart(4)}  ${l.nom}`);
console.log(`\n${lignes.length} pays mesures, ${absents.length} sans fichier${absents.length ? ' : ' + absents.join(' ') : ''}.`);
console.log('Deja ecartes :', Object.entries(ECARTES).map(([k, v]) => `${k} (${v})`).join(', '));

// Nombre de listes eBird par zone et par mois (2026-11-11). Sert à la carte de la fiche espèce : une zone
// sans aucune liste sur la période se hachure, au lieu de se confondre avec le gris « jamais notée » (Mathis,
// le même jour, devant le Tchad : 52 listes en mai pour tout le pays, presque toutes à N'Djamena, et une carte
// toute grise qui laissait croire l'espèce absente partout ailleurs).
//
// Source : la ligne « Sample Size » des bar charts régionaux (outils/ebird-barcharts-raw/), 48 quinzaines
// = 4 par mois, 2019-2026. Une zone sans bar chart n'est pas écrite : on ne sait pas, la carte ne hachure pas.
// Sortie : data/countries/<cc>/listes_zones.json = { CODE: [listes de janvier, ..., de décembre] }
// Usage : node outils/build/listes-par-zone.mjs
import fs from 'node:fs';

const RACINE = new URL('../../', import.meta.url);
const RAW = new URL('outils/ebird-barcharts-raw/', RACINE);
const lire = u => JSON.parse(fs.readFileSync(u, 'utf8'));

function listesParMois(fichier){
  if(!fs.existsSync(fichier)) return null;
  const ligne = fs.readFileSync(fichier, 'utf8').split(/\r?\n/).find(l => l.startsWith('Sample Size'));
  if(!ligne) return null;
  const q = ligne.split('\t').slice(1, 49).map(v => +v || 0);
  if(q.length < 48) return null;
  return Array.from({ length: 12 }, (_, m) => Math.round(q[4 * m] + q[4 * m + 1] + q[4 * m + 2] + q[4 * m + 3]));
}

let pays = 0, zones = 0, sans = 0, vides = 0;
for(const dossier of fs.readdirSync(new URL('data/countries/', RACINE))){
  const cc = dossier.toUpperCase();
  // Les zones que la carte dessine : ce sont elles qu'il faut savoir hachurer.
  const carte = cc === 'FR' ? new URL('data/departements-fr-simplified.json', RACINE)
    : new URL(`data/regions-${dossier}-simplified.json`, RACINE);
  if(!fs.existsSync(carte)) continue;
  const j = lire(carte);
  const codes = Object.keys(j.deps || j.regions || {});
  if(!codes.length) continue;
  const sortie = {};
  for(const code of codes){
    const m = listesParMois(new URL(`ebird-barchart-${code}-2019-2026.txt`, RAW));
    if(!m){ sans++; continue; }
    sortie[code] = m; zones++;
    if(m.every(v => v === 0)) vides++;
  }
  if(!Object.keys(sortie).length) continue;
  fs.writeFileSync(new URL(`data/countries/${dossier}/listes_zones.json`, RACINE), JSON.stringify(sortie));
  pays++;
}
console.log(`${pays} pays, ${zones} zones comptées (${vides} sans aucune liste sur 2019-2026), ${sans} zones sans bar chart`);

// Essai (2026-11-09) : pour les pays restants, combien de zones eBird trouvent un contour Natural Earth
// admin-1 au même code ISO 3166-2, pays par pays. Sert à savoir où il faudra une table de correspondance.
// Usage : node outils/verif/_contours-monde.mjs
import { readFileSync } from 'node:fs';
const R = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/';
const liste = JSON.parse(readFileSync(R + 'outils/config/pays-a-ajouter.json', 'utf8'));
const ne = JSON.parse(readFileSync(R + 'notes-privees/contours-monde/ne_10m_admin_1_states_provinces.geojson', 'utf8'));
const codesNE = new Set(ne.features.map(f => f.properties.iso_3166_2));
const neParPays = {};
for (const f of ne.features) (neParPays[f.properties.iso_a2] ||= []).push(f.properties.iso_3166_2);
let ok = 0, tot = 0;
const partiels = [];
for (const p of liste) {
  if (!p.zones.length) continue;
  const trouves = p.zones.filter(z => codesNE.has(z)).length;
  ok += trouves; tot += p.zones.length;
  if (trouves < p.zones.length) partiels.push(`${p.cc} ${trouves}/${p.zones.length} (NE ${(neParPays[p.cc] || []).length})`);
}
console.log(`${ok}/${tot} zones trouvees telles quelles ; pays sans zones : ${liste.filter(p => !p.zones.length).length}`);
console.log(`${partiels.length} pays incomplets :`, partiels.join(' | '));

// Essai (2026-11-10) : pour chaque zone eBird sans contour, dit si elle a des listes, et montre les
// morceaux Natural Earth du même pays qu'aucune zone n'a pris (candidats à une table de correspondance).
// Usage : node outils/verif/_zones-orphelines.mjs
import { readFileSync, existsSync } from 'node:fs';
const R = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/';
const log = readFileSync(R + 'outils/logs/carte-zones-monde.log', 'utf8').split(/\r?\n/);
const noms = JSON.parse(readFileSync(R + 'outils/config/zones-monde-noms.json', 'utf8'));
const ne = JSON.parse(readFileSync(R + 'notes-privees/contours-monde/ne_10m_admin_1_states_provinces.geojson', 'utf8')).features;
const manque = {}; let cc = '';
for (const l of log) { const m = l.match(/^([A-Z]{2}): \d+\/\d+/); if (m) cc = m[1]; const k = l.match(/MANQUE : (.*)/); if (k) manque[cc] = k[1].split(','); }
for (const [c, zones] of Object.entries(manque)) {
  const fbr = R + `data/countries/${c.toLowerCase()}/freq_by_region.json`;
  const avec = existsSync(fbr) ? JSON.parse(readFileSync(fbr, 'utf8')) : {};
  const z2 = zones.map(z => `${z}=${noms[z]}${avec[z] ? '' : ' (sans listes)'}`);
  const carte = existsSync(R + `data/carte-zones/${c.toLowerCase()}.json`) ? JSON.parse(readFileSync(R + `data/carte-zones/${c.toLowerCase()}.json`, 'utf8')) : { features: [] };
  const pris = new Set(carte.features.map(f => f.properties.ebird));
  const orphelins = ne.filter(f => (f.properties.iso_a2 === c || (f.properties.iso_3166_2 || '').startsWith(c + '-')))
    .filter(f => !pris.has(f.properties.iso_3166_2)).map(f => `${f.properties.iso_3166_2} ${f.properties.name}${f.properties.region ? ' [' + f.properties.region + ']' : ''}`);
  console.log(`\n${c} manque : ${z2.join(', ')}\n   NE non pris (${orphelins.length}) : ${orphelins.slice(0, 14).join(' | ')}`);
}

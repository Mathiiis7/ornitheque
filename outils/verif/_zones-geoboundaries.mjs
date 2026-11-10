// Essai (2026-11-10) : pour chaque zone eBird sans contour, cherche dans geoBoundaries (ADM1 puis ADM2) un
// morceau de même code ISO ou de même nom. Usage : node outils/verif/_zones-geoboundaries.mjs
import { readFileSync, existsSync } from 'node:fs';
const R = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/';
const D = R + 'notes-privees/contours-monde/';
const log = readFileSync(R + 'outils/logs/carte-zones-monde.log', 'utf8').split(/\r?\n/);
const pays = JSON.parse(readFileSync(R + 'outils/config/pays-a-ajouter.json', 'utf8'));
const nomsEbird = Object.fromEntries(pays.flatMap(p => Object.entries(p.noms || {})));
const ne = JSON.parse(readFileSync(D + 'ne_50m_admin_0_countries.geojson', 'utf8'));
const ISO3 = Object.fromEntries(ne.features.map(f => [f.properties.ISO_A2_EH, f.properties.ISO_A3_EH]));
const norm = s => String(s || '').split(',')[0].normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/\b(province|region|district|municipality|governorate|prefecture|city|county|oblysy|shabiyat|division|state|al|ash|as|ad|an|ar|at|el)\b/g, '').replace(/[^a-z0-9]/g, '');
const manque = {}; let cc = '';
for (const l of log) { const m = l.match(/^([A-Z]{2}): \d+\/\d+/); if (m) cc = m[1]; const k = l.match(/MANQUE : (.*)/); if (k) manque[cc] = k[1].split(','); }
let trouves = 0, total = 0;
for (const [c, zones] of Object.entries(manque)) {
  const fbr = R + `data/countries/${c.toLowerCase()}/freq_by_region.json`;
  const avec = existsSync(fbr) ? JSON.parse(readFileSync(fbr, 'utf8')) : {};
  for (const z of zones) {
    if (!avec[z]) continue;   // sans listes : rien à montrer
    total++;
    let res = '';
    for (const niv of ['ADM1', 'ADM2']) {
      const f = D + `geoBoundaries-${ISO3[c]}-${niv}.geojson`;
      if (!existsSync(f) || res) continue;
      const g = JSON.parse(readFileSync(f, 'utf8')).features;
      const hit = g.find(x => x.properties.shapeISO === z) || g.find(x => norm(x.properties.shapeName) === norm(nomsEbird[z]));
      if (hit) res = `${niv} « ${hit.properties.shapeName} » (${hit.properties.shapeISO || '-'})`;
    }
    if (res) trouves++;
    console.log(`${z} ${nomsEbird[z]} -> ${res || 'RIEN'}`);
  }
}
console.log(`\n${trouves}/${total} zones avec listes trouvées dans geoBoundaries`);

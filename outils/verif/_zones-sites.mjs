// Audit (2026-11-10) : chaque forme de zone de la Carte (data/carte-zones/xx.json) est-elle à la bonne place ?
// Les sites eBird d'une zone (ref/hotspot, avec leur code de zone) doivent tomber dans SA forme. Une zone dont
// les sites tombent surtout dans la forme d'une AUTRE zone a une forme mal étiquetée : Natural Earth a mélangé
// les régions du Guyana sous leurs propres noms, ce qu'aucun contrôle par nom ne voyait.
// Usage : node outils/verif/_zones-sites.mjs [CC,CC...]   -> liste des zones suspectes
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const R = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/';
const env = readFileSync('C:/Users/mathi/Documents/.Renviron', 'utf8');
const CLE = (env.match(/^EBIRD_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^"|"$/g, '');
const CACHE = R + 'outils/logs/hotspots-zones-monde.json';
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const app = readFileSync(R + 'app.js', 'utf8');
const MONDE = JSON.parse(app.match(/^const PAYS_MONDE = (\{.*\});/m)[1]);
const liste = (process.argv[2] || '').split(',').filter(Boolean);
const pays = (liste.length ? liste : Object.keys(MONDE)).filter(cc => existsSync(R + `data/carte-zones/${cc.toLowerCase()}.json`));

const dedans = (x, y, a) => { let c = false; for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
  const [xi, yi] = a[i], [xj, yj] = a[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const polys = g => g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
const dansForme = (x, y, g) => polys(g).some(p => dedans(x, y, p[0]) && !p.slice(1).some(t => dedans(x, y, t)));

let suspects = 0, nouveaux = 0;
for (const cc of pays) {
  if (!cache[cc]) {
    const r = await fetch(`https://api.ebird.org/v2/ref/hotspot/${cc}?fmt=json`, { headers: { 'X-eBirdApiToken': CLE } });
    cache[cc] = r.ok ? (await r.json()).map(h => [h.lng, h.lat, h.subnational1Code]) : [];
    nouveaux++;
    await new Promise(f => setTimeout(f, 300));   // courtoisie envers l'API
  }
  const formes = JSON.parse(readFileSync(R + `data/carte-zones/${cc.toLowerCase()}.json`, 'utf8')).features;
  const parZone = {};
  for (const [x, y, z] of cache[cc]) {
    if (!z) continue;
    const o = (parZone[z] ||= { total: 0, chezSoi: 0, ailleurs: {} });
    const ici = formes.filter(f => dansForme(x, y, f.geometry)).map(f => f.properties.ebird);
    if (!ici.length) continue;              // hors de toute forme (mer, trait grossier) : ne dit rien
    o.total++;
    if (ici.includes(z)) o.chezSoi++; else for (const a of ici) o.ailleurs[a] = (o.ailleurs[a] || 0) + 1;
  }
  for (const [z, o] of Object.entries(parZone)) {
    if (o.total < 3) continue;
    const part = o.chezSoi / o.total;
    if (part < 0.5) {
      const [autre, n] = Object.entries(o.ailleurs).sort((a, b) => b[1] - a[1])[0] || ['?', 0];
      console.log(`${cc} ${z} : ${o.chezSoi}/${o.total} sites dans sa forme ; ${n} dans ${autre}`);
      suspects++;
    }
  }
}
if (nouveaux) writeFileSync(CACHE, JSON.stringify(cache));
console.log(`${pays.length} pays, ${suspects} zone(s) suspecte(s).`);

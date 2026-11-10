// Suite de _zones-sites.mjs (2026-11-10) : pour chaque FORME de zone d'un pays, la zone eBird dont les sites y
// dominent. Une forme étiquetée A où dominent les sites de B propose « A -> B ». Lit le cache des sites.
// Usage : node outils/verif/_zones-sites-proposition.mjs CC[,CC...]
import { readFileSync } from 'node:fs';
const R = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/';
const cache = JSON.parse(readFileSync(R + 'outils/logs/hotspots-zones-monde.json', 'utf8'));
const dedans = (x, y, a) => { let c = false; for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
  const [xi, yi] = a[i], [xj, yj] = a[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const polys = g => g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
const dansForme = (x, y, g) => polys(g).some(p => dedans(x, y, p[0]) && !p.slice(1).some(t => dedans(x, y, t)));
for (const cc of process.argv[2].split(',')) {
  const formes = JSON.parse(readFileSync(R + `data/carte-zones/${cc.toLowerCase()}.json`, 'utf8')).features;
  for (const f of formes) {
    const n = {};
    for (const [x, y, z] of cache[cc] || []) if (z && dansForme(x, y, f.geometry)) n[z] = (n[z] || 0) + 1;
    const tot = Object.values(n).reduce((a, b) => a + b, 0);
    const [dom, k] = Object.entries(n).sort((a, b) => b[1] - a[1])[0] || ['-', 0];
    const mark = dom !== f.properties.ebird && k >= 2 && k / tot > 0.5 ? '  <- PROPOSE ' + f.properties.ebird + ' -> ' + dom : '';
    console.log(`${cc} forme ${f.properties.ebird} (${f.properties.nom}) : ${tot} sites, surtout ${dom} (${k})${mark}`);
  }
}

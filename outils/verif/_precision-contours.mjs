// Essai (2026-11-10) : précision des contours des pays du monde. Pour chaque pays, les sites eBird
// (ref/hotspot) qui tombent hors de son contour sur la Carte (data/carte-pays.json), et leur distance au
// trait. Un site à quelques centaines de mètres de la côte est normal (port, plage) ; des dizaines à
// plusieurs kilomètres disent un contour trop grossier.
// Usage : node outils/verif/_precision-contours.mjs [CC,CC...]   (sans argument : tous les pays du monde)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const R = 'C:/Users/mathi/Documents/0-Claude/1-App/ornitheque/';
const { CODES_MONDE } = await import('file:///' + R + 'outils/build/pays-monde.mjs');
const env = readFileSync('C:/Users/mathi/Documents/.Renviron', 'utf8');
const CLE = (env.match(/^EBIRD_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^"|"$/g, '');
const carte = JSON.parse(readFileSync(R + 'data/carte-pays.json', 'utf8')).features;
const CACHE = R + 'outils/logs/hotspots-monde.json';
const cache = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, 'utf8')) : {};
const liste = (process.argv[2] || '').split(',').filter(Boolean);
const pays = liste.length ? liste : CODES_MONDE;

const dedans = (x, y, anneau) => { let c = false; for (let i = 0, j = anneau.length - 1; i < anneau.length; j = i++) {
  const [xi, yi] = anneau[i], [xj, yj] = anneau[j];
  if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
const dansPolys = (x, y, polys) => polys.some(p => dedans(x, y, p[0]) && !p.slice(1).some(t => dedans(x, y, t)));
// Distance en km d'un point au trait (segments), longitude raccourcie par le cosinus de la latitude.
const distKm = (x, y, polys) => { const k = Math.cos(y * Math.PI / 180); let m = Infinity;
  for (const p of polys) for (const a of p) for (let i = 0; i < a.length - 1; i++) {
    const ax = a[i][0] * k, ay = a[i][1], bx = a[i + 1][0] * k, by = a[i + 1][1], px = x * k, py = y;
    const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    m = Math.min(m, Math.hypot(px - (ax + t * dx), py - (ay + t * dy)));
  } return m * 111; };

const lignes = [];
for (const cc of pays) {
  if (!cache[cc]) {
    const r = await fetch(`https://api.ebird.org/v2/ref/hotspot/${cc}?fmt=json`, { headers: { 'X-eBirdApiToken': CLE } });
    cache[cc] = r.ok ? (await r.json()).map(s => [+s.lng.toFixed(5), +s.lat.toFixed(5)]) : [];
  }
  const f = carte.find(g => g.properties.cc === cc);
  const sites = cache[cc];
  if (!f) { lignes.push({ cc, sites: sites.length, hors: sites.length, p: 100, med: null, max: null, note: 'AUCUN CONTOUR' }); continue; }
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const d = sites.filter(([x, y]) => !dansPolys(x, y, polys)).map(([x, y]) => distKm(x, y, polys)).sort((a, b) => a - b);
  const loin = d.filter(v => v > (+process.env.SEUIL_KM || 2)).length;
  lignes.push({ cc, sites: sites.length, hors: d.length, loin, p: sites.length ? Math.round(d.length / sites.length * 100) : 0,
    med: d.length ? d[d.length >> 1].toFixed(1) : '-', max: d.length ? d[d.length - 1].toFixed(1) : '-' });
}
writeFileSync(CACHE, JSON.stringify(cache));
lignes.sort((a, b) => (b.loin || 0) - (a.loin || 0) || b.p - a.p);
console.log('cc  sites  hors  >2km  %hors  mediane km  max km');
for (const l of lignes.slice(0, 45)) console.log(`${l.cc}  ${String(l.sites).padStart(5)}  ${String(l.hors).padStart(4)}  ${String(l.loin ?? '-').padStart(4)}  ${String(l.p).padStart(4)}%  ${String(l.med).padStart(6)}  ${String(l.max).padStart(7)}  ${l.note || ''}`);
const tot = lignes.reduce((a, l) => a + l.sites, 0), hors = lignes.reduce((a, l) => a + l.hors, 0), loin = lignes.reduce((a, l) => a + (l.loin || 0), 0);
console.log(`\n${lignes.length} pays, ${tot} sites, ${hors} hors du contour (${(hors / tot * 100).toFixed(1)} %), dont ${loin} à plus de 2 km`);

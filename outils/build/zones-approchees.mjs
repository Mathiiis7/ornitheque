#!/usr/bin/env node
/*
  zones-approchees.mjs - Frontières APPROCHÉES des zones eBird quand aucune carte n'a le découpage
  qu'eBird emploie (décision de Mathis, 2026-11-10) : le Qatar (municipalités d'avant 2004) et la Libye
  (districts de 2001). Chaque point du pays va à la zone du site eBird le plus proche (cellules de
  Voronoï des sites, réunies par zone), découpé le long du contour réel du pays (Natural Earth).
  Juste à l'échelle de la carte, pas au kilomètre : c'est dit dans les sources du site.

  Sortie : notes-privees/contours-monde/approche-<CC>.geojson, une entité par zone (propriété ebird),
  lue par simplify-regions-multi.mjs comme une source « tout » (GB_MONDE).
  Usage : node outils/build/zones-approchees.mjs QA,LY
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as polyclip from 'polyclip-ts';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DOSSIER = join(RACINE, 'notes-privees', 'contours-monde');
const env = readFileSync('C:/Users/mathi/Documents/.Renviron', 'utf8');
const CLE = (env.match(/^EBIRD_API_KEY=(.*)$/m) || [])[1]?.trim().replace(/^"|"$/g, '');
const ne = JSON.parse(readFileSync(join(DOSSIER, 'ne_10m_admin_1_states_provinces.geojson'), 'utf8')).features;

// Coupe un polygone convexe par le demi-plan des points plus proches de a que de b (Sutherland-Hodgman).
function couper(poly, a, b){
  const nx = b[0] - a[0], ny = b[1] - a[1], c = (b[0] * b[0] + b[1] * b[1] - a[0] * a[0] - a[1] * a[1]) / 2;
  const dedans = p => p[0] * nx + p[1] * ny <= c;
  const out = [];
  for(let i = 0; i < poly.length; i++){
    const p = poly[i], q = poly[(i + 1) % poly.length], ip = dedans(p), iq = dedans(q);
    if(ip) out.push(p);
    if(ip !== iq){
      const t = (c - p[0] * nx - p[1] * ny) / ((q[0] - p[0]) * nx + (q[1] - p[1]) * ny);
      out.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  }
  return out;
}

for(const cc of (process.argv[2] || 'QA,LY').split(',')){
  const sites = await (await fetch(`https://api.ebird.org/v2/ref/hotspot/${cc}?fmt=json`, { headers: { 'X-eBirdApiToken': CLE } })).json();
  // Distances en km approchés : la longitude est raccourcie par le cosinus de la latitude moyenne.
  const lat0 = sites.reduce((a, s) => a + s.lat, 0) / sites.length, k = Math.cos(lat0 * Math.PI / 180);
  const uniques = new Map();
  for(const s of sites) uniques.set(`${s.lng.toFixed(4)},${s.lat.toFixed(4)}`, { x: s.lng * k, y: s.lat, zone: s.subnational1Code });
  const pts = [...uniques.values()];
  // Contour du pays : la réunion de ses régions Natural Earth.
  const morceaux = ne.filter(f => f.properties.iso_a2 === cc).map(f => f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates);
  const pays = polyclip.union(...morceaux);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for(const poly of pays) for(const [x, y] of poly[0]){ x0 = Math.min(x0, x * k); x1 = Math.max(x1, x * k); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const cadre = [[x0 - 1, y0 - 1], [x1 + 1, y0 - 1], [x1 + 1, y1 + 1], [x0 - 1, y1 + 1]];
  // Cellule de Voronoï de chaque site, ramenée en degrés, regroupée par zone.
  const parZone = {};
  for(const a of pts){
    let cell = cadre;
    for(const b of pts) if(b !== a && (b.x !== a.x || b.y !== a.y)) { cell = couper(cell, [a.x, a.y], [b.x, b.y]); if(cell.length < 3) break; }
    if(cell.length < 3) continue;
    const anneau = cell.map(([x, y]) => [x / k, y]); anneau.push(anneau[0]);
    (parZone[a.zone] ||= []).push([anneau]);
  }
  const features = [];
  for(const [zone, cellules] of Object.entries(parZone)){
    const geo = polyclip.intersection(polyclip.union(...cellules), pays);
    if(geo.length) features.push({ type: 'Feature', properties: { ebird: zone }, geometry: { type: 'MultiPolygon', coordinates: geo } });
  }
  writeFileSync(join(DOSSIER, `approche-${cc}.geojson`), JSON.stringify({ type: 'FeatureCollection', features }));
  console.log(`${cc} : ${sites.length} sites (${pts.length} emplacements), ${features.length} zones -> approche-${cc}.geojson : ${features.map(f => f.properties.ebird).sort().join(' ')}`);
}

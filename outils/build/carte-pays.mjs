#!/usr/bin/env node
/*
  carte-pays.mjs - Les frontières de tous les pays du monde pour la Carte du site
  (data/carte-pays.json), posées dès l'arrivée sur la Carte (Mathis, 2026-10-24).

  Source : Natural Earth admin-0 au 1:50 000 000 (domaine public), téléchargé en local :
    curl -sL -o ne_50m_admin_0_countries.geojson \
      https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson

  Usage : node outils/build/carte-pays.mjs <ne_50m_admin_0_countries.geojson>

  Sortie : un FeatureCollection, propriétés { cc, nom } (code ISO à deux lettres, nom français).
  Le site décide seul quels pays se cliquent (ceux dont il connaît la rareté).
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const SORTIE = join(__dir, '..', '..', 'data', 'carte-pays.json');
// 0,03° (~3 km) : à l'échelle d'un continent, aucune différence visible avec le tracé d'origine,
// pour un fichier divisé par dix. Les régions d'un pays cliqué ont leur propre tracé, plus fin.
const TOL = 0.03;
// Sauf pour Jersey, Guernesey et l'île de Man, qui s'ouvrent sur leur zone du Royaume-Uni d'un clic : à
// 0,03° leur forme n'avait que 4 à 8 sommets, et celle de Guernesey laissait Aurigny et Sercq en mer
// (33 et 13 km, outils/verif/_contours-iles.mjs, 2026-10-29). Mêmes traits fins que leurs zones
// (simplify-regions-multi.mjs), à 0,003° (300 m).
const TOL_ILES = 0.003;
const CONTOURS = join(__dir, '..', '..', 'notes-privees', 'contours-monde');
const ILES_FINES = { JE:'osm-JEY.geojson', GG:'geoBoundaries-GGY-ADM0.geojson', IM:'geoBoundaries-IMN-ADM0.geojson' };

function distPerp(p, a, b){
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if(!dx && !dy) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function douglasPeucker(pts, tol){
  if(pts.length < 3) return pts;
  let max = 0, idx = 0;
  for(let i = 1; i < pts.length - 1; i++){ const d = distPerp(pts[i], pts[0], pts[pts.length - 1]); if(d > max){ max = d; idx = i; } }
  if(max <= tol) return [pts[0], pts[pts.length - 1]];
  return douglasPeucker(pts.slice(0, idx + 1), tol).slice(0, -1).concat(douglasPeucker(pts.slice(idx), tol));
}

const src = process.argv[2];
if(!src){ console.error('Usage : node outils/build/carte-pays.mjs <ne_50m_admin_0_countries.geojson>'); process.exit(1); }
const ne = JSON.parse(readFileSync(src, 'utf8'));
const features = [];
let sansCode = [];
for(const f of ne.features){
  const p = f.properties;
  // ISO_A2 vaut -99 pour la France et la Norvège dans Natural Earth (territoires d'outre-mer) :
  // ISO_A2_EH donne le code attendu.
  const cc = [p.ISO_A2_EH, p.ISO_A2].find(c => c && c !== '-99');
  if(!cc){ sansCode.push(p.NAME); continue; }
  const fin = ILES_FINES[cc] && existsSync(join(CONTOURS, ILES_FINES[cc])) ? JSON.parse(readFileSync(join(CONTOURS, ILES_FINES[cc]), 'utf8')) : null;
  const geo = fin ? { type:'MultiPolygon', coordinates:fin.features.flatMap(g => g.geometry.type === 'Polygon' ? [g.geometry.coordinates] : g.geometry.coordinates) } : f.geometry;
  const polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates;
  const [tol, dec] = fin ? [TOL_ILES, 3] : [TOL, 2];
  const out = [];
  for(const poly of polys){
    const anneaux = poly.map(r => douglasPeucker(r, tol)).filter(r => r.length >= 4)
      .map(r => r.map(([x, y]) => [+x.toFixed(dec), +y.toFixed(dec)]));
    if(anneaux.length) out.push(anneaux);
  }
  if(!out.length) continue;
  features.push({ type:'Feature', properties:{ cc, nom:p.NAME_FR || p.NAME },
    geometry:{ type:'MultiPolygon', coordinates:out } });
}
const json = JSON.stringify({ type:'FeatureCollection', features });
writeFileSync(SORTIE, json);
console.log(`${features.length} pays -> ${(json.length / 1024).toFixed(1)} Ko (${SORTIE})`);
if(sansCode.length) console.log('Sans code ISO, écartés :', sansCode.join(', '));

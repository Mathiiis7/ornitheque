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

// Territoires qu'eBird traite en pays mais que Natural Earth admin-0 fond dans un autre (2026-11-10) :
// la Guadeloupe, la Martinique, la Guyane, La Réunion et Mayotte étaient dans le contour de la France,
// et un clic dessus ouvrait la France. Leur trait vient du fichier admin-1 au 1:10 M, où chacun est une
// région à part ; ils sont retirés du pays qui les contenait (PARTIR_DE).
const ADMIN1 = join(CONTOURS, 'ne_10m_admin_1_states_provinces.geojson');
const TERRITOIRES = {
  GP:{ codes:['FR-GP'], nom:'Guadeloupe' }, MQ:{ codes:['FR-MQ'], nom:'Martinique' },
  GF:{ codes:['FR-GF'], nom:'Guyane' }, RE:{ codes:['FR-RE'], nom:'La Réunion' }, YT:{ codes:['FR-YT'], nom:'Mayotte' },
  BQ:{ codes:['NL-BQ1', 'NL-BQ2', 'NL-BQ3'], nom:'Pays-Bas caribéens' },
  CX:{ codes:['-99-X14~'], nom:'Île Christmas' }, CC:{ codes:['-99-X15~'], nom:'Îles Cocos' },
  CS:{ codes:['-99-X03~'], nom:'Îles de la mer de Corail' }, CP:{ codes:['-99-X02~'], nom:'Île Clipperton' },
  BV:{ codes:['NO-X01~'], nom:'Île Bouvet' }, AC:{ codes:['AU-X04~'], nom:'Îles Ashmore-et-Cartier' },
};
// Ce qu'on garde du pays d'origine : la France métropolitaine (Corse comprise), les Pays-Bas d'Europe,
// la Norvège sans Bouvet. Les « Indian Ocean Ter. » rangés AU (Christmas et Cocos) sont remplacés.
const PARTIR_DE = {
  FR: ([x, y]) => x > -6 && x < 10 && y > 41 && y < 52,
  NL: ([x, y]) => y > 45,
  NO: ([x, y]) => y > 50,
};
const centre = anneau => anneau.reduce((a, [x, y]) => [a[0] + x / anneau.length, a[1] + y / anneau.length], [0, 0]);
const admin1 = existsSync(ADMIN1) ? JSON.parse(readFileSync(ADMIN1, 'utf8')).features : [];

for(const f of ne.features){
  const p = f.properties;
  // ISO_A2 vaut -99 pour la France et la Norvège dans Natural Earth (territoires d'outre-mer) :
  // ISO_A2_EH donne le code attendu.
  const cc = [p.ISO_A2_EH, p.ISO_A2].find(c => c && c !== '-99');
  if(!cc){ sansCode.push(p.NAME); continue; }
  if(p.NAME === 'Indian Ocean Ter.' && TERRITOIRES.CX) continue;   // remplacé par Christmas et Cocos
  const fin = ILES_FINES[cc] && existsSync(join(CONTOURS, ILES_FINES[cc])) ? JSON.parse(readFileSync(join(CONTOURS, ILES_FINES[cc]), 'utf8')) : null;
  const geo = fin ? { type:'MultiPolygon', coordinates:fin.features.flatMap(g => g.geometry.type === 'Polygon' ? [g.geometry.coordinates] : g.geometry.coordinates) } : f.geometry;
  let polys = geo.type === 'Polygon' ? [geo.coordinates] : geo.coordinates;
  if(PARTIR_DE[cc]) polys = polys.filter(poly => PARTIR_DE[cc](centre(poly[0])));
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
// Les territoires, puis les petits pays absents d'admin-0 au 1:50 M mais présents en admin-1 (Sint
// Maarten, Tuvalu, Tokelau, îles mineures des États-Unis), au trait fin des îles.
const dejaLa = new Set(features.map(f => f.properties.cc));
const MANQUANTS = ['SX', 'TV', 'TK', 'UM'].filter(cc => !dejaLa.has(cc));
const ajoutes = [];
for(const [cc, t] of [...Object.entries(TERRITOIRES), ...MANQUANTS.map(cc => [cc, { iso:cc }])]){
  if(dejaLa.has(cc) && !t.codes) continue;
  const morceaux = admin1.filter(g => t.codes ? t.codes.includes(g.properties.iso_3166_2) : g.properties.iso_a2 === t.iso);
  const out = [];
  for(const g of morceaux){
    const polys = g.geometry.type === 'Polygon' ? [g.geometry.coordinates] : g.geometry.coordinates;
    for(const poly of polys){
      const anneaux = poly.map(r => douglasPeucker(r, TOL_ILES)).filter(r => r.length >= 4)
        .map(r => r.map(([x, y]) => [+x.toFixed(3), +y.toFixed(3)]));
      if(anneaux.length) out.push(anneaux);
    }
  }
  if(!out.length){ console.warn(`  ${cc} : aucun contour trouvé`); continue; }
  features.push({ type:'Feature', properties:{ cc, nom:t.nom || morceaux[0].properties.admin },
    geometry:{ type:'MultiPolygon', coordinates:out } });
  ajoutes.push(cc);
}
console.log('Territoires et petits pays ajoutés :', ajoutes.join(' '));
const json = JSON.stringify({ type:'FeatureCollection', features });
writeFileSync(SORTIE, json);
console.log(`${features.length} pays -> ${(json.length / 1024).toFixed(1)} Ko (${SORTIE})`);
if(sansCode.length) console.log('Sans code ISO, écartés :', sansCode.join(', '));

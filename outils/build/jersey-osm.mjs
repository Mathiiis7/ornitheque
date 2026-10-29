// Le contour de Jersey tiré du trait de côte d'OpenStreetMap (2026-10-29). Natural Earth, au 1:10 M, posait
// Saint-Hélier à 500 m en mer et laissait dehors 22 des 63 hotspots eBird de l'île à plus de 300 m ;
// geoBoundaries, qui sert pour Guernesey et l'île de Man, n'a pas Jersey. Licence ODbL : le contour
// publié reste sous ODbL, avec la mention « © contributeurs OpenStreetMap » sur la Carte.
// node outils/build/jersey-osm.mjs <réponse Overpass .json> <sortie JEY.geojson>
// La réponse Overpass : way["natural"="coastline"](49.15,-2.27,49.30,-1.99); out geom;
import { readFileSync, writeFileSync } from 'node:fs';
const [ENTREE, SORTIE] = process.argv.slice(2);
const ways = JSON.parse(readFileSync(ENTREE, 'utf8')).elements.filter(e => e.type === 'way' && e.nodes && e.geometry);
// Les morceaux de côte se suivent par leurs nœuds d'extrémité : on les enchaîne en anneaux fermés.
const parDebut = new Map(ways.map(w => [w.nodes[0], w]));
const pris = new Set(), anneaux = [];
let ouverts = 0;
for(const w of ways){
  if(pris.has(w.id)) continue;
  const pts = [], debut = w.nodes[0];
  let cur = w;
  while(cur && !pris.has(cur.id)){
    pris.add(cur.id);
    const g = cur.geometry.map(p => [+p.lon.toFixed(6), +p.lat.toFixed(6)]);
    pts.push(...(pts.length ? g.slice(1) : g));
    const fin = cur.nodes[cur.nodes.length - 1];
    if(fin === debut){ cur = null; break; }
    cur = parDebut.get(fin);
  }
  const ferme = pts.length > 3 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1];
  if(ferme) anneaux.push(pts); else ouverts++;
}
// Aire en km² (équirectangulaire locale) : les rochers de quelques mètres ne servent ni au clic ni au voile.
const aire = r => { let s = 0; for(let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return Math.abs(s / 2) * 111.32 * Math.cos(49.2 * Math.PI / 180) * 110.54; };
const SEUIL_KM2 = 0.01;
const gardes = anneaux.filter(r => aire(r) >= SEUIL_KM2).sort((a, b) => aire(b) - aire(a));
console.log(`${ways.length} morceaux de côte, ${anneaux.length} anneaux fermés, ${ouverts} ouverts, ${gardes.length} gardés (≥ ${SEUIL_KM2} km²) : ${gardes.map(r => aire(r).toFixed(2)).join(', ')} km²`);
writeFileSync(SORTIE, JSON.stringify({ type:'FeatureCollection', features:[{ type:'Feature', properties:{ shapeISO:'JEY', source:'© contributeurs OpenStreetMap (ODbL)' },
  geometry:{ type:'MultiPolygon', coordinates:gardes.map(r => [r]) } }] }));

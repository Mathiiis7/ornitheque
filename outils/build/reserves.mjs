// Les réserves de la Carte (2026-10-29, choix de Mathis sur notes-privees/maquettes/reserves/) : réserves
// naturelles nationales (186) et régionales (195), sites du Conservatoire du littoral (814), lus sur le
// service WFS de la Géoplateforme IGN (données PatriNat, Licence Ouverte, mention « Muséum national
// d'Histoire naturelle »). Sortie : data/reserves-fr.json, chargé quand la pastille « Réserves » s'allume.
// Mesuré ce jour : 0,001° (environ 100 m) donne ~270 Ko gzippés pour les trois, 0,0005° 440 Ko.
// Chaque site porte les zones eBird qu'il touche (département en métropole, territoire outre-mer) : la
// bulle y cherche ses hotspots sans recalculer quoi que ce soit dans le navigateur.
// node outils/build/reserves.mjs [dossier où garder les réponses brutes]
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const RACINE = join(__dir, '..', '..');
const BRUT = process.argv[2] || join(RACINE, 'notes-privees', 'reserves');
const SORTIE = join(RACINE, 'data', 'reserves-fr.json');
const TOL = 0.001;
const COUCHES = [['RNN', 'patrinat_rnn:rnn'], ['RNR', 'patrinat_rnr:rnr'], ['CDL', 'patrinat_cdl:conservatoire_littoral']];

function douglasPeucker(pts, tol){
  if(pts.length < 3) return pts;
  let max = 0, idx = 0; const a = pts[0], b = pts[pts.length - 1];
  for(let i = 1; i < pts.length - 1; i++){
    const p = pts[i], dx = b[0] - a[0], dy = b[1] - a[1];
    const t = (dx || dy) ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy))) : 0;
    const d = Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); if(d > max){ max = d; idx = i; }
  }
  if(max <= tol) return [a, b];
  return douglasPeucker(pts.slice(0, idx + 1), tol).slice(0, -1).concat(douglasPeucker(pts.slice(idx), tol));
}
const polygones = g => g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
const dansAnneau = (r, x, y) => { let c = false; for(let i = 0, j = r.length - 1; i < r.length; j = i++){ const [xa, ya] = r[i], [xb, yb] = r[j]; if((ya > y) !== (yb > y) && x < (xb - xa) * (y - ya) / (yb - ya) + xa) c = !c; } return c; };
const dansPoly = (polys, x, y) => polys.some(p => dansAnneau(p[0], x, y) && !p.slice(1).some(t => dansAnneau(t, x, y)));

// Le nom tel que le service l'écrit capitalise chaque mot (« Lac De Grand-Lieu ») : les petits mots
// reprennent leur minuscule, sauf en tête.
const PETITS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'et', 'en', 'sur', 'sous', 'aux', 'au', 'à', 'l', 'd']);
const joliNom = s => (s || '').trim().replace(/\s+/g, ' ').split(' ').map((m, i) => {
  if(i === 0) return m;
  const [debut, ...reste] = m.split(/(?<=['’])/);
  const bas = debut.toLowerCase().replace(/['’]$/, '');
  return PETITS.has(bas) ? debut.toLowerCase() + reste.join('') : m;
}).join(' ');

// Outre-mer : pas de département dans nos contours, le territoire suffit à eBird (ref/hotspot/GP).
const OUTREMER = [['GP', -61.9, -60.9, 15.8, 16.6], ['MQ', -61.3, -60.7, 14.3, 14.95], ['GF', -54.7, -51.5, 2, 6], ['RE', 55.1, 56, -21.5, -20.8],
  ['YT', 44.9, 45.4, -13.1, -12.5], ['PM', -56.5, -56, 46.7, 47.2], ['BL', -62.95, -62.75, 17.85, 17.98], ['MF', -63.2, -62.95, 18, 18.15],
  ['TF', 39, 80, -50, -11]];   // Terres australes et Glorieuses

const deps = JSON.parse(readFileSync(join(RACINE, 'data', 'carte-departements.json'), 'utf8')).features
  .map(f => ({ z:f.properties.ebird, polys:polygones(f.geometry), bb:(() => { let x0 = 180, x1 = -180, y0 = 90, y1 = -90; for(const p of polygones(f.geometry)) for(const [x, y] of p[0]){ x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); } return [x0, x1, y0, y1]; })() }));
function zonesEbird(polys){
  // Les sommets du site (au plus 60, répartis) : un site à cheval sur deux départements les a tous deux.
  const pts = polys.flatMap(p => p[0]); const pas = Math.max(1, Math.floor(pts.length / 60));
  const z = new Set();
  for(let i = 0; i < pts.length; i += pas){
    const [x, y] = pts[i];
    const d = deps.find(d => x >= d.bb[0] && x <= d.bb[1] && y >= d.bb[2] && y <= d.bb[3] && dansPoly(d.polys, x, y));
    if(d){ z.add(d.z); continue; }
    const o = OUTREMER.find(([, x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
    if(o) z.add(o[0]);
  }
  // Un site côtier dont aucun sommet ne tombe dans nos départements simplifiés : le plus proche.
  if(!z.size && pts.length){
    const [x, y] = pts[0];
    let best = null, dmin = Infinity;
    for(const d of deps) for(const p of d.polys) for(const [a, b] of p[0]){ const dd = (a - x) ** 2 + (b - y) ** 2; if(dd < dmin){ dmin = dd; best = d.z; } }
    // 0,15° : les Sept-Îles sont à 6 km de Perros-Guirec.
    if(dmin < 0.15 ** 2) z.add(best);
  }
  return [...z];
}

if(!existsSync(BRUT)) mkdirSync(BRUT, { recursive:true });
const features = [];
for(const [t, couche] of COUCHES){
  const fic = join(BRUT, couche.split(':')[1] + '.json');
  if(!existsSync(fic)){
    const url = `https://data.geopf.fr/wfs/ows?SERVICE=WFS&VERSION=2.0.0&REQUEST=GetFeature&TYPENAMES=${couche}&OUTPUTFORMAT=application/json&SRSNAME=EPSG:4326&COUNT=5000`;
    const r = await fetch(url); if(!r.ok) throw new Error(`${couche} : ${r.status}`);
    writeFileSync(fic, await r.text());
  }
  const brut = JSON.parse(readFileSync(fic, 'utf8'));
  if(brut.numberMatched && brut.numberMatched !== brut.features.length) throw new Error(`${couche} : ${brut.features.length} lus sur ${brut.numberMatched}`);
  let sansZone = 0;
  for(const f of brut.features){
    if(!f.geometry) continue;
    const p = f.properties;
    // Un site plus petit que la tolérance s'effondre en deux points : on le reprend dix fois plus fin, puis à
    // 0,00002° (2 m) - 67 sites, des îlots et des étangs, disparaissaient sinon. Seulement pour lui : reprendre
    // aussi les parcelles minuscules des grands sites doublait le fichier (292 -> 617 Ko gzippés).
    const trace = tol => polygones(f.geometry).map(poly => poly.map(r => douglasPeucker(r, tol)).filter(r => r.length >= 4)
      .map(r => r.map(([x, y]) => [+x.toFixed(tol >= TOL ? 4 : 5), +y.toFixed(tol >= TOL ? 4 : 5)]))).filter(poly => poly.length);
    const polys = [TOL, TOL / 10, 0.00002].map(trace).find(p => p.length);
    if(!polys) continue;
    const z = zonesEbird(polys); if(!z.length) sansZone++;
    const surf = p.surf_off || p.area_sig;
    const pr = { t, n:joliNom(p.nom_site), z };
    // Le périmètre de protection autour d'une réserve (19 sites) : dessiné en tirets, sans teinte.
    if(/p[ée]rim[eè]tre de protection/i.test(p.nom_site)) pr.p = 1;
    if(p.gest_site) pr.g = p.gest_site.trim();
    if(surf) pr.s = surf >= 10 ? Math.round(surf) : +surf.toFixed(1);
    if(p.date_crea) pr.a = +p.date_crea.slice(0, 4);
    if(p.id_mnhn) pr.i = p.id_mnhn;
    features.push({ type:'Feature', properties:pr, geometry:{ type:'MultiPolygon', coordinates:polys } });
  }
  console.log(`${t} : ${brut.features.length} sites${sansZone ? `, ${sansZone} sans zone eBird` : ''}`);
}
// Les plus grands d'abord : dessinés dessous, les petits restent cliquables par-dessus.
features.sort((a, b) => (b.properties.s || 0) - (a.properties.s || 0));
const json = JSON.stringify({ type:'FeatureCollection', features });
writeFileSync(SORTIE, json);
console.log(`${features.length} sites -> ${(json.length / 1024).toFixed(0)} Ko, ${(gzipSync(json).length / 1024).toFixed(0)} Ko gzippés (${SORTIE})`);

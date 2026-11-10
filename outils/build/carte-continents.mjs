// Cartes des continents pour la fiche espèce (2026-11-10). Choisir « Europe » ou « Monde » dans le
// sélecteur de la fiche montre chaque pays coloré selon SA rareté nationale. Un continent n'a pas
// de rareté à lui (choix de Mathis, le même jour, après avoir vu quatre façons de la calculer).
//
// Même format que les cartes de zones (data/regions-xx-simplified.json), pour que l'appli dessine
// les pays comme elle dessine des régions :
//   data/carte-continents/<cadre>.json = { viewBox, regions: { CC: { name, path } } }
//
// Chaque cadre dessine TOUS les pays qui y entrent, pas seulement ceux du groupe : sans la Russie,
// la carte de l'Asie aurait un trou à la place de la Sibérie. Les pays qui débordent sont coupés au
// bord du cadre (la Russie à l'est de l'Europe), plutôt que de rapetisser le continent pour les
// faire tenir.
//
// Un pays trop petit pour se voir (Malte, la plupart des îles des Caraïbes et du Pacifique) reçoit
// un point, ajouté à son tracé : sans lui, il disparaîtrait de la carte qui sert à le comparer.
//
// Source : data/carte-pays.json (outils/build/carte-pays.mjs). Usage : node outils/build/carte-continents.mjs
import fs from 'node:fs';
import { geoArea, geoPath, geoEqualEarth, geoConicEqualArea, geoAzimuthalEqualArea } from 'd3-geo';

const RACINE = new URL('../../', import.meta.url);
const W = 1000;
// Un pays dont le tracé couvre moins que ce point (en unités du viewBox au carré) reçoit un point de
// RAYON_POINT. Le viewBox fait 1000 de large ; la carte de la fiche s'affiche sur 300 à 500 px.
const RAYON_POINT = 4;
const AIRE_MINI = Math.PI * RAYON_POINT * RAYON_POINT;

// Le cadre se donne en degrés (ouest, sud, est, nord), l'est pouvant dépasser 180 quand il passe
// l'antiméridien (Océanie). La projection est tournée sur le centre du cadre.
const CADRES = {
  monde:              { proj: () => geoEqualEarth().rotate([-10, 0]), sphere: true },
  europe:             { proj: () => geoConicEqualArea().rotate([-15, 0]).parallels([40, 65]), bbox: [-25, 34, 45, 71.5] },
  'amerique-du-nord': { proj: () => geoConicEqualArea().rotate([100, 0]).parallels([20, 60]), bbox: [-170, 6.5, -50, 83.5] },
  'amerique-du-sud':  { proj: () => geoAzimuthalEqualArea().rotate([60, 20]), bbox: [-92.5, -56.5, -33, 13.5] },
  afrique:            { proj: () => geoAzimuthalEqualArea().rotate([-18, -2]), bbox: [-26, -35.5, 64, 38] },
  asie:               { proj: () => geoConicEqualArea().rotate([-90, 0]).parallels([15, 50]), bbox: [25, -11.5, 150, 56] },
  oceanie:            { proj: () => geoAzimuthalEqualArea().rotate([-172, 18]), bbox: [110, -48, 232, 22] },
  antarctique:        { proj: () => geoAzimuthalEqualArea().rotate([0, 90]), sud: -46 },
};

// d3 suit l'enroulement sphérique : un anneau dans l'autre sens dessine la Terre entière moins le
// pays. On retourne les polygones dont l'aire dépasse une demi-sphère.
// L'Antarctique descend au pôle le long de l'antiméridien (180,-84 -> 180,-90 -> -180,-90) : vu du pôle,
// ce va-et-vient dessinait un trait blanc en travers du continent. Sans ces points, l'anneau fait
// simplement le tour du pôle, ce que d3 sait dessiner.
function remettreDroit(geom){
  const brut = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
  const polys = brut.map(p => p.map(r => r.filter(([, lat]) => lat > -89.99)));
  const ok = polys.map(p => geoArea({ type: 'Polygon', coordinates: p }) > 2 * Math.PI ? p.map(r => r.slice().reverse()) : p);
  return { type: 'MultiPolygon', coordinates: ok };
}
// Les points qui bornent un cadre, pris le long de ses bords (une projection conique courbe les
// parallèles : les quatre coins seuls ne suffisent pas).
function bordsDuCadre([o, s, e, n]){
  const pts = [];
  for(let i = 0; i <= 24; i++){
    const lon = o + (e - o) * i / 24, lat = s + (n - s) * i / 24;
    pts.push([lon, s], [lon, n], [o, lat], [e, lat]);
  }
  return { type: 'MultiPoint', coordinates: pts.map(([x, y]) => [x > 180 ? x - 360 : x, y]) };
}
// Tracé au dixième d'unité. Un point à moins de « pas » du précédent est sauté : à 1000 unités pour
// 300 à 500 px affichés, un détail sous l'unité ne se voit pas, et il faisait l'essentiel du poids.
function contexte(pas){
  let d = '', lx = null, ly = null;
  const r = v => Math.round(v * 10) / 10;
  return {
    moveTo(x, y){ x = r(x); y = r(y); d += 'M' + x + ',' + y; lx = x; ly = y; },
    lineTo(x, y){ x = r(x); y = r(y); if(Math.hypot(x - lx, y - ly) < pas) return; d += 'L' + x + ',' + y; lx = x; ly = y; },
    closePath(){ d += 'Z'; },
    arc(){},
    texte: () => d,
  };
}

const pays = JSON.parse(fs.readFileSync(new URL('data/carte-pays.json', RACINE), 'utf8')).features;
// Un pays peut venir en plusieurs morceaux (outre-mer, îles) : on les réunit sous son code.
const parCode = new Map();
for(const f of pays){
  const cc = f.properties.cc;
  const g = remettreDroit(f.geometry);
  const e = parCode.get(cc);
  if(e) e.geom.coordinates.push(...g.coordinates);
  else parCode.set(cc, { nom: f.properties.nom, geom: g });
}

const dossier = new URL('data/carte-continents/', RACINE);
fs.mkdirSync(dossier, { recursive: true });
let total = 0;
for(const [nom, cadre] of Object.entries(CADRES)){
  const proj = cadre.proj();
  // La hauteur suit la forme du cadre : on cale d'abord sur une largeur de 1000, puis on lit la
  // hauteur obtenue.
  const cible = cadre.sphere ? { type: 'Sphere' }
    : cadre.sud != null ? { type: 'MultiPoint', coordinates: Array.from({ length: 72 }, (_, i) => [i * 5 - 180, cadre.sud]) }
    : bordsDuCadre(cadre.bbox);
  proj.fitWidth(W - 20, cible);
  const [[x0, y0], [x1, y1]] = geoPath(proj).bounds(cible);
  const H = Math.ceil(y1 - y0 + 20);
  proj.fitExtent([[10, 10], [W - 10, H - 10]], cible);
  if(!cadre.sphere) proj.clipExtent([[0, 0], [W, H]]);
  const chemin = geoPath(proj);
  const regions = {};
  let points = 0;
  for(const [cc, { nom: n, geom }] of parCode){
    const ctx = contexte(cadre.sphere ? 1.5 : 0.8);
    geoPath(proj, ctx)(geom);
    let d = ctx.texte();
    const aire = d ? chemin.area(geom) : 0;
    if(aire < AIRE_MINI){
      // Le point se pose au centre de ce qui est visible ; un pays hors du cadre n'en reçoit pas.
      const [cx, cy] = chemin.centroid(geom);
      if(!(cx >= 0 && cx <= W && cy >= 0 && cy <= H)) { if(!d) continue; }
      else {
        const R = RAYON_POINT;
        d += 'M' + (Math.round((cx - R) * 10) / 10) + ',' + (Math.round(cy * 10) / 10)
          + 'a' + R + ',' + R + ' 0 1,0 ' + (2 * R) + ',0a' + R + ',' + R + ' 0 1,0 ' + (-2 * R) + ',0Z';
        points++;
      }
    }
    if(d) regions[cc] = { name: n, path: d };
  }
  const json = JSON.stringify({ viewBox: `0 0 ${W} ${H}`, regions });
  fs.writeFileSync(new URL(nom + '.json', dossier), json);
  total += json.length;
  console.log(nom.padEnd(17), Object.keys(regions).length, 'pays,', points, 'en point,', 'viewBox 1000x' + H + ',', Math.round(json.length / 1024), 'Ko');
}
console.log('Total', Math.round(total / 1024), 'Ko');

// Contours des 96 départements pour la page Carte : data/carte-departements.json.
// Repris de la maquette de la refonte (notes-privees/maquettes/carte/outils/prepare.mjs, 2026-10-23).
// Source : outils/config/departements-fr.geojson, déjà dans le dépôt (le même que pour la démo).
// Chaque département porte son code eBird (FR-PDL-85 ; Paris FR-IDF-75C), celui que l'appli
// interroge, lu dans les clés de data/departements-fr-simplified.json : on ne le refabrique pas.
// Lancer depuis la racine du dépôt : node outils/build/carte-departements.mjs
import fs from 'node:fs';

const TOLERANCE = Number(process.env.TOL || 0.004);   // degrés, ~400 m
const DECIMALES = Number(process.env.DEC || 3);       // 3 décimales = ~110 m

// Douglas-Peucker sur un anneau. Un anneau est fermé : son premier et son dernier point sont le
// même, la corde aurait une longueur nulle et rien ne serait gardé ; on le coupe donc en deux.
function simplifie(pts, tol) {
  if (pts.length < 5) return pts;
  const mi = pts.length >> 1;
  const garde = new Uint8Array(pts.length); garde[0] = garde[mi] = garde[pts.length - 1] = 1;
  const pile = [[0, mi], [mi, pts.length - 1]];
  while (pile.length) {
    const [a, b] = pile.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-12;
    let max = 0, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L;
      if (d > max) { max = d; idx = i; }
    }
    if (max > tol && idx > 0) { garde[idx] = 1; pile.push([a, idx], [idx, b]); }
  }
  const p = 10 ** DECIMALES;
  const r = pts.filter((_, i) => garde[i]).map(([x, y]) => [Math.round(x * p) / p, Math.round(y * p) / p]);
  return r.length >= 4 ? r : pts;
}
const simplGeom = g => g.type === 'Polygon'
  ? { type: 'Polygon', coordinates: g.coordinates.map(r => simplifie(r, TOLERANCE)) }
  : { type: 'MultiPolygon', coordinates: g.coordinates.map(p => p.map(r => simplifie(r, TOLERANCE))) };

const codesEbird = Object.keys(JSON.parse(fs.readFileSync('data/departements-fr-simplified.json', 'utf8')).deps);
const ebirdDe = Object.fromEntries(codesEbird.map(k => [k.split('-')[2], k]));
ebirdDe['75'] ??= 'FR-IDF-75C';   // Paris manque au fichier simplifié ; eBird le nomme ainsi

const deps = JSON.parse(fs.readFileSync('outils/config/departements-fr.geojson', 'utf8'));
const sortie = {
  type: 'FeatureCollection',
  features: deps.features.map(f => ({
    type: 'Feature',
    properties: { code: f.properties.code, nom: f.properties.nom, ebird: ebirdDe[f.properties.code] || null },
    geometry: simplGeom(f.geometry),
  })),
};
const sans = sortie.features.filter(f => !f.properties.ebird).map(f => f.properties.code);
if (sans.length) throw new Error('départements sans code eBird : ' + sans.join(', '));
const texte = JSON.stringify(sortie);
fs.writeFileSync('data/carte-departements.json', texte);
console.log(`${sortie.features.length} départements, ${(texte.length / 1024).toFixed(0)} Ko (tolérance ${TOLERANCE}°, ${DECIMALES} décimales)`);

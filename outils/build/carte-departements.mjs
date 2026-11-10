// Contours des 96 départements pour la page Carte : data/carte-departements.json.
// Repris de la maquette de la refonte (notes-privees/maquettes/carte/outils/prepare.mjs, 2026-10-23).
// Source depuis le 2026-10-26 : outils/config/departements-ign.geojson et regions-ign.geojson, IGN Admin
// Express COG 2018 (Licence Ouverte), mis en GeoJSON par github.com/gregoiredavid/france-geojson
// (departements.geojson, regions.geojson : 25 % des points de l'IGN). Les anciens departements-fr et
// regions-fr.geojson étaient leur « version simplifiée » (5 %) : 363 sommets pour la Loire-Atlantique,
// la côte du Croisic coupée en ligne droite et des points du département dessinés dehors (Mathis). Ils
// restent pour la démo et la mini-carte de la fiche, qui les lisent encore.
// SRC_DEP, SRC_REG : pour essayer une autre source.
// Chaque département porte son code eBird (FR-PDL-85 ; Paris FR-IDF-75C), celui que l'appli
// interroge, lu dans les clés de data/departements-fr-simplified.json : on ne le refabrique pas.
// Lancer depuis la racine du dépôt : node outils/build/carte-departements.mjs
import fs from 'node:fs';

// 0,002° : la valeur des fichiers en ligne depuis le 2026-10-26 (relancé à 0,002 et à 0,004 le 2026-11-10,
// seul 0,002 redonne le fichier publié octet pour octet ; le 0,004 écrit ici avant était faux).
const TOLERANCE = Number(process.env.TOL || 0.002);   // degrés, ~200 m
const DECIMALES = Number(process.env.DEC || 3);       // 3 décimales = ~110 m

// Une frontière commune se simplifie UNE fois, pour les deux côtés (2026-11-10). Avant, chaque contour
// l'était seul : le Douglas-Peucker ne gardait pas les mêmes points des deux côtés d'une même frontière,
// et deux voisins se croisaient en dessinant des triangles (Vendée et Charente-Maritime sur la Sèvre
// niortaise, vu par Mathis). Mesuré ce jour-là : 2 625 sommets de départements hors de la ligne de leur
// voisin, jusqu'à 5,5 km ; 603 sommets des régions hors du trait de leurs départements. La source IGN,
// elle, partage chaque sommet à l'identique : l'erreur venait d'ici.
// Méthode (celle de TopoJSON) : départements ET régions vont dans un même lot, puisque le trait d'une
// région se dessine par-dessus ceux de ses départements. Un sommet est un « nœud » quand ses voisins,
// tous contours confondus, sont plus de deux : c'est là qu'une frontière commence ou finit. Chaque
// contour se coupe à ses nœuds en « arcs » ; un arc se simplifie une seule fois, dans un sens fixé, et
// le voisin qui le parcourt à l'envers en reçoit la copie retournée.
const cle = p => p[0] + ',' + p[1];
const avant = (p, q) => p[0] < q[0] || (p[0] === q[0] && p[1] < q[1]);   // ordre fixe entre deux points
const ARRONDI = 10 ** DECIMALES;
const arrondi = ([x, y]) => [Math.round(x * ARRONDI) / ARRONDI, Math.round(y * ARRONDI) / ARRONDI];

// Douglas-Peucker sur une ligne, extrémités gardées. Une ligne fermée (île, enclave : premier point =
// dernier) aurait une corde de longueur nulle et rien ne serait gardé : on la coupe donc en deux.
function douglas(pts, tol) {
  const n = pts.length;
  if (n < 3) return pts;
  const garde = new Uint8Array(n); garde[0] = garde[n - 1] = 1;
  const pile = [];
  if (cle(pts[0]) === cle(pts[n - 1])) { const mi = n >> 1; garde[mi] = 1; pile.push([0, mi], [mi, n - 1]); }
  else pile.push([0, n - 1]);
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
  return pts.filter((_, i) => garde[i]);
}
// Arrondi, puis sans les points répétés que l'arrondi fait naître.
const nettoie = pts => pts.map(arrondi).filter((p, i, a) => i === 0 || cle(p) !== cle(a[i - 1]));

// Les anneaux du lot, sans leur point de fermeture répété.
const anneauxDe = g => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).flat();
const ouvert = r => (cle(r[0]) === cle(r[r.length - 1]) ? r.slice(0, -1) : r);

function noeudsDu(lot) {
  const voisins = new Map();
  for (const g of lot) for (const r0 of anneauxDe(g)) {
    const r = ouvert(r0), n = r.length;
    for (let i = 0; i < n; i++) {
      const k = cle(r[i]);
      if (!voisins.has(k)) voisins.set(k, new Set());
      voisins.get(k).add(cle(r[(i + n - 1) % n])).add(cle(r[(i + 1) % n]));
    }
  }
  return new Set([...voisins].filter(([, s]) => s.size > 2).map(([k]) => k));
}

const arcsFaits = new Map();
let anneauxDegeneres = 0;
// Un arc, simplifié une fois dans son sens fixé ; rendu dans le sens demandé.
function arcSimplifie(pts, tol) {
  const n = pts.length;
  let sens = avant(pts[0], pts[n - 1]) || (cle(pts[0]) === cle(pts[n - 1]) && avant(pts[1], pts[n - 2]));
  const fixe = sens ? pts : [...pts].reverse();
  const k = cle(fixe[0]) + '>' + cle(fixe[1]) + '>' + cle(fixe[n - 1]) + '>' + n;
  if (!arcsFaits.has(k)) {
    let r = nettoie(douglas(fixe, tol));
    // Un îlot (arc fermé) réduit à moins de 4 points ne se dessinerait plus : on le garde entier,
    // comme le faisait l'ancien script. Gardé dans l'arc, le même pour ses deux propriétaires.
    const ferme = cle(fixe[0]) === cle(fixe[n - 1]);
    if (r.length < 2 || (ferme && r.length < 4)) r = nettoie(fixe);
    arcsFaits.set(k, r);
  }
  const r = arcsFaits.get(k);
  return sens ? r : [...r].reverse();
}

function simplAnneau(r0, noeuds, tol) {
  let r = ouvert(r0);
  const n = r.length;
  const idx = [];
  for (let i = 0; i < n; i++) if (noeuds.has(cle(r[i]))) idx.push(i);
  let morceaux;
  if (!idx.length) {
    // Anneau sans nœud (une île, entière dans un département et dans sa région) : départ fixé au plus
    // petit point, pour que les deux contours qui le portent le coupent au même endroit.
    let m = 0;
    for (let i = 1; i < n; i++) if (avant(r[i], r[m])) m = i;
    r = [...r.slice(m), ...r.slice(0, m)];
    morceaux = [[...r, r[0]]];
  } else {
    r = [...r.slice(idx[0]), ...r.slice(0, idx[0])];
    const coupes = idx.map(i => i - idx[0]);
    morceaux = coupes.map((c, j) => r.slice(c, (coupes[j + 1] ?? n) + 1).concat(j === coupes.length - 1 ? [r[0]] : []));
  }
  const sortie = [];
  for (const m of morceaux) {
    const a = arcSimplifie(m, tol);
    for (const p of (sortie.length ? a.slice(1) : a)) if (!sortie.length || cle(p) !== cle(sortie[sortie.length - 1])) sortie.push(p);
  }
  if (cle(sortie[0]) !== cle(sortie[sortie.length - 1])) sortie.push(sortie[0]);
  if (sortie.length < 4) anneauxDegeneres++;
  return sortie;
}
const simplGeom = (g, noeuds) => g.type === 'Polygon'
  ? { type: 'Polygon', coordinates: g.coordinates.map(r => simplAnneau(r, noeuds, TOLERANCE)) }
  : { type: 'MultiPolygon', coordinates: g.coordinates.map(p => p.map(r => simplAnneau(r, noeuds, TOLERANCE))) };

const codesEbird = Object.keys(JSON.parse(fs.readFileSync('data/departements-fr-simplified.json', 'utf8')).deps);
const ebirdDe = Object.fromEntries(codesEbird.map(k => [k.split('-')[2], k]));
ebirdDe['75'] ??= 'FR-IDF-75C';   // Paris manque au fichier simplifié ; eBird le nomme ainsi

const deps = JSON.parse(fs.readFileSync(process.env.SRC_DEP || 'outils/config/departements-ign.geojson', 'utf8'));
const regions = JSON.parse(fs.readFileSync(process.env.SRC_REG || 'outils/config/regions-ign.geojson', 'utf8'));
// Les nœuds se cherchent sur le lot entier, départements et régions ensemble.
const noeuds = noeudsDu([...deps.features, ...regions.features].map(f => f.geometry));
const sortie = {
  type: 'FeatureCollection',
  features: deps.features.map(f => ({
    type: 'Feature',
    properties: { code: f.properties.code, nom: f.properties.nom, ebird: ebirdDe[f.properties.code] || null },
    geometry: simplGeom(f.geometry, noeuds),
  })),
};
const sans = sortie.features.filter(f => !f.properties.ebird).map(f => f.properties.code);
if (sans.length) throw new Error('départements sans code eBird : ' + sans.join(', '));
const texte = JSON.stringify(sortie);
fs.writeFileSync('data/carte-departements.json', texte);
console.log(`${sortie.features.length} départements, ${(texte.length / 1024).toFixed(0)} Ko (tolérance ${TOLERANCE}°, ${DECIMALES} décimales)`);

// Les 13 régions : data/carte-regions.json, même simplification. Sur la carte de France, on clique
// d'abord une région, puis ses départements (choix de Mathis, 2026-10-23). Source :
// outils/config/regions-ign.geojson, codes INSEE. Le code eBird (FR-PDL) se lit sur les départements
// qui tombent dedans, plutôt que d'une table écrite à la main : un écart ferait échouer le script.
const dansAnneau = ([x, y], r) => {
  let dedans = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) dedans = !dedans;
  }
  return dedans;
};
const dansGeom = (p, g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates).some(poly => dansAnneau(p, poly[0]));
// Un point sûrement à l'intérieur d'un département : le milieu de ses sommets, ou à défaut un sommet.
const temoin = g => {
  const r = (g.type === 'Polygon' ? g.coordinates : g.coordinates.reduce((a, b) => (b[0].length > a[0].length ? b : a)))[0];
  const c = [r.reduce((s, p) => s + p[0], 0) / r.length, r.reduce((s, p) => s + p[1], 0) / r.length];
  return dansAnneau(c, r) ? c : r[0];
};
const sortieR = {
  type: 'FeatureCollection',
  features: regions.features.map(f => {
    const prefixes = new Set(deps.features.filter(d => dansGeom(temoin(d.geometry), f.geometry))
      .map(d => (ebirdDe[d.properties.code] || '').split('-').slice(0, 2).join('-')));
    if (prefixes.size !== 1) throw new Error(`région ${f.properties.nom} : codes eBird ${[...prefixes].join(', ') || 'aucun'}`);
    return { type: 'Feature', properties: { code: f.properties.code, nom: f.properties.nom, ebird: [...prefixes][0] }, geometry: simplGeom(f.geometry, noeuds) };
  }),
};
const texteR = JSON.stringify(sortieR);
fs.writeFileSync('data/carte-regions.json', texteR);
console.log(`${sortieR.features.length} régions, ${(texteR.length / 1024).toFixed(0)} Ko : ${sortieR.features.map(f => f.properties.ebird).join(' ')}`);
console.log(`${noeuds.size} nœuds, ${arcsFaits.size} arcs simplifiés une fois chacun, ${anneauxDegeneres} anneau(x) réduit(s) à moins de 4 points`);

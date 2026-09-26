#!/usr/bin/env node
/*
  contours-pays-entier.mjs - Contour d'un pays en UNE seule zone, pour ceux qu'eBird ne
  subdivise pas.

  POURQUOI
  Malte, le Kosovo et les Feroe n'ont aucune subdivision chez eBird : la colonne de sous-
  regions de leurs hotspots est vide, et pour Malte les 68 conseils locaux publies portent
  zero espece. La fiche espece masquait donc tout le panneau « Rarete par region » - et
  avec lui le selecteur de mois, qui est utile independamment du decoupage.

  On leur donne une carte d'une seule piece : le pays, colore par sa valeur NATIONALE. La
  zone porte le code du pays lui-meme (MT, XK, FO), ce qui la distingue d'une vraie zone -
  aucune n'a jamais un code de deux lettres, sauf les territoires absorbes (SJ, JE...) qui
  sont, eux, de vraies zones de leur pays d'accueil.

  Source : ne_10m_admin_0_map_units.geojson (le fichier admin-1 ne contient que des
  subdivisions, et n'a de ces trois pays que des fragments).

  Usage : node tools/build/contours-pays-entier.mjs <admin0.geojson> [MT,XK,FO]
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dir, '..', '..', 'data');
const W = 1000, H = 900;

// Code ISO alpha-3 de Natural Earth -> code eBird et nom francais. On apparie sur le code
// et non sur le libelle : Natural Earth ecrit « Faeroe Is. » dans NAME et « Faroe Islands »
// dans name, si bien qu'un appariement par nom ratait les Feroe selon le champ interroge.
const PAYS = {
  MT: { a3: 'MLT', nom: 'Malte' },
  XK: { a3: 'KOS', nom: 'Kosovo' },
  FO: { a3: 'FRO', nom: 'Îles Féroé' },
};

const [, , src, filtre] = process.argv;
if (!src) { console.error('Usage : node contours-pays-entier.mjs <admin0.geojson> [MT,XK,FO]'); process.exit(1); }
const cibles = filtre ? filtre.split(',').map(s => s.trim().toUpperCase()) : Object.keys(PAYS);

const g = JSON.parse(readFileSync(src, 'utf8'));
const a3De = p => p.adm0_a3 || p.ADM0_A3 || '';

function perpDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}
function simplifier(pts, tol) {
  if (pts.length < 3) return pts;
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], pts[0], pts[pts.length - 1]);
    if (d > max) { max = d; idx = i; }
  }
  if (max > tol) return simplifier(pts.slice(0, idx + 1), tol).slice(0, -1).concat(simplifier(pts.slice(idx), tol));
  return [pts[0], pts[pts.length - 1]];
}

for (const cc of cibles) {
  const def = PAYS[cc];
  if (!def) { console.warn(`${cc} : pays inconnu de la table, ignore.`); continue; }
  const f = g.features.find(x => a3De(x.properties) === def.a3);
  if (!f) { console.warn(`${cc} : code ${def.a3} introuvable dans ${src}.`); continue; }

  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
  const anneaux = [];
  for (const poly of polys) for (const ring of poly) anneaux.push(ring);

  let mnx = Infinity, mxx = -Infinity, mny = Infinity, mxy = -Infinity;
  for (const r of anneaux) for (const [x, y] of r) {
    if (x < mnx) mnx = x; if (x > mxx) mxx = x;
    if (y < mny) mny = y; if (y > mxy) mxy = y;
  }
  const midLat = (mny + mxy) / 2, kx = Math.cos(midLat * Math.PI / 180);
  const spanX = (mxx - mnx) * kx || 1e-6, spanY = (mxy - mny) || 1e-6;
  const box = [W * 0.02, H * 0.02, W * 0.96, H * 0.96];
  const k = Math.min(box[2] / spanX, box[3] / spanY);
  const offX = box[0] + (box[2] - spanX * k) / 2, offY = box[1] + (box[3] - spanY * k) / 2;
  const proj = ([lon, lat]) => [offX + (lon - mnx) * kx * k, offY + (mxy - lat) * k];

  const tol = Math.max(0.0004, Math.max(mxx - mnx, mxy - mny) * 0.0007);
  const chemins = [];
  for (const r of anneaux) {
    const s = simplifier(r, tol);
    if (s.length < 4) continue;
    chemins.push('M' + s.map(p => { const q = proj(p); return q[0].toFixed(1) + ',' + q[1].toFixed(1); }).join(' L') + ' Z');
  }
  if (!chemins.length) { console.warn(`${cc} : aucun anneau retenu.`); continue; }

  const payload = { viewBox: `0 0 ${W} ${H}`, regions: { [cc]: { name: def.nom, path: chemins.join(' ') } } };
  const dest = join(OUT, `regions-${cc.toLowerCase()}-simplified.json`);
  writeFileSync(dest, JSON.stringify(payload));
  console.log(`${cc} : ${anneaux.length} anneaux -> ${chemins.length} retenus, ${(JSON.stringify(payload).length / 1024).toFixed(1)} Ko`);
}

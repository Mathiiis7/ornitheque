// Aires iNaturalist Open Range Map (Geomodel, CC BY) posées sur la grille de 0,25° des cartes. Partagé par
// teintes-inat.mjs (la teinte « aire estimée » sous la carte) et cartes-gbif.mjs (les observations isolées ne
// comblent une case que dans l'aire, depuis le 2026-10-22).
// Entrées : notes-privees/essai-cartes/inat-aires/iNaturalist_geomodel_Aves_{1,2}.gpkg (stockage public
// d'iNaturalist, version 2.34, 6 981 aires, téléchargés le 2026-10-21).
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export const NI = 1440, NJ = 720, CASE = 0.25;

// ---------- géométrie GeoPackage : en-tête « GP », puis WKB (Polygon 3, MultiPolygon 6) ----------
export function polygones(blob) {
  const b = Buffer.from(blob.buffer, blob.byteOffset, blob.byteLength);
  if (b[0] !== 0x47 || b[1] !== 0x50) throw new Error('pas une géométrie GeoPackage');
  const env = (b[3] >> 1) & 7, taille = [0, 32, 48, 48, 64][env];
  let p = 8 + taille;
  const lire = () => {
    const le = b[p] === 1; p += 1;
    const u32 = () => { const v = le ? b.readUInt32LE(p) : b.readUInt32BE(p); p += 4; return v; };
    const f64 = () => { const v = le ? b.readDoubleLE(p) : b.readDoubleBE(p); p += 8; return v; };
    const type = u32() % 1000;
    if (type === 3) {
      const anneaux = [];
      for (let r = u32(); r > 0; r--) { const pts = []; for (let n = u32(); n > 0; n--) pts.push([f64(), f64()]); anneaux.push(pts); }
      return [anneaux];
    }
    if (type === 6) { const out = []; for (let n = u32(); n > 0; n--) out.push(...lire()); return out; }
    throw new Error('type WKB ' + type);
  };
  return lire();
}

// ---------- polygone -> cases dont le centre est dedans ----------
// Pair-impair à l'intérieur d'un polygone (ses trous), OU entre polygones (certaines aires ont des polygones
// qui se recouvrent : un OU exclusif les annulait, vu sur la Pie bavarde le 2026-10-21).
// Antiméridien : un polygone dont deux sommets voisins sont à plus de 180° d'écart le traverse. Ses longitudes
// négatives sont alors décalées de +360, et les cases ramenées modulo 1440 ; sans ça, le balayage remplissait
// toute la bande de latitude.
export const stat = { traversent: 0, polygones: 0 };
export function rasteriser(polys, g) {
  for (const anneaux of polys) {
    stat.polygones++;
    let traverse = false;
    for (const a of anneaux) for (let q = 1; q < a.length && !traverse; q++) if (Math.abs(a[q][0] - a[q - 1][0]) > 180) traverse = true;
    const ann = traverse ? anneaux.map(a => a.map(([x, y]) => [x < 0 ? x + 360 : x, y])) : anneaux;
    if (traverse) stat.traversent++;
    // cadre sur TOUS les anneaux : le premier n'est pas toujours le contour extérieur
    let x0 = Infinity, x1 = -Infinity, y0 = 90, y1 = -90;
    for (const a of ann) for (const [x, y] of a) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    const i0 = Math.floor((x0 + 180) / CASE), i1 = Math.floor((x1 + 180) / CASE);
    const j0 = Math.max(0, Math.floor((90 - y1) / CASE)), j1 = Math.min(NJ - 1, Math.floor((90 - y0) / CASE));
    for (let j = j0; j <= j1; j++) {
      const lat = 90 - (j + 0.5) * CASE, xs = [];
      for (const a of ann) for (let q = 0, p = a.length - 1; q < a.length; p = q++) {
        const [xa, ya] = a[p], [xb, yb] = a[q];
        if ((ya > lat) !== (yb > lat)) xs.push(xa + (lat - ya) / (yb - ya) * (xb - xa));
      }
      xs.sort((a, b) => a - b);
      for (let t = 0; t + 1 < xs.length; t += 2) {
        const ia = Math.max(i0, Math.ceil((xs[t] + 180) / CASE - 0.5)), ib = Math.min(i1, Math.floor((xs[t + 1] + 180) / CASE - 0.5));
        for (let i = ia; i <= ib; i++) g[j * NI + (((i % NI) + NI) % NI)] = 1;
      }
    }
  }
}

// ---------- les aires d'espèce d'un dossier de GeoPackage, lues à la demande ----------
// aire(nom, grille) remplit la grille mondiale (NI x NJ, remise à zéro) et rend true, ou rend false si
// iNaturalist n'a pas d'aire sous ce nom exact (pas de renommage : une aire mal rattachée serait pire
// qu'une aire absente).
export function ouvrirAires(dossier) {
  const ou = new Map();
  for (const f of fs.readdirSync(dossier).filter(f => f.endsWith('.gpkg')).sort()) {
    const db = new DatabaseSync(path.join(dossier, f), { readOnly: true });
    const table = db.prepare("SELECT table_name FROM gpkg_contents WHERE data_type = 'features'").get().table_name;
    const geom = db.prepare(`SELECT geom FROM "${table}" WHERE fid = ?`);
    for (const r of db.prepare(`SELECT fid, name FROM "${table}" WHERE rank = 'species'`).iterate()) ou.set(r.name, [geom, r.fid]);
  }
  return {
    taille: ou.size,
    aire(nom, grille) {
      const o = ou.get(nom);
      if (!o) return false;
      grille.fill(0);
      rasteriser(polygones(o[0].get(o[1]).geom), grille);
      return true;
    },
  };
}

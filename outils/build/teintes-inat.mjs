// Teinte « aire estimée » sous les cartes de répartition (décidé par Mathis le 2026-10-21, temporaire en
// attendant un modèle à nous) : l'aire iNaturalist Open Range Map (Geomodel, CC BY) posée sur notre grille
// de 0,25°, sur TOUTE l'aire (choix de Mathis, pas la limite de 110 km de la maquette).
//
// Entrées : notes-privees/essai-cartes/inat-aires/iNaturalist_geomodel_Aves_{1,2}.gpkg (stockage public
//   d'iNaturalist, version 2.34, 6 981 aires, téléchargés le 2026-10-21) ; data/cartes-index.json et les
//   cartes annuelles <code>-a.png, pour la règle des 80 %.
// Sortie : <ornitheque-data>/cartes/<code>-t.png (niveaux de gris, 1 = dans l'aire, cadre rogné sur l'aire)
//   et data/cartes-teintes.json {nom scientifique: [i0, j0, largeur, hauteur]} ; bilan détaillé dans
//   notes-privees/essai-cartes/inat-aires/bilan.json.
//
// La teinte contient AUSSI les cases colorées : c'est le navigateur qui les retire au moment d'afficher.
// Elle reste donc juste quand les cartes sont régénérées ; seule la règle des 80 % est à refaire.
// Règle des 80 % : une aire est refusée quand moins de 80 % de nos cases colorées tombent dedans (celle de
// la Pie bavarde ne couvre ni l'Europe continentale ni l'Asie : 0 %, mesuré le 2026-10-21).
// Noms : seulement les noms identiques à ceux de l'appli. gbif-renommages.json a été fait pour GBIF, pas
// pour iNaturalist ; une aire mal rattachée serait pire qu'une aire absente.
//
// Usage : node outils/build/teintes-inat.mjs            (tout)
//         ESPECES="Upupa epops,Pica pica" node ...     (quelques espèces)
//         SORTIE=chemin node ...                        (ailleurs que dans ornitheque-data)
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { polygones, rasteriser, stat } from './aires-inat.mjs';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const AIRES = path.join(RACINE, 'notes-privees', 'essai-cartes', 'inat-aires');
const CARTES = path.join(RACINE, '..', 'ornitheque-data', 'cartes');
const SORTIE = process.env.SORTIE || CARTES;
const SEUL = process.env.ESPECES ? new Set(process.env.ESPECES.split(',').map(s => s.trim())) : null;
const NI = 1440, NJ = 720, CASE = 0.25, PART_MIN = 0.8;

// ---------- PNG en niveaux de gris ----------
function lireGris(fichier) {
  const b = fs.readFileSync(fichier);
  let p = 8, W = 0, H = 0; const idat = [];
  while (p < b.length) {
    const len = b.readUInt32BE(p), type = b.toString('latin1', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { W = d.readUInt32BE(0); H = d.readUInt32BE(4); if (d[8] !== 8 || d[9] !== 0) throw new Error('PNG inattendu ' + fichier); }
    if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const brut = zlib.inflateSync(Buffer.concat(idat)), o = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) {
    const f = brut[y * (W + 1)], l = brut.subarray(y * (W + 1) + 1, (y + 1) * (W + 1));
    for (let x = 0; x < W; x++) {
      const a = x ? o[y * W + x - 1] : 0, h = y ? o[(y - 1) * W + x] : 0, c = x && y ? o[(y - 1) * W + x - 1] : 0;
      let v = l[x];
      if (f === 1) v += a; else if (f === 2) v += h; else if (f === 3) v += (a + h) >> 1;
      else if (f === 4) { const q = a + h - c, pa = Math.abs(q - a), pb = Math.abs(q - h), pc = Math.abs(q - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? h : c; }
      o[y * W + x] = v & 255;
    }
  }
  return { W, H, o };
}
const bloc = (type, d) => { const t = Buffer.from(type), len = Buffer.alloc(4), crc = Buffer.alloc(4); len.writeUInt32BE(d.length); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, d]))); return Buffer.concat([len, t, d, crc]); };
// mêmes deux filtres que cartes-gbif.mjs (aucun, ou différence avec la ligne du dessus) : on garde le plus petit
function ecrireGris(fichier, W, H, octets) {
  let meilleur = null;
  for (const filtre of [0, 2]) {
    const brut = Buffer.alloc((W + 1) * H);
    for (let y = 0; y < H; y++) {
      brut[y * (W + 1)] = filtre;
      for (let x = 0; x < W; x++) brut[y * (W + 1) + 1 + x] = filtre === 2 ? (octets[y * W + x] - (y ? octets[(y - 1) * W + x] : 0)) & 255 : octets[y * W + x];
    }
    const z = zlib.deflateSync(brut, { level: 9 });
    if (!meilleur || z.length < meilleur.length) meilleur = z;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 0;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), bloc('IHDR', ihdr), bloc('IDAT', meilleur), bloc('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(fichier, png);
  return png.length;
}

// Lecture des GeoPackage et passage en cases : outils/build/aires-inat.mjs, partagé avec cartes-gbif.mjs.

// ---------- programme ----------
const index = JSON.parse(fs.readFileSync(path.join(RACINE, 'data', 'cartes-index.json'), 'utf8'));
// effort eBird par case (toutes espèces, depuis 2015), pour la « précision » : parmi les cases de l'aire où
// au moins 30 observations ont été faites, la part où l'espèce est colorée chez nous. Deux refus de plus,
// tirés de la lecture du bilan du 2026-10-21 (notes-privees/essai-cartes/inat-aires/bilan.json) :
// - précision sous 1 % : aires gonflées d'oiseaux de cage (Serin des Canaries 0,3 %, inséparables, Faisan de
//   Lady Amherst, Caille du Japon...) ; les espèces discrètes mais réelles commencent vers 1,3 % ;
// - aire qui couvre plus de la moitié des cases bien observées du MONDE avec une précision sous 10 % : les
//   oiseaux échappés partout (Perruche ondulée 89 %, Pintade de Numidie 93 %, Paon bleu, Calopsitte, Diamant
//   mandarin, Cygne noir). Les vrais grands migrateurs restent au-dessus de 16 % (Pluvier argenté 19 %).
// Des oiseaux de cage à petite aire passent encore (Padda de Java) : la teinte est temporaire.
const EFFORT = new Float32Array(fs.readFileSync(path.join(RACINE, 'notes-privees', 'essai-cartes', 'trous', 'effort-annuel.bin')).buffer.slice(0));
let RICHES_MONDE = 0;
for (const v of EFFORT) if (v >= 30) RICHES_MONDE++;
const PRECISION_MIN = 0.01, PART_MONDE_MAX = 0.5, PRECISION_MONDE_MIN = 0.1;
fs.mkdirSync(SORTIE, { recursive: true });
const teintes = {}, bilan = {};
let lues = 0, sansCarte = 0, refusees = 0, octets = 0;
const grille = new Uint8Array(NI * NJ);
for (const f of fs.readdirSync(AIRES).filter(f => f.endsWith('.gpkg')).sort()) {
  const db = new DatabaseSync(path.join(AIRES, f), { readOnly: true });
  const table = db.prepare("SELECT table_name FROM gpkg_contents WHERE data_type = 'features'").get().table_name;
  for (const r of db.prepare(`SELECT name, rank, geom, geomodel_version FROM "${table}"`).iterate()) {
    lues++;
    if (r.rank !== 'species' || (SEUL && !SEUL.has(r.name))) continue;
    const e = index[r.name];
    if (!e) { sansCarte++; continue; }
    const [code, a0, b0, w, h] = e;
    grille.fill(0);
    rasteriser(polygones(r.geom), grille);
    // cadre de l'aire ; une aire qui traverse l'antiméridien prend toute la largeur
    let i0 = NI, i1 = -1, j0 = NJ, j1 = -1, aire = 0;
    for (let k = 0; k < grille.length; k++) if (grille[k]) { aire++; const i = k % NI, j = (k - i) / NI; if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j; }
    const an = lireGris(path.join(CARTES, code + '-a.png'));
    let colorees = 0, dedans = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (an.o[y * w + x]) { colorees++; if (grille[(y + b0) * NI + x + a0]) dedans++; }
    const part = colorees ? dedans / colorees : 0;
    let riches = 0;
    for (let k = 0; k < grille.length; k++) if (grille[k] && EFFORT[k] >= 30) riches++;
    const precision = riches ? dedans / riches : 1;
    const fiche = { code, version: r.geomodel_version, aire, colorees, part: +part.toFixed(4), rapport: colorees ? +(aire / colorees).toFixed(2) : null, riches, precision: +precision.toFixed(4) };
    bilan[r.name] = fiche;
    if (!aire || part < PART_MIN) fiche.refusee = 'part';
    else if (precision < PRECISION_MIN) fiche.refusee = 'precision';
    else if (riches / RICHES_MONDE > PART_MONDE_MAX && precision < PRECISION_MONDE_MIN) fiche.refusee = 'partout';
    if (fiche.refusee) { refusees++; continue; }
    const W = i1 - i0 + 1, H = j1 - j0 + 1, o = new Uint8Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) o[y * W + x] = grille[(y + j0) * NI + x + i0];
    octets += ecrireGris(path.join(SORTIE, code + '-t.png'), W, H, o);
    teintes[r.name] = [i0, j0, W, H];
  }
}
// clés triées : un diff lisible d'une génération à l'autre
const tri = Object.fromEntries(Object.keys(teintes).sort().map(k => [k, teintes[k]]));
if (!SEUL) fs.writeFileSync(path.join(RACINE, 'data', 'cartes-teintes.json'), JSON.stringify(tri) + '\n');
fs.writeFileSync(path.join(AIRES, SEUL ? 'bilan-essai.json' : 'bilan.json'), JSON.stringify(bilan, null, 1));
console.log(`aires lues ${lues} | sans carte chez nous (nom différent ou espèce absente) ${sansCarte} | refusées ${refusees} | gardées ${Object.keys(teintes).length} | ${(octets / 1e6).toFixed(1)} Mo de PNG`);
console.log(`polygones ${stat.polygones}, dont ${stat.traversent} traversent l'antiméridien`);

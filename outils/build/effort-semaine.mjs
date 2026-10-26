// Effort d'observation SEMAINE PAR SEMAINE, commun à toutes les espèces : le gris « prospecté, oiseau pas
// noté » de l'animation de migration (choix de Mathis le 2026-10-26, maquette notes-privees/maquettes/migration-ebp/).
// Entrée : le téléchargement des cartes par semaine (gbif-tout-semaine.zip, DOI 10.15468/dl.wa632u), mêmes
// classes de jeux que outils/build/cartes-gbif.mjs (gbif-jeux.json ; les jeux « ecarter » ne comptent pas,
// un jeu absent de la table est une observation isolée). La semaine 52 est fondue dans la 51, comme les cartes.
// Valeur d'une case une semaine donnée :
//   0 = aucune observation d'oiseau ; 1 = peu prospecté (base eBird + atlas sous 30, ou isolées seules) ;
//   2 = prospecté (base >= 30, le seuil EFFORT_MIN sous lequel une case ne reçoit pas de fréquence).
// Sortie : <dépôt voisin>/ornitheque-data/cartes/effort-s.png, en niveaux de gris, QUATRE semaines par octet
// (2 bits chacune, la semaine 4b+q dans les bits 2q et 2q+1) : 13 grilles mondiales de 1440 x 720 empilées,
// 13,5 millions de pixels. Une semaine par octet en ferait 54 millions : Safari sur iPhone refuse un canvas
// de plus de 16,7 millions de pixels, et l'image décodée pèserait 216 Mo en mémoire.
// La base d'une semaine emprunte la moitié des deux semaines d'à côté là où elle est sous 300, comme les
// cartes : sans ça, une case grise pourrait être une case où la carte a bien calculé une fréquence.
// Usage : node outils/build/effort-semaine.mjs      (SORTIE=fichier.png pour écrire ailleurs)
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const SOURCES = path.join(RACINE, 'notes-privees', 'essai-cartes');
const SORTIE = process.env.SORTIE || path.join(RACINE, '..', 'ornitheque-data', 'cartes', 'effort-s.png');
const CASE = 0.25, NI = 1440, NJ = 720, N = NI * NJ, P = 52;
const EFFORT_MIN = 30, POIDS_VOISINS = 0.5, EMPRUNT_SOUS = 300;

const classe = new Map();
for (const j of JSON.parse(fs.readFileSync(path.join(SOURCES, 'gbif-jeux.json'), 'utf8')))
  classe.set(j.prefixe, j.classe === 'ecarter' ? -1 : (j.classe === 'isolees' ? 1 : 0));
// 52 x N en Float32 = 216 Mo ; les isolées ne servent qu'à dire « vu quelque chose » : un octet suffit
const base = new Float32Array(P * N), isolees = new Uint8Array(P * N);

const cacheCase = new Map();
function indexCase(code) {            // coin SUD-OUEST, comme dans cartes-gbif.mjs
  let k = cacheCase.get(code);
  if (k !== undefined) return k;
  const a = code.indexOf('LON'), b = code.indexOf('LAT');
  const dms = s => { const neg = s[0] === '-'; const [d, m, sec] = (neg ? s.slice(1) : s).split('-').map(Number); return (neg ? -1 : 1) * (d + m / 60 + sec / 3600); };
  const lon = dms(code.slice(a + 3, b)), lat = dms(code.slice(b + 3));
  const i = Math.round((lon + 180) / CASE), j = Math.round((90 - (lat + CASE)) / CASE);
  k = i >= 0 && i < NI && j >= 0 && j < NJ ? j * NI + i : -1;
  cacheCase.set(Buffer.from(code).toString(), k);
  return k;
}

const t0 = Date.now();
let col = null, lignes = 0;
function traiter(l) {
  if (l.endsWith('\r')) l = l.slice(0, -1);
  if (!l) return;
  if (!col) {
    col = Object.fromEntries(l.toLowerCase().split('\t').map((c, i) => [c, i]));
    if (col.semaine === undefined) throw new Error('pas de colonne « semaine » : ce n\'est pas le téléchargement par semaine');
    return;
  }
  const c = l.split('\t');
  if (++lignes % 10e6 === 0) console.log(lignes / 1e6, 'M lignes,', Math.round((Date.now() - t0) / 1000), 's');
  const cl = classe.has(c[col.jeu]) ? classe.get(c[col.jeu]) : 1;
  if (cl < 0) return;
  const s = Math.min(51, +c[col.semaine]), k = indexCase(c[col.cellcode]);
  if (k < 0 || !(s >= 0 && s < P)) return;
  if (cl) isolees[s * N + k] = 1; else base[s * N + k] += +c[col.n];
}
await new Promise((ok, ko) => {
  const entree = spawn('unzip', ['-p', path.join(SOURCES, 'gbif-tout-semaine.zip')]).stdout;
  entree.setEncoding('utf8');
  let reste = '';
  entree.on('data', morceau => { const ls = (reste + morceau).split('\n'); reste = ls.pop(); for (const l of ls) traiter(l); });
  entree.on('end', () => { traiter(reste); ok(); });
  entree.on('error', ko);
});

const BLOCS = P / 4, sortie = new Uint8Array(BLOCS * N);
const compte = [0, 0, 0];
for (let s = 0; s < P; s++) {
  const avant = ((s + P - 1) % P) * N, apres = ((s + 1) % P) * N, ici = s * N, bloc = (s >> 2) * N, dec = (s & 3) * 2;
  for (let k = 0; k < N; k++) {
    let b = base[ici + k];
    if (b < EMPRUNT_SOUS) b += POIDS_VOISINS * (base[avant + k] + base[apres + k]);
    const v = b >= EFFORT_MIN ? 2 : (b || isolees[ici + k]) ? 1 : 0;
    sortie[bloc + k] |= v << dec; compte[v]++;
  }
}

// PNG en niveaux de gris, 8 bits, filtre « ligne du dessus »
const crcChunk = (type, data) => {
  const len = Buffer.alloc(4), t = Buffer.from(type), crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
};
const W = NI, H = BLOCS * NJ, brut = Buffer.alloc((W + 1) * H);
for (let y = 0; y < H; y++) {
  brut[y * (W + 1)] = y ? 2 : 0;
  for (let x = 0; x < W; x++) brut[y * (W + 1) + 1 + x] = sortie[y * W + x] - (y ? sortie[(y - 1) * W + x] : 0) & 255;
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 0;
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), crcChunk('IHDR', ihdr), crcChunk('IDAT', zlib.deflateSync(brut, { level: 9 })), crcChunk('IEND', Buffer.alloc(0))]);
fs.writeFileSync(SORTIE, png);
console.log(`${lignes} lignes, ${Math.round((Date.now() - t0) / 1000)} s ; cases x semaines : ${compte[2]} prospectées, ${compte[1]} peu, ${compte[0]} vides ; ${path.basename(SORTIE)} ${(png.length / 1024).toFixed(0)} Ko`);

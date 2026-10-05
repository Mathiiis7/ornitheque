// Cartes de répartition et de migration de toutes les espèces, à partir des observations eBird
// publiées sur GBIF (CC BY 4.0). Remplace les cartes Status & Trends de Cornell (usage sur un site
// interdit sans accord écrit, voir docs/sources-cartes.md).
//
// Entrées (dans notes-privees/essai-cartes/, hors dépôt, produites le 2026-10-01) :
//   gbif-ebird.zip        téléchargement SQL, DOI 10.15468/dl.c7y4kg : (nom, mois, case, n), 45,9 M lignes MÉLANGÉES
//   gbif-autres.zip       DOI 10.15468/dl.rb9sut : espèces sans donnée eBird, toutes sources GBIF
//   taxonomie-ebird.json  les 11 167 espèces de l'appli ; gbif-renommages.json, gbif-autres-noms.json
// Sortie : <dépôt voisin>/ornitheque-data/cartes/<code>-a.png (année) et <code>-m.png (12 mois empilés),
//   plus cartes-index.json {nom scientifique: [code, i0, j0, largeur, hauteur, source]}.
//
// FORMAT : une grille de 1 pixel par case de 0,25°, en niveaux de gris, rognée sur l'aire de l'espèce.
// 0 = pas de valeur, 1..32 = rang de la fréquence. Le navigateur colore et rééchantillonne en Mercator
// (Leaflet étire l'image linéairement en Mercator, pas en latitude). Mesuré le 2026-10-05 sur 10 espèces :
// 1 à 160 Ko par espèce pour l'année et les 12 mois, contre 70 à 880 Ko en PNG couleur Mercator
// (≈ 2,7 Go pour 10 700 espèces, impossible sous le plafond de 1 Go de GitHub Pages).
//
// MÉTHODE : fréquence = observations de l'espèce / observations de tous les oiseaux, case par case et
// mois par mois (l'effort compte TOUTES les lignes, hybrides et « sp. » compris), lissée par un noyau
// gaussien de 1,4 case et ramenée vers la médiane de l'espèce quand l'effort est faible. Les trous de
// l'aire sont comblés (case vide avec au moins 5 voisines sur 8 occupées, deux passes). Le rang est
// calculé mois par mois : chaque carte raconte où l'espèce est la plus fréquente CE mois-là (choix de
// Mathis le 2026-10-05 ; des rangs communs aux 12 mois donnaient un juillet tout vert pour le rougegorge).
// Les espèces des « autres sources » n'ont pas d'effort : carte de présence, valeur = comptage lissé.
//
// La mémoire disponible est courte (8 Go dont ~1 libre) : le zip est relu PARTS fois, chaque passe ne
// garde que les espèces d'indice ≡ passe (modulo PARTS). Une passe lit le zip en ~100 s.
//
// Usage : node outils/build/cartes-gbif.mjs                       (tout)
//         ESPECES="Hirundo rustica,Apus apus" node ...             (quelques espèces, un seul passage)
//         SORTIE=chemin  PARTS=6  node ...
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const SOURCES = path.join(RACINE, 'notes-privees', 'essai-cartes');
const SORTIE = process.env.SORTIE || path.join(RACINE, '..', 'ornitheque-data', 'cartes');
const SEUL = process.env.ESPECES ? process.env.ESPECES.split(',').map(s => s.trim()) : null;
const PARTS = SEUL ? 1 : +(process.env.PARTS || 6);

const CASE = 0.25, NI = 1440, NJ = 720, N = NI * NJ;
const OBS_MIN = 2, EFFORT_MIN = 30, RETENUE = 300;
const SIGMA = 1.4, RAYON = 3, NIV = +(process.env.NIV || 32);
const VOISINS_DIJ = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

const lire = f => JSON.parse(fs.readFileSync(path.join(SOURCES, f), 'utf8'));
const taxo = lire('taxonomie-ebird.json');
const renommages = lire('gbif-renommages.json');
const autresNoms = lire('gbif-autres-noms.json');
const indexEspece = new Map(taxo.map((t, i) => [t.sciName, i]));
const codeDe = taxo.map(t => t.speciesCode);
fs.mkdirSync(SORTIE, { recursive: true });

// ---------- Noms ----------
// Nom GBIF -> indice de l'espèce de l'appli, ou -1 (hybride, « sp. », forme « / », inconnu).
// Trinômes (sous-espèces) ramenés à l'espèce ; noms d'une autre version de la taxonomie renvoyés par la
// table de renommage (les espèces que GBIF sépare et que l'appli range en sous-espèces s'ADDITIONNENT).
const cacheNom = new Map();
function especeDe(nom) {
  let r = cacheNom.get(nom);
  if (r !== undefined) return r;
  r = -1;
  if (!/ x |×|\bsp\.?$|spp?\.|\//.test(nom)) {
    const mots = nom.split(' ');
    const deux = mots.slice(0, 2).join(' ');
    for (const essai of [nom, renommages[nom], deux, renommages[deux]]) {
      if (essai !== undefined && indexEspece.has(essai)) { r = indexEspece.get(essai); break; }
    }
  }
  cacheNom.set(nom, r);
  return r;
}

// ---------- Cases ----------
const cacheCase = new Map();
function indexCase(code) {            // CRS4326RES0-15-0LON<d>-<m>-<s>LAT<d>-<m>-<s> : coin SUD-OUEST, signe sur la valeur entière
  let k = cacheCase.get(code);
  if (k !== undefined) return k;
  const a = code.indexOf('LON'), b = code.indexOf('LAT');
  const dms = s => { const neg = s[0] === '-'; const [d, m, sec] = (neg ? s.slice(1) : s).split('-').map(Number); return (neg ? -1 : 1) * (d + m / 60 + sec / 3600); };
  const lon = dms(code.slice(a + 3, b)), lat = dms(code.slice(b + 3));
  const i = Math.round((lon + 180) / CASE), j = Math.round((90 - (lat + CASE)) / CASE);
  k = i >= 0 && i < NI && j >= 0 && j < NJ ? j * NI + i : -1;
  cacheCase.set(code, k);
  return k;
}

// ---------- Lissage gaussien séparable (sur une fenêtre W x H) ----------
const NOYAU = Array.from({ length: 2 * RAYON + 1 }, (_, d) => Math.exp(-((d - RAYON) ** 2) / (2 * SIGMA * SIGMA)));
function lisser(src, W, H) {
  const tmp = new Float64Array(W * H), out = new Float64Array(W * H);
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let s = 0;
    for (let d = -RAYON; d <= RAYON; d++) { const ii = i + d; if (ii >= 0 && ii < W) s += NOYAU[d + RAYON] * src[j * W + ii]; }
    tmp[j * W + i] = s;
  }
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    let s = 0;
    for (let d = -RAYON; d <= RAYON; d++) { const jj = j + d; if (jj >= 0 && jj < H) s += NOYAU[d + RAYON] * tmp[jj * W + i]; }
    out[j * W + i] = s;
  }
  return out;
}

// ---------- Effort mondial par mois ----------
const effort = Array.from({ length: 12 }, () => new Float64Array(N));
let effortLisse = null, effortAn = null, effortAnLisse = null;
function preparerEffort() {
  effortLisse = effort.map(e => lisser(e, NI, NJ));
  effortAn = new Float64Array(N); effortAnLisse = new Float64Array(N);
  effort.forEach((e, m) => { for (let k = 0; k < N; k++) { effortAn[k] += e[k]; effortAnLisse[k] += effortLisse[m][k]; } });
}

// ---------- Une image d'une espèce : fréquences sur la fenêtre ----------
// obs : comptages bruts (fenêtre W x H) ; fenêtre repérée par (iw, jw) dans la grille mondiale.
// eff / effLis : effort brut et lissé du même mois (grille mondiale), ou null pour une carte de présence.
function valeursImage(obs, W, H, iw, jw, eff, effLis) {
  const res = new Float32Array(W * H).fill(NaN);
  const lis = lisser(obs, W, H);
  let mediane = 0;
  if (eff) {
    const brut = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = obs[y * W + x];
      if (v >= OBS_MIN) { const e = eff[(jw + y) * NI + iw + x]; if (e >= EFFORT_MIN) brut.push(v / e); }
    }
    if (!brut.length) return res;
    brut.sort((a, b) => a - b);
    mediane = brut[brut.length >> 1];
  }
  // cases occupées, puis deux fermetures : une case vide est comblée si >= 5 de ses 8 voisines sont occupées
  let present = new Uint8Array(W * H);
  for (let k = 0; k < W * H; k++) present[k] = obs[k] > 0 ? 1 : 0;
  for (let passe = 0; passe < 2; passe++) {
    const suite = present.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (present[y * W + x]) continue;
      let c = 0;
      for (const [dx, dy] of VOISINS_DIJ) { const xx = x + dx, yy = y + dy; if (xx >= 0 && xx < W && yy >= 0 && yy < H) c += present[yy * W + xx]; }
      if (c >= 5) suite[y * W + x] = 1;
    }
    present = suite;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const l = y * W + x;
    if (!present[l]) continue;
    if (eff) {
      const g = (jw + y) * NI + iw + x;
      if (effLis[g] < EFFORT_MIN || lis[l] < OBS_MIN) continue;
      res[l] = (lis[l] + RETENUE * mediane) / (effLis[g] + RETENUE);
    } else res[l] = lis[l];
  }
  return res;
}

// rang de chaque valeur parmi celles de la même image : 0..1
function rangs(valeurs) {
  const ref = Float32Array.from(valeurs.filter(x => !Number.isNaN(x))).sort();
  const t = new Float32Array(valeurs.length).fill(NaN);
  for (let k = 0; k < valeurs.length; k++) {
    const v = valeurs[k];
    if (Number.isNaN(v)) continue;
    let lo = 0, hi = ref.length;
    while (lo < hi) { const m = (lo + hi) >> 1; ref[m] <= v ? lo = m + 1 : hi = m; }
    t[k] = lo / ref.length;
  }
  return t;
}

// ---------- PNG en niveaux de gris ----------
const CRC_BLOC = (type, data) => {
  const t = Buffer.from(type), len = Buffer.alloc(4), crc = Buffer.alloc(4);
  len.writeUInt32BE(data.length); crc.writeUInt32BE(zlib.crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
};
function ecrireGris(fichier, W, H, octets) {
  let meilleur = null;
  for (const filtre of [0, 2]) {          // sans filtre, ou différence avec la ligne du dessus : on garde le plus petit
    const brut = Buffer.alloc((W + 1) * H);
    for (let y = 0; y < H; y++) {
      brut[y * (W + 1)] = filtre;
      for (let x = 0; x < W; x++) brut[y * (W + 1) + 1 + x] = filtre === 2 ? (octets[y * W + x] - (y ? octets[(y - 1) * W + x] : 0)) & 255 : octets[y * W + x];
    }
    const z = zlib.deflateSync(brut, { level: 9 });
    if (!meilleur || z.length < meilleur.length) meilleur = z;
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 0;
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), CRC_BLOC('IHDR', ihdr), CRC_BLOC('IDAT', meilleur), CRC_BLOC('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(fichier, png);
  return png.length;
}

// ---------- Une espèce : 12 mois (+ année) -> deux PNG ----------
// mois : tableau de 12 Map(case -> comptage). Rend [i0, j0, largeur, hauteur, octets] ou null.
const stat = { octets: 0, vides: 0 };
function carteEspece(code, mois, presenceSeule) {
  let i0 = NI, i1 = -1, j0 = NJ, j1 = -1;
  for (const g of mois) for (const k of g.keys()) {
    const i = k % NI, j = (k - i) / NI;
    if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j;
  }
  if (i1 < 0) return null;
  const P = RAYON + 2;
  const iw = Math.max(0, i0 - P), jw = Math.max(0, j0 - P);
  const W = Math.min(NI - 1, i1 + P) - iw + 1, H = Math.min(NJ - 1, j1 + P) - jw + 1;
  const dense = g => { const o = new Float64Array(W * H); for (const [k, v] of g) { const i = k % NI; o[(((k - i) / NI) - jw) * W + i - iw] = v; } return o; };
  const parMois = mois.map(dense);
  const an = new Float64Array(W * H);
  parMois.forEach(o => { for (let k = 0; k < an.length; k++) an[k] += o[k]; });
  const frames = [valeursImage(an, W, H, iw, jw, presenceSeule ? null : effortAn, effortAnLisse),
    ...parMois.map((o, m) => valeursImage(o, W, H, iw, jw, presenceSeule ? null : effort[m], effortLisse[m]))];
  // cadre commun aux 13 images
  let a0 = W, a1 = -1, b0 = H, b1 = -1;
  for (const f of frames) for (let l = 0; l < f.length; l++) if (!Number.isNaN(f[l])) {
    const x = l % W, y = (l - x) / W;
    if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y;
  }
  if (a1 < 0) { stat.vides++; return null; }
  const w = a1 - a0 + 1, h = b1 - b0 + 1;
  const quant = f => {
    const t = rangs(f), o = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const v = t[(y + b0) * W + x + a0]; o[y * w + x] = Number.isNaN(v) ? 0 : 1 + Math.min(NIV - 1, Math.floor(v * NIV)); }
    return o;
  };
  const pile = new Uint8Array(w * h * 12);
  frames.slice(1).forEach((f, m) => pile.set(quant(f), m * w * h));
  stat.octets += ecrireGris(path.join(SORTIE, code + '-a.png'), w, h, quant(frames[0]));
  stat.octets += ecrireGris(path.join(SORTIE, code + '-m.png'), w, 12 * h, pile);
  return [iw + a0, jw + b0, w, h];
}

// ---------- Programme ----------
const index = {};
const avecEbird = new Set();
const t0 = Date.now();
const secondes = () => Math.round((Date.now() - t0) / 1000) + ' s';
const selection = SEUL ? new Set(SEUL.map(n => indexEspece.get(n)).filter(i => i !== undefined)) : null;
if (SEUL) console.log('espèces choisies :', selection.size, 'sur', SEUL.length);

const CAP = Math.ceil(46e6 / PARTS * 1.3);
for (let passe = 0; passe < PARTS; passe++) {
  const sp = new Uint16Array(CAP), mo = new Uint8Array(CAP), ce = new Uint32Array(CAP), nn = new Uint32Array(CAP);
  let m = 0, entete = true, lignes = 0;
  const rl = readline.createInterface({ input: spawn('unzip', ['-p', path.join(SOURCES, 'gbif-ebird.zip')]).stdout, crlfDelay: Infinity });
  for await (const l of rl) {
    if (entete) { entete = false; continue; }
    const [nom, mois, code, n] = l.split('\t');
    const k = indexCase(code);
    if (k < 0) continue;
    lignes++;
    if (passe === 0) effort[mois - 1][k] += +n;
    const e = especeDe(nom);
    if (e < 0 || (selection ? !selection.has(e) : e % PARTS !== passe)) continue;
    if (m >= CAP) throw new Error('capacité dépassée');
    sp[m] = e; mo[m] = mois - 1; ce[m] = k; nn[m] = +n; m++;
  }
  console.log(`passe ${passe + 1}/${PARTS} : ${lignes} lignes lues, ${m} gardées, ${secondes()}`);
  if (passe === 0) { preparerEffort(); console.log('effort lissé', secondes()); }
  // tri par espèce (comptage), puis une carte par espèce
  const debut = new Uint32Array(taxo.length + 1);
  for (let r = 0; r < m; r++) debut[sp[r] + 1]++;
  for (let e = 0; e < taxo.length; e++) debut[e + 1] += debut[e];
  const ordre = new Uint32Array(m), pos = debut.slice(0, taxo.length);
  for (let r = 0; r < m; r++) ordre[pos[sp[r]]++] = r;
  let faites = 0;
  for (let e = 0; e < taxo.length; e++) {
    if (debut[e] === debut[e + 1]) continue;
    const mois = Array.from({ length: 12 }, () => new Map());
    for (let q = debut[e]; q < debut[e + 1]; q++) { const r = ordre[q]; mois[mo[r]].set(ce[r], (mois[mo[r]].get(ce[r]) || 0) + nn[r]); }
    avecEbird.add(e);
    const cadre = carteEspece(codeDe[e], mois, false);
    if (cadre) index[taxo[e].sciName] = [codeDe[e], ...cadre, 'e'];
    if (++faites % 500 === 0) console.log(`  ${faites} espèces de cette passe, ${Math.round(stat.octets / 1e6)} Mo, ${secondes()}`);
  }
  console.log(`passe ${passe + 1} terminée : ${faites} espèces, ${secondes()}`);
}

// Espèces sans donnée eBird : carte de présence tirée des autres sources GBIF (DOI 10.15468/dl.rb9sut)
if (!SEUL) {
  const parEsp = new Map();
  const rl = readline.createInterface({ input: spawn('unzip', ['-p', path.join(SOURCES, 'gbif-autres.zip')]).stdout, crlfDelay: Infinity });
  const canon = s => (s || '').split(' ').slice(0, 2).join(' ');
  let entete = true;
  for await (const l of rl) {
    if (entete) { entete = false; continue; }
    const [esp, v, mois, code, n] = l.split('\t');
    const mots = (v || '').split(' ');
    const nom = autresNoms[esp] || autresNoms[canon(v)] || (mots.length >= 3 ? autresNoms[mots[0] + ' ' + mots[2]] : undefined);
    const e = nom !== undefined ? indexEspece.get(nom) : undefined;
    const k = indexCase(code);
    if (e === undefined || k < 0 || avecEbird.has(e) || !mois) continue;
    if (!parEsp.has(e)) parEsp.set(e, Array.from({ length: 12 }, () => new Map()));
    const g = parEsp.get(e)[mois - 1];
    g.set(k, (g.get(k) || 0) + +n);
  }
  let faites = 0;
  for (const [e, mois] of parEsp) {
    const cadre = carteEspece(codeDe[e], mois, true);
    if (cadre) { index[taxo[e].sciName] = [codeDe[e], ...cadre, 'p']; faites++; }
  }
  console.log(`autres sources : ${parEsp.size} espèces, ${faites} cartes de présence, ${secondes()}`);
}

const fichierIndex = path.join(SORTIE, SEUL ? 'cartes-index-essai.json' : 'cartes-index.json');
fs.writeFileSync(fichierIndex, JSON.stringify(index));
const noms = Object.keys(index);
console.log(`${noms.length} cartes (${noms.filter(n => index[n][5] === 'e').length} eBird, ${noms.filter(n => index[n][5] === 'p').length} présence), ${stat.vides} espèces vides, ${(stat.octets / 1e6).toFixed(1)} Mo de PNG, ${secondes()}`);
console.log('index :', fichierIndex, Math.round(fs.statSync(fichierIndex).size / 1024), 'Ko');

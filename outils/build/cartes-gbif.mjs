// Cartes de répartition et de migration de toutes les espèces, à partir des observations d'oiseaux publiées
// sur GBIF, TOUTES BASES (eBird compris) : un seul téléchargement, licence d'ensemble CC BY-NC 4.0 (choix de
// Mathis le 2026-10-21). Remplace les cartes Status & Trends de Cornell (usage sur un site interdit sans accord
// écrit, voir docs/sources-cartes.md), puis celles tirées d'eBird seul (DOI 10.15468/dl.c7y4kg, 2026-10-05).
//
// Entrées (dans notes-privees/essai-cartes/, hors dépôt) :
//   gbif-tout.zip         téléchargement SQL du 2026-10-21, DOI 10.15468/dl.vnrtqk : (species, v_scientificname,
//                         month, cellcode, jeu, n), 76 M lignes MÉLANGÉES ; « jeu » = 8 premiers caractères de la
//                         clé du jeu. Oiseaux depuis 2015, observations humaines, incertitude <= 10 km.
//   gbif-jeux.json        classe de chaque jeu (outils/build/gbif-jeux.mjs) : ebird, listes, isolees, ecarter
//   gbif-autres.zip       DOI 10.15468/dl.rb9sut : espèces sans donnée eBird au 2026-10-01, toutes sources
//                         depuis 2000 ; sert encore aux cartes de présence (voir plus bas)
//   taxonomie-ebird.json  les 11 167 espèces de l'appli ; gbif-renommages.json, gbif-autres-noms.json, et
//                         gbif-noms-autres.json (les autres bases nomment selon le référentiel GBIF, pas eBird :
//                         sans cette table, SABAP2 et le Kenya perdaient 6,2 % de leurs oiseaux, le Nigeria 7 %)
// Sortie : <dépôt voisin>/ornitheque-data/cartes/<code>-a.png (année) et <code>-m.png (12 mois empilés),
//   plus cartes-index.json {nom scientifique: [code, i0, j0, largeur, hauteur, source]}, et le détail par
//   espèce dans notes-privees/essai-cartes/tout/cartes-bilan.json.
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
//
// RÈGLE DE MÉLANGE (essayée sur 23 espèces et validée par Mathis le 2026-10-21, page
// notes-privees/maquettes/melange/, scripts donnees.mjs et mois.mjs du même dossier) :
// - la BASE additionne eBird et les listes complètes (SABAP2, Kenya, Nigeria) dans un même numérateur et un même
//   dénominateur : ce sont toutes des listes complètes. Un atlas n'entre dans la base d'un oiseau que s'il le
//   note entre le quart et 4 fois le taux d'eBird, sur les cases où les deux ont au moins 300 observations par
//   an : les atlas du Nigeria publiés sur GBIF n'ont que 4 Bulbuls des jardins, et leurs listes lui faisaient
//   perdre 13 crans au Nigeria ; la borne haute attrape les anciens noms (voir controleAtlas). Les deux jeux du Nigeria se recouvrent de 2016 à 2021 et le fichier n'a pas l'année :
//   quand les deux comptent, le plus grand des deux, case par case et mois par mois.
// - les observations ISOLÉES (iNaturalist, Artportalen, Observation.org...) ne sont pas des listes : les
//   additionner gonfle les oiseaux qu'on photographie (Mésange charbonnière +6,5 crans en France). Elles ne
//   servent QUE dans les cases où la base a moins de 30 observations d'oiseaux, avec leur propre dénominateur,
//   ramenées à l'échelle de la base par un rapport propre à l'espèce (médiane base / médiane isolées, sur les
//   cases à effort lissé >= 300 des deux côtés). Si ce rapport ne fait pas mieux qu'un niveau constant sur ces
//   cases (Martinet noir : 8,3 niveaux d'écart contre 6,5), les cases ajoutées prennent le niveau médian : on
//   sait que l'oiseau y est, pas s'il y est fréquent. Le rapport et ce choix se décident sur l'année et valent
//   pour les 12 mois. Les rangs se calculent sur les seules cases de la base.
// - AIRE iNaturalist (demandé par Mathis le 2026-10-22) : une case ajoutée par les isolées doit tomber dans
//   l'aire estimée par iNaturalist, à 2 cases près, quand cette aire est crue (80 % des cases des listes
//   complètes dedans). Contre les noms regroupés des autres bases : sur un échantillon, la Corneille noire perd
//   755 cases ajoutées (Fennoscandie), le Pipit de Nouvelle-Zélande 424 sur 424 (Australie), alors que la
//   Chouette de Tengmalm, le Grand Tétras ou le Pic tridactyle n'en perdent que 0 à 3. Voir aireFenetre.
//   Exception : la case reste si les listes complètes voient l'oiseau à moins de 4 cases, car l'aire iNaturalist
//   s'arrête trop au sud en Scandinavie (voir permisAire).
// - MOIS VOISINS (docs/cartes-combler-les-trous.md section 3) : la carte d'un mois emprunte les observations et
//   l'effort des deux mois d'à côté, avec un poids de moitié, seulement dans les cases où l'effort du mois est
//   sous 300 observations ; sans cette condition, le Martinet noir passait de 7 à 49 cases en Europe en janvier.
// - Une espèce sans observation eBird ici et présente dans gbif-autres.zip garde sa carte de PRÉSENCE d'avant
//   (comptage lissé, sans effort ; source « p ») : pour le Faucon taita, la règle ne tirait de SABAP2 que
//   3 cases, contre 23 sur la carte de présence (mesuré le 2026-10-21). Une espèce qui a des listes complètes
//   mais pas assez pour la règle reçoit une carte de présence tirée de ces listes seules (source « o »).
//   Les observations isolées n'y entrent pas, et une espèce qui n'a qu'elles n'a pas de carte, comme avant : le
//   2026-10-21, elles donnaient des oiseaux de cage vus partout (Ara canindé sur 870 cases de large, Lori noira).
//   Espèces choisies (ESPECES=...) : cartes de présence comprises, pour refaire seulement celles-là.
//
// La mémoire disponible est courte (8 Go dont ~0,8 libre) : le zip est lu UNE fois, ses lignes rangées sur
// le disque en PARTS morceaux par espèce (12 octets par ligne, ~0,9 Go en tout, effacés à la fin), puis
// chaque morceau est traité à part. Lecture du zip : ~130 s.
//
// Usage : node outils/build/cartes-gbif.mjs                       (tout)
//         ESPECES="Hirundo rustica,Apus apus" node ...             (quelques espèces, un seul morceau)
//         SORTIE=chemin  PARTS=12  node ...
import { spawn } from 'node:child_process';
import readline from 'node:readline';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ouvrirAires } from './aires-inat.mjs';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const SOURCES = path.join(RACINE, 'notes-privees', 'essai-cartes');
const SORTIE = process.env.SORTIE || path.join(RACINE, '..', 'ornitheque-data', 'cartes');
const SEUL = process.env.ESPECES ? process.env.ESPECES.split(',').map(s => s.trim()) : null;
const PARTS = SEUL ? 1 : +(process.env.PARTS || 12);
const MORCEAUX = path.join(SOURCES, 'tout', SEUL ? 'morceaux-essai' : 'morceaux');

const CASE = 0.25, NI = 1440, NJ = 720, N = NI * NJ;
const OBS_MIN = 2, EFFORT_MIN = 30, RETENUE = 300;
const SIGMA = 1.4, RAYON = 3, NIV = +(process.env.NIV || 32);
const POIDS_VOISINS = 0.5, EMPRUNT_SOUS = 300;
const ADEQUAT = 300, SEUIL_ATLAS = 0.25, CASES_ATLAS = 5, RECOUVREMENT_MIN = 20;
// Aire iNaturalist (voir carteRegle) : crue si 80 % des cases des listes complètes tombent dedans, comme la
// règle de la teinte ; marge de 2 cases (~55 km) pour ses bords ; hors de l'aire, une case reste si les listes
// voient l'oiseau à moins de PROCHE_LISTES cases (voir permisAire).
const PART_AIRE = 0.8, MARGE_AIRE = 2, PROCHE_LISTES = 4;
const VOISINS_DIJ = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

const lire = f => JSON.parse(fs.readFileSync(path.join(SOURCES, f), 'utf8'));
const taxo = lire('taxonomie-ebird.json');
const renommages = lire('gbif-renommages.json');
const autresNoms = lire('gbif-autres-noms.json');
const nomsAutresBases = lire('gbif-noms-autres.json');
const indexEspece = new Map(taxo.map((t, i) => [t.sciName, i]));
const codeDe = taxo.map(t => t.speciesCode);
// Espèces éteintes selon eBird (173 dans l'appli) : aucune carte. Leurs « observations » depuis 2015 sont des
// spécimens de musée ou des erreurs (un Dronte de Maurice et un Grand Pingouin en sont sortis le 2026-10-21).
const eteintes = new Set(lire('taxonomie-ebird-complete.json').filter(t => t.extinct).map(t => indexEspece.get(t.sciName)).filter(i => i !== undefined));
fs.mkdirSync(SORTIE, { recursive: true });
fs.mkdirSync(MORCEAUX, { recursive: true });

// ---------- Classes de jeux ----------
// 0 eBird, 1 SABAP2 (Afrique australe), 2 observations isolées, 3 et 4 les deux jeux du Nigeria, 5 Kenya ;
// 6 = les deux du Nigeria dédoublonnés. Chaque atlas reste à part : il ne compte pour un oiseau que s'il le note.
const EBIRD = 0, SABAP2 = 1, ISOLEES = 2, NIG_A = 3, NIG_B = 4, KENYA = 5, NIG_AB = 6;
const ATLAS = [SABAP2, KENYA, NIG_A, NIG_B];
const NOM_ATLAS = { [SABAP2]: 'sabap2', [KENYA]: 'kenya', [NIG_A]: 'nigA', [NIG_B]: 'nigB' };
const A_PART = { '993982f8': NIG_A, 'ae857486': NIG_B, '1cd0cb6d': KENYA };
const CODE_CLASSE = { ebird: EBIRD, listes: SABAP2, isolees: ISOLEES };
const classeDe = new Map();
for (const j of lire('gbif-jeux.json')) classeDe.set(j.prefixe, j.classe === 'ecarter' ? -1 : A_PART[j.prefixe] ?? CODE_CLASSE[j.classe]);

// ---------- Noms ----------
// Un morceau d'une chaîne garde en mémoire toute la chaîne d'où il vient : une clé rangée telle quelle dans un
// cache retenait le morceau de 64 Ko lu avec elle, et la mémoire saturait vers 30 millions de lignes
// (2026-10-21). On range donc une copie, une seule fois par clé nouvelle.
const copie = s => Buffer.from(s, 'utf8').toString('utf8');
// nom des autres bases ramené à « Genre épithète » : sous-genre entre parenthèses et auteur retirés
// (« Artamus (Artamus) leucorynchus », « Charadrius dubius Scopoli, 1786 »), clé de gbif-noms-autres.json
function nettoyer(nom) {
  const mots = nom.replace(/\([^)]*\)/g, ' ').trim().split(/\s+/);
  if (mots.length < 2 || !/^[A-Z][a-z]+$/.test(mots[0]) || !/^[a-z-]+$/.test(mots[1])) return '';
  return mots[0] + ' ' + mots[1];
}
// « Genre épithète-de-sous-espèce » d'un trinôme (« subsp. » et auteur ignorés), pour les sous-espèces qu'eBird
// a faites espèces : sans ça, les 1,07 million de « Corvus corone cornix » des autres bases allaient à la
// Corneille noire, qui gagnait 1 668 cases, en Russie entre autres. Mesuré le 2026-10-21 : 256 noms changent
// d'espèce, tous dans les observations isolées, tous de vraies séparations d'eBird.
function sousEspece(nom) {
  const mots = nom.replace(/\([^)]*\)/g, ' ').trim().split(/\s+/).filter(m => !/^(subsp|ssp|var)\.?$/.test(m));
  if (mots.length < 3 || !/^[A-Z][a-z]+$/.test(mots[0]) || !/^[a-z-]+$/.test(mots[1]) || !/^[a-z-]+$/.test(mots[2])) return undefined;
  return mots[0] + ' ' + mots[2];
}
// Nom GBIF -> indice de l'espèce de l'appli, ou -1 (hybride, « sp. », forme « / », inconnu).
// Trinômes : la sous-espèce si eBird en a fait une espèce, sinon l'espèce ; noms d'une autre version de la
// taxonomie renvoyés par la table de renommage (les espèces que GBIF sépare et que l'appli range en
// sous-espèces s'ADDITIONNENT).
const cacheNom = new Map();
function especeDe(nom) {
  nom = nom || '';
  let r = cacheNom.get(nom);
  if (r !== undefined) return r;
  r = -1;
  if (nom && !/ x |×|\bsp\.?$|spp?\.|\//.test(nom)) {
    const deux = nom.split(' ').slice(0, 2).join(' ');
    for (const essai of [nom, renommages[nom], sousEspece(nom), deux, renommages[deux], nomsAutresBases[nettoyer(nom)]]) {
      if (essai !== undefined && indexEspece.has(essai)) { r = indexEspece.get(essai); break; }
    }
  }
  cacheNom.set(copie(nom), r);
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
  cacheCase.set(copie(code), k);
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

// ---------- Lecture du zip, une seule fois ----------
// Effort brut par classe et par mois (eBird, SABAP2, isolées : grilles 12 x 1440 x 720 ; Kenya et Nigeria, petits,
// en paires mois x case -> n). Les lignes des espèces de l'appli partent sur le disque, une ligne = 12 octets.
const t0 = Date.now();
const secondes = () => Math.round((Date.now() - t0) / 1000) + ' s';
const selection = SEUL ? new Set(SEUL.map(n => indexEspece.get(n)).filter(i => i !== undefined)) : null;
if (SEUL) console.log('espèces choisies :', selection.size, 'sur', SEUL.length);

const effortBrut = [EBIRD, SABAP2, ISOLEES].map(() => new Float32Array(12 * N));
const effortAtlas = { [NIG_A]: new Map(), [NIG_B]: new Map(), [KENYA]: new Map() };
const LIGNE = 12, TAMPON = 1 << 20;
const fichierMorceau = p => path.join(MORCEAUX, `morceau-${p}.bin`);
const morceaux = Array.from({ length: PARTS }, (_, p) => ({ fd: fs.openSync(fichierMorceau(p), 'w'), buf: Buffer.alloc(TAMPON), o: 0, lignes: 0 }));
function ranger(p, e, cl, mois, k, n) {
  const s = morceaux[p];
  if (s.o + LIGNE > TAMPON) { fs.writeSync(s.fd, s.buf, 0, s.o); s.o = 0; }
  s.buf.writeUInt16LE(e, s.o); s.buf[s.o + 2] = cl; s.buf[s.o + 3] = mois; s.buf.writeUInt32LE(k, s.o + 4); s.buf.writeUInt32LE(n, s.o + 8);
  s.o += LIGNE; s.lignes++;
}
let col = null, lignes = 0, rangees = 0;
function traiter(l) {
  if (l.endsWith('\r')) l = l.slice(0, -1);
  if (!l) return;
  if (!col) { col = Object.fromEntries(l.toLowerCase().split('\t').map((c, i) => [c, i])); return; }
  const c = l.split('\t');
  if (++lignes % 10e6 === 0) console.log(lignes / 1e6, 'M lignes,', secondes());
  let cl = classeDe.get(c[col.jeu]);
  if (cl === undefined) cl = ISOLEES;              // jeu absent de la table : observation isolée
  if (cl < 0) return;                              // baguage, Batumi, Faune-France par commune
  const mois = +c[col.month] - 1, k = indexCase(c[col.cellcode]), n = +c[col.n];
  if (k < 0 || !(mois >= 0 && mois < 12)) return;
  if (cl <= ISOLEES) effortBrut[cl][mois * N + k] += n;
  else { const g = effortAtlas[cl], q = mois * N + k; g.set(q, (g.get(q) || 0) + n); }
  let e = especeDe(c[col.v_scientificname]);
  if (e < 0) e = especeDe(c[col.species]);
  if (e < 0 || (selection && !selection.has(e))) return;
  ranger(selection ? 0 : e % PARTS, e, cl, mois, k, n);
  rangees++;
}
// Lecture par morceaux, traités dans l'événement même : le flux attend qu'on ait fini. L'itérateur de
// readline, lui, empile les lignes plus vite qu'on ne les traite : mémoire saturée sur les 6,7 Go du fichier
// (plantage du 2026-10-21).
{
  const entree = spawn('unzip', ['-p', path.join(SOURCES, 'gbif-tout.zip')]).stdout;
  entree.setEncoding('utf8');
  await new Promise((ok, ko) => {
    let reste = '';
    entree.on('data', morceau => {
      const ls = (reste + morceau).split('\n');
      reste = ls.pop();
      for (const l of ls) traiter(l);
    });
    entree.on('end', () => { traiter(reste); ok(); });
    entree.on('error', ko);
  });
  for (const s of morceaux) { if (s.o) fs.writeSync(s.fd, s.buf, 0, s.o); fs.closeSync(s.fd); s.buf = null; }
  cacheNom.clear(); cacheCase.clear();
  console.log(`zip lu : ${lignes} lignes, ${rangees} rangées en ${PARTS} morceaux, ${secondes()}`);
}

// ---------- Efforts communs à toutes les espèces ----------
// Le lissage est linéaire, mais pas les mois voisins (la condition porte sur l'effort de la case) : on prépare
// donc une fois pour toutes la base « tous atlas gardés », le cas de presque toutes les espèces, et les isolées.
// Une espèce dont un atlas est écarté refait sa base dans sa fenêtre (voir effortsBase).
// Les comptes sont entiers et sous 16,7 millions par case et par mois : exacts en Float32.
const maxMaps = (a, b) => { const m = new Map(a); for (const [q, n] of b) m.set(q, Math.max(m.get(q) || 0, n)); return m; };
effortAtlas[NIG_AB] = maxMaps(effortAtlas[NIG_A], effortAtlas[NIG_B]);
// SABAP2 ne couvre que l'Afrique australe : gardé en paires une fois la base faite
effortAtlas[SABAP2] = new Map();
for (let q = 0; q < 12 * N; q++) if (effortBrut[SABAP2][q]) effortAtlas[SABAP2].set(q, effortBrut[SABAP2][q]);
const annuel = g12 => { const o = new Float64Array(N); for (let m = 0; m < 12; m++) for (let k = 0; k < N; k++) o[k] += g12[m * N + k]; return o; };
const annuelPaires = mp => { const o = new Float64Array(N); for (const [q, n] of mp) o[q % N] += n; return o; };
const AN = { [EBIRD]: annuel(effortBrut[EBIRD]) };
for (const cl of [...ATLAS, NIG_AB]) AN[cl] = annuelPaires(effortAtlas[cl]);
// avec mois voisins : la case emprunte la moitié des deux mois d'à côté si l'effort du mois y est sous 300
function avecVoisins(E) {
  const o = new Float32Array(12 * N);
  for (let m = 0; m < 12; m++) {
    const a = m * N, p = ((m + 11) % 12) * N, s = ((m + 1) % 12) * N;
    for (let k = 0; k < N; k++) o[a + k] = E[a + k] + (E[a + k] < EMPRUNT_SOUS ? POIDS_VOISINS : 0) * (E[p + k] + E[s + k]);
  }
  return o;
}
function lisserMois(E) {
  const o = new Float32Array(12 * N);
  for (let m = 0; m < 12; m++) o.set(lisser(E.subarray(m * N, (m + 1) * N), NI, NJ), m * N);
  return o;
}
const B = effortBrut[EBIRD];                       // devient la base « tous atlas gardés », sur place
for (const cl of [SABAP2, KENYA, NIG_AB]) for (const [q, n] of effortAtlas[cl]) B[q] += n;
effortBrut[EBIRD] = effortBrut[SABAP2] = null;
const B_AN = annuel(B), LB_AN = lisser(B_AN, NI, NJ);
const BV = avecVoisins(B), LBV = lisserMois(BV);
const I = effortBrut[ISOLEES];
const I_AN = annuel(I), LI_AN = lisser(I_AN, NI, NJ);
const IV = avecVoisins(I), LIV = lisserMois(IV);
const I_FAIBLE = new Uint8Array(12 * N);
for (let q = 0; q < 12 * N; q++) I_FAIBLE[q] = I[q] < EMPRUNT_SOUS ? 1 : 0;
effortBrut[ISOLEES] = null;
console.log('efforts prêts', secondes());

// ---------- Une image d'une espèce : fréquences sur la fenêtre ----------
// obs : comptages bruts ; eff / effLis : effort brut et lissé, sur la même fenêtre, ou null pour une carte de présence.
function valeursImage(obs, W, H, eff, effLis) {
  const res = new Float32Array(W * H).fill(NaN);
  const lis = lisser(obs, W, H);
  let mediane = 0;
  if (eff) {
    const brut = [];
    for (let l = 0; l < W * H; l++) { const v = obs[l]; if (v >= OBS_MIN && eff[l] >= EFFORT_MIN) brut.push(v / eff[l]); }
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
  for (let l = 0; l < W * H; l++) {
    if (!present[l]) continue;
    if (eff) {
      if (effLis[l] < EFFORT_MIN || lis[l] < OBS_MIN) continue;
      res[l] = (lis[l] + RETENUE * mediane) / (effLis[l] + RETENUE);
    } else res[l] = lis[l];
  }
  return res;
}
// niveau 1..NIV d'une valeur parmi une référence triée (rang de 0 à 1, puis découpé en NIV)
const trier = vals => Float32Array.from(vals.filter(x => !Number.isNaN(x))).sort();
function niveau(ref, v) {
  let lo = 0, hi = ref.length;
  while (lo < hi) { const m = (lo + hi) >> 1; ref[m] <= v ? lo = m + 1 : hi = m; }
  return 1 + Math.min(NIV - 1, Math.floor(lo / ref.length * NIV));
}
const niveaux = (vals, ref) => { const o = new Uint8Array(vals.length); for (let l = 0; l < vals.length; l++) if (!Number.isNaN(vals[l])) o[l] = niveau(ref, vals[l]); return o; };
const mediane = a => { const s = Float64Array.from(a).sort(); return s.length ? s[s.length >> 1] : NaN; };

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
  ecrireFichier(fichier, png);
  return png.length;
}
// Un autre programme de Windows (antivirus, indexation) peut tenir une image ouverte un instant : la génération
// du 2026-10-22 s'est arrêtée là au bout de 52 min (EBUSY sur une seule image). On réessaie, 250 ms d'écart.
function ecrireFichier(fichier, octets) {
  for (let essai = 1; ; essai++) {
    try { fs.writeFileSync(fichier, octets); return; }
    catch (e) {
      if (!['EBUSY', 'EPERM', 'EACCES'].includes(e.code) || essai >= 20) throw e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 250);
    }
  }
}

// ---------- Fenêtre ----------
// Cadre des observations, élargi de RAYON + 2 cases : les deux fermetures n'ajoutent rien à plus de 2 cases des
// observations, donc un lissage fait dans la fenêtre (zéro au-dehors) vaut le lissage mondial sur toute case
// qui peut sortir colorée.
function fenetre(cartes) {
  let i0 = NI, i1 = -1, j0 = NJ, j1 = -1;
  for (const g of cartes) for (const k of g.keys()) {
    const i = k % NI, j = (k - i) / NI;
    if (i < i0) i0 = i; if (i > i1) i1 = i; if (j < j0) j0 = j; if (j > j1) j1 = j;
  }
  if (i1 < 0) return null;
  const P = RAYON + 2, iw = Math.max(0, i0 - P), jw = Math.max(0, j0 - P);
  const W = Math.min(NI - 1, i1 + P) - iw + 1, H = Math.min(NJ - 1, j1 + P) - jw + 1;
  const loc = k => { const i = k % NI; return (((k - i) / NI) - jw) * W + i - iw; };
  const glob = l => { const x = l % W; return (jw + (l - x) / W) * NI + iw + x; };
  // découpe d'une grille mondiale (décalée de off : un mois dans une grille 12 x N)
  const decoupe = (G, off = 0, Type = Float32Array) => { const o = new Type(W * H); for (let y = 0; y < H; y++) { const a = off + (jw + y) * NI + iw; for (let x = 0; x < W; x++) o[y * W + x] = G[a + x]; } return o; };
  const dense = (...gs) => { const o = new Float64Array(W * H); for (const g of gs) for (const [k, v] of g) o[loc(k)] += v; return o; };
  return { iw, jw, W, H, loc, glob, decoupe, dense };
}
// observations d'un mois, plus la moitié de celles des deux mois d'à côté là où l'effort du mois est faible
function obsVoisins(f, cartes, m, faible) {
  const o = new Float64Array(f.W * f.H);
  for (const [k, v] of cartes[m]) o[f.loc(k)] += v;
  for (const mm of [(m + 11) % 12, (m + 1) % 12]) for (const [k, v] of cartes[mm]) { const l = f.loc(k); if (faible(l)) o[l] += POIDS_VOISINS * v; }
  return o;
}

// Effort de la base pour une espèce dont un atlas est écarté : base mondiale moins ce qui est écarté, dans la fenêtre.
function effortsBase(f, garde, nig) {
  const { W, H } = f, WH = W * H;
  const brut = Array.from({ length: 12 }, (_, m) => f.decoupe(B, m * N));
  const retirer = (cl, signe) => { for (const [q, n] of effortAtlas[cl]) { const m = Math.floor(q / N), k = q % N, i = k % NI, j = (k - i) / NI; if (i >= f.iw && i < f.iw + W && j >= f.jw && j < f.jw + H) brut[m][f.loc(k)] += signe * n; } };
  if (!garde[SABAP2]) retirer(SABAP2, -1);
  if (!garde[KENYA]) retirer(KENYA, -1);
  if (nig !== NIG_AB) { retirer(NIG_AB, -1); if (nig >= 0) retirer(nig, 1); }
  const an = new Float64Array(WH);
  for (const e of brut) for (let l = 0; l < WH; l++) an[l] += e[l];
  const voisins = brut.map((e, m) => { const p = brut[(m + 11) % 12], s = brut[(m + 1) % 12], o = new Float32Array(WH); for (let l = 0; l < WH; l++) o[l] = e[l] + (e[l] < EMPRUNT_SOUS ? POIDS_VOISINS : 0) * (p[l] + s[l]); return o; });
  return {
    an, anLisse: lisser(an, W, H),
    faible: m => l => brut[m][l] < EMPRUNT_SOUS,
    voisins: m => voisins[m], voisinsLisse: m => lisser(voisins[m], W, H),
  };
}

// ---------- Écriture : cadre commun aux 13 images, puis deux PNG ----------
const stat = { octets: 0, vides: 0 };
function ecrireEspece(code, f, images) {
  const { W } = f;
  let a0 = W, a1 = -1, b0 = f.H, b1 = -1;
  for (const im of images) for (let l = 0; l < im.length; l++) if (im[l]) {
    const x = l % W, y = (l - x) / W;
    if (x < a0) a0 = x; if (x > a1) a1 = x; if (y < b0) b0 = y; if (y > b1) b1 = y;
  }
  if (a1 < 0) return null;
  const w = a1 - a0 + 1, h = b1 - b0 + 1;
  const rogner = im => { const o = new Uint8Array(w * h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) o[y * w + x] = im[(y + b0) * W + x + a0]; return o; };
  const pile = new Uint8Array(w * h * 12);
  images.slice(1).forEach((im, m) => pile.set(rogner(im), m * w * h));
  stat.octets += ecrireGris(path.join(SORTIE, code + '-a.png'), w, h, rogner(images[0]));
  stat.octets += ecrireGris(path.join(SORTIE, code + '-m.png'), w, 12 * h, pile);
  return [f.iw + a0, f.jw + b0, w, h];
}
const compte = im => { let c = 0; for (const v of im) if (v) c++; return c; };

// ---------- Contrôle de chaque atlas contre eBird ----------
// Sur les cases où les deux ont au moins 300 observations par an, taux de l'atlas / taux d'eBird. L'atlas compte
// pour l'oiseau entre le quart et 4 fois le taux d'eBird. Sous le quart : il ne le note pas (Bulbul des jardins
// au Nigeria). Au-dessus de 4 fois, ajouté le 2026-10-21 après la génération complète : les atlas gardent
// d'anciens noms, et leurs Flamants roses arrivaient au Flamant des Caraïbes (SABAP2 : infini, sur 388 cases),
// leurs Hérons à bec jaune à l'Aigrette intermédiaire d'Asie, leurs oies domestiques à l'Oie cendrée (65 fois).
// Entre 2 et 4 fois, ce sont de vrais oiseaux discrets que les atlas entendent mieux (cisticoles, rousserolles).
function controleAtlas(obs) {
  const annuelle = cl => { const o = new Map(); for (const g of obs[cl]) for (const [k, n] of g) o.set(k, (o.get(k) || 0) + n); return o; };
  const oE = annuelle(EBIRD), atlas = {}, garde = {};
  for (const cl of ATLAS) {
    const oS = annuelle(cl), es = AN[cl];
    let nE = 0, eE = 0, nS = 0, eS = 0, cases = 0;
    for (const g of new Set([...oE.keys(), ...oS.keys()])) {
      if (AN[EBIRD][g] < ADEQUAT || es[g] < ADEQUAT) continue;
      nE += oE.get(g) || 0; eE += AN[EBIRD][g]; nS += oS.get(g) || 0; eS += es[g]; cases++;
    }
    const rapport = cases ? (nS / eS) / (nE / eE) : null;
    garde[cl] = cases < CASES_ATLAS || (rapport >= SEUIL_ATLAS && rapport <= 1 / SEUIL_ATLAS);
    if (cases) atlas[NOM_ATLAS[cl]] = { cases, rapport: Number.isFinite(rapport) ? +rapport.toFixed(3) : 'infini', garde: garde[cl] };
  }
  const nig = garde[NIG_A] && garde[NIG_B] ? NIG_AB : garde[NIG_A] ? NIG_A : garde[NIG_B] ? NIG_B : -1;
  return { atlas, garde, nig, defaut: garde[SABAP2] && garde[KENYA] && nig === NIG_AB };
}
// observations de la base, mois par mois : eBird + atlas gardés (Nigeria dédoublonné par le plus grand)
function obsBase(obs, { garde, nig }) {
  return obs[EBIRD].map((g, m) => {
    const o = new Map(g);
    const ajouter = src => { for (const [k, n] of src) o.set(k, (o.get(k) || 0) + n); };
    if (garde[SABAP2]) ajouter(obs[SABAP2][m]);
    if (garde[KENYA]) ajouter(obs[KENYA][m]);
    if (nig === NIG_AB) { const a = obs[NIG_A][m], b = obs[NIG_B][m]; ajouter([...new Set([...a.keys(), ...b.keys()])].map(k => [k, Math.max(a.get(k) || 0, b.get(k) || 0)])); }
    else if (nig >= 0) ajouter(obs[nig][m]);
    return o;
  });
}

// ---------- Aire iNaturalist, garde-fou des observations isolées (2026-10-22, demandé par Mathis) ----------
// Certaines bases notent un oiseau sous le nom de l'espèce dont eBird l'a séparé, sans sous-espèce : leurs
// Corneilles mantelées de Suède et de Finlande sont des « Corvus corone », et la Corneille noire y passait de 284
// à 1 019 cases. Une case ajoutée par les isolées doit donc tomber dans l'aire iNaturalist (taxonomie à jour),
// à 2 cases près, quand cette aire est crue : 80 % des cases des listes complètes dedans. Aire absente ou fausse
// (Pie bavarde : 0 %) : rien ne change. Les cases des listes, elles, ne sont jamais touchées.
const aires = ouvrirAires(path.join(SOURCES, 'inat-aires'));
const GRILLE_AIRE = new Uint8Array(N);
// aire de l'espèce sur la fenêtre : stricte, et élargie de MARGE_AIRE cases (maximum glissant, ligne puis colonne)
function aireFenetre(nom, f) {
  if (!aires.aire(nom, GRILLE_AIRE)) return null;
  const { W, H, iw, jw } = f, M = MARGE_AIRE, W2 = W + 2 * M, H2 = H + 2 * M;
  const ext = new Uint8Array(W2 * H2), lig = new Uint8Array(W2 * H2);
  for (let y = 0; y < H2; y++) { const j = jw + y - M; if (j < 0 || j >= NJ) continue; for (let x = 0; x < W2; x++) ext[y * W2 + x] = GRILLE_AIRE[j * NI + ((iw + x - M + NI) % NI)]; }
  for (let y = 0; y < H2; y++) for (let x = M; x < W2 - M; x++) { let v = 0; for (let d = -M; d <= M; d++) v |= ext[y * W2 + x + d]; lig[y * W2 + x] = v; }
  const stricte = new Uint8Array(W * H), large = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    stricte[y * W + x] = ext[(y + M) * W2 + x + M];
    let v = 0; for (let d = 0; d <= 2 * M; d++) v |= lig[(y + d) * W2 + x + M];
    large[y * W + x] = v;
  }
  return { stricte, large };
}
// Cases où les isolées peuvent ajouter l'oiseau : l'aire élargie, plus PROCHE_LISTES cases autour des cases des
// listes complètes. iNaturalist a peu d'observateurs en Scandinavie (on y note sur les bases nationales) et son
// aire s'y arrête trop au sud : sans cette exception, le garde-fou y retirait ~6 800 cases à 151 espèces (Merle
// noir, Accenteur mouchet, Torcol, Geai...). Mesuré le 2026-10-22 (verif/aire-voisinage.mjs) : 56 à 94 % de leurs
// cases retirées étaient à moins de 4 cases d'une case des listes hors de l'aire, contre 14 % pour la Corneille
// noire et 0 à 1 % pour le Mérion de Lambert, le Pipit de Nouvelle-Zélande, le Tarier d'Afrique, la Macreuse noire.
function permisAire(large, annee, { W, H }) {
  const R = PROCHE_LISTES, lig = new Uint8Array(W * H), permis = Uint8Array.from(large);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (annee[y * W + x]) for (let d = Math.max(0, x - R); d <= Math.min(W - 1, x + R); d++) lig[y * W + d] = 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (lig[y * W + x]) for (let d = Math.max(0, y - R); d <= Math.min(H - 1, y + R); d++) permis[d * W + x] = 1;
  return permis;
}

// ---------- Une espèce par la règle de mélange ----------
// obs[classe][mois] : Map(case -> comptage) ; oB : obsBase(). Rend { cadre, fiche } ou null (aucune case).
function carteRegle(e, obs, { atlas, garde, nig, defaut }, oB) {
  const code = codeDe[e];
  const oI = obs[ISOLEES];
  const f = fenetre([...oB, ...oI]);
  if (!f) return null;
  const { W, H } = f, WH = W * H;
  const base = defaut ? {
    an: f.decoupe(B_AN, 0, Float64Array), anLisse: f.decoupe(LB_AN, 0, Float64Array),
    faible: m => l => B[m * N + f.glob(l)] < EMPRUNT_SOUS,
    voisins: m => f.decoupe(BV, m * N), voisinsLisse: m => f.decoupe(LBV, m * N),
  } : effortsBase(f, garde, nig);

  // ----- l'année : base, isolées, rapport d'échelle -----
  const vB = valeursImage(f.dense(...oB), W, H, base.an, base.anLisse);
  const eI = f.decoupe(I_AN, 0, Float64Array), eIL = f.decoupe(LI_AN, 0, Float64Array);
  const vI = valeursImage(f.dense(...oI), W, H, eI, eIL);
  const recB = [], recI = [];
  for (let l = 0; l < WH; l++) {
    if (Number.isNaN(vB[l]) || Number.isNaN(vI[l])) continue;
    if (base.anLisse[l] >= ADEQUAT && eIL[l] >= ADEQUAT) { recB.push(vB[l]); recI.push(vI[l]); }
  }
  const repli = recB.length < RECOUVREMENT_MIN;
  const valides = v => [...v].filter(x => !Number.isNaN(x));
  const ratio = repli ? mediane(valides(vB)) / mediane(valides(vI)) : mediane(recB) / mediane(recI);
  const refB = trier(vB);
  // contrôle de l'étalonnage : niveau des isolées ramenées contre niveau de la base, sur les cases de
  // recouvrement, comparé à l'écart qu'on aurait en donnant à toutes ces cases le niveau médian
  const nivRec = recB.map(v => niveau(refB, v));
  const nivMed = repli ? mediane(niveaux(vB, refB).filter(Boolean)) : mediane(nivRec);
  let ecart = 0, ecartConstant = 0;
  for (let q = 0; q < recB.length; q++) { ecart += Math.abs(niveau(refB, ratio * recI[q]) - nivRec[q]); ecartConstant += Math.abs(nivRec[q] - nivMed); }
  const etalonne = !repli && ecart < ecartConstant;
  const ajoutPossible = Number.isFinite(ratio) && refB.length > 0;
  // aire iNaturalist, crue si 80 % des cases des listes tombent dedans
  const aire = aireFenetre(nomDe(e), f);
  let casesBase = 0, dansAire = 0;
  if (aire) for (let l = 0; l < WH; l++) if (!Number.isNaN(vB[l])) { casesBase++; if (aire.stricte[l]) dansAire++; }
  const partAire = aire && casesBase ? dansAire / casesBase : null;
  const aireCrue = partAire !== null && partAire >= PART_AIRE;
  const annee = niveaux(vB, refB);
  // calculé sur les seules cases des listes, avant les ajouts ; vaut aussi pour les 12 mois (l'aire n'a pas de saison)
  const permis = aireCrue ? permisAire(aire.large, annee, f) : null;
  let ajoutees = 0, horsAire = 0, horsAireMois = 0, prochesListes = 0;
  if (ajoutPossible) for (let l = 0; l < WH; l++) {
    if (annee[l] || base.an[l] >= EFFORT_MIN || Number.isNaN(vI[l])) continue;
    const n = etalonne ? niveau(refB, ratio * vI[l]) : nivMed;
    if (n < 1) continue;
    if (aireCrue && !permis[l]) { horsAire++; continue; }
    if (aireCrue && !aire.large[l]) prochesListes++;
    annee[l] = n; ajoutees++;
  }

  // ----- les 12 mois, avec les mois voisins -----
  const images = [annee];
  const casesMois = [];
  for (let m = 0; m < 12; m++) {
    const eBv = base.voisins(m);
    const vBm = valeursImage(obsVoisins(f, oB, m, base.faible(m)), W, H, eBv, base.voisinsLisse(m));
    const vIm = valeursImage(obsVoisins(f, oI, m, l => I_FAIBLE[m * N + f.glob(l)]), W, H, f.decoupe(IV, m * N), f.decoupe(LIV, m * N));
    const ref = trier(vBm), im = niveaux(vBm, ref);
    const nivB = []; for (const v of im) if (v) nivB.push(v);
    nivB.sort((x, y) => x - y);
    const medM = nivB[nivB.length >> 1];
    if (ajoutPossible && ref.length) for (let l = 0; l < WH; l++) {
      if (im[l] || eBv[l] >= EFFORT_MIN || Number.isNaN(vIm[l])) continue;
      if (aireCrue && !permis[l]) { horsAireMois++; continue; }
      im[l] = etalonne ? niveau(ref, ratio * vIm[l]) : medM;
    }
    images.push(im);
    casesMois.push(compte(im));
  }
  const cadre = ecrireEspece(code, f, images);
  if (!cadre) return null;
  const ecartes = Object.entries(atlas).filter(([, a]) => !a.garde).map(([nom]) => nom);
  return {
    cadre,
    fiche: { code, cases: compte(annee), ajoutees, casesMois, ratio: +ratio.toPrecision(4), recouvrement: recB.length, repli, etalonne,
      ecart: recB.length ? +(ecart / recB.length).toFixed(2) : null, ecartConstant: recB.length ? +(ecartConstant / recB.length).toFixed(2) : null,
      atlas, ...(ecartes.length ? { atlasEcartes: ecartes } : {}),
      aire: partAire === null ? (aire ? 'vide' : 'absente') : { part: +partAire.toFixed(3), crue: aireCrue }, horsAire, horsAireMois, prochesListes },
  };
}

// ---------- Une carte de présence (sans effort) ----------
// mois : 12 Map(case -> comptage) ; valeur = comptage lissé, rangée parmi les cases de la même image.
function cartePresence(code, mois) {
  const f = fenetre(mois);
  if (!f) return null;
  const an = f.dense(...mois);
  const images = [an, ...mois.map(g => f.dense(g))].map(o => { const v = valeursImage(o, f.W, f.H, null, null); return niveaux(v, trier(v)); });
  return ecrireEspece(code, f, images);
}

// ---------- Programme ----------
const index = {}, bilan = {}, enAttente = new Map(), sansEbird = new Set();
const nomDe = e => taxo[e].sciName;
const total = cartes => { let s = 0; for (const g of cartes) for (const n of g.values()) s += n; return s; };
for (let p = 0; p < PARTS; p++) {
  const buf = fs.readFileSync(fichierMorceau(p)), nl = buf.length / LIGNE;
  // tri par espèce (comptage), puis une carte par espèce
  const debut = new Uint32Array(taxo.length + 1);
  for (let r = 0; r < nl; r++) debut[buf.readUInt16LE(r * LIGNE) + 1]++;
  for (let e = 0; e < taxo.length; e++) debut[e + 1] += debut[e];
  const ordre = new Uint32Array(nl), pos = debut.slice(0, taxo.length);
  for (let r = 0; r < nl; r++) ordre[pos[buf.readUInt16LE(r * LIGNE)]++] = r;
  let faites = 0;
  for (let e = 0; e < taxo.length; e++) {
    if (debut[e] === debut[e + 1] || eteintes.has(e)) continue;
    const obs = Array.from({ length: 7 }, () => Array.from({ length: 12 }, () => new Map()));
    for (let q = debut[e]; q < debut[e + 1]; q++) {
      const o = ordre[q] * LIGNE, g = obs[buf[o + 2]][buf[o + 3]], k = buf.readUInt32LE(o + 4);
      g.set(k, (g.get(k) || 0) + buf.readUInt32LE(o + 8));
    }
    if (!total(obs[EBIRD])) sansEbird.add(e);
    const ctrl = controleAtlas(obs), oB = obsBase(obs, ctrl);
    const r = carteRegle(e, obs, ctrl, oB);
    if (r) { index[nomDe(e)] = [codeDe[e], ...r.cadre, 'e']; bilan[nomDe(e)] = { src: 'e', ...r.fiche }; }
    // des listes complètes, mais pas assez pour la règle : carte de présence d'après ces listes SEULEMENT. Avec les
    // observations isolées, l'Ara canindé, qui ne vit qu'en Bolivie, couvrait 870 cases de large (oiseaux de zoo).
    else if (total(oB) > 0) enAttente.set(e, oB);
    if (++faites % 500 === 0) console.log(`  ${faites} espèces de ce morceau, ${Math.round(stat.octets / 1e6)} Mo, ${secondes()}`);
  }
  fs.unlinkSync(fichierMorceau(p));
  console.log(`morceau ${p + 1}/${PARTS} : ${nl} lignes, ${faites} espèces, ${secondes()}`);
}
fs.rmSync(MORCEAUX, { recursive: true, force: true });

// Cartes de présence : d'abord celles des autres sources GBIF (DOI 10.15468/dl.rb9sut, depuis 2000, toutes
// origines : plus fournies pour ces espèces rares), pour toute espèce qui n'a pas d'observation eBird ici,
// même si la règle lui a fait une carte ; sinon de ce téléchargement-ci (voir l'en-tête).
{
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
    if (e === undefined || k < 0 || !mois || eteintes.has(e) || (selection && !selection.has(e)) || (index[nomDe(e)] && !sansEbird.has(e))) continue;
    if (!parEsp.has(e)) parEsp.set(e, Array.from({ length: 12 }, () => new Map()));
    const g = parEsp.get(e)[mois - 1];
    g.set(k, (g.get(k) || 0) + +n);
  }
  let p = 0, o = 0;
  let remplacees = 0;
  for (const [e, mois] of parEsp) {
    const cadre = cartePresence(codeDe[e], mois);
    if (!cadre) continue;
    if (index[nomDe(e)]) remplacees++;
    index[nomDe(e)] = [codeDe[e], ...cadre, 'p']; bilan[nomDe(e)] = { src: 'p', code: codeDe[e] }; p++; enAttente.delete(e);
  }
  console.log(`présence des autres sources GBIF à la place de la règle (pas d'observation eBird) : ${remplacees}`);
  for (const [e, mois] of enAttente) {
    const cadre = cartePresence(codeDe[e], mois);
    if (cadre) { index[nomDe(e)] = [codeDe[e], ...cadre, 'o']; bilan[nomDe(e)] = { src: 'o', code: codeDe[e] }; o++; }
    else stat.vides++;
  }
  console.log(`présence : ${p} des autres sources GBIF, ${o} de ce téléchargement, ${secondes()}`);
  console.log('  de ce téléchargement :', Object.keys(index).filter(n => index[n][5] === 'o').join(', '));
}

// clés triées : un diff lisible d'une génération à l'autre
const tri = o => Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]]));
const fichierIndex = path.join(SORTIE, SEUL ? 'cartes-index-essai.json' : 'cartes-index.json');
fs.writeFileSync(fichierIndex, JSON.stringify(tri(index)));
fs.writeFileSync(path.join(SOURCES, 'tout', SEUL ? 'cartes-bilan-essai.json' : 'cartes-bilan.json'), JSON.stringify(tri(bilan), null, 1));
const noms = Object.keys(index), parSrc = s => noms.filter(n => index[n][5] === s).length;
const fiches = Object.values(bilan).filter(b => b.src === 'e');
console.log(`${noms.length} cartes (${parSrc('e')} par la règle, ${parSrc('p')} + ${parSrc('o')} de présence), ${stat.vides} espèces sans carte, ${eteintes.size} éteintes écartées, ${(stat.octets / 1e6).toFixed(1)} Mo de PNG écrits, ${secondes()}`);
console.log(`règle : ${fiches.filter(b => b.atlasEcartes).length} espèces avec un atlas écarté, ${fiches.filter(b => b.ajoutees && !b.etalonne).length} aux cases ajoutées au niveau médian, ${fiches.filter(b => b.ajoutees && b.etalonne).length} étalonnées`);
console.log(`aire iNaturalist : crue pour ${fiches.filter(b => b.aire?.crue).length} espèces, pas crue pour ${fiches.filter(b => b.aire?.crue === false).length}, absente pour ${fiches.filter(b => b.aire === 'absente').length} ; cases retirées hors de l'aire : ${fiches.reduce((s, b) => s + b.horsAire, 0)} sur l'année (${fiches.filter(b => b.horsAire).length} espèces), ${fiches.reduce((s, b) => s + b.horsAireMois, 0)} sur les 12 mois ; gardées hors de l'aire car près des listes : ${fiches.reduce((s, b) => s + b.prochesListes, 0)} sur l'année`);
console.log('index :', fichierIndex, Math.round(fs.statSync(fichierIndex).size / 1024), 'Ko');

// Bilan du téléchargement GBIF « toutes bases » (DOI 10.15468/dl.vnrtqk, clé 0038663-260928105237408,
// 21/10/2026 : 76 029 941 lignes, 10 367 jeux, oiseaux depuis 2015, observations humaines, incertitude
// <= 10 km). Une ligne = (species, v_scientificname, month, cellcode, jeu, n), où « jeu » est le début de la
// clé du jeu (8 caractères). Rien n'est encore mélangé aux cartes : ce script mesure, pour choisir la règle.
//
// Il écrit dans notes-privees/essai-cartes/tout/ :
//   effort-<classe>.bin  observations par case de 0,25° (Float32, 1440 x 720), une grille par classe de
//                        jeu (ebird, listes, isolees, ecarter : voir outils/build/gbif-jeux.mjs)
//   bilan.json           totaux par classe et par jeu, noms non rattachés, cases gagnées
//
// Les en-têtes du fichier sont en minuscules (la validation GBIF renvoie la requête normalisée) : les
// colonnes sont lues par leur nom, pas par leur place.
import { spawn } from 'node:child_process';

import fs from 'node:fs';
import path from 'node:path';

const RACINE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')), '..', '..');
const SOURCES = path.join(RACINE, 'notes-privees', 'essai-cartes');
const ZIP = process.env.ZIP || path.join(SOURCES, 'gbif-tout.zip');
const SORTIE = path.join(SOURCES, 'tout');
const CASE = 0.25, NI = 1440, NJ = 720, N = NI * NJ, SEUIL = 30;
fs.mkdirSync(SORTIE, { recursive: true });
const lire = f => JSON.parse(fs.readFileSync(path.join(SOURCES, f), 'utf8'));

// classes des jeux, par préfixe
const jeux = lire('gbif-jeux.json');
const classeDe = new Map(jeux.map(j => [j.prefixe, j.classe]));
const CLASSES = ['ebird', 'listes', 'isolees', 'ecarter'];

// Un morceau d'une chaîne garde en mémoire toute la chaîne d'où il vient : un code de case rangé tel quel
// dans un cache retenait le morceau de 64 Ko lu avec lui, et la mémoire saturait vers 30 millions de lignes
// (2026-10-21). On range donc une copie, une seule fois par clé nouvelle.
const copie = s => Buffer.from(s, 'utf8').toString('utf8');
// noms : même rattachement que cartes-gbif.mjs (nom exact, renommages, binôme)
const taxo = lire('taxonomie-ebird.json'), renommages = lire('gbif-renommages.json');
const indexEspece = new Map(taxo.map((t, i) => [t.sciName, i]));
const cacheNom = new Map();
function especeDe(nom) {
  let r = cacheNom.get(nom);
  if (r !== undefined) return r;
  r = -1;
  if (nom && !/ x |×|\bsp\.?$|spp?\.|\//.test(nom)) {
    const deux = nom.split(' ').slice(0, 2).join(' ');
    for (const essai of [nom, renommages[nom], deux, renommages[deux]]) if (essai !== undefined && indexEspece.has(essai)) { r = indexEspece.get(essai); break; }
  }
  cacheNom.set(copie(nom), r);
  return r;
}
// cases : même lecture du code GBIF_DMSGCode que cartes-gbif.mjs (coin sud-ouest)
const cacheCase = new Map();
function indexCase(code) {
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

const effort = Object.fromEntries(CLASSES.map(c => [c, new Float32Array(N)]));
const parJeu = new Map(), parClasse = Object.fromEntries(CLASSES.map(c => [c, 0]));
const nonRattaches = new Map();
let lignes = 0, obs = 0, horsGrille = 0, inconnus = 0, rattachees = 0;
let col = null;
const t0 = Date.now();
function traiter(l) {
  if (l.endsWith('\r')) l = l.slice(0, -1);
  if (!l) return;
  if (!col) { col = Object.fromEntries(l.toLowerCase().split('\t').map((c, i) => [c, i])); return; }
  const c = l.split('\t');
  const n = +c[col.n], jeu = c[col.jeu];
  lignes++; obs += n;
  let cl = classeDe.get(jeu);
  if (!cl) { cl = 'isolees'; inconnus += n; }
  parClasse[cl] += n;
  parJeu.set(parJeu.has(jeu) ? jeu : copie(jeu), (parJeu.get(jeu) || 0) + n);
  const k = indexCase(c[col.cellcode]);
  if (k < 0) { horsGrille += n; return; }
  effort[cl][k] += n;
  const nom = c[col.v_scientificname];
  if (especeDe(nom) >= 0 || especeDe(c[col.species]) >= 0) rattachees += n;
  else nonRattaches.set(nonRattaches.has(nom) ? nom : copie(nom), (nonRattaches.get(nom) || 0) + n);
  if (lignes % 10e6 === 0) console.log(lignes / 1e6, 'M lignes,', Math.round((Date.now() - t0) / 1000), 's');
}
// Lecture par morceaux, traités dans l'événement même : le flux attend qu'on ait fini. L'itérateur de
// readline, lui, empile les lignes plus vite qu'on ne les traite : mémoire saturée sur les 6,7 Go du fichier
// (plantage du 2026-10-21).
const entree = ZIP.endsWith('.zip') ? spawn('unzip', ['-p', ZIP]).stdout : fs.createReadStream(ZIP);
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
for (const cl of CLASSES) fs.writeFileSync(path.join(SORTIE, `effort-${cl}.bin`), Buffer.from(effort[cl].buffer));

// cases qui atteignent le seuil : eBird seul, puis en ajoutant les listes complètes, puis tout (sauf écartés)
let a = 0, b = 0, t = 0;
for (let k = 0; k < N; k++) {
  const e = effort.ebird[k], li = effort.listes[k], is = effort.isolees[k];
  if (e >= SEUIL) a++;
  if (e + li >= SEUIL) b++;
  if (e + li + is >= SEUIL) t++;
}
const bilan = {
  lignes, obs, horsGrille, jeuxInconnus: inconnus, rattachees, parClasse,
  cases: { ebird: a, ebirdEtListes: b, tout: t },
  jeux: [...parJeu].sort((x, y) => y[1] - x[1]).slice(0, 60).map(([p, v]) => ({ prefixe: p, obs: v, classe: classeDe.get(p) || 'inconnu', titre: jeux.find(j => j.prefixe === p)?.titre || '' })),
  nonRattaches: [...nonRattaches].sort((x, y) => y[1] - x[1]).slice(0, 80),
  nonRattachesTotal: [...nonRattaches.values()].reduce((s, v) => s + v, 0),
};
fs.writeFileSync(path.join(SORTIE, 'bilan.json'), JSON.stringify(bilan, null, 1));
console.log(`${lignes} lignes, ${obs} observations en ${Math.round((Date.now() - t0) / 1000)} s`);
console.log('par classe :', JSON.stringify(parClasse), '| jeux absents de la table :', inconnus, '| hors grille :', horsGrille);
console.log(`noms rattachés : ${(100 * rattachees / (obs - horsGrille)).toFixed(2)} % des observations`);
console.log(`cases à 30 observations ou plus : eBird ${a}, + listes complètes ${b}, + observations isolées ${t}`);

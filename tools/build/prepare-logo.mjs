// Prepare une image de logo candidate pour le banc d'essai local.
//
// Deux traitements, au choix :
//   --detoure   enleve le fond uni, recadre sur le dessin, complete en carre transparent
//   --tuile     enleve le fond uni et le remplace par un carre a bords arrondis d'une
//               couleur donnee, SANS recadrer - la composition d'origine est gardee,
//               y compris ce qui deborde des bords (c'est le principe d'une icone).
//
// Le fond est detecte par propagation depuis les bords : tout ce qui touche un bord et
// ressemble a la couleur des coins part. Un fond uni s'en va proprement, un fond
// degrade non - ce n'est pas un detoureur universel.
//
// Option commune --palette : remplace des couleurs par d'autres avant tout le reste.
// Utile parce que ces images sont en aplats : on peut donc les accorder a la palette du
// site sans rien regenerer. Chaque pixel prend la couleur cible la plus proche de sa
// couleur source ; au-dela de DISTANCE_PALETTE il n'est pas touche. La perte du lisse
// des bords est rattrapee par la reduction de taille, qui remoyenne tout.
//
// Usage :
//   node tools/build/prepare-logo.mjs --detoure <entree.png> <sortie.png> [taille]
//   node tools/build/prepare-logo.mjs --tuile <entree.png> <sortie.png> <#RRGGBB> [taille]
//   ... --palette "#C05E33>#0B7C77,#9E4523>#075A56"

import { readFileSync, writeFileSync } from 'node:fs';
import { lirePng, ecrirePng, reduire } from './png-simple.mjs';

// Seuils serres, et c'est voulu : le fond a effacer est un aplat uniforme, donc une
// tolerance large ne sert a rien et fait des degats. Mesure du 2026-09-28 : a 42, la
// gorge creme de la huppe (240,232,224) etait mangee par le fond vert-gris
// (233,240,237) dont elle n'est distante que de 17. Elle passait de 6 % de l'image a
// moins de 2 %. Ne pas relacher ces valeurs sans remesurer.
// La bande d'adoucissement doit rester ETROITE pour la meme raison : a 12-28, la gorge
// creme tombait dedans et ne gardait que 31 % de son opacite. Elle est a 8-16.
const TOLERANCE_DURE = 8;    // en dessous : c'est le fond, on efface
const TOLERANCE_DOUCE = 16;  // entre les deux : bord adouci, alpha proportionnel
const RATIO_RAYON = 0.196;   // meme ratio que la pastille du site (22 px sur 112)
const MARGE_DETOURE = 1.08;  // 4 % de vide de chaque cote

function distance(a, b, c, r, v, bl) {
  return Math.sqrt((a - r) ** 2 + (b - v) ** 2 + (c - bl) ** 2);
}

// Cherche la couleur du fond a effacer, en deux temps.
//
// Pourquoi deux temps : les images rendues par Arrow 2 ont une marge DEJA transparente
// autour d'un panneau plein - blanc a 60 % d'opacite sur l'une, vert-gris opaque sur
// l'autre. Une propagation partant des coins s'arrete donc au premier pixel du panneau
// et n'efface que la marge. Mesure du 2026-09-28 : 9,2 % efface au lieu de 45 %.
// On traverse d'abord le transparent, on note la couleur des pixels rencontres, et
// c'est la dominante qui sert de reference.
function couleursFond(rvba, L, H) {
  const vu = new Uint8Array(L * H);
  const pile = [];
  for (let x = 0; x < L; x++) { pile.push(x); pile.push((H - 1) * L + x); }
  for (let y = 0; y < H; y++) { pile.push(y * L); pile.push(y * L + L - 1); }

  const compte = new Map();
  let rencontres = 0;
  while (pile.length) {
    const p = pile.pop();
    if (vu[p]) continue;
    vu[p] = 1;
    if (rvba[p * 4 + 3] >= 8) {
      const i = p * 4;
      const cle = `${rvba[i] >> 3},${rvba[i + 1] >> 3},${rvba[i + 2] >> 3}`;
      compte.set(cle, (compte.get(cle) ?? 0) + 1);
      rencontres++;
      continue; // on ne traverse que le transparent a ce stade
    }
    const x = p % L, y = (p / L) | 0;
    if (x > 0) pile.push(p - 1);
    if (x < L - 1) pile.push(p + 1);
    if (y > 0) pile.push(p - L);
    if (y < H - 1) pile.push(p + L);
  }

  const seeds = [[0, 0], [L - 1, 0], [0, H - 1], [L - 1, H - 1]]
    .map(([x, y]) => { const i = (y * L + x) * 4; return rvba[i + 3] >= 8 ? [rvba[i], rvba[i + 1], rvba[i + 2]] : null; })
    .filter(Boolean);

  // La dominante ne compte que si elle represente vraiment un panneau, pas un detail.
  const top = [...compte.entries()].sort((a, b) => b[1] - a[1])[0];
  if (top && top[1] / Math.max(1, rencontres) > 0.2) {
    seeds.push(top[0].split(',').map((v) => Number(v) * 8 + 4));
  }
  return seeds;
}

// Marque tout ce qui touche un bord et ressemble au fond.
// Rend un Float32Array d'opacite (1 = on garde, 0 = fond).
function masqueFond(rvba, L, H) {
  const coins = couleursFond(rvba, L, H);

  const opacite = new Float32Array(L * H).fill(1);
  const vu = new Uint8Array(L * H);
  const pile = [];

  const proche = (p) => {
    const i = p * 4;
    if (rvba[i + 3] === 0) return 0; // deja transparent : c'est du fond
    let min = Infinity;
    for (const [r, v, b] of coins) min = Math.min(min, distance(rvba[i], rvba[i + 1], rvba[i + 2], r, v, b));
    return min;
  };

  for (let x = 0; x < L; x++) { pile.push(x); pile.push((H - 1) * L + x); }
  for (let y = 0; y < H; y++) { pile.push(y * L); pile.push(y * L + L - 1); }

  while (pile.length) {
    const p = pile.pop();
    if (vu[p]) continue;
    vu[p] = 1;
    const d = proche(p);
    if (d >= TOLERANCE_DOUCE) continue;       // vrai dessin : on s'arrete la
    opacite[p] = d <= TOLERANCE_DURE ? 0 : (d - TOLERANCE_DURE) / (TOLERANCE_DOUCE - TOLERANCE_DURE);
    const x = p % L, y = (p / L) | 0;
    if (x > 0) pile.push(p - 1);
    if (x < L - 1) pile.push(p + 1);
    if (y > 0) pile.push(p - L);
    if (y < H - 1) pile.push(p + L);
  }
  return opacite;
}

function appliqueOpacite(rvba, opacite) {
  for (let p = 0; p < opacite.length; p++) {
    rvba[p * 4 + 3] = Math.round(rvba[p * 4 + 3] * opacite[p]);
  }
}

function recadre(rvba, L, H) {
  let xMin = L, xMax = -1, yMin = H, yMax = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < L; x++) {
      if (rvba[(y * L + x) * 4 + 3] > 8) {
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
  }
  const l = xMax - xMin + 1, h = yMax - yMin + 1;
  const cote = Math.round(Math.max(l, h) * MARGE_DETOURE);
  const out = new Uint8Array(cote * cote * 4);
  const dx = Math.round((cote - l) / 2), dy = Math.round((cote - h) / 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < l; x++) {
      const s = ((y + yMin) * L + (x + xMin)) * 4;
      out.set(rvba.subarray(s, s + 4), ((y + dy) * cote + (x + dx)) * 4);
    }
  }
  return { rvba: out, cote, utile: `${l}x${h}` };
}

// Pose le dessin sur un carre plein a bords arrondis. Le coin est adouci par
// sur-echantillonnage : sans ca, l'arrondi fait un escalier visible.
function tuile(rvba, L, H, couleur) {
  const [r, v, b] = couleur;
  const rayon = Math.min(L, H) * RATIO_RAYON;
  const out = new Uint8Array(L * H * 4);
  const SS = 3;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < L; x++) {
      let dedans = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS, py = y + (sy + 0.5) / SS;
          const cx = Math.min(Math.max(px, rayon), L - rayon);
          const cy = Math.min(Math.max(py, rayon), H - rayon);
          if ((px - cx) ** 2 + (py - cy) ** 2 <= rayon ** 2) dedans++;
        }
      }
      const aFond = (dedans / (SS * SS)) * 255;
      const i = (y * L + x) * 4;
      const aDessin = rvba[i + 3] / 255;
      // Dessin par-dessus le fond, puis le tout limite a la forme arrondie.
      out[i] = Math.round(rvba[i] * aDessin + r * (1 - aDessin));
      out[i + 1] = Math.round(rvba[i + 1] * aDessin + v * (1 - aDessin));
      out[i + 2] = Math.round(rvba[i + 2] * aDessin + b * (1 - aDessin));
      out[i + 3] = Math.round(aFond);
    }
  }
  return out;
}

const DISTANCE_PALETTE = 110; // au-dela, la couleur n'appartient a aucune entree : on n'y touche pas

function lisHex(hex) {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) throw new Error(`couleur attendue au format #RRGGBB, recu ${hex}`);
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function appliquePalette(rvba, paires) {
  let touches = 0;
  for (let p = 0; p < rvba.length / 4; p++) {
    const i = p * 4;
    if (rvba[i + 3] === 0) continue;
    let meilleure = null, min = Infinity;
    for (const [src, dst] of paires) {
      const d = distance(rvba[i], rvba[i + 1], rvba[i + 2], src[0], src[1], src[2]);
      if (d < min) { min = d; meilleure = dst; }
    }
    if (min > DISTANCE_PALETTE) continue;
    rvba[i] = meilleure[0]; rvba[i + 1] = meilleure[1]; rvba[i + 2] = meilleure[2];
    touches++;
  }
  return touches;
}

// ---------- programme ----------

const args = process.argv.slice(2);
let paires = null;
const iPalette = args.indexOf('--palette');
if (iPalette !== -1) {
  paires = args[iPalette + 1].split(',').map((p) => {
    const [a, b] = p.split('>');
    return [lisHex(a.trim()), lisHex(b.trim())];
  });
  args.splice(iPalette, 2);
}

const [mode, entree, sortie, ...reste] = args;
if (!['--detoure', '--tuile'].includes(mode)) throw new Error('mode attendu : --detoure ou --tuile');

const img = lirePng(readFileSync(entree));
const opacite = masqueFond(img.rvba, img.largeur, img.hauteur);
const efface = opacite.reduce((n, o) => n + (o < 1 ? 1 : 0), 0);
appliqueOpacite(img.rvba, opacite);
console.log(`${entree}`);
console.log(`  ${img.largeur}x${img.hauteur}, fond efface sur ${(100 * efface / opacite.length).toFixed(1)} % des pixels`);

if (paires) {
  const touches = appliquePalette(img.rvba, paires);
  console.log(`  palette : ${paires.length} correspondances, ${(100 * touches / (img.largeur * img.hauteur)).toFixed(1)} % des pixels recolores`);
}

let pixels, L, H;
if (mode === '--detoure') {
  const r = recadre(img.rvba, img.largeur, img.hauteur);
  pixels = r.rvba; L = r.cote; H = r.cote;
  console.log(`  dessin utile ${r.utile}, carre ${L}x${L}`);
  const taille = Number(reste[0]);
  if (taille) { pixels = reduire(pixels, L, H, taille); L = H = taille; }
} else {
  const hex = reste[0];
  if (!/^#[0-9a-fA-F]{6}$/.test(hex ?? '')) throw new Error('couleur attendue au format #RRGGBB');
  const couleur = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  pixels = tuile(img.rvba, img.largeur, img.hauteur, couleur);
  L = img.largeur; H = img.hauteur;
  console.log(`  tuile ${hex}, coins arrondis au rayon ${(RATIO_RAYON * 100).toFixed(1)} %`);
  const taille = Number(reste[1]);
  if (taille) { pixels = reduire(pixels, L, H, taille); L = H = taille; }
}

const png = ecrirePng(pixels, L, H);
writeFileSync(sortie, png);
console.log(`  ecrit ${sortie}  ${L}x${H}  ${(png.length / 1024).toFixed(1)} Ko`);

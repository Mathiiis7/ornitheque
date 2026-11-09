// Image de trophee deja detouree : miettes retirees et liseré clair du contour repeint, sur toute l'image.
//   node outils/build/_lisere.mjs <source.png> <sortie.png>
// Meme calcul que outils/build/_navire.mjs (oiseaux) et _pelican.mjs : chaque pixel des trois premiers anneaux du
// bord plus clair de 15 que l'interieur voisin en reprend la couleur, sa part de clair devenant de la transparence.
// A ne PAS passer sur une image dont le bord est clair pour de vrai (voiles, plumage creme) : le liseré se juge
// a la loupe avant (outils/verif/_loupe-image.mjs). Premier usage : le t-shirt d'Ecologue 100 (10/11).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { lirePng, ecrirePng } from './png-simple.mjs';

const [SRC, SORTIE] = process.argv.slice(2);
const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(SRC));
const a = new Uint8Array(rvba);
const op = p => a[p*4+3] > 20, lum = p => 0.2126*a[p*4] + 0.7152*a[p*4+1] + 0.0722*a[p*4+2];

// Miettes (moins de 200 px, 8 voisins)
const lab = new Int32Array(W * H).fill(-1), tailles = [];
for(let p0 = 0; p0 < W * H; p0++){
  if(lab[p0] >= 0 || !op(p0)) continue;
  const id = tailles.length, px = [p0]; lab[p0] = id;
  for(let k = 0; k < px.length; k++){ const p = px[k], x = p % W, y = (p / W) | 0;
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const X = x + dx, Y = y + dy;
      if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X; if(lab[q] < 0 && op(q)){ lab[q] = id; px.push(q); } } }
  tailles.push(px.length);
}
let n = 0; for(let p = 0; p < W * H; p++) if(lab[p] >= 0 && tailles[lab[p]] < 200){ a[p*4+3] = 0; n++; }
console.log('morceaux :', tailles.length, '; miettes retirees :', n, 'px');

const dist = new Uint8Array(W * H).fill(255); let front = [];
for(let p = 0; p < W * H; p++) if(!op(p)){ dist[p] = 0; front.push(p); }
for(let d = 1; d <= 6; d++){ const suiv = [];
  for(const p of front){ const x = p % W, y = (p / W) | 0;
    for(const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
      if(q >= 0 && dist[q] === 255){ dist[q] = d; suiv.push(q); } }
  front = suiv; }
const nouveau = [];
for(let p = 0; p < W * H; p++){
  if(dist[p] < 1 || dist[p] > 3) continue;   // 3 anneaux : le t-shirt avait un liseré de 3 px
  const x = p % W, y = (p / W) | 0; let r = 0, g = 0, b = 0, k = 0;
  for(const [rayon, prof] of [[5, 4], [7, 4], [9, dist[p] + 1]]){
    r = g = b = k = 0;
    for(let dy = -rayon; dy <= rayon; dy++) for(let dx = -rayon; dx <= rayon; dx++){ const X = x + dx, Y = y + dy;
      if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X;
      if(dist[q] >= prof && op(q)){ r += a[q*4]; g += a[q*4+1]; b += a[q*4+2]; k++; } }
    if(k >= 3) break;
  }
  if(k < 3) continue;
  r /= k; g /= k; b /= k; const lc = 0.2126*r + 0.7152*g + 0.0722*b, lp = lum(p);
  if(lp < lc + 15 || lc >= 250) continue;
  nouveau.push([p, r, g, b, Math.round(Math.max(0, Math.min(1, (255 - lp) / (255 - lc))) * a[p*4+3])]);
}
for(const [p, r, g, b, al] of nouveau){ a[p*4] = r; a[p*4+1] = g; a[p*4+2] = b; a[p*4+3] = al; }
console.log('liseré du contour :', nouveau.length, 'px repeints');
mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, ecrirePng(a, W, H));
console.log('ecrit', SORTIE);

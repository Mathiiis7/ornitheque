// Image du trophee « Magellan » (navire, Mathis 10/11), a partir du modele deja detoure :
//   node outils/build/_navire.mjs
// 1. Les miettes isolees (moins de 200 px ; un point de 6 px pres du grand mat).
// 2. Le liseré beige des six oiseaux (« autour des oiseaux il y a encore du blanc ») : 1 a 2 px clairs sur leur
//    bord bas, releves a la loupe. Sur chaque oiseau seulement (morceaux de moins de 5 000 px, le navire en fait
//    150 000 et ses voiles sont claires pour de vrai), chaque pixel des deux premiers anneaux plus clair de 15 que
//    l'interieur voisin en reprend la couleur, sa part de clair devenant de la transparence (meme calcul que
//    outils/build/_pelican.mjs).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { lirePng, ecrirePng } from './png-simple.mjs';

const SRC = 'notes-privees/trophees/images/navire/modele.png', SORTIE = 'assets/trophies/themes/navire/navire.png';
const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(SRC));
const a = new Uint8Array(rvba);
const op = p => a[p*4+3] > 20, lum = p => 0.2126*a[p*4] + 0.7152*a[p*4+1] + 0.0722*a[p*4+2];

// Les morceaux opaques (8 voisins)
const lab = new Int32Array(W * H).fill(-1), tailles = [];
for(let p0 = 0; p0 < W * H; p0++){
  if(lab[p0] >= 0 || !op(p0)) continue;
  const id = tailles.length, px = [p0]; lab[p0] = id;
  for(let k = 0; k < px.length; k++){ const p = px[k], x = p % W, y = (p / W) | 0;
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const X = x + dx, Y = y + dy;
      if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X; if(lab[q] < 0 && op(q)){ lab[q] = id; px.push(q); } } }
  tailles.push(px.length);
}
// 1. Miettes
let n = 0; for(let p = 0; p < W * H; p++) if(lab[p] >= 0 && tailles[lab[p]] < 200){ a[p*4+3] = 0; n++; }
console.log('morceaux :', tailles.length, '; miettes retirees :', n, 'px');
const oiseau = p => lab[p] >= 0 && tailles[lab[p]] >= 200 && tailles[lab[p]] < 5000;
console.log('oiseaux :', tailles.filter(t => t >= 200 && t < 5000).length);

// 2. Le liseré des oiseaux
const dist = new Uint8Array(W * H).fill(255); let front = [];
for(let p = 0; p < W * H; p++) if(!op(p)){ dist[p] = 0; front.push(p); }
for(let d = 1; d <= 4; d++){ const suiv = [];
  for(const p of front){ const x = p % W, y = (p / W) | 0;
    for(const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
      if(q >= 0 && dist[q] === 255){ dist[q] = d; suiv.push(q); } }
  front = suiv; }
const nouveau = [];
for(let p = 0; p < W * H; p++){
  if((dist[p] !== 1 && dist[p] !== 2) || !oiseau(p)) continue;
  const x = p % W, y = (p / W) | 0; let r = 0, g = 0, b = 0, k = 0;
  for(const [rayon, prof] of [[4, 3], [6, 3], [8, dist[p] + 1]]){
    r = g = b = k = 0;
    for(let dy = -rayon; dy <= rayon; dy++) for(let dx = -rayon; dx <= rayon; dx++){ const X = x + dx, Y = y + dy;
      if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X;
      if(dist[q] >= prof && op(q) && lab[q] === lab[p]){ r += a[q*4]; g += a[q*4+1]; b += a[q*4+2]; k++; } }
    if(k >= 3) break;
  }
  if(k < 3) continue;
  r /= k; g /= k; b /= k; const lc = 0.2126*r + 0.7152*g + 0.0722*b, lp = lum(p);
  if(lp < lc + 15) continue;
  nouveau.push([p, r, g, b, Math.round(Math.max(0, Math.min(1, (255 - lp) / (255 - lc))) * a[p*4+3])]);
}
for(const [p, r, g, b, al] of nouveau){ a[p*4] = r; a[p*4+1] = g; a[p*4+2] = b; a[p*4+3] = al; }
console.log('liseré des oiseaux :', nouveau.length, 'px repeints');
mkdirSync('assets/trophies/themes/navire', { recursive: true });
writeFileSync(SORTIE, ecrirePng(a, W, H));
console.log('ecrit', SORTIE);

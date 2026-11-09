// Image du trophee « Grosse bouche » (pelican, Mathis 10/11), en trois retouches sur le modele deja detoure :
//   node outils/build/_pelican.mjs
// 1. Les miettes isolees (un point de 3 px : la vitrine cadre l'image sur tout ce qui est opaque).
// 2. Le trou du bec, entre le poisson et la mandibule du haut : un ancien fond reste opaque, de la meme
//    couleur creme que le plumage (environ 231, 223, 202), donc impossible a retirer a la couleur seule.
//    On le vide a partir d'un point au milieu (500, 612), sans sortir d'un cadre autour du bec ni passer
//    les bords plus fonces (poisson, bec orange). Cadre et point releves a la loupe (_loupe-image.mjs).
// 3. Le liseré clair du contour (« un peu sur les contours ») : chaque pixel des deux premiers anneaux plus
//    clair de 15 que l'interieur voisin en reprend la couleur, sa part de blanc devenant de la transparence
//    (meme calcul que outils/build/_niveaux-aigles.mjs).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { lirePng, ecrirePng } from './png-simple.mjs';

const SRC = 'notes-privees/trophees/images/pelican/modele.png', SORTIE = 'assets/trophies/themes/pelican/pelican.png';
const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(SRC));
const a = new Uint8Array(rvba);
const op = p => a[p*4+3] > 20, lum = p => 0.2126*a[p*4] + 0.7152*a[p*4+1] + 0.0722*a[p*4+2];

// 1. Miettes
{
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
  console.log('miettes retirees :', n, 'px');
}
// 2. Le trou du bec
{
  const CADRE = [470, 585, 540, 640], GRAINE = [500, 612];
  const clair = p => op(p) && lum(p) > 195 && Math.min(a[p*4], a[p*4+1], a[p*4+2]) > 170;
  const pile = [GRAINE[1] * W + GRAINE[0]], vu = new Uint8Array(W * H); let n = 0;
  if(!clair(pile[0])) throw new Error('le point de depart du bec n est pas clair : le modele a change ?');
  while(pile.length){ const p = pile.pop(); if(vu[p]) continue; vu[p] = 1;
    const x = p % W, y = (p / W) | 0; if(x < CADRE[0] || x > CADRE[2] || y < CADRE[1] || y > CADRE[3] || !clair(p)) continue;
    a[p*4+3] = 0; n++; pile.push(p - 1, p + 1, p - W, p + W); }
  console.log('trou du bec vide :', n, 'px');
}
// 3. Le liseré du contour
{
  const dist = new Uint8Array(W * H).fill(255); let front = [];
  for(let p = 0; p < W * H; p++) if(!op(p)){ dist[p] = 0; front.push(p); }
  for(let d = 1; d <= 4; d++){ const suiv = [];
    for(const p of front){ const x = p % W, y = (p / W) | 0;
      for(const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
        if(q >= 0 && dist[q] === 255){ dist[q] = d; suiv.push(q); } }
    front = suiv; }
  const nouveau = [];
  for(let p = 0; p < W * H; p++){
    if(dist[p] !== 1 && dist[p] !== 2) continue;
    const x = p % W, y = (p / W) | 0; let r = 0, g = 0, b = 0, k = 0;
    for(const [rayon, prof] of [[4, 4], [6, 3], [8, dist[p] + 1]]){
      r = g = b = k = 0;
      for(let dy = -rayon; dy <= rayon; dy++) for(let dx = -rayon; dx <= rayon; dx++){ const X = x + dx, Y = y + dy;
        if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X;
        if(dist[q] >= prof && op(q)){ r += a[q*4]; g += a[q*4+1]; b += a[q*4+2]; k++; } }   // 255 = interieur
      if(k >= 3) break;
    }
    if(k < 3) continue;
    r /= k; g /= k; b /= k; const lc = 0.2126*r + 0.7152*g + 0.0722*b, lp = lum(p);
    if(lp < lc + 15 || lc >= 250) continue;
    nouveau.push([p, r, g, b, Math.round(Math.max(0, Math.min(1, (255 - lp) / (255 - lc))) * a[p*4+3])]);
  }
  for(const [p, r, g, b, al] of nouveau){ a[p*4] = r; a[p*4+1] = g; a[p*4+2] = b; a[p*4+3] = al; }
  console.log('liseré du contour :', nouveau.length, 'px repeints');
}
// 4. Autour du trou du bec, le liseré est plus large (« encore du blanc dans la bouche », Mathis 10/11) : des
//    pixels cremes opaques a 3 et 4 px du trou, cote poisson (relevés : 165-202 de rouge en x 481-483, y 594 ;
//    96-155 en x 482-483, y 603-606, contre 30-60 pour le poisson). Dans un cadre autour du bec seulement, chaque
//    pixel a 1 a 5 px du vide plus clair de 15 que l'interieur voisin (6 px et plus) en prend la couleur.
{
  const CADRE = [460, 575, 550, 650];
  const dist = new Uint8Array(W * H).fill(255); let front = [];
  for(let p = 0; p < W * H; p++) if(!op(p)){ dist[p] = 0; front.push(p); }
  for(let d = 1; d <= 6; d++){ const suiv = [];
    for(const p of front){ const x = p % W, y = (p / W) | 0;
      for(const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
        if(q >= 0 && dist[q] === 255){ dist[q] = d; suiv.push(q); } }
    front = suiv; }
  const nouveau = [];
  for(let y = CADRE[1]; y <= CADRE[3]; y++) for(let x = CADRE[0]; x <= CADRE[2]; x++){
    const p = y * W + x; if(dist[p] < 1 || dist[p] > 5) continue;
    let r = 0, g = 0, b = 0, k = 0;
    for(let dy = -7; dy <= 7; dy++) for(let dx = -7; dx <= 7; dx++){ const q = (y + dy) * W + x + dx;
      if(dist[q] >= 6 && op(q)){ r += a[q*4]; g += a[q*4+1]; b += a[q*4+2]; k++; } }
    if(k < 3) continue;
    r /= k; g /= k; b /= k; const lc = 0.2126*r + 0.7152*g + 0.0722*b;
    if(lum(p) < lc + 15) continue;
    nouveau.push([p, r, g, b]);
  }
  for(const [p, r, g, b] of nouveau){ a[p*4] = r; a[p*4+1] = g; a[p*4+2] = b; }
  console.log('liseré du trou du bec :', nouveau.length, 'px repeints');
}
// 5. Le coin creme entre le ventre du poisson et la machoire du bas (x 393-410, y 584-598, releve par une carte
//    des pixels clairs) : sur le fond sombre de la vitrine, il ressortait en blanc. Il prend l'orange de la
//    machoire voisine, transparence gardee.
{
  const CADRE = [385, 580, 420, 602];
  const creme = p => a[p*4+3] > 0 && lum(p) > 140 && a[p*4] - a[p*4+2] < 90;
  const orange = p => a[p*4+3] > 200 && lum(p) > 100 && a[p*4] - a[p*4+2] >= 90;
  const nouveau = [];
  for(let y = CADRE[1]; y <= CADRE[3]; y++) for(let x = CADRE[0]; x <= CADRE[2]; x++){
    const p = y * W + x; if(!creme(p)) continue;
    let r = 0, g = 0, b = 0, k = 0;
    for(let rayon = 4; rayon <= 10 && k < 3; rayon += 3){ r = g = b = k = 0;
      for(let dy = -rayon; dy <= rayon; dy++) for(let dx = -rayon; dx <= rayon; dx++){ const q = (y + dy) * W + x + dx;
        if(orange(q)){ r += a[q*4]; g += a[q*4+1]; b += a[q*4+2]; k++; } } }
    if(k >= 3) nouveau.push([p, r / k, g / k, b / k]);
  }
  for(const [p, r, g, b] of nouveau){ a[p*4] = r; a[p*4+1] = g; a[p*4+2] = b; }
  console.log('coin creme sous le poisson :', nouveau.length, 'px repeints');
}
mkdirSync('assets/trophies/themes/pelican', { recursive: true });
writeFileSync(SORTIE, ecrirePng(a, W, H));
console.log('ecrit', SORTIE);

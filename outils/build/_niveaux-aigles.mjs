// Trois niveaux d'« Armee d'aigles royaux » a partir de la nouvelle image aux trois aigles de Mathis
// (09/11) : niveau 1 = l'aigle pose sur le rocher, niveau 2 = + celui de droite, niveau 3 = + celui du
// haut. Le rocher et le socle restent a tous les niveaux.
//   node outils/build/_niveaux-aigles.mjs
// L'image n'a pas de transparence (fond blanc opaque) : on retire d'abord le blanc relie aux bords.
// Les trois aigles ne se touchent pas : chaque morceau opaque est range d'apres son centre (aigle du
// haut : centre au-dessus de y = 610 ; aigle de droite : centre a droite de x = 665 et au-dessus de
// y = 770 ; le reste est l'aigle pose, le rocher et le socle). Bornes relevees sur l'image de 1264 px.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { lirePng, ecrirePng } from './png-simple.mjs';

const SRC = 'notes-privees/trophees/images/armee-aigles-royaux/modele-trois-aigles.png';
const SORTIES = ['notes-privees/trophees/images/armee-aigles-royaux', 'assets/trophies/themes/armee-aigles-royaux'];
const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(SRC));
const a = new Uint8Array(rvba);

// 1. Fond blanc relie aux bords -> transparent (seuil 232, comme la vitrine)
const blanc = p => a[p*4] > 232 && a[p*4+1] > 232 && a[p*4+2] > 232;
const vu = new Uint8Array(W * H), pile = [];
for(let x = 0; x < W; x++) pile.push(x, (H - 1) * W + x); for(let y = 0; y < H; y++) pile.push(y * W, y * W + W - 1);
let fond = 0;
while(pile.length){ const p = pile.pop(); if(vu[p] || !blanc(p)) continue; vu[p] = 1; a[p*4+3] = 0; fond++; const x = p % W, y = (p / W) | 0;
  if(x > 0) pile.push(p - 1); if(x < W - 1) pile.push(p + 1); if(y > 0) pile.push(p - W); if(y < H - 1) pile.push(p + W); }

// 1 bis. Poches de blanc pur enfermees (pas reliees aux bords) : un coin de fond restait entre la queue
//    de l'aigle pose et le rocher. Seuil plus strict (240) et au moins 30 px, pour ne pas toucher aux
//    reflets clairs du rocher ou des plumes.
const pur = p => a[p*4+3] && a[p*4] > 240 && a[p*4+1] > 240 && a[p*4+2] > 240;
const vuP = new Uint8Array(W * H); let poches = 0;
for(let p0 = 0; p0 < W * H; p0++){
  if(vuP[p0] || !pur(p0)) continue;
  const px = [p0]; vuP[p0] = 1;
  for(let k = 0; k < px.length; k++){ const p = px[k], x = p % W, y = (p / W) | 0;
    for(const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1]) if(q >= 0 && !vuP[q] && pur(q)){ vuP[q] = 1; px.push(q); } }
  if(px.length >= 30){ for(const p of px) a[p*4+3] = 0; poches += px.length; }
}
console.log('poches de blanc enfermees retirees :', poches, 'px');
// 1 ter. Les liserés : un filet blanc de 1 a 2 px restait coince entre la queue et le rocher (Mathis,
//    09/11), et un fin liseré clair borde tout le detourage. Le dessin ne contient aucun blanc (plumes
//    beiges, rocher ocre : leur plus petit canal reste sous 200) : tout pixel clair et sans couleur
//    (plus petit canal > 205, ecart entre canaux < 30) est du fond, on le retire partout.
let liseres = 0;
for(let p = 0; p < W * H; p++){
  if(!a[p*4+3]) continue;
  const r = a[p*4], g = a[p*4+1], b = a[p*4+2], mn = Math.min(r, g, b), mx = Math.max(r, g, b);
  if(mn > 205 && mx - mn < 30){ a[p*4+3] = 0; liseres++; }
}
console.log('liseres clairs retires :', liseres, 'px');

// 1 quater. Le reste du liseré (Mathis, 10/11 : « il reste encore un peu de blanc ») : les deux premiers
//    anneaux du bord sont un melange du dessin et de l'ancien fond blanc. Mesure : anneau 1 plus clair
//    de 74 en moyenne que les pixels de l'interieur voisins, anneau 2 de 12, anneau 3 de 2 (rien).
//    Chaque pixel de ces anneaux plus clair que son interieur (pixels a 4 px ou plus du bord, dans un
//    carre de 9 px) reprend la couleur de l'interieur, et sa part de blanc devient de la transparence :
//    pixel = a x couleur + (1 - a) x blanc, donc a = (255 - lum pixel) / (255 - lum interieur).
{
  const op = p => a[p*4+3] > 20, lum = p => 0.2126*a[p*4] + 0.7152*a[p*4+1] + 0.0722*a[p*4+2];
  const dist = new Uint8Array(W * H).fill(255); let front = [];
  for(let p = 0; p < W * H; p++) if(!op(p)){ dist[p] = 0; front.push(p); }
  for(let d = 1; d <= 4; d++){ const suiv = [];
    for(const p of front){ const x = p % W, y = (p / W) | 0;
      for(const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
        if(q >= 0 && dist[q] === 255){ dist[q] = d; suiv.push(q); } }
    front = suiv; }
  let repeints = 0, effaces = 0; const nouveau = [];
  for(let p = 0; p < W * H; p++){
    if(dist[p] !== 1 && dist[p] !== 2) continue;
    const x = p % W, y = (p / W) | 0; let r = 0, g = 0, b = 0, k = 0;
    // Le bout d'une plume est trop fin pour avoir des pixels a 4 px du bord : on cherche alors plus loin,
    // et moins profond (toujours plus a l'interieur que le pixel lui-meme). Sans ce repli, des points
    // blancs restaient au bout des plumes.
    for(const [rayon, prof] of [[4, 4], [6, 3], [8, dist[p] + 1]]){
      r = g = b = k = 0;
      for(let dy = -rayon; dy <= rayon; dy++) for(let dx = -rayon; dx <= rayon; dx++){ const X = x + dx, Y = y + dy;
        if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X;
        if(dist[q] >= prof && op(q)){ r += a[q*4]; g += a[q*4+1]; b += a[q*4+2]; k++; } }   // 255 = au-dela de 4 px du bord : interieur
      if(k >= 3) break;
    }
    if(k < 3) continue;
    r /= k; g /= k; b /= k; const lc = 0.2126*r + 0.7152*g + 0.0722*b, lp = lum(p);
    if(lp < lc + 15 || lc >= 250) continue;
    const alpha = Math.max(0, Math.min(1, (255 - lp) / (255 - lc)));
    nouveau.push([p, r, g, b, Math.round(alpha * a[p*4+3])]);
  }
  for(const [p, r, g, b, al] of nouveau){ a[p*4] = r; a[p*4+1] = g; a[p*4+2] = b; a[p*4+3] = al; if(al <= 20) effaces++; else repeints++; }
  console.log('liseré du bord : ' + repeints + ' px repeints, ' + effaces + ' devenus transparents');
}
// 1 quinquies. Le fond blanc vu a travers les fentes entre deux plumes : des pixels gris clair (175 a 199)
//    qui ne touchent pas le vide, a 6 px au plus du bord, plus clairs de 35 que leurs voisins. Il y en avait
//    15, tous dans des fentes de plumes (aucun pres d'un oeil, plus loin du bord). Ils reprennent la
//    couleur moyenne de leurs voisins.
{
  const op = p => a[p*4+3] > 20, lum = p => 0.2126*a[p*4] + 0.7152*a[p*4+1] + 0.0722*a[p*4+2];
  const gris = p => { const mn = Math.min(a[p*4], a[p*4+1], a[p*4+2]), mx = Math.max(a[p*4], a[p*4+1], a[p*4+2]); return mn > 150 && mx - mn < 50; };
  const dist = new Uint8Array(W * H).fill(255); let front = [];
  for(let p = 0; p < W * H; p++) if(!op(p)){ dist[p] = 0; front.push(p); }
  for(let d = 1; d <= 6; d++){ const suiv = [];
    for(const p of front){ const x = p % W, y = (p / W) | 0;
      for(const q of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, y > 0 ? p - W : -1, y < H - 1 ? p + W : -1])
        if(q >= 0 && dist[q] === 255){ dist[q] = d; suiv.push(q); } }
    front = suiv; }
  const nouveau = [];
  for(let p = 0; p < W * H; p++){
    if(!op(p) || dist[p] > 6 || !gris(p)) continue;
    const x = p % W, y = (p / W) | 0; let r = 0, g = 0, b = 0, s = 0, k = 0;
    for(let dy = -2; dy <= 2; dy++) for(let dx = -2; dx <= 2; dx++){ const X = x + dx, Y = y + dy;
      if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X;
      if(q !== p && op(q) && !gris(q)){ r += a[q*4]; g += a[q*4+1]; b += a[q*4+2]; s += lum(q); k++; } }
    if(k >= 4 && lum(p) > s / k + 35) nouveau.push([p, r / k, g / k, b / k]);
  }
  for(const [p, r, g, b] of nouveau){ a[p*4] = r; a[p*4+1] = g; a[p*4+2] = b; }
  console.log('fentes entre les plumes :', nouveau.length, 'px repeints');
}

// 2. Les morceaux opaques (8 voisins), avec leur taille et leur centre
const lab = new Int32Array(W * H).fill(-1), morceaux = [];
for(let p0 = 0; p0 < W * H; p0++){
  if(lab[p0] >= 0 || !a[p0*4+3]) continue;
  const id = morceaux.length, px = [p0]; lab[p0] = id; let sx = 0, sy = 0;
  for(let k = 0; k < px.length; k++){ const p = px[k], x = p % W, y = (p / W) | 0; sx += x; sy += y;
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const X = x + dx, Y = y + dy;
      if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X; if(lab[q] < 0 && a[q*4+3]){ lab[q] = id; px.push(q); } } }
  morceaux.push({ id, n: px.length, cx: sx / px.length, cy: sy / px.length });
}
const classe = m => m.cy < 610 && m.cx < 665 ? 'haut' : (m.cx >= 665 && m.cy < 770 ? 'droite' : 'pose');
const gros = morceaux.filter(m => m.n > 200).map(m => `${classe(m)} ${m.n} px (centre ${Math.round(m.cx)}, ${Math.round(m.cy)})`);
console.log('fond retire :', fond, 'px ; morceaux de plus de 200 px :', gros.join(' | '));

// 3. Les niveaux : on efface les morceaux des aigles pas encore gagnes ; miettes de moins de 200 px
//    hors de l'aigle pose retirees aussi (poussiere du detourage)
const niveau = retirer => { const r = new Uint8Array(a);
  for(let p = 0; p < W * H; p++){ if(!r[p*4+3]) continue; const m = morceaux[lab[p]];
    if(retirer.includes(classe(m)) || m.n < 200) r[p*4+3] = 0; }
  return r; };
for(const dos of SORTIES){
  mkdirSync(dos, { recursive: true });
  writeFileSync(dos + '/niveau-1.png', ecrirePng(niveau(['haut', 'droite']), W, H));
  writeFileSync(dos + '/niveau-2.png', ecrirePng(niveau(['haut']), W, H));
  writeFileSync(dos + '/niveau-3.png', ecrirePng(niveau([]), W, H));
}
console.log('niveaux ecrits dans', SORTIES.join(' et '));

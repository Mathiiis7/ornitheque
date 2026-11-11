// Trois niveaux du trophee des echassiers (« Le Penseur ») a partir de l'image de Mathis (11/11) :
// niveau 1 = la spatule penchee a gauche (avec la branche), niveau 2 = + la spatule posee sur la branche a droite,
// niveau 3 = + les deux en vol (ordre voulu par Mathis le 11/11).
//   node outils/build/_niveaux-echassiers.mjs
// L'image est deja detouree (fond transparent). Les deux en vol sont des morceaux a part (centre au-dessus de
// y = 620). Mais le socle, la branche et les deux spatules posees ne font qu'UN morceau : la spatule de droite se
// detache par sa place. Corps, cou et bec : tout ce qui est a droite de x = 600 et au-dessus de y = 745 (la
// spatule de gauche n'y monte pas, la branche commence vers y = 770). Pattes et doigts, plus bas, posees sur la
// branche : les pixels SOMBRES de la bande x 725-805 (la branche est claire). Bornes relevees sur l'image de 1264 px.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { lirePng, ecrirePng } from './png-simple.mjs';

const SRC = 'notes-privees/trophees/images/echassiers/modele.png';
const SORTIES = ['notes-privees/trophees/images/echassiers', 'assets/trophies/themes/echassiers'];
const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(SRC));
const a = new Uint8Array(rvba);
const SEUIL_SOMBRE = Number(process.argv[2] || 110);   // luminance des pattes ; la branche est bien au-dessus

// Les morceaux opaques (8 voisins), avec leur taille et leur centre
const lab = new Int32Array(W * H).fill(-1), morceaux = [];
for(let p0 = 0; p0 < W * H; p0++){
  if(lab[p0] >= 0 || !a[p0*4+3]) continue;
  const id = morceaux.length, px = [p0]; lab[p0] = id; let sx = 0, sy = 0;
  for(let k = 0; k < px.length; k++){ const p = px[k], x = p % W, y = (p / W) | 0; sx += x; sy += y;
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const X = x + dx, Y = y + dy;
      if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X; if(lab[q] < 0 && a[q*4+3]){ lab[q] = id; px.push(q); } } }
  morceaux.push({ id, n: px.length, cx: sx / px.length, cy: sy / px.length });
}
const lum = p => 0.299 * a[p*4] + 0.587 * a[p*4+1] + 0.114 * a[p*4+2];
// La bande des pattes s'arrete a y = 880 : le haut du socle (sombre lui aussi) commence a y = 882.
const dansBande = p => { const x = p % W, y = (p / W) | 0; return x >= 720 && x <= 810 && y >= 745 && y < 880; };
// Pattes : les pixels sombres, puis 3 passes de voisinage pour prendre leur bord adouci (demi-transparent ou
// plus clair, entre la patte et la branche) : sans elles, un contour fantome des pattes restait au niveau 1.
const pattes = new Uint8Array(W * H);
for(let p = 0; p < W * H; p++) if(a[p*4+3] && dansBande(p) && morceaux[lab[p]].n >= 200 && lum(p) < SEUIL_SOMBRE) pattes[p] = 1;
for(let passe = 0; passe < 3; passe++){ const ajout = [];
  for(let p = 0; p < W * H; p++){ if(pattes[p] || !a[p*4+3] || !dansBande(p) || !(a[p*4+3] < 230 || lum(p) < 125)) continue;
    const x = p % W; if(pattes[p-1] && x > 0 || pattes[p+1] && x < W - 1 || pattes[p-W] || pattes[p+W]) ajout.push(p); }
  for(const p of ajout) pattes[p] = 1; }
// Chaque pixel : 'vol', 'droite' ou 'pose' (spatule de gauche, branche, socle)
const classe = p => { const m = morceaux[lab[p]], x = p % W, y = (p / W) | 0;
  if(m.cy < 620) return m.n < 200 ? 'miette' : 'vol';
  if(m.n < 200) return 'pose';
  if(x > 600 && y < 745) return 'droite';
  return pattes[p] ? 'droite' : 'pose'; };
const compte = {};
for(let p = 0; p < W * H; p++) if(a[p*4+3]){ const c = classe(p); compte[c] = (compte[c] || 0) + 1; }
console.log('pixels :', JSON.stringify(compte));

const niveau = retirer => { const r = new Uint8Array(a);
  for(let p = 0; p < W * H; p++){ if(!r[p*4+3]) continue; const c = classe(p);
    if(retirer.includes(c) || c === 'miette') r[p*4+3] = 0; }
  return r; };
for(const dos of SORTIES){
  mkdirSync(dos, { recursive: true });
  writeFileSync(dos + '/niveau-1.png', ecrirePng(niveau(['droite', 'vol']), W, H));
  writeFileSync(dos + '/niveau-2.png', ecrirePng(niveau(['vol']), W, H));
  writeFileSync(dos + '/niveau-3.png', ecrirePng(niveau([]), W, H));
}
console.log('niveaux ecrits dans', SORTIES.join(' et '));

// Trois niveaux du trophee des mouettes, goelands et sternes a partir de l'image de Mathis (09/11) :
// niveau 1 = la mouette posee sur le sable (avec le sandwich), niveau 2 = + les deux en vol a droite,
// niveau 3 = + celle de gauche (ordre et regroupement voulus par Mathis le 10/11).
//   node outils/build/_niveaux-mouettes.mjs
// L'image est deja detouree (fond transparent) : pas de fond blanc a retirer, contrairement aux aigles.
// Les oiseaux ne se touchent pas : chaque morceau opaque est range d'apres son centre (en vol : centre
// au-dessus de y = 730 ; a droite de x = 600, ce sont les deux de droite). Bornes relevees sur
// l'image de 1264 px.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { lirePng, ecrirePng } from './png-simple.mjs';

const SRC = 'notes-privees/trophees/images/mouettes/modele.png';
const SORTIES = ['notes-privees/trophees/images/mouettes', 'assets/trophies/themes/mouettes'];
const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(SRC));
const a = new Uint8Array(rvba);

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
const classe = m => m.cy < 730 ? (m.cx > 600 ? 'droite' : 'gauche') : 'pose';
const parClasse = {};
for(const m of morceaux){ const c = classe(m); (parClasse[c] ||= []).push(m); }
for(const [c, ms] of Object.entries(parClasse)){
  const gros = ms.filter(m => m.n >= 200).map(m => `${m.n} px (${Math.round(m.cx)}, ${Math.round(m.cy)})`);
  console.log(c, ':', ms.length, 'morceaux, dont', gros.length, 'de 200 px ou plus :', gros.join(' | '), '; miettes :', ms.filter(m => m.n < 200).reduce((s, m) => s + m.n, 0), 'px');
}

// Les niveaux : on efface les oiseaux en vol pas encore gagnes. Les miettes de moins de 200 px
// hors du groupe pose sont retirees (poussiere du detourage) ; celles du groupe pose restent, des
// grains de sable pouvant en etre faits.
const niveau = retirer => { const r = new Uint8Array(a);
  for(let p = 0; p < W * H; p++){ if(!r[p*4+3]) continue; const m = morceaux[lab[p]], c = classe(m);
    if(retirer.includes(c) || (m.n < 200 && c !== 'pose')) r[p*4+3] = 0; }
  return r; };
for(const dos of SORTIES){
  mkdirSync(dos, { recursive: true });
  writeFileSync(dos + '/niveau-1.png', ecrirePng(niveau(['droite', 'gauche']), W, H));
  writeFileSync(dos + '/niveau-2.png', ecrirePng(niveau(['gauche']), W, H));
  writeFileSync(dos + '/niveau-3.png', ecrirePng(niveau([]), W, H));
}
console.log('niveaux ecrits dans', SORTIES.join(' et '));

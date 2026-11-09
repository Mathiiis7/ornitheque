// Trois niveaux du trophee « Oiseaux de nuit » a partir de l'image aux trois chouettes de Mathis
// (08/11), comme pour Armee d'aigles royaux : niveau 1 = la chouette de gauche, niveau 2 = + celle du
// milieu, niveau 3 = les trois. Le rocher et le socle restent a tous les niveaux.
//   node outils/build/_niveaux-chouettes.mjs
// Les deux chouettes retirees sont posees AU-DESSUS du rocher : on efface ce qui est au-dessus du bord
// du rocher, a droite d'une coupure verticale. Bord et coupures releves a la loupe
// (outils/verif/_loupe-image.mjs, zoom 4) sur l'image de 1264 px :
//   - chouette de gauche jusqu'a x = 601, celle du milieu de 607 a 694, celle de droite de 692 a 775 ;
//   - coupures : x = 604 (gauche | milieu) et x = 694 (milieu | droite) ;
//   - bord du rocher : la ligne ci-dessous, son liseré clair compris (garde avec le rocher).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { lirePng, ecrirePng } from './png-simple.mjs';

const SRC = 'notes-privees/trophees/images/oiseaux-de-nuit/modele-trois-chouettes.png';
const SORTIES = ['notes-privees/trophees/images/oiseaux-de-nuit', 'assets/trophies/themes/oiseaux-de-nuit'];
// Le haut du liseré clair, releve une seconde fois au zoom 4 : la premiere ligne passait 4 a 5 px trop
// haut vers le sommet et laissait une bande brune (le bas de la chouette de droite) sur le niveau 1.
const BORD = [[585, 842], [605, 825], [630, 810], [655, 793], [680, 780], [700, 772.5], [710, 770], [730, 762],
  [755, 747], [770, 735], [775, 730.5], [790, 736], [800, 741]];
const bordY = x => {
  for(let i = 1; i < BORD.length; i++){
    const [x0, y0] = BORD[i - 1], [x1, y1] = BORD[i];
    if(x <= x1) return y0 + (y1 - y0) * Math.max(0, x - x0) / (x1 - x0);
  }
  return BORD[BORD.length - 1][1];
};

const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(SRC));
if(W !== 1264 || H !== 1264) throw new Error('image inattendue : ' + W + 'x' + H);
const niveau = coupure => {
  const r = new Uint8Array(rvba);
  let efface = 0;
  // 1 px de marge au-dessus du liseré : la frange de plumes qui le touchait part avec l oiseau
  for(let y = 0; y < H; y++) for(let x = coupure; x <= 790; x++) if(y < bordY(x) - 1){ const q = (y * W + x) * 4; if(r[q + 3]){ r[q + 3] = 0; efface++; } }
  // Puis les miettes : tout morceau opaque isole de moins de 1 500 px (une bande de 2 px de la chouette
  // de droite restait collee a celle du milieu, et de petites taches flottaient pres des tetes).
  const vu = new Uint8Array(W * H); let miettes = 0;
  for(let p0 = 0; p0 < W * H; p0++){
    if(vu[p0] || !r[p0 * 4 + 3]) continue;
    const morceau = [], pile = [p0]; vu[p0] = 1;
    while(pile.length){ const p = pile.pop(); morceau.push(p); const x = p % W, y = (p / W) | 0;
      for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const X = x + dx, Y = y + dy;
        if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X; if(!vu[q] && r[q * 4 + 3]){ vu[q] = 1; pile.push(q); } } }
    if(morceau.length < 1500){ for(const p of morceau) r[p * 4 + 3] = 0; miettes += morceau.length; }
  }
  return { r, efface, miettes };
};
const n1 = niveau(604), n2 = niveau(694);
for(const dos of SORTIES){
  mkdirSync(dos, { recursive: true });
  writeFileSync(dos + '/niveau-1.png', ecrirePng(n1.r, W, H));
  writeFileSync(dos + '/niveau-2.png', ecrirePng(n2.r, W, H));
  writeFileSync(dos + '/niveau-3.png', readFileSync(SRC));
}
console.log('niveau 1 : ' + n1.efface + ' pixels effaces + ' + n1.miettes + ' de miettes ; niveau 2 : ' + n2.efface + ' + ' + n2.miettes + ' ; ecrits dans', SORTIES.join(' et '));

// Retire d'une image detouree les poussieres du detourage : les morceaux opaques isoles (8 voisins) de moins de
// N pixels. Ecrit pour le tichodrome de Mathis (11/11) : deux points de 14 et 2 px flottaient a droite du rocher.
//   node outils/build/_sans-miettes.mjs <entree.png> <sortie.png> [N = 200]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { lirePng, ecrirePng } from './png-simple.mjs';

const [src, dst, seuil = '200'] = process.argv.slice(2);
const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(src));
const a = new Uint8Array(rvba), vu = new Uint8Array(W * H);
let retires = 0, morceaux = 0;
for(let p0 = 0; p0 < W * H; p0++){
  if(vu[p0] || !a[p0*4+3]) continue;
  const px = [p0]; vu[p0] = 1;
  for(let k = 0; k < px.length; k++){ const p = px[k], x = p % W, y = (p / W) | 0;
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const X = x + dx, Y = y + dy;
      if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X; if(!vu[q] && a[q*4+3]){ vu[q] = 1; px.push(q); } } }
  if(px.length < +seuil){ for(const p of px) a[p*4+3] = 0; retires += px.length; morceaux++; }
}
mkdirSync(dirname(dst), { recursive: true });
writeFileSync(dst, ecrirePng(a, W, H));
console.log(morceaux, 'miette(s) retiree(s),', retires, 'px ->', dst);

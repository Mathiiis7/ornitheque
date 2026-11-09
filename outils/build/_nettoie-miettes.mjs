// Image d'un trophee deja detouree (pelican, globe... de Mathis, 10/11) : on retire les miettes isolees. Un
// point de 3 px trainait a droite du pelican, et la vitrine cadre l'image sur tout ce qui est opaque.
//   node outils/build/_nettoie-miettes.mjs <source.png> <sortie.png>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { lirePng, ecrirePng } from './png-simple.mjs';

const [SRC, SORTIE] = process.argv.slice(2);
const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(SRC));
const a = new Uint8Array(rvba);
const lab = new Int32Array(W * H).fill(-1), tailles = [];
for(let p0 = 0; p0 < W * H; p0++){
  if(lab[p0] >= 0 || a[p0*4+3] <= 20) continue;
  const id = tailles.length, px = [p0]; lab[p0] = id;
  for(let k = 0; k < px.length; k++){ const p = px[k], x = p % W, y = (p / W) | 0;
    for(let dy = -1; dy <= 1; dy++) for(let dx = -1; dx <= 1; dx++){ const X = x + dx, Y = y + dy;
      if(X < 0 || Y < 0 || X >= W || Y >= H) continue; const q = Y * W + X; if(lab[q] < 0 && a[q*4+3] > 20){ lab[q] = id; px.push(q); } } }
  tailles.push(px.length);
}
let retires = 0;
for(let p = 0; p < W * H; p++) if(lab[p] >= 0 && tailles[lab[p]] < 200){ a[p*4+3] = 0; retires++; }
// Les pixels presque transparents (alpha 20 ou moins) restent comme ils sont : la vitrine les ignore.
mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, ecrirePng(a, W, H));
console.log('morceaux :', tailles.length, '; miettes retirees :', retires, 'px ; ecrit', SORTIE);

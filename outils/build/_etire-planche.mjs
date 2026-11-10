// Etire en hauteur la planche du Terroir, au-dessus du socle, pour lui rendre les proportions de la vraie France.
// 10/11 : la planche refaite d'apres le contour IGN avait la bonne forme mais ecrasee de 14 % (338 px de haut pour
// 398 de large, la vraie France en ferait 389 : outils/build/_contour-france.mjs). Le socle ne bouge pas : seules
// les lignes au-dessus de BAS sont reechantillonnees (bilineaire), ancrees en bas.
//   node outils/build/_etire-planche.mjs <source.png> <sortie.png> <facteur> [bas = 882]
import { readFileSync, writeFileSync } from 'node:fs';
import { lirePng, ecrirePng } from './png-simple.mjs';

const [SRC, SORTIE, FACTEUR, BAS = '882'] = process.argv.slice(2);
const f = Number(FACTEUR), bas = Number(BAS);
const { largeur: W, hauteur: H, rvba } = lirePng(readFileSync(SRC));
const sortie = new Uint8Array(rvba);
for(let y = 0; y <= bas; y++){
  const ys = bas - (bas - y) / f, y0 = Math.floor(ys), t = ys - y0;
  for(let x = 0; x < W; x++){
    const p = (y * W + x) * 4;
    if(y0 < 0){ sortie[p+3] = 0; continue; }
    const a = (y0 * W + x) * 4, b = (Math.min(y0 + 1, bas) * W + x) * 4;
    // Melange premultiplie par l'opacite : sans ca, le blanc des pixels transparents deborde sur le bord
    const aa = rvba[a+3] * (1 - t), ab = rvba[b+3] * t, al = aa + ab;
    for(let c = 0; c < 3; c++) sortie[p+c] = al ? Math.round((rvba[a+c] * aa + rvba[b+c] * ab) / al) : 0;
    sortie[p+3] = Math.round(al);
  }
}
writeFileSync(SORTIE, ecrirePng(sortie, W, H));
console.log('etiree x', f, ':', SORTIE);

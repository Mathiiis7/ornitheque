// Le trophee Terroir en calques (Mathis, 10/11) : une planche en forme de France, un aliment par region, chaque
// region observee fait apparaitre le sien.
//   node outils/build/_terroir.mjs
// Source : son PDF a calques (notes-privees/trophees/images/terroir/modele.pdf). Les calques en sont extraits par
// outils/build/_terroir-pdf.py (PyMuPDF) dans calques/img-NN.png, avec leur place sur la page (ci-dessous, en points
// du PDF). img-00 : la planche ; img-01 a 13 : les aliments ; img-14 : une coupe dont seul le socle se voit.
// Sortie, toutes au MEME cadre pour se superposer : fond.png (socle + planche), <code region>.png (son aliment
// seul), complet.png (tout). La vitrine les recadre ensemble sur complet.png.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from 'playwright';
const SRC = 'notes-privees/trophees/images/terroir/calques/', SORTIE = 'assets/trophies/themes/terroir/';
// Place de chaque calque sur la page (points), relevee par _terroir-pdf.py
const PLACES = {
  0: [282.2, 344.8, 627.2, 684.5],
  1: [378.0, 363.5, 416.2, 458.0], 2: [454.5, 344.8, 522.0, 430.3], 3: [291.4, 439.0, 368.6, 496.0],
  4: [349.1, 477.0, 416.6, 524.3], 5: [425.6, 467.4, 493.1, 534.2], 6: [435.3, 410.7, 531.3, 477.4],
  7: [540.2, 415.5, 607.7, 472.5], 8: [502.2, 457.8, 579.4, 524.6], 9: [368.4, 533.3, 426.1, 600.1],
  10: [483.4, 524.2, 550.9, 590.9], 11: [400.0, 580.3, 496.0, 656.1], 12: [511.8, 590.1, 589.0, 647.1],
  13: [607.5, 580.5, 666.0, 684.7],
  14: [197.2, 94.8, 750.7, 853.0],
};
// Quel aliment pour quelle region (choix de Mathis, 10/11), reconnu a sa place sur la carte
const REGION = { 1:'FR-NOR', 2:'FR-HDF', 3:'FR-BRE', 4:'FR-PDL', 5:'FR-CVL', 6:'FR-IDF', 7:'FR-GES', 8:'FR-BFC',
  9:'FR-NAQ', 10:'FR-ARA', 11:'FR-OCC', 12:'FR-PAC', 13:'FR-COR' };
// La planche VIERGE (Mathis, 10/11 : celle du PDF portait l'empreinte de chaque aliment, des « formes bizarres »
// dans les regions non visitees) : images/terroir/planche-vierge.png, 1264 px de cote, socle compris, sans la Corse.
// Elle n'a ni la place ni tout a fait la taille de celle du PDF : les aliments y sont reportes par les cadres
// opaques des deux planches (PDF : x 291,2 a 623,0 et y 347,2 a 676,7 en points ; vierge : x 388 a 832 et y 462 a
// 880 en pixels, mesures), chacun a sa place par axe et a une taille commune (la moyenne des deux echelles).
const VIERGE = 'notes-privees/trophees/images/terroir/planche-vierge.png', COTE = 1264;
const AX = (832 - 388) / (623.0 - 291.2), AY = (880 - 462) / (676.7 - 347.2), TAILLE = (AX + AY) / 2;
const versX = x => 388 + (x - 291.2) * AX, versY = y => 462 + (y - 347.2) * AY;
// Reglages a l'oeil, en pixels, si un aliment tombe a cote de sa region sur la planche vierge
const DECALAGE = {};

const img = i => 'data:image/png;base64,' + readFileSync(SRC + 'img-' + String(i).padStart(2, '0') + '.png').toString('base64');
const nav = await chromium.launch(), page = await nav.newPage();
const sorties = await page.evaluate(async ({ PLACES, REGION, COTE, AX, AY, TAILLE, DECALAGE, sources }) => {
  const charge = s => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = s; });
  const im = {}; for(const [k, s] of Object.entries(sources)) im[k] = await charge(s);
  const W = COTE, H = COTE;
  const toile = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const versX = x => 388 + (x - 291.2) * AX, versY = y => 462 + (y - 347.2) * AY;
  // Un calque du PDF reporte sur la planche vierge : son centre a sa place, sa taille a l'echelle commune
  const place = i => { const [x0, y0, x1, y1] = PLACES[i], d = DECALAGE[i] || [0, 0], w = (x1 - x0) * TAILLE, h = (y1 - y0) * TAILLE;
    return [versX((x0 + x1) / 2) - w / 2 + d[0], versY((y0 + y1) / 2) - h / 2 + d[1], w, h]; };
  const pose = (x, i) => x.drawImage(im[i], ...place(i));
  const socle = x => x.drawImage(im.vierge, 0, 0, W, H);   // la planche vierge, socle compris
  const png = c => c.toDataURL('image/png').split(',')[1];
  // La Corse sans son figatellu (« la Corse doit apparaitre sans son aliment meme si on ne l'a pas visitee »,
  // Mathis 10/11) : dans un cadre autour du saucisson, de sa ficelle et de son ombre (releve a la loupe, pixels de
  // img-13), tout ce qui s'ecarte du bois de l'ile prend la couleur mediane de ce bois, un peu bruitee.
  const ile = (() => {
    const s = im[13], c = document.createElement('canvas'); c.width = s.width; c.height = s.height;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(s, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), a = d.data, W = c.width, H = c.height;
    const CADRE_ALIMENT = [16, 28, 86, 140];
    const dans = (X, Y) => X >= CADRE_ALIMENT[0] && X <= CADRE_ALIMENT[2] && Y >= CADRE_ALIMENT[1] && Y <= CADRE_ALIMENT[3];
    const rs = [], gs = [], bs = [];
    for(let Y = 0; Y < H; Y++) for(let X = 0; X < W; X++){ const p = (Y * W + X) * 4;
      if(a[p+3] > 250 && !dans(X, Y)){ rs.push(a[p]); gs.push(a[p+1]); bs.push(a[p+2]); } }
    const med = v => v.sort((m, n) => m - n)[v.length >> 1], bois = [med(rs), med(gs), med(bs)];
    const ecart = p => Math.abs(a[p] - bois[0]) + Math.abs(a[p+1] - bois[1]) + Math.abs(a[p+2] - bois[2]);
    // Le masque : les pixels du cadre loin du bois, elargi de 2 px pour les bords adoucis
    const masque = new Uint8Array(W * H);
    for(let Y = 0; Y < H; Y++) for(let X = 0; X < W; X++){ const p = (Y * W + X) * 4; if(dans(X, Y) && a[p+3] > 20 && ecart(p) > 45) masque[Y * W + X] = 1; }
    for(let k = 0; k < 2; k++){ const m2 = masque.slice();
      for(let Y = 1; Y < H - 1; Y++) for(let X = 1; X < W - 1; X++) if(!masque[Y * W + X] && dans(X, Y) && (masque[Y * W + X - 1] || masque[Y * W + X + 1] || masque[(Y - 1) * W + X] || masque[(Y + 1) * W + X])) m2[Y * W + X] = 1;
      masque.set(m2); }
    for(let q = 0; q < W * H; q++) if(masque[q] && a[q*4+3] > 20){ const n = (Math.random() - 0.5) * 6;
      a[q*4] = bois[0] + n; a[q*4+1] = bois[1] + n; a[q*4+2] = bois[2] + n; a[q*4+3] = 255; }
    x.putImageData(d, 0, 0);
    return c;
  })();
  const poseIle = x => x.drawImage(ile, ...place(13));   // la planche vierge n'a pas de Corse : l'ile du PDF, sans figatellu
  const r = {};
  const fond = toile(), fx = fond.getContext('2d'); socle(fx); poseIle(fx); r.fond = png(fond);
  const tout = toile(), tx = tout.getContext('2d'); socle(tx); poseIle(tx);
  for(const i of Object.keys(REGION).map(Number)){ const c = toile(); pose(c.getContext('2d'), i); r[REGION[i]] = png(c); pose(tx, i); }
  r.complet = png(tout);
  return r;
}, { PLACES, REGION, COTE, AX, AY, TAILLE, DECALAGE, sources: { ...Object.fromEntries(Object.keys(PLACES).map(i => [i, img(i)])),
  vierge: 'data:image/png;base64,' + readFileSync(VIERGE).toString('base64') } });
await nav.close();
mkdirSync(SORTIE, { recursive: true });
for(const [nom, b64] of Object.entries(sorties)) writeFileSync(SORTIE + nom + '.png', Buffer.from(b64, 'base64'));
console.log('ecrit', Object.keys(sorties).length, 'images dans', SORTIE);

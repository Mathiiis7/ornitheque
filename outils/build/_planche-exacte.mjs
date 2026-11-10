// La planche du Terroir taillee dans la VRAIE France (Mathis, 10/11). Son outil d'images ne suivait pas le contour
// donne (ecrasee de 14 %, Alsace et Alpes trop etroites, mesure par _contour-france.mjs) : on decoupe ici le contour
// IGN (Lambert-93, 12 regions du continent, sans la Corse qui a sa piece a part) dans le bois de SA planche.
//   - le bois : sa face, lignes de regions et bord retires ligne par ligne (le fil du bois est horizontal, une
//     interpolation le long de la ligne le garde), puis etire sur le cadre de la vraie France ;
//   - l'epaisseur : la forme repetee vers le bas a gauche, dans la couleur de son bord ;
//   - les frontieres de regions : traits fins de la couleur des siennes, effaces sur 2 px au bord de la cote ;
//   - le socle : le sien, recopie tel quel.
// Sortie : la planche + data/../centres (centre de chaque region en pixels, pour poser les aliments).
//   node outils/build/_planche-exacte.mjs <planche-source.png> <sortie.png> <centres.json>
import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [SRC, SORTIE, CENTRES] = process.argv.slice(2);
const geo = JSON.parse(readFileSync('outils/config/regions-ign.geojson', 'utf8'));
const CODES = { '11':'FR-IDF', '24':'FR-CVL', '27':'FR-BFC', '28':'FR-NOR', '32':'FR-HDF', '44':'FR-GES', '52':'FR-PDL',
  '53':'FR-BRE', '75':'FR-NAQ', '76':'FR-OCC', '84':'FR-ARA', '93':'FR-PAC', '94':'FR-COR' };

// Lambert-93 : GRS80, paralleles 44 et 49, origine 46,5 N / 3 E
const a = 6378137, e = 0.0818191910428158, rad = d => d * Math.PI / 180;
const t = p => Math.tan(Math.PI / 4 - p / 2) / Math.pow((1 - e * Math.sin(p)) / (1 + e * Math.sin(p)), e / 2);
const m = p => Math.cos(p) / Math.sqrt(1 - e * e * Math.sin(p) ** 2);
const p1 = rad(44), p2 = rad(49), p0 = rad(46.5), l0 = rad(3);
const n = (Math.log(m(p1)) - Math.log(m(p2))) / (Math.log(t(p1)) - Math.log(t(p2)));
const F = m(p1) / (n * Math.pow(t(p1), n)), r0 = a * F * Math.pow(t(p0), n);
const lambert = ([lon, lat]) => { const r = a * F * Math.pow(t(rad(lat)), n), th = n * (rad(lon) - l0); return [r * Math.sin(th), r0 - r * Math.cos(th)]; };

// Place : la largeur et le bas de l'ancienne planche (x 389 a 831, bas 882), pour garder la taille des aliments
const G = 389, D = 831, BAS = 882;
const regions = geo.features.filter(f => CODES[f.properties.code] !== 'FR-COR').map(f => ({
  code: CODES[f.properties.code],
  polys: (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map(p => p.map(r => r.map(lambert))) }));
const tous = regions.flatMap(r => r.polys.flat(2));
const x0 = Math.min(...tous.map(p => p[0])), x1 = Math.max(...tous.map(p => p[0])), y0 = Math.min(...tous.map(p => p[1])), y1 = Math.max(...tous.map(p => p[1]));
const k = (D - G) / (x1 - x0), px = ([x, y]) => [G + (x - x0) * k, BAS - (y - y0) * k];
const aire = r => { let s = 0; for(let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] + r[i][0]) * (r[j][1] - r[i][1]); return s / 2; };
// Les ilots de moins de 25 px2 (2,3 km par px) feraient des miettes de bois : retires
const anneaux = regions.map(r => ({ code: r.code, rings: r.polys.flatMap(p => p.map(ring => ring.map(px))).filter(ring => Math.abs(aire(ring)) >= 25) }));
// Centre de chaque region : barycentre de son plus grand morceau
const centres = {};
for(const r of anneaux){
  const grand = r.rings.reduce((g, ring) => Math.abs(aire(ring)) > Math.abs(aire(g)) ? ring : g);
  let A = 0, cx = 0, cy = 0;
  for(let i = 0, j = grand.length - 1; i < grand.length; j = i++){ const f = grand[j][0] * grand[i][1] - grand[i][0] * grand[j][1]; A += f; cx += (grand[j][0] + grand[i][0]) * f; cy += (grand[j][1] + grand[i][1]) * f; }
  centres[r.code] = [+(cx / (3 * A)).toFixed(1), +(cy / (3 * A)).toFixed(1)];
}
console.log('France :', (D - G), 'x', ((y1 - y0) * k).toFixed(0), 'px, haut a', (BAS - (y1 - y0) * k).toFixed(0));

const nav = await chromium.launch(), page = await nav.newPage();
const b64 = await page.evaluate(async ({ src, anneaux, BAS }) => {
  const im = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = src; });
  const W = im.width, H = im.height, toile = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  const S = toile(), sx = S.getContext('2d', { willReadFrequently: true }); sx.drawImage(im, 0, 0);
  const sd = sx.getImageData(0, 0, W, H).data, lum = p => 0.2126 * sd[p] + 0.7152 * sd[p+1] + 0.0722 * sd[p+2];
  // 1. La face de sa planche (au-dessus du socle) : opaque et claire. Seuil : mediane - 35 de luminance.
  const lums = []; for(let y = 0; y < BAS; y++) for(let x = 0; x < W; x++){ const p = (y * W + x) * 4; if(sd[p+3] > 240) lums.push(lum(p)); }
  lums.sort((u, v) => u - v); const med = lums[lums.length >> 1], seuil = med - 35;
  const face0 = (x, y) => { const p = (y * W + x) * 4; return sd[p+3] > 240 && lum(p) > seuil; };
  // Les bords adoucis des lignes passent le seuil et laissaient des traces : un pixel de face touchant un trou
  // (a 1 px pres) compte comme trou
  const propre = new Uint8Array(W * H);
  for(let y = 1; y < BAS - 1; y++) for(let x = 1; x < W - 1; x++){ if(!face0(x, y)) continue; let ok = true;
    for(let dy = -1; dy <= 1 && ok; dy++) for(let dx = -1; dx <= 1; dx++) if(!face0(x + dx, y + dy)){ ok = false; break; }
    if(ok) propre[y * W + x] = 1; }
  const face = (x, y) => propre[y * W + x] === 1;
  // Couleurs : bord (opaque et sombre, hors lignes : au contact du vide) et lignes (sombres, entourees de face)
  const bordC = [], ligneC = [];
  for(let y = 2; y < BAS - 2; y++) for(let x = 2; x < W - 2; x++){ const p = (y * W + x) * 4; if(sd[p+3] < 240 || face0(x, y)) continue;
    const vide = sd[p - 4 + 3] < 30 || sd[p + 4 + 3] < 30 || sd[p - 4 * W + 3] < 30 || sd[p + 4 * W + 3] < 30;
    (vide ? bordC : (face0(x - 2, y) || face0(x + 2, y)) && (face0(x, y - 2) || face0(x, y + 2)) ? ligneC : []).push([sd[p], sd[p+1], sd[p+2]]); }
  const medC = l => [0, 1, 2].map(c => l.map(v => v[c]).sort((u, v) => u - v)[l.length >> 1]);
  const bord = medC(bordC), ligne = medC(ligneC);
  // 2. Le bois sans lignes : chaque ligne de pixels, les trous (lignes, bord) comblés en interpolant entre les pixels
  //    de face voisins, et prolongee au-dela au plus proche. Lignes hors de la face : la plus proche.
  const T = toile(), tx = T.getContext('2d'), td = tx.createImageData(W, H), tdd = td.data;
  let fy0 = H, fy1 = 0, fx0 = W, fx1 = 0;
  for(let y = 0; y < BAS; y++){
    const xs = []; for(let x = 0; x < W; x++) if(face(x, y)) xs.push(x);
    if(xs.length < 20) continue;
    fy0 = Math.min(fy0, y); fy1 = Math.max(fy1, y); fx0 = Math.min(fx0, xs[0]); fx1 = Math.max(fx1, xs[xs.length - 1]);
    let j = 0;
    for(let x = 0; x < W; x++){
      while(j < xs.length - 1 && xs[j + 1] <= x) j++;
      const g = xs[j] <= x ? xs[j] : xs[0], d = xs[j] <= x ? (xs[j + 1] ?? xs[j]) : xs[0], q = (y * W + x) * 4;
      // Un trou court se comble dans le sens ou il est le plus court : le long de la ligne pour une frontiere
      // verticale, le long de la colonne pour une frontiere horizontale (le fil du bois en souffre moins qu'une trace)
      if(!face(x, y) && g < x && d > x){
        let h = y, b = y; while(h > 0 && y - h < 10 && !face(x, h)) h--; while(b < BAS - 1 && b - y < 10 && !face(x, b)) b++;
        if(face(x, h) && face(x, b) && b - h < d - g){ const f = (y - h) / (b - h), ph = (h * W + x) * 4, pb = (b * W + x) * 4;
          for(let c = 0; c < 3; c++) tdd[q + c] = sd[ph + c] * (1 - f) + sd[pb + c] * f; tdd[q + 3] = 255; continue; }
      }
      const f = d > g ? (x - g) / (d - g) : 0, pg = (y * W + g) * 4, pd = (y * W + d) * 4;
      for(let c = 0; c < 3; c++) tdd[q + c] = sd[pg + c] * (1 - f) + sd[pd + c] * f;
      tdd[q + 3] = 255;
    }
  }
  tx.putImageData(td, 0, 0);
  // 3. Le cadre de la vraie France, et le bois etire dessus (le bois de sa face, sans les 6 px du bord)
  const pts = anneaux.flatMap(r => r.rings.flat()), X0 = Math.min(...pts.map(p => p[0])), X1 = Math.max(...pts.map(p => p[0]));
  const Y0 = Math.min(...pts.map(p => p[1])), Y1 = Math.max(...pts.map(p => p[1]));
  const chemin = rings => { const p = new Path2D(); for(const r of rings){ p.moveTo(...r[0]); for(const q of r.slice(1)) p.lineTo(...q); p.closePath(); } return p; };
  const forme = chemin(anneaux.flatMap(r => r.rings));
  const O = toile(), ox = O.getContext('2d');
  // le socle, tel quel
  ox.drawImage(im, 0, BAS + 1, W, H - BAS - 1, 0, BAS + 1, W, H - BAS - 1);
  // 4. L'epaisseur : la forme repetee 1 a 6 px vers le bas a gauche, du bord sombre vers le bord moyen
  for(let i = 6; i >= 1; i--){ ox.save(); ox.translate(-i * 0.7, i); const f = i / 6;
    ox.fillStyle = `rgb(${bord.map(v => Math.round(v * (1 - 0.25 * f))).join(',')})`; ox.fill(forme); ox.restore(); }
  // 5. La face : le bois etire, decoupe a la forme
  ox.save(); ox.clip(forme);
  ox.drawImage(T, fx0 + 6, fy0 + 6, fx1 - fx0 - 12, fy1 - fy0 - 12, X0, Y0, X1 - X0, Y1 - Y0); ox.restore();
  // 6. Les frontieres : contour de chaque region, sur un calque efface pres de la cote
  const L = toile(), lx = L.getContext('2d');
  lx.strokeStyle = `rgb(${ligne.join(',')})`; lx.lineWidth = 1.4; lx.lineJoin = 'round';
  for(const r of anneaux) lx.stroke(chemin(r.rings));
  // Le calque des traits ne garde que l'interieur de la forme erodee de 2 px : la cote n'a pas de trait
  const C = toile(), cx = C.getContext('2d'); cx.fillStyle = '#000'; cx.fill(forme);
  // erosion de la forme entiere (union) : 8 decalages de 2 px
  const E = toile(), ex = E.getContext('2d'); ex.drawImage(C, 0, 0); ex.globalCompositeOperation = 'destination-in';
  for(const [dx, dy] of [[2,0],[-2,0],[0,2],[0,-2],[1.4,1.4],[-1.4,1.4],[1.4,-1.4],[-1.4,-1.4]]) ex.drawImage(C, dx, dy);
  lx.globalCompositeOperation = 'destination-in'; lx.drawImage(E, 0, 0);
  ox.drawImage(L, 0, 0);
  return { png: O.toDataURL('image/png').split(',')[1], bord, ligne, med: Math.round(med) };
}, { src: 'data:image/png;base64,' + readFileSync(SRC).toString('base64'), anneaux, BAS });
await nav.close();
writeFileSync(SORTIE, Buffer.from(b64.png, 'base64'));
writeFileSync(CENTRES, JSON.stringify(centres, null, 1));
console.log('bord', b64.bord, 'lignes', b64.ligne, 'luminance mediane', b64.med, '->', SORTIE);

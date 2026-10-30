// Retire le liseré clair (1 à 2 pixels sur 1264) au bord du socle brun des trophées, et les
// miettes détachées autour. Invisible sur une case claire, il saute aux yeux sur le fond noir
// de la scène de déblocage (Mathis, 2026-10-30).
// node outils/build/nettoie-socles.mjs [--ecrire]   sans --ecrire : mesure seulement.
// Node seul, sans canvas : réécrits par un canvas, les PNG prenaient 67 % de poids (16 -> 27 Mo).
// Ici chaque rangée garde le filtre d'origine et seuls les pixels retirés changent.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync, deflateSync, crc32 } from 'node:zlib';

const ECRIRE = process.argv.includes('--ecrire');

function lit(b){
  let o = 8, W, H; const avant = [], apres = [], idat = [];
  while(o < b.length){
    const n = b.readUInt32BE(o), t = b.toString('latin1', o + 4, o + 8), bloc = b.subarray(o, o + 12 + n);
    if(t === 'IHDR'){ W = b.readUInt32BE(o + 8); H = b.readUInt32BE(o + 12); if(b[o + 16] !== 8 || b[o + 17] !== 6 || b[o + 20] !== 0) throw new Error('format inattendu'); }
    if(t === 'IDAT') idat.push(b.subarray(o + 8, o + 8 + n));
    else (idat.length ? apres : avant).push(bloc);
    o += 12 + n;
  }
  const brut = inflateSync(Buffer.concat(idat)), L = W * 4, d = Buffer.alloc(L * H), filtres = new Uint8Array(H);
  const paeth = (a, b, c) => { const p = a + b - c, A = Math.abs(p - a), B = Math.abs(p - b), C = Math.abs(p - c); return A <= B && A <= C ? a : B <= C ? b : c; };
  for(let j = 0; j < H; j++){
    const f = filtres[j] = brut[j * (L + 1)];
    for(let i = 0; i < L; i++){
      const x = brut[j * (L + 1) + 1 + i], a = i >= 4 ? d[j * L + i - 4] : 0, h = j ? d[(j - 1) * L + i] : 0, c = j && i >= 4 ? d[(j - 1) * L + i - 4] : 0;
      d[j * L + i] = (x + (f === 0 ? 0 : f === 1 ? a : f === 2 ? h : f === 3 ? (a + h) >> 1 : paeth(a, h, c))) & 255;
    }
  }
  return { W, H, d, filtres, avant, apres, paeth };
}
function ecrit({ W, H, d, filtres, avant, apres, paeth }){
  const L = W * 4, brut = Buffer.alloc((L + 1) * H);
  for(let j = 0; j < H; j++){
    const f = filtres[j]; brut[j * (L + 1)] = f;
    for(let i = 0; i < L; i++){
      const a = i >= 4 ? d[j * L + i - 4] : 0, h = j ? d[(j - 1) * L + i] : 0, c = j && i >= 4 ? d[(j - 1) * L + i - 4] : 0;
      brut[j * (L + 1) + 1 + i] = (d[j * L + i] - (f === 0 ? 0 : f === 1 ? a : f === 2 ? h : f === 3 ? (a + h) >> 1 : paeth(a, h, c))) & 255;
    }
  }
  const z = deflateSync(brut, { level:9 }), tete = Buffer.alloc(8), crc = Buffer.alloc(4);
  tete.writeUInt32BE(z.length, 0); tete.write('IDAT', 4, 'latin1');
  crc.writeUInt32BE(crc32(Buffer.concat([tete.subarray(4), z])) >>> 0, 0);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), ...avant, tete, z, crc, ...apres]);
}

function nettoie(img){
  const { W, H, d } = img, A = (i, j) => d[(j * W + i) * 4 + 3];
  let bas = -1;
  for(let j = H - 1; j >= 0 && bas < 0; j--) for(let i = 0; i < W; i++) if(A(i, j) > 20){ bas = j; break; }
  if(bas < 0) return null;
  // La couleur du socle : la plus fréquente juste au-dessus du bas. Le socle lisse est brun foncé ;
  // les socles texturés n'ont pas de couleur dominante, et leur bord est déjà adouci (pas de liseré).
  const hist = new Map(); let total = 0;
  for(let j = Math.max(0, bas - 40); j < bas - 8; j++) for(let i = 0; i < W; i++){
    const p = (j * W + i) * 4; if(d[p + 3] <= 20) continue;
    const k = (d[p] >> 3) << 10 | (d[p + 1] >> 3) << 5 | d[p + 2] >> 3; hist.set(k, (hist.get(k) || 0) + 1); total++;
  }
  let cle = 0, n = 0; for(const [k, v] of hist) if(v > n){ n = v; cle = k; }
  const R = (cle >> 10 & 31) * 8 + 4, G = (cle >> 5 & 31) * 8 + 4, B = (cle & 31) * 8 + 4;
  if(!total || n / total < .5 || R > 110) return null;
  const brun = p => Math.abs(d[p] - R) + Math.abs(d[p + 1] - G) + Math.abs(d[p + 2] - B) < 45;
  let haut = bas - 20;
  for(let j = bas - 20; j >= 0; j--){   // pas depuis le bas : ses rangées peuvent n'être que du liseré
    let c = 0; for(let i = 0; i < W; i++){ const p = (j * W + i) * 4; if(d[p + 3] > 20 && brun(p)) c++; }
    if(c < 150) break; haut = j;
  }
  let retires = 0;
  const efface = p => { d[p] = d[p + 1] = d[p + 2] = d[p + 3] = 0; retires++; };
  for(let passe = 0; passe < 6; passe++){
    const a = [];
    for(let j = Math.max(1, haut); j < H - 1; j++) for(let i = 1; i < W - 1; i++){
      const p = (j * W + i) * 4;
      if(d[p + 3] <= 20 || brun(p)) continue;
      if(!(A(i - 1, j) <= 20 || A(i + 1, j) <= 20 || A(i, j - 1) <= 20 || A(i, j + 1) <= 20)) continue;
      let proche = false;
      for(let v = -6; v <= 6 && !proche; v++) for(let u = -6; u <= 6; u++){
        const q = ((j + v) * W + i + u) * 4;
        if(q >= 0 && q < d.length && d[q + 3] > 20 && brun(q)){ proche = true; break; }
      }
      if(proche) a.push(p);
    }
    if(!a.length) break;
    a.forEach(efface);
  }
  // Les miettes : à hauteur du socle ou dessous, ce qui ne le touche plus.
  const vu = new Uint8Array(W * H), pile = [];
  for(let j = haut; j <= bas; j++) for(let i = 0; i < W; i++){ const p = (j * W + i) * 4; if(d[p + 3] > 20 && brun(p)){ vu[j * W + i] = 1; pile.push(j * W + i); } }
  while(pile.length){
    const o = pile.pop(), i = o % W, j = (o - i) / W;
    for(const [u, v] of [[1, 0], [-1, 0], [0, 1], [0, -1]]){
      const a = i + u, c = j + v; if(a < 0 || c < 0 || a >= W || c >= H) continue;
      const q = c * W + a; if(vu[q] || d[q * 4 + 3] <= 20) continue;
      vu[q] = 1; pile.push(q);
    }
  }
  for(let j = haut; j < H; j++) for(let i = 0; i < W; i++) if(d[(j * W + i) * 4 + 3] > 20 && !vu[j * W + i]) efface((j * W + i) * 4);
  return retires;
}

const fichiers = [];
const parcours = d => { for(const f of readdirSync(d)){ const p = join(d, f); if(statSync(p).isDirectory()) parcours(p); else if(f.endsWith('.png')) fichiers.push(p); } };
parcours('assets/trophies'); parcours('assets/icons');
let touches = 0, sans = 0, avant = 0, apres = 0, totalRetires = 0;
for(const f of fichiers){
  const b = readFileSync(f), img = lit(b), r = nettoie(img);
  if(r === null){ sans++; continue; }
  if(!r) continue;
  const neuf = ecrit(img);
  touches++; totalRetires += r; avant += b.length; apres += neuf.length;
  if(ECRIRE) writeFileSync(f, neuf);
}
console.log(`${fichiers.length} images, ${touches} retouchées (${Math.round(totalRetires / Math.max(1, touches))} pixels chacune en moyenne), ${sans} sans socle lisse`);
console.log(`poids des retouchées : ${Math.round(avant / 1024)} -> ${Math.round(apres / 1024)} Ko${ECRIRE ? '' : ' (rien écrit)'}`);

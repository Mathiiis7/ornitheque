// Lecture et ecriture de PNG 8 bits, sans aucune dependance : node:zlib suffit.
// Sert aux outils de logo (icones-logo.mjs, prepare-logo.mjs) pour eviter d'installer
// une bibliotheque d'images dans un projet qui n'en a aucune.
// Limites assumees : 8 bits par canal, pas d'entrelacement, pas de palette.

import { inflateSync, deflateSync } from 'node:zlib';

function chunks(buf) {
  const out = [];
  let i = 8;
  while (i < buf.length - 8) {
    const taille = buf.readUInt32BE(i);
    const nom = buf.toString('ascii', i + 4, i + 8);
    out.push({ nom, data: buf.subarray(i + 8, i + 8 + taille) });
    if (nom === 'IEND') break;
    i += 12 + taille;
  }
  return out;
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

// Rend { largeur, hauteur, rvba } : rvba est toujours en 4 canaux, meme si la
// source n'en avait qu'un ou trois. C'est ce qui simplifie tout le reste.
export function lirePng(buf) {
  const cs = chunks(buf);
  const ihdr = cs.find((c) => c.nom === 'IHDR').data;
  const largeur = ihdr.readUInt32BE(0);
  const hauteur = ihdr.readUInt32BE(4);
  const profondeur = ihdr[8];
  const type = ihdr[9];
  const entrelace = ihdr[12];

  if (profondeur !== 8) throw new Error(`profondeur ${profondeur} non geree`);
  if (entrelace !== 0) throw new Error('PNG entrelace non gere');
  const canaux = { 0: 1, 2: 3, 4: 2, 6: 4 }[type];
  if (!canaux) throw new Error(`type de couleur ${type} non gere`);

  const brut = inflateSync(Buffer.concat(cs.filter((c) => c.nom === 'IDAT').map((c) => c.data)));
  const ligne = largeur * canaux;
  const px = new Uint8Array(hauteur * ligne);

  let src = 0;
  for (let y = 0; y < hauteur; y++) {
    const filtre = brut[src++];
    const debut = y * ligne;
    for (let x = 0; x < ligne; x++) {
      const val = brut[src++];
      const a = x >= canaux ? px[debut + x - canaux] : 0;
      const b = y > 0 ? px[debut - ligne + x] : 0;
      const c = x >= canaux && y > 0 ? px[debut - ligne + x - canaux] : 0;
      let out;
      switch (filtre) {
        case 0: out = val; break;
        case 1: out = val + a; break;
        case 2: out = val + b; break;
        case 3: out = val + ((a + b) >> 1); break;
        case 4: out = val + paeth(a, b, c); break;
        default: throw new Error(`filtre ${filtre} inconnu`);
      }
      px[debut + x] = out & 0xff;
    }
  }

  const rvba = new Uint8Array(largeur * hauteur * 4);
  for (let p = 0; p < largeur * hauteur; p++) {
    if (canaux === 4) { rvba.set(px.subarray(p * 4, p * 4 + 4), p * 4); }
    else if (canaux === 3) { rvba.set(px.subarray(p * 3, p * 3 + 3), p * 4); rvba[p * 4 + 3] = 255; }
    else if (canaux === 2) { rvba.fill(px[p * 2], p * 4, p * 4 + 3); rvba[p * 4 + 3] = px[p * 2 + 1]; }
    else { rvba.fill(px[p], p * 4, p * 4 + 3); rvba[p * 4 + 3] = 255; }
  }
  return { largeur, hauteur, rvba };
}

const TABLE_CRC = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE_CRC[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(nom, data) {
  const taille = Buffer.alloc(4);
  taille.writeUInt32BE(data.length);
  const corps = Buffer.concat([Buffer.from(nom, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corps));
  return Buffer.concat([taille, corps, crc]);
}

// Choisit le meilleur filtre ligne par ligne, comme le fait n'importe quel encodeur
// serieux : sur une image plate, ca divise le poids par deux ou trois.
function filtreLigne(cur, prec, bpp) {
  const n = cur.length;
  const essais = [];
  for (let f = 0; f < 5; f++) {
    const out = Buffer.alloc(n);
    let somme = 0;
    for (let i = 0; i < n; i++) {
      const a = i >= bpp ? cur[i - bpp] : 0;
      const b = prec[i];
      const c = i >= bpp ? prec[i - bpp] : 0;
      let v;
      switch (f) {
        case 0: v = cur[i]; break;
        case 1: v = cur[i] - a; break;
        case 2: v = cur[i] - b; break;
        case 3: v = cur[i] - ((a + b) >> 1); break;
        default: v = cur[i] - paeth(a, b, c);
      }
      out[i] = v & 0xff;
      somme += out[i] < 128 ? out[i] : 256 - out[i];
    }
    essais.push({ f, out, somme });
  }
  essais.sort((x, y) => x.somme - y.somme);
  return essais[0];
}

export function ecrirePng(rvba, largeur, hauteur) {
  const ligne = largeur * 4;
  const brut = Buffer.alloc(hauteur * (ligne + 1));
  let prec = Buffer.alloc(ligne);
  for (let y = 0; y < hauteur; y++) {
    const cur = Buffer.from(rvba.buffer, rvba.byteOffset + y * ligne, ligne);
    const { f, out } = filtreLigne(cur, prec, 4);
    brut[y * (ligne + 1)] = f;
    out.copy(brut, y * (ligne + 1) + 1);
    prec = cur;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0);
  ihdr.writeUInt32BE(hauteur, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(brut, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// Reduction par moyenne de zone : c'est ce qui donne un bord propre quand on descend
// de 1024 px a 192. Un simple echantillonnage donnerait des dents.
// Les couleurs sont moyennees ponderees par l'alpha, sinon les pixels transparents
// tirent les bords vers le noir.
export function reduire(src, lSrc, hSrc, cote) {
  const out = new Uint8Array(cote * cote * 4);
  const rx = lSrc / cote, ry = hSrc / cote;
  for (let y = 0; y < cote; y++) {
    const y0 = Math.floor(y * ry), y1 = Math.max(y0 + 1, Math.floor((y + 1) * ry));
    for (let x = 0; x < cote; x++) {
      const x0 = Math.floor(x * rx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * rx));
      let r = 0, v = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1 && yy < hSrc; yy++) {
        for (let xx = x0; xx < x1 && xx < lSrc; xx++) {
          const i = (yy * lSrc + xx) * 4;
          const al = src[i + 3] / 255;
          r += src[i] * al; v += src[i + 1] * al; b += src[i + 2] * al; a += src[i + 3];
          n++;
        }
      }
      const i = (y * cote + x) * 4;
      const poids = a / 255 || 1;
      out[i] = Math.round(r / poids);
      out[i + 1] = Math.round(v / poids);
      out[i + 2] = Math.round(b / poids);
      out[i + 3] = Math.round(a / n);
    }
  }
  return out;
}

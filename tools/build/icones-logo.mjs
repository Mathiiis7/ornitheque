// Refabrique les icones du logo a partir de la VRAIE source.
//
// Pourquoi ce script existe : assets/logos/huppe.svg n'est pas un SVG. C'est une
// enveloppe qui contient deux PNG en base64 de 909x1067 - un masque en niveaux de
// gris et l'image en couleurs - soit 432 Ko pour une image matricielle. Et c'est ce
// fichier que manifest.json declarait comme icone 192 et 512 px : le telephone
// telechargeait 432 Ko pour afficher une image de 909 px etiree, la ou huppe.png
// (320 px, 38 Ko) servait deja de favicon.
//
// Le script recompose masque + couleurs en RVBA, recadre sur l'oiseau, complete en
// carre, et sort les tailles demandees. Aucune dependance : node:zlib suffit.
//
// Usage : node tools/build/icones-logo.mjs
//
// Mesure du 2026-09-28 : la source utile fait 909x1067, le PNG publie n'en gardait
// que 320x320. Les icones produites sont donc plus nettes que l'ancienne, pas juste
// plus grandes.

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync, deflateSync } from 'node:zlib';
import { join } from 'node:path';

const RACINE = process.cwd();
const SOURCE = join(RACINE, 'assets', 'logos', 'huppe.svg');
const DOSSIER = join(RACINE, 'assets', 'logos');
const TAILLES = [512, 192];

// ---------- lecture PNG ----------

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

// Rend { largeur, hauteur, canaux, pixels } avec pixels en Uint8Array brut.
function lirePng(buf) {
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
  const pixels = new Uint8Array(hauteur * ligne);

  let src = 0;
  for (let y = 0; y < hauteur; y++) {
    const filtre = brut[src++];
    const debut = y * ligne;
    for (let x = 0; x < ligne; x++) {
      const val = brut[src++];
      const a = x >= canaux ? pixels[debut + x - canaux] : 0;
      const b = y > 0 ? pixels[debut - ligne + x] : 0;
      const c = x >= canaux && y > 0 ? pixels[debut - ligne + x - canaux] : 0;
      let out;
      switch (filtre) {
        case 0: out = val; break;
        case 1: out = val + a; break;
        case 2: out = val + b; break;
        case 3: out = val + ((a + b) >> 1); break;
        case 4: out = val + paeth(a, b, c); break;
        default: throw new Error(`filtre ${filtre} inconnu`);
      }
      pixels[debut + x] = out & 0xff;
    }
  }
  return { largeur, hauteur, canaux, pixels };
}

// ---------- ecriture PNG ----------

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

// rvba : Uint8Array de largeur*hauteur*4
function ecrirePng(rvba, largeur, hauteur) {
  const ligne = largeur * 4;
  const brut = Buffer.alloc(hauteur * (ligne + 1));
  for (let y = 0; y < hauteur; y++) {
    brut[y * (ligne + 1)] = 0; // filtre None : le poids compte peu a ces tailles
    Buffer.from(rvba.buffer, rvba.byteOffset + y * ligne, ligne).copy(brut, y * (ligne + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0);
  ihdr.writeUInt32BE(hauteur, 4);
  ihdr[8] = 8;   // 8 bits par canal
  ihdr[9] = 6;   // RVB + alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(brut, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- traitement ----------

// Reduction par moyenne de zone : c'est ce qui donne un bord propre quand on
// descend de 909 px a 192. Un simple echantillonnage donnerait des dents.
function reduire(src, lSrc, hSrc, cote) {
  const out = new Uint8Array(cote * cote * 4);
  const ratio = lSrc / cote;
  for (let y = 0; y < cote; y++) {
    const y0 = Math.floor(y * ratio), y1 = Math.max(y0 + 1, Math.floor((y + 1) * ratio));
    for (let x = 0; x < cote; x++) {
      const x0 = Math.floor(x * ratio), x1 = Math.max(x0 + 1, Math.floor((x + 1) * ratio));
      let r = 0, v = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1 && yy < hSrc; yy++) {
        for (let xx = x0; xx < x1 && xx < lSrc; xx++) {
          const i = (yy * lSrc + xx) * 4;
          const al = src[i + 3] / 255;
          // Moyenne des couleurs ponderee par l'alpha, sinon les pixels
          // transparents tirent les bords vers le noir.
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

const svg = readFileSync(SOURCE, 'latin1');
const images = [...svg.matchAll(/(?:xlink:)?href="data:image\/png;base64,([^"]+)"/g)]
  .map((m) => lirePng(Buffer.from(m[1], 'base64')));

if (images.length !== 2) throw new Error(`${images.length} images trouvees, 2 attendues`);
const masque = images.find((i) => i.canaux === 1);
const couleur = images.find((i) => i.canaux === 3);
if (!masque || !couleur) throw new Error('il faut un masque en gris et une image RVB');
if (masque.largeur !== couleur.largeur || masque.hauteur !== couleur.hauteur) {
  throw new Error('masque et couleurs de tailles differentes');
}

const { largeur: L, hauteur: H } = couleur;
const rvba = new Uint8Array(L * H * 4);
for (let p = 0; p < L * H; p++) {
  rvba[p * 4] = couleur.pixels[p * 3];
  rvba[p * 4 + 1] = couleur.pixels[p * 3 + 1];
  rvba[p * 4 + 2] = couleur.pixels[p * 3 + 2];
  rvba[p * 4 + 3] = masque.pixels[p];
}

// Recadrage sur ce qui est visible : la source a de larges marges vides.
let xMin = L, xMax = -1, yMin = H, yMax = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < L; x++) {
    if (rvba[(y * L + x) * 4 + 3] > 8) {
      if (x < xMin) xMin = x;
      if (x > xMax) xMax = x;
      if (y < yMin) yMin = y;
      if (y > yMax) yMax = y;
    }
  }
}
const lUtile = xMax - xMin + 1, hUtile = yMax - yMin + 1;

// Carre autour du dessin, avec 4 % de marge : une icone collee aux bords parait sale.
const cote = Math.round(Math.max(lUtile, hUtile) * 1.08);
const carre = new Uint8Array(cote * cote * 4);
const decX = Math.round((cote - lUtile) / 2), decY = Math.round((cote - hUtile) / 2);
for (let y = 0; y < hUtile; y++) {
  for (let x = 0; x < lUtile; x++) {
    const src = ((y + yMin) * L + (x + xMin)) * 4;
    const dst = ((y + decY) * cote + (x + decX)) * 4;
    carre.set(rvba.subarray(src, src + 4), dst);
  }
}

console.log(`source       ${L}x${H}`);
console.log(`dessin utile ${lUtile}x${hUtile} (marges vides retirees)`);
console.log(`carre        ${cote}x${cote}`);

for (const taille of TAILLES) {
  const png = ecrirePng(reduire(carre, cote, cote, taille), taille, taille);
  const chemin = join(DOSSIER, `huppe-${taille}.png`);
  writeFileSync(chemin, png);
  console.log(`ecrit  assets/logos/huppe-${taille}.png  ${(png.length / 1024).toFixed(1)} Ko`);
}

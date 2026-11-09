#!/usr/bin/env node
/*
  verser-pays.mjs - Verse la rareté et les fréquences mensuelles d'un ou plusieurs pays dans
  data/rarity_pays.json et data/freq_monthly_pays.json.

  POURQUOI. Depuis le 2026-09-27, ces deux tables ne vivent plus dans app.js (sortir-raretes.mjs,
  sortir-freq-mensuelles.mjs, qui ne servaient qu'une fois). inject-rarity-multi-country.mjs ne
  remplace qu'une table présente dans app.js : pour un pays nouveau, il dit « introuvable » et
  n'écrit rien (constaté sur le Maroc le 2026-11-09). Ce script est l'étape qui manquait.

  Entrée : data/generated/real-rarity-<cc>-ebird.generated.js (build-rarity-multi-country.mjs).
  Un pays déjà présent est remplacé, les autres sont gardés tels quels.

  Usage : node outils/build/verser-pays.mjs MA[,TR,...]
*/
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const pays = (process.argv[2] || '').split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
if (!pays.length) { console.error('Usage : node outils/build/verser-pays.mjs MA[,TR,...]'); process.exit(1); }

const CIBLES = [
  { fichier: join(RACINE, 'data', 'rarity_pays.json'),        table: cc => `REAL_RARITY_${cc}_EBIRD` },
  { fichier: join(RACINE, 'data', 'freq_monthly_pays.json'),  table: cc => `REAL_FREQ_MONTHLY_${cc}` },
];
const json = CIBLES.map(c => JSON.parse(readFileSync(c.fichier, 'utf8')));

for (const cc of pays) {
  const src = join(RACINE, 'data', 'generated', `real-rarity-${cc.toLowerCase()}-ebird.generated.js`);
  if (!existsSync(src)) { console.error(`ARRET : ${src} absent (lancer build-rarity-multi-country.mjs ${cc})`); process.exit(1); }
  const texte = readFileSync(src, 'utf8');
  CIBLES.forEach((c, i) => {
    const m = texte.match(new RegExp(`export const ${c.table(cc)} = (\\{.*\\});`));
    if (!m) { console.error(`ARRET : ${c.table(cc)} introuvable dans ${src}`); process.exit(1); }
    const avant = json[i][cc] ? Object.keys(json[i][cc]).length : 0;
    json[i][cc] = JSON.parse(m[1]);
    console.log(`${cc} -> ${c.fichier.split(/[\\/]/).pop()} : ${Object.keys(json[i][cc]).length} especes` + (avant ? ` (remplace ${avant})` : ' (nouveau)'));
  });
}

CIBLES.forEach((c, i) => {
  const ordonne = Object.fromEntries(Object.keys(json[i]).sort().map(k => [k, json[i][k]]));
  writeFileSync(c.fichier, JSON.stringify(ordonne), 'utf8');
  console.log(`Ecrit ${c.fichier.split(/[\\/]/).pop()} : ${Object.keys(ordonne).length} pays, ${Math.round(Buffer.byteLength(JSON.stringify(ordonne)) / 1024)} Ko`);
});

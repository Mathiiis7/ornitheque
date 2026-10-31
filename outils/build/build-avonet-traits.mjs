#!/usr/bin/env node
/*
  build-avonet-traits.mjs - Extrait ecologie + morphologie Avonet pour affichage
  sur les fiches especes.

  Source : outils/avonet.xlsx, sheet AVONET2_eBird
  Sortie : data/avonet_traits.json (~1.4 MB, lazy load cote app)

  Structure par espece :
    {
      hd: 1|2|3,            // Habitat.Density (1=dense, 3=ouvert)
      mi: 1|2|3,            // Migration (1=sedentaire, 3=migrateur total)
      tl: 'C'|'H'|'O'|'S',  // Trophic Level (Carnivore/Herbivore/Omnivore/Scavenger)
      tn: 'Insectivore',... // Trophic Niche
      pl: 'Ins'|'Aer'|...,  // Primary Lifestyle (3 char)
      ma: 12.5,             // Mass (g)
      wi: 66,                // Wing.Length (mm)
      bl: 8.5,               // Beak.Length_Culmen (mm)
      ta: 16.3,              // Tarsus.Length (mm)
      tail: 51,              // Tail.Length (mm)
      hwi: 15.7,             // Hand-Wing.Index (dispersion)
      hab: 'Wetland',        // Habitat (categoriel : Marine/Coastal/Riverine/Wetland/
                             //          Forest/Woodland/Grassland/Shrubland/Rock/
                             //          Human Modified/Desert). Sert au fallback R
                             //          Phase B pour forcer les fractions sur les
                             //          especes specialistes que S&T rate.
    }

  Usage : node outils/build-avonet-traits.mjs
*/
import XLSX from 'xlsx';
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
const __dir = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dir, '..', '..');
const XLSX_PATH = join(ROOT, 'data', 'generated', 'avonet.xlsx');
const OUT_PATH = join(ROOT, 'data', 'avonet_traits.json');

console.log('[1] Lecture Avonet xlsx (AVONET2_eBird)...');
const wb = XLSX.readFile(XLSX_PATH);
const rows = XLSX.utils.sheet_to_json(wb.Sheets['AVONET2_eBird']);
console.log(`    ${rows.length} lignes.`);

console.log('\n[2] Extraction des traits...');
const out = {};
let n = 0;
// Round numeric fields to 1 decimal to reduce size and cleaner display
const round1 = v => (v == null || isNaN(v)) ? null : Math.round(v * 10) / 10;
const traitsDe = (r) => {
  const rec = {
    hd: Number(r['Habitat.Density']) || null,
    mi: Number(r.Migration) || null,
    tl: (r['Trophic.Level'] || '').charAt(0) || null,
    tn: r['Trophic.Niche'] || null,
    pl: (r['Primary.Lifestyle'] || '').slice(0, 3) || null,
    ma: round1(Number(r.Mass)),
    wi: round1(Number(r['Wing.Length'])),
    bl: round1(Number(r['Beak.Length_Culmen'])),
    ta: round1(Number(r['Tarsus.Length'])),
    tail: round1(Number(r['Tail.Length'])),
    hwi: round1(Number(r['Hand-Wing.Index'])),
    // Habitat categoriel : chaine ou null. On garde tel quel (pas de mapping),
    // valeurs possibles Marine/Coastal/Riverine/Wetland/Forest/Woodland/Grassland/
    // Shrubland/Rock/Human Modified/Desert. NA -> null.
    hab: (r.Habitat && r.Habitat !== 'NA') ? String(r.Habitat).trim() : null,
  };
  // Retire les cles null pour reduire la taille
  for (const k of Object.keys(rec)) if (rec[k] == null) delete rec[k];
  return rec;
};
for (const r of rows) {
  const sci = String(r.Species2 || '').trim().toLowerCase();
  if (!sci) continue;
  const rec = traitsDe(r);
  if (Object.keys(rec).length === 0) continue;
  out[sci] = rec;
  n++;
}
console.log(`    ${n} especes avec au moins 1 trait.`);

// 2026-10-31 : un oiseau du site absent de la classification eBird d'Avonet a souvent ses propres mesures dans les
// deux autres (BirdLife, BirdTree) : Goéland d'Amérique, Puffin cendré, 498 oiseaux en tout. On ne les ajoute que
// pour les noms du site : ce fichier se télécharge à chaque première fiche.
const FR_NAMES = JSON.parse(readFileSync(join(ROOT, 'app.js'), 'utf8').match(/const FR_NAMES = (\{.*?\});/)[1]);
const autres = new Map();
for (const [feuille, col] of [['AVONET1_BirdLife', 'Species1'], ['AVONET3_BirdTree', 'Species3']]) {
  for (const r of XLSX.utils.sheet_to_json(wb.Sheets[feuille])) {
    const sci = String(r[col] || '').trim().toLowerCase();
    if (sci && !autres.has(sci)) autres.set(sci, r);
  }
}
let nAutres = 0;
for (const sci of Object.keys(FR_NAMES)) {
  if (out[sci] || !autres.has(sci)) continue;
  const rec = traitsDe(autres.get(sci));
  if (Object.keys(rec).length) { out[sci] = rec; nAutres++; }
}
console.log(`    ${nAutres} ajoutees depuis BirdLife et BirdTree.`);

// Les genres renommés (outils/build/avonet-renommes.mjs). Un ancien nom qui reste un oiseau du site est un AUTRE
// oiseau : Akialoa stejnegeri, disparu, n'est pas Chlorodrepanis stejnegeri, l'amakihi de Kauai, de même famille.
const renommes = JSON.parse(readFileSync(join(ROOT, 'outils', 'config', 'avonet-renommes.json'), 'utf8'));
let nRen = 0;
const refuses = [];
for (const [sci, ancien] of Object.entries(renommes)) {
  if (FR_NAMES[ancien]) { refuses.push(`${sci} / ${ancien}`); continue; }
  if (out[sci]) continue;
  const r = rows.find(x => String(x.Species2 || '').trim().toLowerCase() === ancien) || autres.get(ancien);
  if (!r) continue;
  const rec = traitsDe(r);
  if (Object.keys(rec).length) { out[sci] = rec; nRen++; }
}
console.log(`    ${nRen} genres renommes rattaches, ${refuses.length} refuses :`, refuses.join(' ; '));

console.log('\n[3] Ecriture data/avonet_traits.json...');
writeFileSync(OUT_PATH, JSON.stringify(out));
const stat = (await import('node:fs/promises')).default.stat;
const size = (await stat(OUT_PATH)).size;
console.log(`    OK. ${(size/1024).toFixed(0)} KB.`);

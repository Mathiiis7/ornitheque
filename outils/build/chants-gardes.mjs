#!/usr/bin/env node
/*
  chants-gardes.mjs - ecrit data/parcours-mesanges.json, les seuls chants que joue le parcours
  du quiz : ceux que Mathis a ecoutes et gardes le 2026-10-16 parmi les candidats de
  chants-parcours.mjs (page notes-privees/ecoute-chants/).

      node outils/build/chants-parcours.mjs   (une fois : les candidats)
      node outils/build/chants-gardes.mjs     (puis : le fichier publie)

  Les identifiants ci-dessous SONT sa selection, recopiee telle qu'il l'a collee.
  Pour changer un chant, changer cette liste a la main apres l'avoir fait ecouter.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const GARDES = {
  'parus major': [1100272, 1092231, 1084417, 1046158, 994505, 862138, 804299, 801249, 711263, 702431, 626693, 550313, 161542],
  'phylloscopus collybita': [985275, 978524, 904320, 830601, 807054, 692351, 664445, 643725, 374746, 298834, 240896, 161937, 138845, 1091827, 992402],
  'cyanistes caeruleus': [880622, 802235, 722939, 623137, 536056, 533328, 311018, 298118, 240794, 134949, 384605, 1185195, 1070960, 985196, 972604],
  'poecile palustris': [618397, 584044, 400300, 161554, 872533, 864567, 855712, 797517, 780633, 720007],
  'periparus ater': [1105320, 537840, 533713, 270438, 177719, 138844, 1011037, 384581, 240923, 1092922, 1001379, 985198, 879546],
};
const cand = JSON.parse(readFileSync(join(RACINE, 'notes-privees', 'ecoute-chants', 'candidats.json'), 'utf8'));
const out = {};
let manque = 0;
for (const [sci, ids] of Object.entries(GARDES)) {
  out[sci] = ids.map(id => {
    const r = (cand[sci] || []).find(x => String(x.id) === String(id));
    if (!r) { console.error('introuvable dans les candidats :', sci, id); manque++; return null; }
    // Seuls les champs que le quiz lit : le son, le sonagramme, et de quoi citer l'auteur.
    return { id: r.id, file: r.file, sono: r.sono, rec: r.rec, cnt: r.cnt, loc: r.loc, length: r.length };
  }).filter(Boolean);
  console.log(sci.padEnd(24), out[sci].length, 'chants,', new Set(out[sci].map(r => r.rec)).size, 'enregistreurs');
}
if (manque) process.exit(1);
writeFileSync(join(RACINE, 'data', 'parcours-mesanges.json'), JSON.stringify(out));
console.log('ecrit data/parcours-mesanges.json');

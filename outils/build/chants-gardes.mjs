#!/usr/bin/env node
/*
  chants-gardes.mjs - ecrit le fichier des chants que joue un parcours du quiz : ceux que Mathis
  a ecoutes et gardes parmi les candidats de chants-parcours.mjs (une page d'ecoute par parcours
  dans notes-privees/).

      node outils/build/chants-parcours.mjs [parcours]   (une fois : les candidats)
      node outils/build/chants-gardes.mjs [parcours]     (puis : le fichier publie)

  Sans nom : mesanges -> data/parcours-mesanges.json (selection du 2026-10-16).
  phrases -> data/parcours-phrases.json (« Phrases qui degringolent »).

  Les identifiants ci-dessous SONT sa selection, recopiee telle qu'il l'a collee.
  Pour changer un chant, changer cette liste a la main apres l'avoir fait ecouter.
  null = pas encore ecoute : on prend PROVISOIREMENT les 15 candidats, pour voir le parcours
  (Mathis le 2026-10-17, « je veux voir »). A remplacer par sa selection.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PARCOURS = {
  mesanges: { candidats: 'ecoute-chants', sortie: 'parcours-mesanges.json', gardes: {
    'parus major': [1100272, 1092231, 1084417, 1046158, 994505, 862138, 804299, 801249, 711263, 702431, 626693, 550313, 161542],
    'phylloscopus collybita': [985275, 978524, 904320, 830601, 807054, 692351, 664445, 643725, 374746, 298834, 240896, 161937, 138845, 1091827, 992402],
    'cyanistes caeruleus': [880622, 802235, 722939, 623137, 536056, 533328, 311018, 298118, 240794, 134949, 384605, 1185195, 1070960, 985196, 972604],
    'poecile palustris': [618397, 584044, 400300, 161554, 872533, 864567, 855712, 797517, 780633, 720007],
    'periparus ater': [1105320, 537840, 533713, 270438, 177719, 138844, 1011037, 384581, 240923, 1092922, 1001379, 985198, 879546],
  } },
  // Selection du 2026-10-17 (notes-privees/ecoute-chants-phrases/selection-2026-10-17.txt).
  phrases: { candidats: 'ecoute-chants-phrases', sortie: 'parcours-phrases.json', gardes: {
    'fringilla coelebs': [1152195, 1095018, 1088506, 919298, 906507, 896964, 855470, 817764, 792717, 708596, 541588, 528662, 483107, 479629],
    'phylloscopus trochilus': [989893, 908606, 870833, 699178, 647254, 635230, 464496, 367579, 365751, 298817, 161903, 79028, 468273, 1153230, 1140185],
    // Les quatre suivants : selection du 2026-10-18. Son texte colle ce jour-la ne gardait qu'un
    // chant du pinson et aucun du fitis (autre etat du navigateur) : leurs listes du 17 restent.
    'certhia brachydactyla': [1152949, 1073542, 917422, 884077, 879424, 804603, 789334, 637242, 539347, 533321, 1148675],
    'certhia familiaris': [627940, 626692, 543055, 140084, 893580, 807845, 636121, 591238, 570594, 320305, 307212, 64859, 1107503, 602930, 303238],
    'phoenicurus ochruros': [895998, 696070, 688061, 503962, 335144, 237537, 143380, 141179, 844325, 815660, 718273, 374793, 55316],
    'phoenicurus phoenicurus': [1048983, 937923, 900653, 809653, 560329, 551719, 549562, 244703, 800464, 1102129, 998031, 994185, 904746],
  } },
};
const nom = process.argv[2] || 'mesanges';
// Un nom inconnu s'arrete : retomber sur mesanges ecraserait le fichier du premier parcours.
if (!PARCOURS[nom]) { console.error('parcours inconnu :', nom, '- connus :', Object.keys(PARCOURS).join(', ')); process.exit(1); }
const { candidats, sortie, gardes: GARDES } = PARCOURS[nom];
const cand = JSON.parse(readFileSync(join(RACINE, 'notes-privees', candidats, 'candidats.json'), 'utf8'));
const out = {};
let manque = 0;
for (const [sci, ids] of Object.entries(GARDES)) {
  const liste = ids || (cand[sci] || []).map(r => r.id);
  out[sci] = liste.map(id => {
    const r = (cand[sci] || []).find(x => String(x.id) === String(id));
    if (!r) { console.error('introuvable dans les candidats :', sci, id); manque++; return null; }
    // Seuls les champs que le quiz lit : le son, le sonagramme, et de quoi citer l'auteur.
    return { id: r.id, file: r.file, sono: r.sono, rec: r.rec, cnt: r.cnt, loc: r.loc, length: r.length };
  }).filter(Boolean);
  console.log(sci.padEnd(24), out[sci].length, 'chants,', new Set(out[sci].map(r => r.rec)).size, 'enregistreurs', ids ? '' : '(PROVISOIRE : pas encore ecoute)');
}
if (manque) process.exit(1);
writeFileSync(join(RACINE, 'data', sortie), JSON.stringify(out));
console.log('ecrit data/' + sortie);

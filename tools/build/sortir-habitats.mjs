#!/usr/bin/env node
/*
  sortir-habitats.mjs - Sort d'app.js la table HABITATS (milieux de vie par espece, issue
  d'AVONET) vers data/habitats.json.

  POURQUOI. 361 Ko bruts, et surtout 75 Ko gzippes de moins sur le chemin critique - mesure
  du 2026-09-27, faite en retirant la ligne et en recompressant le fichier entier, la seule
  qui vaille : la taille brute ment beaucoup, les 443 Ko de paliers de rarete n'avaient
  rendu que 80 Ko une fois compresses.

  QUI LA LIT. Seulement le birdydex, par habitatsOf() : les vignettes et le filtre
  « habitat ». Il se redessine a l'arrivee du fichier. Tant qu'il n'est pas la, habitatsOf
  rend null, ce que tous ses appelants savent deja traiter.

  HABITAT_OVERRIDES et HABITAT_ADDITIONS restent en dur : moins d'un kilo-octet a eux deux,
  et ce sont des corrections ecrites a la main, pas des donnees generees.

  Idempotent : relance sans effet si la table est deja sortie.

  Usage : node tools/build/sortir-habitats.mjs [--verifier]
*/
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dir = dirname(fileURLToPath(import.meta.url));
const RACINE = join(__dir, '..', '..');
const APP = join(RACINE, 'app.js');
const SORTIE = join(RACINE, 'data', 'habitats.json');
const VERIF = process.argv.includes('--verifier');

const brut = readFileSync(APP, 'utf8');
const crlf = brut.includes('\r\n');
const lignes = brut.split(/\r?\n/);

const DECL = /^\s*(?:const|let|var)\s+HABITATS\s*=\s*(\{.*\})\s*;\s*$/;
let idx = -1, table = null;
lignes.forEach((l, i) => {
  const m = l.match(DECL);
  if (!m) return;
  try { table = JSON.parse(m[1]); idx = i; }
  catch (e) { console.error('ARRET : HABITATS ligne ' + (i + 1) + ' n est pas du JSON : ' + e.message); process.exit(1); }
});

if (idx < 0) {
  console.log('Pas de table HABITATS en dur dans app.js : deja sortie, rien a faire.');
  process.exit(0);
}

const especes = Object.keys(table).length;
const octets = Buffer.byteLength(lignes[idx], 'utf8');
console.log(especes + ' especes, ' + Math.round(octets / 1024) + ' Ko, ligne ' + (idx + 1));

if (VERIF) { console.log('\n--verifier : rien n a ete ecrit.'); process.exit(0); }

mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, JSON.stringify(table), 'utf8');

// La declaration reste, mais vide : habitatsOf() et les diagnostics continuent de nommer
// HABITATS sans rien savoir du fichier, et la table se remplit a l'arrivee de celui-ci.
lignes[idx] =
  '// Les milieux de vie vivent dans data/habitats.json depuis le 2026-09-27 : 361 Ko bruts,\n' +
  '// 75 Ko gzippes de moins avant le premier affichage. La table se remplit a l arrivee du\n' +
  '// fichier (voir _chargerHabitats). Vide, habitatsOf rend null, ce que ses appelants\n' +
  '// traitent deja. Regenerable : node tools/build/sortir-habitats.mjs\n' +
  'let HABITATS = {};';

writeFileSync(APP, lignes.join(crlf ? '\r\n' : '\n'), 'utf8');

const ko = n => Math.round(n / 1024) + ' Ko';
const apres = Buffer.byteLength(readFileSync(APP, 'utf8'), 'utf8');
console.log('');
console.log('Ecrit ' + SORTIE + ' : ' + ko(Buffer.byteLength(JSON.stringify(table), 'utf8')));
console.log('app.js : ' + ko(Buffer.byteLength(brut, 'utf8')) + ' -> ' + ko(apres));

#!/usr/bin/env node
/*
  build-habitats-birdbase.mjs - Les milieux de vie par espece, depuis BIRDBASE.

  REMPLACE AVONET, abandonne le 2026-09-29. AVONET ne donnait qu'UNE categorie par espece :
  1,10 milieu en moyenne, 9 088 de nos 10 584 especes avec un seul milieu, et 119 corrections
  ecrites a la main pour rattraper ses erreurs les plus visibles (le balbuzard en haute mer).
  BIRDBASE en donne 2,96, classes par ordre de preference.

  SOURCE. tools/birdbase.xlsx - BIRDBASE v2025.1, Sekercioglu et al. 2025, Scientific Data
  12:1558, https://doi.org/10.6084/m9.figshare.27051040. Licence CC BY : il suffit de citer.
  Le fichier n'est pas dans le depot (gitignore), le retelecharger depuis ce DOI.
  Pourquoi pas l'IUCN, qui a des habitats plus fins : ses conditions d'utilisation (section 4,
  version 3.1) interdisent d'afficher ses donnees sans autorisation ecrite. Seules les
  CATEGORIES de menace sont libres, et ce n'est pas ce qu'on cherche.

  STRUCTURE DU CLASSEUR. Feuille 'Data'. Ligne 1 = bandeau de categories, LIGNE 2 = le vrai
  en-tete, donnees a partir de la ligne 3. Colonnes 32 a 46 = les 15 milieux, chacun portant
  un RANG (1 = principal) et non une croix. Colonnes 2 a 6 = les noms latins des quatre
  taxonomies, 8 a 11 = les familles.

  APPARIEMENT. Le nom latin exact d'abord, dans les QUATRE taxonomies - la seule colonne
  eBird ne retrouvait que 95 % de nos especes, parce que des genres ont eclate en 2024
  (accipiter gentilis est devenu astur gentilis). Puis, pour ce qui reste, le MEME GENRE avec
  une terminaison differente (grus carunculatus / grus carunculata). Rien d'autre : essayer
  par famille appariait le Pigeon de Kittlitz a une colombe de Jamaique et la Taleve de La
  Reunion a un rale africain, tous deux de la bonne famille et tous deux faux. Ce qui reste
  sans milieu est ecrit dans tools/habitats-sans-milieu.txt, a regarder a la main.

  CE QUE BIRDBASE N'A PAS. Toundra, mangrove, grottes, montagne, et la distinction entre
  campagne et ville - il fond les deux dans 'artificial'. Ces cinq categories ne venaient
  deja pas d'AVONET : elles sortent entierement de HABITAT_ADDITIONS et HABITAT_OVERRIDES,
  ecrits a la main dans app.js, que ce script ne touche pas.

  Usage : node tools/build/build-habitats-birdbase.mjs [--essai]
          --essai n'ecrit rien, il imprime seulement le rapport.
*/
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { ouvrir } from './lire-xlsx.mjs';

const __dir = dirname(fileURLToPath(import.meta.url));
const RACINE = join(__dir, '..', '..');
const SOURCE = join(RACINE, 'tools', 'birdbase.xlsx');
const APP = join(RACINE, 'app.js');
const SORTIE = join(RACINE, 'data', 'habitats.json');
const RAPPORT = join(RACINE, 'tools', 'habitats-sans-milieu.txt');
const ESSAI = process.argv.includes('--essai');

// Les 15 colonnes de milieux, et ce qu'elles deviennent chez nous. Deux paires fusionnent :
// bambou rejoint la foret, savane rejoint le bois - notre categorie s'appelle deja
// « Bois / savane arboree » - et plaines rejoint la prairie.
const COLONNE_MILIEU = { 32:'F', 33:'BM', 34:'WD', 35:'SH', 36:'SV', 37:'G', 38:'PL',
                         39:'R', 40:'D', 41:'A', 42:'RV', 43:'C', 44:'W', 45:'SE' };
const VERS_NOUS = { F:'forest', BM:'forest', WD:'woodland', SH:'shrubland', SV:'woodland',
                    G:'grassland', PL:'grassland', R:'rock', D:'desert', A:'humanmod',
                    RV:'riverine', C:'coastal', W:'wetland', SE:'marine' };
// La colonne 46 ('O', autre) est ignoree : quatre especes chez nous, et sa description
// libre - « lava fields », « coral atolls », « glaciers » - ne tombe dans aucune categorie.
const COLONNES_LATIN = [2, 3, 4, 5, 6];

// Les terminaisons latines s'accordent avec le genre grammatical du nom de genre.
const racine = mot => mot.replace(/(ii|i|us|um|a|ae|is|e|os|or|es)$/, '');

console.log('[1] Lecture de ' + SOURCE.replace(RACINE, '.'));
const lignes = ouvrir(SOURCE).feuille('Data');
console.log('    ' + (lignes.length - 2) + ' especes dans le classeur');

const parNom = {};                 // nom latin -> [milieux], par ordre de preference
const parGenreEtRacine = {};       // "genre|racine d'epithete" -> [milieux]
for(const r of lignes.slice(2)){
  const rangs = [];
  for(const [i, code] of Object.entries(COLONNE_MILIEU)){
    const v = r[i];
    if(v !== undefined && v !== '') rangs.push({ code, rang: Number(v) || 99 });
  }
  rangs.sort((a, b) => a.rang - b.rang);
  const milieux = [];
  for(const x of rangs){
    const n = VERS_NOUS[x.code];
    if(n && !milieux.includes(n)) milieux.push(n);
  }
  if(!milieux.length) continue;
  for(const c of COLONNES_LATIN){
    // Certaines cellules portent deux noms separes par une barre oblique.
    for(const part of (r[c] || '').trim().toLowerCase().split(/\s*\/\s*/)){
      const nom = part.trim();
      if(!nom || !nom.includes(' ')) continue;
      if(!parNom[nom]) parNom[nom] = milieux;
      const [genre, ep] = nom.split(' ');
      const cle = genre + '|' + racine(ep);
      if(!parGenreEtRacine[cle]) parGenreEtRacine[cle] = milieux;
    }
  }
}
console.log('    ' + Object.keys(parNom).length + ' noms latins indexes (quatre taxonomies)');

console.log('[2] Lecture des especes que l appli connait');
const app = readFileSync(APP, 'utf8');
const litTable = nom => {
  const m = app.match(new RegExp('const ' + nom + ' = (\\{[\\s\\S]*?\\});\\r?\\n'));
  if(!m) throw new Error(nom + ' introuvable dans app.js');
  return m[1];
};
const FR_NAMES = JSON.parse(litTable('FR_NAMES'));
// SCI_ALIAS est ecrit avec des apostrophes simples : on le lit, on ne le parse pas en JSON.
const ALIAS = {};
for(const m of litTable('SCI_ALIAS').matchAll(/'([^']+)'\s*:\s*'([^']+)'/g)) ALIAS[m[1]] = m[2];
const ANCIENNES = JSON.parse(readFileSync(SORTIE, 'utf8'));

// Les cles a produire : ce que l'appli sait nommer, plus les anciens noms qu'elle redirige.
// On NE reprend PAS les cles de l'ancienne table qui ne sont ni l'un ni l'autre : ce sont
// 270 noms latins herites d'AVONET qu'aucun ecran ne demande plus, et les garder ferait
// grossir un fichier que tous les visiteurs telechargent.
const cibles = [...new Set([...Object.keys(FR_NAMES), ...Object.keys(ALIAS)])].sort();
console.log('    ' + cibles.length + ' especes a couvrir');

console.log('[3] Appariement');
const sortie = {};
let direct = 0, parAlias = 0, parGenre = 0;
const sansMilieu = [];
for(const cle of cibles){
  let m = parNom[cle];
  if(m){ direct++; }
  else if(ALIAS[cle] && parNom[ALIAS[cle]]){ m = parNom[ALIAS[cle]]; parAlias++; }
  else {
    const [genre, ep] = cle.split(' ');
    if(ep){
      const c = parGenreEtRacine[genre + '|' + racine(ep)];
      if(c){ m = c; parGenre++; }
    }
  }
  if(m) sortie[cle] = m;
  else sansMilieu.push(cle);
}
const couverts = cibles.length - sansMilieu.length;
console.log('    nom latin exact          : ' + direct);
console.log('    via un ancien nom connu  : ' + parAlias);
console.log('    meme genre, autre accord : ' + parGenre);
console.log('    SANS MILIEU              : ' + sansMilieu.length);
console.log('    couverture : ' + couverts + ' / ' + cibles.length
  + ' = ' + (100 * couverts / cibles.length).toFixed(2) + ' %');

// Les deux populations n'ont pas le meme poids. Ce que l'appli sait nommer peut s'afficher ;
// le reste n'est qu'une relique d'AVONET, un nom latin qu'aucun ecran ne demande plus.
const nommees = sansMilieu.filter(s => FR_NAMES[s]);
const reliques = sansMilieu.length - nommees.length;
console.log('      dont l appli sait nommer : ' + nommees.length
  + '  (couverture sur ce qui compte : '
  + (100 * (Object.keys(FR_NAMES).length - nommees.length) / Object.keys(FR_NAMES).length).toFixed(2) + ' %)');
console.log('      reliques d AVONET, plus nommees nulle part : ' + reliques);
const perdaient = nommees.filter(s => ANCIENNES[s] && ANCIENNES[s].length);
console.log('      qui perdent un milieu qu elles avaient : ' + perdaient.length
  + (perdaient.length ? ' -> ' + perdaient.join(', ') : ''));

const n = Object.values(sortie).map(v => v.length);
console.log('[4] ' + (n.reduce((a, b) => a + b, 0) / n.length).toFixed(2)
  + ' milieux par espece (AVONET en donnait 1,10)');
const avant = Object.values(ANCIENNES).map(v => v.length);
console.log('    especes a un seul milieu : ' + avant.filter(x => x === 1).length
  + ' avant, ' + n.filter(x => x === 1).length + ' maintenant');

const json = JSON.stringify(sortie);
console.log('[5] poids : ' + (readFileSync(SORTIE).length / 1024).toFixed(1) + ' Ko -> '
  + (json.length / 1024).toFixed(1) + ' Ko bruts, '
  + (gzipSync(readFileSync(SORTIE)).length / 1024).toFixed(1) + ' -> '
  + (gzipSync(Buffer.from(json)).length / 1024).toFixed(1) + ' Ko gzippes');

if(ESSAI){ console.log('\n--essai : rien n a ete ecrit.'); process.exit(0); }
writeFileSync(SORTIE, json);
writeFileSync(RAPPORT, sansMilieu.map(s => (FR_NAMES[s] || '(sans nom francais)') + '\t' + s).join('\n') + '\n');
console.log('\nEcrit : ' + SORTIE.replace(RACINE, '.'));
console.log('Ecrit : ' + RAPPORT.replace(RACINE, '.') + ' (' + sansMilieu.length + ' especes)');

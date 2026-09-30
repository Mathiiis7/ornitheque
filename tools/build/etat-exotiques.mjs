/*
  Etat de la recolte des statuts exotiques par zone : ce qui est fait, ce qui manque, et si
  l'injection a bien suivi.

  POURQUOI CE SCRIPT
  La question « est-ce fini ? » s'est deja posee trois fois, et les notes se contredisent. Elle
  se tranche en une commande, contre les deux seules sources qui font foi :
    - la liste des zones d'un pays se demande A EBIRD, jamais a zones-agregees.json, qui
      ignorait cinq zones lettonnes dont les cinq plus grosses ;
    - ce qui est reellement recolte se lit dans les fichiers exotic-by-region-XX.generated.js ;
    - et ce qui est reellement AFFICHE se lit dans app.js, car repasser l'injecteur fait partie
      du scrape : le 2026-09-27, GB, HU, SI et LV avaient zero zone dans app.js alors que leurs
      fichiers generes etaient pleins.

      node tools/build/etat-exotiques.mjs            les pays a surveiller
      node tools/build/etat-exotiques.mjs MK HU      ceux qu'on nomme

  Les zones connues comme definitivement vides ne sont pas des trous : barchartData y repond
  500 et l'API v2 y donne zero observation. Elles sont listees ci-dessous et comptees a part.
*/
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
import { EBIRD_API_KEY as JETON } from './cle-ebird.mjs';

// Verifie zone par zone, le 2026-09-28 : barchartData repond 500 et l'API donne 0 observation
// sur 30 jours. Ne pas les relancer, et ne pas les compter comme manquantes.
const VIDES = new Set([
  'GB-ENG-HAL',
  'HU-DE', 'HU-MI', 'HU-NY', 'HU-SN', 'HU-SD', 'HU-ST', 'HU-SK', 'HU-EG', 'HU-HV', 'HU-DU',
  'HU-KM', 'HU-TB', 'HU-GY', 'HU-SH', 'HU-ZE', 'HU-NK', 'HU-VM', 'HU-KV', 'HU-PS', 'HU-SS',
  'HU-SF', 'HU-BC',
  'MK-809', 'MK-704', 'MK-208', 'MK-311', 'MK-202', 'MK-204',
]);

const PAYS = process.argv.slice(2).map(p => p.toUpperCase());
const A_SURVEILLER = PAYS.length ? PAYS : ['GB', 'HU', 'SI', 'LV', 'MK', 'MD', 'ME', 'LU', 'NO'];

// Les zones recoltees : les cles du fichier genere. Une zone absente a ete ratee ou jamais
// tentee ; un {} est une vraie zone sans exotique, jamais un raté.
function recoltees(cc){
  const f = join(RACINE, 'tools', 'build', 'exotic-by-region-' + cc.toLowerCase() + '.generated.js');
  let src;
  try{ src = readFileSync(f, 'utf8'); }catch{ return null; }
  const i = src.indexOf('= {');
  if(i < 0) return new Set();
  const obj = JSON.parse(src.slice(i + 2, src.lastIndexOf('}') + 1));
  return new Set(Object.keys(obj));
}

// Ce qu'app.js affiche vraiment. ZONES_EXOTIQUES y est injecte par inject-exotic-by-region.mjs.
function injectees(){
  const src = readFileSync(join(RACINE, 'app.js'), 'utf8');
  const cles = new Set();
  // Les cles de zone ont la forme "XX-..." ou "XX-XXX-..." : on les releve dans la table injectee.
  for(const m of src.matchAll(/"([A-Z]{2}(?:-[A-Z0-9]{1,4}){1,2})":\s*\{/g)) cles.add(m[1]);
  return cles;
}

async function zonesEbird(cc){
  const url = 'https://api.ebird.org/v2/ref/region/list/subnational1/' + cc + '.json';
  const r = await fetch(url, { headers: { 'X-eBirdApiToken': JETON } });
  if(!r.ok) throw new Error(cc + ' : eBird repond ' + r.status);
  return (await r.json()).map(z => z.code);
}

const dansApp = injectees();
let totalManquant = 0;

console.log('pays  eBird  recolte  vides  MANQUE  injecte');
for(const cc of A_SURVEILLER){
  let officiel;
  try{ officiel = await zonesEbird(cc); }
  catch(e){ console.log(cc.padEnd(6) + 'eBird injoignable : ' + e.message); continue; }

  const ont = recoltees(cc);
  if(!ont){ console.log(cc.padEnd(6) + 'aucun fichier genere'); continue; }

  const vides = officiel.filter(z => VIDES.has(z));
  const manque = officiel.filter(z => !ont.has(z) && !VIDES.has(z));
  const injecte = officiel.filter(z => dansApp.has(z)).length;
  totalManquant += manque.length;

  console.log(cc.padEnd(6) +
    String(officiel.length).padStart(5) +
    String(ont.size).padStart(9) +
    String(vides.length).padStart(7) +
    String(manque.length).padStart(8) +
    String(injecte).padStart(9) +
    (manque.length ? '   <- ' + manque.slice(0, 8).join(' ') + (manque.length > 8 ? ' ...' : '') : ''));
}

console.log('');
console.log(totalManquant
  ? totalManquant + ' zone(s) restent a recolter.'
  : 'RIEN A RECOLTER : toutes les zones connues d eBird sont faites ou definitivement vides.');

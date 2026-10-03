// Ce qu'app.js contient VRAIMENT pour les statuts exotiques par zone : quels pays, combien de
// zones chacun, et a quelle maille. Repasser l'injecteur fait partie du scrape - le 2026-09-27,
// quatre pays avaient zero zone dans app.js alors que leurs fichiers generes etaient pleins,
// et leurs cartes s'affichaient vides sans que rien ne le signale.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const RACINE = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = readFileSync(join(RACINE, 'app.js'), 'utf8');

const nom = 'EXOTIC_STATUS_BY_REGION_MULTI';
const i = src.indexOf('const ' + nom + ' = ');
if(i < 0){ console.error('DÉFAUT : ' + nom + ' introuvable dans app.js'); process.exit(1); }
const debut = src.indexOf('{', i);
// La table tient sur une seule ligne : on va jusqu'au point-virgule de fin de ligne.
const fin = src.indexOf(';', debut);
const table = JSON.parse(src.slice(debut, fin));

const pays = Object.keys(table).sort();
console.log(nom + ' : ' + pays.length + ' pays');
let total = 0;
for(const cc of pays){
  const zones = Object.keys(table[cc]);
  total += zones.length;
  console.log('  ' + cc.padEnd(4) + String(zones.length).padStart(5) + ' zones   ex. ' + zones.slice(0, 3).join(', '));
}
console.log('  TOTAL ' + total + ' zones');

// Les fichiers generes, pour comparer : un pays plein cote fichier et vide cote app.js est
// exactement la panne du 2026-09-27.
console.log('');
console.log('pays  genere  dans app.js');
const { readdirSync } = await import('node:fs');
for(const f of readdirSync(join(RACINE, 'outils', 'build')).sort()){
  const m = f.match(/^exotic-by-region-([a-z]{2})\.generated\.js$/);
  if(!m) continue;
  const cc = m[1].toUpperCase();
  const s = readFileSync(join(RACINE, 'outils', 'build', f), 'utf8');
  const j = s.indexOf('= {');
  const n = Object.keys(JSON.parse(s.slice(j + 2, s.lastIndexOf('}') + 1))).length;
  const dans = table[cc] ? Object.keys(table[cc]).length : 0;
  const alerte = n > 0 && dans === 0 ? '   <- GENERE MAIS PAS INJECTE' : '';
  console.log(cc.padEnd(6) + String(n).padStart(6) + String(dans).padStart(12) + alerte);
}

// Audit des regroupements du site : chaque espece de FR_NAMES a-t-elle une famille et un ordre ?
// Lancer depuis la racine : node outils/build/_audit-groupes.mjs
import fs from 'node:fs';
const app = fs.readFileSync('app.js', 'utf8');
function lire(nom){
  const t = 'const ' + nom + ' = ';
  const debut = app.indexOf(t) + t.length;
  const fin = app.slice(debut).search(/;\r?\n/) + debut;
  return new Function('return (' + app.slice(debut, fin) + ')')();
}
const FR_NAMES = lire('FR_NAMES');
const GENUS_FAMILY = lire('GENUS_FAMILY');
const FAMILY_EN_TO_FR = lire('FAMILY_EN_TO_FR');
const FAMILLES_EBIRD = lire('FAMILLES_EBIRD');
const INFO = Object.fromEntries(FAMILLES_EBIRD.map(f => [f[0], f]));
const familyOf = sci => { const g = sci.trim().split(' ')[0].toLowerCase(); const raw = GENUS_FAMILY[g] || 'Autres'; return FAMILY_EN_TO_FR[raw] || raw; };

const cles = Object.keys(FR_NAMES);
console.log('Especes dans FR_NAMES :', cles.length, '(exemple de cle :', cles[0], ')');
const sansFam = [], famHorsListe = new Map(), parFam = new Map();
for(const sci of cles){
  const f = familyOf(sci);
  if(f === 'Autres'){ sansFam.push(sci); continue; }
  if(!INFO[f]) famHorsListe.set(f, (famHorsListe.get(f) || 0) + 1);
  parFam.set(f, (parFam.get(f) || 0) + 1);
}
console.log('Sans famille (Autres) :', sansFam.length);
console.log('  ex :', sansFam.slice(0, 40).map(s => s + ' = ' + FR_NAMES[s]).join(' | '));
console.log('Familles donnees par GENUS_FAMILY mais absentes de FAMILLES_EBIRD (donc sans ordre) :', famHorsListe.size);
for(const [f, n] of [...famHorsListe].sort((a, b) => b[1] - a[1])) console.log('  ', f, n);
console.log('Familles de FAMILLES_EBIRD sans aucune espece dans FR_NAMES :', FAMILLES_EBIRD.filter(f => !parFam.has(f[0])).map(f => f[0]).join(', ') || '-');
const nPass = cles.filter(s => (INFO[familyOf(s)] || [])[2] === 'Passeriformes').length;
console.log('Passeriformes :', nPass, 'especes sur', cles.length, '; familles :', FAMILLES_EBIRD.filter(f => f[2] === 'Passeriformes').length);

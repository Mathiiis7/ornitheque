// Compare les regroupements du site (GENUS_FAMILY, FAMILLES_EBIRD dans app.js) a AviList v2026.
// Pour chaque espece du site (FR_NAMES), on cherche sa famille et son ordre AviList : par le nom
// latin exact, sinon par le genre. Puis on compare les partitions.
// Lancer depuis la racine : node outils/build/_compare-avilist.mjs
import fs from 'node:fs';
import XLSX from 'xlsx';
const app = fs.readFileSync('app.js', 'utf8');
function lire(nom){
  const t = 'const ' + nom + ' = ';
  const d = app.indexOf(t) + t.length;
  return new Function('return (' + app.slice(d, app.slice(d).search(/;\r?\n/) + d) + ')')();
}
const FR_NAMES = lire('FR_NAMES'), GENUS_FAMILY = lire('GENUS_FAMILY'), FAMILY_EN_TO_FR = lire('FAMILY_EN_TO_FR'), FAMILLES_EBIRD = lire('FAMILLES_EBIRD');
const INFO = Object.fromEntries(FAMILLES_EBIRD.map(f => [f[0], f]));
const familyOf = sci => { const raw = GENUS_FAMILY[sci.split(' ')[0]] || 'Autres'; return FAMILY_EN_TO_FR[raw] || raw; };

const wb = XLSX.readFile('notes-privees/arbre/avilist/AviList-v2026-extended.xlsx');
const lignes = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
const avEsp = new Map(), avGenre = new Map(), avFamilles = [], avOrdres = [];
for(const l of lignes){
  const sci = l['SCIENTIFIC NAME'].trim().toLowerCase();
  if(l.RANK === 'order') avOrdres.push(l['SCIENTIFIC NAME']);
  if(l.RANK === 'family') avFamilles.push([l['SCIENTIFIC NAME'], l.ORDER, l['ENGLISH NAME: AVILIST']]);
  if(l.RANK === 'genus') avGenre.set(sci, [l.FAMILY, l.ORDER]);
  if(l.RANK === 'species') avEsp.set(sci, [l.FAMILY, l.ORDER]);
}
console.log('AviList : ordres', avOrdres.length, '; familles', avFamilles.length, '; genres', avGenre.size, '; especes', avEsp.size);

// Chaque espece du site -> famille AviList
const parExact = [], parGenre = [], introuvables = [];
const intituleVersAv = new Map();   // intitule du site -> Map(famille AviList -> nb especes)
const avVersIntitule = new Map();
const ordreDiff = new Map();
for(const sci of Object.keys(FR_NAMES)){
  let av = avEsp.get(sci);
  if(av) parExact.push(sci);
  else { av = avGenre.get(sci.split(' ')[0]); if(av) parGenre.push(sci); else { introuvables.push(sci); continue; } }
  const fam = familyOf(sci);
  if(!intituleVersAv.has(fam)) intituleVersAv.set(fam, new Map());
  intituleVersAv.get(fam).set(av[0], (intituleVersAv.get(fam).get(av[0]) || 0) + 1);
  if(!avVersIntitule.has(av[0])) avVersIntitule.set(av[0], new Map());
  avVersIntitule.get(av[0]).set(fam, (avVersIntitule.get(av[0]).get(fam) || 0) + 1);
  const ordreSite = (INFO[fam] || [])[2];
  if(ordreSite && ordreSite !== av[1]){ const k = fam + ' : ' + ordreSite + ' -> ' + av[1]; ordreDiff.set(k, (ordreDiff.get(k) || 0) + 1); }
}
console.log('\nEspeces du site :', Object.keys(FR_NAMES).length, '; nom exact dans AviList', parExact.length, '; par le genre seulement', parGenre.length, '; introuvables', introuvables.length);
console.log('Introuvables :', introuvables.map(s => s + ' (' + FR_NAMES[s] + ')').join(' | '));

console.log('\n== Intitules du site qui couvrent plusieurs familles AviList');
for(const [fam, m] of intituleVersAv) if(m.size > 1) console.log(' -', fam, ':', [...m].map(([f, n]) => f + ' ' + n).join(', '));
console.log('\n== Familles AviList partagees entre plusieurs intitules du site');
for(const [av, m] of avVersIntitule) if(m.size > 1) console.log(' -', av, ':', [...m].map(([f, n]) => f + ' ' + n).join(', '));
console.log('\n== Ordre different (intitule : ordre du site -> ordre AviList, nb especes)');
for(const [k, n] of ordreDiff) console.log(' -', k, n);
console.log('\n== Familles AviList sans espece du site :', avFamilles.filter(f => !avVersIntitule.has(f[0])).map(f => f[0]).join(', ') || '-');
const ordresSite = new Set(FAMILLES_EBIRD.map(f => f[2]));
console.log('== Ordres AviList absents du site :', avOrdres.filter(o => !ordresSite.has(o)).join(', ') || '-');
console.log('== Ordres du site absents d\'AviList :', [...ordresSite].filter(o => !avOrdres.includes(o)).join(', ') || '-');

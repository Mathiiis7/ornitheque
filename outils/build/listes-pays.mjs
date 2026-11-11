// Nombre de listes eBird de chaque pays, mois par mois (2026-11-11). Deux usages, choisis par Mathis le meme jour
// devant la Libye (65 listes en huit ans, une espece y paraissait commune) :
//   - la fiche previent quand un pays a peu de listes : ses pourcentages sont fragiles ;
//   - la rarete d'un continent et du monde allege un pays peu observe (_rareteEtendue).
// Source : la ligne « Sample Size » du bar chart national (outils/ebird-barcharts-raw/ebird-barchart-XX-2019-2026.txt),
// 48 quinzaines = 4 par mois, 2019-2026, comme outils/build/listes-par-zone.mjs pour les zones.
// Sortie : data/listes-pays.json = { CC: [listes de janvier, ..., de decembre] }. Un pays sans bar chart n'est pas
// ecrit : on ne sait pas, rien n'est allege.
// Usage : node outils/build/listes-pays.mjs
import fs from 'node:fs';

const RAW = 'outils/ebird-barcharts-raw/';
const sortie = {};
for(const f of fs.readdirSync(RAW).sort()){
  const m = f.match(/^ebird-barchart-([A-Z]{2})-2019-2026\.txt$/);
  if(!m) continue;
  const ligne = fs.readFileSync(RAW + f, 'utf8').split(/\r?\n/).find(l => l.startsWith('Sample Size'));
  if(!ligne) continue;
  const q = ligne.split('\t').slice(1, 49).map(v => +v || 0);
  if(q.length < 48) continue;
  sortie[m[1]] = Array.from({ length: 12 }, (_, i) => Math.round(q[4 * i] + q[4 * i + 1] + q[4 * i + 2] + q[4 * i + 3]));
}
fs.writeFileSync('data/listes-pays.json', JSON.stringify(sortie));
const tot = Object.entries(sortie).map(([cc, l]) => [cc, l.reduce((a, b) => a + b, 0)]).sort((a, b) => a[1] - b[1]);
console.log(Object.keys(sortie).length, 'pays ;', tot.filter(x => x[1] < 1000).length, 'sous 1 000 listes');
console.log('les moins observes :', tot.slice(0, 25).map(x => x[0] + ' ' + x[1]).join(', '));
for(const cc of ['FR', 'LY', 'CN', 'US', 'KE']) console.log(cc, tot.find(x => x[0] === cc)?.[1] ?? 'absent');

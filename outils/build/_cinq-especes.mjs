// Les 5 especes du site introuvables dans AviList v2026 : leur nom actuel chez AviList
// (meme epithete, ou meme nom anglais Clements), et ce que le site en sait deja.
import fs from 'node:fs';
import XLSX from 'xlsx';
const CINQ = ['brachycope anomala', 'humblotia flavirostris', 'oressochen jubatus', 'oressochen melanopterus', 'thryorchilus browni'];
const wb = XLSX.readFile('notes-privees/arbre/avilist/AviList-v2026-extended.xlsx');
const lignes = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' }).filter(l => l.RANK === 'species');
for(const sci of CINQ){
  const ep = sci.split(' ')[1].slice(0, 6);
  const cand = lignes.filter(l => l['SCIENTIFIC NAME'].toLowerCase().split(' ')[1]?.startsWith(ep));
  console.log('==', sci);
  for(const l of cand) console.log('   ', l['SCIENTIFIC NAME'], '|', l.FAMILY, '|', l['ENGLISH NAME: AVILIST'], '| Clements :', l['ENGLISH NAME: CLEMENTS v2026'], '|', (l['v2026 CHANGES'] || '').slice(0, 80));
}
const app = fs.readFileSync('app.js', 'utf8');
for(const sci of CINQ){
  const g = sci.split(' ')[0];
  const occ = [...app.matchAll(new RegExp(g + '[ _]', 'gi'))].map(m => m.index);
  const lignesApp = [...new Set(occ.map(i => app.slice(0, i).split('\n').length))];
  console.log(sci, ': lignes d\'app.js', lignesApp.join(', '));
}

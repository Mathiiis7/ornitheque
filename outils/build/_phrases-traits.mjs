// Extrait des articles téléchargés les phrases qui parlent de parenté ou de traits partagés (sister,
// share, unlike, distinguish, synapomorphy…), pour trouver le trait d'un embranchement sans tout relire.
// Usage : node outils/build/_phrases-traits.mjs <dossier> <sortie.md>
import fs from 'node:fs';
const [dossier, sortie] = process.argv.slice(2);
const MOTS = /\b(sister|share[sd]?|sharing|unlike|distinguish\w*|differ\w*|synapomorph\w*|apomorph\w*|unique\w*|character\w*|uniting|united|unite[sd]?|closest|related to|grouped|clade|lack\w*|both)\b/i;
const out = [];
for(const f of fs.readdirSync(dossier).sort()){
  const t = fs.readFileSync(`${dossier}/${f}`, 'utf8');
  const url = t.split('\n')[0];
  const phrases = t.slice(url.length).replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z])/);
  const gardes = phrases.filter(p => MOTS.test(p) && p.length < 600);
  out.push(`## ${f.replace('.en.txt', '')}  ${url}`, '', ...gardes.map(p => '- ' + p), '');
}
fs.writeFileSync(sortie, out.join('\n'));
console.log(out.length, 'lignes');

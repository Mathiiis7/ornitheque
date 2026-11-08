// Met dans l'index git seulement certains morceaux (hunks) d'un fichier, quand deux conversations
// travaillent dans le meme dossier (CLAUDE.md : « git apply --cached d'un diff filtre, AVEC son
// contexte »). Usage :
//   node outils/build/_indexer-partiel.mjs <fichier> lignes <min> <max>   garde les morceaux dont la
//        ligne de depart (ancienne version) est entre min et max
//   node outils/build/_indexer-partiel.mjs <fichier> contient <texte>      garde les morceaux qui
//        ajoutent ou retirent une ligne contenant ce texte
// Imprime les morceaux gardes et ecartes. Lancer depuis la racine.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const [fichier, mode, a, b] = process.argv.slice(2);
const diff = execFileSync('git', ['diff', '-U3', '--', fichier], { encoding: 'utf8', maxBuffer: 1 << 28 });
const nl = diff.includes('\r\n') ? '\r\n' : '\n';
const lignes = diff.split(/\n/);
const tete = [], morceaux = [];
let cur = null;
for(const l of lignes){
  if(l.startsWith('@@')){ cur = [l]; morceaux.push(cur); }
  else if(cur) cur.push(l);
  else tete.push(l);
}
const garde = m => {
  if(mode === 'lignes'){ const d = +m[0].match(/^@@ -(\d+)/)[1]; return d >= +a && d <= +b; }
  if(mode === 'contient') return m.slice(1).some(l => (l.startsWith('+') || l.startsWith('-')) && l.includes(a));
  throw new Error('mode inconnu');
};
const gardes = morceaux.filter(garde);
for(const m of morceaux) console.log(gardes.includes(m) ? 'GARDE ' : 'ECARTE', m[0].slice(0, 90));
if(!gardes.length){ console.log('rien a indexer'); process.exit(0); }
// Le dernier morceau garde ne doit pas emporter la ligne vide de fin de sortie de git diff
const texte = [...tete, ...gardes.flat()].join('\n').replace(/\n*$/, '\n');
const tmp = 'outils/build/.partiel.diff';
fs.writeFileSync(tmp, texte);
execFileSync('git', ['apply', '--cached', '--whitespace=nowarn', tmp], { stdio: 'inherit' });
fs.unlinkSync(tmp);
console.log('indexe :', gardes.length, 'morceau(x) sur', morceaux.length);

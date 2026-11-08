// Vérifie l'espèce choisie pour représenter chaque ordre dans l'Arbre phylogénétique (ARBRE_PHOTOS dans
// app.js, photo à la place de la silhouette, « la plus connue » de chaque ordre, Mathis le 2026-11-08).
// Contrôle : l'espèce existe dans FR_NAMES et son genre appartient bien à une famille de cet ordre
// (data/arbre.json, genres d'AviList). Lancer depuis la racine.
import fs from 'node:fs';
const app = fs.readFileSync('app.js', 'utf8');
const FR = JSON.parse(app.match(/^const FR_NAMES = (\{.*\});?\s*$/m)[1]);
const bloc = app.match(/^const ARBRE_PHOTOS = \{([\s\S]*?)\n\};/m)[1];
const PHOTOS = Object.fromEntries([...bloc.matchAll(/(\w+):'([^']+)'/g)].map(m => [m[1], m[2]]));
const D = JSON.parse(fs.readFileSync('data/arbre.json', 'utf8'));
let ok = 0;
for(const o of D.ordres){
  const sci = PHOTOS[o.lat];
  if(!sci){ console.log('MANQUE', o.lat); continue; }
  const genre = sci.split(' ')[0];
  const fam = o.familles.find(f => f.genres.some(g => g.toLowerCase() === genre));
  if(!FR[sci]) console.log('ABSENT de FR_NAMES', o.lat, sci);
  else if(!fam) console.log('GENRE HORS ORDRE', o.lat, sci);
  else { ok++; console.log(o.courant.padEnd(36), FR[sci].padEnd(30), sci); }
}
console.log(ok, 'sur', D.ordres.length);

// Liste les embranchements ENTRE FAMILLES d'un même ordre (arbres de Stiller 2024 dans data/arbre.json),
// pour leur chercher un trait (demande de Mathis, 2026-11-08). Chaque nœud reçoit un identifiant stable :
// l'ordre, puis le chemin depuis la racine de l'ordre (« Charadriiformes/0.1.0 »), et la liste des
// familles des deux côtés. Écrit notes-privees/arbre/noeuds-familles.json et .md. Lancer depuis la racine.
import fs from 'node:fs';
const D = JSON.parse(fs.readFileSync('data/arbre.json', 'utf8'));
const noeuds = [];
const famDe = (o, n) => n.f != null ? [o.familles[n.f]] : n.e.flatMap(c => famDe(o, c));
function parcourt(o, n, chemin){
  if(n.f != null) return;
  // Les familles « place non publiée » (np) pendent à la racine de l'ordre : elles ne font pas un nœud de l'étude
  const enf = n.e.filter(c => !c.np);
  if(enf.length >= 2){
    noeuds.push({
      id: o.lat + '/' + (chemin || 'r'), ordre: o.lat, ordreFr: o.courant,
      cotes: enf.map(c => famDe(o, c).map(f => ({ lat: f.lat, fr: f.courant }))),
    });
  }
  n.e.forEach((c, i) => parcourt(o, c, chemin ? chemin + '.' + i : String(i)));
}
for(const o of D.ordres) if(o.familles.length > 1 && o.arbre) parcourt(o, o.arbre, '');
fs.writeFileSync('notes-privees/arbre/noeuds-familles.json', JSON.stringify(noeuds, null, 1));
const md = ['# Embranchements entre familles (' + noeuds.length + ')', ''];
let ord = '';
for(const n of noeuds){
  if(n.ordre !== ord){ ord = n.ordre; md.push('', '## ' + n.ordreFr + ' (' + n.ordre + ')', ''); }
  md.push('- `' + n.id + '` : ' + n.cotes.map(c => c.map(f => f.lat).join(' + ')).join('  |  '));
}
fs.writeFileSync('notes-privees/arbre/noeuds-familles.md', md.join('\n') + '\n');
console.log(noeuds.length, 'nœuds');

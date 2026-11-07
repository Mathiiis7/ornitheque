// La suite lineaire des ordres d'eBird/AviList est-elle compatible avec l'arbre de Stiller 2024 ?
// Une suite lineaire tiree d'un arbre met chaque branche d'un seul bloc : pour chaque noeud de
// l'arbre (reduit aux ordres), ses ordres doivent etre consecutifs dans la suite eBird.
// On essaie toutes les racines possibles (63K.tre n'est pas enracine sur la base des oiseaux)
// et on garde la meilleure. Lancer depuis la racine : node outils/build/_ordre-vs-arbre.mjs
import fs from 'node:fs';
const app = fs.readFileSync('app.js', 'utf8');
function lire(nom){
  const t = 'const ' + nom + ' = ';
  const d = app.indexOf(t) + t.length;
  return new Function('return (' + app.slice(d, app.slice(d).search(/;\r?\n/) + d) + ')')();
}
const GENUS_FAMILY = lire('GENUS_FAMILY'), FAMILY_EN_TO_FR = lire('FAMILY_EN_TO_FR'), FAMILLES_EBIRD = lire('FAMILLES_EBIRD');
const INFO = Object.fromEntries(FAMILLES_EBIRD.map(f => [f[0], f]));
const RENOMMES = { rhadina:'phylloscopus', brachypodius:'pycnonotus', sinosuthora:'suthora', ciccaba:'strix', atlantisia:'laterallus', alopecoenas:'pampusana', corythaixoides:'crinifer' };
const ordreDe = nom => { let g = nom.split('_')[0].toLowerCase(); g = RENOMMES[g] || g; const raw = GENUS_FAMILY[g]; const f = FAMILY_EN_TO_FR[raw] || raw; return INFO[f][2]; };
const suite = [...new Set(FAMILLES_EBIRD.map(f => f[2]))];
const rang = Object.fromEntries(suite.map((o, i) => [o, i]));

// Newick -> graphe non oriente de noeuds, feuilles portant leur ordre.
const s = fs.readFileSync('notes-privees/arbre/source/63K.tre', 'utf8').trim();
let i = 0; const voisins = []; const ordre = [];
function noeud(){
  const id = voisins.length; voisins.push([]); ordre.push(null);
  if(s[i] === '('){
    i++;
    const enf = [noeud()]; while(s[i] === ','){ i++; enf.push(noeud()); } i++;
    for(const e of enf){ voisins[id].push(e); voisins[e].push(id); }
  }
  let nom = ''; while(i < s.length && !',():;'.includes(s[i])) nom += s[i++];
  if(s[i] === ':'){ i++; while(i < s.length && !',();'.includes(s[i])) i++; }
  if(voisins[id].length === 0) ordre[id] = ordreDe(nom.trim());
  return id;
}
noeud();

// Pour une racine donnee (une arete), compter les branches dont les ordres ne sont pas consecutifs.
function evaluer(racine, interdit){
  const fautes = [];
  function bas(n, parent){
    if(ordre[n]) return new Set([ordre[n]]);
    const ens = new Set();
    for(const v of voisins[n]) if(v !== parent && v !== interdit) for(const o of bas(v, n)) ens.add(o);
    const r = [...ens].map(o => rang[o]).sort((a, b) => a - b);
    if(ens.size > 1 && r[r.length - 1] - r[0] + 1 !== r.length) fautes.push([...ens].sort((a, b) => rang[a] - rang[b]));
    return ens;
  }
  bas(racine, -1);
  return fautes;
}
// Racine placee entre les Paleognathes (Struthioniformes) et le reste : on cherche l'arete
// dont un cote ne contient que les 5 ordres de Paleognathes.
const PALEO = new Set(['Struthioniformes','Casuariiformes','Apterygiformes','Rheiformes','Tinamiformes']);
let meilleur = null;
for(let a = 0; a < voisins.length; a++) for(const b of voisins[a]){
  const cote = new Set();
  (function tous(n, p){ if(ordre[n]) cote.add(ordre[n]); for(const v of voisins[n]) if(v !== p) tous(v, n); })(a, b);
  if(cote.size === PALEO.size && [...cote].every(o => PALEO.has(o))){
    // Racine virtuelle : on evalue chaque cote separement.
    const f = [...evaluer(a, b), ...evaluer(b, a)];
    if(!meilleur || f.length < meilleur.length) meilleur = f;
  }
}
// Les fautes se repetent de bas en haut (un bloc fautif rend fautifs ses parents) : on garde
// les plus petites, celles qui ne contiennent aucune autre faute.
const minimales = meilleur.filter(f => !meilleur.some(g => g !== f && g.length < f.length && g.every(o => f.includes(o))));
console.log('Branches de l\'arbre dont les ordres ne se suivent pas dans la suite eBird :', meilleur.length);
console.log('Les plus petites (le noeud du desaccord) :');
for(const f of minimales) console.log(' -', f.join(', '));

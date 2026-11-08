// Reduit l'arbre principal de Stiller et al. 2024 (63K.tre, 363 oiseaux) aux 45 ordres AviList.
// Chaque ordre est d'un seul tenant dans l'arbre (verifie par _ordre-vs-arbre.mjs) : on remplace
// chaque branche qui ne contient qu'un ordre par une feuille. Racine : entre les Paleognathes et
// le reste. Les enfants sont ranges comme AviList (le plus petit clade d'abord, puis l'ordre AviList).
// Le support de chaque noeud (probabilite a posteriori locale d'ASTRAL, le nombre avant « : ») est
// garde : sous 0,95, le noeud est montre comme discute.
// Sortie : notes-privees/maquettes/arbre/cladogramme.json. Lancer depuis la racine.
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
const ordreDe = nom => { let g = nom.split('_')[0].toLowerCase(); g = RENOMMES[g] || g; const raw = GENUS_FAMILY[g]; return INFO[FAMILY_EN_TO_FR[raw] || raw][2]; };
// Ordre AviList des 45 ordres (tire des donnees des maquettes, deja dans l'ordre AviList)
const donnees = JSON.parse(fs.readFileSync('notes-privees/maquettes/arbre/donnees.json', 'utf8'));
const RANG = Object.fromEntries(donnees.map((o, i) => [o.lat, i]));
const NOMS = Object.fromEntries(donnees.map(o => [o.lat, { savant: o.savant, courant: o.courant, n: o.n }]));

// Newick -> graphe non oriente ; support sur l'arete vers le parent
const s = fs.readFileSync('notes-privees/arbre/source/63K.tre', 'utf8').trim();
let i = 0; const voisins = [], ordre = [], support = [];
function noeud(){
  const id = voisins.length; voisins.push([]); ordre.push(null); support.push(null);
  if(s[i] === '('){
    i++;
    const enf = [noeud()]; while(s[i] === ','){ i++; enf.push(noeud()); } i++;
    for(const e of enf){ voisins[id].push(e); voisins[e].push(id); }
  }
  let nom = ''; while(i < s.length && !',():;'.includes(s[i])) nom += s[i++];
  if(s[i] === ':'){ i++; while(i < s.length && !',();'.includes(s[i])) i++; }
  if(voisins[id].length === 0) ordre[id] = ordreDe(nom.trim());
  else if(nom.trim()) support[id] = parseFloat(nom);
  return id;
}
noeud();

// Arete racine : un cote ne contient que les Paleognathes
const PALEO = new Set(['Struthioniformes','Casuariiformes','Apterygiformes','Rheiformes','Tinamiformes']);
const cote = (a, b) => { const e = new Set(); (function t(n, p){ if(ordre[n]) e.add(ordre[n]); for(const v of voisins[n]) if(v !== p) t(v, n); })(a, b); return e; };
let racine = null;
for(let a = 0; a < voisins.length && !racine; a++) for(const b of voisins[a]){
  const c = cote(a, b);
  if(c.size === PALEO.size && [...c].every(o => PALEO.has(o))){ racine = [a, b]; break; }
}
// Construit l'arbre oriente a partir de n (venant de p), en fusionnant les branches d'un seul ordre.
// Le support d'un noeud est celui de l'arete qui le relie a son parent : avec la racine deplacee,
// il est porte par le noeud enfant dans le Newick, ou par le parent quand on remonte l'arete a l'envers.
function construire(n, p){
  const ords = cote(n, p);
  if(ords.size === 1) return { ordre: [...ords][0] };
  let enfants = voisins[n].filter(v => v !== p).map(v => construire(v, n));
  // Un noeud a un seul enfant (degre 2) se saute
  if(enfants.length === 1) return enfants[0];
  // Fusion des enfants identiques (deux branches du meme ordre ne peuvent pas arriver : ordres d'un seul tenant)
  const sup = support[n] != null && voisins[n].indexOf(p) === 0 ? null : support[n];
  return { enfants, support: sup };
}
function supportArete(a, b){ return support[a] ?? support[b]; }
const arbre = { enfants: [construire(racine[0], racine[1]), construire(racine[1], racine[0])], support: null, racine: true };

// Rang et taille, puis tri des enfants comme AviList
function feuilles(n){ return n.ordre ? [n.ordre] : n.enfants.flatMap(feuilles); }
function trier(n){
  if(n.ordre) return;
  n.enfants.forEach(trier);
  n.enfants.sort((a, b) => Math.min(...feuilles(a).map(o => RANG[o])) - Math.min(...feuilles(b).map(o => RANG[o])));
}
trier(arbre);
// Les noeuds aplatis (plus de deux enfants) viennent de la reduction : un noeud binaire de
// l'etude dont un cote ne contenait qu'un ordre a ete garde, les autres non. On le signale.
let id = 0;
function nommer(n){
  if(n.ordre){ Object.assign(n, NOMS[n.ordre]); return; }
  n.id = 'n' + (id++);
  n.ordres = feuilles(n);
  n.enfants.forEach(nommer);
}
nommer(arbre);
const suite = feuilles(arbre);
const ecarts = suite.filter((o, k) => RANG[o] !== k);
fs.writeFileSync('notes-privees/maquettes/arbre/cladogramme.json', JSON.stringify(arbre));
console.log('feuilles :', suite.length, '; noeuds internes :', id);
console.log('ordre des feuilles :', suite.join(', '));
console.log('feuilles hors de l\'ordre AviList :', ecarts.length);
function afficher(n, pre){
  if(n.ordre){ console.log(pre + n.ordre); return; }
  console.log(pre + '+ ' + n.id + (n.support != null ? ' (support ' + n.support + ')' : '') + ' [' + n.enfants.length + ' branches]');
  n.enfants.forEach(e => afficher(e, pre + '  '));
}
afficher(arbre, '');

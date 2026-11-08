// Pour chaque ordre a plusieurs familles, l'arbre de ses familles d'apres l'arbre principal de
// Stiller et al. 2024 (63K.tre). Meme racine que le cladogramme des ordres (entre les
// Paleognathes et le reste) ; chaque branche qui ne contient qu'une famille devient une feuille.
// Les familles absentes de l'etude (26 sur 250) seront accrochees a la racine de leur ordre,
// en rateau, par arbre-donnees.mjs. Une famille coupee en deux par l'arbre est signalee.
// Sortie : notes-privees/maquettes/arbre/familles-arbres.json. Lancer depuis la racine.
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
const D = JSON.parse(fs.readFileSync('data/arbre.json', 'utf8'));
// intitule du site -> famille latine AviList, par ordre (data/arbre.json)
const latDe = {}, rang = {};
D.ordres.forEach(o => o.familles.forEach((f, i) => { latDe[f.courant] = f.lat; rang[f.lat] = i; }));
const feuilleInfo = nom => {
  let g = nom.split('_')[0].toLowerCase(); g = RENOMMES[g] || g;
  const raw = GENUS_FAMILY[g]; const fr = FAMILY_EN_TO_FR[raw] || raw;
  return { ordre: INFO[fr][2], fam: latDe[fr] };
};

const s = fs.readFileSync('notes-privees/arbre/source/63K.tre', 'utf8').trim();
let i = 0; const voisins = [], feuille = [];
function noeud(){
  const id = voisins.length; voisins.push([]); feuille.push(null);
  if(s[i] === '('){
    i++;
    const enf = [noeud()]; while(s[i] === ','){ i++; enf.push(noeud()); } i++;
    for(const e of enf){ voisins[id].push(e); voisins[e].push(id); }
  }
  let nom = ''; while(i < s.length && !',():;'.includes(s[i])) nom += s[i++];
  if(s[i] === ':'){ i++; while(i < s.length && !',();'.includes(s[i])) i++; }
  if(voisins[id].length === 0) feuille[id] = feuilleInfo(nom.trim());
  return id;
}
noeud();
const PALEO = new Set(['Struthioniformes','Casuariiformes','Apterygiformes','Rheiformes','Tinamiformes']);
const cote = (a, b, cle) => { const e = new Set(); (function t(n, p){ if(feuille[n]) e.add(feuille[n][cle]); for(const v of voisins[n]) if(v !== p) t(v, n); })(a, b); return e; };
let racine = null;
for(let a = 0; a < voisins.length && !racine; a++) for(const b of voisins[a]){
  const c = cote(a, b, 'ordre');
  if(c.size === PALEO.size && [...c].every(o => PALEO.has(o))){ racine = [a, b]; break; }
}
// Arbre oriente
function oriente(n, p){ return feuille[n] ? { f: feuille[n] } : { e: voisins[n].filter(v => v !== p).map(v => oriente(v, n)) }; }
const arbre = { e: [oriente(racine[0], racine[1]), oriente(racine[1], racine[0])] };
const ordresDe = n => n.f ? new Set([n.f.ordre]) : new Set(n.e.flatMap(x => [...ordresDe(x)]));
const famsDe = n => n.f ? [n.f.fam] : n.e.flatMap(famsDe);
// Le noeud de chaque ordre : le plus petit noeud qui contient toutes ses feuilles et rien d'autre
const noeudOrdre = {};
(function cherche(n){ const o = ordresDe(n); if(o.size === 1){ noeudOrdre[[...o][0]] = n; return; } n.e.forEach(cherche); })(arbre);
const coupees = [];
function reduit(n){
  const fs_ = new Set(famsDe(n));
  if(fs_.size === 1) return { f: [...fs_][0] };
  let e = n.e.map(reduit);
  // Deux enfants de la meme famille seule : la famille est coupee par l'arbre
  return { e };
}
function trie(n){ if(n.f) return; n.e.forEach(trie); n.e.sort((a, b) => Math.min(...famsDe2(a).map(f => rang[f])) - Math.min(...famsDe2(b).map(f => rang[f]))); }
const famsDe2 = n => n.f ? [n.f] : n.e.flatMap(famsDe2);
const sortie = {};
for(const o of D.ordres){
  if(o.familles.length < 2) continue;
  const n = noeudOrdre[o.lat];
  if(!n){ console.log(o.lat, ': absent de l\'etude'); continue; }
  const t = reduit(n);
  const vus = famsDe2(t), doublons = vus.filter((f, k) => vus.indexOf(f) !== k);
  if(doublons.length) coupees.push(o.lat + ' : ' + [...new Set(doublons)].join(', '));
  trie(t);
  sortie[o.lat] = t;
  const absentes = o.familles.map(f => f.lat).filter(f => !vus.includes(f));
  console.log(o.lat.padEnd(20), o.familles.length, 'familles ;', new Set(vus).size, 'dans l\'arbre ;', absentes.length, 'absentes', absentes.length ? '(' + absentes.join(', ') + ')' : '');
}
console.log('familles coupees en deux par l\'arbre :', coupees.join(' | ') || '-');
fs.writeFileSync('notes-privees/maquettes/arbre/familles-arbres.json', JSON.stringify(sortie));

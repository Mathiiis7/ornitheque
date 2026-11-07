// Raccorde l'arbre principal de Stiller et al. 2024 (Nature, doi:10.1038/s41586-024-07323-1,
// fichier 63K.tre de l'entrepot doi:10.17894/ucph.85624f66-c8e5-4b89-8e8a-fe984ca89e4a)
// aux 250 familles du site (FAMILLES_EBIRD dans app.js).
// Imprime : les feuilles raccordees a une famille, les feuilles sans famille, les familles du
// site absentes de l'arbre, et les familles dont les feuilles ne forment pas une branche unique
// (decoupage different entre l'etude et eBird).
// Lancer depuis la racine : node outils/build/arbre-correspondance.mjs
import fs from 'node:fs';

const app = fs.readFileSync('app.js', 'utf8');
// Les tables sont du JavaScript (guillemets simples, plusieurs lignes) : on evalue le litteral,
// de « = » jusqu'au premier « ; » en fin de ligne.
function lire(nom){
  const debut = app.indexOf('const ' + nom + ' = ') + ('const ' + nom + ' = ').length;
  const fin = app.slice(debut).search(/;\r?\n/) + debut;
  return new Function('return (' + app.slice(debut, fin) + ')')();
}
const GENUS_FAMILY = lire('GENUS_FAMILY');
const FAMILY_EN_TO_FR = lire('FAMILY_EN_TO_FR');
const FAMILLES_EBIRD = lire('FAMILLES_EBIRD');
// L'etude nomme sept oiseaux avec un genre que la taxonomie eBird du site n'emploie plus.
// Chaque cible est un genre deja connu du site, de la meme famille que l'etude lui donne.
const GENRE_ETUDE_VERS_SITE = {
  rhadina: 'phylloscopus',   // Pouillot siffleur
  brachypodius: 'pycnonotus',// Bulbul a tete noire
  sinosuthora: 'suthora',    // Paradoxornis de Webb
  ciccaba: 'strix',          // Chouette a lignes noires
  atlantisia: 'laterallus',  // Rale atlantis
  alopecoenas: 'pampusana',  // Gallicolombe de Beccari
  corythaixoides: 'crinifer',// Touraco concolore
};
const familleDe = g => { g = g.toLowerCase(); g = GENRE_ETUDE_VERS_SITE[g] || g; const raw = GENUS_FAMILY[g]; return raw ? (FAMILY_EN_TO_FR[raw] || raw) : null; };

// Lecture Newick minimale : noeuds { nom, enfants[] }, longueurs et supports ignores ici.
function lireNewick(s){
  let i = 0;
  function noeud(){
    const n = { enfants: [] };
    if(s[i] === '('){
      i++;
      n.enfants.push(noeud());
      while(s[i] === ','){ i++; n.enfants.push(noeud()); }
      i++; // ')'
    }
    let nom = '';
    while(i < s.length && !',():;'.includes(s[i])) nom += s[i++];
    n.nom = nom.trim();
    if(s[i] === ':'){ i++; while(i < s.length && !',();'.includes(s[i])) i++; }
    return n;
  }
  return noeud();
}

const racine = lireNewick(fs.readFileSync('notes-privees/arbre/source/63K.tre', 'utf8').trim());
const feuilles = [];
(function parcours(n){ if(!n.enfants.length) feuilles.push(n); else n.enfants.forEach(parcours); })(racine);

const parFamille = new Map();
const sansFamille = [];
for(const f of feuilles){
  const fam = familleDe(f.nom.split('_')[0]);
  f.fam = fam;
  if(!fam) sansFamille.push(f.nom);
  else { if(!parFamille.has(fam)) parFamille.set(fam, []); parFamille.get(fam).push(f.nom); }
}

// Une famille est « d'un seul tenant » si un noeud contient toutes ses feuilles et aucune autre.
// L'arbre de 63K.tre n'est pas enracine sur l'oiseau ancestral : on teste aussi le complement.
function feuillesSous(n){ return n.enfants.length ? n.enfants.flatMap(feuillesSous) : [n]; }
const ensembles = [];
(function tous(n){ ensembles.push(new Set(feuillesSous(n).map(x => x.nom))); n.enfants.forEach(tous); })(racine);
const total = feuilles.length;
function dUnSeulTenant(noms){
  if(noms.length === 1) return true;
  const cible = new Set(noms);
  return ensembles.some(e => (e.size === cible.size && noms.every(x => e.has(x)))
    || (total - e.size === cible.size && noms.every(x => !e.has(x))));
}

// Meme test pour les 45 ordres du site.
const INFO = Object.fromEntries(FAMILLES_EBIRD.map(f => [f[0], f]));
const parOrdre = new Map();
for(const f of feuilles){ const o = (INFO[f.fam] || [])[2] || '?'; if(!parOrdre.has(o)) parOrdre.set(o, []); parOrdre.get(o).push(f.nom); }
const ordresCoupes = [...parOrdre].filter(([, noms]) => !dUnSeulTenant(noms));
console.log('Ordres du site presents dans l\'arbre :', parOrdre.size, '; coupes en plusieurs branches :', ordresCoupes.length);
for(const [o, noms] of ordresCoupes) console.log(' -', o, ':', noms.length, 'feuilles');

const absentes = FAMILLES_EBIRD.filter(f => !parFamille.has(f[0]));
const coupees = [...parFamille].filter(([, noms]) => !dUnSeulTenant(noms));

console.log('Feuilles de l\'arbre :', total);
console.log('Raccordees a une famille du site :', total - sansFamille.length);
console.log('Familles du site presentes dans l\'arbre :', parFamille.size, '/', FAMILLES_EBIRD.length);
console.log('\nFeuilles sans famille (' + sansFamille.length + ') :', sansFamille.join(', ') || '-');
console.log('\nFamilles coupees en plusieurs branches (' + coupees.length + ') :');
for(const [f, noms] of coupees) console.log(' -', f, ':', noms.join(', '));
console.log('\nFamilles du site absentes de l\'arbre (' + absentes.length + ') :');
console.log(absentes.map(f => f[1] + ' (' + f[0] + ', ' + f[2] + ')').join('\n'));

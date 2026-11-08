// Fabrique les donnees de l'arbre « comme AviList » : ordres -> familles -> genres -> especes,
// dans l'ordre d'AviList v2026, avec les especes et les noms francais du site.
// Une espece du site se place par son nom latin exact dans AviList, sinon par l'alias eBird 2026
// (SCI_ALIAS, dans l'autre sens), sinon par son genre.
// Sortie : notes-privees/maquettes/arbre/donnees.json (pour les maquettes).
// Lancer depuis la racine : node outils/build/_arbre-donnees.mjs
import fs from 'node:fs';
import XLSX from 'xlsx';
const app = fs.readFileSync('app.js', 'utf8');
function lire(nom){
  const t = 'const ' + nom + ' = ';
  const d = app.indexOf(t) + t.length;
  if(d < t.length) throw new Error('table introuvable : ' + nom);
  return new Function('return (' + app.slice(d, app.slice(d).search(/;\r?\n/) + d) + ')')();
}
const FR_NAMES = lire('FR_NAMES'), GENUS_FAMILY = lire('GENUS_FAMILY'), FAMILY_EN_TO_FR = lire('FAMILY_EN_TO_FR'), FAMILLES_EBIRD = lire('FAMILLES_EBIRD');
// SCI_ALIAS est sur plusieurs lignes avec des commentaires : on prend le bloc jusqu'a « }; »
const dA = app.indexOf('const SCI_ALIAS = ');
const SCI_ALIAS = new Function('return ' + app.slice(app.indexOf('{', dA), app.indexOf('};', dA) + 1))();
const familyOf = sci => { const raw = GENUS_FAMILY[sci.split(' ')[0]] || 'Autres'; return FAMILY_EN_TO_FR[raw] || raw; };
const INFO = Object.fromEntries(FAMILLES_EBIRD.map(f => [f[0], f]));

// Noms des ordres valides par Mathis
const noms = {};
for(const l of fs.readFileSync('notes-privees/arbre/NOMS-VALIDES.md', 'utf8').split(/\r?\n/)){
  const m = l.match(/^\| ([A-ZÀ-ÿŒÆ][^|]*?) \| ([^|]+?) \|/);
  if(m && !/Nom savant/.test(m[1])) noms[m[1].trim()] = m[2].trim();
}
// Nom savant francais d'un ordre : on retrouve la ligne du fichier dont le nom, sans accents, egale le latin
const sansAcc = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae').replace(/Œ/g, 'Oe').replace(/Æ/g, 'Ae');
const savantFr = lat => Object.keys(noms).find(k => sansAcc(k).toLowerCase() === lat.toLowerCase()) || lat;

const wb = XLSX.readFile('notes-privees/arbre/avilist/AviList-v2026-extended.xlsx');
const lignes = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
const rangEsp = new Map(), genreInfo = new Map(), ordres = [], familles = new Map();
for(const l of lignes){
  const sci = l['SCIENTIFIC NAME'].trim();
  if(l.RANK === 'order') ordres.push({ lat: sci, familles: [] });
  else if(l.RANK === 'family'){ const f = { lat: sci, en: l['ENGLISH NAME: AVILIST'], genres: [], rang: l['#'] }; familles.set(sci, f); ordres[ordres.length - 1].familles.push(f); }
  else if(l.RANK === 'genus'){ const g = { lat: sci, especes: [], rang: l['#'] }; genreInfo.set(sci.toLowerCase(), { g, fam: l.FAMILY }); familles.get(l.FAMILY).genres.push(g); }
  else if(l.RANK === 'species') rangEsp.set(sci.toLowerCase(), { rang: l['#'], genre: sci.split(' ')[0].toLowerCase() });
}
const aliasInverse = Object.fromEntries(Object.entries(SCI_ALIAS).map(([nouveau, ancien]) => [ancien, nouveau]));
// Les deux ouettes : eBird dit encore Oressochen (08/11), AviList Neochen et Chloephaga (en-cours.md)
aliasInverse['oressochen jubatus'] ??= 'neochen jubata';
aliasInverse['oressochen melanopterus'] ??= 'chloephaga melanoptera';
let exact = 0, alias = 0, genre = 0, perdues = [];
const intitule = new Map();   // famille AviList -> intitule du site
for(const sci of Object.keys(FR_NAMES)){
  let r = rangEsp.get(sci);
  if(r) exact++;
  else if(aliasInverse[sci] && rangEsp.get(aliasInverse[sci])){ r = rangEsp.get(aliasInverse[sci]); alias++; }
  else if(genreInfo.has(sci.split(' ')[0])){ r = { rang: 1e9, genre: sci.split(' ')[0] }; genre++; }
  if(!r || !genreInfo.has(r.genre)){ perdues.push(sci); continue; }
  const { g, fam } = genreInfo.get(r.genre);
  g.especes.push({ sci, fr: FR_NAMES[sci], rang: r.rang });
  if(!intitule.has(fam)) intitule.set(fam, familyOf(sci));
}
const sortie = [];
for(const o of ordres){
  const fams = [];
  for(const f of o.familles){
    const genres = f.genres.filter(g => g.especes.length).map(g => ({ lat: g.lat, especes: g.especes.sort((a, b) => a.rang - b.rang).map(e => [e.sci, e.fr]) }));
    if(!genres.length) continue;
    const fr = intitule.get(f.lat);
    fams.push({ lat: f.lat, savant: (INFO[fr] || [])[1] || f.lat, courant: fr, genres, n: genres.reduce((s, g) => s + g.especes.length, 0) });
  }
  sortie.push({ lat: o.lat, savant: savantFr(o.lat), courant: noms[savantFr(o.lat)] || '?', familles: fams, n: fams.reduce((s, f) => s + f.n, 0) });
}
fs.mkdirSync('notes-privees/maquettes/arbre', { recursive: true });
fs.writeFileSync('notes-privees/maquettes/arbre/donnees.json', JSON.stringify(sortie));
console.log('especes : exact', exact, '; par alias', alias, '; par genre', genre, '; perdues', perdues.length, perdues.join(', '));
console.log('ordres', sortie.length, '; familles', sortie.reduce((s, o) => s + o.familles.length, 0), '; genres', sortie.reduce((s, o) => s + o.familles.reduce((t, f) => t + f.genres.length, 0), 0), '; especes', sortie.reduce((s, o) => s + o.n, 0));
console.log('ordres sans nom courant :', sortie.filter(o => o.courant === '?').map(o => o.lat).join(', ') || '-');
console.log('poids :', Math.round(fs.statSync('notes-privees/maquettes/arbre/donnees.json').size / 1024), 'Ko');

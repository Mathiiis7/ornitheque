// Recupere sur Wikipedia en francais la premiere phrase de l'article de chaque ordre du site et
// des grands groupes de l'arbre, pour proposer un nom courant et un nom savant francais SOURCES.
// Sortie : notes-privees/arbre/wiki-ordres.json. Lancer depuis la racine.
import fs from 'node:fs';
const app = fs.readFileSync('app.js', 'utf8');
const t = 'const FAMILLES_EBIRD = ';
const d = app.indexOf(t) + t.length;
const FAMILLES_EBIRD = new Function('return (' + app.slice(d, app.slice(d).search(/;\r?\n/) + d) + ')')();
const ORDRES = [...new Set(FAMILLES_EBIRD.map(f => f[2]))];
const GROUPES = ['Palaeognathae', 'Neognathae', 'Galloanserae', 'Neoaves', 'Mirandornithes', 'Columbaves',
  'Columbimorphae', 'Otidimorphae', 'Telluraves', 'Afroaves', 'Australaves', 'Elementaves', 'Strisores',
  'Cursorimorphae', 'Phaethoquornithes', 'Phaethontimorphae', 'Aequornithes', 'Acanthisitti', 'Tyranni',
  'Passeri', 'Eupasseres', 'Corvides', 'Passerides'];
const titres = [...ORDRES, ...GROUPES];
const res = {};
for(let i = 0; i < titres.length; i += 20){
  const lot = titres.slice(i, i + 20);
  const url = 'https://fr.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=1&explaintext=1&exsentences=2&redirects=1&titles=' + encodeURIComponent(lot.join('|'));
  const r = await fetch(url, { headers: { 'User-Agent': 'Ornitheque-outils/1.0 (site amateur ; recherche de noms)' } });
  const j = await r.json();
  const redir = Object.fromEntries((j.query.redirects || []).map(x => [x.to, x.from]));
  const norm = Object.fromEntries((j.query.normalized || []).map(x => [x.to, x.from]));
  for(const p of Object.values(j.query.pages)){
    let source = redir[p.title] || p.title; source = norm[source] || source;
    res[source] = { page: p.title, existe: !p.missing, texte: (p.extract || '').replace(/\s+/g, ' ').trim() };
  }
}
fs.writeFileSync('notes-privees/arbre/wiki-ordres.json', JSON.stringify(res, null, 1));
for(const k of titres){ const x = res[k]; console.log(k, '=>', x ? (x.existe ? x.page + ' : ' + x.texte.slice(0, 230) : 'PAS D\'ARTICLE') : '?'); }

// Cherche sur PhyloPic (api.phylopic.org) une silhouette pour chacun des 45 ordres, sous licence
// libre seulement (CC0, domaine public, CC BY, CC BY-SA ; jamais NC). Telecharge le SVG et note
// l'auteur et la licence pour les credits.
// Premier essai (08/11) : la premiere image libre venue etait souvent un FOSSILE (autruche du
// Paleocene, manchot geant disparu) : on n'accepte qu'une espece dont le genre vit encore dans
// l'ordre (donnees du site), et on prefere le domaine public. Un ordre sans noeud PhyloPic a son
// nom se cherche par sa premiere famille.
// Sortie : notes-privees/maquettes/arbre/silhouettes/<Ordre>.svg et credits.json. Lancer depuis la racine.
import fs from 'node:fs';
const API = 'https://api.phylopic.org';
const H = { headers: { 'User-Agent': 'Ornitheque-outils/1.0 (site amateur)', Accept: 'application/vnd.phylopic.v2+json' } };
const DOSSIER = 'notes-privees/maquettes/arbre/silhouettes';
fs.mkdirSync(DOSSIER, { recursive: true });
for(const f of fs.readdirSync(DOSSIER)) fs.unlinkSync(DOSSIER + '/' + f);
const donnees = JSON.parse(fs.readFileSync('notes-privees/maquettes/arbre/donnees.json', 'utf8'));
const racine = await (await fetch(API + '/', H)).json();
const build = racine.build;
const LIBRE = /creativecommons\.org\/(publicdomain|licenses\/by\/|licenses\/by-sa\/)/;
const PUBLIC = /publicdomain/;
const j = async url => (await fetch(url, H)).json();
async function noeudDe(nom){
  const r = await j(`${API}/nodes?build=${build}&filter_name=${encodeURIComponent(nom.toLowerCase())}&page=0&embed_items=true`);
  return r._embedded?.items?.[0] || null;
}
async function images(uuid){
  const out = [];
  for(let p = 0; p < 6; p++){
    const r = await j(`${API}/images?build=${build}&filter_clade=${uuid}&page=${p}&embed_items=true`);
    const it = r._embedded?.items || [];
    out.push(...it);
    if(!r._links?.next) break;
  }
  return out;
}
const credits = {};
for(const o of donnees){
  const genres = new Set(o.familles.flatMap(f => f.genres.map(g => g.lat.toLowerCase())));
  let n = await noeudDe(o.lat), via = o.lat;
  if(!n){ n = await noeudDe(o.familles[0].lat); via = o.familles[0].lat; }
  // Les kiwis : ni « Apterygiformes » ni « Apterygidae » chez PhyloPic, on essaie le genre
  if(!n){ n = await noeudDe(o.familles[0].genres[0].lat); via = o.familles[0].genres[0].lat; }
  if(!n){ console.log(o.lat, ': pas de noeud'); continue; }
  const imgs = (await images(n.uuid)).filter(im => LIBRE.test(im._links?.license?.href || '') && im._links?.vectorFile?.href);
  const vivant = im => genres.has((im._links.specificNode?.title || '').split(' ')[0].toLowerCase());
  const choix = imgs.find(im => vivant(im) && PUBLIC.test(im._links.license.href)) || imgs.find(vivant);
  if(!choix){ console.log(o.lat, ': aucune image libre d\'espece vivante sur', imgs.length, '(via', via + ')'); continue; }
  const t = await (await fetch(choix._links.vectorFile.href, H)).text();
  fs.writeFileSync(`${DOSSIER}/${o.lat}.svg`, t);
  credits[o.lat] = { auteur: choix.attribution || '', licence: choix._links.license.href, sujet: choix._links.specificNode?.title || '', page: 'https://www.phylopic.org/images/' + choix.uuid };
  console.log(o.lat, ':', credits[o.lat].sujet, '|', credits[o.lat].auteur.slice(0, 60), '|', credits[o.lat].licence.replace('https://creativecommons.org/', ''));
}
fs.writeFileSync(`${DOSSIER}/credits.json`, JSON.stringify(credits, null, 1));
console.log(Object.keys(credits).length, 'silhouettes sur', donnees.length);

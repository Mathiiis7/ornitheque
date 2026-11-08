// Fabrique les donnees de la page « L'arbre des oiseaux » (menu ⚙, 2026-11-08) :
// - data/arbre.json : le cladogramme des 45 ordres (Stiller et al. 2024, reduit par
//   _cladogramme-ordres.mjs), le trait de chaque embranchement, et pour chaque ordre son nom,
//   sa phrase, ses familles et leurs genres dans l'ordre d'AviList v2026 ;
// - assets/silhouettes/<Ordre>.svg : les 45 silhouettes PhyloPic (credits dans le JSON).
// Les especes n'y sont pas : la page les tire de FR_NAMES et familyOf(), deja dans app.js.
// Entrees (hors depot, notes-privees/maquettes/arbre/) : donnees.json (_arbre-donnees.mjs),
// cladogramme.json, traits.json, phrases-ordres.json, silhouettes/.
// Lancer depuis la racine : node outils/build/arbre-donnees.mjs
// Apres une regeneration, monter le ?v= de data/arbre.json dans renderArbre() (app.js) : le
// service worker garde data/ d'un deploiement a l'autre tant que l'adresse ne change pas.
import fs from 'node:fs';
const M = 'notes-privees/maquettes/arbre/';
const lire = f => JSON.parse(fs.readFileSync(M + f, 'utf8'));
const donnees = lire('donnees.json'), arbre = lire('cladogramme.json'), traits = lire('traits.json'),
  phrases = lire('phrases-ordres.json'), credits = lire('silhouettes/credits.json');

// L'arbre : on ne garde que ce que la page dessine (ordre, enfants, soutien, id)
function nettoie(n){
  if(n.ordre) return { o: n.ordre };
  return { id: n.id, s: n.support ?? null, e: n.enfants.map(nettoie) };
}
const T = {};
for(const [id, t] of Object.entries(traits)) if(!id.startsWith('_')) T[id] = { g: t.groupe, t: t.trait, d: t.detail, st: t.statut, src: t.src };
// Phrases des familles (phrases-familles.json, par lots relus par Mathis). Une famille seule dans
// son ordre n'en a pas besoin : la phrase de l'ordre la dit deja.
const phrasesFam = fs.existsSync(M + 'phrases-familles.json') ? lire('phrases-familles.json') : {};
const ordres = donnees.map(o => ({
  lat: o.lat, savant: o.savant, courant: o.courant, n: o.n, phrase: phrases[o.lat] || '',
  familles: o.familles.map(f => ({ lat: f.lat, savant: f.savant, courant: f.courant, n: f.n, genres: f.genres.map(g => g.lat),
    ...(o.familles.length > 1 && phrasesFam[f.lat] ? { phrase: phrasesFam[f.lat] } : {}) })),
}));
console.log('familles avec phrase :', ordres.reduce((s, o) => s + o.familles.filter(f => f.phrase).length, 0),
  'sur', ordres.reduce((s, o) => s + (o.familles.length > 1 ? o.familles.length : 0), 0), 'dans des ordres a plusieurs familles');
// L'arbre des familles de chaque ordre (_familles-arbres.mjs, d'apres Stiller 2024). Les familles
// absentes de l'etude partent de la racine de leur ordre, marquees « np » (place non publiee).
// Feuille : { f: index de la famille dans o.familles } ; noeud : { e: [...] }.
const famArbres = fs.existsSync(M + 'familles-arbres.json') ? lire('familles-arbres.json') : {};
for(const o of ordres){
  if(o.familles.length < 2) continue;
  const idx = Object.fromEntries(o.familles.map((f, k) => [f.lat, k]));
  const conv = n => n.f ? { f: idx[n.f] } : { e: n.e.map(conv) };
  const t = famArbres[o.lat] ? conv(famArbres[o.lat]) : { e: [] };
  const presentes = new Set(); (function v(n){ if(n.f != null) presentes.add(n.f); else n.e.forEach(v); })(t);
  const absentes = o.familles.map((f, k) => k).filter(k => !presentes.has(k)).map(k => ({ f: k, np: 1 }));
  o.arbre = t.e && absentes.length ? { e: [...(t.f != null ? [t] : t.e), ...absentes] } : t;
}
const manque = ordres.filter(o => !o.phrase).map(o => o.lat);
if(manque.length) throw new Error('phrases manquantes : ' + manque.join(', '));
const sortie = {
  _source: 'Arbre : Stiller et al. 2024, Nature, doi:10.1038/s41586-024-07323-1 (CC BY 4.0), arbre principal 63K.tre reduit aux ordres. Ordres, familles, genres : AviList v2026, doi:10.2173/avilist.v2026 (CC BY 4.0). Genere par outils/build/arbre-donnees.mjs.',
  arbre: nettoie(arbre), traits: T, ordres,
  credits: Object.fromEntries(Object.entries(credits).map(([o, c]) => [o, { a: c.auteur, l: c.licence, p: c.page, s: c.sujet }])),
};
fs.writeFileSync('data/arbre.json', JSON.stringify(sortie));
fs.mkdirSync('assets/silhouettes', { recursive: true });
let octets = 0;
for(const o of ordres){
  // Les SVG de PhyloPic sont ecrits par potrace : on retire l'en-tete XML, le DOCTYPE et les
  // metadonnees, inutiles dans une <img>.
  let s = fs.readFileSync(`${M}silhouettes/${o.lat}.svg`, 'utf8');
  s = s.replace(/<\?xml[^>]*>\s*/, '').replace(/<!DOCTYPE[^>]*>\s*/, '').replace(/<metadata>[\s\S]*?<\/metadata>\s*/, '');
  fs.writeFileSync(`assets/silhouettes/${o.lat}.svg`, s);
  octets += Buffer.byteLength(s);
}
console.log('data/arbre.json :', Math.round(fs.statSync('data/arbre.json').size / 1024), 'Ko ;', ordres.length, 'ordres ;', Object.keys(T).length, 'traits');
console.log('assets/silhouettes :', ordres.length, 'fichiers,', Math.round(octets / 1024), 'Ko');

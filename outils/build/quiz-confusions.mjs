// Fabrique la table des chants confondables de la Survie (quiz classe) a partir de la recherche
// docs/quiz-confusions-recherche.json (guides et sites cites, 2026-11-18), et la page de relecture
// docs/quiz-confusions.md pour Mathis.
//   node outils/build/quiz-confusions.mjs
// Regles (en attendant la relecture de Mathis) :
// - une paire sans aucune source n'entre pas dans le jeu ; elle est listee « a valider » ;
// - une paire marquee a_verifier (source vue seulement en resume, page fermee, forum) perd un niveau, 1 au moins ;
// - docs/quiz-confusions-decisions.json, s'il existe, a le dernier mot : { "a|b": niveau } (0 = retiree),
//   symetrique, rempli d'apres la relecture de Mathis.
// Format de sortie : data/quiz-confusions.json = { sci: [[sci, niveau], ...] }, lu par _pcRessemblance.
import fs from 'fs';

const R = 'docs/quiz-confusions-recherche.json';
const recherche = JSON.parse(fs.readFileSync(R, 'utf8'));
const decisions = fs.existsSync('docs/quiz-confusions-decisions.json') ? JSON.parse(fs.readFileSync('docs/quiz-confusions-decisions.json', 'utf8')) : {};
// Les noms francais viennent de FR_NAMES, en tete d'app.js.
const app = fs.readFileSync('app.js', 'utf8');
const FR = JSON.parse(app.match(/const FR_NAMES = (\{.*?\});/s)[1]);
const fr = s => FR[s] || s;

const paire = (a, b) => [a, b].sort().join('|');
const niveaux = new Map();     // paire -> niveau retenu
const fiches = new Map();      // paire -> { raisons, sources, aVerifier, sansSource }
for(const [a, v] of Object.entries(recherche)){
  if(a.startsWith('_')) continue;
  for(const p of v.proches || []){
    const k = paire(a, p.sci);
    const f = fiches.get(k) || { raisons: new Set(), sources: new Set(), aVerifier: true, sansSource: true, niveau: 0 };
    if(p.raison) f.raisons.add(p.raison);
    for(const u of p.sources || []) f.sources.add(u);
    if(p.sources?.length) f.sansSource = false;
    if(!p.a_verifier) f.aVerifier = false;
    f.niveau = Math.max(f.niveau, p.niveau || 1);
    fiches.set(k, f);
  }
}
for(const [k, f] of fiches){
  let n = f.sansSource ? 0 : f.aVerifier ? Math.max(1, f.niveau - 1) : f.niveau;
  if(k in decisions) n = decisions[k];
  niveaux.set(k, n);
}
for(const [k, n] of Object.entries(decisions)) if(!niveaux.has(k)) niveaux.set(k, n);

const table = {};
for(const [k, n] of niveaux){
  if(!n) continue;
  const [a, b] = k.split('|');
  (table[a] ||= []).push([b, n]); (table[b] ||= []).push([a, n]);
}
for(const l of Object.values(table)) l.sort((x, y) => y[1] - x[1]);
fs.writeFileSync('data/quiz-confusions.json', JSON.stringify(table) + '\n');

// Page de relecture : une ligne par paire, classee par oiseau puis par niveau.
const statut = (k, f) => k in decisions ? (decisions[k] ? 'validée par Mathis' : 'retirée par Mathis') : f.sansSource ? '**à valider, sans source**' : f.aVerifier ? 'source faible' : 'sourcée';
const lignes = [...fiches.entries()].sort((x, y) => fr(x[0].split('|')[0]).localeCompare(fr(y[0].split('|')[0]), 'fr') || niveaux.get(y[0]) - niveaux.get(x[0]));
let md = `# Chants confondables de la Survie\n\nTable fabriquée par \`outils/build/quiz-confusions.mjs\` à partir de \`docs/quiz-confusions-recherche.json\`\n(recherche du 2026-11-18 dans des guides et sites ornithologiques). Le jeu s'en sert pour choisir les 4 mauvais noms\nproposés à côté du bon. **Niveau** : 3 confusion classique, 2 ressemblance réelle, 1 partielle ; 0 = hors du jeu.\nLes paires sans source n'entrent pas dans le jeu tant qu'elles ne sont pas validées.\n\n`;
md += `${lignes.length} paires, dont ${lignes.filter(([, f]) => f.sansSource).length} sans source et ${lignes.filter(([, f]) => !f.sansSource && f.aVerifier).length} à source faible.\n`;
md += `Sans aucune paire trouvée : ${Object.entries(recherche).filter(([a, v]) => !a.startsWith('_') && !(v.proches || []).length).map(([a]) => fr(a)).join(', ') || 'aucun'}.\n\n`;
md += `| Oiseau | Se confond avec | Niveau | Ce qui se ressemble | Statut | Sources |\n|---|---|---|---|---|---|\n`;
for(const [k, f] of lignes){
  const [a, b] = k.split('|');
  const src = [...f.sources].map((u, i) => `[${i + 1}](${u})`).join(' ');
  md += `| ${fr(a)} | ${fr(b)} | ${niveaux.get(k)} | ${[...f.raisons].join(' / ').replace(/\|/g, '/')} | ${statut(k, f)} | ${src} |\n`;
}
fs.writeFileSync('docs/quiz-confusions.md', md);
console.log('paires :', fiches.size, '· dans le jeu :', [...niveaux.values()].filter(Boolean).length, '· oiseaux avec au moins une paire :', Object.keys(table).length);

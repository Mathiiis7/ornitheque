// Choisit l'espèce dont la photo représente chaque FAMILLE dans l'Arbre phylogénétique (demande de
// Mathis, 2026-11-08 : « la plus connue », et la photo d'un ordre revient sur la famille qui la contient).
// « La plus connue » se mesure ici : l'espèce de la famille la plus observée dans le monde sur
// iNaturalist (observations de qualité recherche). Seules comptent les espèces que le site connaît
// (FR_NAMES) et dont le genre est dans la famille selon AviList (data/arbre.json).
// La famille qui contient l'espèce d'un ordre (ARBRE_PHOTOS dans app.js) prend cette espèce-là.
// Écrit notes-privees/maquettes/arbre/photos-familles.json, lu par arbre-donnees.mjs, et garde les
// réponses d'iNaturalist dans notes-privees/arbre/inat-familles/ pour pouvoir relancer sans tout redemander.
// Lancer depuis la racine : node outils/build/_photos-familles.mjs
import fs from 'node:fs';
const app = fs.readFileSync('app.js', 'utf8');
const FR = JSON.parse(app.match(/^const FR_NAMES = (\{.*\});?\s*$/m)[1]);
const bloc = app.match(/^const ARBRE_PHOTOS = \{([\s\S]*?)\n\};/m)[1];
const PH_ORDRE = Object.fromEntries([...bloc.matchAll(/(\w+):'([^']+)'/g)].map(m => [m[1], m[2]]));
const D = JSON.parse(fs.readFileSync('data/arbre.json', 'utf8'));
const CACHE = 'notes-privees/arbre/inat-familles/';
fs.mkdirSync(CACHE, { recursive: true });
const pause = ms => new Promise(r => setTimeout(r, ms));
async function demande(url, fichier){
  if(fs.existsSync(CACHE + fichier)) return JSON.parse(fs.readFileSync(CACHE + fichier, 'utf8'));
  for(let essai = 0; essai < 5; essai++){
    await pause(1100);   // iNaturalist demande au plus une requête par seconde
    // Une coupure du réseau (« other side closed », 2026-11-08) vaut un refus : on réessaie
    const r = await fetch(url, { headers: { 'User-Agent': 'ornitheque-arbre/1.0' } }).catch(e => ({ ok: false, status: e.message }));
    if(r.ok){ const j = await r.json(); fs.writeFileSync(CACHE + fichier, JSON.stringify(j)); return j; }
    console.log('  refus', r.status, '- nouvel essai dans 60 s'); await pause(60000);
  }
  throw new Error('iNaturalist ne répond pas : ' + url);
}
const sortie = {}, rapport = [];
let nOrdre = 0, nInat = 0, nRien = 0;
for(const o of D.ordres){
  const scisOrdre = PH_ORDRE[o.lat];
  for(const f of o.familles){
    const genres = new Set(f.genres.map(g => g.toLowerCase()));
    const dansFam = s => FR[s] && genres.has(s.split(' ')[0]);
    if(scisOrdre && dansFam(scisOrdre)){ sortie[f.lat] = scisOrdre; nOrdre++; rapport.push([o.lat, f.lat, scisOrdre, 'ordre']); continue; }
    const t = await demande(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(f.lat)}&rank=family&per_page=5`, f.lat + '-taxon.json');
    const tax = t.results.find(r => r.name === f.lat && r.rank === 'family');
    let choix = null, obs = 0;
    if(tax){
      const c = await demande(`https://api.inaturalist.org/v1/observations/species_counts?taxon_id=${tax.id}&quality_grade=research&per_page=50`, f.lat + '-especes.json');
      const r = c.results.find(r => dansFam(r.taxon.name.toLowerCase()));
      if(r){ choix = r.taxon.name.toLowerCase(); obs = r.count; }
    }
    if(choix){ sortie[f.lat] = choix; nInat++; rapport.push([o.lat, f.lat, choix, obs + ' obs.']); }
    else { nRien++; rapport.push([o.lat, f.lat, '-', tax ? 'aucune espèce du site' : 'famille inconnue d’iNaturalist']); }
    process.stdout.write('.');
  }
}
console.log();
fs.writeFileSync('notes-privees/maquettes/arbre/photos-familles.json', JSON.stringify(sortie, null, 1));
fs.writeFileSync('notes-privees/arbre/PHOTOS-FAMILLES.md', ['# Photos des familles', '',
  `${nOrdre} reprennent la photo de leur ordre, ${nInat} viennent d’iNaturalist (espèce la plus observée), ${nRien} sans choix.`, '',
  ...rapport.map(([o, f, s, d]) => `- ${o} / ${f} : ${s}${FR[s] ? ' (' + FR[s] + ')' : ''} - ${d}`)].join('\n') + '\n');
console.log(nOrdre, 'reprennent leur ordre ;', nInat, 'd’iNaturalist ;', nRien, 'sans choix');
for(const [o, f, s, d] of rapport) if(s === '-') console.log('SANS CHOIX', o, f, d);

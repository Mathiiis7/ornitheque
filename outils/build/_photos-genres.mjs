// Choisit l'espèce dont la photo représente chaque GENRE dans l'Arbre phylogénétique (demande de Mathis,
// 2026-11-08, après les familles). Même règle qu'aux étages au-dessus : le genre qui contient l'espèce de
// sa famille la reprend ; sinon, son espèce la plus observée sur iNaturalist (qualité recherche), parmi
// celles que le site connaît (FR_NAMES). Le classement vient d'une seule demande par famille (jusqu'à
// 500 espèces : la plus grande famille d'AviList en compte moins), plutôt qu'une par genre (2 300).
// Un genre dont aucune espèce n'est classée garde '' : la page prend alors sa première espèce.
// Écrit notes-privees/maquettes/arbre/photos-genres.json : { famille: [épithète par genre, dans l'ordre de
// f.genres] }, lu par arbre-donnees.mjs. Réponses gardées dans notes-privees/arbre/inat-familles/.
// Lancer depuis la racine, APRÈS _photos-familles.mjs : node outils/build/_photos-genres.mjs
import fs from 'node:fs';
const app = fs.readFileSync('app.js', 'utf8');
const FR = JSON.parse(app.match(/^const FR_NAMES = (\{.*\});?\s*$/m)[1]);
const D = JSON.parse(fs.readFileSync('data/arbre.json', 'utf8'));
const PH_FAM = JSON.parse(fs.readFileSync('notes-privees/maquettes/arbre/photos-familles.json', 'utf8'));
const CACHE = 'notes-privees/arbre/inat-familles/';
const pause = ms => new Promise(r => setTimeout(r, ms));
async function demande(url, fichier){
  if(fs.existsSync(CACHE + fichier)) return JSON.parse(fs.readFileSync(CACHE + fichier, 'utf8'));
  for(let essai = 0; essai < 5; essai++){
    await pause(1100);   // iNaturalist demande au plus une requête par seconde
    const r = await fetch(url, { headers: { 'User-Agent': 'ornitheque-arbre/1.0' } }).catch(e => ({ ok: false, status: e.message }));
    if(r.ok){ const j = await r.json(); fs.writeFileSync(CACHE + fichier, JSON.stringify(j)); return j; }
    console.log('  refus', r.status, '- nouvel essai dans 60 s'); await pause(60000);
  }
  throw new Error('iNaturalist ne répond pas : ' + url);
}
const sortie = {};
let nFam = 0, nInat = 0, nVide = 0, nGenres = 0;
for(const o of D.ordres) for(const f of o.familles){
  const t = await demande(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(f.lat)}&rank=family&per_page=5`, f.lat + '-taxon.json');
  const tax = t.results.find(r => r.name === f.lat && r.rank === 'family');
  const classe = tax ? (await demande(`https://api.inaturalist.org/v1/observations/species_counts?taxon_id=${tax.id}&quality_grade=research&per_page=500`, f.lat + '-classement.json')).results.map(r => r.taxon.name.toLowerCase()) : [];
  sortie[f.lat] = f.genres.map(g => {
    nGenres++;
    const gl = g.toLowerCase(), dans = s => s.split(' ')[0] === gl && FR[s];
    if(PH_FAM[f.lat] && dans(PH_FAM[f.lat])){ nFam++; return PH_FAM[f.lat].split(' ')[1]; }
    const s = classe.find(dans);
    if(s){ nInat++; return s.split(' ')[1]; }
    nVide++; return '';
  });
  process.stdout.write('.');
}
console.log();
fs.writeFileSync('notes-privees/maquettes/arbre/photos-genres.json', JSON.stringify(sortie));
console.log(nGenres, 'genres :', nFam, 'reprennent leur famille ;', nInat, 'd’iNaturalist ;', nVide, 'sans classement');

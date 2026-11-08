// Telecharge le texte complet des articles Wikipedia (anglais et francais) des groupes de l'arbre,
// pour y chercher le trait qui caracterise chaque embranchement. Sortie :
// notes-privees/arbre/wiki-clades/<Groupe>.<langue>.txt. Lancer depuis la racine.
import fs from 'node:fs';
const GROUPES = ['Neornithes', 'Palaeognathae', 'Notopalaeognathae', 'Novaeratitae', 'Neognathae', 'Galloanserae',
  'Neoaves', 'Mirandornithes', 'Columbaves', 'Otidimorphae', 'Columbimorphae', 'Elementaves', 'Cursorimorphae',
  'Phaethoquornithes', 'Eurypygimorphae', 'Aequornithes', 'Austrodyptornithes', 'Strisores', 'Sedentaves',
  'Daedalornithes', 'Telluraves', 'Afroaves', 'Hieraves', 'Accipitrimorphae', 'Coraciimorphae', 'Cavitaves',
  'Eucavitaves', 'Picocoraciae', 'Picodynastornithes', 'Australaves', 'Eufalconimorphae', 'Psittacopasserae',
  'Pelecanimorphae', 'Ardeae', 'Passerea', 'Vanescaves'];
const DOSSIER = 'notes-privees/arbre/wiki-clades';
fs.mkdirSync(DOSSIER, { recursive: true });
const H = { headers: { 'User-Agent': 'Ornitheque-outils/1.0 (site amateur ; recherche)' } };
for(const lang of ['en', 'fr']){
  for(let i = 0; i < GROUPES.length; i += 1){
    const g = GROUPES[i];
    // Wikipedia refuse les demandes trop rapprochees (« too many requests », 08/11) : 2 s entre deux,
    // et on ne redemande pas un article deja telecharge.
    if(fs.existsSync(`${DOSSIER}/${g}.${lang}.txt`)) continue;
    const url = `https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|info&inprop=url&explaintext=1&redirects=1&titles=${encodeURIComponent(g)}`;
    let j = null;
    for(let essai = 0; essai < 6 && !j; essai++){
      await new Promise(r => setTimeout(r, essai ? 60000 : 6000));
      const t = await (await fetch(url, H)).text();
      try{ j = JSON.parse(t); }catch{ console.log('refus, pause de 60 s'); }
    }
    if(!j){ console.log(lang, g, ': abandon'); continue; }
    const p = Object.values(j.query.pages)[0];
    if(p.missing !== undefined || !p.extract){ console.log(lang, g, ': absent'); continue; }
    fs.writeFileSync(`${DOSSIER}/${g}.${lang}.txt`, p.fullurl + '\n\n' + p.extract);
    console.log(lang, g, ':', p.title, p.extract.length, 'car.');
  }
}

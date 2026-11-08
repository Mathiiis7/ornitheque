// Telecharge l'introduction de l'article Wikipedia (anglais) de chacun des 45 ordres, pour ecrire
// la phrase « ce qui le distingue ». Sortie : notes-privees/arbre/wiki-ordres/<Ordre>.en.txt.
// 6 s entre deux demandes, pause d'une minute si Wikipedia refuse (« too many requests », 08/11).
// Lancer depuis la racine : node outils/build/_wiki-ordres.mjs
import fs from 'node:fs';
const ordres = JSON.parse(fs.readFileSync('notes-privees/maquettes/arbre/donnees.json', 'utf8')).map(o => o.lat);
const DOSSIER = 'notes-privees/arbre/wiki-ordres';
fs.mkdirSync(DOSSIER, { recursive: true });
const H = { headers: { 'User-Agent': 'Ornitheque-outils/1.0 (site amateur ; recherche)' } };
for(const o of ordres){
  const f = `${DOSSIER}/${o}.en.txt`;
  if(fs.existsSync(f)) continue;
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|info&inprop=url&exintro=1&explaintext=1&redirects=1&titles=${encodeURIComponent(o)}`;
  let j = null;
  for(let essai = 0; essai < 6 && !j; essai++){
    await new Promise(r => setTimeout(r, essai ? 60000 : 6000));
    const t = await (await fetch(url, H)).text();
    try{ j = JSON.parse(t); }catch{ console.log('refus, pause de 60 s'); }
  }
  if(!j){ console.log(o, ': abandon'); continue; }
  const p = Object.values(j.query.pages)[0];
  if(p.missing !== undefined || !p.extract){ console.log(o, ': absent'); continue; }
  fs.writeFileSync(f, p.fullurl + '\n\n' + p.extract);
  console.log(o, ':', p.title, p.extract.length);
}
console.log('fini');

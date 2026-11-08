// Télécharge le texte COMPLET d'articles Wikipédia anglais (pas seulement l'introduction), pour chercher
// le trait qui unit les familles d'un embranchement (2026-11-08). Usage, depuis la racine :
//   node outils/build/_wiki-pages.mjs <dossier de sortie> <fichier de titres, un par ligne>
// Un article par demande (l'API ne rend le texte complet que d'une page à la fois), 3 s entre deux,
// 60 s après un refus (« too many requests », 08/11) ; un article déjà téléchargé n'est pas redemandé.
import fs from 'node:fs';
const [dossier, liste] = process.argv.slice(2);
const titres = fs.readFileSync(liste, 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean);
fs.mkdirSync(dossier, { recursive: true });
const H = { headers: { 'User-Agent': 'Ornitheque-outils/1.0 (site amateur ; recherche)' } };
for(const t of titres){
  const fic = `${dossier}/${t.replace(/[\\/:*?"<>|]/g, '_')}.en.txt`;
  if(fs.existsSync(fic)) continue;
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|info&inprop=url&explaintext=1&redirects=1&titles=${encodeURIComponent(t)}`;
  let j = null;
  for(let essai = 0; essai < 6 && !j; essai++){
    await new Promise(r => setTimeout(r, essai ? 60000 : 3000));
    try{ j = JSON.parse(await (await fetch(url, H)).text()); }catch{ console.log('refus, pause de 60 s'); }
  }
  if(!j){ console.log(t, ': abandon'); continue; }
  const p = Object.values(j.query.pages)[0];
  if(p.missing !== undefined || !p.extract){ console.log(t, ': absent'); continue; }
  fs.writeFileSync(fic, p.fullurl + '\n\n' + p.extract);
  console.log(t, '->', p.title, p.extract.length, 'car.');
}

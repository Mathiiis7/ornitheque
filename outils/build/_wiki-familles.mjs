// Telecharge l'introduction de l'article Wikipedia (anglais) des 250 familles, par paquets de
// 20 titres dans une seule demande (prop=extracts accepte 20 introductions a la fois) : une
// demande par article avait fait refuser l'API (« too many requests », 08/11).
// Sortie : notes-privees/arbre/wiki-familles/<Famille>.en.txt. Lancer depuis la racine.
import fs from 'node:fs';
const D = JSON.parse(fs.readFileSync('data/arbre.json', 'utf8'));
const familles = D.ordres.flatMap(o => o.familles.map(f => f.lat));
const DOSSIER = 'notes-privees/arbre/wiki-familles';
fs.mkdirSync(DOSSIER, { recursive: true });
const H = { headers: { 'User-Agent': 'Ornitheque-outils/1.0 (site amateur ; recherche)' } };
const reste = familles.filter(f => !fs.existsSync(`${DOSSIER}/${f}.en.txt`));
for(let i = 0; i < reste.length; i += 20){
  const lot = reste.slice(i, i + 20);
  const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts|info&inprop=url&exintro=1&explaintext=1&exlimit=20&redirects=1&titles=${encodeURIComponent(lot.join('|'))}`;
  let j = null;
  for(let essai = 0; essai < 6 && !j; essai++){
    await new Promise(r => setTimeout(r, essai ? 60000 : 5000));
    const t = await (await fetch(url, H)).text();
    try{ j = JSON.parse(t); }catch{ console.log('refus, pause de 60 s'); }
  }
  if(!j){ console.log('abandon du paquet', i); continue; }
  const dest = new Map(lot.map(f => [f, f]));
  for(const r of j.query.normalized || []) if(dest.has(r.from)){ dest.set(r.to, r.from); }
  for(const r of j.query.redirects || []){ const src = dest.get(r.from) ?? r.from; dest.set(r.to, src); }
  for(const p of Object.values(j.query.pages)){
    const f = dest.get(p.title);
    if(!f || p.missing !== undefined || !p.extract){ console.log('absent :', p.title); continue; }
    fs.writeFileSync(`${DOSSIER}/${f}.en.txt`, p.fullurl + '\n\n' + p.extract);
  }
  console.log('paquet', i / 20 + 1, 'fait');
}
const manquent = familles.filter(f => !fs.existsSync(`${DOSSIER}/${f}.en.txt`));
console.log('familles :', familles.length, '; recues :', familles.length - manquent.length, '; manquent :', manquent.join(', ') || '-');

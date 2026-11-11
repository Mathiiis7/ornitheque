// Les zones « muettes » de la carte de la fiche (2026-11-11) : dessinées, connues d'eBird, mais absentes des
// zones du site faute de bar chart (le téléchargement jette un fichier de moins de 500 octets, ce que renvoie
// une zone sans liste). Pour chacune, via le relais eBird du site : le nombre d'espèces jamais notées
// (product/spplist) et les années de ses dernières listes (product/lists). Une zone à 0 espèce n'a jamais
// rien reçu : ses observations sont rangées dans une zone voisine (Louxor dans Qena).
// Sortie : notes-privees/zones-muettes.json. Usage : node outils/verif/_zones-muettes.mjs
import fs from 'node:fs';
const RELAIS = 'https://ornitheque-relais.vercel.app/v2/';
const inv = Object.fromEntries(JSON.parse(fs.readFileSync('outils/config/pays-a-ajouter.json', 'utf8')).map(p => [p.cc, new Set(p.zones)]));
const muettes = [];
for(const d of fs.readdirSync('data/countries')){
  const cc = d.toUpperCase(), f = `data/regions-${d}-simplified.json`, pf = `data/countries/${d}/pays.json`;
  if(!fs.existsSync(f) || !fs.existsSync(pf)) continue;
  const reg = JSON.parse(fs.readFileSync(f, 'utf8')).regions || {};
  const site = new Set((JSON.parse(fs.readFileSync(pf, 'utf8')).zones || []).map(z => z.code));
  if(!site.size) continue;
  for(const c of Object.keys(reg)) if(!site.has(c) && inv[cc] && inv[cc].has(c)) muettes.push({ cc, code: c, nom: reg[c].name });
}
const appel = async chemin => {
  for(let essai = 0; essai < 3; essai++){
    const r = await fetch(RELAIS + chemin, { headers: { Origin: 'http://localhost:8765' } });
    if(r.status === 429){ await new Promise(x => setTimeout(x, 5000)); continue; }
    return r.ok ? r.json() : null;
  }
  return null;
};
const sortie = [];
for(const z of muettes){
  const especes = await appel('product/spplist/' + z.code);
  await new Promise(x => setTimeout(x, 300));
  const listes = await appel('product/lists/' + z.code + '?maxResults=200');
  await new Promise(x => setTimeout(x, 300));
  const annees = (listes || []).map(x => +(String(x.obsDt).match(/(\d{4})/) || [])[1]).filter(Boolean);
  const r = { ...z, especes: Array.isArray(especes) ? especes.length : null, listes: annees.length,
    depuis2019: annees.filter(a => a >= 2019).length, derniere: annees.length ? Math.max(...annees) : null };
  sortie.push(r);
  console.log(r.code.padEnd(10), String(r.especes).padStart(4), 'espèces |', r.listes, 'listes, dernière', r.derniere, '| 2019-2026 :', r.depuis2019, '|', r.nom);
}
fs.writeFileSync('notes-privees/zones-muettes.json', JSON.stringify(sortie, null, 1));
const fantomes = sortie.filter(x => x.especes === 0), anciennes = sortie.filter(x => x.especes > 0 && x.depuis2019 === 0), recentes = sortie.filter(x => x.depuis2019 > 0);
console.log(`\n${sortie.length} zones : ${fantomes.length} sans aucune espèce (fondues ailleurs), ${anciennes.length} sans liste depuis 2019, ${recentes.length} avec des listes depuis 2019`);
console.log('Fondues :', fantomes.map(x => x.code + ' ' + x.nom).join(', '));
console.log('Récentes :', recentes.map(x => x.code + ' (' + x.depuis2019 + ')').join(', '));

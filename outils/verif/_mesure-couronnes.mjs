/*
  Mesure d'essai (2026-11-08) : qui porterait chaque couronne de groupe, sur la vraie ligue.
  Pas un banc (le tiret bas l'ecarte de tous.mjs). Lit une sauvegarde Firestore locale,
  fait tourner le VRAI app.js avec les bouchons Firebase, et lit les compteurs des familles
  de groupes (theme 'groupe' a paliers) par membre. Rien ne sort sur le reseau.

  Usage : node outils/verif/_mesure-couronnes.mjs outils/backups/firestore-AAAA-MM-JJ-HHMM.json
*/
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';

const BASE = 'https://www.gstatic.com/firebasejs/10.12.5/';
const sauvegarde = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const membresBruts = sauvegarde.data.leagues['merlin-bird']._subs.members;
// Variantes : --depuis-arrivee ne garde que les especes vues pour la 1re fois apres l'arrivee du
// membre dans la ligue ; --depuis AAAA-MM-JJ ne garde que celles vues depuis cette date.
const iArr = process.argv.indexOf('--depuis');
const DEPUIS = iArr > 0 ? process.argv[iArr + 1] : null;
const ARRIVEE = process.argv.includes('--depuis-arrivee');
const jourDe = ts => ts && ts.iso ? ts.iso.slice(0, 10) : null;
// Les listes ecrivent la date de deux facons : « 2026-08-01 » et « 01 Aug 2026 » (export eBird anglais).
const MOIS = { Jan:'01',Feb:'02',Mar:'03',Apr:'04',May:'05',Jun:'06',Jul:'07',Aug:'08',Sep:'09',Oct:'10',Nov:'11',Dec:'12' };
const jourObs = d => { if(!d) return '';
  let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d); if(m) return m[0];
  m = /^(\d{1,2}) (\w{3}) (\d{4})/.exec(d); if(m && MOIS[m[2]]) return `${m[3]}-${MOIS[m[2]]}-${m[1].padStart(2, '0')}`;
  throw new Error('date illisible : ' + d); };
const MEMBRES = Object.entries(membresBruts).map(([id, m]) => {
  const data = { ...m._data };
  const borne = ARRIVEE ? jourDe(data.joinedAt) : DEPUIS;
  if(ARRIVEE) console.log((data.name || '').padEnd(20), 'arrive le', borne, '-', (data.species || []).length, 'especes');
  if(borne) data.species = (data.species || []).filter(e => jourObs(e.d) >= borne);
  return { id, data };
});
const MOI = MEMBRES[0].id;

const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.html': 'text/html' };

function pageHtml(){
  let html = readFileSync(join(RACINE, 'index.html'), 'utf8');
  const carte = { imports: {
    [BASE + 'firebase-app.js']: '/bouchons/firebase-app.js',
    [BASE + 'firebase-auth.js']: '/bouchons/firebase-auth.js',
    [BASE + 'firebase-firestore.js']: '/bouchons/firebase-firestore.js' } };
  const ancre = '<meta charset="utf-8">';
  if(!html.includes(ancre)) throw new Error('ancre introuvable');
  html = html.replace(ancre, ancre + '\n<script type="importmap">' + JSON.stringify(carte) + '</script>');
  return html.replace(/app\.js\?v=\d+/g, 'app.js');
}
// app.js servi avec une sonde en fin de module : les constantes du module y sont visibles.
const SONDE = '\n;window.__sonde = { TROPHIES, statsFor, state };\n';

const srv = createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const envoyer = (corps, type) => { res.writeHead(200, { 'content-type': type + '; charset=utf-8' }); res.end(corps); };
  try{
    if(u === '/' || u === '/index.html') return envoyer(pageHtml(), 'text/html');
    if(u === '/app.js') return envoyer(readFileSync(join(RACINE, 'app.js'), 'utf8') + SONDE, 'text/javascript');
    if(u.startsWith('/bouchons/')) return envoyer(readFileSync(join(RACINE, 'outils', 'verif', u.slice(1))), 'text/javascript');
    const f = join(RACINE, u.replace(/^\/+/, ''));
    if(!existsSync(f)){ res.writeHead(404); return res.end('rien'); }
    return envoyer(readFileSync(f), TYPES[extname(f)] || 'application/octet-stream');
  }catch(e){ res.writeHead(500); res.end(String(e.message)); }
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));

const nav = await chromium.launch();
const ctx = await nav.newContext({ locale: 'fr-FR', serviceWorkers: 'block' });
const page = await ctx.newPage();
page.on('pageerror', e => console.log('erreur page :', String(e).slice(0, 200)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__fs && !!window.__auth && !!window.__sonde, null, { timeout: 20000 });
await page.evaluate(id => window.__auth.connecter(id), MOI);
await page.evaluate(m => window.__fs.livrer('leagues/merlin-bird/members', m), MEMBRES);
// build() attend une frame : on laisse le temps a l'appli de tout poser
await page.waitForFunction(() => window.__sonde.state.people.length > 1 && window.__sonde.state.people.every(p => p._active), null, { timeout: 20000 });

const resultat = await page.evaluate(() => {
  const { TROPHIES, statsFor, state } = window.__sonde;
  const N = state.people.length;
  const familles = new Map();
  for(const t of TROPHIES) if(t.theme === 'groupe' && t.tier && t.prog && !familles.has(t.familyBaseName)) familles.set(t.familyBaseName, t);
  const stats = state.people.map(p => ({ nom: p.name, s: statsFor(p, N) }));
  return [...familles].map(([nom, t]) => {
    const valeurs = stats.map(x => ({ nom: x.nom, n: t.prog(x.s)[0] })).sort((a, b) => b.n - a.n);
    const max = valeurs[0].n;
    return { groupe: nom, max, porteurs: valeurs.filter(v => v.n === max && max > 0).map(v => v.nom), second: valeurs.find(v => v.n < max)?.n ?? 0, valeurs };
  });
});
await nav.close(); srv.close();

// --themes : additionne les groupes par theme (proposition du 08/11) et rejoue la mesure.
// Les groupes sont disjoints, la somme ne compte donc aucune espece deux fois.
if(process.argv.includes('--themes')){
  const THEMES = {
    'Rapaces diurnes': ['Rapaces diurnes'],
    'Oiseaux de nuit': ['Rapaces nocturnes'],
    'Étangs': ['Canards, oies, cygnes & grèbes', 'Rallidés'],
    'Échassiers': ['Grands échassiers'],
    'Limicoles': ['Bécasseaux & chevaliers', 'Pluviers & rivages'],
    'Mer': ['Goélands & mouettes', 'Cormorans, fous & frégates'],
    'Forêt': ['Pics', 'Mésanges, sittelles & grimpereaux'],
    'Chanteurs': ['Grives, merles & gobemouches', 'Fauvettes, pouillots & rousserolles'],
    'Champs et jardins': ['Bruants & fringilles', 'Moineaux & accenteurs', 'Bergeronnettes, pipits & alouettes'],
    'Campagne': ['Corvidés', 'Pigeons & tourterelles', 'Galliformes'],
    'Ciel': ['Hirondelles & martinets'],
  };
  const parG = new Map(resultat.map(g => [g.groupe, g.valeurs]));
  const tenus = new Map();
  for(const [theme, groupes] of Object.entries(THEMES)){
    const somme = new Map();
    for(const g of groupes){ if(!parG.has(g)) throw new Error('groupe inconnu : ' + g); for(const v of parG.get(g)) somme.set(v.nom, (somme.get(v.nom) || 0) + v.n); }
    const tri = [...somme].sort((a, b) => b[1] - a[1]);
    const tete = tri.filter(x => x[1] === tri[0][1]).map(x => x[0]);
    console.log(theme.padEnd(20), tri.slice(0, 4).map(([n, v]) => n + ' ' + v).join(' | '));
    if(tete.length === 1) tenus.set(tete[0], (tenus.get(tete[0]) || 0) + 1);
  }
  console.log('\nthemes tenus seul :', [...tenus].sort((a, b) => b[1] - a[1]));
  process.exit(0);
}

const parPersonne = new Map();
for(const g of resultat){
  const seul = g.porteurs.length === 1;
  console.log(g.groupe.padEnd(38), String(g.max).padStart(3), ' second :', String(g.second).padStart(3), ' ', g.porteurs.join(', ') + (seul ? '' : '  (egalite)'));
  for(const p of g.porteurs) parPersonne.set(p, (parPersonne.get(p) || 0) + (seul ? 1 : 0));
}
console.log('\ncouronnes tenues seul (egalites a part) :', [...parPersonne].sort((a, b) => b[1] - a[1]));
console.log('egalites en tete :', resultat.filter(g => g.porteurs.length > 1).length, '/', resultat.length);

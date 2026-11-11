/*
  Essai du 09/11 (pas un banc, tiret bas) : nouvelle image d'« Oiseau pelagique », Pic noir retreci, et
  renommage « Pingouin, manchot & cousins » -> « Happy Feet ».
  Ce que le renommage ne doit PAS faire, pour qui avait deja le trophee sous son ancien nom :
    - ecrire un « a debloque Happy Feet » dans le Fil (trophyEvents) ;
    - remettre le trophee « a decouvrir » (mb-trophees-<uid>) ;
    - le faire scintiller dans la vitrine (vt-vu).
  Methode : un premier chargement remplit la memoire du navigateur, on y remet l'ancien nom (comme chez
  un membre qui n'a jamais vu le nouveau), puis on recharge et on compte.
  Usage : node outils/verif/_essai-trophees-noms.mjs <sauvegarde.json> <dossier des captures>
*/
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';

// Nouveau nom -> ancien nom (l'inverse de _troNomActuel dans app.js)
const RENOMS = { 'Happy Feet': 'Pingouin, manchot & cousins', 'Vendée Globe': 'Oiseau pélagique', 'La Tête dans le sable': 'Grand ratite',
  'Pic noir pic noir pic noir': 'Pic noir', 'Jazz Club': 'Jaseur', 'Le Boucher': 'Pie-grièche', 'Jacquot': 'Perroquet exotique',
  'Batman': 'Engoulevent & cousins', 'Poids plume': 'Colibri', 'Cyrano': 'Toucan', 'Cyrano(céros)': 'Calao' };
const [fichier, S] = process.argv.slice(2);
const sauvegarde = JSON.parse(readFileSync(fichier, 'utf8'));
const MEMBRES = Object.entries(sauvegarde.data.leagues['merlin-bird']._subs.members).map(([id, m]) => ({ id, data: m._data }));
// Un membre qui a un pingouin, un manchot ou un cousin (genres approches, seulement pour choisir qui essayer)
const PINGOUINS = /^(alca|fratercula|uria|cepphus|alle|aptenodytes|pygoscelis|eudyptes|spheniscus|eudyptula|megadyptes)$/;
const moi = MEMBRES.find(m => (m.data.species || []).some(e => PINGOUINS.test(String(e.s || '').toLowerCase().split(' ')[0]))) || MEMBRES[0];
console.log('membre essaye :', moi.data.name);

const BASE = 'https://www.gstatic.com/firebasejs/10.12.5/';
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
function pageHtml(){
  let html = readFileSync(join(RACINE, 'index.html'), 'utf8');
  const carte = { imports: { [BASE + 'firebase-app.js']: '/bouchons/firebase-app.js', [BASE + 'firebase-auth.js']: '/bouchons/firebase-auth.js', [BASE + 'firebase-firestore.js']: '/bouchons/firebase-firestore.js' } };
  const ancre = '<meta charset="utf-8">';
  html = html.replace(ancre, ancre + '\n<script type="importmap">' + JSON.stringify(carte) + '</script>');
  return html.replace(/(app\.js|styles\.css)\?v=\d+/g, '$1');
}
const srv = createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const envoyer = (corps, type) => { res.writeHead(200, { 'content-type': type }); res.end(corps); };
  try{
    if(u === '/' || u === '/index.html') return envoyer(pageHtml(), 'text/html; charset=utf-8');
    if(u.startsWith('/bouchons/')) return envoyer(readFileSync(join(RACINE, 'outils', 'verif', u.slice(1))), 'text/javascript');
    const f = join(RACINE, u.replace(/^\/+/, ''));
    if(!existsSync(f)){ res.writeHead(404); return res.end(); }
    return envoyer(readFileSync(f), TYPES[extname(f)] || 'application/octet-stream');
  }catch(e){ res.writeHead(500); res.end(String(e.message)); }
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const url = 'http://127.0.0.1:' + srv.address().port + '/';

async function charger(page){
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 20000 });
  await page.evaluate(id => window.__auth.connecter(id), moi.id);
  await page.evaluate(m => window.__fs.livrer('leagues/merlin-bird/members', m), MEMBRES);
  for(const c of ['votes', 'reactions', 'photos', 'trophyEvents']) await page.evaluate(c => window.__fs.livrer('leagues/merlin-bird/' + c, []), c);
}
async function ouvrirTrophees(page){
  await page.evaluate(() => { const t = document.querySelector('.tab[data-view="trophies"]') || document.querySelector('[data-view="trophies"]'); t?.click(); });
  await page.waitForSelector('#vitrine .vt-case', { timeout: 20000 });
  await page.waitForTimeout(3000);
  // Depuis le 10/11, toucher un trophee ouvre sa liste : l'essai (« comme si gagne ») passe par ce bouton
  if(await page.locator('#vtEssai').getAttribute('aria-pressed') !== 'true'){ await page.locator('#vtEssai').click(); await page.waitForTimeout(400); }
}
const lire = (page, cle) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), cle);
const ecrireLS = (page, cle, v) => page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [cle, v]);

// Une case se retrouve par sa place dans la ligne : en attente, sa plaque dit « Touche pour debloquer »
const indice = (page, nom) => page.$$eval('#vitrine .vt-case', (cs, n) => cs.findIndex(c => c.querySelector('.vt-nom')?.textContent === n), nom);
async function allumer(page, nom){
  const c = page.locator('#vitrine .vt-case').nth(await indice(page, nom));
  for(let i = 0; i < 2 && await c.evaluate(e => e.classList.contains('vt-manque') || /attend/.test(e.className)); i++){
    await c.scrollIntoViewIfNeeded(); await c.click(); await page.waitForTimeout(i ? 5500 : 800);
  }
  return c;
}
async function photo(page, c, fichier){ await c.scrollIntoViewIfNeeded(); await page.waitForTimeout(500); await c.screenshot({ path: S + '/' + fichier + '.png' }); }
// Remet en memoire un ancien nom a la place de Happy Feet, sur des copies des etats du 1er chargement
async function memoire(page, comp0, tro0, versAncien){
  const r = n => n in RENOMS ? versAncien(n) : n, comp = structuredClone(comp0), tro = structuredClone(tro0);
  for(const uid in comp.unlocked) comp.unlocked[uid] = comp.unlocked[uid].map(r);
  comp.holders = Object.fromEntries(Object.entries(comp.holders || {}).map(([n, h]) => [r(n), h]));
  await ecrireLS(page, 'mb-comp-state', comp);
  tro.vus = tro.vus.map(r); tro.attente = (tro.attente || []).map(r);
  await ecrireLS(page, 'mb-trophees-' + moi.id, tro);
}
async function bilan(page, titre){
  const fil = await page.evaluate(() => window.__ecritures.filter(e => e.includes('trophyEvents')));
  const tro = await lire(page, 'mb-trophees-' + moi.id);
  console.log(titre, '| ecritures dans le Fil :', fil.length, fil.map(e => e.split('/').pop()).join(' ; '), '| a decouvrir :', JSON.stringify(tro?.attente || []));
}

const nav = await chromium.launch();
const erreurs = [];
{
  const ctx = await nav.newContext({ viewport: { width: 1400, height: 950 }, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push(String(e).slice(0, 200)));
  // 1er chargement : remplit mb-comp-state et mb-trophees-<uid> sous les noms actuels
  await charger(page); await page.waitForTimeout(16000);
  const comp = await lire(page, 'mb-comp-state'), tro = await lire(page, 'mb-trophees-' + moi.id);
  console.log('1er chargement | memoire remplie :', !!comp?.unlocked, !!tro?.vus);
  for(const n in RENOMS) console.log('  ' + n + ' : detenteurs', (comp?.holders?.[n] || []).length, '| ' + moi.data.name + ' l a :', !!comp?.unlocked?.[moi.id]?.includes(n));
  // Controle : des anciens noms que la table ne connait pas. L'essai doit VOIR le defaut (ecritures + a decouvrir).
  await memoire(page, comp, tro, n => 'Inconnu ' + n);
  await charger(page); await page.waitForTimeout(16000);
  await bilan(page, 'controle (noms inconnus, defaut attendu)');
  // Le vrai cas : les anciens noms des trophees
  await memoire(page, comp, tro, n => RENOMS[n]);
  await charger(page); await page.waitForTimeout(16000);
  await bilan(page, 'ancien nom (rien attendu)        ');
  // Captures : Pic noir, Oiseau pelagique, Happy Feet, Calao allumes
  await ouvrirTrophees(page);
  for(const nom of ['Pic noir pic noir pic noir', 'Vendée Globe', 'Happy Feet', 'La Tête dans le sable', 'Cyrano(céros)', 'Jazz Club', 'Gargantua', 'Magellan']){
    const c = await allumer(page, nom);
    await photo(page, c, 'ordi-' + nom.replace(/\W+/g, '-'));
  }
  await ctx.close();
}
{
  const ctx = await nav.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push('telephone : ' + String(e).slice(0, 200)));
  await charger(page); await page.waitForTimeout(1500); await ouvrirTrophees(page);
  for(const nom of ['Pic noir pic noir pic noir', 'Vendée Globe', 'La Tête dans le sable', 'Cyrano(céros)', 'Jazz Club', 'Gargantua', 'Magellan']){
    const c = await allumer(page, nom);
    await photo(page, c, 'tel-' + nom.replace(/\W+/g, '-'));
  }
  console.log('telephone | debordement :', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await ctx.close();
}
console.log('erreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close(); srv.close();

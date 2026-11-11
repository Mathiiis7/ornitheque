/* Essai du 09/11 (pas un banc) : le trophee des canards dans la vitrine, place de chacun et ses trois
   niveaux un par un, ordinateur et telephone ; plaque de La Garde de Nuit.
   Sert aussi aux autres trophees de la ligue a 3 niveaux (4e argument, le nom sur la plaque).
   Usage : node outils/verif/_essai-canards.mjs <sauvegarde.json> <dossier des captures> [nom du trophee] */
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';

// Nouveau nom -> ancien nom (l'inverse de _troNomActuel dans app.js)
const RENOMS = { 'Happy Feet': 'Pingouin, manchot & cousins', 'Vendée Globe': 'Oiseau pélagique', 'La Tête dans le sable': 'Grand ratite',
  'Pic noir pic noir pic noir': 'Pic noir', 'Jazz Club': 'Jaseur' };
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
}
const lire = (page, cle) => page.evaluate(k => JSON.parse(localStorage.getItem(k) || 'null'), cle);
const ecrireLS = (page, cle, v) => page.evaluate(([k, v]) => localStorage.setItem(k, JSON.stringify(v)), [cle, v]);

// --- Le trophee des canards : place de chacun, puis ses trois niveaux un par un ---
const TROPHEE = process.argv[4] || 'La Bande à Picsou';
const nav = await chromium.launch();
const erreurs = [];
for(const [larg, haut, mobile, nom] of [[1400, 950, false, 'ordi'], [390, 844, true, 'tel']]){
  const ctx = await nav.newContext({ viewport: { width: larg, height: haut }, isMobile: mobile, hasTouch: mobile, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push(nom + ' : ' + String(e).slice(0, 200)));
  await charger(page); await page.waitForTimeout(1500); await ouvrirTrophees(page);
  // La liste des oiseaux au toucher (10/11) : titre, compte Monde puis France, coches
  for(const t of ['Armée d\'aigles royaux', 'La Garde de Nuit', 'La Bande à Picsou', 'Les 40 Voleurs', 'Vendée Globe', 'Pic noir pic noir pic noir', 'Gargantua', 'Magellan', 'Écologue 100', 'Terroir', 'National Geographic']){
    const i = await page.$$eval('#vitrine .vt-case', (cs, n) => cs.findIndex(c => c.querySelector('.vt-nom')?.textContent === n), t);
    const x = page.locator('#vitrine .vt-case').nth(i);
    const bulle = await x.evaluate(e => e.querySelector('.vt-nom').dataset.tip || '');
    await x.scrollIntoViewIfNeeded(); await x.click(); await page.waitForTimeout(500);
    const lire = () => page.evaluate(() => ({ ouvert: document.querySelector('#trophyModal').classList.contains('open'), titre: document.querySelector('#tmodalTitle').textContent,
      note: document.querySelector('.tmodal-country-body .tmodal-note')?.textContent || '-', coches: document.querySelectorAll('.tmodal-country-body li.own').length,
      total: document.querySelectorAll('.tmodal-country-body li').length }));
    const m = await lire();
    // Les exploits (continents) n'ont pas de bascule Monde / France
    if(await page.locator('#tmodalBody .tro-cc-chip[data-cc="fr"]').count()){ await page.locator('#tmodalBody .tro-cc-chip[data-cc="fr"]').click(); await page.waitForTimeout(300); }
    const f = await lire();
    if(!mobile) console.log(t + ' | ouvert ' + m.ouvert + ' | ' + m.note + ' (' + m.coches + ' coches / ' + m.total + ') | ' + f.note + ' (' + f.coches + ' / ' + f.total + ') | bulle : ' + bulle.slice(-14));
    if(t === 'La Bande à Picsou' || t === 'Magellan') await page.locator('#trophyModal .tmodal, #trophyModal > *').first().screenshot({ path: S + '/' + nom + '-liste-' + t.replace(/\W+/g, '-') + '.png' });
    await page.locator('#tmodalX').click(); await page.waitForTimeout(300);
  }
  console.log(nom, '| fenetre fermee :', !(await page.evaluate(() => document.querySelector('#trophyModal').classList.contains('open'))),
    '| bouton Essai :', await page.locator('#vtEssai').evaluate(b => Math.round(b.getBoundingClientRect().height) + ' px de haut, ' + getComputedStyle(b).fontSize));
  await page.locator('#vtEssai').click(); await page.waitForTimeout(500);
  const indice = n => page.$$eval('#vitrine .vt-case', (cs, n) => cs.findIndex(c => c.querySelector('.vt-nom')?.textContent === n), n);
  const ligue = await page.$$eval('#vitrine .vt-case', cs => cs.slice(0, 14).map(c => c.querySelector('.vt-nom').textContent + ' : ' + (c.querySelector('.vt-nom').dataset.tip || '-')));
  if(!mobile) console.log('trophees de la ligue (' + moi.data.name + ') :\n  ' + ligue.join('\n  '));
  const c = page.locator('#vitrine .vt-case').nth(await indice(TROPHEE));
  const niveau = () => c.evaluate(e => e.classList.contains('vt-manque') ? 0 : +e.querySelector('canvas.vt-image').dataset.niveau);
  // On repart de zero : un trophee complet s'eteint au toucher
  for(let i = 0; i < 8 && await niveau() !== 0; i++){ await c.scrollIntoViewIfNeeded(); await c.click(); await page.waitForTimeout(400); }
  const suite = [];
  for(let i = 0; i < 6; i++){
    await c.scrollIntoViewIfNeeded(); await c.click(); await page.waitForTimeout(5500);
    const n = await niveau(), attend = await c.evaluate(e => e.classList.contains('vt-attend'));
    suite.push(n + (attend ? ' (a debloquer)' : ''));
    if(!attend) await c.screenshot({ path: S + '/' + nom + '-niveau-' + n + '.png' });
    if(n === 3 && !attend) break;
  }
  console.log(nom, '| niveaux successifs :', suite.join(' -> '));
  const nuit = page.locator('#vitrine .vt-case').nth(await indice('La Garde de Nuit'));
  await nuit.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  await nuit.screenshot({ path: S + '/' + nom + '-garde-de-nuit.png' });
  if(mobile) console.log('telephone | debordement :', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await ctx.close();
}
console.log('erreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close(); srv.close();

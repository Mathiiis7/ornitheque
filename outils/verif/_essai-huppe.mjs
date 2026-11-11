/* Essai du 11/11 (pas un banc) : le trophee unique « Fixation béton » (la huppe). Pour un membre qui a vu une huppe
   et le Pic noir : la case suit celle du Pic noir, arrive « a debloquer » (trophee neuf), se debloque au toucher,
   puis le toucher ouvre la liste des huppes. Bouchons, rien n'est ecrit.
   Usage : node outils/verif/_essai-huppe.mjs <sauvegarde.json> <dossier des captures> [nom du membre] */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';

const [fichier, S, QUI = 'Paul'] = process.argv.slice(2);
mkdirSync(S, { recursive: true });
const sauvegarde = JSON.parse(readFileSync(fichier, 'utf8'));
const MEMBRES = Object.entries(sauvegarde.data.leagues['merlin-bird']._subs.members).map(([id, m]) => ({ id, data: m._data }));
const moi = MEMBRES.find(m => m.data.name === QUI);
const ID = 'u-Fixation béton';

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
  for(const c of ['reactions', 'trophyEvents', 'votes', 'photos']) await page.evaluate(c => window.__fs.livrer('leagues/merlin-bird/' + c, []), c);
  await page.evaluate(() => document.querySelector('.tab[data-view="trophies"]')?.click());
  await page.waitForSelector('#vitrine .vt-case', { timeout: 20000 }); await page.waitForTimeout(2500);
}
const nav = await chromium.launch();
const erreurs = [];
for(const [larg, haut, mobile, nom] of [[1400, 950, false, 'ordi'], [390, 844, true, 'tel']]){
  const ctx = await nav.newContext({ viewport: { width: larg, height: haut }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push(nom + ' : ' + String(e).slice(0, 200)));
  await charger(page);
  // Tout le reste deja vu (niveau 3), la huppe jamais rencontree : le navigateur d'un membre avant cette mise a jour
  await page.evaluate(([uid, id]) => { const vu = {}; document.querySelectorAll('#vitrine .vt-case').forEach(c => { if(c.dataset.id !== id) vu[c.dataset.id] = 3; });
    localStorage.setItem('vt-vu', JSON.stringify({ [uid]: vu })); }, [moi.id, ID]);
  await charger(page);
  const ids = await page.$$eval('#vitrine .vt-case', cs => cs.map(c => c.dataset.id));
  const i = ids.indexOf(ID);
  console.log(`\n== ${nom} | ${moi.data.name} | avant : ${ids[i - 1]} | apres : ${ids[i + 1]}`);
  const c = page.locator(`#vitrine .vt-case[data-id="${ID}"]`);
  await c.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
  console.log('   a debloquer :', await c.evaluate(e => e.classList.contains('vt-attend')), '| en attente :', (await page.$$eval('#vitrine .vt-attend', l => l.map(e => e.dataset.id))).join(', '));
  await c.click(); await page.waitForTimeout(4500);
  console.log('   apres toucher :', await c.evaluate(e => e.classList.contains('vt-attend') ? 'attend encore' : 'debloque'));
  const b = await c.boundingBox();
  await page.screenshot({ path: S + '/' + nom + '-huppe.png', clip: { x: Math.max(0, b.x - b.width), y: Math.max(0, b.y - 20), width: Math.min(larg - Math.max(0, b.x - b.width), b.width * 3), height: b.height + 40 } });
  await c.click(); await page.waitForTimeout(600);
  console.log('   fenetre :', await page.textContent('#tmodalTitle'), '|', (await page.textContent('#tmodalBody .tmodal-country-body .tmodal-note'))?.trim());
  await ctx.close();
}
console.log('\nerreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close(); srv.close();

/* Essai du 11/11 (pas un banc) : un trophee neuf arrive « a debloquer », et _VT_REMIS remet a 0, une seule fois,
   les limicoles et echassiers que la v1099 avait debloques d'office. Bouchons, rien n'est ecrit nulle part.
   Scenario, connecte comme un membre sur le podium des deux : son navigateur a deja range limicoles et echassiers
   comme vus (le defaut de la v1099) -> ils doivent attendre ; on touche les limicoles -> debloques ; on recharge ->
   les limicoles restent debloques (la remise ne joue qu'une fois), les echassiers attendent toujours.
   Usage : node outils/verif/_essai-remis.mjs <sauvegarde.json> [nom du membre] */
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';

const [fichier, QUI = 'Maël M'] = process.argv.slice(2);
const sauvegarde = JSON.parse(readFileSync(fichier, 'utf8'));
const MEMBRES = Object.entries(sauvegarde.data.leagues['merlin-bird']._subs.members).map(([id, m]) => ({ id, data: m._data }));
const moi = MEMBRES.find(m => m.data.name === QUI);
console.log('connecte comme', moi.data.name);

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
  await page.evaluate(() => { const t = document.querySelector('.tab[data-view="trophies"]'); t?.click(); });
  await page.waitForSelector('#vitrine .vt-case', { timeout: 20000 });
  await page.waitForTimeout(2500);
}
const etat = page => page.evaluate(uid => {
  const vu = (JSON.parse(localStorage.getItem('vt-vu') || '{}') || {})[uid] || {};
  return ['limicoles', 'echassiers'].map(id => { const c = document.querySelector('#vitrine .vt-case[data-id="' + id + '"]');
    return id + ' : ' + (c?.classList.contains('vt-attend') ? 'A DEBLOQUER' : 'debloque') + ', vu ' + vu[id] + ', remis ' + vu[id + ':remis']; }).join(' | ');
}, moi.id);

const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1400, height: 950 }, locale: 'fr-FR', serviceWorkers: 'block' });
const page = await ctx.newPage();
const erreurs = []; page.on('pageerror', e => erreurs.push(String(e).slice(0, 200)));
// Le navigateur tel que la v1099 l'a laisse : limicoles et echassiers vus au niveau 3, sans marque de remise
await page.addInitScript(uid => { if(!localStorage.getItem('vt-vu')) localStorage.setItem('vt-vu', JSON.stringify({ [uid]: { limicoles: 3, echassiers: 3 } })); }, moi.id);
await charger(page);
console.log('1. apres la mise a jour :', await etat(page));
const c = page.locator('#vitrine .vt-case[data-id="limicoles"]');
await c.scrollIntoViewIfNeeded(); await c.click(); await page.waitForTimeout(4000);
console.log('2. limicoles touche     :', await etat(page));
await charger(page);
console.log('3. apres rechargement   :', await etat(page));
console.log('erreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close(); srv.close();

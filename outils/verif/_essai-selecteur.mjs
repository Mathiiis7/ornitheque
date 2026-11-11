// Essai du selecteur de personne de la vitrine (08/11) : ouvre la liste, choisit un autre membre,
// verifie que la vitrine et le libelle changent, et que les jetons de noms sont masques.
// Usage : node outils/verif/_essai-selecteur.mjs <sauvegarde.json> <capture.png>
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';
const [fichier, capture] = process.argv.slice(2);
const MEMBRES = Object.entries(JSON.parse(readFileSync(fichier, 'utf8')).data.leagues['merlin-bird']._subs.members).map(([id, m]) => ({ id, data: m._data }));
const moi = MEMBRES.find(m => m.data.name === 'Mathis') || MEMBRES[0];
const BASE = 'https://www.gstatic.com/firebasejs/10.12.5/';
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const srv = createServer((req, res) => {
  const u = decodeURIComponent(req.url.split('?')[0]);
  const ok = (c, t) => { res.writeHead(200, { 'content-type': t }); res.end(c); };
  if(u === '/' || u === '/index.html'){
    const carte = { imports: { [BASE + 'firebase-app.js']: '/bouchons/firebase-app.js', [BASE + 'firebase-auth.js']: '/bouchons/firebase-auth.js', [BASE + 'firebase-firestore.js']: '/bouchons/firebase-firestore.js' } };
    const html = readFileSync(join(RACINE, 'index.html'), 'utf8').replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script type="importmap">' + JSON.stringify(carte) + '</script>').replace(/(app\.js|styles\.css)\?v=\d+/g, '$1');
    return ok(html, 'text/html; charset=utf-8');
  }
  if(u.startsWith('/bouchons/')) return ok(readFileSync(join(RACINE, 'outils', 'verif', u.slice(1))), 'text/javascript');
  const f = join(RACINE, u.replace(/^\/+/, ''));
  if(!existsSync(f)){ res.writeHead(404); return res.end(); }
  ok(readFileSync(f), TYPES[extname(f)] || 'application/octet-stream');
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const nav = await chromium.launch();
const page = await nav.newPage({ viewport: { width: 1400, height: 950 } });
const erreurs = []; page.on('pageerror', e => erreurs.push(String(e).slice(0, 200)));
await page.goto('http://127.0.0.1:' + srv.address().port + '/', { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 20000 });
await page.evaluate(id => window.__auth.connecter(id), moi.id);
await page.evaluate(m => window.__fs.livrer('leagues/merlin-bird/members', m), MEMBRES);
for(const c of ['votes', 'reactions', 'photos', 'trophyEvents']) await page.evaluate(c => window.__fs.livrer('leagues/merlin-bird/' + c, []), c);
await page.waitForTimeout(1500);
await page.evaluate(() => document.querySelector('.tab[data-view="trophies"]')?.click());
await page.waitForSelector('#vtPersonne', { timeout: 20000 });
const lire = () => page.evaluate(() => ({ bouton: document.querySelector('#vtPersonne .cp-btn-label').textContent, titre: document.querySelector('.vt-tete h3').textContent,
  jetons: getComputedStyle(document.querySelector('#trophyWho')).display }));
console.log('avant :', JSON.stringify(await lire()));
await page.click('#vtPersonne'); await page.waitForSelector('.cp-modal-backdrop .cp-item');
const noms = await page.locator('.cp-modal-backdrop .cp-item').allTextContents();
console.log('liste :', noms.map(n => n.replace(/\s+/g, ' ').trim()).join(' | '));
await page.locator('.cp-modal-backdrop .cp-item', { hasText: 'Maël' }).click(); await page.waitForTimeout(2500);
console.log('apres avoir choisi Maël :', JSON.stringify(await lire()), '| erreurs :', erreurs.length, erreurs.join(' | '));
await page.locator('#vitrine').screenshot({ path: capture });
await nav.close(); srv.close();

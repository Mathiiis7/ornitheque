/* Essai du 10/11 (pas un banc) : le trophee Terroir en calques dans la vitrine. Les regions deja vues, puis une
   region ajoutee en mode Essai, qui apparait avec son animation ; la fenetre et sa liste ; ordinateur et telephone.
   Usage : node outils/verif/_essai-terroir.mjs <sauvegarde.json> <dossier des captures> */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';

const [fichier, S] = process.argv.slice(2);
mkdirSync(S, { recursive: true });
const sauvegarde = JSON.parse(readFileSync(fichier, 'utf8'));
const MEMBRES = Object.entries(sauvegarde.data.leagues['merlin-bird']._subs.members).map(([id, m]) => ({ id, data: m._data }));
const moi = MEMBRES[0], autre = MEMBRES[1], tiers = MEMBRES.slice(2, 5);
console.log('moi :', moi.data.name, '| autre :', autre.data.name, '| votants :', tiers.map(m => m.data.name).join(', '));
const vote = (trophy, target, voter) => ({ id: trophy + '__' + target + '__' + voter, data: { trophy, target, voter } });
// Le Necrophile valide pour « autre » (3 votes), le kimono a 1 vote
const VOTES = [...tiers.map(m => vote('necrophile', autre.id, m.id)), vote('kimono', autre.id, tiers[0].id)];

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
    if(u === '/app.js' && process.env.APPJS) return envoyer(readFileSync(process.env.APPJS), 'text/javascript');   // tester une autre version d'app.js
    if(u.startsWith('/bouchons/')) return envoyer(readFileSync(join(RACINE, 'outils', 'verif', u.slice(1))), 'text/javascript');
    const f = join(RACINE, u.replace(/^\/+/, ''));
    if(!existsSync(f)){ res.writeHead(404); return res.end(); }
    return envoyer(readFileSync(f), TYPES[extname(f)] || 'application/octet-stream');
  }catch(e){ res.writeHead(500); res.end(String(e.message)); }
});
await new Promise(r => srv.listen(0, '127.0.0.1', r));
const url = 'http://127.0.0.1:' + srv.address().port + '/';

const livrerVotes = (page, v) => page.evaluate(v => window.__fs.livrer('leagues/merlin-bird/votes', v), v);
async function charger(page){
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 20000 });
  await page.evaluate(id => window.__auth.connecter(id), moi.id);
  await page.evaluate(m => window.__fs.livrer('leagues/merlin-bird/members', m), MEMBRES);
  for(const c of ['reactions', 'trophyEvents']) await page.evaluate(c => window.__fs.livrer('leagues/merlin-bird/' + c, []), c);
  // 3 photos de « autre », sans coeur : National Geographic doit en compter 3 (100 photos postees, 10/11)
  await page.evaluate(id => window.__fs.livrer('leagues/merlin-bird/photos', [1, 2, 3].map(i => ({ id: 'ph' + i, data: { uid: id, sci: 'pica pica', createdAt: { toMillis: () => i } } }))), autre.id);
  await livrerVotes(page, VOTES);
}
async function ouvrirTrophees(page){
  await page.evaluate(() => { const t = document.querySelector('.tab[data-view="trophies"]') || document.querySelector('[data-view="trophies"]'); t?.click(); });
  await page.waitForSelector('#vitrine .vt-case', { timeout: 20000 });
  await page.waitForTimeout(2500);
}
const caseDe = async (page, nom) => page.locator('#vitrine .vt-case').nth(await page.$$eval('#vitrine .vt-case', (cs, n) => cs.findIndex(c => c.dataset.id === (n.startsWith('x-') ? n : 'e-' + n)), nom));
// Toucher un trophee ; s'il attend son animation, on la laisse jouer puis on retouche
async function ouvrir(page, nom){
  let c = await caseDe(page, nom);
  await c.scrollIntoViewIfNeeded();
  if(await c.evaluate(e => e.classList.contains('vt-attend'))){ await c.click(); await page.waitForTimeout(3500); c = await caseDe(page, nom); }
  await c.click(); await page.waitForTimeout(400);
}
const fenetre = page => page.evaluate(() => ({ ouvert: document.querySelector('#trophyModal').classList.contains('open'), titre: document.querySelector('#tmodalTitle').textContent,
  notes: [...document.querySelectorAll('#tmodalBody .tmodal-note')].map(p => p.textContent).join(' / '),
  bouton: document.querySelector('#tmodalBody .vt-vote-btn')?.textContent || '-' }));
const fermer = async page => { await page.locator('#tmodalX').click(); await page.waitForTimeout(300); };

const nav = await chromium.launch();
const erreurs = [];
for(const [larg, haut, mobile, nom] of [[1400, 950, false, 'ordi'], [390, 844, true, 'tel']]){
  const ctx = await nav.newContext({ viewport: { width: larg, height: haut }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push(nom + ' : ' + String(e).slice(0, 200)));
  page.on('console', m => { if(m.type() === 'warning' && /vitrine/.test(m.text())) erreurs.push(nom + ' : ' + m.text().slice(0, 200)); });
  await charger(page); await page.waitForTimeout(1500); await ouvrirTrophees(page);
  await page.evaluate(id => document.querySelector('#trophyWho .whochip[data-id="' + id + '"]').click(), autre.id); await page.waitForTimeout(1500);
  const t = await caseDe(page, 'x-terroir');
  const etat = () => t.evaluate(e => ({ manque: e.classList.contains('vt-manque'), calques: e.querySelector('canvas.vt-image').dataset.calques, nom: e.querySelector('.vt-nom').textContent, bulle: e.querySelector('.vt-nom').dataset.tip }));
  console.log(nom, '| Terroir de ' + autre.data.name + ' :', JSON.stringify(await etat()));
  await t.scrollIntoViewIfNeeded(); await page.waitForTimeout(1500);
  await t.screenshot({ path: S + '/' + nom + '-terroir-avant.png' });
  // La fenetre : la liste des regions et leurs aliments
  await t.click(); await page.waitForTimeout(500);
  console.log(nom, '| fenetre :', await page.evaluate(() => document.querySelector('#tmodalBody .tmodal-country-body .tmodal-note')?.textContent + ' | ' + [...document.querySelectorAll('#tmodalBody li')].slice(0, 4).map(l => l.textContent).join(' ; ')));
  await page.locator('#tmodalX').click(); await page.waitForTimeout(300);
  // Essai : la region suivante apparait (chez un autre membre, tout de suite, avec l'animation)
  await page.locator('#vtEssai').click(); await page.waitForTimeout(400);
  const t2 = await caseDe(page, 'x-terroir'); await t2.scrollIntoViewIfNeeded(); await t2.click(); await page.waitForTimeout(700);
  const t3 = await caseDe(page, 'x-terroir');
  console.log(nom, '| pendant l animation : calque neuf ' + await t3.evaluate(e => !!e.querySelector('canvas.vt-nouveau')) + ', calques avant ' + await t3.evaluate(e => e.querySelector('canvas.vt-image').dataset.calquesAvant));
  await page.waitForTimeout(3500);
  console.log(nom, '| apres :', JSON.stringify(await etat()));
  await t3.screenshot({ path: S + '/' + nom + '-terroir-apres.png' });
  // Toutes les regions, pour voir le plateau complet
  for(let i = 0; i < 13; i++){ const c = await caseDe(page, 'x-terroir'); if(await c.evaluate(e => e.querySelector('canvas.vt-image').dataset.calques.split(',').filter(Boolean).length) >= 13) break; await c.click(); await page.waitForTimeout(250); }
  await page.waitForTimeout(3500);
  const tc = await caseDe(page, 'x-terroir'); console.log(nom, '| complet :', JSON.stringify(await tc.evaluate(e => e.querySelector('canvas.vt-image').dataset.calques)));
  await tc.screenshot({ path: S + '/' + nom + '-terroir-complet.png' });
  if(mobile) console.log('telephone | debordement :', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await ctx.close();
}
console.log('erreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close(); srv.close();

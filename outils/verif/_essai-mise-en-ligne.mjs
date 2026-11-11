/* Essai du 10/11 (pas un banc) : la vitrine telle qu'elle partira en ligne, servie sur [::1] (ni localhost ni
   127.0.0.1 : le bouton Essai doit disparaitre). Verifie : aucune image de la vitrine au demarrage, aucune annonce
   dans le Fil au premier passage apres la mise a jour (etat d'avant sans version), et chacun arrive avec tous ses
   trophees gagnes « a debloquer ». Usage : node outils/verif/_essai-mise-en-ligne.mjs <sauvegarde.json> <dossier> */
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
await new Promise(r => srv.listen(0, '::1', r));
const url = 'http://[::1]:' + srv.address().port + '/';

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
const ctx = await nav.newContext({ viewport: { width: 1400, height: 950 }, locale: 'fr-FR', serviceWorkers: 'block' });
// L'etat des annonces d'AVANT la mise a jour : sans version, et sans les trophees neufs
await ctx.addInitScript(id => { try{ localStorage.setItem('mb-comp-state', JSON.stringify({ unlocked: { [id]: ['Happy Feet'] }, holders: {}, topRank: {} })); }catch(_){} }, moi.id);
const page = await ctx.newPage();
page.on('pageerror', e => erreurs.push(String(e).slice(0, 200)));
const images = []; page.on('request', r => { if(r.url().includes('/assets/trophies/themes/')) images.push(r.url()); });
await charger(page); await page.waitForTimeout(16000);
console.log('au demarrage, images de la vitrine telechargees :', images.length, images.map(u => u.split('/themes/')[1]).join(' '));
console.log('annonces ecrites au premier passage :', await page.evaluate(() => window.__ecritures.filter(e => /trophyEvents/.test(e)).length),
  '| etat enregistre, version :', await page.evaluate(() => JSON.parse(localStorage.getItem('mb-comp-state') || '{}').version));
await ouvrirTrophees(page); await page.waitForTimeout(3000);
const r = await page.evaluate(() => ({ essai: !!document.querySelector('#vtEssai'), aide: document.querySelector('#vitrine .vt-commandes .help')?.textContent,
  attend: document.querySelectorAll('#vitrine .vt-case.vt-attend').length, allumes: document.querySelectorAll('#vitrine .vt-case:not(.vt-manque)').length,
  plaques: [...document.querySelectorAll('#vitrine .vt-case.vt-attend .vt-nom')].slice(0, 3).map(n => n.textContent) }));
console.log('bouton Essai :', r.essai, '| aide :', r.aide);
console.log('trophees a debloquer :', r.attend, '| deja allumes :', r.allumes, '| plaques :', r.plaques.join(' / '));
console.log('images telechargees, onglet ouvert :', images.length);
await page.locator('#vitrine .vt-vitrine').screenshot({ path: S + '/arrivee.png' });
// Debloquer le premier : il s'allume, les autres attendent toujours
const c = page.locator('#vitrine .vt-case.vt-attend').first(); const id = await c.getAttribute('data-id');
await c.scrollIntoViewIfNeeded(); await c.click(); await page.waitForTimeout(3500);
console.log('apres un toucher sur', id, ': a debloquer', await page.evaluate(() => document.querySelectorAll('#vitrine .vt-case.vt-attend').length),
  '| allume :', await page.evaluate(i => !document.querySelector('#vitrine .vt-case[data-id="' + i + '"]').classList.contains('vt-manque'), id));
// Controle : le meme etat, mais deja a la version 2. L'essai doit alors VOIR les annonces (sinon il ne prouve rien)
const ctx2 = await nav.newContext({ viewport: { width: 1400, height: 950 }, locale: 'fr-FR', serviceWorkers: 'block' });
await ctx2.addInitScript(id => { try{ localStorage.setItem('mb-comp-state', JSON.stringify({ unlocked: { [id]: ['Happy Feet'] }, holders: {}, topRank: {}, version: 2 })); }catch(_){} }, moi.id);
const p2 = await ctx2.newPage(); await charger(p2); await p2.waitForTimeout(16000);
console.log('controle (etat deja a la version 2) : annonces ecrites', await p2.evaluate(() => window.__ecritures.filter(e => /trophyEvents/.test(e)).length));
console.log('erreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close(); srv.close();

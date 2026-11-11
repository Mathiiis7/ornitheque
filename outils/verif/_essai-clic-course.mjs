/* Essai du 11/11 (pas un banc) : dans la fenetre d'un trophee de la ligue, toucher la course d'un autre joueur coche
   SES oiseaux dans la liste du dessous ; toucher sa propre courbe revient aux siens. Bouchons, rien n'est ecrit.
   Usage : node outils/verif/_essai-clic-course.mjs <sauvegarde.json> <dossier des captures> [nom du membre] [trophee] */
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';

const [fichier, S, QUI = 'Maël M', TRO = 'limicoles'] = process.argv.slice(2);
mkdirSync(S, { recursive: true });
const sauvegarde = JSON.parse(readFileSync(fichier, 'utf8'));
const MEMBRES = Object.entries(sauvegarde.data.leagues['merlin-bird']._subs.members).map(([id, m]) => ({ id, data: m._data }));
const moi = MEMBRES.find(m => m.data.name === QUI);

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

// Un point d'une courbe (a 95 % de son trace), en pixels de la page : le SVG va de 0 a 1000, etire sur la boite
const pointDe = (page, sel) => page.evaluate(sel => {
  const p = document.querySelector(sel), plot = p.closest('.vt-co-plot'), r = plot.getBoundingClientRect();
  const q = p.getPointAtLength(p.getTotalLength() * 0.95);
  return { x: r.left + q.x / 1000 * r.width, y: r.top + q.y / 1000 * r.height };
}, sel);
const lire = page => page.evaluate(() => ({
  qui: document.querySelector('.vt-liste-qui')?.hidden ? '(cachee)' : document.querySelector('.vt-liste-qui')?.textContent,
  choisi: document.querySelectorAll('.st-autre.choisi').length,
  compte: document.querySelector('.tmodal-country-body .tmodal-note')?.textContent }));

const nav = await chromium.launch();
const erreurs = [];
for(const [larg, haut, mobile, nom] of [[1400, 950, false, 'ordi'], [390, 844, true, 'tel']]){
  const ctx = await nav.newContext({ viewport: { width: larg, height: haut }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  page.on('pageerror', e => erreurs.push(nom + ' : ' + String(e).slice(0, 200)));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 20000 });
  await page.evaluate(id => window.__auth.connecter(id), moi.id);
  await page.evaluate(m => window.__fs.livrer('leagues/merlin-bird/members', m), MEMBRES);
  for(const c of ['reactions', 'trophyEvents', 'votes', 'photos']) await page.evaluate(c => window.__fs.livrer('leagues/merlin-bird/' + c, []), c);
  // Deja vus : la vitrine ouvre la liste au toucher au lieu de jouer l'animation
  await page.evaluate(uid => localStorage.setItem('vt-vu', JSON.stringify({ [uid]: { limicoles: 3, echassiers: 3, aigles: 3, nuit: 3, canards: 3, mouettes: 3 } })), moi.id);
  await page.evaluate(() => document.querySelector('.tab[data-view="trophies"]')?.click());
  await page.waitForSelector('#vitrine .vt-case', { timeout: 20000 }); await page.waitForTimeout(2500);
  const c = page.locator(`#vitrine .vt-case[data-id="${TRO}"]`);
  await c.scrollIntoViewIfNeeded();
  if(await c.evaluate(e => e.classList.contains('vt-attend'))){ await c.click(); await page.waitForTimeout(4000); }
  await c.click(); await page.waitForTimeout(600);
  console.log(`\n== ${nom} | ${await page.textContent('#tmodalTitle')} | connecte comme ${moi.data.name}`);
  console.log('   au depart          :', JSON.stringify(await lire(page)));
  // Chaque autre courbe, une par une
  const n = await page.$$eval('.st-autre', l => l.length);
  for(let i = 0; i < Math.min(n, 3); i++){
    await page.locator('.vt-co-plot').scrollIntoViewIfNeeded();
    const p =await page.evaluate(i => { const l = document.querySelectorAll('.vt-co-plot .st-autre')[i], plot = l.closest('.vt-co-plot'), r = plot.getBoundingClientRect();
      const q = l.getPointAtLength(l.getTotalLength() * 0.95); return { x: r.left + q.x / 1000 * r.width, y: r.top + q.y / 1000 * r.height }; }, i);
    if(mobile) await page.touchscreen.tap(p.x, p.y); else await page.mouse.click(p.x, p.y);
    await page.waitForTimeout(300);
    console.log(`   courbe grise ${i + 1}     :`, JSON.stringify(await lire(page)));
    if(i === 0){
      await page.locator('.tmodal-country-select .tro-cc-chip[data-cc="fr"]').click(); await page.waitForTimeout(300);
      console.log('   + puce En France   :', JSON.stringify(await lire(page)));
      await page.locator('.tmodal-country-select .tro-cc-chip[data-cc="monde"]').click(); await page.waitForTimeout(300);
      await page.locator('.vt-co-plot').scrollIntoViewIfNeeded();
      if(!mobile) await page.locator('.vt-liste-qui').screenshot({ path: S + '/' + nom + '-qui.png' }).catch(() => {});
      await page.locator('#trophyModal .tmodal, #trophyModal > *').first().screenshot({ path: S + '/' + nom + '-clic-course.png' });
    }
  }
  const pl = await pointDe(page, '.vt-co-plot .st-lui');
  if(mobile) await page.touchscreen.tap(pl.x, pl.y); else await page.mouse.click(pl.x, pl.y);
  await page.waitForTimeout(300);
  console.log('   sa propre courbe   :', JSON.stringify(await lire(page)));
  if(mobile) console.log('   debordement :', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await ctx.close();
}
console.log('\nerreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close(); srv.close();

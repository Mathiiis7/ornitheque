/*
  Essai de la vitrine des trophees sur le VRAI site (2026-11-08) : app.js et styles.css du disque,
  Firebase bouchonne comme dans le banc « trophees », membres pris dans une sauvegarde locale de la
  ligue. Ouvre la page Trophees, verifie la vitrine, teste le clic et les pointilles, photographie.
  Rien ne sort sur le reseau. Pas un banc (tiret bas).

  Usage : node outils/verif/_essai-vitrine-site.mjs <sauvegarde.json> <dossier des captures> [nom du membre]
*/
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';

const [fichier, S, qui = 'Mathis'] = process.argv.slice(2);
const sauvegarde = JSON.parse(readFileSync(fichier, 'utf8'));
const MEMBRES = Object.entries(sauvegarde.data.leagues['merlin-bird']._subs.members).map(([id, m]) => ({ id, data: m._data }));
const moi = MEMBRES.find(m => m.data.name === qui) || MEMBRES[0];
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

async function essai(largeur, hauteur, mobile, nom){
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur }, isMobile: mobile, hasTouch: mobile, locale: 'fr-FR', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const erreurs = []; page.on('pageerror', e => erreurs.push(String(e).slice(0, 200)));
  page.on('console', m => { if(m.type() === 'warning' && m.text().includes('vitrine')) erreurs.push('avertissement : ' + m.text().slice(0, 200)); });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 20000 });
  await page.evaluate(id => window.__auth.connecter(id), moi.id);
  await page.evaluate(m => window.__fs.livrer('leagues/merlin-bird/members', m), MEMBRES);
  for(const c of ['votes', 'reactions', 'photos', 'trophyEvents']) await page.evaluate(c => window.__fs.livrer('leagues/merlin-bird/' + c, []), c);
  await page.waitForTimeout(1500);
  // Ouvrir Trophees (a l'ordinateur : l'onglet ; au telephone : la page Plus puis Trophees)
  await page.evaluate(() => { const t = document.querySelector('.tab[data-view="trophies"]') || document.querySelector('[data-view="trophies"]'); t?.click(); });
  await page.waitForSelector('#vitrine .vt-case', { timeout: 20000 });
  await page.waitForTimeout(4000);   // images et pointilles
  const bilan = await page.evaluate(() => ({
    cases: [...document.querySelectorAll('#vitrine .vt-case')].map(c => c.querySelector('.vt-nom').textContent + (c.classList.contains('vt-manque') ? ' (manque)' : '') + (c.querySelector('.vt-place') ? ' ' + c.querySelector('.vt-place').textContent : '')),
    ancienneGrilleVisible: getComputedStyle(document.querySelector('#trophyGrid')).display !== 'none',
    debordement: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    pointilles: document.querySelectorAll('#vitrine canvas.vt-pointilles').length,
  }));
  console.log(nom, '| erreurs :', erreurs.length, erreurs.join(' | '));
  console.log('  cases :', bilan.cases.join(' ; '));
  console.log('  ancienne grille visible :', bilan.ancienneGrilleVisible, '| debordement page :', bilan.debordement, '| calques de pointilles :', bilan.pointilles);
  await page.locator('#vitrine').screenshot({ path: S + '/site-' + nom + '.png' });
  if(!mobile){
    // Clic sur un trophee manquant puis bouton des pointilles
    const manque = page.locator('#vitrine .vt-case.vt-manque').first();
    const nomManque = await manque.locator('.vt-nom').textContent();
    // L'animation de deblocage (Poussiere d'or) sur un trophee simple, photographiee a plusieurs instants
    const cible = page.locator('#vitrine .vt-case', { hasText: nomManque });
    await cible.scrollIntoViewIfNeeded(); await cible.click();
    const t0 = Date.now();
    for(const ms of [150, 700, 1300, 2100]){
      await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
      if(ms === 150) console.log('  etincelles visibles a 150 ms :', await cible.evaluate(c => [...c.querySelectorAll('.vt-etincelle')].filter(e => +getComputedStyle(e).opacity > 0.05).length));
      await cible.screenshot({ path: S + '/anim-' + String(ms).padStart(4, '0') + '.png' });
    }
    await page.waitForTimeout(1600);
    console.log('  clic sur', nomManque, ':', await cible.evaluate(c => (c.classList.contains('vt-manque') ? 'eteint' : 'allume') + ', decors restants : ' + c.querySelectorAll('.vt-etincelle, .vt-halo, .vt-pointilles-sortants').length));
    // Trophee a niveaux : a chaque etape debloquee, seuls les pointilles de CETTE etape s'animent ; ceux
    // des etapes encore fermees restent sur le calque ordinaire, immobiles.
    const aigles = page.locator('#vitrine .vt-case', { hasText: "Armée d'aigles royaux" });
    const niveauDe = () => aigles.evaluate(c => c.classList.contains('vt-manque') ? 0 : +c.querySelector('canvas.vt-image').dataset.niveau);
    for(let i = 0; i < 4 && await niveauDe() !== 0; i++){ await aigles.click(); await page.waitForTimeout(300); }
    for(const etape of [1, 2, 3]){
      await page.waitForTimeout(3800);
      await aigles.scrollIntoViewIfNeeded(); await aigles.click(); await page.waitForTimeout(500);
      const etat = await aigles.evaluate(c => {
        const so = c.querySelector('canvas.vt-pointilles-sortants'), fixe = c.querySelector('canvas.vt-pointilles');
        const points = cv => { if(!cv) return 0; const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let n = 0; for(let i = 3; i < d.length; i += 4) if(d[i] > 60) n++; return n; };
        const base = c.querySelector('canvas.vt-image:not(.vt-nouveau)');
        return 'niveau ' + c.querySelector('canvas.vt-image').dataset.niveau + ' ; pointilles qui s envolent : ' + points(so) + ' px ; pointilles fixes : ' + points(fixe) + ' px, '
          + (fixe ? (getComputedStyle(fixe).animationName === 'none' ? 'immobiles' : 'ANIMES') : 'aucun') + ' ; base ' + (getComputedStyle(base).animationName === 'none' ? 'immobile' : 'animee');
      });
      console.log('  etape', etape, ':', etat);
      await aigles.screenshot({ path: S + '/etape-' + etape + '.png' });
    }
    await page.locator('#vtPointilles').click(); await page.waitForTimeout(1500);
    console.log('  bouton pointilles :', await page.locator('#vtPointilles').textContent(), '| calques visibles :', await page.locator('#vitrine canvas.vt-pointilles:visible').count());
    await page.locator('#vitrine').screenshot({ path: S + '/site-' + nom + '-apres-clic.png' });
  }
  await nav.close();
}
await essai(1400, 950, false, 'ordinateur');
await essai(390, 844, true, 'telephone');
srv.close();

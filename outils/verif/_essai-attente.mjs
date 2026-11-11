// Essai des trophees « a debloquer » de la vitrine (08/11) : signaux (scintillement, plaque, bandeau,
// pastille doree, defilement jusqu'au trophee), deblocage au toucher, etapes d'un trophee a niveaux,
// et plus aucun pointille fixe. Usage : node outils/verif/_essai-attente.mjs <sauvegarde.json> <dossier>
import { readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
import { RACINE } from './_banc.mjs';
const [fichier, S] = process.argv.slice(2);
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
const url = 'http://127.0.0.1:' + srv.address().port + '/';

async function ouvrir(largeur, hauteur, mobile, vu){
  const nav = await chromium.launch();
  const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur }, isMobile: mobile, hasTouch: mobile, locale: 'fr-FR', serviceWorkers: 'block' });
  // « Deja vu » de depart : Pic noir jamais vu, alors que Mathis l'a -> il doit etre « a debloquer »
  await ctx.addInitScript(([id, vu]) => { try{ localStorage.setItem('vt-vu', JSON.stringify({ [id]: vu })); }catch(_){} }, [moi.id, vu]);
  const page = await ctx.newPage();
  const erreurs = []; page.on('pageerror', e => erreurs.push(String(e).slice(0, 200)));
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__fs && !!window.__auth, null, { timeout: 20000 });
  await page.evaluate(id => window.__auth.connecter(id), moi.id);
  await page.evaluate(m => window.__fs.livrer('leagues/merlin-bird/members', m), MEMBRES);
  for(const c of ['votes', 'reactions', 'photos', 'trophyEvents']) await page.evaluate(c => window.__fs.livrer('leagues/merlin-bird/' + c, []), c);
  await page.waitForTimeout(1500);
  return { nav, page, erreurs };
}
const vuDepart = { 'aigles': 0, 'nuit': 0, 'u-Pic noir': 0 };
const pastille = page => page.evaluate(() => document.querySelector('.tab[data-view="trophies"] .tab-count-or')?.textContent || '0');
const etat = (page, nom) => page.locator('#vitrine .vt-case', { hasText: nom }).first().evaluate(c => ({
  attend: c.classList.contains('vt-attend'), manque: c.classList.contains('vt-manque'), plaque: c.querySelector('.vt-nom').textContent,
  niveau: c.querySelector('canvas.vt-image').dataset.niveau, paillettes: c.querySelectorAll('.vt-paillette').length }));

// 1. Ordinateur
{
  const { nav, page, erreurs } = await ouvrir(1400, 950, false, vuDepart);
  console.log('pastille doree avant d ouvrir Trophees :', await pastille(page));
  await page.evaluate(() => document.querySelector('.tab[data-view="trophies"]')?.click());
  await page.waitForSelector('#vitrine .vt-case', { timeout: 20000 }); await page.waitForTimeout(2500);
  console.log('pointilles fixes :', await page.locator('#vitrine canvas.vt-pointilles').count(), '| bandeau :', await page.locator('#vtBandeau').textContent().catch(() => 'aucun'));
  console.log('Pic noir :', JSON.stringify(await etat(page, 'Touche pour débloquer')), '| defilement de la ligne :', await page.locator('#vitrine .vt-rail').evaluate(r => Math.round(r.scrollLeft)));
  await page.locator('#vitrine').screenshot({ path: S + '/attente-ordinateur.png' });
  // Debloquer en le touchant
  await page.locator('#vitrine .vt-case.vt-attend').first().click();
  // La fin de l'animation doit s'eteindre en douceur : photos a plusieurs instants, et l'eclat du trophee
  const t0 = Date.now();
  for(const ms of [1200, 2200, 2900, 3500, 4100, 4900]){
    await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)));
    const f = await page.locator('#vitrine .vt-case', { hasText: 'Pic noir' }).evaluate(c => getComputedStyle(c.querySelector('canvas.vt-image')).filter.slice(0, 60));
    console.log('  fin d animation,', ms, 'ms :', f);
    await page.locator('#vitrine .vt-case', { hasText: 'Pic noir' }).screenshot({ path: S + '/fin-' + String(ms).padStart(4, '0') + '.png' });
  }
  console.log('apres le toucher :', JSON.stringify(await etat(page, 'Pic noir')), '| bandeau :', await page.locator('#vtBandeau').count(), '| pastille :', await pastille(page));
  // Armee d'aigles royaux, etape par etape : toucher = gagne (a debloquer), toucher encore = animation
  const aigles = page.locator('#vitrine .vt-case', { hasText: /Armée d'aigles royaux|Touche pour débloquer/ }).first();
  for(const etape of [1, 2]){
    await page.locator('#vitrine .vt-case[data-id="aigles"]').click(); await page.waitForTimeout(800);
    const avant = await page.locator('#vitrine .vt-case[data-id="aigles"]').evaluate(c => (c.classList.contains('vt-attend') ? 'a debloquer' : 'PAS en attente') + ', affiche le niveau ' + (c.classList.contains('vt-manque') ? 0 : c.querySelector('canvas.vt-image').dataset.niveau));
    if(etape === 2) await page.locator('#vitrine .vt-case[data-id="aigles"]').screenshot({ path: S + '/attente-aigles-etape2.png' });
    await page.locator('#vitrine .vt-case[data-id="aigles"]').click(); await page.waitForTimeout(900);
    const pendant = await page.locator('#vitrine .vt-case[data-id="aigles"]').evaluate(c => {
      const base = c.querySelector('canvas.vt-image:not(.vt-nouveau)');
      return 'anime : ' + c.classList.contains('vt-deverrouille') + ', base ' + (getComputedStyle(base).animationName === 'none' ? 'immobile' : 'animee') + ', silhouette doree : ' + !!c.querySelector('.vt-pointilles-sortants');
    });
    await page.waitForTimeout(3000);
    console.log('aigles etape', etape, ': apres le 1er toucher', avant, '| pendant l animation :', pendant);
  }
  // La bulle du survol, sur Armee d'aigles royaux et sur un trophee unique
  const bulle = () => page.evaluate(() => { const b = document.getElementById('tipbox'); return b && b.classList.contains('on') ? b.textContent : '(pas de bulle)'; });
  for(const id of ['aigles', 'nuit', 'u-Jaseur', 'u-Pic noir']){
    const c = page.locator(`#vitrine .vt-case[data-id="${id}"]`);
    await c.scrollIntoViewIfNeeded();
    // sur le trophee lui-meme : pas de bulle
    await page.mouse.move(0, 0); await c.locator('.vt-emplacement').hover(); await page.waitForTimeout(500);
    console.log('survol du trophee', id, ':', await bulle(), '| curseur :', await c.evaluate(e => getComputedStyle(e).cursor));
    // sur la plaque du nom : la bulle
    await page.mouse.move(0, 0); await c.locator('.vt-nom').hover(); await page.waitForTimeout(500);
    console.log('survol de la plaque', id, ':', await bulle(), '| curseur :', await c.locator('.vt-nom').evaluate(e => getComputedStyle(e).cursor.slice(0, 30)));
    if(id === 'aigles') await page.screenshot({ path: S + '/bulle.png' });
  }
  // Hauteur des emplacements
  console.log('emplacement :', await page.locator('#vitrine .vt-emplacement').first().evaluate(e => e.offsetHeight + ' px'));
  // Les fleches : taille, position (dans la vitrine), et une photo avec les deux visibles, la droite survolee
  await page.locator('#vitrine .vt-rail').evaluate(r => r.scrollLeft = 500); await page.waitForTimeout(400);
  console.log('fleches :', await page.evaluate(() => [...document.querySelectorAll('#vitrine .vt-fleche')].map(b => {
    const r = b.getBoundingClientRect(), v = document.querySelector('#vitrine .vt-vitrine').getBoundingClientRect();
    return (b.classList.contains('vt-g') ? 'gauche' : 'droite') + ' ' + Math.round(r.width) + ' px ecran, ' + (b.hidden ? 'cachee' : 'visible') + ', dans la vitrine : ' + (r.left >= v.left && r.right <= v.right);
  }).join(' | ')));
  await page.locator('#vitrine .vt-d').hover(); await page.waitForTimeout(300);
  await page.locator('#vitrine').screenshot({ path: S + '/fleches.png' });
  console.log('erreurs :', erreurs.length, erreurs.join(' | '));
  await nav.close();
}
// 2. Telephone : le meme depart
{
  const { nav, page, erreurs } = await ouvrir(390, 844, true, vuDepart);
  console.log('telephone, pastille sur Plus :', await page.evaluate(() => document.querySelector('#barreBas [data-view="plus"] .barre-pastille')?.textContent || 'aucune'));
  await page.evaluate(() => document.querySelector('.tab[data-view="trophies"]')?.click());
  await page.waitForSelector('#vitrine .vt-case', { timeout: 20000 }); await page.waitForTimeout(2500);
  console.log('telephone, debordement :', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), '| erreurs :', erreurs.length);
  await page.locator('#vitrine').screenshot({ path: S + '/attente-telephone.png' });
  await nav.close();
}
srv.close();

// Essai du zoom de la carte « Où et quand » (2026-11-10) : Europe grisée hors continent, clic sur la
// France (images pendant le zoom), bouton « Europe », bouton « Monde », clic sur la République dominicaine
// depuis le monde puis sur l'Amérique du Nord : la Huppe n'y est jamais notée, la carte doit rester (grise)
// avec son bouton. Ordinateur puis téléphone. Captures dans notes-privees/essai-zoom/.
// Usage : node outils/verif/_essai-zoom-carte.mjs [port]
import { chromium } from 'playwright';
import fs from 'node:fs';
const port = process.argv[2] || '8766';
const dossier = 'notes-privees/essai-zoom/';
fs.mkdirSync(dossier, { recursive: true });
for(const f of fs.readdirSync(dossier)) if(f.endsWith('.png') && !f.startsWith('projections')) fs.unlinkSync(dossier + f);
const nav = await chromium.launch();
for(const [nom, opts] of [['ordi', { viewport:{ width:1280, height:900 } }],
                          ['tel', { viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true }]]){
  const ctx = await nav.newContext({ ...opts, locale:'fr-FR' });
  await ctx.addInitScript(() => { try{ localStorage.setItem('mb-theme', 'light'); }catch(_){} });
  const p = await ctx.newPage();
  const erreurs = [];
  p.on('pageerror', e => erreurs.push(e.message));
  await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  await p.evaluate(() => [...document.querySelectorAll('[data-sci]')].find(x => /upupa epops/i.test(x.dataset.sci)).click());
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
  await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelector('[data-cont="Europe"]').click());
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.cp-modal-close').click());
  await p.waitForTimeout(500);
  const bloc = '#speciesModal .sm-oq-bloc';
  // Capture de la page decoupee sur le bloc (plus rapide qu'une capture d'element, qui attend qu'il soit immobile)
  const cap = async (n) => { const r = await p.evaluate(b => { const x = document.querySelector(b).getBoundingClientRect(); return { x:x.x, y:x.y, width:x.width, height:Math.min(x.height, innerHeight - x.y) }; }, bloc);
    await p.screenshot({ path: dossier + nom + '-' + n + '.png', clip:r, animations:'allow' }); };
  await p.evaluate(b => document.querySelector(b).scrollIntoView({ block:'start' }), bloc);
  await p.waitForTimeout(300);
  // Images pendant un mouvement : au clic, puis toutes les 170 ms
  const film = async (prefixe, geste) => {
    await geste();
    const t0 = Date.now();
    for(let i = 1; i <= 6; i++){ await p.waitForTimeout(60); await cap(prefixe + '-' + i + '-' + (Date.now() - t0) + 'ms'); }
    await p.waitForTimeout(1200); await cap(prefixe + '-fin');
  };
  await cap('0-europe');
  await film('1-vers-france', () => p.locator('#smContinentMap [data-zone="FR"]').click({ force:true }));
  const etat1 = await p.evaluate(() => ({ pays: document.getElementById('smRarityCountrySel').textContent.trim().split('\n')[0],
    bouton: document.getElementById('smOqRemonterPays')?.textContent, scene: !!document.querySelector('.oq-scene') }));
  await film('2-vers-europe', () => p.locator('#smOqRemonterPays').click());
  await film('3-vers-monde', () => p.locator('#smOqRemonter').click());
  await film('4-vers-amnord', () => p.evaluate(() => document.querySelector('#smContinentMap [data-zone="DO"]').dispatchEvent(new MouseEvent('click', { bubbles:true }))));
  await film('5-vers-rep-dom', () => p.evaluate(() => document.querySelector('#smContinentMap [data-zone="DO"]').dispatchEvent(new MouseEvent('click', { bubbles:true }))));
  const etat2 = await p.evaluate(() => ({ pays: document.getElementById('smRarityCountrySel').textContent.trim().split('\n')[0],
    carte: !!document.querySelector('#smRarityMap svg[role="img"]'), bouton: document.getElementById('smOqRemonterPays')?.textContent,
    scene: !!document.querySelector('.oq-scene'), hauteurFigee: document.querySelector('.sm-oq-bloc').style.height || '' }));
  console.log(nom, JSON.stringify(etat1), JSON.stringify(etat2), erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : 'sans erreur');
  await ctx.close();
}
await nav.close();

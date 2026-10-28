// Essai ponctuel (2026-10-28), démo locale, eBird en direct : plus de nom scientifique dans les lignes du
// Récent et de la Ligue, et le nombre de listes porté par la flèche du Récent, même à 1.
// node outils/verif/_essai-recent-nb-listes.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1440), mobile = largeur < 700;
const SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="recent"]'); if(b.getAttribute('aria-pressed') !== 'true') b.click(); });
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
await clic('cc', 'FR'); await p.waitForTimeout(2500);
await clic('ebird', 'FR-PDL');
for(let i = 0; i < 120; i++){
  await p.waitForTimeout(1000);
  const ph = await p.evaluate(() => document.querySelector('#ctListeRecent .ct-compte')?.textContent || '');
  if(i > 3 && ph.includes('listes') && !ph.includes('lecture')) break;
}
const lire = sel => p.evaluate(sel => [...document.querySelectorAll(sel + ' .ct-rang-e')].slice(0, 6).map(e => ({
  nom:e.querySelector('.nom')?.textContent, lat:!!e.querySelector('.lat'), sous:e.querySelector('.sous')?.textContent,
  fleche:e.querySelector('.ct-rang-n')?.textContent, tip:e.querySelector('.ct-rang-n')?.dataset.tip,
  hFleche:Math.round(e.querySelector('.ct-rang-n')?.getBoundingClientRect().width || 0) })), sel);
console.log('phrase :', (await p.evaluate(() => document.querySelector('#ctListeRecent .ct-compte')?.textContent || '')).trim());
const rec = await lire('#ctListeRecent');
for(const r of rec) console.log('  Récent', JSON.stringify(r));
const nbs = await p.evaluate(() => [...document.querySelectorAll('#ctListeRecent .ct-rang-nb')].map(x => parseInt(x.textContent)));
console.log('  nombres sur les flèches :', nbs.length, 'lignes, dont', nbs.filter(n => n === 1).length, 'à 1 ;', 'sans nombre :', await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang-n:not(.avec-nb)').length));
// Déplier la première : la flèche tourne, le nombre reste droit.
await p.evaluate(() => document.querySelector('#ctListeRecent .ct-rang-n').click());
await p.waitForTimeout(600);
console.log('  dépliée :', JSON.stringify(await p.evaluate(() => { const b = document.querySelector('#ctListeRecent .ct-rang-n'); return { ouverte:b.getAttribute('aria-expanded'), tourne:getComputedStyle(b.querySelector('.fl')).transform, nb:getComputedStyle(b.querySelector('.ct-rang-nb')).transform, obs:document.querySelectorAll('#ctListeRecent .ct-rang-obs li').length }; })));
await p.evaluate(() => document.querySelector('#ctListeRecent .ct-rang-e')?.scrollIntoView({ block:'center' }));
await p.screenshot({ path:`${SORTIE}/recent-nb-${largeur}.png` });
// Ligue
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="ligue"]').click());
await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="ligue"]'); if(b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
await p.waitForTimeout(2500);
const lig = await lire('#ctListeLigue');
for(const r of lig.slice(0, 3)) console.log('  Ligue', JSON.stringify(r));
console.log('erreurs :', erreurs.length ? erreurs.slice(0, 3) : 'aucune');
await nav.close();

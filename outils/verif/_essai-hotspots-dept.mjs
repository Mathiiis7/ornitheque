// Essai ponctuel (2026-10-27), démo locale : après une région, un département cliqué ne doit plus
// montrer que SES hotspots (Mathis : ceux des autres départements restaient affichés).
// Deux cas : A. onglet Hotspots ouvert ; B. onglet Récent ouvert, couche Hotspots allumée par-dessus.
// node outils/verif/_essai-hotspots-dept.mjs
import { chromium } from 'playwright';
const nav = await chromium.launch();
async function essai(nom, ongletDepart){
  const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1440, height:900 } });
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
  await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
  const attendre = async () => { for(let i = 0; i < 150; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => (document.getElementById('mapEbCount')?.textContent || '') + (document.getElementById('ctRecEtat')?.textContent || '')); if(!t.includes('…') && i > 2) return; } };
  // Les carrés visibles sur la carte, rangés par département.
  const carres = () => p.evaluate(() => { const par = {}; window.__carte.eachLayer(l => { if(l._hs && l._icon && l._icon.style.display !== 'none'){ const d = l._hs.deptCode || '?'; par[d] = (par[d] || 0) + 1; } }); return par; });
  await clicForme('cc', 'FR'); await p.waitForTimeout(2000);
  await clicForme('ebird', 'FR-PDL'); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click());
  await attendre();
  if(ongletDepart === 'recent'){
    await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
    await attendre();
    await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="hot"]'); if(b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
    await attendre();
  }
  console.log(nom, '- région :', JSON.stringify(await carres()));
  await clicForme('ebird', 'FR-PDL-85');
  await p.waitForTimeout(1500); await attendre(); await p.waitForTimeout(1000);
  const apres = await carres();
  const dehors = Object.entries(apres).filter(([d]) => d !== 'FR-PDL-85').reduce((t, [, n]) => t + n, 0);
  console.log(nom, '- Vendée cliquée :', JSON.stringify(apres), dehors ? `DÉFAUT : ${dehors} carrés hors de la Vendée` : 'CONFORME', '; compte :', await p.evaluate(() => document.getElementById('mapEbCount')?.textContent));
  console.log('   erreurs :', erreurs.length ? erreurs : 'aucune');
  await ctx.close();
}
await essai('A. onglet Hotspots', 'hot');
await essai('B. onglet Récent + couche Hotspots', 'recent');
await nav.close();

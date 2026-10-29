// Essai ponctuel (2026-10-29), démo locale : la recherche d'une espèce en source « Années passées »
// (GBIF, en direct, sans quota partagé) : la liste ne garde que l'espèce, une grappe ouvre ses observations.
// node outils/verif/_essai-recherche-gbif.mjs
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR' });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(800);
await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="recent"]'); if(b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
await clic('cc', 'FR'); await p.waitForTimeout(3000);
await clic('ebird', 'FR-PDL'); await p.waitForTimeout(2000);
await clic('ebird', 'FR-PDL-44'); await p.waitForTimeout(2000);
await p.evaluate(() => document.querySelector('[data-ct-source="gbif"]').click());
const etat = () => p.evaluate(() => ({ etat:(document.getElementById('ctRecEtat')?.textContent || '').slice(0, 90), lignes:document.querySelectorAll('#ctListeRecent .ct-rang').length, tete:(document.querySelector('#ctListeRecent .ct-compte')?.textContent || '').slice(0, 60), grappes:document.querySelectorAll('.leaflet-marker-pane .ct-gr-ico').length }));
for(let i = 0; i < 40; i++){ await p.waitForTimeout(1500); const e = await etat(); if(e.lignes && !e.etat.includes('…')) break; }
console.log('GBIF, Loire-Atlantique, sans recherche :', JSON.stringify(await etat()));
await p.click('#mapSearch'); await p.keyboard.type('Aigrette garzette', { delay:5 }); await p.waitForTimeout(500);
await p.evaluate(() => { const it = [...document.querySelectorAll('.map-search-suggest-item')].find(x => x.textContent.includes('Aigrette garzette')); if(it) it.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); });
for(let i = 0; i < 40; i++){ await p.waitForTimeout(1500); const e = await etat(); if(/obs GBIF|Aucune/.test(e.etat)) break; }
await p.waitForTimeout(1000);
const b = await etat();
console.log('avec « Aigrette garzette » :', JSON.stringify(b));
const g = await p.evaluate(() => { let c = null, n = 0; window.__carte.eachLayer(l => { if(l.getAllChildMarkers && l._icon && l.getChildCount() > n){ n = l.getChildCount(); c = l; } }); if(!c) return 'aucune grappe'; c._icon.dispatchEvent(new MouseEvent('click', { bubbles:true })); return 'ok'; });
await p.waitForTimeout(800);
const pop = await p.evaluate(() => { const pp = document.querySelector('.leaflet-popup.ct-gl'); return pp ? `${pp.querySelector('.ct-gl-t')?.textContent}, détail ${pp.querySelectorAll('.ct-gl-obs:not([hidden]) li').length} lignes` : 'pas de liste'; });
console.log('clic grappe :', g, pop);
console.log(b.lignes === 1 && (g === 'aucune grappe' || /détail [1-9]/.test(pop)) ? 'CONFORME' : 'DÉFAUT');
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();

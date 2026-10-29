// Essai ponctuel (2026-10-29), démo locale : un pays ouvert efface les frontières des autres pays, qui
// doublaient le bord de ses régions (Espagne contre Portugal) ; revenir à tous les pays les remet.
// node outils/verif/_essai-frontieres.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
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
// Traits de frontière visibles (calque ctPays), pays ouvert exclu.
const traits = () => p.evaluate(() => { let n = 0, v = 0; window.__carte.eachLayer(l => { if(l.feature && l.feature.properties.cc && !l.feature.properties.ebird && l._path){ n++; if(+getComputedStyle(l._path).strokeOpacity > 0) v++; } }); return v + ' visibles sur ' + n; });
console.log('arrivée :', await traits());
await p.evaluate(() => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === 'PT' && l.fire && !f && l.getBounds) f = l; }); f.fire('click', { latlng:f.getBounds().getCenter() }); });
await p.waitForTimeout(4000);
console.log('Portugal ouvert :', await traits());
await p.evaluate(() => window.__carte.setView([41.5, -7.2], 8, { animate:false })); await p.waitForTimeout(1500);
await p.screenshot({ path:`${SORTIE}/frontieres-pt.png` });
// Survol d'Espagne : son trait revient le temps du survol.
await p.evaluate(() => { window.__carte.eachLayer(l => { if(l.feature && l.feature.properties.cc === 'ES' && !l.feature.properties.ebird && l._path) l.fire('mouseover'); }); });
console.log('Espagne survolée :', await p.evaluate(() => { let o = ''; window.__carte.eachLayer(l => { if(l.feature && l.feature.properties.cc === 'ES' && !l.feature.properties.ebird && l._path) o = getComputedStyle(l._path).strokeOpacity; }); return 'opacité du trait ' + o; }));
await p.evaluate(() => document.querySelector('#ctAriane a, #ctAriane [data-carte]')?.click()); await p.waitForTimeout(2500);
console.log('retour à tous les pays :', await traits());
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();

// Essai ponctuel (2026-10-28), démo locale : passer d'un onglet à l'autre (Ligue, Récent, Ligue) avec la
// couche Ligue éteinte ne bouge pas la carte ; l'allumer la cadre toujours sur ses points.
// node outils/verif/_essai-ligue-zoom.mjs
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1280, height:800 } });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto((process.env.BASE || 'http://localhost:8765') + '/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const vue = () => p.evaluate(() => { const c = window.__carte.getCenter(); return window.__carte.getZoom() + ' @ ' + c.lat.toFixed(2) + ',' + c.lng.toFixed(2) + ' ; ligue ' + document.querySelector('#ctCouches [data-couche="ligue"]').getAttribute('aria-pressed'); });
const onglet = async o => { await p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`).click(), o); await p.waitForTimeout(1500); };
console.log('départ        ', await vue());
for(const o of ['ligue', 'recent', 'ligue', 'hot', 'ligue']){ await onglet(o); console.log(('onglet ' + o).padEnd(14), await vue()); }
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="ligue"]').click());
await p.waitForTimeout(1500);
console.log('pastille Ligue', await vue());
console.log('erreurs', erreurs.length, erreurs.slice(0, 3));
await nav.close();

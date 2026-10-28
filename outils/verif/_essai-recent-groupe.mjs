// Essai ponctuel (2026-10-28), démo locale, eBird en direct : le Récent d'un groupe de zones (Monténégro,
// Slovénie...) lit-il toutes les listes, comme une région, au lieu d'une observation par espèce ?
// node outils/verif/_essai-recent-groupe.mjs [ME:ME-P] [dossier des captures]
import { chromium } from 'playwright';
const [cc, groupe] = (process.argv[2] || 'ME:ME-P').split(':');
const SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1440, height:900 } });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
const req = []; p.on('request', r => { if(/ornitheque-relais|api\.ebird/.test(r.url())) req.push(r.url()); });
await p.goto((process.env.BASE || 'http://localhost:8765') + '/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="recent"]'); if(b.getAttribute('aria-pressed') !== 'true') b.click(); });
await p.waitForTimeout(800);
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
await clic('cc', cc); await p.waitForTimeout(3000);
const avant = req.length, t0 = Date.now();
console.log('clic', groupe, await clic('ebird', groupe));
let phrase = '';
for(let i = 0; i < 120; i++){
  await p.waitForTimeout(1000);
  phrase = await p.evaluate(() => document.querySelector('#ctListeRecent .ct-compte')?.textContent || '');
  const etat = await p.evaluate(() => document.getElementById('ctRecEtat')?.textContent || '');
  if(i > 3 && !etat.includes('…') && !phrase.includes('lecture')) break;
}
const points = await p.evaluate(() => { let n = 0; window.__carte.eachLayer(l => { if(l.getLatLng && !l.feature) n++; }); return n; });
console.log('phrase :', phrase.trim());
console.log('marqueurs sur la carte :', points, '; demandes :', req.length - avant, '; en', Date.now() - t0, 'ms');
console.log('erreurs :', erreurs.length ? erreurs.slice(0, 3) : 'aucune');
await p.screenshot({ path:`${SORTIE}/recent-groupe-${groupe}.png` });
await nav.close();

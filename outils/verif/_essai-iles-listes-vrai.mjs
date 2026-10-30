// Essai ponctuel (2026-10-30), démo locale, VRAI eBird par le relais : une île lit ses listes entières et pose ses
// points. Peu de demandes, mais elles comptent sur le quota commun : à ne pas lancer en boucle.
// node outils/verif/_essai-iles-listes-vrai.mjs [JE|GG|IM]
import { chromium } from 'playwright';
const cc = process.argv[2] || 'JE';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR', serviceWorkers:'block' });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
const listes = []; p.on('response', r => { if(/carte\/listes/.test(r.url())) listes.push(r.status()); });
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="recent"]').click()); await p.waitForTimeout(1000);
await p.evaluate(cc => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === cc && !pr.ebird && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, cc);
let e = null;
for(let i = 0; i < 30; i++){
  await p.waitForTimeout(2000);
  e = await p.evaluate(() => {
    let points = 0; window.__carte.eachLayer(l => { if(l._rec) points++; else if(l.getAllChildMarkers && l._icon) points += l.getAllChildMarkers().filter(m => m._rec).length; });
    const c = document.querySelector('#ctContenu [data-volet="recent"]');
    return { points, lignes:c.querySelectorAll('.ct-rang').length, compte:[...c.querySelectorAll('.ct-compte')].map(x => x.textContent.trim()).filter(Boolean).join(' | ').slice(0, 160) };
  });
  if(/Lu dans|\d+ listes?\b/.test(e.compte) && !/lecture/.test(e.compte)) break;
}
console.log(cc, JSON.stringify(e), '· réponses du relais :', listes.join(','));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
console.log(e.points && e.lignes && listes.includes(200) && !erreurs.length ? 'CONFORME' : 'DÉFAUT');
await nav.close();

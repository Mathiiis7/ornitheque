// Essai ponctuel (2026-10-28), démo locale, eBird en direct : Récent sur une zone d'Irlande du Nord.
// Les 8 zones couvrent le pays, et « Zone » n'est plus grisé (mesure sur le regroupement Irlande du Nord).
// node outils/verif/_essai-zone-regroupee.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1280, height:900 } });
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
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="recent"]'); if(b.getAttribute('aria-pressed') !== 'true') b.click(); });
await p.waitForTimeout(800);
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
console.log('pays GB', await clic('cc', 'GB'));
await p.waitForTimeout(3000);
console.log('zone Antrim', await clic('ebird', 'GB-NIR-ANT'));
for(let i = 0; i < 30; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => document.getElementById('ctRecEtat')?.textContent || ''); if(!t.includes('…') && i > 3) break; }
await p.waitForTimeout(1500);
const etat = () => p.evaluate(() => {
  const z = document.querySelector('#ctVoletRecent [data-ct-portee="zone"]');
  return { zoneGrisee:z && z.getAttribute('aria-disabled'), zoneAllumee:z && z.getAttribute('aria-checked'), note:document.querySelector('#ctVoletRecent .ct-portee-note')?.textContent,
    titre:document.getElementById('ctZoneNom')?.textContent, lignes:document.querySelectorAll('#ctListeRecent .ct-rang').length,
    paliers:[...document.querySelectorAll('#ctListeRecent .ct-rang')].slice(0, 6).map(b => b.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)) };
});
console.log('avant', JSON.stringify(await etat()));
await p.evaluate(() => { const d = document.getElementById('ctPliRecent'); if(d) d.open = true; document.querySelector('#ctVoletRecent [data-ct-portee="zone"]').click(); });
await p.waitForTimeout(4000);
console.log('après Zone', JSON.stringify(await etat()));
// Les zones d'Irlande du Nord posées sur la carte.
console.log('zones NIR sur la carte', await p.evaluate(() => { let n = 0; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && /^GB-NIR/.test(pr.ebird || '')) n++; }); return n; }));
console.log('erreurs', erreurs.length, erreurs.slice(0, 3));
await p.screenshot({ path:`${SORTIE}/zone-antrim.png` });
await nav.close();

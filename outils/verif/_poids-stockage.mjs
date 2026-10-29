// Mesure ponctuelle (2026-10-29) : ce que la Carte range dans le stockage du navigateur après Récent + Hotspots
// d'un département sur le vrai eBird, regroupé par forme d'adresse, en Ko.
// node outils/verif/_poids-stockage.mjs
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR' });
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2000);
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && (cle !== 'cc' || !pr.ebird) && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
await clic('cc', 'FR'); await p.waitForTimeout(4000);
await clic('ebird', 'FR-PDL'); await p.waitForTimeout(4000);
await clic('ebird', 'FR-PDL-44'); await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="recent"]').click()); await p.waitForTimeout(8000);
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="hot"]').click()); await p.waitForTimeout(40000);
console.log(await p.evaluate(() => {
  const g = new Map(); let tot = 0;
  for(let i = 0; i < localStorage.length; i++){
    const k = localStorage.key(i), v = localStorage.getItem(k) || '', ko = (k.length + v.length) * 2 / 1024; tot += ko;
    const f = k.replace(/^ebc:https:\/\/api\.ebird\.org\/v2\//, '').replace(/L\d+/g, 'L…').replace(/FR-[A-Z]+(-\d+)?/g, 'FR-…').replace(/\?.*$/, '?…');
    const e = g.get(f) || [0, 0]; e[0]++; e[1] += ko; g.set(f, e);
  }
  return 'total ' + Math.round(tot) + ' Ko\n' + [...g].sort((a, b) => b[1][1] - a[1][1]).slice(0, 12).map(([f, [n, ko]]) => `  ${f} : ${n} clés, ${Math.round(ko)} Ko`).join('\n');
}));
await nav.close();

// Essai ponctuel (2026-10-30), démo, faux eBird, listes retardées : « lecture des listes » ne se dit qu'une fois.
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR', serviceWorkers:'block' });
await bouchonEbird(ctx);
let n = 0;
await ctx.route(/carte\/listes/, async r => { await new Promise(x => setTimeout(x, 2500)); if(n++ === 0) return r.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify({ listes:[], total:67, reste:20 }) }); await new Promise(x => setTimeout(x, 5000)); return r.fallback(); });
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const clic = async (cle, val) => { await p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]); };
await clic('cc', 'FR'); await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="recent"]').click()); await p.waitForTimeout(500);
await clic('ebird', 'FR-PDL-44');
let vu = 0, max = 0, avance = false;
for(let i = 0; i < 20; i++){ const t = await p.evaluate(() => document.getElementById('ctContenu').innerText); const n = (t.match(/lecture des listes/g) || []).length; if(n){ vu++; max = Math.max(max, n); } if(/lecture des listes : 0 sur 67/.test(t)) avance = true; await p.waitForTimeout(300); }
console.log('avancement vu :', avance, '· relevés avec le texte :', vu, '· le plus de fois à la fois :', max);
console.log(avance && vu && max === 1 ? 'CONFORME' : 'DÉFAUT');
await nav.close();

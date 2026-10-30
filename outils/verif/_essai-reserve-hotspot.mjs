// Essai ponctuel (2026-10-30), démo locale, faux eBird : la bulle d'une réserve liste ses hotspots et leurs espèces
// non observées, la France ouverte. _essai-reserves et _essai-reserves-couches, écrits avant la v952 (réserves
// visibles seulement la France ouverte), n'ouvrent pas la France et ne trouvent plus aucune forme.
// node outils/verif/_essai-reserve-hotspot.mjs
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR', serviceWorkers:'block' });
await bouchonEbird(ctx);
await ctx.route(/ornitheque-relais|api\.ebird\.org/, route => {
  const ch = new URL(route.request().url()).pathname.replace(/^\/v2\//, '');
  const json = v => route.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify(v) });
  if(/^ref\/hotspot\/FR-PDL-44$/.test(ch)) return json([{ locId:'LGL', locName:'Lac de Grand-Lieu', lat:47.09, lng:-1.67, countryCode:'FR', subnational1Code:'FR-PDL', subnational2Code:'FR-PDL-44', latestObsDt:'2026-10-20 08:00', numSpeciesAllTime:190 }]);
  if(ch === 'product/spplist/LGL') return json(['lapbun', 'snobun', 'graher1']);
  return route.fallback();
});
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
await p.evaluate(() => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === 'FR' && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); });
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="hot"]').click()); await p.waitForTimeout(800);
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="res"]').click());
for(let i = 0; i < 20 && !(await p.evaluate(() => document.querySelectorAll('.leaflet-ctReserves-pane path').length)); i++) await p.waitForTimeout(500);
const clique = await p.evaluate(() => {
  let c = null; window.__carte.eachLayer(l => { const f = l.feature; if(f && f.properties && /Grand-Lieu/.test(f.properties.n || '') && l.getBounds && !c) c = l; });
  if(!c) return null;
  c.fire('click', { latlng:L.latLng(47.09, -1.67) });
  return c.feature.properties.n;
});
console.log('réserve :', clique);
await p.waitForTimeout(2500);
const b = await p.evaluate(() => { const x = document.querySelector('.leaflet-popup.ct-rb'); if(!x) return null;
  return { partie:x.querySelector('.ct-hb-it')?.textContent, lignes:[...x.querySelectorAll('.ct-rb-h')].map(e => e.textContent.replace(/\s+/g, ' ').trim()), especes:[...x.querySelectorAll('.ct-rb-esp .ct-gl-nom')].map(e => e.textContent) }; });
console.log('bulle :', JSON.stringify(b));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
const ok = b && /Hotspots dans la réserve/.test(b.partie || '') && b.lignes.length === 1 && b.especes.length > 0 && !erreurs.length;
console.log(ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();

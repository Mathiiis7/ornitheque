// Essai ponctuel (2026-10-30), démo locale, faux eBird : l'Érismature rousse (N en France) porte sa lettre dans la
// bulle d'un hotspot et dans son aperçu au survol ; une espèce sans statut n'en porte pas.
// node outils/verif/_essai-hotspots-n.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird, ESPECES } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700, SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
await bouchonEbird(ctx, []);
const liste = [...ESPECES, ['rudduc', 'Oxyura jamaicensis', 'Ruddy Duck']];
await ctx.route(/ref\/taxonomy\/ebird/, r => r.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify(new URL(r.request().url()).searchParams.get('cat') === 'species' ? liste.map(([speciesCode, sciName, comName]) => ({ speciesCode, sciName, comName, category:'species' })) : []) }));
await ctx.route(/product\/spplist\//, r => r.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify(['rudduc', 'wallcr1', 'snobun']) }));
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="hot"]').click());
await p.evaluate(() => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === 'FR' && l.fire && !f && l.getBounds) f = l; }); f.fire('click', { latlng:f.getBounds().getCenter() }); });
await p.waitForTimeout(4000);
let defauts = 0; const ecart = t => { console.log('   ÉCART :', t); defauts++; };
if(!mobile){
  const sv = await p.evaluate(() => { let m = null; window.__carte.eachLayer(l => { if(l._hs && !m) m = l; }); m.fire('mouseover'); const t = document.querySelector('.leaflet-tooltip.ct-sv'); const r = [...t.querySelectorAll('.ct-sv-l')].map(x => x.textContent); m.fire('mouseout'); return r; });
  console.log('survol :', sv.join(' | '));
  if(!sv.some(x => /N.*Érismature rousse/.test(x))) ecart('pas de N au survol');
}
const b = await p.evaluate(async () => { let m = null; window.__carte.eachLayer(l => { if(l._hs && !m) m = l; }); m.openPopup(); await new Promise(f => setTimeout(f, 800));
  return [...document.querySelectorAll('.leaflet-popup.ct-hb .ct-hb-e')].map(x => ({ nom:x.querySelector('.ct-gl-nom').textContent, n:x.querySelector('.pkdx-exo')?.textContent || '' })); });
console.log('bulle :', JSON.stringify(b));
if(b.find(x => /Érismature/.test(x.nom))?.n !== 'N') ecart('pas de N dans la bulle');
if(b.filter(x => !/Érismature/.test(x.nom)).some(x => x.n)) ecart('une lettre de trop');
await p.screenshot({ path:`${SORTIE}/hs-n-${largeur}.png` });
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

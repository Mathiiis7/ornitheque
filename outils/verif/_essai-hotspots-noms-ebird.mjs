// Essai ponctuel (2026-10-30), démo locale, eBird bouchonné : une espèce renommée par eBird et déjà sur la
// liste ne doit pas être comptée « non observée » dans les Hotspots. Mathis : Troglodyte mignon et Bruant des
// roseaux y restaient (eBird dit Nannus troglodytes et Schoeniclus schoeniclus, la liste garde les anciens noms).
// La pie et l'alouette servent de témoins : même nom partout, la première vue par la démo, la seconde à contrôler.
// AVANT=1 remet l'ancienne comparaison dans app.js à la volée : l'essai doit alors tomber en défaut.
// node outils/verif/_essai-hotspots-noms-ebird.mjs [largeur]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700, AVANT = !!process.env.AVANT;
const ESPECES = [['eurwre1', 'Nannus troglodytes', 'Eurasian Wren'], ['reebun', 'Schoeniclus schoeniclus', 'Reed Bunting'], ['horlar', 'Eremophila alpestris', 'Horned Lark'], ['eurrob1', 'Erithacus rubecula', 'European Robin']];
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
await bouchonEbird(ctx);
// Après le bouchon : Playwright essaie d'abord la dernière route posée.
await ctx.route(/ornitheque-relais|api\.ebird\.org/, route => {
  const ch = new URL(route.request().url()).pathname.replace(/^\/v2\//, '');
  const json = v => route.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:JSON.stringify(v) });
  if(/^ref\/taxonomy\/ebird/.test(ch)) return json(ESPECES.map(([speciesCode, sciName, comName]) => ({ speciesCode, sciName, comName, category:'species' })));
  if(/^product\/spplist\//.test(ch)) return json(ESPECES.map(e => e[0]));
  return route.fallback();
});
if(AVANT) await ctx.route(/\/app\.js/, async route => {
  const r = await route.fetch(); let t = await r.text();
  t = t.replace('sauvages.filter(s => !_mineHasStrict(mine, s))', 'sauvages.filter(s => !mine.has(s))');
  return route.fulfill({ response:r, body:t });
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
const clic = async (cle, val) => { await p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]); await p.waitForTimeout(3000); };
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click()); await p.waitForTimeout(800);
await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="hot"]'); if(b && b.getAttribute('aria-pressed') !== 'true') b.click(); });
await clic('cc', 'FR');
for(let i = 0; i < 5 && !/Grand Est/.test(await p.evaluate(() => document.getElementById('ctEbPaysBtn')?.textContent || '')); i++) await clic('ebird', 'FR-GES');
await p.waitForTimeout(3000);
// Lit la bulle du premier hotspot : les noms affichés, et lesquels sont grisés (déjà vus).
const bulle = () => p.evaluate(async () => {
  let m = null; window.__carte.closePopup(); window.__carte.eachLayer(l => { if(l._hs && !m) m = l; });
  if(!m) return null;
  m.openPopup(); await new Promise(r => setTimeout(r, 800));
  const pop = document.querySelector('.leaflet-popup.ct-hb'); if(!pop) return null;
  return { resume:[...pop.querySelectorAll('.ct-hb-s')].pop()?.textContent,
    noms:[...pop.querySelectorAll('.ct-hb-e:not(.ct-hb-deja) .ct-gl-nom')].map(x => x.textContent),
    deja:[...pop.querySelectorAll('.ct-hb-deja .ct-gl-nom')].map(x => x.textContent) };
});
let defauts = 0;
const a = await bulle();
console.log('allumé :', JSON.stringify(a));
if(!a) { console.log('   ÉCART : pas de bulle'); defauts++; }
else for(const nom of ['Troglodyte mignon', 'Bruant des roseaux']) if(a.noms.includes(nom)) { console.log('   ÉCART :', nom, 'compté non observé'); defauts++; }
await p.evaluate(() => { window.__carte.closePopup(); document.getElementById('ctHotManque').click(); }); await p.waitForTimeout(3000);
const b = await bulle();
console.log('éteint :', JSON.stringify(b));
if(!b) { console.log('   ÉCART : pas de bulle'); defauts++; }
else for(const nom of ['Troglodyte mignon', 'Bruant des roseaux']) if(!b.deja.includes(nom)) { console.log('   ÉCART :', nom, 'pas grisé'); defauts++; }
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

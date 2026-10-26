// Essai ponctuel (2026-10-26), démo locale : après des chargements de la Carte (France entière dans le
// Récent, puis Hotspots d'une région), combien pèse la mémoire du site (localStorage), quelle part prennent
// les copies d'eBird (« ebc: »), et la progression du Quiz peut-elle encore s'y écrire ?
// node outils/verif/_essai-memoire-pleine.mjs
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1440, height:900 }, locale:'fr-FR' });
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
const bilan = quoi => p.evaluate(quoi => {
  let total = 0, ebc = 0, nEbc = 0, plus = { cle:'', n:0 };
  for(const k of Object.keys(localStorage)){ const n = (k.length + (localStorage.getItem(k) || '').length) * 2; total += n; if(k.startsWith('ebc:')){ ebc += n; nEbc++; } if(n > plus.n) plus = { cle:k.slice(0, 90), n }; }
  // La progression du quiz pèse quelques dizaines de Ko : peut-on encore écrire 60 Ko ?
  let ecrit = true; try{ localStorage.setItem('__essai', 'x'.repeat(30000)); localStorage.removeItem('__essai'); }catch(_){ ecrit = false; }
  return `${quoi} : ${(total / 1048576).toFixed(2)} Mo dont copies eBird ${(ebc / 1048576).toFixed(2)} Mo (${nEbc}) ; la plus grosse ${plus.cle} ${(plus.n / 1048576).toFixed(2)} Mo ; écrire 60 Ko : ${ecrit ? 'oui' : 'NON'}`;
}, quoi);
console.log(await bilan('au démarrage'));
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(800);
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
await clic('cc', 'FR'); await p.waitForTimeout(12000);
console.log(await bilan('France entière dans le Récent'));
await clic('cc', 'ES'); await p.waitForTimeout(12000);
console.log(await bilan('+ Espagne entière'));
await clic('ebird', 'FR-PDL');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click());
for(let i = 0; i < 90; i++){ await p.waitForTimeout(1000); if(!(await p.evaluate(() => (document.getElementById('mapEbCount')?.textContent || '').includes('…'))) && i > 3) break; }
console.log(await bilan('+ Hotspots des Pays de la Loire'));
await nav.close();

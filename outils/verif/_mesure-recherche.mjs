// Mesure ponctuelle (2026-10-30), démo locale, faux eBird : combien d'espèces la barre de recherche propose dans
// chaque onglet, et lesquelles elle oublie. Mathis : « il manque énormément d'oiseaux ».
// node outils/verif/_mesure-recherche.mjs
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR', serviceWorkers:'block' });
await bouchonEbird(ctx, []);
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const propose = async txt => {
  await p.evaluate(txt => { const s = document.getElementById('mapSearch'); s.value = txt; s.dispatchEvent(new Event('input', { bubbles:true })); s.dispatchEvent(new Event('focus')); }, txt);
  await p.waitForTimeout(300);
  return p.evaluate(() => [...document.querySelectorAll('#mapSearchSuggest .map-search-suggest-item')].map(x => x.children[1]?.textContent));
};
const tour = async nom => {
  const tout = await propose('');
  console.log(nom, ': vide =', tout.length, 'propositions');
  for(const t of ['merle', 'mésange', 'aigrette', 'rougegorge', 'paruline tigr', 'pic']){
    const r = await propose(t);
    console.log('   ', t.padEnd(14), r.length, r.slice(0, 5).join(', '));
  }
  await propose('');
};
for(const o of ['recent', 'ligue', 'hot']){
  await p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`)?.click(), o); await p.waitForTimeout(800);
  await tour(`sans pays, ${o}`);
}
console.log('titre sans pays :', await p.evaluate(() => document.getElementById('ctEbPaysBtn')?.textContent?.trim()));
await nav.close();

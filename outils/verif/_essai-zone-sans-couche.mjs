// Essai ponctuel (2026-10-30), démo locale, faux eBird : choisir une zone n'allume aucune couche, dans aucun
// onglet. Mathis : « quand je clique sur un département ça affiche direct Vu récemment ». Une couche allumée à la
// pastille reste allumée et suit la zone.
// node outils/verif/_essai-zone-sans-couche.mjs [largeur]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
await bouchonEbird(ctx);
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
const clic = async (cle, val) => { const ok = await p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]); await p.waitForTimeout(2500); return ok; };
const onglet = async k => { await p.evaluate(k => document.querySelector(`#ctOnglets [data-onglet="${k}"]`).click(), k); await p.waitForTimeout(1200); };
const pastille = async k => { await p.evaluate(k => document.querySelector(`#ctCouches [data-couche="${k}"]`).click(), k); await p.waitForTimeout(2500); };
const etat = () => p.evaluate(() => {
  let points = 0; window.__carte.eachLayer(l => { if((l._rec || l._hs || l._ligue || l.getAllChildMarkers) && !l.feature) points++; });
  return { allumees:[...document.querySelectorAll('#ctCouches [data-couche][aria-pressed="true"]')].map(b => b.dataset.couche), points, lieu:document.getElementById('ctEbPaysBtn')?.textContent.trim() || '', message:!![...document.querySelectorAll('#ctContenu .ct-eteinte')].find(x => x.offsetWidth) };
});
let defauts = 0;
const verifie = async (titre, attendues, points) => {
  const e = await etat();
  console.log(titre, ':', JSON.stringify(e));
  if(e.allumees.join() !== attendues.join()) { console.log('   ÉCART : couches allumées'); defauts++; }
  if(points === 0 && e.points) { console.log('   ÉCART : des points sur la carte'); defauts++; }
  if(points === 1 && !e.points) { console.log('   ÉCART : aucun point sur la carte'); defauts++; }
};
await clic('cc', 'FR');
await verifie('France ouverte', [], 0);
for(const [o, reg, dep] of [['recent', 'FR-GES', 'FR-PDL-44'], ['ligue', 'FR-BRE', 'FR-BRE-29'], ['hot', 'FR-PDL', 'FR-BRE-35']]){
  await onglet(o);
  if(!await clic('ebird', reg)) { console.log('   ÉCART : région introuvable', reg); defauts++; }
  await verifie(`onglet ${o}, région ${reg}`, [], 0);
  if(!await clic('ebird', dep)) { console.log('   ÉCART : département introuvable', dep); defauts++; }
  await verifie(`onglet ${o}, département ${dep}`, [], 0);
}
// Les pastilles allument toujours, et la couche allumée suit la zone.
await onglet('recent');
await pastille('recent');
await verifie('pastille Récent', ['recent'], 1);
await clic('ebird', 'FR-PDL-44');
await verifie('Récent allumé, autre département', ['recent'], 1);
await pastille('recent');
await verifie('pastille Récent rééteinte', [], 0);
await clic('ebird', 'FR-BRE-29');
await verifie('rééteinte, autre département', [], 0);
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

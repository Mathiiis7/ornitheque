// Essai ponctuel (2026-10-29), démo locale : un pays ouvert voile les autres pays, comme une région.
// node outils/verif/_essai-voile-pays.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
for(const [nom, opts] of [['ordinateur', { viewport:{ width:1300, height:900 } }], ['telephone', { viewport:{ width:375, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 }]]){
  const ctx = await nav.newContext({ locale:'fr-FR', ...opts });
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
  // Le voile : nombre de trous et un point dedans / dehors.
  const voile = () => p.evaluate(() => {
    let v = null; window.__carte.eachLayer(l => { if(l.options && l.options.pane === 'ctVoile' && l.getLatLngs) v = l; });
    if(!v) return "aucun"; const tr = v.getLatLngs().slice(1); const dans = (lat, lng) => tr.some(r => { let c = false; for(let i = 0, j = r.length - 1; i < r.length; j = i++){ const a = r[i], b = r[j]; if((a.lat > lat) !== (b.lat > lat) && lng < (b.lng - a.lng) * (lat - a.lat) / (b.lat - a.lat) + a.lng) c = !c; } return c; }); return tr.length + " trous ; dégagés : " + [["Madrid", 40.42, -3.70], ["Paris", 48.85, 2.35], ["Strasbourg", 48.58, 7.75], ["Londres", 51.5, -0.12]].filter(([, a, b]) => dans(a, b)).map(x => x[0]).join(", ");
  });
  const clicPays = cc => p.evaluate(cc => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === cc && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, cc);
  console.log(nom, '· arrivée : trous du voile', await voile(), '(0 attendu)');
  for(const cc of ['ES', 'GB', 'FR']){
    await clicPays(cc); await p.waitForTimeout(6000);
    const t = await voile();
    console.log('   ' + cc + ' ouvert : trous du voile', t, '; bouton :', await p.evaluate(() => document.getElementById('ctEbPaysBtn')?.textContent.trim()));
    if(nom === 'ordinateur' && cc === 'ES') await p.screenshot({ path:`${SORTIE}/voile-pays-es.png` });
  }
  // Une région choisie garde son propre voile (la région, pas le pays).
  await p.evaluate(() => { const s = document.getElementById('mapEbRegion'); s.value = 'FR-GES'; s.dispatchEvent(new Event('change', { bubbles:true })); });
  await p.waitForTimeout(2500);
  console.log('   FR-GES choisie : trous', await voile());
  console.log('   erreurs :', erreurs.length ? erreurs : 'aucune');
  await ctx.close();
}
await nav.close();

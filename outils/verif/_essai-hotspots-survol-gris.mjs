// Essai ponctuel (2026-10-30), démo locale, eBird bouchonné : l'aperçu au survol d'un hotspot grise les espèces
// déjà vues quand « Non observées » est éteint, comme la bulle (v960) ; allumé, rien de grisé.
// node outils/verif/_essai-hotspots-survol-gris.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, deviceScaleFactor:mobile ? 2 : 1, locale:'fr-FR' });
const demandes = []; await bouchonEbird(ctx, demandes);
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
await p.evaluate(() => { const d = document.getElementById('ctPliHot'); if(d) d.open = true; });
let defauts = 0;
const survol = () => p.evaluate(() => {
  let m = null; window.__carte.eachLayer(l => { if(l._hs && (!m || l._hs.nb < m._hs.nb)) m = l; });
  if(!m) return null;
  m.fire('mouseover');
  const t = document.querySelector('.leaflet-tooltip.ct-sv');
  if(!t) return { sansBulle:true };
  const d = t.querySelector('.ct-sv-deja'), n = t.querySelector('.ct-sv-l:not(.ct-sv-deja)');
  const st = (el, sel, pr) => el ? getComputedStyle(el.querySelector(sel))[pr] : null;
  const r = { lignes:t.querySelectorAll('.ct-sv-l').length, nbDeja:t.querySelectorAll('.ct-sv-deja').length,
    couleurDeja:st(d, 'b', 'color'), couleurAutre:st(n, 'b', 'color'), opaciteDeja:st(d, '.tier-rond', 'opacity'), opaciteAutre:st(n, '.tier-rond', 'opacity') };
  return r;
});
const fin = () => p.evaluate(() => { window.__carte.eachLayer(l => { if(l._hs) l.fire('mouseout'); }); });
const a = await survol(); await fin();
console.log('allumé :', JSON.stringify(a));
await p.evaluate(() => document.getElementById('ctHotManque').click()); await p.waitForTimeout(3000);
const b = await survol();
console.log('éteint :', JSON.stringify(b));
if(!mobile && b) await p.screenshot({ path:`${SORTIE}/hs-survol-gris-${largeur}.png` });
await fin();
if(mobile){
  // Au doigt, pas de survol : aucun aperçu ne doit s'ouvrir.
  if(!a?.sansBulle || !b?.sansBulle) { console.log('   ÉCART : aperçu au doigt'); defauts++; }
} else {
  if(!a || a.sansBulle || a.nbDeja !== 0) { console.log('   ÉCART : allumé, une ligne grisée ou pas d\'aperçu'); defauts++; }
  if(!b || b.sansBulle || !b.nbDeja) { console.log('   ÉCART : éteint, aucune ligne grisée'); defauts++; }
  else if(b.couleurDeja === b.couleurAutre || !(+b.opaciteDeja < 0.5) || (b.opaciteAutre !== null && +b.opaciteAutre !== 1)) { console.log('   ÉCART : grisé pas appliqué'); defauts++; }
}
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

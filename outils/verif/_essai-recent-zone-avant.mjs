// Essai ponctuel (2026-10-30), démo locale, faux eBird ralenti : au Récent, changer de région change le nom et le
// fond TOUT DE SUITE, les points arrivent ensuite. Le fond se juge sur la capture.
// node outils/verif/_essai-recent-zone-avant.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700, SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
await bouchonEbird(ctx, []);
await ctx.route(/carte\/listes\/|data\/obs\/FR-/, async r => { await new Promise(f => setTimeout(f, 3000)); r.fallback(); });
await ctx.addInitScript(() => { const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); }; att(); });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]);
await clic('cc', 'FR'); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="recent"]').click());
let defauts = 0; const ecart = t => { console.log('   ÉCART :', t); defauts++; };
// Le fond de chaque région, relu sur la carte.
const etat = () => p.evaluate(() => {
  const fonds = {}; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.ebird && /^FR-[A-Z]+$/.test(pr.ebird) && l.options) fonds[pr.ebird] = l.options.fillOpacity; });
  let carres = 0; window.__carte.eachLayer(l => { if(l._rec) carres++; });
  return { btn:document.getElementById('ctEbPaysBtn')?.textContent.trim(), titre:document.querySelector('#ctZone h3, #ctZone h2, .ct-titre')?.textContent, pdl:fonds['FR-PDL'], bre:fonds['FR-BRE'], carres };
});
for(const [code, nom] of [['FR-PDL', 'Pays de la Loire'], ['FR-BRE', 'Bretagne']]){
  await clic('ebird', code);
  await p.waitForTimeout(300);
  const e = await etat();
  console.log(code, 'à 300 ms :', JSON.stringify(e));
  if(!new RegExp(nom).test(e.btn || '')) ecart(`le nom n'a pas suivi : ${e.btn}`);
  // Le fond et le voile se jugent sur la capture : ils ne sont pas dans les options de la forme.
  if(code === 'FR-BRE') await p.screenshot({ path:`${SORTIE}/recent-zone-avant-${largeur}.png` });
  await p.waitForTimeout(5000);
  const lignes = await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang').length);
  console.log('   à la fin :', lignes, 'lignes');
  if(!lignes) ecart('aucune ligne à la fin');
}
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

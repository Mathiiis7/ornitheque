// Essai ponctuel (2026-10-29), démo locale, eBird bouchonné : la mesure « France / Grand Est » dans les
// Hotspots. La ligne Rareté en dernier dans leurs filtres ; les paliers de la bulle d'un hotspot suivent
// le réglage, sans relire les hotspots ; le réglage est le même que celui du Récent.
// node outils/verif/_essai-rarete-hotspots.mjs [largeur] [dossier des captures]
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
// Les régions françaises se posent après l'ouverture de la France : on reclique tant que la zone n'a pas pris.
for(let i = 0; i < 5 && !/Grand Est/.test(await p.evaluate(() => document.getElementById('ctEbPaysBtn')?.textContent || '')); i++) await clic('ebird', 'FR-GES');
await p.waitForTimeout(3000);
let defauts = 0;
// La ligne Rareté : dernière des filtres, avec « France | Grand Est ».
await p.evaluate(() => { const d = document.getElementById('ctPliHot'); if(d) d.open = true; });
await p.waitForTimeout(300);
const ligne = await p.evaluate(() => {
  const lignes = [...document.querySelectorAll('#ctPliHot .ct-ligne')].filter(l => l.offsetParent);
  const der = lignes[lignes.length - 1];
  return { nom:der?.querySelector('.ct-k')?.textContent, boutons:[...document.querySelectorAll('#ctPorteeHot [data-ct-portee]')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '') + (b.getAttribute('aria-disabled') === 'true' ? ' (grisé)' : '')).join(' | '),
    deborde:der ? der.scrollWidth > der.clientWidth + 1 : null };
});
console.log('zone :', await p.evaluate(() => document.getElementById('ctEbPaysBtn')?.textContent.trim()), '· dernière ligne des filtres :', JSON.stringify(ligne));
if(ligne.nom !== 'Rareté' || !/France\*/.test(ligne.boutons) || !/Grand Est/.test(ligne.boutons) || ligne.deborde) defauts++;
if(largeur >= 700) await p.screenshot({ path:`${SORTIE}/rarete-hot-filtres-${largeur}.png` });
// La bulle d'un hotspot : ses paliers.
const bulle = async () => {
  await p.evaluate(() => { window.__carte.closePopup(); let m = null; window.__carte.eachLayer(l => { if(l._hs && !m) m = l; }); if(m) m.openPopup(); });
  await p.waitForTimeout(800);
  return p.evaluate(() => { const pop = document.querySelector('.leaflet-popup'); if(!pop) return null; pop.querySelector('details.hs-miss')?.setAttribute('open', '');
    return [...pop.querySelectorAll('.hs-miss li')].map(li => (li.querySelector('.tier-rond')?.textContent || '?') + ' ' + li.querySelector('span:not(.tier-rond):not([data-cnt]):not(.hs-pct)')?.textContent).join(' ; '); });
};
const avant = await bulle();
console.log('bulle, rareté France :', avant);
if(largeur >= 700) await p.screenshot({ path:`${SORTIE}/rarete-hot-bulle-${largeur}.png` });
const nbDemandes = demandes.length;
await p.evaluate(() => document.querySelector('#ctPorteeHot [data-ct-portee="zone"]').click());
await p.waitForTimeout(2000);
const apres = await bulle();
console.log('bulle, rareté Grand Est :', apres);
console.log('boutons :', await p.evaluate(() => [...document.querySelectorAll('#ctPorteeHot [data-ct-portee]')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '')).join(' | ')));
console.log('demandes eBird au changement :', demandes.slice(nbDemandes).filter(d => !/recent\/[a-z0-9]+$/.test(d)).length, '(hors dates des espèces)');
if(!avant || !apres || avant === apres) { console.log('   ÉCART : les paliers de la bulle ne changent pas'); defauts++; }
// Le même réglage au Récent.
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(800);
const rec = await p.evaluate(() => [...document.querySelectorAll('#ctPortee [data-ct-portee]')].map(b => b.textContent + (b.classList.contains('on') ? '*' : '')).join(' | '));
console.log('au Récent :', rec);
if(!/Grand Est\*/.test(rec)) defauts++;
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

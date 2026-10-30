// Essai ponctuel (2026-10-30), démo locale, faux eBird : le bouton « Nombre » des Hotspots change le chiffre des
// carrés (tout l'historique ou ces 30 jours), avec ou sans « Non observées », et pas la bulle.
// node outils/verif/_essai-hotspots-nombre.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700, SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR', serviceWorkers:'block' });
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
const clic = async (cle, val) => { await p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, [cle, val]); await p.waitForTimeout(2500); };
await clic('cc', 'FR');
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click()); await p.waitForTimeout(800);
await p.evaluate(() => document.querySelector('#ctCouches [data-couche="hot"]').click()); await p.waitForTimeout(1500);
await clic('ebird', 'FR-GES'); await p.waitForTimeout(2000);
await p.evaluate(() => { const d = document.getElementById('ctPliHot'); if(d) d.open = true; });
await p.waitForTimeout(300);
let defauts = 0; const ecart = t => { console.log('   ÉCART :', t); defauts++; };
const compte = async v => { await p.evaluate(v => document.querySelector(`[data-ct-compte="${v}"]`).click(), v); await p.waitForTimeout(1500); };
const manque = async () => { await p.evaluate(() => { window.__carte.closePopup(); document.getElementById('ctHotManque').click(); }); await p.waitForTimeout(2500); };
const etat = () => p.evaluate(() => {
  const c = []; window.__carte.eachLayer(l => { if(l._hs) c.push({ id:l._hotspotId, chiffre:l.getElement()?.querySelector('.ct-hs')?.textContent }); });
  c.sort((a, b) => a.id.localeCompare(b.id));
  const on = document.querySelector('[data-ct-compte].on')?.textContent;
  return { on, chiffres:c.map(x => x.chiffre).join(','), id:c[0]?.id, volet:document.querySelector('#ctListeHot .ct-rang-hs .droite')?.textContent, legende:[...document.querySelectorAll('.ml-txt')].map(x => x.textContent).find(t => /^Espèces/.test(t)) };
});
const bulle = async id => {
  await p.evaluate(id => { window.__carte.closePopup(); window.__carte.eachLayer(l => { if(l._hotspotId === id) l.openPopup(); }); }, id);
  await p.waitForTimeout(700);
  const b = await p.evaluate(() => document.querySelector('.leaflet-popup.ct-hb .ct-gl-liste')?.parentElement.textContent.replace(/\s+/g, ' ').trim());
  await p.evaluate(() => window.__carte.closePopup());
  return b;
};
const ligne = await p.evaluate(() => { const r = document.getElementById('mapEbCompteLbl'); return { visible:!!r?.offsetWidth, boutons:[...r.querySelectorAll('button')].map(b => ({ t:b.textContent, coupe:b.scrollWidth > b.clientWidth + 1 })) }; });
console.log('ligne :', JSON.stringify(ligne));
if(!ligne.visible || ligne.boutons.some(b => b.coupe)) ecart('la ligne Nombre');
const a = await etat(); const avantDem = demandes.filter(c => /^data\/obs\/L[^/]+\/recent$/.test(c)).length;
console.log('historique, non observées :', JSON.stringify(a), '· demandes 30 j :', avantDem);
if(avantDem) ecart('des demandes 30 jours sans avoir appuyé');
const bulleA = await bulle(a.id);
await compte('30');
const b = await etat(); console.log('30 jours, non observées :', JSON.stringify(b));
if(b.chiffres === a.chiffres) ecart('le chiffre ne change pas');
if(!/ces 30 j/.test(b.volet || '') || !/ces 30 jours/.test(b.legende || '')) ecart('volet ou légende');
const bulleB = await bulle(a.id);
if(bulleA !== bulleB) { ecart('la bulle a changé'); console.log(bulleA, '\n', bulleB); }
if(largeur >= 700) await p.screenshot({ path:`${SORTIE}/hs-nombre-30j-${largeur}.png` });
await manque();
const c = await etat(); console.log('30 jours, tout :', JSON.stringify(c));
if(c.on !== 'Ces 30 jours' || c.chiffres === b.chiffres) ecart('combinaison avec Non observées');
await compte('tout');
const d = await etat(); console.log('historique, tout :', JSON.stringify(d));
if(d.chiffres === c.chiffres || d.chiffres === a.chiffres) ecart('retour historique, tout');
await manque();
const e = await etat(); console.log('retour :', JSON.stringify(e));
if(e.chiffres !== a.chiffres) ecart('retour à l\'état de départ');
// Le bouton n'est que dans les Hotspots.
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(800);
if(await p.evaluate(() => !!document.getElementById('mapEbCompteLbl')?.offsetWidth)) ecart('le bouton visible au Récent');
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

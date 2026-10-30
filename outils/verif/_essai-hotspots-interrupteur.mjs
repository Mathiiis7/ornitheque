// Essai ponctuel (2026-10-29), démo locale, eBird bouchonné : l'interrupteur « Non observées » des Hotspots.
// Mathis : « l'interrupteur ne fait rien ». Éteint, les carrés, la bulle, le volet et la légende doivent
// compter aussi les espèces déjà vues ; rallumé, revenir à l'état de départ.
// node outils/verif/_essai-hotspots-interrupteur.mjs [largeur] [dossier des captures]
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
const etat =() => p.evaluate(() => {
  const hs = []; window.__carte.eachLayer(l => { if(l._hs) hs.push({ id:l._hotspotId, nb:l._hs.nb, aVoir:l._hs.aVoir }); });
  hs.sort((a, b) => a.id.localeCompare(b.id));
  const premiere = document.querySelector('#ctListeHot .ct-rang-hs .droite')?.textContent;
  const legende = [...document.querySelectorAll('.ml-txt')].map(x => x.textContent).filter(t => /^Espèces/.test(t)).join(' / ');
  return { coche:document.getElementById('ctHotManque')?.checked, hs, premiere, legende };
});
const bulle = async id => {
  await p.evaluate(id => { window.__carte.closePopup(); window.__carte.eachLayer(l => { if(l._hotspotId === id) l.openPopup(); }); }, id);
  await p.waitForTimeout(800);
  return p.evaluate(() => { const pop = document.querySelector('.leaflet-popup.ct-hb'); if(!pop) return null;
    const d = pop.querySelector('.ct-hb-deja'), n = pop.querySelector('.ct-hb-e:not(.ct-hb-deja)');
    const style = (el, sel, p) => el ? getComputedStyle(el.querySelector(sel))[p] : null;
    return { resume:pop.querySelectorAll('.ct-hb-s')[1]?.textContent || pop.querySelector('.ct-hb-s')?.textContent, lignes:pop.querySelectorAll('.ct-gl-l').length,
      deja:[...pop.querySelectorAll('.ct-hb-deja .ct-gl-nom')].map(x => x.textContent).join(', '), nbDeja:pop.querySelectorAll('.ct-hb-deja').length,
      couleurDeja:style(d, '.ct-gl-nom', 'color'), couleurAutre:style(n, '.ct-gl-nom', 'color'), opaciteDeja:style(d, '.tier-rond', 'opacity'), opaciteAutre:style(n, '.tier-rond', 'opacity') }; });
};
const bascule = async () => { await p.evaluate(() => { window.__carte.closePopup(); document.getElementById('ctHotManque').click(); }); await p.waitForTimeout(3000); };
const a = await etat();
console.log('allumé :', a.coche, '·', a.hs.length, 'hotspots · nombres', a.hs.map(h => h.nb).join(','), '· volet :', a.premiere, '· légende :', a.legende);
const id = a.hs.length ? a.hs[0].id : null;
const ba = id ? await bulle(id) : null;
console.log('   bulle :', JSON.stringify(ba));
if(largeur >= 700) await p.screenshot({ path:`${SORTIE}/hs-interrupteur-allume-${largeur}.png` });
await bascule();
const b = await etat();
console.log('éteint  :', b.coche, '·', b.hs.length, 'hotspots · nombres', b.hs.map(h => h.nb).join(','), '· volet :', b.premiere, '· légende :', b.legende);
const bb = id ? await bulle(id) : null;
console.log('   bulle :', JSON.stringify(bb));
if(largeur >= 700) await p.screenshot({ path:`${SORTIE}/hs-interrupteur-eteint-${largeur}.png` });
const parId = new Map(a.hs.map(h => [h.id, h.nb]));
const plusGrand = b.hs.filter(h => parId.has(h.id) && h.nb > parId.get(h.id)).length;
const plusPetit = b.hs.filter(h => parId.has(h.id) && h.nb < parId.get(h.id)).length;
console.log('   carrés qui comptent plus :', plusGrand, '· moins :', plusPetit);
if(b.coche !== false || !plusGrand || plusPetit) { console.log('   ÉCART : les nombres ne suivent pas'); defauts++; }
if(!ba || !bb || bb.lignes <= ba.lignes) { console.log('   ÉCART : la bulle ne montre pas les espèces déjà vues'); defauts++; }
// Les déjà vues grisées (variante A) : autant que la différence, nom d'une autre couleur, pastille pâlie ; aucune allumé.
if(!ba || !bb || ba.nbDeja !== 0 || bb.nbDeja !== bb.lignes - ba.lignes || bb.couleurDeja === bb.couleurAutre || !(+bb.opaciteDeja < 0.5) || +bb.opaciteAutre !== 1) { console.log('   ÉCART : déjà vues pas grisées'); defauts++; }
if(!/espèces? vues? ici/i.test(b.legende) || /non observées/.test(b.legende)) { console.log('   ÉCART : légende'); defauts++; }
if(!/espèce/.test(b.premiere || '') || /non observée/.test(b.premiere || '')) { console.log('   ÉCART : volet'); defauts++; }
await bascule();
const c = await etat();
console.log('rallumé :', c.coche, '· nombres', c.hs.map(h => h.nb).join(','), '· volet :', c.premiere);
if(JSON.stringify(c.hs) !== JSON.stringify(a.hs) || c.premiere !== a.premiere || c.legende !== a.legende) { console.log('   ÉCART : retour à l\'état de départ'); defauts++; }
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

// Essai ponctuel (2026-10-30), démo locale, faux eBird. Mode « Ces 30 jours » : le survol montre autant d'espèces
// que le chiffre du carré et que le haut de la bulle ; un carré à 0 est grisé et passe dessous ; l'historique ne
// change pas. Légende : nombre, favori, teintes, dans cet ordre.
// node outils/verif/_essai-hotspots-30j-survol.mjs [largeur] [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), SORTIE = process.argv[3] || '.';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:900 }, locale:'fr-FR', serviceWorkers:'block' });
const demandes = []; await bouchonEbird(ctx, demandes);
// Un lieu sans rien ces 30 jours, pour voir le carré à 0 (le faux eBird n'en a pas).
await ctx.route(/data\/obs\/LFRGES671\/recent/, r => r.fulfill({ status:200, contentType:'application/json', headers:{ 'access-control-allow-origin':'*' }, body:'[]' }));
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
let defauts = 0; const ecart = t => { console.log('   ÉCART :', t); defauts++; };
const legende = await p.evaluate(() => [...document.querySelectorAll('.ct-leg-formes .ml-txt')].map(x => x.textContent));
console.log('légende :', legende.join(' | '));
if(legende.join('|') !== 'Espèces non observées|Favori|De peu à beaucoup') ecart('légende');
// Tous les carrés : chiffre, grisé, rang, lignes et phrase du survol, lignes vues de la bulle.
const tour = () => p.evaluate(async () => {
  const ms = []; window.__carte.eachLayer(l => { if(l._hs) ms.push(l); });
  const r = [];
  for(const m of ms){
    const el = m.getElement()?.querySelector('.ct-hs');
    m.fire('mouseover');
    const t = document.querySelector('.leaflet-tooltip.ct-sv');
    const lignes = t.querySelectorAll('.ct-sv-l').length, phrases = [...t.querySelectorAll('.ct-sv-d')].map(x => x.textContent);
    const reste = +((phrases.join(' ').match(/et (\d+) autre/) || [])[1] || 0);
    m.fire('mouseout');
    m.openPopup(); await new Promise(f => setTimeout(f, 250));
    const titre = document.querySelector('.leaflet-popup.ct-hb .ct-hb-it')?.textContent || '';
    window.__carte.closePopup();
    r.push({ nom:m._hs.nom, chiffre:el.textContent, vide:el.classList.contains('ct-hs-vide'), z:m.options.zIndexOffset || 0, survol:lignes + reste, tete:phrases[0], titre, opacite:getComputedStyle(el).opacity });
  }
  return r;
});
const controle = (r, en30) => {
  for(const c of r){
    if(c.vide !== (c.chiffre === '0')) ecart(`${c.nom} : grisé ${c.vide} pour le chiffre ${c.chiffre}`);
    if(c.vide && (c.z !== 0 || !(+c.opacite < 1))) ecart(`${c.nom} : un 0 pas en retrait`);
    if(!c.vide && c.z <= 0) ecart(`${c.nom} : un carré plein passé dessous`);
    if(String(c.survol) !== c.chiffre) ecart(`${c.nom} : survol ${c.survol}, carré ${c.chiffre} (${c.tete})`);
    if(en30){
      const bulle = /·\s*(\d+)/.exec(c.titre)?.[1] || (/Aucune/.test(c.titre) ? '0' : null);
      if(bulle !== c.chiffre) ecart(`${c.nom} : bulle « ${c.titre} », carré ${c.chiffre}`);
    }
  }
};
const hist = await tour();
console.log('historique :', hist.length, 'carrés · chiffres', hist.map(c => c.chiffre).join(','));
if(hist.some(c => c.vide)) ecart('un carré grisé en historique');
controle(hist, false);
await p.evaluate(() => document.querySelector('[data-ct-compte="30"]').click()); await p.waitForTimeout(2500);
const t30 = await tour();
console.log('30 jours :', 'chiffres', t30.map(c => c.chiffre).join(','), '· grisés', t30.filter(c => c.vide).length);
console.log('   exemples :', JSON.stringify(t30.slice(0, 2)), JSON.stringify(t30.find(c => c.vide) || null));
if(!t30.some(c => c.vide)) ecart('aucun carré à 0 dans cet essai : le grisé n\'est pas vu');
controle(t30, true);
await p.evaluate(() => { let m = null; window.__carte.eachLayer(l => { if(l._hotspotId === 'LFRGES671') m = l; }); window.__carte.setView(m.getLatLng(), 11, { animate:false }); });
await p.waitForTimeout(1200);
await p.screenshot({ path:`${SORTIE}/hs-30j-${largeur}.png` });
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
if(erreurs.length) defauts++;
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

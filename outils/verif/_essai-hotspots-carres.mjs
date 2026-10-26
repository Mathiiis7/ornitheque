// Essai ponctuel (2026-10-27), démo locale : les hotspots en carrés et leur liste dans le panneau.
// 1. Pays de la Loire, onglet Hotspots (ordinateur, puis téléphone) : carrés, lignes, clic sur une ligne.
// 2. eBird refuse tout (429 simulé) : le compte doit dire « eBird ne répond pas », pas « Aucun hotspot ».
// node outils/verif/_essai-hotspots-carres.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
async function essai(nom, opts, refuser){
  const ctx = await nav.newContext({ locale:'fr-FR', ...opts });
  await ctx.addInitScript(() => {
    const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
    att();
  });
  if(refuser) await ctx.route(/ornitheque-relais|api\.ebird\.org/, r => /ref\/hotspot|spplist/.test(r.request().url()) ? r.fulfill({ status:429, body:'' }) : r.continue());
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
  await clicForme('cc', 'FR'); await p.waitForTimeout(2000);
  await clicForme('ebird', 'FR-PDL'); await p.waitForTimeout(2000);
  await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click());
  let texte = '';
  for(let i = 0; i < 150; i++){ await p.waitForTimeout(1000); texte = await p.evaluate(() => document.getElementById('mapEbCount')?.textContent || ''); if(!texte.includes('…') && i > 1) break; }
  const etat = await p.evaluate(() => {
    const carres = [...document.querySelectorAll('.ct-hs-ico .ct-hs')];
    const lignes = [...document.querySelectorAll('#ctListeHot .ct-rang-hs')];
    const nbCarres = carres.map(c => +c.textContent).sort((a, b) => b - a);
    const nbLignes = lignes.map(l => +l.querySelector('.droite b').textContent);
    return { carres:carres.length, ronds:document.querySelectorAll('.ct-carte path.leaflet-interactive[fill="#1e6091"]').length, lignes:lignes.length,
      memesNombres:JSON.stringify(nbCarres) === JSON.stringify(nbLignes), premiere:lignes[0] ? lignes[0].innerText.replace(/\s+/g, ' ') : '',
      onglet:document.querySelector('#ctOnglets [data-onglet="hot"] .ct-nb')?.textContent, legende:document.querySelector('.ct-legende')?.innerText.replace(/\s+/g, ' ').slice(-90) };
  });
  console.log(nom, ': « ' + texte + ' »', JSON.stringify(etat));
  if(!refuser){
    await p.screenshot({ path:`${SORTIE}/hs-${nom}.png` });
    // Clic sur la première ligne : la carte va au carré et ouvre sa bulle.
    const b = await p.$('#ctListeHot .ct-rang-hs');
    if(b){ await b.scrollIntoViewIfNeeded(); await b.click(); await p.waitForTimeout(800);
      const bulle = await p.evaluate(() => document.querySelector('.leaflet-popup-content b')?.textContent || 'aucune bulle');
      console.log('   clic sur la 1re ligne -> bulle :', bulle);
      await p.screenshot({ path:`${SORTIE}/hs-${nom}-clic.png` }); }
    const cible = await p.evaluate(() => { const r = document.querySelector('#ctListeHot .ct-rang-hs')?.getBoundingClientRect(); return r ? Math.round(r.height) : 0; });
    console.log('   hauteur d\'une ligne (px d\'écran) :', cible, '; au doigt :', await p.evaluate(() => matchMedia('(pointer: coarse)').matches));
  }
  console.log('   erreurs :', erreurs.length ? erreurs : 'aucune');
  await ctx.close();
}
await essai('ordinateur', { viewport:{ width:1440, height:900 } });
await essai('telephone', { viewport:{ width:375, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
await essai('refus', { viewport:{ width:1440, height:900 } }, true);
await nav.close();

// Essai ponctuel (2026-10-27), démo locale.
// 1. Récent sur un pays entier (France) : la liste, aucun point du Récent sur la carte ; déplier une espèce
//    pose ses points (une demande à eBird), la replier les retire.
// 2. Recherche d'une espèce : ses points ont le survol du Récent, et un clic ouvre la fiche, plus de bulle.
// node outils/verif/_essai-pays-deplie.mjs [dossier des captures]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
async function essai(nom, opts){
  const ctx = await nav.newContext({ locale:'fr-FR', ...opts });
  await ctx.addInitScript(() => {
    const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
    att();
  });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  const req = []; p.on('request', r => { if(/ornitheque-relais/.test(r.url())) req.push(r.url().replace(/^.*\/v2\//, '').replace(/\?.*$/, '')); });
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  const points = () => p.evaluate(() => document.querySelectorAll('.ct-carte .leaflet-marker-pane .ct-pt-ico, .ct-carte .leaflet-marker-pane .ct-gr-ico').length);
  const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
  await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
  await p.waitForTimeout(500);
  await clicForme('cc', 'FR');
  for(let i = 0; i < 30; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => document.getElementById('ctRecEtat')?.textContent || ''); if(!t.includes('…') && i > 2) break; }
  await p.waitForTimeout(1000);
  const lignes = await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang-n').length);
  console.log(nom, '· France entière : lignes de la liste', lignes, '; points sur la carte', await points(), '; note :', await p.evaluate(() => document.querySelector('#ctVoletRecent .ct-note')?.textContent));
  // 1. Déplier la première espèce.
  const avant = req.length;
  const sci = await p.evaluate(() => { const b = document.querySelector('#ctListeRecent .ct-rang-n'); b.scrollIntoView(); b.click(); return b.dataset.sci; });
  for(let i = 0; i < 20; i++){ await p.waitForTimeout(500); if(await points()) break; }
  await p.waitForTimeout(800);
  const obs = await p.evaluate(() => document.querySelectorAll('#ctListeRecent .ct-rang-obs .ct-obs').length);
  console.log('   dépliée :', sci, '; points sur la carte', await points(), '; observations sous la ligne', obs, '; demandes à eBird', req.length - avant, JSON.stringify(req.slice(avant)));
  if(nom === 'ordinateur') await p.screenshot({ path:`${SORTIE}/pays-deplie.png` });
  await p.evaluate(() => document.querySelector('#ctListeRecent .ct-rang-n[aria-expanded="true"]').click());
  await p.waitForTimeout(800);
  console.log('   repliée : points sur la carte', await points());
  // 2. La recherche d'une espèce.
  const noms = await p.evaluate(() => [...document.querySelectorAll('#ctListeRecent .ct-rang .nom')].map(x => x.textContent));
  let cherche = '';
  for(const nm of noms.slice(0, 25)){
    await p.fill('#mapSearch', ''); await p.click('#mapSearch'); await p.keyboard.type(nm, { delay:10 });
    await p.waitForTimeout(500);
    if(await p.evaluate(() => [...document.querySelectorAll('.map-search-suggest-item')].some(x => !/reset/.test(x.textContent)))){ cherche = nm; break; }
  }
  console.log('   tapé :', JSON.stringify(cherche), '; champ :', JSON.stringify(await p.inputValue('#mapSearch')), '; suggestions :', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('.map-search-suggest-item')].slice(0, 4).map(x => x.textContent.trim().slice(0, 40)))));
  const choix = await p.evaluate(() => { const it = [...document.querySelectorAll('.map-search-suggest-item')].find(x => !/reset/.test(x.textContent)); if(it){ it.dispatchEvent(new MouseEvent('mousedown', { bubbles:true })); it.click(); return it.textContent.trim().slice(0, 40); } return ''; });
  for(let i = 0; i < 20; i++){ await p.waitForTimeout(500); if(await points()) break; }
  await p.waitForTimeout(1000);
  const n = await points();
  console.log('   recherche « ' + choix + ' » : points', n);
  const pt = await p.$('.ct-carte .leaflet-marker-pane .ct-pt-ico');
  if(pt){
    if(nom === 'ordinateur'){ await pt.hover(); await p.waitForTimeout(800); console.log('   survol :', JSON.stringify(await p.evaluate(() => document.querySelector('.leaflet-tooltip.ct-sv')?.innerText.replace(/\s+/g, ' ').slice(0, 120) || 'aucun'))); }
    await pt.click(); await p.waitForTimeout(800);
    if(nom !== 'ordinateur'){ await pt.click().catch(() => {}); await p.waitForTimeout(800); }
    const etat = await p.evaluate(() => ({ bulle:!!document.querySelector('.ct-carte .leaflet-popup'), fiche:!document.getElementById('speciesModal')?.hidden }));
    console.log('   clic sur un point : ancienne bulle', etat.bulle, '; fiche ouverte', etat.fiche, (!etat.bulle && etat.fiche) ? 'CONFORME' : 'DÉFAUT');
  }
  console.log('   erreurs :', erreurs.length ? erreurs : 'aucune');
  await ctx.close();
}
await essai('ordinateur', { viewport:{ width:1440, height:900 } });
await essai('telephone', { viewport:{ width:375, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
await nav.close();

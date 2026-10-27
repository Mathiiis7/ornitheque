// Essai ponctuel (2026-10-27), démo locale : le choix du pays dans les filtres du Récent et des Hotspots.
// 1. Récent : le sélecteur montre un nombre d'espèces par pays ; choisir l'Espagne l'ouvre, et le nombre
//    annoncé est celui de l'onglet Récent une fois le pays ouvert.
// 2. Hotspots : tant que le relais n'a pas sa nouvelle adresse en ligne, l'essai l'imite pour FR, ES et PT
//    (la liste des hotspots du pays lue par le relais actuel, le meilleur calculé ici), « – » ailleurs.
// node outils/verif/_essai-pays-eb.mjs [dossier des captures] [--vrai : ne pas imiter le relais]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '.';
const VRAI = process.argv.includes('--vrai');
const nav = await chromium.launch();
async function essai(nom, opts){
  const ctx = await nav.newContext({ locale:'fr-FR', ...opts });
  await ctx.addInitScript(() => {
    const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
    att();
  });
  if(!VRAI) await ctx.route(/carte\/meilleur-hotspot\/([A-Z]{2})/, async route => {
    const cc = route.request().url().match(/meilleur-hotspot\/([A-Z]{2})/)[1];
    console.log('      (imitation du relais :', cc + ')');
    if(!['FR', 'ES', 'PT'].includes(cc)) return route.fulfill({ status:404, body:'' });
    try{
    const r = await fetch(`https://ornitheque-relais.vercel.app/v2/ref/hotspot/${cc}?fmt=json`, { headers:{ Origin:'http://localhost:8765' } });
    const l = await r.json(), depuis = new Date(Date.now() - 2 * 365 * 864e5).toISOString().slice(0, 10);
    const m = l.filter(h => h.numSpeciesAllTime > 0 && String(h.latestObsDt || '').slice(0, 10) >= depuis).sort((a, b) => b.numSpeciesAllTime - a.numSpeciesAllTime)[0];
    route.fulfill({ status:200, contentType:'application/json', headers:{ 'Access-Control-Allow-Origin':'http://localhost:8765' },
      body:JSON.stringify({ cc, hotspots:l.length, n:m.numSpeciesAllTime, nom:m.locName, locId:m.locId }) });
    }catch(e){ console.log('      imitation en échec :', cc, e.message); route.fulfill({ status:502, body:'' }); }
  });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  const relais = []; p.on('request', r => { if(/ornitheque-relais/.test(r.url())) relais.push({ t:Date.now(), u:r.url().replace(/^.*\/v2\//, '').replace(/\?.*$/, '') }); });
  const meilleurs = []; p.on('requestfinished', async r => { if(/meilleur-hotspot/.test(r.url())) meilleurs.push(r.url().slice(-2) + ':' + ((await r.response())?.status())); });
  p.on('requestfailed', r => { if(/meilleur-hotspot/.test(r.url())) meilleurs.push(r.url().slice(-2) + ':échec ' + r.failure()?.errorText); });
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  const ligne = cc => p.evaluate(cc => { const r = document.querySelector(`.cp-modal-backdrop .cp-item[data-cc="${cc}"]`); return r ? r.querySelector('.cp-item-meta')?.textContent.trim() : 'absent'; }, cc);
  const ouvrirSelecteur = async onglet => {
    await p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`).click(), onglet);
    await p.waitForTimeout(800);
    // Les filtres sont repliés sous « Filtres » dans le Récent.
    await p.evaluate(() => { const d = document.querySelector('#ctVoletRecent details.ct-pli'); if(d) d.open = true; });
    const b = await p.$('#ctEbPaysBtn'); await b.scrollIntoViewIfNeeded(); await b.click();
    await p.waitForSelector('.cp-modal-backdrop');
  };
  // 1. Récent
  await ouvrirSelecteur('recent');
  console.log(nom, '· Récent, titre :', await p.evaluate(() => document.querySelector('.cp-modal-title span').textContent), '; FR à l\'ouverture :', await ligne('FR'));
  for(let i = 0; i < 60; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => [...document.querySelectorAll('.cp-modal-backdrop .cp-item-meta')].filter(x => x.textContent.trim() === '…').length); if(!t) break; }
  const es = await ligne('ES'), fr = await ligne('FR'), pt = await ligne('PT');
  console.log('   après chargement : France', fr, '; Espagne', es, '; Portugal', pt, '; lignes encore « … » :',
    await p.evaluate(() => [...document.querySelectorAll('.cp-modal-backdrop .cp-item-meta')].filter(x => x.textContent.trim() === '…').length));
  if(nom === 'ordinateur') await p.screenshot({ path:`${SORTIE}/pays-recent.png` });
  await p.click('.cp-modal-backdrop .cp-item[data-cc="ES"]');
  for(let i = 0; i < 30; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => document.getElementById('ctRecEtat')?.textContent || ''); if(!t.includes('…') && i > 2) break; }
  const apres = await p.evaluate(() => ({ bouton:document.querySelector('#ctEbPaysBtn .cp-btn-label').textContent, onglet:document.querySelector('#ctOnglets [data-nb="recent"]')?.textContent,
    region:document.querySelector('[data-ct-choix="mapEbRegion"] .cp-btn-label')?.textContent }));
  console.log('   Espagne choisie : bouton', JSON.stringify(apres.bouton), '; onglet Récent', apres.onglet, '; annoncé', es, (es.startsWith(apres.onglet + ' ') ? 'CONFORME' : 'DÉFAUT'), '; menu Région :', apres.region);
  // 2. Hotspots
  await ouvrirSelecteur('hot');
  const tHot = Date.now();
  for(let i = 0; i < 90; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => [...document.querySelectorAll('.cp-modal-backdrop .cp-item-meta')].filter(x => x.textContent.trim() === '…').length); if(!t) break; }
  console.log('   Hotspots, titre :', await p.evaluate(() => document.querySelector('.cp-modal-title span').textContent), '; France', await ligne('FR'), '; Espagne', await ligne('ES'), '; Portugal', await ligne('PT'), '; Italie', await ligne('IT'),
    '; bulle FR :', await p.evaluate(() => document.querySelector('.cp-modal-backdrop .cp-item[data-cc="FR"]')?.dataset.tip));
  console.log('   demandes au relais pendant les Hotspots :', relais.filter(r => r.t >= tHot).length, '; les 5 dernières :', relais.slice(-5).map(r => Math.round((r.t - tHot) / 1000) + ' s ' + r.u).join(' | '));
  console.log('   demandes du meilleur hotspot :', meilleurs.length, 'en', Math.round((Date.now() - tHot) / 1000), 's :', meilleurs.slice(0, 6).join(' '));
  if(nom === 'ordinateur') await p.screenshot({ path:`${SORTIE}/pays-hotspots.png` });
  await p.click('.cp-modal-backdrop .cp-item[data-cc=""]');
  await p.waitForTimeout(1500);
  console.log('   « Tous les pays » : bouton', JSON.stringify(await p.evaluate(() => document.querySelector('#ctEbPaysBtn .cp-btn-label').textContent)), '; compte', JSON.stringify(await p.evaluate(() => document.getElementById('mapEbCount')?.textContent)));
  const stock = await p.evaluate(() => { let n = 0, o = 0; for(let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if(k.startsWith('ebc:')){ n++; o += localStorage.getItem(k).length; } } return n + ' copies, ' + Math.round(o / 1024) + ' Ko'; });
  console.log('   copies eBird gardées dans le navigateur :', stock);
  if(nom === 'telephone'){ const h = await p.evaluate(() => Math.round(document.getElementById('ctEbPaysBtn').getBoundingClientRect().height)); console.log('   hauteur du bouton Pays au doigt (px d\'écran) :', h); }
  console.log('   erreurs :', erreurs.length ? erreurs : 'aucune');
  await ctx.close();
}
await essai('ordinateur', { viewport:{ width:1440, height:900 } });
await essai('telephone', { viewport:{ width:375, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
await nav.close();

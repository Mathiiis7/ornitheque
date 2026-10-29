// Essai ponctuel (2026-10-29), démo locale, eBird bouchonné : Jersey, Guernesey et l'île de Man se
// cliquent sur la carte du monde et ouvrent le Royaume-Uni sur leur zone ; le Royaume-Uni ouvert les
// découvre de son voile. Puis l'ordre des pastilles et des onglets (Récent, Ligue, Hotspots).
// node outils/verif/_essai-dependances.mjs [dossier des captures]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
let defauts = 0;
for(const [nom, opts] of [['ordinateur', { viewport:{ width:1300, height:900 } }], ['telephone', { viewport:{ width:375, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 }]]){
  const ctx = await nav.newContext({ locale:'fr-FR', ...opts });
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
  const ordre = await p.evaluate(() => [[...document.querySelectorAll('#ctCouches [data-couche]')].map(b => b.dataset.couche).join(','), [...document.querySelectorAll('#ctOnglets [data-onglet]')].map(b => b.dataset.onglet).join(',')]);
  console.log(nom, '· pastilles', ordre[0], '· onglets', ordre[1], ordre[0] === 'recent,ligue,hot' && ordre[1] === 'recent,ligue,hot' ? 'CONFORME' : 'DÉFAUT');
  if(!(ordre[0] === 'recent,ligue,hot' && ordre[1] === 'recent,ligue,hot')) defauts++;
  await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(800);
  const voile = villes => p.evaluate(villes => {
    let v = null; window.__carte.eachLayer(l => { if(l.options && l.options.pane === 'ctVoile' && l.getLatLngs) v = l; });
    if(!v) return 'aucun voile';
    const tr = v.getLatLngs().slice(1);
    const dans = (lat, lng) => tr.some(r => { let c = false; for(let i = 0, j = r.length - 1; i < r.length; j = i++){ const a = r[i], b = r[j]; if((a.lat > lat) !== (b.lat > lat) && lng < (b.lng - a.lng) * (lat - a.lat) / (b.lat - a.lat) + a.lng) c = !c; } return c; });
    return villes.filter(([, a, b]) => dans(a, b)).map(x => x[0]).join(', ') || 'rien';
  }, villes);
  const VILLES = [['Saint-Hélier', 49.215, -2.13], ['Saint-Pierre-Port', 49.455, -2.55], ['Douglas', 54.16, -4.50], ['Londres', 51.5, -0.12]];
  for(const [cc, ville] of [['JE', 'Saint-Hélier'], ['GG', 'Saint-Pierre-Port'], ['IM', 'Douglas']]){
    await p.evaluate(cc => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === cc && !pr.ebird && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); }, cc);
    await p.waitForTimeout(3500);
    const e = await p.evaluate(() => ({ bouton:(document.getElementById('ctEbPaysBtn')?.textContent || '').trim(), titre:(document.querySelector('#ctZone h2, #ctZone .ct-z-nom')?.textContent || '').trim(), ariane:(document.getElementById('ctAriane')?.textContent || '').replace(/\s+/g, ' ').trim(), liste:(document.querySelector('#ctListeRecent .ct-compte, #ctListeRecent .ct-vide')?.textContent || '').slice(0, 60) }));
    const deg = await voile(VILLES);
    const ok = deg === ville;
    console.log(`   clic ${cc} : bouton « ${e.bouton} » · ${e.ariane} · liste « ${e.liste} » · voile dégage : ${deg} ${ok ? 'CONFORME' : 'DÉFAUT'}`);
    if(!ok) defauts++;
    if(nom === 'ordinateur' && cc === 'JE') await p.screenshot({ path:`${SORTIE}/jersey.png` });
  }
  console.log('   demandes à eBird pour les îles :', [...new Set(demandes.filter(d => /\/(JE|GG|IM)\b/.test(d)))].join(' '));
  // Le Royaume-Uni entier : les trois îles hors du voile avec lui.
  await p.evaluate(() => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === 'FR' && !pr.ebird && l.fire && !f) f = l; }); f.fire('click', { latlng:f.getBounds().getCenter() }); });
  await p.waitForTimeout(2500);
  await p.evaluate(() => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === 'GB' && !pr.ebird && l.fire && !f) f = l; }); f.fire('click', { latlng:L.latLng(52.5, -1.5) }); });
  await p.waitForTimeout(3500);
  const gb = await voile(VILLES);
  console.log(`   Royaume-Uni ouvert, voile dégage : ${gb} ${gb === 'Saint-Hélier, Saint-Pierre-Port, Douglas, Londres' ? 'CONFORME' : 'DÉFAUT'}`);
  if(gb !== 'Saint-Hélier, Saint-Pierre-Port, Douglas, Londres') defauts++;
  console.log('   erreurs :', erreurs.length ? erreurs : 'aucune');
  if(erreurs.length) defauts++;
  await ctx.close();
}
console.log(defauts ? `DÉFAUT (${defauts})` : 'CONFORME');
await nav.close();

// Essai ponctuel (2026-10-28), démo locale, eBird en direct : les 8 pays aux regroupements montrent leurs
// groupes. Un clic sur « Irlande du Nord » (GB-R10) lit ses 8 zones eBird, au Récent comme aux Hotspots,
// et « Zone » mesure la rareté sur le groupe. Même chose sur un groupe slovène (le plus gros : 33 zones).
// node outils/verif/_essai-zone-regroupee.mjs [dossier des captures] [GB:GB-R10]
import { chromium } from 'playwright';
const SORTIE = process.argv[2] || '.';
const nav = await chromium.launch();
async function essai(cc, groupe){
  const ctx = await nav.newContext({ locale:'fr-FR', viewport:{ width:1280, height:900 } });
  await ctx.addInitScript(() => {
    const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
    att();
  });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  const statuts = {}; p.on('response', r => { if(/ornitheque-relais/.test(r.url())){ const k = r.url().replace(/^.*\/v2\//, '').split('/')[0] + ':' + r.status(); statuts[k] = (statuts[k] || 0) + 1; } });
  process.on('exit', () => console.log('   réponses du relais', JSON.stringify(statuts)));
  const req = []; p.on('request', r => { if(/ornitheque-relais|api\.ebird/.test(r.url())) req.push(r.url().replace(/^.*\/v2\//, '').replace(/\?.*$/, '')); });
  await p.goto((process.env.BASE || 'http://localhost:8765') + '/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click());
  await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="recent"]'); if(b.getAttribute('aria-pressed') !== 'true') b.click(); });
  await p.waitForTimeout(800);
  const clic = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
  await clic('cc', cc);
  await p.waitForTimeout(3000);
  const groupes = await p.evaluate(cc => { const g = []; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.ebird && pr.ebird.startsWith(cc)) g.push(pr.ebird + ':' + (pr.zones || []).length); }); return g; }, cc);
  console.log(cc, '· formes sur la carte', groupes.length, groupes.join(' '));
  const avant = req.length, t0 = Date.now();
  await clic('ebird', groupe);
  for(let i = 0; i < 60; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => document.getElementById('ctRecEtat')?.textContent || ''); if(!t.includes('…') && i > 3) break; }
  const duree = Date.now() - t0;
  await p.waitForTimeout(1000);
  const etat = () => p.evaluate(() => {
    const z = document.querySelector('#ctVoletRecent [data-ct-portee="zone"]');
    return { titre:document.getElementById('ctZoneNom')?.textContent, etat:document.getElementById('ctRecEtat')?.textContent, lignes:document.querySelectorAll('#ctListeRecent .ct-rang').length,
      zoneGrisee:z && z.getAttribute('aria-disabled'), note:document.querySelector('#ctVoletRecent .ct-portee-note')?.textContent };
  });
  const rec = req.slice(avant);
  console.log('   Récent', JSON.stringify(await etat()), '; demandes', rec.length, [...new Set(rec.map(u => u.split('/')[2]))].slice(0, 40).join(','), '; en', duree, 'ms');
  await p.evaluate(() => { document.getElementById('ctPliRecent').open = true; document.querySelector('#ctVoletRecent [data-ct-portee="zone"]').click(); });
  await p.waitForTimeout(3000);
  console.log('   Zone allumée', JSON.stringify(await etat()));
  await p.screenshot({ path:`${SORTIE}/groupe-${cc}.png` });
  // Hotspots du même groupe.
  const a2 = req.length;
  await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click());
  await p.evaluate(() => { const b = document.querySelector('#ctCouches [data-couche="hot"]'); if(b.getAttribute('aria-pressed') !== 'true') b.click(); });
  // Les carrés arrivent au fur et à mesure depuis la v971 : on attend que le chargement soit fini, plus le premier.
  for(let i = 0; i < 90; i++){ await p.waitForTimeout(1000); if(i > 2 && !/chargement/.test(await p.evaluate(() => document.getElementById('mapEbCount')?.textContent || ''))) break; }
  await p.waitForTimeout(1000);
  const finHot = await p.evaluate(() => { const c = []; window.__carte.eachLayer(l => { if(l._hs) c.push(l._hs.nb); }); return { carres:c.length, ligne:document.getElementById('mapEbCount')?.textContent, meilleur:Math.max(0, ...c) }; });
  console.log('   Hotspots', JSON.stringify(finHot), '; demandes de zones', req.slice(a2).filter(u => u.startsWith('ref/hotspot')).length, '; listes d\'espèces', req.slice(a2).filter(u => u.startsWith('product/spplist')).length);
  console.log('   erreurs', erreurs.length, erreurs.slice(0, 3));
  await ctx.close();
}
const [cc, g] = (process.argv[3] || 'GB:GB-R10').split(':');
await essai(cc, g);
await nav.close();

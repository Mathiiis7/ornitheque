// Essai ponctuel (2026-10-26), démo locale : l'onglet de la Carte ne change qu'à la main. Pour chaque
// onglet (Ligue, Récent, Hotspots) : ouvrir la France, cliquer une région, cliquer l'Espagne, puis ↺.
// À chaque pas : l'onglet ouvert, les requêtes eBird parties, ce que dit le panneau.
// node outils/verif/_essai-mode-garde.mjs [largeur]
import { chromium } from 'playwright';
const largeur = +(process.argv[2] || 1440), mobile = largeur < 700;
const nav = await chromium.launch();
for(const onglet of (process.argv[3] || 'ligue,recent,hot').split(',')){
  const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
  await ctx.addInitScript(() => {
    const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
    att();
  });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message)); p.on('console', m => { if(m.type() === 'error') erreurs.push(m.text()); });
  const req = []; p.on('request', r => { if(/ornitheque-relais|api\.ebird\.org/.test(r.url())) req.push(r.url().replace(/^https?:\/\/[^/]+\/v2\//, '').replace(/\?.*$/, '')); });
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  await p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`).click(), onglet);
  await p.waitForTimeout(1500);
  const etat = async quoi => {
    for(let i = 0; i < 60; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => (document.getElementById('mapEbCount')?.textContent || '') + (document.getElementById('ctRecEtat')?.textContent || '')); if(!t.includes('…')) break; }
    const e = await p.evaluate(() => ({
      onglet:document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet,
      hotspots:(() => { let n = 0; window.__carte.eachLayer(l => { if(l._hotspotId) n++; }); return n; })(),
      texte:((document.getElementById('mapEbCount')?.textContent || '') + ' ' + (document.querySelector('#ctZone .ct-vide b')?.textContent || '')).trim().slice(0, 80),
    }));
    const spp = req.filter(u => u.startsWith('product/spplist')).length;
    console.log(`  ${quoi.padEnd(16)} onglet ${e.onglet}  hotspots ${e.hotspots}  requêtes ${req.length} (dont listes d'espèces ${spp})  « ${e.texte} »`);
    req.length = 0;
  };
  const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
  console.log('== onglet ' + onglet);
  await etat('arrivée');
  console.log('  (France trouvée : ' + await clicForme('cc', 'FR') + ')'); await etat('France');
  // Une région française : les formes de data/carte-regions.json.
  const reg = await p.evaluate(() => { let c = ''; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(!c && pr && pr.ebird === 'FR-PDL') c = pr.ebird; }); return c; });
  console.log('  (région trouvée : ' + (reg ? await clicForme('ebird', 'FR-PDL') : false) + ')'); await etat('Pays de la Loire'); await p.screenshot({ path:'C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/758021a1-dbe9-4f01-a281-98ef248c4ecc/scratchpad/mode-' + onglet + '-pdl-' + largeur + '.png' });
  console.log('  (Espagne trouvée : ' + await clicForme('cc', 'ES') + ')'); await etat('Espagne');
  await p.evaluate(() => document.querySelector('#ctAriane [data-carte="monde"]')?.click());
  await etat('↺ / Tous les pays');
  console.log('  erreurs :', erreurs.length ? erreurs : 'aucune');
  await ctx.close();
}
await nav.close();

// Essai ponctuel (2026-10-26), démo locale : le crayon dans chaque onglet (Ligue, Récent, Hotspots).
// France ouverte, triangle dessiné autour de Nantes, Entrée : l'onglet reste-t-il, que montre-t-il,
// combien de requêtes eBird ? Puis « Effacer ».
// node outils/verif/_essai-crayon.mjs [onglets] [largeur]
import { chromium } from 'playwright';
const onglets = (process.argv[2] || 'ligue,recent').split(',');
const largeur = +(process.argv[3] || 1440), mobile = largeur < 700;
const DOS = 'C:/Users/mathi/AppData/Local/Temp/claude/C--Users-mathi-Documents-0-Claude-1-App-ornitheque/758021a1-dbe9-4f01-a281-98ef248c4ecc/scratchpad';
const TRIANGLE = [[47.45, -1.85], [47.45, -1.25], [47.05, -1.55]];
const nav = await chromium.launch();
for(const onglet of onglets){
  const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
  await ctx.addInitScript(() => {
    const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
    att();
  });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  const req = [], statuts = []; p.on('request', r => { if(/ornitheque-relais|api\.ebird\.org/.test(r.url())) req.push(r.url()); });
  p.on('response', r => { if(/ornitheque-relais|api\.ebird\.org/.test(r.url()) && r.status() !== 200) statuts.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+\/v2\//, '').replace(/\?.*$/, '')); });
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(1500);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  await p.keyboard.press('Escape');
  await p.evaluate(o => document.querySelector(`#ctOnglets [data-onglet="${o}"]`).click(), onglet);
  await p.waitForTimeout(800);
  // La France, ouverte d'abord dans la Ligue : les Hotspots ne lisent pas la France entière pour rien.
  await p.evaluate(() => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr.cc === 'FR' && l.fire && !f) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); });
  await p.waitForTimeout(2500);
  req.length = 0;
  const visible = sel => p.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; }, sel);
  console.log('== onglet ' + onglet + ' : crayon visible ' + await visible('#mapDrawStart'));
  await p.evaluate(() => document.querySelector('#mapDrawStart').click());
  await p.waitForTimeout(300);
  for(const ll of TRIANGLE){ await p.evaluate(ll => { window.__carte.fire('click', { latlng:L.latLng(ll[0], ll[1]) }); }, ll); await p.waitForTimeout(150); }
  await p.keyboard.press('Enter');
  for(let i = 0; i < 90; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => (document.getElementById('mapEbCount')?.textContent || '') + (document.getElementById('ctRecEtat')?.textContent || '')); if(!t.includes('…') && i > 2) break; }
  await p.waitForTimeout(1500);
  const e = await p.evaluate(tri => {
    const dedans = (la, lo) => { let c = false; for(let i = 0, j = tri.length - 1; i < tri.length; j = i++){ const [yi, xi] = tri[i], [yj, xj] = tri[j]; if(((yi > la) !== (yj > la)) && (lo < (xj - xi) * (la - yi) / (yj - yi) + xi)) c = !c; } return c; };
    let ligueVis = 0, ligueDehors = 0, hot = 0, hotDehors = 0, rec = 0;
    window.__carte.eachLayer(l => {
      const lst = l.getAllChildMarkers ? [] : (l.getLayers ? l.getLayers() : [l]);
      for(const m of lst){
        if(!m.getLatLng) continue; const ll = m.getLatLng();
        if(m._ligue && m.options.opacity !== 0 && !(m._icon && m._icon.style.display === 'none')){ ligueVis++; if(!dedans(ll.lat, ll.lng)) ligueDehors++; }
        if(m._hotspotId){ hot++; if(!dedans(ll.lat, ll.lng)) hotDehors++; }
        if(m._rec) rec++;
      }
    });
    return { onglet:document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet, titre:document.querySelector('#ctZone h2, #ctZone .ct-z-nom')?.textContent,
      effacer:getComputedStyle(document.getElementById('mapDrawClear')).display !== 'none', ligueVis, ligueDehors, hot, hotDehors, rec,
      texte:(document.getElementById('mapEbCount')?.textContent || '').slice(0, 90), couches:document.querySelector('.ct-leg-vide, #ctLegende')?.textContent.slice(0, 40) };
  }, TRIANGLE);
  const spp = req.filter(u => /spplist/.test(u)).length;
  console.log('  après le dessin :', JSON.stringify(e), '| requêtes', req.length, '(listes d\'espèces ' + spp + ')', statuts.length ? 'refus : ' + statuts.slice(0, 3).join(', ') : '');
  await p.screenshot({ path:`${DOS}/crayon-${onglet}-${largeur}.png` });
  await p.evaluate(() => document.getElementById('mapDrawClear').click());
  await p.waitForTimeout(2500);
  console.log('  après Effacer :', JSON.stringify(await p.evaluate(() => ({ onglet:document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet, effacer:getComputedStyle(document.getElementById('mapDrawClear')).display !== 'none' }))));
  console.log('  erreurs :', erreurs.length ? erreurs : 'aucune');
  await ctx.close();
}
await nav.close();

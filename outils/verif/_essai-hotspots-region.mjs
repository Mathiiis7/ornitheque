// Essai ponctuel (2026-10-26), démo locale, coûte des appels eBird (le relais en garde une partie en cache).
// 1. Hotspots d'une région cliquée : Ligue > France > Pays de la Loire, puis l'onglet Hotspots.
//    Combien de hotspots, combien de listes d'espèces demandées, des refus ?
// 2. Un chargement remplacé s'arrête-t-il ? Bretagne cliquée dans l'onglet Hotspots, puis, 3 s après,
//    un triangle dessiné autour de Nantes. On compte les listes d'espèces demandées APRÈS le dessin pour
//    des hotspots hors du triangle (la Bretagne) : 8 au plus (les appels déjà partis), 0 idéalement.
// node outils/verif/_essai-hotspots-region.mjs
import { chromium } from 'playwright';
const TRIANGLE = [[47.45, -1.85], [47.45, -1.25], [47.05, -1.55]];
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:1440, height:900 }, locale:'fr-FR' });
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
});
// Les blocages de la page : un tic toutes les 100 ms, tout retard de plus d'une seconde est dit.
await ctx.addInitScript(() => { let t = performance.now(); setInterval(() => { const n = performance.now(); if(n - t > 1100) console.log('TRACE blocage ' + Math.round(n - t - 100) + ' ms'); t = n; }, 100); });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
const t0 = Date.now(); p.on('console', m => { if(m.text().startsWith('TRACE')) console.log(((Date.now() - t0) / 1000).toFixed(1) + ' s', m.text()); });
const req = [], refus = [], listes = {};
p.on('response', async r => { const m = r.url().match(/ref\/hotspot\/([A-Z0-9-]+)/); if(m && r.status() === 200){ try{ listes[m[1]] = (await r.json()).map(h => h.locId); }catch(_){} } });
p.on('request', r => { if(/ornitheque-relais|api\.ebird\.org/.test(r.url())) req.push({ t:Date.now(), u:r.url().replace(/^https?:\/\/[^/]+\/v2\//, '').replace(/\?.*$/, '') }); });
p.on('response', r => { if(/ornitheque-relais|api\.ebird\.org/.test(r.url()) && r.status() !== 200) refus.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+\/v2\//, '').replace(/\?.*$/, '')); });
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
const finChargement = async () => { for(let i = 0; i < 120; i++){ await p.waitForTimeout(1000); const t = await p.evaluate(() => document.getElementById('mapEbCount')?.textContent || ''); if(!t.includes('…') && i > 1) return t; } return 'pas fini en 120 s'; };
const hotspots = () => p.evaluate(() => { const ids = new Set(); window.__carte.eachLayer(l => { if(l._hotspotId) ids.add(l._hotspotId); }); return [...ids]; });
// 1.
console.log('France :', await clicForme('cc', 'FR')); await p.waitForTimeout(2000);
console.log('Pays de la Loire :', await clicForme('ebird', 'FR-PDL')); await p.waitForTimeout(2000);
req.length = 0;
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="hot"]').click());
const texte1 = await finChargement();
const hs1 = await hotspots();
console.log('1. Pays de la Loire, onglet', await p.evaluate(() => document.querySelector('#ctOnglets [aria-selected="true"]')?.dataset.onglet),
  ': « ' + texte1 + ' », hotspots affichés', hs1.length, ', listes d\'espèces demandées', req.filter(r => r.u.startsWith('product/spplist')).length,
  ', listes de hotspots', JSON.stringify(req.filter(r => r.u.startsWith('ref/hotspot')).map(r => r.u)), ', refus', refus.length ? refus.slice(0, 5) : 'aucun');
// 2.
refus.length = 0; req.length = 0;
console.log('Bretagne :', await clicForme('ebird', 'FR-BRE'));
await p.waitForTimeout(3000);
const avant = req.filter(r => r.u.startsWith('product/spplist')).length;
const tDessin = Date.now(); console.log(((tDessin - t0) / 1000).toFixed(1) + ' s : dessin');
// Relevé du processeur pendant la pose des sommets : quelles fonctions bloquent la page.
const cdp = await ctx.newCDPSession(p);
await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval:1000 }); await cdp.send('Profiler.start');
await p.evaluate(() => document.querySelector('#mapDrawStart').click()); console.log(((Date.now() - t0) / 1000).toFixed(1) + ' s : crayon cliqué');
await p.waitForTimeout(300);
for(const ll of TRIANGLE){ await p.evaluate(ll => { window.__carte.fire('click', { latlng:L.latLng(ll[0], ll[1]) }); }, ll); await p.waitForTimeout(150); console.log(((Date.now() - t0) / 1000).toFixed(1) + ' s : sommet'); }
const { profile } = await cdp.send('Profiler.stop');
{
  const dt = {}, tot = {}; const pas = profile.timeDeltas; const parId = new Map(profile.nodes.map(n => [n.id, n]));
  const parent = new Map(); for(const n of profile.nodes) for(const c of n.children || []) parent.set(c, n.id);
  const nom = n => { const f = n.callFrame; return (f.functionName || '(anonyme)') + ' ' + f.url.split('/').pop().replace(/\?.*$/, '') + ':' + (f.lineNumber + 1); };
  profile.samples.forEach((id, i) => {
    const n = parId.get(id); dt[nom(n)] = (dt[nom(n)] || 0) + (pas[i] || 0);
    const vus = new Set(); for(let x = id; x != null; x = parent.get(x)){ const k = nom(parId.get(x)); if(vus.has(k)) continue; vus.add(k); tot[k] = (tot[k] || 0) + (pas[i] || 0); }
  });
  console.log('Temps propre pendant la pose des sommets :'); Object.entries(dt).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, v]) => console.log('   ' + Math.round(v / 1000) + ' ms  ' + k));
  console.log('Temps total (avec ce qu\'elles appellent), fonctions d\'app.js :'); Object.entries(tot).filter(([k]) => k.includes('app.js')).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([k, v]) => console.log('   ' + Math.round(v / 1000) + ' ms  ' + k));
}
console.log(((Date.now() - t0) / 1000).toFixed(1) + ' s : sommets posés');
await p.keyboard.press('Enter'); console.log(((Date.now() - t0) / 1000).toFixed(1) + ' s : Entrée');
const texte2 = await finChargement();
await p.waitForTimeout(3000);
// Les hotspots du triangle : ceux de la Loire-Atlantique dans le dessin (lus dans la liste du département).
const dedans = await p.evaluate(async tri => {
  const dans = (la, lo) => { let c = false; for(let i = 0, j = tri.length - 1; i < tri.length; j = i++){ const [yi, xi] = tri[i], [yj, xj] = tri[j]; if(((yi > la) !== (yj > la)) && (lo < (xj - xi) * (la - yi) / (yj - yi) + xi)) c = !c; } return c; };
  const ids = new Set(); window.__carte.eachLayer(l => { if(l._hotspotId){ const ll = l.getLatLng(); if(dans(ll.lat, ll.lng)) ids.add(l._hotspotId); } });
  return [...ids];
}, TRIANGLE);
const apres = req.filter(r => r.t >= tDessin && r.u.startsWith('product/spplist'));
const locDe = u => u.split('/').pop();
console.log('2. Bretagne : listes d\'espèces demandées avant le dessin', avant, '; après le dessin', apres.length,
  '; dont pour des hotspots affichés dans le triangle', apres.filter(r => dedans.includes(locDe(r.u))).length,
  '; « ' + texte2 + ' » ; refus', refus.length ? refus.slice(0, 5) : 'aucun');
const bzh = new Set(listes['FR-BRE'] || []);
console.log('   dont pour des hotspots BRETONS (le chargement remplacé) :', apres.filter(r => bzh.has(locDe(r.u))).length, '(sur', bzh.size, 'hotspots bretons connus)');
console.log('   requêtes de la Bretagne après le dessin (hors listes de hotspots du dessin) : voir ci-dessus ; listes de hotspots lues :', JSON.stringify(req.filter(r => r.u.startsWith('ref/hotspot')).map(r => r.u)));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();

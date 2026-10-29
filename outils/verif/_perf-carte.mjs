// Mesure ponctuelle (2026-10-29) : où la page Carte perd son temps. Démo locale, faux eBird (le travail
// de la page seul, sans l'attente du réseau). Pour chaque geste : le temps jusqu'à ce que la page soit
// de nouveau libre, et les « longues tâches » (plus de 50 ms où la page ne répond plus) qu'il provoque.
// Avec PROFIL=1, un profil des fonctions JavaScript les plus coûteuses, geste par geste.
// node outils/verif/_perf-carte.mjs [largeur]
import { chromium } from 'playwright';
import { bouchonEbird } from './_bouchon-ebird.mjs';
const largeur = +(process.argv[2] || 1300), mobile = largeur < 700;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:largeur, height:mobile ? 812 : 900 }, isMobile:mobile, hasTouch:mobile, locale:'fr-FR' });
await bouchonEbird(ctx);
await ctx.addInitScript(() => {
  const att = () => { if(window.L && L.Map && !L.Map.__pris){ L.Map.__pris = true; L.Map.addInitHook(function(){ window.__carte = this; }); } else if(!window.L) setTimeout(att, 5); };
  att();
  window.__longues = [];
  new PerformanceObserver(l => { for(const e of l.getEntries()) window.__longues.push([e.startTime, e.duration]); }).observe({ type:'longtask', buffered:true });
});
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
const cdp = await ctx.newCDPSession(p);
const PROFIL = !!process.env.PROFIL;
// LENT=4 : processeur quatre fois plus lent, un portable ordinaire ou un téléphone.
if(process.env.LENT) await cdp.send('Emulation.setCPUThrottlingRate', { rate:+process.env.LENT });
if(PROFIL){ await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval:200 }); }
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(2500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
// Attend que la page soit calme : 600 ms sans longue tâche ni requête en vol.
// Les images du fond de carte ne comptent pas : elles arrivent en fond, la page reste libre.
const fond = r => /tile.openstreetmap|arcgisonline/.test(r.url());
let enVol = 0; p.on('request', r => { if(!fond(r)) enVol++; }); p.on('requestfinished', r => { if(!fond(r)) enVol--; }); p.on('requestfailed', r => { if(!fond(r)) enVol--; });
const calme = async () => {
  let dernier = Date.now();
  for(let i = 0; i < 300; i++){
    await p.waitForTimeout(100);
    const n = await p.evaluate(() => window.__longues.length);
    if(n !== calme.n || enVol > 0){ calme.n = n; dernier = Date.now(); }
    if(Date.now() - dernier > 600) break;
  }
};
calme.n = 0;
const lignes = [];
async function geste(nom, fn){
  const t0 = await p.evaluate(() => performance.now());
  if(PROFIL) await cdp.send('Profiler.start');
  await fn();
  await calme();
  const t1 = await p.evaluate(() => performance.now() - 600);
  const lt = await p.evaluate(t0 => window.__longues.filter(([s]) => s >= t0), t0);
  const tot = lt.reduce((s, [, d]) => s + d, 0), max = Math.max(0, ...lt.map(([, d]) => d));
  lignes.push(`${nom.padEnd(34)} ${String(Math.round(t1 - t0)).padStart(6)} ms · ${String(lt.length).padStart(2)} longues tâches, ${String(Math.round(tot)).padStart(5)} ms bloqués, la pire ${Math.round(max)} ms`);
  if(PROFIL){
    const { profile } = await cdp.send('Profiler.stop');
    // Temps propre par fonction (échantillons), les 8 premières.
    const parId = new Map(profile.nodes.map(n => [n.id, n]));
    const propre = new Map();
    const dt = profile.timeDeltas;
    profile.samples.forEach((id, i) => { const n = parId.get(id); const cf = n.callFrame; const k = `${cf.functionName || '(anonyme)'} ${cf.url.split('/').pop().split('?')[0]}:${cf.lineNumber + 1}`; propre.set(k, (propre.get(k) || 0) + (dt[i] || 0) / 1000); });
    const top = [...propre].filter(([k]) => !/^\((idle|program|garbage collector)\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 8);
    lignes.push('      ' + top.map(([k, v]) => `${k} ${Math.round(v)}`).join('\n      '));
  }
}
const clicForme = (cle, val) => p.evaluate(([cle, val]) => { let f = null; window.__carte.eachLayer(l => { const pr = l.feature && l.feature.properties; if(pr && pr[cle] === val && (cle !== 'cc' || !pr.ebird) && l.fire && !f && l.getBounds) f = l; }); if(f) f.fire('click', { latlng:f.getBounds().getCenter() }); return !!f; }, [cle, val]);
const pastille = k => p.evaluate(k => document.querySelector(`#ctCouches [data-couche="${k}"]`).click(), k);
await geste('ouvrir la Carte', () => p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()));
await geste('cliquer la France', () => clicForme('cc', 'FR'));
await geste('cliquer Pays de la Loire', () => clicForme('ebird', 'FR-PDL'));
await geste('cliquer Loire-Atlantique', () => clicForme('ebird', 'FR-PDL-44'));
await geste('allumer La ligue', () => pastille('ligue'));
await geste('allumer Hotspots', () => pastille('hot'));
await geste('allumer Vu récemment', () => pastille('recent'));
await geste('allumer Réserves', () => pastille('res'));
await geste('retour Tous les pays', () => p.evaluate(() => document.querySelector('#ctAriane [data-carte="monde"]')?.click()));
await geste('cliquer l\'Espagne', () => clicForme('cc', 'ES'));
await geste('cliquer le Royaume-Uni', () => clicForme('cc', 'GB'));
if(!process.env.SANS_DEPLACER) await geste('déplacer la carte (10 pas)', async () => { for(let i = 0; i < 10; i++){ await p.evaluate(() => window.__carte.panBy([60, 20], { animate:false })); await p.waitForTimeout(30); } });
if(!process.env.SANS_DEPLACER) await geste('zoomer puis dézoomer', async () => { await p.evaluate(() => window.__carte.zoomIn(1, { animate:false })); await p.waitForTimeout(200); await p.evaluate(() => window.__carte.zoomOut(1, { animate:false })); });
console.log(`largeur ${largeur}`);
console.log(lignes.join('\n'));
const dom = await p.evaluate(() => ({ chemins:document.querySelectorAll('.ct-carte path').length, elements:document.querySelectorAll('*').length }));
console.log('à la fin :', JSON.stringify(dom), '· erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();

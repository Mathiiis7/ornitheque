// Mesure des passages pays <-> continent <-> monde de la fiche (2026-11-11, « des flashs, des lags ») :
// délai entre le clic et la première image qui bouge, images lentes pendant le mouvement, tâches longues,
// et tout ce qui saute dans le panneau pendant ET après (hauteur du bloc, position du bloc, cartes redessinées,
// graphique et ligne de rareté qui apparaissent ou disparaissent).
// Usage : node outils/verif/_mesure-transitions.mjs [port] [ralenti CPU, ex. 4]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766', ralenti = +(process.argv[3] || 1);
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:1280, height:900 } });
// LATENCE=600 : chaque fichier de data/ arrive 600 ms plus tard, comme sur un réseau lent (la page en ligne).
if(+process.env.LATENCE) await p.route(u => u.pathname.includes('/data/'), async r => { await new Promise(x => setTimeout(x, +process.env.LATENCE)); await r.continue(); });
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => [...document.querySelectorAll('[data-sci]')].find(x => /upupa epops/i.test(x.dataset.sci)).click());
await p.waitForTimeout(2500);
await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
await p.waitForTimeout(700);
await p.evaluate(() => document.querySelector('[data-cont="Europe"]').click());
await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('.cp-modal-close').click());
await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector('#speciesModal .sm-oq-bloc').scrollIntoView({ block:'start' }));
if(ralenti > 1){ const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: ralenti }); }
// Le journal : une ligne par image (rAF) avec ce qui a change depuis la precedente.
await p.evaluate(() => {
  window.__j = [];
  window.__longues = [];
  try { new PerformanceObserver(l => { for(const e of l.getEntries()) window.__longues.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type:'longtask', buffered:false }); } catch(_){}
  const etat = () => {
    const bloc = document.querySelector('#speciesModal .sm-oq-bloc'), carte = document.getElementById('smOuQuandCard');
    const g = document.getElementById('smGraphZone'), rar = document.getElementById('smRarityCard');
    const svgR = document.querySelector('#smRarityMap svg[role="img"]'), svgC = document.querySelector('#smContinentMap svg[role="img"]');
    return { blocTop: Math.round(bloc.getBoundingClientRect().top), blocH: Math.round(bloc.getBoundingClientRect().height),
      carteH: Math.round(carte.getBoundingClientRect().height), graph: !!(g && !g.hidden && g.offsetHeight), rarete: !!(rar && !rar.hidden && rar.offsetHeight),
      scene: !!document.querySelector('.oq-scene'), svgR, svgC, cache: bloc.classList.contains('oq-en-zoom'),
      // Rien a l'ecran dans le bloc : ni scene, ni carte visible (une carte cachee n'a pas de boite).
      vide: !document.querySelector('.oq-scene') && ![svgR, svgC].some(x => x && x.getBoundingClientRect().width > 0 && getComputedStyle(x).visibility !== 'hidden') };
  };
  let avant = etat(), t0 = performance.now(), dernier = t0;
  const boucle = (now) => {
    const e = etat(), diff = [];
    for(const k of ['blocTop', 'blocH', 'carteH', 'graph', 'rarete', 'scene', 'cache', 'vide']) if(e[k] !== avant[k]) diff.push(k + ' ' + avant[k] + '>' + e[k]);
    if(e.svgR !== avant.svgR) diff.push('carte pays ' + (e.svgR ? 'redessinee' : 'retiree'));
    if(e.svgC !== avant.svgC) diff.push('carte continent ' + (e.svgC ? 'redessinee' : 'retiree'));
    window.__j.push([Math.round(now - t0), Math.round(now - dernier), diff.join(', ')]);
    avant = e; dernier = now;
    if(now - t0 < 4000) requestAnimationFrame(boucle);
  };
  window.__depart = () => { t0 = performance.now(); dernier = t0; window.__j = []; window.__longues = []; avant = etat(); requestAnimationFrame(boucle); };
});
const essai = async (nom, geste) => {
  await p.evaluate(() => window.__depart());
  const tClic = await p.evaluate(() => performance.now());
  await geste();
  await p.waitForTimeout(4300);
  const { j, longues } = await p.evaluate(() => ({ j: window.__j, longues: window.__longues }));
  const lentes = j.filter(x => x[1] > 34);
  const premiere = j.find(x => x[2].includes('scene false>true'));
  console.log(`\n== ${nom} (processeur /${ralenti})`);
  console.log(`  début du mouvement : ${premiere ? premiere[0] + ' ms après le clic' : 'pas de scène'} ; images > 34 ms : ${lentes.length} (pire ${Math.max(0, ...j.map(x => x[1]))} ms)`);
  console.log(`  tâches longues : ${longues.map(x => x[1] + ' ms').join(', ') || 'aucune'}`);
  for(const [t, d, diff] of j) if(diff) console.log(`  ${String(t).padStart(5)} ms (+${d}) ${diff}`);
};
await essai('Europe -> France', () => p.locator('#smContinentMap [data-zone="FR"]').click({ force:true }));
await essai('France -> Europe', () => p.locator('#smOqRemonterPays').click());
await essai('Europe -> Monde', () => p.locator('#smOqRemonter').click());
await essai('Monde -> Amérique du Nord', () => p.evaluate(() => document.querySelector('#smContinentMap [data-zone="US"]').dispatchEvent(new MouseEvent('click', { bubbles:true }))));
console.log(erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : '\nsans erreur');
await nav.close();

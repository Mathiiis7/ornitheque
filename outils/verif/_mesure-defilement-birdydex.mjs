// Défilement du Birdydex (2026-11-11, « ça lag, c'est lent et saccadé ») : on fait défiler la grille à la
// molette pendant ~4 s et on relève le temps de chaque image, les tâches longues, le travail du navigateur
// (style, mise en page, peinture) et les fonctions de la page qui coûtent le plus (profil CDP).
// Usage : node outils/verif/_mesure-defilement-birdydex.mjs [port] [ralenti CPU] [ordi|tel]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766', ralenti = +(process.argv[3] || 1), appareil = process.argv[4] || 'ordi';
const nav = await chromium.launch();
const ctx = await nav.newContext(appareil === 'tel' ? { viewport:{ width:390, height:844 }, isMobile:true, hasTouch:true } : { viewport:{ width:1280, height:900 } });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => (document.querySelector('[data-view="pokedex"]') || document.querySelector('#barreBas [data-view="pokedex"]'))?.click());
await p.waitForTimeout(3000);
const nb = await p.evaluate(() => document.querySelectorAll('#pkdxGrid .pkdx-card').length);
console.log(`${appareil}, processeur /${ralenti} : ${nb} cartes dans la grille`);
const cdp = await ctx.newCDPSession(p);
if(ralenti > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: ralenti });
await cdp.send('Performance.enable');
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
const avant = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
await p.evaluate(() => {
  window.__img = []; window.__longues = [];
  try { new PerformanceObserver(l => { for(const e of l.getEntries()) window.__longues.push(Math.round(e.duration)); }).observe({ type:'longtask' }); } catch(_){}
  let d = performance.now();
  const b = now => { window.__img.push(now - d); d = now; if(window.__img.length < 600) requestAnimationFrame(b); };
  requestAnimationFrame(b);
});
await cdp.send('Profiler.start');
await p.mouse.move(640, 500);
const t0 = Date.now();
while(Date.now() - t0 < 4000){ await p.mouse.wheel(0, 120); await p.waitForTimeout(40); }
const prof = (await cdp.send('Profiler.stop')).profile;
const apres = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(m => [m.name, m.value]));
const { img, longues } = await p.evaluate(() => ({ img: window.__img.slice(1), longues: window.__longues }));
const tri = [...img].sort((a, b) => a - b), q = f => tri[Math.floor(tri.length * f)];
console.log(`images : ${img.length}, médiane ${q(.5).toFixed(0)} ms, 90e centile ${q(.9).toFixed(0)} ms, pire ${tri[tri.length - 1].toFixed(0)} ms, > 34 ms : ${img.filter(x => x > 34).length}`);
console.log(`tâches longues : ${longues.length} (${longues.slice(0, 15).join(', ')} ms)`);
const dt = k => ((apres[k] - avant[k]) * 1000).toFixed(0);
console.log(`navigateur sur la durée : script ${dt('ScriptDuration')} ms, style ${dt('RecalcStyleDuration')} ms (${apres.RecalcStyleCount - avant.RecalcStyleCount} fois), mise en page ${dt('LayoutDuration')} ms (${apres.LayoutCount - avant.LayoutCount} fois), tâches ${dt('TaskDuration')} ms`);
// Les fonctions de la page qui coûtent le plus (temps propre)
const parId = new Map(prof.nodes.map(n => [n.id, n]));
const propre = new Map();
const pas = prof.timeDeltas || [];
prof.samples.forEach((id, i) => { const n = parId.get(id); const k = n.callFrame.functionName || '(anonyme)';
  const cle = k + ' ' + (n.callFrame.url.split('/').pop() || '') + ':' + n.callFrame.lineNumber; propre.set(cle, (propre.get(cle) || 0) + (pas[i] || 0)); });
console.log('fonctions les plus coûteuses (temps propre) :');
for(const [k, v] of [...propre.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log('  ' + (v / 1000).toFixed(0).padStart(6) + ' ms  ' + k);
await nav.close();

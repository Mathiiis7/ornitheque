// Ou part le temps quand la grille du Birdydex se dessine (2026-11-11) : profil du processeur pendant le passage
// au Monde, fonctions classees par temps propre, plus le temps du navigateur hors JavaScript (style, mise en page).
// Usage : node outils/verif/_profil-birdydex.mjs [port] [Monde|Europe|CC]
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const cible = process.argv[3] || 'Monde';
const nav = await chromium.launch();
// TEL=1 : telephone (390 px, doigt), processeur ralenti 4 fois.
const TEL = process.env.TEL === '1';
const ctx = await nav.newContext({ serviceWorkers: 'block', ...(TEL ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } }) });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
await p.waitForTimeout(1500);
// Le fichier du continent arrive d'abord, pour ne mesurer que le dessin.
if(!/^[A-Z]{2}$/.test(cible)){
  await p.evaluate(() => document.getElementById('pkdxCountry').click());
  await p.waitForTimeout(600);
  await p.evaluate(c => document.querySelector(`.cp-group-title[data-cont="${c}"]`).click(), cible);
  await p.evaluate(() => document.querySelector('.cp-modal-close')?.click());
  await p.waitForTimeout(3000);
  // Retour a la France, puis on mesure le second passage (fichier deja la).
  await p.evaluate(() => document.getElementById('pkdxCountry').click());
  await p.waitForTimeout(600);
  await p.evaluate(() => document.querySelector('.cp-item[data-cc="FR"]').click());
  await p.evaluate(() => document.querySelector('.cp-modal-close')?.click());
  await p.waitForTimeout(1500);
}
const cdp = await ctx.newCDPSession(p);
await cdp.send('Profiler.enable');
if(TEL) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await cdp.send('Profiler.setSamplingInterval', { interval: 200 });
await p.evaluate(() => document.getElementById('pkdxCountry').click());
await p.waitForTimeout(600);
await cdp.send('Profiler.start');
const t = await p.evaluate(async (c) => {
  const t0 = performance.now(); let long = 0;
  const obs = new PerformanceObserver(l => { for(const e of l.getEntries()) long += e.duration; });
  obs.observe({ type: 'longtask' });
  if(/^[A-Z]{2}$/.test(c)) document.querySelector(`.cp-item[data-cc="${c}"]`).click();
  else document.querySelector(`.cp-group-title[data-cont="${c}"]`).click();
  const t1 = performance.now();
  document.querySelector('.cp-modal-close')?.click();
  await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
  const t2 = performance.now();
  await new Promise(r => setTimeout(r, 300));
  obs.disconnect();
  return { clic: Math.round(t1 - t0), peinte: Math.round(t2 - t0), bloque: Math.round(long), cases: document.querySelectorAll('#pkdxGrid .pkdx-card').length };
}, cible);
const { profile } = await cdp.send('Profiler.stop');
console.log(cible, JSON.stringify(t));
const dt = profile.timeDeltas; const self = new Map();
const parId = new Map(profile.nodes.map(n => [n.id, n]));
for(let i = 0; i < profile.samples.length; i++){
  const n = parId.get(profile.samples[i]);
  const cf = n.callFrame; const k = (cf.functionName || '(anonyme)') + ' :' + (cf.lineNumber + 1);
  self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000);
}
const tri = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 22);
for(const [k, ms] of tri) console.log(ms.toFixed(0).padStart(6), 'ms ', k);
// Qui appelle les fonctions natives les plus cheres (remove...) : la chaine des appelants.
const parent = new Map(); for(const n of profile.nodes) for(const c of (n.children || [])) parent.set(c, n.id);
const chaines = new Map();
for(let i = 0; i < profile.samples.length; i++){
  let n = parId.get(profile.samples[i]);
  if(n.callFrame.functionName !== 'remove') continue;
  const ch = []; let id = parent.get(n.id);
  while(id && ch.length < 4){ const m = parId.get(id); ch.push(m.callFrame.functionName + ':' + (m.callFrame.lineNumber + 1)); id = parent.get(id); }
  const k = ch.join(' < '); chaines.set(k, (chaines.get(k) || 0) + (dt[i] || 0) / 1000);
}
for(const [k, ms] of chaines) console.log('remove', ms.toFixed(0), 'ms <', k);
await nav.close();

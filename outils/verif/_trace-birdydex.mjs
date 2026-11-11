// Trace du navigateur pendant le passage a une grille du Birdydex (2026-11-11) : temps par etape (style, mise en
// page, peinture, script), pour savoir ce que le telephone paie et l'ordinateur non.
// Usage : TEL=1 node outils/verif/_trace-birdydex.mjs [port] [Monde|Europe|CC]
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const cible = process.argv[3] || 'FR';
const TEL = process.env.TEL === '1';
const nav = await chromium.launch();
const ctx = await nav.newContext({ serviceWorkers: 'block', ...(TEL ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } }) });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
await p.waitForTimeout(1500);
const choisir = (c) => p.evaluate(async (c) => {
  document.getElementById('pkdxCountry').click();
  await new Promise(r => setTimeout(r, 600));
  if(/^[A-Z]{2}$/.test(c)) document.querySelector(`.cp-item[data-cc="${c}"]`).click();
  else document.querySelector(`.cp-group-title[data-cont="${c}"]`).click();
  document.querySelector('.cp-modal-close')?.click();
}, c);
await choisir('Europe'); await p.waitForTimeout(3000);
const cdp = await ctx.newCDPSession(p);
if(TEL) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
const evts = [];
cdp.on('Tracing.dataCollected', d => evts.push(...d.value));
const fin = new Promise(r => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.start', { categories: 'devtools.timeline,blink.user_timing', transferMode: 'ReportEvents' });
await choisir(cible);
await p.waitForTimeout(TEL ? (cible === 'Monde' ? 15000 : 6000) : 2500);
await cdp.send('Tracing.end');
await fin;
const somme = new Map();
for(const e of evts){ if(e.ph !== 'X' || !e.dur) continue; somme.set(e.name, (somme.get(e.name) || 0) + e.dur / 1000); }
console.log(cible, TEL ? 'telephone /4' : 'ordinateur');
for(const [k, ms] of [...somme].sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log(ms.toFixed(0).padStart(7), 'ms ', k);
// Les plus longues mises a jour de style : combien d'elements chacune touchait.
const styles = evts.filter(e => e.name === 'UpdateLayoutTree' && e.dur).sort((a, b) => b.dur - a.dur).slice(0, 5);
for(const s of styles) console.log('style', (s.dur / 1000).toFixed(0), 'ms, elements :', s.args?.elementCount ?? '?');
const lay = evts.filter(e => e.name === 'Layout' && e.dur).sort((a, b) => b.dur - a.dur).slice(0, 5);
for(const s of lay) console.log('mise en page', (s.dur / 1000).toFixed(0), 'ms, objets :', s.args?.beginData?.dirtyObjects ?? '?', '/', s.args?.beginData?.totalObjects ?? '?');
await nav.close();

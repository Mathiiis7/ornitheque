// Combien coute la grille du Monde (10 924 cases) : du clic sur « Monde » a la grille dessinee, et le temps
// du fil principal bloque, a l'ordinateur et au telephone (processeur ralenti 4 fois). 2026-11-11.
// Usage : node outils/verif/_mesure-birdydex-monde.mjs [port]
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const nav = await chromium.launch();
for(const [nom, opts, ralenti] of [['ordi', { viewport: { width: 1280, height: 900 } }, 1],
  ['tel /4', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 4]]){
  const ctx = await nav.newContext({ serviceWorkers: 'block', ...opts });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
  await p.waitForTimeout(1500);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: ralenti });
  for(const cont of ['Europe', 'Monde']){
    await p.evaluate(() => document.getElementById('pkdxCountry').click());
    await p.waitForTimeout(800);
    const r = await p.evaluate(async (c) => {
      const t0 = performance.now(); let long = 0;
      const obs = new PerformanceObserver(l => { for(const e of l.getEntries()) long += e.duration; });
      obs.observe({ type: 'longtask', buffered: false });
      document.querySelector(`.cp-group-title[data-cont="${c}"]`).click();
      document.querySelector('.cp-modal-close')?.click();
      while(document.getElementById('pkdxCounter').textContent.trim() === '…' || !document.querySelector('#pkdxGrid .pkdx-card'))
        await new Promise(r => setTimeout(r, 20));
      const t1 = performance.now();
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
      const t2 = performance.now();
      obs.disconnect();
      return { grille: Math.round(t1 - t0), peinte: Math.round(t2 - t0), bloque: Math.round(long),
        cases: document.querySelectorAll('#pkdxGrid .pkdx-card').length };
    }, cont);
    console.log(nom.padEnd(7), cont.padEnd(7), JSON.stringify(r));
    await p.waitForTimeout(1500);
  }
  await ctx.close();
}
await nav.close();

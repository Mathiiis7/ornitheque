// Combien coute la grille du Birdydex (2026-11-11) : Europe, Monde (10 922 cases), puis retour a la France.
// Pour chacun : premieres cases a l'ecran, grille complete, temps bloque en tout, et le plus long gel (ce que le
// doigt sent). A l'ordinateur et au telephone (processeur ralenti 4 fois). Chaque choix est fait une premiere
// fois pour charger ses donnees, la mesure porte sur le second passage.
// Usage : node outils/verif/_mesure-birdydex-monde.mjs [port]
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const nav = await chromium.launch();
const choisir = (p, c) => p.evaluate(async (c) => {
  document.getElementById('pkdxCountry').click();
  await new Promise(r => setTimeout(r, 600));
  if(/^[A-Z]{2}$/.test(c)) document.querySelector(`.cp-item[data-cc="${c}"]`).click();
  else document.querySelector(`.cp-group-title[data-cont="${c}"]`).click();
  document.querySelector('.cp-modal-close')?.click();
}, c);
for(const [nom, opts, ralenti] of [['ordi', { viewport: { width: 1280, height: 900 } }, 1],
  ['tel /4', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, 4]]){
  const ctx = await nav.newContext({ serviceWorkers: 'block', ...opts });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
  await p.waitForTimeout(1500);
  for(const c of ['Europe', 'Monde', 'FR']){ await choisir(p, c); await p.waitForTimeout(3000); }
  await choisir(p, 'FR'); await p.waitForTimeout(2000);
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: ralenti });
  for(const cont of ['Europe', 'Monde', 'FR']){
    await p.evaluate(() => document.getElementById('pkdxCountry').click());
    await p.waitForTimeout(800);
    const r = await p.evaluate(async (c) => {
      const grid = document.getElementById('pkdxGrid');
      const avant = grid.firstElementChild;
      const t0 = performance.now(); let long = 0, gel = 0;
      const obs = new PerformanceObserver(l => { for(const e of l.getEntries()){ long += e.duration; gel = Math.max(gel, e.duration); } });
      obs.observe({ type: 'longtask' });
      if(/^[A-Z]{2}$/.test(c)) document.querySelector(`.cp-item[data-cc="${c}"]`).click();
      else document.querySelector(`.cp-group-title[data-cont="${c}"]`).click();
      document.querySelector('.cp-modal-close')?.click();
      while(grid.firstElementChild === avant || !grid.querySelector('.pkdx-card')) await new Promise(r => setTimeout(r, 5));
      await new Promise(r => requestAnimationFrame(() => setTimeout(r, 0)));
      const premieres = performance.now() - t0;
      // Complete : la grille le dit (data-rempli, _pkdxPoser) ; avant les paquets, des le premier dessin.
      while(grid.dataset.rempli === '0') await new Promise(r => setTimeout(r, 20));
      const complete = performance.now() - t0;
      const n = grid.querySelectorAll('.pkdx-card').length;
      obs.disconnect();
      return { premieres: Math.round(premieres), complete: Math.round(Math.max(complete, premieres)),
        bloque: Math.round(long), gelMax: Math.round(gel), cases: n };
    }, cont);
    console.log(nom.padEnd(7), cont.padEnd(7), JSON.stringify(r));
    await p.waitForTimeout(1500);
  }
  await ctx.close();
}
await nav.close();

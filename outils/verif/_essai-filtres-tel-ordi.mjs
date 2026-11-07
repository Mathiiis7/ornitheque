// Essai ponctuel (2026-11-07) : sur ordinateur, le bouton « Filtres » du tiroir de téléphone reste caché.
import { chromium } from 'playwright';
const nav = await chromium.launch();
for(const w of [1300, 800]){
  const p = await (await nav.newContext({ viewport:{ width:w, height:900 }, locale:'fr-FR', serviceWorkers:'block' })).newPage();
  await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
  await p.waitForTimeout(2000);
  await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
  await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
  await p.waitForTimeout(2500);
  console.log(w, await p.evaluate(() => ({ tiroir:document.getElementById('ctZone').dataset.tiroir, boutonVisible:!!document.getElementById('ctFiltresTel').offsetHeight })));
}
await nav.close();

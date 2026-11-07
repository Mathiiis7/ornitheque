// Essai ponctuel (2026-11-07) : sur ordinateur, le panneau de la Carte reste à droite de la carte, à
// sa hauteur fixe, avec sa liste qui défile dans son cadre.
import { chromium } from 'playwright';
const DOS = process.env.DOS || 'C:/Users/mathi/AppData/Local/Temp/claude/ce1f935b4263329c/73f9877c-7c1c-4304-af22-0f97053bf457/scratchpad';
const nav = await chromium.launch();
const p = await (await nav.newContext({ viewport:{ width:1300, height:900 }, locale:'fr-FR', serviceWorkers:'block' })).newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(2000);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
console.log(await p.evaluate(() => {
  const c = document.getElementById('ctCarte').getBoundingClientRect(), z = document.getElementById('ctZone').getBoundingClientRect();
  return { aDroite:z.left >= c.right, memeHaut:Math.round(z.top - c.top), hauteurPanneau:Math.round(z.height), defile:getComputedStyle(document.getElementById('ctContenu')).overflowY };
}));
await p.screenshot({ path:`${DOS}/ordi-carte.png` });
await nav.close();

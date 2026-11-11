// Le Sahara occidental dans ses frontières (2026-11-11) : la carte de l'Afrique, celle du Maroc par régions et
// celle du Sahara occidental, dans la fiche de la Huppe fasciée. Captures dans notes-privees/rarete-continent/.
// Usage : node outils/verif/_essai-sahara.mjs [port]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766';
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:1280, height:900 } });
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => [...document.querySelectorAll('[data-sci]')].find(x => /upupa epops/i.test(x.dataset.sci)).click());
await p.waitForTimeout(2500);
const choisir = async (sel) => {
  await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
  await p.waitForTimeout(600);
  await p.evaluate(s => document.querySelector(s).click(), sel);
  await p.waitForTimeout(2200);
  await p.evaluate(() => document.querySelector('.cp-modal-close').click());
  await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('#speciesModal .sm-oq-bloc').scrollIntoView({ block:'start' }));
  await p.waitForTimeout(300);
};
for(const [nom, sel] of [['afrique', '[data-cont="Afrique"]'], ['maroc', '.cp-item[data-cc="MA"]'], ['sahara', '.cp-item[data-cc="EH"]']]){
  await choisir(sel);
  const info = await p.evaluate(() => {
    const ps = [...document.querySelectorAll('#smRarityMap svg[role="img"] path[aria-label], #smContinentMap svg[role="img"] path[aria-label]')];
    return ps.filter(x => /Maroc|Sahara|Morocco|Dahab|Laâyoune|Guelmim/.test(x.getAttribute('aria-label'))).map(x => x.getAttribute('aria-label').slice(0, 60)).join(' | ');
  });
  console.log(nom.padEnd(7), info);
  await p.locator('#speciesModal .sm-oq-bloc').screenshot({ path:`notes-privees/rarete-continent/sahara-${nom}.png` });
}
console.log(erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : 'sans erreur');
await nav.close();

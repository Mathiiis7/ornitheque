// Hachures des zones sans liste eBird (2026-11-11) : la carte du Tchad (Huppe fasciée), sur l'année puis en
// mai, et le décompte des zones hachurées / grises / colorées. Captures dans notes-privees/rarete-continent/.
// Usage : node outils/verif/_essai-hachures.mjs [port] [code pays]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766', cc = process.argv[3] || 'TD';
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:1280, height:900 } });
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => [...document.querySelectorAll('[data-sci]')].find(x => /upupa epops/i.test(x.dataset.sci)).click());
await p.waitForTimeout(2500);
await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
await p.waitForTimeout(500);
await p.evaluate(c => document.querySelector(`.cp-item[data-cc="${c}"]`).click(), cc);
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('.cp-modal-close').click());
await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector('#speciesModal #smOuQuandCard').scrollIntoView({ block:'start' }));
const compte = () => p.evaluate(() => {
  const ps = [...document.querySelectorAll('#smRarityMap svg[role="img"] path[aria-label]')];
  return { hachurees: ps.filter(x => /^url\(/.test(x.getAttribute('fill'))).length,
    grises: ps.filter(x => x.getAttribute('fill') === '#d4d4d8').length,
    colorees: ps.filter(x => /^#/.test(x.getAttribute('fill')) && x.getAttribute('fill') !== '#d4d4d8').length,
    legende: document.querySelector('#smOuQuandLegende .sm-oq-cles')?.textContent };
});
console.log('année', JSON.stringify(await compte()));
await p.locator('#smOuQuandCard').screenshot({ path:`notes-privees/rarete-continent/hachures-${cc}-annee.png` });
await p.evaluate(() => document.querySelector('#smRarityMapMois [data-mois="4"]').click());
await p.waitForTimeout(1200);
console.log('mai  ', JSON.stringify(await compte()));
await p.locator('#smOuQuandCard').screenshot({ path:`notes-privees/rarete-continent/hachures-${cc}-mai.png` });
await p.evaluate(() => document.querySelector('#smRarityMapMois [data-mois="4"]').click());   // retour à l'année
console.log(erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : 'sans erreur');
await nav.close();

// Entête d'une zone sans donnée pour l'espèce (2026-11-11) : au Tchad, Logone Oriental choisi, l'entête doit
// dire « aucune liste » ou « jamais notée », pas le chiffre national. Et l'anneau du mois choisi passe devant
// le mois suivant. Capture de la colonne des mois dans notes-privees/rarete-continent/.
// Usage : node outils/verif/_essai-entete-zone.mjs [port]
import { chromium } from 'playwright';
const port = process.argv[2] || '8766';
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:1280, height:900 }, deviceScaleFactor: 2 });
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
await p.goto(`http://localhost:${port}/demo/`, { waitUntil:'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => [...document.querySelectorAll('[data-sci]')].find(x => /upupa epops/i.test(x.dataset.sci)).click());
await p.waitForTimeout(2500);
await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector('.cp-item[data-cc="TD"]').click());
await p.waitForTimeout(2500);
await p.evaluate(() => document.querySelector('.cp-modal-close').click());
await p.waitForTimeout(500);
const entete = () => p.evaluate(() => document.getElementById('smOqZone').textContent.replace(/\s+/g, ' ').trim());
console.log('pays           :', await entete());
// Une zone, puis septembre, puis octobre
for(const [quoi, geste] of [
  ['zone TD-LO   ', () => p.evaluate(() => document.querySelector('#smRarityMap [data-zone="TD-LO"]')?.dispatchEvent(new MouseEvent('click', { bubbles:true })))],
  ['septembre    ', () => p.evaluate(() => document.querySelector('#smRarityMapMois [data-mois="8"]').click())],
  ['octobre      ', () => p.evaluate(() => document.querySelector('#smRarityMapMois [data-mois="9"]').click())],
]){ await geste(); await p.waitForTimeout(1200); console.log(quoi + ':', await entete()); }
await p.evaluate(() => document.querySelector('#smRarityMapMois').scrollIntoView({ block:'center' }));
await p.waitForTimeout(300);
await p.locator('#smRarityMapMois').screenshot({ path:'notes-privees/rarete-continent/mois-anneau.png' });
// Retour à l'année et au pays entier
await p.evaluate(() => document.querySelector('#smRarityMapMois [data-mois="9"]').click());
await p.waitForTimeout(500);
await p.evaluate(() => document.querySelector('#smRarityMap [data-zone="TD-LO"]')?.dispatchEvent(new MouseEvent('click', { bubbles:true })));
console.log(erreurs.length ? 'ERREURS ' + erreurs.join(' | ') : 'sans erreur');
await nav.close();

// Essai ponctuel (2026-10-29), démo locale : le crayon grisé tant qu'aucun pays n'est ouvert, sa bulle,
// et la mention du Récent réduite au crédit eBird.
import { chromium } from 'playwright';
const nav = await chromium.launch();
const p = await nav.newPage({ viewport:{ width:1300, height:900 } });
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click()); await p.waitForTimeout(2500);
await p.keyboard.press('Escape');
const crayon = () => p.evaluate(() => { const d = document.getElementById('mapDrawStart'); return { gris:d.getAttribute('aria-disabled'), bulle:d.dataset.tip, opacite:getComputedStyle(d).opacity, zone:document.querySelector('.ct-zone-nom')?.textContent }; });
console.log('arrivée', JSON.stringify(await crayon()));
await p.locator('#mapDrawStart').click({ force:true }); await p.waitForTimeout(400);
console.log('clic sans pays : curseur de dessin ?', await p.evaluate(() => document.querySelector('#mapEl').style.cursor));
// Ouvrir la France par « Où » du Récent
await p.evaluate(() => document.querySelector('#ctOnglets [data-onglet="recent"]').click()); await p.waitForTimeout(500);
await p.evaluate(() => { document.getElementById('ctPliRecent').open = true; document.getElementById('ctEbPaysBtn').click(); }); await p.waitForTimeout(800);
await p.evaluate(() => document.querySelector('.cp-modal-backdrop .cp-item[data-cc="FR"]').click()); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('.cp-modal-backdrop')?.click()); await p.waitForTimeout(800);
console.log('France ouverte', JSON.stringify(await crayon()));
await p.locator('#mapDrawStart').click({ force:true }); await p.waitForTimeout(400);
console.log('clic avec pays : curseur de dessin ?', await p.evaluate(() => document.querySelector('#mapEl').style.cursor));
await p.keyboard.press('Escape');
console.log('mention', await p.evaluate(() => document.getElementById('ctMentionRecent').textContent));
// Retour à « Tous les pays » : le crayon se regrise
await p.evaluate(() => document.querySelector('[data-carte="monde"]')?.click()); await p.waitForTimeout(1200);
console.log('retour monde', JSON.stringify(await crayon()));
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();

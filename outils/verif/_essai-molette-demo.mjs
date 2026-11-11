/* Essai du 10/11 (pas un banc) : la demo ne montre pas l'etage Fun, et la molette sur un etage qui deborde ne fait
   pas bouger la page, meme au bout. Demande le site local lance (http://localhost:8765, configuration ornitheque-dev).
   Usage : node outils/verif/_essai-molette-demo.mjs */
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1400, height: 950 }, locale: 'fr-FR', serviceWorkers: 'block' });
const page = await ctx.newPage();
const erreurs = []; page.on('pageerror', e => erreurs.push(String(e).slice(0, 200)));
await page.goto('http://localhost:8765/demo/', { waitUntil: 'load' });
await page.waitForTimeout(4000);
await page.evaluate(() => { const t = document.querySelector('.tab[data-view="trophies"]') || document.querySelector('[data-view="trophies"]'); t?.click(); });
await page.waitForSelector('#vitrine .vt-etage', { timeout: 20000 });
await page.waitForTimeout(2500);
const etages = await page.$$eval('#vitrine .vt-etage h4', hs => hs.map(h => h.textContent));
console.log('demo | etages :', etages.join(', '), '| Fun present :', etages.includes('Fun'));
console.log('demo | Necrophile, Gros Bebe ou Bourriche dans la vitrine :', await page.$$eval('#vitrine .vt-case', cs => cs.filter(c => /Nécrophile|Gros Bébé|Bourriche/.test(c.dataset.id)).length));

// Le guide de la demo pose sa bulle sur la vitrine : on le retire pour mesurer
await page.evaluate(() => document.querySelectorAll('[class*="guide"]').forEach(e => e.remove()));
// La molette : etage Exploits (deborde), puis un etage qui tient en entier s'il y en a un
const mesure = () => page.evaluate(() => ({ page: Math.round(scrollY), rails: [...document.querySelectorAll('#vitrine .vt-rail')].map(r => Math.round(r.scrollLeft) + '/' + Math.round(r.scrollWidth - r.clientWidth)) }));
const rail0 = page.locator('#vitrine .vt-rail').first();
await rail0.scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
const b = await rail0.boundingBox();
await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
let m = await mesure(); console.log('debut         ', JSON.stringify(m));
for(let i = 0; i < 40; i++){ await page.mouse.wheel(0, 300); await page.waitForTimeout(30); }
m = await mesure(); console.log('apres 40 crans vers le bas (au bout) ', JSON.stringify(m));
for(let i = 0; i < 10; i++){ await page.mouse.wheel(0, 300); await page.waitForTimeout(30); }
const m2 = await mesure(); console.log('10 crans de plus, deja au bout       ', JSON.stringify(m2), '| la page a bouge :', m2.page !== m.page);
for(let i = 0; i < 60; i++){ await page.mouse.wheel(0, -300); await page.waitForTimeout(30); }
const m3 = await mesure(); console.log('60 crans vers le haut (au debut)     ', JSON.stringify(m3), '| la page a bouge :', m3.page !== m2.page);
// Sur un titre d'etage, la molette fait defiler la page
const t = await page.locator('#vitrine .vt-etage-tete').nth(1).boundingBox();
await page.mouse.move(t.x + 40, t.y + t.height / 2); await page.mouse.wheel(0, 300); await page.waitForTimeout(400);
console.log('sur un titre d\'etage, la page defile :', (await mesure()).page !== m3.page);
console.log('erreurs de page :', erreurs.length, erreurs.join(' | '));
await nav.close();

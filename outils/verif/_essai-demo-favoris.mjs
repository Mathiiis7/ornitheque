// Essai (2026-10-30), démo locale : les espèces préférées de chaque membre, au Classement et au profil.
// node outils/verif/_essai-demo-favoris.mjs DOSSIER [LARGEUR] [HAUTEUR]
import { chromium } from 'playwright';
const DOS = process.argv[2], W = +process.argv[3] || 1300, H = +process.argv[4] || 850;
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:W, height:H }, locale:'fr-FR', serviceWorkers:'block', ...(W < 600 ? { isMobile:true, hasTouch:true } : {}) });
const p = await ctx.newPage();
const erreurs = [];
p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(2500); await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="profil"]').click());
await p.waitForTimeout(1500);
const compte = () => p.evaluate(() => ({ cartes:document.querySelectorAll('.prof-favs > *').length, noms:[...document.querySelectorAll('.prof-favs > *')].map(c => c.textContent.trim().slice(0, 40)), debord:document.documentElement.scrollWidth - innerWidth }));
console.log('Alex', JSON.stringify(await compte()));
await p.screenshot({ path:`${DOS}/profil-${W}.png` });
await p.evaluate(() => document.querySelector('.tab[data-view="ranking"]').click());
await p.waitForTimeout(1500);
const colonne = await p.evaluate(() => [...document.querySelectorAll('td.c-esp')].map(td => td.querySelectorAll('img, [data-sci], .pile > *').length));
console.log('Classement, images par membre :', colonne.join(' '));
await p.locator('td.c-esp').first().scrollIntoViewIfNeeded().catch(() => {});
await p.screenshot({ path:`${DOS}/classement-${W}.png` });
console.log('erreurs', erreurs.length, erreurs.slice(0, 3).join(' / '));
await nav.close();

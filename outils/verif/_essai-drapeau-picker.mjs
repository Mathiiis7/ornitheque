// Essai (2026-11-10) : le drapeau que le sélecteur de pays du Birdydex montre pour quelques pays, et
// s'il s'est vraiment chargé (largeur naturelle > 0).
// Usage : node outils/verif/_essai-drapeau-picker.mjs "Clipperton,Corail,Ashmore,Guadeloupe" [--mobile]
import { chromium } from 'playwright';
const LISTE = (process.argv.slice(2).find(a => !a.startsWith('--')) || 'Clipperton,Corail,Ashmore,Guadeloupe').split(',');
const MOBILE = process.argv.includes('--mobile');
const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' }
  : { viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
await page.goto('http://localhost:8766/demo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500); await page.keyboard.press('Escape');
await page.locator('text=Birdydex >> visible=true').first().click(); await page.waitForTimeout(1500);
const filtres = page.getByRole('button', { name: 'Filtres' }).first();
if (await filtres.isVisible()) { await filtres.click(); await page.waitForTimeout(600); }
await page.locator('.cp-btn-label:visible').filter({ hasText: /^France$/ }).first().click(); await page.waitForTimeout(700);
for (const p of LISTE) {
  await page.locator('input.cp-search:visible').fill(p); await page.waitForTimeout(1200);
  const item = page.locator('.cp-item:visible').filter({ hasText: p }).first();
  const r = await item.evaluate(el => { const i = el.querySelector('img'); return i ? { src: i.src.split('/').slice(-2).join('/'), w: i.naturalWidth } : null; }).catch(() => 'introuvable');
  console.log(p.padEnd(12), '->', JSON.stringify(r));
}
console.log(erreurs.length ? 'ERREURS : ' + erreurs.join(' | ') : 'Aucune erreur.');
await navigateur.close();

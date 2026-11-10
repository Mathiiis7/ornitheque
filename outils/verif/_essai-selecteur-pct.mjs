// Essai (2026-11-10) : le pourcentage affiché à côté d'un pays dans le sélecteur de la fiche espèce.
// Usage : node outils/verif/_essai-selecteur-pct.mjs "<Espèce>" "<Pays>[,<Pays>...]"
import { chromium } from 'playwright';
const [ESPECE = 'Sterne couronnée', LISTE = 'Brésil,Argentine,Afrique du Sud,Antarctique'] = process.argv.slice(2);
const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext({ viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
await page.goto('http://localhost:8766/demo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500); await page.keyboard.press('Escape');
await page.locator('text=Birdydex >> visible=true').first().click(); await page.waitForTimeout(1500);
// Le Birdydex de la démo est en France, où la Sterne couronnée n'est pas : on passe par l'Afrique du Sud.
const filtres = page.getByRole('button', { name: 'Filtres' }).first();
if (await filtres.isVisible()) { await filtres.click(); await page.waitForTimeout(600); }
await page.locator('.cp-btn-label:visible').filter({ hasText: /^France$/ }).first().click(); await page.waitForTimeout(700);
await page.locator('input.cp-search:visible').fill('Afrique du Sud'); await page.waitForTimeout(600);
await page.locator('.cp-item:visible').filter({ hasText: 'Afrique du Sud' }).first().click(); await page.waitForTimeout(3500);
await page.keyboard.press('Escape');
await page.locator('input[placeholder*="Chercher une esp"]:visible').first().fill(ESPECE); await page.waitForTimeout(1500);
await page.locator('[data-sci]:visible').first().click(); await page.waitForTimeout(2500);
await page.locator('#smRarityCountrySel').click(); await page.waitForTimeout(4000);
for (const p of LISTE.split(',')) {
  await page.locator('input.cp-search:visible').fill(p); await page.waitForTimeout(800);
  const t = await page.locator('.cp-item:visible').filter({ hasText: p }).first().innerText().catch(() => '(introuvable)');
  console.log(p.padEnd(16), '->', t.replace(/\s+/g, ' '));
}
console.log(erreurs.length ? 'ERREURS : ' + erreurs.join(' | ') : 'Aucune erreur.');
await navigateur.close();

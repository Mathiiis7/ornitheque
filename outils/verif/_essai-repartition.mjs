// Essai (2026-11-10) : la carte de répartition (GBIF + aire estimée iNaturalist) d'une espèce, ouverte depuis
// le Birdydex d'un pays. Capture la carte, dézoomée au maximum.
// Usage : node outils/verif/_essai-repartition.mjs "<Pays>" "<Espèce>"
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [PAYS = 'Afrique du Sud', ESPECE = 'Sterne couronnée'] = process.argv.slice(2);
const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext({ viewport: { width: 1300, height: 1000 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
await page.goto('http://localhost:8766/demo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500); await page.keyboard.press('Escape');
await page.locator('text=Birdydex >> visible=true').first().click(); await page.waitForTimeout(1500);
const filtres = page.getByRole('button', { name: 'Filtres' }).first();
if (await filtres.isVisible()) { await filtres.click(); await page.waitForTimeout(600); }
await page.locator('.cp-btn-label:visible').filter({ hasText: /^France$/ }).first().click(); await page.waitForTimeout(700);
await page.locator('input.cp-search:visible').fill(PAYS); await page.waitForTimeout(600);
await page.locator('.cp-item:visible').filter({ hasText: PAYS }).first().click(); await page.waitForTimeout(3500);
await page.keyboard.press('Escape');
await page.locator('input[placeholder*="Chercher une esp"]:visible').first().fill(ESPECE); await page.waitForTimeout(1500);
await page.locator('[data-sci]:visible').first().click(); await page.waitForTimeout(3000);
const carte = page.locator('.leaflet-container:visible').last();
await carte.scrollIntoViewIfNeeded(); await page.waitForTimeout(800);
for (let i = 0; i < 6; i++) { await page.locator('.leaflet-control-zoom-out:visible').last().click({ timeout: 1500 }).catch(() => {}); await page.waitForTimeout(400); }
await page.waitForTimeout(3000);
const f = join(tmpdir(), 'essai-monde', `repartition-${ESPECE.replace(/\W+/g, '')}.png`);
const b = await carte.boundingBox();
await page.screenshot({ path: f, clip: { x: b.x, y: b.y, width: b.width, height: b.height } });
console.log('capture', f, erreurs.length ? 'ERREURS : ' + erreurs.join(' | ') : 'aucune erreur');
await navigateur.close();

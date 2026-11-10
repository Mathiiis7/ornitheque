// Essai (2026-11-10) : la carte de la fiche espèce (« Où et quand ») pour un pays donné. Ouvre la fiche de la
// première espèce du Birdydex, choisit le pays dans son sélecteur, capture la carte, compte ses formes.
// Usage : node outils/verif/_essai-fiche-pays.mjs <Pays> [--mobile]
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const PAYS = process.argv.slice(2).find(a => !a.startsWith('--')) || 'Japon';
// --espece=Nom : l'espèce à ouvrir (cherchée dans le Birdydex), sinon la première de la grille.
const ESPECE = (process.argv.find(a => a.startsWith('--espece=')) || '').slice(9);
const MOBILE = process.argv.includes('--mobile');
const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' }
  : { viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push(e.message));
await page.goto('http://localhost:8766/demo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.keyboard.press('Escape');
await page.locator('text=Birdydex >> visible=true').first().click();
await page.waitForTimeout(1500);
if (ESPECE) { await page.locator('input[placeholder*="Chercher une esp"]:visible').first().fill(ESPECE); await page.waitForTimeout(1500); }
await page.locator('[data-sci]:visible').first().click();
await page.waitForTimeout(2500);
await page.locator('#smRarityCountrySel').click();
await page.waitForTimeout(800);
await page.locator('input.cp-search:visible').fill(PAYS);
await page.waitForTimeout(600);
await page.locator('.cp-item:visible').filter({ hasText: PAYS }).first().click();
await page.waitForTimeout(4000);
const carte = page.locator('#smRarityMap');
await carte.scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(800);
const n = await page.locator('#smRarityMap svg path').count();
const texte = (await carte.innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 160);
const f = join(tmpdir(), 'essai-monde', `fiche-${PAYS.replace(/\W+/g, '')}${MOBILE ? '-tel' : ''}.png`);
const boite = await carte.boundingBox().catch(() => null);
await page.screenshot({ path: f, ...(boite ? { clip: { x: Math.max(0, boite.x - 10), y: Math.max(0, boite.y - 40), width: Math.min(boite.width + 20, MOBILE ? 390 : 800), height: Math.min(boite.height + 60, 700) } } : {}) });
console.log(`${PAYS}${MOBILE ? ' (telephone)' : ''} : ${n} formes sur la carte de la fiche ; texte « ${texte} » ; capture ${f}`);
console.log(erreurs.length ? 'ERREURS : ' + erreurs.join(' | ') : 'Aucune erreur.');
await navigateur.close();

// Sonde (2026-11-10) : la structure d'une case du Birdydex et ce qu'affiche une espèce sans nom français,
// pour écrire le tour des pays. Usage : node outils/verif/_sonde-birdydex.mjs [Pays]
import { chromium } from 'playwright';
const PAYS = process.argv[2] || 'Japon';
const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext({ viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
await page.goto('http://localhost:8765/demo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500); await page.keyboard.press('Escape');
await page.locator('text=Birdydex >> visible=true').first().click(); await page.waitForTimeout(1500);
const filtres = page.getByRole('button', { name: 'Filtres' }).first();
if (await filtres.isVisible()) { await filtres.click(); await page.waitForTimeout(600); }
await page.locator('.cp-btn-label:visible').filter({ hasText: /^France$/ }).first().click(); await page.waitForTimeout(700);
await page.locator('input.cp-search:visible').fill(PAYS); await page.waitForTimeout(600);
await page.locator('.cp-item:visible').filter({ hasText: PAYS }).first().click(); await page.waitForTimeout(4000);
await page.keyboard.press('Escape'); await page.waitForTimeout(500);
const r = await page.evaluate(() => {
  const cases = [...document.querySelectorAll('[data-sci]')].filter(e => e.offsetParent);
  const t = cases.find(e => e.dataset.sci === 'myophonus flavirostris' || e.dataset.sci === 'tringa inornata');
  return { n: cases.length, exemple: cases[0]?.outerHTML.slice(0, 700), sansNom: t ? t.innerText : '(pas visible)',
    entete: document.querySelector('.cp-btn-label')?.innerText,
    compteurs: [...document.querySelectorAll('h1,h2,h3,.pnl-title,.panel-title')].filter(e => e.offsetParent).map(e => e.innerText.slice(0, 80)).slice(0, 6) };
});
console.log(JSON.stringify(r, null, 1));
await navigateur.close();

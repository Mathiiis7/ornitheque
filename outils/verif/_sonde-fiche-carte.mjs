// Sonde (2026-11-10) : la carte « Où et quand » de la fiche, ouverte depuis le Birdydex d'un pays (première
// espèce), comme dans _tour-pays.mjs. Dit ce que contient #smRarityMap et capture la carte de rareté.
// Usage : node outils/verif/_sonde-fiche-carte.mjs "<Pays>"
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const PAYS = process.argv[2] || 'Libye';
const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext({ viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
await page.goto('http://localhost:8765/demo/', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500); await page.keyboard.press('Escape');
await page.locator('text=Birdydex >> visible=true').first().click(); await page.waitForTimeout(1500);
const filtres = page.getByRole('button', { name: 'Filtres' }).first();
if (await filtres.isVisible()) { await filtres.click(); await page.waitForTimeout(600); }
await page.locator('.cp-btn-label:visible').filter({ hasText: 'France' }).first().click(); await page.waitForTimeout(500);
await page.locator('input.cp-search:visible').fill(PAYS); await page.waitForTimeout(500);
await page.locator('.cp-item:visible').filter({ hasText: PAYS }).first().click(); await page.waitForTimeout(3000);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
const premiere = page.locator('.pkdx-card[data-sci]:visible').first();
console.log('premiere espece :', await premiere.getAttribute('data-sci'));
await premiere.click(); await page.waitForTimeout(4000);
const r = await page.evaluate(() => {
  const m = document.querySelector('#smRarityMap'), c = document.querySelector('#smRarityCard');
  return { carte: m ? { visible: !!m.offsetParent, html: m.innerHTML.length, debut: m.innerHTML.slice(0, 200) } : null,
    carteRarete: c ? { visible: !!c.offsetParent, hidden: c.hidden, texte: c.innerText.replace(/\s+/g, ' ').slice(0, 200) } : null };
});
console.log(JSON.stringify(r, null, 1));
const boite = await page.locator('#smRarityCard').boundingBox().catch(() => null);
const f = join(tmpdir(), 'essai-monde', `sonde-fiche-${PAYS.replace(/\W+/g, '')}.png`);
if (boite) { await page.locator('#smRarityCard').scrollIntoViewIfNeeded(); await page.waitForTimeout(500); }
await page.screenshot({ path: f }); console.log('capture', f);
await navigateur.close();

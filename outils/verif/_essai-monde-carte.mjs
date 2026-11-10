// Essai (2026-11-10) : un pays du monde sur la Carte de la démo locale. Dézoome au monde entier, clique
// le pays aux coordonnées données (pixels de la capture « 0-monde »), capture la carte et le panneau.
// Usage : node outils/verif/_essai-monde-carte.mjs <Pays> [x y] [--mobile]
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const [PAYS = 'Japon', X, Y] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const URL = 'http://localhost:8766/demo/';
const MOBILE = process.argv.includes('--mobile');
const DOSSIER = join(tmpdir(), 'essai-monde'); mkdirSync(DOSSIER, { recursive: true });
const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' }
  : { viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push('page : ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/xeno-canto|ERR_FAILED|CORS/.test(m.text())) erreurs.push('console : ' + m.text()); });
const suffixe = (PAYS + (MOBILE ? '-tel' : '')).replace(/\W+/g, '');
const capture = async nom => { const f = join(DOSSIER, `${suffixe}-${nom}.png`); await page.screenshot({ path: f }); console.log('capture', f); };
const attendre = ms => page.waitForTimeout(ms);

await page.goto(URL, { waitUntil: 'networkidle' });
await attendre(1500);
await page.keyboard.press('Escape');
await attendre(400);
await page.getByText('Carte', { exact: true }).first().click();
await attendre(1500);
await page.keyboard.press('Escape');
await attendre(500);
for (let i = 0; i < 4; i++) { await page.locator('.leaflet-control-zoom-out').click({ timeout: 2000 }).catch(() => {}); await attendre(400); }
await attendre(1500);
await capture('0-monde');
if (X && Y) {
  await page.mouse.click(+X, +Y);
  await attendre(4000);
  await capture('1-pays');
  const texte = await page.locator('body').innerText();
  console.log('Le panneau nomme le pays :', texte.includes(PAYS) ? 'oui' : 'NON');
}
console.log(erreurs.length ? 'ERREURS :\n' + erreurs.slice(0, 10).join('\n') : 'Aucune erreur en console.');
await navigateur.close();

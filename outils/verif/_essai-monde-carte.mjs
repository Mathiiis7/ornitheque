// Essai (2026-11-10) : un pays du monde sur la Carte de la démo locale. Dézoome au monde entier, clique
// le pays aux coordonnées données (pixels de la capture « 0-monde »), capture la carte et le panneau.
// Usage : node outils/verif/_essai-monde-carte.mjs <Pays> [x y] [--mobile]
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';

const [PAYS = 'Japon', X, Y] = process.argv.slice(2).filter(a => !a.startsWith('--') && !a.startsWith('ZOOM='));
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
// ZOOM=x,y,n : zoomer n crans à la molette sur ce point avant la capture.
const Z = (process.argv.find(a => a.startsWith('ZOOM=')) || '').slice(5).split(',').map(Number);
if (Z.length === 3) { await page.mouse.move(Z[0], Z[1]); for (let i = 0; i < Z[2]; i++) { await page.mouse.wheel(0, -120); await attendre(700); } await attendre(1500); }
await capture('0-monde');
// --chercher : survole chaque pays dessiné (calque ctPays) jusqu'à la bulle qui porte son nom, puis
// clique dessus. Pour les îles trop petites pour un clic au jugé.
if (process.argv.includes('--chercher')) {
  const boites = await page.evaluate(() => [...document.querySelectorAll('.leaflet-ctPays-pane path')]
    .map(p => { const b = p.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height }; })
    .filter(b => b.w > 0 && b.x > 40 && b.x < 900 && b.y > 300 && b.y < 830));
  let trouve = null;
  for (const b of boites) {
    await page.mouse.move(b.x, b.y); await attendre(60);
    const bulle = await page.locator('.leaflet-tooltip').allInnerTexts().catch(() => []);
    if (bulle.some(t => t.trim() === PAYS)) { trouve = b; break; }
  }
  console.log('Trouvé sur la carte :', trouve ? `oui (${Math.round(trouve.x)}, ${Math.round(trouve.y)})` : 'NON', '-', boites.length, 'pays visibles');
  if (trouve) {
    await page.mouse.click(trouve.x, trouve.y); await attendre(4000); await capture('1-pays');
    const texte = await page.locator('body').innerText();
    console.log('Le panneau nomme le pays :', texte.includes(PAYS) ? 'oui' : 'NON');
  }
}
if (X && Y) {
  await page.mouse.click(+X, +Y);
  await attendre(4000);
  await capture('1-pays');
  const texte = await page.locator('body').innerText();
  console.log('Le panneau nomme le pays :', texte.includes(PAYS) ? 'oui' : 'NON');
}
console.log(erreurs.length ? 'ERREURS :\n' + erreurs.slice(0, 10).join('\n') : 'Aucune erreur en console.');
await navigateur.close();

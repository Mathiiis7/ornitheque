// Essai (2026-11-10) : les zones d'un pays sur la Carte de la démo. Ouvre le pays (survol des pays jusqu'à la
// bulle qui porte son nom, puis clic), relève pour chaque zone dessinée son nom (bulle au survol), son centre à
// l'écran et sa taille, puis clique la zone demandée et lit le panneau. Sert à vérifier qu'une forme est à
// sa place (Napo à l'est de Tungurahua, Berbice oriental-Courantyne au sud-est du Guyana).
// Usage : node outils/verif/_essai-zones-carte.mjs "<Pays>" "<Zone à cliquer>" [--mobile]
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const [PAYS = 'Équateur', ZONE = 'Napo'] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const MOBILE = process.argv.includes('--mobile');
const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' }
  : { viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
const erreurs = []; page.on('pageerror', e => erreurs.push(e.message));
const attendre = ms => page.waitForTimeout(ms);
await page.goto('http://localhost:8765/demo/', { waitUntil: 'networkidle' });
await attendre(1500); await page.keyboard.press('Escape'); await attendre(400);
await page.getByText('Carte', { exact: true }).first().click(); await attendre(1500);
await page.keyboard.press('Escape'); await attendre(500);
for (let i = 0; i < 4; i++) { await page.locator('.leaflet-control-zoom-out').first().click({ timeout: 2000 }).catch(() => {}); await attendre(400); }
await attendre(1500);
// Trouver le pays : survol de chaque pays dessiné jusqu'à la bulle qui porte son nom.
// Plusieurs points par pays (entre le centre de sa boîte et six points de son contour) : un seul ratait les
// pays étroits comme l'Équateur.
const boites = await page.evaluate(() => [...document.querySelectorAll('.leaflet-ctPays-pane path')].flatMap(p => {
  const L = p.getTotalLength ? p.getTotalLength() : 0, m = p.getScreenCTM(), b = p.getBoundingClientRect();
  const c = { x: b.x + b.width / 2, y: b.y + b.height / 2 };
  if (!L || !m) return [c];
  return [c, ...[1, 2, 3, 4, 5, 6].map(k => { const q = p.getPointAtLength(L * k / 7).matrixTransform(m); return { x: (q.x * 2 + c.x) / 3, y: (q.y * 2 + c.y) / 3 }; })];
}).filter(b => b.x > 20 && b.y > 60));
let trouve = null;
for (const b of boites) {
  await page.mouse.move(b.x, b.y); await attendre(40);
  if ((await page.locator('.leaflet-tooltip').allInnerTexts().catch(() => [])).some(t => t.trim() === PAYS)) { trouve = b; break; }
}
if (!trouve) { console.log('Pays introuvable sur la carte'); await navigateur.close(); process.exit(1); }
await page.mouse.click(trouve.x, trouve.y); await attendre(5000);
// Les zones dessinées : nom au survol, centre et taille à l'écran.
const zones = await page.evaluate(() => [...document.querySelectorAll('.leaflet-ctDeps-pane path')].map(p => {
  const b = p.getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2, w: b.width, h: b.height };
}).filter(b => b.w > 2));
const lignes = [];
for (const z of zones) {
  await page.mouse.move(z.x, z.y); await attendre(80);
  const nom = ((await page.locator('.leaflet-tooltip').allInnerTexts().catch(() => [])).pop() || '?').trim();
  lignes.push({ nom, ...z });
}
for (const l of lignes.sort((a, b) => a.y - b.y)) console.log(`${l.nom.padEnd(36)} centre (${Math.round(l.x)}, ${Math.round(l.y)})  ${Math.round(l.w)}x${Math.round(l.h)} px`);
const cible = lignes.find(l => l.nom === ZONE);
if (cible) {
  await page.mouse.click(cible.x, cible.y); await attendre(3000);
  const f = join(tmpdir(), 'essai-monde', `zones-${PAYS.replace(/\W+/g, '')}${MOBILE ? '-tel' : ''}.png`);
  await page.screenshot({ path: f });
  const texte = (await page.locator('body').innerText()).replace(/\s+/g, ' ');
  console.log(`clic sur ${ZONE} : le panneau ${texte.includes(ZONE) ? 'nomme' : 'NE nomme PAS'} la zone ; capture ${f}`);
}
console.log(erreurs.length ? 'ERREURS : ' + erreurs.join(' | ') : 'Aucune erreur.');
await navigateur.close();

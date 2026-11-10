// Essai (2026-11-09) : les pays du monde dans la démo locale. Choisit un pays dans le Birdydex, ouvre
// la fiche d'une espèce et son sélecteur de pays, et prend une capture à chaque étape.
// Usage : node outils/verif/_essai-monde.mjs [URL] [Pays] ; captures dans le dossier temporaire.
import { chromium } from 'playwright';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const URL = process.argv.find(a => a.startsWith('http')) || 'http://localhost:8766/demo/';
const PAYS = process.argv.slice(2).find(a => !a.startsWith('http') && !a.startsWith('--')) || 'Japon';
const DOSSIER = join(tmpdir(), 'essai-monde');
const navigateur = await chromium.launch({ channel: 'chrome' });
const MOBILE = process.argv.includes('--mobile');
const ctx = await navigateur.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' } : { viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
const erreurs = [];
page.on('pageerror', e => erreurs.push('page : ' + e.message));
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') erreurs.push(m.type() + ' : ' + m.text()); });
const capture = async nom => { const f = join(DOSSIER, nom + '.png'); await page.screenshot({ path: f }); console.log('capture', f); };
const attendre = ms => page.waitForTimeout(ms);

await page.goto(URL, { waitUntil: 'networkidle' });
await attendre(1500);
await page.keyboard.press('Escape');
await attendre(500);
await page.getByRole('button', { name: 'Birdydex', exact: true }).first().click().catch(() => page.getByText('Birdydex', { exact: true }).first().click());
await attendre(1500);
await page.getByRole('button', { name: 'Filtres' }).first().click();
await attendre(800);
// Le bouton « Où » du Birdydex porte le nom du pays courant.
await page.locator('.cp-btn-label:visible').filter({ hasText: /^France$/ }).first().click();
await attendre(800);
await page.locator('input.cp-search').fill(PAYS);
await attendre(800);
await capture('1-selecteur-recherche');
await page.locator('.cp-item').filter({ hasText: PAYS }).first().click();
await attendre(3000);
await capture('2-birdydex-pays');
const compte = await page.locator('body').innerText().then(t => (t.match(/\d+\s+espèces vues sur \d+[^\n]*/) || [''])[0]);
console.log('Birdydex :', compte);
// Fiche de la première espèce affichée, puis son sélecteur de pays.
await page.keyboard.press('Escape');
await page.locator('[data-sci]:visible').first().click();
await attendre(2500);
await capture('3-fiche');
await page.locator('#smRarityCountrySel').click();
await attendre(2500);
await capture('4-fiche-selecteur-pays');
const lignes = await page.locator('.cp-item').allInnerTexts();
console.log('Selecteur de la fiche, lignes avec un nom de pays du monde :', lignes.filter(l => /Japon|Inde|Brésil|Chine|Turquie|Mayotte|Pérou/.test(l)).slice(0, 8).map(l => l.replace(/\s+/g, ' ')).join(' | '));
console.log(erreurs.length ? 'ERREURS :\n' + erreurs.slice(0, 15).join('\n') : 'Aucune erreur en console.');
await navigateur.close();

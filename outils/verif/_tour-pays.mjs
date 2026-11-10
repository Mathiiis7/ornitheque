// Tour (2026-11-10) : chaque pays du site dans la démo locale. Pour chacun : le Birdydex (nombre de cases,
// cases dont le nom n'est que le nom latin), puis la fiche de la première espèce (pays choisi dans son
// sélecteur, pourcentage, formes de sa carte « Où et quand », mot « France » égaré). Relève aussi les
// fichiers introuvables (HTTP >= 400) et les erreurs de la page, pays par pays.
// Usage : node outils/verif/_tour-pays.mjs [CC,CC,...] [--mobile]
//   -> %TEMP%/essai-monde/tour-pays.jsonl (une ligne par pays, écrite au fur et à mesure)
import { chromium } from 'playwright';
import { readFileSync, appendFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const app = readFileSync(new URL('../../app.js', import.meta.url), 'utf8');
const monde = JSON.parse(app.match(/^const PAYS_MONDE = (\{.*\});/m)[1]);
const pays = {};
for (const m of app.matchAll(/name: ["']([^"']+)["'], flagCode: '([A-Z]{2})'/g)) pays[m[2]] = m[1];
for (const [cc, v] of Object.entries(monde)) pays[cc] = v[0];
const filtre = (process.argv.slice(2).find(a => !a.startsWith('--')) || '').split(',').filter(Boolean);
const codes = Object.keys(pays).filter(cc => !filtre.length || filtre.includes(cc));
const MOBILE = process.argv.includes('--mobile');
const d = join(tmpdir(), 'essai-monde'); mkdirSync(d, { recursive: true });
const sortie = join(d, MOBILE ? 'tour-pays-tel.jsonl' : 'tour-pays.jsonl'); writeFileSync(sortie, '');

const navigateur = await chromium.launch({ channel: 'chrome' });
const ctx = await navigateur.newContext(MOBILE ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' }
  : { viewport: { width: 1300, height: 900 }, serviceWorkers: 'block' });
const page = await ctx.newPage();
let erreurs = [], manquants = [];
page.on('pageerror', e => erreurs.push(e.message.slice(0, 160)));
page.on('console', m => { if (m.type() === 'error' && !/xeno-canto|Failed to load resource/.test(m.text())) erreurs.push('console: ' + m.text().slice(0, 160)); });
page.on('response', r => { if (r.status() >= 400 && !/flagcdn|wikimedia|xeno|inaturalist|gstatic|google/.test(r.url())) manquants.push(r.status() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); });

// Ouvre le Birdydex de zéro ; rappelé après un accroc (une fenêtre restée ouverte bloquait tous les pays
// suivants au premier essai du 2026-11-10).
let courant = 'France';
async function ouvrirBirdydex(){
  await page.goto('http://localhost:8765/demo/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500); await page.keyboard.press('Escape');
  await page.locator('text=Birdydex >> visible=true').first().click(); await page.waitForTimeout(1500);
  const filtres = page.getByRole('button', { name: 'Filtres' }).first();
  if (await filtres.isVisible()) { await filtres.click(); await page.waitForTimeout(600); }
  courant = 'France';
}
async function unPays(cc, nom, res){
  await page.locator('.cp-btn-label:visible').filter({ hasText: courant }).first().click({ timeout: 5000 }); await page.waitForTimeout(500);
  await page.locator('input.cp-search:visible').fill(nom); await page.waitForTimeout(500);
  const items = page.locator('.cp-item:visible').filter({ hasText: nom });
  // Le nom exact d'abord : « Guinée » ne doit pas ouvrir « Guinée équatoriale ».
  const exact = items.filter({ has: page.locator(`text="${nom}"`) });
  await ((await exact.count()) ? exact.first() : items.first()).click({ timeout: 5000 });
  await page.waitForTimeout(3000); await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  courant = nom;
  Object.assign(res, await page.evaluate(() => {
    const cases = [...document.querySelectorAll('.pkdx-card[data-sci]')].filter(e => e.offsetParent);
    const latins = cases.filter(c => { const n = c.querySelector('.pkdx-name')?.textContent.trim().toLowerCase(), s = c.querySelector('.pkdx-sci')?.textContent.trim().toLowerCase(); return !n || n === s; });
    return { etiquette: document.querySelector('.cp-btn-label')?.innerText.trim(), cases: cases.length, sansNom: latins.map(c => c.dataset.sci).slice(0, 8), nbSansNom: latins.length };
  }));
  // La fiche de la première espèce.
  if (res.cases) {
    await page.locator('.pkdx-card[data-sci]:visible').first().click(); await page.waitForTimeout(3500);
    Object.assign(res, await page.evaluate(() => {
      const sel = document.querySelector('#smRarityCountrySel'), carte = document.querySelector('#smRarityMap'), carteRep = document.querySelector('#smRarityCard');
      const txt = carteRep ? carteRep.innerText.replace(/\s+/g, ' ') : '';
      return { ficheSel: sel ? sel.innerText.replace(/\s+/g, ' ').trim().slice(0, 60) : null,
        ficheFormes: carte ? carte.querySelectorAll('svg path').length : null,
        ficheFrance: /France/.test(txt), ficheTexte: txt.slice(0, 140) };
    }));
    await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  }
}

await ouvrirBirdydex();
const t0 = Date.now();
for (const [i, cc] of codes.entries()) {
  const nom = pays[cc];
  let res;
  for (let essai = 0; essai < 2; essai++) {
    erreurs = []; manquants = []; res = { cc, nom };
    if (essai) { res.reprise = true; await ouvrirBirdydex().catch(() => {}); }
    try { await unPays(cc, nom, res); break; }
    catch (e) { res.echec = e.message.split('\n')[0].slice(0, 160); await page.keyboard.press('Escape').catch(() => {}); }
  }
  res.erreurs = [...new Set(erreurs)]; res.manquants = [...new Set(manquants)];
  appendFileSync(sortie, JSON.stringify(res) + '\n');
  const alerte = res.echec || res.erreurs.length || res.manquants.length || res.nbSansNom || !res.cases || res.ficheFrance;
  console.log(`${String(i + 1).padStart(3)}/${codes.length} ${cc} ${nom.padEnd(28)} ${res.cases ?? '-'} cases${res.reprise ? ' (reprise)' : ''}${alerte ? '  <- A VOIR' : ''}  (${Math.round((Date.now() - t0) / 1000)} s)`);
}
await navigateur.close();
console.log('fini :', sortie);

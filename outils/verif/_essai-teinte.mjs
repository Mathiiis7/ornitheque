// Lancé à la main seulement : le tiret bas du nom le fait sauter par tous.mjs, qui importe (donc exécute)
// tous les autres fichiers du dossier. Essai de la teinte « aire estimée » dans la fiche espèce (2026-10-21), sur la démo servie par
// http://localhost:8765 (ou PORT=...). Pour chaque espèce : la teinte est-elle là quand elle doit l'être,
// SOUS la carte, avec sa légende et son crédit ; combien de temps pour la dessiner ; capture d'écran dans
// le dossier SORTIE. node outils/verif/_essai-teinte.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PORT = process.env.PORT || 8765;
const SORTIE = process.env.SORTIE || 'essai-teinte';
mkdirSync(SORTIE, { recursive: true });
const ESPECES = [
  ['Upupa epops', true, 'Huppe, France et Afrique'],
  ['Pycnonotus barbatus', true, 'bulbul, Sahara'],
  ['Phoebastria immutabilis', true, 'albatros, traverse 180 degrés'],
  ['Pica pica', false, 'aire refusée (80 %)'],
  ['Hirundo rustica', false, 'aire refusée (80 %)'],
  ['Melopsittacus undulatus', false, 'aire refusée (partout)'],
];
const navigateur = await chromium.launch({ channel: 'chrome', headless: true });
let ok = true;
for (const [mode, opts] of [['ordinateur', { viewport: { width: 1280, height: 900 } }],
  ['telephone', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, colorScheme: 'dark' }]]) {
  const ctx = await navigateur.newContext({ locale: 'fr-FR', serviceWorkers: 'block', ...opts });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  await page.goto(`http://localhost:${PORT}/demo/?sansguide`, { waitUntil: 'load' });
  await page.waitForTimeout(4000);
  for (const [sci, attendue, note] of (mode === 'ordinateur' ? ESPECES : ESPECES.slice(0, 2))) {
    const t0 = Date.now();
    await page.evaluate(s => { document.querySelector('.species-modal [data-close], .sm-close')?.click(); const e = document.createElement('span'); e.className = 'sp-link'; e.dataset.sci = s; document.body.appendChild(e); e.click(); e.remove(); }, sci);
    const attendues = attendue ? 2 : 1;
    try { await page.waitForFunction(n => document.querySelectorAll('#smRangeMap img.leaflet-image-layer').length >= n, attendues, { timeout: 20000 }); } catch (_) {}
    const ms = Date.now() - t0;
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('#smRangeMap img.leaflet-image-layer')];
      const z = el => +getComputedStyle(el.parentElement).zIndex || 0;
      const carte = imgs.find(i => !i.parentElement.classList.contains('leaflet-teinte-pane'));
      const teinte = imgs.find(i => i.parentElement.classList.contains('leaflet-teinte-pane'));
      const card = document.getElementById('smRangeCard');
      return { n: imgs.length, sous: teinte && carte ? z(teinte) < z(carte) : null, legende: /Aire estimée \(iNaturalist\)/.test(card.textContent), credit: /Geomodel/.test(card.textContent),
        taille: getComputedStyle([...card.querySelectorAll('div')].find(d => d.textContent.trim().startsWith('Rare'))).fontSize };
    });
    const bon = attendue ? r.n === 2 && r.sous && r.legende && r.credit : r.n === 1 && !r.legende && !r.credit;
    ok &&= bon;
    console.log(`${bon ? 'OK    ' : 'DÉFAUT'} ${mode.padEnd(10)} ${sci.padEnd(24)} ${note.padEnd(30)} couches ${r.n}, teinte sous la carte ${r.sous}, légende ${r.legende}, crédit ${r.credit}, texte ${r.taille}, ${ms} ms`);
    await page.locator('#smRangeCard').screenshot({ path: join(SORTIE, `${mode}-${sci.replace(' ', '-')}.png`) });
  }
  if (erreurs.length) { ok = false; console.log('erreurs de page :', erreurs.join(' | ')); }
  await ctx.close();
}
await navigateur.close();
console.log(ok ? 'CONFORME' : 'DÉFAUT');

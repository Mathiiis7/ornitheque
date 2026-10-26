// Lancé à la main seulement : le tiret bas du nom le fait sauter par tous.mjs, qui importe (donc exécute)
// tous les autres fichiers du dossier. Essai de l'animation de migration SEMAINE PAR SEMAINE (2026-10-27), sur
// le site servi par http://localhost:8765 (ou PORT=...) : carte et gris posés, libellé de la semaine, curseur,
// lecture, cartes de présence à 12 mois, plus grande pile (Labbe à longue queue, 44,7 millions de pixels).
// Captures dans SORTIE. node outils/verif/_essai-migration-semaine.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PORT = process.env.PORT || 8765;
const SORTIE = process.env.SORTIE || 'essai-migration';
mkdirSync(SORTIE, { recursive: true });
const ESPECES = ['Hirundo rustica', 'Grus grus', 'Ciconia ciconia', 'Stercorarius longicaudus', 'Acridotheres cinereus'];
const navigateur = await chromium.launch({ channel: 'chrome', headless: true });
let ok = true;
for (const [mode, opts] of [['ordinateur', { viewport: { width: 1440, height: 900 } }],
  ['telephone', { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const ctx = await navigateur.newContext({ locale: 'fr-FR', serviceWorkers: 'block', ...opts });
  const page = await ctx.newPage();
  const erreurs = [];
  page.on('pageerror', e => erreurs.push(e.message));
  page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
  await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load' });
  await page.waitForTimeout(3000);
  for (const sci of (mode === 'ordinateur' ? ESPECES : ESPECES.slice(0, 2))) {
    const t0 = Date.now();
    await page.evaluate(s => { document.getElementById('migFsClose')?.click(); const b = document.createElement('button'); b.className = 'mig-fs-btn'; b.dataset.sci = s; document.body.appendChild(b); b.click(); b.remove(); }, sci);
    let couches = 0;
    try { await page.waitForFunction(() => document.querySelectorAll('#migFsMapEl img.leaflet-image-layer').length >= 2, null, { timeout: 30000 }); } catch (_) {}
    const ms = Date.now() - t0;
    const lire = () => page.evaluate(() => ({
      couches: document.querySelectorAll('#migFsMapEl img.leaflet-image-layer').length,
      srcs: [...document.querySelectorAll('#migFsMapEl img.leaflet-image-layer')].map(i => i.src).join(' '),
      libelle: document.getElementById('migFsLabel').textContent,
      note: document.getElementById('migFsContent').textContent,
      debordement: document.documentElement.scrollWidth > innerWidth,
      // en pixels d'ECRAN (getBoundingClientRect, body en zoom 0,85)
      curseur: Math.round(document.getElementById('migFsSlider').getBoundingClientRect().width),
    }));
    const r0 = await lire();
    couches = r0.couches;
    await page.screenshot({ path: join(SORTIE, `${mode}-${sci.replace(' ', '-')}-s0.png`) });
    // semaine 20 au curseur
    await page.evaluate(() => { const s = document.getElementById('migFsSlider'); s.value = '20'; s.dispatchEvent(new Event('input')); });
    await page.waitForTimeout(2500);
    const r20 = await lire();
    await page.screenshot({ path: join(SORTIE, `${mode}-${sci.replace(' ', '-')}-s20.png`) });
    // lecture 2 s
    await page.click('#migFsPlayBtn');
    await page.waitForTimeout(2000);
    await page.click('#migFsPlayBtn');
    const valeur = await page.evaluate(() => +document.getElementById('migFsSlider').value);
    // courbe iNaturalist (en direct : un échec du réseau se dit, il ne compte pas comme un défaut de l'appli)
    try { await page.waitForFunction(() => document.querySelector('#migFsCourbe path') || /ne répond pas|ne connaît pas/.test(document.getElementById('migFsCourbe').textContent), null, { timeout: 20000 }); } catch (_) {}
    const courbe = await page.evaluate(() => { const p = document.querySelector('#migFsCourbe path'); return p ? `${(p.getAttribute('d').match(/[ML]/g) || []).length} points` : document.getElementById('migFsCourbe').textContent.slice(0, 80); });
    const bande = await page.evaluate(() => document.querySelector('#migFsGraphe rect')?.getAttribute('x'));
    const bon = couches >= 1 && r20.srcs !== r0.srcs && r20.libelle === '21-27 mai' && valeur > 22 && !r0.debordement && r0.curseur >= (mode === 'telephone' ? 250 : 800);
    ok &&= bon;
    console.log(`${bon ? 'OK    ' : 'DÉFAUT'} ${mode.padEnd(10)} ${sci.padEnd(26)} couches ${couches} en ${ms} ms, « ${r0.libelle} » -> « ${r20.libelle} », lecture jusqu'à ${valeur}, curseur ${r0.curseur} px, débordement ${r0.debordement}, courbe : ${courbe}, bande x=${bande}${/mois par mois/.test(r0.note) ? ', note 12 mois' : ''}`);
  }
  // Fluidité au téléphone : processeur ralenti 4 fois, lecture 6 s sur une espèce mondiale qu'on rouvre
  // (rien en mémoire) ; on compte les images de fréquence réellement posées.
  if (mode === 'telephone') {
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.evaluate(() => { document.getElementById('migFsClose')?.click(); const b = document.createElement('button'); b.className = 'mig-fs-btn'; b.dataset.sci = 'Acanthis flammea'; document.body.appendChild(b); b.click(); b.remove(); });
    await page.waitForFunction(() => document.querySelectorAll('#migFsMapEl img.leaflet-image-layer').length >= 2, null, { timeout: 60000 });
    await page.evaluate(() => { window.__vues = new Set(); const img = [...document.querySelectorAll('#migFsMapEl img.leaflet-image-layer')].pop(); new MutationObserver(() => window.__vues.add(img.src)).observe(img, { attributes: true, attributeFilter: ['src'] }); });
    await page.click('#migFsPlayBtn');
    await page.waitForTimeout(6000);
    await page.click('#migFsPlayBtn');
    const { vues, semaine } = await page.evaluate(() => ({ vues: window.__vues.size, semaine: +document.getElementById('migFsSlider').value }));
    const fluide = vues >= semaine * 0.6;
    ok &&= fluide;
    console.log(`${fluide ? 'OK    ' : 'DÉFAUT'} telephone  processeur /4, Sizerin flammé : ${vues} images posées pour ${semaine} semaines lues en 6 s`);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
  if (erreurs.length) { ok = false; console.log('erreurs', mode, erreurs); }
  await ctx.close();
}
await navigateur.close();
console.log(ok ? 'CONFORME' : 'DÉFAUT');

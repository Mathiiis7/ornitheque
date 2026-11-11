// Pays sans rarete (2026-11-11, PAYS_SANS_RARETE) : la Libye dans le selecteur de la fiche (« trop peu de listes »),
// sa carte hachuree sans palier et sans graphique, la phrase de la carte Rarete, la Libye hachuree sur la carte de
// l'Afrique, et son Birdydex sans palier. Le Mali (150 listes, garde pour le Combassou barka) n'est pas touche.
// Ordinateur et telephone ; captures dans notes-privees/essai-birdydex-continent/.
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const D = 'notes-privees/essai-birdydex-continent/';
const nav = await chromium.launch();
let ok = true;
const dire = (bon, ...m) => { if(!bon) ok = false; console.log(bon ? 'OK    ' : 'DEFAUT', ...m); };
for(const ecran of ['ordi', 'tel']){
  const ctx = await nav.newContext({ serviceWorkers: 'block', ...(ecran === 'tel' ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1280, height: 900 } }) });
  const p = await ctx.newPage();
  const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
  await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
  await p.waitForTimeout(1200);
  // Fiche du Canard colvert, selecteur.
  await p.waitForFunction(() => document.querySelector('#pkdxGrid .pkdx-card[data-sci="anas platyrhynchos"]'), null, { timeout: 20000 });
  await p.evaluate(() => document.querySelector('#pkdxGrid .pkdx-card[data-sci="anas platyrhynchos"]').click());
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
  await p.waitForTimeout(2000);
  const lignes = await p.evaluate(() => ['LY', 'ML'].map(cc => document.querySelector(`.cp-item[data-cc="${cc}"]`)?.textContent.replace(/\s+/g, ' ').trim()));
  dire(/trop peu de listes/.test(lignes[0]) && !/trop peu/.test(lignes[1]), `[${ecran}] selecteur : Libye « ${lignes[0]} » | Mali « ${lignes[1]} »`);
  await p.locator('input.cp-search').first().fill('Li');
  await p.waitForTimeout(500);
  await p.locator('.cp-modal-inner').first().screenshot({ path: `${D}sans-${ecran}-selecteur.png` });
  await p.evaluate(() => document.querySelector('.cp-item[data-cc="LY"]').click());
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelector('.cp-modal-close')?.click());
  await p.waitForTimeout(1500);
  const f = await p.evaluate(() => {
    const svg = document.querySelector('#smRarityMap svg[role="img"]');
    const zones = svg ? [...svg.querySelectorAll('path')].map(x => x.getAttribute('fill') || '') : [];
    return { message: document.getElementById('smRarityLine')?.textContent.trim() || '', zones: zones.length,
      hachees: zones.filter(x => x.startsWith('url(')).length,
      mois: [...document.querySelectorAll('#smRarityMapMois [data-mois]')].map(b => b.textContent.trim().slice(-1)).join(''),
      graph: !document.getElementById('smGraphZone')?.hidden, entete: document.getElementById('smOqZone')?.textContent.trim() };
  });
  dire(/Trop peu de listes eBird en Libye \(93 depuis 2019\)/.test(f.message) && f.zones > 0 && f.hachees === f.zones && /^–+$/.test(f.mois) && !f.graph,
    `[${ecran}] fiche Libye :`, JSON.stringify(f));
  await p.evaluate(() => document.querySelector('#speciesModal .sm-oq-bloc')?.scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${D}sans-${ecran}-fiche.png` });
  // Carte de l'Afrique : la Libye hachuree.
  await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
  await p.waitForTimeout(1500);
  await p.evaluate(() => document.querySelector('.cp-group-title[data-cont="Afrique"]').click());
  await p.waitForTimeout(400);
  await p.evaluate(() => document.querySelector('.cp-modal-close')?.click());
  await p.waitForTimeout(3000);
  const af = await p.evaluate(() => [...document.querySelectorAll('#smContinentMap path')].filter(x => /Libye/.test(x.querySelector('title')?.textContent || x.getAttribute('aria-label') || x.dataset.tip || ''))
    .map(x => (x.getAttribute('fill') || '') + ' | ' + (x.querySelector('title')?.textContent || x.getAttribute('aria-label') || x.dataset.tip || '')));
  dire(af.length && af.every(x => x.startsWith('url(') && /trop peu de listes/.test(x)), `[${ecran}] Afrique, Libye :`, JSON.stringify(af.slice(0, 2)));
  await p.screenshot({ path: `${D}sans-${ecran}-afrique.png` });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(600);
  // Birdydex de la Libye.
  await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
  await p.waitForTimeout(800);
  await p.evaluate(() => document.getElementById('pkdxCountry').click());
  await p.waitForTimeout(1200);
  await p.evaluate(() => document.querySelector('.cp-item[data-cc="LY"]').click());
  await p.waitForTimeout(3000);
  await p.evaluate(() => document.querySelector('.cp-modal-close')?.click());
  await p.waitForTimeout(2000);
  const b = await p.evaluate(() => ({ note: document.querySelector('#pkdxGrid .pkdx-note-sans-rarete')?.textContent.trim() || '',
    cases: document.querySelectorAll('#pkdxGrid .pkdx-card').length,
    paliers: [...new Set([...document.querySelectorAll('#pkdxGrid .pkdx-tier')].map(x => x.textContent.trim()))].join(' '),
    pastilles: document.querySelectorAll('#pkdxTierChips [data-tier]').length }));
  dire(/Trop peu de listes/.test(b.note) && b.cases > 50 && b.paliers === '–' && b.pastilles === 0, `[${ecran}] Birdydex Libye :`, JSON.stringify(b));
  await p.screenshot({ path: `${D}sans-${ecran}-birdydex.png` });
  dire(!erreurs.length, `[${ecran}] erreurs :`, erreurs.join(' | ') || 'aucune');
  await ctx.close();
}
console.log(ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();

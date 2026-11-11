// Pays peu observes (2026-11-11) : le repere a cote du nom dans le selecteur du Birdydex et dans celui de la fiche,
// et la phrase sous la carte de la fiche quand on choisit la Libye (93 listes). Ordinateur et telephone ; captures
// dans notes-privees/essai-birdydex-continent/.
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
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
  // Birdydex : le selecteur, cherche « Libye ».
  await p.evaluate(() => document.getElementById('pkdxCountry').click());
  await p.waitForTimeout(1200);
  await p.locator('input.cp-search').first().fill('Lib');
  await p.waitForTimeout(500);
  const b = await p.evaluate(() => [...document.querySelectorAll('.cp-item')].map(i => ({ nom: i.querySelector('.cp-item-name')?.textContent.trim(), peu: i.querySelector('.cp-peu')?.dataset.tip || '' })));
  const ly = b.find(x => /Libye/.test(x.nom || '')), lb = b.find(x => /Liban/.test(x.nom || ''));
  dire(ly && /93 listes/.test(ly.peu) && lb && !lb.peu, `[${ecran}] Birdydex, selecteur :`, JSON.stringify(b));
  await p.locator('.cp-modal-inner').first().screenshot({ path: `notes-privees/essai-birdydex-continent/peu-${ecran}-selecteur.png` });
  await p.evaluate(() => document.querySelector('.cp-modal-close').click());
  await p.waitForTimeout(400);
  // Fiche d'une espece, puis la Libye dans son selecteur.
  await p.evaluate(() => document.querySelector('#pkdxGrid .pkdx-card[data-sci="upupa epops"], #pkdxGrid .pkdx-card')?.click());
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.getElementById('smRarityCountrySel').click());
  await p.waitForTimeout(1500);
  const f = await p.evaluate(() => document.querySelector('.cp-item[data-cc="LY"] .cp-peu')?.dataset.tip || '');
  await p.evaluate(() => document.querySelector('.cp-item[data-cc="LY"]').click());
  await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelector('.cp-modal-close')?.click());
  await p.waitForTimeout(1500);
  const note = await p.evaluate(() => document.querySelector('#smOuQuandLegende .sm-oq-fragile')?.textContent.trim() || '');
  dire(/93 listes/.test(f) && /Seulement 93 listes eBird en Libye depuis 2019/.test(note), `[${ecran}] fiche : selecteur « ${f} » | note « ${note} »`);
  await p.evaluate(() => document.querySelector('#speciesModal .sm-oq-bloc')?.scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(400);
  await p.screenshot({ path: `notes-privees/essai-birdydex-continent/peu-${ecran}-fiche.png` });
  dire(!erreurs.length, `[${ecran}] erreurs :`, erreurs.join(' | ') || 'aucune');
  await ctx.close();
}
console.log(ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();

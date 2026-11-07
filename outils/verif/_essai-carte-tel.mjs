// Essai ponctuel (2026-11-07) : Carte au téléphone, le panneau SOUS la carte (plus de tiroir), et les ronds
// de rareté moyens avec leur zone de toucher élargie. Vrais touchers. node outils/verif/_essai-carte-tel.mjs [largeur]
import { chromium } from 'playwright';
const DOS = process.env.DOS || 'C:/Users/mathi/AppData/Local/Temp/claude/ce1f935b4263329c/73f9877c-7c1c-4304-af22-0f97053bf457/scratchpad';
const L = +(process.argv[2] || 375);
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:L, height:812 }, isMobile:true, hasTouch:true, deviceScaleFactor:2, locale:'fr-FR', serviceWorkers:'block' });
const p = await ctx.newPage();
const erreurs = []; p.on('pageerror', e => erreurs.push(e.message));
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(2000);
await p.keyboard.press('Escape'); await p.keyboard.press('Escape');
await p.evaluate(() => document.querySelector('.tab[data-view="map"]').click());
await p.waitForTimeout(2500);
const centre = sel => p.evaluate(sel => { const e = document.querySelector(sel); e.scrollIntoView({ block:'center' }); const b = e.getBoundingClientRect(); return { x:b.left + b.width / 2, y:b.top + b.height / 2 }; }, sel);
const touche = async sel => { const r = await centre(sel); await p.waitForTimeout(200); await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(1200); };
// 1. Disposition : le panneau sous la carte, sans la chevaucher.
const dispo = () => p.evaluate(() => {
  const c = document.getElementById('ctCarte').getBoundingClientRect(), z = document.getElementById('ctZone').getBoundingClientRect();
  return { panneauDansLaCarte:!!document.getElementById('ctCarte').contains(document.getElementById('ctZone')), carteH:Math.round(c.height), ecart:Math.round(z.top - c.bottom),
    chevauche:z.top < c.bottom - 1, pageDeborde:document.documentElement.scrollWidth > innerWidth, contenuDefileSeul:getComputedStyle(document.getElementById('ctContenu')).overflowY };
});
console.log('ARRIVÉE', JSON.stringify(await dispo()));
await touche('#ctCouches [data-couche="ligue"]');
await touche('#ctOnglets [data-onglet="ligue"]');
await touche('#ctPliLigue > summary');
console.log('LIGUE + Filtres', JSON.stringify(await dispo()), 'ouvert', await p.evaluate(() => document.getElementById('ctPliLigue').open));
await p.evaluate(() => document.getElementById('ctZone').scrollIntoView({ block:'start' })); await p.waitForTimeout(300);
await p.screenshot({ path:`${DOS}/tel-panneau-ligue-${L}.png` });
// 2. Les ronds de rareté : taille à l'œil, zone de toucher, écart, rangées.
const ronds = await p.evaluate(() => {
  const ch = [...document.querySelectorAll('#ctLigRarChips .rar-chip[data-rar], #ctLigRarChips .rar-chip[data-cat]')].filter(e => e.offsetWidth);
  const r = ch.map(e => e.getBoundingClientRect());
  return { nb:ch.length, oeil:[...new Set(r.map(b => Math.round(b.width)))], rangees:new Set(r.map(b => Math.round(b.top))).size,
    ecarts:[...new Set(r.slice(1).map((b, i) => Math.round(b.left - r[i].right)).filter(x => x > 0))] };
});
console.log('RONDS', JSON.stringify(ronds));
// Toucher à 7 px d'écran du bord d'un rond (dans sa zone invisible) le coche ou le décoche.
const hors = await p.evaluate(() => {
  const e = document.querySelector('#ctLigRarChips .rar-chip[data-rar="5"]'); e.scrollIntoView({ block:'center' });
  const b = e.getBoundingClientRect(); return { x:b.right + 7, y:b.top + b.height / 2, avant:e.classList.contains('on') };
});
await p.waitForTimeout(200);
await p.touchscreen.tap(hors.x, hors.y); await p.waitForTimeout(800);
console.log('toucher à 7 px du bord du 5 :', hors.avant, '→', await p.evaluate(() => document.querySelector('#ctLigRarChips .rar-chip[data-rar="5"]').classList.contains('on')));
await p.screenshot({ path:`${DOS}/tel-ronds-${L}.png` });
// 3. Une observation de la liste ramène la carte à l'écran.
// La France choisie dans « Où » : la liste de la Ligue se remplit.
await p.evaluate(() => document.getElementById('ctLigPaysBtn').click()); await p.waitForTimeout(800);
await p.evaluate(() => document.querySelector('.cp-modal-backdrop .cp-item[data-cc="FR"]')?.click()); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('.cp-modal-backdrop')?.click()); await p.waitForTimeout(800);
await p.evaluate(() => { const s = document.getElementById('mapEbRegion'); s.value = 'FR-PDL'; s.dispatchEvent(new Event('change', { bubbles:true })); });
await p.waitForTimeout(2500);
await p.evaluate(() => document.getElementById('ctPliLigue').open = false);
console.log('zone', await p.evaluate(() => document.getElementById('ctZoneNom').textContent), 'lignes', await p.evaluate(() => document.querySelectorAll('#ctContenu .ct-rang-n[data-sci]').length));
const fl = await p.$('#ctContenu .ct-rang-n[data-sci]');
if(fl){ await touche('#ctContenu .ct-rang-n[data-sci]');
  const obs = await p.$('#ctContenu .ct-obs[data-pt]');
  if(obs){ await touche('#ctContenu .ct-obs[data-pt]');
    console.log('après une observation, carte à l\'écran :', await p.evaluate(() => { const c = document.getElementById('ctCarte').getBoundingClientRect(); return c.bottom <= innerHeight + 1 && c.bottom > innerHeight / 2; })); }
  else console.log('pas d\'observation dépliée'); }
await p.screenshot({ path:`${DOS}/tel-apres-obs-${L}.png` });
// 4. Birdydex : les mêmes ronds.
await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"], .tab[data-view="birdydex"]')?.click()); await p.waitForTimeout(1500);
await p.evaluate(() => document.getElementById('pkdxPliBtn')?.click()); await p.waitForTimeout(600);
console.log('BIRDYDEX', JSON.stringify(await p.evaluate(() => { const ch = [...document.querySelectorAll('.pkdx-bloc .rar-chip[data-rar], .pkdx-bloc .rar-chip[data-tier], .pkdx-bloc .rar-chip[data-cat]')].filter(e => e.offsetWidth);
  return { nb:ch.length, oeil:[...new Set(ch.map(e => Math.round(e.getBoundingClientRect().width)))], pageDeborde:document.documentElement.scrollWidth > innerWidth }; })));
await p.evaluate(() => document.querySelector('.pkdx-bloc .rar-chip')?.scrollIntoView({ block:'center' })); await p.waitForTimeout(300);
await p.screenshot({ path:`${DOS}/tel-birdydex-${L}.png` });
console.log('erreurs :', erreurs.length ? erreurs : 'aucune');
await nav.close();

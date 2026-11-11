// Deux cas limites de la grille en blocs (2026-11-11) : apres un changement de largeur, aucune rangee incomplete au
// milieu de la grille (tri par rarete, coupee sur des rangees pleines) ; et l'ombre d'une case survolee au bord
// d'un bloc n'est pas rognee (capture dans notes-privees/essai-birdydex-continent/).
import { chromium } from 'playwright';
const port = process.argv[2] || '8765';
const nav = await chromium.launch();
const ctx = await nav.newContext({ serviceWorkers: 'block', viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage();
await p.goto(`http://localhost:${port}/demo/`, { waitUntil: 'load' });
await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => document.querySelector('.tab[data-view="pokedex"]')?.click());
await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('[data-pkdx-sort="rarete"]')?.click());
await p.waitForTimeout(1000);
const rangs = () => p.evaluate(() => {
  const tr = [...document.querySelectorAll('#pkdxGrid .pkdx-tranche')];
  const cols = getComputedStyle(tr[0]).gridTemplateColumns.split(' ').length;
  return { cols, blocs: tr.map(t => t.querySelectorAll('.pkdx-card').length), incompletes: tr.slice(0, -1).filter(t => t.querySelectorAll('.pkdx-card').length % cols).length };
});
let ok = true;
for(const l of [1280, 900, 1500]){
  await p.setViewportSize({ width: l, height: 900 });
  await p.waitForTimeout(1200);
  const r = await rangs();
  if(r.incompletes) ok = false;
  console.log(r.incompletes ? 'DEFAUT' : 'OK    ', 'largeur', l, JSON.stringify(r));
}
// Survol de la premiere case du second bloc, a gauche : son ombre deborde du bloc.
await p.setViewportSize({ width: 1280, height: 900 });
await p.waitForTimeout(1000);
const c = p.locator('#pkdxGrid .pkdx-tranche:nth-child(2) .pkdx-card').first();
await c.scrollIntoViewIfNeeded();
await p.waitForTimeout(400);
await c.hover();
await p.waitForTimeout(400);
const b = await c.boundingBox();
await p.screenshot({ path: 'notes-privees/essai-birdydex-continent/ombre-bord.png', clip: { x: Math.max(0, b.x - 40), y: Math.max(0, b.y - 40), width: b.width + 80, height: b.height + 80 } });
console.log(ok ? 'CONFORME' : 'DÉFAUT');
await nav.close();

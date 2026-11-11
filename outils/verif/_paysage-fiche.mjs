// La fiche espèce au téléphone couché (844 x 390, au doigt) : largeur, hauteur de l'entête et des onglets,
// place qui reste pour lire. Capture dans notes-privees/chantier-telephone/paysage/fiche-844.png.
import { chromium } from 'playwright';
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport:{ width:844, height:390 }, isMobile:true, hasTouch:true, locale:'fr-FR' });
await ctx.addInitScript(() => { try{ localStorage.setItem('mb-theme', 'light'); }catch(_){} });
const p = await ctx.newPage();
await p.goto('http://localhost:8765/demo/', { waitUntil:'load' });
await p.waitForTimeout(3000);
await p.evaluate(() => document.querySelector('#guide .ml-dialog-close')?.click());
await p.evaluate(() => document.querySelector('#barreBas [data-view="pokedex"]').click());
await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('#pkdxGrid .pkdx-card[data-sci]').click());
await p.waitForTimeout(2500);
const m = await p.evaluate(() => {
  const r = s => { const e = document.querySelector('#speciesModal ' + s); return e ? Math.round(e.getBoundingClientRect().height) : null; };
  const box = document.querySelector('#speciesModal .sm-box').getBoundingClientRect();
  return { coarse: matchMedia('(pointer: coarse)').matches, largeur: Math.round(box.width), gauche: Math.round(box.left),
    entete: r('.sm-header'), onglets: r('.sm-tabs'), lecture: r('.sm-scroll'), ecran: innerHeight };
});
console.log(JSON.stringify(m));
await p.screenshot({ path:'notes-privees/chantier-telephone/paysage/fiche-844.png' });
await nav.close();
